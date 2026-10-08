#!/usr/bin/env node
const R = require('../lib/runtime');
async function main() {
  const [user, challenge] = process.argv.slice(2), config = R.network();
  for (const endpoint of ['templates', 'lpvault']) R.print({ endpoint,
    ...(await R.api(config, 'GET', `/client/edge_hour/${endpoint}`)) });
  if (user) for (const endpoint of ['challenge/info', 'user/overview', 'user/challenges']) {
    R.print({ endpoint, ...(await R.api(config, 'GET', `/client/edge_hour/${endpoint}`, { account: R.address(user) })) });
  }
  if (challenge) for (const endpoint of ['positions', 'close_records', 'challenge_detail']) {
    R.print({ endpoint, ...(await R.api(config, 'GET', `/client/edge_hour/${endpoint}`,
      { account: R.address(user), challenge_id: R.uint(challenge).toString() })) });
  }
}
main().catch(R.fail);
