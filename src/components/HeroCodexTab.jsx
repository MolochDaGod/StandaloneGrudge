import React, { useState, useMemo, useCallback, useEffect } from 'react';

const SKILL_SPRITE_MAP = {
  shield: '/heroes/effects/Icon_07.png',
  zap: '/heroes/effects/Icon_02.png',
  heart: '/heroes/effects/Icon_05.png',
  flame: '/heroes/effects/Icon_01.png',
  crosshair: '/heroes/effects/Icon_09.png',
  target: '/heroes/effects/Icon_04.png',
  split: '/heroes/effects/Icon_03.png',
  'cloud-rain': '/heroes/effects/Icon_03.png',
  crown: '/heroes/effects/Icon_06.png',
  'shield-check': '/heroes/effects/Icon_08.png',
  star: '/heroes/effects/Icon_06.png',
  skull: '/heroes/effects/Icon_09.png',
  sparkles: '/heroes/effects/Icon_10.png',
  megaphone: '/heroes/effects/Icon_06.png',
  swords: '/heroes/effects/Icon_04.png',
  paw: '/heroes/effects/Icon_01.png',
  bow: '/heroes/effects/Icon_03.png',
};

function skillSrc(icon) {
  return SKILL_SPRITE_MAP[icon] || '/heroes/effects/Icon_06.png';
}

const FACTION_COLORS = {
  Crusade: { bg: '#0c1a3a', border: '#3b82f6', glow: 'rgba(59,130,246,0.3)', gradient: 'linear-gradient(135deg, #0c1a3a 0%, #1a2d5a 50%, #0c1a3a 100%)' },
  Fabled: { bg: '#0c1e14', border: '#16a34a', glow: 'rgba(22,163,74,0.3)', gradient: 'linear-gradient(135deg, #0c1e14 0%, #14332a 50%, #0c1e14 100%)' },
  Legion: { bg: '#2a0c0c', border: '#ef4444', glow: 'rgba(239,68,68,0.3)', gradient: 'linear-gradient(135deg, #2a0c0c 0%, #3a1a1a 50%, #2a0c0c 100%)' },
};

const RARITY_CONFIG = {
  Common: { color: '#9ca3af', stars: 1 },
  Uncommon: { color: '#22c55e', stars: 2 },
  Rare: { color: '#3b82f6', stars: 3 },
  Epic: { color: '#a855f7', stars: 4 },
  Legendary: { color: '#f59e0b', stars: 5 },
};

const BASE = { health: 200, attack: 18, defense: 12, speed: 60, range: 1.5, mana: 100 };
const CLASS_MOD = {
  Warrior: { health: 40, attack: 4, defense: 6, speed: -5, range: 0, mana: -10 },
  Worg: { health: 30, attack: 3, defense: 3, speed: 5, range: 0, mana: -5 },
  Mage: { health: -30, attack: 2, defense: -4, speed: 0, range: 4, mana: 50 },
  Ranger: { health: -20, attack: 3, defense: -2, speed: 10, range: 5, mana: 10 },
};
const RACE_MOD = {
  Human: { health: 5, attack: 1, defense: 1, speed: 2, mana: 5 },
  Barbarian: { health: 15, attack: 4, defense: -1, speed: 3, mana: -5 },
  Dwarf: { health: 20, attack: 2, defense: 5, speed: -8, mana: 0 },
  Elf: { health: -10, attack: 0, defense: -2, speed: 5, mana: 20 },
  Orc: { health: 10, attack: 5, defense: 1, speed: 2, mana: -10 },
  Undead: { health: 25, attack: 1, defense: 2, speed: -3, mana: 5 },
};

function ds(race, cls) {
  const cm = CLASS_MOD[cls] || CLASS_MOD.Warrior;
  const rm = RACE_MOD[race] || RACE_MOD.Human;
  return {
    health: BASE.health + cm.health + rm.health,
    attack: BASE.attack + cm.attack + rm.attack,
    defense: BASE.defense + cm.defense + rm.defense,
    speed: BASE.speed + cm.speed + rm.speed,
    range: BASE.range + cm.range,
    mana: BASE.mana + cm.mana + rm.mana,
  };
}

