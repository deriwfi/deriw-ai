# User bridge operations

The supplied user-router addresses belong to distinct source chains. Always check source chain ID and bytecode. The source receipt and destination settlement are separate outcomes; do not promise a fixed arrival time or repeat a transfer because indexing is delayed.

## L2 → DERIW deposit

```bash
node scripts/crosschain-deposit.js <USDT> <quote.json> [--send]
```

Select the destination with `DERIW_NETWORK`. Set the separately verified `DERIW_L2_RPC_URL` and `DERIW_L2_CHAIN_ID`. The supplied address list does not specify the L2 mapping or a live retryable-ticket fee quote; do not infer it from the L3 chain ID. The script reads the L2 router's `l2Usdt()` and token decimals. A preview also requires public `DERIW_ACCOUNT`.

A current quote file must contain:

```json
{
  "sourceChainId": "L2_CHAIN_ID",
  "destinationChainId": "L3_CHAIN_ID",
  "router": "0xL2_USER_ROUTER",
  "token": "0xL2_USDT",
  "receiver": "0xUSER",
  "amount": "RAW_TOKEN_AMOUNT",
  "maxGas": "QUOTED_LIMIT",
  "gasPriceBid": "QUOTED_WEI",
  "data": "0xENCODED_GATEWAY_DATA",
  "value": "QUOTED_NATIVE_WEI",
  "expiresAt": "UNIX_SECONDS"
}
```

Obtain quote values from the supported bridge/gateway integration for that source/destination pair. This package does not invent an estimator endpoint. If no such quote/configuration is available, this flow is blocked until supplied; other client/trading tests can continue. No hardcoded gas, fallback fees, presumed zero-fee dev path or copied historical calldata is used.

`getFee(token,amount)` is a **token fee**, not the ETH/native retryable submission fee. `outboundTransfer(token,to,amount,maxGas,gasPriceBid,data)` uses native `value` from the quote. Approve the user L2 router for the full token amount. Verify destination balance separately.

## DERIW → L2 withdrawal

```bash
node scripts/crosschain-withdraw.js <USDT> [receiver] [--send]
```

The script checks `l3Usdt()` against configured collateral, derives the actual L2 token from the bridged token's public `l1Address()` getter, reads token decimals and `getValue(token,amount)` (net amount, token fee). There is no fallback to a production L2 token.

The signature is EIP-712-style with a contract-specific type hash. Do not use a generic `Message` type or `personal_sign` on the digest. Domain name is `Transaction`, version `1`, verifyingContract is the selected router; domain chainId is read from `router.chainid()`, not assumed to equal RPC chain ID. Message fields in order:

`transactionType, from, token, l2Token, destination, amount, deadline, chain`

The script uses `transactionType="Withdraw USDT"`; chain labels are `DeriW Devnet` for dev, `DeriW Chain` for mainnet. Test requires a confirmed `DERIW_BRIDGE_CHAIN_LABEL`; it can also explicitly override another environment's label. Hash via `hashDomain`, `hashMessage`, `hashData`; sign the resulting digest without an EIP-191 prefix, and verify `getSignatureUser` recovers the sender.

The CLI uses a local signer for this digest; an external wallet integration must reproduce the exact contract type string and field capitalization. Signature and raw signed calldata are never logged. The message expires in ten minutes. `outboundTransfer('0x',domain,message,signature)` is sent with value 0 for this token-withdrawal path after exact allowance to the user L3 router. Contract simulation is required. Do not use `withdrawETH`, `transferTo`, or bridge owner/relayer methods.
