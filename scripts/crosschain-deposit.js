#!/usr/bin/env node
/**
 * L2→L3 跨链充值（UserL2ToL3Router，需在 Arbitrum 网络运行）
 * 用法: node crosschain-deposit.js <amount_usdt>
 * 环境变量: PRIVATE_KEY（必填）, DEV=true（开发网）, DERIW_RPC_URL（覆盖默认 RPC）
 *
 * 关键发现（通过前端源码逆向）：
 *   Dev 环境：
 *     - _maxGas = 600000, _gasPriceBid = 300000000 (0.3 gwei)
 *     - _data = 硬编码（含额外 word，非标准 encode([uint256,bytes])）
 *     - value = 0（dev 链不收 ETH 桥接费）
 *   线上环境：
 *     - maxSubmissionCost 从 Arbitrum Inbox.calculateRetryableSubmissionFee 计算
 *     - value = maxSubmissionCost + _maxGas * _gasPriceBid
 */
const { ethers } = require('ethers');
const UserL2ToL3RouterABI = require('../assets/UserL2ToL3Router.json');
const IERC20ABI           = require('../assets/IERC20.json');

const IS_DEV = process.env.DEV === 'true';

const L2_ROUTER = IS_DEV
  ? '0x81A88de21De37A025660D746164A9AB013822263'   // Dev（Arbitrum Sepolia）
  : '0xaE7203eBA7E570A6B5C7A303987B6C824dF5A325';  // 线上（Arbitrum mainnet）
const USDT_L2 = IS_DEV
  ? '0x259D16cd04c451eed734908b3df2D3e58AC1e99f'   // Dev USDT（Arbitrum Sepolia）
  : '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9';  // 线上 USDT（Arbitrum mainnet）
const ARB_RPC   = process.env.DERIW_RPC_URL || (IS_DEV ? 'https://rpc-arbitrum-sepolia.deriw.com' : 'https://arb1.arbitrum.io/rpc');
const ARB_CHAIN = IS_DEV ? 421614 : 42161;

// Dev 桥接参数（来自前端源码硬编码）
const DEV_MAX_GAS       = 600000n;
const DEV_GAS_PRICE_BID = 300000000n;  // 0.3 gwei
// _data 格式特殊（额外 word），不能用标准 encode([uint256,bytes],[0,'0x'])
const DEV_BRIDGE_DATA = '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000a3b5840f40000000000000000000000000000000000000000000000000000000000000000000';

// 线上桥接参数
const PROD_MAX_GAS       = 300000n;
const PROD_GAS_PRICE_BID = 1000000000n;  // 1 gwei

async function getMaxSubmissionCost(inbox, dataLength, gasPrice) {
  try {
    const fee = await inbox.calculateRetryableSubmissionFee(dataLength, gasPrice);
    // 加 30% 缓冲
    return fee + fee * 30n / 100n;
  } catch {
    return 500000000000n; // fallback: 0.0000005 ETH
  }
}

async function main() {
  const [amountStr] = process.argv.slice(2);
  if (!amountStr) {
    console.error('用法: node crosschain-deposit.js <amount_usdt>');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('需要设置 PRIVATE_KEY'); process.exit(1); }

  const amount   = ethers.parseUnits(amountStr, 6);
  const provider = new ethers.JsonRpcProvider(ARB_RPC);
  const network  = await provider.getNetwork();
  if (network.chainId !== BigInt(ARB_CHAIN)) {
    console.error(`错误：当前网络 Chain ID ${network.chainId}，需要 ${IS_DEV ? 'Arbitrum Sepolia' : 'Arbitrum'}（${ARB_CHAIN}）`);
    process.exit(1);
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const router = new ethers.Contract(L2_ROUTER, UserL2ToL3RouterABI, wallet);
  const usdt   = new ethers.Contract(USDT_L2, IERC20ABI, wallet);

  // 查询余额
  const bal    = await usdt.balanceOf(wallet.address);
  const ethBal = await provider.getBalance(wallet.address);
  console.log(`地址: ${wallet.address}`);
  console.log(`L2 USDT 余额: ${ethers.formatUnits(bal, 6)} USDT`);
  console.log(`ETH 余额: ${ethers.formatEther(ethBal)} ETH`);
  if (bal < amount) { console.error('USDT 余额不足'); process.exit(1); }

  // 检查 USDT 授权
  const allowance = await usdt.allowance(wallet.address, L2_ROUTER);
  if (allowance < amount) {
    console.log('授权 USDT...');
    await (await usdt.approve(L2_ROUTER, ethers.MaxUint256)).wait();
    console.log('授权完成');
  }

  let maxGas, gasPriceBid, bridgeData, txValue;

  if (IS_DEV) {
    // Dev：使用前端硬编码参数，不需要 ETH
    maxGas       = DEV_MAX_GAS;
    gasPriceBid  = DEV_GAS_PRICE_BID;
    bridgeData   = DEV_BRIDGE_DATA;
    txValue      = 0n;
    console.log('Dev 模式：使用硬编码桥接参数，value=0');
  } else {
    // 线上：动态计算手续费
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
    console.log(`跨链手续费（ETH）: ${ethers.formatEther(txValue)}`);

    if (ethBal < txValue) {
      console.error(`ETH 不足：有 ${ethers.formatEther(ethBal)}，需要 ${ethers.formatEther(txValue)}`);
      process.exit(1);
    }
  }

  console.log(`发起跨链充值: ${amountStr} USDT (Arbitrum${IS_DEV ? ' Sepolia' : ''} → DERIW${IS_DEV ? ' Dev' : ''} 链)`);
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
  console.log('跨链充值已提交，txHash:', receipt.hash);
  console.log('资产到账通常需要 5-15 分钟');
}

main().catch(e => { console.error(e.message); process.exit(1); });
