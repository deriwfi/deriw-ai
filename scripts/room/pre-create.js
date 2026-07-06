#!/usr/bin/env node
/**
 * Room mode: apply to become a host / (re)open a room channel pool.
 * This is the ONLY room write flow on the client side. It does NOT send an
 * on-chain tx directly — it produces a personal_sign signature and calls the
 * backend, which verifies ownership and drives the channel-pool creation.
 *
 * Flow: personal_sign("Apply to become a host") -> POST /client/room/pre-create
 *       body { account, capacity_base_mode, message: <hex signature> }
 *
 * capacity_base_mode: 1 = Principal, 2 = Equity
 *
 * Usage:   node scripts/room/pre-create.js <capacityBaseMode>
 * Example: DEV=true PRIVATE_KEY=0x... node scripts/room/pre-create.js 1
 *
 * Environment variables: PRIVATE_KEY (required), DEV=true (devnet)
 */
const { ethers } = require('ethers');

const IS_DEV = process.env.DEV === 'true';
const API_BASE = IS_DEV ? 'https://testgmxapi.weequan.cyou' : 'https://api.deriw.com';
const SIGN_MESSAGE = 'Apply to become a host'; // must match backend preCreateRoomPoolSignMessage

async function main() {
  const [modeStr] = process.argv.slice(2);
  const capacityBaseMode = Number(modeStr);
  if (![1, 2].includes(capacityBaseMode)) {
    console.error('Usage: node pre-create.js <capacityBaseMode>  (1=Principal, 2=Equity)');
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) { console.error('PRIVATE_KEY is required'); process.exit(1); }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const message = await wallet.signMessage(SIGN_MESSAGE); // EIP-191 personal signature (hex)

  const body = { account: wallet.address, capacity_base_mode: capacityBaseMode, message };
  console.log(`Host: ${wallet.address} | capacityBaseMode: ${capacityBaseMode === 1 ? 'Principal' : 'Equity'}`);
  console.log(`Signature: ${message}`);

  const res = await fetch(`${API_BASE}/client/room/pre-create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.code === 0) {
    console.log('Room pre-create accepted. Poll /client/room/pool-status?account=<host> for status.');
  } else {
    console.error(`Failed: code=${json.code} msg=${json.msg || json.message || ''}`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
