#!/usr/bin/env node
const fs = require('node:fs');
const R = require('./lib/runtime');
const { tradingPlan } = require('./lib/operations');

async function orderRows(input, config) {
  if (!Array.isArray(input) || input.length === 0 || input.length > 20) {
    throw new Error('Provide 1..20 TP/SL orders');
  }
  return Promise.all(input.map(async row => {
    if (typeof row.isLong !== 'boolean' || typeof row.triggerAbove !== 'boolean') {
      throw new Error('isLong and triggerAbove must be JSON booleans');
    }
    // Human amounts must be strings, preserving precision before ABI conversion.
    for (const key of ['size', 'triggerPrice']) {
      if (typeof row[key] !== 'string') throw new Error(`${key} must be a decimal string`);
    }
    if (row.collateral !== undefined && typeof row.collateral !== 'string') {
      throw new Error('collateral must be a decimal string');
    }
    return (await tradingPlan('limit-close', [row.token, row.size, String(row.isLong),
      row.triggerPrice, String(row.triggerAbove), row.collateral || '0'], config)).args;
  }));
}

function parseOrders(input) {
  if (fs.existsSync(input)) return JSON.parse(fs.readFileSync(input, 'utf8'));
  return JSON.parse(input);
}

async function main() {
  const argv = process.argv.slice(2), send = argv.includes('--send');
  const [parentHash, ordersArg] = argv.filter(x => x !== '--send');
  if (!R.ethers.isHexString(parentHash, 32) || !ordersArg) {
    throw new Error('Usage: submit-tpsl.js <completed-market-open-hash> <orders.json|jsonString> [--send]');
  }
  const config = R.network(), rows = await orderRows(parseOrders(ordersArg), config);
  const plan = { contract: 'OrderBook', method: 'batchCreateDecreaseOrder', args: [rows] };
  await R.executePlan(config, null, plan, false);
  R.print({ route: '/client/order/tpsl', parentHash, mode: send ? 'send-via-api' : 'preview' });
  if (!send) return;
  R.assertWriteNetwork();
  const provider = await R.providerFor(config);
  try {
    const wallet = R.signer(provider);
    const parent = await provider.getTransactionReceipt(parentHash);
    if (!parent || parent.status !== 1 || R.address(parent.to) !== R.contractAddress(config, 'PositionRouter')) {
      throw new Error('Parent must be a successful PositionRouter creation transaction on this network');
    }
    const iface = new R.ethers.Interface(R.abi('PositionRouter'));
    const created = parent.logs.some(log => {
      if (R.address(log.address) !== R.contractAddress(config, 'PositionRouter')) return false;
      try {
        const e = iface.parseLog(log);
        return e?.name === 'CreateIncreasePosition' && R.address(e.args.cEvent.account) === wallet.address;
      } catch { return false; }
    });
    if (!created) throw new Error('Parent is not this wallet\'s market-open request');
    const status = await R.api(config, 'POST', '/client/position_router/tx_status', {
      address: wallet.address, tx_hash: parentHash, type: 0,
    });
    if (status.data?.status !== 2) throw new Error('Parent execution is not confirmed by the client API');
    const orderBook = await R.checkedContract(config, 'OrderBook', wallet);
    const fn = orderBook.getFunction(plan.method);
    await fn.staticCall(...plan.args);
    // The client API decodes legacy RLP transactions; submit an explicit type-0 envelope.
    const tx = await wallet.populateTransaction({ ...await fn.populateTransaction(...plan.args), type: 0 });
    const signed = await wallet.signTransaction(tx), hash = R.ethers.keccak256(signed);
    // Persist this public hash if interrupted. Never print the broadcastable signed bytes.
    R.print({ signedTransactionHash: hash, nonce: tx.nonce,
      note: 'After an API error or timeout, query this hash and nonce before any new submission.' });
    const result = await R.api(config, 'POST', '/client/order/tpsl', {
      account: wallet.address, order_hash: parentHash, tx_hex: signed,
    });
    R.print({ apiCode: result.code, transactionHash: hash, status: 'accepted-awaiting-receipt' });
    const receipt = await provider.waitForTransaction(hash, 1, 60000);
    if (!receipt) throw new Error(`Receipt pending for ${hash}; do not automatically resubmit`);
    if (receipt.status !== 1) throw new Error(`Relayed transaction reverted: ${hash}`);
    R.print({ confirmed: hash, blockNumber: receipt.blockNumber,
      note: 'Order creation confirmed. Verify indices and later execution or cancellation separately.' });
  } finally { provider.destroy(); }
}
if (require.main === module) main().catch(R.fail);
module.exports = { orderRows };
