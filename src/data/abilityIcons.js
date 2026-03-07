import { OBJECTSTORE_BASE } from './objectStoreIcons.js';

const B = `${OBJECTSTORE_BASE}/icons/skill_nobg`;

export const abilityIconMap = {
  // ── Warrior abilities ──────────────────────────────────────────────────────
  slash:             `${B}/Warriorskill_01_nobg.png`,
  power_strike:      `${B}/Warriorskill_02_nobg.png`,
  cleave:            `${B}/Warriorskill_03_nobg.png`,
  shield_bash:       `${B}/Warriorskill_04_nobg.png`,
  demon_blade:       `${B}/Warriorskill_05_nobg.png`,
  invincible:        `${B}/Warriorskill_06_nobg.png`,
  war_cry:           `${B}/Warriorskill_07_nobg.png`,
  guardian_aura:     `${B}/Warriorskill_08_nobg.png`,
  demoralizing_shout:`${B}/Warriorskill_09_nobg.png`,
  life_drain_strike: `${B}/Warriorskill_10_nobg.png`,
  concussive_blow:   `${B}/Warriorskill_11_nobg.png`,
  sunder_armor:      `${B}/Warriorskill_12_nobg.png`,
  execute:           `${B}/Warriorskill_13_nobg.png`,
  avatar_form:       `${B}/Warriorskill_14_nobg.png`,

  // ── Mage / Priest abilities ────────────────────────────────────────────────
  arcane_bolt:       `${B}/Mageskill_01_nobg.png`,
  fireball:          `${B}/Mageskill_02_nobg.png`,
  heal:              `${B}/Priestskill_01_nobg.png`,
  ice_storm:         `${B}/Mageskill_03_nobg.png`,
  mana_shield:       `${B}/Mageskill_04_nobg.png`,
  flame_brand:       `${B}/Mageskill_05_nobg.png`,
  blessing:          `${B}/Priestskill_02_nobg.png`,
  meteor_strike:     `${B}/Mageskill_06_nobg.png`,
  chain_lightning:   `${B}/Mageskill_07_nobg.png`,
  slumber:           `${B}/Mageskill_08_nobg.png`,
  mind_break:        `${B}/Mageskill_09_nobg.png`,
  holy_nova:         `${B}/Priestskill_03_nobg.png`,
  bewilderment:      `${B}/Mageskill_10_nobg.png`,
  purify:            `${B}/Priestskill_04_nobg.png`,
  arcane_cataclysm:  `${B}/Mageskill_11_nobg.png`,

  // ── Worge abilities ────────────────────────────────────────────────────────
  mace_strike:       `${B}/Druideskill_01_nobg.png`,
  lightning_lash:    `${B}/Druideskill_02_nobg.png`,
  natures_grasp:     `${B}/Druideskill_03_nobg.png`,
  dagger_toss:       `${B}/Druideskill_04_nobg.png`,
  bear_form:         `${B}/Druideskill_05_nobg.png`,
  maul:              `${B}/Druideskill_06_nobg.png`,
  natures_taunt:     `${B}/Druideskill_07_nobg.png`,
  worge_charge:      `${B}/Druideskill_08_nobg.png`,
  lacerate:          `${B}/Druideskill_09_nobg.png`,
  soothing_rain:     `${B}/Druideskill_10_nobg.png`,
  thunderclap:       `${B}/Druideskill_11_nobg.png`,
  venom_strike:      `${B}/Druideskill_12_nobg.png`,
  entangle:          `${B}/Druideskill_13_nobg.png`,
  tempest:           `${B}/Druideskill_14_nobg.png`,
  primal_roar:       `${B}/Druideskill_15_nobg.png`,
  natures_wrath:     `${B}/Druideskill_16_nobg.png`,

  // ── Ranger abilities ───────────────────────────────────────────────────────
  quick_shot:        `${B}/Archerskill_01_nobg.png`,
  aimed_shot:        `${B}/Archerskill_02_nobg.png`,
  poison_arrow:      `${B}/Archerskill_03_nobg.png`,
  evasive_maneuver:  `${B}/Archerskill_04_nobg.png`,
  volley:            `${B}/Archerskill_05_nobg.png`,
  focus:             `${B}/Archerskill_06_nobg.png`,
  venom_arrow:       `${B}/Archerskill_07_nobg.png`,
  hunters_mark:      `${B}/Archerskill_08_nobg.png`,
  piercing_shot:     `${B}/Archerskill_09_nobg.png`,
  multishot:         `${B}/Archerskill_10_nobg.png`,
  bear_trap:         `${B}/Archerskill_11_nobg.png`,
  barbed_arrow:      `${B}/Archerskill_12_nobg.png`,
  sniper_shot:       `${B}/Archerskill_13_nobg.png`,
  wind_walk:         `${B}/Archerskill_14_nobg.png`,
  sleep_dart:        `${B}/Archerskill_15_nobg.png`,
  arrow_storm:       `${B}/Archerskill_16_nobg.png`,
};

export function getAbilityIcon(abilityId) {
  return abilityIconMap[abilityId] || null;
}
