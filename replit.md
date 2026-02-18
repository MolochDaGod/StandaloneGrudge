# Grudge Warlords

## Overview
Grudge Warlords is a Final Fantasy 7-inspired turn-based RPG with a dark fantasy aesthetic. It features multi-hero tactical battles, allowing players to create and manage a roster of heroes from 6 races and 4 classes, offering 24 unique Warlord combinations (+ 2 secret heroes). The project delivers a rich RPG experience with deep character customization, tactical combat, and a compelling progression system, including a comprehensive ranked PvP system (GRUDA Arena) and an engaging endgame with God fights, roaming dragon world bosses, and themed dungeons.

## User Preferences
- Clear and concise language. Iterative development with small, testable changes.
- Ask for approval before significant architectural changes or adding new external dependencies.
- All code adheres to modern React practices and maintains a consistent styling approach.
- Use the Grudge attribute system (8 attributes: Strength, Vitality, Endurance, Dexterity, Agility, Intellect, Wisdom, Tactics) — no other stat naming conventions.

## System Architecture
The application is a React 19 frontend developed with Vite, with a unified Express backend (`server.js`) for Discord OAuth, API routes, and production static serving. State management uses a single Zustand store (`src/stores/gameStore.js`). Styling utilizes inline styles and CSS variables. Deployment uses `vm` target (Discord bot requires persistent process). Single `server.js` auto-detects mode via `NODE_ENV`: dev mode runs on port 3001 (proxied through Vite on 5000), production runs on port 5000 serving built assets from `dist/`. Build: `npm run build` (Vite), Start: `npm run start` (NODE_ENV=production node server.js).

**Attribute System (8 Grudge Attributes):**
- Strength (STR) — Physical damage, defense, health, lifesteal, block chance
- Vitality (VIT) — Max health, health regen, damage reduction, bleed resistance
- Endurance (END) — Stamina, physical defense, block effectiveness, armor, CC resistance
- Dexterity (DEX) — Crit chance, attack speed, accuracy, evasion, crit damage
- Agility (AGI) — Movement speed, evasion, dodge, crit evasion
- Intellect (INT) — Mana, magic damage, cooldown reduction, spell accuracy
- Wisdom (WIS) — Magic resistance, mana, spell block, status effect reduction
- Tactics (TAC) — Armor penetration, block penetration, defense break, % bonus to all stats
- Defined in `src/data/attributes.js` with diminishing returns formula (25/50 breakpoints)
- 35+ derived battle stats (health, mana, physicalDamage, magicDamage, defense, criticalChance, etc.)
- Build classification system: Legendary → Warlord → Epic → Hero → Normal (shared `CLASS_TIERS` from `src/data/classes.js`)

**UI/UX Decisions:**
- **Typography & Visuals:** Uses Cinzel (headings), Jost (body), and LifeCraft (Warcraft-style) fonts. Visuals include pixel art sprites, particle and beam effects, a 2D world map with clickable nodes, and animated hero movement. Character cards use race-specific background images.
- **Screen Flow:** Standard RPG progression: Title → Intro → Lobby → Character Creation → World Map → Locations → Battle.
- **Game Frame & Layout:** Wrapped in a `.game-frame` container with full-width/height layout. Content fills entire viewport. Frame inset CSS variables set to 0.
- **Z-Index Layer System:** A two-context architecture separates content (z-index 10501) from overlays (higher z-indices).
- **Game UI Overlay System:** Full-screen transparent overlay (`#game-ui-overlay`) for interactive panels. Three bottom-aligned panels (chat, hotbar, war party) use image-based backgrounds.
- **Custom Cursor:** A Dwarven gauntlet pixel art cursor (`/sprites/ui/cursor_gauntlet.png`).

