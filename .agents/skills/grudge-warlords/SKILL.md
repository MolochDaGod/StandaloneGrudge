---
name: grudge-warlords
description: Complete knowledge base for the Grudge Warlords RPG project. Covers architecture, sprite system, admin tools, Discord OAuth login, Grudge Studio SDK, arena/leaderboard, server API, deployment, and best practices. Use when working on any Grudge Warlords feature, debugging, or extending the game systems.
---

# Grudge Warlords - Agent Skill

## Project Identity

- **Game:** Grudge Warlords - Final Fantasy 7 inspired turn-based RPG
- **Studio:** Grudge Studio
- **Stack:** React 19 + Vite (frontend), Express (backend), Zustand (state), discord.js v14 (bot)
- **Deployment:** Replit VM target (persistent process for Discord bot + in-memory arena)
- **Production URL:** `https://grudge-warlords-rpg.replit.app`
- **External site:** `https://grudgewarlords.com`
- **Discord invite:** `https://discord.gg/KmAC5aXs84`

## Architecture Overview

### Unified Server (`server.js`)
Single Express server auto-detects mode via `NODE_ENV`:
- **Dev mode:** Runs on port 3001, proxied through Vite on port 5000
- **Production:** Runs on port 5000, serves built assets from `dist/`
- **Build:** `npm run build` (Vite) → **Start:** `npm run start` (NODE_ENV=production node server.js)

### Key Environment Variables (Secrets)
| Variable | Purpose |
|---|---|
| `DISCORD_CLIENT_ID` | OAuth2 app client ID |
| `DISCORD_CLIENT_SECRET` | OAuth2 app client secret |
| `DISCORD_BOT_TOKEN` | Bot token for discord.js |
| `DISCORD_GRUDGE_WEBHOOK` | Webhook URL for arena broadcasts |
| `GAME_API_GRUDA` | Admin token / fallback bot token |
| `GRUDGE_ACCOUNT_DB` | Neon PostgreSQL connection string |

### Workflows
1. **Discord API Server** — `node server.js` (Express + Discord bot)
2. **Start application** — `npx vite --host 0.0.0.0 --port 5000` (Vite dev server)

## Login & Authentication Flow

### Discord OAuth (In-Game)
1. Client calls `GET /api/discord/login` → receives authorization URL + CSRF state
2. User redirects to Discord → authorizes scopes: `identify`, `email`, `guilds.join`
3. Discord redirects to `/discordauth` with code
4. Client sends code to `POST /api/discord/callback` → server exchanges for access token
5. Server fetches user profile from Discord API
6. Server generates `sessionToken` via `crypto.randomBytes(32)`, stores in `activeSessions` Map
7. Server auto-joins user to Grudge Warlords guild via `guilds.join` scope
8. Session expires after 7 days

### Grudge ID
The user's **Grudge ID** is their **Discord user ID** (`discordId`). It is returned from session verification and used as the primary player identifier across all systems (arena, profiles, game saves).

### External Login (grudgewarlords.com → Replit)
1. `GET /api/external/login?returnUrl=...` → redirects to Discord OAuth
2. `GET /api/external/callback` → handles token exchange server-side
3. Renders HTML page that stores session in `localStorage` and posts back via `window.postMessage`
4. Allowed return origins: `grudgewarlords.com`, `www.grudgewarlords.com`

### Session Verification
- `POST /api/auth/verify` — body: `{ sessionToken }` → returns `{ valid, discordId, username }`
- `requireSession` middleware — reads `X-Session-Token` header or body `sessionToken`

### Auth Page
- `public/discordauth.html` — standalone login page with Discord branding
- Storage keys: `grudge_studio_session`, `grudge_studio_user`

## Grudge Studio SDK (`public/grudge-studio-sdk.js`)

Embeddable SDK v1.0 for third-party sites (grudgewarlords.com):

```javascript
window.GrudgeStudio.configure({ apiBase: 'https://grudge-warlords-rpg.replit.app' });
window.GrudgeStudio.login();           // Opens Discord OAuth popup
window.GrudgeStudio.getProfile();       // Fetch player profile (authed)
window.GrudgeStudio.syncGameData();     // Full game data sync (authed)
window.GrudgeStudio.getLeaderboard();   // Arena leaderboard (public)
window.GrudgeStudio.getStats();         // Server stats (public)
window.GrudgeStudio.embed('#container');// Embed game iframe
window.GrudgeStudio.renderLoginButton('#btn');
window.GrudgeStudio.renderStatsWidget('#stats');
window.GrudgeStudio.renderLeaderboard('#lb', { limit: 10 });
```

