/**
 * Puter Cloud Service Layer
 * Server-side proxy for Puter KV, file storage, and account ops.
 *
 * Two modes:
 *  1. User-token mode  — client passes their Puter auth token; we operate on their behalf
 *  2. Service mode      — uses PUTER_API_TOKEN env for shared/admin KV namespace
 *
 * KV key conventions (all clients must use these):
 *   grudge:objectstore:<dataset>       — cached ObjectStore JSON
 *   grudge:account:<accountId>         — account metadata
 *   grudge:save:<accountId>            — full game save (heroes, island, inventory)
 *   grudge:prefs:<accountId>           — user preferences / settings
 *   grudge:studio:assets:<assetId>     — studio asset metadata
 */

const PUTER_API = 'https://api.puter.com';

// ── KV key helpers ──────────────────────────────────────────────────────────
export const KV_KEYS = {
  objectStore: (ds) => `grudge:objectstore:${ds}`,
  account:     (id) => `grudge:account:${id}`,
  save:        (id) => `grudge:save:${id}`,
  prefs:       (id) => `grudge:prefs:${id}`,
  asset:       (id) => `grudge:studio:assets:${id}`,
};

// ── Resolve auth token ──────────────────────────────────────────────────────
function resolveToken(reqOrToken) {
  // Accept a raw token string or extract from request headers
  if (typeof reqOrToken === 'string') return reqOrToken;
  const hdr = reqOrToken?.headers?.['x-puter-token'] || reqOrToken?.headers?.authorization;
  if (hdr?.startsWith('Bearer ')) return hdr.slice(7);
  return hdr || process.env.PUTER_API_TOKEN || null;
}

// ── KV Operations ───────────────────────────────────────────────────────────

/** Set a key in Puter KV */
export async function kvSet(key, value, tokenSource) {
  const token = resolveToken(tokenSource);
  if (!token) return { ok: false, error: 'no_puter_token' };

  const res = await fetch(`${PUTER_API}/drivers/call`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interface: 'puter-kvstore',
      method: 'set',
      args: { key, value: typeof value === 'string' ? value : JSON.stringify(value) },
    }),
  });
  if (!res.ok) return { ok: false, error: `kv_set_failed`, status: res.status };
  return { ok: true };
}

/** Get a key from Puter KV */
export async function kvGet(key, tokenSource) {
  const token = resolveToken(tokenSource);
  if (!token) return { ok: false, error: 'no_puter_token' };

  const res = await fetch(`${PUTER_API}/drivers/call`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interface: 'puter-kvstore',
      method: 'get',
      args: { key },
    }),
  });
  if (!res.ok) return { ok: false, error: 'kv_get_failed', status: res.status };
  const data = await res.json();
  let value = data.result ?? data;
  // Try to parse JSON values
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { /* raw string */ } }
  return { ok: true, value };
}

/** Delete a key from Puter KV */
export async function kvDel(key, tokenSource) {
  const token = resolveToken(tokenSource);
  if (!token) return { ok: false, error: 'no_puter_token' };

  const res = await fetch(`${PUTER_API}/drivers/call`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interface: 'puter-kvstore',
      method: 'del',
      args: { key },
    }),
  });
  if (!res.ok) return { ok: false, error: 'kv_del_failed', status: res.status };
  return { ok: true };
}

/** List keys matching a glob pattern */
export async function kvList(pattern, tokenSource) {
  const token = resolveToken(tokenSource);
  if (!token) return { ok: false, error: 'no_puter_token' };

  const res = await fetch(`${PUTER_API}/drivers/call`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interface: 'puter-kvstore',
      method: 'list',
      args: { pattern: pattern || 'grudge:*' },
    }),
  });
  if (!res.ok) return { ok: false, error: 'kv_list_failed', status: res.status };
  const data = await res.json();
  return { ok: true, keys: data.result || data };
}

// ── Game Save Sync ──────────────────────────────────────────────────────────

/** Push full game state to Puter KV (called from /api/studio/sync/push) */
export async function syncPush(accountId, gameState, tokenSource) {
  const key = KV_KEYS.save(accountId);
  const payload = {
    ...gameState,
    _syncMeta: { pushedAt: Date.now(), version: gameState._syncMeta?.version ? gameState._syncMeta.version + 1 : 1 },
  };
  return kvSet(key, payload, tokenSource);
}

