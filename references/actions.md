# Wallet and signed client actions

Choose `DERIW_NETWORK` and run commands from the skill directory. Commands preview by default. Add `--send` for an authorized action and supply a local signer through `PRIVATE_KEY_FILE` or `PRIVATE_KEY`. Set `DERIW_ACCOUNT` for previews that read wallet-specific balances. Amount arguments are decimal strings, not floating-point calculations.

## Contract actions

Use `node scripts/user-action.js <action> <arguments> [--send]`.

| Action | Arguments | Amount units |
|---|---|---|
| fund-deposit | pool periodId amount | Pool token units |
| fund-claim | pool periodId | Full eligible period claim |
| fund-batch-claim | pool '["periodId","periodId"]' | Full eligible period claims |
| fund-resubmit | pool periodId true\|false | Renewal preference |
| meme-deposit | pool amount | USDT |
| meme-claim | pool amount\|all | GLP shares when staked; USDT otherwise |
| meme-claim-all | — | All eligible pool balances |
| meme-create | token | Requires creator eligibility |
| room-create | amount mode | USDT; mode 1=principal, 2=equity |
| room-reopen | amount mode | USDT; mode 1=principal, 2=equity |
| room-deposit | amount | USDT |
| room-withdraw | amount | Requested USDT; protocol limits may cap redemption |
| room-close | — | Schedule the host's room closure |
| room-cancel-close | — | Cancel before the freeze boundary |
| room-freeze | — | Freeze the host's room |
| room-block / room-unblock | '["0xTRADER"]' | Host's trader list |
| referral-bind | code | Trading referral code |
| edge-referral-bind | code sourceType referrerChallengeId | Edge referral parameters; sourceType is uint8 |
| airdrop-claim | — | Claim an available allocation on a configured network |

A claim requires an eligible balance. Fund claims depend on period settlement and claim availability; a deposit does not make funds immediately redeemable. Pool creation, room lifecycle changes and referral binding may have prerequisites that cannot be reversed by the user. Read the selected pool, period, room or referral state before sending. See [contracts.md](contracts.md), [room.md](room.md) and [edge-hour.md](edge-hour.md) for state and unit conventions.

## Signed client API actions

Use `node scripts/client-action.js <action> <request.json> [--send]`. The signer supplies its account address. Do not put a private key, account override or precomputed signature in the request file.

| Action | Request file fields | Signing text |
|---|---|---|
| room-apply | `capacity_base_mode`: 1 or 2 | `Apply to become a host` |
| affiliate-apply | `username`, `country`, `platforms`, `profiles`; optional `image_ids`, `plan_to_promote_dw`, `joined_similar_affiliate_name` | `Apply to become affiliate` |
| rebate-rate | `return_rate`: integer 0..10000; optional `invitee` | `Confirm the rebate ratio` |
| der-plus-bind | `invitation_code` | `I agree to use this code <invitation_code> as my DER+ Point referrer` |
| challenge-settle | `challenge_id` | No message signature; verifies challenge ownership and terminal state on chain |

Affiliate profiles contain `link` and a nonnegative integer `follower_count`; platforms must be nonempty and unique. Username and country are limited to 20 characters. Use the applicant's actual information. Without `invitee`, a rebate-rate update changes the default subordinate rate and may update existing invitees. Specify an invitee to target that relationship.

The four signed messages use EIP-191. Fixed signing texts do not bind all request fields, so review the complete preview and never reuse the signature for another action. The helper submits each request once and does not print signature bytes. HTTP success does not prove that an on-chain room was funded or a challenge reward was paid.

For a signed transaction relay, use [submit-tpsl.js](api.md#submit-signed-tpsl-orders). For bridge signing, use [bridge.md](bridge.md).
