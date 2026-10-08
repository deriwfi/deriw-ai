# User contract workflows

Use [networks.json](networks.json) for addresses and `assets/<Contract>.json` for exact signatures, including tuple components. All commands run from the skill folder. `--send` broadcasts; omitting it prints a transaction plan. Amounts in convenience commands are human decimal strings; JSON arguments to `contract-call.js` are raw on-chain units, with large integers quoted as strings.

## Public reads

```bash
node scripts/contract-call.js PriceOracle getMaxMinPriceWithTime '["0xTOKEN"]'
node scripts/contract-call.js Vault getPosition '["0xUSER","0xUSDT","0xINDEX_TOKEN",true]'
node scripts/query-position.js 0xUSER 0xINDEX_TOKEN true
node scripts/token-state.js 0xUSER [0xTOKEN] [0xSPENDER]
node scripts/contract-call.js IERC20 decimals '[]' --at 0xTOKEN
node scripts/contract-call.js PoolDataV2 getUserInfo '["0xUSER","0xPOOL","1"]'
node scripts/contract-call.js MemeData getMemeUserInfo '["0xPOOL","0xUSER"]'
```

`token-state.js` reads native balance, token decimals/balance, and optionally allowance; its default token is the selected USDT. `contract-call.js` accepts view/pure methods on configured, nondeprecated contracts. For a token or dynamically discovered pool, use its bundled ABI name with `--at 0xADDRESS`; address overrides are permitted for reads only. The RPC must have the selected chain ID and the target must have bytecode. A full ABI can also describe methods absent from a particular deployed version: a reverting read must be reported, never replaced with an assumed value.

Core `PriceOracle.getMaxMinPriceWithTime(token)` returns max/ask, min/bid and update time. Prices use 30 decimals. `getPrice(token)` returns a tuple (index token, ask, bid, mid), not a single scalar. Stored volatile-token prices do not expire automatically on read; market scripts check their age against the latest block (60 seconds by default, configurable with `DERIW_MAX_PRICE_AGE_SECONDS`). Stablecoin USDT is fixed at 1e30 with timestamp 0. Do not use it as an index token for a market order.

`Vault.getPosition` returns size, collateral, averagePrice, a reserved funding-rate field (currently zero), reserveAmount, realisedPnl magnitude, hasRealisedProfit, lastIncreasedTime. Size/collateral/price use 30 decimals. API `/client/vault/position_tokens?account=...` discovers actual open-position tokens, including room mappings.

## Token approvals

The spender is the contract executing `transferFrom`, which can differ from the called contract.

| Operation | User entrypoint | ERC-20 spender |
|---|---|---|
| Market open | PositionRouter | Router |
| Limit open | OrderBook | Router |
| Fund deposit | FundRouterV2 | PoolDataV2 |
| Meme deposit | MemeRouter | MemeData |
| Room create/reopen/add funds | MemeFactory | MemeData |
| Edge Hour ticket | ChallengeManager | ChallengeManager |
| Edge Hour LP deposit | LPVault | LPVault |
| L2 deposit / L3 withdrawal | Respective user bridge router | That same router |

Convenience scripts read the allowance, reset nonzero insufficient allowance to zero if necessary, then approve the exact amount. They verify token balance and simulate sends. They do not grant unlimited approvals. Approval success alone does not prove the business transaction will succeed.

## Market requests

```bash
node scripts/create-market-open.js <indexToken> <marginUSDT> <sizeUSD> <true|false> [referralBytes32] [--send]
node scripts/create-market-close.js <indexToken> <sizeUSD> <true|false> [collateralToWithdrawUSD] [--send]
```

Set `DERIW_SLIPPAGE_BPS` explicitly: 100 bps is 1%. A preview of market close needs `DERIW_ACCOUNT`; a send uses the local signer's address as receiver. The optional close collateral delta defaults to 0; full close uses the actual current position size. Both entries require exact booleans.

For an existing position, a market increase with size 0 can add margin; a market decrease with size 0 and positive collateral delta requests collateral withdrawal. Both deltas cannot be zero. Eligibility and leverage remain subject to contract simulation.

| Request | Reference quote | Acceptable bound |
|---|---|---|
| Long increase | Ask/max | quote × (1 + tolerance) |
| Short increase | Bid/min | quote × (1 − tolerance) |
| Long decrease | Bid/min | quote × (1 − tolerance) |
| Short decrease | Ask/max | quote × (1 + tolerance) |

Methods (argument order):

- `createIncreasePosition(path,indexToken,amountIn,sizeDelta,isLong,acceptablePrice,referralCode,callbackTarget)`
- `createDecreasePosition(path,indexToken,collateralDelta,sizeDelta,isLong,receiver,acceptablePrice,callbackTarget)`

Use `[USDT]` as path, 6 decimals for amountIn, 30 for size/collateral/acceptable price, zero callback, and zero referral hash if absent. Creation transfers/locks collateral and creates a request; it does not immediately establish the resulting position.

