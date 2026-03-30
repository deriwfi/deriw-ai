# DERIW HTTP API Reference

**Base URL**

| Environment | URL |
|---|---|
| Production | `https://api.deriw.com` |
| Devnet | `https://testgmxapi.weequan.cyou` |

**Unified Response Format**:
```json
{ "code": 0, "msg": "success", "data": { ... } }
```
`code = 0` success, non-zero indicates error.

**Common Error Codes**

| code | Description |
|---|---|
| `0` | Success |
| `100002` | Internal server error |
| `100003` | Parameter binding failed |
| `100004` | Parameter validation failed (missing required fields) |
| `100101` | Database error |
| `100201` | Encryption error |
| `100202` | Invalid signature |
| `100203` | Token expired |
| `100207` | Insufficient permissions |
| `100423` | Parameter error (business layer) |
| `100431` | Token delisted |
| `100437` | Signature verification failed |
| `100438` | Agent application already exists |

> Some business errors have HTTP status 200 — use the `code` field to distinguish.

---

## Endpoint Summary

| Endpoint | Method | Description |
|---|---|---|
| `/client/candles` | GET | K-line data |
| `/client/coins` | GET | All tokens real-time price + 24h market |
| `/client/coin_infos` | GET | Token on-chain config (decimals/leverage/type) |
| `/client/coin_market/info` | GET | Market overview (positions/volume) |
| `/client/vault/total_fees` | GET | Account fee query |
| `/client/position_router/tx_status` | POST | Market order transaction status query |
| `/client/transaction/status` | GET | On-chain transaction parsed details |
| `/client/foundpool/tokens` | GET | Fund pool available token list |
| `/client/foundpool/terms` | GET | Fund pool historical period list |
| `/client/foundpool/lists` | GET | Fund pool list (with rewards/capacity data) |
| `/client/foundpool/deposit` | GET | My fund pool deposit records |
| `/client/foundpool/total` | GET | Fund pool global staking stats |
| `/client/memepool/tokens` | GET | Meme pool token list |
| `/client/memepool/lists` | GET | Meme pool list (with rewards data) |
| `/client/memepool/deposit` | GET | My Meme pool deposit records |
| `/client/memepool/total` | GET | Meme pool global staking stats |
| `/client/invite_return/v2/apply_agent` | POST | Apply to become a partner agent |
| `/client/invite_return/v2/apply_agent_status` | GET | Agent application status query |
| `/client/invite_return/v2/user_info` | GET | Referral user info |
| `/client/invite_return/v2/user_invitees` | GET | Invited user list |
| `/client/invite_return/v2/invite_return_records` | GET | Fee rebate records |
| `/client/invite_return/v2/set_return_rate` | POST | Set subordinate rebate rate |
| `/client/invite_return/v2/invite_friends` | GET | Invite friends list and summary |
| `/client/point_benefit/return_fees_records` | GET | Points benefit rebate records |

---

## 3.1 K-Line Data

### `GET /client/candles`

Get K-line data for a specified token, returns up to 10,000 entries.

**Request Parameters**

| Field | Type | Required | Description |
|---|---|---|---|
| `symbol` | string | Yes | Token name, e.g. `BTC`, `ETH` |
| `period` | string | Yes | Period: `1m` `3m` `5m` `15m` `1h` `4h` `6h` `8h` `12h` `1d` `3d` `1w` `1M` |
| `limit` | int | No | Number of entries, unlimited by default, max 10000 |

**Response `data` Structure**

```json
{
  "period": "1h",
  "symbol": "BTC",
  "is_meme": false,
  "prices": [
    { "o": "65000.5", "h": "65800.0", "l": "64200.0", "c": "65500.0", "t": 1710000000 }
  ]
}
```

| Field | Description |
|---|---|
| `o/h/l/c` | Open/High/Low/Close price |
| `t` | Unix timestamp (seconds, K-line start time) |

---

## 3.2 Token List (with Real-Time Prices)

### `GET /client/coins`

Returns real-time prices and 24h market data for all listed tokens (no request parameters).

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `address` | Contract address |
| `coin_id` | Internal ID |
| `name` | Display name (BTC/ETH, not WBTC/WETH) |
| `is_meme` | Whether it is a Meme token |
| `status` | `2`=normal, `3`=pending delisting |
| `price` | Current real-time price (USD string) |
| `adr` | 24h price change (%, 2 decimal places) |
| `high_price` / `low_price` | 24h high/low price |

---

## 3.3 Token Basic Info

