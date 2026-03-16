# DERIW HTTP API 速查手册

**Base URL**

| 环境 | URL |
|---|---|
| 线上 | `https://api.deriw.com` |
| 开发网 | `https://testgmxapi.weequan.cyou` |

**统一响应格式**：
```json
{ "code": 0, "msg": "success", "data": { ... } }
```
`code = 0` 成功，非 0 为错误。

**常见错误码**

| code | 说明 |
|---|---|
| `0` | 成功 |
| `100002` | 内部服务错误 |
| `100003` | 参数绑定失败 |
| `100004` | 参数校验失败（缺少必填字段）|
| `100101` | 数据库错误 |
| `100201` | 加密错误 |
| `100202` | 签名无效 |
| `100203` | Token 已过期 |
| `100207` | 权限不足 |
| `100423` | 参数错误（业务层）|
| `100431` | 代币已下架 |
| `100437` | 签名验证失败 |
| `100438` | 代理申请已存在 |

> 部分业务错误 HTTP 状态码仍为 200，通过 `code` 字段区分。

---

## 接口汇总

| 接口 | 方法 | 说明 |
|---|---|---|
| `/client/candles` | GET | K 线数据 |
| `/client/coins` | GET | 所有币种实时价格 + 24h 行情 |
| `/client/coin_infos` | GET | 币种链上配置（精度/杠杆/类型）|
| `/client/coin_market/info` | GET | 市场综合行情（持仓/交易量）|
| `/client/vault/total_fees` | GET | 账户手续费查询 |
| `/client/position_router/tx_status` | POST | 市价单交易状态查询 |
| `/client/transaction/status` | GET | 链上交易解析详情 |
| `/client/foundpool/tokens` | GET | 资金池可用代币列表 |
| `/client/foundpool/terms` | GET | 资金池历史期数列表 |
| `/client/foundpool/lists` | GET | 资金池列表（含收益/容量数据）|
| `/client/foundpool/deposit` | GET | 我的资金池存款记录 |
| `/client/foundpool/total` | GET | 资金池全局质押统计 |
| `/client/memepool/tokens` | GET | Meme 池代币列表 |
| `/client/memepool/lists` | GET | Meme 池列表（含收益数据）|
| `/client/memepool/deposit` | GET | 我的 Meme 池存款记录 |
| `/client/memepool/total` | GET | Meme 池全局质押统计 |
| `/client/invite_return/v2/apply_agent` | POST | 申请成为合伙人代理 |
| `/client/invite_return/v2/apply_agent_status` | GET | 代理申请状态查询 |
| `/client/invite_return/v2/user_info` | GET | 返佣用户信息 |
| `/client/invite_return/v2/user_invitees` | GET | 被邀请用户列表 |
| `/client/invite_return/v2/invite_return_records` | GET | 手续费返佣记录 |
| `/client/invite_return/v2/set_return_rate` | POST | 设置下级返佣比率 |
| `/client/invite_return/v2/invite_friends` | GET | 邀请好友列表及汇总 |
| `/client/point_benefit/return_fees_records` | GET | 积分权益返佣记录 |

---

## 3.1 K 线数据

### `GET /client/candles`

获取指定币种的 K 线数据，最多返回 10000 条。

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `symbol` | string | 是 | 币种名称，如 `BTC`、`ETH` |
| `period` | string | 是 | 周期：`1m` `3m` `5m` `15m` `1h` `4h` `6h` `8h` `12h` `1d` `3d` `1w` `1M` |
| `limit` | int | 否 | 返回条数，默认不限，最大 10000 |

**响应 `data` 结构**

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

| 字段 | 说明 |
|---|---|
| `o/h/l/c` | 开盘/最高/最低/收盘价 |
| `t` | Unix 时间戳（秒，K 线起始时间）|

---

## 3.2 币种列表（含实时价格）

### `GET /client/coins`

返回所有上架币种的实时价格及 24h 行情数据（无请求参数）。

**响应 `data.list` 元素字段**

| 字段 | 说明 |
|---|---|
| `address` | 合约地址 |
| `coin_id` | 内部 ID |
| `name` | 显示名称（BTC/ETH，非 WBTC/WETH）|
| `is_meme` | 是否为 Meme 代币 |
| `status` | `2`=正常，`3`=待下架 |
| `price` | 当前实时价格（USD 字符串）|
| `adr` | 24h 涨跌幅（%，2 位小数）|
| `high_price` / `low_price` | 24h 最高/最低价 |

