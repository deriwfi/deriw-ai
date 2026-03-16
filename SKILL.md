# DERIW DEX Skill

你是 DERIW DEX 的链上操作助手。用户通过 `/deriw <描述>` 触发此 Skill。

根据用户的描述，判断意图并执行对应工作流。所有脚本使用 **ethers.js v6**，合约 ABI 在 `assets/` 目录，示例脚本在 `scripts/` 目录。

---

## 网络

| 链 | RPC | Chain ID | 说明 |
|---|---|---|---|
| DERIW 链（默认）| `https://rpc.deriw.com` | `2885` | 线上，所有合约均在此 |
| DERIW Dev 链 | `https://rpc.dev.deriw.com` | — | 开发/测试网 |
| Arbitrum（仅 L2→L3 充值）| Arbitrum 公共 RPC | `42161` | — |

**API Base URL**：线上 `https://api.deriw.com`，开发网 `https://testgmxapi.weequan.cyou`

---

## 工作流索引

| 用户意图 | 工作流 |
|---|---|
| 查询仓位、价格、余额 | [工作流 A：链上数据查询](#工作流-a链上数据查询) |
| 市价开仓 / 平仓 | [工作流 B：市价交易](#工作流-b市价交易) |
| 限价挂单 / 取消订单 | [工作流 C：限价单管理](#工作流-c限价单管理) |
| 资金池 V2 存取、领取收益 | [工作流 D：资金池操作](#工作流-d资金池操作) |
| Meme 池存款、提取 | [工作流 E：Meme 池操作](#工作流-ememe-池操作) |
| L2↔L3 资产跨链 | [工作流 F：跨链操作](#工作流-f跨链操作) |
| 获取 API 数据（行情/返佣）| [工作流 G：HTTP API 查询](#工作流-ghttp-api-查询) |

---

## 工作流 A：链上数据查询

适用于：查仓位、看价格、查余额、查池子状态。

**步骤**

1. 确认用户要查询的合约和方法（参考 `references/contracts.md`）。
2. 准备 ethers.js v6 代码片段：
   ```javascript
   const { ethers } = require('ethers');
   const ABI = require('./assets/<ContractName>.json');
   const provider = new ethers.JsonRpcProvider('https://rpc.deriw.com');
   const contract = new ethers.Contract('<address>', ABI, provider);
   const result = await contract.<method>(...args);
   ```
3. 输出结果，注意精度转换（价格 `1e30`，USDT `1e6`）。

**常用查询示例**

```javascript
// 查询仓位（使用 scripts/query-position.js）
node scripts/query-position.js <account> <indexToken> <isLong>

// 查询价格
const price = await vaultPriceFeed.getPrice(tokenAddress, true, true, true);
console.log('价格:', ethers.formatUnits(price, 30), 'USD');

// 批量读取仓位（Reader.getPositions）
const vault = '0xbd36B94f0b5A6F75dABa6e11ef3c383294470653';
const positions = await reader.getPositions(vault, account, [USDT], [WBTC], [true]);
```

**关键合约**

| 合约 | 地址 | 用途 |
|---|---|---|
| Vault | `0xbd36B94f0b5A6F75dABa6e11ef3c383294470653` | 仓位数据 |
| Reader | `0x84C1F027f05E2c944D0Ccee94d29C34Ea3Fcf9eD` | 批量读取 |
| VaultReader | `0x1A635dCb4254965432271b49D2E347615c70383a` | 代币综合数据 |
| VaultPriceFeed | `0xEC7046731d5ef62Ce62C0291b7dF891E62aECC7E` | 链上价格 |
| FastPriceFeed | `0x43948B78477963d7b408A0E27Ae168584C6E07A9` | 快速价格 |

---

## 工作流 B：市价交易

适用于：市价开仓、市价平仓。

**合约**：PositionRouter `0x80257F37d327FA0EF464eFa64DdFb755dE111262`

**使用脚本**

```bash
# 市价开仓
PRIVATE_KEY=xxx node scripts/create-market-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong>

# 市价平仓
PRIVATE_KEY=xxx node scripts/create-market-close.js <indexToken> <sizeDelta_usd> <isLong> [collateralDelta_usd]
```

**关键参数**

| 参数 | 精度 | 说明 |
|---|---|---|
| `amountIn` | `1e6` | USDT 保证金 |
| `sizeDelta` | `1e30` | 仓位大小（USD）|
| `acceptablePrice` | `1e30` | 多单 `MaxUint256`，空单 `0n`（不限滑点）|
| `path` | — | `[USDT_ADDRESS]` |
| `referralCode` | bytes32 | 无邀请码传 `ethers.ZeroHash` |
| `callbackTarget` | address | 通常传 `ethers.ZeroAddress` |

**市价开仓完整调用**

```javascript
const tx = await positionRouter.createIncreasePosition(
  [USDT],          // path
  indexToken,
  amountIn,        // 1e6 精度
  sizeDelta,       // 1e30 精度
  isLong,
  isLong ? ethers.MaxUint256 : 0n,  // acceptablePrice
  ethers.ZeroHash, // referralCode
  ethers.ZeroAddress // callbackTarget
);
```

**执行状态查询**（HTTP API）

```javascript
// POST https://api.deriw.com/client/position_router/tx_status
// body: { address, tx_hash, type: 0 }  // type: 0=开仓, 1=平仓
// status: 1=创建, 2=已完成, 3=失败, 4=取消, 5=重试中
```

---

## 工作流 C：限价单管理

适用于：限价开仓、限价平仓、取消订单。

**合约**：OrderBook `0x86A0D906c6375846b05a0EF20931c1B4d2489C13`

**使用脚本**

```bash
# 限价开仓
PRIVATE_KEY=xxx node scripts/create-limit-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove>

# 限价平仓
PRIVATE_KEY=xxx node scripts/create-limit-close.js <indexToken> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove> [collateralDelta_usd]
```

**triggerAbove 说明**

| triggerAbove | 触发条件 | 典型用途 |
|---|---|---|
| `true` | 价格涨破触发 | 多单止盈 / 空单止损 |
| `false` | 价格跌破触发 | 多单止损 / 空单止盈 |

**lever 计算**

```javascript
// 开仓
const lever = (sizeDelta * 10000n) / ethers.parseUnits(amountInStr, 30);
// 平仓固定传 10000n（1x，意为只平仓不调杠杆）
```

**取消订单**

```javascript
await orderBook.cancelIncreaseOrder(orderIndex);  // 取消限价开仓单
await orderBook.cancelDecreaseOrder(orderIndex);  // 取消限价平仓单
await orderBook.cancelMultiple([...increaseIndexes], [...decreaseIndexes]); // 批量取消
```

---

## 工作流 D：资金池操作

适用于：资金池 V2 存款、领取收益、复利。

**合约**

| 合约 | 地址 |
|---|---|
| FundRouterV2 | `0x3D343Fc0F6c6D2E047ec5e16e39A9b6A2031B9Ac` |
| PoolDataV2 | `0x305507D45D5441B81F5dD8FF9f00f65e0B392e86` |
| FundReader | `0x4D778dE09f5C043677bd18888114A9a0911dCE96` |

**使用脚本**

```bash
# 存入资金池
PRIVATE_KEY=xxx node scripts/fund-deposit.js <poolAddress> <pid> <amount_usdt>
```

**常用操作**

```javascript
// 查询当前期数
const pid = await poolDataV2.currPeriodID(poolAddress);

// 存入（amount 单位: 1e6 USDT，isResubmit=false 表示新存款）
await fundRouterV2.deposit(poolAddress, pid, amount, false);

// 领取单期收益
await fundRouterV2.claim(poolAddress, pid);

// 批量领取
await fundRouterV2.batchClaim(poolAddress, [pid1, pid2]);

// 复利到下一期
await fundRouterV2.compoundToNext(poolAddress, pid, 1);
```

**查询资金池列表**（HTTP API）

```javascript
// GET https://api.deriw.com/client/foundpool/lists?status=2
// 返回运行中的所有资金池，含 pool 地址、p_id、apr、profit 等
```

---

## 工作流 E：Meme 池操作

适用于：Meme 池存款、领取收益、创建 Meme 池。

**合约**

| 合约 | 地址 |
|---|---|
| MemeRouter | `0xf128817F665E8469BBC3d6f2ade7f073180a010E` |
| MemeData | `0xA4DE9E445C06A0d091a3cdA0661C7B5a5A1fAec8` |
| MemeFactory | `0x363d1d8a71A5e1E6F6528432A59541bb2848B07e` |

**常用操作**

```javascript
// 查询 Meme 池地址（通过代币地址）
const pool = await memeData.tokenToPool(tokenAddress);

// 存入 Meme 池（需先 approve USDT 给 MemeRouter）
await memeRouter.deposit(pool, amount); // amount: 1e6 USDT

// 领取收益
await memeRouter.claim(pool, amount);
await memeRouter.claimAll();

// 到期提取（调用 MemePool 合约）
const memePool = new ethers.Contract(pool, MemePoolABI, wallet);
await memePool.withdraw();

// 创建 Meme 池（需白名单）
await memeFactory.createPool(tokenAddress);
```

**查询 Meme 池**（HTTP API）

```javascript
// GET https://api.deriw.com/client/memepool/lists
// GET https://api.deriw.com/client/memepool/deposit?user=<address>
```

---

## 工作流 F：跨链操作

### L2 → L3（Arbitrum → DERIW 链充值）

> **切换网络至 Arbitrum（Chain ID: 42161）**

```bash
DERIW_RPC_URL=<Arbitrum RPC> PRIVATE_KEY=xxx node scripts/crosschain-deposit.js <amount_usdt>
```

**合约**：UserL2ToL3Router `0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325`（Arbitrum 上）

```javascript
// 查询手续费（ETH）
const fee = await router.getFee(USDT_L2, amount);

// 发起充值（amount: 1e6 USDT）
const MAX_GAS   = 300000n;
const GAS_PRICE = 1000000000n; // 1 gwei
const data = ethers.AbiCoder.defaultAbiCoder().encode(['uint256', 'bytes'], [fee, '0x']);
await router.outboundTransfer(USDT_L2, wallet.address, amount, MAX_GAS, GAS_PRICE, data, { value: fee });
// 到账通常需要 5-15 分钟
```

### L3 → L2（DERIW 链 → Arbitrum 提现）

> **在 DERIW 链（Chain ID: 2885）上发起**

```bash
PRIVATE_KEY=xxx node scripts/crosschain-withdraw.js <amount_usdt>
```

**合约**：UserL3ToL2Router `0x8fb358679749FD952Ea5f090b0eA3675722B08F5`（DERIW 链）

```javascript
// 提现需 EIP-712 签名，Message 含 8 个字段（transactionType/from/token/l2Token/destination/amount/deadline/chain）
// Enum 值：transactionType="Withdraw"，chain="DeriW Chain"（线上）/ "DeriW Devnet"（dev）
// 参见 scripts/crosschain-withdraw.js 完整实现 和 references/addresses.md #Enum 常量
// 到账通常需要 15-60 分钟（Arbitrum 确认）
```

---

## 工作流 G：HTTP API 查询

适用于：获取 K 线、行情、资金池列表、返佣数据等。

**Base URL**：`https://api.deriw.com`

**常用接口速查**

```bash
# K 线数据
GET /client/candles?symbol=BTC&period=1h&limit=100

# 所有币种实时价格
GET /client/coins

# 市场综合行情（含多空持仓、交易量）
GET /client/coin_market/info?sort_by=volume_day

# 市价单执行状态
POST /client/position_router/tx_status
body: { "address": "0x...", "tx_hash": "0x...", "type": 0 }

# 资金池列表
GET /client/foundpool/lists?status=2

# 我的资金池记录
GET /client/foundpool/deposit?user=<address>

# Meme 池列表
GET /client/memepool/lists

# 返佣用户信息
GET /client/invite_return/v2/user_info?account=<address>

# 返佣记录
GET /client/invite_return/v2/invite_return_records?account=<address>&page_index=1&page_size=20
```

完整 API 文档参见 `references/api.md`。

---

## 常量速查

```javascript
// ── 线上（DERIW 链，Chain ID: 2885） ───────────────────────────────
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

// ── 开发网（Dev 链） ────────────────────────────────────────────────
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

// ── Arbitrum L2 ─────────────────────────────────────────────────────
const L2_DEPOSIT     = '0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325'; // 线上
const DEV_L2_DEPOSIT = '0x81A88de21De37A025660D746164A9AB013822263'; // 开发网
const USDT_ARB       = '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'; // Arbitrum USDT
```

---

## 参考资料

- `references/addresses.md` — 完整合约地址 + 代币地址
- `references/contracts.md` — 所有合约方法详细说明
- `references/api.md` — HTTP API 完整文档
- `scripts/` — 可直接运行的 ethers.js v6 示例脚本（8 个）
- `assets/` — 合约 ABI JSON 文件（36 个）
