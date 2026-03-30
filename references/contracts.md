# DERIW Contract Method Reference

> All contracts are on DERIW Chain (Chain ID: 2885, RPC: `https://rpc.deriw.com`).
> One exception: `UserL2ToL3Router` is on Arbitrum (Chain ID: 42161).
> ABI files are in the `assets/` directory.

---

## Vault (Core Vault Contract)

Address: `0xbd36B94f0b5A6F75dABa6e11ef3c383294470653`

**Read Methods (view)**

| Method | Parameters | Description |
|---|---|---|
| `getPosition(account, collateralToken, indexToken, isLong)` | address×3, bool | Get full position data for a user |
| `getPositionKey(account, collateralToken, indexToken, isLong)` | address×3, bool | Compute unique position key (pure) |
| `getPositionFrom(key)` | bytes32 | Read position directly by key |
| `getDelta(indexToken, size, averagePrice, isLong, lastIncreasedTime)` | address, uint256×3, bool | Calculate current unrealized PnL |
| `getMaxPrice(token)` | address | Token maximum price (for short open) |
| `getMinPrice(token)` | address | Token minimum price (for long open) |
| `getTokenData(indexToken, collateralToken)` | address×2 | Read token pool data |
| `getAmount(token, account)` | address×2 | Account's token balance in Vault |
| `poolAmounts(indexToken, collateralToken)` | address×2 | Total pool amount |
| `reservedAmounts(indexToken, collateralToken)` | address×2 | Reserved amount for positions |
| `guaranteedUsd(indexToken, collateralToken)` | address×2 | Total long guaranteed USD |
| `globalLongSizes(indexToken)` | address | Global total long position size |
| `globalShortSizes(indexToken)` | address | Global total short position size |
| `globalLongAveragePrices(indexToken)` | address | Global long average entry price |
| `globalShortAveragePrices(indexToken)` | address | Global short average entry price |
| `maxGlobalLongSizes(indexToken)` | address | Long position size cap |
| `maxGlobalShortSizes(indexToken)` | address | Short position size cap |
| `tokenToUsdMin(token, tokenAmount)` | address, uint256 | Token amount → USD (min price) |
| `usdToTokenMin(token, usdAmount)` | address, uint256 | USD → token amount (min price) |
| `usdToTokenMax(token, usdAmount)` | address, uint256 | USD → token amount (max price) |
| `validateLiquidation(account, collateralToken, indexToken, isLong, raise)` | address×3, bool×2 | Check if position can be liquidated |
| `getCoinType(indexToken)` | address | Get token type (normal/Meme) |
| `positions(key)` | bytes32 | Read position struct directly |
| `whitelistedTokens(token)` | address | Whether token is whitelisted |
| `stableTokens(token)` | address | Whether token is a stablecoin |
| `shortableTokens(token)` | address | Whether token can be shorted |
| `tokenDecimals(token)` | address | Token decimals |
| `usdt()` | — | USDT contract address |
| `marginFeeBasisPoints()` | — | Fee rate (basis points) |
| `liquidationFeeUsd()` | — | Liquidation fee (USD) |
| `maxLeverage()` | — | Maximum leverage multiplier |
| `minProfitTime()` | — | Minimum profit protection duration |
| `minProfitBasisPoints(token)` | address | Minimum profit basis points for token |

---

## PositionRouter (Market Order Router)

Address: `0x80257F37d327FA0EF464eFa64DdFb755dE111262`

**Read Methods (view)**

| Method | Parameters | Description |
|---|---|---|
| `getRequestKey(account, index)` | address, uint256 | Compute request key |
| `increasePositionRequests(key)` | bytes32 | Read open position request details |
| `decreasePositionRequests(key)` | bytes32 | Read close position request details |
| `getIncreasePositionRequestPath(key)` | bytes32 | Read open position token path |
| `getDecreasePositionRequestPath(key)` | bytes32 | Read close position token path |
| `getSlippagePrice(key, indexToken, size, isLong)` | bytes32, address, uint256, bool | Get slippage price |
| `getVaultPrice(indexToken, size, isLong)` | address, uint256, bool | Get Vault current execution price |
| `increasePositionsIndex(account)` | address | Account open position request count |
| `decreasePositionsIndex(account)` | address | Account close position request count |
| `maxTimeDelay()` | — | Maximum execution delay time (seconds) |
| `minAmount()` | — | Minimum trade amount |

**Write Methods (user callable)**

