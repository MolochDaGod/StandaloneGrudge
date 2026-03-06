/**
 * Cloud Sync Service
 * Bridges local zustand game state ↔ server (PostgreSQL + Puter KV)
 *
 * Flow:
 *   Login → pullSave() → offer restore if cloud is newer
 *   Play  → debounced pushSave() on every state change (30s)
 *   Manual "Sync Now" button in Account tab
 */

const API_BASE = '';  // same-origin

// ── Token Helpers ───────────────────────────────────────────────────────────

export function getSessionToken() {
  return localStorage.getItem('grudge_session_token') || null;
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem('grudge-session') || 'null');
  } catch { return null; }
}

export function getGrudgeId() {
  const session = getSession();
  return session?.grudgeId || null;
}

export function isLoggedIn() {
  const session = getSession();
  if (!session) return false;
  return session.type === 'puter' || session.type === 'discord' || session.type === 'grudge';
}

/** Get Puter auth token from the SDK (if user is signed in) */
export async function getPuterToken() {
  try {
    if (typeof window !== 'undefined' && window.puter?.auth?.isSignedIn?.()) {
      const user = await window.puter.auth.getUser();
      // Puter SDK exposes the token on the auth object
      return window.puter?.authToken || window.puter?.auth?.token || null;
    }
  } catch {}
  return null;
}

// ── Sync Operations ─────────────────────────────────────────────────────────

/**
 * Push current game state to cloud (DB + Puter KV)
 * @param {Object} gameState - partialised game state from zustand
 * @returns {{ success: boolean, timestamp?: number, error?: string }}
 */
export async function pushSave(gameState) {
  const sessionToken = getSessionToken();
  if (!sessionToken) return { success: false, error: 'not_logged_in' };

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken,
    };

    // Add Puter token if available
    const puterToken = await getPuterToken();
    if (puterToken) headers['X-Puter-Token'] = puterToken;

    const res = await fetch(`${API_BASE}/api/studio/sync/push`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ gameState }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    // Store last sync time
    localStorage.setItem('grudge_last_sync', JSON.stringify({
      timestamp: data.timestamp || Date.now(),
      direction: 'push',
    }));

    return { success: true, timestamp: data.timestamp };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Pull game state from cloud
 * @returns {{ success: boolean, data?: Object, source?: string, error?: string }}
 */
export async function pullSave() {
  const sessionToken = getSessionToken();
  if (!sessionToken) return { success: false, error: 'not_logged_in' };

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken,
    };

    const puterToken = await getPuterToken();
    if (puterToken) headers['X-Puter-Token'] = puterToken;

    const res = await fetch(`${API_BASE}/api/studio/sync/pull`, {
      method: 'POST',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    const result = await res.json();
    if (result.data) {
      localStorage.setItem('grudge_last_sync', JSON.stringify({
        timestamp: result.timestamp || Date.now(),
        direction: 'pull',
      }));
      return { success: true, data: result.data, source: result.source };
    }

    return { success: true, data: null, source: 'empty' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Get last sync metadata
 */
export function getLastSync() {
  try {
    return JSON.parse(localStorage.getItem('grudge_last_sync') || 'null');
  } catch { return null; }
}

// ── Debounced Auto-Push ─────────────────────────────────────────────────────

let _pushTimer = null;
let _pushPending = false;
const PUSH_DEBOUNCE_MS = 30_000; // 30 seconds

/**
 * Schedule a debounced cloud push. Call this on every state change.
 * Will wait 30s after the last change before actually pushing.
 */
export function schedulePush(getPartialState) {
  if (!isLoggedIn()) return;

  if (_pushTimer) clearTimeout(_pushTimer);
  _pushPending = true;

  _pushTimer = setTimeout(async () => {
    if (!_pushPending) return;
    _pushPending = false;

    const state = typeof getPartialState === 'function' ? getPartialState() : null;
    if (!state) return;

    const result = await pushSave(state);
    if (result.success) {
      console.log('[CloudSync] Auto-push OK', new Date().toLocaleTimeString());
    } else {
      console.warn('[CloudSync] Auto-push failed:', result.error);
    }
  }, PUSH_DEBOUNCE_MS);
}

/** Cancel any pending auto-push */
export function cancelPendingPush() {
  if (_pushTimer) {
    clearTimeout(_pushTimer);
    _pushTimer = null;
    _pushPending = false;
  }
}

/**
 * Force an immediate push (e.g. "Sync Now" button)
 */
export async function forcePush(getPartialState) {
  cancelPendingPush();
  const state = typeof getPartialState === 'function' ? getPartialState() : null;
  if (!state) return { success: false, error: 'no_state' };
  return pushSave(state);
}
