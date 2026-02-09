export const EQUIPMENT_SLOTS = ['weapon', 'offhand', 'armor', 'accessory'];

export const TIERS = {
  1: { name: 'Tier 1', color: '#9ca3af', multiplier: 1.0 },
  2: { name: 'Tier 2', color: '#22c55e', multiplier: 1.3 },
  3: { name: 'Tier 3', color: '#3b82f6', multiplier: 1.65 },
  4: { name: 'Tier 4', color: '#a855f7', multiplier: 2.1 },
  5: { name: 'Tier 5', color: '#f59e0b', multiplier: 2.7 },
  6: { name: 'Tier 6', color: '#ef4444', multiplier: 3.4 },
  7: { name: 'Tier 7', color: '#06b6d4', multiplier: 4.3 },
  8: { name: 'Tier 8', color: '#f472b6', multiplier: 5.5 },
};

export const UPGRADE_COSTS = { 1: 100, 2: 250, 3: 500, 4: 1000, 5: 2500, 6: 5000, 7: 10000 };

export const WEAPON_TYPES = {
  sword: { name: 'Sword', icon: '🗡️', hand: '1h' },
  axe: { name: 'Axe', icon: '🪓', hand: '1h' },
  greatsword: { name: 'Greatsword', icon: '⚔️', hand: '2h' },
  greataxe: { name: 'Greataxe', icon: '🪓', hand: '2h' },
  hammer2h: { name: 'Warhammer', icon: '🔨', hand: '2h' },
  hammer1h: { name: 'Hammer', icon: '🔨', hand: '1h' },
  shield: { name: 'Shield', icon: '🛡️', hand: '1h' },
  staff: { name: 'Staff', icon: '🪄', hand: '2h' },
  dagger: { name: 'Dagger', icon: '🗡️', hand: '1h' },
  bow: { name: 'Bow', icon: '🏹', hand: '2h' },
  crossbow: { name: 'Crossbow', icon: '🏹', hand: '2h' },
  gun: { name: 'Gun', icon: '🔫', hand: '2h' },
  lance: { name: 'Lance', icon: '🔱', hand: '2h' },
  tome: { name: 'Tome', icon: '📖', hand: '1h' },
  relic: { name: 'Relic', icon: '🔮', hand: '1h' },
};

export const ARMOR_TYPES = {
  cloth: { name: 'Cloth', icon: '👘' },
  leather: { name: 'Leather', icon: '🦺' },
  metal: { name: 'Metal', icon: '🛡️' },
};

