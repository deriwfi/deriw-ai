# Networks and deployments

Values come from the supplied deployment list, with the verified correction noted below. Runtime configuration is [networks.json](networks.json). Chain IDs are stored as strings; use BigInt in code.

| Environment | Chain ID | RPC | Client API |
|---|---|---|---|
| dev | 18417507517 | https://rpc.dev.deriw.com | https://api.dev.deriw.com |
| test | 2885 | https://rpc.test.deriw.com | https://api.test.deriw.com |
| mainnet | 2886 | https://rpc.deriw.com | https://api.deriw.com |

Select an environment explicitly before writes. `DERIW_RPC_URL` and `DERIW_API_BASE` override transport only; they do not change contract addresses or the expected chain ID.

## Addresses

`UserL2ToL3Router` is an L2 entrypoint: its presence in an environment list does not put it on that environment’s L3 RPC. Use the separate bridge workflow. An address list does not imply end-user permission or that a current deployment has bytecode at every listed address.

| Contract | Dev | Test | Mainnet |
|---|---|---|---|
| ADL | `0x523213b127815f7ec190930908886d6D1Ac2857E` | `0xe059c38a7Da573569cD7d32f8bBfbc3892551BEc` | `0x2Ad34d933D4Fe9247e3E61ce7DE9adcE64badFe7` |
| Airdrop | Not supplied | `0xb207FD6D1136b0a32E2077754C971A82C7E54545` | Not supplied |
| AuthV2 | `0x2861BE41cd7Fd1C2bAa8Ea256c37AD7De68Cb3Bb` | `0xeE440289C8F1DAdaB8e0ae68ea02e2753cCD3f16` | `0xfd172A0EEF6Fb443de4A4b52abcA488E52Ce598c` |
| BlackList | `0x4937B62E5d3F00A31C4493FC175D0ce54dcAc5a2` | `0xdE755bA5106A6f0306401a6A2Dbf8d20B7B497F9` | `0x24A3D7c8134238ea4Ec4e0feF288C2AD31852821` |
| CalculatePNL | `0xbbb532E769d2e136a2Ea45CbB6E81DC49BA45c43` | Not supplied | Not supplied |
| CoinData | `0xC75DC20185d2aB64d5faBF227285AB171D50D825` | `0xba08A22d7fa72723793bF981BBC13B86FaA0f78d` | `0xAb9Ded668e6F7167DA4D3529cC8463AA88d6454f` |
| DataReader | `0x0628DA40f5B63Aa33e9Ce4D73323F3F6708DaF8F` | `0x1Dc8D3172df161ef7510d636B6300d89D6e886A4` | `0x934B75A4f576738c1392a2af1BF8be1FBf52b53d` |
| ErrorContractV2 | `0xe3c2e0Fa6F93C6d3616c8eE6F696dAa0d91E3e6f` | `0x59843A5ec0805Efa3E4DC6B920d464881162b687` | `0x7795641089c6Dff2823e8c24CE45eFC92935aD07` |
| FeeBonus | `0x8cCA264D88F0Aa2608Ed67734b57F6d8e2aB8B42` | `0x16541Cb512848711820b978484Ba0C8dEE2f5280` | `0x1F1E7D48424ed1BdF9cD7aEB85d319eFF0191A6E` |
| FundFactoryV2 | `0xe3b1410e7712d8205c428ae4F1E1609618fD0aA4` | `0x5d22cFEa6d6f4f2651242b8616B0BB74375e47fe` | `0x9b0449B664C3b78C71D7647570F2c6D62ca7ADd1` |
| FundReader | `0x4915e36296175975764c2c85cE73DA578da492b5` | `0xF0C8034BD19e6942e251b1582f1855CEBC6292Fc` | `0x4D778dE09f5C043677bd18888114A9a0911dCE96` |
| FundRouterV2 | `0x324D847bc335032855972DA8d2f825BF7df14dCD` | `0xDc9Bbc243d2A0f185B00401515f7FE43be6BD997` | `0x3D343Fc0F6c6D2E047ec5e16e39A9b6A2031B9Ac` |
| GLP | `0x91A74B8bf30dfe0DB611800927Dee13E28808218` | `0xE6071653F3100d2d453b51bFf34E1f0cdcC19129` | `0x9E06Fe81dCad8cdc624C4B5fb126Aeed0449CFc9` |
| GlpManager | `0xb44104D353505718ab87E4037781ef862B39F6d1` | `0xd781809e14721CB7c933bc1c1F5D7bfB49CC7464` | `0xa61ddD4Cf723cDB339008021aD05e5a1BE140F3f` |
| GlpRewardRouter | `0xbe38b4511b8A44dC0D36367D22f56f4b75a6CD6b` | `0x33766Bb57c4a9cE9Fe3D17cf3569FCf3FBf211c2` | `0xE9F045f0CE5dc1AD552e20E8df668194d67f95D5` |
| LpToken | `0xCaf5c59286Cd3B38db3d9Be1d2e47538D44Ed060` | `0xF10ef3b92a8390E86f84A7F3a99ca65e04eB97DF` | `0x62c723Dfd86C07BA8a00B8d70A95fF772De0A26C` |
| MemeData | `0xa4E451aE6C7e80E5587949CB557BeB700f0500A1` | `0x64356664a4946Ef37d20CBc955C19b0FB0b0751e` | `0xA4DE9E445C06A0d091a3cdA0661C7B5a5A1fAec8` |
| MemeErrorContract | `0xf2cF85c7BF91900172690680C96c918348190881` | `0x781e1274846dFEe0445b41c5633Fa7Ac1c5e9C90` | `0x1f5deAcEd5463c4d8d7C2500b5dA5d1BA4b394c7` |
| MemeFactory | `0x4C74F6e60736130247c8b53807b627FeD558cA77` | `0xAe5400eebD772D58366DB73b3f90dB4469Aca79A` | `0x363d1d8a71A5e1E6F6528432A59541bb2848B07e` |
| MemeRisk | `0x141C93DE887DaC44569a9F3FE7dd1210281D5dbC` | `0x4b7d8506C1a8116C552ce1C95690491Ce8bE6763` | `0xB9f73b8b2feeD51B16E49dC0482ca0C16964aaa0` |
| MemeRouter | `0xeDa46Dc1f8A64C7F5C811cb2dE1cC775b04A0195` | `0x85E7037510a9153Bd4b8b110d56F3E25fc23dEd8` | `0xf128817F665E8469BBC3d6f2ade7f073180a010E` |
| Multicall3 | `0x316bdC9eDe87d7D79e27D5CeF9CBB44A2c92F0f7` | `0xD01345C906c6e334dab8Be08d1E1D975cC1405C3` | `0x15789E21a9D09f8F32738bd44b683F79D1299104` |
| OrderBook | `0x18c6d9d1f9a1d6b9b3fA6d104f9A0d8efa7C9689` | `0x300cAD4a61E6785F75E6deEbCC29b5f2708ab327` | `0x86A0D906c6375846b05a0EF20931c1B4d2489C13` |
| OrderBookReader | `0xF2cc684b2bD5D9F114F48e80aD06036797A94660` | `0xfdA0dccdb57e3526d10Ea4aA6ed00a20EEe3f65f` | `0x239e5A9813C469D86D3322133e3c1AbA77A412f8` |
| Phase | `0xaA71758134ea73Ad47ff04104b96986C5C3BBd16` | `0xAACfe180F99f27507073c938917929b3d079A2F4` | `0x463c7e40A4eE5e4E2072055aFa14a15E88b38F5a` |
| PoolDataV2 | `0xf0290fAc0B56E0F9EB09abdc24C0713Ce4D96116` | `0x3215FF1cC4006a5bDe3d094fE952691dA1920272` | `0x305507D45D5441B81F5dD8FF9f00f65e0B392e86` |
| PositionRouter | `0x12f0C0fb9548EeB2DAa379d10C7CdCB63f6848F9` | `0xE02d329F901faf2a7f05Caff6A62F8839881ECf3` | `0x80257F37d327FA0EF464eFa64DdFb755dE111262` |
| PriceOracle | `0x4243bC718aE8A11C7C71cb39bebd314Ab0925F6C` | `0x04964F610C2597D194f3FA88A76e8a17D4774d39` | `0x1461469B43AD78145048eea11cBF6bA97222d379` |
| Reader | `0x3597D7411348e8912A2E8c02F8bCf00D3da16a18` | `0xE936A73EdB4Ad42C951607a33Da393723D1F674E` | `0x13633eC2B765fD9fFcc81C3c13daF91D9E4D6d00` |
| ReferralData | `0x228cF505D464C02625371904935e0011b9e3e134` | `0x659466131E88fE78c73ac2CE38d7b71890f6B29f` | `0x2Bd4B513C5B2aD07516CCA330DE1AE87B82FFA98` |
| ReferralStorage | `0x041d7bd9D77f6aa9eE4037cf38e714Bf8eA1787B` | `0x1eB6Dfc3316012C5795E1060f8BD1CEa10df30F5` | `0x83a30fa6FA383FcA37AD1e72fFf927961e06cD79` |
| Risk | `0x8a6F1711Da6E059083C0867f4777A513D30c0103` | `0x7Cd6A8f8536c3Ba93CD82620128379125f4e4ba6` | `0xa595029b9EB4765c09Fc0F64468c2eB1560522a7` |
| Router | `0x23D9D11717a5CC9A90A7982445452e225060B511` | `0x871cC36e0C52d3e41f896FF9D4eE03BC81E452e4` | `0x1eB6Dfc3316012C5795E1060f8BD1CEa10df30F5` |
| Slippage | `0x3600Cc37027146d0E9cf0E146D21390CFF474d75` | `0x70292ECf85074c09a76Cbe9B1800a6adB9c25f95` | `0xAd3FAe555Ab3571a2886012DfFcc7C777eC11e7E` |
| SlippageControl | `0x259Ed1aaf4C6C49581B1cbdFeF041d8C1b2159b9` | `0xaCF12CbA5457596fDb668FE46529a22733EFE360` | `0x86f2C1c55Aa2A741896ba55B97cb1745558864aF` |
| TestGetPrice | Not supplied | Not supplied | `0x343ead38b4D099A2B245B66e9F25Fe355F25217d` |
| Timelock | `0x7bC076Ef7574e327143D1bbeCB41316373a5CEFc` | `0xfED27EB88135B6981d1a419c4De1d3b36D71B2bF` | `0xB3F6eAEa8edcc556031307F3895E070b64103E71` |
| TokenHelper | Not supplied | `0xC3F9E3C9Ff038752F71Dc9365367f0155f72b2Cc` | `0xc5Ce3D29De397c4ec7C3f2b47ddD4608f8143e8c` |
| USDT | `0x12530882c64B1c22dAdf2F60639145029c5081Da` | `0x8059298AD3f2153EC1B0FA0d233342e834E06737` | `0x3B11A54514A708CC2261f4B69617910E172a90B3` |
| UserL2ToL3Router | `0x81A88de21De37A025660D746164A9AB013822263` | `0x53D85Ac7cDaaca35942FB2C41c9dAb2302a66CB9` | `0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325` |
| UserL3ToL2Router | `0x32068069f13191B57c03Eee8531a8C82b26d12B9` | `0x675a17efd9E9Ce8b7a769Fb3DF88f9c102190DE0` | `0x8fb358679749FD952Ea5f090b0eA3675722B08F5` |
| ValidateReferral | Not supplied | `0x57BA9afFA6887a8dEFFB6db3542F26F829c8C0Fa` | Not supplied |
| Vault | `0x75Da7523f99bA38a8cAD831EbE2F09aDF5896d89` | `0x7BA4628a51Fb362b8807954bd03a0c9527eD4A78` | `0xbd36B94f0b5A6F75dABa6e11ef3c383294470653` |
| VaultErrorController | `0x14847B61deB346db6a3997bA666A0e1E6a8A4F1E` | `0x796381f2A7DeB324d0C24Ff6621cbF533549d599` | `0x8f885a58A75Ff810b23739B2899505969De6b892` |
| VaultReader | `0x91dC6Fc115786013C48E9fD186c5752Ab48D3d2d` | `0x11Cb350c15482864F1c14FDAcB6b8581EBaf7806` | `0x395ed3eAc352cc02662ff62b03F1742FB28bE1fF` |
| VaultUtils | `0x523Ebd1f0D6BF83fF0dd79a3A2CB8c259c030De5` | `0x6fc929A61C833340dAda852B65605f140Dc1eEEd` | `0xfC21471Ef1D98A4e34B91A1EDeCB523ba4EA83D9` |
| pool | `0x735DD24C847591464fDEF503CCe9a19077eF47A4` | `0x6afA27288cf0fA4519730E59CD03ff577e52c831` | `0x998bC891917476c88118CB7D798aD404e1BC3E4F` |

