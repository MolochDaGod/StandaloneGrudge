export const enemyTemplates = {
  goblin: {
    name: 'Goblin Scout', icon: '👺', color: '#84cc16',
    baseHealth: 80, baseDamage: 12, baseDefense: 5, baseMana: 20,
    xpReward: 15, goldReward: 8,
    abilities: [
      { id: 'scratch', name: 'Scratch', icon: '🔪', type: 'physical', damage: 1.0, description: 'A quick scratch' },
      { id: 'sneak_stab', name: 'Sneak Stab', icon: '🗡️', type: 'physical', damage: 1.8, cooldown: 3, description: 'A backstab attempt' },
    ]
  },
  skeleton: {
    name: 'Skeleton Warrior', icon: '💀', color: '#d4d4d8',
    baseHealth: 120, baseDamage: 18, baseDefense: 15, baseMana: 0,
    xpReward: 22, goldReward: 12,
    abilities: [
      { id: 'bone_strike', name: 'Bone Strike', icon: '🦴', type: 'physical', damage: 1.1, description: 'A bony slam' },
      { id: 'shield_block', name: 'Shield Block', icon: '🛡️', type: 'buff', damage: 0, cooldown: 4, description: 'Raises defense', effect: { stat: 'defense', flat: 20, duration: 2 } },
    ]
  },
  wolf: {
    name: 'Dire Wolf', icon: '🐺', color: '#78716c',
    baseHealth: 100, baseDamage: 22, baseDefense: 8, baseMana: 0,
    xpReward: 18, goldReward: 6,
    abilities: [
      { id: 'bite', name: 'Bite', icon: '🦷', type: 'physical', damage: 1.2, description: 'A savage bite' },
      { id: 'howl_buff', name: 'Feral Howl', icon: '🌙', type: 'buff', damage: 0, cooldown: 5, description: 'Increases damage', effect: { stat: 'damage', multiplier: 1.4, duration: 2 } },
    ]
  },
  dark_mage: {
    name: 'Dark Mage', icon: '🧙', color: '#7c3aed',
    baseHealth: 90, baseDamage: 25, baseDefense: 6, baseMana: 100,
    xpReward: 30, goldReward: 20,
    abilities: [
      { id: 'shadow_bolt', name: 'Shadow Bolt', icon: '🌑', type: 'magical', damage: 1.3, description: 'A bolt of dark energy' },
      { id: 'dark_nova', name: 'Dark Nova', icon: '💥', type: 'magical', damage: 2.2, cooldown: 3, description: 'An explosion of shadow' },
      { id: 'drain_life', name: 'Drain Life', icon: '💜', type: 'magical', damage: 0.8, cooldown: 4, description: 'Steals life force', drainPercent: 0.5 },
    ]
  },
  orc: {
    name: 'Orc Berserker', icon: '👹', color: '#65a30d',
    baseHealth: 180, baseDamage: 28, baseDefense: 20, baseMana: 0,
    xpReward: 35, goldReward: 18,
    abilities: [
      { id: 'smash', name: 'Smash', icon: '💪', type: 'physical', damage: 1.2, description: 'A powerful smash' },
      { id: 'berserk', name: 'Berserk', icon: '🔴', type: 'buff', damage: 0, cooldown: 5, description: 'Goes berserk', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'ground_pound', name: 'Ground Pound', icon: '⬇️', type: 'physical', damage: 1.8, cooldown: 3, description: 'Slams the ground' },
    ]
  },
  dragon_whelp: {
    name: 'Dragon Whelp', icon: '🐉', color: '#dc2626',
    baseHealth: 150, baseDamage: 30, baseDefense: 18, baseMana: 80,
    xpReward: 45, goldReward: 30,
    abilities: [
      { id: 'claw', name: 'Claw', icon: '🦎', type: 'physical', damage: 1.1, description: 'A claw swipe' },
      { id: 'fire_breath', name: 'Fire Breath', icon: '🔥', type: 'magical', damage: 2.0, cooldown: 3, description: 'Breathes fire' },
      { id: 'tail_whip', name: 'Tail Whip', icon: '💫', type: 'physical', damage: 1.5, cooldown: 2, description: 'A tail strike' },
    ]
  },
  lich: {
    name: 'Lich Lord', icon: '👻', color: '#6366f1',
    baseHealth: 200, baseDamage: 35, baseDefense: 15, baseMana: 200,
    xpReward: 60, goldReward: 45,
    abilities: [
      { id: 'soul_bolt', name: 'Soul Bolt', icon: '💀', type: 'magical', damage: 1.4, description: 'A bolt of soul energy' },
      { id: 'death_coil', name: 'Death Coil', icon: '☠️', type: 'magical', damage: 2.5, cooldown: 4, description: 'Devastating necrotic blast', drainPercent: 0.3 },
      { id: 'bone_shield', name: 'Bone Shield', icon: '🛡️', type: 'buff', damage: 0, cooldown: 5, description: 'Summons bone armor', effect: { stat: 'defense', flat: 30, duration: 3 } },
    ]
  },
  demon_lord: {
    name: 'Demon Lord', icon: '😈', color: '#b91c1c',
    baseHealth: 350, baseDamage: 45, baseDefense: 30, baseMana: 150,
    xpReward: 100, goldReward: 80,
    abilities: [
      { id: 'hellfire', name: 'Hellfire', icon: '🔥', type: 'magical', damage: 1.5, description: 'Infernal flames' },
      { id: 'doom_strike', name: 'Doom Strike', icon: '⚡', type: 'physical', damage: 2.8, cooldown: 4, description: 'A strike of pure doom' },
      { id: 'dark_ritual', name: 'Dark Ritual', icon: '🌑', type: 'buff', damage: 0, cooldown: 6, description: 'Dark power surge', effect: { stat: 'damage', multiplier: 1.5, duration: 3 } },
      { id: 'meteor', name: 'Meteor', icon: '☄️', type: 'magical', damage: 3.5, cooldown: 6, description: 'Calls down a meteor' },
    ]
  },
  void_king: {
    name: 'The Void King', icon: '👑', color: '#fbbf24',
    baseHealth: 500, baseDamage: 55, baseDefense: 40, baseMana: 300,
    xpReward: 200, goldReward: 150,
    abilities: [
      { id: 'void_slash', name: 'Void Slash', icon: '🌀', type: 'physical', damage: 1.6, description: 'A slash through reality' },
      { id: 'annihilate', name: 'Annihilate', icon: '💥', type: 'magical', damage: 3.0, cooldown: 4, description: 'Pure destruction' },
      { id: 'void_barrier', name: 'Void Barrier', icon: '🛡️', type: 'buff', damage: 0, cooldown: 6, description: 'Impenetrable shield', effect: { stat: 'defense', flat: 50, duration: 2 } },
      { id: 'reality_tear', name: 'Reality Tear', icon: '🕳️', type: 'magical', damage: 4.0, cooldown: 8, description: 'Tears reality asunder' },
    ]
  }
};