| Method | Parameters | Description |
|---|---|---|
| `createIncreasePosition(path, indexToken, amountIn, sizeDelta, isLong, acceptablePrice, referralCode, callbackTarget)` | — | Create market open position request |
| `createDecreasePosition(path, indexToken, collateralDelta, sizeDelta, isLong, receiver, acceptablePrice, callbackTarget)` | — | Create market close position request |
| `cancelIncreasePosition(key)` | bytes32 | Cancel unexecuted open position request |
| `cancelDecreasePosition(key)` | bytes32 | Cancel unexecuted close position request |

**Key Parameter Notes**

- `path`: `[USDT]` (stablecoin as margin)
- `amountIn`: `1e6` precision (USDT)
- `sizeDelta`: `1e30` precision (USD)
- `acceptablePrice`: Use `MaxUint256` for longs, `0n` for shorts (no slippage limit)
- `referralCode`: Referral code (bytes32), pass `ethers.ZeroHash` if none
- `callbackTarget`: Callback contract address, usually pass `ethers.ZeroAddress`

---

## OrderBook (Limit Order Contract)

Address: `0x86A0D906c6375846b05a0EF20931c1B4d2489C13`

**Read Methods (view)**

| Method | Parameters | Description |
|---|---|---|
| `getIncreaseOrder(account, orderIndex)` | address, uint256 | Read limit open order details |
| `getDecreaseOrder(account, orderIndex)` | address, uint256 | Read limit close order details |
| `getIncreaseOrderData(account, orderIndex)` | address, uint256 | Read open order extended data |
| `increaseOrdersIndex(account)` | address | Account limit open order count |
| `decreaseOrdersIndex(account)` | address | Account limit close order count |

**Write Methods (user callable)**

| Method | Parameters | Description |
|---|---|---|
| `createIncreaseOrder(path, amountIn, indexToken, sizeDelta, collateralToken, isLong, triggerPrice, triggerAboveThreshold, lever)` | — | Create limit open order |
| `createDecreaseOrder(indexToken, sizeDelta, collateralToken, collateralDelta, isLong, triggerPrice, triggerAboveThreshold, lever)` | — | Create limit close order |
| `cancelIncreaseOrder(orderIndex)` | uint256 | Cancel limit open order |
| `cancelDecreaseOrder(orderIndex)` | uint256 | Cancel limit close order |
| `cancelMultiple(increaseOrderIndexes, decreaseOrderIndexes)` | uint256[]×2 | Batch cancel orders |
| `batchCreateDecreaseOrder(orders)` | tuple[] | Batch create limit close orders |

**Key Parameter Notes**

- `lever`: `sizeDelta * 10000n / parseUnits(amountIn, 30)` (open); pass `10000n` for close
- `triggerAbove`: `true` = triggers when price breaks above (long take-profit/short stop-loss), `false` = triggers when price breaks below

---

## VaultPriceFeed (Price Aggregator)

Address: `0xEC7046731d5ef62Ce62C0291b7dF891E62aECC7E`

| Method | Parameters | Description |
|---|---|---|
| `getPrice(token, maximise, _, _)` | address, bool×3 | Get final aggregated price |
| `getPrimaryPrice(token, maximise)` | address, bool | Primary price source price |
| `getLatestPrimaryPrice(token)` | address | Latest primary price source price |
| `spreadBasisPoints(token)` | address | Token spread basis points |

---

## FastPriceFeed (Fast Price)

Address: `0x43948B78477963d7b408A0E27Ae168584C6E07A9`

| Method | Parameters | Description |
|---|---|---|
| `getPrice(token, refPrice, maximise)` | address, uint256, bool | Get fast price |
| `prices(token)` | address | Latest pushed on-chain price |
| `getPriceData(token)` | address | Returns price metadata |
| `lastUpdatedAt()` | — | Last update timestamp |
| `lastUpdatedBlock()` | — | Last update block number |

---

## PriceFeed (On-Chain Price Storage)

Address: `0x83CA1aA2Bc20e41287154650e4161dC995278E1D`

| Method | Parameters | Description |
|---|---|---|
| `latestAnswer(token)` | address | Latest price answer |
| `latestRound(token)` | address | Latest round |
| `getRoundData(token, roundId)` | address, uint80 | Get historical round price |
| `decimals()` | — | Price precision |

---

## VaultUtils (Fee / Position Calculation Helper)

Address: `0xfC21471Ef1D98A4e34B91A1EDeCB523ba4EA83D9`

