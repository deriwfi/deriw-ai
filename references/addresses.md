# DERIW 合约地址速查表

## 网络配置

| 链 | RPC | Chain ID | 说明 |
|---|---|---|---|
| DERIW 链（L3）| `https://rpc.deriw.com` | `2885` | **默认链（线上）**，所有合约均在此 |
| DERIW Dev 链（L3）| `https://rpc.dev.deriw.com` | — | **开发网**，调试/测试用 |
| Arbitrum（L2）| 公共 RPC | `42161` | 仅 `UserL2ToL3Router` 在此 |

**API Base URL**

| 环境 | Base URL |
|---|---|
| 线上 | `https://api.deriw.com` |
| 开发网 | `https://testgmxapi.weequan.cyou` |

---

## 代币地址（DERIW 链）

| 代币 | 地址 | 说明 |
|---|---|---|
| **USDT（L3）** | `0x3B11A54514A708CC2261f4B69617910E172a90B3` | L3 主池稳定币（USD₮0），6 位精度 |
| **USDT（Arbitrum L2）** | `0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9` | 仅用于 L2→L3 跨链充值 |
| GLP | `0x9E06Fe81dCad8cdc624C4B5fb126Aeed0449CFc9` | 主池 LP 代币 |
| LpToken | `0x62c723Dfd86C07BA8a00B8d70A95fF772De0A26C` | 资金池 V2 LP 代币 |

**集合 1（rate: 1500 基点）**

| 代币 | 地址 |
|---|---|
| ASTER | `0xb2d98323AD400B711e49f131086783d3471AcAd8` |
| XAUt | `0xFbD3AE1b32fcCe9EdD86519223Ef773Dbc399795` |

**集合 2（rate: 8200 基点）**

| 代币 | 地址 |
|---|---|
| WBTC | `0x9cAaCD673fd5C6C4b3Aa3c4E55e930ca5A4f32fe` |
| DOGE | `0x2fDC17Dca642BBA2f4ad5DD51E891A277670B556` |
| WETH | `0x8892549DdcA0f14ee3b4B0dE9A5b6dE5087FE12f` |
| SOL | `0xB7e20EE2392f940Df344a1A940c37030DF0363A0` |
| LINK | `0x83Fbf275A3B79F062a4deb7b876fB17D11b22815` |
| SUI | `0x3C02bFeFC774364a1B2DBa7Dfa093A4b2eAa98db` |
| XRP | `0xc48566c3A2A4358f34BeF026B1148f1A2cD47856` |
| BNB | `0x881E8ef8a6aC1fD7f850978361d9FF67902F0Cac` |
| MNT | `0xAb49AA1FfAbdd69B812163Ac01B8762c1D435342` |
| OKB | `0xF88f37DF527855440424B52CBDda0BcE510fa261` |
| AVAX | `0x644F2FD0476402359B9233B101663E706493A145` |
| LTC | `0x3845E1d4DCDd0694BB9919F9dd87CF06148eacE3` |
| WLD | `0x3Af24C47fe884653D64dc2edF00b8A07e2CBC764` |
| ADA | `0x6a8E5074000D16e865ab72B10Af401D96EF07628` |
| AAVE | `0x7a895267FfDEFF5cb3331ac3D45A0c8Cc8257aba` |
| DOT | `0x74759d2a55BC8e920c1f2ab9b0AD93c62c028B08` |
| UNI | `0xc5B66dc0604a440155689015B1a577d7cF23e3d5` |
| TRUMP | `0x7C823734F32A6Ba9eA7a5537AA05fc8147AC0464` |
| CRV | `0xbAF2a9eD3d52B83730c66801891E79F9aE764Bdd` |
| ONDO | `0x56104434bFF98bE272997262098092d37d074e0B` |
| PAXG | `0x653d3D23F5a09DD38990691fbf47432977b1Bad8` |

**集合 3（rate: 300 基点）**

| 代币 | 地址 |
|---|---|
| SOMI | `0xfa4bdAD5B858263DEadCbD826AD1b4e9a5f43D62` |
| PENDLE | `0xa0750EF1fA99A393ca82771bf91ba80e709ca692` |
| ENS | `0xC0C5630B8B57C88F48626A5aFf0ab4dE5bCfD8a2` |

---

## 系统合约地址（DERIW 链，Chain ID: 2885）

### 核心交易

