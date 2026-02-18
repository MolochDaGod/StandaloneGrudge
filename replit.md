# Grudge Warlords

## Overview
Grudge Warlords is a Final Fantasy 7-inspired turn-based RPG with a dark fantasy aesthetic. It features multi-hero tactical battles, allowing players to create and manage a roster of heroes from 6 races and 4 classes, offering 24 unique Warlord combinations. The project aims to deliver a rich RPG experience with deep character customization, tactical combat, and a compelling progression system, including a comprehensive ranked PvP system (GRUDA Arena) and an engaging endgame with God fights and themed dungeons.

## User Preferences
I want the agent to use clear and concise language. I prefer iterative development with small, testable changes. Before making any significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all code adheres to modern React practices and maintains a consistent styling approach.

## System Architecture
The application is a React 19 frontend developed with Vite, with a unified Express backend (`server.js`) for Discord OAuth, API routes, and production static serving. State management uses a single Zustand store. Styling utilizes inline styles and CSS variables. Deployment uses `vm` target (Discord bot requires persistent process). Single `server.js` auto-detects mode via `NODE_ENV`: dev mode runs on port 3001 (proxied through Vite on 5000), production runs on port 5000 serving built assets from `dist/`. Build: `npm run build` (Vite), Start: `npm run start` (NODE_ENV=production node server.js).

**UI/UX Decisions:**
- **Typography & Visuals:** Uses Cinzel (headings), Jost (body), and LifeCraft (Warcraft-style) fonts. Visuals include pixel art sprites, particle and beam effects, a 2D world map with clickable nodes, and animated hero movement. Character cards use race-specific background images.
- **Screen Flow:** Standard RPG progression: Title → Intro → Lobby → Character Creation → World Map → Locations → Battle.
- **Game Frame & Layout:** Wrapped in a `.game-frame` container with full-width/height layout. No border frame overlay (removed). Content fills entire viewport. Frame inset CSS variables set to 0.
- **Z-Index Layer System:** A two-context architecture separates content (z-index 10501) from overlays (higher z-indices).
- **Game UI Overlay System:** Full-screen transparent overlay (`#game-ui-overlay`) for interactive panels. Three bottom-aligned panels (chat, hotbar, war party) use image-based backgrounds and intricate layouts for elements like hero health/mana bars and interactive buttons.
- **Custom Cursor:** A Dwarven gauntlet pixel art cursor (`/sprites/ui/cursor_gauntlet.png`).

**Technical Implementations:**
- **Character System:** Supports 24 unique Warlord combinations (6 races, 4 classes), 8 attributes, and 0-20 level progression.
- **Battle System:** Multi-unit tactical combat on a 2D plane with speed-based initiative, supporting up to 3 active heroes against AI enemies. Includes context-aware damage numbers, screen shake, and AoE (Area of Effect) abilities that hit all enemies with staggered visual effects. AoE is flagged via `isAoE: true` on ability definitions; the engine resolves damage against all alive opposing units. Debuff-type AoE abilities (Demoralizing Shout, Primal Roar) apply status effects to all enemies.
- **Sprite System:** `SpriteAnimation` component for sprite sheet animations with dynamic scaling, transformations, hue overlays for equipment, and fallback animations. All sprites (battle + lobby slideshow) are scaled by frameHeight to a uniform 200px display height, matching the training dummy. No per-combo scale overrides.
- **Hero Slideshow (LobbyScreen):** Presents all 24 race/class combinations with unique animations, VFX, faction/class icons, titles, lore, and slogans.
- **Pixel Art UI Bars:** `PixelBar` component renders sprite-based bars (HP, Mana, Stamina, Grudge, Action Timer, XP).
- **Custom VFX Effects:** 14 high-quality custom effect sprite sheets for abilities and skills.
- **Icon System:** Comprehensive sprite-based `ICON_REGISTRY` with 80+ pixel art icons.
- **Game Systems:**
    - **Equipment:** 8-tier upgrade system across 7 slots with a pixel art paper-doll inventory UI (`InventoryModal`) supporting drag-and-drop. Tier scaling uses multiplicative + additive formula: `base * mult + flat`. Primary stats (damage, health, mana, defense) get full flat bonuses; secondary stats (crit, block, evasion) get 15% of flat bonus. Multipliers: T1=1.0x to T8=45.0x. `DISPLAY_STAT_MAP` provides UI labels and colors. `scaleStat`/`scaleItemStats` functions centralize all stat calculations.
    - **Skill Trees:** Node graph layout with SVG bezier curves.
    - **Progression:** Training, auto-harvesting, status effects.
    - **Abilities:** Customizable 5-slot ability loadouts.
    - **Loot:** Tier-based drops.
    - **Consumables:** 6 potion types.
    - **Trading:** Camp merchant system.
    - **Scene System:** 5 interactive scene views (Camp, Dungeon, Trading Post, Open Field, Portal/Void Nexus). All non-dungeon scenes support WASD keyboard movement and E to interact via shared `useWASD` hook (`src/hooks/useWASD.js`). Proximity detection highlights nearby interactables with "Press E" prompts. Each scene has unique AI ambient flavor (NPC barks, atmospheric encounters, void whispers).
