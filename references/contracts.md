# DERIW 合约方法速查手册

> 所有合约均在 DERIW 链（Chain ID: 2885，RPC: `https://rpc.deriw.com`）。
> 唯一例外：`UserL2ToL3Router` 在 Arbitrum（Chain ID: 42161）。
> ABI 文件在 `assets/` 目录。

---

## Vault（核心 Vault 合约）

地址：`0xbd36B94f0b5A6F75dABa6e11ef3c383294470653`

**读取方法（view）**

| 方法 | 参数 | 说明 |
|---|---|---|
| `getPosition(account, collateralToken, indexToken, isLong)` | address×3, bool | 获取用户仓位完整数据 |
| `getPositionKey(account, collateralToken, indexToken, isLong)` | address×3, bool | 计算仓位唯一 key（pure）|
| `getPositionFrom(key)` | bytes32 | 通过 key 直接读取仓位 |
| `getDelta(indexToken, size, averagePrice, isLong, lastIncreasedTime)` | address, uint256×3, bool | 计算当前未实现盈亏 |
| `getMaxPrice(token)` | address | 代币最大价格（用于空单开仓）|
| `getMinPrice(token)` | address | 代币最小价格（用于多单开仓）|
| `getTokenData(indexToken, collateralToken)` | address×2 | 读取代币池数据 |
| `getAmount(token, account)` | address×2 | 账户在 Vault 中的代币余额 |
| `poolAmounts(indexToken, collateralToken)` | address×2 | 池子总量 |
| `reservedAmounts(indexToken, collateralToken)` | address×2 | 仓位预留量 |
| `guaranteedUsd(indexToken, collateralToken)` | address×2 | 多单担保 USD 总量 |
| `globalLongSizes(indexToken)` | address | 全局多头总持仓 |
| `globalShortSizes(indexToken)` | address | 全局空头总持仓 |
| `globalLongAveragePrices(indexToken)` | address | 全局多头平均开仓价 |
| `globalShortAveragePrices(indexToken)` | address | 全局空头平均开仓价 |
| `maxGlobalLongSizes(indexToken)` | address | 多头持仓上限 |
| `maxGlobalShortSizes(indexToken)` | address | 空头持仓上限 |
| `tokenToUsdMin(token, tokenAmount)` | address, uint256 | 代币数量 → USD（最低价）|
| `usdToTokenMin(token, usdAmount)` | address, uint256 | USD → 代币数量（最低价）|
| `usdToTokenMax(token, usdAmount)` | address, uint256 | USD → 代币数量（最高价）|
| `validateLiquidation(account, collateralToken, indexToken, isLong, raise)` | address×3, bool×2 | 检查是否可被清算 |
| `getCoinType(indexToken)` | address | 获取代币类型（普通/Meme）|
| `positions(key)` | bytes32 | 直接读取仓位 struct |
| `whitelistedTokens(token)` | address | 是否为白名单代币 |
| `stableTokens(token)` | address | 是否为稳定币 |
| `shortableTokens(token)` | address | 是否可做空 |
| `tokenDecimals(token)` | address | 代币精度 |
| `usdt()` | — | USDT 合约地址 |
| `marginFeeBasisPoints()` | — | 手续费率（基点）|
| `liquidationFeeUsd()` | — | 清算手续费（USD）|
| `maxLeverage()` | — | 最大杠杆倍数 |
| `minProfitTime()` | — | 最小盈利保护时长 |
| `minProfitBasisPoints(token)` | address | 代币最小盈利基点 |

---

## PositionRouter（市价单路由）

地址：`0x80257F37d327FA0EF464eFa64DdFb755dE111262`

**读取方法（view）**

| 方法 | 参数 | 说明 |
|---|---|---|
| `getRequestKey(account, index)` | address, uint256 | 计算请求 key |
| `increasePositionRequests(key)` | bytes32 | 读取开仓请求详情 |
| `decreasePositionRequests(key)` | bytes32 | 读取平仓请求详情 |
| `getIncreasePositionRequestPath(key)` | bytes32 | 读取开仓 token 路径 |
| `getDecreasePositionRequestPath(key)` | bytes32 | 读取平仓 token 路径 |
| `getSlippagePrice(key, indexToken, size, isLong)` | bytes32, address, uint256, bool | 获取滑点价格 |
| `getVaultPrice(indexToken, size, isLong)` | address, uint256, bool | 获取 Vault 当前执行价格 |
| `increasePositionsIndex(account)` | address | 账户开仓请求计数 |
| `decreasePositionsIndex(account)` | address | 账户平仓请求计数 |
| `maxTimeDelay()` | — | 最大执行延迟时间（秒）|
| `minAmount()` | — | 最小交易金额 |

