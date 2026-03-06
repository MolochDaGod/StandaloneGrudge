/**
 * ObjectStore — Grudge Studio Unified Game Data Layer
 * Fetches JSON datasets from GitHub Pages, caches in-memory (5-min TTL),
 * and provides standardised Puter KV keys for client-side caching.
 *
 * Source: https://molochdagod.github.io/ObjectStore
 */

const OBJECT_STORE_BASE = 'https://molochdagod.github.io/ObjectStore';

// Every published dataset in ObjectStore
export const DATASETS = [
  'weapons', 'equipment', 'armor', 'materials', 'consumables',
  'skills', 'professions', 'spriteMaps', 'classes', 'races',
  'factions', 'attributes', 'enemies', 'bosses', 'sprites',
  'ai', 'animations', 'controllers', 'ecs', 'factionUnits',
  'nodeUpgrades', 'rendering', 'terrain', 'tileMaps',
];

// ── In-memory TTL cache ─────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function fetchDataset(name) {
  if (!DATASETS.includes(name)) return null;

  const cached = cache.get(name);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const url = `${OBJECT_STORE_BASE}/api/v1/${name}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} for ${name}`);
    const data = await res.json();
    cache.set(name, { data, ts: Date.now() });
    return data;
  } catch (err) {
    // Stale cache fallback
    if (cached) return cached.data;
    throw err;
  }
}

// ── Cross-resource search ───────────────────────────────────────────────────
const SEARCHABLE = [
  'weapons', 'equipment', 'armor', 'materials', 'consumables',
  'skills', 'enemies', 'bosses', 'classes', 'races', 'factions',
];

export async function searchAll(query, opts = {}) {
  const q = query.toLowerCase();
  const typeFilter = opts.type;
  const limit = Math.min(parseInt(opts.limit) || 50, 200);
  const results = [];

  const targets = typeFilter ? [typeFilter] : SEARCHABLE;

  for (const ds of targets) {
    try {
      const data = await fetchDataset(ds);
      if (!data) continue;
      const items = extractItems(data);
      for (const item of items) {
        const hay = JSON.stringify(item).toLowerCase();
        if (hay.includes(q)) {
          results.push({ source: ds, item, relevance: hay.split(q).length - 1 });
        }
        if (results.length >= limit) break;
      }
    } catch { /* skip broken dataset */ }
    if (results.length >= limit) break;
  }

  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, limit);
}

function extractItems(data) {
  if (data.categories) {
    return Object.values(data.categories).flatMap(c =>
      Array.isArray(c.items) ? c.items : Array.isArray(c) ? c : [c]
    );
  }
  if (Array.isArray(data)) return data;
  if (data.items && Array.isArray(data.items)) return data.items;
  if (typeof data === 'object') return Object.values(data).filter(v => v && typeof v === 'object');
  return [];
}

// ── Puter KV key convention ─────────────────────────────────────────────────
// Clients cache datasets in Puter KV under these standardised keys.
// e.g. puter.kv.set('grudge:objectstore:weapons', data)
export function puterKvKey(dataset) {
  return `grudge:objectstore:${dataset}`;
}

/** Build the full Puter KV manifest clients use for bootstrapping */
export function puterKvManifest() {
  return DATASETS.map(ds => ({
    dataset: ds,
    kvKey: puterKvKey(ds),
    sourceUrl: `${OBJECT_STORE_BASE}/api/v1/${ds}.json`,
    cacheTtlMs: CACHE_TTL,
  }));
}

// ── Cache stats ─────────────────────────────────────────────────────────────
export function getCacheStats() {
  const entries = {};
  for (const [key, val] of cache) {
    entries[key] = { ageSec: Math.round((Date.now() - val.ts) / 1000), stale: Date.now() - val.ts > CACHE_TTL };
  }
  return { totalDatasets: DATASETS.length, cachedCount: cache.size, entries };
}

export function clearCache() { cache.clear(); }
