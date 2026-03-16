#!/usr/bin/env node
/**
 * 限价开仓（OrderBook.createIncreaseOrder）
 * 用法: node create-limit-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove>
 * triggerAbove: true=价格高于触发（空单突破开仓），false=价格低于触发（多单回调开仓）
 * 环境变量: DERIW_RPC_URL, PRIVATE_KEY（必填）
 */
const { ethers } = require('ethers');
const OrderBookABI = require('../assets/OrderBook.json');
const IERC20ABI    = require('../assets/IERC20.json');

const IS_DEV = process.env.DEV === 'true';
const ORDER_BOOK = IS_DEV ? '0x18c6d9d1f9a1d6b9b3fA6d104f9A0d8efa7C9689' : '0x86A0D906c6375846b05a0EF20931c1B4d2489C13';
const USDT       = IS_DEV ? '0x12530882c64B1c22dAdf2F60639145029c5081Da' : '0x3B11A54514A708CC2261f4B69617910E172a90B3';
const RPC_URL    = process.env.DERIW_RPC_URL || (IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com');

async function main() {
  const [indexToken, amountInStr, sizeDeltaStr, isLongStr, triggerPriceStr, triggerAboveStr] = process.argv.slice(2);

  if (!indexToken || !amountInStr || !sizeDeltaStr || !triggerPriceStr) {
    console.error('用法: node create-limit-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong> <triggerPrice_usd> <triggerAbove>');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('需要设置 PRIVATE_KEY'); process.exit(1); }

  const isLong       = isLongStr !== 'false';
  const triggerAbove = triggerAboveStr === 'true';
  const amountIn     = ethers.parseUnits(amountInStr, 6);
  const sizeDelta    = ethers.parseUnits(sizeDeltaStr, 30);
  const triggerPrice = ethers.parseUnits(triggerPriceStr, 30);
  // lever = sizeDelta(USD) / amountIn(USD) * 10000，合约单位 10000=1x
  const lever        = (sizeDelta * 10000n) / ethers.parseUnits(amountInStr, 30);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const ob       = new ethers.Contract(ORDER_BOOK, OrderBookABI, wallet);
  const usdt     = new ethers.Contract(USDT, IERC20ABI, wallet);

  const allowance = await usdt.allowance(wallet.address, ORDER_BOOK);
  if (allowance < amountIn) {
    console.log('授权 USDT...');
    await (await usdt.approve(ORDER_BOOK, ethers.MaxUint256)).wait();
  }

  console.log(`创建限价${isLong ? '多' : '空'}单: amountIn=${amountInStr} USDT, triggerPrice=${triggerPriceStr} USD, triggerAbove=${triggerAbove}`);
  const tx = await ob.createIncreaseOrder(
    [USDT],        // path
    amountIn,
    indexToken,
    sizeDelta,
    USDT,          // collateralToken
    isLong,
    triggerPrice,
    triggerAbove,
    lever
  );
  const receipt = await tx.wait();
  console.log('限价开仓单已创建，txHash:', receipt.hash);
}

main().catch(e => { console.error(e.message); process.exit(1); });
