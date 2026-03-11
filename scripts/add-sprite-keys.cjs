#!/usr/bin/env node
/**
 * Adds spriteKey field to each enemy template in enemies.js.
 * The spriteKey maps to the enemySpriteMap key in spriteMap.js.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/data/enemies.js');
let content = fs.readFileSync(filePath, 'utf8');

// Mapping: template key → spriteMap enemySpriteMap key
const spriteKeyMap = {
  goblin: 'goblin',
  skeleton: 'skeleton',
  wolf: 'wolf',
  dark_mage: 'dark_mage',
  dark_knight: 'dark_knight',
  shadow_warrior: 'shadow_warrior',
  water_priestess_mage: 'water_priestess_mage',
  orc: 'orc',
  dragon_whelp: 'dragon_whelp',
  lich: 'abyssal_demon',
  red_dragon: 'abyssal_demon',
  red_dragon_2: 'abyssal_demon',
  white_dragon_mother: 'frost_titan',
  fire_worm: 'demon_lord',
  demon_lord: 'demon_lord',
  evil_wizard: 'evil_wizard',
  void_king: 'void_king',
  god_odin: 'frost_titan',
  god_madra: 'abyssal_demon',
  god_omni: 'evil_wizard',
  water_elemental: 'water_elemental',
  nature_elemental: 'nature_elemental',
  grand_shaman: 'forest_guardian',
  canyon_warlord: 'orc',
  frost_wyrm: 'frost_titan',
  shadow_beast: 'eldritch_horror',
  forest_guardian: 'forest_guardian',
  corrupted_grove_keeper: 'corrupted_grove_keeper',
  void_sentinel: 'evil_wizard',
  abyssal_demon: 'abyssal_demon',
  eldritch_horror: 'eldritch_horror',
  frost_titan: 'frost_titan',
  flying_eye: 'flying_eye',
  mushroom: 'mushroom',
  skeleton_knight: 'skeleton_knight',
  shadow_bat: 'shadow_bat',
  imp: 'imp',
  mimic: 'mimic',
  crow_knight: 'crow_knight',
  stone_guardian: 'stone_guardian',
  desert_snake: 'desert_snake',
  desert_hyena: 'desert_hyena',
  desert_scorpio: 'desert_scorpio',
  desert_vulture: 'desert_vulture',
  desert_mummy: 'desert_mummy',
  desert_deceased: 'desert_deceased',
  giant_fly: 'giant_fly',
  ice_elemental: 'ice_elemental',
  twig_blight: 'twig_blight',
  mimic_chest: 'mimic_chest',
  fire_elemental: 'fire_elemental',
};

let count = 0;
for (const [templateKey, spriteKey] of Object.entries(spriteKeyMap)) {
  // Match pattern: "  templateKey: {\n    name: 'Something',"
  // Insert spriteKey after the name line
  const regex = new RegExp(
    `(  ${templateKey}: \\{\\r?\\n    name: '[^']+',)( icon:)`,
    'g'
  );
  const replacement = `$1 spriteKey: '${spriteKey}',$2`;
  const newContent = content.replace(regex, replacement);
  if (newContent !== content) {
    content = newContent;
    count++;
  }
}

fs.writeFileSync(filePath, content);
console.log(`✓ Added spriteKey to ${count} enemy templates`);
