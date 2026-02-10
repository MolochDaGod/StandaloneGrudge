const BASE = '/sprites/ui';

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
  sword: `${BASE}/icons/icon_sword.png`,
  crossedSwords: `${BASE}/icons/icon_crossed_swords.png`,
  lance: `${BASE}/icons/icon_lance.png`,
  dagger: `${BASE}/icons/icon_dagger.png`,
  shield: `${BASE}/icons/icon_shield_blue.png`,
  potion: `${BASE}/icons/icon_potion_blue.png`,
  gem: `${BASE}/icons/icon_gem_blue.png`,
  leaf: `${BASE}/icons/icon_leaf.png`,
  bar: `${BASE}/icons/icon_bar.png`,
  diamond: `${BASE}/icons/icon_diamond.png`,
  medal: `${BASE}/icons/icon_medal.png`,
  crystal: `${BASE}/icons/icon_crystal.png`,
  crest: `${BASE}/icons/icon_crest.png`,
  blade: `${BASE}/icons/icon_blade.png`,
  axe: `${BASE}/icons/icon_axe.png`,
  star: `${BASE}/icons/icon_star.png`,
  flask: `${BASE}/icons/icon_flask.png`,
  buckler: `${BASE}/icons/icon_buckler.png`,
  herb: `${BASE}/icons/icon_herb.png`,

  actionAttack: `${BASE}/icons/action_attack.png`,
  actionMagic: `${BASE}/icons/action_magic.png`,
  actionDefend: `${BASE}/icons/action_defend.png`,
  actionItem: `${BASE}/icons/action_item.png`,
  actionSpecial: `${BASE}/icons/action_special.png`,
  actionFlee: `${BASE}/icons/action_flee.png`,

  eqWeapon: `${BASE}/icons/eq_weapon.png`,
  eqShield: `${BASE}/icons/eq_shield.png`,
  eqArmor: `${BASE}/icons/eq_armor.png`,
  eqRing: `${BASE}/icons/eq_ring.png`,
  mannequin: `${BASE}/icons/mannequin.png`,
};

export const SLOT_ICON_MAP = {
  weapon: UI_ICONS.eqWeapon,
  offhand: UI_ICONS.eqShield,
  helmet: UI_ICONS.buckler,
  armor: UI_ICONS.eqArmor,
  feet: UI_ICONS.leaf,
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
  bow: UI_ICONS.lance,
  crossbow: UI_ICONS.lance,
  gun: UI_ICONS.star,
  lance: UI_ICONS.lance,
  tome: UI_ICONS.gem,
  relic: UI_ICONS.diamond,
};

export function SpriteIcon({ src, size = 16, scale = 2, style = {} }) {
  return (
    <div style={{
      width: size * scale,
      height: size * scale,
      backgroundImage: `url(${src})`,
      backgroundSize: `${size * scale}px ${size * scale}px`,
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
      ...style,
    }} />
  );
}
