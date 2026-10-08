const R = require('./runtime');
const { fundDeposit } = require('./operations');

async function userPlan(action, args, config, provider, account) {
  const usdt = R.contractAddress(config, 'USDT');
  const memeApproval = value => ({ token: usdt, spender: R.contractAddress(config, 'MemeData'), amount: value });
  if (action === 'airdrop-claim') return { contract: 'Airdrop', method: 'claim', args: [] };
  if (action === 'fund-deposit') return fundDeposit(args, config, provider);
  if (['fund-claim', 'fund-batch-claim', 'fund-resubmit'].includes(action)) {
    const pool = R.address(args[0]);
    const ids = action === 'fund-batch-claim' ? JSON.parse(args[1]).map(x => R.uint(x)) : R.uint(args[1]);
    if (Array.isArray(ids) && (!ids.length || new Set(ids.map(String)).size !== ids.length)) throw new Error('Provide distinct period IDs');
    return { contract: 'FundRouterV2', method: { 'fund-claim': 'claim', 'fund-batch-claim': 'batchClaim', 'fund-resubmit': 'setIsResubmit' }[action],
      args: action === 'fund-resubmit' ? [pool, ids, R.bool(args[2])] : [pool, ids] };
  }
  if (action === 'meme-deposit') {
    const pool = R.address(args[0]), value = R.amount(args[1], 6);
    const factory = await R.checkedContract(config, 'MemeFactory', provider);
    if (await factory.poolOwner(pool) === R.ethers.ZeroAddress) throw new Error('Pool is not registered with the current Meme factory');
    return { contract: 'MemeRouter', method: 'deposit', args: [pool, value], approval: memeApproval(value) };
  }
  if (action === 'meme-claim') {
    const pool = R.address(args[0]), data = await R.checkedContract(config, 'MemeData', provider);
    const state = await data.getMemeState(pool), user = await data.getMemeUserInfo(pool, R.address(account));
    const available = state.isStake ? user.glpAmount : user.depositAmount;
    const value = args[1] === 'all' ? available : R.amount(args[1], state.isStake ? 18 : 6);
    if (value <= 0n || value > available) throw new Error('Claim exceeds the available pool balance');
    return { contract: 'MemeRouter', method: 'claim', args: [pool, value] };
  }
  if (action === 'meme-claim-all') return { contract: 'MemeRouter', method: 'claimAll', args: [] };
  if (action === 'meme-create') {
    const factory = await R.checkedContract(config, 'MemeFactory', provider);
    if (account && !await factory.getWhitelistIsIn(R.address(account))) throw new Error('Wallet is not eligible to create a Meme pool');
    return { contract: 'MemeFactory', method: 'createPool', args: [R.address(args[0])] };
  }
  if (['room-create', 'room-reopen', 'room-deposit', 'room-withdraw'].includes(action)) {
    const value = R.amount(args[0], 6), mode = args[1];
    if (['room-create', 'room-reopen'].includes(action) && !['1', '2'].includes(mode)) throw new Error('Room mode must be 1 or 2');
    const factory = await R.checkedContract(config, 'MemeFactory', provider);
    if (account) {
      const pool = await factory.channelOwnerPool(R.address(account));
      if (action === 'room-create' && pool !== R.ethers.ZeroAddress) throw new Error('Wallet already owns a room; use room-reopen when eligible');
      if (action !== 'room-create' && pool === R.ethers.ZeroAddress) throw new Error('Wallet does not own a room');
      if (action === 'room-reopen' && !await factory.channelPoolIsClose(pool)) throw new Error('Room is not closed');
    }
    if (['room-create', 'room-reopen'].includes(action) && value < await factory.getChannelCreateFunds()) throw new Error('Amount is below the room funding minimum');
    return { contract: 'MemeFactory', method: { 'room-create': 'createChannelPool', 'room-reopen': 'setChannelPoolOpen', 'room-deposit': 'depositChannel', 'room-withdraw': 'claimChannel' }[action],
      args: action === 'room-create' ? [value, Number(mode)] : action === 'room-reopen' ? [Number(mode), value] : [value],
      ...(action === 'room-withdraw' ? {} : { approval: memeApproval(value) }) };
  }
  const roomMethods = { 'room-close': 'setChannelPoolCloseCurrTime', 'room-cancel-close': 'cancelChannelPoolCloseTime', 'room-freeze': 'setChannelPoolFreezeNow' };
  if (roomMethods[action]) return { contract: 'MemeFactory', method: roomMethods[action], args: [] };
  if (action === 'room-block' || action === 'room-unblock') {
    const traders = JSON.parse(args[0]);
    if (!Array.isArray(traders) || !traders.length) throw new Error('Provide a nonempty trader address array');
    return { contract: 'MemeFactory', method: 'batchSetBlacklist', args: [traders.map(R.address), action === 'room-block'] };
  }
  if (action === 'referral-bind') {
    if (!args[0]?.trim()) throw new Error('Provide a referral code');
    return { contract: 'ReferralStorage', method: 'setTraderReferralCodeByUser', args: [args[0]] };
  }
  if (action === 'edge-referral-bind') {
    const type = R.uint(args[1]);
    if (!args[0]?.trim() || type > 255n) throw new Error('Provide a referral code and uint8 source type');
    return { contract: 'edge_hour/ChallengeManager', method: 'setTraderReferralCode', args: [args[0], type, R.uint(args[2])] };
  }
  throw new Error('Unknown user action; see references/actions.md');
}

async function run(argv = process.argv.slice(2)) {
  const send = argv.includes('--send'), [action, ...args] = argv.filter(x => x !== '--send');
  const config = R.network();
  if (send) R.assertWriteNetwork();
  const provider = await R.providerFor(config);
  try {
    const account = send ? R.signer(provider).address : process.env.DERIW_ACCOUNT;
    await R.executePlan(config, provider, await userPlan(action, args, config, provider, account), send);
  } finally { provider.destroy(); }
}
module.exports = { userPlan, run };
