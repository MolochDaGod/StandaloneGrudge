export const EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory'];

export const RARITY = {
  common: { name: 'Common', color: '#9ca3af', multiplier: 1.0 },
  uncommon: { name: 'Uncommon', color: '#22c55e', multiplier: 1.3 },
  rare: { name: 'Rare', color: '#3b82f6', multiplier: 1.7 },
  epic: { name: 'Epic', color: '#a855f7', multiplier: 2.2 },
  legendary: { name: 'Legendary', color: '#f59e0b', multiplier: 3.0 },
};

const weaponTemplates = [
  { id: 'iron_sword', name: 'Iron Sword', slot: 'weapon', icon: '🗡️', classReq: ['warrior'], levelReq: 1, stats: { physicalDamage: 4, criticalChance: 2 } },
  { id: 'steel_blade', name: 'Steel Blade', slot: 'weapon', icon: '⚔️', classReq: ['warrior'], levelReq: 4, stats: { physicalDamage: 8, criticalChance: 3, block: 2 } },
  { id: 'greatsword', name: 'Greatsword', slot: 'weapon', icon: '🗡️', classReq: ['warrior'], levelReq: 8, stats: { physicalDamage: 14, criticalChance: 4, stagger: 1 } },
  { id: 'doom_blade', name: 'Doom Blade', slot: 'weapon', icon: '⚔️', classReq: ['warrior'], levelReq: 14, stats: { physicalDamage: 22, criticalChance: 6, drainHealth: 3 } },
  { id: 'oak_staff', name: 'Oak Staff', slot: 'weapon', icon: '🪄', classReq: ['mage'], levelReq: 1, stats: { magicDamage: 3, mana: 15, manaRegen: 0.5 } },
  { id: 'crystal_staff', name: 'Crystal Staff', slot: 'weapon', icon: '🔮', classReq: ['mage'], levelReq: 4, stats: { magicDamage: 6, mana: 25, manaRegen: 1, cooldownReduction: 2 } },
  { id: 'arcane_scepter', name: 'Arcane Scepter', slot: 'weapon', icon: '🪄', classReq: ['mage'], levelReq: 8, stats: { magicDamage: 10, mana: 40, manaRegen: 2, spellAccuracy: 5 } },
  { id: 'void_staff', name: 'Void Staff', slot: 'weapon', icon: '🔮', classReq: ['mage'], levelReq: 14, stats: { magicDamage: 18, mana: 60, manaRegen: 3, cooldownReduction: 5 } },
  { id: 'short_bow', name: 'Short Bow', slot: 'weapon', icon: '🏹', classReq: ['ranger'], levelReq: 1, stats: { physicalDamage: 3, criticalChance: 4, accuracy: 3 } },
  { id: 'longbow', name: 'Longbow', slot: 'weapon', icon: '🏹', classReq: ['ranger'], levelReq: 4, stats: { physicalDamage: 7, criticalChance: 6, accuracy: 5, criticalDamage: 5 } },
  { id: 'composite_bow', name: 'Composite Bow', slot: 'weapon', icon: '🏹', classReq: ['ranger'], levelReq: 8, stats: { physicalDamage: 12, criticalChance: 8, accuracy: 8, attackSpeed: 3 } },
  { id: 'shadow_bow', name: 'Shadow Bow', slot: 'weapon', icon: '🏹', classReq: ['ranger'], levelReq: 14, stats: { physicalDamage: 20, criticalChance: 12, accuracy: 10, criticalDamage: 15 } },
  { id: 'storm_mace', name: 'Storm Mace', slot: 'weapon', icon: '🔨', classReq: ['worge'], levelReq: 1, stats: { physicalDamage: 3, magicDamage: 1, attackSpeed: 3, evasion: 2 } },
  { id: 'thornwood_dagger', name: 'Thornwood Dagger', slot: 'weapon', icon: '🗡️', classReq: ['worge'], levelReq: 4, stats: { physicalDamage: 5, magicDamage: 3, attackSpeed: 5, evasion: 3, drainHealth: 2 } },
  { id: 'tempest_maul', name: 'Tempest Maul', slot: 'weapon', icon: '⚡', classReq: ['worge'], levelReq: 8, stats: { physicalDamage: 8, magicDamage: 5, attackSpeed: 6, evasion: 4, criticalChance: 5 } },
  { id: 'natures_fang', name: "Nature's Fang", slot: 'weapon', icon: '🌿', classReq: ['worge'], levelReq: 14, stats: { physicalDamage: 13, magicDamage: 8, attackSpeed: 8, evasion: 6, drainHealth: 5 } },
];

const armorTemplates = [
  { id: 'leather_vest', name: 'Leather Vest', slot: 'armor', icon: '🦺', levelReq: 1, stats: { defense: 4, health: 20 } },
  { id: 'chain_mail', name: 'Chain Mail', slot: 'armor', icon: '🛡️', levelReq: 3, stats: { defense: 8, health: 35, damageReduction: 2 } },
  { id: 'plate_armor', name: 'Plate Armor', slot: 'armor', icon: '🛡️', levelReq: 6, stats: { defense: 14, health: 55, damageReduction: 4, block: 3 } },
  { id: 'mystic_robe', name: 'Mystic Robe', slot: 'armor', icon: '👘', levelReq: 4, stats: { defense: 5, mana: 30, resistance: 5, manaRegen: 1 } },
  { id: 'shadow_cloak', name: 'Shadow Cloak', slot: 'armor', icon: '🧥', levelReq: 7, stats: { defense: 8, evasion: 6, criticalEvasion: 5, health: 25 } },
  { id: 'dragon_scale', name: 'Dragon Scale Armor', slot: 'armor', icon: '🐉', levelReq: 10, stats: { defense: 20, health: 80, resistance: 8, damageReduction: 6 } },
  { id: 'void_plate', name: 'Void Plate', slot: 'armor', icon: '🛡️', levelReq: 15, stats: { defense: 28, health: 120, damageReduction: 8, resistance: 10, block: 5 } },
  { id: 'beast_hide', name: 'Beast Hide', slot: 'armor', icon: '🐾', levelReq: 5, stats: { defense: 10, health: 40, evasion: 4, healthRegen: 1 } },
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

export const allEquipmentTemplates = [...weaponTemplates, ...armorTemplates, ...accessoryTemplates];

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
