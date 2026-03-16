#!/usr/bin/env node
/**
 * 查询 DERIW 用户仓位
 * 用法: node query-position.js <account> <indexToken> <isLong>
 * 示例: node query-position.js 0xYourAddress 0x9cAaCD673fd5C6C4b3Aa3c4E55e930ca5A4f32fe true
 * 环境变量: DEV=true（开发网）, DERIW_RPC_URL（覆盖默认 RPC）
 *
 * collateralToken 固定为 USDT
 */
const { ethers } = require('ethers');
const VaultABI = require('../assets/Vault.json');

const IS_DEV  = process.env.DEV === 'true';
const VAULT   = IS_DEV ? '0x75Da7523f99bA38a8cAD831EbE2F09aDF5896d89' : '0xbd36B94f0b5A6F75dABa6e11ef3c383294470653';
const USDT    = IS_DEV ? '0x12530882c64B1c22dAdf2F60639145029c5081Da' : '0x3B11A54514A708CC2261f4B69617910E172a90B3';
const RPC_URL = process.env.DERIW_RPC_URL || (IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com');

async function main() {
  const [account, indexToken, isLongStr] = process.argv.slice(2);
  if (!account || !indexToken) {
    console.error('用法: node query-position.js <account> <indexToken> <isLong=true>');
    process.exit(1);
  }
  const isLong = isLongStr !== 'false';

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const vault    = new ethers.Contract(VAULT, VaultABI, provider);

  console.log(`查询仓位: account=${account}, indexToken=${indexToken}, isLong=${isLong}`);
  const pos = await vault.getPosition(account, USDT, indexToken, isLong);

  // 返回：[size, collateral, averagePrice, entryFundingRate, reserveAmount, realisedPnl, hasRealisedProfit(bool), lastIncreasedTime]
  const [size, collateral, averagePrice, , , , , lastIncreasedTime] = pos;

  console.log('仓位数据:');
  console.log('  size          (USD):', ethers.formatUnits(size, 30));
  console.log('  collateral    (USD):', ethers.formatUnits(collateral, 30));
  console.log('  averagePrice  (USD):', ethers.formatUnits(averagePrice, 30));
  console.log('  lastIncreasedTime  :', new Date(Number(lastIncreasedTime) * 1000).toISOString());

  if (size === 0n) console.log('  → 仓位为空');
}

main().catch(e => { console.error(e.message); process.exit(1); });
