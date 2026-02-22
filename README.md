# GRUDA Wars — Grudge Warlords

Browser-based souls-like MMO RPG built with React + Vite, deployed on Vercel with a serverless Express API and PostgreSQL persistence.

**Live:** [grudgewarlords.com](https://grudgewarlords.com)

## Architecture

```
src/              React client (Vite)
  components/     UI panels (Arena, DiscordAuth, HeroCodex, AdminGizmo, …)
  stores/         Zustand game state (gameStore)
api/index.js      Serverless Express API (Vercel Functions)
public/           Static assets + discordauth.html OAuth page
server.js         Local dev server (mirrors api/index.js)
```

**Stack:** React 19, Zustand, Vite 7, Express (Vercel Serverless), PostgreSQL (Neon), Discord OAuth2, Crossmint Solana wallets

## Authentication

All OAuth state is **stateless** via HMAC-signed tokens — no in-memory session maps, fully compatible with serverless cold starts.

- **Discord OAuth** — `GET /api/discord/login` → Discord authorize → `POST /api/discord/callback`
- **External OAuth** — `GET /api/external/login` → Discord authorize → `GET /api/external/callback`
- **Grudge ID** — `POST /api/auth/register`, `POST /api/auth/login`
- **Puter SSO** — `POST /api/auth/puter`
- **Session verify** — `POST /api/auth/verify`

Canonical redirect URI: `https://grudgewarlords.com/discordauth`

## API Endpoints

### Arena (PvP)
- `POST /api/arena/submit` — Post a team (1–3 heroes) to ranked arena
- `GET /api/arena/lobby` — Browse ranked/unranked teams (paginated)
- `GET /api/arena/team/:teamId` — Team details + HMAC challenge token
- `POST /api/arena/battle/simulate` — Server-authoritative battle simulation (requires challenge token)
- `POST /api/arena/battle/result` — Submit battle result (token-based)
- `GET /api/arena/rewards/:teamId` — View team rewards
- `GET /api/arena/stats` — Arena-wide statistics
- `GET /api/arena/leaderboard` — Global leaderboard

### Public
- `GET /api/public/profile` — Player profile + heroes (session required)
- `GET /api/public/leaderboard` — Top 50 arena players
- `GET /api/public/stats` — Global game stats
- `POST /api/public/sync` — Full account data sync (session required)

### Wallet
- `POST /api/wallet/create` — Create Solana wallet via Crossmint (session required)
- `GET /api/wallet/status` — Check wallet status (session required)
- `GET /api/wallet/all` — List all wallets (admin)

### Discord Webhooks (admin)
- `POST /api/discord/webhook/update` — Post game update embed
- `POST /api/discord/webhook/patch` — Post patch notes embed
- `POST /api/discord/webhook/challenge` — Post community challenge
- `POST /api/discord/webhook/custom` — Post custom embed

### Database Admin (API key required)
Full CRUD for: accounts, characters, inventory, crafted items, islands.
- `POST /api/db/save-game` — Atomic full-game save
- `GET /api/db/load-game` — Full-game load
- `GET /api/db/status` — Database connection check

### System
- `GET /api/health` — Health check
- `GET /api/discord/invite` — Generate one-time Discord invite

## Environment Variables

| Variable | Purpose |
|----------|----------|
| `GRUDGE_ACCOUNT_DB` | PostgreSQL connection string |
| `JWT_SECRET` | JWT + HMAC signing key |
| `DISCORD_CLIENT_ID` | Discord OAuth app ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth secret |
| `DISCORD_BOT_TOKEN` | Bot token for guild joins + invites |
| `DISCORD_GUILD_ID` | Target guild for auto-join |
| `DISCORD_GRUDGE_WEBHOOK` | Webhook URL for game notifications |
| `GAME_API_GRUDA` | Admin API key |
| `CROSSMINT_SERVER_API_KEY` | Crossmint wallet API |

## Development

```bash
npm install
npm run dev          # Vite dev server (frontend)
node server.js       # Local API server
```

## Deployment

Hosted on **Vercel** with automatic deploys from `main`.

```bash
vercel --prod        # Manual production deploy
```

All API routes served as Vercel Serverless Functions via `api/index.js`.
SPA routing handled by `vercel.json` rewrite rules.

## License

Proprietary — Grudge Studio © 2026. All rights reserved.
