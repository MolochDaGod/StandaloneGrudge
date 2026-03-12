/**
 * Crafting API Client
 * Client-side fetch wrapper for all /api/crafting/* endpoints.
 * Handles auth token injection (Discord, Grudge Sync JWT, API key)
 * and error normalization.
 */

import { API_BASE as SITE_BASE } from '../utils/apiBase.js';

const API_BASE = SITE_BASE + '/api/crafting';

// ── Auth helpers ──

/** Return the best available auth headers in priority order. */
function getAuthHeaders() {
  const headers = {};

  // 1. Grudge Sync JWT (popup platform auth)
  const syncToken = localStorage.getItem('grudge_sync_token');
  if (syncToken) {
    headers['Authorization'] = `Bearer ${syncToken}`;
    return headers;
  }

  // 2. Discord / Puter session (grudge-session blob)
  try {
    const session = JSON.parse(localStorage.getItem('grudge-session') || '{}');
    if (session.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
      return headers;
    }
    if (session.discordId) {
      headers['x-discord-id'] = session.discordId;
    }
  } catch { /* malformed session – fall through */ }

  // 3. Raw API key fallback
  const apiKey = localStorage.getItem('grudge-api-key');
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  return headers;
}

/** Resolve the Grudge ID of the current user (used by inventory/craft calls). */
export function getCurrentGrudgeId() {
  try {
    const session = JSON.parse(localStorage.getItem('grudge-session') || '{}');
    return session.grudgeId || session.discordId || null;
  } catch { return null; }
}

async function craftFetch(path, options = {}) {
  const authHeaders = getAuthHeaders();
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      // Auto-clear stale sync token on 401
      if (res.status === 401) {
        localStorage.removeItem('grudge_sync_token');
      }
      return { success: false, error: data.error || `HTTP ${res.status}`, status: res.status };
    }

    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message || 'Network error', status: 0 };
  }
}

// ── Account Linking ──

export async function linkAccount(discordId) {
  return craftFetch('/link-account', {
    method: 'POST',
    body: JSON.stringify({ discord_id: discordId }),
  });
}

// ── Recipes ──

export async function fetchRecipes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.profession) params.set('profession', filters.profession);
  if (filters.category) params.set('category', filters.category);
  if (filters.tier) params.set('tier', filters.tier);
  const qs = params.toString();
  return craftFetch(`/recipes${qs ? `?${qs}` : ''}`);
}

export async function fetchUnlockedRecipes(grudgeId, characterId) {
  const qs = characterId ? `?characterId=${characterId}` : '';
  return craftFetch(`/recipes/unlocked/${grudgeId}${qs}`);
}

// ── Materials ──

export async function fetchMaterials(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.tier) params.set('tier', filters.tier);
  return craftFetch(`/materials?${params.toString()}`);
}

// ── Inventory & Resources ──

export async function fetchInventory(grudgeId) {
  return craftFetch(`/inventory/${grudgeId}`);
}

// ── Crafting Jobs ──

export async function submitCraft({ grudgeId, characterId, recipeId, quantity = 1, tier = 1 }) {
  return craftFetch('/craft', {
    method: 'POST',
    body: JSON.stringify({ grudgeId, characterId, recipeId, quantity, tier }),
  });
}

export async function claimCraft(grudgeId, jobId) {
  return craftFetch('/craft/claim', {
    method: 'POST',
    body: JSON.stringify({ grudgeId, jobId }),
  });
}

export async function fetchCraftingJobs(grudgeId) {
  return craftFetch(`/jobs/${grudgeId}`);
}

// ── Harvesting ──

export async function submitHarvest({ grudgeId, characterId, materialId, quantity = 1, tier = 1, profession, nodeType }) {
  return craftFetch('/harvest', {
    method: 'POST',
    body: JSON.stringify({ grudgeId, characterId, materialId, quantity, tier, profession, nodeType }),
  });
}

// ── Professions ──

export async function fetchProfessions(grudgeId) {
  return craftFetch(`/professions/${grudgeId}`);
}

export async function addProfessionXp(characterId, { grudgeId, profession, xpAmount }) {
  return craftFetch(`/professions/${characterId}/xp`, {
    method: 'POST',
    body: JSON.stringify({ grudgeId, profession, xpAmount }),
  });
}

// ── Status ──

/** Quick check: is the crafting suite reachable? Returns { connected, latencyMs }. */
export async function fetchSuiteStatus() {
  const t0 = performance.now();
  const result = await craftFetch('/status');
  return { ...result, connected: result.success, latencyMs: Math.round(performance.now() - t0) };
}

/** True when ANY auth credential is present (does not validate it server-side). */
export function hasCraftingAuth() {
  return Object.keys(getAuthHeaders()).length > 0;
}