Events: `login`, `logout`, `sync`, `error` via `.on()` / `.off()`

## Server API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/discord/login` | No | Start OAuth flow |
| POST | `/api/discord/callback` | No | Exchange code for session |
| POST | `/api/auth/verify` | No | Verify session token |
| POST | `/api/auth/extension` | No | Extension auth |
| GET | `/api/external/login` | No | External site OAuth redirect |
| GET | `/api/external/callback` | No | External OAuth callback |

### Arena / Leaderboard
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/arena/submit` | No | Submit team to ranked arena |
| GET | `/api/arena/lobby` | No | List teams (paginated, filterable) |
| GET | `/api/arena/team/:teamId` | No | Get team + challenge nonce |
| POST | `/api/arena/battle/result` | No | Record battle result (requires nonce) |
| GET | `/api/arena/rewards/:teamId` | No | Get team rewards |
| GET | `/api/arena/stats` | No | Arena statistics |
| GET | `/api/arena/leaderboard` | No | Sorted leaderboard |

### Public API
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/public/profile` | Session | Player profile |
| GET | `/api/public/leaderboard` | No | Leaderboard with rank badges |
| GET | `/api/public/stats` | No | Server stats |
| POST | `/api/public/sync` | Session | Full game data sync |
| GET | `/api/health` | No | Health check |

### Webhook (Admin)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/discord/webhook/update` | Admin | Send update embed |
| POST | `/api/discord/webhook/patch` | Admin | Send patch notes |
| POST | `/api/discord/webhook/challenge` | Admin | Send challenge announcement |
| POST | `/api/discord/webhook/event` | Admin | Send event announcement |
| POST | `/api/discord/webhook/lore` | Admin | Send lore entry |
| POST | `/api/discord/webhook/tip` | Admin | Send gameplay tip |
| POST | `/api/discord/webhook/custom` | Admin | Send custom embed |

## Arena & Leaderboard System

### Data Model (In-Memory Maps)
- `arenaTeams` Map — key: teamId, value: team object
- `arenaBattles` array — battle history
- `challengeNonces` Map — CSRF protection for battle results

### Team Lifecycle
1. **Submit:** Player submits 1-3 hero snapshots → team gets `ranked` status
2. **Challenge:** Other player fetches team → receives `challengeNonce` (30min expiry)
3. **Battle:** AI controls the defending team, challenger fights live
4. **Result:** `team_won` or `team_lost` updates wins/losses
5. **Relegation:** 3 losses → auto-demoted to `unranked`
6. **Replacement:** Submitting new team auto-demotes previous ranked team

### Rank Tiers
Bronze (0W) → Silver (5W) → Gold (10W) → Platinum (20W) → Diamond (35W) → Legend (50W)

### Leaderboard Sorting
Primary: wins DESC → losses ASC → winRate DESC

### Discord Webhooks
Auto-broadcasts: new challengers, relegations, 5-win streaks with rank badge info

## Sprite System — Complete Reference

### Architecture
- `src/data/spriteMap.js` — Central registry of ALL sprite data (88 sprite sheet folders, 24 race/class combos, named heroes)
- `src/components/SpriteAnimation.jsx` — Renders sprite sheet animations with equipment overlays
- Sprite sheets stored in `public/sprites/<name>/` as horizontal strip PNGs
- Effect sprite sheets stored in `dist/effects/` organized by category

### Sprite Sheet Anatomy
A sprite sheet is a single PNG containing all frames of one animation laid out horizontally:
```
|  Frame 1  |  Frame 2  |  Frame 3  |  Frame 4  |  Frame 5  |  Frame 6  |
|  100x100  |  100x100  |  100x100  |  100x100  |  100x100  |  100x100  |
Total PNG: 600x100, frameWidth=100, frameHeight=100, frames=6
```
**Critical formula:** `imageWidth / frameWidth = frames` — mismatch causes visual glitches.

Common frame sizes in this project:
- Standard characters: 100x100 per frame
- Metal Slug style: 100x100 per frame (pirate-grunt)
- Wizard pack / Elf-mage: 231x190 per frame
- Evil Wizard 3 boss: 140x140 per frame
- Most enemies: 100x100 per frame