| Method | Parameters | Description |
|---|---|---|
| `getFeeBasisPoints(indexToken)` | address | Get fee basis points for token |
| `getPositionFee(_, _, indexToken, _, sizeDelta)` | address×3, bool, uint256 | Calculate position fee |
| `getCalculatePositionData(key, collateralToken, indexToken)` | bytes32, address×2 | Calculate detailed position data |
| `validateLiquidation(account, collateralToken, indexToken, isLong, raise)` | address×3, bool×2 | Validate if position can be liquidated |

---

## DataReader (On-Chain Data Aggregated Read)

Address: `0xf0A6bd9feb742E56C39A7df4544A093A12858c64`

| Method | Parameters | Description |
|---|---|---|
| `poolAmounts(indexToken, collateralToken)` | address×2 | Total pool amount |
| `reservedAmounts(indexToken, collateralToken)` | address×2 | Reserved amount |
| `guaranteedUsd(indexToken, collateralToken)` | address×2 | Guaranteed USD |
| `tokenBalances(indexToken, collateralToken)` | address×2 | Token balances |
| `getTargetIndexToken(indexToken)` | address | Get target indexToken |

---

## GlpManager (GLP Liquidity Management)

Address: `0xa61ddD4Cf723cDB339008021aD05e5a1BE140F3f`

| Method | Parameters | Description |
|---|---|---|
| `getAmount(token, account)` | address×2 | Account GLP balance |
| `lastAddedAt(account)` | address | Account's last liquidity addition time |
| `cooldownDuration()` | — | Liquidity removal cooldown period |
| `glp()` | — | GLP token contract address |
| `usdt()` | — | USDT contract address |

---

## GLP (GLP Token)

Address: `0x9E06Fe81dCad8cdc624C4B5fb126Aeed0449CFc9`

Standard ERC-20, 18 decimals.

| Method | Parameters | Description |
|---|---|---|
| `balanceOf(account)` | address | Account GLP balance |
| `totalSupply()` | — | Total GLP supply |
| `allowance(owner, spender)` | address×2 | Approved allowance |

---

## ADL (Auto-Deleveraging)

| Method | Parameters | Description |
|---|---|---|
| `shouldExecuteADL(indexToken)` | address | Whether ADL needs to be triggered |
| `getPoolNetPosition(indexToken)` | address | Pool net long/short direction |
| `getPoolRealTimeNetValue(indexToken)` | address | Pool real-time net value |
| `getPoolLever(indexToken)` | address | Pool current leverage ratio |
| `getLeverageTriggerValue(indexToken)` | address | ADL trigger leverage threshold |
| `getListADLPosition(targetIndexToken, index, num)` | address, uint256×2 | Paginated read of ADL candidate positions |
| `batchGetPositions(positionData[])` | tuple[] | Batch read position data |

---

## FundRouterV2 (Fund Pool V2 User Entry)

Address: `0x3D343Fc0F6c6D2E047ec5e16e39A9b6A2031B9Ac`

| Method | Parameters | Description |
|---|---|---|
| `deposit(pool, pid, amount, isResubmit)` | address, uint256, uint256, bool | Deposit funds into specified pool/period |
| `claim(pool, pid)` | address, uint256 | Claim single period rewards |
| `batchClaim(pool, pid[])` | address, uint256[] | Batch claim multiple period rewards |
| `compoundToNext(pool, pid, number)` | address, uint256×2 | Compound rewards into next period |

---

## PoolDataV2 (Fund Pool V2 Data Layer)

Address: `0x305507D45D5441B81F5dD8FF9f00f65e0B392e86`

| Method | Parameters | Description |
|---|---|---|
| `getFoundInfo(pool, pid)` | address, uint256 | Get pool basic info |
| `getFoundState(pool, pid)` | address, uint256 | Get pool state (fundraising progress/phase) |
| `getUserInfo(user, pool, pid)` | address×2, uint256 | User's staking info in specified pool |
| `getUserPerInfo(user, pool, pid, depositID)` | address×2, uint256×2 | User's specific deposit detailed data |
| `getFundraisingAmount(pool, pid)` | address, uint256 | Total fundraising amount for current period |
| `currPeriodID(pool)` | address | Current running period ID |
| `poolToken(pool)` | address | Token address associated with pool |
| `getAmount(token, account)` | address×2 | Account token balance |

---

## FundReader (Fund Pool Read-Only Calculations)

Address: `0x4D778dE09f5C043677bd18888114A9a0911dCE96`