---

## 3.3 币种基本信息

### `GET /client/coin_infos`

返回所有上架币种的链上配置信息（无请求参数）。

**响应 `data.list` 元素字段**

| 字段 | 说明 |
|---|---|
| `name` / `address` | 名称 / 合约地址 |
| `decimals` | 代币精度 |
| `is_wrapped` / `is_shortable` / `is_stable` / `is_meme` | 布尔属性 |
| `from` | 价格来源（binance / bybit 等）|
| `fee_rate` | 手续费基点（如 `30` = 0.03%）|
| `max_leverage` | 前端最大杠杆 |
| `contract_max_leverage` | 合约最大杠杆 |
| `leverage_slider` | 杠杆选择器可选值列表 |
| `max_position` | 最大持仓量（USD）|
| `status` | `2`=正常，`3`=待下架 |

---

## 3.4 市场行情概览

### `GET /client/coin_market/info`

返回所有币种的综合行情（含交易量、多空持仓）。

**请求参数（均可选）**

| 字段 | 类型 | 说明 |
|---|---|---|
| `sort_by` | string | 排序字段：`adr` / `volume_day` / `position_long_now` / `position_short_now` / `price` |
| `order` | string | `asc` / `desc`（默认 `desc`）|
| `addresses` | string[] | 按合约地址过滤（可多次传入）|

**响应 `data` 结构**

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

## 3.5 手续费查询

### `GET /client/vault/total_fees`

查询某账户的手续费累计记录（按仓位聚合）。

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `address` | string | 是 | 钱包地址 |
| `page_index` | int | 否 | 页码，默认 1 |
| `page_size` | int | 否 | 每页数量，默认 10 |

**响应 `data.list` 元素字段**

| 字段 | 说明 |
|---|---|
| `account` / `collateral_token` / `index_token` | 仓位标识 |
| `is_long` | 多空方向 |
| `total_fees` | 累计手续费（USD 字符串）|

---

## 3.6 市价单交易状态查询

### `POST /client/position_router/tx_status`

根据交易哈希查询市价单的执行状态（仅支持 PositionRouter 创建的市价单）。

**请求体（JSON）**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `address` | string | 是 | 钱包地址 |
| `tx_hash` | string | 是 | 交易哈希 |
| `type` | int | 否 | `0`=开仓（默认），`1`=平仓 |

**响应 `data` 结构**

```json
{ "status": 2, "cancel_type": 0 }
```

**status 枚举值**

| 值 | 说明 |
|---|---|
| `1` | 已创建（等待执行引擎处理）|
| `2` | 已完成（链上 Execute 事件已确认）|
| `3` | 执行失败 |
| `4` | 已取消（`cancel_type`: `0`=普通，`1`=滑点，`2`=爆仓）|
| `5` | 重试中（仅平仓）|

---

## 3.7 链上交易详情查询

### `GET /client/transaction/status`

根据交易哈希和类型，查询链上交易的解析详情。

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `tx_hash` | string | 是 | 链上交易哈希 |
| `type` | string | 是 | 交易类型（见下表）|

**type 枚举值**

| 值 | 说明 |
|---|---|
| `createIncreasePosition` | 创建市价开仓 |
| `createDecreasePosition` | 创建市价平仓 |
| `createIncreaseOrder` | 创建限价开仓单 |
| `createDecreaseOrder` | 创建限价平仓单 |
| `batchCreateDecreaseOrder` | 批量创建限价平仓单 |
| `cancelIncreaseOrder` | 取消限价开仓单 |
| `liquidatePosition` | 强制平仓 |

**响应 `data.list` 元素字段**

| 字段 | 说明 |
|---|---|
| `coin_name` | 如 `BTC/USDT` |
| `is_long` | 多空方向 |
| `size` | 仓位大小（USD）|
| `order_type` | `market` / `limit` |

---

## 3.8 资金池（FundPool）接口

### `GET /client/foundpool/tokens`

获取所有可用于资金池的代币列表（无请求参数）。

**响应**：`{ "tokens": ["USDT", "BTC", "ETH"] }`

---

### `GET /client/foundpool/terms`

