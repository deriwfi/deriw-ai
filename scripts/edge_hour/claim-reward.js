#!/usr/bin/env node
/**
 * Edge Hour claim reward (claimReward)
 * Call after challenge status is Passed; USDT reward is sent directly to the wallet
 *
 * Usage: node scripts/edge_hour/claim-reward.js <challengeId>
 * Example: DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/claim-reward.js 35328
 *
 * Environment variables: PRIVATE_KEY (required), DEV=true (devnet)
 */
const { ethers } = require('ethers');
const ChallengeManagerABI = require('../../assets/edge_hour/ChallengeManager.json');

const IS_DEV = process.env.DEV === 'true';

const CHALLENGE_MANAGER = IS_DEV
  ? '0x086603940a23464A60ABeBcD887524eD3b0f3150'
  : '0xBb1785B6A90819C11b8467ff85652661BE0286db';
const RPC_URL = IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com';

const STATUS = ['None', 'Active', 'Passed', 'Failed', 'Claimed'];

async function main() {
  const [challengeIdStr] = process.argv.slice(2);
  if (!challengeIdStr) {
    console.error('Usage: node claim-reward.js <challengeId>');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('PRIVATE_KEY is required'); process.exit(1); }

  const challengeId = BigInt(challengeIdStr);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const cm       = new ethers.Contract(CHALLENGE_MANAGER, ChallengeManagerABI, wallet);

  // Query challenge state
  const state = await cm.getChallengeState(challengeId);
  console.log(`challengeId ${challengeId} status: ${STATUS[state.status] ?? state.status}`);
  console.log(`ticketFee: ${(Number(state.ticketFee) / 1e6).toFixed(2)} USDT`);
  console.log(`cappedEquity: ${(Number(state.cappedEquity) / 1e6).toFixed(2)} USDT`);

  if (state.status !== 2n) { // 2 = Passed
    console.error(`Status is not Passed, cannot claim reward (current: ${STATUS[state.status] ?? state.status})`);
    process.exit(1);
  }

  // Estimated reward (ticketFee * prizeMultiplierBps / 10000)
  const addRewardNum = await cm.addRewardNumber(challengeId);
  console.log(`addRewardNumber: ${addRewardNum}`);

  const gasOpts = IS_DEV ? { gasPrice: 0n } : {};
  console.log('Claiming reward...');
  const tx = await cm.claimReward(challengeId, gasOpts);
  const receipt = await tx.wait();

  // Parse RewardClaimed event
  const iface = cm.interface;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'RewardClaimed') {
        const a = parsed.args;
        console.log('Reward claimed!');
        console.log('  txHash:', receipt.hash);
        console.log('  amount:', (Number(a.amount) / 1e6).toFixed(2), 'USDT');
        return;
      }
    } catch {}
  }
  console.log('txHash:', receipt.hash, '(RewardClaimed event not found)');
}

main().catch(e => { console.error(e.message); process.exit(1); });