**写入方法（用户可调用）**

| 方法 | 参数 | 说明 |
|---|---|---|
| `createIncreasePosition(path, indexToken, amountIn, sizeDelta, isLong, acceptablePrice, referralCode, callbackTarget)` | — | 创建市价开仓请求 |
| `createDecreasePosition(path, indexToken, collateralDelta, sizeDelta, isLong, receiver, acceptablePrice, callbackTarget)` | — | 创建市价平仓请求 |
| `cancelIncreasePosition(key)` | bytes32 | 取消未执行开仓请求 |
| `cancelDecreasePosition(key)` | bytes32 | 取消未执行平仓请求 |

**关键参数说明**

- `path`：`[USDT]`（稳定币作为保证金）
- `amountIn`：`1e6` 精度（USDT）
- `sizeDelta`：`1e30` 精度（USD）
- `acceptablePrice`：多单用 `MaxUint256`，空单用 `0n`（不限制滑点）
- `referralCode`：邀请码（bytes32），无则传 `ethers.ZeroHash`
- `callbackTarget`：回调合约地址，通常传 `ethers.ZeroAddress`

---

## OrderBook（限价单合约）

地址：`0x86A0D906c6375846b05a0EF20931c1B4d2489C13`

**读取方法（view）**

| 方法 | 参数 | 说明 |
|---|---|---|
| `getIncreaseOrder(account, orderIndex)` | address, uint256 | 读取限价开仓单详情 |
| `getDecreaseOrder(account, orderIndex)` | address, uint256 | 读取限价平仓单详情 |
| `getIncreaseOrderData(account, orderIndex)` | address, uint256 | 读取开仓单扩展数据 |
| `increaseOrdersIndex(account)` | address | 账户限价开仓单计数 |
| `decreaseOrdersIndex(account)` | address | 账户限价平仓单计数 |

**写入方法（用户可调用）**

| 方法 | 参数 | 说明 |
|---|---|---|
| `createIncreaseOrder(path, amountIn, indexToken, sizeDelta, collateralToken, isLong, triggerPrice, triggerAboveThreshold, lever)` | — | 创建限价开仓单 |
| `createDecreaseOrder(indexToken, sizeDelta, collateralToken, collateralDelta, isLong, triggerPrice, triggerAboveThreshold, lever)` | — | 创建限价平仓单 |
| `cancelIncreaseOrder(orderIndex)` | uint256 | 取消限价开仓单 |
| `cancelDecreaseOrder(orderIndex)` | uint256 | 取消限价平仓单 |
| `cancelMultiple(increaseOrderIndexes, decreaseOrderIndexes)` | uint256[]×2 | 批量取消订单 |
| `batchCreateDecreaseOrder(orders)` | tuple[] | 批量创建限价平仓单 |

**关键参数说明**

- `lever`：`sizeDelta * 10000n / parseUnits(amountIn, 30)`（开仓）；平仓传 `10000n`
- `triggerAbove`：`true`=价格涨破触发（止盈多单/止损空单），`false`=价格跌破触发

---

## VaultPriceFeed（价格聚合器）

地址：`0xEC7046731d5ef62Ce62C0291b7dF891E62aECC7E`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getPrice(token, maximise, _, _)` | address, bool×3 | 获取聚合后最终价格 |
| `getPrimaryPrice(token, maximise)` | address, bool | 主价格源价格 |
| `getLatestPrimaryPrice(token)` | address | 主价格源最新价格 |
| `spreadBasisPoints(token)` | address | 该代币价差基点 |

---

## FastPriceFeed（快速价格）

地址：`0x43948B78477963d7b408A0E27Ae168584C6E07A9`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getPrice(token, refPrice, maximise)` | address, uint256, bool | 获取快速价格 |
| `prices(token)` | address | 最新推送的链上价格 |
| `getPriceData(token)` | address | 返回价格元数据 |
| `lastUpdatedAt()` | — | 最后更新时间戳 |
| `lastUpdatedBlock()` | — | 最后更新区块号 |

