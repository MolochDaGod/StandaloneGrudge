export const classSpriteMap = {
  warrior: {
    folder: 'knight',
    idle: { src: '/sprites/knight/idle.png', frames: 6 },
    attack1: { src: '/sprites/knight/attack1.png', frames: 7 },
    attack2: { src: '/sprites/knight/attack2.png', frames: 10 },
    attack3: { src: '/sprites/knight/attack3.png', frames: 11 },
    hurt: { src: '/sprites/knight/hurt.png', frames: 4 },
    death: { src: '/sprites/knight/death.png', frames: 4 },
    block: { src: '/sprites/knight/block.png', frames: 4 },
    walk: { src: '/sprites/knight/walk.png', frames: 8 },
  },
  mage: {
    folder: 'priest',
    idle: { src: '/sprites/priest/idle.png', frames: 6 },
    attack1: { src: '/sprites/priest/attack1.png', frames: 9 },
    heal: { src: '/sprites/priest/heal.png', frames: 6 },
    hurt: { src: '/sprites/priest/hurt.png', frames: 4 },
    death: { src: '/sprites/priest/death.png', frames: 4 },
    walk: { src: '/sprites/priest/walk.png', frames: 8 },
  },
  worge: {
    folder: 'orc-rider',
    idle: { src: '/sprites/orc-rider/idle.png', frames: 6 },
    attack1: { src: '/sprites/orc-rider/attack1.png', frames: 8 },
    attack2: { src: '/sprites/orc-rider/attack2.png', frames: 9 },
    attack3: { src: '/sprites/orc-rider/attack3.png', frames: 11 },
    hurt: { src: '/sprites/orc-rider/hurt.png', frames: 4 },
    death: { src: '/sprites/orc-rider/death.png', frames: 4 },
    block: { src: '/sprites/orc-rider/block.png', frames: 4 },
    walk: { src: '/sprites/orc-rider/walk.png', frames: 8 },
  },
  ranger: {
    folder: 'archer',
    idle: { src: '/sprites/archer/idle.png', frames: 6 },
    attack1: { src: '/sprites/archer/attack1.png', frames: 9 },
    attack2: { src: '/sprites/archer/attack2.png', frames: 12 },
    hurt: { src: '/sprites/archer/hurt.png', frames: 4 },
    death: { src: '/sprites/archer/death.png', frames: 4 },
    walk: { src: '/sprites/archer/walk.png', frames: 8 },
  },
};

