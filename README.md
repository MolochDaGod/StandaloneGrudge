# Grudge Warlords — grudgewarlords.com

**Browser-based MMO with Vercel serverless API, Puter cloud sync, arena PvP, and cross-platform Grudge Studio integration.**

Live at **https://grudgewarlords.com**

## Quick Start

```bash
npm install
cp .env.example .env   # configure DB, Puter, Discord, Crossmint keys
npm run dev            # local Vite dev server
```

Deployment is handled by Vercel — push to `main` and it auto-deploys.

## Architecture

```
src/                   # React client (Vite)
  components/          # TitleScreen, HUD, Arena, Inventory, Island…
  services/cloudSync.js  # Puter KV auto-sync (debounced 30s)
api/
  index.js             # Vercel serverless Express app (~1700 lines)
  lib/puter-service.js # Puter KV driver
vercel.json            # Rewrites /api/* → api/index.js
```

## API Endpoints

All endpoints live in `api/index.js` as a single Vercel serverless function.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/puter` | Puter token login |
| POST | `/api/auth/login` | Username/password login |
| POST | `/api/auth/register` | Create account |
| GET  | `/api/auth/verify` | Verify session token |

### Cloud Sync
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sync/push` | Push game state to Puter KV |
| GET  | `/api/sync/pull` | Pull saved game state |

### Public (no auth, CORS-open)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/player-summary/:grudgeId` | Portable player data (heroes, arena, gold, wallet) |
| GET | `/api/public/stats` | Platform-wide stats (players, heroes, battles) |
| GET | `/api/public/leaderboard` | Arena leaderboard |
| GET | `/api/health` | Health check |

### Arena, Profile, Island, Wallet
See `api/index.js` for full CRUD — arena teams/battles, character management, island ownership, Crossmint wallet integration.

## Cross-Platform Integration

Grudge Warlords exposes public endpoints consumed by the Grudge Studio site (`public-fawn-nine.vercel.app`) and other Grudge apps.

**CORS-allowed origins:**
- `https://grudgewarlords.com`
- `https://public-fawn-nine.vercel.app`
- `https://grudgestudio.com` / `https://www.grudgestudio.com`
- `http://localhost:*` (dev)

The `/api/public/player-summary/:grudgeId` endpoint returns a portable snapshot of a player's progress (characters, levels, arena record, gold, resources, wallet status) that any Grudge Studio app can display.

## Database

PostgreSQL with tables: `accounts`, `characters`, `inventory_items`, `crafted_items`, `islands`, `arena_teams`, `arena_battles`.

Key columns on `accounts`: `grudge_id` (UUID, primary), `puter_uuid`, `wallet_address`, `discord_id`.

## Environment Variables

| Variable | Purpose |
|----------|--------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PUTER_API_KEY` | Puter cloud KV access |
| `DISCORD_CLIENT_ID/SECRET` | Discord OAuth |
| `CROSSMINT_API_KEY` | Wallet creation |
| `JWT_SECRET` | Session token signing |

## Legacy Infrastructure

The repo also contains VPS deployment scripts (`scripts/`, `deployment/`), Docker config, and a PM2 ecosystem file from the original standalone server setup. These are retained for reference but the active deployment target is Vercel.

## Cross-App Links

Centralized in `src/utils/studioUrls.js` with SSO token forwarding:

- **Grudge Builder** (`grudge-builder.vercel.app`) — Character creation, islands, roster management
- **Crafting Suite** (`warlord-crafting-suite.vercel.app`) — Forging, professions, recipes
- **Object Store** (`molochdagod.github.io/ObjectStore`) — Game assets & sprites CDN

## Standalone Tool Pages

Static HTML pages served from `public/`, accessible without login:

- **[/weapon-skill-tree.html](https://grudgewarlords.com/weapon-skill-tree.html)** — Weapon Skill Atlas: browse all 17 weapon types, 6 variants each, with mastery trees and combat skill loadouts
- `/arena.html` — Arena browser
- `/compendium.html` — Game compendium
- `/hero-codex.html` — Hero codex viewer

## Related Projects

- **Grudge Studio** (`public-fawn-nine.vercel.app`) — Marketing/studio site, consumes public API
- **Auth Gateway** (`auth.grudgestudio.com`) — Shared auth service (Discord, username/password, guest)
- **PuterGrudge** — GrudgeOS dev environment

See [GRUDGE_BEST_PRACTICES.md](GRUDGE_BEST_PRACTICES.md) for cross-project conventions.

---

*May your grudges be eternal.*
