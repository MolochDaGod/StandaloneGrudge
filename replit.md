# Grudge Warlords

## Overview
A Final Fantasy 7-inspired turn-based RPG with dark fantasy aesthetic. Built with React + Vite + Zustand.

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
    enemies.js          - 9 enemy types, 8 locations, enemy factory
    skillTrees.js       - Class skill trees with tiers
    spriteMap.js        - Sprite sheet mappings for classes and enemies
  components/
    TitleScreen.jsx     - Title screen with New Game button
    CharacterCreate.jsx - 2-step character creation (Name+Faction, Attributes)
    WorldMap.jsx        - World map with locations, inn, navigation
    LocationView.jsx    - Location detail with fight/boss buttons
    BattleScreen.jsx    - Turn-based battle UI with sprites & keyboard hotkeys
    CharacterSheet.jsx  - Stats view + attribute allocation
    SkillTreeView.jsx   - Skill tree UI
    SpriteAnimation.jsx - Reusable sprite sheet animation component
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

## Sprite System
- Sprite sheets are horizontal strips, each frame is 100x100px
- SpriteAnimation component handles frame-based animation with configurable speed, scale, flip, loop
- spriteMap.js maps class IDs (warrior, mage, worg, ranger) and enemy template IDs to their sprite data
- Animations available: idle, attack1, attack2, attack3, hurt, death, walk, block, heal

## Keyboard Hotkeys
- In battle, press 1-5 to use corresponding ability (when player's turn)

## Game Systems
- **8 Attributes**: Strength, Intellect, Vitality, Dexterity, Endurance, Wisdom, Agility, Tactics
- **Diminishing Returns**: 100% efficiency up to 25 points, 50% from 25-50, 25% after 50
- **Level Progression**: 0-20, 20 starting points + 7 per level (160 total at max)
- **4 Classes**: Warrior, Mage Priest, Worg Rider, Ranger
- **9 Enemy Types**: Goblin, Skeleton, Wolf, Dark Mage, Orc, Dragon Whelp, Lich, Demon Lord, Void King
- **8 Locations**: Progressive unlock by level, bosses in later zones
- **Defeat Penalty**: Recover at 50% HP, lose 10% gold

## Recent Changes
- Redesigned CharacterCreate to 2-step flow: Name + Faction selection (step 1), Attribute allocation (step 2)
- Added 8 battle background images for each location (Verdant Plains through Void Throne)
- Fixed BattleScreen layout stability: player/enemy cards in fixed containers, no more layout shift during attacks
- Replaced shake animation with flash/glow visual effects on cards
- Added battle log with auto-scroll and header label
- Turn indicator moved to header bar for cleaner UX
- Added backdrop blur effects throughout battle UI
- Added sprite-based animations replacing emoji visuals throughout the game
- Added MMO-style keyboard hotkeys (1-5) for abilities in battle
- Created SpriteAnimation component and spriteMap.js for sprite management
- Fixed diminishing returns (calculateEffectivePoints) being applied in stat calculations
- Added defeat penalty system (50% HP recovery, 10% gold loss)
