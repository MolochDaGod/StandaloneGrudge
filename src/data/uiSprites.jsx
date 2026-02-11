import React from 'react';

const BASE = '/sprites/ui';
const ICON = `${BASE}/icons`;
const ABILITY = '/icons';

export const UI_PANELS = {
  equipPanelSmall: `${BASE}/panels/equip_panel_small.png`,
  equipPanelLarge: `${BASE}/panels/equip_panel_large.png`,
  equipGrid: `${BASE}/panels/equip_grid.png`,
  equipPanelBottom: `${BASE}/panels/equip_panel_bottom.png`,
  hotbarHeader: `${BASE}/panels/hotbar_header.png`,
  hotbarBg: `${BASE}/panels/hotbar_bg.png`,
  invHeader: `${BASE}/panels/inv_header.png`,
  invGrid: `${BASE}/panels/inv_grid.png`,
};

export const UI_SLOTS = {
  empty: `${BASE}/slots/slot_empty.png`,
  highlight: `${BASE}/slots/slot_highlight.png`,
  hotbar: `${BASE}/slots/hotbar_slot.png`,
  hotbarActive: `${BASE}/slots/hotbar_slot_active.png`,
  circleGold: `${BASE}/slots/circle_gold.png`,
  circleGrey: `${BASE}/slots/circle_grey.png`,
  circleDark: `${BASE}/slots/circle_dark.png`,
};

export const UI_ICONS = {
  sword: `${ICON}/icon_sword.png`,
  crossedSwords: `${ICON}/icon_crossed_swords.png`,
  lance: `${ICON}/icon_lance.png`,
  dagger: `${ICON}/icon_dagger.png`,
  shield: `${ICON}/icon_shield_blue.png`,
  potion: `${ICON}/icon_potion_blue.png`,
  gem: `${ICON}/icon_gem_blue.png`,
  leaf: `${ICON}/icon_leaf.png`,
  bar: `${ICON}/icon_bar.png`,
  diamond: `${ICON}/icon_diamond.png`,
  medal: `${ICON}/icon_medal.png`,
  crystal: `${ICON}/icon_crystal.png`,
  crest: `${ICON}/icon_crest.png`,
  blade: `${ICON}/icon_blade.png`,
  axe: `${ICON}/icon_axe.png`,
  star: `${ICON}/icon_star.png`,
  flask: `${ICON}/icon_flask.png`,
  buckler: `${ICON}/icon_buckler.png`,
  herb: `${ICON}/icon_herb.png`,

  actionAttack: `${ICON}/action_attack.png`,
  actionMagic: `${ICON}/action_magic.png`,
  actionDefend: `${ICON}/action_defend.png`,
  actionItem: `${ICON}/action_item.png`,
  actionSpecial: `${ICON}/action_special.png`,
  actionFlee: `${ICON}/action_flee.png`,

  eqWeapon: `${ICON}/eq_weapon.png`,
  eqShield: `${ICON}/eq_shield.png`,
  eqArmor: `${ICON}/eq_armor.png`,
  eqRing: `${ICON}/eq_ring.png`,
  mannequin: `${ICON}/mannequin.png`,

  gold: `${ICON}/icon_gold.png`,
  coin: `${ICON}/item_coin.png`,
  camp: `${ICON}/icon_camp.png`,
  portal: `${ICON}/icon_portal.png`,
  skull: `${ICON}/icon_skull.png`,
  pickaxe: `${ICON}/icon_pickaxe.png`,
  sparkle: `${ICON}/icon_sparkle.png`,
  fire: `${ICON}/icon_fire.png`,
  ice: `${ICON}/icon_ice.png`,
  lightning: `${ICON}/icon_lightning.png`,
  boots: `${ICON}/icon_boots.png`,
  chart: `${ICON}/icon_chart.png`,
  gift: `${ICON}/icon_gift.png`,
  ore: `${ICON}/icon_ore.png`,
  wood: `${ICON}/icon_wood.png`,
  trophy: `${ICON}/icon_trophy.png`,
  heart: `${ICON}/icon_heart.png`,
  wand: `${ICON}/icon_wand.png`,
  crown: `${ICON}/icon_crown.png`,
  strength: `${ICON}/icon_strength.png`,
  mind: `${ICON}/icon_mind.png`,
  mana: `${ICON}/icon_mana.png`,
  wolf: `${ICON}/icon_wolf.png`,
  lock: `${ICON}/icon_lock.png`,
  moon: `${ICON}/icon_moon.png`,
  bomb: `${ICON}/icon_bomb.png`,
  bow: `${ICON}/icon_bow.png`,
  bag: `${ICON}/icon_bag.png`,
  hammer: `${ICON}/icon_hammer.png`,
  scroll: `${ICON}/icon_scroll.png`,
  potionGreen: `${ICON}/icon_potion_green.png`,
  battle: `${ICON}/icon_battle.png`,
  castle: `${ICON}/icon_castle.png`,
  target: `${ICON}/icon_target.png`,
  coffin: `${ICON}/icon_coffin.png`,
  energy: `${ICON}/icon_energy.png`,
  dice: `${ICON}/icon_dice.png`,
  bandage: `${ICON}/icon_bandage.png`,
  chaos: `${ICON}/icon_chaos.png`,
  world: `${ICON}/icon_world.png`,
  nature: `${ICON}/icon_nature.png`,

  potionRed: `${ICON}/item_potion_red.png`,
  potionBlue: `${ICON}/item_potion_blue.png`,
  potionGreen2: `${ICON}/icon_potion2.png`,
  armor: `${ICON}/item_armor.png`,
  helm: `${ICON}/item_helm.png`,
  ring: `${ICON}/item_ring.png`,
  book: `${ICON}/item_book.png`,
  key: `${ICON}/item_key.png`,
  staff: `${ICON}/item_staff.png`,
};