### Standard Animation Set
Each sprite should include these animation keys:
| Key | Purpose | Typical Frames | Notes |
|---|---|---|---|
| idle | Standing pose loop | 4-10 | Always required |
| attack1 | Primary attack | 6-13 | Always required |
| attack2 | Secondary/special attack | 6-13 | Optional |
| hurt | Taking damage | 3-4 | Short, impactful |
| death | Dying sequence | 4-18 | Play once, no loop |
| run | Movement animation | 6-8 | Used in scenes |
| jump | Jump/leap | 2-3 | Optional |
| fall | Falling | 2-3 | Optional |

### Sprite Data Structure
```javascript
{
  frameWidth: 100,    // Width of single frame in pixels
  frameHeight: 100,   // Height of single frame in pixels
  filter: '',         // CSS filter string for recoloring
  facesLeft: false,   // True if sprite's default orientation faces left
  scale: 1,           // Optional per-sheet scale override (use sparingly)
  idle: { src: '/sprites/hero/idle.png', frames: 6 },
  attack1: { src: '/sprites/hero/attack1.png', frames: 8 },
  hurt: { src: '/sprites/hero/hurt.png', frames: 3 },
  death: { src: '/sprites/hero/death.png', frames: 7 },
  run: { src: '/sprites/hero/run.png', frames: 8 },
}
```

### SpriteAnimation Component Props
| Prop | Type | Default | Description |
|---|---|---|---|
| spriteData | object | required | Sprite definition from spriteMap |
| animation | string | 'idle' | Animation key to play |
| scale | number | 2 | Display scale multiplier |
| flip | boolean | false | Mirror horizontally (CSS scaleX(-1)) |
| loop | boolean | true | Loop animation or play once |
| speed | number | 120 | Milliseconds per frame |
| containerless | boolean | true | Zero-width container for battle positioning |
| onAnimationEnd | function | null | Callback when non-looping animation finishes |
| equipmentOverlays | array | null | Equipment tint overlays by slot/tier |

### Rendering Pipeline
1. **Scale calculation:** `displayScale = targetHeight / frameHeight` (target = 200px)
2. **Display size:** `displayWidth = frameWidth * displayScale`, `displayHeight = targetHeight`
3. **Sprite strip rendering:** Uses CSS `background-image` + `background-position` to show one frame
4. **Frame cycling:** `setInterval` advances frame index, `backgroundPosition` shifts by `-frameWidth * displayScale * frameIndex`
5. **Flip logic (battle):** `facesLeft ? team === 'player' : team === 'enemy'` — ensures all units face their opponents
6. **Containerless mode:** Wrapper div has `width: 0, overflow: visible` for precise absolute positioning in battles

### Flip Logic Deep Dive
```
facesLeft=true  + player team → flip=true  (sprite faces right, toward enemies) ✓
facesLeft=true  + enemy team  → flip=false (sprite stays facing left, toward players) ✓
facesLeft=false + player team → flip=false (sprite stays facing right, toward enemies) ✓  
facesLeft=false + enemy team  → flip=true  (sprite faces left, toward players) ✓
```

### Battle Positioning System
- Units positioned using percentage-based coordinates (x=0-100%, y=0-100%)
- Player units: x≈18-32% (left side), Enemy units: x≈55-74% (right side)
- Y positioning: base y=88% with ±10% spread per unit in row
- Row system: Protection(x=22) → Battle(x=32) → Back(x=18) for players
- Row system: Charge(x=55) → Vanguard(x=65) → Formation(x=74) for enemies
- `transform: translate(-50%, -100%)` anchors sprites at bottom-center
- `bodyY(unit)` calculates mid-body position for projectile targeting

### Projectile Targeting
- Angle calculation: `Math.atan2(dy, dx) * (180 / Math.PI)` — always use raw angle
- Player→Enemy: angle ≈ 0° (pointing right), Enemy→Player: angle ≈ 180° (pointing left)
- Projectile sprites/CSS shapes face RIGHT by default — rotation handles direction
- Never add +180° offsets — atan2 already produces correct angles for both directions
- Specialized projectiles: FireballProjectile, WaterArrowProjectile, IceStormProjectile, PoisonGustProjectile
- Generic projectiles: daggers (CSS-drawn), beams (image), orbs (radial gradient), electric (ThunderProjectileSprite)

