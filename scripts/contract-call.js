#!/usr/bin/env node
const R = require('./lib/runtime');
// A full ABI is not a user permission list. Only these user/host writes are exposed.
const writes = {
  PositionRouter: ['cancelIncreasePosition', 'cancelDecreasePosition'],
  OrderBook: ['cancelIncreaseOrder', 'cancelDecreaseOrder', 'cancelMultiple', 'batchCreateDecreaseOrder'],
  FundRouterV2: ['claim', 'batchClaim', 'setIsResubmit'],
  MemeRouter: ['claim', 'claimAll'],
  ReferralStorage: ['setTraderReferralCodeByUser'],
  MemeFactory: ['createPool', 'setChannelPoolCloseCurrTime', 'setChannelPoolFreezeNow', 'cancelChannelPoolCloseTime', 'batchSetBlacklist', 'claimChannel'],
};
function isUserWrite(name, method) { return (writes[name] || []).includes(method); }
async function main() {
  const args = process.argv.slice(2), send = args.includes('--send');
  let target;
  const atIndex = args.indexOf('--at');
  if (atIndex !== -1) {
    target = R.address(args[atIndex + 1]);
    args.splice(atIndex, 2);
  }
  const [name, method, json = '[]'] = args.filter(x => x !== '--send');
  const config = R.network();
  const iface = new R.ethers.Interface(R.abi(name));
  const fragment = iface.getFunction(method);
  if (!fragment) throw new Error('Method is absent from bundled ABI');
  const params = JSON.parse(json);
  const read = ['view', 'pure'].includes(fragment.stateMutability);
  if (target && !read) throw new Error('--at is available only for public reads');
  if (!read && !isUserWrite(name, fragment.name)) throw new Error('Write is not in the user allowlist; use the documented operation script');
  if (name === 'UserL2ToL3Router') throw new Error('L2 router requires the separate bridge network workflow');
  const provider = await R.providerFor(config);
  try {
    if (read) {
      const c = await R.checkedContract(config, name, provider, target);
      R.print(await c.getFunction(method)(...params));
    } else await R.executePlan(config, provider, { contract: name, method, args: params }, send);
  } finally { provider.destroy(); }
}
if (require.main === module) main().catch(R.fail);
module.exports = { isUserWrite, writes };
