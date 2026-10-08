#!/usr/bin/env node
const R = require('./lib/runtime');
async function main() {
  const argv = process.argv.slice(2), send = argv.includes('--send');
  const [action, first, second] = argv.filter(x => x !== '--send');
  const config = R.network(), provider = await R.providerFor(config);
  try {
    let plan;
    const token = R.contractAddress(config, 'USDT'), spender = R.contractAddress(config, 'MemeData');
    if (action === 'meme-deposit') {
      const value = R.amount(second, 6);
      plan = { contract: 'MemeRouter', method: 'deposit', args: [R.address(first), value], approval: { token, spender, amount: value } };
    } else if (['room-create', 'room-reopen', 'room-deposit'].includes(action)) {
      const value = R.amount(first, 6), mode = second;
      if (action !== 'room-deposit' && !['1', '2'].includes(mode)) throw new Error('Room mode must be 1 or 2');
      plan = { contract: 'MemeFactory',
        method: { 'room-create': 'createChannelPool', 'room-reopen': 'setChannelPoolOpen', 'room-deposit': 'depositChannel' }[action],
        args: action === 'room-create' ? [value, Number(mode)] : action === 'room-reopen' ? [Number(mode), value] : [value],
        approval: { token, spender, amount: value } };
    } else throw new Error('Use meme-deposit <pool> <USDT>, room-create/room-reopen <USDT> <mode>, or room-deposit <USDT>');
    await R.executePlan(config, provider, plan, send);
  } finally { provider.destroy(); }
}
main().catch(R.fail);
