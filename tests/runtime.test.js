const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../scripts/lib/runtime');
const { tradingPlan } = require('../scripts/lib/operations');
const { isUserWrite, writes } = require('../scripts/contract-call');

test('network selection isolates three deployments and rejects conflicting legacy alias', () => {
  assert.equal(R.network({ DERIW_NETWORK: 'dev' }).chainId, '18417507517');
  assert.equal(R.network({ DERIW_NETWORK: 'test' }).chainId, '2885');
  assert.equal(R.network({}).chainId, '2886');
  assert.throws(() => R.network({ DERIW_NETWORK: 'production' }));
  assert.throws(() => R.network({ DERIW_NETWORK: 'test', DEV: 'true' }));
  for (const config of Object.values(R.networks)) {
    for (const value of Object.values(config.contracts)) assert.ok(R.ethers.isAddress(R.address(value)));
    assert.throws(() => R.contractAddress(config, 'VaultPriceFeed'));
  }
});
test('amounts retain precision above Number.MAX_SAFE_INTEGER and reject malformed values', () => {
  assert.equal(R.amount('9007199254740993.123456', 6), 9007199254740993123456n);
  for (const x of ['-1', '0', 'NaN', '1e6', '0.0000001']) assert.throws(() => R.amount(x, 6));
  for (const x of [undefined, 'TRUE', '0', 'yes']) assert.throws(() => R.bool(x));
  assert.equal(R.bool('false'), false);
});
test('slippage bounds follow all four trade directions with integer arithmetic', () => {
  assert.equal(R.slippagePrice(10000n, true, true, '100'), 10100n);
  assert.equal(R.slippagePrice(10000n, false, true, '100'), 9900n);
  assert.equal(R.slippagePrice(10000n, true, false, '100'), 9900n);
  assert.equal(R.slippagePrice(10000n, false, false, '100'), 10100n);
  assert.throws(() => R.slippagePrice(10000n, true, true, '10000'));
  assert.throws(() => R.slippagePrice(0n, true, true, '10'));
});
test('the shared smoke/trading quote check rejects stale, future and invalid quotes', () => {
  assert.equal(R.validateQuote(101n, 100n, 100n, 110, '60'), 10n);
  assert.throws(() => R.validateQuote(101n, 100n, 100n, 3700, '60'), /stale/);
  assert.throws(() => R.validateQuote(101n, 100n, 100n, 99, '60'), /invalid/);
  assert.throws(() => R.validateQuote(99n, 100n, 100n, 110, '60'), /invalid/);
  assert.throws(() => R.validateQuote(101n, 0n, 100n, 110, '60'), /invalid/);
});
test('limit order calldata uses Router allowance and exact margin/leverage', async () => {
  const config = R.network({ DERIW_NETWORK: 'test' }), token = config.contracts.USDT;
  const plan = await tradingPlan('limit-open', [token, '12.5', '125', 'false', '90000', 'true'], config, {});
  assert.equal(plan.approval.spender, R.address(config.contracts.Router));
  assert.equal(plan.approval.amount, 12500000n);
  const iface = new R.ethers.Interface(R.abi(plan.contract));
  const decoded = iface.decodeFunctionData(plan.method, iface.encodeFunctionData(plan.method, plan.args));
  assert.equal(decoded._sizeDelta, R.amount('125', 30));
  assert.equal(decoded._lever, 100000n);
  assert.equal(decoded._isLong, false);
});
test('market plans read the current oracle, encode bounded prices and reject stale quotes', async () => {
  const config = R.network({ DERIW_NETWORK: 'dev' }), token = config.contracts.USDT;
  const iface = new R.ethers.Interface(R.abi('PriceOracle'));
  let timestamp = 100n;
  const provider = { getCode: async () => '0x01', getBlock: async () => ({ timestamp: 105 }),
    call: async tx => {
      assert.equal(tx.to, R.address(config.contracts.PriceOracle));
      assert.equal(iface.parseTransaction({ data: tx.data }).name, 'getMaxMinPriceWithTime');
      return iface.encodeFunctionResult('getMaxMinPriceWithTime', [10000n, 9900n, timestamp]);
    } };
  const original = process.env.DERIW_SLIPPAGE_BPS;
  process.env.DERIW_SLIPPAGE_BPS = '100';
  try {
    const plan = await tradingPlan('market-open', [token, '10', '100', 'false'], config, provider);
    assert.equal(plan.args[5], 9801n);
    const orderIface = new R.ethers.Interface(R.abi('PositionRouter'));
    assert.ok(orderIface.encodeFunctionData(plan.method, plan.args));
    const close = await tradingPlan('market-close', [token, '100', 'false'], config, provider, token);
    assert.equal(close.args[6], 10100n);
    const collateralOnly = await tradingPlan('market-close', [token, '0', 'true', '1'], config, provider, token);
    assert.equal(collateralOnly.args[3], 0n);
    assert.equal(collateralOnly.args[2], R.amount('1', 30));
    const marginOnly = await tradingPlan('market-open', [token, '1', '0', 'true'], config, provider);
    assert.equal(marginOnly.args[3], 0n);
    assert.equal(marginOnly.args[6], R.ethers.ZeroHash);
    await assert.rejects(tradingPlan('market-open', [token, '1', '1', 'true', '0x' + '11'.repeat(32)], config, provider), /zero referral/);
    await assert.rejects(tradingPlan('market-close', [token, '0', 'true', '0'], config, provider, token), /both be zero/);
    timestamp = 1n;
    await assert.rejects(tradingPlan('market-open', [token, '10', '100', 'true'], config, provider), /stale/);
  } finally {
    if (original === undefined) delete process.env.DERIW_SLIPPAGE_BPS; else process.env.DERIW_SLIPPAGE_BPS = original;
  }
});
test('public ABI does not enable keeper, admin, pool-data, or fund-manager writes', () => {
  for (const [name, method] of [['PositionRouter', 'executeIncreasePosition'], ['OrderBook', 'cancelMultipleFor'],
    ['PriceOracle', 'batchSetPrices'], ['MemeFactory', 'setChannelPoolIsPause'],
    ['FundRouterV2', 'compoundToNext'], ['PoolDataV2', 'deposit'], ['MemePool', 'withdraw']]) {
    assert.equal(isUserWrite(name, method), false);
  }
  assert.equal(isUserWrite('OrderBook', 'cancelIncreaseOrder'), true);
  for (const [name, methods] of Object.entries(writes)) {
    const iface = new R.ethers.Interface(R.abi(name));
    for (const method of methods) assert.ok(iface.getFunction(method));
  }
});
test('read API preserves repeated query values and false, rejects application errors and unsafe routes', async () => {
  const original = global.fetch;
  try {
    global.fetch = async url => {
      assert.deepEqual(url.searchParams.getAll('name'), ['BTC', 'ETH']);
      assert.equal(url.searchParams.get('is_long'), 'false');
      return { ok: true, json: async () => ({ code: 0, data: ['9007199254740993'] }) };
    };
    assert.deepEqual((await R.api(R.network({}), 'GET', '/client/prices', { name: ['BTC', 'ETH'], is_long: false })).data, ['9007199254740993']);
    global.fetch = async () => ({ ok: true, json: async () => ({ code: 100438, msg: 'invalid input' }) });
    await assert.rejects(R.api(R.network({}), 'GET', '/client/coins'), /100438/);
    global.fetch = async () => ({ ok: false, status: 500,
      json: async () => ({ code: 100002, msg: 'Internal server error', reference: 'private server stack' }) });
    await assert.rejects(R.api(R.network({}), 'GET', '/client/coins'), error => {
      assert.match(error.message, /HTTP 500.*100002/);
      assert.ok(!error.message.includes('private server stack'));
      return true;
    });
    await assert.rejects(R.api(R.network({}), 'GET', '/unsupported/route'), /outside/);
    await assert.rejects(R.api(R.network({}), 'GET', '/client/airdrop/log'), /outside/);
    await assert.rejects(R.api(R.network({}), 'POST', '/client/coins'), /outside/);
  } finally { global.fetch = original; }
});
test('receipt summary keeps request keys and a false cancel is distinct from an allowance revert', () => {
  const iface = new R.ethers.Interface(R.abi('PositionRouter'));
  const key = '0x' + 'ab'.repeat(32);
  const encoded = iface.encodeEventLog('CreateIncreasePosition', [{
    key, path: [], account: R.ethers.ZeroAddress, indexToken: R.ethers.ZeroAddress,
    amountIn: 1n, sizeDelta: 1n, acceptablePrice: 1n, index: 1n, queueIndex: 1n,
    blockNumber: 1n, blockTime: 1n, gasPrice: 1n, isLong: true,
  }]);
  const absent = iface.encodeEventLog('IncreasePositionNotExist', [7n]);
  const effects = R.receiptEffects({
    target: '0x0000000000000000000000000000000000000001',
    interface: iface,
  }, { logs: [
    { address: '0x0000000000000000000000000000000000000001', topics: encoded.topics, data: encoded.data },
    { address: '0x0000000000000000000000000000000000000001', topics: absent.topics, data: absent.data },
  ] });
  assert.equal(effects[0].key, key);
  assert.equal(effects[1].effect, 'request-already-absent');
  assert.equal(R.allowanceFailure({ message: 'execution reverted: ERC20: insufficient allowance' }), true);
  assert.equal(R.allowanceFailure({ data: '0x08c379a0' + R.ethers.AbiCoder.defaultAbiCoder().encode(['string'], ['ERC20: insufficient allowance']).slice(2) }), true);
  assert.equal(R.allowanceFailure({ reason: 'amount err' }), false);
});
test('preview encodes a transaction without reading a key or making any RPC calls', async () => {
  const originalLog = console.log, originalKeyFile = process.env.PRIVATE_KEY_FILE;
  process.env.PRIVATE_KEY_FILE = '/nonexistent/key';
  console.log = () => {};
  try {
    await R.executePlan(R.network({}), {}, { contract: 'OrderBook', method: 'cancelIncreaseOrder', args: [3n] }, false);
  } finally {
    console.log = originalLog;
    if (originalKeyFile === undefined) delete process.env.PRIVATE_KEY_FILE; else process.env.PRIVATE_KEY_FILE = originalKeyFile;
  }
});
