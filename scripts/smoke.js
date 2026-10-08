#!/usr/bin/env node
// Public reads only. No signer, approvals, signatures, transactions or mutating API calls.
const R = require('./lib/runtime');
async function main() {
  const config = R.network(), checks = [];
  let provider;
  async function check(name, fn) {
    try { const data = await fn(); checks.push({ name, ok: true, data }); }
    catch (e) { checks.push({ name, ok: false, error: e.shortMessage || e.message }); }
  }
  try {
    provider = await R.providerFor(config);
    await check('block', () => provider.getBlockNumber());
    const contracts = process.argv.includes('--all-contracts')
      ? Object.keys(config.contracts).filter(name => !['pool', 'UserL2ToL3Router'].includes(name))
      : ['USDT', 'Vault', 'Router', 'PositionRouter', 'OrderBook', 'PriceOracle', 'PoolDataV2', 'FundRouterV2', 'MemeFactory', 'MemeData', 'MemeRouter', 'UserL3ToL2Router'];
    for (const name of contracts) {
      await check(`bytecode:${name}`, async () => {
        const code = await provider.getCode(R.contractAddress(config, name));
        if (code === '0x') throw new Error('No bytecode');
        return { bytes: (code.length - 2) / 2 };
      });
    }
    let token;
    await check('client:coins', async () => {
      const response = await R.api(config, 'GET', '/client/coins');
      const list = response.data?.list;
      if (!Array.isArray(list) || !list.length) throw new Error('No token list');
      token = list.find(x => x.status === 2 && x.address)?.address;
      return { count: list.length, sampleToken: token };
    });
    for (const [route, params] of [
      ['/client/coin_infos', {}], ['/client/prices', { name: ['BTC', 'ETH'] }],
      ['/client/foundpool/lists', { status: 1 }], ['/client/memepool/lists', {}],
      ['/client/edge_hour/templates', {}],
    ]) await check(route, async () => {
      const result = await R.api(config, 'GET', route, params);
      return { code: result.code, count: (result.data?.list || result.data)?.length ?? null };
    });
    if (token) await check('oracle:price', async () => {
      const oracle = await R.checkedContract(config, 'PriceOracle', provider);
      const [max, min, updated] = await oracle.getMaxMinPriceWithTime(token);
      const block = await provider.getBlock('latest');
      if (!block) throw new Error('Latest block is unavailable');
      const ageSeconds = R.validateQuote(max, min, updated, block.timestamp);
      return { max, min, updated, blockTime: block.timestamp, ageSeconds };
    });
  } catch (e) { checks.push({ name: 'network', ok: false, error: e.shortMessage || e.message }); }
  finally { provider?.destroy(); }
  R.print({ network: config.name, expectedChainId: config.chainId, checks });
  if (checks.some(x => !x.ok)) process.exitCode = 1;
}
main().catch(R.fail);
