export const EQUIPMENT_SLOTS = ['weapon', 'offhand', 'armor', 'accessory'];

export const RARITY = {
  common: { name: 'Common', color: '#9ca3af', multiplier: 1.0 },
  uncommon: { name: 'Uncommon', color: '#22c55e', multiplier: 1.3 },
  rare: { name: 'Rare', color: '#3b82f6', multiplier: 1.7 },
  epic: { name: 'Epic', color: '#a855f7', multiplier: 2.2 },
  legendary: { name: 'Legendary', color: '#f59e0b', multiplier: 3.0 },
};

export const WEAPON_TYPES = {
  sword: { name: 'Sword', icon: '🗡️' },
  axe: { name: 'Axe', icon: '🪓' },
  greatsword: { name: 'Greatsword', icon: '⚔️' },
  greataxe: { name: 'Great Axe', icon: '🪓' },
  shield: { name: 'Shield', icon: '🛡️' },
  mace: { name: 'Mace', icon: '🔨' },
  staff: { name: 'Staff', icon: '🪄' },
  dagger: { name: 'Dagger', icon: '🗡️' },
  bow: { name: 'Bow', icon: '🏹' },
  crossbow: { name: 'Crossbow', icon: '🏹' },
  gun: { name: 'Gun', icon: '🔫' },
  lance: { name: 'Lance', icon: '🔱' },
  tome: { name: 'Tome', icon: '📖' },
  relic: { name: 'Relic', icon: '🔮' },
};

export const ARMOR_TYPES = {
  cloth: { name: 'Cloth', icon: '👘' },
  leather: { name: 'Leather', icon: '🦺' },
  metal: { name: 'Metal', icon: '🛡️' },
};

export const CLASS_EQUIPMENT_RULES = {
  warrior: {
    weaponTypes: ['sword', 'axe', 'greatsword', 'greataxe'],
    offhandTypes: ['shield'],
    armorTypes: ['metal'],
  },
  worge: {
    weaponTypes: ['mace', 'staff', 'dagger'],
    offhandTypes: [],
    armorTypes: ['leather', 'cloth'],
  },
  ranger: {
    weaponTypes: ['bow', 'crossbow', 'gun', 'dagger', 'lance'],
    offhandTypes: [],
    armorTypes: ['leather', 'metal'],
  },
  mage: {
    weaponTypes: ['staff', 'tome'],
    offhandTypes: ['relic'],
    armorTypes: ['cloth'],
  },
};

