# Installation and operation checks

Run these commands from the installed skill directory:

```bash
npm ci
DERIW_NETWORK=dev npm run smoke
DERIW_NETWORK=test npm run smoke
DERIW_NETWORK=mainnet npm run smoke
```

Smoke checks are read-only. They validate the RPC chain ID, configured contract bytecode, selected client API responses and a current oracle quote. Use `node scripts/smoke.js --all-contracts` to check all configured contracts on the selected DERIW chain. The L2 deposit router must be checked on its source chain separately. A nonzero exit code indicates at least one failed check; read the individual results.

Before a transaction, inspect the wallet balance, current position or pool state and the command preview. Confirm the expected token, spender, recipient, amount and price limit. A completed approval does not imply that the following operation succeeded.

After sending, retain the printed hash and verify the receipt and relevant events. Market requests require a separate execution check through `/client/position_router/tx_status` and the resulting position. Limit orders require their event indices and `OrderBook.increaseOrders` or `decreaseOrders`; an empty API list alone does not establish completion. Verify token balances after withdrawals and cancellations.

For pools and rooms, compare the recorded user balance or shares before and after the operation. For bridges, track source receipt and destination delivery separately. For signed APIs, distinguish request acceptance from later on-chain changes.

After a timeout, query the existing transaction hash, nonce and state before taking another action. Do not automatically resend. Missing deployment configuration, an ineligible wallet, a locked period or an unavailable API is an unresolved prerequisite, not a successful operation.
