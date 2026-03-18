#!/usr/bin/env node
/**
 * L2→L3 cross-chain deposit (UserL2ToL3Router, must run on Arbitrum network)
 * Usage: node crosschain-deposit.js <amount_usdt>
 * Environment variables: PRIVATE_KEY (required), DEV=true (devnet), DERIW_RPC_URL (override default RPC)
 *
 * Key findings (reverse-engineered from frontend source code):
 *   Dev environment:
 *     - _maxGas = 600000, _gasPriceBid = 300000000 (0.3 gwei)
 *     - _data = hardcoded (contains extra word, non-standard encode([uint256,bytes]))
 *     - value = 0 (dev chain does not charge ETH bridge fee)
 *   Production environment:
 *     - maxSubmissionCost calculated from Arbitrum Inbox.calculateRetryableSubmissionFee
 *     - value = maxSubmissionCost + _maxGas * _gasPriceBid
 */
const { ethers } = require('ethers');
const UserL2ToL3RouterABI = require('../assets/UserL2ToL3Router.json');
const IERC20ABI           = require('../assets/IERC20.json');

const IS_DEV = process.env.DEV === 'true';

const L2_ROUTER = IS_DEV
  ? '0x81A88de21De37A025660D746164A9AB013822263'   // Dev (Arbitrum Sepolia)
  : '0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325';  // Production (Arbitrum mainnet)
const USDT_L2 = IS_DEV
  ? '0x259D16cd04c451eed734908b3df2D3e58AC1e99f'   // Dev USDT (Arbitrum Sepolia)
  : '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9';  // Production USDT (Arbitrum mainnet)
const ARB_RPC   = process.env.DERIW_RPC_URL || (IS_DEV ? 'https://rpc-arbitrum-sepolia.deriw.com' : 'https://arb1.arbitrum.io/rpc');
const ARB_CHAIN = IS_DEV ? 421614 : 42161;

// Dev bridge params (hardcoded from frontend source code)
const DEV_MAX_GAS       = 600000n;
const DEV_GAS_PRICE_BID = 300000000n;  // 0.3 gwei
// _data format is special (extra word), cannot use standard encode([uint256,bytes],[0,'0x'])
const DEV_BRIDGE_DATA = '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000a3b5840f40000000000000000000000000000000000000000000000000000000000000000000';

// Production bridge params
const PROD_MAX_GAS       = 300000n;
const PROD_GAS_PRICE_BID = 1000000000n;  // 1 gwei

async function getMaxSubmissionCost(inbox, dataLength, gasPrice) {
  try {
    const fee = await inbox.calculateRetryableSubmissionFee(dataLength, gasPrice);
    // Add 30% buffer
    return fee + fee * 30n / 100n;
  } catch {
    return 500000000000n; // fallback: 0.0000005 ETH
  }
}

async function main() {
  const [amountStr] = process.argv.slice(2);
  if (!amountStr) {
    console.error('Usage: node crosschain-deposit.js <amount_usdt>');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('PRIVATE_KEY is required'); process.exit(1); }

  const amount   = ethers.parseUnits(amountStr, 6);
  const provider = new ethers.JsonRpcProvider(ARB_RPC);
  const network  = await provider.getNetwork();
  if (network.chainId !== BigInt(ARB_CHAIN)) {
    console.error(`Error: current network Chain ID ${network.chainId}, requires ${IS_DEV ? 'Arbitrum Sepolia' : 'Arbitrum'} (${ARB_CHAIN})`);
    process.exit(1);
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const router = new ethers.Contract(L2_ROUTER, UserL2ToL3RouterABI, wallet);
  const usdt   = new ethers.Contract(USDT_L2, IERC20ABI, wallet);

  // Query balances
  const bal    = await usdt.balanceOf(wallet.address);
  const ethBal = await provider.getBalance(wallet.address);
  console.log(`Address: ${wallet.address}`);
  console.log(`L2 USDT balance: ${ethers.formatUnits(bal, 6)} USDT`);
  console.log(`ETH balance: ${ethers.formatEther(ethBal)} ETH`);
  if (bal < amount) { console.error('Insufficient USDT balance'); process.exit(1); }

  // Check USDT approval
  const allowance = await usdt.allowance(wallet.address, L2_ROUTER);
  if (allowance < amount) {
    console.log('Approving USDT...');
    await (await usdt.approve(L2_ROUTER, ethers.MaxUint256)).wait();
    console.log('Approval complete');
  }

  let maxGas, gasPriceBid, bridgeData, txValue;

  if (IS_DEV) {
    // Dev: use hardcoded bridge params from frontend, no ETH required
    maxGas       = DEV_MAX_GAS;
    gasPriceBid  = DEV_GAS_PRICE_BID;
    bridgeData   = DEV_BRIDGE_DATA;
    txValue      = 0n;
    console.log('Dev mode: using hardcoded bridge params, value=0');
  } else {
    // Production: dynamically calculate fee
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;
    const inboxAddr = await router.inbox();
    const inboxABI  = ['function calculateRetryableSubmissionFee(uint256 dataLength, uint256 baseFee) view returns (uint256)'];
    const inbox     = new ethers.Contract(inboxAddr, inboxABI, provider);

    maxGas      = PROD_MAX_GAS;
    gasPriceBid = PROD_GAS_PRICE_BID;
    const maxSubmissionCost = await getMaxSubmissionCost(inbox, 100, gasPrice);
    bridgeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256', 'bytes'], [maxSubmissionCost, '0x']);
    txValue    = maxSubmissionCost + maxGas * gasPriceBid;
    console.log(`maxSubmissionCost: ${maxSubmissionCost.toString()} wei`);
    console.log(`Cross-chain fee (ETH): ${ethers.formatEther(txValue)}`);

    if (ethBal < txValue) {
      console.error(`Insufficient ETH: have ${ethers.formatEther(ethBal)}, need ${ethers.formatEther(txValue)}`);
      process.exit(1);
    }
  }

  console.log(`Initiating cross-chain deposit: ${amountStr} USDT (Arbitrum${IS_DEV ? ' Sepolia' : ''} → DERIW${IS_DEV ? ' Dev' : ''} Chain)`);
  const tx = await router.outboundTransfer(
    USDT_L2,
    wallet.address,
    amount,
    maxGas,
    gasPriceBid,
    bridgeData,
    { value: txValue }
  );
  const receipt = await tx.wait();
  console.log('Cross-chain deposit submitted, txHash:', receipt.hash);
  console.log('Asset arrival usually takes 5-15 minutes');
}

main().catch(e => { console.error(e.message); process.exit(1); });