**Technical Implementations:**
- **Character System:** 24 Warlord combinations (6 races × 4 classes) + 2 secret heroes. 8 attributes with 0-20 level progression. Race bonuses + class starting attributes combine for base stats.
- **Battle System:** Multi-unit tactical combat on a 2D plane with speed-based initiative (up to 3 heroes vs AI enemies). Context-aware damage numbers, screen shake, AoE abilities with staggered VFX. Row-based positioning system (`src/data/battleRows.js`) with front/back row modifiers.
- **Sprite System:** `SpriteAnimation` component for sprite sheet animations with dynamic scaling, transformations, hue overlays, and fallback animations. All sprites scaled to uniform 200px display height.
- **VFX System:** 20+ custom effect sprite sheets including fire magic, explosions, and impact effects. Class-specific VFX overrides in `abilityVFXMap` (e.g., druid's Nature's Wrath uses different effects than enemy version).
- **Hero Slideshow (LobbyScreen):** Presents all 24 race/class combinations with unique animations, VFX, faction/class icons, titles, lore, and slogans.
- **Pixel Art UI Bars:** `PixelBar` component renders sprite-based bars (HP, Mana, Stamina, Grudge, Action Timer, XP).
- **Icon System:** Comprehensive sprite-based `ICON_REGISTRY` with 80+ pixel art icons (defined in `src/data/uiSprites.jsx`).
- **Game Systems:**
    - **Equipment:** 8-tier upgrade system across 7 slots with pixel art paper-doll inventory UI (`InventoryModal`). Tier scaling: `base * mult + flat`. Multipliers: T1=1.0x to T8=45.0x. `scaleStat`/`scaleItemStats` centralize calculations.
    - **Skill Trees:** Node graph layout with SVG bezier curves.
    - **Progression:** Training, auto-harvesting, status effects.
    - **Abilities:** Customizable 5-slot ability loadouts per hero.
    - **Loot:** Tier-based drops.
    - **Consumables:** 6 potion types.
    - **Trading:** Camp merchant system + Wandering Merchant NPC.
    - **Scene System:** 5 interactive scene views (Camp, Dungeon, Trading Post, Open Field, Portal/Void Nexus). WASD movement + E to interact via `useWASD` hook. Proximity detection with "Press E" prompts.
- **Audio System:** Web Audio API for synthesized combat sounds, file-based attack SFX, and 7 background music tracks. Audio caching via sfxCache.
- **World Map:** RTS-style 2D map with zoom/pan, 32 unlockable locations across 5 terrain regions, dynamic day/night cycle. BFS pathfinding, portal fast travel, god fights.
- **Roaming Dragon World Boss System:** 2 red dragons (Ignaroth, Vyraxes) roam volcanic zones, move every 30s. Click or arrive to trigger encounters. Buffed stats (1.5x HP, 1.2x damage/defense). Defeating both unlocks Mother's Den (white dragon boss).
- **Region Walk-In Cutscenes:** 5 cinematic cutscenes for first-time region entry (Verdant Wilds, Frozen Peaks, Ashenmoor, Scorched Lands, Shadow Realm). Heroes walk in, pause, then march toward destination with depth perspective. Uses actual hero roster sprites. (`src/data/regionWalkData.js`, `src/components/RegionWalkCutscene.jsx`)
- **Zone Cutscene System:** First-visit story cutscenes for all 32 zones (`src/data/zoneCutscenes.js`, `src/components/ZoneCutscene.jsx`). Typewriter effect, LifeCraft gradient title, cinematic fades. Chains after region walk cutscenes.
- **Enemy System:** `createRaceClassEnemy` for dynamic enemy generation. Unique boss abilities and themed enemy packs.
- **Economy:** Battle gold + harvest system. Shock Sweepers at 100% conquest. Wandering Merchant with rare items.
- **Hero Roster:** Multiple heroes with independent progression.
- **Zone Conquer/Quest System:** 29 zones × 4 optional quests each.
- **Gruda Arena:** Standalone challenge mode for simplified turn-based battles.
- **Discord Integration:** Discord OAuth (guilds.join scope). Discord bot (`src/server/discordBot.js`) with 7 slash commands. Session token system. Webhook Broadcaster for gameplay events. Invite: `https://discord.gg/KmAC5aXs84`.
- **GRUDA PvP Arena:** Ranked PvP with team snapshots, AI-controlled opponents, PostgreSQL persistence (`arena_teams`, `arena_battles`). Leaderboard API + `GrudaLeaderboard.jsx` UI.
- **Rank Badge System:** `RankBadge.jsx` with 6 tiers (Bronze→Diamond→Legend). SVG star badges with tier-colored glows.
- **Named Hero System:** `namedHeroes` registry in `spriteMap.js`. First named hero: Racalvin the Pirate King (secret Barbarian Worge unlock). Cinematic unlock video. 5% title screen parade spawn chance.
- **Admin Dashboard:** Unified Admin Hub at `/admin` with tabbed navigation: Overview, Heroes (24 combo cards with per-card animation selection, 8 Grudge attribute display), World (zone progress), Systems, plus 7 editors (Map, Battle, Sprite, UI Layout, Icon Manager, PvP Placement, Sprite Forge). Admin Backgrounds editor. In-game Gizmo for DOM inspection.
- **Game Compendium:** Static HTML at `public/compendium.html` — 8 tabbed sections covering all game data.
- **Hero Codex:** Static HTML at `public/hero-codex.html` — visual reference for all 26 playable heroes.
- **Grudge Online Compendium:** `GrudgeOnlinePage.jsx` with 6 tabs (Overview, Races, Classes, Attributes, Combat Math, Tips).