| 合约 | 地址 |
|---|---|
| **Vault** | `0xbd36B94f0b5A6F75dABa6e11ef3c383294470653` |
| **PositionRouter** | `0x80257F37d327FA0EF464eFa64DdFb755dE111262` |
| **OrderBook** | `0x86A0D906c6375846b05a0EF20931c1B4d2489C13` |

### 价格 & 辅助

| 合约 | 地址 |
|---|---|
| VaultPriceFeed | `0xEC7046731d5ef62Ce62C0291b7dF891E62aECC7E` |
| FastPriceFeed | `0x43948B78477963d7b408A0E27Ae168584C6E07A9` |
| PriceFeed | `0x83CA1aA2Bc20e41287154650e4161dC995278E1D` |
| VaultUtils | `0xfC21471Ef1D98A4e34B91A1EDeCB523ba4EA83D9` |
| DataReader | `0xf0A6bd9feb742E56C39A7df4544A093A12858c64` |
| GlpManager | `0xa61ddD4Cf723cDB339008021aD05e5a1BE140F3f` |

### 批量读取

| 合约 | 地址 |
|---|---|
| OrderBookReader | `0x239e5A9813C469D86D3322133e3c1AbA77A412f8` |
| Reader | `0x84C1F027f05E2c944D0Ccee94d29C34Ea3Fcf9eD` |
| VaultReader | `0x1A635dCb4254965432271b49D2E347615c70383a` |

### 代币数据 & 配置

| 合约 | 地址 |
|---|---|
| CoinData | `0xAb9Ded668e6F7167DA4D3529cC8463AA88d6454f` |
| Phase | `0x463c7e40A4eE5e4E2072055aFa14a15E88b38F5a` |
| Slippage | `0xAd3FAe555Ab3571a2886012DfFcc7C777eC11e7E` |

### 资金池 V2

| 合约 | 地址 |
|---|---|
| **FundRouterV2** | `0x3D343Fc0F6c6D2E047ec5e16e39A9b6A2031B9Ac` |
| **PoolDataV2** | `0x305507D45D5441B81F5dD8FF9f00f65e0B392e86` |
| FundReader | `0x4D778dE09f5C043677bd18888114A9a0911dCE96` |
| FundFactoryV2 | `0x9b0449B664C3b78C71D7647570F2c6D62ca7ADd1` |
| Risk | `0xa595029b9EB4765c09Fc0F64468c2eB1560522a7` |
| AuthV2 | `0xfd172A0EEF6Fb443de4A4b52abcA488E52Ce598c` |

### Meme 池

| 合约 | 地址 |
|---|---|
| MemeRouter | `0xf128817F665E8469BBC3d6f2ade7f073180a010E` |
| MemeData | `0xA4DE9E445C06A0d091a3cdA0661C7B5a5A1fAec8` |
| MemeFactory | `0x363d1d8a71A5e1E6F6528432A59541bb2848B07e` |
| MemePool | 部署时动态创建，通过 MemeFactory 查询 |
| MemeRisk | `0xB9f73b8b2feeD51B16E49dC0482ca0C16964aaa0` |

### 邀请 & 返佣

| 合约 | 地址 |
|---|---|
| ReferralStorage | `0x83a30fa6FA383FcA37AD1e72fFf927961e06cD79` |
| ReferralData | `0x2Bd4B513C5B2aD07516CCA330DE1AE87B82FFA98` |
| FeeBonus | `0x1F1E7D48424ed1BdF9cD7aEB85d319eFF0191A6E` |

### 其他

| 合约 | 地址 |
|---|---|
| GlpRewardRouter | `0xE9F045f0CE5dc1AD552e20E8df668194d67f95D5` |
| TokenHelper | `0xc5Ce3D29De397c4ec7C3f2b47ddD4608f8143e8c` |
| BlackList | `0x24A3D7c8134238ea4Ec4e0feF288C2AD31852821` |
| Multicall3 | `0x15789E21a9D09f8F32738bd44b683F79D1299104` |
| **UserL3ToL2Router** | `0x8fb358679749FD952Ea5f090b0eA3675722B08F5` |

### 跨链桥（Arbitrum L2，Chain ID: 42161）

| 合约 | 地址 |
|---|---|
| **UserL2ToL3Router** | `0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325` |

---

## 精度速查

