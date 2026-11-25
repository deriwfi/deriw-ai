#!/usr/bin/env node
const R = require('../lib/runtime');
async function main() {
  if (!process.argv[2]) throw new Error('Usage: room/query-api.js <hostAccount>');
  const account = R.address(process.argv[2]), config = R.network();
  let failed = false;
  for (const name of ['detail', 'pool-status', 'traders', 'open-positions', 'close-position-history', 'lp-change', 'fee', 'tvl', 'coins', 'blocked-users']) {
    try {
      R.print({ endpoint: name, ...(await R.api(config, 'GET', `/client/room/${name}`, { account })) });
    } catch (e) {
      failed = true;
      R.print({ endpoint: name, ok: false, error: e.shortMessage || e.message });
    }
  }
  if (failed) process.exitCode = 1;
}
main().catch(R.fail);
