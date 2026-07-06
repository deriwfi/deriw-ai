#!/usr/bin/env node
/**
 * Room mode on-chain state reader.
 * Room has NO dedicated contracts — it reuses Phase / Slippage / MemeFactory /
 * MemeData / Vault. This script demonstrates the reusable on-chain reads behind
 * the /client/room/* endpoints for a given host + index token.
 *
 * Usage:   node scripts/room/query-state.js <hostAccount> [indexToken] [isLong]
 * Example: DEV=true node scripts/room/query-state.js 0xHostAddress 0x9F37821B7C4A5EfaA4d92aa9A6dE526237C30ceD false
 *
 * If indexToken is omitted, defaults to WBTC on the selected network.
 * Environment variables: DEV=true (devnet)
 */
const { ethers } = require('ethers');
const PhaseABI = require('../../assets/room/Phase.json');
const SlippageABI = require('../../assets/room/Slippage.json');
const MemeFactoryABI = require('../../assets/room/MemeFactory.json');
const VaultABI = require('../../assets/room/Vault.json');

const IS_DEV = process.env.DEV === 'true';
const RPC_URL = IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com';
const API_BASE = IS_DEV ? 'https://testgmxapi.weequan.cyou' : 'https://api.deriw.com';

const A = IS_DEV
  ? {
      phase: '0xaA71758134ea73Ad47ff04104b96986C5C3BBd16',
      slippage: '0x3600Cc37027146d0E9cf0E146D21390CFF474d75',
      memeFactory: '0x4C74F6e60736130247c8b53807b627FeD558cA77',
      vault: '0x75Da7523f99bA38a8cAD831EbE2F09aDF5896d89',
      usdt: '0x12530882c64B1c22dAdf2F60639145029c5081Da',
      wbtc: '0x9F37821B7C4A5EfaA4d92aa9A6dE526237C30ceD',
    }
  : {
      phase: '0x463c7e40A4eE5e4E2072055aFa14a15E88b38F5a',
      slippage: '0xAd3FAe555Ab3571a2886012DfFcc7C777eC11e7E',
      memeFactory: '0x363d1d8a71A5e1E6F6528432A59541bb2848B07e',
      vault: '0xbd36B94f0b5A6F75dABa6e11ef3c383294470653',
      usdt: '0x3B11A54514A708CC2261f4B69617910E172a90B3',
      wbtc: '0x9cAaCD673fd5C6C4b3Aa3c4E55e930ca5A4f32fe',
    };

async function tryRead(label, fn) {
  try {
    return await fn();
  } catch (e) {
    console.log(`  ${label}: (read failed) ${e.shortMessage || e.message}`);
    return null;
  }
}

async function main() {
  const [account, indexTokenArg, isLongArg] = process.argv.slice(2);
  if (!account) {
    console.error('Usage: node query-state.js <hostAccount> [indexToken] [isLong]');
    process.exit(1);
  }
  const indexToken = indexTokenArg || A.wbtc;
  const isLong = isLongArg === 'true';

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const phase = new ethers.Contract(A.phase, PhaseABI, provider);
  const slippage = new ethers.Contract(A.slippage, SlippageABI, provider);
  const factory = new ethers.Contract(A.memeFactory, MemeFactoryABI, provider);
  const vault = new ethers.Contract(A.vault, VaultABI, provider);

  console.log(`Network: ${IS_DEV ? 'DEV' : 'PROD'} | host: ${account} | indexToken: ${indexToken} | isLong: ${isLong}\n`);

  // ── Room pool address (server-authoritative via API; on-chain cross-check) ──────
  console.log('=== Room Pool ===');
  let pool = null;
  try {
    const st = await (await fetch(`${API_BASE}/client/room/pool-status?account=${account}`)).json();
    if (st.code === 0 && st.data) {
      pool = st.data.pool || null;
      console.log(`  API pool-status: status=${st.data.status} pool=${pool || '-'}`);
    }
  } catch (e) {
    console.log('  API pool-status unavailable:', e.message);
  }
  const onchainPool = await tryRead('channelOwnerPool(host)', () => factory.channelOwnerPool(account));
  if (onchainPool) console.log(`  channelOwnerPool(host): ${onchainPool}`);
  if (!pool && onchainPool && onchainPool !== ethers.ZeroAddress) pool = onchainPool;

  // ── Available liquidity (deriw pool) via Phase ─────────────────────────────────
  console.log('\n=== Phase (liquidity / OI) ===');
  const val = await tryRead('getValue', () => phase.getValue(account, indexToken, isLong));
  if (val) console.log(`  getValue(host, indexToken, isLong): [${val[0].toString()}, ${val[1].toString()}]`);
  const ls = await tryRead('getLongShortValue', () => phase.getLongShortValue(indexToken));
  if (ls) console.log(`  getLongShortValue(indexToken): long=${ls[0].toString()} short=${ls[1].toString()}`);

  // ── Max leverage via Slippage ──────────────────────────────────────────────────
  console.log('\n=== Slippage ===');
  const lev = await tryRead('getTokenMaxLeverage', () => slippage.getTokenMaxLeverage(indexToken));
  if (lev) console.log(`  getTokenMaxLeverage(indexToken): ${lev.toString()} (${Number(lev) / 10000}x)`);

  // ── Pool target token + Vault lockup (TVL) ─────────────────────────────────────
  if (pool && pool !== ethers.ZeroAddress) {
    console.log('\n=== Channel Pool (room) ===');
    const tt = await tryRead('getChannelPoolTargetToken', () => factory.getChannelPoolTargetToken(pool));
    if (tt) {
      console.log(`  poolTargetToken: ${tt[0]} | mappedPoolTargetToken: ${tt[1]}`);
      const poolAmt = await tryRead('vault.poolAmounts', () => vault.poolAmounts(tt[0], A.usdt));
      if (poolAmt !== null) console.log(`  vault.poolAmounts(poolTargetToken, USDT): ${poolAmt.toString()} (raw 1e6 = ${Number(poolAmt) / 1e6} USDT lockup)`);
    }
    console.log('  Note: pool equity (getChannelOutAmount) needs the server-tracked lp_total_supply — see /client/room/detail.');
  } else {
    console.log('\n(no active room pool for this host — pool equity / TVL reads skipped)');
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
