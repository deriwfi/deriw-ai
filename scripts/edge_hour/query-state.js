#!/usr/bin/env node
const R = require('../lib/runtime');
async function main() {
  const config = R.network(), provider = await R.providerFor(config);
  try {
    const cm = await R.checkedContract(config, 'edge_hour/ChallengeManager', provider);
    R.print({ manager: cm.target, paymentToken: await cm.paymentToken(), vault: await cm.vault(),
      oracle: await cm.oracle(), ticketUnit: await cm.ticketUnit(), minPositionValueUsd: await cm.minPositionValueUsd() });
    const count = await cm.getChallengeTemplateLength();
    for (let i = 0n; i < count; i++) R.print({ templateId: i, template: await cm.getChallengeTemplate(i) });
    if (process.argv[2]) {
      const active = await cm.getActiveChallengeId(R.address(process.argv[2]));
      R.print({ active, ...(active.exists ? { state: await cm.getChallengeState(active.challengeId) } : {}) });
    }
  } finally { provider.destroy(); }
}
main().catch(R.fail);