## Key Data Files
- `src/data/attributes.js` — 8 attribute definitions, derived stat formulas, build classification (imports CLASS_TIERS from classes.js)
- `src/data/classes.js` — 4 class definitions (Warrior, Mage, Druid, Ranger) + CLASS_TIERS
- `src/data/races.js` — 6 race definitions (Human, Elf, Orc, Gnome, Worge, Dwarf) with bonuses
- `src/data/enemies.js` — Enemy templates, locations (32 zones), zone enemy presets
- `src/data/spriteMap.js` — All sprite sheets, enemy sprites, VFX maps, NPC sprites, named heroes
- `src/data/equipment.js` — Equipment slots, tiers, weapon/armor templates, stat scaling
- `src/data/worldMapData.js` — World map node positions and connections
- `src/data/zoneCutscenes.js` — Story cutscene data for all 32 zones
- `src/data/regionWalkData.js` — Region walk-in animation data for 5 terrain regions
- `src/data/battleRows.js` — Row-based positioning system (front/back row modifiers)
- `src/data/uiSprites.jsx` — UI sprite sheet definitions, ICON_REGISTRY, InlineIcon component
- `src/stores/gameStore.js` — Central Zustand store with all game state and logic

## External Dependencies
- **React 19** — Frontend library
- **Vite** — Development server and build tool
- **Zustand** — State management
- **Express** — Backend server
- **discord.js v14** — Discord API client
- **pg** — PostgreSQL client (Neon DB via `GRUDGE_ACCOUNT_DB`)
- **Google Fonts** — Cinzel and Jost
- **CDNFonts CDN** — LifeCraft font
- **Web Audio API** — Sound effects and music

## Recent Changes (February 2026)
- Fixed admin dashboard to use correct Grudge attribute system (STR/VIT/END/DEX/AGI/INT/WIS/TAC) instead of placeholder stats
- Added per-card animation selection to admin Characters tab (ComboCard component)
- Removed duplicate CLASS_TIERS from attributes.js (now imports from classes.js)
- Normalized all uiSprites import paths across components
- Added roaming dragon world boss system with 2 dragons + Mother's Den unlock
- Added region walk-in cutscenes for 5 terrain regions
- Added 20+ VFX impact effect sprite sheets
- Completed zone cutscene system for all 32 zones