| Method | Parameters | Description |
|---|---|---|
| `getDepositLpAmount(pool, pid, amount, isNext)` | address, uint256×2, bool | Calculate LP amount receivable after deposit |
| `getLpValue(pool, pid, tokenOut, glpAmount)` | address, uint256, address, uint256 | LP corresponding token value |
| `getPrice(token)` | address | Get token price |
| `getTokenValue(token, amount)` | address, uint256 | Token amount → USD value |
| `getUserCompoundAmount(pool, user, pid)` | address×2, uint256 | User's compoundable amount |

---

## MemeRouter (Meme Pool User Entry)

Address: `0xf128817F665E8469BBC3d6f2ade7f073180a010E`

| Method | Parameters | Description |
|---|---|---|
| `deposit(pool, amount)` | address, uint256 | Deposit into Meme pool |
| `claim(pool, amount)` | address, uint256 | Claim Meme pool rewards |
| `claimAll()` | — | Claim all Meme pool rewards |

---

## MemeData (Meme Pool Data Layer)

Address: `0xA4DE9E445C06A0d091a3cdA0661C7B5a5A1fAec8`

| Method | Parameters | Description |
|---|---|---|
| `getMemeState(pool)` | address | Get Meme pool state |
| `getMemeUserInfo(pool, user)` | address×2 | Get user's info in Meme pool |
| `getUserDepositPoolNum(user)` | address | Total pools user participates in |
| `getUserDepositPoolisIn(user, pool)` | address×2 | Whether user participates in pool |
| `getAmount(token, account)` | address×2 | Account token balance |
| `isTokenCreate(token)` | address | Whether Meme token has a pool created |
| `tokenToPool(token)` | address | Token → corresponding pool address |
| `poolToken(pool)` | address | Pool → corresponding token address |
| `lockTime()` | — | Lock period duration |
| `startTime(pool)` | address | Pool start time |

---

## MemeFactory (Meme Pool Creation)

Address: `0x363d1d8a71A5e1E6F6528432A59541bb2848B07e`

| Method | Parameters | Description |
|---|---|---|
| `createPool(token)` | address | Create Meme pool for specified token |
| `getPoolNum(account)` | address | Number of pools created by account |
| `getWhitelistIsIn(account)` | address | Whether account is on creation whitelist |
| `poolID()` | — | Global pool ID counter |
| `idToPool(id)` | uint256 | ID → pool address |
| `poolOwner(pool)` | address | Pool owner |

---

## MemePool (Meme Fund Pool)

> Dynamically created on deployment, address queried via MemeData.tokenToPool(token).

| Method | Parameters | Description |
|---|---|---|
| `withdraw()` | — | Withdraw expired staked assets and rewards |
| `memeFactory()` | — | Associated MemeFactory address |

---

## OrderBookReader (Order Book Batch Read)

Address: `0x239e5A9813C469D86D3322133e3c1AbA77A412f8`

| Method | Parameters | Description |
|---|---|---|
| `getIncreaseOrders(orderBookAddress, account, indices)` | address×2, uint256[] | Batch read limit open orders |
| `getDecreaseOrders(orderBookAddress, account, indices)` | address×2, uint256[] | Batch read limit close orders |

---

## Reader (On-Chain Data Batch Read)

Address: `0x84C1F027f05E2c944D0Ccee94d29C34Ea3Fcf9eD`

| Method | Parameters | Description |
|---|---|---|
| `getPositions(vault, account, collateralTokens, indexTokens, isLong)` | address×2, address[], address[], bool[] | Batch read multiple position data |
| `getVaultTokenInfo(vault, weth, tokens)` | address×2, address[] | Batch read Vault token info |
| `getTokenBalances(account, tokens)` | address, address[] | Batch read account token balances |
| `getCurrBlockNumber()` | — | Current block number |
| `getCurrTime()` | — | Current timestamp |

---

## VaultReader (Vault Extended Read)

Address: `0x1A635dCb4254965432271b49D2E347615c70383a`

| Method | Parameters | Description |
|---|---|---|
| `getVaultTokenInfoV4(vault, positionRouter, weth, tokens)` | address×3, address[] | Batch read Vault V4 full token info (including funding rates, utilization, etc.) |

---

## ReferralStorage (Referral Code Storage)

Address: `0x83a30fa6FA383FcA37AD1e72fFf927961e06cD79`

**Read Methods (view)**