const spriteSheets = {
  knight: classSpriteMap.warrior,
  priest: classSpriteMap.mage,
  'orc-rider': classSpriteMap.worge,
  archer: classSpriteMap.ranger,
  orc: {
    folder: 'orc',
    idle: { src: '/sprites/orc/idle.png', frames: 6 },
    attack1: { src: '/sprites/orc/attack1.png', frames: 6 },
    attack2: { src: '/sprites/orc/attack2.png', frames: 6 },
    hurt: { src: '/sprites/orc/hurt.png', frames: 4 },
    death: { src: '/sprites/orc/death.png', frames: 4 },
    walk: { src: '/sprites/orc/walk.png', frames: 8 },
  },
  'elite-orc': {
    folder: 'elite-orc',
    idle: { src: '/sprites/elite-orc/idle.png', frames: 6 },
    attack1: { src: '/sprites/elite-orc/attack1.png', frames: 7 },
    attack2: { src: '/sprites/elite-orc/attack2.png', frames: 11 },
    attack3: { src: '/sprites/elite-orc/attack3.png', frames: 9 },
    hurt: { src: '/sprites/elite-orc/hurt.png', frames: 4 },
    death: { src: '/sprites/elite-orc/death.png', frames: 4 },
    walk: { src: '/sprites/elite-orc/walk.png', frames: 8 },
  },
  skeleton: {
    folder: 'skeleton',
    idle: { src: '/sprites/skeleton/idle.png', frames: 6 },
    attack1: { src: '/sprites/skeleton/attack1.png', frames: 6 },
    attack2: { src: '/sprites/skeleton/attack2.png', frames: 7 },
    block: { src: '/sprites/skeleton/block.png', frames: 4 },
    hurt: { src: '/sprites/skeleton/hurt.png', frames: 4 },
    death: { src: '/sprites/skeleton/death.png', frames: 4 },
    walk: { src: '/sprites/skeleton/walk.png', frames: 8 },
  },
  'armored-skeleton': {
    folder: 'armored-skeleton',
    idle: { src: '/sprites/armored-skeleton/idle.png', frames: 6 },
    attack1: { src: '/sprites/armored-skeleton/attack1.png', frames: 8 },
    attack2: { src: '/sprites/armored-skeleton/attack2.png', frames: 9 },
    hurt: { src: '/sprites/armored-skeleton/hurt.png', frames: 4 },
    death: { src: '/sprites/armored-skeleton/death.png', frames: 4 },
    walk: { src: '/sprites/armored-skeleton/walk.png', frames: 8 },
  },
  wizard: {
    folder: 'wizard',
    idle: { src: '/sprites/wizard/idle.png', frames: 6 },
    attack1: { src: '/sprites/wizard/attack1.png', frames: 6 },
    attack2: { src: '/sprites/wizard/attack2.png', frames: 6 },
    hurt: { src: '/sprites/wizard/hurt.png', frames: 4 },
    death: { src: '/sprites/wizard/death.png', frames: 4 },
    walk: { src: '/sprites/wizard/walk.png', frames: 8 },
  },
  swordsman: {
    folder: 'swordsman',
    idle: { src: '/sprites/swordsman/idle.png', frames: 6 },
    attack1: { src: '/sprites/swordsman/attack1.png', frames: 7 },
    attack2: { src: '/sprites/swordsman/attack2.png', frames: 15 },
    attack3: { src: '/sprites/swordsman/attack3.png', frames: 12 },
    hurt: { src: '/sprites/swordsman/hurt.png', frames: 5 },
    death: { src: '/sprites/swordsman/death.png', frames: 4 },
    walk: { src: '/sprites/swordsman/walk.png', frames: 8 },
  },
  werewolf: {
    folder: 'werewolf',
    idle: { src: '/sprites/werewolf/idle.png', frames: 6 },
    attack1: { src: '/sprites/werewolf/attack1.png', frames: 9 },
    attack2: { src: '/sprites/werewolf/attack2.png', frames: 13 },
    hurt: { src: '/sprites/werewolf/hurt.png', frames: 4 },
    death: { src: '/sprites/werewolf/death.png', frames: 4 },
    walk: { src: '/sprites/werewolf/walk.png', frames: 8 },
  },
  werebear: {
    folder: 'werebear',
    idle: { src: '/sprites/werebear/idle.png', frames: 6 },
    attack1: { src: '/sprites/werebear/attack1.png', frames: 9 },
    attack2: { src: '/sprites/werebear/attack2.png', frames: 13 },
    attack3: { src: '/sprites/werebear/attack3.png', frames: 9 },
    hurt: { src: '/sprites/werebear/hurt.png', frames: 4 },
    death: { src: '/sprites/werebear/death.png', frames: 4 },
    walk: { src: '/sprites/werebear/walk.png', frames: 8 },
  },
  'greatsword-skeleton': {
    folder: 'greatsword-skeleton',
    idle: { src: '/sprites/greatsword-skeleton/idle.png', frames: 6 },
    attack1: { src: '/sprites/greatsword-skeleton/attack1.png', frames: 9 },
    attack2: { src: '/sprites/greatsword-skeleton/attack2.png', frames: 12 },
    attack3: { src: '/sprites/greatsword-skeleton/attack3.png', frames: 8 },
    hurt: { src: '/sprites/greatsword-skeleton/hurt.png', frames: 4 },
    death: { src: '/sprites/greatsword-skeleton/death.png', frames: 4 },
    walk: { src: '/sprites/greatsword-skeleton/walk.png', frames: 9 },
  },
  'skeleton-archer': {
    folder: 'skeleton-archer',
    idle: { src: '/sprites/skeleton-archer/idle.png', frames: 6 },
    attack1: { src: '/sprites/skeleton-archer/attack1.png', frames: 9 },
    hurt: { src: '/sprites/skeleton-archer/hurt.png', frames: 4 },
    death: { src: '/sprites/skeleton-archer/death.png', frames: 4 },
    walk: { src: '/sprites/skeleton-archer/walk.png', frames: 8 },
  },
  'armored-orc': {
    folder: 'armored-orc',
    idle: { src: '/sprites/armored-orc/idle.png', frames: 6 },
    attack1: { src: '/sprites/armored-orc/attack1.png', frames: 7 },
    attack2: { src: '/sprites/armored-orc/attack2.png', frames: 8 },
    attack3: { src: '/sprites/armored-orc/attack3.png', frames: 9 },
    block: { src: '/sprites/armored-orc/block.png', frames: 4 },
    hurt: { src: '/sprites/armored-orc/hurt.png', frames: 4 },
    death: { src: '/sprites/armored-orc/death.png', frames: 4 },
    walk: { src: '/sprites/armored-orc/walk.png', frames: 8 },
  },
  'knight-templar': {
    folder: 'knight-templar',
    idle: { src: '/sprites/knight-templar/idle.png', frames: 6 },
    attack1: { src: '/sprites/knight-templar/attack1.png', frames: 7 },
    attack2: { src: '/sprites/knight-templar/attack2.png', frames: 8 },
    attack3: { src: '/sprites/knight-templar/attack3.png', frames: 11 },
    block: { src: '/sprites/knight-templar/block.png', frames: 4 },
    hurt: { src: '/sprites/knight-templar/hurt.png', frames: 4 },
    death: { src: '/sprites/knight-templar/death.png', frames: 4 },
    walk: { src: '/sprites/knight-templar/walk.png', frames: 8 },
  },
  'armored-axeman': {
    folder: 'armored-axeman',
    idle: { src: '/sprites/armored-axeman/idle.png', frames: 6 },
    attack1: { src: '/sprites/armored-axeman/attack1.png', frames: 9 },
    attack2: { src: '/sprites/armored-axeman/attack2.png', frames: 9 },
    attack3: { src: '/sprites/armored-axeman/attack3.png', frames: 12 },
    hurt: { src: '/sprites/armored-axeman/hurt.png', frames: 4 },
    death: { src: '/sprites/armored-axeman/death.png', frames: 4 },
    walk: { src: '/sprites/armored-axeman/walk.png', frames: 8 },
  },
  lancer: {
    folder: 'lancer',
    idle: { src: '/sprites/lancer/idle.png', frames: 6 },
    attack1: { src: '/sprites/lancer/attack1.png', frames: 6 },
    attack2: { src: '/sprites/lancer/attack2.png', frames: 9 },
    attack3: { src: '/sprites/lancer/attack3.png', frames: 8 },
    hurt: { src: '/sprites/lancer/hurt.png', frames: 4 },
    death: { src: '/sprites/lancer/death.png', frames: 4 },
    walk: { src: '/sprites/lancer/walk.png', frames: 8 },
  },
  soldier: {
    folder: 'soldier',
    idle: { src: '/sprites/soldier/idle.png', frames: 6 },
    attack1: { src: '/sprites/soldier/attack1.png', frames: 6 },
    attack2: { src: '/sprites/soldier/attack2.png', frames: 6 },
    attack3: { src: '/sprites/soldier/attack3.png', frames: 9 },
    hurt: { src: '/sprites/soldier/hurt.png', frames: 4 },
    death: { src: '/sprites/soldier/death.png', frames: 4 },
    walk: { src: '/sprites/soldier/walk.png', frames: 8 },
  },
  slime: {
    folder: 'slime',
    idle: { src: '/sprites/slime/idle.png', frames: 6 },
    attack1: { src: '/sprites/slime/attack1.png', frames: 6 },
    attack2: { src: '/sprites/slime/attack2.png', frames: 12 },
    hurt: { src: '/sprites/slime/hurt.png', frames: 4 },
    death: { src: '/sprites/slime/death.png', frames: 4 },
    walk: { src: '/sprites/slime/walk.png', frames: 6 },
  },
};