const HEROES = [
  { id:'human_warrior', name:'Sir Aldric Valorheart', title:'The Iron Bastion', race:'Human', className:'Warrior', faction:'Crusade', factionColor:'#3b82f6', rarity:'Common', lore:'Born in the fortified city of Valorheim, Aldric rose through the ranks of the Crusade militia to become its most decorated champion. His unbreakable will and mastery of sword and shield have turned the tide of countless battles against the Legion.', backstory:'Orphaned during the First Grudge War, young Aldric was raised by the Temple Knights. He forged his first blade at age twelve and took his oath at sixteen. Now he leads the vanguard of every Crusade offensive, his golden armor a beacon of hope.', quote:'"The shield breaks before the will does."', primaryAttribute:'STR', stats: ds('Human','Warrior'), abilities:[{name:'Invincibility',icon:'shield',description:'Become immune to all damage for a short duration',manaCost:40},{name:'Damage Surge',icon:'zap',description:'+25% attack power temporary boost',manaCost:25},{name:"Guardian's Aura",icon:'shield-check',description:'+15% defense to all nearby allies',manaCost:30},{name:'Avatar Form',icon:'crown',description:'+40% all stats, increased size',manaCost:80}], racialTraits:[{name:'Adaptable',effect:'+5% XP gain'},{name:'Diplomatic',effect:'+10% gold from quests'}], strengths:['Highest armor and block chance','Invincibility ultimate','Flexible tank or DPS builds'], weaknesses:['No ranged attacks','No magic or healing','Slow movement speed'], combatStyle:'Melee Physical Combat', weapons:'Swords, Axes, Shields, Heavy Armor', alignment:'Lawful Good', difficulty:'Beginner', flavorText:'Where Aldric stands, the line holds.' },
  { id:'human_worg', name:'Gareth Moonshadow', title:'The Twilight Stalker', race:'Human', className:'Worg', faction:'Crusade', factionColor:'#3b82f6', rarity:'Rare', lore:'Gareth was a simple huntsman until a dire wolf spirit bonded with his soul during a blood moon ritual. Now he walks between the worlds of man and beast, his primal fury tempered by human discipline.', backstory:'Once captain of the Crusade rangers, Gareth ventured too deep into the Darkwood seeking a cure for a plague. There, the ancient Wolf Spirit Fenrath chose him as vessel. He returned changed, his eyes gleaming amber in the dark.', quote:'"The beast within is not my curse. It is my salvation."', primaryAttribute:'STR', stats: ds('Human','Worg'), abilities:[{name:'Bear Form',icon:'shield',description:'+50% defense, +30% max HP, reduced speed',manaCost:30},{name:'Feral Rage',icon:'flame',description:'+30% attack speed and damage',manaCost:25},{name:'Raptor Form',icon:'zap',description:'+20% attack, +40% speed, +15% crit',manaCost:30},{name:'Worg Lord',icon:'crown',description:'+40% all stats, +50% max HP, summon pack',manaCost:80}], racialTraits:[{name:'Adaptable',effect:'+5% XP gain'},{name:'Diplomatic',effect:'+10% gold from quests'}], strengths:['Multiple combat forms','Pack summons for numbers advantage','Strong self-buffs and frenzy'], weaknesses:['No ranged attacks','No healing spells','Form-dependent abilities'], combatStyle:'Melee Shapeshifting Combat', weapons:'Claws, Fangs, Natural Weapons', alignment:'Chaotic Neutral', difficulty:'Advanced', flavorText:'In the space between howl and silence, death waits.' },
  { id:'human_mage', name:'Archmage Elara Brightspire', title:'The Storm Caller', race:'Human', className:'Mage', faction:'Crusade', factionColor:'#3b82f6', rarity:'Epic', lore:'Elara was the youngest scholar ever admitted to the Arcane Consortium. Her mastery of elemental magic and divine healing makes her invaluable on the battlefield, though her fragile form demands protection.', backstory:'Raised in the Brightspire Academy, Elara discovered she could channel both arcane destruction and divine healing, a gift unseen in centuries. The Consortium fears her power; the Crusade depends on it.', quote:'"Knowledge is the flame. I am merely the torch."', primaryAttribute:'INT', stats: ds('Human','Mage'), abilities:[{name:'Mana Shield',icon:'shield',description:'Passive shield based on remaining mana percentage',manaCost:0},{name:'Fireball',icon:'flame',description:'AoE fire damage to enemies in target area',manaCost:30},{name:'Heal',icon:'heart',description:'Restore HP to target ally',manaCost:20},{name:'Lightning Chain',icon:'zap',description:'Chain lightning hitting up to 5 targets',manaCost:35}], racialTraits:[{name:'Adaptable',effect:'+5% XP gain'},{name:'Diplomatic',effect:'+10% gold from quests'}], strengths:['Powerful AoE damage spells','Only class with healing','Blink teleport for mobility'], weaknesses:['Very fragile in melee','Mana dependent','Low physical defense'], combatStyle:'Ranged Magic & Healing', weapons:'Staves, Wands, Orbs, Robes', alignment:'Neutral Good', difficulty:'Intermediate', flavorText:'The sky splits at her command.' },
  { id:'human_ranger', name:'Kael Shadowblade', title:'The Shadow Blade', race:'Human', className:'Ranger', faction:'Crusade', factionColor:'#3b82f6', rarity:'Uncommon', lore:"A ghost who moves through shadows, Kael is the Crusade's deadliest operative. His arrows find their mark before the enemy even knows war has begun. He answers to no one but the cause.", backstory:"Kael grew up in the slums of Port Grimaldi, learning to survive through cunning and speed. Recruited by the Crusade's covert division, he became their finest scout and assassin, preferring to end wars before they start.", quote:'"You never see the arrow that kills you."', primaryAttribute:'DEX', stats: ds('Human','Ranger'), abilities:[{name:'Precision',icon:'crosshair',description:'Passive accuracy and critical hit bonus',manaCost:0},{name:'Power Shot',icon:'target',description:'High damage ranged attack at 2x damage',manaCost:20},{name:'Multi Shot',icon:'split',description:'Fire 5 arrows in a spread pattern',manaCost:25},{name:'Rain of Arrows',icon:'cloud-rain',description:'Massive AoE ranged barrage',manaCost:40}], racialTraits:[{name:'Adaptable',effect:'+5% XP gain'},{name:'Diplomatic',effect:'+10% gold from quests'}], strengths:['Longest attack range','High critical hit chance','Stealth and evasion'], weaknesses:['Low armor and HP','Weak in prolonged melee','No healing abilities'], combatStyle:'Ranged Physical & Stealth', weapons:'Bows, Crossbows, Daggers, Light Armor', alignment:'Chaotic Good', difficulty:'Intermediate', flavorText:'Shadows are just arrows waiting to be loosed.' },
  { id:'barbarian_warrior', name:'Ulfgar Bonecrusher', title:'The Mountain Breaker', race:'Barbarian', className:'Warrior', faction:'Crusade', factionColor:'#3b82f6', rarity:'Uncommon', lore:'From the frozen peaks of the Northlands, Ulfgar descends like an avalanche upon his foes. His massive frame and berserker fury make him a force of nature that no shield wall can withstand.', backstory:'Ulfgar earned his title by literally shattering a mountain pass to prevent a Legion invasion, burying an entire army beneath tons of stone. The act cost him his left eye but saved his entire tribe.', quote:'"I do not fight to survive. I fight because the mountain told me to."', primaryAttribute:'STR', stats: ds('Barbarian','Warrior'), abilities:[{name:'Invincibility',icon:'shield',description:'Become immune to all damage',manaCost:40},{name:'Damage Surge',icon:'zap',description:'+25% attack power boost',manaCost:25},{name:"Guardian's Aura",icon:'shield-check',description:'+15% defense to nearby allies',manaCost:30},{name:'Avatar Form',icon:'crown',description:'+40% all stats, increased size',manaCost:80}], racialTraits:[{name:'Rage',effect:'+20% damage below 50% HP'},{name:'Frost Resistance',effect:'+15% cold defense'}], strengths:['Highest armor and block chance','Rage damage bonus when wounded','Flexible tank or DPS builds'], weaknesses:['No ranged attacks','No magic or healing','Slow movement speed'], combatStyle:'Melee Physical Combat', weapons:'Great Axes, War Hammers, Fur Armor', alignment:'Chaotic Neutral', difficulty:'Beginner', flavorText:'The earth trembles when Ulfgar charges.' },
  { id:'barbarian_worg', name:'Hrothgar Fangborn', title:'The Beast of the North', race:'Barbarian', className:'Worg', faction:'Crusade', factionColor:'#3b82f6', rarity:'Legendary', lore:'In the deepest winter, when wolves howl for blood, Hrothgar answers. Half-man, half-beast, he leads a pack of dire wolves across the frozen wastes, hunting Legion scouts with savage precision.', backstory:'Born during an eclipse, Hrothgar was left in the woods as an omen of doom. Raised by a great wolf mother, he returned to his tribe as a teenager who could speak with beasts and shift his form at will.', quote:'"The pack does not forgive. The pack does not forget."', primaryAttribute:'STR', stats: ds('Barbarian','Worg'), abilities:[{name:'Bear Form',icon:'shield',description:'+50% defense, +30% max HP',manaCost:30},{name:'Feral Rage',icon:'flame',description:'+30% attack speed and damage',manaCost:25},{name:'Raptor Form',icon:'zap',description:'Stealth DPS with +15% crit',manaCost:30},{name:'Worg Lord',icon:'crown',description:'Ultimate tank form with pack summon',manaCost:80}], racialTraits:[{name:'Rage',effect:'+20% damage below 50% HP'},{name:'Frost Resistance',effect:'+15% cold defense'}], strengths:['Multiple combat forms','Rage synergy with beast forms','Strong self-buffs'], weaknesses:['No ranged attacks','No healing spells','Form-dependent abilities'], combatStyle:'Melee Shapeshifting Combat', weapons:'Claws, Fangs, Natural Weapons', alignment:'Chaotic Neutral', difficulty:'Expert', flavorText:'When the north wind howls, it speaks his name.' },
  { id:'barbarian_mage', name:'Volka Stormborn', title:'The Frost Witch', race:'Barbarian', className:'Mage', faction:'Crusade', factionColor:'#3b82f6', rarity:'Epic', lore:'The northern shamans channel magic through primal fury rather than scholarly study. Volka commands blizzards and lightning, her spells fueled by the raw rage of the frozen north.', backstory:'During a deadly blizzard that buried her village, young Volka discovered she could command the storm itself. The tribal elders named her Stormborn and sent her south to aid the Crusade with her elemental fury.', quote:'"Winter does not come. I bring it."', primaryAttribute:'INT', stats: ds('Barbarian','Mage'), abilities:[{name:'Mana Shield',icon:'shield',description:'Passive shield from mana',manaCost:0},{name:'Fireball',icon:'flame',description:'AoE elemental damage',manaCost:30},{name:'Heal',icon:'heart',description:'Restore HP to target ally',manaCost:20},{name:'Lightning Chain',icon:'zap',description:'Chain lightning hitting 5 targets',manaCost:35}], racialTraits:[{name:'Rage',effect:'+20% damage below 50% HP'},{name:'Frost Resistance',effect:'+15% cold defense'}], strengths:['Powerful AoE damage','Rage bonus applies to spells','Frost resistance'], weaknesses:['Very fragile in melee','Mana dependent','Low physical defense'], combatStyle:'Ranged Magic & Healing', weapons:'Totems, Bone Staves, Runic Armor', alignment:'Chaotic Neutral', difficulty:'Advanced', flavorText:'Her anger is the storm. Her mercy is the calm.' },
  { id:'barbarian_ranger', name:'Svala Windrider', title:'The Silent Huntress', race:'Barbarian', className:'Ranger', faction:'Crusade', factionColor:'#3b82f6', rarity:'Rare', lore:'No prey escapes Svala. She tracks across frozen tundra, through blinding snowstorms, reading the land like an open book. Her arrows are tipped with the venom of ice serpents.', backstory:"Svala was the youngest hunter to ever complete the Trial of the Winter Hunt, tracking and slaying a frost drake alone at age fourteen. Now she serves as the Crusade's premier wilderness scout.", quote:'"The wind tells me where you hide."', primaryAttribute:'DEX', stats: ds('Barbarian','Ranger'), abilities:[{name:'Precision',icon:'crosshair',description:'Passive accuracy and crit bonus',manaCost:0},{name:'Power Shot',icon:'target',description:'High damage ranged attack',manaCost:20},{name:'Multi Shot',icon:'split',description:'5 arrow spread pattern',manaCost:25},{name:'Rain of Arrows',icon:'cloud-rain',description:'Massive AoE ranged barrage',manaCost:40}], racialTraits:[{name:'Rage',effect:'+20% damage below 50% HP'},{name:'Frost Resistance',effect:'+15% cold defense'}], strengths:['Longest attack range','Rage bonus when wounded','Stealth and evasion'], weaknesses:['Low armor and HP','Weak in prolonged melee','No healing abilities'], combatStyle:'Ranged Physical & Stealth', weapons:'Longbows, Ice Javelins, Leather Armor', alignment:'True Neutral', difficulty:'Intermediate', flavorText:'She does not miss. She does not warn.' },
  { id:'dwarf_warrior', name:'Thane Ironshield', title:'The Mountain Guardian', race:'Dwarf', className:'Warrior', faction:'Fabled', factionColor:'#16a34a', rarity:'Rare', lore:'The Thane of Ironhold has defended the mountain passes for over a century. His enchanted shield, Aegis of Ancestors, was forged from the heart of the mountain itself and has never been pierced.', backstory:'Thane Ironshield is the 47th guardian of the Deep Gate, an unbroken lineage stretching back to the founding of Stonehold. When the Grudge Wars began, he sealed the lower mines and marched to war.', quote:'"Deeper than stone. Harder than iron. We endure."', primaryAttribute:'STR', stats: ds('Dwarf','Warrior'), abilities:[{name:'Invincibility',icon:'shield',description:'Complete damage immunity',manaCost:40},{name:'Damage Surge',icon:'zap',description:'+25% attack power boost',manaCost:25},{name:"Guardian's Aura",icon:'shield-check',description:'+15% defense to allies',manaCost:30},{name:'Avatar Form',icon:'crown',description:'+40% all stats',manaCost:80}], racialTraits:[{name:'Stoneborn',effect:'+20% Defense'},{name:'Master Craftsman',effect:'+1 crafting tier'}], strengths:['Highest defense in game','Stoneborn defense bonus stacks','Impenetrable tank'], weaknesses:['Very slow movement','No ranged attacks','No healing'], combatStyle:'Melee Physical Combat', weapons:'War Hammers, Tower Shields, Runic Plate', alignment:'Lawful Good', difficulty:'Beginner', flavorText:'The mountain does not move. Neither does he.' },
  { id:'dwarf_worg', name:'Bromm Earthshaker', title:'The Cavern Beast', race:'Dwarf', className:'Worg', faction:'Fabled', factionColor:'#16a34a', rarity:'Legendary', lore:'Deep beneath the mountains, Bromm discovered an ancient bear spirit imprisoned in crystal. By freeing it, the spirit merged with his dwarven soul, creating something unprecedented: a shapeshifter of living stone.', backstory:'Bromm was a miner who broke through into a sealed cavern containing a primordial earth spirit. The merging nearly killed him but left him able to transform into a creature of rock and fury.', quote:'"The mountain has teeth. I am its bite."', primaryAttribute:'STR', stats: ds('Dwarf','Worg'), abilities:[{name:'Bear Form',icon:'shield',description:'+50% defense, +30% max HP',manaCost:30},{name:'Feral Rage',icon:'flame',description:'+30% attack speed',manaCost:25},{name:'Raptor Form',icon:'zap',description:'Stealth DPS mode',manaCost:30},{name:'Worg Lord',icon:'crown',description:'Ultimate stone form',manaCost:80}], racialTraits:[{name:'Stoneborn',effect:'+20% Defense'},{name:'Master Craftsman',effect:'+1 crafting tier'}], strengths:['Bear Form + Stoneborn = unstoppable tank','Multiple combat forms','High base defense'], weaknesses:['Extremely slow in all forms','No ranged attacks','No healing spells'], combatStyle:'Melee Shapeshifting Combat', weapons:'Stone Claws, Earth Fangs, Crystal Armor', alignment:'Neutral Good', difficulty:'Expert', flavorText:'The deep places remember. Bromm makes them forget.' },
  { id:'dwarf_mage', name:'Runa Forgekeeper', title:'The Runesmith', race:'Dwarf', className:'Mage', faction:'Fabled', factionColor:'#16a34a', rarity:'Rare', lore:'Dwarven magic is not the flashy arcana of elves or humans. It is the deep magic of rune and forge, of fire shaped by will and hammer. Runa channels this ancient craft in battle.', backstory:'Last of the Forgekeeper bloodline, Runa carries the knowledge of runic magic that predates the Grudge Wars. Her forge-spells burn hotter than dragonfire and her rune-shields are nigh unbreakable.', quote:'"Every rune tells a story. Mine tells of fire."', primaryAttribute:'INT', stats: ds('Dwarf','Mage'), abilities:[{name:'Mana Shield',icon:'shield',description:'Passive runic barrier',manaCost:0},{name:'Fireball',icon:'flame',description:'Forge-fire AoE blast',manaCost:30},{name:'Heal',icon:'heart',description:'Runic restoration',manaCost:20},{name:'Lightning Chain',icon:'zap',description:'Arc lightning through runes',manaCost:35}], racialTraits:[{name:'Stoneborn',effect:'+20% Defense'},{name:'Master Craftsman',effect:'+1 crafting tier'}], strengths:['Stoneborn makes her tankier than other mages','Powerful forge spells','Runic healing'], weaknesses:['Slow movement','Mana dependent','Short range compared to elves'], combatStyle:'Ranged Magic & Healing', weapons:'Runic Hammers, Forge Staves, Rune Armor', alignment:'Lawful Neutral', difficulty:'Intermediate', flavorText:'The forge burns eternal. So does she.' },
  { id:'dwarf_ranger', name:'Durin Tunnelwatcher', title:'The Deep Scout', race:'Dwarf', className:'Ranger', faction:'Fabled', factionColor:'#16a34a', rarity:'Uncommon', lore:'Not all dwarves fight on the front line. Durin patrols the endless tunnels beneath the mountains, his crossbow picking off threats in the dark long before they reach the surface.', backstory:'Durin lost his squad to a cave-in during a tunnel patrol. Alone in the dark for thirty days, he learned to navigate by echo and smell. He emerged transformed, able to fight in total darkness.', quote:'"In the deep, every sound is a target."', primaryAttribute:'DEX', stats: ds('Dwarf','Ranger'), abilities:[{name:'Precision',icon:'crosshair',description:'Enhanced accuracy in darkness',manaCost:0},{name:'Power Shot',icon:'target',description:'Armor-piercing crossbow bolt',manaCost:20},{name:'Multi Shot',icon:'split',description:'5 bolt spread pattern',manaCost:25},{name:'Rain of Arrows',icon:'cloud-rain',description:'Bolt barrage from the heights',manaCost:40}], racialTraits:[{name:'Stoneborn',effect:'+20% Defense'},{name:'Master Craftsman',effect:'+1 crafting tier'}], strengths:['Stoneborn gives extra survivability','Armor-piercing bolts','Dark vision'], weaknesses:['Slow movement','Less range than elf rangers','No healing abilities'], combatStyle:'Ranged Physical & Stealth', weapons:'Heavy Crossbows, Throwing Axes, Chain Mail', alignment:'Lawful Neutral', difficulty:'Intermediate', flavorText:'He sees in the dark. You do not see him.' },
  { id:'elf_warrior', name:'Thalion Bladedancer', title:'The Graceful Death', race:'Elf', className:'Warrior', faction:'Fabled', factionColor:'#16a34a', rarity:'Common', lore:"Elven warriors do not rely on brute force. Thalion's blade moves like water, each stroke a masterwork of precision. He has dueled and defeated opponents twice his size through technique alone.", backstory:'Trained in the Moonblade Academy for three centuries, Thalion mastered every weapon form before settling on the twin curved blades that earned him his title. His dance-like fighting style is mesmerizing and lethal.', quote:'"A blade is a brush. Combat is art."', primaryAttribute:'STR', stats: ds('Elf','Warrior'), abilities:[{name:'Invincibility',icon:'shield',description:'Perfect dodge state',manaCost:40},{name:'Damage Surge',icon:'zap',description:'Blade dance combo +25% ATK',manaCost:25},{name:"Guardian's Aura",icon:'shield-check',description:'Moonshadow protection aura',manaCost:30},{name:'Avatar Form',icon:'crown',description:'Ascended blade master form',manaCost:80}], racialTraits:[{name:'Keen Senses',effect:'+15% Accuracy'},{name:'Arcane Affinity',effect:'+10% Mana'}], strengths:['Highest accuracy of all warriors','Fast attack speed','Arcane mana bonus'], weaknesses:['Lower HP than other warriors','No ranged attacks','Fragile for a tank'], combatStyle:'Melee Physical Combat', weapons:'Curved Blades, Mithril Armor, Elven Shields', alignment:'Neutral Good', difficulty:'Intermediate', flavorText:'His enemies never see the second strike.' },
  { id:'elf_worg', name:'Sylara Wildheart', title:'The Forest Spirit', race:'Elf', className:'Worg', faction:'Fabled', factionColor:'#16a34a', rarity:'Epic', lore:"Sylara is the last of the Wildheart druids who once protected the great forests. She channels the spirits of ancient beasts through elven magic, her transformations enhanced by centuries of arcane study.", backstory:"When the Darkwood began to wither from Legion corruption, Sylara performed the ancient Rite of Binding, merging her soul with the forest's guardian spirit. Now she IS the forest's wrath.", quote:'"The forest breathes through me. And it is angry."', primaryAttribute:'STR', stats: ds('Elf','Worg'), abilities:[{name:'Bear Form',icon:'shield',description:'Ancient treant defense form',manaCost:30},{name:'Feral Rage',icon:'flame',description:"Nature's fury +30% ATK",manaCost:25},{name:'Raptor Form',icon:'zap',description:'Swift predator stealth',manaCost:30},{name:'Worg Lord',icon:'crown',description:'Ancient forest guardian form',manaCost:80}], racialTraits:[{name:'Keen Senses',effect:'+15% Accuracy'},{name:'Arcane Affinity',effect:'+10% Mana'}], strengths:['Extra mana for more transformations','Keen senses boost form accuracy','Ancient spirit power'], weaknesses:['Fragile base form','No ranged attacks','Form-dependent abilities'], combatStyle:'Melee Shapeshifting Combat', weapons:'Nature Claws, Spirit Fangs, Living Armor', alignment:'Neutral Good', difficulty:'Expert', flavorText:'She wears the shapes of forgotten gods.' },
  { id:'elf_mage', name:'Lyra Stormweaver', title:'The Storm Weaver', race:'Elf', className:'Mage', faction:'Fabled', factionColor:'#16a34a', rarity:'Epic', lore:'Elven mages are the most powerful spellcasters in all the realms. Lyra channels the raw essence of the ley lines, her magic amplified by centuries of study and an innate arcane connection.', backstory:'Lyra spent four hundred years studying in the Crystal Spire before the Grudge Wars forced her into battle. Her mastery of all eight schools of magic makes her the most versatile caster alive.', quote:'"Magic is not power. It is understanding. I understand everything."', primaryAttribute:'INT', stats: ds('Elf','Mage'), abilities:[{name:'Mana Shield',icon:'shield',description:'Arcane barrier from mana pool',manaCost:0},{name:'Fireball',icon:'flame',description:'Pure arcane fire explosion',manaCost:30},{name:'Heal',icon:'heart',description:'Ley line healing',manaCost:20},{name:'Lightning Chain',icon:'zap',description:'Storm magic chaining 5 targets',manaCost:35}], racialTraits:[{name:'Keen Senses',effect:'+15% Accuracy'},{name:'Arcane Affinity',effect:'+10% Mana'}], strengths:['Highest spell power in game','Extra mana from Arcane Affinity','Spell accuracy from Keen Senses'], weaknesses:['Extremely fragile','Mana dependent','Virtually no melee capability'], combatStyle:'Ranged Magic & Healing', weapons:'Crystal Staves, Moonstone Orbs, Silk Robes', alignment:'True Neutral', difficulty:'Advanced', flavorText:'The stars whisper their secrets to her alone.' },
  { id:'elf_ranger', name:'Aelindra Swiftbow', title:'The Wind Walker', race:'Elf', className:'Ranger', faction:'Fabled', factionColor:'#16a34a', rarity:'Uncommon', lore:'The greatest archer to ever live, Aelindra can split an arrow at three hundred paces while riding at full gallop. Her elven eyes miss nothing, and her enchanted bow never runs dry.', backstory:"Captain of the Silverglade Sentinels for two centuries, Aelindra has defended the borders of the Fabled lands against every threat. She trained under Lyra Stormweaver and infuses her arrows with arcane energy.", quote:'"I loosed the arrow yesterday. It arrives tomorrow. You die today."', primaryAttribute:'DEX', stats: ds('Elf','Ranger'), abilities:[{name:'Precision',icon:'crosshair',description:'Elven sight perfect accuracy',manaCost:0},{name:'Power Shot',icon:'target',description:'Arcane-infused arrow',manaCost:20},{name:'Multi Shot',icon:'split',description:'5 enchanted arrows',manaCost:25},{name:'Rain of Arrows',icon:'cloud-rain',description:'Arcane arrow storm',manaCost:40}], racialTraits:[{name:'Keen Senses',effect:'+15% Accuracy'},{name:'Arcane Affinity',effect:'+10% Mana'}], strengths:['Unmatched accuracy','Arcane-enhanced arrows','Fastest ranger'], weaknesses:['Very fragile','Poor melee defense','No healing abilities'], combatStyle:'Ranged Physical & Stealth', weapons:'Enchanted Longbows, Mithril Arrows, Leaf Armor', alignment:'Chaotic Good', difficulty:'Advanced', flavorText:'Her arrows sing the songs of extinction.' },
  { id:'orc_warrior', name:'Grommash Ironjaw', title:'The Warchief', race:'Orc', className:'Warrior', faction:'Legion', factionColor:'#ef4444', rarity:'Common', lore:'The mightiest warrior the Legion has ever produced, Grommash earned his chieftainship by defeating every challenger in the Pit of Blood. His massive cleaver has carved a path of destruction across three continents.', backstory:'Born during a blood eclipse, Grommash was destined for war. At age six he killed his first opponent in the fighting pits. By twenty he had united the warring orc clans under a single banner through sheer force.', quote:'"BLOOD AND THUNDER!"', primaryAttribute:'STR', stats: ds('Orc','Warrior'), abilities:[{name:'Invincibility',icon:'shield',description:'Blood rage immunity',manaCost:40},{name:'Damage Surge',icon:'zap',description:'Berserker fury +25% ATK',manaCost:25},{name:"Guardian's Aura",icon:'shield-check',description:'Warcry defense boost',manaCost:30},{name:'Avatar Form',icon:'crown',description:'Warchief ascension form',manaCost:80}], racialTraits:[{name:'Bloodrage',effect:'+25% damage below 50% HP'},{name:'Warborn',effect:'+10% Critical'}], strengths:['Highest raw damage','Bloodrage + crit combo devastating','Best warrior for pure DPS'], weaknesses:['No ranged attacks','No healing','Reckless combat style'], combatStyle:'Melee Physical Combat', weapons:'Massive Cleavers, Spiked Armor, War Totems', alignment:'Chaotic Evil', difficulty:'Beginner', flavorText:'He does not ask for surrender.' },
  { id:'orc_worg', name:'Fenris Bloodfang', title:'The Alpha', race:'Orc', className:'Worg', faction:'Legion', factionColor:'#ef4444', rarity:'Epic', lore:"Fenris challenged the great dire wolf Shadowmaw to single combat and won, absorbing the beast's spirit. Now he commands the Legion's beast packs, his howl freezing enemies in terror.", backstory:"Exiled from his clan for refusing to kill prisoners, Fenris wandered the Ashlands alone until Shadowmaw found him. Their battle lasted three days. When it ended, they were one being.", quote:'"I am the alpha. There is no omega."', primaryAttribute:'STR', stats: ds('Orc','Worg'), abilities:[{name:'Bear Form',icon:'shield',description:'War bear destruction form',manaCost:30},{name:'Feral Rage',icon:'flame',description:'Blood frenzy +30% ATK',manaCost:25},{name:'Raptor Form',icon:'zap',description:'Shadow hunter stealth',manaCost:30},{name:'Worg Lord',icon:'crown',description:'Alpha predator ascension',manaCost:80}], racialTraits:[{name:'Bloodrage',effect:'+25% damage below 50% HP'},{name:'Warborn',effect:'+10% Critical'}], strengths:['Bloodrage synergizes with feral forms','Crit bonus in all forms','Most aggressive worg'], weaknesses:['No ranged attacks','No healing','Berserker tendencies'], combatStyle:'Melee Shapeshifting Combat', weapons:'Blood Claws, Shadow Fangs, Bone Armor', alignment:'Chaotic Neutral', difficulty:'Expert', flavorText:'His shadow has teeth.' },
  { id:'orc_mage', name:"Zul'jin the Hexmaster", title:'The Blood Shaman', race:'Orc', className:'Mage', faction:'Legion', factionColor:'#ef4444', rarity:'Rare', lore:"Orc magic is blood magic, raw and dangerous. Zul'jin channels the life force of fallen enemies into devastating hexes and dark healing, growing stronger with every kill.", backstory:"Born with the gift of blood-sight, Zul'jin was taken by the Legion's war shamans at birth. He learned to weaponize pain itself, turning enemy suffering into fuel for his dark arts.", quote:'"Your blood screams louder than you do."', primaryAttribute:'INT', stats: ds('Orc','Mage'), abilities:[{name:'Mana Shield',icon:'shield',description:'Blood ward barrier',manaCost:0},{name:'Fireball',icon:'flame',description:'Blood fire explosion',manaCost:30},{name:'Heal',icon:'heart',description:'Blood sacrifice healing',manaCost:20},{name:'Lightning Chain',icon:'zap',description:'Chain hex through blood',manaCost:35}], racialTraits:[{name:'Bloodrage',effect:'+25% damage below 50% HP'},{name:'Warborn',effect:'+10% Critical'}], strengths:['Bloodrage boosts spell damage when wounded','Critical hit spells','Dark healing'], weaknesses:['Fragile in melee','Blood magic is unstable','Mana dependent'], combatStyle:'Ranged Magic & Healing', weapons:'Skull Staves, Blood Orbs, Hex Totems', alignment:'Neutral Evil', difficulty:'Advanced', flavorText:'He paints with the colors of agony.' },
  { id:'orc_ranger', name:'Razak Deadeye', title:'The Trophy Hunter', race:'Orc', className:'Ranger', faction:'Legion', factionColor:'#ef4444', rarity:'Uncommon', lore:'Razak hunts for glory, not survival. His trophy rack holds the heads of legendary beasts, and his poison-tipped bolts bring down prey that should be impossible to kill.', backstory:'A disgraced warrior who lost his sword arm in battle, Razak reinvented himself as a marksman. His custom war-crossbow fires bolts that can penetrate dragon scale at fifty paces.', quote:'"Every head on my wall was once the strongest in its land."', primaryAttribute:'DEX', stats: ds('Orc','Ranger'), abilities:[{name:'Precision',icon:'crosshair',description:'Predator instinct accuracy',manaCost:0},{name:'Power Shot',icon:'target',description:'Armor-crushing bolt',manaCost:20},{name:'Multi Shot',icon:'split',description:'Spread of poison bolts',manaCost:25},{name:'Rain of Arrows',icon:'cloud-rain',description:'Bolt storm barrage',manaCost:40}], racialTraits:[{name:'Bloodrage',effect:'+25% damage below 50% HP'},{name:'Warborn',effect:'+10% Critical'}], strengths:['Crit bonus stacks with Precision','Bloodrage makes him lethal when wounded','Armor-piercing'], weaknesses:['Low armor','Reckless positioning','No healing abilities'], combatStyle:'Ranged Physical & Stealth', weapons:'War Crossbows, Poison Bolts, Spiked Leather', alignment:'Chaotic Evil', difficulty:'Intermediate', flavorText:'His trophies whisper of things that should not die.' },
  { id:'undead_warrior', name:'Lord Malachar', title:'The Deathless Knight', race:'Undead', className:'Warrior', faction:'Legion', factionColor:'#ef4444', rarity:'Rare', lore:'Once a noble paladin, Malachar was slain and raised by dark necromancy. Now he fights with the skill of his former life but the relentless endurance of undeath, unable to feel pain or fear.', backstory:'Sir Malachar the Pure was the greatest knight of his age until he fell defending a temple. The necromancer who raised him twisted his devotion into dark loyalty. He remembers fragments of who he was and hates what he has become.', quote:'"I cannot die. I have tried."', primaryAttribute:'STR', stats: ds('Undead','Warrior'), abilities:[{name:'Invincibility',icon:'shield',description:'Deathless ward immunity',manaCost:40},{name:'Damage Surge',icon:'zap',description:'Unholy strength +25% ATK',manaCost:25},{name:"Guardian's Aura",icon:'shield-check',description:'Dread aura defense',manaCost:30},{name:'Avatar Form',icon:'crown',description:'Death Knight ascension',manaCost:80}], racialTraits:[{name:'Undying',effect:'+20% HP'},{name:'Fear Aura',effect:'-10% enemy accuracy'}], strengths:['Highest effective HP from Undying bonus','Fear Aura weakens enemies','Cannot be feared'], weaknesses:['Slow','Vulnerable to holy magic','No healing synergies'], combatStyle:'Melee Physical Combat', weapons:'Cursed Blades, Bone Shields, Death Plate', alignment:'Lawful Evil', difficulty:'Intermediate', flavorText:'Death was just the beginning of his war.' },
  { id:'undead_worg', name:'The Ghoulfather', title:'The Abomination', race:'Undead', className:'Worg', faction:'Legion', factionColor:'#ef4444', rarity:'Legendary', lore:"A failed necromantic experiment that merged a warrior's corpse with several beast spirits. The result is an abomination that shifts between grotesque forms, each more terrifying than the last.", backstory:'The Ghoulfather was created when a desperate necromancer tried to bind multiple animal spirits to a single corpse. The spirits fought for dominance, creating an entity that shifts between forms uncontrollably, driven by rage.', quote:'"We... are... HUNGRY."', primaryAttribute:'STR', stats: ds('Undead','Worg'), abilities:[{name:'Bear Form',icon:'shield',description:'Corpse bear horror form',manaCost:30},{name:'Feral Rage',icon:'flame',description:'Undying frenzy +30% ATK',manaCost:25},{name:'Raptor Form',icon:'zap',description:'Ghoul stalker stealth',manaCost:30},{name:'Worg Lord',icon:'crown',description:'Full abomination form',manaCost:80}], racialTraits:[{name:'Undying',effect:'+20% HP'},{name:'Fear Aura',effect:'-10% enemy accuracy'}], strengths:['Undying + Bear Form = massive HP pool','Fear Aura in all forms','Terrifying presence'], weaknesses:['Uncontrollable','Vulnerable to holy','No healing'], combatStyle:'Melee Shapeshifting Combat', weapons:'Bone Claws, Corpse Fangs, Stitched Armor', alignment:'Chaotic Evil', difficulty:'Expert', flavorText:'It remembers being three different things. None of them were kind.' },
  { id:'undead_mage', name:'Necromancer Vexis', title:'The Soul Harvester', race:'Undead', className:'Mage', faction:'Legion', factionColor:'#ef4444', rarity:'Epic', lore:'Vexis died as a scholar of the arcane arts and was raised specifically for her magical knowledge. In undeath, her power has grown beyond mortal limits, fueled by harvested souls.', backstory:'In life, Vexis was a renowned healer. The irony is not lost on her, she now commands the very forces of death she once fought against. Her soul spells tear the life essence from enemies.', quote:'"Death is not the end. It is the door to real power."', primaryAttribute:'INT', stats: ds('Undead','Mage'), abilities:[{name:'Mana Shield',icon:'shield',description:'Soul ward barrier',manaCost:0},{name:'Fireball',icon:'flame',description:'Soulfire explosion',manaCost:30},{name:'Heal',icon:'heart',description:'Life drain healing',manaCost:20},{name:'Lightning Chain',icon:'zap',description:'Soul chain through enemies',manaCost:35}], racialTraits:[{name:'Undying',effect:'+20% HP'},{name:'Fear Aura',effect:'-10% enemy accuracy'}], strengths:['Undying makes her surprisingly durable for a mage','Fear Aura helps survival','Soul magic amplification'], weaknesses:['Still fragile to burst damage','Holy magic weakness','Mana dependent'], combatStyle:'Ranged Magic & Healing', weapons:'Bone Staves, Soul Gems, Shadow Robes', alignment:'Neutral Evil', difficulty:'Advanced', flavorText:'She weaves spells from the screams of the fallen.' },
  { id:'undead_ranger', name:'Shade Whisper', title:'The Phantom Archer', race:'Undead', className:'Ranger', faction:'Legion', factionColor:'#ef4444', rarity:'Uncommon', lore:'Once the finest scout in the Crusade, Shade Whisper was killed and raised to serve the very forces she once hunted. Her spectral arrows pass through armor as if it were mist.', backstory:'In life she was named Elena Brightarrow, and she was beloved by her comrades. Now she hunts them with the same skill, her phantom arrows guided by the memories of a life she can no longer feel.', quote:'"I remember your face. I remember all their faces."', primaryAttribute:'DEX', stats: ds('Undead','Ranger'), abilities:[{name:'Precision',icon:'crosshair',description:'Spectral sight perfect aim',manaCost:0},{name:'Power Shot',icon:'target',description:'Phase arrow through armor',manaCost:20},{name:'Multi Shot',icon:'split',description:'Spectral arrow volley',manaCost:25},{name:'Rain of Arrows',icon:'cloud-rain',description:'Ghost arrow storm',manaCost:40}], racialTraits:[{name:'Undying',effect:'+20% HP'},{name:'Fear Aura',effect:'-10% enemy accuracy'}], strengths:['Phase arrows ignore some defense','Fear Aura provides safety','Undying survivability'], weaknesses:['Holy magic weakness','Haunted by past','No healing abilities'], combatStyle:'Ranged Physical & Stealth', weapons:'Phantom Bow, Spirit Arrows, Shadow Cloak', alignment:'Neutral Evil', difficulty:'Intermediate', flavorText:'Her arrows carry the weight of a life she can never reclaim.' },
  { id:'pirate_king', name:'Racalvin the Pirate King', title:'The Scourge of the Grudge Ocean Line', race:'Barbarian', className:'Ranger', faction:'Crusade', factionColor:'#c9a030', rarity:'Legendary', lore:'Legend speaks of a pirate so ruthless that even the sea feared him. Racalvin conquered the Grudge Ocean Line with nothing but a stolen ship and a crew of outcasts, building an empire of plunder and freedom.', backstory:"Born as the bastard son of a barbarian chieftain and a merchant's daughter, Racalvin was cast out at birth. He stowed away on a merchant vessel at age eight, mutinied at twelve, and by twenty commanded a fleet of thirty ships. His true name became synonymous with freedom and terror across every port.", quote:'"The sea does not bow. Neither do I."', primaryAttribute:'DEX', stats:(function(){var s=ds('Barbarian','Ranger');return{health:s.health+30,attack:s.attack+5,defense:s.defense,speed:s.speed+5,range:s.range,mana:s.mana}})(), abilities:[{name:'Precision',icon:'crosshair',description:'Sea-born accuracy',manaCost:0},{name:'Power Shot',icon:'target',description:'Cannon-force shot',manaCost:20},{name:'Multi Shot',icon:'split',description:'Broadside volley',manaCost:25},{name:'Storm of Arrows',icon:'crown',description:'Ultimate sea storm devastation',manaCost:50}], racialTraits:[{name:'Rage',effect:'+20% damage below 50% HP'},{name:'Frost Resistance',effect:'+15% cold defense'},{name:'Pirate King',effect:'+10% HP, +25% ATK, +15% SPD'}], strengths:['Highest base stats of any hero','Pirate King bonus on top of racial traits','Fastest hero in the game'], weaknesses:['Secret unlock required','Glass cannon build','No healing abilities'], combatStyle:'Ranged Physical & Stealth', weapons:"Flintlock Pistols, Cutlass, Captain's Coat", alignment:'Chaotic Neutral', difficulty:'Expert', flavorText:'Crowns are taken. Thrones are stolen. The sea is earned.' },
  { id:'sky_captain', name:'Cpt. John Wayne', title:'The Sky Captain', race:'Human', className:'Warrior', faction:'Crusade', factionColor:'#c9a030', rarity:'Legendary', lore:'The first captain of Racalvin\'s pirate crew and the first man in history to pilot a flying machine. A hardened soldier turned sky-pirate, John Wayne traded his medals for a compass and never looked back.', backstory:'Once the most decorated officer in the Crusade\'s airborne division, Captain Wayne grew disillusioned with the politics of war. When Racalvin offered him command of The Grudge — a legendary warship unlike anything the world had seen — he burned his commission and took to the skies. His ironclad nerve and unshakeable loyalty earned him the title Sky Captain. They say he once flew through a god-storm and came out the other side laughing.', quote:'"The ground is for those who\'ve given up dreaming."', primaryAttribute:'STR', stats:(function(){var s=ds('Human','Warrior');return{health:s.health+20,attack:s.attack+5,defense:s.defense+3,speed:s.speed,range:s.range,mana:s.mana}})(), abilities:[{name:'Invincibility',icon:'shield',description:'Iron Will damage immunity',manaCost:40},{name:'Damage Surge',icon:'zap',description:'Sky fury +25% ATK',manaCost:25},{name:"Guardian's Aura",icon:'shield-check',description:'Captain\'s rally defense boost',manaCost:30},{name:'Skyfire Barrage',icon:'crown',description:'Raining fire from The Grudge',manaCost:70}], racialTraits:[{name:'Adaptable',effect:'+5% XP gain'},{name:'Diplomatic',effect:'+10% gold from quests'},{name:'Iron Will',effect:'-10% incoming damage, fear immunity'}], strengths:['Enhanced base stats over standard human warrior','Fear immunity from Iron Will','Skyfire Barrage ultimate devastation'], weaknesses:['Secret unlock required','No ranged base attacks','No healing abilities'], combatStyle:'Melee Physical Combat', weapons:'Fire-Tempered Greatsword, Sky Captain\'s Armor, The Grudge Warship', alignment:'Chaotic Good', difficulty:'Intermediate', flavorText:'The sky has no borders. Neither does his grudge.' },
];

