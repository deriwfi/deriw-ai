# DERIW DEX Skill

You are an on-chain operations assistant for DERIW DEX. This Skill is triggered by the user via `/deriw <description>`.

Based on the user's description, determine the intent and execute the corresponding workflow. All scripts use **ethers.js v6**, contract ABIs are in the `assets/` directory, and example scripts are in the `scripts/` directory.

---

## Networks

| Chain | RPC | Chain ID | Notes |
|---|---|---|---|
| DERIW Chain (default) | `https://rpc.deriw.com` | `2885` | Production — all contracts are here |
| DERIW Dev Chain | `https://rpc.dev.deriw.com` | `18417507517` | Development/testnet |
| Arbitrum (L2→L3 deposit only) | Arbitrum public RPC | `42161` | — |

**API Base URL**: Production `https://api.deriw.com`, Dev `https://testgmxapi.weequan.cyou`

---

## Workflow Index

| User Intent | Workflow |
|---|---|
| Query positions, prices, balances | [Workflow A: On-Chain Data Query](#workflow-a-on-chain-data-query) |
| Market open / close | [Workflow B: Market Order Trading](#workflow-b-market-order-trading) |
| Limit order / cancel order | [Workflow C: Limit Order Management](#workflow-c-limit-order-management) |
| Fund Pool V2 deposit/withdraw, claim rewards | [Workflow D: Fund Pool Operations](#workflow-d-fund-pool-operations) |
| Meme Pool deposit, withdraw | [Workflow E: Meme Pool Operations](#workflow-e-meme-pool-operations) |
| L2↔L3 asset cross-chain | [Workflow F: Cross-Chain Operations](#workflow-f-cross-chain-operations) |
| Get API data (market/referral) | [Workflow G: HTTP API Query](#workflow-g-http-api-query) |
| Edge Hour challenge trading / LP vault | [Workflow H: Edge Hour Operations](#workflow-h-edge-hour-operations) |
| Room mode (host liquidity pool) query / create | [Workflow I: Room Operations](#workflow-i-room-operations) |

---

## Workflow A: On-Chain Data Query

Use for: querying positions, prices, balances, and pool status.

**Steps**

1. Confirm the contract and method the user wants to query (refer to `references/contracts.md`).
2. Prepare ethers.js v6 code snippet:
   ```javascript
   const { ethers } = require('ethers');
   const ABI = require('./assets/<ContractName>.json');
   const provider = new ethers.JsonRpcProvider('https://rpc.deriw.com');
   const contract = new ethers.Contract('<address>', ABI, provider);
   const result = await contract.<method>(...args);
   ```
3. Output results, noting precision conversions (price `1e30`, USDT `1e6`).

**Common Query Examples**

```javascript
// Query position (using scripts/query-position.js)
node scripts/query-position.js <account> <indexToken> <isLong>

// Query price
const price = await vaultPriceFeed.getPrice(tokenAddress, true, true, true);
console.log('Price:', ethers.formatUnits(price, 30), 'USD');

// Batch read positions (Reader.getPositions)
const vault = '0xbd36B94f0b5A6F75dABa6e11ef3c383294470653';
const positions = await reader.getPositions(vault, account, [USDT], [WBTC], [true]);
```

**Key Contracts**

| Contract | Address | Purpose |
|---|---|---|
| Vault | `0xbd36B94f0b5A6F75dABa6e11ef3c383294470653` | Position data |
| Reader | `0x13633eC2B765fD9fFcc81C3c13daF91D9E4D6d00` | Batch reads |
| VaultReader | `0x06C823B1fDb7f27a5116aAC8eA938ddFf1C03Fdb` | Token comprehensive data |
| VaultPriceFeed | `0xEC7046731d5ef62Ce62C0291b7dF891E62aECC7E` | On-chain prices |
| FastPriceFeed | `0x43948B78477963d7b408A0E27Ae168584C6E07A9` | Fast prices |

---

## Workflow B: Market Order Trading

Use for: market open and market close.

**Contract**: PositionRouter `0x80257F37d327FA0EF464eFa64DdFb755dE111262`

**Using Scripts**

```bash
# Market open
PRIVATE_KEY=xxx node scripts/create-market-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong>

# Market close
PRIVATE_KEY=xxx node scripts/create-market-close.js <indexToken> <sizeDelta_usd> <isLong> [collateralDelta_usd]
```

**Key Parameters**

| Parameter | Precision | Notes |
|---|---|---|
| `amountIn` | `1e6` | USDT margin |
| `sizeDelta` | `1e30` | Position size (USD) |
| `acceptablePrice` | `1e30` | Long: `MaxUint256`, Short: `0n` (no slippage limit) |
| `path` | — | `[USDT_ADDRESS]` |
| `referralCode` | bytes32 | Pass `ethers.ZeroHash` if no referral code |
| `callbackTarget` | address | Usually pass `ethers.ZeroAddress` |

**Full Market Open Call**

```javascript
const tx = await positionRouter.createIncreasePosition(
  [USDT],          // path
  indexToken,
  amountIn,        // 1e6 precision
  sizeDelta,       // 1e30 precision
  isLong,
  isLong ? ethers.MaxUint256 : 0n,  // acceptablePrice
  ethers.ZeroHash, // referralCode
  ethers.ZeroAddress // callbackTarget
);
```

**Execution Status Query** (HTTP API)

```javascript
// POST https://api.deriw.com/client/position_router/tx_status
// body: { address, tx_hash, type: 0 }  // type: 0=open, 1=close
// status: 1=created, 2=completed, 3=failed, 4=cancelled, 5=retrying
```

---

## Workflow C: Limit Order Management

Use for: limit open, limit close, cancel orders.

**Contract**: OrderBook `0x86A0D906c6375846b05a0EF20931c1B4d2489C13`

**Using Scripts**

```bash
# Limit open
PRIVATE_KEY=xxx node scripts/create-limit-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove>

# Limit close
PRIVATE_KEY=xxx node scripts/create-limit-close.js <indexToken> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove> [collateralDelta_usd]
```

**triggerAbove Explanation**

| triggerAbove | Trigger Condition | Typical Use |
|---|---|---|
| `true` | Price breaks above trigger | Long take-profit / Short stop-loss |
| `false` | Price breaks below trigger | Long stop-loss / Short take-profit |

**lever Calculation**

```javascript
// Open
const lever = (sizeDelta * 10000n) / ethers.parseUnits(amountInStr, 30);
// Close: fixed 10000n (1x, meaning close only without adjusting leverage)
```

**Cancel Orders**

```javascript
await orderBook.cancelIncreaseOrder(orderIndex);  // Cancel limit open order
await orderBook.cancelDecreaseOrder(orderIndex);  // Cancel limit close order
await orderBook.cancelMultiple([...increaseIndexes], [...decreaseIndexes]); // Batch cancel
```

---

## Workflow D: Fund Pool Operations

Use for: Fund Pool V2 deposits, claim rewards, compound.

**Contracts**

| Contract | Address |
|---|---|
| FundRouterV2 | `0x3D343Fc0F6c6D2E047ec5e16e39A9b6A2031B9Ac` |
| PoolDataV2 | `0x305507D45D5441B81F5dD8FF9f00f65e0B392e86` |
| FundReader | `0x4D778dE09f5C043677bd18888114A9a0911dCE96` |

**Using Scripts**

```bash
# Deposit to fund pool
PRIVATE_KEY=xxx node scripts/fund-deposit.js <poolAddress> <pid> <amount_usdt>
```

**Common Operations**

```javascript
// Query current period ID
const pid = await poolDataV2.currPeriodID(poolAddress);

// Deposit (amount unit: 1e6 USDT, isResubmit=false means new deposit)
await fundRouterV2.deposit(poolAddress, pid, amount, false);

// Claim single period rewards
await fundRouterV2.claim(poolAddress, pid);

// Batch claim
await fundRouterV2.batchClaim(poolAddress, [pid1, pid2]);

// Compound to next period
await fundRouterV2.compoundToNext(poolAddress, pid, 1);
```

**Query Fund Pool List** (HTTP API)

```javascript
// GET https://api.deriw.com/client/foundpool/lists?status=2
// Returns all running pools with pool address, p_id, apr, profit, etc.
```

---

## Workflow E: Meme Pool Operations

Use for: Meme Pool deposits, claim rewards, create Meme pools.

**Contracts**

| Contract | Address |
|---|---|
| MemeRouter | `0xf128817F665E8469BBC3d6f2ade7f073180a010E` |
| MemeData | `0xA4DE9E445C06A0d091a3cdA0661C7B5a5A1fAec8` |
| MemeFactory | `0x363d1d8a71A5e1E6F6528432A59541bb2848B07e` |

**Common Operations**

```javascript
// Query Meme pool address (by token address)
const pool = await memeData.tokenToPool(tokenAddress);

// Deposit into Meme pool (need to approve USDT to MemeRouter first)
await memeRouter.deposit(pool, amount); // amount: 1e6 USDT

// Claim rewards
await memeRouter.claim(pool, amount);
await memeRouter.claimAll();

// Withdraw after expiry (call MemePool contract)
const memePool = new ethers.Contract(pool, MemePoolABI, wallet);
await memePool.withdraw();

// Create Meme pool (whitelist required)
await memeFactory.createPool(tokenAddress);
```

**Query Meme Pools** (HTTP API)

```javascript
// GET https://api.deriw.com/client/memepool/lists
// GET https://api.deriw.com/client/memepool/deposit?user=<address>
```

---

## Workflow F: Cross-Chain Operations

### L2 → L3 (Arbitrum → DERIW Chain Deposit)

> **Switch network to Arbitrum (Chain ID: 42161)**

```bash
DERIW_RPC_URL=<Arbitrum RPC> PRIVATE_KEY=xxx node scripts/crosschain-deposit.js <amount_usdt>
```

**Contract**: UserL2ToL3Router `0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325` (on Arbitrum)

```javascript
// Query fee (ETH)
const fee = await router.getFee(USDT_L2, amount);

// Initiate deposit (amount: 1e6 USDT)
const MAX_GAS   = 300000n;
const GAS_PRICE = 1000000000n; // 1 gwei
const data = ethers.AbiCoder.defaultAbiCoder().encode(['uint256', 'bytes'], [fee, '0x']);
await router.outboundTransfer(USDT_L2, wallet.address, amount, MAX_GAS, GAS_PRICE, data, { value: fee });
// Arrival usually takes 5-15 minutes
```

### L3 → L2 (DERIW Chain → Arbitrum Withdrawal)

> **Initiated on DERIW Chain (Chain ID: 2885)**

```bash
PRIVATE_KEY=xxx node scripts/crosschain-withdraw.js <amount_usdt>
```

**Contract**: UserL3ToL2Router `0x8fb358679749FD952Ea5f090b0eA3675722B08F5` (DERIW Chain)

```javascript
// Withdrawal requires EIP-712 signature, Message contains 8 fields (transactionType/from/token/l2Token/destination/amount/deadline/chain)
// Enum values: transactionType="Withdraw USDT", chain="DeriW Chain" (production) / "DeriW Devnet" (dev)
// See scripts/crosschain-withdraw.js for full implementation and references/addresses.md #Enum Constants
// Arrival usually takes 15-60 minutes (Arbitrum confirmation)
```

---

## Workflow G: HTTP API Query

Use for: fetching K-line data, market info, fund pool lists, referral data, etc.

**Base URL**: `https://api.deriw.com`

**Common Endpoints**

```bash
# K-line data
GET /client/candles?symbol=BTC&period=1h&limit=100

# Real-time prices for all tokens
GET /client/coins

# Market overview (long/short positions, volume)
GET /client/coin_market/info?sort_by=volume_day

# Market order execution status
POST /client/position_router/tx_status
body: { "address": "0x...", "tx_hash": "0x...", "type": 0 }

# Fund pool list
GET /client/foundpool/lists?status=2

# My fund pool records
GET /client/foundpool/deposit?user=<address>

# Meme pool list
GET /client/memepool/lists

# Referral user info
GET /client/invite_return/v2/user_info?account=<address>

# Referral records
GET /client/invite_return/v2/invite_return_records?account=<address>&page_index=1&page_size=20
```

Full API documentation: `references/api.md`.

---

## Constants Reference

```javascript
// ── Production (DERIW Chain, Chain ID: 2885) ─────────────────────────────
const VAULT          = '0xbd36B94f0b5A6F75dABa6e11ef3c383294470653';
const POSITION_ROUTER= '0x80257F37d327FA0EF464eFa64DdFb755dE111262';
const ORDER_BOOK     = '0x86A0D906c6375846b05a0EF20931c1B4d2489C13';
const USDT           = '0x3B11A54514A708CC2261f4B69617910E172a90B3'; // L3 USDT (1e6)
const FUND_ROUTER    = '0x3D343Fc0F6c6D2E047ec5e16e39A9b6A2031B9Ac';
const POOL_DATA      = '0x305507D45D5441B81F5dD8FF9f00f65e0B392e86';
const MEME_ROUTER    = '0xf128817F665E8469BBC3d6f2ade7f073180a010E';
const L3_WITHDRAW    = '0x8fb358679749FD952Ea5f090b0eA3675722B08F5';
const DERIW_RPC      = 'https://rpc.deriw.com';
const API_BASE       = 'https://api.deriw.com';

// ── Dev Chain ────────────────────────────────────────────────────────────
const DEV_VAULT           = '0x75Da7523f99bA38a8cAD831EbE2F09aDF5896d89';
const DEV_POSITION_ROUTER = '0x12f0C0fb9548EeB2DAa379d10C7CdCB63f6848F9';
const DEV_ORDER_BOOK      = '0x18c6d9d1f9a1d6b9b3fA6d104f9A0d8efa7C9689';
const DEV_ROUTER          = '0x23D9D11717a5CC9A90A7982445452e225060B511'; // transferFrom by Router
const DEV_USDT            = '0x12530882c64B1c22dAdf2F60639145029c5081Da'; // Dev USDT (1e6)
const DEV_FUND_ROUTER     = '0x324D847bc335032855972DA8d2f825BF7df14dCD';
const DEV_POOL_DATA       = '0xf0290fAc0B56E0F9EB09abdc24C0713Ce4D96116';
const DEV_MEME_ROUTER     = '0xeDa46Dc1f8A64C7F5C811cb2dE1cC775b04A0195';
const DEV_MEME_DATA       = '0xa4E451aE6C7e80E5587949CB557BeB700f0500A1';
const DEV_MEME_FACTORY    = '0x4C74F6e60736130247c8b53807b627FeD558cA77'; // updated
const DEV_L3_WITHDRAW     = '0x32068069f13191B57c03Eee8531a8C82b26d12B9';
const DEV_VAULT_PRICE_FEED= '0x843a577B32F280518E8dF305D8AD469111279135';
const DEV_VAULT_READER    = '0xfe36652B1456161597BbfE5365f3c55dDC3d139C'; // updated
const DEV_PHASE           = '0xaA71758134ea73Ad47ff04104b96986C5C3BBd16'; // liquidity / OI (room mode)
const DEV_SLIPPAGE        = '0x3600Cc37027146d0E9cf0E146D21390CFF474d75';
const DEV_RPC             = 'https://rpc.dev.deriw.com';
const DEV_API_BASE        = 'https://testgmxapi.weequan.cyou';

// ── Arbitrum L2 ──────────────────────────────────────────────────────────
const L2_DEPOSIT     = '0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325'; // Production
const DEV_L2_DEPOSIT = '0x81A88de21De37A025660D746164A9AB013822263'; // Dev
const USDT_ARB       = '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'; // Arbitrum USDT

// ── Edge Hour ─────────────────────────────────────────────────────────────
const EDGE_CHALLENGE_MANAGER = '0xBb1785B6A90819C11b8467ff85652661BE0286db'; // Production
const EDGE_LP_VAULT          = '0x29F463c832C03076ab2cB9734fD6C0e3B135B00b'; // Production
const EDGE_PRICE_ORACLE      = '0x493De553C9948f463f31249833D4d02D6DF9d0cB'; // Production
const DEV_EDGE_CHALLENGE_MANAGER = '0x086603940a23464A60ABeBcD887524eD3b0f3150'; // Dev
const DEV_EDGE_LP_VAULT          = '0x2eB88D51C30708f8539c949855F39861e7f3adB5'; // Dev
const DEV_EDGE_PRICE_ORACLE      = '0x6dc3EAcAA36adA3f32Fefe3522361E1Fb6D23EcC'; // Dev
// ABIs: assets/edge_hour/{ChallengeManager,LPVault,PriceOracle}.json
// Scripts: scripts/edge_hour/{query-state,start-challenge,open-position,close-position,claim-reward,lpvault-deposit,lpvault-withdraw,query-api}.js

// ── Room Mode ─────────────────────────────────────────────────────────────
// Room mode has NO dedicated contracts — it reuses these existing ones for its
// on-chain reads/writes. Data surface is mostly HTTP (/client/room/*). See Workflow I.
//                          Production                                     Dev
const ROOM_PHASE        = '0x463c7e40A4eE5e4E2072055aFa14a15E88b38F5a'; // dev 0xaA71758134ea73Ad47ff04104b96986C5C3BBd16 — getValue/getLongShortValue
const ROOM_MEME_DATA    = '0xA4DE9E445C06A0d091a3cdA0661C7B5a5A1fAec8'; // dev 0xa4E451aE6C7e80E5587949CB557BeB700f0500A1 — getChannelOutAmount (pool equity)
const ROOM_MEME_FACTORY = '0x363d1d8a71A5e1E6F6528432A59541bb2848B07e'; // dev 0x4C74F6e60736130247c8b53807b627FeD558cA77 — channel pool (room) create/config
const ROOM_SLIPPAGE     = '0xAd3FAe555Ab3571a2886012DfFcc7C777eC11e7E'; // dev 0x3600Cc37027146d0E9cf0E146D21390CFF474d75 — getTokenMaxLeverage
// Vault (poolAmounts) and VaultUtils reused from the core constants above.
// Room pool address per host lives server-side (MemeFactory.createChannelPool); query via /client/room/pool-status.
// ABIs: assets/room/{Phase,Slippage,MemeFactory,MemeData,Vault,VaultUtils}.json
// Scripts: scripts/room/{query-api,query-state,pre-create}.js
```

---

---

## Workflow H: Edge Hour Operations

Use for: Edge Hour challenge trading competition (virtual balance), LP vault deposit/withdraw, query challenge state.

> **Edge Hour Overview**: Users pay a ticket fee (USDT) to enter a challenge. They trade with a virtual balance (10,000 USDT) within a time limit. If they meet the profit target, they claim a USDT reward from the LP vault. LPs deposit USDT into the vault to earn fee income.

### Contracts

| Contract | Production | Dev | Purpose |
|---|---|---|---|
| ChallengeManager | `0xBb1785B6A90819C11b8467ff85652661BE0286db` | `0x086603940a23464A60ABeBcD887524eD3b0f3150` | Challenge lifecycle, virtual trading |
| LPVault | `0x29F463c832C03076ab2cB9734fD6C0e3B135B00b` | `0x2eB88D51C30708f8539c949855F39861e7f3adB5` | LP deposit/withdraw (whitelist required) |
| PriceOracle | `0x493De553C9948f463f31249833D4d02D6DF9d0cB` | `0x6dc3EAcAA36adA3f32Fefe3522361E1Fb6D23EcC` | Token prices (1e18 precision) |

**ABI files**: `assets/edge_hour/ChallengeManager.json`, `LPVault.json`, `PriceOracle.json`

### Using Scripts

```bash
# Query contract state + templates (no private key needed)
DEV=true node scripts/edge_hour/query-state.js [account]

# Start a challenge (pay ticket fee in USDT)
DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/start-challenge.js <templateId> <ticketFee_usdt>

# Open a virtual position (no token transfer, uses virtual balance)
DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/open-position.js <challengeId> <indexToken> <sizeDelta_usdt> <collateral_usdt> <isLong>

# Close a virtual position
DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/close-position.js <challengeId> <indexToken> <isLong>

# Claim reward after challenge passes
DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/claim-reward.js <challengeId>

# LPVault deposit (requires whitelist by vault owner)
DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/lpvault-deposit.js <amount_usdt>

# LPVault withdraw
DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/lpvault-withdraw.js <amount_usdt | all>

# Batch API query (templates, challenge info, positions, history)
DEV=true node scripts/edge_hour/query-api.js <account> [challengeId]
```

### Key Parameters & Precision

| Parameter | Precision | Notes |
|---|---|---|
| `ticketFee` | `1e6` | Must be multiple of `ticketUnit` (5 USDT); max = template `maxTicketFee` |
| `sizeDelta` | `1e6` | Virtual position size in USDT (e.g. 1000 USDT = `1000000000`) |
| `collateralDelta` | `1e6` | Virtual collateral (e.g. 100 USDT = `100000000`) |
| Price (oracle) | `1e18` | `oracle.getPrice(indexToken)` returns price * 1e18 |
| Balance | `1e6` | `currentBalance`, `cappedEquity` from `getChallengeState` |
| LP shares | `1e18` | `vault.balanceOf(account)` |

### Challenge Status Enum

| Value | Name | Description |
|---|---|---|
| `0` | None | Not started / does not exist |
| `1` | Active | Challenge in progress |
| `2` | Passed | Profit target met, reward claimable |
| `3` | Failed | Time expired or drawdown exceeded |
| `4` | Claimed | Reward already claimed |

### ChallengeManager Key Methods

```javascript
// Check if user has active challenge
const [exists, challengeId] = await cm.getActiveChallengeId(userAddress);

// Get challenge template list
const len = await cm.getChallengeTemplateLength();
const template = await cm.getChallengeTemplate(templateId); // [params_tuple, isActive]

// Start challenge (approve USDT first; ticketFee = n × ticketUnit = n × 5 USDT)
await cm.startChallenge(templateId, ticketFee);

// Open virtual position (no USDT transfer)
await cm.increasePosition({ challengeId, indexToken, sizeDelta, collateralDelta, isLong });

// Close virtual position (full close)
await cm.closePosition({ challengeId, indexToken, isLong });

// Get current challenge state
const state = await cm.getChallengeState(challengeId);
// state[1]=status, state[3]=tradeCount, state[5]=expiryTime, state[7]=currentBalance(1e6)

// Claim reward (status must be 2=Passed)
await cm.claimReward(challengeId);

// Get position key + position data
const key = await cm.getPositionKey(challengeId, indexToken, isLong);
const pos = await cm.getPosition(challengeId, key); // pos.size, pos.averagePrice, pos.collateral
```

### LPVault Key Methods

```javascript
// deposit USDT (requires whitelist)
await vault.deposit(amountUsdt); // 1e6 USDT

// withdraw USDT (burns LP shares)
await vault.withdraw(amountUsdt); // query maxWithdraw(user) first

// query stats
const stats = await vault.getStatistics(); // totalFees, totalRewards, netProfit, currentBalance, pending
const sharePrice = await vault.sharePrice(); // 1e18
```

### Edge Hour HTTP API

```bash
# Template list
GET /client/edge_hour/templates

# LPVault stats
GET /client/edge_hour/lpvault

# User's current/latest challenge
GET /client/edge_hour/challenge/info?account=<address>

# Open positions in a challenge
GET /client/edge_hour/positions?account=<address>&challenge_id=<id>

# Closed position history
GET /client/edge_hour/close_records?account=<address>&challenge_id=<id>

# User challenge history (paginated)
GET /client/edge_hour/user/challenges?account=<address>&page_index=1&page_size=20

# User lifetime stats (win rate, total profit, best ROI)
GET /client/edge_hour/user/overview?account=<address>

# Challenge detail (public, cached 1s)
GET /client/edge_hour/challenge_detail?challenge_id=<id>
```

### Important Notes

1. **Virtual trading**: `increasePosition`/`closePosition` do NOT transfer USDT — all P&L is tracked as virtual balance in the contract
2. **Minimum trade value**: `cm.minPositionValueUsd()` (default 10 USDT at 1e6), `sizeDelta` must exceed this
3. **Leverage limit**: `cm.challengeMaxLeverage(challengeId, indexToken)` — template defines max leverage (e.g. 2000 = 20x)
4. **Minimum hold time**: Template `minimum_holding_period` seconds between open and close counts as a valid trade
5. **LPVault whitelist**: `vault.deposit()` requires address in `vault.whitelist(addr)` — must be added by vault owner
6. **ticketUnit**: Always 5 USDT; ticketFee must be an exact multiple (5, 10, 15 ... up to template max)

---

---

## Workflow I: Room Operations

Use for: querying a host's **room** (channel liquidity pool) — deposits, TVL, pool equity, traders, positions, fee/TVL trends, pool status — and applying to become a host (create/reopen a room).

> **Room Overview**: A "room" is a **host-created isolated liquidity pool** (an on-chain *channel pool*). Traders (invitees) trade against the room's liquidity; the host earns a share of trading fees. A host has at most one active room, keyed by the **host/creator address** (`account`). Lifecycle: PreCreate → Created → Running → Cooldown → Closed.

> **Not a new contract set**: Room mode is mostly an **HTTP read layer** plus one signed write (`pre-create`). On-chain reads reuse existing contracts — **Phase** (liquidity/OI), **MemeData** (`getChannelOutAmount` → pool equity), **MemeFactory** (channel-pool create/config), **Vault** (`poolAmounts` → TVL lockup), **VaultUtils**, **Slippage**. The per-room pool address lives server-side (from `MemeFactory.createChannelPool`); fetch it via `/client/room/pool-status`.

### Contracts (reused — no dedicated deployment)

| Contract | Production | Dev | Room use |
|---|---|---|---|
| Phase | `0x463c7e40A4eE5e4E2072055aFa14a15E88b38F5a` | `0xaA71758134ea73Ad47ff04104b96986C5C3BBd16` | `getValue`, `getLongShortValue` (liquidity / OI) |
| MemeData | `0xA4DE9E445C06A0d091a3cdA0661C7B5a5A1fAec8` | `0xa4E451aE6C7e80E5587949CB557BeB700f0500A1` | `getChannelOutAmount` (pool equity → USDT) |
| MemeFactory | `0x363d1d8a71A5e1E6F6528432A59541bb2848B07e` | `0x4C74F6e60736130247c8b53807b627FeD558cA77` | `createChannelPool`, `getChannelPoolTargetToken`, `channelOwnerPool` |
| Slippage | `0xAd3FAe555Ab3571a2886012DfFcc7C777eC11e7E` | `0x3600Cc37027146d0E9cf0E146D21390CFF474d75` | `getTokenMaxLeverage` |
| Vault | `0xbd36B94f0b5A6F75dABa6e11ef3c383294470653` | `0x75Da7523f99bA38a8cAD831EbE2F09aDF5896d89` | `poolAmounts` (TVL lockup, 1e6) |

**ABI files**: `assets/room/{Phase,Slippage,MemeFactory,MemeData,Vault,VaultUtils}.json`

### Using Scripts

```bash
# Batch-query all room HTTP endpoints for a host (detail, traders, positions, close history, LP changes, fee/TVL, pool-status, coins)
DEV=true node scripts/room/query-api.js <hostAccount>

# On-chain reads behind room (Phase liquidity/OI, Slippage max leverage, pool target token, Vault TVL lockup)
DEV=true node scripts/room/query-state.js <hostAccount> [indexToken] [isLong]

# Apply to become a host / (re)open a room — personal_sign + POST /client/room/pre-create
DEV=true PRIVATE_KEY=0x... node scripts/room/pre-create.js <capacityBaseMode>   # 1=Principal, 2=Equity
```

### HTTP Endpoints

All keyed by `account` = **host address**. Success `code: 0`; room-not-found `code: 100009`. Base URL: prod `https://api.deriw.com`, dev `https://testgmxapi.weequan.cyou`.

```bash
GET  /client/room/detail?account=<host>                    # deposits, TVL, pool equity, OI, traders, PnL, revenue, health
GET  /client/room/pool-status?account=<host>               # status, capacity_base_mode, pool addr, withdrawal limits
GET  /client/room/traders?account=<host>&page_index=1&page_size=20
GET  /client/room/open-positions?account=<host>&page_index=1&page_size=20
GET  /client/room/close-position-history?account=<host>&page_index=1&page_size=20
GET  /client/room/lp-change?account=<host>&page_index=1&page_size=20   # host add/remove liquidity events
GET  /client/room/fee?account=<host>&limit=10              # per-day fee-share trend
GET  /client/room/tvl?account=<host>&limit=10              # per-day TVL trend
GET  /client/room/coins?account=<host>                     # tradeable coins in the room
GET  /client/room/liquidity?account=<host>&index_token=<addr>&is_long=<bool>  # room vs deriwpool available liquidity
GET  /client/room/blocked-users?account=<host>&page_index=1&page_size=20
POST /client/room/pre-create   body { account, capacity_base_mode, message }  # create/reopen (signed)
```

**Public OpenAPI mirrors** (no auth, snake_case, `IsHexAddress` validated): `GET /openapi/v1/rooms/{open_positions,close_position_history,lp_change,fee,tvl,detail,traders}` — identical response shapes to `/client/room/*`. Full field lists in `references/api.md` §3.13.

### Key Parameters & Notes

| Item | Value / Precision | Notes |
|---|---|---|
| `account` | address | The **host/creator** address (NOT a trader wallet) — locates the active room |
| `capacity_base_mode` | `1`=Principal, `2`=Equity | Room capacity accounting mode (pre-create) |
| pre-create `message` | hex | `personal_sign("Apply to become a host")` (EIP-191); backend `VerifyPersonalSignature` |
| amounts / PnL / fees | string | Already precision-shifted by the server; display as-is |
| `pool_equity`, `total_tvl` (detail) | decimal string | pool equity = `MemeData.getChannelOutAmount`; TVL = `Vault.poolAmounts` (1e6) |
| pagination | `page_size` ≤ 100 | default 20; openapi clamps offset ≤ 10000 |

1. **Read-mostly**: every endpoint except `pre-create` is a read. `pre-create` triggers backend room creation (a real state change) — run only as the host.
2. **One room per host**: located via creator address; if none exists, detail/fee/tvl return `param err` (100438) on `/client`, unified `100009` on `/openapi`.
3. **can_remove_liquidity gate**: `pool-status.can_remove_liquidity` requires cooldown reached, chain not paused, no pending rebates, all orders cancelled, positions cleared.

---

## References

- `references/addresses.md` — Full contract addresses + token addresses
- `references/contracts.md` — Detailed contract method descriptions
- `references/api.md` — Complete HTTP API documentation
- `scripts/` — Ready-to-run ethers.js v6 example scripts (8 top-level + 8 edge_hour + 3 room)
- `scripts/edge_hour/` — Edge Hour specific scripts (8 total)
- `scripts/room/` — Room mode scripts (`query-api`, `query-state`, `pre-create`)
- `assets/` — Contract ABI JSON files (38 top-level + 3 edge_hour + 6 room)
