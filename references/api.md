# Client HTTP API

Choose `apiBase` from [networks.json](networks.json). This skill uses the user-facing `/client/*` surface only; it does not require service endpoints, internal APIs, database access or API keys from the operator.

## Calling and decoding

```bash
node scripts/api-query.js /client/coins
node scripts/api-query.js /client/prices '{"name":["BTC","ETH"]}'
node scripts/api-query.js /client/order/indices '{"address":"0xUSER"}'
node scripts/api-query.js /client/position_router/tx_status '{"address":"0xUSER","tx_hash":"0xHASH","type":0}'
```

The helper uses GET except for the read-only status query, which uses POST. Arrays become repeated query keys. It checks both HTTP success and `{code:0,msg,data}`, preserves decimal strings, times out after 15 seconds and never follows redirects or automatically retries a write. A nonzero code is an error even with HTTP 200. Never treat `data:null`, no record or an API error as a zero on-chain balance.

## Market and account reads

| Method/path | Request fields | Relevant response data |
|---|---|---|
| GET `/client/coins` | none | `list`: address, name, coin_id, price, min_price, max_price, pool_amount, adr, high_price, low_price, exchange, is_meme, is_tradfi, coin_type, pre_ipo, status, market_state_policy |
| GET `/client/prices` | optional repeated `address`, repeated `name`; each at most 25 | Array of address, min_price, max_price, pool_amount |
| GET `/client/coin_infos` | optional `address` = user wallet for room funding rates | `list`: address, decimals, is_stable, is_shortable, fee_rate, max_leverage, contract_max_leverage, leverage_slider, status, market_state_policy, funding_fee_rate, room_pool_funding_fee_rate, next_funding_time |
| GET `/client/candles` | required `symbol`, `period`, `limit` | symbol, period, is_meme, `prices:[{o,h,l,c,t}]`; `t` Unix seconds |
| GET `/client/coin_market/info` | optional sort_by, order, repeated addresses | Market totals and token list |
| GET `/client/account/info` | required `address` | position_value, pending_order_book_value, sum_account_value |
| GET `/client/vault/position_tokens` | required `account` | Actual position index tokens; retain room mappings |
| GET `/client/vault/decrease_records` | required address; optional is_long (1=long, 2=short), page_index, page_size | Closed-position records |
| GET `/client/vault/total_fees` | required address; optional page_index, page_size | Fee records |
| GET `/client/order/indices` | required address | `increase`, `decrease` arrays of order-index strings |
| GET `/client/order/total_sizedelta` | required address | `list` of account, collateral_token, index_token, is_long, total_size_delta and above/below trigger totals |

Prices in market HTTP responses are display decimal USD strings, unlike 30-decimal ABI prices. `pool_amount` can be a raw token amount: do not apply the display-price conversion to every field. Status is 1=delisted, 2=listed, 3=pending delisting. `market_state_policy` is 0=closed, 1=reduce-only, 2=normal; check this before increasing exposure. Contract simulation remains authoritative for execution eligibility. `next_funding_time` is a Unix timestamp, not a countdown. Do not derive fee percentages from an assumed denominator shared by all contracts.

For candle periods and symbols, use the values supported by the selected deployment; a typical request is `symbol=BTC&period=1h&limit=100`. Large candle limits or unsupported periods can be rejected.

## Portfolio

All paths below are GET `/client/portfolio/<name>`. Financial outputs are strings; do not rescale without field-specific evidence.

| Name | Required | Optional |
|---|---|---|
| summary | account, time_range | — |
| pnl_series | account, time_range | — |
| funding_history | account | index_token, type=`funding_fee`, page/page_index, page_size |
| transactions | account | type=`deposit|withdraw|send`, status=`success|pending|failed`, pagination |
| chain_transfers | account | status=1 pending/2 success/3 failed, to_address, pagination |

`time_range`: `24h`, `7d`, `30d`, `all`. Pagination defaults to 20 and caps at 100; a positive `page_index` overrides `page`. Summary fields `account_value`, `available_balance` and `stake_balance` are placeholders in this API version and may be zero. Obtain actual token balances/positions from contracts. Funding history raw event amounts need their documented on-chain precision, not a blanket display conversion.

## Transaction status

`POST /client/position_router/tx_status`

```json
{"address":"0xUSER","tx_hash":"0xCREATE_REQUEST_HASH","type":0}
```

`type=0` increase/open, `1` decrease/close. `data.status` comes from the creation record: 1=created, 2=completed, 3=failed, 4=cancelled. An absent record or 0 is unknown/not yet indexed. Do not interpret an execution-worker retry enum as a guaranteed value from this endpoint. `cancel_type` when supplied is 0=ordinary, 1=slippage, 2=liquidation. Cross-check creation/execution events and the resulting position.

`GET /client/transaction/status` takes required `tx_hash` and `type` (method-name string such as `createIncreasePosition`, `createDecreasePosition`, `createIncreaseOrder`, `createDecreaseOrder`, `batchCreateDecreaseOrder`, `cancelIncreaseOrder`, `liquidatePosition`). Its `data.list` contains display fields such as coin_name, is_long, size and order_type. It is not an RPC transaction-receipt replacement.

