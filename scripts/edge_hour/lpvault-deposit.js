#!/usr/bin/env node
/**
 * Edge Hour LPVault deposit
 * LPs deposit USDT to receive LP shares and earn challenge fee income
 *
 * Usage: node scripts/edge_hour/lpvault-deposit.js <amount_usdt>
 * Example: DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/lpvault-deposit.js 100
 *
 * Environment variables: PRIVATE_KEY (required), DEV=true (devnet)
 */
const { ethers } = require('ethers');
const LPVaultABI = require('../../assets/edge_hour/LPVault.json');
const IERC20ABI  = require('../../assets/IERC20.json');

const IS_DEV = process.env.DEV === 'true';

const LP_VAULT = IS_DEV
  ? '0x2eB88D51C30708f8539c949855F39861e7f3adB5'
  : '0x29F463c832C03076ab2cB9734fD6C0e3B135B00b';
const USDT = IS_DEV
  ? '0x12530882c64B1c22dAdf2F60639145029c5081Da'
  : '0x3B11A54514A708CC2261f4B69617910E172a90B3';
const RPC_URL = IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com';

async function main() {
  const [amountStr] = process.argv.slice(2);
  if (!amountStr) { console.error('Usage: node lpvault-deposit.js <amount_usdt>'); process.exit(1); }
  if (!process.env.PRIVATE_KEY) { console.error('PRIVATE_KEY is required'); process.exit(1); }

  const amount = ethers.parseUnits(amountStr, 6); // USDT 1e6

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const vault    = new ethers.Contract(LP_VAULT, LPVaultABI, wallet);
  const usdt     = new ethers.Contract(USDT, IERC20ABI, wallet);

  // Pre-deposit state
  const [totalBefore, lpBefore, sharePrice] = await Promise.all([
    vault.totalAssets(),
    vault.balanceOf(wallet.address),
    vault.sharePrice(),
  ]);
  console.log(`Before deposit: totalAssets=${(Number(totalBefore) / 1e6).toFixed(2)} USDT, myLP=${ethers.formatEther(lpBefore)}, sharePrice=${ethers.formatEther(sharePrice)}`);

  // Approve
  const gasOpts = IS_DEV ? { gasPrice: 0n } : {};
  const allowance = await usdt.allowance(wallet.address, LP_VAULT);
  if (allowance < amount) {
    console.log('Approving USDT to LPVault...');
    await (await usdt.approve(LP_VAULT, ethers.MaxUint256, gasOpts)).wait();
  }

  console.log(`Depositing ${amountStr} USDT to LPVault...`);
  const tx = await vault.deposit(amount, gasOpts);
  const receipt = await tx.wait();

  // Post-deposit state
  const [totalAfter, lpAfter] = await Promise.all([
    vault.totalAssets(),
    vault.balanceOf(wallet.address),
  ]);
  const lpGained = lpAfter - lpBefore;
  console.log('Deposit successful!');
  console.log('  txHash:', receipt.hash);
  console.log(`  totalAssets: ${(Number(totalAfter) / 1e6).toFixed(2)} USDT`);
  console.log(`  LP shares gained: +${ethers.formatEther(lpGained)}`);
  console.log(`  My total LP: ${ethers.formatEther(lpAfter)}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