## Deprecated and unconfigured deployments

`PriceFeed`, `FastPriceEvents`, `FastPriceFeed`, and `VaultPriceFeed` are deprecated in all supplied networks; `StockMarket` is also deprecated on dev. Their historical addresses remain under `deprecatedContracts` in JSON for identification only. Runtime lookup excludes that map. Core price reads use `assets/PriceOracle.json` (30 decimals).

The supplied list has no Edge Hour `ChallengeManager`, `LPVault`, or Edge Hour oracle deployment. Do not reuse historical constants. Set `DERIW_EDGE_CHALLENGE_MANAGER`, `DERIW_EDGE_LP_VAULT`, and, if needed for direct reads, `DERIW_EDGE_PRICE_ORACLE` from a confirmed deployment for the selected chain. These are different contracts from core `PriceOracle`.

Token symbol addresses must be discovered from `/client/coins` and `/client/coin_infos` on the chosen API; do not reuse old hardcoded BTC/ETH lists. `USDT` is the collateral address, `pool` is the supplied main pool address.

## ABI files

Canonical core ABIs live directly in `assets/`. Room operations reuse those files, not `assets/room/` copies. Edge Hour scripts use `assets/edge_hour/`. Older duplicate `assets/edge-hour/`, `assets/room/` and `assets/found-pool/` files are retained for compatibility only and are not runtime imports. A full ABI may contain privileged methods; the supported user surface is documented in [contracts.md](contracts.md).

## Verified deployment correction (2026-10-08)

The supplied test OrderBook `0x300cAD4a61E8116C552ce1C95690491Ce8bE6763` has no bytecode. The configured test `SlippageControl.orderBook()` returns `0x300cAD4a61E6785F75E6deEbCC29b5f2708ab327`; that address has bytecode, reports the configured test Vault/Router/USDT, and is enabled by `Router.plugins`. Runtime uses the verified address. The original value and evidence are preserved in `networks.json` under `verifiedCorrections`.