### Storage & File Organization Best Practices
```
public/sprites/
  ├── <character-name>/          # One folder per sprite sheet
  │   ├── idle.png               # Horizontal strip: frameW * frames × frameH
  │   ├── attack1.png
  │   ├── hurt.png
  │   ├── death.png
  │   └── run.png
  ├── bosses/                    # Boss variants
  ├── companions/                # Summoned companions
  ├── effects/                   # Legacy effects location
  └── ui/                        # UI sprites (cursor, bars)

dist/effects/                    # All VFX effect sprite sheets
  ├── pixel/                     # 20 numbered spritesheet effects (600x600 to 1100x1100)
  ├── slash/                     # Melee slash effects (5 colors × 3 sizes + demon slashes)
  ├── beams/                     # Beam trail projectiles (5 colors, 1024x128)
  ├── retro_impact/              # Hit impact sprites (14 colors × 2 variants, 576x384)
  ├── bullet_impact/             # Bullet hit effects (5 colors)
  ├── custom/                    # Hand-crafted ability effects (14 effects)
  └── *.png                      # Root-level standalone effects

public/icons/
  ├── ability_*.png              # 28 ability icons (painted RPG style, 1024x1024)
  ├── fireball_frame_*.png       # Fireball projectile animation frames
  └── water_arrow_frame_*.png    # Water arrow projectile animation frames
```

### Effect Asset Catalog

#### Melee Slash Effects (`dist/effects/slash/`)
| File Pattern | Dimensions | Frames | Description |
|---|---|---|---|
| slash_{color}_sm.png | 256x32 | 8 frames (32x32) | Small slash arcs |
| slash_{color}_md.png | 512x64 | 8 frames (64x64) | Medium slash arcs |
| slash_{color}_lg.png | 768x96 | 8 frames (96x96) | Large slash arcs |
| demon_slash_{1-3}.png | 336x48 | 7 frames (48x48) | Demon-style dark slashes |
Colors: blue, green, orange, purple, red

#### Beam Trails (`dist/effects/beams/`)
| File | Dimensions | Description |
|---|---|---|
| beam_{color}.png | 1024x128 | Horizontal beam projectile trail |
Colors: blue, green, orange, purple, red

#### Hit Impacts (`dist/effects/retro_impact/`)
| File Pattern | Dimensions | Description |
|---|---|---|
| impact{Color}{A-D}.png | 576x384 | Retro-style impact bursts (6x4 grid = 24 frames, 96x96 each) |
| retro_impact_{A-F}.png | various | Generic impact variants |
| energy_projectile.png | 200x50 | Energy ball projectile |
Colors: Blue, Cyan, Fire, Green, Magenta, Orange, Pink, Purple, Red, Teal, White, Yellow

#### Custom Ability Effects (`dist/effects/custom/`)
14 hand-crafted effects: arcanebolt, arcanelighting, arcanemist, arcaneslash, beam, crit, flamestrike, frostbolt, frozen, healingregen, healingwave, hit, holyheal, holylight

#### Pixel Sprite Effects (`dist/effects/pixel/`)
20 numbered spritesheets (NxN square grids): weaponhit, fire, nebula, vortex, phantom, loading, sunburn, felspell, midnight, freezing, magicspell, magic8, bluefire, casting, magickahit, flamelash, firespin, protectioncircle, brightfire, magicbubbles
Plus: elemental effects (earth, ice, water, fire, smoke, thrust), smear effects (horizontal/vertical)

#### Root Effects (`dist/effects/`)
Standalone sheets: fire_explosion, heal_spritesheet, hit_effect_{1-3}, holy_impact, holy_repeatable, holy_vfx_02, resurrect_sprite, slash_spritesheet, star_burst, thunder_hit/projectile, wind_breath/hit/projectile, worge_tornado, damage_numbers, explosion_crit

### Golden Rules for Sprites
1. Frame counts MUST match actual PNG dimensions: `imageWidth / frameWidth = frames`
2. All battle sprites scale to 200px display height via: `scale = 200 / frameHeight`
3. Never add per-combo scale overrides — uniform scaling only
4. `containerless={true}` for battle sprites (zero-width, absolute positioning)
5. `containerless={false}` for admin tools and UI previews
6. All sprite PNGs must use `image-rendering: pixelated` for crisp pixel art
7. Minimum display height: 80px for any sprite anywhere in the game
8. Projectile sprites face RIGHT by default — atan2 rotation handles both directions
9. Equipment overlays use `mixBlendMode: 'color'` with tier-based opacity
10. Always verify frameWidth/frameHeight against actual PNG before registering in spriteMap

