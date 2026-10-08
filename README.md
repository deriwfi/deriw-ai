# DERIW skill

Query DERIW markets and accounts, manage positions and orders, and use wallet-signed pool, room, referral, Edge Hour and bridge workflows.

Install this folder as `deriw` in your agent's skill directory. Keep the scripts, references and ABI assets together. The entrypoint is [SKILL.md](SKILL.md). Node.js 18 or later is required.

```bash
npm ci
DERIW_NETWORK=dev npm run smoke
DERIW_NETWORK=dev node scripts/api-query.js /client/coins
```

## Networks

| Network | Chain ID | RPC | Client API |
|---|---|---|---|
| dev | 18417507517 | https://rpc.dev.deriw.com | https://api.dev.deriw.com |
| test | 2885 | https://rpc.test.deriw.com | https://api.test.deriw.com |
| mainnet | 2886 | https://rpc.deriw.com | https://api.deriw.com |

Set `DERIW_NETWORK` before sending. Read commands default to mainnet. Deployment addresses are in [networks.json](references/networks.json). `DERIW_RPC_URL` and `DERIW_API_BASE` override the corresponding transport without changing the expected chain or addresses.

## Wallet setup

Commands preview by default. Add `--send` to submit an authorized action. Supply a local signer with `PRIVATE_KEY_FILE` or `PRIVATE_KEY`; never paste a key into chat or commit it to a repository. `DERIW_ACCOUNT` supplies a public wallet address for previews. Scripts do not load `.env` files automatically.

Use a current token address from `/client/coins`, exact decimal amounts, and an explicit `DERIW_SLIPPAGE_BPS` for market orders. Check receipts, execution status and resulting balances before retrying a transaction.

## Workflows

- [Client APIs](references/api.md): markets, portfolios, orders, pools, rooms, referrals and challenges.
- [Trading and contract reads](references/contracts.md): positions, limit orders, cancellations and token balances.
- [Wallet and signed client actions](references/actions.md): fund, Meme, room, referral and application commands.
- [Rooms](references/room.md): application, creation, reopening, liquidity and lifecycle controls.
- [Edge Hour](references/edge-hour.md): challenges, virtual positions, rewards and LP vault operations.
- [Bridges](references/bridge.md): current deposit quotes, deposits and signed withdrawals.
- [Verification](references/verification.md): installation checks and transaction verification.
