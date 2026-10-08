# Rooms: user/host workflow

A room is a host's isolated channel liquidity pool. It uses core `MemeFactory`, `MemeData`, `Phase`, `Vault` and related public ABIs. Use the canonical `assets/` files and selected network addresses.

## Reads

```bash
node scripts/room/query-api.js <hostAccount>
node scripts/room/query-state.js <hostAccount> [indexToken] [true|false]
```

`channelOwnerPool(host)` gives the on-chain pool. `/client/room/pool-status?account=host` gives indexed lifecycle and withdrawal eligibility. `getChannelPoolTargetToken(pool)` resolves target and mapped tokens. Query the actual mapped token when inspecting a trader's existing position; new-order routing is performed inside PositionRouter/OrderBook, not by a user calling `createChannelToken`.

## Apply, create or reopen

1. Read pool-status and `channelOwnerPool(host)` to distinguish new vs existing/closed room.
2. With the user's authorization, call `node scripts/room/pre-create.js <1|2> --send`. This signs exactly `Apply to become a host` and POSTs `{account,capacity_base_mode,message}` to `/client/room/pre-create`. Mode 1=principal, 2=equity. The signature is never logged. HTTP success only registers the application.
3. Read `MemeFactory.getChannelCreateFunds()` and the user's USDT balance. For a new room, use `node scripts/pool-action.js room-create <USDT> <1|2> --send`, which approves `MemeData` then calls `createChannelPool(amount,mode)` as the host.
4. For an existing closed room, use `room-reopen <USDT> <1|2> --send`, which calls `setChannelPoolOpen(mode,amount)` (note the different argument order). Do not call create again for an already owned pool.
5. Verify the creation/reopen event, `channelOwnerPool`, balances and client pool-status. Indexing may lag.

Each command previews when `--send` is omitted. Only proceed with application and funding together if the user authorized both; the application alone does not imply an amount to deposit.

## Host liquidity and lifecycle

```bash
node scripts/pool-action.js room-deposit <USDT> [--send]
node scripts/contract-call.js MemeFactory claimChannel '["RAW_USDT_AMOUNT"]' [--send]
node scripts/contract-call.js MemeFactory setChannelPoolCloseCurrTime '[]' [--send]
node scripts/contract-call.js MemeFactory cancelChannelPoolCloseTime '[]' [--send]
node scripts/contract-call.js MemeFactory setChannelPoolFreezeNow '[]' [--send]
node scripts/contract-call.js MemeFactory batchSetBlacklist '[["0xTRADER"],true]' [--send]
```

These act on the signing host's room and remain subject to on-chain ownership/lifecycle checks. `claimChannel` uses a requested USDT amount (6 decimals); actual redemption may be capped by share and risk limits. Inspect `getPoolWithdrawalInfo`, pool status and balances before/after. Use client `can_remove_liquidity` together with the current on-chain state to check withdrawal availability.

`setChannelPoolCloseCurrTime` schedules closing; `cancelChannelPoolCloseTime` is only allowed before the relevant freeze boundary. `setChannelPoolFreezeNow` is a host action with lifecycle consequences: do not run it as a read check. Operator functions `setChannelPoolClose(pool)`, `setChannelPoolEndNow(pool)`, `setChannelPoolIsPause`, global config setters and `createChannelToken` are outside the user workflow. If final closure needs operator work, report that dependency instead of attempting it with the user key.
