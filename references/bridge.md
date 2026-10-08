# Bridge deposits and withdrawals

Select the DERIW destination/source with `DERIW_NETWORK`. The bridge source chain is configured under `bridge` in [networks.json](networks.json), or through `DERIW_L2_RPC_URL` and `DERIW_L2_CHAIN_ID`. Verify the expected chain and gateway token mapping before a transfer. A source transaction and destination delivery are separate outcomes.

## Deposit to DERIW

Generate a fresh quote without a private key:

```bash
node scripts/bridge-quote.js <USDT> <account> quote.json
node scripts/crosschain-deposit.js <USDT> quote.json
# Add --send to the second command to submit the authorized deposit.
```

The quote helper reads the gateway, counterpart, inbox, token mapping and fee model. It estimates retryable execution through the destination NodeInterface and reads the inbox submission fee. It uses a 30% execution-gas buffer and doubles current gas/submission prices. Quotes expire after five minutes. Custom gas-token chains encode the gas-token fee and check the router's fee-token balance; native-fee chains include the quoted native value. Source transaction gas is charged separately.

The quote is bound to source/destination chain IDs, user router, token, receiver and amount. The deposit command rejects mismatches and expired quotes. It approves the user router for the needed token amount, simulates, submits once and prints the hash. If quoting or simulation fails, preserve the error instead of substituting fee values. The destination token balance must be checked separately after source confirmation.

Quote files contain public transfer parameters only: `sourceChainId`, `destinationChainId`, `router`, `token`, `receiver`, `amount`, `maxGas`, `gasPriceBid`, `data`, `value`, `expiresAt`, and fee details. Amounts are raw integer strings. Review `value`, `tokenFee` and `feeTokenAmount` before sending.

The source RPC defaults for dev/test use Arbitrum Sepolia. Public RPC details are listed in [Arbitrum's RPC reference](https://docs.arbitrum.io/arbitrum-essentials/reference/node-providers). Retryable estimation uses [NodeInterface](https://docs.arbitrum.io/arbitrum-essentials/nodeinterface), and calldata is obtained from the deployed gateway's public method. Custom gas-token quotes encode `(maxSubmissionCost, bytes callHookData, tokenTotalFeeAmount)` as defined by the [Orbit ERC-20 gateway](https://github.com/OffchainLabs/token-bridge-contracts/blob/main/contracts/tokenbridge/ethereum/gateway/L1OrbitERC20Gateway.sol).

## Withdraw from DERIW

```bash
node scripts/crosschain-withdraw.js <USDT> [receiver] [--send]
```

A preview requires `DERIW_ACCOUNT`; a send uses the local wallet. The default receiver is the same wallet on the destination chain. The helper validates `l3Usdt()`, derives the L2 token from `l1Address()`, and reads `getValue(token,amount)`, whose outputs are **token fee first, net amount second**. The message amount and approval are the gross amount.

The router uses a contract-specific EIP-712 digest. Domain name is `Transaction`, version `1`, verifyingContract is the user router, and domain chainId comes from `router.chainid()`. Message fields are `transactionType, from, token, l2Token, destination, amount, deadline, chain`. The exact message type is:

`DexTransaction:Withdraw(string Transaction_Type,address From,address Token,address L2Token,address Destination,uint256 Amount,uint256 Deadline,string Chain)`

The helper calls `hashDomain`, `hashMessage` and `hashData`, signs the digest without an EIP-191 prefix, and checks `getSignatureUser`. Signature bytes and signed calldata are not printed. It submits `outboundTransfer` after token approval and simulation. Messages expire in ten minutes.

Chain labels are `DeriW Devnet` for dev and `DeriW Chain` for mainnet. Set `DERIW_BRIDGE_CHAIN_LABEL` for another deployment. A withdrawal can require a separate destination finalization after the bridge's confirmation period. Source confirmation is not proof of L2 receipt; track the wallet's destination token balance and transfer status before initiating another transfer.
