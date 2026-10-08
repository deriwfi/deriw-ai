#!/usr/bin/env node
const R = require('./lib/runtime');
async function main() {
  const [amountString, receiverArg] = process.argv.slice(2).filter(x => x !== '--send');
  const send = process.argv.includes('--send'), config = R.network();
  const provider = await R.providerFor(config);
  try {
    const router = await R.checkedContract(config, 'UserL3ToL2Router', provider);
    const usdt = R.contractAddress(config, 'USDT');
    if (R.address(await router.l3Usdt()) !== usdt) throw new Error('Bridge collateral does not match this network');
    const wallet = send ? R.signer(provider) : null;
    const account = wallet?.address || R.address(process.env.DERIW_ACCOUNT);
    const receiver = receiverArg ? R.address(receiverArg) : account;
    const token = new R.ethers.Contract(usdt, [...R.abi('IERC20'), 'function l1Address() view returns (address)'], provider);
    const l2Token = R.address(await token.l1Address());
    const value = R.amount(amountString, Number(await token.decimals()));
    const chain = process.env.DERIW_BRIDGE_CHAIN_LABEL || ({ dev: 'DeriW Devnet', mainnet: 'DeriW Chain' })[config.name];
    if (!chain) throw new Error('Set DERIW_BRIDGE_CHAIN_LABEL for the test deployment');
    const domain = { name: 'Transaction', version: '1', chainId: await router.chainid(), verifyingContract: router.target };
    const message = { transactionType: 'Withdraw USDT', from: account, token: usdt, l2Token,
      destination: receiver, amount: value, deadline: BigInt(Math.floor(Date.now() / 1000) + 600), chain };
    const [netAmount, fee] = await router.getValue(usdt, value);
    const digest = await router.hashData(await router.hashDomain(domain), await router.hashMessage(message));
    R.print({ network: config.name, domain, message, netAmount, tokenFee: fee, digest,
      approval: { token: usdt, spender: router.target, amount: value }, mode: send ? 'send' : 'preview' });
    if (!send) return;
    R.assertWriteNetwork();
    const signature = R.ethers.Signature.from(wallet.signingKey.sign(digest)).serialized;
    const [recovered] = await router.getSignatureUser(domain, message, signature);
    if (R.address(recovered) !== R.address(account)) throw new Error('Signature recovery failed');
    // Do not log the signed message calldata. It can authorize a transfer until expiry.
    const signerToken = token.connect(wallet);
    if (await signerToken.balanceOf(account) < value) throw new Error('Insufficient USDT balance');
    const allowance = await signerToken.allowance(account, router.target);
    if (allowance < value) {
      if (allowance) await R.sendCall(signerToken, 'approve', [router.target, 0n]);
      await R.sendCall(signerToken, 'approve', [router.target, value]);
    }
    await R.sendCall(router.connect(wallet), 'outboundTransfer', ['0x', domain, message, signature], { value: 0n });
    R.print({ note: 'Withdrawal initiated. Destination settlement is a separate step; do not resend on indexing delay.' });
  } finally { provider.destroy(); }
}
main().catch(R.fail);
