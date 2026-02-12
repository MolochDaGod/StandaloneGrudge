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
- **Game UI Overlay System:** A full-screen transparent layer (`#game-ui-overlay`) covers the game, with interactive panels receiving clicks via `.ui-element` class. Three bottom-aligned panels use image-based backgrounds.
- **Map Bottom Bar (MapBottomBar.jsx):** Renders inside `#game-ui-overlay`. Three panels use actual art assets as backgrounds: left chat panel (`/ui/chat-background.png`, 282×174), center hotbar (`/ui/hotbar-background.png`, 716×174 with 8 icon buttons positioned over the 10 painted slots via percentage-based flex layout), right War Party (`/ui/bar-background.png`, 282×174 with 3 popup tab buttons above). War Party panel features 32px animated sprite circles, BarRow HP/MP/SP/Grudge bars, Level badge + class icon + race icon row per hero, and left-click hero selection with accent highlight. Popups (Harvest, Gear, Character) use `.panel-style` and absolute positioning.

**Technical Implementations:**
- **Character System:** Supports 24 unique Warlord combinations across 6 races and 4 classes, with 8 attributes and a 0-20 level progression.
- **Battle System:** Multi-unit tactical combat on a 2D plane with speed-based initiative, supporting up to 3 active heroes against AI enemies. Includes context-aware damage number animations and screen shake effects.
- **Sprite System:** Employs a `SpriteAnimation` component for sprite sheet animations, with dynamic scaling, transformations, and per-slot equipment hue overlays. Specific enemy and elite warrior sprites are implemented.
- **Pixel Art UI Bars:** `MiniBar` component uses pixel art RPG-styled health/mana/stamina bars with various visual effects and color presets.
- **Custom VFX Effects:** 14 high-quality custom effect sprite sheets are wired into all class and enemy abilities, buffs, and weapon skills.
- **Icon System:** A comprehensive sprite-based icon system (`ICON_REGISTRY`) with 80+ pixel art icons is used throughout the UI.
- **Game Systems:**
    - **Equipment:** An 8-tier upgrade system across 7 slots, with a pixel art paper-doll inventory UI (`InventoryModal` component). Split-pane book layout with parchment aesthetic: left panel shows character sprite surrounded by 7 equipment slots (helmet, armor, weapon, offhand, feet, ring, relic), right panel has 4x4 inventory grid with pagination. Supports drag-and-drop equip, right-click auto-equip/unequip, and hover stat tooltips. Uses extracted assets from pixel art sprite sheet.
    - **Skill Trees:** Node graph layout with SVG bezier curves.
    - **Progression:** Includes training, auto-harvesting, and status effects.
    - **Abilities:** Customizable 5-slot ability loadouts.
    - **Loot:** Tier-based loot drops from enemies.
    - **Consumables:** 6 types of potions available.
    - **Trading:** Camp merchant system for buying/selling equipment.
    - **Scene System:** 4 interactive scene views accessible from the world map (Camp, Dungeon, Trading Post, Open Field).
