import { calculateStats } from './attributes.js';
import { classDefinitions } from './classes.js';
import { raceDefinitions } from './races.js';

export const enemyTemplates = {
  goblin: {
    name: 'Goblin Scout', icon: '👺', color: '#84cc16',
    baseHealth: 80, baseDamage: 12, baseDefense: 5, baseMana: 20,
    xpReward: 15, goldReward: 8, speed: 14,
    abilities: [
      { id: 'scratch', name: 'Scratch', icon: '🔪', type: 'physical', damage: 1.0, description: 'A quick scratch' },
      { id: 'sneak_stab', name: 'Sneak Stab', icon: '🗡️', type: 'physical', damage: 1.8, cooldown: 3, description: 'A backstab attempt' },
    ]
  },
  skeleton: {
    name: 'Skeleton Warrior', icon: '💀', color: '#d4d4d8',
    baseHealth: 120, baseDamage: 18, baseDefense: 15, baseMana: 0,
    xpReward: 22, goldReward: 12, speed: 10,
    abilities: [
      { id: 'bone_strike', name: 'Bone Strike', icon: '🦴', type: 'physical', damage: 1.1, description: 'A bony slam' },
      { id: 'shield_block', name: 'Shield Block', icon: '🛡️', type: 'buff', damage: 0, cooldown: 4, description: 'Raises defense', effect: { stat: 'defense', flat: 20, duration: 2 } },
    ]
  },
  wolf: {
    name: 'Dire Wolf', icon: '🐺', color: '#78716c',
    baseHealth: 100, baseDamage: 22, baseDefense: 8, baseMana: 0,
    xpReward: 18, goldReward: 6, speed: 18,
    abilities: [
      { id: 'bite', name: 'Bite', icon: '🦷', type: 'physical', damage: 1.2, description: 'A savage bite' },
      { id: 'howl_buff', name: 'Feral Howl', icon: '🌙', type: 'buff', damage: 0, cooldown: 5, description: 'Increases damage', effect: { stat: 'damage', multiplier: 1.4, duration: 2 } },
    ]
  },
  dark_mage: {
    name: 'Dark Mage', icon: '🧙', color: '#7c3aed',
    baseHealth: 90, baseDamage: 25, baseDefense: 6, baseMana: 100,
    xpReward: 30, goldReward: 20, speed: 12,
    abilities: [
      { id: 'shadow_bolt', name: 'Shadow Bolt', icon: '🌑', type: 'magical', damage: 1.3, description: 'A bolt of dark energy' },
      { id: 'dark_nova', name: 'Dark Nova', icon: '💥', type: 'magical', damage: 2.2, cooldown: 3, description: 'An explosion of shadow' },
      { id: 'drain_life', name: 'Drain Life', icon: '💜', type: 'magical', damage: 0.8, cooldown: 4, description: 'Steals life force', drainPercent: 0.5 },
    ]
  },
  orc: {
    name: 'Orc Berserker', icon: '👹', color: '#65a30d',
    baseHealth: 180, baseDamage: 28, baseDefense: 20, baseMana: 0,
    xpReward: 35, goldReward: 18, speed: 8,
    abilities: [
      { id: 'smash', name: 'Smash', icon: '💪', type: 'physical', damage: 1.2, description: 'A powerful smash' },
      { id: 'berserk', name: 'Berserk', icon: '🔴', type: 'buff', damage: 0, cooldown: 5, description: 'Goes berserk', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'ground_pound', name: 'Ground Pound', icon: '⬇️', type: 'physical', damage: 1.8, cooldown: 3, description: 'Slams the ground' },
    ]
  },
  dragon_whelp: {
    name: 'Dragon Whelp', icon: '🐉', color: '#dc2626',
    baseHealth: 150, baseDamage: 30, baseDefense: 18, baseMana: 80,
    xpReward: 45, goldReward: 30, speed: 15,
    abilities: [
      { id: 'claw', name: 'Claw', icon: '🦎', type: 'physical', damage: 1.1, description: 'A claw swipe' },
      { id: 'fire_breath', name: 'Fire Breath', icon: '🔥', type: 'magical', damage: 2.0, cooldown: 3, description: 'Breathes fire' },
      { id: 'tail_whip', name: 'Tail Whip', icon: '💫', type: 'physical', damage: 1.5, cooldown: 2, description: 'A tail strike' },
    ]
  },
  lich: {
    name: 'Lich Lord', icon: '👻', color: '#6366f1',
    baseHealth: 700, baseDamage: 40, baseDefense: 22, baseMana: 350,
    xpReward: 120, goldReward: 90, speed: 11,
    isBoss: true,
    abilities: [
      { id: 'soul_bolt', name: 'Soul Bolt', icon: '💀', type: 'magical', damage: 1.4, description: 'A bolt of soul energy' },
      { id: 'death_coil', name: 'Death Coil', icon: '☠️', type: 'magical', damage: 2.5, cooldown: 3, description: 'Devastating necrotic blast that steals life', drainPercent: 0.4 },
      { id: 'bone_shield', name: 'Bone Shield', icon: '🛡️', type: 'buff', damage: 0, cooldown: 5, description: 'Summons bone armor', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'soul_drain', name: 'Soul Drain', icon: '💜', type: 'heal', damage: 0, cooldown: 4, description: 'Drains life from all nearby souls', healPercent: 0.15, drainPercent: 0.5 },
      { id: 'raise_dead', name: 'Raise Dead', icon: '🧟', type: 'buff', damage: 0, cooldown: 7, description: 'Enrages with undead fury', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'shadow_nova', name: 'Shadow Nova', icon: '🌑', type: 'magical', damage: 3.0, cooldown: 5, description: 'Unleashes a wave of shadow energy' },
      { id: 'curse_weakness', name: 'Curse of Weakness', icon: '💀', type: 'magical', damage: 0.5, cooldown: 4, description: 'Curses a hero, reducing their damage', effect: { type: 'dot', damage: 0.10, duration: 4 } },
    ]
  },
  demon_lord: {
    name: 'Demon Lord', icon: '😈', color: '#b91c1c',
    baseHealth: 900, baseDamage: 52, baseDefense: 35, baseMana: 250,
    xpReward: 160, goldReward: 120, speed: 13,
    isBoss: true,
    abilities: [
      { id: 'hellfire', name: 'Hellfire', icon: '🔥', type: 'magical', damage: 1.6, description: 'Infernal flames scorch everything' },
      { id: 'doom_strike', name: 'Doom Strike', icon: '⚡', type: 'physical', damage: 3.0, cooldown: 4, description: 'A strike of pure doom' },
      { id: 'dark_ritual', name: 'Dark Ritual', icon: '🌑', type: 'buff', damage: 0, cooldown: 6, description: 'Dark power surge doubles attack', effect: { stat: 'damage', multiplier: 1.7, duration: 3 } },
      { id: 'meteor', name: 'Meteor', icon: '☄️', type: 'magical', damage: 3.8, cooldown: 5, description: 'Calls down a meteor from the abyss' },
      { id: 'demonic_heal', name: 'Demonic Regeneration', icon: '💗', type: 'heal', damage: 0, cooldown: 5, description: 'Feeds on suffering to restore health', healPercent: 0.15 },
      { id: 'infernal_chains', name: 'Infernal Chains', icon: '⛓️', type: 'magical', damage: 1.2, cooldown: 4, description: 'Chains bind a hero, stunning them', effect: { type: 'stun', duration: 1 } },
      { id: 'hellfire_aura', name: 'Hellfire Aura', icon: '🔥', type: 'magical', damage: 1.0, cooldown: 3, description: 'Burns all heroes with infernal fire', effect: { type: 'dot', damage: 0.12, duration: 3 } },
    ]
  },
  void_king: {
    name: 'The Void King', icon: '👑', color: '#fbbf24',
    baseHealth: 1200, baseDamage: 60, baseDefense: 48, baseMana: 500,
    xpReward: 300, goldReward: 200, speed: 16,
    isBoss: true,
    abilities: [
      { id: 'void_slash', name: 'Void Slash', icon: '🌀', type: 'physical', damage: 1.8, description: 'A slash through the fabric of reality' },
      { id: 'annihilate', name: 'Annihilate', icon: '💥', type: 'magical', damage: 3.5, cooldown: 4, description: 'Pure destruction unleashed on all' },
      { id: 'void_barrier', name: 'Void Barrier', icon: '🛡️', type: 'buff', damage: 0, cooldown: 5, description: 'Impenetrable void shield', effect: { stat: 'defense', flat: 60, duration: 3 } },
      { id: 'reality_tear', name: 'Reality Tear', icon: '🕳️', type: 'magical', damage: 4.5, cooldown: 7, description: 'Tears reality asunder, devastating all' },
      { id: 'void_drain', name: 'Void Drain', icon: '🖤', type: 'heal', damage: 0, cooldown: 5, description: 'Absorbs life force from the void', healPercent: 0.12 },
      { id: 'oblivion_pulse', name: 'Oblivion Pulse', icon: '💫', type: 'magical', damage: 2.2, cooldown: 3, description: 'Radiates obliterating energy at all', effect: { type: 'dot', damage: 0.15, duration: 3 } },
      { id: 'time_stop', name: 'Time Stop', icon: '⏳', type: 'magical', damage: 0.6, cooldown: 6, description: 'Freezes a hero in time', effect: { type: 'stun', duration: 2 } },
      { id: 'void_enrage', name: 'Void Enrage', icon: '😤', type: 'buff', damage: 0, cooldown: 8, description: 'The Void King enters a furious state', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
    ]
  },
  water_elemental: {
    name: 'Grand Water Elemental', icon: '🌊', color: '#06b6d4',
    baseHealth: 550, baseDamage: 50, baseDefense: 38, baseMana: 300,
    xpReward: 175, goldReward: 120, speed: 14,
    isBoss: true,
    abilities: [
      { id: 'tidal_strike', name: 'Tidal Strike', icon: '🌊', type: 'magical', damage: 1.4, description: 'A crashing wave of water' },
      { id: 'torrent', name: 'Torrent', icon: '💧', type: 'magical', damage: 2.5, cooldown: 3, description: 'A devastating torrent that poisons', effect: { type: 'dot', damage: 0.15, duration: 3 } },
      { id: 'frost_armor', name: 'Frost Armor', icon: '❄️', type: 'buff', damage: 0, cooldown: 5, description: 'Encases in ice armor', effect: { stat: 'defense', flat: 45, duration: 3 } },
      { id: 'tsunami', name: 'Tsunami', icon: '🌀', type: 'magical', damage: 3.5, cooldown: 6, description: 'A massive wave crashes down on all' },
      { id: 'healing_tide', name: 'Healing Tide', icon: '💙', type: 'heal', damage: 0, cooldown: 5, description: 'Heals with the power of the tides', healPercent: 0.18 },
      { id: 'frozen_prison', name: 'Frozen Prison', icon: '🧊', type: 'magical', damage: 1.0, cooldown: 4, description: 'Freezes a hero solid', effect: { type: 'stun', duration: 1 } },
    ]
  },
  nature_elemental: {
    name: 'Grand Nature Elemental', icon: '🌿', color: '#22c55e',
    baseHealth: 600, baseDamage: 44, baseDefense: 42, baseMana: 250,
    xpReward: 175, goldReward: 120, speed: 12,
    isBoss: true,
    abilities: [
      { id: 'vine_lash', name: 'Vine Lash', icon: '🌿', type: 'physical', damage: 1.3, description: 'Thorned vines whip out' },
      { id: 'natures_wrath', name: "Nature's Wrath", icon: '🍃', type: 'magical', damage: 2.4, cooldown: 3, description: 'The fury of nature unleashed', effect: { type: 'dot', damage: 0.18, duration: 3 } },
      { id: 'regenerate', name: 'Regenerate', icon: '💚', type: 'heal', damage: 0, cooldown: 4, description: 'Regenerates health rapidly', healPercent: 0.20 },
      { id: 'earthquake', name: 'Earthquake', icon: '⛰️', type: 'physical', damage: 3.5, cooldown: 6, description: 'The earth splits apart, hitting all heroes' },
      { id: 'thorn_armor', name: 'Thorn Armor', icon: '🌵', type: 'buff', damage: 0, cooldown: 5, description: 'Reflects damage back to attackers', effect: { stat: 'defense', flat: 35, duration: 3 } },
      { id: 'root_bind', name: 'Root Bind', icon: '🌳', type: 'magical', damage: 0.8, cooldown: 4, description: 'Roots entangle a hero, stunning them', effect: { type: 'stun', duration: 1 } },
    ]
  },
  grand_shaman: {
    name: 'Grand Shaman', icon: '🌿', color: '#16a34a',
    baseHealth: 500, baseDamage: 32, baseDefense: 18, baseMana: 200,
    xpReward: 80, goldReward: 55, speed: 11,
    isBoss: true,
    abilities: [
      { id: 'nature_bolt', name: 'Nature Bolt', icon: '🍃', type: 'magical', damage: 1.3, description: 'A bolt of concentrated nature energy' },
      { id: 'healing_rain', name: 'Healing Rain', icon: '🌧️', type: 'heal', damage: 0, cooldown: 4, description: 'Calls healing rain to restore vitality', healPercent: 0.18 },
      { id: 'thorn_burst', name: 'Thorn Burst', icon: '🌵', type: 'magical', damage: 2.2, cooldown: 3, description: 'Thorns erupt from the ground hitting all', effect: { type: 'dot', damage: 0.10, duration: 3 } },
      { id: 'bark_shield', name: 'Bark Shield', icon: '🛡️', type: 'buff', damage: 0, cooldown: 5, description: 'Encases in hardened bark', effect: { stat: 'defense', flat: 30, duration: 3 } },
      { id: 'entangle', name: 'Entangle', icon: '🌳', type: 'magical', damage: 0.6, cooldown: 5, description: 'Roots grab and hold a hero', effect: { type: 'stun', duration: 1 } },
    ]
  },
  canyon_warlord: {
    name: 'Canyon Warlord', icon: '⚔️', color: '#b91c1c',
    baseHealth: 650, baseDamage: 38, baseDefense: 28, baseMana: 50,
    xpReward: 95, goldReward: 65, speed: 10,
    isBoss: true,
    abilities: [
      { id: 'cleave', name: 'Cleave', icon: '🪓', type: 'physical', damage: 1.4, description: 'A massive cleaving strike' },
      { id: 'war_cry', name: 'War Cry', icon: '📢', type: 'buff', damage: 0, cooldown: 5, description: 'Enrages into a battle fury', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'skull_crusher', name: 'Skull Crusher', icon: '💀', type: 'physical', damage: 2.8, cooldown: 4, description: 'A devastating overhead smash' },
      { id: 'iron_skin', name: 'Iron Skin', icon: '🛡️', type: 'buff', damage: 0, cooldown: 6, description: 'Hardens skin like iron', effect: { stat: 'defense', flat: 35, duration: 3 } },
      { id: 'bloodlust', name: 'Bloodlust', icon: '🩸', type: 'physical', damage: 1.6, cooldown: 3, description: 'Frenzied strikes that drain life', drainPercent: 0.3 },
    ]
  },
  frost_wyrm: {
    name: 'Frost Wyrm', icon: '🐲', color: '#38bdf8',
    baseHealth: 750, baseDamage: 42, baseDefense: 30, baseMana: 200,
    xpReward: 110, goldReward: 80, speed: 14,
    isBoss: true,
    abilities: [
      { id: 'ice_fang', name: 'Ice Fang', icon: '🦷', type: 'physical', damage: 1.3, description: 'Freezing bite attack' },
      { id: 'blizzard_breath', name: 'Blizzard Breath', icon: '❄️', type: 'magical', damage: 2.5, cooldown: 3, description: 'Breathes a devastating blizzard', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'ice_armor', name: 'Ice Armor', icon: '🧊', type: 'buff', damage: 0, cooldown: 5, description: 'Encases in thick ice armor', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'glacial_slam', name: 'Glacial Slam', icon: '💎', type: 'physical', damage: 3.0, cooldown: 5, description: 'Slams the ground creating ice spikes' },
      { id: 'freeze', name: 'Freeze', icon: '🥶', type: 'magical', damage: 0.8, cooldown: 4, description: 'Freezes a hero solid in ice', effect: { type: 'stun', duration: 1 } },
      { id: 'frost_heal', name: 'Frost Regeneration', icon: '💙', type: 'heal', damage: 0, cooldown: 5, description: 'Absorbs cold to heal wounds', healPercent: 0.12 },
    ]
  },
  shadow_beast: {
    name: 'Shadow Beast', icon: '👾', color: '#6b21a8',
    baseHealth: 800, baseDamage: 45, baseDefense: 25, baseMana: 250,
    xpReward: 130, goldReward: 90, speed: 15,
    isBoss: true,
    abilities: [
      { id: 'shadow_claw', name: 'Shadow Claw', icon: '🌑', type: 'physical', damage: 1.4, description: 'Claws made of living shadow' },
      { id: 'dark_pulse', name: 'Dark Pulse', icon: '💜', type: 'magical', damage: 2.4, cooldown: 3, description: 'A pulse of dark energy hitting all', effect: { type: 'dot', damage: 0.14, duration: 3 } },
      { id: 'shadow_veil', name: 'Shadow Veil', icon: '🌫️', type: 'buff', damage: 0, cooldown: 5, description: 'Wraps in shadows increasing defense', effect: { stat: 'defense', flat: 35, duration: 3 } },
      { id: 'devour', name: 'Devour', icon: '😈', type: 'physical', damage: 2.0, cooldown: 4, description: 'Devours life force from a hero', drainPercent: 0.4 },
      { id: 'nightmare', name: 'Nightmare', icon: '💀', type: 'magical', damage: 1.0, cooldown: 5, description: 'Traps a hero in a nightmare', effect: { type: 'stun', duration: 1 } },
      { id: 'shadow_mend', name: 'Shadow Mend', icon: '🖤', type: 'heal', damage: 0, cooldown: 5, description: 'Feeds on darkness to heal', healPercent: 0.14 },
    ]
  },
  void_sentinel: {
    name: 'Void Sentinel', icon: '🔮', color: '#a855f7',
    baseHealth: 1000, baseDamage: 55, baseDefense: 42, baseMana: 400,
    xpReward: 200, goldReward: 150, speed: 13,
    isBoss: true,
    abilities: [
      { id: 'void_strike', name: 'Void Strike', icon: '🌀', type: 'physical', damage: 1.5, description: 'A strike infused with void energy' },
      { id: 'reality_rift', name: 'Reality Rift', icon: '🕳️', type: 'magical', damage: 3.0, cooldown: 4, description: 'Tears open a rift in reality' },
      { id: 'void_shield', name: 'Void Shield', icon: '🛡️', type: 'buff', damage: 0, cooldown: 5, description: 'Erects an impenetrable void barrier', effect: { stat: 'defense', flat: 50, duration: 3 } },
      { id: 'entropy_pulse', name: 'Entropy Pulse', icon: '💫', type: 'magical', damage: 2.0, cooldown: 3, description: 'Radiates entropic energy at all heroes', effect: { type: 'dot', damage: 0.14, duration: 3 } },
      { id: 'dimensional_lock', name: 'Dimensional Lock', icon: '⏳', type: 'magical', damage: 0.8, cooldown: 5, description: 'Locks a hero between dimensions', effect: { type: 'stun', duration: 2 } },
      { id: 'void_siphon', name: 'Void Siphon', icon: '🖤', type: 'heal', damage: 0, cooldown: 5, description: 'Siphons energy from the void to heal', healPercent: 0.13 },
      { id: 'null_burst', name: 'Null Burst', icon: '💥', type: 'magical', damage: 3.5, cooldown: 6, description: 'Unleashes a burst of pure nothingness' },
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
    boss: null,
    enemyCount: [2, 2],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'human', classId: 'warrior', levelRange: [1, 2] },
      { raceId: 'orc', classId: 'warrior', levelRange: [1, 3] },
      { raceId: 'human', classId: 'ranger', levelRange: [1, 2] },
    ],
  },
  {
    id: 'dark_forest',
    name: 'Dark Forest',
    description: 'Ancient trees block out the sun. Dangerous creatures lurk in every shadow.',
    levelRange: [3, 5],
    enemies: ['wolf', 'goblin', 'skeleton'],
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    icon: '🌲',
    unlocked: true,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'human', classId: 'ranger', levelRange: [3, 5] },
      { raceId: 'orc', classId: 'warrior', levelRange: [3, 4] },
      { raceId: 'elf', classId: 'mage', levelRange: [3, 5] },
    ],
  },
  {
    id: 'mystic_grove',
    name: 'Mystic Grove',
    description: 'An enchanted woodland where ancient elves once practiced their arcane arts. Magic hums in the air.',
    levelRange: [4, 6],
    enemies: ['goblin', 'wolf', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
    icon: '🧝',
    unlocked: false,
    unlockLevel: 3,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'elf', classId: 'mage', levelRange: [4, 6] },
      { raceId: 'elf', classId: 'ranger', levelRange: [4, 5] },
      { raceId: 'human', classId: 'worge', levelRange: [4, 6] },
    ],
  },
  {
    id: 'whispering_caverns',
    name: 'Whispering Caverns',
    description: 'Twisting underground tunnels near the forest edge. Strange echoes and glowing fungi light the way.',
    levelRange: [3, 5],
    enemies: ['goblin', 'skeleton'],
    bgGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
    icon: '🕳️',
    unlocked: false,
    unlockLevel: 3,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'dwarf', classId: 'warrior', levelRange: [3, 5] },
      { raceId: 'orc', classId: 'warrior', levelRange: [3, 5] },
      { raceId: 'human', classId: 'ranger', levelRange: [3, 4] },
    ],
  },
  {
    id: 'haunted_marsh',
    name: 'Haunted Marsh',
    description: 'A fog-choked swamp where the dead refuse to stay buried. Undead shamble through the mire.',
    levelRange: [5, 7],
    enemies: ['skeleton', 'dark_mage', 'wolf'],
    bgGradient: 'linear-gradient(135deg, #1a2e1a 0%, #2d3a2d 50%, #1a1a2e 100%)',
    icon: '🏚️',
    unlocked: false,
    unlockLevel: 4,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'warrior', levelRange: [5, 7] },
      { raceId: 'undead', classId: 'mage', levelRange: [5, 6] },
      { raceId: 'orc', classId: 'worge', levelRange: [5, 7] },
    ],
  },
  {
    id: 'cursed_ruins',
    name: 'Cursed Ruins',
    description: 'The remnants of a fallen kingdom, now haunted by the undead and dark magic.',
    levelRange: [6, 9],
    enemies: ['skeleton', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #2d1b69 0%, #1a0a3e 50%, #0d0d2b 100%)',
    icon: '🏚️',
    unlocked: false,
    unlockLevel: 5,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'mage', levelRange: [6, 8] },
      { raceId: 'undead', classId: 'warrior', levelRange: [6, 9] },
      { raceId: 'dwarf', classId: 'warrior', levelRange: [7, 9] },
    ],
  },
  {
    id: 'crystal_caves',
    name: 'Crystal Caves',
    description: 'Glittering caverns deep beneath the mountains. Dwarven miners carved these halls seeking precious gems.',
    levelRange: [7, 9],
    enemies: ['skeleton', 'goblin', 'orc'],
    bgGradient: 'linear-gradient(135deg, #164e63 0%, #155e75 50%, #0e7490 100%)',
    icon: '💎',
    unlocked: false,
    unlockLevel: 6,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'dwarf', classId: 'warrior', levelRange: [7, 9] },
      { raceId: 'elf', classId: 'mage', levelRange: [7, 9] },
      { raceId: 'dwarf', classId: 'ranger', levelRange: [7, 8] },
    ],
  },
  {
    id: 'thornwood_pass',
    name: 'Thornwood Pass',
    description: 'A treacherous forest trail choked with thorny brambles. Ambushes are common along this narrow path.',
    levelRange: [6, 8],
    enemies: ['wolf', 'goblin', 'orc'],
    bgGradient: 'linear-gradient(135deg, #1a2e05 0%, #365314 50%, #1a2e05 100%)',
    icon: '🌿',
    unlocked: false,
    unlockLevel: 5,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'orc', classId: 'ranger', levelRange: [6, 8] },
      { raceId: 'human', classId: 'warrior', levelRange: [6, 8] },
      { raceId: 'elf', classId: 'ranger', levelRange: [6, 7] },
    ],
  },
  {
    id: 'sunken_temple',
    name: 'Sunken Temple',
    description: 'Ancient ruins half-submerged in dark waters. A powerful shaman guards the inner sanctum.',
    levelRange: [7, 9],
    enemies: ['skeleton', 'dark_mage', 'goblin'],
    bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
    icon: '🏛️',
    unlocked: false,
    unlockLevel: 6,
    boss: 'grand_shaman',
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'warrior', levelRange: [7, 9] },
      { raceId: 'elf', classId: 'mage', levelRange: [7, 9] },
      { raceId: 'human', classId: 'mage', levelRange: [8, 9] },
    ],
  },
  {
    id: 'iron_peaks',
    name: 'Iron Peaks',
    description: 'Rugged mountain forges where dwarves and orcs clash over precious ore deposits.',
    levelRange: [8, 11],
    enemies: ['orc', 'skeleton', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #44403c 0%, #57534e 50%, #292524 100%)',
    icon: '⛏️',
    unlocked: false,
    unlockLevel: 7,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'dwarf', classId: 'warrior', levelRange: [8, 10] },
      { raceId: 'orc', classId: 'warrior', levelRange: [9, 11] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [8, 11] },
    ],
  },
  {
    id: 'blood_canyon',
    name: 'Blood Canyon',
    description: 'A desolate ravine stained red by centuries of warfare. A brutal warlord commands the orc stronghold.',
    levelRange: [9, 12],
    enemies: ['orc', 'skeleton', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 50%, #1c0505 100%)',
    icon: '🏔️',
    unlocked: false,
    unlockLevel: 8,
    boss: 'canyon_warlord',
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'orc', classId: 'warrior', levelRange: [9, 12] },
      { raceId: 'barbarian', classId: 'worge', levelRange: [9, 11] },
      { raceId: 'orc', classId: 'ranger', levelRange: [10, 12] },
    ],
  },
  {
    id: 'frozen_tundra',
    name: 'Frozen Tundra',
    description: 'An endless ice wasteland where blizzards rage and a mighty frost wyrm rules the skies.',
    levelRange: [10, 13],
    enemies: ['orc', 'skeleton', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #bae6fd 50%, #e0f2fe 100%)',
    icon: '❄️',
    unlocked: false,
    unlockLevel: 9,
    boss: 'frost_wyrm',
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'barbarian', classId: 'warrior', levelRange: [10, 13] },
      { raceId: 'dwarf', classId: 'warrior', levelRange: [10, 12] },
      { raceId: 'human', classId: 'mage', levelRange: [11, 13] },
    ],
  },
  {
    id: 'dragon_peaks',
    name: 'Dragon Peaks',
    description: 'Volcanic mountains where young dragons nest. The air burns with each breath.',
    levelRange: [11, 14],
    enemies: ['dragon_whelp', 'orc', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #92400e 0%, #78350f 50%, #451a03 100%)',
    icon: '🌋',
    unlocked: false,
    unlockLevel: 10,
    boss: 'water_elemental',
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'orc', classId: 'warrior', levelRange: [11, 14] },
      { raceId: 'barbarian', classId: 'ranger', levelRange: [11, 13] },
      { raceId: 'elf', classId: 'mage', levelRange: [12, 14] },
    ],
  },
  {
    id: 'ashen_battlefield',
    name: 'Ashen Battlefield',
    description: 'War-torn plains littered with the remnants of a great battle. Scavengers and deserters roam freely.',
    levelRange: [10, 13],
    enemies: ['orc', 'skeleton', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #57534e 0%, #78716c 50%, #44403c 100%)',
    icon: '⚔️',
    unlocked: false,
    unlockLevel: 9,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'orc', classId: 'warrior', levelRange: [10, 13] },
      { raceId: 'human', classId: 'warrior', levelRange: [10, 12] },
      { raceId: 'barbarian', classId: 'ranger', levelRange: [11, 13] },
    ],
  },
  {
    id: 'windswept_ridge',
    name: 'Windswept Ridge',
    description: 'A narrow mountain pass battered by relentless winds. Only the hardiest survive the crossing.',
    levelRange: [11, 14],
    enemies: ['orc', 'dragon_whelp', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #475569 100%)',
    icon: '🌬️',
    unlocked: false,
    unlockLevel: 10,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'barbarian', classId: 'warrior', levelRange: [11, 14] },
      { raceId: 'dwarf', classId: 'ranger', levelRange: [11, 13] },
      { raceId: 'elf', classId: 'mage', levelRange: [12, 14] },
    ],
  },
  {
    id: 'molten_core',
    name: 'Molten Core',
    description: 'Deep volcanic tunnels where rivers of magma flow. The heat is unbearable and fire creatures thrive.',
    levelRange: [12, 14],
    enemies: ['dragon_whelp', 'orc', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #7f1d1d 100%)',
    icon: '🔥',
    unlocked: false,
    unlockLevel: 11,
    boss: null,
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'orc', classId: 'warrior', levelRange: [12, 14] },
      { raceId: 'barbarian', classId: 'worge', levelRange: [12, 14] },
      { raceId: 'dwarf', classId: 'warrior', levelRange: [12, 14] },
    ],
  },
  {
    id: 'shadow_forest',
    name: 'Shadow Forest',
    description: 'A once-beautiful forest corrupted by dark magic. Shadows move with malicious intent among twisted trees.',
    levelRange: [12, 15],
    enemies: ['dark_mage', 'orc', 'skeleton'],
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
    icon: '🌑',
    unlocked: false,
    unlockLevel: 11,
    boss: 'shadow_beast',
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'elf', classId: 'ranger', levelRange: [12, 15] },
      { raceId: 'undead', classId: 'mage', levelRange: [12, 14] },
      { raceId: 'human', classId: 'worge', levelRange: [13, 15] },
    ],
  },
  {
    id: 'obsidian_wastes',
    name: 'Obsidian Wastes',
    description: 'A desolate volcanic wasteland of black glass and ash. Nothing grows here but hatred.',
    levelRange: [13, 15],
    enemies: ['orc', 'dark_mage', 'dragon_whelp'],
    bgGradient: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #0c0a09 100%)',
    icon: '🌑',
    unlocked: false,
    unlockLevel: 12,
    boss: null,
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'orc', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'undead', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'barbarian', classId: 'mage', levelRange: [13, 15] },
    ],
  },
  {
    id: 'ruins_of_ashenmoor',
    name: 'Ruins of Ashenmoor',
    description: 'The charred remains of an ancient city destroyed by dragonfire. Dark spirits haunt the rubble.',
    levelRange: [13, 16],
    enemies: ['skeleton', 'dark_mage', 'orc'],
    bgGradient: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #292524 100%)',
    icon: '🏚️',
    unlocked: false,
    unlockLevel: 12,
    boss: null,
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'mage', levelRange: [13, 16] },
      { raceId: 'undead', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'orc', classId: 'warrior', levelRange: [14, 16] },
    ],
  },
  {
    id: 'blight_hollow',
    name: 'Blight Hollow',
    description: 'A plague-ridden valley where poisonous mists hang low. Disease and decay consume everything.',
    levelRange: [14, 16],
    enemies: ['dark_mage', 'skeleton', 'orc'],
    bgGradient: 'linear-gradient(135deg, #365314 0%, #3f6212 50%, #1a2e05 100%)',
    icon: '☠️',
    unlocked: false,
    unlockLevel: 13,
    boss: null,
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'mage', levelRange: [14, 16] },
      { raceId: 'undead', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'orc', classId: 'worge', levelRange: [14, 16] },
    ],
  },
  {
    id: 'shadow_citadel',
    name: 'Shadow Citadel',
    description: 'A fortress of pure darkness. The Lich Lords command their undead armies from within.',
    levelRange: [14, 17],
    enemies: ['dark_mage', 'dragon_whelp', 'orc'],
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f0d2e 50%, #030318 100%)',
    icon: '🏰',
    unlocked: false,
    unlockLevel: 13,
    boss: 'lich',
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'mage', levelRange: [14, 17] },
      { raceId: 'undead', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'elf', classId: 'ranger', levelRange: [15, 17] },
    ],
  },
  {
    id: 'stormspire_peak',
    name: 'Stormspire Peak',
    description: 'A mountain summit perpetually struck by lightning. Raw elemental energy crackles through the air.',
    levelRange: [14, 17],
    enemies: ['dark_mage', 'dragon_whelp', 'orc'],
    bgGradient: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #1e40af 100%)',
    icon: '⚡',
    unlocked: false,
    unlockLevel: 13,
    boss: null,
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'elf', classId: 'mage', levelRange: [14, 17] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'dwarf', classId: 'warrior', levelRange: [15, 17] },
    ],
  },
  {
    id: 'demon_gate',
    name: 'Demon Gate',
    description: 'The barrier between worlds grows thin here. Demons pour through the cracks in reality.',
    levelRange: [15, 18],
    enemies: ['dark_mage', 'dragon_whelp', 'orc'],
    bgGradient: 'linear-gradient(135deg, #4a0404 0%, #2d0000 50%, #1a0000 100%)',
    icon: '🌀',
    unlocked: false,
    unlockLevel: 14,
    boss: 'demon_lord',
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'orc', classId: 'warrior', levelRange: [15, 18] },
      { raceId: 'barbarian', classId: 'worge', levelRange: [15, 17] },
      { raceId: 'undead', classId: 'mage', levelRange: [16, 18] },
    ],
  },
  {
    id: 'abyssal_depths',
    name: 'Abyssal Depths',
    description: 'Lightless caverns that plunge into the void itself. Reality warps in the suffocating darkness.',
    levelRange: [16, 18],
    enemies: ['dark_mage', 'orc', 'dragon_whelp'],
    bgGradient: 'linear-gradient(135deg, #0f0520 0%, #1a0a30 50%, #050010 100%)',
    icon: '🕳️',
    unlocked: false,
    unlockLevel: 15,
    boss: null,
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'mage', levelRange: [16, 18] },
      { raceId: 'orc', classId: 'worge', levelRange: [16, 18] },
      { raceId: 'elf', classId: 'mage', levelRange: [17, 18] },
    ],
  },
  {
    id: 'infernal_forge',
    name: 'Infernal Forge',
    description: 'A demonic weapon forge where hellfire burns eternally. The clang of cursed steel echoes endlessly.',
    levelRange: [16, 18],
    enemies: ['orc', 'dark_mage', 'dragon_whelp'],
    bgGradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #9a3412 100%)',
    icon: '🔨',
    unlocked: false,
    unlockLevel: 15,
    boss: null,
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'orc', classId: 'warrior', levelRange: [16, 18] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [16, 18] },
      { raceId: 'dwarf', classId: 'worge', levelRange: [16, 18] },
    ],
  },
  {
    id: 'dreadmaw_canyon',
    name: 'Dreadmaw Canyon',
    description: 'A massive ravine filled with the bones of ancient beasts. The canyon itself seems alive and hungry.',
    levelRange: [17, 19],
    enemies: ['dark_mage', 'orc', 'dragon_whelp'],
    bgGradient: 'linear-gradient(135deg, #4a044e 0%, #701a75 50%, #3b0764 100%)',
    icon: '💀',
    unlocked: false,
    unlockLevel: 16,
    boss: null,
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'orc', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'barbarian', classId: 'worge', levelRange: [17, 19] },
    ],
  },
  {
    id: 'void_threshold',
    name: 'Void Threshold',
    description: 'The edge of reality itself. A Void Sentinel guards the passage to the realm beyond existence.',
    levelRange: [17, 19],
    enemies: ['dark_mage', 'dragon_whelp', 'orc'],
    bgGradient: 'linear-gradient(135deg, #0a0015 0%, #1a0a2e 50%, #0d001a 100%)',
    icon: '🔮',
    unlocked: false,
    unlockLevel: 16,
    boss: 'void_sentinel',
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'elf', classId: 'mage', levelRange: [18, 19] },
    ],
  },
  {
    id: 'corrupted_spire',
    name: 'Corrupted Spire',
    description: 'A twisted tower of pure evil that pierces the sky. Dark energy radiates from every stone.',
    levelRange: [18, 20],
    enemies: ['dark_mage', 'dragon_whelp', 'orc'],
    bgGradient: 'linear-gradient(135deg, #1a0000 0%, #2d0a0a 50%, #0a0000 100%)',
    icon: '🗼',
    unlocked: false,
    unlockLevel: 17,
    boss: null,
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'mage', levelRange: [18, 20] },
      { raceId: 'orc', classId: 'worge', levelRange: [18, 20] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [18, 20] },
    ],
  },
  {
    id: 'void_throne',
    name: 'The Void Throne',
    description: 'Beyond the edge of existence sits the Void King on his throne of nothingness. This is the final battle.',
    levelRange: [18, 20],
    enemies: ['dark_mage', 'dragon_whelp', 'orc'],
    bgGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #000000 100%)',
    icon: '👑',
    unlocked: false,
    unlockLevel: 18,
    boss: 'void_king',
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'mage', levelRange: [18, 20] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [18, 20] },
      { raceId: 'orc', classId: 'worge', levelRange: [19, 20] },
    ],
  }
];