export const raceClassSpriteMap = {
  human: {
    warrior: spriteSheets.knight,
    mage: spriteSheets.wizard,
    worge: spriteSheets.soldier,
    ranger: spriteSheets.archer,
  },
  orc: {
    warrior: spriteSheets['elite-orc'],
    mage: spriteSheets['orc-rider'],
    worge: spriteSheets.orc,
    ranger: spriteSheets['armored-orc'],
  },
  elf: {
    warrior: spriteSheets.swordsman,
    mage: spriteSheets.wizard,
    worge: spriteSheets.lancer,
    ranger: spriteSheets.archer,
  },
  undead: {
    warrior: spriteSheets['greatsword-skeleton'],
    mage: { ...spriteSheets.wizard, filter: 'brightness(0.7) hue-rotate(120deg) saturate(1.5)' },
    worge: spriteSheets.skeleton,
    ranger: spriteSheets['skeleton-archer'],
  },
  barbarian: {
    warrior: spriteSheets['knight-templar'],
    mage: spriteSheets.priest,
    worge: spriteSheets['armored-axeman'],
    ranger: spriteSheets.soldier,
  },
  dwarf: {
    warrior: spriteSheets['armored-axeman'],
    mage: spriteSheets.priest,
    worge: spriteSheets['knight-templar'],
    ranger: spriteSheets.lancer,
  },
};

