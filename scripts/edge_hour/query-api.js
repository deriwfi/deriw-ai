#!/usr/bin/env node
/**
 * Edge Hour server API batch query
 * Queries challenge info, open positions, close records, and user statistics
 *
 * Usage: node scripts/edge_hour/query-api.js <account> [challengeId]
 * Example: DEV=true node scripts/edge_hour/query-api.js 0xYourAddress 35329
 *
 * Environment variables: DEV=true (devnet)
 */
const IS_DEV = process.env.DEV === 'true';
const API_BASE = IS_DEV ? 'https://testgmxapi.weequan.cyou' : 'https://api.deriw.com';

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`);
  return res.json();
}

async function main() {
  const [account, challengeIdStr] = process.argv.slice(2);
  if (!account) {
    console.error('Usage: node query-api.js <account> [challengeId]');
    process.exit(1);
  }

  // ── Template list ────────────────────────────────────────────────────────────
  console.log('=== Template List ===');
  const tmplResp = await get('/client/edge_hour/templates');
  if (tmplResp.code === 0) {
    (tmplResp.data?.list || []).forEach(t => {
      console.log(`  [${t.template_id}] ${t.duration}s | target=${t.r_target}bps(${Number(t.r_target_amount)/1e6}U) | maxLoss=${t.dd_max}bps | minTrades=${t.minimum_trades} | holdTime=${t.minimum_holding_period}s`);
    });
  }

  // ── LPVault overview ────────────────────────────────────────────────────────
  console.log('\n=== LPVault Overview ===');
  const vaultResp = await get('/client/edge_hour/lpvault');
  if (vaultResp.code === 0) {
    const d = vaultResp.data;
    console.log(`  totalAssets:            ${(Number(d.total_asset_balance)/1e6).toFixed(2)} USDT`);
    console.log(`  totalPotentialPayout:   ${(Number(d.total_potential_payout)/1e6).toFixed(2)} USDT`);
    console.log(`  maxVaultUtilizationBps: ${d.max_vault_utilization_bps}`);
  }

  // ── User's current challenge ────────────────────────────────────────────────────────
  console.log(`\n=== Current Challenge (${account}) ===`);
  const infoResp = await get(`/client/edge_hour/challenge/info?account=${account}`);
  if (infoResp.code === 0) {
    const d = infoResp.data;
    console.log(`  has_active_challenge: ${d.has_active_challenge}`);
    console.log(`  need_settlement:      ${d.need_settlement}`);
    console.log(`  min_trade_value:      ${(Number(d.min_trade_value)/1e6).toFixed(2)} USDT`);
    if (d.challenge) {
      const c = d.challenge;
      const STATUS = ['None', 'Active', 'Passed', 'Failed', 'Claimed'];
      console.log(`  challengeId: ${c.challenge_id} | status: ${STATUS[c.status]??c.status} | templateId: ${c.template_id}`);
      console.log(`  roi: ${Number(c.roi)/100}% | pnl: ${(Number(c.pnl)/1e6).toFixed(2)} USDT | tradeCount: ${c.trade_count}`);
      console.log(`  startTime: ${new Date(c.start_time*1000).toISOString()} | endTime: ${new Date(c.end_time*1000).toISOString()}`);
    }
    if (d.failed) {
      console.log('  Failure reason:', JSON.stringify(d.failed));
    }
  }

  // ── Open positions ────────────────────────────────────────────────────────────
  if (challengeIdStr) {
    console.log(`\n=== Open Positions (challengeId=${challengeIdStr}) ===`);
    const posResp = await get(`/client/edge_hour/positions?account=${account}&challenge_id=${challengeIdStr}`);
    if (posResp.code === 0) {
      const list = posResp.data?.list || [];
      if (list.length === 0) {
        console.log('  No open positions');
      } else {
        list.forEach(p => {
          console.log(`  ${p.is_long ? 'LONG' : 'SHORT'} | size=${Number(p.size)/1e6}U | collateral=${Number(p.collateral_size)/1e6}U | lev=${p.leverage}x | pnl=${p.profit_lose}%`);
        });
      }
    }

    // ── Close records ────────────────────────────────────────────────────────────
    console.log(`\n=== Close Records (challengeId=${challengeIdStr}) ===`);
    const closeResp = await get(`/client/edge_hour/close_records?account=${account}&challenge_id=${challengeIdStr}`);
    if (closeResp.code === 0) {
      const list = closeResp.data?.list || [];
      if (list.length === 0) {
        console.log('  No close records');
      } else {
        list.forEach(r => {
          console.log(`  ${r.is_long ? 'LONG' : 'SHORT'} | pnl=${r.profit_lose} | size=${Number(r.size)/1e6}U | closePrice=${r.close_price}`);
        });
      }
    }
  }

  // ── User challenge history ────────────────────────────────────────────────────────
  console.log(`\n=== User Challenge History ===`);
  const userResp = await get(`/client/edge_hour/user/challenges?account=${account}&page_index=1&page_size=5`);
  if (userResp.code === 0) {
    const list = userResp.data?.list || userResp.data || [];
    if (Array.isArray(list)) {
      list.slice(0, 5).forEach(c => {
        const STATUS = ['None', 'Active', 'Passed', 'Failed', 'Claimed'];
        console.log(`  challengeId=${c.challenge_id} | status=${STATUS[c.status]??c.status} | roi=${Number(c.roi)/100}% | tradeCount=${c.trade_count}`);
      });
    } else {
      console.log('  data:', JSON.stringify(userResp.data).slice(0, 200));
    }
  }

  // ── User statistics ────────────────────────────────────────────────────────────
  console.log('\n=== User Statistics ===');
  const overviewResp = await get(`/client/edge_hour/user/overview?account=${account}`);
  if (overviewResp.code === 0) {
    console.log(JSON.stringify(overviewResp.data, null, 2).slice(0, 500));
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