function Stars({ rarity, size = 12 }) {
  const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.Common;
  return (
    <span style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: cfg.stars }, (_, i) => (
        <span key={i} style={{
          display: 'inline-block', width: size, height: size,
          background: cfg.color,
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
          filter: `drop-shadow(0 0 2px ${cfg.color}60)`,
        }} />
      ))}
    </span>
  );
}

function StatSVG({ type, color, size = 11 }) {
  const paths = {
    health: <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>,
    attack: <><path d="M6.92 5H5l7 7-3.5 3.5 1.42 1.42L13.5 13.5l3 3L19 14l-7-7z"/><path d="M19 3l2 2-2.5 2.5L21 10l-4 4-2.5-2.5L12 14l-1.41-1.41 5.09-5.09L13 5l6-2z"/></>,
    defense: <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>,
    speed: <><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      {paths[type]}
    </svg>
  );
}

function getHeroColors(hero) {
  const fc = FACTION_COLORS[hero.faction] || FACTION_COLORS.Crusade;
  const isSecretHero = hero.id === 'pirate_king' || hero.id === 'sky_captain';
  const pkOverride = isSecretHero ? '#c9a030' : null;
  return {
    borderColor: pkOverride || fc.border,
    gradient: pkOverride ? 'linear-gradient(135deg, #1a1505 0%, #2a2010 50%, #1a1505 100%)' : fc.gradient,
    glow: pkOverride ? 'rgba(201,160,48,0.4)' : fc.glow,
    modalGradient: pkOverride ? 'linear-gradient(135deg, #0f0d05 0%, #1a1508 50%, #0f0d05 100%)' : fc.gradient,
  };
}

