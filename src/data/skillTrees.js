export const skillTrees = {
  warrior: {
    className: 'Warrior',
    color: '#ef4444',
    tiers: [
      {
        name: 'Level 1 - Combat Basics',
        requiredLevel: 1,
        skills: [
          { id: 'w_taunt', name: 'Taunt', icon: '📢', description: 'Force enemies to target you', effect: '+15% Threat', maxPoints: 3, bonuses: { defense: 5 } },
          { id: 'w_quick_strike', name: 'Quick Strike', icon: '⚔️', description: 'Fast attack with speed bonus', effect: '+15% Attack Speed', maxPoints: 3, bonuses: { attackSpeed: 5 } }
        ]
      },
      {
        name: 'Level 5 - Specialization',
        requiredLevel: 5,
        skills: [
          { id: 'w_damage_surge', name: 'Damage Surge', icon: '💥', description: 'Temporary damage boost', effect: '+25% Damage for 5s', maxPoints: 3, requires: 'w_quick_strike', bonuses: { damage: 3 } },
          { id: 'w_guardian_aura', name: "Guardian's Aura", icon: '🔰', description: 'Defense buff', effect: '+15% Party Defense', maxPoints: 3, requires: 'w_taunt', bonuses: { defense: 8 } }
        ]
      },
      {
        name: 'Level 10 - Advanced',
        requiredLevel: 10,
        skills: [
          { id: 'w_dual_wield', name: 'Dual Wield', icon: '⚔️', description: 'Attack speed and multi-hit', effect: '+30% Attack Speed', maxPoints: 1, requires: 'w_damage_surge', bonuses: { attackSpeed: 15 } },
          { id: 'w_shield_spec', name: 'Shield Specialist', icon: '🛡️', description: 'Block chance and defense', effect: '+20% Block Chance', maxPoints: 3, requires: 'w_guardian_aura', bonuses: { block: 7 } },
          { id: 'w_life_drain', name: 'Life Drain', icon: '❤️', description: 'Damage that heals you', effect: 'Heal 10% of Damage', maxPoints: 2, requires: 'w_quick_strike', bonuses: { drainHealth: 5 } }
        ]
      },
      {
        name: 'Level 15 - Master',
        requiredLevel: 15,
        skills: [
          { id: 'w_execute', name: 'Execute', icon: '💀', description: 'Bonus damage vs low health', effect: '+50% Damage below 30% HP', maxPoints: 1, requires: 'w_dual_wield', bonuses: { damage: 10 } },
          { id: 'w_double_strike', name: 'Double Strike', icon: '⚡', description: 'Two consecutive attacks', effect: 'Double Hit Combo', maxPoints: 2, requires: 'w_life_drain', bonuses: { criticalChance: 5 } }
        ]
      },
      {
        name: 'Level 20 - Legendary',
        requiredLevel: 20,
        skills: [
          { id: 'w_avatar', name: 'Avatar Form', icon: '⭐', description: 'All stats boost', effect: 'Ultimate Transformation', maxPoints: 1, requires: 'w_execute', bonuses: { damage: 15, defense: 15, health: 50 } }
        ]
      }
    ]
  },
  mage: {
    className: 'Mage Priest',
    color: '#8b5cf6',
    tiers: [
      {
        name: 'Level 1 - Arcane Basics',
        requiredLevel: 1,
        skills: [
          { id: 'm_mana_flow', name: 'Mana Flow', icon: '💧', description: 'Faster mana regeneration', effect: '+20% Mana Regen', maxPoints: 3, bonuses: { manaRegen: 0.5 } },
          { id: 'm_arcane_focus', name: 'Arcane Focus', icon: '🔮', description: 'Increased spell damage', effect: '+10% Spell Damage', maxPoints: 3, bonuses: { damage: 3 } }
        ]
      },
      {
        name: 'Level 5 - Elemental Arts',
        requiredLevel: 5,
        skills: [
          { id: 'm_fire_mastery', name: 'Fire Mastery', icon: '🔥', description: 'Fire spell bonus', effect: '+25% Fire Damage', maxPoints: 3, requires: 'm_arcane_focus', bonuses: { damage: 5 } },
          { id: 'm_ice_mastery', name: 'Ice Mastery', icon: '❄️', description: 'Ice spell bonus', effect: '+15% Slow Effect', maxPoints: 3, requires: 'm_mana_flow', bonuses: { defense: 4 } }
        ]
      },
      {
        name: 'Level 10 - Divine Power',
        requiredLevel: 10,
        skills: [
          { id: 'm_meteor', name: 'Meteor Strike', icon: '☄️', description: 'Call down a meteor', effect: 'Massive AoE', maxPoints: 1, requires: 'm_fire_mastery', bonuses: { damage: 12 } },
          { id: 'm_divine_shield', name: 'Divine Shield', icon: '✝️', description: 'Holy protection', effect: 'Absorb Damage', maxPoints: 3, requires: 'm_ice_mastery', bonuses: { defense: 6, resistance: 3 } },
          { id: 'm_chain_lightning', name: 'Chain Lightning', icon: '⚡', description: 'Lightning bounces between foes', effect: 'Hit 5 Targets', maxPoints: 2, requires: 'm_arcane_focus', bonuses: { damage: 6, criticalChance: 3 } }
        ]
      },
      {
        name: 'Level 15 - Grand Magus',
        requiredLevel: 15,
        skills: [
          { id: 'm_spell_echo', name: 'Spell Echo', icon: '🔄', description: 'Chance to double cast', effect: '20% Echo Chance', maxPoints: 2, requires: 'm_meteor', bonuses: { damage: 8, mana: 20 } },
          { id: 'm_holy_nova', name: 'Holy Nova', icon: '💫', description: 'AoE heal and damage', effect: 'Burst Heal + Damage', maxPoints: 2, requires: 'm_divine_shield', bonuses: { health: 30, damage: 5 } }
        ]
      },
      {
        name: 'Level 20 - Legendary',
        requiredLevel: 20,
        skills: [
          { id: 'm_arcane_cataclysm', name: 'Arcane Cataclysm', icon: '🌟', description: 'Devastating magic storm', effect: 'Ultimate: Pure Magic', maxPoints: 1, requires: 'm_spell_echo', bonuses: { damage: 20, mana: 50, criticalChance: 10 } }
        ]
      }
    ]
  },
  worge: {
    className: 'Worge',
    color: '#d97706',
    tiers: [
      {
        name: 'Level 1 - Primal Roots',
        requiredLevel: 1,
        skills: [
          { id: 'wr_storm_touch', name: 'Storm Touch', icon: '⚡', description: 'Lightning spells hit harder', effect: '+15% Storm Damage', maxPoints: 3, bonuses: { damage: 3 } },
          { id: 'wr_bark_skin', name: 'Bark Skin', icon: '🌿', description: 'Nature hardens your skin', effect: '+10% Defense', maxPoints: 3, bonuses: { defense: 4, health: 10 } }
        ]
      },
      {
        name: 'Level 5 - Dual Nature',
        requiredLevel: 5,
        skills: [
          { id: 'wr_weapon_mastery', name: 'Weapon Mastery', icon: '🔨', description: 'Mace and dagger expertise', effect: '+20% Weapon Damage', maxPoints: 3, requires: 'wr_storm_touch', bonuses: { damage: 4, criticalChance: 3 } },
          { id: 'wr_wild_growth', name: 'Wild Growth', icon: '🌱', description: 'Nature heals strengthen', effect: '+25% Heal Power', maxPoints: 3, requires: 'wr_bark_skin', bonuses: { health: 15 } }
        ]
      },
      {
        name: 'Level 10 - Shapeshifter',
        requiredLevel: 10,
        skills: [
          { id: 'wr_thunderclap', name: 'Thunderclap', icon: '🌩️', description: 'Storm spells stun briefly', effect: 'Spell Stun Chance', maxPoints: 1, requires: 'wr_weapon_mastery', bonuses: { damage: 10 } },
          { id: 'wr_iron_hide', name: 'Iron Hide', icon: '🛡️', description: 'Bear form is tougher', effect: '+30% Bear Defense', maxPoints: 3, requires: 'wr_wild_growth', bonuses: { defense: 6, health: 15 } },
          { id: 'wr_venom_edge', name: 'Venom Edge', icon: '🗡️', description: 'Dagger poison is deadlier', effect: '+20% Poison Damage', maxPoints: 2, requires: 'wr_storm_touch', bonuses: { damage: 5 } }
        ]
      },
      {
        name: 'Level 15 - Warden',
        requiredLevel: 15,
        skills: [
          { id: 'wr_tempest', name: 'Tempest', icon: '🌪️', description: 'Storm mastery unleashed', effect: '+40% Storm Power', maxPoints: 1, requires: 'wr_thunderclap', bonuses: { damage: 8, attackSpeed: 10 } },
          { id: 'wr_rejuvenate', name: 'Rejuvenate', icon: '💚', description: 'Nature mends all wounds', effect: 'Passive Regen', maxPoints: 2, requires: 'wr_iron_hide', bonuses: { drainHealth: 5, health: 20 } }
        ]
      },
      {
        name: 'Level 20 - Legendary',
        requiredLevel: 20,
        skills: [
          { id: 'wr_natures_wrath', name: "Nature's Wrath", icon: '🌟', description: 'Command storm and wild as one', effect: 'Ultimate: Primal Storm', maxPoints: 1, requires: 'wr_tempest', bonuses: { damage: 15, attackSpeed: 15, health: 40 } }
        ]
      }
    ]
  },
  ranger: {
    className: 'Ranger',
    color: '#22c55e',
    tiers: [
      {
        name: 'Level 1 - Marksmanship',
        requiredLevel: 1,
        skills: [
          { id: 'r_precision', name: 'Precision', icon: '🎯', description: 'Better accuracy', effect: '+15% Accuracy', maxPoints: 3, bonuses: { accuracy: 5, criticalChance: 2 } },
          { id: 'r_swift_draw', name: 'Swift Draw', icon: '💨', description: 'Faster arrow nocking', effect: '+10% Attack Speed', maxPoints: 3, bonuses: { attackSpeed: 4 } }
        ]
      },
      {
        name: 'Level 5 - Hunter',
        requiredLevel: 5,
        skills: [
          { id: 'r_headshot', name: 'Headshot', icon: '💀', description: 'Critical damage bonus', effect: '+50% Crit Damage', maxPoints: 3, requires: 'r_precision', bonuses: { criticalDamage: 15 } },
          { id: 'r_evasion', name: 'Nature\'s Grace', icon: '🌿', description: 'Dodge chance up', effect: '+15% Evasion', maxPoints: 3, requires: 'r_swift_draw', bonuses: { evasion: 5 } }
        ]
      },
      {
        name: 'Level 10 - Sharpshooter',
        requiredLevel: 10,
        skills: [
          { id: 'r_piercing', name: 'Piercing Shot', icon: '➡️', description: 'Arrows pierce armor', effect: '25% Armor Pen', maxPoints: 1, requires: 'r_headshot', bonuses: { armorPenetration: 10, damage: 5 } },
          { id: 'r_multishot', name: 'Multishot', icon: '🌀', description: 'Fire multiple arrows', effect: '3 Arrow Spread', maxPoints: 3, requires: 'r_swift_draw', bonuses: { damage: 4 } },
          { id: 'r_trap', name: 'Bear Trap', icon: '🪤', description: 'Place traps that root', effect: '2s Root', maxPoints: 2, requires: 'r_evasion', bonuses: { defense: 5 } }
        ]
      },
      {
        name: 'Level 15 - Elite',
        requiredLevel: 15,
        skills: [
          { id: 'r_sniper', name: 'Sniper', icon: '🔭', description: 'Massive long range damage', effect: '+100% Range Damage', maxPoints: 1, requires: 'r_piercing', bonuses: { damage: 12, criticalChance: 8 } },
          { id: 'r_wind_walk', name: 'Wind Walk', icon: '🌬️', description: 'Become invisible briefly', effect: 'Stealth + Speed', maxPoints: 2, requires: 'r_trap', bonuses: { evasion: 8, movementSpeed: 5 } }
        ]
      },
      {
        name: 'Level 20 - Legendary',
        requiredLevel: 20,
        skills: [
          { id: 'r_arrow_storm', name: 'Arrow Storm', icon: '🌟', description: 'Rain arrows from the sky', effect: 'Ultimate: Arrow Rain', maxPoints: 1, requires: 'r_sniper', bonuses: { damage: 18, criticalChance: 10, attackSpeed: 10 } }
        ]
      }
    ]
  }
};
