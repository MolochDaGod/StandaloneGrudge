/**
 * VPS Auth Helper — proxies all auth to id.grudge-studio.com
 * GrudgeWars game data stays in Neon; auth lives on VPS.
 */
import { query } from './db.js';

const VPS_AUTH_URL = process.env.VPS_AUTH_URL || 'https://id.grudge-studio.com';

// ── Generic VPS POST helper ─────────────────────────────────────────────────
async function vpsPost(path, body = {}) {
  const res = await fetch(`${VPS_AUTH_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function vpsGet(path, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${VPS_AUTH_URL}${path}`, { headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

// ── Auth proxy functions ────────────────────────────────────────────────────

export async function vpsLogin(username, password) {
  return vpsPost('/auth/login', { username, password });
}

export async function vpsRegister(username, password, email) {
  return vpsPost('/auth/register', { username, password, email });
}

export async function vpsPuter(puterUuid, puterUsername) {
  return vpsPost('/auth/puter', { puterUuid, puterUsername });
}

export async function vpsGuest(deviceId) {
  return vpsPost('/auth/guest', { deviceId });
}

export async function vpsWallet(wallet_address, web3auth_token) {
  return vpsPost('/auth/wallet', { wallet_address, web3auth_token });
}

export async function vpsDiscordExchange(code, redirect_uri) {
  return vpsPost('/auth/discord/exchange', { code, redirect_uri });
}

export async function vpsVerifyToken(token) {
  return vpsPost('/auth/verify', { token });
}

// ── Identity lookups ────────────────────────────────────────────────────────

export async function vpsGetIdentity(token) {
  return vpsGet('/identity/me', token);
}

export async function vpsLookup(grudge_id) {
  return vpsGet(`/identity/${encodeURIComponent(grudge_id)}`);
}

// ── Local game account upsert ───────────────────────────────────────────────
// Keeps a local Neon `accounts` row so game data FKs (characters, inventory,
// islands, arena) continue to work. Auth stays on VPS.
export async function upsertLocalGameAccount({ grudgeId, username, discordId, walletAddress, puterId }) {
  const result = await query(
    `INSERT INTO accounts (grudge_id, username, discord_id, wallet_address, puter_uuid, auth_type, last_login)
     VALUES ($1, $2, $3, $4, $5, 'vps', NOW())
     ON CONFLICT (grudge_id) DO UPDATE SET
       username     = COALESCE(EXCLUDED.username, accounts.username),
       discord_id   = COALESCE(EXCLUDED.discord_id, accounts.discord_id),
       wallet_address = COALESCE(EXCLUDED.wallet_address, accounts.wallet_address),
       puter_uuid   = COALESCE(EXCLUDED.puter_uuid, accounts.puter_uuid),
       last_login   = NOW(),
       updated_at   = NOW()
     RETURNING *`,
    [grudgeId, username || 'Unknown', discordId || null, walletAddress || null, puterId || null]
  );
  return result.rows[0];
}

// ── Helper: extract user fields from VPS response ───────────────────────────
export function extractVpsUser(data) {
  const user = data.user || data;
  return {
    grudgeId: data.grudgeId || user.grudgeId || user.grudge_id,
    username: data.username || user.username,
    discordId: user.discordId || user.discord_id || null,
    walletAddress: user.walletAddress || user.wallet_address || null,
    puterId: user.puter_id || null,
  };
}

export { VPS_AUTH_URL };
