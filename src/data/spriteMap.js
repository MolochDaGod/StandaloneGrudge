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
  worg: {
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

export const enemySpriteMap = {
  goblin: {
    folder: 'slime',
    idle: { src: '/sprites/slime/idle.png', frames: 6 },
    attack1: { src: '/sprites/slime/attack1.png', frames: 6 },
    attack2: { src: '/sprites/slime/attack2.png', frames: 12 },
    hurt: { src: '/sprites/slime/hurt.png', frames: 4 },
    death: { src: '/sprites/slime/death.png', frames: 4 },
  },
  skeleton: {
    folder: 'skeleton',
    idle: { src: '/sprites/skeleton/idle.png', frames: 6 },
    attack1: { src: '/sprites/skeleton/attack1.png', frames: 6 },
    attack2: { src: '/sprites/skeleton/attack2.png', frames: 7 },
    hurt: { src: '/sprites/skeleton/hurt.png', frames: 4 },
    death: { src: '/sprites/skeleton/death.png', frames: 4 },
  },
  wolf: {
    folder: 'werewolf',
    idle: { src: '/sprites/werewolf/idle.png', frames: 6 },
    attack1: { src: '/sprites/werewolf/attack1.png', frames: 9 },
    attack2: { src: '/sprites/werewolf/attack2.png', frames: 13 },
    hurt: { src: '/sprites/werewolf/hurt.png', frames: 4 },
    death: { src: '/sprites/werewolf/death.png', frames: 4 },
  },
  dark_mage: {
    folder: 'wizard',
    idle: { src: '/sprites/wizard/idle.png', frames: 6 },
    attack1: { src: '/sprites/wizard/attack1.png', frames: 6 },
    attack2: { src: '/sprites/wizard/attack2.png', frames: 6 },
    hurt: { src: '/sprites/wizard/hurt.png', frames: 4 },
    death: { src: '/sprites/wizard/death.png', frames: 4 },
  },
  orc: {
    folder: 'orc',
    idle: { src: '/sprites/orc/idle.png', frames: 6 },
    attack1: { src: '/sprites/orc/attack1.png', frames: 6 },
    attack2: { src: '/sprites/orc/attack2.png', frames: 6 },
    hurt: { src: '/sprites/orc/hurt.png', frames: 4 },
    death: { src: '/sprites/orc/death.png', frames: 4 },
  },
  dragon_whelp: {
    folder: 'werebear',
    idle: { src: '/sprites/werebear/idle.png', frames: 6 },
    attack1: { src: '/sprites/werebear/attack1.png', frames: 9 },
    attack2: { src: '/sprites/werebear/attack2.png', frames: 13 },
    hurt: { src: '/sprites/werebear/hurt.png', frames: 4 },
    death: { src: '/sprites/werebear/death.png', frames: 4 },
  },
  lich: {
    folder: 'armored-skeleton',
    idle: { src: '/sprites/armored-skeleton/idle.png', frames: 6 },
    attack1: { src: '/sprites/armored-skeleton/attack1.png', frames: 8 },
    attack2: { src: '/sprites/armored-skeleton/attack2.png', frames: 9 },
    hurt: { src: '/sprites/armored-skeleton/hurt.png', frames: 4 },
    death: { src: '/sprites/armored-skeleton/death.png', frames: 4 },
  },
  demon_lord: {
    folder: 'knight-templar',
    idle: { src: '/sprites/knight-templar/idle.png', frames: 6 },
    attack1: { src: '/sprites/knight-templar/attack1.png', frames: 7 },
    attack2: { src: '/sprites/knight-templar/attack2.png', frames: 8 },
    hurt: { src: '/sprites/knight-templar/hurt.png', frames: 4 },
    death: { src: '/sprites/knight-templar/death.png', frames: 4 },
  },
  void_king: {
    folder: 'swordsman',
    idle: { src: '/sprites/swordsman/idle.png', frames: 6 },
    attack1: { src: '/sprites/swordsman/attack1.png', frames: 7 },
    attack2: { src: '/sprites/swordsman/attack2.png', frames: 15 },
    hurt: { src: '/sprites/swordsman/hurt.png', frames: 5 },
    death: { src: '/sprites/swordsman/death.png', frames: 4 },
  },
};

export const raceClassSpriteMap = {
  human: {
    warrior: classSpriteMap.warrior,
    mage: classSpriteMap.mage,
    worg: classSpriteMap.worg,
    ranger: classSpriteMap.ranger,
  },
  orc: {
    warrior: {
      folder: 'orc',
      idle: { src: '/sprites/orc/idle.png', frames: 6 },
      attack1: { src: '/sprites/orc/attack1.png', frames: 6 },
      attack2: { src: '/sprites/orc/attack2.png', frames: 6 },
      hurt: { src: '/sprites/orc/hurt.png', frames: 4 },
      death: { src: '/sprites/orc/death.png', frames: 4 },
    },
    mage: classSpriteMap.mage,
    worg: classSpriteMap.worg,
    ranger: {
      folder: 'elite-orc',
      idle: { src: '/sprites/elite-orc/idle.png', frames: 6 },
      attack1: { src: '/sprites/elite-orc/attack1.png', frames: 7 },
      attack2: { src: '/sprites/elite-orc/attack2.png', frames: 11 },
      hurt: { src: '/sprites/elite-orc/hurt.png', frames: 4 },
      death: { src: '/sprites/elite-orc/death.png', frames: 4 },
    },
  },
  elf: {
    warrior: classSpriteMap.warrior,
    mage: {
      folder: 'wizard',
      idle: { src: '/sprites/wizard/idle.png', frames: 6 },
      attack1: { src: '/sprites/wizard/attack1.png', frames: 6 },
      attack2: { src: '/sprites/wizard/attack2.png', frames: 6 },
      hurt: { src: '/sprites/wizard/hurt.png', frames: 4 },
      death: { src: '/sprites/wizard/death.png', frames: 4 },
    },
    worg: classSpriteMap.worg,
    ranger: classSpriteMap.ranger,
  },
  undead: {
    warrior: {
      folder: 'skeleton',
      idle: { src: '/sprites/skeleton/idle.png', frames: 6 },
      attack1: { src: '/sprites/skeleton/attack1.png', frames: 6 },
      attack2: { src: '/sprites/skeleton/attack2.png', frames: 7 },
      hurt: { src: '/sprites/skeleton/hurt.png', frames: 4 },
      death: { src: '/sprites/skeleton/death.png', frames: 4 },
    },
    mage: {
      folder: 'armored-skeleton',
      idle: { src: '/sprites/armored-skeleton/idle.png', frames: 6 },
      attack1: { src: '/sprites/armored-skeleton/attack1.png', frames: 8 },
      attack2: { src: '/sprites/armored-skeleton/attack2.png', frames: 9 },
      hurt: { src: '/sprites/armored-skeleton/hurt.png', frames: 4 },
      death: { src: '/sprites/armored-skeleton/death.png', frames: 4 },
    },
    worg: classSpriteMap.worg,
    ranger: classSpriteMap.ranger,
  },
  barbarian: {
    warrior: {
      folder: 'swordsman',
      idle: { src: '/sprites/swordsman/idle.png', frames: 6 },
      attack1: { src: '/sprites/swordsman/attack1.png', frames: 7 },
      attack2: { src: '/sprites/swordsman/attack2.png', frames: 15 },
      hurt: { src: '/sprites/swordsman/hurt.png', frames: 5 },
      death: { src: '/sprites/swordsman/death.png', frames: 4 },
    },
    mage: classSpriteMap.mage,
    worg: {
      folder: 'werewolf',
      idle: { src: '/sprites/werewolf/idle.png', frames: 6 },
      attack1: { src: '/sprites/werewolf/attack1.png', frames: 9 },
      attack2: { src: '/sprites/werewolf/attack2.png', frames: 13 },
      hurt: { src: '/sprites/werewolf/hurt.png', frames: 4 },
      death: { src: '/sprites/werewolf/death.png', frames: 4 },
    },
    ranger: {
      folder: 'werebear',
      idle: { src: '/sprites/werebear/idle.png', frames: 6 },
      attack1: { src: '/sprites/werebear/attack1.png', frames: 9 },
      attack2: { src: '/sprites/werebear/attack2.png', frames: 13 },
      hurt: { src: '/sprites/werebear/hurt.png', frames: 4 },
      death: { src: '/sprites/werebear/death.png', frames: 4 },
    },
  },
  dwarf: {
    warrior: {
      folder: 'knight-templar',
      idle: { src: '/sprites/knight-templar/idle.png', frames: 6 },
      attack1: { src: '/sprites/knight-templar/attack1.png', frames: 7 },
      attack2: { src: '/sprites/knight-templar/attack2.png', frames: 8 },
      hurt: { src: '/sprites/knight-templar/hurt.png', frames: 4 },
      death: { src: '/sprites/knight-templar/death.png', frames: 4 },
    },
    mage: classSpriteMap.mage,
    worg: classSpriteMap.worg,
    ranger: classSpriteMap.ranger,
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

export function getEnemySprite(templateId) {
  return enemySpriteMap[templateId] || enemySpriteMap.goblin;
}
