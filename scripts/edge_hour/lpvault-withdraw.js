#!/usr/bin/env node
/**
 * Edge Hour LPVault withdraw
 * Redeem USDT; the contract burns the corresponding LP shares
 *
 * Usage: node scripts/edge_hour/lpvault-withdraw.js <amount_usdt>
 * Example: DEV=true PRIVATE_KEY=0x... node scripts/edge_hour/lpvault-withdraw.js 50
 *
 * amount_usdt: USDT amount to withdraw (use "all" to withdraw the maximum available)
 *
 * Environment variables: PRIVATE_KEY (required), DEV=true (devnet)
 */
const { ethers } = require('ethers');
const LPVaultABI = require('../../assets/edge_hour/LPVault.json');

const IS_DEV = process.env.DEV === 'true';

const LP_VAULT = IS_DEV
  ? '0x2eB88D51C30708f8539c949855F39861e7f3adB5'
  : '0x29F463c832C03076ab2cB9734fD6C0e3B135B00b';
const RPC_URL = IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com';

async function main() {
  const [amountStr] = process.argv.slice(2);
  if (!amountStr) { console.error('Usage: node lpvault-withdraw.js <amount_usdt | all>'); process.exit(1); }
  if (!process.env.PRIVATE_KEY) { console.error('PRIVATE_KEY is required'); process.exit(1); }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const vault    = new ethers.Contract(LP_VAULT, LPVaultABI, wallet);

  // Query maximum withdrawable amount
  const maxWithdraw = await vault.maxWithdraw(wallet.address);
  console.log(`Max withdrawable: ${(Number(maxWithdraw) / 1e6).toFixed(2)} USDT`);

  let amount;
  if (amountStr === 'all') {
    amount = maxWithdraw;
  } else {
    amount = ethers.parseUnits(amountStr, 6);
    if (amount > maxWithdraw) {
      console.error(`Withdraw amount ${amountStr} USDT exceeds max withdrawable ${(Number(maxWithdraw) / 1e6).toFixed(2)} USDT`);
      process.exit(1);
    }
  }

  if (amount === 0n) { console.error('Withdrawable amount is 0'); process.exit(1); }

  const gasOpts = IS_DEV ? { gasPrice: 0n } : {};
  console.log(`Withdrawing ${(Number(amount) / 1e6).toFixed(2)} USDT...`);
  const tx = await vault.withdraw(amount, gasOpts);
  const receipt = await tx.wait();

  const lpAfter    = await vault.balanceOf(wallet.address);
  console.log('Withdrawal successful!');
  console.log('  txHash:', receipt.hash);
  console.log(`  Remaining LP shares: ${ethers.formatEther(lpAfter)}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