- **Audio System:** Web Audio API for synthesized combat sounds and file-based background music. 7 BGM tracks: intro (youth_thinker.mp3), map/ambient (bgm_harukaze.ogg), camp (bgm_camping.ogg), tavern/trading post (bgm_tavern.ogg), scene/general (elevate_your_mind.mp3), battle (synthesized), dungeon (synthesized battle). `setBgm(type)` accepts: 'intro', 'ambient'/'map', 'camp', 'tavern', 'scene', 'battle', 'dungeon'.
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
- **Enemy System:** `createRaceClassEnemy` generates enemies based on race, class, and level. Bosses have unique abilities. Desert enemy pack includes Sand Viper, Desert Hyena, Giant Scorpion, Carrion Vulture, Ancient Mummy, and Risen Corpse (48x48 pixel art sprites with idle/walk/attack/hurt/death animations).
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
- **Discord Webhook Broadcaster:** Admin-authenticated webhook system for sending rich embed messages to a Discord channel. Automatic gameplay broadcasts: arena team submissions, 3-loss relegation events, and 5-win streak milestones are posted to Discord via webhook.
- **Beta Tester System:** Creates one-time invite links to a Discord channel.
- **GRUDA PvP Arena:** Comprehensive ranked PvP system. Players submit team snapshots via the GRUDA button (WorldMap) or directly at `/arena.html`. Teams are posted to a ranked lobby via 6 API endpoints (`/api/arena/submit`, `/api/arena/lobby`, `/api/arena/team/:id`, `/api/arena/battle/result`, `/api/arena/rewards/:id`, `/api/arena/stats`). Other players challenge posted teams (AI-controlled opponents). 3-loss relegation demotes teams from Ranked to Unranked. Rewards include gold (50 + avgLevel*10 + wins*5), resources (10 + avgLevel*2), and equipment drops every 5 wins. Standalone arena.html is self-contained for external hosting on grudgewarlords.com/arena and grudgestudio.com/arena. Uses in-memory Map storage (arenaTeams, arenaBattles) with server-generated UUIDs and SHA-256 snapshot hashing. Arena routes are implemented in both `server.js` (dev) and `server.prod.js` (production).

- **Production Database:** PostgreSQL via `GRUDGE_ACCOUNT_DB` connection string (external Neon DB). Connection module at `src/server/db.js`, routes at `src/server/dbRoutes.js`. 5 tables: accounts, characters, inventory_items, crafted_items, islands. All DB API routes require `x-api-key` header matching `GAME_API_GRUDA`. Bulk save/load endpoints: `POST /api/db/save-game` and `GET /api/db/load-game?discord_id=`. CRUD endpoints for each table under `/api/db/accounts`, `/api/db/characters`, `/api/db/inventory`, `/api/db/crafted`, `/api/db/islands`.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool.
- **Zustand:** State management library.
- **Express:** Backend server.
- **discord.js:** Discord API client library.
- **pg:** PostgreSQL client library for Node.js.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game sound effects and music.

## Admin Tools
- **Admin Dashboard (`/admin`):** Central hub linking all admin tools with game system info, player/hero data viewer, world progress tracker, and game systems reference. All admin pages link back here.
- **Admin UI Layout Editor (`/adminui`):** Visual drag-and-drop editor for positioning, sizing, and locking UI elements across game screens (world, battle, scene). Saves layouts to localStorage via `src/utils/uiLayoutConfig.js`. Game components read saved configs via `getElementStyle()` (for top-level elements) and `getChildElementStyle()` (for child elements positioned relative to a parent). Supports export/import of layout JSON.
- **Admin Sprite Editor (`/adminsprite`):** Dev tool for configuring character sprites, projectiles, buffs/effects, weapons, and effect layers.
- **Admin Map (`/adminmap`):** Dev tool for map configuration.
- **Admin Battle (`/adminbattle`):** Dev tool for battle testing.
- **Admin Icon Manager (`/adminicons`):** Browse all game icons organized by category (Actions, Abilities, Skills, Equipment, Potions, Weapons, Resources, Misc). Drag-and-drop PNG upload to override any icon (stored in localStorage). Sprite sheet viewers for RPG 16x16 icons and Crafting Materials with click-to-copy coordinates.
- **Admin Gizmo:** In-game DOM element inspector with drag/resize (toggled via gear button).

## UI Component Library
- **OrnatePanel (`src/components/OrnatePanel.jsx`):** Reusable CSS-only ornate panel with dark leather background, gold borders, SVG corner filigree with red gem accents. Used for bottom bar panels (chat, hotbar, war party). Also exports `OrnateSlot` for styled hotbar slots.

## Asset Directories
- `public/sprites/bosses/` - Forest boss sprite sheets (3 bosses, 96x96 frames, animations: Idle, Walk, Attack1-4, Death, Hurt, Special, Projectile)
- `public/icons/rpg16/` - 16x16 RPG icon sprite sheets (armours, books, chests, consumables, potions, weapons)
- `public/icons/materials/` - 24x24 crafting material icon sprite sheets (resources_basic, various color variants)