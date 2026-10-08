#!/usr/bin/env node
const R = require('./lib/runtime');
const fs = require('node:fs');
async function main() {
  const [amountString, quoteFile] = process.argv.slice(2).filter(x => x !== '--send');
  const send = process.argv.includes('--send'), selected = R.network();
  // L2 network/fees are separate from the selected DERIW destination. Never guess them.
  if (!process.env.DERIW_L2_RPC_URL || !process.env.DERIW_L2_CHAIN_ID || !quoteFile) {
    throw new Error('Usage: crosschain-deposit.js <USDT> <quote.json> [--send]; set DERIW_L2_RPC_URL and DERIW_L2_CHAIN_ID');
  }
  const config = { ...selected, rpcUrl: process.env.DERIW_L2_RPC_URL, chainId: R.uint(process.env.DERIW_L2_CHAIN_ID, true).toString() };
  if (config.chainId === selected.chainId) throw new Error('Deposit must originate on the L2 chain');
  const quote = JSON.parse(fs.readFileSync(quoteFile, 'utf8'));
  const provider = await R.providerFor(config);
  try {
    const router = await R.checkedContract(config, 'UserL2ToL3Router', provider);
    const token = R.address(await router.l2Usdt());
    const erc20 = await R.checkedContract(config, 'IERC20', provider, token);
    const value = R.amount(amountString, Number(await erc20.decimals()));
    const account = send ? R.signer(provider).address : R.address(process.env.DERIW_ACCOUNT);
    if (String(quote.sourceChainId) !== config.chainId || String(quote.destinationChainId) !== selected.chainId ||
        R.address(quote.router) !== R.address(router.target) || R.address(quote.token) !== token ||
        R.address(quote.receiver) !== R.address(account) || R.uint(quote.amount) !== value) throw new Error('Bridge quote does not match this transfer');
    if (R.uint(quote.expiresAt) <= BigInt(Math.floor(Date.now() / 1000))) throw new Error('Bridge quote expired');
    if (!R.ethers.isHexString(quote.data)) throw new Error('Invalid bridge quote data');
    if (!await router.getTokenIsIn(token)) throw new Error('L2 token is not supported by bridge');
    R.print({ destination: selected.name, tokenFee: await router.getFee(token, value) });
    await R.executePlan(config, provider, { contract: 'UserL2ToL3Router', method: 'outboundTransfer',
      args: [token, account, value, R.uint(quote.maxGas, true), R.uint(quote.gasPriceBid, true), quote.data],
      value: R.uint(quote.value), approval: { token, spender: router.target, amount: value } }, send);
    if (send) R.print({ note: 'Source transaction confirmed; verify destination token balance and bridge completion separately.' });
  } finally { provider.destroy(); }
}
main().catch(R.fail);
