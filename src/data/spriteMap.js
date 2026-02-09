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
  'demon-sword': {
    folder: 'demon-sword',
    frameWidth: 64,
    frameHeight: 64,
    idle: { src: '/sprites/demon-sword/idle.png', frames: 13 },
    walk: { src: '/sprites/demon-sword/walk.png', frames: 7 },
    attack1: { src: '/sprites/demon-sword/attack1.png', frames: 15 },
    attack2: { src: '/sprites/demon-sword/attack2.png', frames: 13 },
    attack3: { src: '/sprites/demon-sword/attack3.png', frames: 27 },
    hurt: { src: '/sprites/demon-sword/hurt.png', frames: 14 },
    death: { src: '/sprites/demon-sword/death.png', frames: 3 },
    block: { src: '/sprites/demon-sword/block.png', frames: 17 },
  },
  'water-elemental': {
    folder: 'water-elemental',
    frameWidth: 256,
    frameHeight: 128,
    idle: { src: '/sprites/water-elemental/idle.png', frames: 2 },
    walk: { src: '/sprites/water-elemental/walk.png', frames: 2 },
    attack1: { src: '/sprites/water-elemental/attack1.png', frames: 1 },
    hurt: { src: '/sprites/water-elemental/hurt.png', frames: 1 },
    death: { src: '/sprites/water-elemental/death.png', frames: 1 },
  },
  'nature-elemental': {
    folder: 'nature-elemental',
    frameWidth: 256,
    frameHeight: 128,
    idle: { src: '/sprites/nature-elemental/idle.png', frames: 2 },
    walk: { src: '/sprites/nature-elemental/walk.png', frames: 2 },
    attack1: { src: '/sprites/nature-elemental/attack1.png', frames: 1 },
    hurt: { src: '/sprites/nature-elemental/hurt.png', frames: 1 },
    death: { src: '/sprites/nature-elemental/death.png', frames: 1 },
  },
};

export const raceClassSpriteMap = {
  human: {
    warrior: spriteSheets.knight,
    mage: spriteSheets.wizard,
    worge: { ...spriteSheets['orc-rider'], filter: 'hue-rotate(180deg) saturate(1.3) brightness(1.1)' },
    ranger: spriteSheets.archer,
  },
  orc: {
    warrior: spriteSheets['elite-orc'],
    mage: spriteSheets['orc-rider'],
    worge: { ...spriteSheets['armored-orc'], filter: 'hue-rotate(40deg) saturate(1.4) brightness(1.1)' },
    ranger: spriteSheets['armored-orc'],
  },
  elf: {
    warrior: spriteSheets.swordsman,
    mage: spriteSheets.wizard,
    worge: { ...spriteSheets.archer, filter: 'sepia(0.5) hue-rotate(60deg) saturate(1.6) brightness(1.1)' },
    ranger: spriteSheets.archer,
  },
  undead: {
    warrior: spriteSheets['greatsword-skeleton'],
    mage: { ...spriteSheets.wizard, filter: 'brightness(0.7) hue-rotate(120deg) saturate(1.5)' },
    worge: { ...spriteSheets['armored-skeleton'], filter: 'hue-rotate(260deg) saturate(1.3) brightness(1.2)' },
    ranger: spriteSheets['skeleton-archer'],
  },
  barbarian: {
    warrior: spriteSheets['knight-templar'],
    mage: spriteSheets.priest,
    worge: { ...spriteSheets['armored-axeman'], filter: 'hue-rotate(20deg) saturate(1.5) brightness(1.15)' },
    ranger: spriteSheets.soldier,
  },
  dwarf: {
    warrior: spriteSheets['armored-axeman'],
    mage: spriteSheets.priest,
    worge: { ...spriteSheets['knight-templar'], filter: 'hue-rotate(150deg) saturate(1.4) brightness(1.1)' },
    ranger: spriteSheets.lancer,
  },
};

export const warriorTransformSprite = spriteSheets['demon-sword'];

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
  water_elemental: spriteSheets['water-elemental'],
  nature_elemental: spriteSheets['nature-elemental'],
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
  hitEffect1: { src: '/effects/hit_effect_1.png', cols: 7, rows: 1, frameW: 48, frameH: 48, frames: 7 },
  hitEffect2: { src: '/effects/hit_effect_2.png', cols: 7, rows: 1, frameW: 48, frameH: 48, frames: 7 },
  hitEffect3: { src: '/effects/hit_effect_3.png', cols: 7, rows: 1, frameW: 48, frameH: 48, frames: 7 },
  fireExplosion: { src: '/effects/fire_explosion.png', cols: 4, rows: 4, frameW: 64, frameH: 64, frames: 16 },
  fireExplosion2: { src: '/effects/fire_explosion_2.png', cols: 18, rows: 1, frameW: 48, frameH: 48, frames: 18 },
  thunderHit: { src: '/effects/thunder_hit.png', cols: 6, rows: 1, frameW: 32, frameH: 32, frames: 6 },
  thunderProjectile: { src: '/effects/thunder_projectile.png', cols: 5, rows: 1, frameW: 32, frameH: 32, frames: 5 },
  thunderProjectile2: { src: '/effects/thunder_projectile_2.png', cols: 16, rows: 1, frameW: 48, frameH: 48, frames: 16 },
  holyImpact: { src: '/effects/holy_impact.png', cols: 7, rows: 1, frameW: 32, frameH: 32, frames: 7 },
  holyRepeatable: { src: '/effects/holy_repeatable.png', cols: 8, rows: 1, frameW: 32, frameH: 32, frames: 8 },
  holyVfx: { src: '/effects/holy_vfx_02.png', cols: 16, rows: 1, frameW: 48, frameH: 48, frames: 16 },
  windBreath: { src: '/effects/wind_breath.png', cols: 18, rows: 1, frameW: 32, frameH: 32, frames: 18 },
  windHit: { src: '/effects/wind_hit.png', cols: 3, rows: 2, frameW: 32, frameH: 32, frames: 6 },
  windProjectile: { src: '/effects/wind_projectile.png', cols: 3, rows: 2, frameW: 32, frameH: 32, frames: 6 },
};

