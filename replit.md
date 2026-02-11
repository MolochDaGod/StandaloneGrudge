# Grudge Warlords

## Overview
Grudge Warlords is a Final Fantasy 7-inspired turn-based RPG with a dark fantasy aesthetic, built using React, Vite, and Zustand. The project focuses on multi-hero tactical battles, allowing players to create and manage a roster of heroes from 6 races and 4 classes, offering 24 unique Warlord combinations. The game aims to deliver a rich RPG experience with deep character customization, tactical combat, and a compelling progression system.

## User Preferences
I want the agent to use clear and concise language. I prefer iterative development with small, testable changes. Before making any significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all code adheres to modern React practices and maintains a consistent styling approach.

## System Architecture
The application is a React 19 frontend developed with Vite, managing global state via a single Zustand store (`src/stores/gameStore.js`). Styling utilizes inline styles and CSS variables. The application is designed for static deployment.

**UI/UX Decisions:**
- **Typography & Visuals:** Uses Cinzel (headings) and Jost (body) fonts. Visuals include pixel art sprite sheets for characters, particle effects and beam trails for abilities, and a 2D world map with clickable nodes and animated hero movement. War Council tabs have unique generated fantasy background images (tab_stats, tab_gear, tab_abilities, tab_skills, tab_attributes). Hero card sprites in the roster are displayed at 5.6x scale for visual impact.
- **Screen Flow:** The user journey progresses through Title Screen, Character Creation, World Map, Location Views, and Battle Screens, with dedicated UIs for Character Sheets, Skill Trees, and Account management (War Council).
- **Game Frame & Layout:** The entire application is wrapped in a `.game-frame` CSS class, providing a decorative golden border and ensuring proper scaling across devices. A fixed-height action bar (140px) is consistently visible during battle.

**Technical Implementations:**
- **Character System:** Supports 24 unique Warlord combinations from 6 races and 4 classes, each with 8 attributes and a 0-20 level progression system featuring diminishing returns.
- **Battle System:** Multi-unit tactical combat on a 2D plane with speed-based initiative. Players control up to 3 active heroes (6 in roster) against AI enemies. Includes animations for attacks, projectiles, and floating damage numbers.
- **Sprite System:** Employs a `SpriteAnimation` component for 100x100px sprite sheet animations, dynamically scaled for visual consistency. Special handling for Worge transformations.
- **Game Systems:**
    - **Equipment:** An 8-tier equipment upgrade system across 7 slots (weapon, offhand, helmet, armor, feet, ring, relic), with numerous items and a paper-doll gear UI supporting drag-and-drop.
    - **Skill Trees:** Node graph layout with SVG bezier curve connections between dependent skills. Nodes show icon, name, and point progress. Connections glow when unlocked and use dashed lines when locked. Skills with granted abilities display an "ABILITY" badge. Each tier is labeled with level requirements.
    - **Progression:** Includes a training system, an auto-harvesting system for resources, and various status effects. The War Party panel on the world map combines hero management and harvest assignment into a single UI - heroes are shown with role-based coloring (Active/Harvesting/Idle) and harvest nodes are displayed below with assign/recall controls.
    - **Abilities:** Heroes have a customizable 5-slot ability loadout with slot restrictions based on weapon type and class. Each class has unique signature abilities (e.g., Warrior's Invincible, Mage's Mana Shield).
    - **Loot:** Enemies drop tier-based loot, with bosses having increased chances for higher-tier items and consumables.
    - **Consumables:** 6 types of potions (Health, Mana, Stamina, Speed, Cure, Rezzy) available via shop and drops, usable during battle.
    - **Trading:** Camp merchant system for buying/selling equipment with stat-weighted pricing and dynamic inventory generation based on player level.
