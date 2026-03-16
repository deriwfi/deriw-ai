#!/usr/bin/env node
/**
 * 市价开仓（PositionRouter.createIncreasePosition）
 * 用法: node create-market-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong> [referralCode]
 * 示例: node create-market-open.js 0x9cAaCD673fd5C6C4b3Aa3c4E55e930ca5A4f32fe 100 5000 true
 *
 * 环境变量: DERIW_RPC_URL, PRIVATE_KEY（必填）
 * amountIn_usdt: USDT 数量（普通单位，如 100 = 100 USDT）
 * sizeDelta_usd: 仓位大小（USD，如 5000 = 5000 USD）
 */
const { ethers } = require('ethers');
const PositionRouterABI  = require('../assets/PositionRouter.json');
const VaultPriceFeedABI  = require('../assets/VaultPriceFeed.json');
const IERC20ABI          = require('../assets/IERC20.json');

const IS_DEV = process.env.DEV === 'true';
const POSITION_ROUTER  = IS_DEV ? '0x12f0C0fb9548EeB2DAa379d10C7CdCB63f6848F9' : '0x80257F37d327FA0EF464eFa64DdFb755dE111262';
const ROUTER           = IS_DEV ? '0x23D9D11717a5CC9A90A7982445452e225060B511' : '0x1eB6Dfc3316012C5795E1060f8BD1CEa10df30F5';
const USDT             = IS_DEV ? '0x12530882c64B1c22dAdf2F60639145029c5081Da' : '0x3B11A54514A708CC2261f4B69617910E172a90B3';
const VAULT_PRICE_FEED = IS_DEV ? '0x843a577B32F280518E8dF305D8AD469111279135' : '0xEC7046731d5ef62Ce62C0291b7dF891E62aECC7E';
const RPC_URL          = process.env.DERIW_RPC_URL || (IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com');

async function main() {
  const [
    indexToken, amountInStr, sizeDeltaStr, isLongStr,
    referralCode = '0x0000000000000000000000000000000000000000000000000000000000000000',
  ] = process.argv.slice(2);

  if (!indexToken || !amountInStr || !sizeDeltaStr) {
    console.error('用法: node create-market-open.js <indexToken> <amountIn_usdt> <sizeDelta_usd> <isLong=true>');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('需要设置 PRIVATE_KEY'); process.exit(1); }

  const isLong    = isLongStr !== 'false';
  const amountIn  = ethers.parseUnits(amountInStr, 6);   // USDT 6位精度
  const sizeDelta = ethers.parseUnits(sizeDeltaStr, 30); // USD 30位精度

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const router   = new ethers.Contract(POSITION_ROUTER, PositionRouterABI, wallet);
  const usdt     = new ethers.Contract(USDT, IERC20ABI, wallet);

  // 授权给内部 Router（实际执行 transferFrom 的合约）
  const allowance = await usdt.allowance(wallet.address, ROUTER);
  if (allowance < amountIn) {
    console.log('授权 USDT 给 Router...');
    await (await usdt.approve(ROUTER, ethers.MaxUint256)).wait();
    console.log('授权完成');
  }

  // 从 VaultPriceFeed 读取当前价格，并加减 1% 滑点作为 acceptablePrice
  const priceFeed    = new ethers.Contract(VAULT_PRICE_FEED, VaultPriceFeedABI, provider);
  const currentPrice = await priceFeed.getPrice(indexToken, isLong, true, true);
  const slippage     = currentPrice / 100n; // 1%
  const acceptablePrice = isLong
    ? currentPrice + slippage   // 多单：最高接受价格 = 当前价 + 1%
    : currentPrice - slippage;  // 空单：最低接受价格 = 当前价 - 1%
  console.log(`当前价格: ${ethers.formatUnits(currentPrice, 30)} USD，acceptablePrice: ${ethers.formatUnits(acceptablePrice, 30)} USD`);

  console.log(`创建市价${isLong ? '多' : '空'}单: amountIn=${amountInStr} USDT, sizeDelta=${sizeDeltaStr} USD`);
  const tx = await router.createIncreasePosition(
    [USDT],          // path
    indexToken,
    amountIn,
    sizeDelta,
    isLong,
    acceptablePrice,
    referralCode,
    ethers.ZeroAddress // callbackTarget
  );
  const receipt = await tx.wait();
  console.log('开仓请求已提交，txHash:', receipt.hash);
  console.log('注意：请求需由执行者在链上执行后才生效（通常几秒内）');
}

main().catch(e => { console.error(e.message); process.exit(1); });