---

## PriceFeed（链上价格存储）

地址：`0x83CA1aA2Bc20e41287154650e4161dC995278E1D`

| 方法 | 参数 | 说明 |
|---|---|---|
| `latestAnswer(token)` | address | 最新价格答案 |
| `latestRound(token)` | address | 最新轮次 |
| `getRoundData(token, roundId)` | address, uint80 | 获取历史轮次价格 |
| `decimals()` | — | 价格精度 |

---

## VaultUtils（手续费 / 仓位计算辅助）

地址：`0xfC21471Ef1D98A4e34B91A1EDeCB523ba4EA83D9`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getFeeBasisPoints(indexToken)` | address | 获取该代币的手续费基点 |
| `getPositionFee(_, _, indexToken, _, sizeDelta)` | address×3, bool, uint256 | 计算仓位手续费 |
| `getCalculatePositionData(key, collateralToken, indexToken)` | bytes32, address×2 | 计算仓位详细数据 |
| `validateLiquidation(account, collateralToken, indexToken, isLong, raise)` | address×3, bool×2 | 验证是否可清算 |

---

## DataReader（链上数据聚合读取）

地址：`0xf0A6bd9feb742E56C39A7df4544A093A12858c64`

| 方法 | 参数 | 说明 |
|---|---|---|
| `poolAmounts(indexToken, collateralToken)` | address×2 | 池子总量 |
| `reservedAmounts(indexToken, collateralToken)` | address×2 | 预留量 |
| `guaranteedUsd(indexToken, collateralToken)` | address×2 | 担保 USD |
| `tokenBalances(indexToken, collateralToken)` | address×2 | 代币余额 |
| `getTargetIndexToken(indexToken)` | address | 获取目标 indexToken |

---

## GlpManager（GLP 流动性管理）

地址：`0xa61ddD4Cf723cDB339008021aD05e5a1BE140F3f`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getAmount(token, account)` | address×2 | 账户 GLP 余额 |
| `lastAddedAt(account)` | address | 账户最后添加流动性时间 |
| `cooldownDuration()` | — | 移除流动性冷却期 |
| `glp()` | — | GLP 代币合约地址 |
| `usdt()` | — | USDT 合约地址 |

---

## GLP（GLP 代币）

地址：`0x9E06Fe81dCad8cdc624C4B5fb126Aeed0449CFc9`

标准 ERC-20，精度 18。

| 方法 | 参数 | 说明 |
|---|---|---|
| `balanceOf(account)` | address | 账户 GLP 余额 |
| `totalSupply()` | — | GLP 总供应量 |
| `allowance(owner, spender)` | address×2 | 授权额度 |

---

## ADL（自动去杠杆）

| 方法 | 参数 | 说明 |
|---|---|---|
| `shouldExecuteADL(indexToken)` | address | 是否需要触发 ADL |
| `getPoolNetPosition(indexToken)` | address | 池子净多空方向 |
| `getPoolRealTimeNetValue(indexToken)` | address | 池子实时净值 |
| `getPoolLever(indexToken)` | address | 池子当前杠杆率 |
| `getLeverageTriggerValue(indexToken)` | address | ADL 触发杠杆阈值 |
| `getListADLPosition(targetIndexToken, index, num)` | address, uint256×2 | 分页读取 ADL 候选仓位 |
| `batchGetPositions(positionData[])` | tuple[] | 批量读取仓位数据 |

---

## FundRouterV2（资金池 V2 用户入口）

地址：`0x3D343Fc0F6c6D2E047ec5e16e39A9b6A2031B9Ac`

| 方法 | 参数 | 说明 |
|---|---|---|
| `deposit(pool, pid, amount, isResubmit)` | address, uint256, uint256, bool | 向指定池子/期数存入资金 |
| `claim(pool, pid)` | address, uint256 | 领取单期收益 |
| `batchClaim(pool, pid[])` | address, uint256[] | 批量领取多期收益 |
| `compoundToNext(pool, pid, number)` | address, uint256×2 | 将收益复利滚入下一期 |

---

## PoolDataV2（资金池 V2 数据层）