### `GET /client/coin_infos`

Returns on-chain configuration for all listed tokens (no request parameters).

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `name` / `address` | Name / contract address |
| `decimals` | Token decimals |
| `is_wrapped` / `is_shortable` / `is_stable` / `is_meme` | Boolean attributes |
| `from` | Price source (binance / bybit, etc.) |
| `fee_rate` | Fee basis points (e.g. `30` = 0.03%) |
| `max_leverage` | Frontend maximum leverage |
| `contract_max_leverage` | Contract maximum leverage |
| `leverage_slider` | Available leverage slider values |
| `max_position` | Maximum position size (USD) |
| `status` | `2`=normal, `3`=pending delisting |

---

## 3.4 Market Overview

### `GET /client/coin_market/info`

Returns comprehensive market data for all tokens (including volume, long/short positions).

**Request Parameters (all optional)**

| Field | Type | Description |
|---|---|---|
| `sort_by` | string | Sort field: `adr` / `volume_day` / `position_long_now` / `position_short_now` / `price` |
| `order` | string | `asc` / `desc` (default `desc`) |
| `addresses` | string[] | Filter by contract address (can pass multiple) |

**Response `data` Structure**

```json
{
  "total_position_now": "52000000.0000",
  "deposit_amount": "10000000.0000",
  "list": [
    {
      "address": "0x...", "name": "BTC", "price": "65000.5",
      "adr": "1.23", "high_price": "65800.0", "low_price": "64200.0",
      "is_meme": false, "max_leverage": 100,
      "volume_day": "15000000.0000",
      "position_long_now": "8000000.0000",
      "position_short_now": "6000000.0000",
      "status": 2
    }
  ]
}
```

---

## 3.5 Fee Query

### `GET /client/vault/total_fees`

Query cumulative fee records for an account (aggregated by position).

**Request Parameters**

| Field | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Wallet address |
| `page_index` | int | No | Page number, default 1 |
| `page_size` | int | No | Items per page, default 10 |

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `account` / `collateral_token` / `index_token` | Position identifiers |
| `is_long` | Long/short direction |
| `total_fees` | Cumulative fees (USD string) |

---

## 3.6 Market Order Transaction Status Query

### `POST /client/position_router/tx_status`

Query execution status of a market order by transaction hash (only supports market orders created by PositionRouter).

**Request Body (JSON)**

| Field | Type | Required | Description |
|---|---|---|---|
| `address` | string | Yes | Wallet address |
| `tx_hash` | string | Yes | Transaction hash |
| `type` | int | No | `0`=open (default), `1`=close |

**Response `data` Structure**

```json
{ "status": 2, "cancel_type": 0 }
```

**status Enum Values**

| Value | Description |
|---|---|
| `1` | Created (waiting for execution engine) |
| `2` | Completed (on-chain Execute event confirmed) |
| `3` | Execution failed |
| `4` | Cancelled (`cancel_type`: `0`=normal, `1`=slippage, `2`=liquidation) |
| `5` | Retrying (close only) |

---

## 3.7 On-Chain Transaction Details Query

### `GET /client/transaction/status`

Query on-chain transaction parsed details by transaction hash and type.

**Request Parameters**

| Field | Type | Required | Description |
|---|---|---|---|
| `tx_hash` | string | Yes | On-chain transaction hash |
| `type` | string | Yes | Transaction type (see table below) |

**type Enum Values**

| Value | Description |
|---|---|
| `createIncreasePosition` | Create market open position |
| `createDecreasePosition` | Create market close position |
| `createIncreaseOrder` | Create limit open order |
| `createDecreaseOrder` | Create limit close order |
| `batchCreateDecreaseOrder` | Batch create limit close orders |
| `cancelIncreaseOrder` | Cancel limit open order |
| `liquidatePosition` | Force liquidation |

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `coin_name` | e.g. `BTC/USDT` |
| `is_long` | Long/short direction |
| `size` | Position size (USD) |
| `order_type` | `market` / `limit` |

---

## 3.8 Fund Pool (FundPool) Endpoints

### `GET /client/foundpool/tokens`

Get list of all tokens available for fund pools (no request parameters).

**Response**: `{ "tokens": ["USDT", "BTC", "ETH"] }`

---

### `GET /client/foundpool/terms`

Get all historical period lists and current running period (no request parameters).

**Response**: `{ "terms": [...], "current_term": "2024-03-01/2024-06-01" }`

---

### `GET /client/foundpool/lists`

Get fund pool list, supports filtering by token and period.

