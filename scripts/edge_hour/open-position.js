#!/usr/bin/env node
/**
 * Edge Hour open position (increasePosition)
 * Trades using virtual balance; no real token transfer required; contract validates max leverage and min position value
 *
 * Usage: node scripts/edge_hour/open-position.js <challengeId> <indexToken> <sizeDelta_usdt> <collateral_usdt> <isLong>
 * Example: DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/open-position.js 35328 0x9F37821B7C4A5EfaA4d92aa9A6dE526237C30ceD 1000 100 true
 *
 * challengeId:     Challenge ID (obtained from start-challenge.js)
 * indexToken:      Token address to trade (WBTC/ETH/SOL/XRP/LTC)
 * sizeDelta_usdt:  Position size (USDT, 1e6 precision, e.g. 1000 = 1000 USDT)
 * collateral_usdt: Collateral (USDT, must be <= sizeDelta/maxLeverage)
 * isLong:          true=long, false=short
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
  const [challengeIdStr, indexToken, sizeDeltaStr, collateralStr, isLongStr] = process.argv.slice(2);
  if (!challengeIdStr || !indexToken || !sizeDeltaStr || !collateralStr) {
    console.error('Usage: node open-position.js <challengeId> <indexToken> <sizeDelta_usdt> <collateral_usdt> <isLong=true>');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('PRIVATE_KEY is required'); process.exit(1); }

  const challengeId    = BigInt(challengeIdStr);
  const sizeDelta      = ethers.parseUnits(sizeDeltaStr, 6);   // 1e6
  const collateralDelta = ethers.parseUnits(collateralStr, 6); // 1e6
  const isLong         = isLongStr !== 'false';

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const cm       = new ethers.Contract(CHALLENGE_MANAGER, ChallengeManagerABI, wallet);
  const oracle   = new ethers.Contract(PRICE_ORACLE, PriceOracleABI, provider);

  // Query current price (1e18 precision)
  const price = await oracle.getPrice(indexToken);
  console.log(`Current price: ${ethers.formatEther(price)} USD`);

  // Query challenge state
  const state = await cm.getChallengeState(challengeId);
  console.log(`Challenge status: ${['None','Active','Passed','Failed','Claimed'][state.status] ?? state.status}`);
  console.log(`Current balance: ${(Number(state.currentBalance) / 1e6).toFixed(2)} USDT`);

  // Query max leverage
  const maxLev = await cm.challengeMaxLeverage(challengeId, indexToken);
  const actualLev = (Number(sizeDelta) / Number(collateralDelta)).toFixed(1);
  console.log(`Max leverage: ${maxLev}x, Actual leverage: ${actualLev}x`);

  const gasOpts = IS_DEV ? { gasPrice: 0n } : {};
  console.log(`Opening position: challengeId=${challengeId}, ${isLong ? 'LONG' : 'SHORT'}, size=${sizeDeltaStr} USDT, collateral=${collateralStr} USDT`);
  const tx = await cm.increasePosition(
    {
      challengeId,
      indexToken,
      sizeDelta,
      collateralDelta,
      isLong,
    },
    gasOpts
  );
  const receipt = await tx.wait();

  // Parse PositionIncreased event
  const iface = cm.interface;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'PositionIncreased') {
        const a = parsed.args;
        console.log('Position opened!');
        console.log('  txHash:', receipt.hash);
        console.log('  positionKey:', a.positionKey);
        console.log('  price:', ethers.formatEther(a.price), 'USD');
        console.log('  newSize:', (Number(a.newSize) / 1e6).toFixed(2), 'USDT');
        console.log('  newAveragePrice:', ethers.formatEther(a.newAveragePrice), 'USD');
        console.log('  fee:', (Number(a.fee) / 1e6).toFixed(4), 'USDT');
        return;
      }
    } catch {}
  }
  console.log('txHash:', receipt.hash, '(PositionIncreased event not found)');
}

main().catch(e => { console.error(e.message); process.exit(1); });