地址：`0x305507D45D5441B81F5dD8FF9f00f65e0B392e86`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getFoundInfo(pool, pid)` | address, uint256 | 获取池子基本信息 |
| `getFoundState(pool, pid)` | address, uint256 | 获取池子状态（募资进度/阶段）|
| `getUserInfo(user, pool, pid)` | address×2, uint256 | 用户在指定池子的质押信息 |
| `getUserPerInfo(user, pool, pid, depositID)` | address×2, uint256×2 | 用户某笔存款详细数据 |
| `getFundraisingAmount(pool, pid)` | address, uint256 | 池子当期募资总量 |
| `currPeriodID(pool)` | address | 当前运行期数 |
| `poolToken(pool)` | address | 池子对应的代币地址 |
| `getAmount(token, account)` | address×2 | 账户代币余额 |

---

## FundReader（资金池只读计算）

地址：`0x4D778dE09f5C043677bd18888114A9a0911dCE96`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getDepositLpAmount(pool, pid, amount, isNext)` | address, uint256×2, bool | 计算存入后可得 LP 数量 |
| `getLpValue(pool, pid, tokenOut, glpAmount)` | address, uint256, address, uint256 | LP 对应的 token 价值 |
| `getPrice(token)` | address | 获取代币价格 |
| `getTokenValue(token, amount)` | address, uint256 | 代币金额 → USD 价值 |
| `getUserCompoundAmount(pool, user, pid)` | address×2, uint256 | 用户可复利金额 |

---

## MemeRouter（Meme 池用户入口）

地址：`0xf128817F665E8469BBC3d6f2ade7f073180a010E`

| 方法 | 参数 | 说明 |
|---|---|---|
| `deposit(pool, amount)` | address, uint256 | 存入 Meme 池 |
| `claim(pool, amount)` | address, uint256 | 领取 Meme 池收益 |
| `claimAll()` | — | 领取所有 Meme 池收益 |

---

## MemeData（Meme 池数据层）

地址：`0xA4DE9E445C06A0d091a3cdA0661C7B5a5A1fAec8`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getMemeState(pool)` | address | 获取 Meme 池状态 |
| `getMemeUserInfo(pool, user)` | address×2 | 获取用户在 Meme 池的信息 |
| `getUserDepositPoolNum(user)` | address | 用户参与池子总数 |
| `getUserDepositPoolisIn(user, pool)` | address×2 | 用户是否参与了该池 |
| `getAmount(token, account)` | address×2 | 账户代币余额 |
| `isTokenCreate(token)` | address | Meme 代币是否已创建池 |
| `tokenToPool(token)` | address | 代币 → 对应池地址 |
| `poolToken(pool)` | address | 池 → 对应代币地址 |
| `lockTime()` | — | 锁定期时长 |
| `startTime(pool)` | address | 池子开始时间 |

---

## MemeFactory（Meme 池创建）

地址：`0x363d1d8a71A5e1E6F6528432A59541bb2848B07e`

| 方法 | 参数 | 说明 |
|---|---|---|
| `createPool(token)` | address | 为指定代币创建 Meme 池 |
| `getPoolNum(account)` | address | 账户创建的池数量 |
| `getWhitelistIsIn(account)` | address | 是否在创建白名单 |
| `poolID()` | — | 全局池 ID 计数 |
| `idToPool(id)` | uint256 | ID → 池地址 |
| `poolOwner(pool)` | address | 池子拥有者 |

---

## MemePool（Meme 资金池）

> 部署时动态创建，地址通过 MemeData.tokenToPool(token) 查询。

| 方法 | 参数 | 说明 |
|---|---|---|
| `withdraw()` | — | 提取已到期的质押资产及收益 |
| `memeFactory()` | — | 关联的 MemeFactory 地址 |

---

## OrderBookReader（订单薄批量读取）

地址：`0x239e5A9813C469D86D3322133e3c1AbA77A412f8`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getIncreaseOrders(orderBookAddress, account, indices)` | address×2, uint256[] | 批量读取限价开仓单 |
| `getDecreaseOrders(orderBookAddress, account, indices)` | address×2, uint256[] | 批量读取限价平仓单 |

---

## Reader（链上数据批量读取）