export const locations = [
  {
    id: 'verdant_plains',
    name: 'Verdant Plains',
    description: 'Peaceful grasslands on the edge of civilization. A good place to begin your journey.',
    levelRange: [1, 3],
    enemies: ['goblin', 'wolf'],
    bgGradient: 'linear-gradient(135deg, #1a472a 0%, #2d5a27 50%, #1a3a1a 100%)',
    icon: '🌿',
    unlocked: true,
    boss: null
  },
  {
    id: 'dark_forest',
    name: 'Dark Forest',
    description: 'Ancient trees block out the sun. Dangerous creatures lurk in every shadow.',
    levelRange: [3, 6],
    enemies: ['wolf', 'goblin', 'skeleton'],
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    icon: '🌲',
    unlocked: true,
    boss: null
  },
  {
    id: 'cursed_ruins',
    name: 'Cursed Ruins',
    description: 'The remnants of a fallen kingdom, now haunted by the undead and dark magic.',
    levelRange: [5, 9],
    enemies: ['skeleton', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #2d1b69 0%, #1a0a3e 50%, #0d0d2b 100%)',
    icon: '🏚️',
    unlocked: false,
    unlockLevel: 4,
    boss: null
  },
  {
    id: 'blood_canyon',
    name: 'Blood Canyon',
    description: 'A desolate ravine stained red by centuries of warfare. Orcs have made it their stronghold.',
    levelRange: [8, 12],
    enemies: ['orc', 'skeleton', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 50%, #1c0505 100%)',
    icon: '🏔️',
    unlocked: false,
    unlockLevel: 7,
    boss: null
  },
  {
    id: 'dragon_peaks',
    name: 'Dragon Peaks',
    description: 'Volcanic mountains where young dragons nest. The air burns with each breath.',
    levelRange: [11, 15],
    enemies: ['dragon_whelp', 'orc', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #92400e 0%, #78350f 50%, #451a03 100%)',
    icon: '🌋',
    unlocked: false,
    unlockLevel: 10,
    boss: null
  },
  {
    id: 'shadow_citadel',
    name: 'Shadow Citadel',
    description: 'A fortress of pure darkness. The Lich Lords command their undead armies from within.',
    levelRange: [14, 18],
    enemies: ['lich', 'dark_mage', 'dragon_whelp'],
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f0d2e 50%, #030318 100%)',
    icon: '🏰',
    unlocked: false,
    unlockLevel: 13,
    boss: 'lich'
  },
  {
    id: 'demon_gate',
    name: 'Demon Gate',
    description: 'The barrier between worlds grows thin here. Demons pour through the cracks in reality.',
    levelRange: [16, 19],
    enemies: ['demon_lord', 'lich', 'dragon_whelp'],
    bgGradient: 'linear-gradient(135deg, #4a0404 0%, #2d0000 50%, #1a0000 100%)',
    icon: '🌀',
    unlocked: false,
    unlockLevel: 15,
    boss: 'demon_lord'
  },
  {
    id: 'void_throne',
    name: 'The Void Throne',
    description: 'Beyond the edge of existence sits the Void King on his throne of nothingness. This is the final battle.',
    levelRange: [18, 20],
    enemies: ['demon_lord', 'void_king'],
    bgGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #000000 100%)',
    icon: '👑',
    unlocked: false,
    unlockLevel: 18,
    boss: 'void_king'
  }
];

export function createEnemy(templateId, playerLevel) {
  const template = enemyTemplates[templateId];
  if (!template) return null;

  const levelScale = 1 + (playerLevel * 0.15);
  return {
    id: templateId + '_' + Date.now(),
    templateId,
    name: template.name,
    icon: template.icon,
    color: template.color,
    maxHealth: Math.floor(template.baseHealth * levelScale),
    health: Math.floor(template.baseHealth * levelScale),
    damage: Math.floor(template.baseDamage * levelScale),
    defense: Math.floor(template.baseDefense * levelScale),
    mana: template.baseMana,
    maxMana: template.baseMana,
    abilities: template.abilities.map(a => ({ ...a, currentCooldown: 0 })),
    xpReward: Math.floor(template.xpReward * levelScale),
    goldReward: Math.floor(template.goldReward * levelScale),
    buffs: [],
    dots: [],
    stunned: false,
    atb: 0,
  };
}
