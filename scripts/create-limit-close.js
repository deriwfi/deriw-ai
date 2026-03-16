#!/usr/bin/env node
/**
 * 限价平仓（OrderBook.createDecreaseOrder）
 * 用法: node create-limit-close.js <indexToken> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove> [collateralDelta_usd]
 * triggerAbove: true=价格涨破触发（止盈多单/止损空单），false=价格跌破触发（止损多单/止盈空单）
 * 环境变量: DERIW_RPC_URL, PRIVATE_KEY（必填）
 */
const { ethers } = require('ethers');
const OrderBookABI = require('../assets/OrderBook.json');

const IS_DEV = process.env.DEV === 'true';
const ORDER_BOOK = IS_DEV ? '0x18c6d9d1f9a1d6b9b3fA6d104f9A0d8efa7C9689' : '0x86A0D906c6375846b05a0EF20931c1B4d2489C13';
const USDT       = IS_DEV ? '0x12530882c64B1c22dAdf2F60639145029c5081Da' : '0x3B11A54514A708CC2261f4B69617910E172a90B3';
const RPC_URL    = process.env.DERIW_RPC_URL || (IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com');

async function main() {
  const [indexToken, sizeDeltaStr, isLongStr, triggerPriceStr, triggerAboveStr, collateralDeltaStr = '0'] = process.argv.slice(2);

  if (!indexToken || !sizeDeltaStr || !triggerPriceStr) {
    console.error('用法: node create-limit-close.js <indexToken> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove>');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('需要设置 PRIVATE_KEY'); process.exit(1); }

  const isLong          = isLongStr !== 'false';
  const triggerAbove    = triggerAboveStr === 'true';
  const sizeDelta       = ethers.parseUnits(sizeDeltaStr, 30);
  const triggerPrice    = ethers.parseUnits(triggerPriceStr, 30);
  const collateralDelta = ethers.parseUnits(collateralDeltaStr, 30);
  const lever           = 10000n; // 平仓时传固定值

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const ob       = new ethers.Contract(ORDER_BOOK, OrderBookABI, wallet);

  console.log(`创建限价平${isLong ? '多' : '空'}单: sizeDelta=${sizeDeltaStr} USD, triggerPrice=${triggerPriceStr} USD, triggerAbove=${triggerAbove}`);
  const tx = await ob.createDecreaseOrder(
    indexToken,
    sizeDelta,
    USDT,          // collateralToken
    collateralDelta,
    isLong,
    triggerPrice,
    triggerAbove,
    lever
  );
  const receipt = await tx.wait();
  console.log('限价平仓单已创建，txHash:', receipt.hash);
}

main().catch(e => { console.error(e.message); process.exit(1); });