### Admin Sprite Viewport Pattern (CRITICAL)
Fixed-size viewport containers prevent sprite overflow collisions:
```jsx
<div style={{
  width: VIEWPORT_W, height: VIEWPORT_H,
  position: 'relative', overflow: 'hidden',
}}>
  <div style={{
    position: 'absolute',
    left: VIEWPORT_W/2 - displayWidth/2,
    top: VIEWPORT_H/2 - displayHeight/2,
    width: displayWidth, height: displayHeight,
    pointerEvents: 'none',
  }}>
    <SpriteAnimation ... />
  </div>
</div>
```
Viewport sizes: AdminSprite = 500x420px, AdminSize = 200x200px

### CSS Filters for Racial Recoloring
- Orc green: `hue-rotate(90deg) saturate(1.4) brightness(1.05)`
- Undead: `hue-rotate(180deg) saturate(0.6) brightness(0.8) sepia(0.3)`
- Dwarf transform: `scaleX(1.1) scaleY(0.85)` at `transformOrigin: bottom center`

### Adding New Sprites Checklist
1. Place sprite strip PNGs in `public/sprites/<name>/` folder
2. Verify frame dimensions with `identify` (imageWidth / frameWidth = frames)
3. Register in `spriteMap.js` under `spriteSheets` with correct frameWidth/frameHeight/frames
4. Set `facesLeft: true` only if sprite's default pose faces left
5. Add race/class mapping in `raceClassSpriteMap` if applicable
6. Test in Admin Sprite Editor (`/admin` → Sprite tab) before battle use
7. Verify flip logic works correctly for both player and enemy teams

## Admin Tools

### Admin Hub (`/admin`)
Tabbed dashboard with 7 editors + info tabs:
- **Map Editor** — Zone placement on world map
- **Battle Editor** — Formation layout, action bar config
- **Sprite Editor** — Preview all sprites with effect/beam overlays, draggable markers
- **UI Layout** — UI element positioning
- **Icon Manager** — Icon registry management
- **PvP Placement** — Arena formation layout
- **Size & Color** — Per-context (map/battle/scenes) scale + CSS filter per sprite
- **Sprite Forge** — Knowledge base for sprite creation
- **Backgrounds** — Battle background management with zoom/remove/restore

### Admin Config Persistence
`src/utils/adminConfig.js` — localStorage with deep-merged defaults. Auto-applies to gameplay (BattleScreen reads effect positions, gameStore reads formations).

## HTML Server & Static Pages

### Static Files Served
| Path | File | Purpose |
|---|---|---|
| `/discordauth` | `public/discordauth.html` | Discord OAuth login page |
| `/compendium.html` | `public/compendium.html` | Game compendium (8 tabs) |
| `/grudge-studio-sdk.js` | `public/grudge-studio-sdk.js` | Embeddable SDK |

### Production Static Serving
```javascript
app.use('/assets', express.static('dist/assets', { maxAge: '30d', immutable: true }));
app.use(express.static('dist', { maxAge: '1h' }));
app.get('/{*splat}', (req, res) => res.sendFile('dist/index.html'));
```

## Deployment Checklist

1. Set `NODE_ENV=production`
2. Build: `npm run build` (Vite)
3. Start: `node server.js` (serves on port 5000)
4. Deploy target: `vm` (persistent process required for Discord bot + in-memory arena data)
5. Ensure all secrets are set in production environment
6. Update `API` constant in `discordauth.html` to production URL
7. Update `API_BASE` in `grudge-studio-sdk.js` to production URL

## Common Debugging

| Issue | Solution |
|---|---|
| Sprites not showing | Check `spriteMap.js` entry exists, verify PNG path and frame count |
| Sprite overflows admin panel | Use fixed viewport pattern (position: relative + overflow: hidden) |
| Login fails | Check `DISCORD_CLIENT_ID`/`SECRET` secrets, verify redirect URI matches Discord app settings |
| Session expired | Sessions last 7 days, stored in-memory `activeSessions` Map (lost on restart) |
| Arena data lost | In-memory Maps — all arena data is ephemeral, lost on server restart |
| Leaderboard empty | Need at least 1 battle (`totalBattles > 0`) to appear |
| Webhook not sending | Check `DISCORD_GRUDGE_WEBHOOK` secret is set |
| CORS on external site | Server uses `cors()` middleware, SDK uses `mode: 'cors'` |