The script performs one client status check after creation. For later checks use `POST /client/position_router/tx_status` with `{address,tx_hash,type}` (`type=0` increase, `1` decrease), then re-read the position. Missing indexing is pending/unknown. Cancellation uses the request **bytes32 key** from receipt events:

```bash
node scripts/contract-call.js PositionRouter cancelIncreasePosition '["0xREQUEST_KEY"]' [--send]
node scripts/contract-call.js PositionRouter cancelDecreasePosition '["0xREQUEST_KEY"]' [--send]
```

Cancellation is for the caller's request and may be subject to contract delay. Never call `execute*` or impersonate a keeper.

## Limit orders and TP/SL

```bash
node scripts/create-limit-open.js <token> <marginUSDT> <sizeUSD> <true|false> <triggerUSD> <triggerAbove> [--send]
node scripts/create-limit-close.js <token> <sizeUSD> <true|false> <triggerUSD> <triggerAbove> [collateralUSD] [--send]
```

`triggerAbove=true` means strictly above the trigger; false means strictly below. For a long close, above is take-profit and below stop-loss; reverse these for a short close. Contracts may reject a trigger inconsistent with the current price/position.

`createIncreaseOrder(path,amountIn,indexToken,sizeDelta,collateralToken,isLong,triggerPrice,triggerAboveThreshold,lever)` uses 6-decimal margin, 30-decimal size/trigger, and leverage scaled by 10000. The helper calculates leverage with integers. `createDecreaseOrder(indexToken,sizeDelta,collateralToken,collateralDelta,isLong,triggerPrice,triggerAboveThreshold,lever)` uses 30-decimal amounts and `lever=10000` for its close convention.

Order indices are distinct from request keys. Fetch `/client/order/indices?address=...` and verify chain data before cancellation:

```bash
node scripts/contract-call.js OrderBook cancelIncreaseOrder '["0"]' [--send]
node scripts/contract-call.js OrderBook cancelDecreaseOrder '["0"]' [--send]
node scripts/contract-call.js OrderBook cancelMultiple '[["0"],["1"]]' [--send]
```

`batchCreateDecreaseOrder(tuple[])` is supported with the same decrease-order tuple fields. Do not call `cancel*For`, batch account cancellation or `execute*`; those require service roles. A trigger order creation receipt does not mean it has executed.

## Fund Pool V2

Discover fundraising pools via `/client/foundpool/lists?status=1` (2=running, 3=ended). Read the chosen pool, period, minimum deposit, start/end/lock time and the user's state first.

```bash
node scripts/fund-deposit.js <pool> <pid> <amountInPoolTokenUnits> [--send]
node scripts/contract-call.js FundRouterV2 claim '["0xPOOL","1"]' [--send]
node scripts/contract-call.js FundRouterV2 batchClaim '["0xPOOL",["1","2"]]' [--send]
node scripts/contract-call.js FundRouterV2 setIsResubmit '["0xPOOL","1",true]' [--send]
```

The deposit script obtains the actual token from `PoolDataV2.poolToken(pool)`, reads its decimals, and calls `deposit(pool,pid,amount,false)`. Do not assume every fund pool uses USDT. `claim` redeems according to period eligibility. `compoundToNext`, pool GLP operations, new-period creation and manager configuration are role-restricted and are not ordinary depositor operations.

## Meme pools

Discover pools with `/client/memepool/lists` or `MemeData.tokenToPool(token)`.

```bash
node scripts/pool-action.js meme-deposit <pool> <USDT> [--send]
node scripts/contract-call.js MemeRouter claim '["0xPOOL","RAW_CLAIM_AMOUNT"]' [--send]
node scripts/contract-call.js MemeRouter claimAll '[]' [--send]
```

Deposits use USDT (6 decimals). For `claim(pool,amount)`, first read `MemeData.getMemeState(pool).isStake`: if true, amount is raw GLP shares (18 decimals, bounded by user glpAmount); if false, amount is raw deposited USDT (6 decimals, bounded by user depositAmount). Inspect `getMemeUserInfo` before choosing it. `claimAll` selects these units internally across the caller’s pools. Do not call `MemePool.withdraw`: it is a data-layer-only method, not a user withdrawal API. `MemeFactory.createPool(token)` is only for an already whitelisted creator (`getWhitelistIsIn(account)`); do not add the user to a whitelist.

## Privileged ABI surface

Users may bind their own existing referral code using `ReferralStorage.setTraderReferralCodeByUser(string)` through `contract-call.js`. Read the current referral first; do not batch-register codes or change source-contract permissions. `FeeBonus.claimFeeAmount` requires a configured handler in practice (an ordinary caller may receive a zero result), and direct `GlpRewardRouter` liquidity operations require authorized pool callers. Neither is an ordinary user redemption shortcut.

Full ABI exports include governance, keeper and internal methods for decoding. `initialize`, upgrades, governance/role setters, oracle `batchSetPrices`, vault direct mutations, liquidations, pool-data mutations, and fund-manager operations are not enabled by this skill. A user signature proves identity; it does not create those roles. Host-specific `MemeFactory` writes are covered separately in [room.md](room.md).