地址：`0x84C1F027f05E2c944D0Ccee94d29C34Ea3Fcf9eD`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getPositions(vault, account, collateralTokens, indexTokens, isLong)` | address×2, address[], address[], bool[] | 批量读取多个仓位数据 |
| `getVaultTokenInfo(vault, weth, tokens)` | address×2, address[] | 批量读取 Vault 代币信息 |
| `getTokenBalances(account, tokens)` | address, address[] | 批量读取账户代币余额 |
| `getCurrBlockNumber()` | — | 当前区块号 |
| `getCurrTime()` | — | 当前时间戳 |

---

## VaultReader（Vault 扩展读取）

地址：`0x1A635dCb4254965432271b49D2E347615c70383a`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getVaultTokenInfoV4(vault, positionRouter, weth, tokens)` | address×3, address[] | 批量读取 Vault V4 完整代币信息（含资金费率、利用率等）|

---

## ReferralStorage（邀请码存储）

地址：`0x83a30fa6FA383FcA37AD1e72fFf927961e06cD79`

**读取方法（view）**

| 方法 | 参数 | 说明 |
|---|---|---|
| `ownerCode(account)` | address | 账户持有的邀请码 |
| `codeOwner(code)` | string | 邀请码对应的拥有者地址 |
| `referral(account)` | address | 账户的推荐人地址 |
| `getSecondaryAccount(account, index)` | address, uint256 | 账户的第 index 个直接下级地址 |
| `getSecondaryAccountLength(account)` | address | 直接下级总数 |
| `getPartnerAccountAccountIsIn(user)` | address | 是否为合伙人 |
| `getPartnerAccountAccountLength()` | — | 合伙人总数 |

**写入方法（用户可调用）**

| 方法 | 参数 | 说明 |
|---|---|---|
| `setTraderReferralCodeByUser(code)` | string | 用户自行绑定邀请码 |

---

## ReferralData（手续费返佣数据）