获取所有历史期数列表及当前运行期数（无请求参数）。

**响应**：`{ "terms": [...], "current_term": "2024-03-01/2024-06-01" }`

---

### `GET /client/foundpool/lists`

获取资金池列表，支持按代币和期数过滤。

**请求参数（均可选）**

| 字段 | 类型 | 说明 |
|---|---|---|
| `token` | string | 代币名称过滤 |
| `term` | string | 期数过滤，格式 `开始日期/锁定结束日期` |
| `status` | int | `1`=募集中，`2`=运行中，`3`=已结束 |

**响应 `data.list` 元素字段**

| 字段 | 说明 |
|---|---|
| `pool` / `p_id` | 池子地址 / 期数 ID |
| `name` | 池子名称 |
| `token_address` | 抵押代币地址 |
| `start_time` / `end_time` / `lock_end_time` | 时间（Unix）|
| `deposit_amount` | 当前实际存款量 |
| `fundraising_amount` | 募集容量上限 |
| `after_amount` / `after_value` | 当前流动性 / 美元价值 |
| `apr` / `profit` | 收益率 / 收益额 |
| `min_deposit_amount` | 最低存款金额 |
| `out_amount` / `out_value` | 赎回总额（status=3 时有值）|

---

### `GET /client/foundpool/deposit`

查询我的资金池存款记录。

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `user` | string | 是 | 钱包地址 |
| `term` | string | 否 | 期数过滤 |

**响应 `data.list` 元素字段**

| 字段 | 说明 |
|---|---|
| `pool` / `p_id` / `name` | 池子标识 |
| `amount` / `lp_token_amount` | 我的存款 / LP 份额 |
| `status` | `1`=运行中，`2`=锁定中，`3`=已结束 |
| `profit` / `apr` | 预估收益 / 收益率 |
| `is_claimed` | 是否已领取 |

---

### `GET /client/foundpool/total`

获取当前所有运行中资金池的总质押统计（无请求参数）。

**响应字段**

| 字段 | 说明 |
|---|---|
| `total_deposit_amount` | 所有进行中池的总存款（最小单位）|
| `total_fundraising_value` | 对应的 LP Token 总量 |
| `term` | 当前期数标识 |
| `history_avg_apr` | 历史平均年化收益率 |

---

## 3.9 Meme 池接口

### `GET /client/memepool/tokens`

获取所有 Meme 池的代币列表（无请求参数）。

**响应**：`{ "tokens": [{ "name": "PEPE", "token_address": "0x..." }] }`

---

### `GET /client/memepool/lists`

获取 Meme 池列表。

**请求参数（可选）**：`token`（代币合约地址过滤）

**响应 `data.list` 元素字段**

| 字段 | 说明 |
|---|---|
| `pool` / `creator` | 池地址 / 创建者 |
| `name` / `token_address` | 代币名称 / 地址 |
| `status` | `1`=募集中，`2`=运行中，`3`=已结束，`-1`=流动性警告(<30%) |
| `min_amount` / `start_time` / `lock_time` | 最小存款 / 开始时间 / 锁定时长（秒）|
| `deposit_amount` / `total_deposit_amount` | 当前净存款 / 历史累计存款 |
| `after_amount` / `after_value` | 当前流动性 / 美元价值 |
| `profit` / `apr` | 收益额 / 收益率 |

---

### `GET /client/memepool/deposit`

查询我的 Meme 池存款记录。

**请求参数**：`user`（钱包地址，必填），`token`（代币地址，可选）

**响应 `data.list` 元素字段**

| 字段 | 说明 |
|---|---|
| `pool` / `token_address` / `name` | 标识信息 |
| `status` | 同列表接口 |
| `deposit_amount` | 我的存款总量（最小单位）|
| `profit` / `apr` | 我的预估收益 / 收益率 |

---

### `GET /client/memepool/total`

获取所有 Meme 池当前总质押量（无请求参数）。

**响应**：`{ "total_deposit_amount": "...", "total_fundraising_value": "..." }`

---

## 3.10 返佣系统（Invite Return V2）接口

### `POST /client/invite_return/v2/apply_agent`

申请成为合伙人代理。