| Method | Parameters | Description |
|---|---|---|
| `ownerCode(account)` | address | Referral code held by account |
| `codeOwner(code)` | string | Owner address for referral code |
| `referral(account)` | address | Account's referrer address |
| `getSecondaryAccount(account, index)` | address, uint256 | Account's index-th direct subordinate address |
| `getSecondaryAccountLength(account)` | address | Total number of direct subordinates |
| `getPartnerAccountAccountIsIn(user)` | address | Whether account is a partner |
| `getPartnerAccountAccountLength()` | — | Total number of partners |

**Write Methods (user callable)**

| Method | Parameters | Description |
|---|---|---|
| `setTraderReferralCodeByUser(code)` | string | User self-binds referral code |

---

## ReferralData (Fee Rebate Data)

Address: `0x2Bd4B513C5B2aD07516CCA330DE1AE87B82FFA98`

| Method | Parameters | Description |
|---|---|---|
| `getAmount(token, account)` | address×2 | Account's withdrawable rebate balance |
| `totalIndex()` | — | Total fee records count |
| `indexFee(index)` | uint256 | Fee amount for index-th record |

---

## FeeBonus (Fee Reward Distribution)

Address: `0x1F1E7D48424ed1BdF9cD7aEB85d319eFF0191A6E`

| Method | Parameters | Description |
|---|---|---|
| `feeAmount(account)` | address | Account's claimable fee rewards |
| `feeMemeAmount(account)` | address | Account's claimable Meme fee rewards |
| `feeRate(account)` | address | Account's fee reward ratio |
| `claimFeeAmount(account)` | address | Claim fee rewards (USDT) |
| `claimMemeFeeAmount(account)` | address | Claim Meme fee rewards |

---

## GlpRewardRouter (GLP Router Read-Only)

Address: `0xE9F045f0CE5dc1AD552e20E8df668194d67f95D5`

| Method | Parameters | Description |
|---|---|---|
| `glpManager()` | — | GlpManager contract address |
| `foundReader()` | — | FundReader contract address |
| `USDT()` | — | USDT contract address |
| `pendingReceivers(account)` | address | Account pending receiver records |

---

## TokenHelper (Signature Verification Tool)

Address: `0xc5Ce3D29De397c4ec7C3f2b47ddD4608f8143e8c`

| Method | Parameters | Description |
|---|---|---|
| `getSignatureUser(domain, message, signature)` | tuple×2, bytes | Recover signer address from signature (pure) |
| `hashDomain(domain)` | tuple | Compute domain hash (pure) |
| `hashMessage(message)` | tuple | Compute message hash (pure) |
| `getTokenBalance(token, account)` | address×2 | Query account token balance |
| `isHashUse(hash)` | bytes32 | Whether signature hash has been used |
| `chainid()` | — | Current chain ID |

---

## BlackList (System Circuit Breaker / Blacklist)

Address: `0x24A3D7c8134238ea4Ec4e0feF288C2AD31852821`

| Method | Parameters | Description |
|---|---|---|
| `isFusing()` | — | Whether system is in circuit breaker state |
| `isStop()` | — | Whether system has stopped |
| `getOperatorsContains(account)` | address | Whether account is an operator |

---

## SwapToken (Token Burn Exchange)

| Method | Parameters | Description |
|---|---|---|
| `getUserBalance(token, user)` | address×2 | Query user's exchangeable balance for this token |
| `getContractBalance(token)` | address | Query contract's token balance |
| `getTokenTotalSupply(token)` | address | Total supply of this token |
| `tokenBurnAmount(token)` | address | Cumulative burned amount of this token |
| `basseRate()` / `tokenRate()` | — | Base exchange rate / global exchange ratio |

---

## UserL2ToL3Router (L2 → L3 Cross-Chain Bridge)

> **Chain**: Arbitrum (Chain ID: 42161)
> Address: `0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325`

**Read Methods (view)**

| Method | Parameters | Description |
|---|---|---|
| `getFee(token, amount)` | address, uint256 | Calculate cross-chain fee |
| `getTokenIsIn(token)` | address | Whether token supports cross-chain |
| `getUserDepositInfo(token, user)` | address×2 | User's cross-chain deposit info for this token |

**Write Methods (user callable)**

| Method | Parameters | Description |
|---|---|---|
| `outboundTransfer(_token, _to, _amount, _maxGas, _gasPriceBid, _data)` | address×2, uint256×3, bytes | Initiate L2→L3 cross-chain deposit (payable, requires ETH fee) |

---

## UserL3ToL2Router (L3 → L2 Cross-Chain Bridge)

