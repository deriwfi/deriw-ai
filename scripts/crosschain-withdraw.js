#!/usr/bin/env node
/**
 * L3→L2 提现（UserL3ToL2Router，在 DERIW 链运行）
 * 用法: node crosschain-withdraw.js <amount_usdt> [receiver_address]
 *   receiver_address: L2 接收地址（默认与发送地址相同）
 * 环境变量: PRIVATE_KEY（必填）, DEV=true（开发网）, DERIW_RPC_URL（覆盖默认 RPC）
 *
 * 关键发现（通过逆向真实 tx 确认）：
 *   - domain.name = 'Transaction'（非 'DERIW'）
 *   - transactionType = 'Withdraw USDT'（非 'Withdraw'）
 *   - _data = '0x'（空，token/amount/receiver 已在 message 中）
 *   - value = 0（合约不收 ETH，dev 链 gasPrice=0）
 *   - EIP-712 chainId 取自 router.chainid()（非网络 chainId）
 *   - 签名用合约 hashDomain/hashMessage/hashData 计算最终 hash，再直接签名
 *   - l2Token 取自 USDT_L3.l1Address()
 */
const { ethers } = require('ethers');
const UserL3ToL2RouterABI = require('../assets/UserL3ToL2Router.json');
const IERC20ABI           = require('../assets/IERC20.json');

const IS_DEV = process.env.DEV === 'true';

const L3_ROUTER = IS_DEV
  ? '0x32068069f13191B57c03Eee8531a8C82b26d12B9'  // Dev
  : '0x8fb358679749FD952Ea5f090b0eA3675722B08F5';  // 线上
const USDT_L3 = IS_DEV
  ? '0x12530882c64B1c22dAdf2F60639145029c5081Da'   // Dev USDT（l1Address = 0x259D16...）
  : '0x3B11A54514A708CC2261f4B69617910E172a90B3';  // 线上 USDT（l1Address = 0xfd086b...）
const USDT_L2 = IS_DEV
  ? '0x259D16cd04c451eed734908b3df2D3e58AC1e99f'   // Dev L2 USDT（USDT_L3.l1Address()）
  : '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9';  // 线上 L2 USDT（Arbitrum mainnet）
const RPC_URL   = process.env.DERIW_RPC_URL || (IS_DEV ? 'https://rpc.dev.deriw.com' : 'https://rpc.deriw.com');

// Enum 常量
const TRANSACTION_TYPE = 'Withdraw USDT';
const CHAIN_TARGET     = IS_DEV ? 'DeriW Devnet' : 'DeriW Chain';

async function main() {
  const [amountStr, receiverArg] = process.argv.slice(2);
  if (!amountStr) {
    console.error('用法: node crosschain-withdraw.js <amount_usdt> [receiver_address]');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('需要设置 PRIVATE_KEY'); process.exit(1); }

  const amount   = ethers.parseUnits(amountStr, 6);
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const router   = new ethers.Contract(L3_ROUTER, UserL3ToL2RouterABI, wallet);
  const usdt     = new ethers.Contract(USDT_L3, IERC20ABI, wallet);

  const receiver = receiverArg || wallet.address;

  // 查询到账金额（fee 仅供参考，合约实际不收 ETH）
  const [netAmount] = await router.getValue(USDT_L3, amount);
  console.log(`提现金额: ${amountStr} USDT`);
  console.log(`到账金额: ${ethers.formatUnits(netAmount, 6)} USDT`);

  // 检查 USDT 授权
  const allowance = await usdt.allowance(wallet.address, L3_ROUTER);
  if (allowance < amount) {
    console.log('授权 USDT...');
    const gasOpts = IS_DEV ? { gasPrice: 0n } : {};
    await (await usdt.approve(L3_ROUTER, ethers.MaxUint256, gasOpts)).wait();
    console.log('授权完成');
  }

  // EIP-712 domain chainId 取自合约（非网络 chainId）
  const domain712ChainId = await router.chainid();
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 分钟

  const domain = {
    name: 'Transaction',   // 必须是 'Transaction'，非 'DERIW'
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

  // 用合约 hash 函数计算最终 hash，再直接签名（合约未用标准 EIP-712 编码）
  const domainHash  = await router.hashDomain(domain);
  const messageHash = await router.hashMessage(message);
  const finalHash   = await router.hashData(domainHash, messageHash);
  const sig         = wallet.signingKey.sign(finalHash);
  const signature   = ethers.Signature.from(sig).serialized;

  // _data 传空（token/amount/receiver 已在 message 中，bridge 不接受额外 calldata）
  const gasOpts = IS_DEV ? { value: 0n, gasPrice: 0n } : {};
  console.log(`发起提现: ${amountStr} USDT (DERIW ${IS_DEV ? 'Dev' : ''} 链 → Arbitrum)`);
  const tx = await router.outboundTransfer('0x', domain, message, signature, gasOpts);
  const receipt = await tx.wait();
  console.log('提现已提交，txHash:', receipt.hash);
  console.log('资产到账通常需要 15-60 分钟（Arbitrum 确认）');
}

main().catch(e => { console.error(e.message); process.exit(1); });
