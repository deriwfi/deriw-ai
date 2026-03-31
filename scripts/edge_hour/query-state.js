#!/usr/bin/env node
/**
 * Edge Hour state query
 * Queries template list, LPVault statistics, and user's current challenge state
 *
 * Usage: node scripts/edge_hour/query-state.js [account]
 * Example: DEV=true node scripts/edge_hour/query-state.js 0xYourAddress
 *
 * Environment variables: DEV=true (devnet)
 */
const { ethers } = require('ethers');
const ChallengeManagerABI = require('../../assets/edge_hour/ChallengeManager.json');
const LPVaultABI = require('../../assets/edge_hour/LPVault.json');
const PriceOracleABI = require('../../assets/edge_hour/PriceOracle.json');
const IERC20ABI = require('../../assets/IERC20.json');

const IS_DEV = process.env.DEV === 'true';

const CHALLENGE_MANAGER = IS_DEV
  ? '0x086603940a23464A60ABeBcD887524eD3b0f3150'
  : '0xBb1785B6A90819C11b8467ff85652661BE0286db';
const LP_VAULT = IS_DEV
  ? '0x2eB88D51C30708f8539c949855F39861e7f3adB5'
  : '0x29F463c832C03076ab2cB9734fD6C0e3B135B00b';
const PRICE_ORACLE = IS_DEV
  ? '0x6dc3EAcAA36adA3f32Fefe3522361E1Fb6D23EcC'
  : '0x493De553C9948f463f31249833D4d02D6DF9d0cB';
const USDT = IS_DEV
  ? '0x12530882c64B1c22dAdf2F60639145029c5081Da'
  : '0x3B11A54514A708CC2261f4B69617910E172a90B3';
const RPC_URL = IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com';
const API_BASE = IS_DEV ? 'https://testgmxapi.weequan.cyou' : 'https://api.deriw.com';

const CHALLENGE_STATUS = ['None', 'Active', 'Passed', 'Failed', 'Claimed'];

async function main() {
  const account = process.argv[2];
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const cm = new ethers.Contract(CHALLENGE_MANAGER, ChallengeManagerABI, provider);
  const vault = new ethers.Contract(LP_VAULT, LPVaultABI, provider);
  const usdt = new ethers.Contract(USDT, IERC20ABI, provider);

  // ── Template list ──────────────────────────────────────────────────────────────
  console.log('=== Challenge Template List ===');
  const templateLen = await cm.getChallengeTemplateLength();
  for (let i = 0; i < Number(templateLen); i++) {
    const t = await cm.getChallengeTemplate(i);
    // t is a tuple array: [params(tuple), isActive]
    const p = t[0];
    const isActive = t[1];
    if (!isActive) continue;
    console.log(`  [${i}] templateId=${i} | duration=${Number(p[4])}s | maxTicket=${Number(p[0]) / 1e6} USDT | initialBal=${Number(p[1]) / 1e6} USDT | targetBps=${p[2]} | maxLossBps=${p[3]} | isActive=${isActive}`);
  }

  // ── LPVault statistics ──────────────────────────────────────────────────────────
  console.log('\n=== LPVault Statistics ===');
  const [totalAssets, sharePrice, stats, paused] = await Promise.all([
    vault.totalAssets(),
    vault.sharePrice(),
    vault.getStatistics(),
    vault.paused(),
  ]);
  console.log(`  totalAssets:    ${(Number(totalAssets) / 1e6).toFixed(2)} USDT`);
  console.log(`  sharePrice:     ${ethers.formatEther(sharePrice)}`);
  console.log(`  totalFees:      ${(Number(stats.totalFees) / 1e6).toFixed(2)} USDT`);
  console.log(`  totalRewards:   ${(Number(stats.totalRewards) / 1e6).toFixed(2)} USDT`);
  console.log(`  netProfit:      ${(Number(stats.netProfit) / 1e6).toFixed(2)} USDT`);
  console.log(`  paused:         ${paused}`);

  // ── Contract basic info ──────────────────────────────────────────────────────────
  const [nextId, ticketUnit, minPos] = await Promise.all([
    cm.nextChallengeId(),
    cm.ticketUnit(),
    cm.minPositionValueUsd(),
  ]);
  console.log('\n=== ChallengeManager ===');
  console.log(`  nextChallengeId:  ${nextId}`);
  console.log(`  ticketUnit:       ${Number(ticketUnit) / 1e6} USDT`);
  console.log(`  minPositionValue: ${Number(minPos) / 1e6} USDT`);

  // ── User info ──────────────────────────────────────────────────────────────
  if (!account) return;
  console.log(`\n=== User ${account} ===`);
  const usdtBal = await usdt.balanceOf(account);
  const lpBal = await vault.balanceOf(account);
  console.log(`  USDT balance:   ${(Number(usdtBal) / 1e6).toFixed(2)} USDT`);
  console.log(`  LP shares:      ${ethers.formatEther(lpBal)}`);

  const [exists, activeChallengeId] = await cm.getActiveChallengeId(account);
  console.log(`  Has active challenge: ${exists}`);
  if (exists) {
    const s = await cm.getChallengeState(activeChallengeId);
    console.log(`  challengeId:    ${activeChallengeId}`);
    console.log(`  status:         ${CHALLENGE_STATUS[s.status] ?? s.status}`);
    console.log(`  currentBalance: ${(Number(s.currentBalance) / 1e6).toFixed(2)} USDT`);
    console.log(`  cappedEquity:   ${(Number(s.cappedEquity) / 1e6).toFixed(2)} USDT`);
    console.log(`  ticketFee:      ${(Number(s.ticketFee) / 1e6).toFixed(2)} USDT`);
    console.log(`  tradeCount:     ${s.tradeCount}`);
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = Number(s.expiryTime);
    const remaining = expiryTime - now;
    console.log(`  expiryTime:     ${new Date(expiryTime * 1000).toISOString()} (${remaining}s remaining)`);
  }

  // ── API query ──────────────────────────────────────────────────────────────
  console.log('\n=== Server API Challenge Info ===');
  try {
    const resp = await fetch(`${API_BASE}/client/edge_hour/challenge/info?account=${account}`);
    const json = await resp.json();
    if (json.code === 0) {
      const d = json.data;
      console.log(`  has_active_challenge: ${d.has_active_challenge}`);
      console.log(`  need_settlement:      ${d.need_settlement}`);
      if (d.challenge) {
        console.log(`  challengeId:          ${d.challenge.challenge_id}`);
        console.log(`  roi:                  ${d.challenge.roi}`);
        console.log(`  tradeCount:           ${d.challenge.trade_count}`);
      }
    } else {
      console.log('  API error:', json.msg);
    }
  } catch (e) {
    console.log('  fetch error:', e.message);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
