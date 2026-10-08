#!/usr/bin/env node
const fs = require('node:fs');
const R = require('./lib/runtime');
const { clientPlan, submit } = require('./lib/client-actions');
async function main() {
  const argv = process.argv.slice(2), send = argv.includes('--send');
  const [action, file] = argv.filter(x => x !== '--send');
  if (!file) throw new Error('Usage: client-action.js <action> <request.json> [--send]');
  const config = R.network(), plan = clientPlan(action, JSON.parse(fs.readFileSync(file, 'utf8')));
  R.print({ network: config.name, route: plan.route, fields: plan.body, signMessage: plan.message || null, mode: send ? 'send' : 'preview' });
  if (!send) return;
  R.assertWriteNetwork();
  const provider = await R.providerFor(config);
  try { R.print(await submit(config, provider, plan, R.signer(provider))); }
  finally { provider.destroy(); }
}
if (require.main === module) main().catch(R.fail);