export const CLASS_EQUIPMENT_RULES = {
  warrior: {
    weaponTypes: ['sword', 'axe', 'greatsword', 'greataxe', 'hammer2h'],
    offhandTypes: ['shield'],
    armorTypes: ['metal'],
  },
  worge: {
    weaponTypes: ['hammer1h', 'staff', 'dagger'],
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
  { id: 'bloodfeud_blade', name: 'Bloodfeud Blade', slot: 'weapon', weaponType: 'sword', icon: '🗡️', classReq: ['warrior'], stats: { physicalDamage: 6, criticalChance: 3, block: 2 } },
  { id: 'wraithfang', name: 'Wraithfang', slot: 'weapon', weaponType: 'sword', icon: '🗡️', classReq: ['warrior'], stats: { physicalDamage: 7, criticalChance: 5, drainHealth: 2 } },
  { id: 'oathbreaker', name: 'Oathbreaker', slot: 'weapon', weaponType: 'sword', icon: '🗡️', classReq: ['warrior'], stats: { physicalDamage: 5, block: 4, defense: 3 } },
  { id: 'kinrend', name: 'Kinrend', slot: 'weapon', weaponType: 'sword', icon: '🗡️', classReq: ['warrior'], stats: { physicalDamage: 6, criticalChance: 4, attackSpeed: 3 } },
  { id: 'dusksinger', name: 'Dusksinger', slot: 'weapon', weaponType: 'sword', icon: '🗡️', classReq: ['warrior'], stats: { physicalDamage: 6, criticalChance: 6, criticalDamage: 5 } },
  { id: 'emberclad', name: 'Emberclad', slot: 'weapon', weaponType: 'sword', icon: '🗡️', classReq: ['warrior'], stats: { physicalDamage: 7, criticalChance: 4, block: 3 } },

  { id: 'gorehowl', name: 'Gorehowl', slot: 'weapon', weaponType: 'axe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 8, criticalDamage: 6 } },
  { id: 'skullsplitter', name: 'Skullsplitter', slot: 'weapon', weaponType: 'axe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 8, criticalDamage: 4, armorPenetration: 2 } },
  { id: 'veinreaver', name: 'Veinreaver', slot: 'weapon', weaponType: 'axe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 7, criticalDamage: 5, drainHealth: 2 } },
  { id: 'ironmaw', name: 'Ironmaw', slot: 'weapon', weaponType: 'axe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 8, block: 3, defense: 3 } },
  { id: 'dreadcleaver', name: 'Dreadcleaver', slot: 'weapon', weaponType: 'axe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 7, criticalDamage: 5, attackSpeed: 3 } },
  { id: 'bonehew', name: 'Bonehew', slot: 'weapon', weaponType: 'axe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 9, block: 4, defense: 2 } },

  { id: 'nightfang', name: 'Nightfang', slot: 'weapon', weaponType: 'dagger', icon: '🗡️', classReq: ['worge', 'ranger'], stats: { physicalDamage: 5, criticalChance: 8, drainHealth: 2 } },
  { id: 'bloodshiv', name: 'Bloodshiv', slot: 'weapon', weaponType: 'dagger', icon: '🗡️', classReq: ['worge', 'ranger'], stats: { physicalDamage: 5, criticalChance: 9, attackSpeed: 3 } },
  { id: 'wraithclaw', name: 'Wraithclaw', slot: 'weapon', weaponType: 'dagger', icon: '🗡️', classReq: ['worge', 'ranger'], stats: { physicalDamage: 4, criticalChance: 10, evasion: 3 } },
  { id: 'emberfang', name: 'Emberfang', slot: 'weapon', weaponType: 'dagger', icon: '🗡️', classReq: ['worge', 'ranger'], stats: { physicalDamage: 5, criticalChance: 7, magicDamage: 2 } },
  { id: 'ironspike', name: 'Ironspike', slot: 'weapon', weaponType: 'dagger', icon: '🗡️', classReq: ['worge', 'ranger'], stats: { physicalDamage: 4, criticalChance: 6, block: 3, defense: 2 } },
  { id: 'duskblade', name: 'Duskblade', slot: 'weapon', weaponType: 'dagger', icon: '🗡️', classReq: ['worge', 'ranger'], stats: { physicalDamage: 5, criticalChance: 11, criticalDamage: 8 } },

  { id: 'skullsunder', name: 'Skullsunder', slot: 'weapon', weaponType: 'greataxe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 12, criticalDamage: 8, armorPenetration: 3 } },
  { id: 'bloodreaver_ga', name: 'Bloodreaver', slot: 'weapon', weaponType: 'greataxe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 13, criticalDamage: 6, drainHealth: 3 } },
  { id: 'wraithhew', name: 'Wraithhew', slot: 'weapon', weaponType: 'greataxe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 11, criticalDamage: 7, attackSpeed: 3 } },
  { id: 'embermaul', name: 'Embermaul', slot: 'weapon', weaponType: 'greataxe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 12, criticalDamage: 6, magicDamage: 3 } },
  { id: 'ironrend', name: 'Ironrend', slot: 'weapon', weaponType: 'greataxe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 13, block: 4, defense: 4 } },
  { id: 'dusksplitter', name: 'Dusksplitter', slot: 'weapon', weaponType: 'greataxe', icon: '🪓', classReq: ['warrior'], stats: { physicalDamage: 11, criticalDamage: 9, criticalChance: 4 } },

  { id: 'doomspire', name: 'Doomspire', slot: 'weapon', weaponType: 'greatsword', icon: '⚔️', classReq: ['warrior'], stats: { physicalDamage: 11, criticalChance: 4, armorPenetration: 3 } },
  { id: 'bloodspire', name: 'Bloodspire', slot: 'weapon', weaponType: 'greatsword', icon: '⚔️', classReq: ['warrior'], stats: { physicalDamage: 12, drainHealth: 3, defense: 3 } },
  { id: 'wraithblade_gs', name: 'Wraithblade', slot: 'weapon', weaponType: 'greatsword', icon: '⚔️', classReq: ['warrior'], stats: { physicalDamage: 10, criticalChance: 5, criticalDamage: 8 } },
  { id: 'emberbrand', name: 'Emberbrand', slot: 'weapon', weaponType: 'greatsword', icon: '⚔️', classReq: ['warrior'], stats: { physicalDamage: 11, magicDamage: 3, criticalChance: 4 } },
  { id: 'ironwrath', name: 'Ironwrath', slot: 'weapon', weaponType: 'greatsword', icon: '⚔️', classReq: ['warrior'], stats: { physicalDamage: 12, block: 5, defense: 4 } },
  { id: 'duskreaver_gs', name: 'Duskreaver', slot: 'weapon', weaponType: 'greatsword', icon: '⚔️', classReq: ['warrior'], stats: { physicalDamage: 10, criticalChance: 6, attackSpeed: 4 } },

  { id: 'titanmaul', name: 'Titanmaul', slot: 'weapon', weaponType: 'hammer2h', icon: '🔨', classReq: ['warrior'], stats: { physicalDamage: 14, defense: 5, block: 4 } },
  { id: 'bloodcrusher', name: 'Bloodcrusher', slot: 'weapon', weaponType: 'hammer2h', icon: '🔨', classReq: ['warrior'], stats: { physicalDamage: 14, drainHealth: 3, armorPenetration: 3 } },
  { id: 'wraithmaul', name: 'Wraithmaul', slot: 'weapon', weaponType: 'hammer2h', icon: '🔨', classReq: ['warrior'], stats: { physicalDamage: 13, criticalDamage: 6, defense: 4 } },
  { id: 'emberforge', name: 'Emberforge', slot: 'weapon', weaponType: 'hammer2h', icon: '🔨', classReq: ['warrior'], stats: { physicalDamage: 14, magicDamage: 3, block: 5 } },
  { id: 'ironbreaker', name: 'Ironbreaker', slot: 'weapon', weaponType: 'hammer2h', icon: '🔨', classReq: ['warrior'], stats: { physicalDamage: 15, block: 6, defense: 5 } },
  { id: 'duskmallet', name: 'Duskmallet', slot: 'weapon', weaponType: 'hammer2h', icon: '🔨', classReq: ['warrior'], stats: { physicalDamage: 13, attackSpeed: 3, criticalDamage: 7 } },

  { id: 'ironfist', name: 'Ironfist', slot: 'weapon', weaponType: 'hammer1h', icon: '🔨', classReq: ['worge'], stats: { physicalDamage: 4, magicDamage: 2, defense: 3, attackSpeed: 3 } },
  { id: 'bloodmaul', name: 'Bloodmaul', slot: 'weapon', weaponType: 'hammer1h', icon: '🔨', classReq: ['worge'], stats: { physicalDamage: 5, magicDamage: 2, drainHealth: 2, attackSpeed: 3 } },
  { id: 'wraithknocker', name: 'Wraithknocker', slot: 'weapon', weaponType: 'hammer1h', icon: '🔨', classReq: ['worge'], stats: { physicalDamage: 4, magicDamage: 3, evasion: 3, attackSpeed: 3 } },
  { id: 'embermallet', name: 'Embermallet', slot: 'weapon', weaponType: 'hammer1h', icon: '🔨', classReq: ['worge'], stats: { physicalDamage: 4, magicDamage: 3, defense: 3, block: 3 } },
  { id: 'ironshard', name: 'Ironshard', slot: 'weapon', weaponType: 'hammer1h', icon: '🔨', classReq: ['worge'], stats: { physicalDamage: 5, magicDamage: 1, block: 5, defense: 4 } },
  { id: 'duskhammer', name: 'Duskhammer', slot: 'weapon', weaponType: 'hammer1h', icon: '🔨', classReq: ['worge'], stats: { physicalDamage: 4, magicDamage: 2, criticalChance: 5, attackSpeed: 4 } },

  { id: 'wraithbone_bow', name: 'Wraithbone Bow', slot: 'weapon', weaponType: 'bow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 6, criticalChance: 6, accuracy: 4 } },
  { id: 'bloodstring_bow', name: 'Bloodstring Bow', slot: 'weapon', weaponType: 'bow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 7, attackSpeed: 3 } },
  { id: 'shadowflight_bow', name: 'Shadowflight Bow', slot: 'weapon', weaponType: 'bow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 6, criticalChance: 8, criticalDamage: 6 } },
  { id: 'emberthorn_bow', name: 'Emberthorn Bow', slot: 'weapon', weaponType: 'bow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 5, magicDamage: 2 } },
  { id: 'ironvine_bow', name: 'Ironvine Bow', slot: 'weapon', weaponType: 'bow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 6, criticalChance: 4, defense: 3, accuracy: 5 } },
  { id: 'duskreaver_bow', name: 'Duskreaver Bow', slot: 'weapon', weaponType: 'bow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 9, criticalDamage: 8 } },

  { id: 'ironveil_repeater', name: 'Ironveil Repeater', slot: 'weapon', weaponType: 'crossbow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 8, criticalDamage: 7, accuracy: 4 } },
  { id: 'skullpiercer', name: 'Skullpiercer', slot: 'weapon', weaponType: 'crossbow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 9, criticalDamage: 9, armorPenetration: 3 } },
  { id: 'bloodreaver_xbow', name: 'Bloodreaver Crossbow', slot: 'weapon', weaponType: 'crossbow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 8, drainHealth: 2, criticalDamage: 6 } },
  { id: 'wraithspike', name: 'Wraithspike', slot: 'weapon', weaponType: 'crossbow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 8, criticalDamage: 8, evasion: 3 } },
  { id: 'emberbolt', name: 'Emberbolt', slot: 'weapon', weaponType: 'crossbow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 8, magicDamage: 2, criticalDamage: 6 } },
  { id: 'duskpiercer_xbow', name: 'Duskpiercer', slot: 'weapon', weaponType: 'crossbow', icon: '🏹', classReq: ['ranger'], stats: { physicalDamage: 9, criticalDamage: 10, attackSpeed: 3 } },

  { id: 'bloodshot_flintlock', name: 'Bloodshot Flintlock', slot: 'weapon', weaponType: 'gun', icon: '🔫', classReq: ['ranger'], stats: { physicalDamage: 10, criticalDamage: 8, accuracy: 3 } },
  { id: 'wraithfire_pistol', name: 'Wraithfire Pistol', slot: 'weapon', weaponType: 'gun', icon: '🔫', classReq: ['ranger'], stats: { physicalDamage: 10, magicDamage: 3, criticalDamage: 6 } },
  { id: 'embercannon', name: 'Embercannon', slot: 'weapon', weaponType: 'gun', icon: '🔫', classReq: ['ranger'], stats: { physicalDamage: 12, criticalDamage: 10, armorPenetration: 4 } },
  { id: 'ironbore_musket', name: 'Ironbore Musket', slot: 'weapon', weaponType: 'gun', icon: '🔫', classReq: ['ranger'], stats: { physicalDamage: 11, armorPenetration: 5, accuracy: 4 } },
  { id: 'duskshot_repeater', name: 'Duskshot Repeater', slot: 'weapon', weaponType: 'gun', icon: '🔫', classReq: ['ranger'], stats: { physicalDamage: 9, attackSpeed: 5, criticalChance: 4 } },
  { id: 'skullblast_cannon', name: 'Skullblast Cannon', slot: 'weapon', weaponType: 'gun', icon: '🔫', classReq: ['ranger'], stats: { physicalDamage: 13, criticalDamage: 12 } },

  { id: 'bloodspear', name: 'Bloodspear', slot: 'weapon', weaponType: 'lance', icon: '🔱', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 4, accuracy: 5 } },
  { id: 'wraithpike', name: 'Wraithpike', slot: 'weapon', weaponType: 'lance', icon: '🔱', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 5, evasion: 3 } },
  { id: 'emberlance', name: 'Emberlance', slot: 'weapon', weaponType: 'lance', icon: '🔱', classReq: ['ranger'], stats: { physicalDamage: 8, magicDamage: 2, criticalChance: 3 } },
  { id: 'ironthrust', name: 'Ironthrust', slot: 'weapon', weaponType: 'lance', icon: '🔱', classReq: ['ranger'], stats: { physicalDamage: 8, armorPenetration: 3, accuracy: 5 } },
  { id: 'duskpiercer_lance', name: 'Duskpiercer Lance', slot: 'weapon', weaponType: 'lance', icon: '🔱', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 6, criticalDamage: 6 } },
  { id: 'skullimpaler', name: 'Skullimpaler', slot: 'weapon', weaponType: 'lance', icon: '🔱', classReq: ['ranger'], stats: { physicalDamage: 9, armorPenetration: 4, accuracy: 4 } },

  { id: 'bloodthorn_staff', name: 'Bloodthorn Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['mage', 'worge'], stats: { magicDamage: 5, mana: 20, drainHealth: 2 } },
  { id: 'wraithwood_staff', name: 'Wraithwood Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['mage', 'worge'], stats: { magicDamage: 5, mana: 25, manaRegen: 1 } },
  { id: 'emberspire_staff', name: 'Emberspire Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['mage', 'worge'], stats: { magicDamage: 6, mana: 20, criticalChance: 3 } },
  { id: 'ironsoul_staff', name: 'Ironsoul Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['mage', 'worge'], stats: { magicDamage: 4, mana: 30, defense: 3, resistance: 3 } },
  { id: 'duskweaver_staff', name: 'Duskweaver Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['mage', 'worge'], stats: { magicDamage: 6, mana: 20, cooldownReduction: 3 } },
  { id: 'skullshroud_staff', name: 'Skullshroud Staff', slot: 'weapon', weaponType: 'staff', icon: '🪄', classReq: ['mage', 'worge'], stats: { magicDamage: 7, mana: 15, drainHealth: 3 } },

  { id: 'grimoire_grudges', name: 'Grimoire of Grudges', slot: 'weapon', weaponType: 'tome', icon: '📖', classReq: ['mage'], stats: { magicDamage: 5, mana: 25, cooldownReduction: 2 } },
  { id: 'bloodscript_tome', name: 'Bloodscript Tome', slot: 'weapon', weaponType: 'tome', icon: '📖', classReq: ['mage'], stats: { magicDamage: 6, mana: 20, drainHealth: 2 } },
  { id: 'wraith_codex', name: 'Wraith Codex', slot: 'weapon', weaponType: 'tome', icon: '📖', classReq: ['mage'], stats: { magicDamage: 5, mana: 30, manaRegen: 1.5 } },
  { id: 'ember_lexicon', name: 'Ember Lexicon', slot: 'weapon', weaponType: 'tome', icon: '📖', classReq: ['mage'], stats: { magicDamage: 6, mana: 20, criticalChance: 4 } },
  { id: 'ironsoul_grimoire', name: 'Ironsoul Grimoire', slot: 'weapon', weaponType: 'tome', icon: '📖', classReq: ['mage'], stats: { magicDamage: 4, mana: 30, defense: 3, resistance: 4 } },
  { id: 'duskbound_tome', name: 'Duskbound Tome', slot: 'weapon', weaponType: 'tome', icon: '📖', classReq: ['mage'], stats: { magicDamage: 7, mana: 15, cooldownReduction: 3 } },
];

const offhandTemplates = [
  { id: 'bloodward_shield', name: 'Bloodward Shield', slot: 'offhand', weaponType: 'shield', icon: '🛡️', classReq: ['warrior'], stats: { defense: 5, block: 6, health: 20 } },
  { id: 'wraithguard_bulwark', name: 'Wraithguard Bulwark', slot: 'offhand', weaponType: 'shield', icon: '🛡️', classReq: ['warrior'], stats: { defense: 6, block: 8, resistance: 4 } },
  { id: 'emberbulwark', name: 'Emberbulwark', slot: 'offhand', weaponType: 'shield', icon: '🛡️', classReq: ['warrior'], stats: { defense: 6, block: 7, health: 25, damageReduction: 2 } },
  { id: 'ironfort_shield', name: 'Ironfort Shield', slot: 'offhand', weaponType: 'shield', icon: '🛡️', classReq: ['warrior'], stats: { defense: 8, block: 10, health: 30 } },
  { id: 'duskwall', name: 'Duskwall', slot: 'offhand', weaponType: 'shield', icon: '🛡️', classReq: ['warrior'], stats: { defense: 5, block: 6, evasion: 4, attackSpeed: 2 } },
  { id: 'skullshield', name: 'Skullshield', slot: 'offhand', weaponType: 'shield', icon: '🛡️', classReq: ['warrior'], stats: { defense: 7, block: 9, damageReduction: 3, health: 15 } },

  { id: 'bloodstone_orb', name: 'Bloodstone Orb', slot: 'offhand', weaponType: 'relic', icon: '🔮', classReq: ['mage'], stats: { magicDamage: 3, mana: 20, drainHealth: 2 } },
  { id: 'wraithsoul_crystal', name: 'Wraithsoul Crystal', slot: 'offhand', weaponType: 'relic', icon: '🔮', classReq: ['mage'], stats: { magicDamage: 3, mana: 25, manaRegen: 1 } },
  { id: 'emberheart_focus', name: 'Emberheart Focus', slot: 'offhand', weaponType: 'relic', icon: '🔮', classReq: ['mage'], stats: { magicDamage: 4, mana: 20, criticalChance: 3 } },
  { id: 'ironsoul_relic', name: 'Ironsoul Relic', slot: 'offhand', weaponType: 'relic', icon: '🔮', classReq: ['mage'], stats: { magicDamage: 2, mana: 30, resistance: 4, defense: 2 } },
  { id: 'duskbound_skull', name: 'Duskbound Skull', slot: 'offhand', weaponType: 'relic', icon: '🔮', classReq: ['mage'], stats: { magicDamage: 4, mana: 20, cooldownReduction: 3 } },
  { id: 'voidheart_relic', name: 'Voidheart Relic', slot: 'offhand', weaponType: 'relic', icon: '🔮', classReq: ['mage'], stats: { magicDamage: 5, mana: 30, manaRegen: 1.5, drainHealth: 2 } },
];

const armorTemplates = [
  { id: 'bloodforged_mail', name: 'Bloodforged Mail', slot: 'armor', armorType: 'metal', icon: '🛡️', classReq: ['warrior', 'ranger'], stats: { defense: 6, health: 25 } },
  { id: 'wraithsteel_plate', name: 'Wraithsteel Plate', slot: 'armor', armorType: 'metal', icon: '🛡️', classReq: ['warrior', 'ranger'], stats: { defense: 7, health: 20, resistance: 4 } },
  { id: 'emberguard_plate', name: 'Emberguard Plate', slot: 'armor', armorType: 'metal', icon: '🛡️', classReq: ['warrior', 'ranger'], stats: { defense: 7, health: 25, damageReduction: 2 } },
  { id: 'ironbound_armor', name: 'Ironbound Armor', slot: 'armor', armorType: 'metal', icon: '🛡️', classReq: ['warrior', 'ranger'], stats: { defense: 9, health: 30, block: 3 } },
  { id: 'duskthorn_plate', name: 'Duskthorn Plate', slot: 'armor', armorType: 'metal', icon: '🛡️', classReq: ['warrior', 'ranger'], stats: { defense: 6, health: 20, evasion: 3, attackSpeed: 2 } },
  { id: 'skullforge_plate', name: 'Skullforge Plate', slot: 'armor', armorType: 'metal', icon: '🛡️', classReq: ['warrior', 'ranger'], stats: { defense: 8, health: 25, damageReduction: 3 } },

  { id: 'bloodhide_vest', name: 'Bloodhide Vest', slot: 'armor', armorType: 'leather', icon: '🦺', classReq: ['worge', 'ranger'], stats: { defense: 4, health: 20, evasion: 3 } },
  { id: 'wraithskin_leather', name: 'Wraithskin Leather', slot: 'armor', armorType: 'leather', icon: '🦺', classReq: ['worge', 'ranger'], stats: { defense: 4, health: 15, evasion: 4, resistance: 3 } },
  { id: 'emberscale_hide', name: 'Emberscale Hide', slot: 'armor', armorType: 'leather', icon: '🦺', classReq: ['worge', 'ranger'], stats: { defense: 5, health: 20, evasion: 3, damageReduction: 2 } },
  { id: 'ironweave_leather', name: 'Ironweave Leather', slot: 'armor', armorType: 'leather', icon: '🦺', classReq: ['worge', 'ranger'], stats: { defense: 6, health: 25, evasion: 2 } },
  { id: 'duskcloak', name: 'Duskcloak', slot: 'armor', armorType: 'leather', icon: '🦺', classReq: ['worge', 'ranger'], stats: { defense: 3, health: 15, evasion: 6, attackSpeed: 3 } },
  { id: 'skullthorn_hide', name: 'Skullthorn Hide', slot: 'armor', armorType: 'leather', icon: '🦺', classReq: ['worge', 'ranger'], stats: { defense: 5, health: 20, evasion: 3, criticalChance: 3 } },

  { id: 'bloodweave_robe', name: 'Bloodweave Robe', slot: 'armor', armorType: 'cloth', icon: '👘', classReq: ['mage', 'worge'], stats: { defense: 2, mana: 25, resistance: 4, drainHealth: 1 } },
  { id: 'wraithshroud_vestment', name: 'Wraithshroud Vestment', slot: 'armor', armorType: 'cloth', icon: '👘', classReq: ['mage', 'worge'], stats: { defense: 2, mana: 30, resistance: 5, manaRegen: 1 } },
  { id: 'emberwoven_robe', name: 'Emberwoven Robe', slot: 'armor', armorType: 'cloth', icon: '👘', classReq: ['mage', 'worge'], stats: { defense: 3, mana: 25, resistance: 3, magicDamage: 2 } },
  { id: 'ironsoul_vestment', name: 'Ironsoul Vestment', slot: 'armor', armorType: 'cloth', icon: '👘', classReq: ['mage', 'worge'], stats: { defense: 4, mana: 20, resistance: 6, health: 15 } },
  { id: 'duskthread_robe', name: 'Duskthread Robe', slot: 'armor', armorType: 'cloth', icon: '👘', classReq: ['mage', 'worge'], stats: { defense: 2, mana: 25, resistance: 3, cooldownReduction: 3 } },
  { id: 'skullveil_robe', name: 'Skullveil Robe', slot: 'armor', armorType: 'cloth', icon: '👘', classReq: ['mage', 'worge'], stats: { defense: 3, mana: 30, resistance: 4, magicDamage: 3 } },
];

const accessoryTemplates = [
  { id: 'bloodrage_ring', name: 'Bloodrage Ring', slot: 'accessory', icon: '💍', relicType: 'ring', stats: { physicalDamage: 3, criticalChance: 3 } },
  { id: 'wraithfury_band', name: 'Wraithfury Band', slot: 'accessory', icon: '💍', relicType: 'ring', stats: { physicalDamage: 3, attackSpeed: 4 } },
  { id: 'emberflame_signet', name: 'Emberflame Signet', slot: 'accessory', icon: '💍', relicType: 'ring', stats: { magicDamage: 3, criticalDamage: 6 } },
  { id: 'ironwill_ring', name: 'Ironwill Ring', slot: 'accessory', icon: '💍', relicType: 'ring', stats: { physicalDamage: 2, defense: 4 } },
  { id: 'duskstrike_ring', name: 'Duskstrike Ring', slot: 'accessory', icon: '💍', relicType: 'ring', stats: { criticalChance: 4, criticalDamage: 8 } },
  { id: 'skullcrush_band', name: 'Skullcrush Band', slot: 'accessory', icon: '💍', relicType: 'ring', stats: { physicalDamage: 3, armorPenetration: 3 } },

  { id: 'bloodward_amulet', name: 'Bloodward Amulet', slot: 'accessory', icon: '📿', relicType: 'amulet', stats: { defense: 4, health: 25 } },
  { id: 'wraithshield_pendant', name: 'Wraithshield Pendant', slot: 'accessory', icon: '📿', relicType: 'amulet', stats: { resistance: 5, evasion: 3 } },
  { id: 'emberbark_talisman', name: 'Emberbark Talisman', slot: 'accessory', icon: '📿', relicType: 'amulet', stats: { defense: 3, damageReduction: 3 } },
  { id: 'ironheart_medallion', name: 'Ironheart Medallion', slot: 'accessory', icon: '📿', relicType: 'amulet', stats: { health: 30, block: 4 } },
  { id: 'duskguard_charm', name: 'Duskguard Charm', slot: 'accessory', icon: '📿', relicType: 'amulet', stats: { defense: 3, resistance: 4 } },
  { id: 'skullfort_talisman', name: 'Skullfort Talisman', slot: 'accessory', icon: '📿', relicType: 'amulet', stats: { damageReduction: 3, health: 20 } },

  { id: 'bloodmoon_crystal', name: 'Bloodmoon Crystal', slot: 'accessory', icon: '💎', relicType: 'crystal', stats: { magicDamage: 4, mana: 25 } },
  { id: 'wraithsoul_gem', name: 'Wraithsoul Gem', slot: 'accessory', icon: '💎', relicType: 'crystal', stats: { magicDamage: 3, manaRegen: 2 } },
  { id: 'embervoid_prism', name: 'Embervoid Prism', slot: 'accessory', icon: '💎', relicType: 'crystal', stats: { magicDamage: 3, cooldownReduction: 4 } },
  { id: 'ironsoul_shard', name: 'Ironsoul Shard', slot: 'accessory', icon: '💎', relicType: 'crystal', stats: { mana: 30, resistance: 4 } },
  { id: 'duskweaver_stone', name: 'Duskweaver Stone', slot: 'accessory', icon: '💎', relicType: 'crystal', stats: { magicDamage: 4, mana: 20 } },
  { id: 'void_crystal', name: 'Void Crystal', slot: 'accessory', icon: '💎', relicType: 'crystal', stats: { magicDamage: 4, drainHealth: 3 } },

  { id: 'lifesblood_totem', name: 'Lifesblood Totem', slot: 'accessory', icon: '🪬', relicType: 'totem', stats: { healthRegen: 3, health: 30 } },
  { id: 'wraithbalm_idol', name: 'Wraithbalm Idol', slot: 'accessory', icon: '🪬', relicType: 'totem', stats: { healthRegen: 2, manaRegen: 2 } },
  { id: 'emberheart_totem', name: 'Emberheart Totem', slot: 'accessory', icon: '🪬', relicType: 'totem', stats: { health: 25, resistance: 4 } },
  { id: 'ironpulse_stone', name: 'Ironpulse Stone', slot: 'accessory', icon: '🪬', relicType: 'totem', stats: { healthRegen: 3, defense: 3 } },
  { id: 'duskleaf_charm', name: 'Duskleaf Charm', slot: 'accessory', icon: '🪬', relicType: 'totem', stats: { healthRegen: 2, evasion: 4 } },
  { id: 'natures_heart', name: "Nature's Heart", slot: 'accessory', icon: '🪬', relicType: 'totem', stats: { health: 25, manaRegen: 2 } },

  { id: 'swiftblade_trinket', name: 'Swiftblade Trinket', slot: 'accessory', icon: '⚡', relicType: 'trinket', stats: { attackSpeed: 5, criticalChance: 3 } },
  { id: 'shadow_step_ring', name: 'Shadow Step Ring', slot: 'accessory', icon: '⚡', relicType: 'trinket', stats: { evasion: 5, attackSpeed: 4 } },
  { id: 'ember_quickness', name: 'Ember Quickness Charm', slot: 'accessory', icon: '⚡', relicType: 'trinket', stats: { attackSpeed: 5, cooldownReduction: 3 } },
  { id: 'ironside_buckle', name: 'Ironside Buckle', slot: 'accessory', icon: '⚡', relicType: 'trinket', stats: { block: 5, defense: 3 } },
  { id: 'duskrunner_boots', name: 'Duskrunner Boots', slot: 'accessory', icon: '⚡', relicType: 'trinket', stats: { evasion: 4, attackSpeed: 5 } },
  { id: 'grudgebearer_seal', name: 'Grudgebearer Seal', slot: 'accessory', icon: '⚡', relicType: 'trinket', stats: { physicalDamage: 2, magicDamage: 2, criticalChance: 2, criticalDamage: 4 } },
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

function getDropTier(playerLevel, isBoss) {
  let baseTier = 1;
  if (playerLevel >= 16) baseTier = 4;
  else if (playerLevel >= 12) baseTier = 3;
  else if (playerLevel >= 7) baseTier = 2;
  else baseTier = 1;

  if (isBoss) baseTier = Math.min(8, baseTier + 1);

  const roll = Math.random();
  if (roll < 0.05 && baseTier < 8) return Math.min(8, baseTier + 2);
  if (roll < 0.20 && baseTier < 8) return Math.min(8, baseTier + 1);
  return baseTier;
}

export function generateLoot(enemyTemplateId, playerLevel, isBoss = false) {
  const drops = [];
  const dropChance = isBoss ? 1.0 : 0.35;

  if (Math.random() > dropChance) return drops;

  const itemCount = isBoss ? (1 + Math.floor(Math.random() * 2)) : 1;

  for (let i = 0; i < itemCount; i++) {
    const template = allEquipmentTemplates[Math.floor(Math.random() * allEquipmentTemplates.length)];
    const tier = getDropTier(playerLevel, isBoss);
    const mult = TIERS[tier].multiplier;
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
      relicType: template.relicType || null,
      tier,
      classReq: template.classReq || null,
      stats: scaledStats,
    });
  }

  return drops;
}

export function upgradeItem(item) {
  if (!item || item.tier >= 8) return null;
  const cost = UPGRADE_COSTS[item.tier];
  if (!cost) return null;

  const newTier = item.tier + 1;
  const template = allEquipmentTemplates.find(t => t.id === item.templateId);
  if (!template) return null;

  const mult = TIERS[newTier].multiplier;
  const scaledStats = {};
  Object.entries(template.stats).forEach(([key, val]) => {
    scaledStats[key] = Math.round(val * mult * 10) / 10;
  });

  return {
    ...item,
    tier: newTier,
    stats: scaledStats,
  };
}

function createStarterItem(template) {
  return {
    id: `${template.id}_starter_${Math.random().toString(36).slice(2, 6)}`,
    templateId: template.id,
    name: template.name,
    slot: template.slot,
    icon: template.icon,
    weaponType: template.weaponType || null,
    armorType: template.armorType || null,
    relicType: template.relicType || null,
    tier: 1,
    classReq: template.classReq || null,
    stats: { ...template.stats },
  };
}

export function getStartingEquipment(classId) {
  const equipment = {};
  const classWeapons = {
    warrior: 'bloodfeud_blade',
    worge: 'ironfist',
    mage: 'bloodthorn_staff',
    ranger: 'wraithbone_bow',
  };
  const classOffhands = {
    warrior: 'bloodward_shield',
    mage: 'bloodstone_orb',
  };
  const classArmor = {
    warrior: 'bloodforged_mail',
    worge: 'bloodhide_vest',
    mage: 'bloodweave_robe',
    ranger: 'bloodforged_mail',
  };

  const weaponId = classWeapons[classId];
  if (weaponId) {
    const tmpl = weaponTemplates.find(t => t.id === weaponId);
    if (tmpl) equipment.weapon = createStarterItem(tmpl);
  }

  const offhandId = classOffhands[classId];
  if (offhandId) {
    const tmpl = offhandTemplates.find(t => t.id === offhandId);
    if (tmpl) equipment.offhand = createStarterItem(tmpl);
  }

  const armorId = classArmor[classId];
  if (armorId) {
    const tmpl = armorTemplates.find(t => t.id === armorId);
    if (tmpl) equipment.armor = createStarterItem(tmpl);
  }

  const accessoryTmpl = accessoryTemplates.find(t => t.id === 'bloodrage_ring');
  if (accessoryTmpl) equipment.accessory = createStarterItem(accessoryTmpl);

  return equipment;
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
