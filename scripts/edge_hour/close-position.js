#!/usr/bin/env node
/**
 * Edge Hour close position (closePosition)
 * Fully closes the indexToken position in the specified challenge
 *
 * Usage: node scripts/edge_hour/close-position.js <challengeId> <indexToken> <isLong>
 * Example: DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/close-position.js 35328 0x9F37821B7C4A5EfaA4d92aa9A6dE526237C30ceD true
 *
 * Environment variables: PRIVATE_KEY (required), DEV=true (devnet)
 */
const { ethers } = require('ethers');
const ChallengeManagerABI = require('../../assets/edge_hour/ChallengeManager.json');
const PriceOracleABI = require('../../assets/edge_hour/PriceOracle.json');

const IS_DEV = process.env.DEV === 'true';

const CHALLENGE_MANAGER = IS_DEV
  ? '0x086603940a23464A60ABeBcD887524eD3b0f3150'
  : '0xBb1785B6A90819C11b8467ff85652661BE0286db';
const PRICE_ORACLE = IS_DEV
  ? '0x6dc3EAcAA36adA3f32Fefe3522361E1Fb6D23EcC'
  : '0x493De553C9948f463f31249833D4d02D6DF9d0cB';
const RPC_URL = IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com';

async function main() {
  const [challengeIdStr, indexToken, isLongStr] = process.argv.slice(2);
  if (!challengeIdStr || !indexToken) {
    console.error('Usage: node close-position.js <challengeId> <indexToken> <isLong=true>');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('PRIVATE_KEY is required'); process.exit(1); }

  const challengeId = BigInt(challengeIdStr);
  const isLong      = isLongStr !== 'false';

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const cm       = new ethers.Contract(CHALLENGE_MANAGER, ChallengeManagerABI, wallet);
  const oracle   = new ethers.Contract(PRICE_ORACLE, PriceOracleABI, provider);

  // Query current price
  const price = await oracle.getPrice(indexToken);
  console.log(`Current price: ${ethers.formatEther(price)} USD`);

  // Query position (get positionKey first)
  const posKey = await cm.getPositionKey(challengeId, indexToken, isLong);
  const pos    = await cm.getPosition(challengeId, posKey);
  if (pos.size === 0n) {
    console.error('Position is empty, nothing to close');
    process.exit(1);
  }
  console.log(`Current position: size=${(Number(pos.size) / 1e6).toFixed(2)} USDT, avgPrice=${ethers.formatEther(pos.averagePrice)} USD`);

  const gasOpts = IS_DEV ? { gasPrice: 0n } : {};
  console.log(`Closing position: challengeId=${challengeId}, ${isLong ? 'LONG' : 'SHORT'}, token=${indexToken}`);
  const tx = await cm.closePosition({ challengeId, indexToken, isLong }, gasOpts);
  const receipt = await tx.wait();

  // Parse PositionClosed event
  const iface = cm.interface;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'PositionClosed') {
        const a = parsed.args;
        console.log('Position closed!');
        console.log('  txHash:', receipt.hash);
        console.log('  price:', ethers.formatEther(a.price), 'USD');
        console.log('  realizedPnl:', (Number(a.realizedPnl) / 1e6).toFixed(4), 'USDT');
        console.log('  cappedProfit:', (Number(a.cappedProfit) / 1e6).toFixed(4), 'USDT');
        console.log('  cappedEquity:', (Number(a.cappedEquity) / 1e6).toFixed(4), 'USDT');
        console.log('  fee:', (Number(a.fee) / 1e6).toFixed(4), 'USDT');
        return;
      }
    } catch {}
  }
  console.log('txHash:', receipt.hash, '(PositionClosed event not found)');
}

main().catch(e => { console.error(e.message); process.exit(1); });
