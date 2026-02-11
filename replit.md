# Grudge Warlords

## Overview
Grudge Warlords is a Final Fantasy 7-inspired turn-based RPG with a dark fantasy aesthetic, built using React, Vite, and Zustand. It features multi-hero tactical battles, allowing players to create and manage a roster of heroes from 6 races and 4 classes, offering 24 unique Warlord combinations. The project aims to deliver a rich RPG experience with deep character customization, tactical combat, and a compelling progression system.

## User Preferences
I want the agent to use clear and concise language. I prefer iterative development with small, testable changes. Before making any significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all code adheres to modern React practices and maintains a consistent styling approach.

## System Architecture
The application is a React 19 frontend developed with Vite, with an Express backend (server.js) for Discord OAuth and API routes. State management uses a single Zustand store. Styling utilizes inline styles and CSS variables. Deployment uses autoscale with `server.prod.js` serving both API and static build from `dist/`.

**UI/UX Decisions:**
- **Typography & Visuals:** Uses Cinzel (headings) and Jost (body) fonts. Visuals include pixel art sprites, particle and beam effects, a 2D world map with clickable nodes, and animated hero movement. War Council tabs feature unique fantasy backgrounds, and hero card sprites are scaled for visual impact. Character cards use race-specific background images (RACE_BG mapping: human→card_divine, elf→card_beach, dwarf→card_green_hills, undead→card_dark, orc→blood_canyon, barbarian→volcanic_field) across AccountPage, LocationView, CharacterCreate, and HeroCreate.
- **Screen Flow:** The user journey progresses through Title Screen (Grudge Studio branding, Guest/Discord login) → Intro Cinematic (video plays, skip button, auto-fallback) → Game Lobby (tavern background, War Room with continue/new game, Characters, Account, Discord, Credits tabs) → Character Creation → World Map → Location Views → Battle Screens, with dedicated UIs for character management.
- **Scene Node Visuals:** All scene nodes (Camp, Trading Post, Open Field, Dungeon, Portal) use generated building images (72-80px) instead of colored circles, with Cinzel font at 0.85-0.9rem for node labels. Building images stored in public/images/buildings/.
- **Game Frame & Layout:** The application is wrapped in a `.game-frame` class with an ornate fantasy border frame overlay (`game-border-frame.png`) rendered as a `::after` pseudo-element at `z-index: var(--z-ui-frame, 10500)` with `pointer-events: none` for click passthrough. CSS custom properties define content-safe insets: `--frame-inset-top` (~1.2%), `--frame-inset-side` (~3.8%), `--frame-inset-bottom` (~27%). Non-full-bleed screens (lobby, title, account, scenes, etc.) are positioned within these insets via App.jsx. Full-bleed screens (world map, battle, intro) fill the entire frame. Responsive breakpoints adjust insets for 768px, 480px, and 600px-height viewports.
- **Z-Index Layer System (`src/constants/layers.js`):** Centralized layer constants organized from furthest (back) to closest (front). All UI overlays render ABOVE the frame border (10500). Layers in order: BACKGROUND (0) → TERRAIN/DAY_NIGHT (1-4) → MAP_OBJECTS/NODES (5-10) → MAP_INFO/HUD (12-16) → MAP_DEV (30-40) → MAP_POPUPS (50-100) → SCENE internals (5-50) → BATTLE internals (0-500) → BOSS_WALKUP (5-30) → CHAT_BUBBLES (9500) → LOADING (10505) → UI_FRAME (10500) → FRAME_MASK/EDITOR (10501-10502) → SETTINGS (10510-10511) → ADMIN_GIZMO (10515+) → LOOT/HERO_CREATE (10520-10525) → BOTTOM_BAR (10600) → BOTTOM_BAR_POPUPS (10700) → INTRO_CINEMATIC (10800) → TOOLTIP (99999, portaled to body). Legacy MAP_LAYERS compatibility object also exported for WorldMap.
- **Map Bottom Bar (MapBottomBar.jsx):** Custom RPG bottom bar aligned to the frame's bottom panel slots. Three sections: left 28% (Party Log chat with input), center flex (8 icon buttons: Camp, Points, Council, Party, Gruda, Settings, Music Toggle, Quests), right 20% (War Party compact display with 3 popup trigger buttons above for Harvesting, Gear, and Character Spider Graph/Power). Height: 26.2% of game frame (responsive). Popups use `calc(26.2% + 8px)` bottom offset.