| 类型 | 精度 | 示例 |
|---|---|---|
| 价格（USD）| `1e30` | `ethers.parseUnits("65000", 30)` |
| USDT 金额 | `1e6` | `ethers.parseUnits("100", 6)` |
| 代币金额 | `1e18`（或 decimals）| `ethers.parseUnits("1", 18)` |
| 手续费基点 | `10000 = 100%` | `30 = 0.3%` |
| 杠杆 | `10000 = 1x` | `100000 = 10x` |

---

## Enum 常量（跨链路由）

跨链脚本和 EIP-712 签名中使用的字符串枚举值。新增枚举值时在此维护。

### `transactionType`（UserL3ToL2Router.outboundTransfer Message 字段）

| 值 | 说明 |
|---|---|
| `"Withdraw USDT"` | USDT 提现转账（通过真实 tx 逆向确认） |

### `chain`（UserL3ToL2Router.outboundTransfer Message 字段）

| 值 | 目标链 | 说明 |
|---|---|---|
| `"DeriW Chain"` | Arbitrum（L2）| 线上：从 DERIW 链提现到 Arbitrum |
| `"DeriW Devnet"` | Arbitrum Sepolia（L2）| dev 环境：从 DERIW Dev 链提现到 Arbitrum Sepolia |

### EIP-712 签名注意事项（UserL3ToL2Router）

- `domain.name = 'Transaction'`（非 'DERIW'）
- `domain.chainId` 取自 `router.chainid()`（线上=42161，Dev=421614），非网络 chainId
- 签名需用合约 `hashDomain/hashMessage/hashData` 计算最终 hash，再直接签名（`wallet.signingKey.sign`），不可用标准 `signTypedData`
- `_data` 传空字节 `'0x'`（token/amount/receiver 已在 message 中）
- `msg.value = 0`（合约不收 ETH；Dev 链需 `gasPrice: 0n`）
- `l2Token` 取自 `USDT_L3.l1Address()`（Dev: `0x259D16cd04c451eed734908b3df2D3e58AC1e99f`，线上: `0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9`）

---

## 开发网合约地址（Dev，RPC: https://rpc.dev.deriw.com）

> API Base URL：`https://testgmxapi.weequan.cyou`

### 主池代币（Dev）

| 代币 | 地址 | 说明 |
|---|---|---|
| **USDT** | `0x12530882c64B1c22dAdf2F60639145029c5081Da` | 主池稳定币，6 位精度 |

**单币种**

| 代币 | 地址 |
|---|---|
| WBTC | `0x9F37821B7C4A5EfaA4d92aa9A6dE526237C30ceD` |

**集合 1**

| 代币 | 地址 |
|---|---|
| XAUT | `0x5932b02809Dab34C98Ca3B5E66571B10Ad7A3f3B` |
| ETH | `0x81Af7E76aDC98B7587d46B551e5707A46e35eBe5` |
| SOL | `0xA4aeF370Be85fb198a74dAA9b61cda9684BC1778` |
| XRP | `0xA2799A14e15A93D0263d02BAa5BA4bb377e51908` |
| LTC | `0xCD8806f52F48716014075596DaF0128159a43d28` |
| PAXG | `0xE274217E73337a899b8BF543BcbcaDBDc89199F8` |
| ONDO | `0xf863138d2119190199508bdB2BEc2474ad383935` |

**集合 2**

| 代币 | 地址 |
|---|---|
| XAG | `0x8282e36Ac85aB338DcCEfEFfbf4c71FD1efa5D1B` |

### Meme 池代币（Dev）

| 代币 | 地址 |
|---|---|
| ACT（主池地址）| `0x7a3889ABC99B04b431baE30a00748BC290656939` |

### 系统合约（Dev）

#### 核心交易

| 合约 | 地址 |
|---|---|
| **Vault** | `0x75Da7523f99bA38a8cAD831EbE2F09aDF5896d89` |
| **PositionRouter** | `0x12f0C0fb9548EeB2DAa379d10C7CdCB63f6848F9` |
| **OrderBook** | `0x18c6d9d1f9a1d6b9b3fA6d104f9A0d8efa7C9689` |
| Router | `0x23D9D11717a5CC9A90A7982445452e225060B511` |

#### 价格 & 辅助

