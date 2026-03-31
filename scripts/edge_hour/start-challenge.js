#!/usr/bin/env node
/**
 * Edge Hour start challenge (startChallenge)
 * Approve USDT to ChallengeManager first; ticketFee must be an exact multiple of ticketUnit
 *
 * Usage: node scripts/edge_hour/start-challenge.js <templateId> <ticketFee_usdt>
 * Example: DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/start-challenge.js 0 5
 *
 * templateId:     On-chain template ID (obtained from query-state.js)
 * ticketFee_usdt: Ticket amount (USDT, must be a multiple of 5 USDT, max 500 USDT)
 *
 * Environment variables: PRIVATE_KEY (required), DEV=true (devnet)
 */
const { ethers } = require('ethers');
const ChallengeManagerABI = require('../../assets/edge_hour/ChallengeManager.json');
const IERC20ABI = require('../../assets/IERC20.json');

const IS_DEV = process.env.DEV === 'true';

const CHALLENGE_MANAGER = IS_DEV
  ? '0x086603940a23464A60ABeBcD887524eD3b0f3150'
  : '0xBb1785B6A90819C11b8467ff85652661BE0286db';
const USDT = IS_DEV
  ? '0x12530882c64B1c22dAdf2F60639145029c5081Da'
  : '0x3B11A54514A708CC2261f4B69617910E172a90B3';
const RPC_URL = IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com';

async function main() {
  const [templateIdStr, ticketFeeStr] = process.argv.slice(2);
  if (!templateIdStr || !ticketFeeStr) {
    console.error('Usage: node start-challenge.js <templateId> <ticketFee_usdt>');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('PRIVATE_KEY is required'); process.exit(1); }

  const templateId = BigInt(templateIdStr);
  const ticketFee  = ethers.parseUnits(ticketFeeStr, 6); // USDT 6 decimals

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const cm       = new ethers.Contract(CHALLENGE_MANAGER, ChallengeManagerABI, wallet);
  const usdt     = new ethers.Contract(USDT, IERC20ABI, wallet);

  // Validate template
  const template = await cm.getChallengeTemplate(templateId);
  const p = template[0];
  const isActive = template[1];
  if (!isActive) { console.error(`Template ${templateId} is not active`); process.exit(1); }
  console.log(`Template ${templateId}: duration=${Number(p[4])}s | initialBal=${Number(p[1]) / 1e6} USDT | target=${p[2]}bps`);

  // Validate ticketFee
  const ticketUnit = await cm.ticketUnit();
  if (ticketFee % ticketUnit !== 0n) {
    console.error(`ticketFee must be an exact multiple of ticketUnit (${Number(ticketUnit) / 1e6} USDT)`);
    process.exit(1);
  }
  if (ticketFee > BigInt(p[0])) {
    console.error(`ticketFee exceeds template maximum ${Number(p[0]) / 1e6} USDT`);
    process.exit(1);
  }

  // Check for existing active challenge
  const [exists] = await cm.getActiveChallengeId(wallet.address);
  if (exists) { console.error('Active challenge already exists, wait for it to finish'); process.exit(1); }

  // Approve USDT
  const allowance = await usdt.allowance(wallet.address, CHALLENGE_MANAGER);
  if (allowance < ticketFee) {
    console.log('Approving USDT to ChallengeManager...');
    const gasOpts = IS_DEV ? { gasPrice: 0n } : {};
    await (await usdt.approve(CHALLENGE_MANAGER, ethers.MaxUint256, gasOpts)).wait();
    console.log('Approve done');
  }

  const gasOpts = IS_DEV ? { gasPrice: 0n } : {};
  console.log(`Starting challenge: templateId=${templateId}, ticketFee=${ticketFeeStr} USDT`);
  const tx = await cm.startChallenge(templateId, ticketFee, gasOpts);
  const receipt = await tx.wait();

  // Parse challengeId from event
  const iface = cm.interface;
  let challengeId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'ChallengeStarted') {
        challengeId = parsed.args.challengeId.toString();
        break;
      }
    } catch {}
  }

  console.log('Challenge started!');
  console.log('  txHash:', receipt.hash);
  console.log('  challengeId:', challengeId);
  console.log('  Estimated expiry:', new Date(Date.now() + Number(p[4]) * 1000).toISOString());
}

main().catch(e => { console.error(e.message); process.exit(1); });
