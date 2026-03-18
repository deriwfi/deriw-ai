# DERIW Contract Address Reference

## Network Configuration

| Chain | RPC | Chain ID | Notes |
|---|---|---|---|
| DERIW Chain (L3) | `https://rpc.deriw.com` | `2885` | **Default chain (Production)** — all contracts are here |
| DERIW Dev Chain (L3) | `https://rpc.dev.deriw.com` | `18417507517` | **Devnet** — for debugging/testing |
| Arbitrum (L2) | Public RPC | `42161` | Only `UserL2ToL3Router` is here |

**API Base URL**

| Environment | Base URL |
|---|---|
| Production | `https://api.deriw.com` |
| Devnet | `https://testgmxapi.weequan.cyou` |

---

## Token Addresses (DERIW Chain)

| Token | Address | Notes |
|---|---|---|
| **USDT (L3)** | `0x3B11A54514A708CC2261f4B69617910E172a90B3` | L3 main pool stablecoin (USD₮0), 6 decimals |
| **USDT (Arbitrum L2)** | `0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9` | Used only for L2→L3 cross-chain deposits |
| GLP | `0x9E06Fe81dCad8cdc624C4B5fb126Aeed0449CFc9` | Main pool LP token |
| LpToken | `0x62c723Dfd86C07BA8a00B8d70A95fF772De0A26C` | Fund Pool V2 LP token |

**Set 1 (rate: 1500 bps)**

| Token | Address |
|---|---|
| ASTER | `0xb2d98323AD400B711e49f131086783d3471AcAd8` |
| XAUt | `0xFbD3AE1b32fcCe9EdD86519223Ef773Dbc399795` |

**Set 2 (rate: 8200 bps)**

| Token | Address |
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

**Set 3 (rate: 300 bps)**

| Token | Address |
|---|---|
| SOMI | `0xfa4bdAD5B858263DEadCbD826AD1b4e9a5f43D62` |
| PENDLE | `0xa0750EF1fA99A393ca82771bf91ba80e709ca692` |
| ENS | `0xC0C5630B8B57C88F48626A5aFf0ab4dE5bCfD8a2` |

---

## System Contract Addresses (DERIW Chain, Chain ID: 2885)

### Core Trading

| Contract | Address |
|---|---|
| **Vault** | `0xbd36B94f0b5A6F75dABa6e11ef3c383294470653` |
| **PositionRouter** | `0x80257F37d327FA0EF464eFa64DdFb755dE111262` |
| **OrderBook** | `0x86A0D906c6375846b05a0EF20931c1B4d2489C13` |

### Price & Utilities

| Contract | Address |
|---|---|
| VaultPriceFeed | `0xEC7046731d5ef62Ce62C0291b7dF891E62aECC7E` |
| FastPriceFeed | `0x43948B78477963d7b408A0E27Ae168584C6E07A9` |
| PriceFeed | `0x83CA1aA2Bc20e41287154650e4161dC995278E1D` |
| VaultUtils | `0xfC21471Ef1D98A4e34B91A1EDeCB523ba4EA83D9` |
| DataReader | `0xf0A6bd9feb742E56C39A7df4544A093A12858c64` |
| GlpManager | `0xa61ddD4Cf723cDB339008021aD05e5a1BE140F3f` |

### Batch Reads

| Contract | Address |
|---|---|
| OrderBookReader | `0x239e5A9813C469D86D3322133e3c1AbA77A412f8` |
| Reader | `0x84C1F027f05E2c944D0Ccee94d29C34Ea3Fcf9eD` |
| VaultReader | `0x1A635dCb4254965432271b49D2E347615c70383a` |

### Token Data & Configuration

| Contract | Address |
|---|---|
| CoinData | `0xAb9Ded668e6F7167DA4D3529cC8463AA88d6454f` |
| Phase | `0x463c7e40A4eE5e4E2072055aFa14a15E88b38F5a` |
| Slippage | `0xAd3FAe555Ab3571a2886012DfFcc7C777eC11e7E` |

### Fund Pool V2

| Contract | Address |
|---|---|
| **FundRouterV2** | `0x3D343Fc0F6c6D2E047ec5e16e39A9b6A2031B9Ac` |
| **PoolDataV2** | `0x305507D45D5441B81F5dD8FF9f00f65e0B392e86` |
| FundReader | `0x4D778dE09f5C043677bd18888114A9a0911dCE96` |
| FundFactoryV2 | `0x9b0449B664C3b78C71D7647570F2c6D62ca7ADd1` |
| Risk | `0xa595029b9EB4765c09Fc0F64468c2eB1560522a7` |
| AuthV2 | `0xfd172A0EEF6Fb443de4A4b52abcA488E52Ce598c` |