**Technical Implementations:**
- **Character System:** Supports 24 unique Warlord combinations across 6 races and 4 classes, with 8 attributes and a 0-20 level progression.
- **Battle System:** Multi-unit tactical combat on a 2D plane with speed-based initiative, supporting up to 3 active heroes against AI enemies. Includes animations for combat actions and damage numbers.
- **Sprite System:** Employs a `SpriteAnimation` component for 100x100px sprite sheet animations, with dynamic scaling, special handling for transformations, and per-slot equipment hue overlays (weapon/helmet/armor/feet regions with tier-based color, pulse, and shimmer effects). Necromancer sprite (160x128 frames) used for undead mage enemies. NightBorne sprite (80x80 frames, 5 animations: idle/9, walk/6, attack/12, hurt/5, death/23) used as Worge enhanced transformation form with purple trailing afterimage effects, pulsing aura, and arcane particle system. Evil Wizard 2 sprite (250x250 frames, 6 animations) replaces original evil-wizard for Malachar the Undying boss. Medieval Warrior 3 (135x135 frames, 7 animations) and Fantasy Warrior (162x162 frames, 7 animations) added as special unlock elite warrior sprites — Human/Dwarf warriors get Medieval Warrior 3, Elf/Barbarian warriors get Fantasy Warrior, with race-specific filters for Orc and Undead variants.
- **Pixel Art UI Bars:** MiniBar component uses pixel art RPG-styled health/mana/stamina bars with vertical gradient fills, specular highlight overlays, colored glow effects, and critical health pulse animation. Consistent across BattleScreen, AccountPage, and AdminBattle. Supports 7 color presets: green (HP), blue (MP), yellow (SP), red (Grudge), purple, cyan.
- **Custom VFX Effects:** 14 high-quality custom effect sprite sheets in public/effects/custom/ (arcaneslash, beam, crit, flamestrike, frostbolt, frozen, healingregen, healingwave, hit, holyheal, holylight, arcanebolt, arcanelighting, arcanemist). Wired into all class abilities, enemy abilities, buff visuals, weapon skills, and effect layer presets. 3 new presets: arcane_storm, frost_nova, divine_light.
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
    - **Chat Bubble System:** Comic-style speech bubbles on the world map anchored to speaker hero sprites. Cream/white bubbles with thick black borders, SVG curved tails pointing to the speaking hero, sprite face portraits, and click-to-dismiss. Bubbles persist on screen until clicked or new dialogue triggers.
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
- **Tactical Movement UI:** Battle action bar includes row position arrows (left/right) showing current row name, icon, and active modifiers (buffs/debuffs). Uses `moveRow('forward'/'back')` from gameStore with row data from `battleRows.js`.
- **Discord OAuth:** `/discordauth` route handles Discord login with CSRF state protection. Backend server (server.js on port 3001 dev, server.prod.js on port 5000 prod) exchanges codes for tokens and creates beta channel invites.
- **Discord Webhook Broadcaster:** Admin-authenticated webhook system (`DISCORD_GRUDGE_WEBHOOK` secret) for sending rich embed messages to the OG channel (1381760000946470987). Supports 7 message types: Game Update, Patch Notes, Community Challenge, Live Event, Lore Drop, Tip of the Day, Custom Message. Protected by `GAME_API_GRUDA` admin token via `x-admin-token` header. Frontend admin panel in Discord tab of War Council with token-gated login.
- **Beta Tester System:** Uses `GAME_API_GRUDA` bot token to create one-time invite links to Discord channel `1381760000946470987`. Invites expire after 24 hours.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool, with proxy to backend in dev.
- **Zustand:** State management library.
- **Express:** Backend server for Discord OAuth API routes.
- **discord.js:** Discord API client library.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game sound effects and music.