const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../scripts/lib/runtime');
const { clientPlan, submit } = require('../scripts/lib/client-actions');
const { userPlan } = require('../scripts/lib/user-actions');
const { sourceConfig, alias, encodeRetryableData } = require('../scripts/lib/bridge');

test('signed client actions bind the signer and never accept caller-supplied signatures', async () => {
  const wallet = R.ethers.Wallet.createRandom(), old = global.fetch;
  try {
    const cases = [
      ['room-apply', { capacity_base_mode: 2 }, 'message'],
      ['rebate-rate', { return_rate: 0 }, 'signature'],
      ['der-plus-bind', { invitation_code: 'example-code' }, 'sign'],
      ['affiliate-apply', { username: 'Example', country: 'Example', platforms: ['website'], profiles: [{ link: 'https://example.com', follower_count: 0 }] }, 'signature'],
    ];
    for (const [action, input, signatureField] of cases) {
      const plan = clientPlan(action, input);
      global.fetch = async (url, opts) => {
        const body = JSON.parse(opts.body);
        assert.equal(url.pathname, plan.route);
        assert.equal(body[plan.accountField], wallet.address);
        assert.equal(R.ethers.verifyMessage(plan.message, body[signatureField]), wallet.address);
        assert.equal(opts.redirect, 'error');
        return { ok: true, json: async () => ({ code: 0, data: {} }) };
      };
      const result = await submit(R.network({ DERIW_NETWORK: 'dev' }), {}, plan, wallet);
      assert.equal(result.code, 0);
      assert.ok(!JSON.stringify(result).includes('signature'));
      assert.throws(() => clientPlan(action, { ...input, account: wallet.address }), /Unsupported/);
      assert.throws(() => clientPlan(action, { ...input, signature: '0x' }), /Unsupported/);
    }
  } finally { global.fetch = old; }
});

test('API request validation preserves zero rates and rejects malformed profile and challenge inputs', () => {
  assert.equal(clientPlan('rebate-rate', { return_rate: 0 }).body.return_rate, 0);
  for (const return_rate of [-1, 10001, 1.5, '10']) assert.throws(() => clientPlan('rebate-rate', { return_rate }));
  assert.throws(() => clientPlan('affiliate-apply', { username: 'x', country: 'x', platforms: [], profiles: [] }));
  assert.throws(() => clientPlan('challenge-settle', { challenge_id: '9007199254740993' }));
  assert.equal(clientPlan('challenge-settle', { challenge_id: '1' }).body.challenge_id, 1);
});

test('fund, room and referral plans encode the intended public methods and exact units', async () => {
  const c = R.network({ DERIW_NETWORK: 'dev' }), pool = c.contracts.pool;
  for (const [action, args, method] of [
    ['fund-claim', [pool, '299'], 'claim'], ['fund-batch-claim', [pool, '["298","299"]'], 'batchClaim'],
    ['fund-resubmit', [pool, '299', 'false'], 'setIsResubmit'], ['room-close', [], 'setChannelPoolCloseCurrTime'],
    ['room-cancel-close', [], 'cancelChannelPoolCloseTime'], ['room-freeze', [], 'setChannelPoolFreezeNow'],
    ['room-block', [JSON.stringify([pool])], 'batchSetBlacklist'], ['room-unblock', [JSON.stringify([pool])], 'batchSetBlacklist'],
    ['referral-bind', ['example-code'], 'setTraderReferralCodeByUser'], ['edge-referral-bind', ['example-code', '1', '0'], 'setTraderReferralCode'],
    ['meme-claim-all', [], 'claimAll'],
  ]) {
    const plan = await userPlan(action, args, c, {});
    assert.equal(plan.method, method);
    const iface = new R.ethers.Interface(R.abi(plan.contract));
    assert.equal(iface.parseTransaction({ data: iface.encodeFunctionData(plan.method, plan.args) }).name, method);
  }
  await assert.rejects(userPlan('fund-batch-claim', [pool, '["1","1"]'], c, {}), /distinct/);
});

test('Meme deposits reject pools absent from the current factory before approving funds', async () => {
  const old = R.checkedContract, c = R.network({ DERIW_NETWORK: 'dev' });
  try {
    R.checkedContract = async () => ({ poolOwner: async () => R.ethers.ZeroAddress });
    await assert.rejects(userPlan('meme-deposit', [c.contracts.pool, '100'], c, {}), /not registered/);
    R.checkedContract = async () => ({ poolOwner: async () => c.contracts.pool });
    const deposit = await userPlan('meme-deposit', [c.contracts.pool, '100.000001'], c, {});
    assert.equal(deposit.approval.amount, 100000001n);
    assert.equal(deposit.approval.spender, c.contracts.MemeData);
  } finally { R.checkedContract = old; }
});

test('retryable fee calldata matches the Orbit gateway decoding layout', () => {
  const coder = R.ethers.AbiCoder.defaultAbiCoder();
  const encoded = encodeRetryableData(1n, 123n, 456n);
  assert.deepEqual([...coder.decode(['uint256', 'bytes', 'uint256'], encoded)], [123n, '0x', 456n]);
  assert.deepEqual([...coder.decode(['uint256', 'bytes'], encodeRetryableData(2n, 123n))], [123n, '0x']);
  assert.throws(() => encodeRetryableData(0n, 1n), /Unsupported/);
});

test('bridge source configuration isolates chains and alias arithmetic wraps at 160 bits', () => {
  const c = R.network({ DERIW_NETWORK: 'dev' });
  assert.equal(sourceConfig(c, {}).chainId, '421614');
  assert.throws(() => sourceConfig(c, { DERIW_L2_CHAIN_ID: c.chainId }), /different chains/);
  assert.throws(() => sourceConfig(R.network({ DERIW_NETWORK: 'mainnet' }), {}), /Set DERIW/);
  assert.equal(alias(R.ethers.ZeroAddress).toLowerCase(), '0x1111000000000000000000000000000000001111');
  assert.equal(alias('0xffffffffffffffffffffffffffffffffffffffff').toLowerCase(), '0x1111000000000000000000000000000000001110');
});

test('cancelPlan correctly encodes order cancellation for limit and market positions', () => {
  const { cancelPlan } = require('../scripts/cancel-order');
  const dummyKey = '0x' + '11'.repeat(32);
  const inc = cancelPlan('increase', '5');
  assert.equal(inc.contract, 'OrderBook');
  assert.equal(inc.method, 'cancelIncreaseOrder');
  assert.deepEqual(inc.args, [5n]);

  const dec = cancelPlan('decrease', '8');
  assert.equal(dec.contract, 'OrderBook');
  assert.equal(dec.method, 'cancelDecreaseOrder');
  assert.deepEqual(dec.args, [8n]);

  const posInc = cancelPlan('position-increase', dummyKey);
  assert.equal(posInc.contract, 'PositionRouter');
  assert.equal(posInc.method, 'cancelIncreasePosition');
  assert.deepEqual(posInc.args, [dummyKey]);

  const posDec = cancelPlan('position-decrease', dummyKey);
  assert.equal(posDec.contract, 'PositionRouter');
  assert.equal(posDec.method, 'cancelDecreasePosition');
  assert.deepEqual(posDec.args, [dummyKey]);

  assert.throws(() => cancelPlan('unknown', '1'), /Unknown order type/);
  assert.throws(() => cancelPlan('position-increase', '0x123'), /32-byte hex/);
});
