#!/usr/bin/env node
const R = require('./lib/runtime');
async function main() {
  const [accountArg, tokenArg, spenderArg] = process.argv.slice(2);
  const account = R.address(accountArg), config = R.network();
  const token = tokenArg ? R.address(tokenArg) : R.contractAddress(config, 'USDT');
  const spender = spenderArg ? R.address(spenderArg) : null;
  const provider = await R.providerFor(config);
  try {
    const erc20 = await R.checkedContract(config, 'IERC20', provider, token);
    const [decimals, balance, nativeBalance] = await Promise.all([
      erc20.decimals(), erc20.balanceOf(account), provider.getBalance(account),
    ]);
    R.print({ network: config.name, account, token, decimals, rawBalance: balance,
      balance: R.ethers.formatUnits(balance, decimals), nativeBalanceWei: nativeBalance,
      ...(spender ? { spender, rawAllowance: await erc20.allowance(account, spender) } : {}) });
  } finally { provider.destroy(); }
}
main().catch(R.fail);
