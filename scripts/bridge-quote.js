#!/usr/bin/env node
const fs = require('node:fs');
const R = require('./lib/runtime');
const { sourceConfig, quoteDeposit } = require('./lib/bridge');
async function main() {
  const [amount, account, output] = process.argv.slice(2), config = R.network();
  if (!amount || !account) throw new Error('Usage: bridge-quote.js <USDT> <account> [quote.json]');
  const parent = await R.providerFor(sourceConfig(config));
  let child;
  try {
    child = await R.providerFor(config);
    const quote = await quoteDeposit(config, parent, child, account, amount);
    if (output) fs.writeFileSync(output, JSON.stringify(quote, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2) + '\n', { mode: 0o600 });
    R.print(quote);
  } finally { parent.destroy(); child?.destroy(); }
}
main().catch(R.fail);
