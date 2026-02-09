# Grudge Warlords

## Overview
A Final Fantasy 7-inspired turn-based RPG with dark fantasy aesthetic. Built with React + Vite + Zustand. Features 6 races, 4 classes (24 Warlord combinations), multi-hero tactical battles with player-controlled roster heroes and multiple enemies per encounter.

## Project Architecture
- **Frontend**: React 19 with Vite dev server on port 5000
- **State Management**: Zustand (single store at `src/stores/gameStore.js`)
- **Styling**: Inline styles + CSS variables in `src/index.css`
- **Fonts**: Cinzel (headings) + Jost (body) via Google Fonts
- **Sprites**: Pixel art sprite sheets in `public/sprites/`, animated via SpriteAnimation component

## File Structure
```
src/
  App.jsx              - Main app with screen router
  main.jsx             - React entry point
  index.css            - Global styles, CSS vars, animations
  stores/
    gameStore.js        - Zustand store (all game state + logic)
  data/
    attributes.js       - 8 attributes, diminishing returns, stat calculations
    classes.js          - 4 class definitions with abilities
    races.js            - 6 race definitions with attribute bonuses
    enemies.js          - 9 enemy types, 8 locations, enemy factory
    skillTrees.js       - Class skill trees with tiers
    spriteMap.js        - Sprite sheet mappings for classes and enemies
  data/
    equipment.js        - Equipment templates, rarity tiers, loot generation, stat bonuses
  components/
    TitleScreen.jsx     - Title screen with New Game button
    CharacterCreate.jsx - 4-step character creation (Name → Race → Class → Attributes)
    WorldMap.jsx        - World map with locations, inn, auto-harvest panel
    LocationView.jsx    - Location detail with fight/boss buttons
    BattleScreen.jsx    - Multi-unit tactical battle with 2D positioning
    CharacterSheet.jsx  - Stats view + attribute allocation
    SkillTreeView.jsx   - Skill tree UI
    SpriteAnimation.jsx - Reusable sprite sheet animation component
    HeroCreate.jsx      - Recruit new heroes to roster (4-step creation)
    AccountPage.jsx     - War Council: hero cards, stats, abilities, skills, attributes, equipment per hero
    BattleParticles.jsx - Particle effects for battles
    TrainingScreen.jsx  - Guided tutorial battles (2 rounds)
    LootPopup.jsx       - Post-battle loot reward overlay
public/
  backgrounds/         - Battle background images per location (8 PNGs)
  sprites/             - Organized sprite sheets per character
    knight/            - Warrior class sprites
    priest/            - Mage Priest class sprites
    orc-rider/         - Worg Rider class sprites
    archer/            - Ranger class sprites
    slime/             - Goblin enemy sprites
    skeleton/          - Skeleton enemy sprites
    werewolf/          - Dire Wolf enemy sprites
    wizard/            - Dark Mage enemy sprites
    orc/               - Orc enemy sprites
    werebear/          - Dragon Whelp enemy sprites
    armored-skeleton/  - Lich enemy sprites
    knight-templar/    - Demon Lord enemy sprites
    swordsman/         - Void King enemy sprites
    elite-orc/         - Elite Orc enemy sprites
```

## Race System (6 Races)
- **Human**: +1 to all attributes (Adaptable trait)
- **Orc**: +4 STR, +2 VIT, +2 END (Bloodrage trait)
- **Elf**: +3 INT, +2 DEX, +2 AGI, +1 WIS (Arcane Affinity trait)
- **Undead**: +3 VIT, +2 END, +2 WIS, +1 STR (Undying Will trait)
- **Barbarian**: +3 STR, +2 AGI, +1 VIT, +1 END, +1 TAC (Berserker Rage trait)
- **Dwarf**: +3 END, +2 VIT, +1 STR, +1 DEX, +1 WIS (Stoneborn trait)
- Race bonuses stack with class starting attributes during character creation

## Battle System (Multi-Unit Tactical)
- **Formation**: Player team (left side, 10-22% horizontal) vs enemies (right side, 70-84%)
- **Turn Order**: Speed-based initiative, units sorted by speed attribute descending
- **AI Allies**: 1-2 AI companions per battle, scaled to ~55% player stats
  - Mage/Priest allies prioritize healing low-health teammates
  - Warrior/Worg allies use buff abilities and attack
  - Ranger allies focus DPS on weakest enemies