- **Audio System:** Web Audio API for synthesized combat sounds, file-based attack SFX (swish_2/3/4.wav for melee, bow.wav for ranger), and file-based background music (7 tracks). Audio caching via sfxCache for performance.
- **Particle Effects:** CSS-animated in-battle particles, canvas-based title screen particles, and CSS keyframe animations for UI.
- **World Map:** RTS-style 2D map with zoom/pan, 32 unlockable locations across 5 terrain regions, and a dynamic day/night cycle. Features BFS pathfinding, portal fast travel, and god fights.
- **Enemy System:** `createRaceClassEnemy` for dynamic enemy generation. Includes unique boss abilities and themed enemy packs.
- **Economy:** Reduced gold gain from battles, supplemented by a harvest system. Shock Sweepers (purchasable at 100% zone conquest) provide passive harvesting at 1.5x base rate. Wandering Merchant NPC spawns periodically with rare weapons/relics at premium prices.
- **Hero Roster:** Manages multiple heroes with independent progression.
- **Zone Conquer System:** Impacts XP gain and auto-harvest.
- **Zone Quest System:** 29 zones each with 4 optional quests.
    - **Zone Cutscene System:** First-visit story cutscenes for all 32 zones (`src/data/zoneCutscenes.js`, `src/components/ZoneCutscene.jsx`). Each zone has immersive lore text with typewriter effect, cosmetic background from `/backgrounds/`, LifeCraft gradient title, cinematic fade transitions. Triggers once per zone on first battle entry, stored in localStorage. Skip with click/Space/Enter.
