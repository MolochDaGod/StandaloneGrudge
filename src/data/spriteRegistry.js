import {
  classSpriteMap, spriteSheets, raceClassSpriteMap, enemySpriteMap,
  racalvinSprite, racalvinWorgSprite, namedHeroes,
  warriorTransformSprite, worgTransformSprite, worgBearTransformSprite,
  eliteTransformSprites, nightborneSprite, leafRangerSprite, crystalMaulerSprite,
  effectSprites, beamTrails, projectileSprites, buffVisuals, weaponVisuals,
} from './spriteMap';

const META_KEYS = new Set([
  'frameWidth', 'frameHeight', 'filter', 'facesLeft', 'showGuideGrid',
  'tint', 'blendMode', 'dwarfScale', 'dwarfTransform', 'name', 'src',
  'category', 'folder', 'scale', 'ally', 'speed', 'color', 'glow',
  'width', 'height', 'offsetX', 'offsetY', 'type', 'image',
]);

function getAnimationKeys(spriteData) {
  if (!spriteData) return [];
  return Object.keys(spriteData).filter(k => !META_KEYS.has(k) && spriteData[k]?.frames != null);
}

function countTotalFrames(spriteData) {
  return getAnimationKeys(spriteData).reduce((sum, k) => sum + (spriteData[k]?.frames || 0), 0);
}