export const worgTransformSprite = {
  human: spriteSheets.werewolf,
  orc: spriteSheets.werebear,
  elf: spriteSheets.werewolf,
  undead: spriteSheets.werewolf,
  barbarian: spriteSheets.werebear,
  dwarf: spriteSheets.werebear,
};

export const enemySpriteMap = {
  goblin: spriteSheets.slime,
  skeleton: spriteSheets.skeleton,
  wolf: spriteSheets.werewolf,
  dark_mage: spriteSheets.wizard,
  orc: spriteSheets['armored-orc'],
  dragon_whelp: spriteSheets.werebear,
  lich: spriteSheets['armored-skeleton'],
  demon_lord: spriteSheets['knight-templar'],
  void_king: spriteSheets.swordsman,
  elite_orc: spriteSheets['elite-orc'],
};

export const effectSprites = {
  magicSpell: { src: '/effects/pixel/1_magicspell_spritesheet.png', size: 900, frames: 81 },
  magic8: { src: '/effects/pixel/2_magic8_spritesheet.png', size: 800, frames: 64 },
  blueFire: { src: '/effects/pixel/3_bluefire_spritesheet.png', size: 800, frames: 64 },
  casting: { src: '/effects/pixel/4_casting_spritesheet.png', size: 900, frames: 81 },
  magickaHit: { src: '/effects/pixel/5_magickahit_spritesheet.png', size: 700, frames: 49 },
  flameLash: { src: '/effects/pixel/6_flamelash_spritesheet.png', size: 700, frames: 49 },
  fireSpin: { src: '/effects/pixel/7_firespin_spritesheet.png', size: 800, frames: 64 },
  protectionCircle: { src: '/effects/pixel/8_protectioncircle_spritesheet.png', size: 800, frames: 64 },
  brightFire: { src: '/effects/pixel/9_brightfire_spritesheet.png', size: 800, frames: 64 },
  weaponHit: { src: '/effects/pixel/10_weaponhit_spritesheet.png', size: 600, frames: 36 },
  fire: { src: '/effects/pixel/11_fire_spritesheet.png', size: 800, frames: 64 },
  nebula: { src: '/effects/pixel/12_nebula_spritesheet.png', size: 800, frames: 64 },
  vortex: { src: '/effects/pixel/13_vortex_spritesheet.png', size: 800, frames: 64 },
  phantom: { src: '/effects/pixel/14_phantom_spritesheet.png', size: 800, frames: 64 },
  sunburn: { src: '/effects/pixel/16_sunburn_spritesheet.png', size: 800, frames: 64 },
  felSpell: { src: '/effects/pixel/17_felspell_spritesheet.png', size: 1000, frames: 100 },
  midnight: { src: '/effects/pixel/18_midnight_spritesheet.png', size: 800, frames: 64 },
  freezing: { src: '/effects/pixel/19_freezing_spritesheet.png', size: 1000, frames: 100 },
  magicBubbles: { src: '/effects/pixel/20_magicbubbles_spritesheet.png', size: 800, frames: 64 },
  slash: { src: '/effects/slash_spritesheet.png', cols: 1, rows: 8, frameW: 64, frameH: 64, frames: 8 },
  healEffect: { src: '/effects/heal_spritesheet.png', cols: 4, rows: 4, frameW: 128, frameH: 128, frames: 16 },
};

