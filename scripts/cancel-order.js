#!/usr/bin/env node
const R = require('./lib/runtime');

function cancelPlan(type, id) {
  if (!type || id === undefined) {
    throw new Error('Usage: cancel-order.js <increase|decrease|position-increase|position-decrease> <orderIndex|requestKey> [--send]');
  }
  if (type === 'increase' || type === 'limit-open') {
    return { contract: 'OrderBook', method: 'cancelIncreaseOrder', args: [R.uint(id)] };
  }
  if (type === 'decrease' || type === 'limit-close') {
    return { contract: 'OrderBook', method: 'cancelDecreaseOrder', args: [R.uint(id)] };
  }
  if (type === 'position-increase' || type === 'market-open') {
    if (!R.ethers.isHexString(id, 32)) throw new Error('Request key must be a 32-byte hex string');
    return { contract: 'PositionRouter', method: 'cancelIncreasePosition', args: [id] };
  }
  if (type === 'position-decrease' || type === 'market-close') {
    if (!R.ethers.isHexString(id, 32)) throw new Error('Request key must be a 32-byte hex string');
    return { contract: 'PositionRouter', method: 'cancelDecreasePosition', args: [id] };
  }
  throw new Error('Unknown order type. Use increase, decrease, position-increase, or position-decrease');
}

async function main() {
  const argv = process.argv.slice(2), send = argv.includes('--send');
  const [type, id] = argv.filter(x => x !== '--send');
  const plan = cancelPlan(type, id);
  const config = R.network();
  const provider = await R.providerFor(config);
  try {
    await R.executePlan(config, provider, plan, send);
  } finally {
    provider.destroy();
  }
}

if (require.main === module) main().catch(R.fail);
module.exports = { cancelPlan };