const weaponTemplates = [
  { id: 'iron_sword', name: 'Iron Sword', slot: 'weapon', weaponType: 'sword', icon: '🗡️', classReq: ['warrior'], levelReq: 1, stats: { physicalDamage: 4, criticalChance: 2 } },
  { id: 'steel_blade', name: 'Steel Blade', slot: 'weapon', weaponType: 'sword', icon: '🗡️', classReq: ['warrior'], levelReq: 4, stats: { physicalDamage: 8, criticalChance: 3, block: 2 } },
  { id: 'flame_sword', name: 'Flame Sword', slot: 'weapon', weaponType: 'sword', icon: '🗡️', classReq: ['warrior'], levelReq: 8, stats: { physicalDamage: 13, magicDamage: 3, criticalChance: 4 } },
  { id: 'doom_blade', name: 'Doom Blade', slot: 'weapon', weaponType: 'sword', icon: '🗡️', classReq: ['warrior'], levelReq: 14, stats: { physicalDamage: 22, criticalChance: 6, drainHealth: 3 } },

  { id: 'hand_axe', name: 'Hand Axe', slot: 'weapon', weaponType: 'axe', icon: '🪓', classReq: ['warrior'], levelReq: 1, stats: { physicalDamage: 5, criticalDamage: 5 } },
  { id: 'battle_axe', name: 'Battle Axe', slot: 'weapon', weaponType: 'axe', icon: '🪓', classReq: ['warrior'], levelReq: 5, stats: { physicalDamage: 10, criticalDamage: 8, armorPenetration: 2 } },
  { id: 'berserker_axe', name: 'Berserker Axe', slot: 'weapon', weaponType: 'axe', icon: '🪓', classReq: ['warrior'], levelReq: 10, stats: { physicalDamage: 16, criticalDamage: 12, armorPenetration: 4 } },

  { id: 'claymore', name: 'Claymore', slot: 'weapon', weaponType: 'greatsword', icon: '⚔️', classReq: ['warrior'], levelReq: 3, stats: { physicalDamage: 9, criticalChance: 2 } },
  { id: 'zweihander', name: 'Zweihander', slot: 'weapon', weaponType: 'greatsword', icon: '⚔️', classReq: ['warrior'], levelReq: 8, stats: { physicalDamage: 16, criticalChance: 3, stagger: 1 } },
  { id: 'abyssal_greatsword', name: 'Abyssal Greatsword', slot: 'weapon', weaponType: 'greatsword', icon: '⚔️', classReq: ['warrior'], levelReq: 15, stats: { physicalDamage: 26, criticalChance: 5, drainHealth: 4, stagger: 2 } },

  { id: 'great_axe', name: 'Great Axe', slot: 'weapon', weaponType: 'greataxe', icon: '🪓', classReq: ['warrior'], levelReq: 6, stats: { physicalDamage: 14, criticalDamage: 10 } },
  { id: 'executioner', name: "Executioner's Greataxe", slot: 'weapon', weaponType: 'greataxe', icon: '🪓', classReq: ['warrior'], levelReq: 12, stats: { physicalDamage: 20, criticalDamage: 18, armorPenetration: 5 } },

  { id: 'storm_mace', name: 'Storm Mace', slot: 'weapon', weaponType: 'mace', icon: '🔨', classReq: ['worge'], levelReq: 1, stats: { physicalDamage: 3, magicDamage: 1, attackSpeed: 3, evasion: 2 } },
  { id: 'iron_mace', name: 'Iron Mace', slot: 'weapon', weaponType: 'mace', icon: '🔨', classReq: ['worge'], levelReq: 5, stats: { physicalDamage: 6, magicDamage: 3, attackSpeed: 4, evasion: 3 } },
  { id: 'tempest_maul', name: 'Tempest Maul', slot: 'weapon', weaponType: 'mace', icon: '🔨', classReq: ['worge'], levelReq: 10, stats: { physicalDamage: 10, magicDamage: 6, attackSpeed: 6, evasion: 4, criticalChance: 5 } },
  { id: 'primal_crusher', name: 'Primal Crusher', slot: 'weapon', weaponType: 'mace', icon: '🔨', classReq: ['worge'], levelReq: 15, stats: { physicalDamage: 14, magicDamage: 9, attackSpeed: 8, evasion: 6, drainHealth: 5 } },

  { id: 'gnarled_staff', name: 'Gnarled Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['worge'], levelReq: 2, stats: { physicalDamage: 2, magicDamage: 4, mana: 15, manaRegen: 0.5 } },
  { id: 'wildwood_staff', name: 'Wildwood Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['worge'], levelReq: 8, stats: { physicalDamage: 4, magicDamage: 8, mana: 30, manaRegen: 1.5 } },

  { id: 'thornwood_dagger', name: 'Thornwood Dagger', slot: 'weapon', weaponType: 'dagger', icon: '🗡️', classReq: ['worge', 'ranger'], levelReq: 3, stats: { physicalDamage: 5, magicDamage: 2, attackSpeed: 5, evasion: 3, drainHealth: 2 } },
  { id: 'natures_fang', name: "Nature's Fang", slot: 'weapon', weaponType: 'dagger', icon: '🗡️', classReq: ['worge', 'ranger'], levelReq: 12, stats: { physicalDamage: 12, magicDamage: 6, attackSpeed: 8, evasion: 6, drainHealth: 5 } },

  { id: 'oak_staff_mage', name: 'Oak Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['mage'], levelReq: 1, stats: { magicDamage: 3, mana: 15, manaRegen: 0.5 } },
  { id: 'crystal_staff', name: 'Crystal Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['mage'], levelReq: 4, stats: { magicDamage: 6, mana: 25, manaRegen: 1, cooldownReduction: 2 } },
  { id: 'arcane_staff', name: 'Arcane Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['mage'], levelReq: 8, stats: { magicDamage: 10, mana: 40, manaRegen: 2, spellAccuracy: 5 } },
  { id: 'void_staff', name: 'Void Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['mage'], levelReq: 14, stats: { magicDamage: 18, mana: 60, manaRegen: 3, cooldownReduction: 5 } },

  { id: 'leather_tome', name: 'Leather Tome', slot: 'weapon', weaponType: 'tome', icon: '📖', classReq: ['mage'], levelReq: 2, stats: { magicDamage: 4, mana: 20, cooldownReduction: 1 } },
  { id: 'grimoire', name: 'Grimoire of Flames', slot: 'weapon', weaponType: 'tome', icon: '📖', classReq: ['mage'], levelReq: 6, stats: { magicDamage: 8, mana: 35, cooldownReduction: 3 } },
  { id: 'necronomicon', name: 'Necronomicon', slot: 'weapon', weaponType: 'tome', icon: '📖', classReq: ['mage'], levelReq: 12, stats: { magicDamage: 15, mana: 50, cooldownReduction: 4, drainHealth: 3 } },

  { id: 'short_bow', name: 'Short Bow', slot: 'weapon', weaponType: 'bow', icon: '🏹', classReq: ['ranger'], levelReq: 1, stats: { physicalDamage: 3, criticalChance: 4, accuracy: 3 } },
  { id: 'longbow', name: 'Longbow', slot: 'weapon', weaponType: 'bow', icon: '🏹', classReq: ['ranger'], levelReq: 4, stats: { physicalDamage: 7, criticalChance: 6, accuracy: 5, criticalDamage: 5 } },
  { id: 'composite_bow', name: 'Composite Bow', slot: 'weapon', weaponType: 'bow', icon: '🏹', classReq: ['ranger'], levelReq: 8, stats: { physicalDamage: 12, criticalChance: 8, accuracy: 8, attackSpeed: 3 } },
  { id: 'shadow_bow', name: 'Shadow Bow', slot: 'weapon', weaponType: 'bow', icon: '🏹', classReq: ['ranger'], levelReq: 14, stats: { physicalDamage: 20, criticalChance: 12, accuracy: 10, criticalDamage: 15 } },

  { id: 'light_crossbow', name: 'Light Crossbow', slot: 'weapon', weaponType: 'crossbow', icon: '🏹', classReq: ['ranger'], levelReq: 3, stats: { physicalDamage: 6, criticalDamage: 8, accuracy: 4 } },
  { id: 'heavy_crossbow', name: 'Heavy Crossbow', slot: 'weapon', weaponType: 'crossbow', icon: '🏹', classReq: ['ranger'], levelReq: 9, stats: { physicalDamage: 14, criticalDamage: 12, accuracy: 6, armorPenetration: 3 } },
  { id: 'repeater', name: 'Repeating Crossbow', slot: 'weapon', weaponType: 'crossbow', icon: '🏹', classReq: ['ranger'], levelReq: 15, stats: { physicalDamage: 18, criticalDamage: 15, accuracy: 8, attackSpeed: 5 } },

  { id: 'flintlock', name: 'Flintlock Pistol', slot: 'weapon', weaponType: 'gun', icon: '🔫', classReq: ['ranger'], levelReq: 5, stats: { physicalDamage: 10, criticalDamage: 10, accuracy: 2 } },
  { id: 'musket', name: 'Musket', slot: 'weapon', weaponType: 'gun', icon: '🔫', classReq: ['ranger'], levelReq: 10, stats: { physicalDamage: 16, criticalDamage: 14, accuracy: 4, armorPenetration: 5 } },
  { id: 'dragon_cannon', name: 'Dragon Cannon', slot: 'weapon', weaponType: 'gun', icon: '🔫', classReq: ['ranger'], levelReq: 16, stats: { physicalDamage: 24, criticalDamage: 18, armorPenetration: 8 } },

  { id: 'iron_lance', name: 'Iron Lance', slot: 'weapon', weaponType: 'lance', icon: '🔱', classReq: ['ranger'], levelReq: 2, stats: { physicalDamage: 5, criticalChance: 3, accuracy: 5 } },
  { id: 'wyvern_lance', name: 'Wyvern Lance', slot: 'weapon', weaponType: 'lance', icon: '🔱', classReq: ['ranger'], levelReq: 7, stats: { physicalDamage: 11, criticalChance: 5, accuracy: 7, attackSpeed: 2 } },
  { id: 'dragon_lance', name: 'Dragon Lance', slot: 'weapon', weaponType: 'lance', icon: '🔱', classReq: ['ranger'], levelReq: 13, stats: { physicalDamage: 19, criticalChance: 7, accuracy: 9, armorPenetration: 4 } },
];

const offhandTemplates = [
  { id: 'wooden_shield', name: 'Wooden Shield', slot: 'offhand', weaponType: 'shield', icon: '🛡️', classReq: ['warrior'], levelReq: 1, stats: { defense: 4, block: 5, blockEffect: 10 } },
  { id: 'iron_shield', name: 'Iron Shield', slot: 'offhand', weaponType: 'shield', icon: '🛡️', classReq: ['warrior'], levelReq: 4, stats: { defense: 8, block: 8, blockEffect: 15, health: 20 } },
  { id: 'tower_shield', name: 'Tower Shield', slot: 'offhand', weaponType: 'shield', icon: '🛡️', classReq: ['warrior'], levelReq: 8, stats: { defense: 14, block: 12, blockEffect: 20, health: 40, damageReduction: 3 } },
  { id: 'dragonscale_shield', name: 'Dragonscale Shield', slot: 'offhand', weaponType: 'shield', icon: '🛡️', classReq: ['warrior'], levelReq: 12, stats: { defense: 20, block: 15, blockEffect: 25, health: 60, resistance: 8 } },
  { id: 'void_bulwark', name: 'Void Bulwark', slot: 'offhand', weaponType: 'shield', icon: '🛡️', classReq: ['warrior'], levelReq: 16, stats: { defense: 26, block: 18, blockEffect: 30, health: 80, damageReduction: 6, resistance: 12 } },

  { id: 'crystal_orb', name: 'Crystal Orb', slot: 'offhand', weaponType: 'relic', icon: '🔮', classReq: ['mage'], levelReq: 1, stats: { magicDamage: 2, mana: 20, manaRegen: 0.5 } },
  { id: 'elemental_focus', name: 'Elemental Focus', slot: 'offhand', weaponType: 'relic', icon: '🔮', classReq: ['mage'], levelReq: 5, stats: { magicDamage: 4, mana: 35, manaRegen: 1, cooldownReduction: 2 } },
  { id: 'skull_relic', name: 'Skull of the Damned', slot: 'offhand', weaponType: 'relic', icon: '🔮', classReq: ['mage'], levelReq: 10, stats: { magicDamage: 7, mana: 50, manaRegen: 2, drainHealth: 3 } },
  { id: 'void_relic', name: 'Void Heart', slot: 'offhand', weaponType: 'relic', icon: '🔮', classReq: ['mage'], levelReq: 15, stats: { magicDamage: 10, mana: 70, manaRegen: 3, cooldownReduction: 5, spellAccuracy: 6 } },
];

const armorTemplates = [
  { id: 'chain_mail', name: 'Chain Mail', slot: 'armor', armorType: 'metal', icon: '🛡️', classReq: ['warrior', 'ranger'], levelReq: 1, stats: { defense: 6, health: 25 } },
  { id: 'plate_armor', name: 'Plate Armor', slot: 'armor', armorType: 'metal', icon: '🛡️', classReq: ['warrior', 'ranger'], levelReq: 5, stats: { defense: 12, health: 45, damageReduction: 3, block: 2 } },
  { id: 'dragon_scale', name: 'Dragon Scale Armor', slot: 'armor', armorType: 'metal', icon: '🛡️', classReq: ['warrior', 'ranger'], levelReq: 10, stats: { defense: 20, health: 80, resistance: 8, damageReduction: 6 } },
  { id: 'void_plate', name: 'Void Plate', slot: 'armor', armorType: 'metal', icon: '🛡️', classReq: ['warrior', 'ranger'], levelReq: 15, stats: { defense: 28, health: 120, damageReduction: 8, resistance: 10, block: 5 } },

  { id: 'leather_vest', name: 'Leather Vest', slot: 'armor', armorType: 'leather', icon: '🦺', classReq: ['worge', 'ranger'], levelReq: 1, stats: { defense: 4, health: 20, evasion: 2 } },
  { id: 'beast_hide', name: 'Beast Hide', slot: 'armor', armorType: 'leather', icon: '🦺', classReq: ['worge', 'ranger'], levelReq: 5, stats: { defense: 8, health: 40, evasion: 4, healthRegen: 1 } },
  { id: 'shadow_cloak', name: 'Shadow Cloak', slot: 'armor', armorType: 'leather', icon: '🦺', classReq: ['worge', 'ranger'], levelReq: 8, stats: { defense: 12, evasion: 8, criticalEvasion: 5, health: 35 } },
  { id: 'wyvern_leather', name: 'Wyvern Leather', slot: 'armor', armorType: 'leather', icon: '🦺', classReq: ['worge', 'ranger'], levelReq: 12, stats: { defense: 16, health: 60, evasion: 10, criticalEvasion: 6, attackSpeed: 3 } },
  { id: 'dragonhide', name: 'Dragonhide Armor', slot: 'armor', armorType: 'leather', icon: '🦺', classReq: ['worge', 'ranger'], levelReq: 16, stats: { defense: 22, health: 90, evasion: 12, resistance: 6, damageReduction: 4 } },

  { id: 'acolyte_robe', name: 'Acolyte Robe', slot: 'armor', armorType: 'cloth', icon: '👘', classReq: ['mage', 'worge'], levelReq: 1, stats: { defense: 2, mana: 20, resistance: 3, manaRegen: 0.5 } },
  { id: 'mystic_robe', name: 'Mystic Robe', slot: 'armor', armorType: 'cloth', icon: '👘', classReq: ['mage', 'worge'], levelReq: 4, stats: { defense: 4, mana: 35, resistance: 6, manaRegen: 1 } },
  { id: 'archmage_vestment', name: 'Archmage Vestment', slot: 'armor', armorType: 'cloth', icon: '👘', classReq: ['mage', 'worge'], levelReq: 9, stats: { defense: 7, mana: 55, resistance: 10, manaRegen: 2, cooldownReduction: 3 } },
  { id: 'void_robes', name: 'Void Robes', slot: 'armor', armorType: 'cloth', icon: '👘', classReq: ['mage', 'worge'], levelReq: 14, stats: { defense: 10, mana: 80, resistance: 14, manaRegen: 3, cooldownReduction: 5, magicDamage: 5 } },
];

const accessoryTemplates = [
  { id: 'iron_ring', name: 'Iron Ring', slot: 'accessory', icon: '💍', levelReq: 1, stats: { physicalDamage: 2, defense: 2 } },
  { id: 'ruby_amulet', name: 'Ruby Amulet', slot: 'accessory', icon: '📿', levelReq: 3, stats: { physicalDamage: 2, magicDamage: 2, criticalChance: 3, health: 15 } },
  { id: 'mana_crystal', name: 'Mana Crystal', slot: 'accessory', icon: '💎', levelReq: 4, stats: { mana: 40, manaRegen: 2, cooldownReduction: 3 } },
  { id: 'wolf_pendant', name: 'Wolf Pendant', slot: 'accessory', icon: '🐺', levelReq: 5, stats: { attackSpeed: 5, evasion: 4, criticalChance: 3 } },
  { id: 'shield_charm', name: 'Shield Charm', slot: 'accessory', icon: '🔰', levelReq: 6, stats: { defense: 8, block: 5, health: 30 } },
  { id: 'dragon_tooth', name: 'Dragon Tooth', slot: 'accessory', icon: '🦷', levelReq: 10, stats: { physicalDamage: 5, magicDamage: 5, criticalDamage: 15, armorPenetration: 5 } },
  { id: 'void_shard', name: 'Void Shard', slot: 'accessory', icon: '🌀', levelReq: 15, stats: { magicDamage: 8, mana: 30, drainHealth: 5, cooldownReduction: 5 } },
  { id: 'life_stone', name: 'Life Stone', slot: 'accessory', icon: '💚', levelReq: 8, stats: { health: 60, healthRegen: 2, damageReduction: 3 } },
];

export const allEquipmentTemplates = [...weaponTemplates, ...offhandTemplates, ...armorTemplates, ...accessoryTemplates];

export function canClassEquip(classId, item) {
  if (!classId || !item) return false;
  if (item.classReq && !item.classReq.includes(classId)) return false;
  const rules = CLASS_EQUIPMENT_RULES[classId];
  if (!rules) return true;
  if (item.slot === 'weapon' && item.weaponType) {
    return rules.weaponTypes.includes(item.weaponType);
  }
  if (item.slot === 'offhand' && item.weaponType) {
    return rules.offhandTypes.includes(item.weaponType);
  }
  if (item.slot === 'armor' && item.armorType) {
    return rules.armorTypes.includes(item.armorType);
  }
  return true;
}

export function generateLoot(enemyTemplateId, playerLevel, isBoss = false) {
  const drops = [];
  const dropChance = isBoss ? 1.0 : 0.35;

  if (Math.random() > dropChance) return drops;

  const eligible = allEquipmentTemplates.filter(t => t.levelReq <= playerLevel + 2);
  if (eligible.length === 0) return drops;

  const itemCount = isBoss ? (1 + Math.floor(Math.random() * 2)) : 1;

  for (let i = 0; i < itemCount; i++) {
    const template = eligible[Math.floor(Math.random() * eligible.length)];
    const rarityRoll = Math.random();
    let rarity;
    if (isBoss) {
      if (rarityRoll < 0.05) rarity = 'legendary';
      else if (rarityRoll < 0.25) rarity = 'epic';
      else if (rarityRoll < 0.55) rarity = 'rare';
      else rarity = 'uncommon';
    } else {
      if (rarityRoll < 0.02) rarity = 'epic';
      else if (rarityRoll < 0.10) rarity = 'rare';
      else if (rarityRoll < 0.30) rarity = 'uncommon';
      else rarity = 'common';
    }

    const mult = RARITY[rarity].multiplier;
    const scaledStats = {};
    Object.entries(template.stats).forEach(([key, val]) => {
      scaledStats[key] = Math.round(val * mult * 10) / 10;
    });

    drops.push({
      id: `${template.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      templateId: template.id,
      name: template.name,
      slot: template.slot,
      icon: template.icon,
      weaponType: template.weaponType || null,
      armorType: template.armorType || null,
      rarity,
      levelReq: template.levelReq,
      classReq: template.classReq || null,
      stats: scaledStats,
    });
  }

  return drops;
}

export function getEquipmentStatBonuses(equipment) {
  const bonuses = {};
  EQUIPMENT_SLOTS.forEach(slot => {
    const item = equipment[slot];
    if (item && item.stats) {
      Object.entries(item.stats).forEach(([key, val]) => {
        bonuses[key] = (bonuses[key] || 0) + val;
      });
    }
  });
  return bonuses;
}
