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

An independent end-user run from an isolated copy successfully queried dev markets and encoded a BTC short preview with 10 USDT margin, 100 USD size and 1% tolerance without a private key. The live fundraising pool list was empty during that check; a running pool's encoded deposit is not proof that a fundraising deposit is currently eligible. Those initial checks did not execute signed cases.

## Subsequent authorized dev trading session (2026-10-08)

The signed session used 100 USDT per opening order, 500 USD position size (5x) and 1% market tolerance. Peak concurrently locked test margin was 200 USDT. These are observations from that session, not defaults or authorization for another user.

| Case | Observed outcome |
|---|---|
| Market long/short opening; long partial/full close; short full close | Passed: client completion status and resulting Vault positions matched |
| Long/short limit creation; individual/batch cancellation | Passed: receipt events and full refund of the cancelled opening orders |
| TP/SL single/batch creation and cancellation | Passed for long and short orders |
| Signed `/client/order/tpsl` relay | Passed twice, including the packaged helper; API acceptance followed by on-chain creation |
| Market request cancellation after execution | Both methods returned `*PositionNotExist`; idempotency passed, pending-request cancellation remains untested |
| Limit order actual execution | Not confirmed: a created long order remained active on chain while the client indices list was empty and no position appeared; cancelled and refunded |
| 24 selected client GET requests | 23 returned HTTP success and code 0; `/client/edge_hour/challenge/info` returned HTTP 500/code 100002 for the test account |
| Approvals and other signed features | Not executed in this phase: existing Router allowance sufficed; pools, rooms, referrals, Edge Hour and bridges require their own session cases and prerequisites |

Do not treat this as complete signed coverage or an all-green deployment. In particular, limit execution and the affected Edge Hour query need investigation. Preserve public transaction hashes and per-case evidence locally; never include private keys or signed transaction/message bytes in a test report.
