# DERIW user operations skill

This self-contained skill uses DERIW user-facing client APIs and public contract ABIs. End users do not need the contract/backend source repositories, service credentials, admin permissions or keeper access.

Keep this folder intact when installing it as `deriw` in your agent's skill directory. The entrypoint is [SKILL.md](SKILL.md); runtime dependencies are Node.js 18+ and ethers v6:

```bash
npm ci
npm test
DERIW_NETWORK=dev npm run smoke
```

## Networks

| DERIW_NETWORK | Chain ID | RPC | API |
|---|---|---|---|
| dev | 18417507517 | https://rpc.dev.deriw.com | https://api.dev.deriw.com |
| test | 2885 | https://rpc.test.deriw.com | https://api.test.deriw.com |
| mainnet | 2886 | https://rpc.deriw.com | https://api.deriw.com |

[references/networks.json](references/networks.json) holds the supplied active/deprecated contract addresses. Scripts share this configuration and check the actual RPC chain. `DEV=true` remains a dev alias. Reads default to mainnet; sends require an explicit network.

## Usage

```bash
# Public data — no private key
DERIW_NETWORK=dev node scripts/api-query.js /client/coins
DERIW_NETWORK=dev node scripts/api-query.js /client/foundpool/lists '{"status":1}'
DERIW_NETWORK=dev node scripts/query-position.js 0xACCOUNT 0xTOKEN true

# Preview using a real token from /client/coins; 100 bps is an example 1% tolerance
DERIW_NETWORK=dev DERIW_SLIPPAGE_BPS=100 node scripts/create-market-open.js 0xTOKEN 10 100 true
```

Scripts that mutate state preview by default. Append `--send` for an authorized transaction or signed API action. Supply the key through a local `PRIVATE_KEY_FILE` or `PRIVATE_KEY` environment variable; do not paste it into chat, command arguments or this repository. `DERIW_ACCOUNT` is the public wallet address for previews that need one. The commands do not load a `.env` file automatically.

Examples are templates; replace placeholder addresses and amounts with the user's chosen values. A market creation receipt is a queued request, not proof that the position opened. Read client status, events and the resulting position before retrying.

## Workflows

- [Client API](references/api.md): markets, prices, candles, positions, orders, funds, Meme, portfolio, referrals and room/Edge Hour reads.
- [Contract operations](references/contracts.md): market/limit orders, cancel, fund deposit/claim, Meme deposit/claim, exact approval spenders and public read methods.
- [Rooms](references/room.md): signed application followed by the host's own on-chain create/reopen/funding transactions.
- [Edge Hour](references/edge-hour.md): challenge entry/trading/reward and LP deposits/withdrawals. Current deployment addresses were not supplied; configure them before on-chain use.
- [Bridge](references/bridge.md): L2 source configuration and current fee quote are required for deposits; withdrawals use the contract-specific signing digest.
- [Testing](references/testing.md): read-only checks and a signed test matrix for use after wallet setup and test authorization.

The full ABI bundle includes privileged methods for decoding. Their presence is not user authorization. Scripts expose documented user actions only. Historical duplicate ABI directories are retained but are not imported by the current helpers.