## Fund and Meme pool discovery

| GET path | Fields |
|---|---|
| `/client/foundpool/tokens` | none; data.tokens |
| `/client/foundpool/terms` | none; data.terms and current_term |
| `/client/foundpool/lists` | required status (1 fundraising, 2 running, 3 ended); optional term, token |
| `/client/foundpool/deposit` | required user; optional term |
| `/client/foundpool/total` | none |
| `/client/memepool/tokens` | none |
| `/client/memepool/lists` | optional token |
| `/client/memepool/deposit` | required user |
| `/client/memepool/total` | none |

Fund list entries include pool, p_id, token_address, name, start_time, end_time, lock_end_time, min_deposit_amount, fundraising_amount, deposit_amount, apr and profit. User records include is_resubmit, is_claimed, amount and lp_token_amount. APIs show indexed state; before depositing or claiming check the relevant on-chain period and user state. No pool deposit/withdraw HTTP endpoint substitutes for the user's contract transaction.

## Rooms

GET `/client/room/<name>` uses `account` = host address, not an arbitrary trader wallet.

| Name | Other inputs | Relevant data |
|---|---|---|
| detail | — | net_deposits, pool_equity, total_tvl, total_reversed_oi, total_available_oi, active_trader, realized_pnl, net_revenue, room_health |
| pool-status | — | status, capacity_base_mode, pool, lv, can_remove_liquidity, withdrawal_limit, total_withdrawal_number, last_withdrawal_time, withdrawal_window_time |
| traders | page_index, page_size | items, total, page_index, page_size |
| open-positions | pagination | items: account, index_token, direction, size_delta, collateral_size, average_price, liquidation_price, unreleased_pnl |
| close-position-history | pagination | items including tx_hash, released_pnl, fee_share, is_force_close, is_liq |
| lp-change | pagination | host liquidity changes |
| blocked-users | pagination | room block list |
| fee / tvl | optional limit | items: day, volume |
| coins | — | room tradable coins |
| liquidity | required index_token, is_long (true/false, including false explicitly) | liquidity, room_liquidity, deriwpool_liquidity |

Pagination page_index≥1, page_size≤100. Room display amounts are decimal strings; raw ABI values have their own units. Different missing-room reads can return different errors; do not hardcode a single “not found” code for the whole group.

`POST /client/room/pre-create` body `{account,capacity_base_mode,message}` uses mode 1=principal or 2=equity. `message` is the EIP-191 signature over the exact text `Apply to become a host`. It records an application/reopen state. It does **not** sign or fund `MemeFactory.createChannelPool`; follow [room.md](room.md).

## Edge Hour

GET `/client/edge_hour/<name>`:

| Name | Inputs |
|---|---|
| templates / templates/config / lpvault | none |
| challenge/info | account |
| positions / close_records | account, challenge_id; optional page_index/page_size |
| user/overview / user/challenges | account; pagination for challenges |
| user/challenge/detail | account, challenge_id |
| challenge_detail | challenge_id |
| liquidate_price | challenge_id, index_token, is_long, size_delta, collateral; amounts in raw 6-decimal units |

Template data includes template_id, max_ticket_price, duration, tokens, leverages, minimum_holding_period, minimum_trades, r_target and dd_max. API values have endpoint-specific display conventions; inspect [edge-hour.md](edge-hour.md). Challenge records use the contract’s 0=None, 1=Active, 2=Passed, 3=Failed, 4=Claimed enum. Position/closed-trade status fields have different meanings. `liquidate_price` returns a raw 18-decimal price string.

`POST /client/edge_hour/challenge/claim` accepts `{challenge_id}` and requests backend settlement/claim processing. It is a mutation, not a status check; HTTP success is not proof of a paid reward. Use only for an explicitly authorized challenge operation, and verify chain state/receipt separately. The direct user `claimReward` path is documented in the Edge Hour reference.

## Referral and rebate APIs

GET `/client/invite_return/v2/` paths `apply_agent_status`, `user_info`, `user_invitees`, `invite_return_records`, `invite_friends` require `account`; paginated lists use page_index≥1/page_size≤100. GET `/client/point_benefit/return_fees_records` is the points rebate history. Check the specific request fields when using its filters.

User-facing signed mutations (not supported by the read-only CLI; use an explicitly authorized wallet integration):

- POST `/client/invite_return/v2/apply_agent`: account, username (≤20 chars), country (≤20), nonempty unique platforms, nonempty profiles (`link`, `follower_count`), optional image_ids, plan_to_promote_dw, joined_similar_affiliate_name, and signature. Sign exactly `Apply to become affiliate` with EIP-191.
- POST `/client/invite_return/v2/set_return_rate`: account (parent), return_rate (0..10000), signature, optional invitee. Sign exactly `Confirm the rebate ratio` with EIP-191. The server validates referral hierarchy; signing does not grant authority over unrelated accounts.

Signatures for these fixed texts do not bind every HTTP field. Do not log or reuse them for a new action, and show the intended fields before signing. If the task is a query, never submit any of these writes.
