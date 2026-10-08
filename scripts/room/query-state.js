#!/usr/bin/env node
const R = require('../lib/runtime');
async function main() {
  const [host, token, direction] = process.argv.slice(2);
  const account = R.address(host), config = R.network(), provider = await R.providerFor(config);
  try {
    const factory = await R.checkedContract(config, 'MemeFactory', provider);
    const pool = await factory.channelOwnerPool(account);
    R.print({ host: account, pool });
    if (pool !== R.ethers.ZeroAddress) {
      const targets = await factory.getChannelPoolTargetToken(pool);
      const vault = await R.checkedContract(config, 'Vault', provider);
      R.print({ targets, poolAmount: await vault.poolAmounts(targets[0], R.contractAddress(config, 'USDT')) });
    }
    if (token) {
      const phase = await R.checkedContract(config, 'Phase', provider);
      R.print({ liquidity: await phase.getValue(account, R.address(token), R.bool(direction)),
        longShortValue: await phase.getLongShortValue(R.address(token)) });
    }
  } finally { provider.destroy(); }
}
main().catch(R.fail);
