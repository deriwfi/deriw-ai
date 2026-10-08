# Validation and signed test preparation

## Read-only checks

```bash
npm ci
npm test
DERIW_NETWORK=dev npm run smoke
DERIW_NETWORK=test npm run smoke
DERIW_NETWORK=mainnet npm run smoke
```

`npm test` is offline and does not access keys. `smoke` checks chain ID, core bytecode, client API responses and a live oracle quote. It never signs, approves, broadcasts or calls mutating API routes. Add `--all-contracts` to check every configured L3 contract address (excluding the `pool` identifier and the L2 deposit router). Oracle checks reject stale/future timestamps as well as invalid prices. It returns a nonzero exit code if any selected check fails, with a per-check result. A successful smoke run is not evidence that a signed flow has passed.

## Before a signed test session

Use the user-authorized environment, wallet and spend limits. Read the public wallet's native/token balances with `node scripts/token-state.js <account> [token] [spender]`. Configure the local signer without printing it; the test commands accept `PRIVATE_KEY_FILE` or `PRIVATE_KEY`. A key import alone is not permission to spend. Select concrete tokens/pools/periods/templates through the client APIs and public reads, and record each test's expected balance/position change. Add `--send` only to the authorized cases.

| Area | Cases | Required verification |
|---|---|---|
| Market | Long/short open, increase, partial/full close; request cancellation | Exact Router allowance, creation hash/key, execution status/events, final position and balance |
| Limit | Long/short open, TP/SL close, individual/batch cancellation | Indices, trigger side/price, locked/refunded margin; creation vs actual execution |
| Fund | Fundraising deposit, eligibility rejection, opt in/out of resubmit, single/batch claim | Actual pool token/decimals, PoolDataV2 allowance, period and user state, claim event/balance |
| Meme | Deposit, staked GLP claim, unstaked USDT withdrawal, claimAll | MemeData allowance, isStake, correct amount units, caller's position/balance |
| Room | Pre-create API, new room or reopen, add liquidity, permitted withdrawal, lifecycle controls | Host signature, correct create/reopen argument order, MemeData allowance, API lifecycle and chain events |
| Edge Hour | Current template, ticket purchase, virtual open/close, Passed reward; LP deposit/withdraw | Confirmed deployment, ownership/state, template constraints, actual payment token, whitelist/maxWithdraw |
| Bridge | L2 deposit and L3 withdrawal | Confirmed source network, current quote, fee/token identity, signature recovery, source receipt and separate destination settlement |
| APIs | Public market, account, order, portfolio, pool, room, referral and challenge endpoints | HTTP status plus code=0, required fields, units, pagination, chain/API consistency |

For partial failure, preserve successful approval/transaction hashes. Check pending hash/nonce and resulting chain state before retrying. Do not call keeper, operator, oracle updater or governance methods to make a test pass. Missing role/deployment/quote is a prerequisite failure, not a successful test or permission to change protocol configuration.

Signed transactions, real approvals, signed API writes, Edge Hour deployment validation and bridge destination settlement are **not covered** by the initial read-only checks in this update. Report later results per case, separating passed, failed and blocked prerequisites.

## Read-only results for this update (2026-10-08)

| Environment | All-contract smoke checks | Result |
|---|---:|---|
| dev | 49 | Passed |
| test | 51 | Passed after the verified OrderBook correction |
| mainnet | 50 | Passed |

Checks include source chain ID, configured L3 bytecode, public coin/config/price/pool/Edge-template APIs and the current core oracle quote. They exclude the L2 deposit router and the pool identifier. Edge Hour contract addresses were not supplied and were not inferred from historical files. Nine offline tests also passed, covering network isolation, exact amounts, all slippage directions, quote freshness, ABI encoding/approval spender, restricted writes, client error handling and key-free previews.

An independent end-user run from an isolated copy successfully queried dev markets and encoded a BTC short preview with 10 USDT margin, 100 USD size and 1% tolerance without a private key. The live fundraising pool list was empty during that check; a running pool's encoded deposit is not proof that a fundraising deposit is currently eligible. No signed case in the matrix above has been executed as part of this update.
