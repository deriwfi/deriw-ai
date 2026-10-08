#!/usr/bin/env node
const R = require('./lib/runtime');
async function main() {
  const [account, indexToken, direction] = process.argv.slice(2);
  const config = R.network();
  const args = [R.address(account), R.contractAddress(config, 'USDT'), R.address(indexToken), R.bool(direction)];
  const provider = await R.providerFor(config);
  try {
    const vault = await R.checkedContract(config, 'Vault', provider);
    const p = await vault.getPosition(...args);
    R.print({ network: config.name, account: args[0], indexToken: args[2], isLong: args[3],
      sizeUsd: R.ethers.formatUnits(p[0], 30), collateralUsd: R.ethers.formatUnits(p[1], 30),
      averagePriceUsd: R.ethers.formatUnits(p[2], 30), raw: p });
  } finally { provider.destroy(); }
}
main().catch(R.fail);
