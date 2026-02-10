# Grudge Warlords

## Overview
Grudge Warlords is a Final Fantasy 7-inspired turn-based RPG with a dark fantasy aesthetic, built using React, Vite, and Zustand. The project focuses on multi-hero tactical battles, allowing players to create and manage a roster of heroes from 6 races and 4 classes, offering 24 unique Warlord combinations. The game aims to deliver a rich RPG experience with deep character customization, tactical combat, and a compelling progression system.

## User Preferences
I want the agent to use clear and concise language. I prefer iterative development with small, testable changes. Before making any significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all code adheres to modern React practices and maintains a consistent styling approach.

## System Architecture
The application is a React 19 frontend developed with Vite, managing global state via a single Zustand store (`src/stores/gameStore.js`). Styling utilizes inline styles and CSS variables. The application is designed for static deployment.

**UI/UX Decisions:**
- **Typography & Visuals:** Uses Cinzel (headings) and Jost (body) fonts. Visuals include pixel art sprite sheets for characters, particle effects and beam trails for abilities, and a 2D world map with clickable nodes and animated hero movement.
- **Screen Flow:** The user journey progresses through Title Screen, Character Creation, World Map, Location Views, and Battle Screens, with dedicated UIs for Character Sheets, Skill Trees, and Account management (War Council).
- **Game Frame & Layout:** The entire application is wrapped in a `.game-frame` CSS class, providing a decorative golden border and ensuring proper scaling across devices. A fixed-height action bar (140px) is consistently visible during battle.

**Technical Implementations:**
- **Character System:** Supports 24 unique Warlord combinations from 6 races and 4 classes, each with 8 attributes and a 0-20 level progression system featuring diminishing returns.
- **Battle System:** Multi-unit tactical combat on a 2D plane with speed-based initiative. Players control up to 3 active heroes (6 in roster) against AI enemies. Includes animations for attacks, projectiles, and floating damage numbers.
- **Sprite System:** Employs a `SpriteAnimation` component for 100x100px sprite sheet animations, dynamically scaled for visual consistency. Special handling for Worge transformations.
- **Game Systems:**
    - **Equipment:** An 8-tier equipment upgrade system across 7 slots (weapon, offhand, helmet, armor, feet, ring, relic), with numerous items and a paper-doll gear UI supporting drag-and-drop.
    - **Progression:** Includes a training system, an auto-harvesting system for resources, and various status effects.
    - **Abilities:** Heroes have a customizable 5-slot ability loadout with slot restrictions based on weapon type and class. Each class has unique signature abilities (e.g., Warrior's Invincible, Mage's Mana Shield).
    - **Loot:** Enemies drop tier-based loot, with bosses having increased chances for higher-tier items and consumables.
    - **Consumables:** 6 types of potions (Health, Mana, Stamina, Speed, Cure, Rezzy) available via shop and drops, usable during battle.
    - **Trading:** Camp merchant system for buying/selling equipment with stat-weighted pricing and dynamic inventory generation based on player level.
- **Audio System:** Web Audio API for synthesized combat sounds and adaptive background music.
- **Particle Effects:** CSS-animated particle effects for in-battle actions.
- **World Map:** An RTS-style 2D map with zoom and pan functionality, featuring 29 unlockable locations across 5 terrain regions. Interactive elements include hero movement, contextual menus, boss encounters, and hover tooltips. Includes environmental effects (rivers, lava, towers) and a dynamic day/night cycle. AI conversation bubbles provide context-aware dialogue. Random event nodes periodically spawn with various rewards.
- **Enemy System:** `createRaceClassEnemy` generates enemies based on race, class, and level, with stat scaling and procedural naming. Bosses have unique abilities.
- **Hero Roster:** Allows managing multiple heroes with independent progression and equipment.
- **Zone Conquer System:** Each zone has a conquer rating (0-100%) that impacts XP gain and auto-harvest output. Conquered zones display an idle worker sprite.
- **Zone Quest System:** 29 zones each feature 4 optional quests (e.g., kill count, flawless wins, boss kills, conquer percentage) providing gold, XP, and conquer bonuses.
- **Gruda Arena:** A standalone challenge mode (`public/api/play/gruda.html`) for simplified turn-based battles. Supports hero sharing via URL parameters or share codes, encoding full hero builds into compact, URL-safe tokens. Includes OG meta tags for social media previews.
- **Battle Admin Mode:** A developer tool (accessible via `~`) for pausing battles and visually adjusting/copying battle effect parameters.
- **Hotkeys:** In-battle ability activation via 1-5 hotkeys.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool.
- **Zustand:** State management library.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game sound effects and music.