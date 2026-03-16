# DERIW DEX — Claude Code Skill

一个用于 [DERIW DEX](https://deriw.com) 链上操作的 Claude Code Skill，支持开仓/平仓、限价单、资金池、跨链充提等操作。底层脚本基于 **ethers.js v6**，同时支持线上网络和开发网（`DEV=true`）。

---

## 安装

### 1. 前置条件

- [Claude Code](https://github.com/anthropics/claude-code) 已安装
- Node.js 18+（用于运行链上脚本）

### 2. 克隆到 Claude Code 用户命令目录

```bash
# 进入 Claude Code 用户命令目录（自动对所有项目生效）
cd ~/.claude/commands

# 克隆仓库，将 skill 放到 deriw/ 子目录
git clone <repo-url> deriw
```

或者放到项目级命令目录（仅对当前项目生效）：

```bash
cd <your-project>/.claude/commands
git clone <repo-url> deriw
```

### 3. 安装依赖

```bash
cd ~/.claude/commands/deriw   # 或项目级路径
npm install
```

### 4. 验证安装

在任意项目中打开 Claude Code，输入：

```
/deriw 查询一下 BTC 当前价格
```

---

## 使用方式

在 Claude Code 中通过 `/deriw <描述>` 触发，用自然语言描述操作意图即可。

所有链上脚本均通过 `PRIVATE_KEY` 环境变量读取私钥，在运行前 export：

```bash
export PRIVATE_KEY=0x你的私钥
```

使用开发网时额外加上 `DEV=true`：

```bash
export DEV=true
```

---

## 功能速览

### 查询

```
/deriw 查询 0xAbc... 的 BTC 多仓位
/deriw 查询当前 ETH 价格
```

对应脚本：

```bash
DEV=true node scripts/query-position.js <account> <indexToken> <isLong>
```

---

### 市价开仓 / 平仓

```
/deriw 用 100 USDT 保证金，开 BTC 10 倍多仓，仓位大小 1000 USD
/deriw 平掉我的 BTC 多仓
```

对应脚本：

```bash
# 开仓
PRIVATE_KEY=xxx node scripts/create-market-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong>

# 平仓
PRIVATE_KEY=xxx node scripts/create-market-close.js <indexToken> <sizeDelta_usd> <isLong>
```

---

### 限价开仓 / 平仓

```
/deriw BTC 跌到 80000 时开多 1000 USD
/deriw 挂一个 BTC 涨到 100000 的止盈单
```

对应脚本：

```bash
# 限价开仓
PRIVATE_KEY=xxx node scripts/create-limit-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove>

# 限价平仓
PRIVATE_KEY=xxx node scripts/create-limit-close.js <indexToken> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove>
```

---

### 资金池存入

```
/deriw 存 100 USDT 到资金池
```

对应脚本（`pid` 从 API 或合约 `currPeriodID` 获取）：

```bash
DEV=true PRIVATE_KEY=xxx node scripts/fund-deposit.js <poolAddress> <pid> <amount_usdt>
```

---

### 跨链充值（Arbitrum → DERIW 链）

```
/deriw 从 Arbitrum 充值 100 USDT 到 DERIW 链
```

对应脚本（需在 Arbitrum 网络运行）：

```bash
# 线上
PRIVATE_KEY=xxx node scripts/crosschain-deposit.js <amount_usdt>

# 开发网（Arbitrum Sepolia）
DEV=true PRIVATE_KEY=xxx node scripts/crosschain-deposit.js <amount_usdt>
```

---

### 跨链提现（DERIW 链 → Arbitrum）

```
/deriw 提现 50 USDT 到 Arbitrum
```

对应脚本（在 DERIW 链上运行）：

```bash
# 线上
PRIVATE_KEY=xxx node scripts/crosschain-withdraw.js <amount_usdt>

# 开发网
DEV=true PRIVATE_KEY=xxx node scripts/crosschain-withdraw.js <amount_usdt>
```

---

## 网络配置

| 网络 | RPC | Chain ID |
|---|---|---|
| DERIW 链（线上）| `https://rpc.deriw.com` | `2885` |
| DERIW Dev 链 | `https://rpc.dev.deriw.com` | — |
| Arbitrum（线上）| `https://arb1.arbitrum.io/rpc` | `42161` |
| Arbitrum Sepolia（开发网）| `https://rpc-arbitrum-sepolia.deriw.com` | `421614` |

---

## 参考文档

- [`references/addresses.md`](references/addresses.md) — 完整合约地址 + 代币地址
- [`references/contracts.md`](references/contracts.md) — 合约方法说明
- [`references/api.md`](references/api.md) — HTTP API 文档
- [`scripts/`](scripts/) — 可直接运行的 ethers.js v6 脚本（8 个）
- [`assets/`](assets/) — 合约 ABI JSON 文件

---

## 注意事项

- **私钥安全**：`PRIVATE_KEY` 仅通过环境变量传入，请勿写入任何文件
- **开发网**：加 `DEV=true` 切换到测试网，开发网 `gasPrice=0`，无需 ETH
- **跨链到账时间**：充值 5-15 分钟，提现 15-60 分钟（Arbitrum 确认）