function capitalize(str) {
  if (!str) return '';
  return str.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function makeEntry(uid, name, category, subCategory, tags, spriteData, extraFolder) {
  const anims = getAnimationKeys(spriteData);
  return {
    uid,
    name,
    category,
    subCategory,
    tags,
    spriteData,
    frameWidth: spriteData.frameWidth || 100,
    frameHeight: spriteData.frameHeight || 100,
    animationCount: anims.length,
    totalFrames: countTotalFrames(spriteData),
    animations: anims,
    folder: spriteData.folder || extraFolder || uid,
    hasFilter: !!spriteData.filter,
    hasCustomScale: !!spriteData.scale,
    facesLeft: !!spriteData.facesLeft,
  };
}

const RACES = ['human', 'orc', 'elf', 'undead', 'barbarian', 'dwarf'];
const CLASSES = ['warrior', 'mage', 'worge', 'ranger'];

function buildRegistry() {
  const entries = [];
  const seen = new Set();

  function add(entry) {
    if (seen.has(entry.uid)) return;
    seen.add(entry.uid);
    entries.push(entry);
  }

  for (const race of RACES) {
    for (const cls of CLASSES) {
      const spriteData = raceClassSpriteMap[race]?.[cls];
      if (!spriteData) continue;
      add(makeEntry(
        `hero_${race}_${cls}`,
        `${capitalize(race)} ${capitalize(cls)}`,
        'hero', race,
        ['playable', race, cls, 'hero'],
        spriteData, `${race}-${cls}`
      ));
    }
  }

  for (const [key, spriteData] of Object.entries(enemySpriteMap)) {
    if (!spriteData) continue;
    const isBoss = key.includes('boss') || key === 'evil_wizard' || key === 'abyssal_demon' || key === 'eldritch_horror' || key === 'frost_titan';
    const cat = isBoss ? 'boss' : 'enemy';
    add(makeEntry(
      `${cat}_${key}`,
      capitalize(key),
      cat, isBoss ? 'boss' : 'mob',
      [cat, 'combat', key],
      spriteData, key
    ));
  }

  for (const [key, spriteData] of Object.entries(spriteSheets)) {
    if (!spriteData) continue;
    const alreadyMapped = entries.some(e => e.spriteData === spriteData);
    if (alreadyMapped) continue;
    const isNpc = !!spriteData.ally;
    const cat = isNpc ? 'npc' : 'sheet';
    add(makeEntry(
      `${cat}_${key.replace(/[^a-z0-9_]/g, '_')}`,
      capitalize(key),
      cat, isNpc ? 'ally' : 'asset',
      ['spritesheet', key, isNpc ? 'npc' : 'asset'],
      spriteData, key
    ));
  }

  if (eliteTransformSprites) {
    for (const [cls, raceMap] of Object.entries(eliteTransformSprites)) {
      if (!raceMap) continue;
      for (const [race, spriteData] of Object.entries(raceMap)) {
        if (!spriteData) continue;
        add(makeEntry(
          `transform_elite_${race}_${cls}`,
          `Elite ${capitalize(race)} ${capitalize(cls)}`,
          'transform', 'elite',
          ['transform', 'elite', race, cls],
          spriteData, `elite-${race}-${cls}`
        ));
      }
    }
  }

  if (worgTransformSprite) {
    for (const [race, spriteData] of Object.entries(worgTransformSprite)) {
      if (!spriteData) continue;
      add(makeEntry(
        `transform_worg_${race}`,
        `Worg Form (${capitalize(race)})`,
        'transform', 'worg',
        ['transform', 'worg', race, 'worge'],
        spriteData, `worg-${race}`
      ));
    }
  }

  if (worgBearTransformSprite) {
    for (const [race, spriteData] of Object.entries(worgBearTransformSprite)) {
      if (!spriteData) continue;
      add(makeEntry(
        `transform_worgbear_${race}`,
        `Worg Bear Form (${capitalize(race)})`,
        'transform', 'worgbear',
        ['transform', 'worgbear', race, 'worge'],
        spriteData, `worgbear-${race}`
      ));
    }
  }

  if (warriorTransformSprite) {
    add(makeEntry(
      'transform_warrior_demon',
      'Warrior Demon Transform',
      'transform', 'warrior',
      ['transform', 'warrior', 'demon-sword'],
      warriorTransformSprite, 'demon-sword'
    ));
  }

  if (nightborneSprite) {
    add(makeEntry(
      'transform_nightborne',
      'Nightborne',
      'transform', 'elite',
      ['transform', 'elite', 'nightborne', 'worge'],
      nightborneSprite, 'nightborne'
    ));
  }

  if (leafRangerSprite) {
    add(makeEntry(
      'transform_leaf_ranger',
      'Leaf Ranger',
      'transform', 'elite',
      ['transform', 'elite', 'leaf-ranger', 'ranger'],
      leafRangerSprite, 'leaf-ranger'
    ));
  }

  if (crystalMaulerSprite) {
    add(makeEntry(
      'transform_crystal_mauler',
      'Crystal Mauler',
      'transform', 'elite',
      ['transform', 'elite', 'crystal-mauler', 'warrior'],
      crystalMaulerSprite, 'crystal-mauler'
    ));
  }

  if (racalvinSprite) {
    add(makeEntry(
      'secret_racalvin',
      'Racalvin the Pirate King',
      'secret', 'named',
      ['secret', 'named', 'pirate', 'racalvin', 'barbarian', 'worge'],
      racalvinSprite, 'pirate-captain'
    ));
  }

  if (racalvinWorgSprite) {
    add(makeEntry(
      'secret_racalvin_worg',
      'Racalvin Worg Form',
      'secret', 'named',
      ['secret', 'named', 'pirate', 'racalvin', 'worg'],
      racalvinWorgSprite, 'werewolf'
    ));
  }

  if (namedHeroes) {
    for (const [heroId, heroData] of Object.entries(namedHeroes)) {
      if (!heroData?.spriteData || heroId === 'racalvin') continue;
      add(makeEntry(
        `secret_${heroId}`,
        heroData.name || capitalize(heroId),
        'secret', 'named',
        ['secret', 'named', heroId],
        heroData.spriteData, heroId
      ));
    }
  }

  for (const [key, spriteData] of Object.entries(effectSprites)) {
    if (!spriteData) continue;
    const anims = getAnimationKeys(spriteData);
    if (anims.length === 0 && spriteData.frames != null) {
      add({
        uid: `effect_${key}`,
        name: capitalize(key),
        category: 'effect',
        subCategory: 'vfx',
        tags: ['effect', 'vfx', key],
        spriteData,
        frameWidth: spriteData.frameWidth || 100,
        frameHeight: spriteData.frameHeight || 100,
        animationCount: 1,
        totalFrames: spriteData.frames || 0,
        animations: ['default'],
        folder: spriteData.folder || key,
        hasFilter: !!spriteData.filter,
        hasCustomScale: !!spriteData.scale,
        facesLeft: false,
      });
    } else if (anims.length > 0) {
      add(makeEntry(
        `effect_${key}`,
        capitalize(key),
        'effect', 'vfx',
        ['effect', 'vfx', key],
        spriteData, key
      ));
    }
  }

  for (const [key, data] of Object.entries(projectileSprites)) {
    if (!data) continue;
    add({
      uid: `effect_proj_${key}`,
      name: capitalize(key),
      category: 'effect',
      subCategory: 'projectile',
      tags: ['effect', 'projectile', key],
      spriteData: data,
      frameWidth: data.frameWidth || data.width || 32,
      frameHeight: data.frameHeight || data.height || 32,
      animationCount: data.frames ? 1 : 0,
      totalFrames: data.frames || 0,
      animations: data.frames ? ['default'] : [],
      folder: key,
      hasFilter: !!data.filter,
      hasCustomScale: !!data.scale,
      facesLeft: false,
    });
  }

  for (const [key, data] of Object.entries(buffVisuals)) {
    if (!data) continue;
    add({
      uid: `effect_buff_${key}`,
      name: capitalize(key),
      category: 'effect',
      subCategory: 'buff',
      tags: ['effect', 'buff', key],
      spriteData: data,
      frameWidth: data.frameWidth || data.width || 64,
      frameHeight: data.frameHeight || data.height || 64,
      animationCount: 0,
      totalFrames: 0,
      animations: [],
      folder: key,
      hasFilter: !!data.filter,
      hasCustomScale: !!data.scale,
      facesLeft: false,
    });
  }

  for (const [key, data] of Object.entries(weaponVisuals)) {
    if (!data) continue;
    add({
      uid: `effect_weapon_${key}`,
      name: capitalize(key),
      category: 'effect',
      subCategory: 'weapon',
      tags: ['effect', 'weapon', key],
      spriteData: data,
      frameWidth: data.frameWidth || data.width || 64,
      frameHeight: data.frameHeight || data.height || 64,
      animationCount: 0,
      totalFrames: 0,
      animations: [],
      folder: key,
      hasFilter: !!data.filter,
      hasCustomScale: !!data.scale,
      facesLeft: false,
    });
  }

  for (const [key, src] of Object.entries(beamTrails)) {
    if (!src) continue;
    add({
      uid: `effect_beam_${key}`,
      name: capitalize(key),
      category: 'effect',
      subCategory: 'beam',
      tags: ['effect', 'beam', key],
      spriteData: { src },
      frameWidth: 0,
      frameHeight: 0,
      animationCount: 0,
      totalFrames: 0,
      animations: [],
      folder: key,
      hasFilter: false,
      hasCustomScale: false,
      facesLeft: false,
    });
  }

  return entries;
}

export const SPRITE_REGISTRY = buildRegistry();

export const CATEGORY_META = {
  hero:      { label: 'Heroes',     color: '#3b82f6', icon: 'S' },
  enemy:     { label: 'Enemies',    color: '#ef4444', icon: 'E' },
  boss:      { label: 'Bosses',     color: '#a855f7', icon: 'B' },
  transform: { label: 'Transforms', color: '#f59e0b', icon: 'T' },
  npc:       { label: 'NPCs',       color: '#22c55e', icon: 'N' },
  sheet:     { label: 'Sheets',     color: '#64748b', icon: 'A' },
  secret:    { label: 'Secret',     color: '#d4a017', icon: 'X' },
  effect:    { label: 'Effects',    color: '#06b6d4', icon: 'F' },
};

export function getRegistryEntry(uid) {
  return SPRITE_REGISTRY.find(e => e.uid === uid) || null;
}

export function searchRegistry(query) {
  const q = query.toLowerCase().trim();
  if (!q) return SPRITE_REGISTRY;
  return SPRITE_REGISTRY.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.uid.toLowerCase().includes(q) ||
    e.tags.some(t => t.includes(q)) ||
    e.category.includes(q) ||
    e.subCategory.includes(q)
  );
}

export function getByCategory(category) {
  return SPRITE_REGISTRY.filter(e => e.category === category);
}

export function getRegistryStats() {
  const cats = {};
  let totalAnims = 0;
  let totalFrames = 0;
  for (const e of SPRITE_REGISTRY) {
    cats[e.category] = (cats[e.category] || 0) + 1;
    totalAnims += e.animationCount;
    totalFrames += e.totalFrames;
  }
  return {
    total: SPRITE_REGISTRY.length,
    categories: cats,
    totalAnimations: totalAnims,
    totalFrames,
  };
}

export { getAnimationKeys, META_KEYS, capitalize };