- **Enemy AI**: Random targeting, 40-50% chance to use special abilities off cooldown
- **Animations**: Melee dash-to-target, ranged colored projectiles, floating damage numbers
- **Combat States**: intro → player_turn / ai_turn / animating → victory / defeat

## Sprite System
- Sprite sheets are horizontal strips, each frame is 100x100px
- SpriteAnimation component handles frame-based animation with configurable speed, scale, flip, loop
- spriteMap.js maps class IDs (warrior, mage, worg, ranger) and enemy template IDs to their sprite data
- Animations available: idle, attack1, attack2, attack3, hurt, death, walk, block, heal

## Character Creation Flow
1. **Step 1 - Name**: Enter warlord name
2. **Step 2 - Race**: Choose from 6 races (each with attribute bonuses and lore)
3. **Step 3 - Class**: Choose from 4 classes (previews combined race+class attributes)
4. **Step 4 - Attributes**: Allocate remaining points across 8 attributes

## Keyboard Hotkeys
- In battle, press 1-5 to use corresponding ability (when player's turn)

## Game Systems
- **8 Attributes**: Strength, Intellect, Vitality, Dexterity, Endurance, Wisdom, Agility, Tactics
- **Diminishing Returns**: 100% efficiency up to 25 points, 50% from 25-50, 25% after 50
- **Level Progression**: 0-20, 20 starting points + 7 per level (160 total at max)
- **6 Races**: Human, Orc, Elf, Undead, Barbarian, Dwarf
- **4 Classes**: Warrior, Mage Priest, Worg Rider, Ranger
- **24 Warlord Combinations**: 6 races × 4 classes
- **9 Enemy Types**: Goblin, Skeleton, Wolf, Dark Mage, Orc, Dragon Whelp, Lich, Demon Lord, Void King
- **8 Locations**: Progressive unlock by level, bosses in later zones
- **Defeat Penalty**: Recover at 50% HP, lose 10% gold

## Hero Roster System
- Players create and control multiple heroes (no AI allies)
- Max 3 heroes active per battle, up to 6 total in roster
- Hero slot unlocks: 2nd hero after 1st victory, 3rd after 2nd victory, more after clearing boss maps
- HeroCreate component: 4-step creation (Name → Race → Class → Attributes) for new roster heroes
- New heroes start at (player level - 2, min 1)
- WorldMap shows War Party management UI with active/reserve hero toggling
- All roster heroes are player-controlled in battle (turns cycle through all player heroes)
- Inn rest heals entire roster, defeat penalizes entire roster

## Audio System
- Web Audio API synthesized sounds: sword hits, magic casting, healing, buffs, dodge, crits, victory/defeat
- Adaptive BGM: ambient music on world map, battle music during fights
- audioManager.js exports: playSwordHit, playMagicCast, playHeal, playBuff, playHurt, playCrit, playDodge, playVictory, playDefeat, setBgm

## Particle Effects
- BattleParticles.jsx: AmbientParticles, CastingParticles, HitParticles, HealParticles
- CSS-animated particles with configurable colors and positions
- Integrated throughout battle: casting sparkles, hit impacts, heal particles, ambient floating

## Equipment System
- 3 equipment slots: weapon, armor, accessory
- 5 rarity tiers: Common, Uncommon, Rare, Epic, Legendary (with stat multipliers)
- Equipment templates per class (weapons) and universal (armor/accessories)
- Loot drops from enemies (35% base, 100% from bosses, higher rarity from bosses)
- Equipment tab in War Council for equip/unequip per hero
- LootPopup component shows rewards after battle victory
- Equipment stat bonuses: damage, defense, health, mana, criticalChance, evasion, etc.

## Training System
- Guided tutorial: create hero 1 → Training Round 1 → Skill Tutorial → create hero 2 → Training Round 2 → create hero 3 → world map
- TrainingScreen component with narrative text, battle integration
- Training battles use scaled enemies (goblin round 1, skeleton round 2)
- Skill Tutorial: 3-step interactive guide after first battle victory
  - Step 1: Attribute Points - inline allocation UI with +/- buttons for all 8 attributes
  - Step 2: Skill Tree - interactive skill tree spending with glowing available skills
  - Step 3: Action Bar - visual guide showing all class abilities with hotkeys, costs, cooldowns, and effects

## Auto-Harvest System
- 5 resource nodes: Gold Mine, Herb Garden, Lumber Yard, Ore Vein, Crystal Cave
- Assign idle (reserve) heroes to gather resources passively
- Resources accumulate every 2 seconds based on hero level multiplier
- Harvest panel on WorldMap with assign/recall controls

## Status Effects in Combat
- DoT (damage over time): bleed from Warrior Cleave, burn from Mage Fireball, poison from Ranger Poison Arrow, rend from Worge
- Buffs: War Cry (damage boost), Evasive Roll (evasion), Mana Shield (defense), Bear Form (damage+defense)
- Debuffs: Ice Storm (damage reduction on enemy)
- Stun: Shield Bash (skip turn)
- HoT: Blood Howl (heal over time)

## Account / War Council Page
- AccountPage.jsx: unified hero management with hero cards sidebar + detail panel
- Tabs: Stats (core + combat stats), Abilities (class ability cards), Skills (per-hero skill tree), Attributes (per-hero point allocation), Equipment (equip/unequip + inventory)
- Per-hero skill tracking: each hero has own skillPoints and unlockedSkills
- Per-hero attribute allocation: allocateHeroPoint/deallocateHeroPoint in store
- Heroes gain skill points and unspent attribute points on level up
- WorldMap header has "War Council" button to access the page
- Notifications when any hero has unspent points

## Sprite System (20 Character Sprites)
- 20 unique sprite sets in public/sprites/: archer, armored-axeman, armored-orc, armored-skeleton, elite-orc, greatsword-skeleton, knight, knight-templar, lancer, orc, orc-rider, priest, skeleton, skeleton-archer, slime, soldier, swordsman, werebear, werewolf, wizard
- Each sprite has: idle, attack1, attack2/attack3 (some), hurt, death, walk animations
- All 24 race/class combinations mapped to unique sprites in raceClassSpriteMap

## Battle Effects System
- 20 pixel art effect spritesheets in public/effects/pixel/ (magic spells, fire, ice, weapon hits, etc.)
- 4 beam trail images in public/effects/beams/ (green, orange, purple, red) for projectile trails
- abilityEffectMap maps each class's abilities to specific visual effects and beam colors
- Hit effects overlay on target when attacks land (both melee and ranged)
- Beam trails replace colored dots for ranged projectiles (arrow shots, magic bolts)

## Visual World Map
- 2D fantasy map background image at public/backgrounds/world_map.png
- 8 location nodes positioned at specific coordinates on the map
- SVG path lines connecting adjacent locations (gold when both unlocked, dashed when locked)
- Player hero sprite displayed on map, animates walking to selected location
- Click any unlocked location node to open context menu with: Hunt Monsters, Challenge Boss, Rest at Inn, Visit Location, Trade (coming soon)
- War Party and Auto-Harvest panels as collapsible overlays (top-right buttons)
- HUD header bar (top) with player info, gold, XP, quick buttons
- Stats footer bar (bottom) with victories, level, gold, hero count
- Location nodes glow with themed colors, show level range and boss warnings
- Locked locations show lock icon and required level

## Recent Changes
- Rebuilt WorldMap as visual 2D map with generated fantasy background, clickable location nodes, hero sprite, and context menus
- Added 20 character sprites with proper frame counts, 6 new sprite sets (lancer, armored-axeman, armored-orc, skeleton-archer, soldier, slime)
- All 24 race/class combos now have unique sprite mappings (no more shared sprites with filters)
- Integrated beam trail images for ranged projectiles (color-coded per ability type)
- Added pixel art hit effects that play on targets when attacks connect
- Goblin enemies now use slime sprite, orc enemies use armored-orc sprite
- Fixed HeroCreate race.attributeBonuses → race.bonuses property name bug
- Added equipment system with weapons/armor/accessories, 5 rarity tiers, loot drops
- Added Equipment tab in War Council for per-hero equip/unequip + inventory management
- Added LootPopup component for post-battle reward display
- Enhanced abilities: 5 abilities per class, burn/bleed/freeze DoT effects, Mana Shield, Arrow Volley
- Built Training Round system with guided tutorial battles gating world access
- Added Auto-Harvesting system with 5 resource nodes on WorldMap
- Video backgrounds: bg-clear.mp4 (title), bg-blur.mp4 (gameplay screens), loading.mp4 (loading screen)
- 6 playable races with 4 classes = 24 warlord combinations
