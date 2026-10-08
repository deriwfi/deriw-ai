const test = require('node:test');
const assert = require('node:assert/strict');
const { orderRows } = require('../scripts/submit-tpsl');
const R = require('../scripts/lib/runtime');

test('TP/SL JSON preserves USD precision and distinguishes short/below triggers', async () => {
  const config = R.network({ DERIW_NETWORK: 'dev' });
  const input = [{ token: config.contracts.USDT, size: '125.000000000000000001',
    isLong: false, triggerPrice: '83100.123456789012345678', triggerAbove: false, collateral: '1.25' }];
  const rows = await orderRows(input, config);
  const iface = new R.ethers.Interface(R.abi('OrderBook'));
  const decoded = iface.decodeFunctionData('batchCreateDecreaseOrder', iface.encodeFunctionData('batchCreateDecreaseOrder', [rows]))[0][0];
  assert.equal(decoded[1], R.amount(input[0].size, 30));
  assert.equal(decoded[3], R.amount('1.25', 30));
  assert.equal(decoded[4], false);
  assert.equal(decoded[5], R.amount(input[0].triggerPrice, 30));
  assert.equal(decoded[6], false);
  await assert.rejects(orderRows([{ ...input[0], size: 125 }], config), /decimal string/);
  await assert.rejects(orderRows([{ ...input[0], isLong: 'false' }], config), /JSON booleans/);
  await assert.rejects(orderRows([{ ...input[0], size: '0', collateral: '0' }], config), /both be zero/);
  await assert.rejects(orderRows([], config), /1..20/);
});
