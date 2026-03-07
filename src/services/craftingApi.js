/**
 * Crafting API Client
 * Client-side fetch wrapper for all /api/crafting/* endpoints.
 * Handles auth token injection and error normalization.
 */

const API_BASE = '/api/crafting';

function getApiKey() {
  // Prefer session-based key stored during Discord auth
  return localStorage.getItem('grudge-api-key') || '';
}

async function craftFetch(path, options = {}) {
  const apiKey = getApiKey();
  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
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

export async function fetchSuiteStatus() {
  return craftFetch('/status');
}
