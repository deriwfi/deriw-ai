#!/usr/bin/env node
const R = require('../lib/runtime');
async function main() {
  const account = R.address(process.argv[2]), config = R.network();
  for (const name of ['detail', 'pool-status', 'traders', 'open-positions', 'close-position-history', 'lp-change', 'fee', 'tvl', 'coins', 'blocked-users']) {
    R.print({ endpoint: name, ...(await R.api(config, 'GET', `/client/room/${name}`, { account })) });
  }
}
main().catch(R.fail);
