const R = require('./runtime');

function sourceConfig(selected, env = process.env) {
  const rpcUrl = env.DERIW_L2_RPC_URL || selected.bridge?.sourceRpcUrl;
  const chainId = env.DERIW_L2_CHAIN_ID || selected.bridge?.sourceChainId;
  if (!rpcUrl || !chainId) throw new Error('Set DERIW_L2_RPC_URL and DERIW_L2_CHAIN_ID for this bridge');
  if (String(chainId) === selected.chainId) throw new Error('Bridge source and destination must be different chains');
  return { ...selected, rpcUrl, chainId: R.uint(chainId, true).toString() };
}
function alias(address) {
  return R.address(R.ethers.toBeHex((BigInt(address) + 0x1111000000000000000000000000000000001111n) % (1n << 160n), 20));
}
function encodeRetryableData(type, maxSubmissionCost, feeTokenAmount) {
  const coder = R.ethers.AbiCoder.defaultAbiCoder();
  if (type === 1n) return coder.encode(['uint256', 'bytes', 'uint256'], [maxSubmissionCost, '0x', feeTokenAmount]);
  if (type === 2n) return coder.encode(['uint256', 'bytes'], [maxSubmissionCost, '0x']);
  throw new Error('Unsupported bridge fee model');
}
async function quoteDeposit(selected, parent, child, account, amountString) {
  account = R.address(account);
  const router = await R.checkedContract(selected, 'UserL2ToL3Router', parent);
  const token = R.address(await router.l2Usdt());
  const erc20 = await R.checkedContract(selected, 'IERC20', parent, token);
  const amount = R.amount(amountString, Number(await erc20.decimals()));
  if (!await router.getTokenIsIn(token)) throw new Error('Bridge token is not supported');
  const type = await router.chainType();
  if (![1n, 2n].includes(type)) throw new Error('Unsupported bridge fee model');
  const gatewayRouter = new R.ethers.Contract(await router.l2GatewayRouter(), ['function getGateway(address) view returns(address)'], parent);
  const gatewayAddress = R.address(await gatewayRouter.getGateway(token));
  const gateway = new R.ethers.Contract(gatewayAddress, [
    'function counterpartGateway() view returns(address)', 'function inbox() view returns(address)',
    'function calculateL2TokenAddress(address) view returns(address)',
    'function getOutboundCalldata(address,address,address,uint256,bytes) view returns(bytes)',
  ], parent);
  const target = R.address(await gateway.counterpartGateway());
  if (await child.getCode(target) === '0x' || R.address(await gateway.calculateL2TokenAddress(token)) !== R.contractAddress(selected, 'USDT')) throw new Error('Gateway does not match the destination deployment');
  const inboxAddress = R.address(await gateway.inbox());
  if (inboxAddress !== R.address(await router.inbox())) throw new Error('Gateway inbox does not match the user router');
  const inbox = new R.ethers.Contract(inboxAddress, [
    'function calculateRetryableSubmissionFee(uint256,uint256) view returns(uint256)', 'function bridge() view returns(address)',
  ], parent);
  const tokenFee = type === 1n ? await router.getFee(token, amount) : 0n;
  const calldata = await gateway.getOutboundCalldata(token, router.target, account, amount - tokenFee, '0x');
  const node = new R.ethers.Contract('0x00000000000000000000000000000000000000C8', [
    'function estimateRetryableTicket(address,uint256,address,uint256,address,address,bytes)',
  ], child);
  const refund = alias(router.target);
  // The deposit is virtual funding for eth_estimateGas, not a transfer.
  const estimate = await node.estimateRetryableTicket.estimateGas(gatewayAddress, R.ethers.parseEther('1'), target, 0n, refund, refund, calldata);
  const maxGas = (estimate * 130n + 99n) / 100n;
  const gasPrice = (await child.getFeeData()).gasPrice;
  if (gasPrice === null || gasPrice <= 0n) throw new Error('Destination gas price is unavailable');
  const gasPriceBid = gasPrice * 2n;
  const parentBlock = await parent.getBlock('latest');
  if (!parentBlock || parentBlock.baseFeePerGas === null) throw new Error('Source base fee is unavailable');
  const maxSubmissionCost = await inbox.calculateRetryableSubmissionFee(R.ethers.getBytes(calldata).length, parentBlock.baseFeePerGas) * 2n;
  const total = maxSubmissionCost + maxGas * gasPriceBid;
  let data, value, feeToken, feeTokenAmount;
  if (type === 1n) {
    feeToken = R.address(await router.dCoin());
    const bridge = new R.ethers.Contract(await inbox.bridge(), ['function nativeToken() view returns(address)'], parent);
    if (R.address(await bridge.nativeToken()) !== feeToken) throw new Error('Bridge gas token mismatch');
    const feeAsset = await R.checkedContract(selected, 'IERC20', parent, feeToken);
    const decimals = Number(await feeAsset.decimals());
    feeTokenAmount = decimals >= 18 ? total * 10n ** BigInt(decimals - 18) : (total + 10n ** BigInt(18 - decimals) - 1n) / 10n ** BigInt(18 - decimals);
    if (await feeAsset.balanceOf(router.target) < feeTokenAmount) throw new Error('Bridge router has insufficient gas-token liquidity');
    data = encodeRetryableData(type, maxSubmissionCost, feeTokenAmount);
    value = 0n;
  } else {
    data = encodeRetryableData(type, maxSubmissionCost); value = total;
  }
  return { sourceChainId: (await parent.getNetwork()).chainId.toString(), destinationChainId: selected.chainId,
    router: router.target, token, receiver: account, amount, maxGas, gasPriceBid, data, value,
    tokenFee, maxSubmissionCost, feeToken, feeTokenAmount, sourceBlock: parentBlock.number,
    expiresAt: BigInt(parentBlock.timestamp + 300) };
}
module.exports = { sourceConfig, quoteDeposit, alias, encodeRetryableData };