**请求体（JSON）**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `username` | string | 是 | 用户名（最长 20 字符）|
| `country` | string | 是 | 国家（最长 20 字符）|
| `account` | string | 是 | 钱包地址 |
| `platforms` | string[] | 是 | 平台列表（至少 1 个）|
| `profiles` | object[] | 是 | 各平台资料（`link` 必填）|
| `image_ids` | int[] | 否 | 上传图片 ID 列表 |
| `plan_to_promote_dw` | string | 否 | 推广计划说明 |
| `joined_similar_affiliate_name` | string | 否 | 曾加入的类似项目名 |
| `signature` | string | 是 | 钱包签名 |

---

### `GET /client/invite_return/v2/apply_agent_status`

查询代理申请状态。

**请求参数**：`account`（钱包地址，必填）

---

### `GET /client/invite_return/v2/user_info`

获取当前用户的返佣信息。

**请求参数**：`account`（钱包地址，必填）

**响应 `data` 字段**

| 字段 | 说明 |
|---|---|
| `account_type` | `0`=普通用户，`1`=合伙人 |
| `code` | 我的邀请码 |
| `inviter` | 邀请我的人地址 |
| `return_rate` | 我的当前返佣比率（基点，500 = 5%）|
| `invitee_return_rate` | 上级给我设置的返佣比率 |
| `subordinate_return_rate` | 我给下级设置的统一返佣比例 |
| `total_fees_from_self` | 我自己产生的手续费总量（USD）|
| `return_fees_from_self` | 我自己手续费中的返佣部分 |
| `return_fees_from_invitee` | 我邀请的人产生的手续费返佣 |

---

### `GET /client/invite_return/v2/user_invitees`

获取我邀请的用户列表（分页）。

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `account` | string | 是 | 钱包地址 |
| `page_index` | int | 是 | 页码（最小 1）|
| `page_size` | int | 是 | 每页数量（1-100）|

**响应 `data.list` 元素字段**

| 字段 | 说明 |
|---|---|
| `account` / `account_type` / `code` | 被邀请人信息 |
| `return_rate` | 给该被邀请人设置的返佣比率 |
| `total_fees_from_self` | 该被邀请人产生的手续费 |
| `return_fees_from_self` | 该被邀请人返佣给我的手续费 |
| `return_fees_from_invitee` | 该被邀请人下级返佣给我的手续费 |
| `created_at` | 注册时间（Unix）|

---

### `GET /client/invite_return/v2/invite_return_records`

获取手续费返佣发放记录（分页）。

**请求参数**：`account`、`page_index`、`page_size`（均必填）

**响应 `data.list` 元素字段**

| 字段 | 说明 |
|---|---|
| `return_rate` | 返佣比例 |
| `total_fees` | 该期产生的手续费（USD）|
| `return_fees` | 该期返佣金额（USD）|
| `created_at` | 记录时间（Unix）|
| `status` | 发放状态 |

---

### `POST /client/invite_return/v2/set_return_rate`

设置给指定下级的返佣比率（合伙人专用）。

**请求体（JSON）**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `account` | string | 是 | 上级（调用者）钱包地址 |
| `return_rate` | int | 是 | 返佣比率（0-10000，基点）|
| `signature` | string | 是 | 钱包签名 |
| `invitee` | string | 否 | 指定下级地址（不填则设置统一比率）|

---

### `GET /client/invite_return/v2/invite_friends`

获取邀请好友信息及返佣汇总（好友邀请活动专用）。

**请求参数**：`account`（必填），`page_index`、`page_size`（可选）

**响应 `data` 字段**

| 字段 | 说明 |
|---|---|
| `code` / `account_type` / `return_rate` | 我的基本信息 |
| `friend_return_rate` | 好友返佣比率 |
| `invite_users` | 已邀请用户总数 |
| `return_fees` | 我的累计返佣（USD）|
| `total` / `list` | 记录总数 / 好友列表 |

---

## 3.11 积分权益接口

### `GET /client/point_benefit/return_fees_records`

获取返佣手续费记录（积分权益专用视图）。

**请求参数**：`account`（必填），`page_index`、`page_size`（可选，int64）

**响应 `data` 字段**

| 字段 | 说明 |
|---|---|
| `total` | 记录总数 |
| `level` | 账户等级 |
| `return_rate` | 返佣比率 |
| `total_fees` | 总手续费（USD）|
| `list` | 记录列表（`return_fees`、`return_rate`、`total_fees`、`created_at`）|
