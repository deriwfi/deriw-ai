const R = require('./runtime');
const { ethers, address, amount, uint, bool, checkedContract: contract, contractAddress: at } = R;

async function tradingPlan(action, args, config, provider, account) {
  const usdt = at(config, 'USDT');
  const token = address(args[0]);
  const open = action.endsWith('open');
  const market = action.startsWith('market');
  let size, margin = 0n, collateral = 0n, isLong, trigger, above;
  if (open) {
    margin = amount(args[1], 6, !market); size = amount(args[2], 30, !market); isLong = bool(args[3]);
    if (margin === 0n && size === 0n) throw new Error('Margin and size cannot both be zero');
    if (!market) { trigger = amount(args[4], 30); above = bool(args[5]); }
  } else {
    size = amount(args[1], 30, false); isLong = bool(args[2]);
    if (market) collateral = amount(args[3] || '0', 30, false);
    else { trigger = amount(args[3], 30); above = bool(args[4]); collateral = amount(args[5] || '0', 30, false); }
    if (size === 0n && collateral === 0n) throw new Error('Size and collateral withdrawal cannot both be zero');
  }
  const plan = { contract: market ? 'PositionRouter' : 'OrderBook' };
  if (open && margin > 0n) plan.approval = { token: usdt, spender: at(config, 'Router'), amount: margin };
  if (market) {
    const oracle = await contract(config, 'PriceOracle', provider);
    const [max, min, updated] = await oracle.getMaxMinPriceWithTime(token);
    const block = await provider.getBlock('latest');
    if (!block) throw new Error('Latest block is unavailable');
    R.validateQuote(max, min, updated, block.timestamp);
    const bps = process.env.DERIW_SLIPPAGE_BPS;
    if (bps === undefined) throw new Error('Set DERIW_SLIPPAGE_BPS to the user-approved tolerance');
    const acceptable = R.slippagePrice(isLong === open ? max : min, isLong, open, bps);
    if (open) {
      const referral = args[4] || ethers.ZeroHash;
      if (!ethers.isHexString(referral, 32) || BigInt(referral) !== 0n) {
        throw new Error('Market increase accepts only the zero referral code; bind a trading code separately');
      }
      plan.method = 'createIncreasePosition';
      plan.args = [[usdt], token, margin, size, isLong, acceptable, ethers.ZeroHash, ethers.ZeroAddress];
    } else {
      plan.method = 'createDecreasePosition';
      plan.args = [[usdt], token, collateral, size, isLong, address(account), acceptable, ethers.ZeroAddress];
    }
  } else if (open) {
    plan.method = 'createIncreaseOrder';
    plan.args = [[usdt], margin, token, size, usdt, isLong, trigger, above, size * 10000n / (margin * 10n ** 24n)];
  } else {
    plan.method = 'createDecreaseOrder';
    plan.args = [token, size, usdt, collateral, isLong, trigger, above, 10000n];
  }
  return plan;
}

async function fundDeposit(args, config, provider) {
  const pool = address(args[0]), pid = uint(args[1]);
  const data = await contract(config, 'PoolDataV2', provider);
  const token = address(await data.poolToken(pool));
  const erc20 = await contract(config, 'IERC20', provider, token);
  const value = amount(args[2], Number(await erc20.decimals()));
  return { contract: 'FundRouterV2', method: 'deposit', args: [pool, pid, value, false],
    approval: { token, spender: at(config, 'PoolDataV2'), amount: value } };
}

async function edgePlan(action, args, config, provider, account) {
  const cmName = 'edge_hour/ChallengeManager', lpName = 'edge_hour/LPVault';
  if (action.startsWith('lpvault')) {
    const lp = await contract(config, lpName, provider);
    const token = address(await lp.asset());
    const erc20 = await contract(config, 'IERC20', provider, token);
    const decimals = Number(await erc20.decimals());
    const value = args[0] === 'all' && action === 'lpvault-withdraw'
      ? await lp.maxWithdraw(address(account)) : amount(args[0], decimals);
    if (value <= 0n) throw new Error('No assets to withdraw');
    const deposit = action === 'lpvault-deposit';
    if (account && deposit && !await lp.whitelist(address(account))) throw new Error('Account is not in LPVault whitelist');
    if (account && !deposit && value > await lp.maxWithdraw(address(account))) throw new Error('Amount exceeds maxWithdraw');
    return { contract: lpName, method: deposit ? 'deposit' : 'withdraw', args: [value],
      ...(deposit ? { approval: { token, spender: lp.target, amount: value } } : {}) };
  }
  const cm = await contract(config, cmName, provider);
  const id = uint(args[0]);
  if (action === 'start-challenge') {
    const template = await cm.getChallengeTemplate(id);
    if (!template.active) throw new Error('Challenge template is inactive');
    const payment = address(await cm.paymentToken());
    const erc20 = await contract(config, 'IERC20', provider, payment);
    const value = amount(args[1], Number(await erc20.decimals()));
    const unit = await cm.ticketUnit();
    if (unit === 0n || value % unit !== 0n || value > template.template.maxTicketFee) throw new Error('Invalid ticket fee');
    if (account && (await cm.getActiveChallengeId(address(account))).exists) throw new Error('Account already has an active challenge');
    return { contract: cmName, method: 'startChallenge', args: [id, value],
      approval: { token: payment, spender: cm.target, amount: value } };
  }
  const state = await cm.getChallengeState(id);
  if (account && state.user.toLowerCase() !== address(account).toLowerCase()) throw new Error('Challenge belongs to another account');
  if (action === 'claim-reward') {
    if (state.status !== 2n) throw new Error('Challenge is not Passed');
    return { contract: cmName, method: 'claimReward', args: [id] };
  }
  if (state.status !== 1n) throw new Error('Challenge is not Active');
  const token = address(args[1]);
  if (action === 'close-position') return { contract: cmName, method: 'closePosition', args: [[id, token, bool(args[2])]] };
  const size = amount(args[2], 6), collateral = amount(args[3], 6);
  return { contract: cmName, method: 'increasePosition', args: [[id, token, size, collateral, bool(args[4])]] };
}

async function run(action, argv = process.argv.slice(2)) {
  const send = argv.includes('--send');
  const args = argv.filter(x => x !== '--send');
  const config = R.network();
  if (send) R.assertWriteNetwork();
  const provider = await R.providerFor(config);
  try {
    const account = send ? R.signer(provider).address : process.env.DERIW_ACCOUNT;
    let plan;
    if (/^(market|limit)-(open|close)$/.test(action)) plan = await tradingPlan(action, args, config, provider, account);
    else if (action === 'fund-deposit') plan = await fundDeposit(args, config, provider);
    else plan = await edgePlan(action, args, config, provider, account);
    const receipt = await R.executePlan(config, provider, plan, send);
    if (receipt && action.startsWith('market')) {
      R.print({ requestTransaction: receipt.hash, note: 'Request mined; execution is pending until keeper execution is confirmed.' });
      try { R.print(await R.api(config, 'POST', '/client/position_router/tx_status', {
        address: account, tx_hash: receipt.hash, type: action.endsWith('open') ? 0 : 1 })); }
      catch (e) { R.print({ status: 'pending-or-unavailable', reason: e.message, txHash: receipt.hash }); }
    }
  } finally { provider.destroy(); }
}
module.exports = { run, tradingPlan, fundDeposit, edgePlan };