**Request Parameters (all optional)**

| Field | Type | Description |
|---|---|---|
| `token` | string | Token name filter |
| `term` | string | Period filter, format `start_date/lock_end_date` |
| `status` | int | `1`=fundraising, `2`=running, `3`=ended |

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `pool` / `p_id` | Pool address / period ID |
| `name` | Pool name |
| `token_address` | Collateral token address |
| `start_time` / `end_time` / `lock_end_time` | Times (Unix) |
| `deposit_amount` | Current actual deposit amount |
| `fundraising_amount` | Fundraising capacity cap |
| `after_amount` / `after_value` | Current liquidity / USD value |
| `apr` / `profit` | Yield rate / profit amount |
| `min_deposit_amount` | Minimum deposit amount |
| `out_amount` / `out_value` | Total redemption (has value when status=3) |

---

### `GET /client/foundpool/deposit`

Query my fund pool deposit records.

**Request Parameters**

| Field | Type | Required | Description |
|---|---|---|---|
| `user` | string | Yes | Wallet address |
| `term` | string | No | Period filter |

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `pool` / `p_id` / `name` | Pool identifiers |
| `amount` / `lp_token_amount` | My deposit / LP share |
| `status` | `1`=running, `2`=locked, `3`=ended |
| `profit` / `apr` | Estimated profit / yield rate |
| `is_claimed` | Whether rewards have been claimed |

---

### `GET /client/foundpool/total`

Get total staking stats for all currently running fund pools (no request parameters).

**Response Fields**

| Field | Description |
|---|---|
| `total_deposit_amount` | Total deposits across all running pools (minimum unit) |
| `total_fundraising_value` | Corresponding total LP Token amount |
| `term` | Current period identifier |
| `history_avg_apr` | Historical average annualized return |

---

## 3.9 Meme Pool Endpoints

### `GET /client/memepool/tokens`

Get token list for all Meme pools (no request parameters).

**Response**: `{ "tokens": [{ "name": "PEPE", "token_address": "0x..." }] }`

---

### `GET /client/memepool/lists`

Get Meme pool list.

**Request Parameters (optional)**: `token` (filter by token contract address)

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `pool` / `creator` | Pool address / creator |
| `name` / `token_address` | Token name / address |
| `status` | `1`=fundraising, `2`=running, `3`=ended, `-1`=liquidity warning (<30%) |
| `min_amount` / `start_time` / `lock_time` | Min deposit / start time / lock duration (seconds) |
| `deposit_amount` / `total_deposit_amount` | Current net deposits / historical cumulative deposits |
| `after_amount` / `after_value` | Current liquidity / USD value |
| `profit` / `apr` | Profit amount / yield rate |

---

### `GET /client/memepool/deposit`

Query my Meme pool deposit records.

**Request Parameters**: `user` (wallet address, required), `token` (token address, optional)

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `pool` / `token_address` / `name` | Identifier info |
| `status` | Same as list endpoint |
| `deposit_amount` | My total deposit amount (minimum unit) |
| `profit` / `apr` | My estimated profit / yield rate |

---

### `GET /client/memepool/total`

Get total current staking amount across all Meme pools (no request parameters).

**Response**: `{ "total_deposit_amount": "...", "total_fundraising_value": "..." }`

---

## 3.10 Referral System (Invite Return V2) Endpoints

### `POST /client/invite_return/v2/apply_agent`

Apply to become a partner agent.

**Request Body (JSON)**

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | string | Yes | Username (max 20 characters) |
| `country` | string | Yes | Country (max 20 characters) |
| `account` | string | Yes | Wallet address |
| `platforms` | string[] | Yes | Platform list (at least 1) |
| `profiles` | object[] | Yes | Per-platform profile (`link` required) |
| `image_ids` | int[] | No | Uploaded image ID list |
| `plan_to_promote_dw` | string | No | Promotion plan description |
| `joined_similar_affiliate_name` | string | No | Name of similar projects previously joined |
| `signature` | string | Yes | Wallet signature |

---

### `GET /client/invite_return/v2/apply_agent_status`

Query agent application status.

**Request Parameters**: `account` (wallet address, required)

---

### `GET /client/invite_return/v2/user_info`

Get current user's referral info.

**Request Parameters**: `account` (wallet address, required)

**Response `data` Fields**

