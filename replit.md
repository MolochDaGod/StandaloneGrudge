# Grudge Warlords

## Overview
Grudge Warlords is a Final Fantasy 7-inspired turn-based RPG with a dark fantasy aesthetic. It features multi-hero tactical battles, allowing players to create and manage a roster of heroes from 6 races and 4 classes, offering 24 unique Warlord combinations. The project aims to deliver a rich RPG experience with deep character customization, tactical combat, and a compelling progression system.

## User Preferences
I want the agent to use clear and concise language. I prefer iterative development with small, testable changes. Before making any significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all code adheres to modern React practices and maintains a consistent styling approach.

## System Architecture
The application is a React 19 frontend developed with Vite, with an Express backend for Discord OAuth and API routes. State management uses a single Zustand store. Styling utilizes inline styles and CSS variables. Deployment uses autoscale with `server.prod.js` serving both API and static build from `dist/`.

**UI/UX Decisions:**
- **Typography & Visuals:** Uses Cinzel (headings) and Jost (body) fonts. Visuals include pixel art sprites, particle and beam effects, a 2D world map with clickable nodes, and animated hero movement. Character cards use race-specific background images.
- **Screen Flow:** The user journey progresses through Title Screen → Intro Cinematic → Game Lobby → Character Creation → World Map → Location Views → Battle Screens. Context-specific screen transitions are used.
- **Scene Node Visuals:** All scene nodes use generated building images (72-80px) instead of colored circles, with Cinzel font for node labels.
- **Game Frame & Layout:** The application is wrapped in a `.game-frame` class with an ornate fantasy border frame overlay. CSS custom properties define content-safe insets. Responsive breakpoints adjust insets for various viewports.
- **Z-Index Layer System:** A two-context architecture is used. The content wrapper sits at z-index 10501, creating a stacking context for screen-internal layers. Overlay siblings render outside the wrapper at elevated z-indices.
- **Game UI Overlay System:** A full-screen transparent layer (`#game-ui-overlay`) covers the game, with interactive panels receiving clicks via `.ui-element` class. Three bottom-aligned panels use `.panel-style` class.
- **Map Bottom Bar:** Renders inside `#game-ui-overlay` with three panels: Party Log, hotbar action slots, and War Party status with popup buttons.

**Technical Implementations:**
- **Character System:** Supports 24 unique Warlord combinations across 6 races and 4 classes, with 8 attributes and a 0-20 level progression.
- **Battle System:** Multi-unit tactical combat on a 2D plane with speed-based initiative, supporting up to 3 active heroes against AI enemies. Includes context-aware damage number animations and screen shake effects.
- **Sprite System:** Employs a `SpriteAnimation` component for sprite sheet animations, with dynamic scaling, transformations, and per-slot equipment hue overlays. Specific enemy and elite warrior sprites are implemented.
- **Pixel Art UI Bars:** `MiniBar` component uses pixel art RPG-styled health/mana/stamina bars with various visual effects and color presets.
- **Custom VFX Effects:** 14 high-quality custom effect sprite sheets are wired into all class and enemy abilities, buffs, and weapon skills.
- **Icon System:** A comprehensive sprite-based icon system (`ICON_REGISTRY`) with 80+ pixel art icons is used throughout the UI.
- **Game Systems:**
    - **Equipment:** An 8-tier upgrade system across 7 slots, with a paper-doll UI supporting drag-and-drop.
    - **Skill Trees:** Node graph layout with SVG bezier curves.
    - **Progression:** Includes training, auto-harvesting, and status effects.
    - **Abilities:** Customizable 5-slot ability loadouts.
    - **Loot:** Tier-based loot drops from enemies.
    - **Consumables:** 6 types of potions available.
    - **Trading:** Camp merchant system for buying/selling equipment.
    - **Scene System:** 4 interactive scene views accessible from the world map (Camp, Dungeon, Trading Post, Open Field).
- **Audio System:** Web Audio API for synthesized combat sounds and adaptive background music with four BGM tracks.
- **Particle Effects:** CSS-animated particle effects for in-battle actions, canvas-based particles for the title screen, and CSS keyframe animations for UI interactions.
- **World Map:** An RTS-style 2D map with zoom/pan, a centralized layer system, 32 unlockable locations across 5 terrain regions, and a dynamic day/night cycle.
    - **Map Node Menus:** Zone popup menus use `MenuButton` components.
    - **Chat Bubble System:** Comic-style speech bubbles anchored to speaker hero sprites.
    - **Pathfinding:** Heroes use BFS for shortest pathfinding with dynamic footprint marks.
    - **Portal Fast Travel:** Three portal locations provide instant fast travel.
    - **God Fights:** Three endgame God encounters unlock after defeating the Void King.
    - **Void Nexus (Portal Scene):** Endgame hub with 6 interactive nodes (Forge, Enchanter, Vendor, Salvage, Dungeon portals).
    - **Themed Dungeons:** DungeonScene supports 3 themes: default, void, and lava.
    - **Evil Wizard Boss (Malachar the Undying):** Endgame boss with a dedicated sprite sheet and 9 abilities.
    - **Factions:** Crusade (Humans, Barbarians), Legion (Orcs, Undead), Fabled (Elves, Dwarves), each worshiping a specific God.
- **Enemy System:** `createRaceClassEnemy` generates enemies based on race, class, and level. Bosses have unique abilities.
- **Economy:** Reduced gold gain from battles, supplemented by a harvest system.
- **Hero Roster:** Manages multiple heroes with independent progression.
- **Zone Conquer System:** Each zone has a conquer rating impacting XP gain and auto-harvest output.
- **Zone Quest System:** 29 zones each feature 4 optional quests.
- **Gruda Arena:** A standalone challenge mode for simplified turn-based battles.
- **Battle Admin Mode:** Developer tool for pausing battles and adjusting effects.
- **Admin Sprite Editor:** Dev tool for configuring character sprites, projectiles, buffs/effects, weapons, and effect layers.
- **Hotkeys:** In-battle ability activation via 1-5 hotkeys.
- **Tactical Movement UI:** Battle action bar includes row position arrows.
- **Discord OAuth:** `/discordauth` route handles Discord login with CSRF state protection.
- **Discord Webhook Broadcaster:** Admin-authenticated webhook system for sending rich embed messages to a Discord channel.
- **Beta Tester System:** Creates one-time invite links to a Discord channel.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool.
- **Zustand:** State management library.
- **Express:** Backend server.
- **discord.js:** Discord API client library.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game sound effects and music.