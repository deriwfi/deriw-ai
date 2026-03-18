#!/usr/bin/env node
/**
 * Market close (PositionRouter.createDecreasePosition)
 * Usage: node create-market-close.js <indexToken> <sizeDelta_usd> <isLong> [collateralDelta_usd]
 * sizeDelta_usd: Position size to reduce (USD), pass current size to fully close
 * collateralDelta_usd: Collateral to separately withdraw (USD), 0 means no separate withdrawal
 * Environment variables: DERIW_RPC_URL, PRIVATE_KEY (required)
 */
const { ethers } = require('ethers');
const PositionRouterABI = require('../assets/PositionRouter.json');

const IS_DEV = process.env.DEV === 'true';
const POSITION_ROUTER = IS_DEV ? '0x12f0C0fb9548EeB2DAa379d10C7CdCB63f6848F9' : '0x80257F37d327FA0EF464eFa64DdFb755dE111262';
const USDT            = IS_DEV ? '0x12530882c64B1c22dAdf2F60639145029c5081Da' : '0x3B11A54514A708CC2261f4B69617910E172a90B3';
const RPC_URL         = process.env.DERIW_RPC_URL || (IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com');

async function main() {
  const [indexToken, sizeDeltaStr, isLongStr, collateralDeltaStr = '0'] = process.argv.slice(2);

  if (!indexToken || !sizeDeltaStr) {
    console.error('Usage: node create-market-close.js <indexToken> <sizeDelta_usd> <isLong=true> [collateralDelta_usd=0]');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('PRIVATE_KEY is required'); process.exit(1); }

  const isLong          = isLongStr !== 'false';
  const sizeDelta       = ethers.parseUnits(sizeDeltaStr, 30);
  const collateralDelta = ethers.parseUnits(collateralDeltaStr, 30);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const router   = new ethers.Contract(POSITION_ROUTER, PositionRouterABI, wallet);

  // Long close uses 0 (accept any low price), short close uses MaxUint256 (accept any high price)
  const acceptablePrice = isLong ? 0n : ethers.MaxUint256;

  console.log(`Creating market ${isLong ? 'long' : 'short'} close: sizeDelta=${sizeDeltaStr} USD`);
  const tx = await router.createDecreasePosition(
    [USDT],          // path
    indexToken,
    collateralDelta,
    sizeDelta,
    isLong,
    wallet.address,  // receiver
    acceptablePrice,
    ethers.ZeroAddress // callbackTarget
  );
  const receipt = await tx.wait();
  console.log('Close position request submitted, txHash:', receipt.hash);
}

main().catch(e => { console.error(e.message); process.exit(1); });