| Field | Description |
|---|---|
| `account_type` | `0`=regular user, `1`=partner |
| `code` | My referral code |
| `inviter` | Address of person who invited me |
| `return_rate` | My current rebate rate (basis points, 500 = 5%) |
| `invitee_return_rate` | Rebate rate set for me by my referrer |
| `subordinate_return_rate` | Unified rebate rate I set for my subordinates |
| `total_fees_from_self` | Total fees generated by myself (USD) |
| `return_fees_from_self` | Rebate portion from my own fees |
| `return_fees_from_invitee` | Fee rebates from people I invited |

---

### `GET /client/invite_return/v2/user_invitees`

Get list of users I've invited (paginated).

**Request Parameters**

| Field | Type | Required | Description |
|---|---|---|---|
| `account` | string | Yes | Wallet address |
| `page_index` | int | Yes | Page number (min 1) |
| `page_size` | int | Yes | Items per page (1-100) |

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `account` / `account_type` / `code` | Invitee info |
| `return_rate` | Rebate rate set for this invitee |
| `total_fees_from_self` | Fees generated by this invitee |
| `return_fees_from_self` | Rebates this invitee gave me |
| `return_fees_from_invitee` | Rebates from this invitee's subordinates to me |
| `created_at` | Registration time (Unix) |

---

### `GET /client/invite_return/v2/invite_return_records`

Get fee rebate distribution records (paginated).

**Request Parameters**: `account`, `page_index`, `page_size` (all required)

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `return_rate` | Rebate ratio |
| `total_fees` | Fees generated in this period (USD) |
| `return_fees` | Rebate amount for this period (USD) |
| `created_at` | Record time (Unix) |
| `status` | Distribution status |

---

### `POST /client/invite_return/v2/set_return_rate`

Set rebate rate for a specified subordinate (partner only).

**Request Body (JSON)**

| Field | Type | Required | Description |
|---|---|---|---|
| `account` | string | Yes | Superior (caller) wallet address |
| `return_rate` | int | Yes | Rebate rate (0-10000, basis points) |
| `signature` | string | Yes | Wallet signature |
| `invitee` | string | No | Specified subordinate address (sets unified rate if omitted) |

---

### `GET /client/invite_return/v2/invite_friends`

Get invite friends info and rebate summary (friends invitation campaign).

**Request Parameters**: `account` (required), `page_index`, `page_size` (optional)

**Response `data` Fields**

| Field | Description |
|---|---|
| `code` / `account_type` / `return_rate` | My basic info |
| `friend_return_rate` | Friend rebate rate |
| `invite_users` | Total invited users |
| `return_fees` | My cumulative rebates (USD) |
| `total` / `list` | Total records / friends list |

---

## 3.11 Points Benefit Endpoints

### `GET /client/point_benefit/return_fees_records`

Get fee rebate records (points benefit view).

**Request Parameters**: `account` (required), `page_index`, `page_size` (optional, int64)

**Response `data` Fields**

| Field | Description |
|---|---|
| `total` | Total record count |
| `level` | Account level |
| `return_rate` | Rebate rate |
| `total_fees` | Total fees (USD) |
| `list` | Record list (`return_fees`, `return_rate`, `total_fees`, `created_at`) |

---

## 3.12 Edge Hour Endpoints

Base URL: Production `https://api.deriw.com`, Dev `https://testgmxapi.weequan.cyou`

### `GET /client/edge_hour/templates`

Get all active challenge template list (no request parameters).

**Response `data.list` Element Fields**

| Field | Type | Description |
|---|---|---|
| `template_id` | int | Template ID (passed to contract `startChallenge`) |
| `max_ticket_price` | string | Maximum ticket price (1e6 USDT) |
| `target_multiplier` | string | Reward multiplier bps (20000=2x) |
| `duration` | int | Challenge duration (seconds) |
| `tokens` | string[] | Tradable token address list |
| `trade_fee` | string | Trading fee bps |
| `r_target` | string | Profit target bps (60=0.6%) |
| `r_target_amount` | string | Profit target amount (1e6 USDT, e.g. 60000000=60 USDT) |
| `dd_max` | string | Max drawdown bps (30=0.3%) |
| `dd_max_amount` | string | Max drawdown amount (1e6 USDT) |
| `minimum_holding_period` | int | Minimum holding time (seconds) required for a valid trade |
| `minimum_trades` | int | Minimum number of valid trades |
| `max_profit_ratio_per_trade` | string | Max single-trade profit as share of target (bps) |
| `leverages` | int[] | Max leverage per token (one-to-one with `tokens`) |

---

### `GET /client/edge_hour/lpvault`

Get LPVault global statistics (no request parameters).

**Response `data` Fields**