> **Chain**: DERIW Chain (Chain ID: 2885)
> Address: `0x8fb358679749FD952Ea5f090b0eA3675722B08F5`

**Read Methods (view)**

| Method | Parameters | Description |
|---|---|---|
| `getValue(token, amount)` | address, uint256 | Returns `[netAmount, fee]`: net amount received + ETH fee |
| `getTokenIsIn(token)` | address | Whether token supports cross-chain |
| `getUserDepositInfo(token, user)` | address×2 | User's withdrawal info for this token |
| `isHashUse(hash)` | bytes32 | Whether signature hash has been used |

**Write Methods (user callable, payable)**

| Method | Parameters | Description |
|---|---|---|
| `outboundTransfer(data, domain, message, signature)` | bytes, tuple×2, bytes | Initiate L3→L2 withdrawal (requires EIP-712 signature) |

**EIP-712 Signature Structure (Message 8 fields)**

```javascript
// Enum values see references/addresses.md #Enum Constants
const domain = {
  name: 'DERIW', version: '1',
  chainId: 2885,
  verifyingContract: '0x8fb358679749FD952Ea5f090b0eA3675722B08F5'
};
const types = {
  Message: [
    { name: 'transactionType', type: 'string'  },  // 'Withdraw USDT'
    { name: 'from',            type: 'address' },  // Sender address
    { name: 'token',           type: 'address' },  // L3 USDT
    { name: 'l2Token',         type: 'address' },  // Arbitrum USDT
    { name: 'destination',     type: 'address' },  // Receiver address
    { name: 'amount',          type: 'uint256' },  // Amount (1e6)
    { name: 'deadline',        type: 'uint256' },  // Deadline timestamp
    { name: 'chain',           type: 'string'  },  // 'DeriW Chain' (prod) / 'DeriW Devnet' (dev)
  ]
};
const message = {
  transactionType: 'Withdraw USDT',
  from:            wallet.address,
  token:           USDT_L3,
  l2Token:         USDT_L2,
  destination:     receiver,
  amount,
  deadline:        BigInt(Math.floor(Date.now() / 1000) + 600),
  chain:           'DeriW Chain',  // use 'DeriW Devnet' for dev
};
const signature = await wallet.signTypedData(domain, types, message);
const [, fee] = await router.getValue(USDT_L3, amount);
const data = ethers.AbiCoder.defaultAbiCoder().encode(
  ['address', 'uint256', 'address'], [USDT_L3, amount, receiver]
);
await router.outboundTransfer(data, domain, message, signature, { value: fee });
```

---

## Precision Reference

| Value Type | Precision | ethers.js Example |
|---|---|---|
| Price (USD, main pool) | `1e30` | `ethers.parseUnits("65000", 30)` |
| Price (USD, Edge Hour PriceOracle) | `1e18` | `ethers.formatEther(price)` |
| USDT amount | `1e6` | `ethers.parseUnits("100", 6)` |
| Token amount | `1e18` | `ethers.parseUnits("1", 18)` |
| GLP / LP shares | `1e18` | `ethers.parseUnits("1", 18)` |
| Fee basis points | `10000 = 100%` | `30 = 0.3%` |
| Leverage (main pool) | `10000 = 1x` | `500000 = 50x` |
| Leverage (Edge Hour template) | raw multiplier | `2000 = 20x` |

---

## Edge Hour: ChallengeManager

Address:
- Production: `0xBb1785B6A90819C11b8467ff85652661BE0286db`
- Dev: `0x086603940a23464A60ABeBcD887524eD3b0f3150`

ABI: `assets/edge_hour/ChallengeManager.json`

> **Precision**: All amounts (ticketFee, sizeDelta, collateralDelta, currentBalance) use `1e6` (USDT unit)

**Challenge Status Enum**

| Value | Name | Description |
|---|---|---|
| `0` | None | Does not exist |
| `1` | Active | Challenge in progress |
| `2` | Passed | Profit target met, reward claimable |
| `3` | Failed | Timed out or max drawdown triggered |
| `4` | Claimed | Reward already claimed |