### Meme Pool

| Contract | Address |
|---|---|
| MemeRouter | `0xf128817F665E8469BBC3d6f2ade7f073180a010E` |
| MemeData | `0xA4DE9E445C06A0d091a3cdA0661C7B5a5A1fAec8` |
| MemeFactory | `0x363d1d8a71A5e1E6F6528432A59541bb2848B07e` |
| MemePool | Dynamically created on deployment, query via MemeFactory |
| MemeRisk | `0xB9f73b8b2feeD51B16E49dC0482ca0C16964aaa0` |

### Referral & Rebate

| Contract | Address |
|---|---|
| ReferralStorage | `0x83a30fa6FA383FcA37AD1e72fFf927961e06cD79` |
| ReferralData | `0x2Bd4B513C5B2aD07516CCA330DE1AE87B82FFA98` |
| FeeBonus | `0x1F1E7D48424ed1BdF9cD7aEB85d319eFF0191A6E` |

### Other

| Contract | Address |
|---|---|
| GlpRewardRouter | `0xE9F045f0CE5dc1AD552e20E8df668194d67f95D5` |
| TokenHelper | `0xc5Ce3D29De397c4ec7C3f2b47ddD4608f8143e8c` |
| BlackList | `0x24A3D7c8134238ea4Ec4e0feF288C2AD31852821` |
| Multicall3 | `0x15789E21a9D09f8F32738bd44b683F79D1299104` |
| **UserL3ToL2Router** | `0x8fb358679749FD952Ea5f090b0eA3675722B08F5` |

### Cross-Chain Bridge (Arbitrum L2, Chain ID: 42161)

| Contract | Address |
|---|---|
| **UserL2ToL3Router** | `0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325` |

---

## Precision Reference

| Type | Precision | Example |
|---|---|---|
| Price (USD) | `1e30` | `ethers.parseUnits("65000", 30)` |
| USDT amount | `1e6` | `ethers.parseUnits("100", 6)` |
| Token amount | `1e18` (or decimals) | `ethers.parseUnits("1", 18)` |
| Fee basis points | `10000 = 100%` | `30 = 0.3%` |
| Leverage | `10000 = 1x` | `100000 = 10x` |

---

## Enum Constants (Cross-Chain Router)

String enum values used in cross-chain scripts and EIP-712 signatures. Update here when adding new enum values.

### `transactionType` (UserL3ToL2Router.outboundTransfer Message field)

| Value | Notes |
|---|---|
| `"Withdraw USDT"` | USDT withdrawal transfer (confirmed via real tx reverse engineering) |

### `chain` (UserL3ToL2Router.outboundTransfer Message field)

| Value | Target Chain | Notes |
|---|---|---|
| `"DeriW Chain"` | Arbitrum (L2) | Production: withdraw from DERIW Chain to Arbitrum |
| `"DeriW Devnet"` | Arbitrum Sepolia (L2) | Dev environment: withdraw from DERIW Dev Chain to Arbitrum Sepolia |

### EIP-712 Signing Notes (UserL3ToL2Router)

- `domain.name = 'Transaction'` (not 'DERIW')
- `domain.chainId` comes from `router.chainid()` (production=42161, Dev=421614), not the network chainId
- Signature requires computing final hash using contract `hashDomain/hashMessage/hashData`, then signing directly (`wallet.signingKey.sign`), standard `signTypedData` cannot be used
- `_data` passes empty bytes `'0x'` (token/amount/receiver are already in message)
- `msg.value = 0` (contract does not charge ETH; Dev chain requires `gasPrice: 0n`)
- `l2Token` comes from `USDT_L3.l1Address()` (Dev: `0x259D16cd04c451eed734908b3df2D3e58AC1e99f`, Production: `0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9`)

---

## Dev Network Contract Addresses (Dev, RPC: https://rpc.dev.deriw.com)

> API Base URL: `https://testgmxapi.weequan.cyou`

### Main Pool Tokens (Dev)

| Token | Address | Notes |
|---|---|---|
| **USDT** | `0x12530882c64B1c22dAdf2F60639145029c5081Da` | Main pool stablecoin, 6 decimals |

**Single token**

| Token | Address |
|---|---|
| WBTC | `0x9F37821B7C4A5EfaA4d92aa9A6dE526237C30ceD` |

**Set 1**

| Token | Address |
|---|---|
| XAUT | `0x5932b02809Dab34C98Ca3B5E66571B10Ad7A3f3B` |
| ETH | `0x81Af7E76aDC98B7587d46B551e5707A46e35eBe5` |
| SOL | `0xA4aeF370Be85fb198a74dAA9b61cda9684BC1778` |
| XRP | `0xA2799A14e15A93D0263d02BAa5BA4bb377e51908` |
| LTC | `0xCD8806f52F48716014075596DaF0128159a43d28` |
| PAXG | `0xE274217E73337a899b8BF543BcbcaDBDc89199F8` |
| ONDO | `0xf863138d2119190199508bdB2BEc2474ad383935` |