export const beamTrails = {
  green: '/effects/beams/beam_green.png',
  orange: '/effects/beams/beam_orange.png',
  purple: '/effects/beams/beam_purple.png',
  red: '/effects/beams/beam_red.png',
};

export const abilityEffectMap = {
  warrior: {
    'Slash': { effect: 'slash', beam: null, anim: 'attack1' },
    'Power Strike': { effect: 'weaponHit', beam: null, anim: 'attack2' },
    'War Cry': { effect: 'brightFire', beam: null, anim: 'block' },
    'Shield Bash': { effect: 'flameLash', beam: null, anim: 'attack3' },
    'Cleave': { effect: 'fireSpin', beam: null, anim: 'attack3' },
  },
  mage: {
    'Arcane Bolt': { effect: 'magic8', beam: 'purple', anim: 'attack1' },
    'Fireball': { effect: 'fire', beam: 'orange', anim: 'attack1' },
    'Divine Heal': { effect: 'healEffect', beam: null, anim: 'heal' },
    'Ice Storm': { effect: 'freezing', beam: 'purple', anim: 'attack1' },
    'Mana Shield': { effect: 'protectionCircle', beam: null, anim: 'block' },
  },
  worge: {
    'Mace Strike': { effect: 'slash', beam: null, anim: 'attack1' },
    'Lightning Lash': { effect: 'brightFire', beam: 'orange', anim: 'attack2' },
    "Nature's Grasp": { effect: 'healEffect', beam: null, anim: 'block' },
    'Dagger Toss': { effect: 'magickaHit', beam: 'green', anim: 'attack3' },
    'Bear Form': { effect: 'vortex', beam: null, anim: 'block' },
  },
  ranger: {
    'Quick Shot': { effect: 'magickaHit', beam: 'green', anim: 'attack1' },
    'Aimed Shot': { effect: 'weaponHit', beam: 'red', anim: 'attack2' },
    'Poison Arrow': { effect: 'nebula', beam: 'green', anim: 'attack1' },
    'Evasive Roll': { effect: 'phantom', beam: null, anim: 'block' },
    'Arrow Volley': { effect: 'magicSpell', beam: 'green', anim: 'attack2' },
  },
};

export function getRaceClassSprite(raceId, classId) {
  const raceMap = raceClassSpriteMap[raceId];
  if (raceMap && raceMap[classId]) return raceMap[classId];
  return classSpriteMap[classId] || classSpriteMap.warrior;
}

export function getPlayerSprite(classId, raceId) {
  if (raceId) return getRaceClassSprite(raceId, classId);
  return classSpriteMap[classId] || classSpriteMap.warrior;
}

export function getWorgTransformSprite(raceId) {
  return worgTransformSprite[raceId] || spriteSheets.werewolf;
}

export function getEnemySprite(templateId) {
  return enemySpriteMap[templateId] || enemySpriteMap.goblin;
}

export function getAbilityEffect(classId, abilityName) {
  const classEffects = abilityEffectMap[classId];
  if (classEffects && classEffects[abilityName]) return classEffects[abilityName];
  return { effect: 'weaponHit', beam: null };
}
