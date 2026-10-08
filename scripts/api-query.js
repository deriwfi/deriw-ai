#!/usr/bin/env node
const R = require('./lib/runtime');
async function main() {
  const [route, json = '{}'] = process.argv.slice(2);
  const method = route === '/client/position_router/tx_status' ? 'POST' : 'GET';
  R.print(await R.api(R.network(), method, route, JSON.parse(json)));
}
main().catch(R.fail);