地址：`0x2Bd4B513C5B2aD07516CCA330DE1AE87B82FFA98`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getAmount(token, account)` | address×2 | 账户可提现的返佣余额 |
| `totalIndex()` | — | 手续费记录总数 |
| `indexFee(index)` | uint256 | 第 index 笔手续费金额 |

---

## FeeBonus（手续费奖励分配）

地址：`0x1F1E7D48424ed1BdF9cD7aEB85d319eFF0191A6E`

| 方法 | 参数 | 说明 |
|---|---|---|
| `feeAmount(account)` | address | 账户可领取的手续费奖励 |
| `feeMemeAmount(account)` | address | 账户可领取的 Meme 手续费奖励 |
| `feeRate(account)` | address | 账户手续费奖励比率 |
| `claimFeeAmount(account)` | address | 领取手续费奖励（USDT）|
| `claimMemeFeeAmount(account)` | address | 领取 Meme 手续费奖励 |

---

## GlpRewardRouter（GLP 路由只读）

地址：`0xE9F045f0CE5dc1AD552e20E8df668194d67f95D5`

| 方法 | 参数 | 说明 |
|---|---|---|
| `glpManager()` | — | GlpManager 合约地址 |
| `foundReader()` | — | FundReader 合约地址 |
| `USDT()` | — | USDT 合约地址 |
| `pendingReceivers(account)` | address | 账户待领取记录 |

---

## TokenHelper（签名验证工具）

地址：`0xc5Ce3D29De397c4ec7C3f2b47ddD4608f8143e8c`

| 方法 | 参数 | 说明 |
|---|---|---|
| `getSignatureUser(domain, message, signature)` | tuple×2, bytes | 从签名恢复签名者地址（pure）|
| `hashDomain(domain)` | tuple | 计算 domain hash（pure）|
| `hashMessage(message)` | tuple | 计算 message hash（pure）|
| `getTokenBalance(token, account)` | address×2 | 查询账户 token 余额 |
| `isHashUse(hash)` | bytes32 | 签名 hash 是否已使用 |
| `chainid()` | — | 当前链 ID |

---

## BlackList（系统熔断 / 黑名单）

地址：`0x24A3D7c8134238ea4Ec4e0feF288C2AD31852821`

| 方法 | 参数 | 说明 |
|---|---|---|
| `isFusing()` | — | 系统是否处于熔断状态 |
| `isStop()` | — | 系统是否已停止 |
| `getOperatorsContains(account)` | address | 账户是否为操作员 |

---

## SwapToken（代币销毁兑换）

| 方法 | 参数 | 说明 |
|---|---|---|
| `getUserBalance(token, user)` | address×2 | 查询用户在该代币的可兑换余额 |
| `getContractBalance(token)` | address | 查询合约持有的该代币余额 |
| `getTokenTotalSupply(token)` | address | 该代币总供应量 |
| `tokenBurnAmount(token)` | address | 该代币已累计销毁数量 |
| `basseRate()` / `tokenRate()` | — | 基础兑换费率 / 全局兑换比率 |

---

## UserL2ToL3Router（L2 → L3 跨链桥）

> **链**：Arbitrum（Chain ID: 42161）
> 地址：`0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325`

**读取方法（view）**

| 方法 | 参数 | 说明 |
|---|---|---|
| `getFee(token, amount)` | address, uint256 | 计算跨链手续费 |
| `getTokenIsIn(token)` | address | token 是否支持跨链 |
| `getUserDepositInfo(token, user)` | address×2 | 用户该 token 跨链存款信息 |

**写入方法（用户可调用）**

| 方法 | 参数 | 说明 |
|---|---|---|
| `outboundTransfer(_token, _to, _amount, _maxGas, _gasPriceBid, _data)` | address×2, uint256×3, bytes | 发起 L2→L3 跨链充值（payable，需支付 ETH 手续费）|

---

## UserL3ToL2Router（L3 → L2 跨链桥）

> **链**：DERIW 链（Chain ID: 2885）
> 地址：`0x8fb358679749FD952Ea5f090b0eA3675722B08F5`

**读取方法（view）**

| 方法 | 参数 | 说明 |
|---|---|---|
| `getValue(token, amount)` | address, uint256 | 返回 `[netAmount, fee]`：到账金额 + ETH 手续费 |
| `getTokenIsIn(token)` | address | token 是否支持跨链 |
| `getUserDepositInfo(token, user)` | address×2 | 用户该 token 提现信息 |
| `isHashUse(hash)` | bytes32 | 签名 hash 是否已使用 |

**写入方法（用户可调用，payable）**

| 方法 | 参数 | 说明 |
|---|---|---|
| `outboundTransfer(data, domain, message, signature)` | bytes, tuple×2, bytes | 发起 L3→L2 提现（需 EIP-712 签名）|

**EIP-712 签名结构（Message 8 字段）**

```javascript
// Enum 值详见 references/addresses.md #Enum 常量
const domain = {
  name: 'DERIW', version: '1',
  chainId: 2885,
  verifyingContract: '0x8fb358679749FD952Ea5f090b0eA3675722B08F5'
};
const types = {
  Message: [
    { name: 'transactionType', type: 'string'  },  // 'Withdraw'
    { name: 'from',            type: 'address' },  // 发送方地址
    { name: 'token',           type: 'address' },  // L3 USDT
    { name: 'l2Token',         type: 'address' },  // Arbitrum USDT
    { name: 'destination',     type: 'address' },  // 接收方地址
    { name: 'amount',          type: 'uint256' },  // 金额（1e6）
    { name: 'deadline',        type: 'uint256' },  // 截止时间戳
    { name: 'chain',           type: 'string'  },  // 'DeriW Chain'（线上）/ 'DeriW Devnet'（dev）
  ]
};
const message = {
  transactionType: 'Withdraw',
  from:            wallet.address,
  token:           USDT_L3,
  l2Token:         USDT_L2,
  destination:     receiver,
  amount,
  deadline:        BigInt(Math.floor(Date.now() / 1000) + 600),
  chain:           'DeriW Chain',  // dev 环境用 'DeriW Devnet'
};
const signature = await wallet.signTypedData(domain, types, message);
const [, fee] = await router.getValue(USDT_L3, amount);
const data = ethers.AbiCoder.defaultAbiCoder().encode(
  ['address', 'uint256', 'address'], [USDT_L3, amount, receiver]
);
await router.outboundTransfer(data, domain, message, signature, { value: fee });
```

---

## 精度速查

| 数值类型 | 精度 | ethers.js 示例 |
|---|---|---|
| 价格（USD）| `1e30` | `ethers.parseUnits("65000", 30)` |
| USDT 金额 | `1e6` | `ethers.parseUnits("100", 6)` |
| 代币金额 | `1e18` | `ethers.parseUnits("1", 18)` |
| GLP 金额 | `1e18` | `ethers.parseUnits("1", 18)` |
| 手续费基点 | `10000 = 100%` | `30 = 0.3%` |
| 杠杆 | `10000 = 1x` | `500000 = 50x` |
