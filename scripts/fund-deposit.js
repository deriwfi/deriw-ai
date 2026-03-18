#!/usr/bin/env node
/**
 * Fund pool deposit (FundRouterV2.deposit)
 * Usage: node fund-deposit.js <poolAddress> <pid> <amount_usdt>
 * pid: Period ID, get from GET https://api.deriw.com/client/foundpool/lists or query PoolDataV2.currPeriodID(pool)
 * Environment variables: PRIVATE_KEY (required), DEV=true (devnet), DERIW_RPC_URL (override default RPC)
 */
const { ethers } = require('ethers');
const FundRouterV2ABI = require('../assets/FundRouterV2.json');
const PoolDataV2ABI   = require('../assets/PoolDataV2.json');
const IERC20ABI       = require('../assets/IERC20.json');

const IS_DEV       = process.env.DEV === 'true';
const FUND_ROUTER  = IS_DEV ? '0x324D847bc335032855972DA8d2f825BF7df14dCD' : '0x3D343Fc0F6c6D2E047ec5e16e39A9b6A2031B9Ac';
const POOL_DATA_V2 = IS_DEV ? '0xf0290fAc0B56E0F9EB09abdc24C0713Ce4D96116' : '0x305507D45D5441B81F5dD8FF9f00f65e0B392e86';
const USDT         = IS_DEV ? '0x12530882c64B1c22dAdf2F60639145029c5081Da' : '0x3B11A54514A708CC2261f4B69617910E172a90B3';
const RPC_URL      = process.env.DERIW_RPC_URL || (IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com');

async function main() {
  const [poolAddress, pidStr, amountStr] = process.argv.slice(2);
  if (!poolAddress || !pidStr || !amountStr) {
    console.error('Usage: node fund-deposit.js <poolAddress> <pid> <amount_usdt>');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('PRIVATE_KEY is required'); process.exit(1); }

  const pid    = BigInt(pidStr);
  const amount = ethers.parseUnits(amountStr, 6);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const router   = new ethers.Contract(FUND_ROUTER, FundRouterV2ABI, wallet);
  const poolData = new ethers.Contract(POOL_DATA_V2, PoolDataV2ABI, provider);
  const usdt     = new ethers.Contract(USDT, IERC20ABI, wallet);

  const currPid = await poolData.currPeriodID(poolAddress);
  console.log(`Pool current period: ${currPid}, target period: ${pid}`);

  const gasOpts = IS_DEV ? { gasPrice: 0n } : {};

  const allowance = await usdt.allowance(wallet.address, FUND_ROUTER);
  if (allowance < amount) {
    console.log('Approving USDT...');
    await (await usdt.approve(FUND_ROUTER, ethers.MaxUint256, gasOpts)).wait();
  }

  console.log(`Depositing to fund pool: pool=${poolAddress}, pid=${pid}, amount=${amountStr} USDT`);
  const tx = await router.deposit(poolAddress, pid, amount, false, gasOpts);
  const receipt = await tx.wait();
  console.log('Deposit successful, txHash:', receipt.hash);
}

main().catch(e => { console.error(e.message); process.exit(1); });