export function createEnemy(templateId, playerLevel) {
  const template = enemyTemplates[templateId];
  if (!template) return null;

  const levelScale = 1 + (playerLevel * 0.15);
  return {
    id: `enemy_${templateId}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    templateId,
    name: template.name,
    icon: template.icon,
    color: template.color,
    team: 'enemy',
    isPlayerControlled: false,
    classId: null,
    maxHealth: Math.floor(template.baseHealth * levelScale),
    health: Math.floor(template.baseHealth * levelScale),
    physicalDamage: Math.floor(template.baseDamage * levelScale),
    magicDamage: Math.floor((template.baseMagicDamage || 0) * levelScale),
    defense: Math.floor(template.baseDefense * levelScale),
    mana: template.baseMana,
    maxMana: template.baseMana,
    stamina: 100,
    maxStamina: 100,
    speed: (template.speed || 12) + Math.floor(Math.random() * 6),
    abilities: template.abilities.map(a => ({ ...a, currentCooldown: 0 })),
    cooldowns: {},
    xpReward: Math.floor(template.xpReward * levelScale),
    goldReward: Math.floor(template.goldReward * levelScale),
    buffs: [],
    dots: [],
    stunned: false,
    alive: true,
    isBoss: !!template.isBoss,
    level: playerLevel,
    critChance: 5,
    criticalDamage: 50,
    evasion: 3,
    block: 0,
    blockEffect: 0,
    damageReduction: 0,
    drainHealth: 0,
    healthRegen: 0,
    manaRegen: 0,
    defenseBreak: 0,
    criticalEvasion: 0,
  };
}

const enemyNamePools = {
  human: ['Aldric', 'Cedric', 'Roland', 'Gareth', 'Edmund', 'Leland', 'Oswin', 'Theron', 'Brant', 'Corin', 'Hilda', 'Elara', 'Maren', 'Solene', 'Brenna'],
  orc: ['Grimgor', 'Thrakk', 'Mogash', 'Durgol', 'Zargoth', 'Gruumak', 'Borzag', 'Kragoth', 'Ulgath', 'Nazgul', 'Gorsha', 'Drukha', 'Vreka', 'Skara', 'Bolgra'],
  elf: ['Eldrin', 'Aeris', 'Thalion', 'Caelum', 'Lyris', 'Faelon', 'Sylvar', 'Ilmenor', 'Aranthi', 'Mirael', 'Elowen', 'Niamh', 'Seraphel', 'Arwen', 'Celebris'],
  undead: ['Morthos', 'Vexran', 'Calcifer', 'Dreadmaw', 'Necroth', 'Ashfall', 'Rotjaw', 'Grimsoul', 'Bonechill', 'Plagus', 'Withera', 'Morbella', 'Shadewyn', 'Crypta', 'Graviss'],
  barbarian: ['Wulfgar', 'Thorin', 'Bjorn', 'Ragnar', 'Ulfric', 'Skald', 'Fenrir', 'Hrothgar', 'Torvald', 'Draken', 'Sigrid', 'Astrid', 'Freya', 'Brynhild', 'Thyra'],
  dwarf: ['Durak', 'Balin', 'Gromli', 'Thorek', 'Bardin', 'Kazak', 'Gimrik', 'Dwalin', 'Thundrik', 'Grolmak', 'Helga', 'Magna', 'Bruni', 'Kethra', 'Dagni'],
};

const classPrimaryStats = {
  warrior: ['Strength', 'Vitality', 'Endurance'],
  mage: ['Intellect', 'Wisdom', 'Vitality'],
  ranger: ['Dexterity', 'Agility', 'Tactics'],
  worge: ['Strength', 'Dexterity', 'Agility', 'Intellect'],
};

function generateEnemyName(raceId, classId) {
  const pool = enemyNamePools[raceId] || enemyNamePools.human;
  const firstName = pool[Math.floor(Math.random() * pool.length)];
  const raceDef = raceDefinitions[raceId];
  const classDef = classDefinitions[classId];
  const raceName = raceDef ? raceDef.name : 'Unknown';
  const className = classDef ? classDef.name : 'Fighter';
  return `${firstName} the ${raceName} ${className}`;
}

function generateAttributePoints(classId, raceId, level) {
  const classDef = classDefinitions[classId];
  const raceDef = raceDefinitions[raceId];
  if (!classDef || !raceDef) return {};

  const attrs = { Strength: 0, Vitality: 0, Endurance: 0, Dexterity: 0, Agility: 0, Intellect: 0, Wisdom: 0, Tactics: 0 };

  Object.entries(classDef.startingAttributes).forEach(([attr, val]) => {
    attrs[attr] += val;
  });

  Object.entries(raceDef.bonuses).forEach(([attr, val]) => {
    attrs[attr] += val;
  });

  const extraPoints = level * 2;
  const primary = classPrimaryStats[classId] || ['Strength', 'Vitality'];
  const allAttrs = Object.keys(attrs);

  for (let i = 0; i < extraPoints; i++) {
    if (Math.random() < 0.7) {
      const stat = primary[Math.floor(Math.random() * primary.length)];
      attrs[stat] += 1;
    } else {
      const stat = allAttrs[Math.floor(Math.random() * allAttrs.length)];
      attrs[stat] += 1;
    }
  }

  return attrs;
}

function selectAbilities(classId, level, isBoss) {
  const classDef = classDefinitions[classId];
  if (!classDef) return [];

  const allAbilities = [...classDef.abilities];

  if (isBoss && classDef.signatureAbility) {
    allAbilities.push(classDef.signatureAbility);
    return allAbilities.map(a => ({ ...a, currentCooldown: 0 }));
  }

  const maxAbilities = Math.min(3 + Math.floor(level / 5), allAbilities.length);
  const selected = allAbilities.slice(0, maxAbilities);
  return selected.map(a => ({ ...a, currentCooldown: 0 }));
}

export function createRaceClassEnemy(raceId, classId, level, options = {}) {
  const classDef = classDefinitions[classId];
  const raceDef = raceDefinitions[raceId];
  if (!classDef || !raceDef) return null;

  const isBoss = !!options.isBoss;
  const effectiveLevel = isBoss ? level + 5 : level;
  const scaleFactor = isBoss ? 1.4 : 0.75;

  const attributePoints = generateAttributePoints(classId, raceId, effectiveLevel);
  const rawStats = calculateStats(attributePoints, effectiveLevel);

  const health = Math.floor(rawStats.health * scaleFactor * (isBoss ? 1.5 : 1));
  const physDmg = Math.floor(rawStats.physicalDamage * scaleFactor * (isBoss ? 1.2 : 1));
  const magDmg = Math.floor(rawStats.magicDamage * scaleFactor * (isBoss ? 1.2 : 1));
  const def = Math.floor(rawStats.defense * scaleFactor);
  const mana = Math.floor(rawStats.mana * scaleFactor);
  const stamina = Math.floor(rawStats.stamina * scaleFactor);

  const abilities = selectAbilities(classId, level, isBoss);
  const name = options.name || generateEnemyName(raceId, classId);

  const xpBase = 10 + level * 8;
  const goldBase = 5 + level * 5;

  return {
    id: `enemy_${raceId}_${classId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    icon: classDef.icon,
    color: raceDef.color,
    team: 'enemy',
    isPlayerControlled: false,
    raceId,
    classId,
    maxHealth: health,
    health,
    physicalDamage: physDmg,
    magicDamage: magDmg,
    defense: def,
    mana,
    maxMana: mana,
    stamina,
    maxStamina: stamina,
    speed: 10 + Math.floor(rawStats.movementSpeed || 0) + Math.floor(Math.random() * 4),
    abilities,
    cooldowns: {},
    xpReward: Math.floor((isBoss ? xpBase * 3 : xpBase) * (1 + level * 0.05)),
    goldReward: Math.floor((isBoss ? goldBase * 3 : goldBase) * (1 + level * 0.05)),
    buffs: [],
    dots: [],
    stunned: false,
    alive: true,
    isBoss,
    level,
    critChance: Math.min(rawStats.criticalChance * scaleFactor, 40),
    criticalDamage: rawStats.criticalDamage || 50,
    evasion: Math.min(rawStats.evasion * scaleFactor, 30),
    block: rawStats.block * scaleFactor,
    blockEffect: rawStats.blockEffect * scaleFactor,
    damageReduction: rawStats.damageReduction * scaleFactor,
    drainHealth: rawStats.drainHealth * scaleFactor,
    healthRegen: rawStats.healthRegen * scaleFactor,
    manaRegen: rawStats.manaRegen * scaleFactor,
    defenseBreak: rawStats.defenseBreak * scaleFactor,
    criticalEvasion: rawStats.criticalEvasion * scaleFactor,
    attributePoints,
  };
}

const zoneEnemyPresets = {
  verdant_plains: {
    levelRange: [1, 3],
    presets: [
      { raceId: 'human', classId: 'warrior', levelRange: [1, 2] },
      { raceId: 'orc', classId: 'warrior', levelRange: [1, 3] },
      { raceId: 'human', classId: 'ranger', levelRange: [1, 2] },
    ],
  },
  dark_forest: {
    levelRange: [3, 5],
    presets: [
      { raceId: 'human', classId: 'ranger', levelRange: [3, 5] },
      { raceId: 'orc', classId: 'warrior', levelRange: [3, 4] },
      { raceId: 'elf', classId: 'mage', levelRange: [3, 5] },
    ],
  },
  mystic_grove: {
    levelRange: [4, 6],
    presets: [
      { raceId: 'elf', classId: 'mage', levelRange: [4, 6] },
      { raceId: 'elf', classId: 'ranger', levelRange: [4, 5] },
      { raceId: 'human', classId: 'worge', levelRange: [4, 6] },
    ],
  },
  whispering_caverns: {
    levelRange: [3, 5],
    presets: [
      { raceId: 'dwarf', classId: 'warrior', levelRange: [3, 5] },
      { raceId: 'orc', classId: 'warrior', levelRange: [3, 5] },
      { raceId: 'human', classId: 'ranger', levelRange: [3, 4] },
    ],
  },
  haunted_marsh: {
    levelRange: [5, 7],
    presets: [
      { raceId: 'undead', classId: 'warrior', levelRange: [5, 7] },
      { raceId: 'undead', classId: 'mage', levelRange: [5, 6] },
      { raceId: 'orc', classId: 'worge', levelRange: [5, 7] },
    ],
  },
  cursed_ruins: {
    levelRange: [6, 9],
    presets: [
      { raceId: 'undead', classId: 'mage', levelRange: [6, 8] },
      { raceId: 'undead', classId: 'warrior', levelRange: [6, 9] },
      { raceId: 'dwarf', classId: 'warrior', levelRange: [7, 9] },
    ],
  },
  thornwood_pass: {
    levelRange: [6, 8],
    presets: [
      { raceId: 'orc', classId: 'ranger', levelRange: [6, 8] },
      { raceId: 'human', classId: 'warrior', levelRange: [6, 8] },
      { raceId: 'elf', classId: 'ranger', levelRange: [6, 7] },
    ],
  },
  crystal_caves: {
    levelRange: [7, 9],
    presets: [
      { raceId: 'dwarf', classId: 'warrior', levelRange: [7, 9] },
      { raceId: 'elf', classId: 'mage', levelRange: [7, 9] },
      { raceId: 'dwarf', classId: 'ranger', levelRange: [7, 8] },
    ],
  },
  sunken_temple: {
    levelRange: [7, 9],
    presets: [
      { raceId: 'undead', classId: 'warrior', levelRange: [7, 9] },
      { raceId: 'elf', classId: 'mage', levelRange: [7, 9] },
      { raceId: 'human', classId: 'mage', levelRange: [8, 9] },
    ],
  },
  iron_peaks: {
    levelRange: [8, 11],
    presets: [
      { raceId: 'dwarf', classId: 'warrior', levelRange: [8, 10] },
      { raceId: 'orc', classId: 'warrior', levelRange: [9, 11] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [8, 11] },
    ],
  },
  blood_canyon: {
    levelRange: [9, 12],
    presets: [
      { raceId: 'orc', classId: 'warrior', levelRange: [9, 12] },
      { raceId: 'barbarian', classId: 'worge', levelRange: [9, 11] },
      { raceId: 'orc', classId: 'ranger', levelRange: [10, 12] },
    ],
  },
  frozen_tundra: {
    levelRange: [10, 13],
    presets: [
      { raceId: 'barbarian', classId: 'warrior', levelRange: [10, 13] },
      { raceId: 'dwarf', classId: 'warrior', levelRange: [10, 12] },
      { raceId: 'human', classId: 'mage', levelRange: [11, 13] },
    ],
  },
  ashen_battlefield: {
    levelRange: [10, 13],
    presets: [
      { raceId: 'orc', classId: 'warrior', levelRange: [10, 13] },
      { raceId: 'human', classId: 'warrior', levelRange: [10, 12] },
      { raceId: 'barbarian', classId: 'ranger', levelRange: [11, 13] },
    ],
  },
  windswept_ridge: {
    levelRange: [11, 14],
    presets: [
      { raceId: 'barbarian', classId: 'warrior', levelRange: [11, 14] },
      { raceId: 'dwarf', classId: 'ranger', levelRange: [11, 13] },
      { raceId: 'elf', classId: 'mage', levelRange: [12, 14] },
    ],
  },
  dragon_peaks: {
    levelRange: [11, 14],
    presets: [
      { raceId: 'orc', classId: 'warrior', levelRange: [11, 14] },
      { raceId: 'barbarian', classId: 'ranger', levelRange: [11, 13] },
      { raceId: 'elf', classId: 'mage', levelRange: [12, 14] },
    ],
  },
  molten_core: {
    levelRange: [12, 14],
    presets: [
      { raceId: 'orc', classId: 'warrior', levelRange: [12, 14] },
      { raceId: 'barbarian', classId: 'worge', levelRange: [12, 14] },
      { raceId: 'dwarf', classId: 'warrior', levelRange: [12, 14] },
    ],
  },
  shadow_forest: {
    levelRange: [12, 15],
    presets: [
      { raceId: 'elf', classId: 'ranger', levelRange: [12, 15] },
      { raceId: 'undead', classId: 'mage', levelRange: [12, 14] },
      { raceId: 'human', classId: 'worge', levelRange: [13, 15] },
    ],
  },
  obsidian_wastes: {
    levelRange: [13, 15],
    presets: [
      { raceId: 'orc', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'undead', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'barbarian', classId: 'mage', levelRange: [13, 15] },
    ],
  },
  ruins_of_ashenmoor: {
    levelRange: [13, 16],
    presets: [
      { raceId: 'undead', classId: 'mage', levelRange: [13, 16] },
      { raceId: 'undead', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'orc', classId: 'warrior', levelRange: [14, 16] },
    ],
  },
  blight_hollow: {
    levelRange: [14, 16],
    presets: [
      { raceId: 'undead', classId: 'mage', levelRange: [14, 16] },
      { raceId: 'undead', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'orc', classId: 'worge', levelRange: [14, 16] },
    ],
  },
  shadow_citadel: {
    levelRange: [14, 17],
    presets: [
      { raceId: 'undead', classId: 'mage', levelRange: [14, 17] },
      { raceId: 'undead', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'elf', classId: 'ranger', levelRange: [15, 17] },
    ],
  },
  stormspire_peak: {
    levelRange: [14, 17],
    presets: [
      { raceId: 'elf', classId: 'mage', levelRange: [14, 17] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'dwarf', classId: 'warrior', levelRange: [15, 17] },
    ],
  },
  demon_gate: {
    levelRange: [15, 18],
    presets: [
      { raceId: 'orc', classId: 'warrior', levelRange: [15, 18] },
      { raceId: 'barbarian', classId: 'worge', levelRange: [15, 17] },
      { raceId: 'undead', classId: 'mage', levelRange: [16, 18] },
    ],
  },
  abyssal_depths: {
    levelRange: [16, 18],
    presets: [
      { raceId: 'undead', classId: 'mage', levelRange: [16, 18] },
      { raceId: 'orc', classId: 'worge', levelRange: [16, 18] },
      { raceId: 'elf', classId: 'mage', levelRange: [17, 18] },
    ],
  },
  infernal_forge: {
    levelRange: [16, 18],
    presets: [
      { raceId: 'orc', classId: 'warrior', levelRange: [16, 18] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [16, 18] },
      { raceId: 'dwarf', classId: 'worge', levelRange: [16, 18] },
    ],
  },
  dreadmaw_canyon: {
    levelRange: [17, 19],
    presets: [
      { raceId: 'undead', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'orc', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'barbarian', classId: 'worge', levelRange: [17, 19] },
    ],
  },
  void_threshold: {
    levelRange: [17, 19],
    presets: [
      { raceId: 'undead', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'elf', classId: 'mage', levelRange: [18, 19] },
    ],
  },
  corrupted_spire: {
    levelRange: [18, 20],
    presets: [
      { raceId: 'undead', classId: 'mage', levelRange: [18, 20] },
      { raceId: 'orc', classId: 'worge', levelRange: [18, 20] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [18, 20] },
    ],
  },
  void_throne: {
    levelRange: [18, 20],
    presets: [
      { raceId: 'undead', classId: 'mage', levelRange: [18, 20] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [18, 20] },
      { raceId: 'orc', classId: 'worge', levelRange: [19, 20] },
    ],
  },
};

export function getZoneEnemyPresets(zoneId) {
  return zoneEnemyPresets[zoneId] || null;
}
