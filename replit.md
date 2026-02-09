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
- **Game Systems:** Includes an equipment system (weapons, armor, accessories across 5 rarity tiers), a training system with guided tutorials, an auto-harvesting system for passive resource generation, and various status effects (DoT, buffs, debuffs, stun, HoT).
- **Audio System:** Web Audio API for synthesized combat sounds and adaptive BGM that changes between world map and battles.
- **Particle Effects:** CSS-animated particle effects for various in-battle actions (casting, hits, heals, ambient).
- **Abilities and Effects:** Each class has unique abilities, some with transformative effects like the Warrior's Demon Blade. Boss enemies feature unique abilities with distinct visual effects.
- **World Map:** Interactive 2D map with unlockable locations, hero movement, and contextual menus for actions like hunting, challenging bosses, or resting.
- **Hero Roster:** Allows players to recruit and manage multiple heroes, each with independent progression for attributes, skills, and equipment.

**Feature Specifications:**
- **Character Creation:** A 4-step process to define a Warlord's name, race, class, and attributes.
- **Hero Management:** The "War Council" page provides comprehensive hero management, including stats, abilities, skill trees, attribute allocation, and equipment.
- **Loot System:** Enemies drop loot with varying rarity, and a `LootPopup` displays post-battle rewards.
- **Hotkeys:** In-battle ability activation via 1-5 hotkeys.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool.
- **Zustand:** State management library.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game sound effects and music.