| Field | Description |
|---|---|
| `total_asset_balance` | Total vault assets (1e6 USDT) |
| `total_potential_payout` | Total potential payout for all active challenges (1e6 USDT) |
| `max_vault_utilization_bps` | Maximum utilization rate bps (8000=80%) |

---

### `GET /client/edge_hour/challenge/info`

Get user's current/latest challenge info.

**Request Parameters**

| Field | Required | Description |
|---|---|---|
| `account` | Yes | User wallet address |

**Response `data` Fields**

| Field | Description |
|---|---|
| `has_active_challenge` | Whether user has an ongoing challenge |
| `need_settlement` | Whether settlement is needed (passed but not claimed, or failed but not confirmed) |
| `min_trade_value` | Minimum position value (1e6 USDT, from contract) |
| `challenge` | Challenge details (see ChallengeItem below) |
| `has_unclose_position` | Whether there are open positions |
| `failed` | Failure reason (`time_passed`/`trade_count`/`single_trade_cap`/`max_draw_down`) |

**ChallengeItem Fields**

| Field | Description |
|---|---|
| `challenge_id` | Challenge ID |
| `template_id` | Template ID |
| `status` | Status: 1=Active, 2=Passed, 3=Failed, 4=Claimed |
| `start_time` / `end_time` | Unix timestamps |
| `roi` | ROI (bps, ÷100 for percentage, e.g. -101 = -1.01%) |
| `pnl` | PnL (1e6 USDT) |
| `trade_count` | Valid trade count |
| `final_reward` | Estimated reward (1e6 USDT) |
| `tokens` | Tradable token address list |
| `token_leverage` | Token address → max leverage map |
| `r_target` | Profit target bps |
| `dd_max` | Max drawdown bps |
| `minimum_trades` | Minimum valid trades |
| `minimum_holding_period` | Minimum holding time (seconds) |

---

### `GET /client/edge_hour/positions`

Get current open positions in a challenge.

**Request Parameters**: `account` (required), `challenge_id` (required), `page_index`, `page_size`

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `index_token` | Token address |
| `is_long` | Direction (long/short) |
| `size` | Position size (1e6 USDT) |
| `collateral_size` | Collateral (1e6 USDT) |
| `leverage` | Actual leverage multiplier |
| `entry_price` | Average entry price (1e18) |
| `liquidate_price` | Liquidation price (1e18) |
| `profit_lose` | Current P&L percentage (string) |
| `reward_amount` | Profit amount (1e6 USDT) |
| `profit_limit` | Max single-trade profit cap (1e6 USDT) |
| `status` | 0=holding time insufficient, 1=holding time met, 2=below single-trade profit cap, 3=single-trade profit cap reached |
| `trade_fee` | Trading fee (1e6 USDT) |
| `open_time` | Open time (Unix) |
| `open_tx_hash` | Open position transaction hash |

---

### `GET /client/edge_hour/close_records`

Get closed position records for a challenge.

**Request Parameters**: `account` (required), `challenge_id` (required), `page_index`, `page_size`

**Response `data.list` Element Fields**

| Field | Description |
|---|---|
| `index_token` | Token address |
| `is_long` | Direction (long/short) |
| `size` | Position size (1e6 USDT) |
| `close_price` | Close price (1e18) |
| `profit_lose` | P&L percentage |
| `open_time` / `close_time` | Open/close time (Unix) |

---

### `GET /client/edge_hour/user/overview`

Get user historical statistics.

**Request Parameters**: `account` (required)

**Response `data` Fields**

| Field | Description |
|---|---|
| `total_challenges` | Total challenge count |
| `win_rate` | Win rate (%) |
| `total_profit` | Cumulative rewards (1e6 USDT) |
| `best_roi` | Best ROI (bps) |

---

### `GET /client/edge_hour/user/challenges`

Get user challenge history list (paginated).

**Request Parameters**: `account` (required), `page_index`, `page_size`

**Response `data.list`**: Each entry is a ChallengeItem (same format as the `challenge` field in `/challenge/info`)

---

### `GET /client/edge_hour/challenge_detail`

Get details for a specified challenge (public, Redis cache 1s).

**Request Parameters**: `challenge_id` (required)

**Response `data`**: ChallengeItem format

---

### `POST /client/edge_hour/challenge/claim`

Notify server that user has claimed (must call contract `claimReward` first).

**Request Body (JSON)**

| Field | Required | Description |
|---|---|---|
| `challenge_id` | Yes | Challenge ID (int64) |