export const ICON_REGISTRY = {
  attack: UI_ICONS.sword,
  battle: UI_ICONS.battle,
  defend: UI_ICONS.shield,
  magic: UI_ICONS.crystal,
  heal: UI_ICONS.heart,
  buff: UI_ICONS.sparkle,
  debuff: UI_ICONS.skull,
  flee: UI_ICONS.actionFlee,
  item: UI_ICONS.potion,

  gold: UI_ICONS.gold,
  coin: UI_ICONS.coin,
  camp: UI_ICONS.camp,
  portal: UI_ICONS.portal,
  skull: UI_ICONS.skull,
  pickaxe: UI_ICONS.pickaxe,
  sparkle: UI_ICONS.sparkle,
  fire: UI_ICONS.fire,
  ice: UI_ICONS.ice,
  lightning: UI_ICONS.lightning,
  boots: UI_ICONS.boots,
  chart: UI_ICONS.chart,
  gift: UI_ICONS.gift,
  trophy: UI_ICONS.trophy,
  heart: UI_ICONS.heart,
  crown: UI_ICONS.crown,
  strength: UI_ICONS.strength,
  mind: UI_ICONS.mind,
  mana: UI_ICONS.mana,
  wolf: UI_ICONS.wolf,
  lock: UI_ICONS.lock,
  moon: UI_ICONS.moon,
  bomb: UI_ICONS.bomb,
  target: UI_ICONS.target,
  coffin: UI_ICONS.coffin,
  energy: UI_ICONS.energy,
  dice: UI_ICONS.dice,
  bandage: UI_ICONS.bandage,
  chaos: UI_ICONS.chaos,
  world: UI_ICONS.world,
  nature: UI_ICONS.nature,
  scroll: UI_ICONS.scroll,
  bag: UI_ICONS.bag,

  ore: UI_ICONS.ore,
  wood: UI_ICONS.wood,
  herb: UI_ICONS.herb,
  diamond: UI_ICONS.diamond,

  sword: UI_ICONS.sword,
  axe: UI_ICONS.axe,
  greatsword: UI_ICONS.crossedSwords,
  greataxe: UI_ICONS.axe,
  dagger: UI_ICONS.dagger,
  shield: UI_ICONS.shield,
  mace: UI_ICONS.bar,
  staff: UI_ICONS.staff,
  bow: UI_ICONS.bow,
  crossbow: UI_ICONS.bow,
  gun: UI_ICONS.star,
  lance: UI_ICONS.lance,
  tome: UI_ICONS.book,
  relic: UI_ICONS.diamond,
  hammer: UI_ICONS.hammer,
  wand: UI_ICONS.wand,

  helmet: UI_ICONS.helm,
  armor: UI_ICONS.armor,
  ring: UI_ICONS.ring,
  feet: UI_ICONS.boots,
  weapon: UI_ICONS.sword,
  offhand: UI_ICONS.shield,

  potion_health: UI_ICONS.potionRed,
  potion_mana: UI_ICONS.potionBlue,
  potion_stamina: UI_ICONS.potionGreen,
  potion_speed: UI_ICONS.flask,
  potion_cure: UI_ICONS.herb,
  potion_resurrect: UI_ICONS.crystal,

  ability_fireball: `${ABILITY}/ability_fireball.png`,
  ability_heal: `${ABILITY}/ability_heal.png`,
  ability_lightning: `${ABILITY}/ability_lightning.png`,
  ability_arcane_bolt: `${ABILITY}/ability_arcane_bolt.png`,
  ability_war_cry: `${ABILITY}/ability_war_cry.png`,
  ability_whirlwind: `${ABILITY}/ability_whirlwind.png`,
  ability_blade_storm: `${ABILITY}/ability_blade_storm.png`,
  ability_blessing: `${ABILITY}/ability_blessing.png`,
  ability_meteor_strike: `${ABILITY}/ability_meteor_strike.png`,
  ability_life_drain: `${ABILITY}/ability_life_drain.png`,
  ability_mana_shield: `${ABILITY}/ability_mana_shield.png`,
  ability_entangle: `${ABILITY}/ability_entangle.png`,
  ability_bear_form: `${ABILITY}/ability_bear_form.png`,
  ability_arrow_storm: `${ABILITY}/ability_arrow_storm.png`,
  ability_sniper_shot: `${ABILITY}/ability_sniper_shot.png`,
  ability_sunder_armor: `${ABILITY}/ability_sunder_armor.png`,
  ability_swift_blade: `${ABILITY}/ability_swift_blade.png`,
  ability_dual_slash: `${ABILITY}/ability_dual_slash.png`,
  ability_evasive: `${ABILITY}/ability_evasive.png`,
  ability_invincible: `${ABILITY}/ability_invincible.png`,
  ability_lacerate: `${ABILITY}/ability_lacerate.png`,
  ability_mind_break: `${ABILITY}/ability_mind_break.png`,
  ability_sever: `${ABILITY}/ability_sever.png`,
  ability_shatter: `${ABILITY}/ability_shatter.png`,
  ability_demon_blade: `${ABILITY}/ability_demon_blade.png`,
  ability_molotov: `${ABILITY}/ability_molotov.png`,
  ability_bear_trap: `${ABILITY}/ability_bear_trap.png`,
  ability_arcane_cataclysm: `${ABILITY}/ability_arcane_cataclysm.png`,
};

