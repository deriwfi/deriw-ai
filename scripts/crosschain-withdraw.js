#!/usr/bin/env node
/**
 * L3→L2 withdrawal (UserL3ToL2Router, runs on DERIW Chain)
 * Usage: node crosschain-withdraw.js <amount_usdt> [receiver_address]
 *   receiver_address: L2 receiver address (defaults to same as sender)
 * Environment variables: PRIVATE_KEY (required), DEV=true (devnet), DERIW_RPC_URL (override default RPC)
 *
 * Key findings (confirmed via reverse engineering real txs):
 *   - domain.name = 'Transaction' (not 'DERIW')
 *   - transactionType = 'Withdraw USDT' (not 'Withdraw')
 *   - _data = '0x' (empty, token/amount/receiver are already in message)
 *   - value = 0 (contract does not charge ETH; dev chain gasPrice=0)
 *   - EIP-712 chainId comes from router.chainid() (not network chainId)
 *   - Signature uses contract hashDomain/hashMessage/hashData to compute final hash, then sign directly
 *   - l2Token comes from USDT_L3.l1Address()
 */
const { ethers } = require('ethers');
const UserL3ToL2RouterABI = require('../assets/UserL3ToL2Router.json');
const IERC20ABI           = require('../assets/IERC20.json');

const IS_DEV = process.env.DEV === 'true';

const L3_ROUTER = IS_DEV
  ? '0x32068069f13191B57c03Eee8531a8C82b26d12B9'  // Dev
  : '0x8fb358679749FD952Ea5f090b0eA3675722B08F5';  // Production
const USDT_L3 = IS_DEV
  ? '0x12530882c64B1c22dAdf2F60639145029c5081Da'   // Dev USDT (l1Address = 0x259D16...)
  : '0x3B11A54514A708CC2261f4B69617910E172a90B3';  // Production USDT (l1Address = 0xfd086b...)
const USDT_L2 = IS_DEV
  ? '0x259D16cd04c451eed734908b3df2D3e58AC1e99f'   // Dev L2 USDT (USDT_L3.l1Address())
  : '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9';  // Production L2 USDT (Arbitrum mainnet)
const RPC_URL   = process.env.DERIW_RPC_URL || (IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com');

// Enum constants
const TRANSACTION_TYPE = 'Withdraw USDT';
const CHAIN_TARGET     = IS_DEV ? 'DeriW Devnet' : 'DeriW Chain';

async function main() {
  const [amountStr, receiverArg] = process.argv.slice(2);
  if (!amountStr) {
    console.error('Usage: node crosschain-withdraw.js <amount_usdt> [receiver_address]');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('PRIVATE_KEY is required'); process.exit(1); }

  const amount   = ethers.parseUnits(amountStr, 6);
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const router   = new ethers.Contract(L3_ROUTER, UserL3ToL2RouterABI, wallet);
  const usdt     = new ethers.Contract(USDT_L3, IERC20ABI, wallet);

  const receiver = receiverArg || wallet.address;

  // Query net amount (fee is informational only, contract does not charge ETH)
  const [netAmount] = await router.getValue(USDT_L3, amount);
  console.log(`Withdrawal amount: ${amountStr} USDT`);
  console.log(`Net received: ${ethers.formatUnits(netAmount, 6)} USDT`);

  // Check USDT approval
  const allowance = await usdt.allowance(wallet.address, L3_ROUTER);
  if (allowance < amount) {
    console.log('Approving USDT...');
    const gasOpts = IS_DEV ? { gasPrice: 0n } : {};
    await (await usdt.approve(L3_ROUTER, ethers.MaxUint256, gasOpts)).wait();
    console.log('Approval complete');
  }

  // EIP-712 domain chainId comes from contract (not network chainId)
  const domain712ChainId = await router.chainid();
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 minutes

  const domain = {
    name: 'Transaction',   // Must be 'Transaction', not 'DERIW'
    version: '1',
    chainId: Number(domain712ChainId),
    verifyingContract: L3_ROUTER,
  };

  const message = {
    transactionType: TRANSACTION_TYPE,  // 'Withdraw USDT'
    from:            wallet.address,
    token:           USDT_L3,
    l2Token:         USDT_L2,
    destination:     receiver,
    amount,
    deadline,
    chain:           CHAIN_TARGET,
  };

  // Use contract hash functions to compute final hash, then sign directly (contract does not use standard EIP-712 encoding)
  const domainHash  = await router.hashDomain(domain);
  const messageHash = await router.hashMessage(message);
  const finalHash   = await router.hashData(domainHash, messageHash);
  const sig         = wallet.signingKey.sign(finalHash);
  const signature   = ethers.Signature.from(sig).serialized;

  // _data passes empty (token/amount/receiver already in message, bridge does not accept extra calldata)
  const gasOpts = IS_DEV ? { value: 0n, gasPrice: 0n } : {};
  console.log(`Initiating withdrawal: ${amountStr} USDT (DERIW ${IS_DEV ? 'Dev' : ''} Chain → Arbitrum)`);
  const tx = await router.outboundTransfer('0x', domain, message, signature, gasOpts);
  const receipt = await tx.wait();
  console.log('Withdrawal submitted, txHash:', receipt.hash);
  console.log('Asset arrival usually takes 15-60 minutes (Arbitrum confirmation)');
}

main().catch(e => { console.error(e.message); process.exit(1); });