- **Audio System:** Web Audio API for synthesized combat sounds and adaptive background music.
- **Particle Effects:** CSS-animated particle effects for in-battle actions.
- **World Map:** An RTS-style 2D map with zoom and pan functionality. Uses a centralized layer system (`src/components/mapConstants.js`) with named `MAP_LAYERS` constants for z-index ordering and helper functions (`svgOverlayProps`, `mapNodeStyle`, `mapCenterStyle`, `fullCoverStyle`, `nodeScale`) for consistent positioning. All map elements use `translate(-50%, -50%)` centering with percentage-based coordinates in a 0-100 coordinate space. SVG overlays use `viewBox="0 0 100 100"` with `preserveAspectRatio="none"`. Pathfinding roads use a highlighter-style freeform painting system (hold & drag) with adjustable width. Features 32 unlockable locations (29 zones + 3 God Fight arenas) across 5 terrain regions. Progression follows faction arcs: Starter zones (Lv 1-6) → Crusade Arc (Lv 5-9) → Legion Arc (Lv 8-13) → Fabled Arc (Lv 10-14) → Shadow/Corruption (Lv 11-16) → Convergence (Lv 15-18) → Void Throne (Lv 18-20) → God Fights (Lv 20). Cities are boss-gated: Ironkeep (grand_shaman), Shadowhaven (shadow_beast), Emberpeak (canyon_warlord), Crystal Spire (lich). Boss portals display as circular terrain cutouts using location background images. Interactive elements include hero movement, contextual menus, boss encounters, and hover tooltips. Includes environmental effects (rivers, lava, towers) and a dynamic day/night cycle. AI conversation bubbles provide context-aware dialogue. Random event nodes periodically spawn with various rewards.
    - **Pathfinding:** Heroes walk along the node connection graph (BFS shortest path) when clicking a destination. Uses `buildAdjacency()` to create a graph from `pathConnections` + `cityConnections`, and `findPath()` for BFS routing. Path connections are invisible (no static trail markers) - instead, dynamic footprint marks spawn behind heroes as they walk between nodes, fading out over 3 seconds via CSS animation. Hero sprites are anchored using the hit location as the center point for movement positioning. Movement animates step-by-step through each node with walk sprite animation, camera follow, and direction-aware flipping. Wandering pauses during pathfinding travel.
    - **Environmental Effects:** Lava streams feature multi-layer SVG rendering (dark border, glowing core, bright inner highlight, rising ember particles). Water/rivers have animated flow lines via `stroke-dashoffset` animation, shimmer sparkles, and multi-layer depth. Both use the `editLandmarks` localStorage data.
    - **Portal Fast Travel:** Three portal locations (shadow_citadel, demon_gate, void_throne) feature animated dual-ring archway visuals with pulsing glow borders. Clicking a portal opens a Portal Network menu listing other unlocked portals for instant fast travel, bypassing pathfinding. Teleportation includes a radial gradient transition overlay with spinning portal effect.
    - **Backgrounds:** Day/night versions of trade/city visit backgrounds stored at `/backgrounds/trade_day.png` and `/backgrounds/trade_night.png`.
    - **God Fights:** Three endgame God encounters unlock after defeating the Void King, each gated by faction-arc boss completions: Odin (Crusade: grand_shaman + frost_wyrm), Madra (Legion: shadow_beast + lich), The Omni (Fabled: canyon_warlord + water_elemental). Gods have 1600-2000 HP with 8 abilities each.
    - **Factions:** The Crusade (Humans, Barbarians) worship Odin; The Legion (Orcs, Undead) worship Madra; The Fabled (Elves, Dwarves) worship The Omni.
- **Enemy System:** `createRaceClassEnemy` generates enemies based on race, class, and level, with stat scaling and procedural naming. Bosses have unique abilities.
- **Hero Roster:** Allows managing multiple heroes with independent progression and equipment. Per-hero battle records track wins, losses, and boss kills.
    - **Character Review:** The Gear tab in the War Council doubles as a comprehensive character review hub, displaying below the equipment panels: Warlord Profile (class, race, level, power, build rank/rating), Combat Record (wins, losses, win rate, boss kills), Equipped Gear summary with stats, Core Stats, Ability Loadout visualization, Skills progression, Attribute Spread bars, and Racial Traits.
- **Zone Conquer System:** Each zone has a conquer rating (0-100%) that impacts XP gain and auto-harvest output. Conquered zones display an idle worker sprite.
- **Zone Quest System:** 29 zones each feature 4 optional quests (e.g., kill count, flawless wins, boss kills, conquer percentage) providing gold, XP, and conquer bonuses.
- **Gruda Arena:** A standalone challenge mode (`public/api/play/gruda.html`) for simplified turn-based battles. Supports hero sharing via URL parameters or share codes, encoding full hero builds into compact, URL-safe tokens. Includes OG meta tags for social media previews.
- **Battle Admin Mode:** A developer tool (accessible via `~`) for pausing battles and visually adjusting/copying battle effect parameters.
- **Admin Sprite Editor:** Comprehensive dev tool (`/adminsprite`) with 5 tabs: Characters (sprite preview, layout markers, effect/beam config), Projectiles (11 projectile sprites including animated fire/water arrows), Buffs & Effects (15 buff/debuff visuals with category coloring), Weapons (14 weapon types with projectile and trail assignments), and Effect Layers (stackable multi-effect system with per-layer delay, duration, scale, opacity, filter controls, timeline visualization, 6 presets, and play preview). This is the central hub for configuring how sprites appear on map and in battles.
- **Hotkeys:** In-battle ability activation via 1-5 hotkeys.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool.
- **Zustand:** State management library.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game sound effects and music.