/**
 * Grudge UUID Service
 * Deterministic FNV-1a based IDs for all game entities.
 * Format: PREFIX-TIMESTAMP14-SEQ6HEX-HASH8HEX
 * e.g.   HERO-20260227063200-000001-A1B2C3D4
 */

export const PREFIX_MAP = {
  hero: 'HERO', item: 'ITEM', equipment: 'EQIP', ability: 'ABIL',
  material: 'MATL', recipe: 'RECP', node: 'NODE', mob: 'MOBS',
  boss: 'BOSS', mission: 'MISS', infusion: 'INFU', loot: 'LOOT',
  consumable: 'CONS', quest: 'QUST', zone: 'ZONE', save: 'SAVE',
  asset: 'ASST', sync: 'SYNC',
};

let seq = 0;

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (((h >>> 0) ^ ((h >>> 0) >>> 16)) >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
}

export function generate(entityType, metadata = '') {
  const prefix = PREFIX_MAP[entityType] || entityType.slice(0, 4).toUpperCase();
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  seq++;
  const s = seq.toString(16).toUpperCase().padStart(6, '0');
  const hash = fnv1a(`${prefix}-${ts}-${s}-${metadata}-${Math.random()}`);
  return `${prefix}-${ts}-${s}-${hash}`;
}

export function parse(uuid) {
  if (!uuid || typeof uuid !== 'string') return null;
  const p = uuid.split('-');
  if (p.length !== 4) return null;
  const type = Object.entries(PREFIX_MAP).find(([, v]) => v === p[0])?.[0] || 'unknown';
  return {
    prefix: p[0], timestamp: p[1], sequence: p[2], hash: p[3], entityType: type,
    createdAt: new Date(
      parseInt(p[1].slice(0, 4)), parseInt(p[1].slice(4, 6)) - 1, parseInt(p[1].slice(6, 8)),
      parseInt(p[1].slice(8, 10)), parseInt(p[1].slice(10, 12)), parseInt(p[1].slice(12, 14))
    ),
  };
}

export function isValid(uuid) {
  return typeof uuid === 'string' && /^[A-Z]{4}-\d{14}-[0-9A-F]{6}-[0-9A-F]{8}$/.test(uuid);
}