**Read Methods (view)**

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `getChallengeTemplateLength()` | — | `uint256` | Total number of templates |
| `getChallengeTemplate(templateId)` | `uint256` | `(params_tuple, isActive)` | Get template parameters (params[0]=maxTicketFee, [1]=initialBalance, [2]=targetBps, [3]=maxLossBps, [4]=duration, [5]=prizeMultiplierBps, [6]=tradeFeeBps, [7]=minTrades, [8]=minHoldTime, [9]=maintenanceMarginBps, [10]=maxSingleProfitBps, [11]=tokens[], [12]=leverages[]) |
| `getActiveChallengeId(user)` | `address` | `(bool exists, uint256 challengeId)` | Query user's current active challenge |
| `getChallengeState(challengeId)` | `uint256` | `UserChallengeState` | Full challenge state ([0]=user, [1]=status, [2]=activePositionCount, [3]=tradeCount, [4]=startTime, [5]=expiryTime, [6]=ticketFee, [7]=currentBalance, [8]=cappedEquity, [9]=referrerChallengeId, [10]=cappedProfit, [11]=currentLoss) |
| `getPosition(challengeId, key)` | `uint256, bytes32` | `Position` | Get position (size/averagePrice/collateral/lastIncreaseTime, all 1e6) |
| `getPositionKey(challengeId, indexToken, isLong)` | `uint256, address, bool` | `bytes32` | Compute unique position key (behaves as pure) |
| `challengeMaxLeverage(challengeId, token)` | `uint256, address` | `uint256` | Max leverage for specified token in current challenge |
| `templateMaxLeverage(templateId, token)` | `uint256, address` | `uint256` | Max leverage for specified token in template |
| `addRewardNumber(challengeId)` | `uint256` | `uint256` | Claimable reward amount for this challenge |
| `minPositionValueUsd()` | — | `uint256` | Minimum position value (1e6, default 10 USDT) |
| `ticketUnit()` | — | `uint256` | Minimum ticket unit (5 USDT = 5000000) |
| `nextChallengeId()` | — | `uint256` | Next challenge ID |
| `referralConfig()` | — | `(inviterBonusBps, inviteeDurationBonusBps, inviteeTicketDiscountBps, maxRewardNumberCap)` | Referral configuration |
| `paused()` | — | `bool` | Whether contract is paused |

**Write Methods**

| Method | Parameters | Description |
|---|---|---|
| `startChallenge(templateId, ticketFee)` | `uint256, uint256` | Start challenge; approve USDT first; ticketFee must be an exact multiple of ticketUnit |
| `increasePosition(iPosition)` | `{challengeId, indexToken, sizeDelta, collateralDelta, isLong}` | Virtual open/increase position (no token transfer; sizeDelta/collateralDelta in 1e6) |
| `closePosition(cPosition)` | `{challengeId, indexToken, isLong}` | Virtual full position close |
| `claimReward(challengeId)` | `uint256` | Claim reward (status must be 2=Passed) |
| `setTraderReferralCode(code, sType, challengeId)` | `string, uint8, uint256` | Set referral code (call after starting challenge) |

**Key Events**

| Event | Fields | Description |
|---|---|---|
| `ChallengeStarted` | `challengeId, templateId, templateParams, challengeState, paidTicketFee` | Challenge started |
| `PositionIncreased` | `challengeId, positionKey, iPosition, price, newSize, newAveragePrice, user, fee` | Position opened/increased (price is 1e18; newSize/fee are 1e6) |
| `PositionClosed` | `challengeId, positionKey, p, price, realizedPnl, user, fee, cappedProfit, cappedEquity` | Position closed (realizedPnl/fee/cappedProfit/cappedEquity are 1e6) |
| `ChallengePassed` | `challengeId` | Challenge passed |
| `ChallengeFailed` | `challengeId, reason` | Challenge failed |
| `RewardClaimed` | `challengeId, user, amount` | Reward claimed (amount is 1e6) |

**Usage Example**

```javascript
const { ethers } = require('ethers');
const ABI = require('./assets/edge_hour/ChallengeManager.json');
const IS_DEV = process.env.DEV === 'true';
const ADDR = IS_DEV ? '0x086603940a23464A60ABeBcD887524eD3b0f3150' : '0xBb1785B6A90819C11b8467ff85652661BE0286db';
const RPC  = IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com';

const provider = new ethers.JsonRpcProvider(RPC);
const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const cm       = new ethers.Contract(ADDR, ABI, wallet);

// Query user's active challenge
const [exists, challengeId] = await cm.getActiveChallengeId(wallet.address);

// Start challenge (approve USDT first)
const gasOpts = IS_DEV ? { gasPrice: 0n } : {};
await cm.startChallenge(templateId, ethers.parseUnits('5', 6), gasOpts);

// Open virtual position (no token transfer)
await cm.increasePosition({
  challengeId,
  indexToken: '0x9F37821B7C4A5EfaA4d92aa9A6dE526237C30ceD', // WBTC
  sizeDelta:      ethers.parseUnits('1000', 6),  // 1000 USDT size
  collateralDelta: ethers.parseUnits('100', 6),  // 100 USDT collateral (10x)
  isLong: true,
}, gasOpts);

// Close position
await cm.closePosition({ challengeId, indexToken, isLong: true }, gasOpts);

// Claim reward
await cm.claimReward(challengeId, gasOpts);
```

