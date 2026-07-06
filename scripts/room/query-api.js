#!/usr/bin/env node
/**
 * Room mode server API batch query.
 * Queries a host's room: detail, traders, open positions, close history, LP changes,
 * fee/TVL trends, pool status, and tradeable coins.
 *
 * "account" here is the HOST (room creator) address, not a normal trader wallet.
 *
 * Usage:   node scripts/room/query-api.js <hostAccount>
 * Example: DEV=true node scripts/room/query-api.js 0xHostAddress
 *
 * Environment variables: DEV=true (devnet)
 */
const IS_DEV = process.env.DEV === 'true';
const API_BASE = IS_DEV ? 'https://testgmxapi.weequan.cyou' : 'https://api.deriw.com';

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`);
  return res.json();
}

const fmt = (v, dp = 2) => (v === undefined || v === null || v === '' ? '-' : Number(v).toFixed(dp));

async function main() {
  const [account] = process.argv.slice(2);
  if (!account) {
    console.error('Usage: node query-api.js <hostAccount>');
    process.exit(1);
  }
  const q = `account=${account}`;

  // ── Pool status ──────────────────────────────────────────────────────────────
  console.log(`=== Pool Status (host ${account}) ===`);
  const statusResp = await get(`/client/room/pool-status?${q}`);
  if (statusResp.code === 0 && statusResp.data) {
    const d = statusResp.data;
    const STATUS = { 0: 'None', 1: 'PreCreate', 2: 'Created', 3: 'Running', 4: 'Cooldown', 5: 'Closed' };
    const MODE = { 1: 'Principal', 2: 'Equity' };
    console.log(`  status: ${STATUS[d.status] ?? d.status} | capacityBaseMode: ${MODE[d.capacity_base_mode] ?? d.capacity_base_mode}`);
    console.log(`  pool: ${d.pool || '-'}`);
    console.log(`  canRemoveLiquidity: ${d.can_remove_liquidity} | withdrawals: ${d.total_withdrawal_number}/${d.withdrawal_limit} | windowTime: ${d.withdrawal_window_time}s`);
  } else {
    console.log(`  code=${statusResp.code} msg=${statusResp.msg || statusResp.message || ''}`);
  }

  // ── Detail overview ────────────────────────────────────────────────────────────
  console.log('\n=== Detail ===');
  const detailResp = await get(`/client/room/detail?${q}`);
  if (detailResp.code === 0 && detailResp.data) {
    const d = detailResp.data;
    console.log(`  netDeposits: ${fmt(d.net_deposits)} (${fmt(Number(d.net_deposits_change_percent) * 100)}%) | totalDeposits: ${fmt(d.total_deposits)}`);
    console.log(`  poolEquity: ${fmt(d.pool_equity)} | totalTVL: ${fmt(d.total_tvl)} | withdrawable: ${fmt(d.withdrawable_amount)}`);
    console.log(`  maxOI: ${fmt(d.max_oi)} | reversedOI: ${fmt(d.total_reversed_oi)} (${fmt(Number(d.total_reversed_oi_percent) * 100)}%) | availableOI: ${fmt(d.total_available_oi)}`);
    console.log(`  activeTraders: ${d.active_trader} | totalVolume: ${fmt(d.total_volume)} | realizedPnl: ${fmt(d.realized_pnl)} | netRevenue: ${fmt(d.net_revenue)}`);
    if (d.room_health) console.log(`  health: utilization=${fmt(Number(d.room_health.utilization_rate) * 100)}% | riskExposure=${d.room_health.risk_exposure}`);
  } else {
    console.log(`  code=${detailResp.code} msg=${detailResp.msg || detailResp.message || ''} (host may have no active room)`);
  }

  // ── Traders ────────────────────────────────────────────────────────────────────
  console.log('\n=== Traders (page 1) ===');
  const tradersResp = await get(`/client/room/traders?${q}&page_index=1&page_size=10`);
  if (tradersResp.code === 0 && tradersResp.data) {
    const items = tradersResp.data.items || [];
    console.log(`  total: ${tradersResp.data.total}`);
    items.forEach(t => console.log(`  ${t.account} | vol=${fmt(t.total_volume)} | winRate=${fmt(Number(t.win_rate) * 100)}% | fee=${fmt(t.total_fee)} | managedFee=${fmt(t.managed_fee)} | uPnl=${fmt(t.unreleased_pnl)} | rPnl=${fmt(t.released_pnl)}`));
    if (!items.length) console.log('  (none)');
  }

  // ── Open positions ─────────────────────────────────────────────────────────────
  console.log('\n=== Open Positions (page 1) ===');
  const posResp = await get(`/client/room/open-positions?${q}&page_index=1&page_size=10`);
  if (posResp.code === 0 && posResp.data) {
    const items = posResp.data.items || [];
    console.log(`  total: ${posResp.data.total}`);
    items.forEach(p => console.log(`  ${p.market} ${p.direction} ${p.leverage}x | size=${fmt(p.size_delta)} | collateral=${fmt(p.collateral_size)} | avg=${p.average_price} liq=${p.liquidation_price} | uPnl=${fmt(p.unreleased_pnl)}`));
    if (!items.length) console.log('  (none)');
  }

  // ── Close position history ──────────────────────────────────────────────────────
  console.log('\n=== Close History (page 1) ===');
  const closeResp = await get(`/client/room/close-position-history?${q}&page_index=1&page_size=10`);
  if (closeResp.code === 0 && closeResp.data) {
    const items = closeResp.data.items || [];
    console.log(`  total: ${closeResp.data.total}`);
    items.forEach(r => console.log(`  ${r.market} ${r.direction} | rPnl=${fmt(r.released_pnl)} | feeShare=${fmt(r.fee_share)} | forceClose=${r.is_force_close} liq=${r.is_liq} | ${new Date(r.time * 1000).toISOString()}`));
    if (!items.length) console.log('  (none)');
  }

  // ── LP changes ─────────────────────────────────────────────────────────────────
  console.log('\n=== LP Changes (page 1) ===');
  const lpResp = await get(`/client/room/lp-change?${q}&page_index=1&page_size=10`);
  if (lpResp.code === 0 && lpResp.data) {
    const items = lpResp.data.items || [];
    console.log(`  total: ${lpResp.data.total}`);
    items.forEach(e => console.log(`  ${e.type} ${fmt(e.amount)} ${e.symbol} | status=${e.status} | ${new Date(e.time * 1000).toISOString()}`));
    if (!items.length) console.log('  (none)');
  }

  // ── Fee trend ──────────────────────────────────────────────────────────────────
  console.log('\n=== Fee Trend (last 10 days) ===');
  const feeResp = await get(`/client/room/fee?${q}&limit=10`);
  if (feeResp.code === 0 && feeResp.data) {
    (feeResp.data.items || []).forEach(i => console.log(`  ${i.day}: ${fmt(i.volume)}`));
  }

  // ── TVL trend ──────────────────────────────────────────────────────────────────
  console.log('\n=== TVL Trend (last 10 days) ===');
  const tvlResp = await get(`/client/room/tvl?${q}&limit=10`);
  if (tvlResp.code === 0 && tvlResp.data) {
    (tvlResp.data.items || []).forEach(i => console.log(`  ${i.day}: ${fmt(i.volume)}`));
  }

  // ── Tradeable coins ────────────────────────────────────────────────────────────
  console.log('\n=== Coins ===');
  const coinsResp = await get(`/client/room/coins?${q}`);
  if (coinsResp.code === 0 && coinsResp.data) {
    const list = coinsResp.data.list || [];
    console.log('  ' + (list.map(c => c.symbol || c.name).join(', ') || '(none)'));
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