export const beamTrails = {
  green: '/effects/beams/beam_green.png',
  orange: '/effects/beams/beam_orange.png',
  purple: '/effects/beams/beam_purple.png',
  red: '/effects/beams/beam_red.png',
};

export const enemyAbilityEffects = {
  'Shadow Bolt': { effect: 'midnight', beam: 'purple' },
  'Dark Nova': { effect: 'felSpell', beam: 'purple' },
  'Drain Life': { effect: 'nebula', beam: 'purple' },
  'Fire Breath': { effect: 'fireExplosion', beam: 'orange' },
  'Hellfire': { effect: 'fireExplosion2', beam: 'orange' },
  'Meteor': { effect: 'fireExplosion', beam: 'red' },
  'Soul Bolt': { effect: 'holyImpact', beam: 'purple' },
  'Death Coil': { effect: 'thunderHit', beam: 'purple' },
  'Doom Strike': { effect: 'hitEffect1', beam: 'red' },
  'Ground Pound': { effect: 'hitEffect2', beam: null },
  'Void Blast': { effect: 'thunderProjectile2', beam: 'purple' },
  'Annihilate': { effect: 'fireExplosion2', beam: 'red' },
  'Reality Tear': { effect: 'felSpell', beam: 'purple' },
  'Tidal Strike': { effect: 'freezing', beam: 'purple' },
  'Torrent': { effect: 'thunderProjectile2', beam: 'purple' },
  'Tsunami': { effect: 'fireExplosion', beam: 'purple' },
  'Vine Lash': { effect: 'windHit', beam: 'green' },
  "Nature's Wrath": { effect: 'windBreath', beam: 'green' },
  'Earthquake': { effect: 'hitEffect2', beam: null },
};

export const abilityEffectMap = {
  warrior: {
    'Slash': { effect: 'slash', beam: null, anim: 'attack1' },
    'Power Strike': { effect: 'hitEffect1', beam: null, anim: 'attack2' },
    'War Cry': { effect: 'holyVfx', beam: null, anim: 'block' },
    'Shield Bash': { effect: 'hitEffect2', beam: null, anim: 'attack3' },
    'Cleave': { effect: 'fireExplosion2', beam: null, anim: 'attack3' },
    'Demon Blade': { effect: 'fireExplosion', beam: 'red', anim: 'block' },
  },
  mage: {
    'Arcane Bolt': { effect: 'holyImpact', beam: 'purple', anim: 'attack1' },
    'Fireball': { effect: 'fireExplosion', beam: 'orange', anim: 'attack1' },
    'Divine Heal': { effect: 'healEffect', beam: null, anim: 'heal' },
    'Ice Storm': { effect: 'freezing', beam: 'purple', anim: 'attack1' },
    'Mana Shield': { effect: 'holyRepeatable', beam: null, anim: 'block' },
  },
  worge: {
    'Mace Strike': { effect: 'hitEffect3', beam: null, anim: 'attack1' },
    'Lightning Lash': { effect: 'thunderHit', beam: 'orange', anim: 'attack2' },
    "Nature's Grasp": { effect: 'healEffect', beam: null, anim: 'block' },
    'Dagger Toss': { effect: 'windHit', beam: 'green', anim: 'attack3' },
    'Bear Form': { effect: 'holyVfx', beam: null, anim: 'block' },
    'Maul': { effect: 'slashHit', beam: null, anim: 'attack1' },
    "Nature's Taunt": { effect: 'holyVfx', beam: null, anim: 'block' },
    'Worge Charge': { effect: 'hitEffect1', beam: null, anim: 'attack2' },
    'Revert Form': { effect: 'holyVfx', beam: null, anim: 'block' },
  },
  ranger: {
    'Quick Shot': { effect: 'windProjectile', beam: 'green', anim: 'attack1' },
    'Aimed Shot': { effect: 'hitEffect1', beam: 'red', anim: 'attack2' },
    'Poison Arrow': { effect: 'windBreath', beam: 'green', anim: 'attack1' },
    'Evasive Roll': { effect: 'windBreath', beam: null, anim: 'block' },
    'Arrow Volley': { effect: 'thunderProjectile2', beam: 'green', anim: 'attack2' },
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
  if (classId === 'worge' && abilityName.endsWith(' Form') && classEffects?.['Revert Form']) {
    return classEffects['Revert Form'];
  }
  if (enemyAbilityEffects[abilityName]) return enemyAbilityEffects[abilityName];
  return { effect: 'weaponHit', beam: null };
}