- **Gruda Arena:** A standalone challenge mode for simplified turn-based battles.
- **Discord Integration:** Discord OAuth for login with auto-join guild (guilds.join scope). Discord bot (`src/server/discordBot.js`) using discord.js v14 with 7 slash commands: `/profile`, `/characters`, `/leaderboard`, `/stats`, `/play`, `/link`, `/help`. Bot runs alongside Express server. Session token system for extension auth (`/api/auth/verify`, `/api/auth/extension`). Discord Webhook Broadcaster for automatic gameplay broadcasts (arena submissions, relegations, win streaks). Discord invite: `https://discord.gg/KmAC5aXs84`.
- **GRUDA PvP Arena:** Comprehensive ranked PvP system where players submit team snapshots. Other players challenge AI-controlled opponents. Rewards gold, resources, and equipment. Uses PostgreSQL `arena_teams` and `arena_battles` tables for persistent storage (data survives server restarts). Leaderboard API at `/api/arena/leaderboard`. Full-screen `GrudaLeaderboard.jsx` UI with rank badges.
- **Rank Badge System:** `RankBadge.jsx` with 6 tiers (Bronze→Silver→Gold→Platinum→Diamond→Legend). SVG star badges with tier-colored glows. Discord webhooks include rank info.
- **UI Sprite Sheet:** `pixel_ui_pack.png` (1312x304) provides bar frames, fill textures, rank emblems, visual effects. `PixelBar.jsx` renders sprite-based bars (HP, mana, stamina, grudge, action timer, XP).
- **Custom Cursor:** Dwarven gauntlet pixel art cursor applied globally via CSS on `.game-frame`.
- **Named Hero System:** `namedHeroes` registry in `spriteMap.js` maps unique hero IDs to custom sprite data with full animation sets. `getPlayerSprite(heroClass, race, namedHeroId)` checks for named hero overrides before falling back to race/class sprites. Heroes created matching an unlocked named hero's race/class/name automatically receive a `namedHeroId`. First named hero: Racalvin the Pirate King (Barbarian Worge) — secret unlock by naming a Barbarian Worge "Racalvin the Pirate". Uses `pirate-grunt` Metal Slug sprite sheet (10 animations) and dark-tinted black werewolf for worg transform (`racalvinWorgSprite`). Unlock triggers a cinematic video (`/video/racalvin_unlock.mp4`) with "SECRET CHARACTER UNLOCKED" overlay. `getWorgTransformSprite`/`getWorgBearTransformSprite` accept `namedHeroId` parameter for custom worg sprites. Named heroes have 5% spawn chance in title screen parade with custom glows and titles.
- **Wizard Pack Sprite:** `wizard-pack` sprite sheet (231x190 per frame) with 8 animations: idle(6), attack1(8), attack2(8), hurt(4), death(7), run(8), jump(2), fall(2). Used for orc mage with green skin filter `hue-rotate(90deg) saturate(1.4) brightness(1.05)`.
- **Elf-Mage Sprite:** `elf-mage` sprite sheet (231x190 per frame) with 8 animations: idle(6), attack1(8), attack2(8), hurt(4), death(7), run(8), jump(2), fall(2). Used for elf mage at 0.7x scale, replacing old lightning-mage mapping.
- **Evil Wizard 3 Boss Sprite:** `evil-wizard-3` sprite sheet (140x140 per frame) with 8 animations: idle(10), attack(13), hurt(3), death(18), walk(8), run(8), jump(3), fall(3). Used as `evil_wizard` enemy at 3x scale for imposing boss encounters.
- **Class Selection UI:** Redesigned full-width horizontal cards with 110px animated sprites at 1.4x scale, class icon emblem backgrounds, colored attribute stat bars (top 4 stats), shimmer animation on selected card, and class-colored Continue button.
- **Lore Heroes Database:** Comprehensive world lore stored in `src/data/loreHeroes.txt` including 3 gods (Odin, Madra, The Omni), 3 factions (Crusade, Legion, Fabled), and 12+ named lore heroes with backstories, personality profiles, combat styles, quest pools, and dialogue samples.
- **Game Compendium:** Static HTML page at `public/compendium.html` with 8 tabbed sections indexing all game data: Characters (races/classes/combinations), World Map (32 locations), Enemies & Bosses (27 entries), Equipment (7 slots, 8 tiers), Attributes (8 stats), Combat Math, Named Heroes, and Factions. Dark fantasy themed with search/filter functionality.
- **Hero Codex:** Static HTML page at `public/hero-codex.html` — complete visual reference for all 26 playable heroes. Features treasure room banner image, "How Heroes Work" info section, stat reference (HP/ATK/DEF/SPD/RNG/MP), class archetypes, race stat modifiers grid, faction cards, secret hero reveals (2 secret heroes), and full hero card grid with race/class/faction/rarity filtering + search. Each hero card shows race icon, name, title, tags, stat bars, and signature quote. Secret heroes with portraits display a full-width portrait image and lore text. Route added to `server.js` htmlPages array.
- **War Room Cards:** 4-card layout (New Campaign, Save/Continue, Grudge Online info, Web3 Wallet placeholder) with background images and hover effects.
- **Grudge Online Compendium:** `GrudgeOnlinePage.jsx` full-screen overlay with 6 tabs (Overview, Races, Classes, Attributes, Combat Math, Tips). Accessible from War Room info card.
- **Admin Tools:** Unified Admin Hub at `/admin` with tabbed navigation embedding all 7 editors (Map, Battle, Sprite, UI Layout, Icon Manager, PvP Placement, Sprite Forge) plus info tabs (Overview, Heroes, World, Systems). Legacy admin routes (`/adminmap`, `/adminbattle`, etc.) redirect to `/admin`. Centralized `adminConfig.js` utility (`src/utils/adminConfig.js`) manages localStorage persistence with deep-merged defaults for formations, effect positions, sprite layout, action bar, zones, map positions, and PvP placements. Admin edits auto-save and automatically apply to gameplay (BattleScreen reads effect positions, gameStore reads formations from adminConfig). Also includes an in-game Gizmo for DOM inspection.
- **Sprite Forge (AdminMaker):** Knowledge base page documenting all sprite creation insights, lessons learned, and AI creation workflows. Contains 8 sections: Overview (stats from Sprite Animator Pro analysis), Architecture (containerless sprite system, z-index layers, data flow), Sheet Anatomy (frame formats, animation types, size standards), Animation Gallery (live preview of all sprite sheets), Skeleton Rigging (16-bone hierarchy, rest poses, material labels, keyframe interpolation), Filters & Tints (CSS filter recipes for racial recoloring, dwarfTransform), AI Creation (prompt templates for sprite generation, auto-rigging, inpainting), and Golden Rules (10 non-negotiable sprite system rules).

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