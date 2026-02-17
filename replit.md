# Grudge Warlords

## Overview
Grudge Warlords is a Final Fantasy 7-inspired turn-based RPG set in a dark fantasy world. It features multi-hero tactical battles where players build and manage a roster of heroes from 6 races and 4 classes, resulting in 24 unique Warlord combinations. The project aims to deliver a rich RPG experience with deep character customization, tactical combat, a compelling progression system, a comprehensive ranked PvP system (GRUDA Arena), and an engaging endgame including God fights and themed dungeons. The business vision is to create a highly replayable and competitive RPG with a strong community focus.

## User Preferences
I want the agent to use clear and concise language. I prefer iterative development with small, testable changes. Before making any significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all code adheres to modern React practices and maintains a consistent styling approach.

## System Architecture
The application uses a React 19 frontend with Vite and a unified Express backend (`server.js`) handling Discord OAuth, API routes, and production static serving. State management is managed by a single Zustand store. Styling is implemented using inline styles and CSS variables. The system is designed for `vm` deployment, requiring a persistent process for the Discord bot. The `server.js` auto-detects `NODE_ENV` for development (port 3001 proxied by Vite on 5000) or production (port 5000 serving built assets).

**UI/UX Decisions:**
- **Typography & Visuals:** Uses Cinzel (headings), Jost (body), and LifeCraft (Warcraft-style) fonts. Visuals incorporate pixel art sprites, particle/beam effects, a 2D world map with interactive nodes, and animated hero movement. Character cards feature race-specific backgrounds.
- **Screen Flow:** Standard RPG progression: Title → Intro → Lobby → Character Creation → World Map → Locations → Battle.
- **Game Frame & Layout:** Content fills the entire viewport within a `.game-frame` container, with no border frame overlay.
- **Z-Index Layer System:** A two-context architecture separates content (z-index 10501) from overlays (higher z-indices).
- **Game UI Overlay System:** A full-screen transparent overlay (`#game-ui-overlay`) hosts interactive panels, including three bottom-aligned panels (chat, hotbar, war party) with image-based backgrounds and intricate layouts for hero stats and buttons.
- **Custom Cursor:** A pixel art Dwarven gauntlet cursor (`/sprites/ui/cursor_gauntlet.png`).

**Technical Implementations:**
- **Character System:** Supports 24 Warlord combinations with 8 attributes and 0-20 level progression.
- **Battle System:** Multi-unit tactical combat on a 2D plane with speed-based initiative, supporting up to 3 active heroes against AI. Features context-aware damage numbers, screen shake, and AoE abilities with staggered visual effects.
- **Sprite System:** `SpriteAnimation` component handles sprite sheet animations with dynamic scaling, transformations, hue overlays for equipment, and fallback animations. All sprites scale to a 200px base height, then adjusted by `getRaceHeightScale` for proportional heights. A `namedHeroes` registry supports unique hero sprite overrides.
- **Hero Slideshow (LobbyScreen):** Displays all 24 race/class combinations with unique animations, VFX, and lore.
- **Pixel Art UI Bars:** `PixelBar` component renders sprite-based bars for HP, Mana, Stamina, Grudge, Action Timer, and XP.
- **Custom VFX Effects:** 14 high-quality custom effect sprite sheets for abilities.
- **Icon System:** Comprehensive sprite-based `ICON_REGISTRY` with 80+ pixel art icons.
- **Game Systems:**
    - **Equipment:** 8-tier upgrade system across 7 slots with a pixel art paper-doll inventory UI (`InventoryModal`) and drag-and-drop. Tier scaling uses a multiplicative + additive formula, with `DISPLAY_STAT_MAP` for UI labels.
    - **Skill Trees:** Node graph layout using SVG bezier curves.
    - **Progression:** Training, auto-harvesting, status effects.
    - **Abilities:** Customizable 5-slot ability loadouts.
    - **Loot:** Tier-based drops.
    - **Consumables:** 6 potion types.
    - **Trading:** Camp merchant system.
    - **Scene System:** 5 interactive scene views (Camp, Dungeon, Trading Post, Open Field, Portal/Void Nexus) with WASD movement and 'E' for interaction. Each scene has unique AI ambient flavor.
