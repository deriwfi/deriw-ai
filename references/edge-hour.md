# Edge Hour challenges and LP vault

Choose the network in `DERIW_NETWORK`. Configured Edge Hour addresses are available in [networks.json](networks.json). You can override them with `DERIW_EDGE_CHALLENGE_MANAGER`, `DERIW_EDGE_LP_VAULT` and `DERIW_EDGE_PRICE_ORACLE`. Verify payment token, vault and oracle through the manager's public getters. The Edge Hour oracle uses a different ABI and precision from the core trading oracle.

Scripts use `assets/edge_hour/`. `query-api.js` can run without Edge contract addresses.

```bash
node scripts/edge_hour/query-api.js [account] [challengeId]
node scripts/edge_hour/query-state.js [account]
node scripts/edge_hour/start-challenge.js <templateId> <ticketFee> [--send]
node scripts/edge_hour/open-position.js <challengeId> <token> <sizeUSDT> <collateralUSDT> <true|false> [--send]
node scripts/edge_hour/close-position.js <challengeId> <token> <true|false> [--send]
node scripts/edge_hour/claim-reward.js <challengeId> [--send]
node scripts/edge_hour/lpvault-deposit.js <assetAmount> [--send]
node scripts/edge_hour/lpvault-withdraw.js <assetAmount|all> [--send]
```

Ticket and vault scripts read payment-token decimals; virtual size/collateral/balance use 6 decimals and Edge oracle prices use 18. LP shares use 18. `withdraw(assets)` takes assets, not shares. The `all` preview requires `DERIW_ACCOUNT` to read `maxWithdraw`.

Read the current template and `ticketUnit()`; do not hardcode a 5-USDT ticket or a 10,000-USDT starting balance. `getChallengeTemplate(id)` returns a struct with `template` and `active`; ABI named fields are available through ethers. Starting pays a real ticket, while position changes operate on the virtual challenge balance. Virtual trading is still a signed state mutation.

Contract `getChallengeState(id).status`: 0 None, 1 Active, 2 Passed, 3 Failed, 4 Claimed. The current client challenge responses use the same 0..4 enum. Do not confuse challenge status with a position/closed-trade status: position rows use a separate holding-time/profit-cap status. API decimal values should be retained as returned; the helper prints raw JSON rather than applying one unit conversion to every field.

Before opening/closing inspect challenge ownership/status, template tokens and leverage/risk parameters. The contract enforces minimum size, leverage, holding time and expiry. Only claim the user's own Passed challenge; verify the resulting reward event and token balance. LP deposits require an existing whitelist entry; the user helper cannot add it. The vault rejects deposits from ineligible wallets.

Do not invoke admin template changes, emergency controls, upgrades, batch liquidation, or batch settlement. `/client/edge_hour/challenge/claim` is a user-facing backend mutation described in [api.md](api.md); it must not be used as a read-only status probe.

Use `node scripts/user-action.js edge-referral-bind <code> <sourceType> <referrerChallengeId> [--send]` to bind Edge referral parameters. Use `client-action.js challenge-settle <request.json> [--send]` for the client settlement request; the file contains `challenge_id`. Settlement acknowledgement is separate from the wallet's `claimReward` transaction.
