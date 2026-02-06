# Grudge Warlords

## Overview
A Final Fantasy 7-inspired turn-based RPG with dark fantasy aesthetic. Built with React + Vite + Zustand.

## Project Architecture
- **Frontend**: React 19 with Vite dev server on port 5000
- **State Management**: Zustand (single store at `src/stores/gameStore.js`)
- **Styling**: Inline styles + CSS variables in `src/index.css`
- **Fonts**: Cinzel (headings) + Jost (body) via Google Fonts

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
  components/
    TitleScreen.jsx     - Title screen with New Game button
    CharacterCreate.jsx - 3-step character creation
    WorldMap.jsx        - World map with locations, inn, navigation
    LocationView.jsx    - Location detail with fight/boss buttons
    BattleScreen.jsx    - Turn-based battle UI
    CharacterSheet.jsx  - Stats view + attribute allocation
    SkillTreeView.jsx   - Skill tree UI
```

## Game Systems
- **8 Attributes**: Strength, Intellect, Vitality, Dexterity, Endurance, Wisdom, Agility, Tactics
- **Diminishing Returns**: 100% efficiency up to 25 points, 50% from 25-50, 25% after 50
- **Level Progression**: 0-20, 20 starting points + 7 per level (160 total at max)
- **4 Classes**: Warrior, Mage Priest, Worg Rider, Ranger
- **9 Enemy Types**: Goblin, Skeleton, Wolf, Dark Mage, Orc, Dragon Whelp, Lich, Demon Lord, Void King
- **8 Locations**: Progressive unlock by level, bosses in later zones
- **Defeat Penalty**: Recover at 50% HP, lose 10% gold

## Recent Changes
- Fixed diminishing returns (calculateEffectivePoints) being applied in stat calculations
- Added enemy turn visual indicator in battles
- Added defeat penalty system (50% HP recovery, 10% gold loss)
- Cleaned up package.json (removed unused phaser, howler, node packages)
- Added proper npm scripts (dev, build, preview)
- Added .gitignore
- Fixed vite config with allowedHosts: true