export const SLOT_ICON_MAP = {
  weapon: UI_ICONS.eqWeapon,
  offhand: UI_ICONS.eqShield,
  helmet: UI_ICONS.buckler,
  armor: UI_ICONS.eqArmor,
  feet: UI_ICONS.boots,
  ring: UI_ICONS.eqRing,
  relic: UI_ICONS.diamond,
};

export const WEAPON_TYPE_ICON_MAP = {
  sword: UI_ICONS.sword,
  axe: UI_ICONS.axe,
  greatsword: UI_ICONS.crossedSwords,
  greataxe: UI_ICONS.axe,
  shield: UI_ICONS.shield,
  mace: UI_ICONS.bar,
  staff: UI_ICONS.crystal,
  dagger: UI_ICONS.dagger,
  bow: UI_ICONS.bow,
  crossbow: UI_ICONS.bow,
  gun: UI_ICONS.star,
  lance: UI_ICONS.lance,
  tome: UI_ICONS.gem,
  relic: UI_ICONS.diamond,
  hammer: UI_ICONS.hammer,
  hammer1h: UI_ICONS.hammer,
  hammer2h: UI_ICONS.hammer,
};

export const ITEM_ICON_MAP = {
  weapon: {
    sword: `${ICON}/item_sword.png`,
    axe: `${ICON}/item_axe.png`,
    greatsword: `${ICON}/item_sword.png`,
    greataxe: `${ICON}/item_axe.png`,
    dagger: `${ICON}/item_dagger.png`,
    mace: `${ICON}/icon_bar.png`,
    staff: `${ICON}/item_staff.png`,
    bow: `${ICON}/item_bow.png`,
    crossbow: `${ICON}/item_bow.png`,
    gun: `${ICON}/icon_star.png`,
    lance: `${ICON}/icon_lance.png`,
    tome: `${ICON}/item_book.png`,
    hammer1h: `${ICON}/icon_hammer.png`,
    hammer2h: `${ICON}/icon_hammer.png`,
    _default: `${ICON}/item_sword.png`,
  },
  offhand: {
    shield: `${ICON}/item_shield.png`,
    relic: `${ICON}/item_gem.png`,
    _default: `${ICON}/item_shield.png`,
  },
  helmet: `${ICON}/item_helm.png`,
  armor: `${ICON}/item_armor.png`,
  feet: `${ICON}/icon_boots.png`,
  ring: `${ICON}/item_ring.png`,
  relic: `${ICON}/item_gem.png`,
  consumable: {
    health: `${ICON}/item_potion_red.png`,
    mana: `${ICON}/item_potion_blue.png`,
    stamina: `${ICON}/icon_potion_green.png`,
    speed: `${ICON}/icon_flask.png`,
    cure: `${ICON}/icon_herb.png`,
    resurrect: `${ICON}/icon_crystal.png`,
    _default: `${ICON}/item_potion_red.png`,
  },
};

export function getItemSpriteIcon(item) {
  if (!item) return null;
  const slotMap = ITEM_ICON_MAP[item.slot];
  if (!slotMap) return null;
  if (typeof slotMap === 'string') return slotMap;
  const subType = item.weaponType || item.consumableType || item.armorType || item.helmetType || item.feetType;
  return slotMap[subType] || slotMap._default || null;
}

export function getIconSrc(key) {
  return ICON_REGISTRY[key] || UI_ICONS[key] || null;
}

export function SpriteIcon({ src, name, size = 16, scale = 2, style = {}, className = '' }) {
  const iconSrc = src || (name && getIconSrc(name));
  if (!iconSrc) return null;
  const w = size * scale;
  const h = size * scale;
  return (
    <img
      src={iconSrc}
      alt=""
      className={className}
      style={{
        width: w,
        height: h,
        imageRendering: 'pixelated',
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}

export function InlineIcon({ name, src, size = 14, style = {} }) {
  const iconSrc = src || (name && getIconSrc(name));
  if (!iconSrc) return null;
  return (
    <img
      src={iconSrc}
      alt=""
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        display: 'inline-block',
        verticalAlign: 'middle',
        marginRight: 3,
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}
