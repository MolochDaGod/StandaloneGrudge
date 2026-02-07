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
  components/
    TitleScreen.jsx     - Title screen with New Game button
    CharacterCreate.jsx - 4-step character creation (Name → Race → Class → Attributes)
    WorldMap.jsx        - World map with locations, inn, navigation
    LocationView.jsx    - Location detail with fight/boss buttons
    BattleScreen.jsx    - Multi-unit tactical battle with 2D positioning
    CharacterSheet.jsx  - Stats view + attribute allocation
    SkillTreeView.jsx   - Skill tree UI
    SpriteAnimation.jsx - Reusable sprite sheet animation component
    HeroCreate.jsx      - Recruit new heroes to roster (4-step creation)
    BattleParticles.jsx - Particle effects for battles
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

## Recent Changes
- Implemented hero roster system replacing AI allies with player-controlled heroes
- Created HeroCreate component for recruiting new warlords from the world map
- Battle system now uses createHeroBattleUnit() for all player heroes
- Victory/defeat/inn rest all sync roster hero stats (health/mana/stamina)
- WorldMap shows War Party panel with active/reserve toggling and recruit button
- Added location cleared tracking (checkmark on map after boss defeat)
- Integrated Web Audio API for synthesized sound effects and adaptive BGM
- Added particle effects system for battle visuals
- Video backgrounds: bg-clear.mp4 (title), bg-blur.mp4 (gameplay screens), loading.mp4 (loading screen)
- 6 playable races with 4 classes = 24 warlord combinations
