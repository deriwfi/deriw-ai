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
| Reader | `0x84C1F027f05E2c944D0Ccee94d29C34Ea3Fcf9eD` | Batch reads |
| VaultReader | `0x1A635dCb4254965432271b49D2E347615c70383a` | Token comprehensive data |
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
const DEV_L3_WITHDRAW     = '0x32068069f13191B57c03Eee8531a8C82b26d12B9';
const DEV_VAULT_PRICE_FEED= '0x843a577B32F280518E8dF305D8AD469111279135';
const DEV_RPC             = 'https://rpc.dev.deriw.com';
const DEV_API_BASE        = 'https://testgmxapi.weequan.cyou';

// ── Arbitrum L2 ──────────────────────────────────────────────────────────
const L2_DEPOSIT     = '0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325'; // Production
const DEV_L2_DEPOSIT = '0x81A88de21De37A025660D746164A9AB013822263'; // Dev
const USDT_ARB       = '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'; // Arbitrum USDT
```

---

## References

- `references/addresses.md` — Full contract addresses + token addresses
- `references/contracts.md` — Detailed contract method descriptions
- `references/api.md` — Complete HTTP API documentation
- `scripts/` — Ready-to-run ethers.js v6 example scripts (8 total)
- `assets/` — Contract ABI JSON files (36 total)