**Set 2**

| Token | Address |
|---|---|
| XAG | `0x8282e36Ac85aB338DcCEfEFfbf4c71FD1efa5D1B` |

### Meme Pool Tokens (Dev)

| Token | Address |
|---|---|
| ACT (main pool address) | `0x7a3889ABC99B04b431baE30a00748BC290656939` |

### System Contracts (Dev)

#### Core Trading

| Contract | Address |
|---|---|
| **Vault** | `0x75Da7523f99bA38a8cAD831EbE2F09aDF5896d89` |
| **PositionRouter** | `0x12f0C0fb9548EeB2DAa379d10C7CdCB63f6848F9` |
| **OrderBook** | `0x18c6d9d1f9a1d6b9b3fA6d104f9A0d8efa7C9689` |
| Router | `0x23D9D11717a5CC9A90A7982445452e225060B511` |

#### Price & Utilities

| Contract | Address |
|---|---|
| VaultPriceFeed | `0x843a577B32F280518E8dF305D8AD469111279135` |
| FastPriceFeed | `0x32fDB8b4674e1cC233175D3C7eD41c6e21dbD3B4` |
| FastPriceEvents | `0xC0352F5F29a2FDD782A3dB84C498c91A2dF3461e` |
| PriceFeed | `0x2b06F20F9ed526A0C268d0401a0bF22a304db5c9` |
| VaultUtils | `0x523Ebd1f0D6BF83fF0dd79a3A2CB8c259c030De5` |
| GlpManager | `0xb44104D353505718ab87E4037781ef862B39F6d1` |
| DataReader | `0xe3D2e9B99050F047f77159651950b7bdfD7465D0` |
| ADL | `0x523213b127815f7ec190930908886d6D1Ac2857E` |

#### Batch Reads

| Contract | Address |
|---|---|
| Reader | `0xb49676cF7ff87a42dae3129997688333886AC126` |
| VaultReader | `0xEf4a5Dd7418Fd53508E94e3f7b8A977425bE70d4` |
| OrderBookReader | `0xF2cc684b2bD5D9F114F48e80aD06036797A94660` |

#### Token Data & Configuration

| Contract | Address |
|---|---|
| CoinData | `0xC75DC20185d2aB64d5faBF227285AB171D50D825` |
| Slippage | `0x3600Cc37027146d0E9cf0E146D21390CFF474d75` |
| GLP | `0x91A74B8bf30dfe0DB611800927Dee13E28808218` |
| LpToken | `0xCaf5c59286Cd3B38db3d9Be1d2e47538D44Ed060` |

#### Fund Pool V2

| Contract | Address |
|---|---|
| **FundRouterV2** | `0x324D847bc335032855972DA8d2f825BF7df14dCD` |
| **PoolDataV2** | `0xf0290fAc0B56E0F9EB09abdc24C0713Ce4D96116` |
| FundReader | `0x4915e36296175975764c2c85cE73DA578da492b5` |
| FundFactoryV2 | `0xe3b1410e7712d8205c428ae4F1E1609618fD0aA4` |
| Risk | `0x8a6F1711Da6E059083C0867f4777A513D30c0103` |
| AuthV2 | `0x2861BE41cd7Fd1C2bAa8Ea256c37AD7De68Cb3Bb` |

#### Meme Pool

| Contract | Address |
|---|---|
| MemeRouter | `0xeDa46Dc1f8A64C7F5C811cb2dE1cC775b04A0195` |
| MemeData | `0xa4E451aE6C7e80E5587949CB557BeB700f0500A1` |
| MemeFactory | `0x52a87ef53C69235EB3Ac0559B642395618f47Ffd` |
| MemeRisk | `0x141C93DE887DaC44569a9F3FE7dd1210281D5dbC` |
| MemeErrorContract | `0xf2cF85c7BF91900172690680C96c918348190881` |

#### Referral & Rebate

| Contract | Address |
|---|---|
| ReferralStorage | `0x041d7bd9D77f6aa9eE4037cf38e714Bf8eA1787B` |
| ReferralData | `0x228cF505D464C02625371904935e0011b9e3e134` |
| FeeBonus | `0x8cCA264D88F0Aa2608Ed67734b57F6d8e2aB8B42` |

#### Other

| Contract | Address |
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

#### Cross-Chain Bridge (Arbitrum L2)

| Contract | Address |
|---|---|
| **UserL2ToL3Router** | `0x81A88de21De37A025660D746164A9AB013822263` |
