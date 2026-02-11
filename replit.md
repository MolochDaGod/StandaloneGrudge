# Grudge Warlords

## Overview
Grudge Warlords is a Final Fantasy 7-inspired turn-based RPG with a dark fantasy aesthetic, built using React, Vite, and Zustand. It features multi-hero tactical battles, allowing players to create and manage a roster of heroes from 6 races and 4 classes, offering 24 unique Warlord combinations. The project aims to deliver a rich RPG experience with deep character customization, tactical combat, and a compelling progression system.

## User Preferences
I want the agent to use clear and concise language. I prefer iterative development with small, testable changes. Before making any significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all code adheres to modern React practices and maintains a consistent styling approach.

## System Architecture
The application is a React 19 frontend developed with Vite, managing global state via a single Zustand store. Styling utilizes inline styles and CSS variables, designed for static deployment.

**UI/UX Decisions:**
- **Typography & Visuals:** Uses Cinzel (headings) and Jost (body) fonts. Visuals include pixel art sprites, particle and beam effects, a 2D world map with clickable nodes, and animated hero movement. War Council tabs feature unique fantasy backgrounds, and hero card sprites are scaled for visual impact.
- **Screen Flow:** The user journey progresses through Title Screen (Grudge Studio branding, Guest/Discord login) → Game Lobby (War Room with continue/new game, Characters, Account, Discord, Credits tabs) → Character Creation → World Map → Location Views → Battle Screens, with dedicated UIs for character management.
- **Game Frame & Layout:** The application is wrapped in a `.game-frame` class for a decorative border and scaling. A fixed-height action bar is consistent during battle.

**Technical Implementations:**
- **Character System:** Supports 24 unique Warlord combinations across 6 races and 4 classes, with 8 attributes and a 0-20 level progression.
- **Battle System:** Multi-unit tactical combat on a 2D plane with speed-based initiative, supporting up to 3 active heroes against AI enemies. Includes animations for combat actions and damage numbers.
- **Sprite System:** Employs a `SpriteAnimation` component for 100x100px sprite sheet animations, with dynamic scaling, special handling for transformations, and per-slot equipment hue overlays (weapon/helmet/armor/feet regions with tier-based color, pulse, and shimmer effects).
- **Icon System:** Comprehensive sprite-based icon system (ICON_REGISTRY in uiSprites.jsx) with 80+ pixel art icons. All emojis replaced with InlineIcon/SpriteIcon components. Icons stored in public/sprites/ui/icons/ and public/icons/. Equipment, abilities, skills, HUD elements, harvest nodes, and battle log all use consistent sprite icons.
- **Game Systems:**
    - **Equipment:** An 8-tier equipment upgrade system across 7 slots, with a paper-doll UI supporting drag-and-drop.
    - **Skill Trees:** Node graph layout with SVG bezier curves, displaying icons, names, and point progress.
    - **Progression:** Includes training, auto-harvesting, and status effects. A War Party panel on the world map manages hero assignments to harvest nodes.
    - **Abilities:** Customizable 5-slot ability loadouts with class and weapon restrictions.
    - **Loot:** Tier-based loot drops from enemies, with bosses having higher chances for rare items.
    - **Consumables:** 6 types of potions available via shops and drops, usable in battle.
    - **Trading:** Camp merchant system for buying/selling equipment with dynamic inventory.
    - **Scene System:** 4 interactive scene views accessible from the world map (Camp, Dungeon, Trading Post, Open Field) with unique functionalities and background images.
- **Audio System:** Web Audio API for synthesized combat sounds and adaptive background music. Four BGM tracks: intro (Title/Lobby MP3), ambient (World Map synth), battle (combat synth), and scene (cities/locations/dungeons MP3 - "Elevate Your Mind"). Music capped at 0.45 volume, respects mute/volume settings.
- **Particle Effects:** CSS-animated particle effects for in-battle actions.
- **World Map:** An RTS-style 2D map with zoom/pan. Uses a centralized layer system for z-index ordering and coordinate management. Features 32 unlockable locations across 5 terrain regions, following faction-based progression arcs. Includes environmental effects (rivers, lava) and a dynamic day/night cycle.
    - **Map Node Menus:** Zone popup menus use `MenuButton` components with image icons, Cinzel font, gradient backgrounds, and keyboard shortcuts.
    - **Chat Bubble System:** Physics-based AI conversation bubbles on the world map with collision resolution, floating animation, and hover-triggered quick responses linked to game actions.
    - **Pathfinding:** Heroes walk along a node connection graph using BFS for shortest path, with dynamic footprint marks.
    - **Portal Fast Travel:** Three portal locations with animated visuals provide instant fast travel between unlocked portals.
    - **God Fights:** Three endgame God encounters unlock after defeating the Void King, each gated by faction-arc boss completions.
    - **Void Nexus (Portal Scene):** Endgame hub accessible at level 15+ via Nexus button in world map HUD. Contains 6 interactive nodes: Void Forge (equipment upgrading), Arcane Enchanter (enchant heroes using resources for stat bonuses via enchantBonuses), Soul Vendor (high-tier shop), Salvage Pit (break items for gold + resources), and two dungeon portals (Void Rift, Infernal Gate). Uses portal_arena.png background.
    - **Themed Dungeons:** DungeonScene supports 3 themes: default (5 nodes, scene_dungeon.png), void (6 nodes, purple_dungeon.png), lava (6 nodes, lava_dungeon_path.png). Lava dungeon boss triggers BossWalkupScene cinematic before Evil Wizard fight.
    - **Evil Wizard Boss (Malachar the Undying):** Endgame boss with dedicated sprite sheet (evil-wizard/), 9 abilities including Chaos Storm, Soul Siphon, Hellfire Rain, Petrify, and Dark Empowerment. Spawned via startBossBattle('evil_wizard') from BossWalkupScene.
    - **Factions:** Crusade (Humans, Barbarians), Legion (Orcs, Undead), Fabled (Elves, Dwarves), each worshiping a specific God.
- **Enemy System:** `createRaceClassEnemy` generates enemies based on race, class, and level, with stat scaling and procedural naming. Bosses have unique abilities. Monster sprite pack provides dedicated enemy sprites with various animations.
- **Economy:** Gold gain from battles is reduced, and a harvest system allows heroes to be assigned to resource nodes.
- **Hero Roster:** Manages multiple heroes with independent progression, equipment, and battle records. A comprehensive character review hub (Gear tab) displays detailed hero information.
- **Zone Conquer System:** Each zone has a conquer rating impacting XP gain and auto-harvest output.
- **Zone Quest System:** 29 zones each feature 4 optional quests providing gold, XP, and conquer bonuses.
- **Gruda Arena:** A standalone challenge mode for simplified turn-based battles, supporting hero sharing via URL parameters or share codes.
- **Battle Admin Mode:** Developer tool for pausing battles and adjusting effects.
- **Admin Sprite Editor:** Comprehensive dev tool for configuring character sprites, projectiles, buffs/effects, weapons, and effect layers.
- **Hotkeys:** In-battle ability activation via 1-5 hotkeys.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool.
- **Zustand:** State management library.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game sound effects and music.