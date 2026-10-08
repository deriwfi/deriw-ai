const R = require('./runtime');

function fields(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a JSON object');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`Unsupported field: ${key}`);
}
function text(value, label, max = 2000) {
  if (typeof value !== 'string' || !value.trim() || [...value].length > max) throw new Error(`Invalid ${label}`);
  return value;
}
function clientPlan(action, input) {
  if (action === 'room-apply') {
    fields(input, ['capacity_base_mode']);
    if (![1, 2].includes(input.capacity_base_mode)) throw new Error('capacity_base_mode must be 1 or 2');
    return { route: '/client/room/pre-create', body: input, accountField: 'account', signatureField: 'message', message: 'Apply to become a host' };
  }
  if (action === 'affiliate-apply') {
    fields(input, ['username', 'country', 'platforms', 'profiles', 'image_ids', 'plan_to_promote_dw', 'joined_similar_affiliate_name']);
    text(input.username, 'username', 20); text(input.country, 'country', 20);
    if (!Array.isArray(input.platforms) || !input.platforms.length || new Set(input.platforms).size !== input.platforms.length) throw new Error('Provide unique platforms');
    input.platforms.forEach(x => text(x, 'platform'));
    if (!Array.isArray(input.profiles) || !input.profiles.length) throw new Error('Provide at least one profile');
    for (const profile of input.profiles) {
      fields(profile, ['link', 'follower_count']); text(profile.link, 'profile link');
      if (!Number.isSafeInteger(profile.follower_count) || profile.follower_count < 0) throw new Error('Invalid follower_count');
    }
    if (input.image_ids !== undefined && (!Array.isArray(input.image_ids) || input.image_ids.some(x => !Number.isSafeInteger(x) || x < 1))) throw new Error('Invalid image_ids');
    for (const key of ['plan_to_promote_dw', 'joined_similar_affiliate_name']) if (input[key] !== undefined && typeof input[key] !== 'string') throw new Error(`Invalid ${key}`);
    return { route: '/client/invite_return/v2/apply_agent', body: input, accountField: 'account', signatureField: 'signature', message: 'Apply to become affiliate' };
  }
  if (action === 'rebate-rate') {
    fields(input, ['return_rate', 'invitee']);
    if (!Number.isInteger(input.return_rate) || input.return_rate < 0 || input.return_rate > 10000) throw new Error('return_rate must be 0..10000');
    const body = { return_rate: input.return_rate };
    if (input.invitee !== undefined) body.invitee = R.address(input.invitee);
    return { route: '/client/invite_return/v2/set_return_rate', body, accountField: 'account', signatureField: 'signature', message: 'Confirm the rebate ratio' };
  }
  if (action === 'der-plus-bind') {
    fields(input, ['invitation_code']);
    const code = text(input.invitation_code, 'invitation_code', 100);
    return { route: '/client/supernovaplus/create_relationship', body: { type: 2, invitation_code: code }, accountField: 'invitee_address', signatureField: 'sign', message: `I agree to use this code ${code} as my DER+ Point referrer` };
  }
  if (action === 'challenge-settle') {
    fields(input, ['challenge_id']);
    const id = R.uint(input.challenge_id, true);
    if (id > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('challenge_id exceeds the client API integer range');
    return { route: '/client/edge_hour/challenge/claim', body: { challenge_id: Number(id) } };
  }
  throw new Error('Use room-apply, affiliate-apply, rebate-rate, der-plus-bind, or challenge-settle');
}

async function submit(config, provider, plan, wallet) {
  if (plan.route === '/client/edge_hour/challenge/claim') {
    const cm = await R.checkedContract(config, 'edge_hour/ChallengeManager', provider);
    const state = await cm.getChallengeState(plan.body.challenge_id);
    if (R.address(state.user) !== wallet.address) throw new Error('Challenge belongs to another account');
    if (![2n, 3n].includes(state.status)) throw new Error('Challenge must be Passed or Failed before settlement');
  }
  const body = { ...plan.body };
  if (plan.accountField) body[plan.accountField] = wallet.address;
  if (plan.message) body[plan.signatureField] = await wallet.signMessage(plan.message);
  const result = await R.api(config, 'POST', plan.route, body);
  // A successful API response is not a transaction receipt or a paid reward.
  return { route: plan.route, account: wallet.address, code: result.code, data: result.data };
}
module.exports = { clientPlan, submit };
