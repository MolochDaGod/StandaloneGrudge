# Grudge Warlords

## Overview
Grudge Warlords is a Final Fantasy 7-inspired turn-based RPG featuring a dark fantasy aesthetic. The game is built with React, Vite, and Zustand, and focuses on multi-hero tactical battles. Players can create and manage a roster of heroes from 6 races and 4 classes, offering 24 unique Warlord combinations. The project aims to provide a rich RPG experience with deep character customization, tactical combat, and a compelling progression system.

## User Preferences
I want the agent to use clear and concise language. I prefer iterative development with small, testable changes. Before making any significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all code adheres to modern React practices and maintains a consistent styling approach.

## System Architecture
The application is a React 19 frontend utilizing Vite for development, with state managed globally by a single Zustand store (`src/stores/gameStore.js`). Styling is handled via inline styles and CSS variables.

**UI/UX Decisions:**
- **Fonts:** Cinzel (headings) and Jost (body) are used.
- **Visuals:** Pixel art sprite sheets animate characters, and battle scenes feature particle effects and beam trails for abilities. The world map is a 2D visual representation with clickable location nodes and animated hero movement.
- **Screen Flow:** The game progresses from a Title Screen to Character Creation, World Map, Location Views, and Battle Screens, with dedicated UIs for Character Sheets, Skill Trees, and Account management (War Council).

**Technical Implementations:**
- **Character System:** 6 races and 4 classes combine for 24 unique Warlord combinations. Character attributes (8 total) have diminishing returns and are managed through a level progression system (0-20).
- **Battle System:** Multi-unit tactical combat on a 2D plane with speed-based initiative. Player-controlled heroes (up to 3 active, 6 in roster) fight against AI enemies. Combat includes animations for attacks, projectiles, and floating damage numbers.
- **Sprite System:** Utilizes `SpriteAnimation` component for frame-based animation of 100x100px sprite sheets, supporting various character and enemy animations. Dynamic scaling ensures consistent visual size.
- **Game Systems:** Includes an 8-tier equipment upgrade system (T1 Common through T8 Mythic) with 78+ weapons from grudgewarlords.com/arsenal, 18 armor pieces, and 30+ relics. Equipment is upgraded at city upgrade services using gold (100g to 10,000g per tier). Tier multipliers scale stats from 1.0x to 5.5x. Data migration (persist version 2) converts old rarity-based items to tier system. Also includes a training system with guided tutorials, an auto-harvesting system for passive resource generation, and various status effects (DoT, buffs, debuffs, stun, HoT).
- **Audio System:** Web Audio API for synthesized combat sounds and adaptive BGM that changes between world map and battles.
- **Particle Effects:** CSS-animated particle effects for various in-battle actions (casting, hits, heals, ambient).
- **Ability Loadout System:** Each hero has a customizable 5-slot ability loadout with slot restrictions: Slot 1 draws from weapon-type skills (slot1 pool), Slots 2-3 from weapon skills (slot23 pool) + class actives, Slot 4 from class actives + skill tree granted abilities, Slot 5 locked to class signature ability. Weapon TYPE (not individual weapons) provides skills — `WEAPON_SKILLS` in equipment.js defines 5 skills per weapon type (14 types). Utility functions in `src/utils/abilityLoadout.js`: `getAbilitiesForSlot(slotIndex, classId, weaponType, unlockedSkills)`, `getAllAbilityMap`, `getDefaultLoadout`, `isSlotLocked`.
- **Class Signature Abilities:** Warrior: Invincible (2-turn invulnerability, absorbs all damage), Mage: Mana Shield, Ranger: Focus (passive +1 crit stack/turn, max 5 stacks, +10% crit per stack, consumed on crit; active doubles stacks + guarantees next crit), Worge: Bear Form/Revert Form.
- **Abilities and Effects:** Each class has unique abilities, some with transformative effects like the Warrior's Demon Blade. Boss enemies feature unique abilities with distinct visual effects.
- **Worge Sprite System:** Worge normal forms use race-appropriate sprites (orc, priest, skeleton, soldier with HUE filters for elf/dwarf). Werewolf/werebear sprites only appear during Bear Form transformation.
- **World Map:** Interactive 2D map with 29 unlockable locations spanning levels 1-20 across 5 terrain regions (green forests, purple/dark, volcanic, icy, citadels). Features 46 path connections, hero movement with animated sprites (scale 0.48), and contextual menus for actions like hunting, challenging bosses, or resting. 10 boss encounters distributed across the map.
- **Race/Class Enemy System:** `createRaceClassEnemy(raceId, classId, level, options)` in `src/data/enemies.js` generates enemies using real stat calculations from `calculateStats()`. Enemies get class starting attributes + race bonuses + level-distributed points (2/level, 70% weighted to primary stats). Regular enemies scale at 75% player equivalent, bosses at 140% with +5 effective levels. Procedural name generation using 15 names per race (90 total). `getZoneEnemyPresets(zoneId)` provides 3 race/class combos per zone for tactical variety. Battle system prefers race/class enemies with fallback to old template system. BattleScreen renders enemy sprites using `getPlayerSprite` with darkened brightness filter.
- **Hero Roster:** Allows players to recruit and manage multiple heroes, each with independent progression for attributes, skills, and equipment.
- **Trading System:** Camp (formerly Greenhollow) has a merchant for buying/selling equipment. `getItemPrice(item)` uses stat-weighted pricing (physicalDamage: 8x, magicDamage: 8x, defense: 6x, etc.) with slot multipliers and tier premiums. `getSellPrice()` returns 40% of buy price. `generateShopInventory(playerLevel, classId)` creates 8-12 class-appropriate items with tier scaling based on player level (maxTier = ceil(level/3)). Shop state: `shopInventory`, `shopLastRefresh`, with `refreshShop`, `buyItem`, `sellItem` actions in gameStore.js.

**Feature Specifications:**
- **Character Creation:** A 4-step process to define a Warlord's name, race, class, and attributes.
- **Hero Management:** The "War Council" page provides comprehensive hero management, including stats, abilities, skill trees, attribute allocation, and equipment.
- **Loot System:** Enemies drop loot with tier based on zone difficulty and player level. `LootPopup` displays post-battle rewards with tier colors (T1-T8). Bosses get +1 tier bonus on drops, with 5% chance for +2 tier drops.
- **Hotkeys:** In-battle ability activation via 1-5 hotkeys.
- **Zone Conquer System:** Each zone has a 0-100% conquer rating that increases with victories. Higher conquer % reduces XP gains (up to -70% at 100%) but boosts auto-harvest output (up to +300%). Conquered zones (100%) display an idle worker sprite. Active heroes wander near the current zone on the world map. Conquer progress shown as SVG ring around zone nodes and progress bar in location popup.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool.
- **Zustand:** State management library.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game sound effects and music.