/** Pull game state from Puter KV */
export async function syncPull(accountId, tokenSource) {
  const key = KV_KEYS.save(accountId);
  return kvGet(key, tokenSource);
}

// ── ObjectStore → Puter KV caching ─────────────────────────────────────────

/** Cache an ObjectStore dataset in the user's Puter KV for offline/fast access */
export async function cacheObjectStoreDataset(dataset, data, tokenSource) {
  const key = KV_KEYS.objectStore(dataset);
  return kvSet(key, { data, cachedAt: Date.now() }, tokenSource);
}

// ── Account Linking ─────────────────────────────────────────────────────────

/** Initialise or fetch unified account record from Puter KV */
export async function accountInit(puterId, puterUsername, tokenSource) {
  const key = KV_KEYS.account(puterId);
  const existing = await kvGet(key, tokenSource);
  if (existing.ok && existing.value && existing.value.puterId) {
    // Update lastSeenAt
    const updated = { ...existing.value, lastSeenAt: Date.now(), puterUsername };
    await kvSet(key, updated, tokenSource);
    return { ok: true, account: updated, created: false };
  }
  // Create new account
  const account = {
    puterId,
    puterUsername,
    discordId: null,
    discordUsername: null,
    grudgeId: null,
    walletAddress: null,
    linkedCharacterIds: [],
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
  };
  const setResult = await kvSet(key, account, tokenSource);
  if (!setResult.ok) return setResult;
  return { ok: true, account, created: true };
}

/** Link a Discord identity to an existing Puter account */
export async function accountLinkDiscord(puterId, discordId, discordUsername, grudgeId, tokenSource) {
  const key = KV_KEYS.account(puterId);
  const existing = await kvGet(key, tokenSource);
  if (!existing.ok || !existing.value) return { ok: false, error: 'account_not_found' };
  const updated = {
    ...existing.value,
    discordId,
    discordUsername,
    grudgeId: grudgeId || existing.value.grudgeId,
    lastSeenAt: Date.now(),
  };
  await kvSet(key, updated, tokenSource);
  return { ok: true, account: updated };
}

/** Link character IDs from the Crafting Suite to the account */
export async function accountLinkCharacters(puterId, characterIds, tokenSource) {
  const key = KV_KEYS.account(puterId);
  const existing = await kvGet(key, tokenSource);
  if (!existing.ok || !existing.value) return { ok: false, error: 'account_not_found' };
  const merged = [...new Set([...(existing.value.linkedCharacterIds || []), ...characterIds])];
  const updated = { ...existing.value, linkedCharacterIds: merged, lastSeenAt: Date.now() };
  await kvSet(key, updated, tokenSource);
  return { ok: true, account: updated };
}

/** Get account by Puter ID */
export async function accountGet(puterId, tokenSource) {
  return kvGet(KV_KEYS.account(puterId), tokenSource);
}

// ── Preferences ─────────────────────────────────────────────────────────────

/** Get player preferences */
export async function prefsGet(accountId, tokenSource) {
  return kvGet(KV_KEYS.prefs(accountId), tokenSource);
}

/** Set player preferences */
export async function prefsSet(accountId, prefs, tokenSource) {
  return kvSet(KV_KEYS.prefs(accountId), prefs, tokenSource);
}

// ── Deploy Logs ─────────────────────────────────────────────────────────────

/** Append a deploy log entry */
export async function deployLogAppend(entry, tokenSource) {
  const key = 'grudge:deploy:log';
  const existing = await kvGet(key, tokenSource);
  const logs = (existing.ok && Array.isArray(existing.value)) ? existing.value : [];
  logs.unshift({ ...entry, ts: Date.now() });
  if (logs.length > 100) logs.length = 100; // keep last 100
  return kvSet(key, logs, tokenSource);
}

// ── Health Check ────────────────────────────────────────────────────────────
export async function healthCheck() {
  const token = process.env.PUTER_API_TOKEN;
  if (!token) return { available: false, reason: 'PUTER_API_TOKEN not set', mode: 'client-only' };

  try {
    const res = await fetch(`${PUTER_API}/drivers/call`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ interface: 'puter-kvstore', method: 'list', args: { pattern: 'grudge:*' } }),
    });
    return { available: res.ok, status: res.status, mode: 'server' };
  } catch (err) {
    return { available: false, reason: err.message, mode: 'server-error' };
  }
}
