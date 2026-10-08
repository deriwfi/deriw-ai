---
name: deriw
description: Query DERIW markets, accounts, orders and pools through client APIs and public contract reads, and prepare or submit user-signed trades, pool, room, Edge Hour and bridge operations on dev, test or mainnet.
---

# DERIW user operations

Use the bundled ABIs, network configuration, public RPCs, client APIs and the user's wallet. All workflows are available from this package.

## Choose the environment and workflow

Use [references/networks.json](references/networks.json) as the single address source. Select `DERIW_NETWORK=dev|test|mainnet`; dev is chain `18417507517`, test `2885`, mainnet `2886`. RPC and API overrides must remain on that same deployment. Writes require an explicit network. Read-only commands default to mainnet. `DEV=true` is a compatibility alias for dev.

Run commands from the installed skill folder with Node.js 18+ and the bundled `package.json` dependencies (`npm ci`). Resolve scripts/assets relative to this folder, using portable paths.

| Task | Read when needed |
|---|---|
| Networks and contract addresses | [references/addresses.md](references/addresses.md) |
| Markets, prices, history, user portfolio, API status | [references/api.md](references/api.md) |
| Positions, market/limit orders, approvals, pool operations | [references/contracts.md](references/contracts.md) |
| Room application, host creation/reopening, liquidity | [references/room.md](references/room.md) |
| Edge Hour challenges and LP vault | [references/edge-hour.md](references/edge-hour.md) |
| L2 deposit or L3 withdrawal | [references/bridge.md](references/bridge.md) |
| Wallet actions and signed client requests | [references/actions.md](references/actions.md) |
| Installation and transaction verification | [references/verification.md](references/verification.md) |

## Execution boundaries

- Public ABI presence does not grant permission. Only use documented user methods, or host methods for that wallet's own room. Governance, keeper/executor, oracle price updates, liquidations, deployment and server operations are outside this skill. Full ABI files are retained for decoding; `contract-call.js` enforces a user-write allowlist.
- Use only the documented `/client/*` APIs. An HTTP method alone does not establish read-only behavior. `room/pre-create`, referral changes and challenge settlement requests mutate state even though they do not look like a blockchain transaction.
- Discover tradable token addresses on the selected network with `/client/coins` and `/client/coin_infos`. For existing positions use the actual `index_token` from records (including room-mapped tokens); do not substitute a symbol's main-pool address.
- Interpret API decimals according to each endpoint. Core position USD/price values have 30 decimals, USDT has 6, and Edge Hour uses different units. Keep raw quantities as decimal strings/BigInt, not JavaScript floating-point numbers.
- Before sending, establish the user's intended network, wallet, action, amount, direction, receiver and price/slippage limit. Existing authorization carries forward; do not request a duplicate approval. Importing a key alone does not authorize a trade or an entire test suite.
- Scripts preview by default. Use `--send` only for the authorized action. They validate chain ID, require bytecode, grant exact needed token allowance and simulate each transaction before broadcasting. An allowance transaction can succeed while the subsequent operation reverts; report both outcomes separately.
- Keep keys local (`PRIVATE_KEY_FILE` or `PRIVATE_KEY`). Never request a key in chat, print it, put it into examples/arguments, or send it to an API. A public `DERIW_ACCOUNT` suffices for previews that need a sender/receiver. Wallet signing integrations can use the same ABI parameters without these CLI key inputs.
- Never use a deprecated price feed or unlimited acceptable price as a fallback. Market scripts use the current `PriceOracle`, require `DERIW_SLIPPAGE_BPS`, and reject missing/stale quotes. A reverted or stale read is a failure, not a zero price.
- Print the transaction hash immediately. A mined market request is pending until keeper execution is confirmed. Check receipt/events, client status and resulting position; never call keeper methods yourself. On an uncertain submission or timeout, query the hash/nonce before any retry. Do not automatically resubmit transactions or signed API writes.
- API lag, an absent deployment, lack of whitelist permission or missing bridge configuration must be reported as such. Do not manufacture success, change another user's permissions, or silently switch environments.

## Entry points

```bash
DERIW_NETWORK=dev node scripts/api-query.js /client/coins
DERIW_NETWORK=dev node scripts/contract-call.js PriceOracle getMaxMinPriceWithTime '["0xTOKEN"]'
DERIW_NETWORK=dev node scripts/query-position.js 0xACCOUNT 0xTOKEN true
DERIW_NETWORK=dev DERIW_SLIPPAGE_BPS=100 node scripts/create-market-open.js 0xTOKEN 10 100 true
```

The final example is a preview with an illustrative 1% tolerance, not a default trading preference. Substitute real addresses from the selected deployment. Append `--send` only after the user has authorized those concrete parameters. The corresponding workflow reference lists full arguments and prerequisites.
