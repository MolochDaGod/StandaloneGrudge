export const classDefinitions = {
  warrior: {
    name: 'Warrior',
    icon: '⚔️',
    color: '#ef4444',
    description: 'A fearless frontline fighter specializing in raw power and defense.',
    lore: 'Forged in the crucible of the Grudge Wars, Warriors are the backbone of any warband. Their strength and endurance are unmatched on the battlefield.',
    startingAttributes: { Strength: 8, Vitality: 5, Endurance: 4, Dexterity: 2, Agility: 1, Intellect: 0, Wisdom: 0, Tactics: 0 },
    abilities: [
      { id: 'slash', name: 'Slash', icon: '⚔️', description: 'A powerful sword strike', type: 'physical', damage: 1.2, manaCost: 0, staminaCost: 10, cooldown: 0, target: 'enemy' },
      { id: 'power_strike', name: 'Power Strike', icon: '💥', description: 'A devastating blow dealing 2x damage', type: 'physical', damage: 2.0, manaCost: 0, staminaCost: 25, cooldown: 2, target: 'enemy' },
      { id: 'war_cry', name: 'War Cry', icon: '📢', description: 'Boost your damage by 30% for 3 turns', type: 'buff', damage: 0, manaCost: 0, staminaCost: 30, cooldown: 5, target: 'self', effect: { stat: 'damage', multiplier: 1.3, duration: 3 } },
      { id: 'shield_bash', name: 'Shield Bash', icon: '🛡️', description: 'Stun the enemy for 1 turn', type: 'physical', damage: 0.8, manaCost: 0, staminaCost: 20, cooldown: 4, target: 'enemy', effect: { type: 'stun', duration: 1 } },
    ]
  },
  mage: {
    name: 'Mage Priest',
    icon: '🔮',
    color: '#8b5cf6',
    description: 'Master of arcane magic and divine healing arts.',
    lore: 'Drawing power from ancient ley lines and forgotten gods, Mage Priests wield destructive magic alongside sacred healing — a balance few can master.',
    startingAttributes: { Strength: 0, Vitality: 2, Endurance: 1, Dexterity: 1, Agility: 0, Intellect: 8, Wisdom: 6, Tactics: 2 },
    abilities: [
      { id: 'arcane_bolt', name: 'Arcane Bolt', icon: '✨', description: 'A burst of arcane energy', type: 'magical', damage: 1.4, manaCost: 15, staminaCost: 0, cooldown: 0, target: 'enemy' },
      { id: 'fireball', name: 'Fireball', icon: '🔥', description: 'Hurls a ball of fire dealing massive damage', type: 'magical', damage: 2.5, manaCost: 35, staminaCost: 0, cooldown: 3, target: 'enemy' },
      { id: 'heal', name: 'Divine Heal', icon: '💚', description: 'Restore 30% of max HP', type: 'heal', damage: 0, manaCost: 40, staminaCost: 0, cooldown: 4, target: 'self', healPercent: 0.30 },
      { id: 'ice_storm', name: 'Ice Storm', icon: '❄️', description: 'Freezes the enemy, reducing their speed', type: 'magical', damage: 1.8, manaCost: 30, staminaCost: 0, cooldown: 3, target: 'enemy', effect: { stat: 'attackSpeed', multiplier: 0.5, duration: 2 } },
    ]
  },
  worg: {
    name: 'Worg Rider',
    icon: '🐺',
    color: '#d97706',
    description: 'A savage beast-rider with devastating dual attacks.',
    lore: 'Bonded to their great worg companion since birth, these fierce warriors attack as one — a blur of fangs, claws, and steel.',
    startingAttributes: { Strength: 5, Vitality: 3, Endurance: 2, Dexterity: 3, Agility: 4, Intellect: 0, Wisdom: 1, Tactics: 2 },
    abilities: [
      { id: 'savage_bite', name: 'Savage Bite', icon: '🐺', description: 'Your worg lunges with a vicious bite', type: 'physical', damage: 1.3, manaCost: 0, staminaCost: 12, cooldown: 0, target: 'enemy' },
      { id: 'feral_charge', name: 'Feral Charge', icon: '💨', description: 'Charge the enemy dealing heavy damage', type: 'physical', damage: 2.2, manaCost: 0, staminaCost: 25, cooldown: 3, target: 'enemy' },
      { id: 'howl', name: 'Blood Howl', icon: '🌙', description: 'Howl to regenerate health over 3 turns', type: 'heal_over_time', damage: 0, manaCost: 0, staminaCost: 20, cooldown: 4, target: 'self', healPercent: 0.08, duration: 3 },
      { id: 'rend', name: 'Rend', icon: '🩸', description: 'Tear the enemy, causing bleeding for 3 turns', type: 'physical', damage: 0.6, manaCost: 0, staminaCost: 18, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.15, duration: 3 } },
    ]
  },
  ranger: {
    name: 'Ranger',
    icon: '🏹',
    color: '#22c55e',
    description: 'A deadly marksman with precise long-range attacks.',
    lore: 'Silent and patient, Rangers strike from the shadows with lethal precision. Their arrows find gaps in even the thickest armor.',
    startingAttributes: { Strength: 2, Vitality: 2, Endurance: 1, Dexterity: 7, Agility: 5, Intellect: 1, Wisdom: 0, Tactics: 2 },
    abilities: [
      { id: 'quick_shot', name: 'Quick Shot', icon: '🏹', description: 'A fast, precise arrow', type: 'physical', damage: 1.1, manaCost: 0, staminaCost: 8, cooldown: 0, target: 'enemy' },
      { id: 'aimed_shot', name: 'Aimed Shot', icon: '🎯', description: 'A carefully aimed shot that always crits', type: 'physical', damage: 2.0, manaCost: 0, staminaCost: 20, cooldown: 2, target: 'enemy', guaranteedCrit: true },
      { id: 'poison_arrow', name: 'Poison Arrow', icon: '☠️', description: 'Poisons the enemy for damage over time', type: 'physical', damage: 0.7, manaCost: 0, staminaCost: 15, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.2, duration: 3 } },
      { id: 'evasive_maneuver', name: 'Evasive Roll', icon: '💨', description: 'Increase evasion by 50% for 2 turns', type: 'buff', damage: 0, manaCost: 0, staminaCost: 15, cooldown: 4, target: 'self', effect: { stat: 'evasion', flat: 50, duration: 2 } },
    ]
  }
};

export const CLASS_TIERS = [
  { minRank: 1, maxRank: 10, name: 'Legendary', className: 'legendary', desc: 'Mythical power achieved through perfect synergy.', color: '#89f7fe' },
  { minRank: 11, maxRank: 50, name: 'Warlord', className: 'warlord', desc: 'A dominant force on the battlefield.', color: '#f97316' },
  { minRank: 51, maxRank: 100, name: 'Epic', className: 'epic', desc: 'A hero of renown and great skill.', color: '#a855f7' },
  { minRank: 101, maxRank: 200, name: 'Hero', className: 'hero', desc: 'A capable adventurer with potential.', color: '#3b82f6' },
  { minRank: 201, maxRank: 300, name: 'Normal', className: 'normal', desc: 'A standard combatant.', color: '#9ca3af' }
];
