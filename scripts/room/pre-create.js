#!/usr/bin/env node
const R = require('../lib/runtime');
async function main() {
  const mode = process.argv[2];
  if (!['1', '2'].includes(mode)) throw new Error('Usage: pre-create.js <1|2> [--send]');
  const config = R.network(), text = 'Apply to become a host';
  if (!process.argv.includes('--send')) return R.print({ network: config.name, api: config.apiBase,
    route: '/client/room/pre-create', capacity_base_mode: Number(mode), signMessage: text, mode: 'preview' });
  R.assertWriteNetwork();
  const provider = await R.providerFor(config);
  try {
    const wallet = R.signer(provider);
    const signature = await wallet.signMessage(text);
    R.print(await R.api(config, 'POST', '/client/room/pre-create', {
      account: wallet.address, capacity_base_mode: Number(mode), message: signature }));
    R.print({ account: wallet.address, note: 'Application recorded. This does not create or fund an on-chain room.' });
  } finally { provider.destroy(); }
}
main().catch(R.fail);