---

## Edge Hour: LPVault

Address:
- Production: `0x29F463c832C03076ab2cB9734fD6C0e3B135B00b`
- Dev: `0x2eB88D51C30708f8539c949855F39861e7f3adB5`

ABI: `assets/edge_hour/LPVault.json`

> **Note**: `deposit()` requires `whitelist(addr) == true`, added by the contract owner via `addToWhitelist()`.

**Read Methods**

| Method | Returns | Description |
|---|---|---|
| `totalAssets()` | `uint256` | Total vault assets (1e6 USDT) |
| `availableLiquidity()` | `uint256` | Available liquidity (1e6) |
| `lpAssetBalance()` | `uint256` | LP asset balance (1e6) |
| `sharePrice()` | `uint256` | USDT per share (1e18, initially 1.0) |
| `totalSupply()` | `uint256` | Total LP shares (1e18) |
| `balanceOf(account)` | `uint256` | User LP shares (1e18) |
| `maxWithdraw(user)` | `uint256` | User's maximum withdrawable amount (1e6 USDT) |
| `previewWithdraw(assets)` | `uint256 shares` | Shares burned to withdraw the given assets (USDT) |
| `getStatistics()` | `(totalFees, totalRewards, netProfit, currentBalance, pending)` | Global stats, all in 1e6 |
| `protocolFeeConfig()` | `(ticketFeeBps, rewardFeeBps, feeRecipient)` | Protocol fee configuration |
| `pendingRewards()` | `uint256` | Pending rewards (1e6) |
| `totalPotentialPayout()` | `uint256` | Maximum potential payout for all active challenges (1e6) |
| `whitelist(address)` | `bool` | Whether address is whitelisted |
| `maxVaultUtilizationBps()` | `uint256` | Maximum utilization rate (bps, 8000=80%) |
| `paused()` | `bool` | Whether contract is paused |

**Write Methods**

| Method | Parameters | Description |
|---|---|---|
| `deposit(assets)` | `uint256` | Deposit USDT (1e6), returns LP shares received; approve USDT first; address must be whitelisted |
| `withdraw(assets)` | `uint256` | Redeem USDT (1e6), burns corresponding LP shares; call `maxWithdraw` first to confirm available amount |

**Usage Example**

```javascript
const ABI  = require('./assets/edge_hour/LPVault.json');
const vault = new ethers.Contract(LP_VAULT_ADDR, ABI, wallet);

// Deposit (whitelist required)
const amount = ethers.parseUnits('100', 6);
await usdt.approve(LP_VAULT_ADDR, ethers.MaxUint256);
await vault.deposit(amount, gasOpts);

// Query max withdrawable amount
const max = await vault.maxWithdraw(wallet.address);
// Withdraw
await vault.withdraw(max, gasOpts);

// Query statistics
const stats = await vault.getStatistics();
console.log('totalFees:', Number(stats.totalFees)/1e6, 'USDT');
```

---

## Edge Hour: PriceOracle

Address:
- Production: `0x493De553C9948f463f31249833D4d02D6DF9d0cB`
- Dev: `0x6dc3EAcAA36adA3f32Fefe3522361E1Fb6D23EcC`

ABI: `assets/edge_hour/PriceOracle.json`

> **Precision**: `getPrice()` returns `price * 1e18` (differs from the main pool VaultPriceFeed which uses 1e30)

**Read Methods**

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `getPrice(indexToken)` | `address` | `uint256` | Get token price (1e18 precision), e.g. BTC=70000 → 70000×10¹⁸ |
| `fastPriceFeed()` | — | `address` | Underlying FastPriceFeed address |
| `maxPriceTime()` | — | `uint256` | Maximum price validity duration (seconds) |

**Usage Example**

```javascript
const ABI    = require('./assets/edge_hour/PriceOracle.json');
const oracle = new ethers.Contract(PRICE_ORACLE_ADDR, ABI, provider);

const rawPrice = await oracle.getPrice(WBTC_ADDR);
console.log('BTC price:', ethers.formatEther(rawPrice), 'USD'); // formatEther = /1e18
```
