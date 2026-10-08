const { ethers } = require('ethers');
const fs = require('node:fs');
const path = require('node:path');
const networks = require('../../references/networks.json');

function network(env = process.env) {
  const name = env.DERIW_NETWORK || (env.DEV === 'true' ? 'dev' : 'mainnet');
  if (!networks[name]) throw new Error('DERIW_NETWORK must be dev, test, or mainnet');
  if (env.DEV === 'true' && name !== 'dev') throw new Error('DEV conflicts with DERIW_NETWORK');
  return { name, ...networks[name], rpcUrl: env.DERIW_RPC_URL || networks[name].rpcUrl,
    apiBase: env.DERIW_API_BASE || networks[name].apiBase };
}
function address(value) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value || '')) throw new Error('Expected a 20-byte hex address');
  // Deployment lists can contain mixed case without an EIP-55 checksum.
  return ethers.getAddress(value.toLowerCase());
}
function uint(value, positive = false) {
  if (!/^\d+$/.test(String(value))) throw new Error('Expected an unsigned integer');
  const n = BigInt(value);
  if (n > ethers.MaxUint256 || (positive && n === 0n)) throw new Error('Integer out of range');
  return n;
}
function amount(value, decimals, positive = true) {
  if (!/^\d+(\.\d+)?$/.test(value || '')) throw new Error('Expected a decimal amount string');
  const n = ethers.parseUnits(value, decimals);
  if (n > ethers.MaxUint256 || (positive && n === 0n)) throw new Error('Amount out of range');
  return n;
}
function bool(value) {
  if (value !== 'true' && value !== 'false') throw new Error('Boolean must be true or false');
  return value === 'true';
}
function abi(name) {
  if (!/^[A-Za-z0-9_/-]+$/.test(name)) throw new Error('Invalid ABI name');
  const data = require(path.join(__dirname, '../../assets', `${name}.json`));
  return data.abi || data;
}
function contractAddress(config, name) {
  const edge = { 'edge_hour/ChallengeManager': 'DERIW_EDGE_CHALLENGE_MANAGER',
    'edge_hour/LPVault': 'DERIW_EDGE_LP_VAULT', 'edge_hour/PriceOracle': 'DERIW_EDGE_PRICE_ORACLE' };
  const value = edge[name] ? process.env[edge[name]] : config.contracts[name];
  if (!value) throw new Error(`No current deployment for ${name}${edge[name] ? `; set ${edge[name]} for ${config.name}` : ''}`);
  return address(value);
}
async function providerFor(config) {
  const request = new ethers.FetchRequest(config.rpcUrl);
  request.timeout = 15000;
  const provider = new ethers.JsonRpcProvider(request, undefined, { batchMaxCount: 1 });
  // send avoids the provider's background network-detection retry loop on bad RPCs.
  try {
    const actual = BigInt(await provider.send('eth_chainId', []));
    if (actual !== BigInt(config.chainId)) throw new Error(`Chain mismatch: expected ${config.chainId}, got ${actual}`);
    return provider;
  } catch (error) {
    provider.destroy();
    throw error;
  }
}
async function checkedContract(config, name, runner, target) {
  const at = target ? address(target) : contractAddress(config, name);
  const provider = runner.provider || runner;
  if (await provider.getCode(at) === '0x') throw new Error(`No bytecode for ${name} at ${at}`);
  return new ethers.Contract(at, abi(name), runner);
}
function print(data) {
  console.log(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
}
function signer(provider) {
  const key = process.env.PRIVATE_KEY_FILE
    ? fs.readFileSync(process.env.PRIVATE_KEY_FILE, 'utf8').trim() : process.env.PRIVATE_KEY;
  if (!key) throw new Error('Set PRIVATE_KEY_FILE or PRIVATE_KEY locally to send; never paste it into chat');
  try { return new ethers.Wallet(key, provider); } catch { throw new Error('Invalid local private key'); }
}
function assertWriteNetwork() {
  if (!process.env.DERIW_NETWORK && process.env.DEV !== 'true') {
    throw new Error('Select DERIW_NETWORK explicitly before sending');
  }
}
function slippagePrice(price, isLong, increase, bps) {
  bps = uint(bps);
  if (price <= 0n || bps >= 10000n) throw new Error('Price must be positive; slippage must be 0..9999 bps');
  const up = isLong === increase;
  const value = price * (up ? 10000n + bps : 10000n - bps) / 10000n;
  if (!value) throw new Error('Slippage price rounds to zero');
  return value;
}
function validateQuote(max, min, updated, blockTime, maxAge = process.env.DERIW_MAX_PRICE_AGE_SECONDS || '60') {
  const age = BigInt(blockTime) - updated;
  if (min <= 0n || max < min || updated === 0n || age < 0n || age > uint(maxAge, true)) {
    throw new Error('Oracle quote is invalid, missing or stale');
  }
  return age;
}
async function sendCall(contract, method, args, overrides = {}) {
  const fn = contract.getFunction(method);
  await fn.staticCall(...args, overrides);
  const tx = await fn(...args, overrides);
  // Print immediately: a receipt timeout must never cause an automatic resubmission.
  print({ submitted: tx.hash, to: contract.target, method });
  const receipt = await tx.wait(1, 120000);
  if (!receipt || receipt.status !== 1) throw new Error(`Receipt not successful: ${tx.hash}`);
  print({ confirmed: receipt.hash, blockNumber: receipt.blockNumber });
  return receipt;
}
async function executePlan(config, provider, plan, send) {
  const iface = new ethers.Interface(abi(plan.contract));
  const to = plan.target || contractAddress(config, plan.contract);
  print({ network: config.name, chainId: config.chainId, to, method: plan.method,
    args: plan.args, value: plan.value || 0n, approval: plan.approval || null,
    data: iface.encodeFunctionData(plan.method, plan.args), mode: send ? 'send' : 'preview' });
  if (!send) return;
  assertWriteNetwork();
  const wallet = signer(provider);
  const contract = await checkedContract(config, plan.contract, wallet, to);
  if (plan.approval) {
    const { token, spender, amount: needed } = plan.approval;
    const spenderGetter = { PositionRouter: 'router', OrderBook: 'router', FundRouterV2: 'poolDataV2',
      MemeRouter: 'memeData', MemeFactory: 'memeData' }[plan.contract];
    const expectedSpender = spenderGetter ? await contract[spenderGetter]() : contract.target;
    if (address(expectedSpender) !== address(spender)) throw new Error('Configured allowance spender differs from the deployed contract');
    const erc20 = await checkedContract(config, 'IERC20', wallet, token);
    if (await erc20.balanceOf(wallet.address) < needed) throw new Error('Insufficient token balance');
    const allowance = await erc20.allowance(wallet.address, spender);
    if (allowance < needed) {
      if (allowance !== 0n) await sendCall(erc20, 'approve', [spender, 0n]);
      await sendCall(erc20, 'approve', [spender, needed]);
    }
  }
  return sendCall(contract, plan.method, plan.args, { value: plan.value || 0n });
}
// Only explicitly reviewed read routes. Some other GET routes mutate state.
const readRoutes = new Set([
  '/client/candles', '/client/coins', '/client/prices', '/client/coin_infos', '/client/coin_intro',
  '/client/coin_market/info', '/client/order/indices', '/client/order/total_sizedelta',
  '/client/vault/decrease_records', '/client/vault/total_fees', '/client/vault/position_tokens',
  '/client/account_position/sort', '/client/account/info', '/client/transaction/status',
  ...['summary', 'pnl_series', 'funding_history', 'transactions', 'chain_transfers'].map(x => `/client/portfolio/${x}`),
  ...['tokens', 'terms', 'lists', 'deposit', 'total'].map(x => `/client/foundpool/${x}`),
  ...['tokens', 'lists', 'deposit', 'total'].map(x => `/client/memepool/${x}`),
  ...['apply_agent_status', 'user_info', 'user_invitees', 'invite_return_records', 'invite_friends'].map(x => `/client/invite_return/v2/${x}`),
  '/client/point_benefit/return_fees_records',
  ...['liquidity', 'open-positions', 'close-position-history', 'lp-change', 'traders', 'blocked-users', 'detail', 'fee', 'tvl', 'coins', 'pool-status'].map(x => `/client/room/${x}`),
  ...['templates', 'templates/config', 'lpvault', 'challenge/info', 'positions', 'close_records', 'user/overview', 'user/challenges', 'user/challenge/detail', 'challenge_detail', 'liquidate_price'].map(x => `/client/edge_hour/${x}`),
]);
async function api(config, method, route, params = {}) {
  const allowed = method === 'GET' ? readRoutes.has(route)
    : method === 'POST' && ['/client/position_router/tx_status', '/client/room/pre-create'].includes(route);
  if (!allowed) throw new Error('Route/method is outside the reviewed client API surface');
  const url = new URL(route, config.apiBase);
  if (method === 'GET') for (const [k, v] of Object.entries(params)) {
    for (const value of Array.isArray(v) ? v : [v]) url.searchParams.append(k, String(value));
  }
  const response = await fetch(url, { method, redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json' },
    ...(method === 'POST' ? { body: JSON.stringify(params) } : {}) });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${route}`);
  const json = await response.json();
  if (json.code !== 0) throw new Error(`Client API code=${json.code}, msg=${json.msg || ''}`);
  return json;
}
function fail(error) {
  // Ethers errors may contain raw requests. Do not print keys, signed messages or raw transactions.
  const message = error.shortMessage || error.message || 'Operation failed';
  console.error(message.replace(/0x[0-9a-fA-F]{64,}/g, '[redacted]'));
  process.exitCode = 1;
}
module.exports = { ethers, networks, network, address, uint, amount, bool, abi, contractAddress,
  providerFor, checkedContract, print, signer, assertWriteNetwork, slippagePrice, validateQuote, sendCall,
  executePlan, readRoutes, api, fail };