function HeroCard({ hero, onClick }) {
  const [hovered, setHovered] = useState(false);
  const { borderColor, gradient, glow } = getHeroColors(hero);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', cursor: 'pointer', width: 200,
        borderRadius: 12, overflow: 'hidden',
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 20px ${glow}, 0 4px 20px rgba(0,0,0,0.5)`,
        background: gradient,
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)` }} />
      {(hero.id === 'pirate_king' || hero.id === 'sky_captain') && (
        <div style={{
          position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 4,
          fontSize: 9, fontWeight: 700, letterSpacing: 1, zIndex: 3,
          background: 'linear-gradient(135deg, #ffd700, #f59e0b)', color: '#000',
        }}>SECRET</div>
      )}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img
          src={`/heroes/portraits/${hero.id}.png?v=2`}
          alt={hero.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 35%, transparent 65%)' }} />
        <div style={{
          position: 'absolute', top: 8, right: 8, padding: '2px 6px', borderRadius: 4,
          fontSize: 9, fontWeight: 700, background: 'rgba(0,0,0,0.7)',
          color: hero.factionColor, border: `1px solid ${hero.factionColor}40`,
        }}>
          {hero.faction}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{hero.name}</div>
          <div style={{ fontSize: 10, fontStyle: 'italic', color: borderColor }}>{hero.title}</div>
        </div>
      </div>
      <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 6 }}>
          <Stars rarity={hero.rarity} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
          padding: '5px 6px', borderRadius: 6,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {[
            { type: 'health', color: '#22c55e', val: hero.stats.health },
            { type: 'attack', color: '#ef4444', val: hero.stats.attack },
            { type: 'defense', color: '#3b82f6', val: hero.stats.defense },
            { type: 'speed', color: '#f59e0b', val: hero.stats.speed },
          ].map(s => (
            <div key={s.type} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <StatSVG type={s.type} color={s.color} />
              <span style={{ fontSize: 10, fontWeight: 700, color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 9, color: '#888' }}>{hero.race} {hero.className}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {hero.abilities.slice(0, 4).map((a, i) => (
              <div key={i} style={{
                width: 24, height: 24, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${borderColor}12`, border: `1px solid ${borderColor}25`,
              }} title={`${a.name}: ${a.description}${a.manaCost > 0 ? ` (${a.manaCost} MP)` : ' (Passive)'}`}>
                <img src={skillSrc(a.icon)} alt="" style={{ width: 13, height: 13, imageRendering: 'pixelated', filter: `drop-shadow(0 0 2px ${a.manaCost > 0 ? '#a78bfa' : '#4ade80'})` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)` }} />
    </div>
  );
}

function HeroModal({ hero, onClose, onPrev, onNext }) {
  const [tab, setTab] = useState('lore');
  const { borderColor, modalGradient, glow } = getHeroColors(hero);
  const rarityCfg = RARITY_CONFIG[hero.rarity] || RARITY_CONFIG.Common;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  useEffect(() => { setTab('lore'); }, [hero.id]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 10600,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
    }}>
      <button onClick={e => { e.stopPropagation(); onPrev(); }} style={{
        position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
        color: '#ccc', fontSize: 32, width: 44, height: 44, borderRadius: '50%',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10601,
      }}>{'\u2039'}</button>
      <button onClick={e => { e.stopPropagation(); onNext(); }} style={{
        position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
        color: '#ccc', fontSize: 32, width: 44, height: 44, borderRadius: '50%',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10601,
      }}>{'\u203A'}</button>

      <div onClick={e => e.stopPropagation()} style={{
        display: 'flex', width: '90%', maxWidth: 700, maxHeight: '80vh',
        borderRadius: 12, overflow: 'hidden',
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 40px ${glow}, 0 8px 40px rgba(0,0,0,0.6)`,
        background: modalGradient,
      }}>
        <div style={{ position: 'relative', width: 260, minWidth: 260, overflow: 'hidden' }}>
          <img
            src={`/heroes/portraits/${hero.id}.png?v=2`}
            alt={hero.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, transparent 100%)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.8) 100%)' }} />
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
            {(hero.id === 'pirate_king' || hero.id === 'sky_captain') && (
              <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 1, background: 'linear-gradient(135deg, #ffd700, #f59e0b)', color: '#000' }}>SECRET</span>
            )}
            <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: 'rgba(0,0,0,0.7)', border: `1px solid ${rarityCfg.color}40`, display: 'flex', gap: 3 }}>
              <Stars rarity={hero.rarity} size={13} />
            </span>
            <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: 'rgba(0,0,0,0.7)', color: hero.factionColor, border: `1px solid ${hero.factionColor}50` }}>{hero.faction}</span>
          </div>
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>{hero.name}</div>
            <div style={{ fontSize: 11, fontStyle: 'italic', color: borderColor, marginTop: 2 }}>{hero.title}</div>
            <div style={{ fontSize: 10, marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ color: '#ccc' }}>{hero.race}</span>
              <span style={{ color: '#888' }}>/</span>
              <span style={{ color: '#ccc' }}>{hero.className}</span>
              <span style={{ color: '#888' }}>/</span>
              <span style={{ color: borderColor, fontWeight: 700 }}>{hero.alignment}</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {['lore', 'stats', 'skills'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: 1, background: tab === t ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: 'none', borderBottom: `2px solid ${tab === t ? borderColor : 'transparent'}`,
                cursor: 'pointer', fontFamily: "'Jost', sans-serif",
                color: tab === t ? borderColor : '#888',
                transition: 'all 0.2s',
              }}>{t}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, maxHeight: 400 }}>
            {tab === 'lore' && <LoreContent hero={hero} borderColor={borderColor} />}
            {tab === 'stats' && <StatsContent hero={hero} borderColor={borderColor} />}
            {tab === 'skills' && <SkillsContent hero={hero} borderColor={borderColor} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoreContent({ hero, borderColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 12, fontStyle: 'italic', color: borderColor, lineHeight: 1.6 }}>{hero.quote}</p>
      </div>
      <div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#888', marginBottom: 6 }}>Lore</div>
        <p style={{ fontSize: 12, color: '#ccc', lineHeight: 1.6 }}>{hero.lore}</p>
      </div>
      <div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#888', marginBottom: 6 }}>Backstory</div>
        <p style={{ fontSize: 12, color: '#aaa', lineHeight: 1.6 }}>{hero.backstory}</p>
      </div>
      <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#888', marginBottom: 6 }}>Racial Traits</div>
        {hero.racialTraits.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ddd' }}>{t.name}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: borderColor }}>{t.effect}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, fontStyle: 'italic', textAlign: 'center', paddingTop: 8, color: '#666' }}>{hero.flavorText}</div>
    </div>
  );
}

function StatsContent({ hero, borderColor }) {
  const statList = [
    { label: 'Health', value: hero.stats.health, type: 'health', color: '#22c55e' },
    { label: 'Attack', value: hero.stats.attack, type: 'attack', color: '#ef4444' },
    { label: 'Defense', value: hero.stats.defense, type: 'defense', color: '#3b82f6' },
    { label: 'Speed', value: hero.stats.speed, type: 'speed', color: '#f59e0b' },
    { label: 'Range', value: hero.stats.range, type: 'attack', color: '#06b6d4' },
    { label: 'Mana', value: hero.stats.mana, type: 'speed', color: '#8b5cf6' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {statList.map(s => (
          <div key={s.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 8,
            borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <StatSVG type={s.type} color={s.color} size={16} />
            <span style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 9, textTransform: 'uppercase', color: '#888' }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#888', marginBottom: 6 }}>Combat Profile</div>
        {[
          { label: 'Combat Style', value: hero.combatStyle },
          { label: 'Weapons', value: hero.weapons },
          { label: 'Difficulty', value: hero.difficulty, color: hero.difficulty === 'Expert' ? '#ef4444' : hero.difficulty === 'Advanced' ? '#f59e0b' : hero.difficulty === 'Intermediate' ? '#3b82f6' : '#22c55e' },
          { label: 'Primary Attr', value: hero.primaryAttribute, color: borderColor, bold: true },
          { label: 'Rarity', isStars: true },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
            <span style={{ color: '#aaa' }}>{r.label}</span>
            {r.isStars ? <Stars rarity={hero.rarity} size={14} /> : (
              <span style={{ color: r.color || '#ddd', fontWeight: r.bold ? 700 : 400, textAlign: 'right', maxWidth: 180 }}>{r.value}</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>Strengths</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {hero.strengths.map((s, i) => (
              <li key={i} style={{ fontSize: 10, color: '#aaa', display: 'flex', alignItems: 'flex-start', gap: 4, padding: '2px 0' }}>
                <span style={{ color: '#22c55e' }}>+</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>Weaknesses</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {hero.weaknesses.map((w, i) => (
              <li key={i} style={{ fontSize: 10, color: '#aaa', display: 'flex', alignItems: 'flex-start', gap: 4, padding: '2px 0' }}>
                <span style={{ color: '#ef4444' }}>-</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SkillsContent({ hero, borderColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hero.abilities.map((a, i) => {
          const costColor = a.manaCost > 0 ? '#a78bfa' : '#4ade80';
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: 10,
              borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${borderColor}20`, border: `1px solid ${borderColor}40`,
              }}>
                <img src={skillSrc(a.icon)} alt="" style={{ width: 20, height: 20, imageRendering: 'pixelated', filter: `drop-shadow(0 0 2px ${borderColor})` }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ddd' }}>{a.name}</span>
                  <span style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 4,
                    background: a.manaCost > 0 ? 'rgba(139,92,246,0.15)' : 'rgba(34,197,94,0.15)',
                    color: costColor,
                  }}>
                    {a.manaCost > 0 ? `${a.manaCost} MP` : 'Passive'}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{a.description}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#888', marginBottom: 6 }}>Racial Traits</div>
        {hero.racialTraits.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ddd' }}>{t.name}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: borderColor }}>{t.effect}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroCodexTab({ panelStyle }) {
  const [raceFilter, setRaceFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [factionFilter, setFactionFilter] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const filteredHeroes = useMemo(() => {
    return HEROES.filter(h => {
      if (raceFilter !== 'All' && h.race !== raceFilter) return false;
      if (classFilter !== 'All' && h.className !== classFilter) return false;
      if (factionFilter !== 'All' && h.faction !== factionFilter) return false;
      return true;
    });
  }, [raceFilter, classFilter, factionFilter]);

  const openModal = useCallback((idx) => setSelectedIndex(idx), []);
  const closeModal = useCallback(() => setSelectedIndex(-1), []);
  const navPrev = useCallback(() => {
    setSelectedIndex(prev => (prev - 1 + filteredHeroes.length) % filteredHeroes.length);
  }, [filteredHeroes.length]);
  const navNext = useCallback(() => {
    setSelectedIndex(prev => (prev + 1) % filteredHeroes.length);
  }, [filteredHeroes.length]);

  const selectStyle = {
    fontSize: 11, padding: '6px 8px', borderRadius: 6,
    appearance: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,0.06)', color: '#ccc',
    border: '1px solid rgba(255,255,255,0.1)',
    outline: 'none', fontFamily: "'Jost', sans-serif",
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        padding: '0 0 16px 0', borderBottom: '1px solid rgba(255,215,0,0.15)', marginBottom: 16,
      }}>
        <div>
          <h2 style={{ fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1.15rem', margin: 0 }}>Hero Codex</h2>
          <p style={{ fontSize: 10, color: '#888', margin: 0 }}>{filteredHeroes.length} of {HEROES.length} Heroes</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={raceFilter} onChange={e => setRaceFilter(e.target.value)} style={selectStyle}>
            <option value="All">Race: All</option>
            {['Human', 'Barbarian', 'Dwarf', 'Elf', 'Orc', 'Undead'].map(r => <option key={r} value={r}>Race: {r}</option>)}
          </select>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} style={selectStyle}>
            <option value="All">Class: All</option>
            {['Warrior', 'Worg', 'Mage', 'Ranger'].map(c => <option key={c} value={c}>Class: {c}</option>)}
          </select>
          <select value={factionFilter} onChange={e => setFactionFilter(e.target.value)} style={selectStyle}>
            <option value="All">Faction: All</option>
            {['Crusade', 'Fabled', 'Legion'].map(f => <option key={f} value={f}>Faction: {f}</option>)}
          </select>
        </div>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16,
        alignContent: 'flex-start',
      }}>
        {filteredHeroes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#666', fontSize: 14 }}>No heroes match the selected filters</div>
        ) : (
          filteredHeroes.map((hero, i) => (
            <HeroCard key={hero.id} hero={hero} onClick={() => openModal(i)} />
          ))
        )}
      </div>

      {selectedIndex >= 0 && selectedIndex < filteredHeroes.length && (
        <HeroModal
          hero={filteredHeroes[selectedIndex]}
          onClose={closeModal}
          onPrev={navPrev}
          onNext={navNext}
        />
      )}
    </div>
  );
}
