# DERIW DEX — AI Coding Skill

An AI Coding Skill for on-chain operations on [DERIW DEX](https://deriw.com), supporting open/close positions, limit orders, fund pools, cross-chain deposits/withdrawals, and more. The underlying scripts are based on **ethers.js v6** and support both production network and devnet (`DEV=true`).

Supports **Claude Code**, **OpenClaw**, **Gemini CLI**, and **Codex**.

---

## Installation

> **Prerequisite for all platforms**: Node.js 18+ must be installed for running on-chain scripts.

### Claude Code

```bash
# Global (available across all projects)
cd ~/.claude/commands
git clone https://github.com/deriwfi/deriw-ai deriw
cd deriw && npm install
```

```bash
# Project-level (current project only)
cd <your-project>/.claude/commands
git clone https://github.com/deriwfi/deriw-ai deriw
cd deriw && npm install
```

Invoke via slash command:

```
/deriw query the current BTC price
```

---

### OpenClaw

```bash
# Global (available across all agents)
cd ~/.openclaw/skills
git clone https://github.com/deriwfi/deriw-ai deriw
cd deriw && npm install
```

```bash
# Project-level (current workspace only)
cd <your-workspace>/skills
git clone https://github.com/deriwfi/deriw-ai deriw
cd deriw && npm install
```

OpenClaw auto-discovers skills on next session. Describe your intent naturally or use the slash command:

```
/deriw query the current BTC price
```

To add extra skill directories, configure `skills.load.extraDirs` in `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "load": {
      "extraDirs": ["/path/to/custom/skills"]
    }
  }
}
```

---

### Gemini CLI

```bash
# Global (available across all projects)
mkdir -p ~/.gemini/skills
cd ~/.gemini/skills
git clone https://github.com/deriwfi/deriw-ai deriw
cd deriw && npm install
```

```bash
# Project-level (current project only)
mkdir -p .gemini/skills
cd .gemini/skills
git clone https://github.com/deriwfi/deriw-ai deriw
cd deriw && npm install
```

Gemini CLI is model-invoked — describe your intent and the model automatically activates the skill via `activate_skill`. No slash command needed:

```
Deposit 100 USDT into the DERIW fund pool
```

---

### Codex

```bash
# Global — Codex scans ~/.agents/skills/ at startup
mkdir -p ~/.agents/skills
cd ~/.agents/skills
git clone https://github.com/deriwfi/deriw-ai deriw
cd deriw && npm install
```

Codex auto-discovers skills in `~/.agents/skills/` at startup. Describe your intent naturally or mention the skill by name:

```
Open a BTC long with 100 USDT margin on DERIW
```

To uninstall, remove the directory:

```bash
rm -rf ~/.agents/skills/deriw
```

---

## Usage

Describe your intent in natural language. Each platform has a slightly different invocation method:

| Platform | Invocation | Example |
|---|---|---|
| Claude Code | `/deriw <description>` | `/deriw open BTC long` |
| OpenClaw | `/deriw <description>` | `/deriw query ETH price` |
| Gemini CLI | Describe naturally (model-invoked) | `Withdraw 50 USDT to Arbitrum` |
| Codex | Describe naturally (model-invoked) | `Close my BTC position on DERIW` |

All on-chain scripts read the private key via the `PRIVATE_KEY` environment variable. Export it before running:

```bash
export PRIVATE_KEY=0xyour_private_key
```

For devnet, additionally set `DEV=true`:

```bash
export DEV=true
```

---

## Feature Overview

### Edge Hour Challenge Trading

```
/deriw start an Edge Hour challenge with template 12
/deriw open BTC long in Edge Hour challenge 35329
/deriw close my Edge Hour BTC position
/deriw claim Edge Hour reward for challenge 35329
/deriw deposit 100 USDT into Edge Hour LP vault
```

Corresponding scripts:

```bash
# Query state (templates, vault, user challenge)
DEV=true node scripts/edge_hour/query-state.js <account>

# Start challenge (templateId from query-state; ticketFee must be multiple of 5 USDT)
DEV=true PRIVATE_KEY=xxx node scripts/edge_hour/start-challenge.js <templateId> <ticketFee_usdt>

# Open virtual position (no token transfer)
DEV=true PRIVATE_KEY=xxx node scripts/edge_hour/open-position.js <challengeId> <indexToken> <sizeDelta_usdt> <collateral_usdt> <isLong>

# Close virtual position
DEV=true PRIVATE_KEY=xxx node scripts/edge_hour/close-position.js <challengeId> <indexToken> <isLong>

# Claim reward (challenge must be status=2 Passed)
DEV=true PRIVATE_KEY=xxx node scripts/edge_hour/claim-reward.js <challengeId>

# LP vault deposit (whitelist required — contact vault owner)
DEV=true PRIVATE_KEY=xxx node scripts/edge_hour/lpvault-deposit.js <amount_usdt>

# LP vault withdraw
DEV=true PRIVATE_KEY=xxx node scripts/edge_hour/lpvault-withdraw.js <amount_usdt | all>

# Batch API query
DEV=true node scripts/edge_hour/query-api.js <account> [challengeId]
```

**Key precision**: all amounts (ticketFee, sizeDelta, collateral, balance) use `1e6` (USDT unit). Prices from `PriceOracle.getPrice()` use `1e18`.

---

### Query

```
/deriw query BTC long position for 0xAbc...
/deriw query current ETH price
```

Corresponding script:

```bash
DEV=true node scripts/query-position.js <account> <indexToken> <isLong>
```

---

### Market Open / Close

```
/deriw open BTC 10x long with 100 USDT margin, position size 1000 USD
/deriw close my BTC long position
```

Corresponding scripts:

```bash
# Open
PRIVATE_KEY=xxx node scripts/create-market-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong>

# Close
PRIVATE_KEY=xxx node scripts/create-market-close.js <indexToken> <sizeDelta_usd> <isLong>
```

---

### Limit Open / Close

```
/deriw open BTC long 1000 USD when price drops to 80000
/deriw place a BTC take-profit order at 100000
```

Corresponding scripts:

```bash
# Limit open
PRIVATE_KEY=xxx node scripts/create-limit-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove>

# Limit close
PRIVATE_KEY=xxx node scripts/create-limit-close.js <indexToken> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove>
```

---

### Fund Pool Deposit

```
/deriw deposit 100 USDT into fund pool
```

Corresponding script (`pid` obtained from API or contract `currPeriodID`):

```bash
DEV=true PRIVATE_KEY=xxx node scripts/fund-deposit.js <poolAddress> <pid> <amount_usdt>
```

---

### Cross-Chain Deposit (Arbitrum → DERIW Chain)

```
/deriw deposit 100 USDT from Arbitrum to DERIW Chain
```

Corresponding script (must run on Arbitrum network):

```bash
# Production
PRIVATE_KEY=xxx node scripts/crosschain-deposit.js <amount_usdt>

# Devnet (Arbitrum Sepolia)
DEV=true PRIVATE_KEY=xxx node scripts/crosschain-deposit.js <amount_usdt>
```

---

### Cross-Chain Withdrawal (DERIW Chain → Arbitrum)

```
/deriw withdraw 50 USDT to Arbitrum
```

Corresponding script (runs on DERIW Chain):

```bash
# Production
PRIVATE_KEY=xxx node scripts/crosschain-withdraw.js <amount_usdt>

# Devnet
DEV=true PRIVATE_KEY=xxx node scripts/crosschain-withdraw.js <amount_usdt>
```

---

## Network Configuration

| Network | RPC | Chain ID |
|---|---|---|
| DERIW Chain (Production) | `https://rpc.deriw.com` | `2885` |
| DERIW Dev Chain | `https://rpc.dev.deriw.com` | `18417507517` |
| Arbitrum (Production) | `https://arb1.arbitrum.io/rpc` | `42161` |
| Arbitrum Sepolia (Devnet) | `https://rpc-arbitrum-sepolia.deriw.com` | `421614` |

---

## Reference Documentation

- [`references/addresses.md`](references/addresses.md) — Full contract addresses + token addresses
- [`references/contracts.md`](references/contracts.md) — Contract method descriptions
- [`references/api.md`](references/api.md) — HTTP API documentation
- [`scripts/`](scripts/) — Ready-to-run ethers.js v6 scripts (8 total)
- [`scripts/edge_hour/`](scripts/edge_hour/) — Edge Hour specific scripts (8 total)
- [`assets/`](assets/) — Contract ABI JSON files
- [`assets/edge_hour/`](assets/edge_hour/) — Edge Hour ABI files (ChallengeManager, LPVault, PriceOracle)

---

## Notes

- **Private key security**: `PRIVATE_KEY` is only passed via environment variable, never write it to any file
- **Devnet**: Add `DEV=true` to switch to testnet; devnet has `gasPrice=0`, no ETH required
- **Cross-chain arrival time**: Deposits 5-15 minutes, withdrawals 15-60 minutes (Arbitrum confirmation)
- **Edge Hour LPVault**: `deposit()` requires whitelist by vault owner — contact team to be whitelisted
- **Edge Hour virtual trading**: `increasePosition`/`closePosition` do NOT move real tokens; all balances are tracked on-chain as virtual equity
