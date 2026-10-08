#!/usr/bin/env node
const fs = require('node:fs');
const R = require('./lib/runtime');
const { clientPlan, submit } = require('./lib/client-actions');
function parsePayload(input) {
  if (fs.existsSync(input)) return JSON.parse(fs.readFileSync(input, 'utf8'));
  return JSON.parse(input);
}
async function main() {
  const argv = process.argv.slice(2), send = argv.includes('--send');
  const [action, payloadArg] = argv.filter(x => x !== '--send');
  if (!payloadArg) throw new Error('Usage: client-action.js <action> <request.json|jsonString> [--send]');
  const config = R.network(), plan = clientPlan(action, parsePayload(payloadArg));
  R.print({ network: config.name, route: plan.route, fields: plan.body, signMessage: plan.message || null, mode: send ? 'send' : 'preview' });
  if (!send) return;
  R.assertWriteNetwork();
  const provider = await R.providerFor(config);
  try { R.print(await submit(config, provider, plan, R.signer(provider))); }
  finally { provider.destroy(); }
}
if (require.main === module) main().catch(R.fail);