- **Audio System:** Web Audio API for synthesized combat sounds, file-based SFX, and 7 background music tracks, with audio caching for performance.
- **Particle Effects:** CSS-animated in-battle particles, canvas-based title screen particles, and CSS keyframe animations for UI.
- **World Map:** RTS-style 2D map with zoom/pan, 32 unlockable locations across 5 terrain regions, dynamic day/night cycle, BFS pathfinding, portal fast travel, and god fights.
- **Enemy System:** `createRaceClassEnemy` for dynamic enemy generation, including unique boss abilities and themed enemy packs.
- **Economy:** Gold gain supplemented by a harvest system with `Shock Sweepers` for passive harvesting. Wandering Merchant for rare items.
- **Hero Roster:** Manages multiple heroes with independent progression.
- **Zone Conquer System:** Impacts XP gain and auto-harvest.
- **Zone Quest System:** 29 zones each with 4 optional quests.
- **Gruda Arena:** A standalone challenge mode for simplified turn-based battles.
- **Discord Integration:** Discord OAuth for login, auto-join guild, and a Discord bot (`src/server/discordBot.js`) with 7 slash commands. Uses a DB-backed session system and Discord Webhook Broadcaster for gameplay updates.
- **Server-Side Game Persistence:** `game_saves` table stores full game state as JSONB per Discord user via `POST /api/game/save` and `GET /api/game/load`. Auto-save triggers on screen transitions and key state changes. Cloud saves load automatically on Discord login.
- **Route Guards:** `guardScreen()` in App.jsx validates game state requirements before screen navigation.
- **GRUDA PvP Arena:** Ranked PvP system with team snapshots, AI-controlled challenges, and rewards. Uses PostgreSQL `arena_teams` and `arena_battles` tables. Leaderboard API at `/api/arena/leaderboard` with `GrudaLeaderboard.jsx` UI and `RankBadge.jsx` component for 6 tiers.
- **UI Sprite Sheet:** `pixel_ui_pack.png` provides assets for UI elements, including `PixelBar.jsx`.
- **Named Hero System:** `namedHeroes` registry maps hero IDs to custom sprite data. Unlocking named heroes (e.g., Racalvin the Pirate King) triggers cinematic videos.
- **Class Selection UI:** Redesigned full-width horizontal cards with animated sprites, class icon emblems, colored attribute stat bars, shimmer animation, and class-colored Continue button.
- **Lore Heroes Database:** `src/data/loreHeroes.txt` contains comprehensive world lore, gods, factions, and named lore heroes.
- **Game Compendium:** `public/compendium.html` provides a static HTML page indexing all game data (characters, world map, enemies, equipment, attributes, combat math, named heroes, factions) with search/filter.
- **Hero Codex:** `public/hero-codex.html` is a static visual reference for all 26 playable heroes, with stat references, archetypes, faction cards, and secret hero reveals.
- **War Room Cards:** 4-card layout (New Campaign, Save/Continue, Grudge Online info, Web3 Wallet placeholder) with background images and hover effects.
- **Grudge Online Compendium:** `GrudgeOnlinePage.jsx` full-screen overlay with 6 tabs (Overview, Races, Classes, Attributes, Combat Math, Tips).
- **Admin Tools:** Unified Admin Hub at `/admin` with tabbed navigation embedding 7 editors (Map, Battle, Sprite, UI Layout, Icon Manager, PvP Placement, Sprite Forge) and info tabs. `adminConfig.js` manages localStorage persistence. Includes an in-game Gizmo for DOM inspection.
- **Sprite Forge (AdminMaker):** Knowledge base documenting sprite creation insights, workflows, and rules.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool.
- **Zustand:** State management library.
- **Express:** Backend server.
- **discord.js:** Discord API client library.
- **pg:** PostgreSQL client library for Node.js.
- **Google Fonts:** For Cinzel and Jost fonts.
- **CDNFonts CDN:** For LifeCraft font.
- **Web Audio API:** For in-game sound effects and music.
- **Neon DB:** External PostgreSQL database (via `GRUDGE_ACCOUNT_DB`).