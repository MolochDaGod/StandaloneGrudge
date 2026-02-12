const PREFIX_MAP = {
  hero: 'HERO',
  item: 'ITEM',
  equipment: 'EQIP',
  ability: 'ABIL',
  material: 'MATL',
  recipe: 'RECP',
  node: 'NODE',
  mob: 'MOBS',
  boss: 'BOSS',
  mission: 'MISS',
  infusion: 'INFU',
  loot: 'LOOT',
  consumable: 'CONS',
  quest: 'QUST',
  zone: 'ZONE',
  save: 'SAVE',
};

let sequenceCounter = parseInt(localStorage.getItem('grudge_uuid_seq') || '0', 16);

function sha256Hex8(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash = hash >>> 0;
  const h2 = (hash ^ (hash >>> 16)) >>> 0;
  return h2.toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
}

export function generateGrudgeUuid(entityType, metadata = '') {
  const prefix = PREFIX_MAP[entityType] || entityType.slice(0, 4).toUpperCase();
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  sequenceCounter++;
  localStorage.setItem('grudge_uuid_seq', sequenceCounter.toString(16));
  const sequence = sequenceCounter.toString(16).toUpperCase().padStart(6, '0');

  const hashInput = `${prefix}-${timestamp}-${sequence}-${metadata}-${Math.random()}`;
  const hash = sha256Hex8(hashInput);

  return `${prefix}-${timestamp}-${sequence}-${hash}`;
}

export function parseGrudgeUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') return null;
  const parts = uuid.split('-');
  if (parts.length !== 4) return null;
  return {
    prefix: parts[0],
    timestamp: parts[1],
    sequence: parts[2],
    hash: parts[3],
    entityType: Object.entries(PREFIX_MAP).find(([, v]) => v === parts[0])?.[0] || 'unknown',
    createdAt: new Date(
      parseInt(parts[1].slice(0, 4)),
      parseInt(parts[1].slice(4, 6)) - 1,
      parseInt(parts[1].slice(6, 8)),
      parseInt(parts[1].slice(8, 10)),
      parseInt(parts[1].slice(10, 12)),
      parseInt(parts[1].slice(12, 14))
    ),
  };
}

export function isValidGrudgeUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  const pattern = /^[A-Z]{4}-\d{14}-[0-9A-F]{6}-[0-9A-F]{8}$/;
  return pattern.test(uuid);
}

export { PREFIX_MAP };