| 合约 | 地址 |
|---|---|
| VaultPriceFeed | `0x843a577B32F280518E8dF305D8AD469111279135` |
| FastPriceFeed | `0x32fDB8b4674e1cC233175D3C7eD41c6e21dbD3B4` |
| FastPriceEvents | `0xC0352F5F29a2FDD782A3dB84C498c91A2dF3461e` |
| PriceFeed | `0x2b06F20F9ed526A0C268d0401a0bF22a304db5c9` |
| VaultUtils | `0x523Ebd1f0D6BF83fF0dd79a3A2CB8c259c030De5` |
| GlpManager | `0xb44104D353505718ab87E4037781ef862B39F6d1` |
| DataReader | `0xe3D2e9B99050F047f77159651950b7bdfD7465D0` |
| ADL | `0x523213b127815f7ec190930908886d6D1Ac2857E` |

#### 批量读取

| 合约 | 地址 |
|---|---|
| Reader | `0xb49676cF7ff87a42dae3129997688333886AC126` |
| VaultReader | `0xEf4a5Dd7418Fd53508E94e3f7b8A977425bE70d4` |
| OrderBookReader | `0xF2cc684b2bD5D9F114F48e80aD06036797A94660` |

#### 代币数据 & 配置

| 合约 | 地址 |
|---|---|
| CoinData | `0xC75DC20185d2aB64d5faBF227285AB171D50D825` |
| Slippage | `0x3600Cc37027146d0E9cf0E146D21390CFF474d75` |
| GLP | `0x91A74B8bf30dfe0DB611800927Dee13E28808218` |
| LpToken | `0xCaf5c59286Cd3B38db3d9Be1d2e47538D44Ed060` |

#### 资金池 V2

| 合约 | 地址 |
|---|---|
| **FundRouterV2** | `0x324D847bc335032855972DA8d2f825BF7df14dCD` |
| **PoolDataV2** | `0xf0290fAc0B56E0F9EB09abdc24C0713Ce4D96116` |
| FundReader | `0x4915e36296175975764c2c85cE73DA578da492b5` |
| FundFactoryV2 | `0xe3b1410e7712d8205c428ae4F1E1609618fD0aA4` |
| Risk | `0x8a6F1711Da6E059083C0867f4777A513D30c0103` |
| AuthV2 | `0x2861BE41cd7Fd1C2bAa8Ea256c37AD7De68Cb3Bb` |

#### Meme 池

| 合约 | 地址 |
|---|---|
| MemeRouter | `0xeDa46Dc1f8A64C7F5C811cb2dE1cC775b04A0195` |
| MemeData | `0xa4E451aE6C7e80E5587949CB557BeB700f0500A1` |
| MemeFactory | `0x52a87ef53C69235EB3Ac0559B642395618f47Ffd` |
| MemeRisk | `0x141C93DE887DaC44569a9F3FE7dd1210281D5dbC` |
| MemeErrorContract | `0xf2cF85c7BF91900172690680C96c918348190881` |

#### 邀请 & 返佣

| 合约 | 地址 |
|---|---|
| ReferralStorage | `0x041d7bd9D77f6aa9eE4037cf38e714Bf8eA1787B` |
| ReferralData | `0x228cF505D464C02625371904935e0011b9e3e134` |
| FeeBonus | `0x8cCA264D88F0Aa2608Ed67734b57F6d8e2aB8B42` |

#### 其他

| 合约 | 地址 |
|---|---|
| GlpRewardRouter | `0xbe38b4511b8A44dC0D36367D22f56f4b75a6CD6b` |
| TokenHelper | `0xAf7C56F337468bC44a63D37A34804151D62F53cd` |
| Airdrop | `0x6B86549A7dd94EEA6AB53a79596C25c7AC380725` |
| BlackList | `0x4937B62E5d3F00A31C4493FC175D0ce54dcAc5a2` |
| Multicall3 | `0x316bdC9eDe87d7D79e27D5CeF9CBB44A2c92F0f7` |
| ErrorContractV2 | `0xe3c2e0Fa6F93C6d3616c8eE6F696dAa0d91E3e6f` |
| VaultErrorController | `0x14847B61deB346db6a3997bA666A0e1E6a8A4F1E` |
| Timelock | `0x7bC076Ef7574e327143D1bbeCB41316373a5CEFc` |
| **UserL3ToL2Router** | `0x32068069f13191B57c03Eee8531a8C82b26d12B9` |

#### 跨链桥（Arbitrum L2）

| 合约 | 地址 |
|---|---|
| **UserL2ToL3Router** | `0x81A88de21De37A025660D746164A9AB013822263` |