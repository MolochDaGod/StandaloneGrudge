const SHARE_VERSION = 1;

function compressToBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decompressFromBase64Url(encoded) {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function hashPayload(data) {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
}

function serializeEquipment(equipment) {
  if (!equipment) return null;
  const result = {};
  for (const [slot, item] of Object.entries(equipment)) {
    if (!item) continue;
    result[slot] = {
      n: item.name,
      i: item.icon,
      s: item.slot,
      t: item.tier || 1,
      st: item.stats || {},
      wt: item.weaponType || undefined,
      at: item.armorType || undefined,
      h: item.hand || undefined,
    };
  }
  return Object.keys(result).length > 0 ? result : null;
}

function deserializeEquipment(data) {
  if (!data) return {};
  const result = {};
  for (const [slot, item] of Object.entries(data)) {
    result[slot] = {
      id: 'imp_' + slot + '_' + Math.random().toString(36).slice(2, 8),
      name: item.n,
      icon: item.i,
      slot: item.s,
      tier: item.t || 1,
      stats: item.st || {},
      weaponType: item.wt || undefined,
      armorType: item.at || undefined,
      hand: item.h || undefined,
    };
  }
  return result;
}

function serializeHero(hero) {
  return {
    n: hero.name,
    r: hero.raceId,
    c: hero.classId,
    l: hero.level,
    a: hero.attributePoints || hero.baseAttributePoints || {},
    e: serializeEquipment(hero.equipment),
    sk: hero.unlockedSkills && Object.keys(hero.unlockedSkills).length > 0
      ? hero.unlockedSkills : undefined,
    lo: hero.abilityLoadout || undefined,
  };
}

function deserializeHero(data) {
  return {
    name: data.n,
    raceId: data.r,
    classId: data.c,
    level: data.l,
    attributePoints: data.a,
    equipment: deserializeEquipment(data.e),
    unlockedSkills: data.sk || {},
    abilityLoadout: data.lo || null,
  };
}

export async function encodeGrudaShare(heroes) {
  const payload = heroes.map(serializeHero);
  const json = JSON.stringify(payload);
  const compressed = compressToBase64Url(json);
  const hash = await hashPayload(json);
  return `${SHARE_VERSION}.${compressed}.${hash}`;
}

export function decodeGrudaShare(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid share token format');
  const [version, compressed, hash] = parts;
  if (parseInt(version) !== SHARE_VERSION) throw new Error('Unsupported share version');
  const json = decompressFromBase64Url(compressed);
  const payload = JSON.parse(json);
  if (!Array.isArray(payload)) throw new Error('Invalid share data');
  return payload.map(deserializeHero);
}

export function generateShareUrl(token) {
  return `${window.location.origin}/api/play/gruda.html?s=${token}`;
}

export function generateShareCode(token) {
  return `GW2:${token}`;
}
