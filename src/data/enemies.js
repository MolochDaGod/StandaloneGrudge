import { calculateStats } from './attributes.js';
import { classDefinitions } from './classes.js';
import { raceDefinitions } from './races.js';

export const enemyTemplates = {
  goblin: {
    name: 'Goblin Scout', icon: 'sword', color: '#84cc16',
    baseHealth: 80, baseDamage: 12, baseDefense: 5, baseMana: 20,
    xpReward: 15, goldReward: 8, speed: 14,
    abilities: [
      { id: 'scratch', name: 'Scratch', icon: 'sword', type: 'physical', damage: 1.0, description: 'A quick scratch' },
      { id: 'sneak_stab', name: 'Sneak Stab', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'A backstab attempt' },
    ]
  },
  skeleton: {
    name: 'Skeleton Warrior', icon: 'skull', color: '#d4d4d8',
    baseHealth: 120, baseDamage: 18, baseDefense: 15, baseMana: 0,
    xpReward: 22, goldReward: 12, speed: 10,
    abilities: [
      { id: 'bone_strike', name: 'Bone Strike', icon: 'skull', type: 'physical', damage: 1.1, description: 'A bony slam' },
      { id: 'shield_block', name: 'Shield Block', icon: 'shield', type: 'buff', damage: 0, cooldown: 4, description: 'Raises defense', effect: { stat: 'defense', flat: 20, duration: 2 } },
    ]
  },
  wolf: {
    name: 'Dire Wolf', icon: 'wolf', color: '#78716c',
    baseHealth: 100, baseDamage: 22, baseDefense: 8, baseMana: 0,
    xpReward: 18, goldReward: 6, speed: 18,
    abilities: [
      { id: 'bite', name: 'Bite', icon: 'sword', type: 'physical', damage: 1.2, description: 'A savage bite' },
      { id: 'howl_buff', name: 'Feral Howl', icon: 'sparkle', type: 'buff', damage: 0, cooldown: 5, description: 'Increases damage', effect: { stat: 'damage', multiplier: 1.4, duration: 2 } },
    ]
  },
  dark_mage: {
    name: 'Dark Mage', icon: 'crystal', color: '#7c3aed',
    baseHealth: 90, baseDamage: 25, baseDefense: 6, baseMana: 100,
    xpReward: 30, goldReward: 20, speed: 12,
    abilities: [
      { id: 'shadow_bolt', name: 'Shadow Bolt', icon: 'skull', type: 'magical', damage: 1.3, description: 'A bolt of dark energy' },
      { id: 'dark_nova', name: 'Dark Nova', icon: 'bomb', type: 'magical', damage: 2.2, cooldown: 3, description: 'An explosion of shadow' },
      { id: 'drain_life', name: 'Drain Life', icon: 'crystal', type: 'magical', damage: 0.8, cooldown: 4, description: 'Steals life force', drainPercent: 0.5 },
    ]
  },
  dark_knight: {
    name: 'Dark Knight', icon: 'skull', color: '#4a1a6b',
    baseHealth: 160, baseDamage: 26, baseDefense: 22, baseMana: 30,
    xpReward: 32, goldReward: 18, speed: 10,
    abilities: [
      { id: 'dk_slash', name: 'Sword Slash', icon: 'sword', type: 'physical', damage: 1.2, description: 'A heavy dark blade strike' },
      { id: 'dk_shield', name: 'Shield Wall', icon: 'shield', type: 'buff', damage: 0, cooldown: 4, description: 'Raises a dark shield', effect: { stat: 'defense', flat: 25, duration: 2 } },
      { id: 'dk_crush', name: 'Bone Breaker', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'A crushing overhead blow' },
    ]
  },
  shadow_warrior: {
    name: 'Shadow Warrior', icon: 'skull', color: '#1e1b4b',
    baseHealth: 140, baseDamage: 30, baseDefense: 16, baseMana: 40,
    xpReward: 35, goldReward: 20, speed: 14,
    abilities: [
      { id: 'sw_strike', name: 'Shadow Strike', icon: 'sword', type: 'physical', damage: 1.3, description: 'A swift strike from the shadows' },
      { id: 'sw_frenzy', name: 'Dark Frenzy', icon: 'fire', type: 'buff', damage: 0, cooldown: 5, description: 'Enters a dark frenzy', effect: { stat: 'damage', multiplier: 1.5, duration: 2 } },
      { id: 'sw_leap', name: 'Shadow Leap', icon: 'sword', type: 'physical', damage: 2.0, cooldown: 4, description: 'Leaps at the target with dark energy' },
    ]
  },
  water_priestess_mage: {
    name: 'Water Priestess', icon: 'ice', color: '#0891b2',
    baseHealth: 110, baseDamage: 20, baseMagicDamage: 32, baseDefense: 12, baseMana: 150,
    xpReward: 38, goldReward: 24, speed: 12,
    abilities: [
      { id: 'wp_bolt', name: 'Tidal Strike', icon: 'ice', type: 'magical', damage: 1.3, description: 'A bolt of pressurized water' },
      { id: 'wp_heal', name: 'Healing Tide', icon: 'heart', type: 'heal', damage: 0, cooldown: 4, description: 'Heals with tidal energy', healPercent: 0.15 },
      { id: 'wp_frost', name: 'Frozen Prison', icon: 'ice', type: 'magical', damage: 1.8, cooldown: 3, description: 'Encases in ice', effect: { type: 'stun', duration: 1 } },
    ]
  },
  orc: {
    name: 'Orc Berserker', icon: 'sword', color: '#65a30d',
    baseHealth: 180, baseDamage: 28, baseDefense: 20, baseMana: 0,
    xpReward: 35, goldReward: 18, speed: 8,
    abilities: [
      { id: 'smash', name: 'Smash', icon: 'sword', type: 'physical', damage: 1.2, description: 'A powerful smash' },
      { id: 'berserk', name: 'Berserk', icon: 'fire', type: 'buff', damage: 0, cooldown: 5, description: 'Goes berserk', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'ground_pound', name: 'Ground Pound', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'Slams the ground' },
    ]
  },
  dragon_whelp: {
    name: 'Dragon Whelp', icon: 'fire', color: '#dc2626',
    baseHealth: 150, baseDamage: 30, baseDefense: 18, baseMana: 80,
    xpReward: 45, goldReward: 30, speed: 15,
    abilities: [
      { id: 'claw', name: 'Claw', icon: 'sword', type: 'physical', damage: 1.1, description: 'A claw swipe' },
      { id: 'fire_breath', name: 'Fire Breath', icon: 'fire', type: 'magical', damage: 2.0, cooldown: 3, description: 'Breathes fire' },
      { id: 'tail_whip', name: 'Tail Whip', icon: 'sparkle', type: 'physical', damage: 1.5, cooldown: 2, description: 'A tail strike' },
    ]
  },
  lich: {
    name: 'Lich Lord', icon: 'skull', color: '#6366f1',
    baseHealth: 700, baseDamage: 40, baseDefense: 22, baseMana: 350,
    xpReward: 120, goldReward: 90, speed: 11,
    isBoss: true,
    abilities: [
      { id: 'soul_bolt', name: 'Soul Bolt', icon: 'skull', type: 'magical', damage: 1.4, description: 'A bolt of soul energy' },
      { id: 'death_coil', name: 'Death Coil', icon: 'skull', type: 'magical', damage: 2.5, cooldown: 3, description: 'Devastating necrotic blast that steals life', drainPercent: 0.4 },
      { id: 'bone_shield', name: 'Bone Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Summons bone armor', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'soul_drain', name: 'Soul Drain', icon: 'crystal', type: 'heal', damage: 0, cooldown: 4, description: 'Drains life from all nearby souls', healPercent: 0.15, drainPercent: 0.5 },
      { id: 'raise_dead', name: 'Raise Dead', icon: 'skull', type: 'buff', damage: 0, cooldown: 7, description: 'Enrages with undead fury', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'shadow_nova', name: 'Shadow Nova', icon: 'skull', type: 'magical', damage: 3.0, cooldown: 5, description: 'Unleashes a wave of shadow energy' },
      { id: 'curse_weakness', name: 'Curse of Weakness', icon: 'skull', type: 'magical', damage: 0.5, cooldown: 4, description: 'Curses a hero, reducing their damage', effect: { type: 'dot', damage: 0.10, duration: 4 } },
    ]
  },
  red_dragon: {
    name: 'Ignaroth, Flame Terror', icon: 'fire', color: '#dc2626',
    baseHealth: 1100, baseDamage: 58, baseDefense: 38, baseMana: 300,
    xpReward: 400, goldReward: 300, speed: 16,
    isBoss: true,
    isWorldBoss: true,
    abilities: [
      { id: 'dragon_claw', name: 'Dragon Claw', icon: 'sword', type: 'physical', damage: 1.8, description: 'Rakes with massive burning claws' },
      { id: 'inferno_breath', name: 'Inferno Breath', icon: 'fire', type: 'magical', damage: 3.0, cooldown: 3, description: 'Unleashes a torrent of dragonfire', isAoE: true },
      { id: 'wing_buffet', name: 'Wing Buffet', icon: 'energy', type: 'physical', damage: 2.2, cooldown: 4, description: 'Batters all heroes with massive wings', isAoE: true },
      { id: 'molten_armor', name: 'Molten Armor', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Coats scales in molten rock', effect: { stat: 'defense', flat: 50, duration: 3 } },
      { id: 'tail_slam', name: 'Tail Slam', icon: 'sword', type: 'physical', damage: 2.5, cooldown: 3, description: 'Crushes a hero with a devastating tail strike', effect: { type: 'stun', duration: 1 } },
      { id: 'dragon_roar', name: 'Terrifying Roar', icon: 'fire', type: 'buff', damage: 0, cooldown: 6, description: 'A roar that shakes the very earth', effect: { stat: 'damage', multiplier: 1.8, duration: 3 } },
    ]
  },
  red_dragon_2: {
    name: 'Vyraxes, Ember Wyrm', icon: 'fire', color: '#ef4444',
    baseHealth: 1000, baseDamage: 62, baseDefense: 35, baseMana: 280,
    xpReward: 400, goldReward: 300, speed: 18,
    isBoss: true,
    isWorldBoss: true,
    abilities: [
      { id: 'rend', name: 'Rending Bite', icon: 'sword', type: 'physical', damage: 2.0, description: 'Bites through armor with superheated fangs' },
      { id: 'fire_storm', name: 'Fire Storm', icon: 'fire', type: 'magical', damage: 2.8, cooldown: 3, description: 'Engulfs the battlefield in flames', isAoE: true },
      { id: 'dive_attack', name: 'Dive Attack', icon: 'sword', type: 'physical', damage: 3.5, cooldown: 5, description: 'Dives from the sky with devastating force' },
      { id: 'flame_shield', name: 'Flame Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Wraps in protective fire', effect: { stat: 'defense', flat: 45, duration: 3 } },
      { id: 'scorched_earth', name: 'Scorched Earth', icon: 'fire', type: 'magical', damage: 1.5, cooldown: 4, description: 'Burns the ground beneath all heroes', isAoE: true, effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'berserk_fury', name: 'Draconic Fury', icon: 'fire', type: 'buff', damage: 0, cooldown: 7, description: 'Enters a primal draconic rage', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
    ]
  },
  white_dragon_mother: {
    name: 'Zephyria, The Dragon Mother', icon: 'fire', color: '#e2e8f0',
    baseHealth: 2200, baseDamage: 80, baseDefense: 50, baseMana: 500,
    xpReward: 600, goldReward: 500, speed: 17,
    isBoss: true,
    isWorldBoss: true,
    abilities: [
      { id: 'frost_claw', name: 'Ancient Claw', icon: 'sword', type: 'physical', damage: 2.2, description: 'Strikes with primordial fury' },
      { id: 'divine_breath', name: 'Divine Breath', icon: 'ice', type: 'magical', damage: 3.5, cooldown: 3, description: 'A breath of pure elemental energy scorches all', isAoE: true },
      { id: 'mothers_wrath', name: "Mother's Wrath", icon: 'fire', type: 'magical', damage: 5.0, cooldown: 6, description: 'Unleashes devastating fury for her fallen children', isAoE: true },
      { id: 'ancient_scales', name: 'Ancient Scales', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Scales harden to impenetrable diamond', effect: { stat: 'defense', flat: 80, duration: 3 } },
      { id: 'dragon_heal', name: 'Primordial Restoration', icon: 'heart', type: 'heal', damage: 0, cooldown: 5, description: 'Draws on ancient power to heal wounds', healPercent: 0.12 },
      { id: 'tail_sweep', name: 'Tail Sweep', icon: 'sword', type: 'physical', damage: 2.8, cooldown: 3, description: 'Sweeps all heroes with massive tail', isAoE: true },
      { id: 'sky_fury', name: 'Sky Fury', icon: 'energy', type: 'magical', damage: 4.2, cooldown: 5, description: 'Calls down pillars of elemental fury' },
      { id: 'terrify', name: 'Ancient Terror', icon: 'skull', type: 'magical', damage: 1.0, cooldown: 5, description: 'Paralyzes with primordial dread', effect: { type: 'stun', duration: 2 } },
      { id: 'enrage', name: 'Vengeance Incarnate', icon: 'fire', type: 'buff', damage: 0, cooldown: 8, description: 'Power surges with motherly vengeance', effect: { stat: 'damage', multiplier: 2.5, duration: 3 } },
    ]
  },
  fire_worm: {
    name: 'Fire Worm', icon: 'fire', color: '#f97316',
    baseHealth: 180, baseDamage: 32, baseDefense: 18, baseMana: 60,
    xpReward: 45, goldReward: 30, speed: 10,
    abilities: [
      { id: 'lava_spit', name: 'Lava Spit', icon: 'fire', type: 'magical', damage: 1.4, description: 'Spits molten lava' },
      { id: 'worm_bite', name: 'Gnashing Bite', icon: 'sword', type: 'physical', damage: 1.6, cooldown: 3, description: 'Chomps with fiery jaws' },
      { id: 'burrow_strike', name: 'Burrow Strike', icon: 'sword', type: 'physical', damage: 2.0, cooldown: 4, description: 'Burrows underground and erupts beneath the target' },
    ]
  },
  demon_lord: {
    name: 'Infernal Fire Worm', icon: 'fire', color: '#f97316',
    baseHealth: 900, baseDamage: 52, baseDefense: 35, baseMana: 250,
    xpReward: 160, goldReward: 120, speed: 13,
    isBoss: true,
    bossScale: 2.5,
    abilities: [
      { id: 'lava_spit', name: 'Lava Spit', icon: 'fire', type: 'magical', damage: 1.6, description: 'Spits molten lava' },
      { id: 'worm_bite', name: 'Savage Bite', icon: 'sword', type: 'physical', damage: 3.0, cooldown: 4, description: 'A crushing bite' },
      { id: 'heat_wave', name: 'Heat Wave', icon: 'fire', type: 'magical', damage: 2.2, cooldown: 3, description: 'Radiates intense heat', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'volcanic_slam', name: 'Volcanic Slam', icon: 'shield', type: 'physical', damage: 3.5, cooldown: 6, description: 'Slams the ground with infernal force' },
    ]
  },
  evil_wizard: {
    name: 'Malachar the Undying', icon: 'crystal', color: '#c026d3',
    baseHealth: 1400, baseDamage: 65, baseDefense: 35, baseMana: 600,
    xpReward: 350, goldReward: 250, speed: 14,
    isBoss: true,
    abilities: [
      { id: 'arcane_bolt', name: 'Arcane Bolt', icon: 'crystal', type: 'magical', damage: 1.6, description: 'A crackling bolt of dark arcane energy' },
      { id: 'chaos_storm', name: 'Chaos Storm', icon: 'chaos', type: 'magical', damage: 3.2, cooldown: 4, description: 'Unleashes a storm of chaotic energy on all heroes' },
      { id: 'soul_siphon', name: 'Soul Siphon', icon: 'crystal', type: 'magical', damage: 1.8, cooldown: 3, description: 'Drains life force to restore health', drainPercent: 0.6 },
      { id: 'dark_barrier', name: 'Dark Barrier', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Erects a barrier of dark magic', effect: { stat: 'defense', flat: 50, duration: 3 } },
      { id: 'necrotic_curse', name: 'Necrotic Curse', icon: 'skull', type: 'magical', damage: 1.0, cooldown: 4, description: 'Curses a hero with necrotic decay', effect: { type: 'dot', damage: 0.15, duration: 4 } },
      { id: 'hellfire_rain', name: 'Hellfire Rain', icon: 'fire', type: 'magical', damage: 4.0, cooldown: 6, description: 'Rains hellfire from the sky, scorching all heroes' },
      { id: 'petrify', name: 'Petrify', icon: 'shield', type: 'magical', damage: 0.5, cooldown: 5, description: 'Turns a hero to stone briefly', effect: { type: 'stun', duration: 2 } },
      { id: 'dark_empowerment', name: 'Dark Empowerment', icon: 'fire', type: 'buff', damage: 0, cooldown: 7, description: 'Channels forbidden power, greatly boosting damage', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
      { id: 'shadow_teleport', name: 'Shadow Teleport', icon: 'chaos', type: 'buff', damage: 0, cooldown: 6, description: 'Teleports through shadow, greatly boosting speed', effect: { stat: 'speed', flat: 20, duration: 2 } },
    ]
  },
  void_king: {
    name: 'The Void King', icon: 'crown', color: '#fbbf24',
    baseHealth: 1200, baseDamage: 60, baseDefense: 48, baseMana: 500,
    xpReward: 300, goldReward: 200, speed: 16,
    isBoss: true,
    abilities: [
      { id: 'void_slash', name: 'Void Slash', icon: 'chaos', type: 'physical', damage: 1.8, description: 'A slash through the fabric of reality' },
      { id: 'annihilate', name: 'Annihilate', icon: 'bomb', type: 'magical', damage: 3.5, cooldown: 4, description: 'Pure destruction unleashed on all' },
      { id: 'void_barrier', name: 'Void Barrier', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Impenetrable void shield', effect: { stat: 'defense', flat: 60, duration: 3 } },
      { id: 'reality_tear', name: 'Reality Tear', icon: 'chaos', type: 'magical', damage: 4.5, cooldown: 7, description: 'Tears reality asunder, devastating all' },
      { id: 'void_drain', name: 'Void Drain', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Absorbs life force from the void', healPercent: 0.12 },
      { id: 'oblivion_pulse', name: 'Oblivion Pulse', icon: 'sparkle', type: 'magical', damage: 2.2, cooldown: 3, description: 'Radiates obliterating energy at all', effect: { type: 'dot', damage: 0.15, duration: 3 } },
      { id: 'time_stop', name: 'Time Stop', icon: 'sparkle', type: 'magical', damage: 0.6, cooldown: 6, description: 'Freezes a hero in time', effect: { type: 'stun', duration: 2 } },
      { id: 'void_enrage', name: 'Void Enrage', icon: 'fire', type: 'buff', damage: 0, cooldown: 8, description: 'The Void King enters a furious state', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
    ]
  },
  god_odin: {
    name: 'Odin, The Allfather', icon: 'lightning', color: '#fbbf24',
    baseHealth: 1800, baseDamage: 75, baseDefense: 55, baseMana: 600,
    xpReward: 500, goldReward: 400, speed: 18,
    isBoss: true,
    isGod: true,
    faction: 'crusade',
    abilities: [
      { id: 'gungnir', name: 'Gungnir', icon: 'sword', type: 'physical', damage: 2.2, description: 'Hurls the divine spear Gungnir' },
      { id: 'thunderclap', name: 'Thunderclap', icon: 'lightning', type: 'magical', damage: 3.8, cooldown: 4, description: 'Lightning crashes down from the heavens' },
      { id: 'divine_shield', name: 'Divine Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 6, description: 'An impenetrable divine barrier', effect: { stat: 'defense', flat: 80, duration: 3 } },
      { id: 'wisdom_sight', name: 'Wisdom of the Ages', icon: 'crystal', type: 'buff', damage: 0, cooldown: 7, description: 'Sees all weaknesses, boosting damage', effect: { stat: 'damage', multiplier: 2.2, duration: 3 } },
      { id: 'valkyrie_storm', name: 'Valkyrie Storm', icon: 'crossed_swords', type: 'magical', damage: 4.5, cooldown: 6, description: 'Summons a storm of divine warriors' },
      { id: 'ragnarok', name: 'Ragnarok', icon: 'fire', type: 'magical', damage: 5.0, cooldown: 8, description: 'Unleashes the end of all things' },
      { id: 'divine_heal', name: 'Divine Restoration', icon: 'sparkle', type: 'heal', damage: 0, cooldown: 5, description: 'Restores vitality through divine power', healPercent: 0.15 },
      { id: 'time_freeze', name: 'Temporal Halt', icon: 'sparkle', type: 'magical', damage: 0.8, cooldown: 5, description: 'Freezes a hero outside of time', effect: { type: 'stun', duration: 2 } },
    ]
  },
  god_madra: {
    name: 'Madra, The Devourer', icon: 'target', color: '#dc2626',
    baseHealth: 2000, baseDamage: 82, baseDefense: 45, baseMana: 500,
    xpReward: 500, goldReward: 400, speed: 17,
    isBoss: true,
    isGod: true,
    faction: 'legion',
    abilities: [
      { id: 'blood_rend', name: 'Blood Rend', icon: 'target', type: 'physical', damage: 2.0, description: 'Tears flesh with claws of blood' },
      { id: 'soul_devour', name: 'Soul Devour', icon: 'skull', type: 'magical', damage: 3.5, cooldown: 4, description: 'Consumes a hero\'s soul energy', drainPercent: 0.5 },
      { id: 'corruption_aura', name: 'Corruption Aura', icon: 'skull', type: 'magical', damage: 1.5, cooldown: 3, description: 'Radiates corrupting energy', effect: { type: 'dot', damage: 0.18, duration: 4 } },
      { id: 'blood_frenzy', name: 'Blood Frenzy', icon: 'fire', type: 'buff', damage: 0, cooldown: 6, description: 'Enters a blood-mad frenzy', effect: { stat: 'damage', multiplier: 2.5, duration: 3 } },
      { id: 'death_grip', name: 'Death Grip', icon: 'sword', type: 'magical', damage: 1.2, cooldown: 5, description: 'Grips a hero with deathly force', effect: { type: 'stun', duration: 2 } },
      { id: 'apocalypse', name: 'Apocalypse', icon: 'bomb', type: 'magical', damage: 5.5, cooldown: 8, description: 'Brings forth total annihilation' },
      { id: 'vampiric_feast', name: 'Vampiric Feast', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Feasts on blood to heal wounds', healPercent: 0.18 },
      { id: 'plague_wave', name: 'Plague Wave', icon: 'skull', type: 'magical', damage: 2.8, cooldown: 5, description: 'A wave of plague washes over all' },
    ]
  },
  god_omni: {
    name: 'The Omni, Weaver of Fate', icon: 'sparkle', color: '#a78bfa',
    baseHealth: 1600, baseDamage: 70, baseDefense: 60, baseMana: 800,
    xpReward: 500, goldReward: 400, speed: 20,
    isBoss: true,
    isGod: true,
    faction: 'fabled',
    abilities: [
      { id: 'arcane_blast', name: 'Arcane Blast', icon: 'sparkle', type: 'magical', damage: 2.0, description: 'A blast of pure arcane energy' },
      { id: 'fate_weave', name: 'Fate Weave', icon: 'chaos', type: 'magical', damage: 3.2, cooldown: 4, description: 'Rewrites fate to deal massive damage' },
      { id: 'cosmic_barrier', name: 'Cosmic Barrier', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'A barrier woven from starlight', effect: { stat: 'defense', flat: 70, duration: 3 } },
      { id: 'time_warp', name: 'Time Warp', icon: 'sparkle', type: 'magical', damage: 1.0, cooldown: 5, description: 'Warps time around a hero', effect: { type: 'stun', duration: 2 } },
      { id: 'stellar_rain', name: 'Stellar Rain', icon: 'sparkle', type: 'magical', damage: 4.8, cooldown: 6, description: 'Stars fall from the heavens' },
      { id: 'genesis', name: 'Genesis', icon: 'sparkle', type: 'magical', damage: 5.5, cooldown: 9, description: 'Unmakes and remakes reality itself' },
      { id: 'cosmic_heal', name: 'Cosmic Restoration', icon: 'crystal', type: 'heal', damage: 0, cooldown: 5, description: 'Draws healing from the cosmic weave', healPercent: 0.14 },
      { id: 'mind_shatter', name: 'Mind Shatter', icon: 'mind', type: 'magical', damage: 2.5, cooldown: 4, description: 'Shatters the mind with psychic force', effect: { type: 'dot', damage: 0.20, duration: 3 } },
    ]
  },
  water_elemental: {
    name: 'Grand Water Elemental', icon: 'ice', color: '#06b6d4',
    baseHealth: 550, baseDamage: 50, baseDefense: 38, baseMana: 300,
    xpReward: 175, goldReward: 120, speed: 14,
    isBoss: true,
    abilities: [
      { id: 'tidal_strike', name: 'Tidal Strike', icon: 'ice', type: 'magical', damage: 1.4, description: 'A crashing wave of water' },
      { id: 'torrent', name: 'Torrent', icon: 'ice', type: 'magical', damage: 2.5, cooldown: 3, description: 'A devastating torrent that poisons', effect: { type: 'dot', damage: 0.15, duration: 3 } },
      { id: 'frost_armor', name: 'Frost Armor', icon: 'ice', type: 'buff', damage: 0, cooldown: 5, description: 'Encases in ice armor', effect: { stat: 'defense', flat: 45, duration: 3 } },
      { id: 'tsunami', name: 'Tsunami', icon: 'chaos', type: 'magical', damage: 3.5, cooldown: 6, description: 'A massive wave crashes down on all' },
      { id: 'healing_tide', name: 'Healing Tide', icon: 'heart', type: 'heal', damage: 0, cooldown: 5, description: 'Heals with the power of the tides', healPercent: 0.18 },
      { id: 'frozen_prison', name: 'Frozen Prison', icon: 'ice', type: 'magical', damage: 1.0, cooldown: 4, description: 'Freezes a hero solid', effect: { type: 'stun', duration: 1 } },
    ]
  },
  nature_elemental: {
    name: 'Grand Nature Elemental', icon: 'nature', color: '#22c55e',
    baseHealth: 600, baseDamage: 44, baseDefense: 42, baseMana: 250,
    xpReward: 175, goldReward: 120, speed: 12,
    isBoss: true,
    abilities: [
      { id: 'vine_lash', name: 'Vine Lash', icon: 'nature', type: 'physical', damage: 1.3, description: 'Thorned vines whip out' },
      { id: 'natures_wrath', name: "Nature's Wrath", icon: 'nature', type: 'magical', damage: 2.4, cooldown: 3, description: 'The fury of nature unleashed', effect: { type: 'dot', damage: 0.18, duration: 3 } },
      { id: 'regenerate', name: 'Regenerate', icon: 'heart', type: 'heal', damage: 0, cooldown: 4, description: 'Regenerates health rapidly', healPercent: 0.20 },
      { id: 'earthquake', name: 'Earthquake', icon: 'shield', type: 'physical', damage: 3.5, cooldown: 6, description: 'The earth splits apart, hitting all heroes' },
      { id: 'thorn_armor', name: 'Thorn Armor', icon: 'nature', type: 'buff', damage: 0, cooldown: 5, description: 'Reflects damage back to attackers', effect: { stat: 'defense', flat: 35, duration: 3 } },
      { id: 'root_bind', name: 'Root Bind', icon: 'nature', type: 'magical', damage: 0.8, cooldown: 4, description: 'Roots entangle a hero, stunning them', effect: { type: 'stun', duration: 1 } },
    ]
  },
  grand_shaman: {
    name: 'Grand Shaman', icon: 'nature', color: '#16a34a',
    baseHealth: 500, baseDamage: 32, baseDefense: 18, baseMana: 200,
    xpReward: 80, goldReward: 55, speed: 11,
    isBoss: true,
    abilities: [
      { id: 'nature_bolt', name: 'Nature Bolt', icon: 'nature', type: 'magical', damage: 1.3, description: 'A bolt of concentrated nature energy' },
      { id: 'healing_rain', name: 'Healing Rain', icon: 'bow', type: 'heal', damage: 0, cooldown: 4, description: 'Calls healing rain to restore vitality', healPercent: 0.18 },
      { id: 'thorn_burst', name: 'Thorn Burst', icon: 'nature', type: 'magical', damage: 2.2, cooldown: 3, description: 'Thorns erupt from the ground hitting all', effect: { type: 'dot', damage: 0.10, duration: 3 } },
      { id: 'bark_shield', name: 'Bark Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Encases in hardened bark', effect: { stat: 'defense', flat: 30, duration: 3 } },
      { id: 'entangle', name: 'Entangle', icon: 'nature', type: 'magical', damage: 0.6, cooldown: 5, description: 'Roots grab and hold a hero', effect: { type: 'stun', duration: 1 } },
    ]
  },
  canyon_warlord: {
    name: 'Canyon Warlord', icon: 'crossed_swords', color: '#b91c1c',
    baseHealth: 650, baseDamage: 38, baseDefense: 28, baseMana: 50,
    xpReward: 95, goldReward: 65, speed: 10,
    isBoss: true,
    abilities: [
      { id: 'cleave', name: 'Cleave', icon: 'axe', type: 'physical', damage: 1.4, description: 'A massive cleaving strike' },
      { id: 'war_cry', name: 'War Cry', icon: 'sword', type: 'buff', damage: 0, cooldown: 5, description: 'Enrages into a battle fury', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'skull_crusher', name: 'Skull Crusher', icon: 'skull', type: 'physical', damage: 2.8, cooldown: 4, description: 'A devastating overhead smash' },
      { id: 'iron_skin', name: 'Iron Skin', icon: 'shield', type: 'buff', damage: 0, cooldown: 6, description: 'Hardens skin like iron', effect: { stat: 'defense', flat: 35, duration: 3 } },
      { id: 'bloodlust', name: 'Bloodlust', icon: 'target', type: 'physical', damage: 1.6, cooldown: 3, description: 'Frenzied strikes that drain life', drainPercent: 0.3 },
    ]
  },
  frost_wyrm: {
    name: 'Frost Wyrm', icon: 'ice', color: '#38bdf8',
    baseHealth: 750, baseDamage: 42, baseDefense: 30, baseMana: 200,
    xpReward: 110, goldReward: 80, speed: 14,
    isBoss: true,
    abilities: [
      { id: 'ice_fang', name: 'Ice Fang', icon: 'sword', type: 'physical', damage: 1.3, description: 'Freezing bite attack' },
      { id: 'blizzard_breath', name: 'Blizzard Breath', icon: 'ice', type: 'magical', damage: 2.5, cooldown: 3, description: 'Breathes a devastating blizzard', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'ice_armor', name: 'Ice Armor', icon: 'ice', type: 'buff', damage: 0, cooldown: 5, description: 'Encases in thick ice armor', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'glacial_slam', name: 'Glacial Slam', icon: 'crystal', type: 'physical', damage: 3.0, cooldown: 5, description: 'Slams the ground creating ice spikes' },
      { id: 'freeze', name: 'Freeze', icon: 'ice', type: 'magical', damage: 0.8, cooldown: 4, description: 'Freezes a hero solid in ice', effect: { type: 'stun', duration: 1 } },
      { id: 'frost_heal', name: 'Frost Regeneration', icon: 'heart', type: 'heal', damage: 0, cooldown: 5, description: 'Absorbs cold to heal wounds', healPercent: 0.12 },
    ]
  },
  shadow_beast: {
    name: 'Shadow Beast', icon: 'skull', color: '#6b21a8',
    baseHealth: 800, baseDamage: 45, baseDefense: 25, baseMana: 250,
    xpReward: 130, goldReward: 90, speed: 15,
    isBoss: true,
    abilities: [
      { id: 'shadow_claw', name: 'Shadow Claw', icon: 'skull', type: 'physical', damage: 1.4, description: 'Claws made of living shadow' },
      { id: 'dark_pulse', name: 'Dark Pulse', icon: 'crystal', type: 'magical', damage: 2.4, cooldown: 3, description: 'A pulse of dark energy hitting all', effect: { type: 'dot', damage: 0.14, duration: 3 } },
      { id: 'shadow_veil', name: 'Shadow Veil', icon: 'chaos', type: 'buff', damage: 0, cooldown: 5, description: 'Wraps in shadows increasing defense', effect: { stat: 'defense', flat: 35, duration: 3 } },
      { id: 'devour', name: 'Devour', icon: 'fire', type: 'physical', damage: 2.0, cooldown: 4, description: 'Devours life force from a hero', drainPercent: 0.4 },
      { id: 'nightmare', name: 'Nightmare', icon: 'skull', type: 'magical', damage: 1.0, cooldown: 5, description: 'Traps a hero in a nightmare', effect: { type: 'stun', duration: 1 } },
      { id: 'shadow_mend', name: 'Shadow Mend', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Feeds on darkness to heal', healPercent: 0.14 },
    ]
  },
  forest_guardian: {
    name: 'Guardian of the Forest', icon: 'nature', color: '#22c55e',
    baseHealth: 280, baseDamage: 28, baseDefense: 18, baseMana: 120,
    xpReward: 50, goldReward: 35, speed: 11,
    abilities: [
      { id: 'nature_strike', name: 'Nature Strike', icon: 'nature', type: 'physical', damage: 1.1, description: 'A vine-lashed charge attack' },
      { id: 'forest_heal', name: 'Forest Heal', icon: 'heart', type: 'heal', damage: 0, cooldown: 4, description: 'Channels the forest to heal wounds', healPercent: 0.15 },
      { id: 'poison_spore', name: 'Poison Spore', icon: 'skull', type: 'magical', damage: 0.8, cooldown: 3, description: 'Releases toxic spores that poison the target', effect: { type: 'dot', damage: 0.12, duration: 3 } },
    ]
  },
  corrupted_grove_keeper: {
    name: 'Corrupted Grove Keeper', icon: 'crystal', color: '#16a34a',
    baseHealth: 600, baseDamage: 35, baseDefense: 20, baseMana: 300,
    xpReward: 100, goldReward: 70, speed: 12,
    isBoss: true,
    bossScale: 3.0,
    abilities: [
      { id: 'corrupted_bolt', name: 'Corrupted Bolt', icon: 'skull', type: 'magical', damage: 1.3, description: 'A bolt of corrupted nature magic' },
      { id: 'verdant_stun', name: 'Verdant Stun', icon: 'nature', type: 'magical', damage: 0.8, cooldown: 4, description: 'Entangling roots stun a hero in place', effect: { type: 'stun', duration: 1 } },
      { id: 'grove_fireball', name: 'Grove Fireball', icon: 'nature', type: 'magical', damage: 2.4, cooldown: 3, description: 'Hurls a massive green fireball of corrupted energy' },
      { id: 'resurrect_guardian', name: 'Resurrect Guardian', icon: 'heart', type: 'resurrect', damage: 0, cooldown: 6, description: 'Channels dark nature magic to resurrect a fallen Guardian', isResurrect: true },
      { id: 'dark_bloom', name: 'Dark Bloom', icon: 'nature', type: 'magical', damage: 1.8, cooldown: 4, description: 'Dark flowers bloom dealing damage and reducing defense', effect: { stat: 'defense', flat: -15, duration: 3 } },
    ]
  },
  void_sentinel: {
    name: 'Void Sentinel', icon: 'crystal', color: '#a855f7',
    baseHealth: 1000, baseDamage: 55, baseDefense: 42, baseMana: 400,
    xpReward: 200, goldReward: 150, speed: 13,
    isBoss: true,
    abilities: [
      { id: 'void_strike', name: 'Void Strike', icon: 'chaos', type: 'physical', damage: 1.5, description: 'A strike infused with void energy' },
      { id: 'reality_rift', name: 'Reality Rift', icon: 'chaos', type: 'magical', damage: 3.0, cooldown: 4, description: 'Tears open a rift in reality' },
      { id: 'void_shield', name: 'Void Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Erects an impenetrable void barrier', effect: { stat: 'defense', flat: 50, duration: 3 } },
      { id: 'entropy_pulse', name: 'Entropy Pulse', icon: 'sparkle', type: 'magical', damage: 2.0, cooldown: 3, description: 'Radiates entropic energy at all heroes', effect: { type: 'dot', damage: 0.14, duration: 3 } },
      { id: 'dimensional_lock', name: 'Dimensional Lock', icon: 'sparkle', type: 'magical', damage: 0.8, cooldown: 5, description: 'Locks a hero between dimensions', effect: { type: 'stun', duration: 2 } },
      { id: 'void_siphon', name: 'Void Siphon', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Siphons energy from the void to heal', healPercent: 0.13 },
      { id: 'null_burst', name: 'Null Burst', icon: 'bomb', type: 'magical', damage: 3.5, cooldown: 6, description: 'Unleashes a burst of pure nothingness' },
    ]
  },
  abyssal_demon: {
    name: 'Abyssal Demon Lord', icon: 'fire', color: '#dc2626',
    baseHealth: 1600, baseDamage: 72, baseDefense: 40, baseMana: 400,
    xpReward: 400, goldReward: 300, speed: 15,
    isBoss: true,
    bossScale: 2.2,
    abilities: [
      { id: 'demon_cleave', name: 'Abyssal Cleave', icon: 'axe', type: 'physical', damage: 2.0, description: 'A massive cleave from the abyss' },
      { id: 'hellfire_eruption', name: 'Hellfire Eruption', icon: 'fire', type: 'magical', damage: 3.5, cooldown: 4, description: 'Fire erupts from the ground under all heroes' },
      { id: 'demon_roar', name: 'Demon Roar', icon: 'skull', type: 'buff', damage: 0, cooldown: 5, description: 'Roars with demonic fury, boosting damage', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
      { id: 'soul_crush', name: 'Soul Crush', icon: 'skull', type: 'physical', damage: 4.0, cooldown: 6, description: 'Crushes the soul of a single hero' },
      { id: 'abyssal_drain', name: 'Abyssal Drain', icon: 'skull', type: 'magical', damage: 2.0, cooldown: 4, description: 'Drains life through dark magic', drainPercent: 0.5 },
      { id: 'infernal_shield', name: 'Infernal Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 6, description: 'Wraps in hellfire armor', effect: { stat: 'defense', flat: 55, duration: 3 } },
      { id: 'demon_stun', name: 'Abyssal Gaze', icon: 'crystal', type: 'magical', damage: 1.0, cooldown: 5, description: 'Paralyzes a hero with demonic gaze', effect: { type: 'stun', duration: 2 } },
    ]
  },
  eldritch_horror: {
    name: 'The Eldritch Horror', icon: 'chaos', color: '#065f46',
    baseHealth: 1800, baseDamage: 68, baseDefense: 35, baseMana: 500,
    xpReward: 450, goldReward: 350, speed: 12,
    isBoss: true,
    bossScale: 2.5,
    abilities: [
      { id: 'tentacle_lash', name: 'Tentacle Lash', icon: 'skull', type: 'physical', damage: 1.8, description: 'Lashes out with eldritch tentacles' },
      { id: 'madness_wave', name: 'Madness Wave', icon: 'chaos', type: 'magical', damage: 3.0, cooldown: 4, description: 'A wave of madness washes over all heroes', effect: { type: 'dot', damage: 0.16, duration: 4 } },
      { id: 'eldritch_scream', name: 'Eldritch Scream', icon: 'skull', type: 'magical', damage: 1.2, cooldown: 5, description: 'A scream from beyond that stuns with terror', effect: { type: 'stun', duration: 2 } },
      { id: 'void_consumption', name: 'Void Consumption', icon: 'chaos', type: 'magical', damage: 2.5, cooldown: 3, description: 'Consumes a hero with void energy', drainPercent: 0.6 },
      { id: 'cosmic_regeneration', name: 'Cosmic Regeneration', icon: 'heart', type: 'heal', damage: 0, cooldown: 5, description: 'Regenerates through cosmic energy', healPercent: 0.16 },
      { id: 'reality_shatter', name: 'Reality Shatter', icon: 'bomb', type: 'magical', damage: 4.5, cooldown: 7, description: 'Shatters the fabric of reality itself' },
      { id: 'abyssal_armor', name: 'Abyssal Armor', icon: 'shield', type: 'buff', damage: 0, cooldown: 6, description: 'Encases in otherworldly armor', effect: { stat: 'defense', flat: 60, duration: 3 } },
      { id: 'mind_flay', name: 'Mind Flay', icon: 'crystal', type: 'magical', damage: 2.2, cooldown: 4, description: 'Flays the mind with psychic torment' },
    ]
  },
  frost_titan: {
    name: 'Frost Titan', icon: 'ice', color: '#67e8f9',
    baseHealth: 1500, baseDamage: 65, baseDefense: 50, baseMana: 350,
    xpReward: 380, goldReward: 280, speed: 10,
    isBoss: true,
    bossScale: 2.0,
    abilities: [
      { id: 'frost_smash', name: 'Frost Smash', icon: 'ice', type: 'physical', damage: 2.2, description: 'A devastating icy smash' },
      { id: 'absolute_zero', name: 'Absolute Zero', icon: 'ice', type: 'magical', damage: 3.8, cooldown: 5, description: 'Drops temperature to absolute zero on all heroes' },
      { id: 'ice_prison', name: 'Ice Prison', icon: 'ice', type: 'magical', damage: 1.0, cooldown: 4, description: 'Encases a hero in unbreakable ice', effect: { type: 'stun', duration: 2 } },
      { id: 'glacial_armor', name: 'Glacial Armor', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Hardens into impenetrable glacial armor', effect: { stat: 'defense', flat: 65, duration: 3 } },
      { id: 'frost_breath', name: 'Frost Breath', icon: 'ice', type: 'magical', damage: 2.5, cooldown: 3, description: 'Breathes devastating frost energy', effect: { type: 'dot', damage: 0.14, duration: 3 } },
      { id: 'permafrost_heal', name: 'Permafrost', icon: 'heart', type: 'heal', damage: 0, cooldown: 6, description: 'Draws power from eternal ice to heal', healPercent: 0.14 },
      { id: 'avalanche', name: 'Avalanche', icon: 'bomb', type: 'physical', damage: 4.0, cooldown: 6, description: 'Summons an avalanche to crush all heroes' },
    ]
  },
  flying_eye: {
    name: 'Flying Eye', icon: 'crystal', color: '#e879f9',
    baseHealth: 70, baseDamage: 16, baseDefense: 4, baseMana: 40,
    xpReward: 14, goldReward: 7, speed: 19,
    abilities: [
      { id: 'eye_beam', name: 'Eye Beam', icon: 'crystal', type: 'magical', damage: 1.2, description: 'A focused beam of dark energy' },
      { id: 'dive_attack', name: 'Dive Attack', icon: 'energy', type: 'physical', damage: 1.6, cooldown: 3, description: 'Dives down with blinding speed' },
    ]
  },
  mushroom: {
    name: 'Poison Mushroom', icon: 'nature', color: '#a3e635',
    baseHealth: 90, baseDamage: 10, baseDefense: 8, baseMana: 60,
    xpReward: 13, goldReward: 6, speed: 8,
    abilities: [
      { id: 'spore_slap', name: 'Spore Slap', icon: 'nature', type: 'physical', damage: 0.9, description: 'A slap with a mushroom cap' },
      { id: 'toxic_spore', name: 'Toxic Spore', icon: 'skull', type: 'magical', damage: 0.6, cooldown: 3, description: 'Releases toxic spores that poison', effect: { type: 'dot', damage: 0.10, duration: 3 } },
    ]
  },
  skeleton_knight: {
    name: 'Skeleton Knight', icon: 'skull', color: '#a1a1aa',
    baseHealth: 160, baseDamage: 22, baseDefense: 20, baseMana: 0,
    xpReward: 28, goldReward: 15, speed: 9,
    abilities: [
      { id: 'sword_slash', name: 'Sword Slash', icon: 'crossed_swords', type: 'physical', damage: 1.2, description: 'A heavy sword slash' },
      { id: 'shield_wall', name: 'Shield Wall', icon: 'shield', type: 'buff', damage: 0, cooldown: 4, description: 'Raises shield to block attacks', effect: { stat: 'defense', flat: 25, duration: 2 } },
      { id: 'bone_breaker', name: 'Bone Breaker', icon: 'skull', type: 'physical', damage: 2.0, cooldown: 4, description: 'A devastating overhead strike' },
    ]
  },
  shadow_bat: {
    name: 'Shadow Bat', icon: 'energy', color: '#7c3aed',
    baseHealth: 55, baseDamage: 14, baseDefense: 3, baseMana: 30,
    xpReward: 12, goldReward: 5, speed: 22,
    abilities: [
      { id: 'wing_slash', name: 'Wing Slash', icon: 'energy', type: 'physical', damage: 0.9, description: 'Slashes with razor-sharp wings' },
      { id: 'sonic_screech', name: 'Sonic Screech', icon: 'energy', type: 'magical', damage: 1.4, cooldown: 3, description: 'A disorienting screech that rattles the mind', effect: { type: 'dot', damage: 0.08, duration: 2 } },
      { id: 'blood_drain', name: 'Blood Drain', icon: 'target', type: 'physical', damage: 1.1, cooldown: 4, description: 'Latches on and drains blood to heal', drainPercent: 0.6 },
    ]
  },
  imp: {
    name: 'Cave Imp', icon: 'fire', color: '#16a34a',
    baseHealth: 65, baseDamage: 11, baseDefense: 4, baseMana: 50,
    xpReward: 13, goldReward: 7, speed: 17,
    abilities: [
      { id: 'imp_scratch', name: 'Imp Scratch', icon: 'fire', type: 'physical', damage: 0.8, description: 'Quick claws rake across flesh' },
      { id: 'hex_bolt', name: 'Hex Bolt', icon: 'crystal', type: 'magical', damage: 1.5, cooldown: 3, description: 'A cursed bolt that weakens the target', effect: { stat: 'defense', flat: -10, duration: 2 } },
      { id: 'imp_frenzy', name: 'Imp Frenzy', icon: 'fire', type: 'buff', damage: 0, cooldown: 5, description: 'Enters a wild frenzy, boosting speed and damage', effect: { stat: 'damage', multiplier: 1.5, duration: 2 } },
    ]
  },
  mimic: {
    name: 'Mimic', icon: 'shield', color: '#b45309',
    baseHealth: 200, baseDamage: 26, baseDefense: 22, baseMana: 80,
    xpReward: 40, goldReward: 35, speed: 7,
    abilities: [
      { id: 'jaw_snap', name: 'Jaw Snap', icon: 'sword', type: 'physical', damage: 1.3, description: 'Enormous jaws snap shut on the target' },
      { id: 'tongue_lash', name: 'Tongue Lash', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'A whip-like tongue lashes out with stunning force', effect: { type: 'stun', duration: 1 } },
      { id: 'devour_gold', name: 'Devour Gold', icon: 'gold', type: 'physical', damage: 2.2, cooldown: 4, description: 'Bites hard and steals gold from the hero' },
      { id: 'iron_shell', name: 'Iron Shell', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Retreats into its chest form, hardening its shell', effect: { stat: 'defense', flat: 35, duration: 3 } },
    ]
  },
  crow_knight: {
    name: 'Crow Knight', icon: 'sword', color: '#1e293b',
    baseHealth: 170, baseDamage: 24, baseDefense: 16, baseMana: 40,
    xpReward: 32, goldReward: 18, speed: 16,
    abilities: [
      { id: 'talon_strike', name: 'Talon Strike', icon: 'sword', type: 'physical', damage: 1.1, description: 'A swift blade slash guided by predator instinct' },
      { id: 'dive_bomb', name: 'Dive Bomb', icon: 'energy', type: 'physical', damage: 2.2, cooldown: 3, description: 'Launches skyward and crashes down with devastating force' },
      { id: 'murder_flock', name: 'Murder of Crows', icon: 'energy', type: 'magical', damage: 1.4, cooldown: 4, description: 'Summons a swarm of crows that peck and blind', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'shadow_feint', name: 'Shadow Feint', icon: 'skull', type: 'buff', damage: 0, cooldown: 5, description: 'Blends with shadows, greatly increasing evasion', effect: { stat: 'damage', multiplier: 1.4, duration: 2 } },
    ]
  },
  stone_guardian: {
    name: 'Stone Guardian', icon: 'shield', color: '#78716c',
    baseHealth: 250, baseDamage: 20, baseDefense: 30, baseMana: 60,
    xpReward: 38, goldReward: 22, speed: 6,
    abilities: [
      { id: 'stone_fist', name: 'Stone Fist', icon: 'sword', type: 'physical', damage: 1.2, description: 'A heavy fist of carved stone crushes down' },
      { id: 'petrify_gaze', name: 'Petrify Gaze', icon: 'crystal', type: 'magical', damage: 0.6, cooldown: 5, description: 'Eyes glow and partially petrify a hero', effect: { type: 'stun', duration: 1 } },
      { id: 'quake_slam', name: 'Quake Slam', icon: 'shield', type: 'physical', damage: 2.0, cooldown: 4, description: 'Slams the ground causing a localized earthquake' },
      { id: 'fortify', name: 'Fortify', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Channels ancient stone magic to harden its body', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'crumble_curse', name: 'Crumble Curse', icon: 'skull', type: 'magical', damage: 0.8, cooldown: 4, description: 'Curses a hero with decay, eroding their armor', effect: { type: 'dot', damage: 0.10, duration: 4 } },
    ]
  },
  desert_snake: {
    name: 'Sand Viper', icon: 'sword', color: '#d4a017',
    baseHealth: 70, baseDamage: 18, baseDefense: 4, baseMana: 0,
    xpReward: 14, goldReward: 6, speed: 20,
    abilities: [
      { id: 'venom_bite', name: 'Venom Bite', icon: 'sword', type: 'physical', damage: 1.1, description: 'A quick venomous strike' },
      { id: 'poison_spit', name: 'Poison Spit', icon: 'skull', type: 'physical', damage: 0.8, cooldown: 3, description: 'Spits venom at the target', effect: { type: 'dot', damage: 0.15, duration: 3 } },
    ]
  },
  desert_hyena: {
    name: 'Desert Hyena', icon: 'wolf', color: '#c2a04e',
    baseHealth: 110, baseDamage: 20, baseDefense: 8, baseMana: 0,
    xpReward: 18, goldReward: 8, speed: 17,
    abilities: [
      { id: 'savage_bite', name: 'Savage Bite', icon: 'sword', type: 'physical', damage: 1.2, description: 'A crushing bite from powerful jaws' },
      { id: 'pack_howl', name: 'Pack Howl', icon: 'energy', type: 'buff', damage: 0, cooldown: 5, description: 'Lets out a rallying howl', effect: { stat: 'damage', multiplier: 1.3, duration: 2 } },
      { id: 'pounce', name: 'Pounce', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'Leaps at the target with ferocity' },
    ]
  },
  desert_scorpio: {
    name: 'Giant Scorpion', icon: 'shield', color: '#8b4513',
    baseHealth: 140, baseDamage: 16, baseDefense: 20, baseMana: 0,
    xpReward: 22, goldReward: 12, speed: 10,
    abilities: [
      { id: 'claw_pinch', name: 'Claw Pinch', icon: 'sword', type: 'physical', damage: 1.0, description: 'Grabs and squeezes with its pincers' },
      { id: 'tail_sting', name: 'Tail Sting', icon: 'skull', type: 'physical', damage: 1.6, cooldown: 3, description: 'Strikes with a venomous tail barb', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'burrow', name: 'Burrow', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Burrows into the sand for protection', effect: { stat: 'defense', flat: 25, duration: 2 } },
    ]
  },
  desert_vulture: {
    name: 'Carrion Vulture', icon: 'energy', color: '#6b4423',
    baseHealth: 85, baseDamage: 22, baseDefense: 6, baseMana: 0,
    xpReward: 16, goldReward: 7, speed: 19,
    abilities: [
      { id: 'talon_swipe', name: 'Talon Swipe', icon: 'sword', type: 'physical', damage: 1.1, description: 'Swoops down with razor talons' },
      { id: 'carrion_dive', name: 'Carrion Dive', icon: 'energy', type: 'physical', damage: 2.0, cooldown: 4, description: 'Dives from above with devastating impact' },
    ]
  },
  desert_mummy: {
    name: 'Ancient Mummy', icon: 'skull', color: '#8b7355',
    baseHealth: 180, baseDamage: 22, baseDefense: 18, baseMana: 50,
    xpReward: 30, goldReward: 20, speed: 8,
    abilities: [
      { id: 'bandage_lash', name: 'Bandage Lash', icon: 'sword', type: 'physical', damage: 1.1, description: 'Whips with decayed wrappings' },
      { id: 'curse_of_ages', name: 'Curse of Ages', icon: 'skull', type: 'magical', damage: 0.6, cooldown: 4, description: 'An ancient curse weakens the target', effect: { type: 'dot', damage: 0.10, duration: 4 } },
      { id: 'sand_tomb', name: 'Sand Tomb', icon: 'crystal', type: 'magical', damage: 1.8, cooldown: 3, description: 'Entombs the target in swirling sand' },
      { id: 'unholy_resilience', name: 'Unholy Resilience', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Draws on dark magic to restore vitality', effect: { stat: 'defense', flat: 20, duration: 3 } },
    ]
  },
  desert_deceased: {
    name: 'Risen Corpse', icon: 'skull', color: '#5a4e3a',
    baseHealth: 130, baseDamage: 19, baseDefense: 12, baseMana: 30,
    xpReward: 24, goldReward: 14, speed: 9,
    abilities: [
      { id: 'grave_swipe', name: 'Grave Swipe', icon: 'sword', type: 'physical', damage: 1.1, description: 'Swings with bony arms' },
      { id: 'death_ball', name: 'Death Ball', icon: 'crystal', type: 'magical', damage: 1.6, cooldown: 3, description: 'Hurls a sphere of necrotic energy' },
      { id: 'life_drain', name: 'Life Drain', icon: 'skull', type: 'magical', damage: 0.8, cooldown: 4, description: 'Siphons life from the target', drainPercent: 0.4 },
    ]
  },
  giant_fly: {
    name: 'Giant Fly', icon: 'energy', color: '#4ade80',
    baseHealth: 60, baseDamage: 13, baseDefense: 3, baseMana: 0,
    xpReward: 11, goldReward: 5, speed: 24,
    abilities: [
      { id: 'fly_buzz_bite', name: 'Buzz Bite', icon: 'sword', type: 'physical', damage: 0.9, description: 'Darts in and bites with mandibles' },
      { id: 'fly_acid_spit', name: 'Acid Spit', icon: 'skull', type: 'physical', damage: 1.4, cooldown: 3, description: 'Spits corrosive acid that melts armor', effect: { stat: 'defense', flat: -8, duration: 2 } },
      { id: 'fly_swarm', name: 'Swarm Cloud', icon: 'energy', type: 'magical', damage: 0.6, cooldown: 4, description: 'Summons a buzzing cloud that disorients', effect: { type: 'dot', damage: 0.08, duration: 3 } },
    ]
  },
  ice_elemental: {
    name: 'Ice Elemental', icon: 'ice', color: '#93c5fd',
    baseHealth: 160, baseDamage: 22, baseDefense: 18, baseMana: 120,
    xpReward: 34, goldReward: 20, speed: 11,
    abilities: [
      { id: 'ice_shard', name: 'Ice Shard', icon: 'ice', type: 'magical', damage: 1.2, description: 'Launches a razor-sharp shard of ice' },
      { id: 'frost_nova', name: 'Frost Nova', icon: 'ice', type: 'magical', damage: 1.8, cooldown: 3, description: 'Explodes in a ring of frost that chills all nearby' },
      { id: 'glacial_armor', name: 'Glacial Armor', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Encases itself in thick ice armor', effect: { stat: 'defense', flat: 30, duration: 3 } },
      { id: 'blizzard_breath', name: 'Blizzard Breath', icon: 'ice', type: 'magical', damage: 2.2, cooldown: 4, description: 'Exhales a devastating blizzard that freezes on contact', effect: { type: 'stun', duration: 1 } },
    ]
  },
  twig_blight: {
    name: 'Twig Blight', icon: 'nature', color: '#6b8e23',
    baseHealth: 75, baseDamage: 15, baseDefense: 6, baseMana: 30,
    xpReward: 14, goldReward: 6, speed: 13,
    abilities: [
      { id: 'thorn_scratch', name: 'Thorn Scratch', icon: 'sword', type: 'physical', damage: 1.0, description: 'Rakes with thorny branches' },
      { id: 'entangle', name: 'Entangle', icon: 'nature', type: 'physical', damage: 0.6, cooldown: 4, description: 'Roots wrap around the target slowing them', effect: { type: 'stun', duration: 1 } },
      { id: 'poison_barbs', name: 'Poison Barbs', icon: 'skull', type: 'physical', damage: 1.2, cooldown: 3, description: 'Launches venomous thorns', effect: { type: 'dot', damage: 0.10, duration: 3 } },
    ]
  },
  mimic_chest: {
    name: 'Chest Mimic', icon: 'shield', color: '#92400e',
    baseHealth: 220, baseDamage: 28, baseDefense: 24, baseMana: 60,
    xpReward: 42, goldReward: 40, speed: 6,
    abilities: [
      { id: 'mimic_chomp', name: 'Chomp', icon: 'sword', type: 'physical', damage: 1.4, description: 'Opens wide and bites down with wooden teeth' },
      { id: 'mimic_tongue', name: 'Tongue Lash', icon: 'sword', type: 'physical', damage: 1.9, cooldown: 3, description: 'A sticky tongue whips out and slams the target', effect: { type: 'stun', duration: 1 } },
      { id: 'mimic_hide', name: 'Chest Form', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Retreats into chest disguise, hardening defense', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'mimic_devour', name: 'Devour', icon: 'skull', type: 'physical', damage: 2.4, cooldown: 4, description: 'Swallows the target whole momentarily', drainPercent: 0.3 },
    ]
  },
  fire_elemental: {
    name: 'Fire Elemental', icon: 'fire', color: '#f97316',
    baseHealth: 140, baseDamage: 28, baseDefense: 10, baseMana: 100,
    xpReward: 32, goldReward: 18, speed: 14,
    abilities: [
      { id: 'flame_strike', name: 'Flame Strike', icon: 'fire', type: 'magical', damage: 1.3, description: 'Lashes out with a tendril of pure flame' },
      { id: 'inferno_burst', name: 'Inferno Burst', icon: 'fire', type: 'magical', damage: 2.0, cooldown: 3, description: 'Erupts in a violent explosion of fire' },
      { id: 'burn_aura', name: 'Burning Aura', icon: 'fire', type: 'magical', damage: 0.5, cooldown: 4, description: 'Radiates intense heat that sears nearby foes', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'molten_shield', name: 'Molten Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Surrounds itself with molten rock', effect: { stat: 'defense', flat: 25, duration: 2 } },
    ]
  },
};

export const locations = [
  {
    id: 'verdant_plains',
    name: 'Verdant Plains',
    description: 'Peaceful grasslands on the edge of civilization. A good place to begin your journey.',
    levelRange: [1, 3],
    enemies: ['goblin', 'wolf', 'mushroom', 'imp', 'shadow_bat', 'giant_fly', 'twig_blight'],
    bgGradient: 'linear-gradient(135deg, #1a472a 0%, #2d5a27 50%, #1a3a1a 100%)',
    icon: 'nature',
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
    enemies: ['wolf', 'goblin', 'mushroom', 'flying_eye', 'shadow_bat', 'imp', 'giant_fly', 'twig_blight', 'mine_arachnid'],
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    icon: 'nature',
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
    enemies: ['goblin', 'wolf', 'dark_mage', 'mushroom', 'flying_eye', 'imp', 'twig_blight', 'giant_fly'],
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
    icon: 'crystal',
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
    enemies: ['goblin', 'flying_eye', 'shadow_bat', 'mimic', 'mimic_chest', 'giant_fly', 'mine_amphibian', 'mine_elemental', 'mine_arachnid'],
    bgGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
    icon: 'chaos',
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
    enemies: ['dark_mage', 'wolf', 'mushroom', 'flying_eye', 'shadow_bat', 'twig_blight', 'shadow_warrior', 'dark_knight'],
    bgGradient: 'linear-gradient(135deg, #1a2e1a 0%, #2d3a2d 50%, #1a1a2e 100%)',
    icon: 'skull',
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
    enemies: ['dark_mage', 'mimic', 'crow_knight', 'dark_knight', 'shadow_warrior', 'mimic_chest'],
    bgGradient: 'linear-gradient(135deg, #2d1b69 0%, #1a0a3e 50%, #0d0d2b 100%)',
    icon: 'skull',
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
    enemies: ['goblin', 'orc', 'mimic', 'stone_guardian', 'water_priestess_mage', 'ice_elemental', 'mimic_chest', 'mine_elemental', 'mine_arachnid'],
    bgGradient: 'linear-gradient(135deg, #164e63 0%, #155e75 50%, #0e7490 100%)',
    icon: 'crystal',
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
    enemies: ['wolf', 'goblin', 'orc', 'mushroom', 'crow_knight', 'imp'],
    bgGradient: 'linear-gradient(135deg, #1a2e05 0%, #365314 50%, #1a2e05 100%)',
    icon: 'nature',
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
    enemies: ['dark_mage', 'goblin', 'flying_eye', 'mimic', 'stone_guardian', 'water_priestess_mage'],
    bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
    icon: 'shield',
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
    enemies: ['orc', 'dark_mage', 'stone_guardian', 'crow_knight', 'dark_knight', 'fire_elemental', 'knight_soldier', 'mine_elemental'],
    bgGradient: 'linear-gradient(135deg, #44403c 0%, #57534e 50%, #292524 100%)',
    icon: 'hammer',
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
    enemies: ['orc', 'dark_mage', 'crow_knight', 'dark_knight', 'shadow_warrior', 'desert_snake', 'desert_scorpio'],
    bgGradient: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 50%, #1c0505 100%)',
    icon: 'shield',
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
    enemies: ['orc', 'dark_mage', 'shadow_bat', 'water_priestess_mage', 'ice_elemental', 'shadow_warrior', 'knight_soldier'],
    bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #bae6fd 50%, #e0f2fe 100%)',
    icon: 'ice',
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
    enemies: ['dragon_whelp', 'orc', 'dark_mage', 'fire_elemental', 'fire_worm'],
    bgGradient: 'linear-gradient(135deg, #92400e 0%, #78350f 50%, #451a03 100%)',
    icon: 'fire',
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
    enemies: ['orc', 'dark_mage', 'crow_knight', 'stone_guardian', 'desert_hyena', 'desert_vulture'],
    bgGradient: 'linear-gradient(135deg, #57534e 0%, #78716c 50%, #44403c 100%)',
    icon: 'crossed_swords',
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
    enemies: ['orc', 'dragon_whelp', 'dark_mage', 'crow_knight'],
    bgGradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #475569 100%)',
    icon: 'energy',
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
    enemies: ['dragon_whelp', 'orc', 'dark_mage', 'fire_worm', 'mine_elemental', 'demon_minion1'],
    bgGradient: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #7f1d1d 100%)',
    icon: 'fire',
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
    enemies: ['dark_mage', 'orc', 'mushroom', 'flying_eye', 'shadow_bat', 'crow_knight', 'twig_blight', 'shadow_warrior', 'dark_knight'],
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
    icon: 'skull',
    unlocked: false,
    unlockLevel: 11,
    boss: 'corrupted_grove_keeper',
    bossAdds: ['forest_guardian', 'forest_guardian'],
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
    enemies: ['orc', 'dark_mage', 'dragon_whelp', 'desert_mummy', 'desert_deceased', 'desert_scorpio', 'fire_worm'],
    bgGradient: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #0c0a09 100%)',
    icon: 'skull',
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
    enemies: ['dark_mage', 'orc', 'mimic', 'stone_guardian', 'desert_mummy', 'desert_deceased', 'knight_soldier', 'demon_summoner'],
    bgGradient: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #292524 100%)',
    icon: 'skull',
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
    enemies: ['dark_mage', 'orc', 'mushroom', 'imp', 'mine_arachnid', 'mine_amphibian', 'mine_elemental', 'stone_guardian'],
    bgGradient: 'linear-gradient(135deg, #365314 0%, #3f6212 50%, #1a2e05 100%)',
    icon: 'skull',
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
    enemies: ['dark_mage', 'dragon_whelp', 'orc', 'demon_minion1', 'demon_minion2', 'knight_soldier'],
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f0d2e 50%, #030318 100%)',
    icon: 'shield',
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
    enemies: ['dark_mage', 'dragon_whelp', 'orc', 'flying_eye', 'crow_knight'],
    bgGradient: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #1e40af 100%)',
    icon: 'lightning',
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
    enemies: ['dark_mage', 'dragon_whelp', 'orc', 'crow_knight', 'imp', 'fire_worm', 'demon_minion1', 'demon_minion2'],
    bgGradient: 'linear-gradient(135deg, #4a0404 0%, #2d0000 50%, #1a0000 100%)',
    icon: 'chaos',
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
    enemies: ['dark_mage', 'orc', 'dragon_whelp', 'shadow_bat', 'mimic', 'mine_elemental', 'mine_amphibian', 'demon_minion2'],
    bgGradient: 'linear-gradient(135deg, #0f0520 0%, #1a0a30 50%, #050010 100%)',
    icon: 'chaos',
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
    enemies: ['orc', 'dark_mage', 'dragon_whelp', 'stone_guardian', 'fire_worm', 'demon_summoner', 'demon_minion1', 'mine_elemental'],
    bgGradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #9a3412 100%)',
    icon: 'hammer',
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
    enemies: ['dark_mage', 'orc', 'dragon_whelp', 'crow_knight', 'mimic'],
    bgGradient: 'linear-gradient(135deg, #4a044e 0%, #701a75 50%, #3b0764 100%)',
    icon: 'skull',
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
    icon: 'crystal',
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
    icon: 'fire',
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
    icon: 'crown',
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
  },
  {
    id: 'hall_of_odin',
    name: 'Hall of Odin',
    description: 'The golden halls of Valhalla where Odin, The Allfather, awaits those who dare challenge divine authority. Only true Crusade champions may enter.',
    levelRange: [20, 20],
    enemies: ['dark_mage', 'orc'],
    bgGradient: 'linear-gradient(135deg, #92400e 0%, #fbbf24 50%, #92400e 100%)',
    icon: 'lightning',
    unlocked: false,
    unlockLevel: 20,
    unlockBoss: 'void_king',
    unlockRequiredBosses: ['grand_shaman', 'frost_wyrm'],
    boss: 'god_odin',
    isGodFight: true,
    faction: 'crusade',
    enemyCount: [3, 4],
    allyCount: 3,
    raceClassEnemies: [
      { raceId: 'human', classId: 'warrior', levelRange: [19, 20] },
      { raceId: 'barbarian', classId: 'warrior', levelRange: [19, 20] },
      { raceId: 'human', classId: 'mage', levelRange: [20, 20] },
    ],
  },
  {
    id: 'maw_of_madra',
    name: 'Maw of Madra',
    description: 'A churning pit of blood and shadow where Madra, The Devourer, feasts on mortal souls. Only those who conquered the Legion may survive.',
    levelRange: [20, 20],
    enemies: ['dark_mage', 'shadow_warrior', 'demon_summoner'],
    bgGradient: 'linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #450a0a 100%)',
    icon: 'target',
    unlocked: false,
    unlockLevel: 20,
    unlockBoss: 'void_king',
    unlockRequiredBosses: ['shadow_beast', 'lich'],
    boss: 'god_madra',
    isGodFight: true,
    faction: 'legion',
    enemyCount: [3, 4],
    allyCount: 3,
    raceClassEnemies: [
      { raceId: 'undead', classId: 'mage', levelRange: [19, 20] },
      { raceId: 'orc', classId: 'warrior', levelRange: [19, 20] },
      { raceId: 'undead', classId: 'warrior', levelRange: [20, 20] },
    ],
  },
  {
    id: 'sanctum_of_omni',
    name: 'Sanctum of The Omni',
    description: 'A realm beyond mortal comprehension where The Omni, Weaver of Fate, reshapes reality at will. Only Fabled champions may challenge destiny.',
    levelRange: [20, 20],
    enemies: ['dark_mage', 'dragon_whelp'],
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #a78bfa 50%, #1e1b4b 100%)',
    icon: 'sparkle',
    unlocked: false,
    unlockLevel: 20,
    unlockBoss: 'void_king',
    unlockRequiredBosses: ['canyon_warlord', 'water_elemental'],
    boss: 'god_omni',
    isGodFight: true,
    faction: 'fabled',
    enemyCount: [3, 4],
    allyCount: 3,
    raceClassEnemies: [
      { raceId: 'elf', classId: 'mage', levelRange: [19, 20] },
      { raceId: 'dwarf', classId: 'warrior', levelRange: [19, 20] },
      { raceId: 'elf', classId: 'ranger', levelRange: [20, 20] },
    ],
  },
  {
    id: 'mothers_den',
    name: "Mother's Den",
    description: "The ancient lair of Zephyria, the Dragon Mother. The bones of a thousand heroes litter the entrance. She mourns her fallen children — and will make you pay.",
    levelRange: [18, 20],
    enemies: ['dragon_whelp', 'fire_worm', 'fire_elemental'],
    bgGradient: 'linear-gradient(135deg, #1a0000 0%, #4a0808 50%, #2d0000 100%)',
    icon: 'fire',
    unlocked: false,
    unlockLevel: 15,
    unlockRequiredBosses: ['red_dragon', 'red_dragon_2'],
    boss: 'white_dragon_mother',
    isWorldBoss: true,
    enemyCount: [2, 3],
    allyCount: 3,
    raceClassEnemies: [
      { raceId: 'orc', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'barbarian', classId: 'worge', levelRange: [18, 20] },
      { raceId: 'undead', classId: 'mage', levelRange: [18, 20] },
    ],
  }
];

const ZONE_TERRAIN_MAP = {
  verdant_plains: 'green', dark_forest: 'green', eldergrove: 'green', misty_marshes: 'green',
  haunted_graveyard: 'purple', cursed_ruins: 'purple', shadow_forest: 'purple',
  necropolis: 'purple', dreadmaw_canyon: 'purple', abyssal_depths: 'purple',
  void_threshold: 'purple', void_throne: 'purple', corrupted_spire: 'purple',
  crystal_caves: 'blue', sunken_temple: 'blue', frozen_tundra: 'blue',
  frost_haven: 'blue', stormspire_peak: 'blue',
  ironhold_mines: 'red', blood_canyon: 'red', molten_core: 'red',
  obsidian_wastes: 'red', ruins_of_ashenmoor: 'red', demon_gate: 'red',
  infernal_forge: 'red', dragon_peaks: 'red',
  silver_citadel: 'gold', blight_hollow: 'green',
  hall_of_odin: 'gold', maw_of_madra: 'red', sanctum_of_omni: 'purple',
  mothers_den: 'red',
};

export function getZoneTerrain(locationId) {
  return ZONE_TERRAIN_MAP[locationId] || 'green';
}

export function createEnemy(templateId, playerLevel) {
  const template = enemyTemplates[templateId];
  if (!template) return null;

  const levelScale = 1 + (playerLevel * 0.15);
  return {
    id: `enemy_${templateId}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    grudgeUuid: null,
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
    bossScale: template.bossScale || null,
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
    grudgeUuid: null,
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
