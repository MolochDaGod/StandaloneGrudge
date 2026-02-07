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
  },
  'elite-orc': {
    folder: 'elite-orc',
    idle: { src: '/sprites/elite-orc/idle.png', frames: 6 },
    attack1: { src: '/sprites/elite-orc/attack1.png', frames: 7 },
    attack2: { src: '/sprites/elite-orc/attack2.png', frames: 11 },
    hurt: { src: '/sprites/elite-orc/hurt.png', frames: 4 },
    death: { src: '/sprites/elite-orc/death.png', frames: 4 },
  },
  skeleton: {
    folder: 'skeleton',
    idle: { src: '/sprites/skeleton/idle.png', frames: 6 },
    attack1: { src: '/sprites/skeleton/attack1.png', frames: 6 },
    attack2: { src: '/sprites/skeleton/attack2.png', frames: 7 },
    hurt: { src: '/sprites/skeleton/hurt.png', frames: 4 },
    death: { src: '/sprites/skeleton/death.png', frames: 4 },
  },
  'armored-skeleton': {
    folder: 'armored-skeleton',
    idle: { src: '/sprites/armored-skeleton/idle.png', frames: 6 },
    attack1: { src: '/sprites/armored-skeleton/attack1.png', frames: 8 },
    attack2: { src: '/sprites/armored-skeleton/attack2.png', frames: 9 },
    hurt: { src: '/sprites/armored-skeleton/hurt.png', frames: 4 },
    death: { src: '/sprites/armored-skeleton/death.png', frames: 4 },
  },
  wizard: {
    folder: 'wizard',
    idle: { src: '/sprites/wizard/idle.png', frames: 6 },
    attack1: { src: '/sprites/wizard/attack1.png', frames: 6 },
    attack2: { src: '/sprites/wizard/attack2.png', frames: 6 },
    hurt: { src: '/sprites/wizard/hurt.png', frames: 4 },
    death: { src: '/sprites/wizard/death.png', frames: 4 },
  },
  swordsman: {
    folder: 'swordsman',
    idle: { src: '/sprites/swordsman/idle.png', frames: 6 },
    attack1: { src: '/sprites/swordsman/attack1.png', frames: 7 },
    attack2: { src: '/sprites/swordsman/attack2.png', frames: 15 },
    hurt: { src: '/sprites/swordsman/hurt.png', frames: 5 },
    death: { src: '/sprites/swordsman/death.png', frames: 4 },
  },
  werewolf: {
    folder: 'werewolf',
    idle: { src: '/sprites/werewolf/idle.png', frames: 6 },
    attack1: { src: '/sprites/werewolf/attack1.png', frames: 9 },
    attack2: { src: '/sprites/werewolf/attack2.png', frames: 13 },
    hurt: { src: '/sprites/werewolf/hurt.png', frames: 4 },
    death: { src: '/sprites/werewolf/death.png', frames: 4 },
  },
  werebear: {
    folder: 'werebear',
    idle: { src: '/sprites/werebear/idle.png', frames: 6 },
    attack1: { src: '/sprites/werebear/attack1.png', frames: 9 },
    attack2: { src: '/sprites/werebear/attack2.png', frames: 13 },
    hurt: { src: '/sprites/werebear/hurt.png', frames: 4 },
    death: { src: '/sprites/werebear/death.png', frames: 4 },
  },
  'skeleton-archer': {
    folder: 'skeleton-archer',
    idle: { src: '/sprites/skeleton-archer/idle.png', frames: 6 },
    attack1: { src: '/sprites/skeleton-archer/attack1.png', frames: 6 },
    attack2: { src: '/sprites/skeleton-archer/attack2.png', frames: 6 },
    hurt: { src: '/sprites/skeleton-archer/hurt.png', frames: 4 },
    death: { src: '/sprites/skeleton-archer/death.png', frames: 4 },
  },
  'armored-orc': {
    folder: 'armored-orc',
    idle: { src: '/sprites/armored-orc/idle.png', frames: 6 },
    attack1: { src: '/sprites/armored-orc/attack1.png', frames: 6 },
    attack2: { src: '/sprites/armored-orc/attack2.png', frames: 6 },
    hurt: { src: '/sprites/armored-orc/hurt.png', frames: 4 },
    death: { src: '/sprites/armored-orc/death.png', frames: 4 },
  },
  'knight-templar': {
    folder: 'knight-templar',
    idle: { src: '/sprites/knight-templar/idle.png', frames: 6 },
    attack1: { src: '/sprites/knight-templar/attack1.png', frames: 7 },
    attack2: { src: '/sprites/knight-templar/attack2.png', frames: 8 },
    hurt: { src: '/sprites/knight-templar/hurt.png', frames: 4 },
    death: { src: '/sprites/knight-templar/death.png', frames: 4 },
  },
};

export const raceClassSpriteMap = {
  human: {
    warrior: spriteSheets.knight,
    mage: spriteSheets.wizard,
    worge: spriteSheets.priest,
    ranger: spriteSheets.archer,
  },
  orc: {
    warrior: spriteSheets['elite-orc'],
    mage: spriteSheets['orc-rider'],
    worge: spriteSheets.orc,
    ranger: spriteSheets['armored-orc'],
  },
  elf: {
    warrior: { ...spriteSheets.swordsman, filter: 'brightness(1.3) sepia(0.3) saturate(0.8) hue-rotate(10deg)' },
    mage: spriteSheets.wizard,
    worge: { ...spriteSheets.priest, filter: 'brightness(1.3) sepia(0.3) saturate(0.8) hue-rotate(10deg)' },
    ranger: spriteSheets.archer,
  },
  undead: {
    warrior: spriteSheets['armored-skeleton'],
    mage: { ...spriteSheets.wizard, filter: 'invert(1) hue-rotate(180deg)' },
    worge: spriteSheets.skeleton,
    ranger: spriteSheets['skeleton-archer'],
  },
  barbarian: {
    warrior: spriteSheets['knight-templar'],
    mage: spriteSheets.priest,
    worge: spriteSheets.swordsman,
    ranger: spriteSheets.archer,
  },
  dwarf: {
    warrior: spriteSheets.knight,
    mage: spriteSheets.priest,
    worge: spriteSheets['knight-templar'],
    ranger: { ...spriteSheets.archer, filter: 'hue-rotate(-30deg) saturate(1.4) brightness(0.75)' },
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
  goblin: spriteSheets.orc,
  skeleton: spriteSheets.skeleton,
  wolf: spriteSheets.werewolf,
  dark_mage: spriteSheets.wizard,
  orc: spriteSheets.orc,
  dragon_whelp: spriteSheets.werebear,
  lich: spriteSheets['armored-skeleton'],
  demon_lord: spriteSheets['knight-templar'],
  void_king: spriteSheets.swordsman,
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
