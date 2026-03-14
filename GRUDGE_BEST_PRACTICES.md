# Grudge Best Practices

Cross-project conventions for the Grudge Studio ecosystem.

## Projects & Domains

| Project | Domain | Repo | Role |
|---------|--------|------|------|
| Grudge Warlords | `grudgewarlords.com` | GrudgeWars | Browser MMO + public API |
| Grudge Studio | `public-fawn-nine.vercel.app` → `grudgestudio.com` | public | Marketing / tools hub / account portal |
| Auth Gateway | `auth.grudgestudio.com` | auth-gateway | Shared auth (Discord, username/password, guest) |
| PuterGrudge | — | PuterGrudge | GrudgeOS dev environment |

## Identity & Auth

### The `grudge_id`
Every player across all Grudge apps is identified by a single `grudge_id`. This ID is:
- Generated at account creation (in each app's auth system)
- Stored on `accounts.grudge_id` in each app's DB
- The key for cross-origin player lookups via `/api/public/player-summary/:grudgeId`

### Session Tokens
- Each app issues JWT tokens stored in `localStorage` under `grudge_auth_token`.
- GrudgeWars also issues `grudge_session_token` for cloud sync.
- Cross-service token verification: GGE's `grudgeJwt.ts` middleware falls back to `POST GRUDGE_BACKEND_URL/auth/verify` if local JWT verification fails, enabling grudge-backend tokens to work across apps.

### Auth Methods
All Grudge apps support these login methods (direct DB, no external gateway):
1. **Discord OAuth** — `/api/auth/discord` + callback
2. **GitHub OAuth** — `/api/auth/github` + callback
3. **Google OAuth** — `/api/auth/google` + callback
4. **Username/password** — `POST /api/login` or `/api/register`
5. **Guest** — `POST /api/guest`
6. **Puter** — `POST /api/auth/puter`
7. **Wallet (Solana)** — `POST /api/auth/wallet`
8. **Phone/SMS** — `POST /api/auth/phone` (requires Twilio)

### localStorage Keys
Use the `grudge_` prefix for all keys:
- `grudge_auth_token` — session JWT
- `grudge_user_id` — current user's grudge_id
- `grudge_username` — display name
- `grudge_device_id` — guest device fingerprint
- `grudge_session_token` — GrudgeWars cloud sync token

## API Patterns

### Public Endpoints
Endpoints under `/api/public/*` require no authentication and are CORS-open to allowed origins. Use these for cross-site data display (player cards, leaderboards, stats).

### Authenticated Endpoints
Endpoints under `/api/auth/*`, `/api/sync/*`, `/api/arena/*`, etc. require a valid session token in the `Authorization` header: `Bearer <token>`.

### CORS
When adding a new Grudge app that needs to call GrudgeWars APIs, add its origin to `ALLOWED_ORIGINS` in both `server.js` and `api/index.js`. Current allowed origins:
- `https://grudgewarlords.com`
- `https://gdevelop-assistant.vercel.app`
- `https://warlord-crafting-suite.vercel.app`
- `https://grudgestudio.com` / `https://www.grudgestudio.com`
- `https://grudgeplatform.com`
- `http://localhost:*` (dev)
- `*.puter.com` / `*.puter.site` (Puter apps)

### API Client Pattern
Each consuming project should have a typed API client (see `src/lib/grudge-warlords-api.ts` in the public repo):
- Use a shared `fetch` wrapper with error handling that returns `null` on failure
- Export typed interfaces for all response shapes
- Group methods on a single exported object (`warlordsApi.*`)

## Data Sync

### Puter KV
GrudgeWars uses Puter's key-value store for cloud saves:
- Key pattern: `grudge:save:<grudge_id>`, `grudge:account:<grudge_id>`, `grudge:prefs:<grudge_id>`
- Client-side sync is debounced at 30 seconds (`src/services/cloudSync.js`)
- Server-side sync goes through `/api/sync/push` and `/api/sync/pull`

### Player Summary (Cross-Platform)
The `/api/public/player-summary/:grudgeId` endpoint returns a read-only snapshot of a player's state. This is the **only** way external apps should read player data — never query the DB directly from another project.

## UI & Branding

### Theme Tokens
All projects use the Warlord Crafting Suite color palette via Tailwind:
- `primary` — main brand color
- `gold`, `gold-light`, `gold-dark` — accent colors
- `bg-card`, `text-foreground`, `text-muted-foreground` — semantic tokens
- Dark gradient backgrounds: `from-gray-900 via-black to-gray-900`

### Component Library
The public site uses **shadcn/ui** (Radix primitives + Tailwind). Prefer these over custom components:
- `Card`, `Badge`, `Button` for content blocks
- `lucide-react` for icons

### Auth-Gated UI
For features requiring login, show the action button but change its label:
- Authenticated: `<ExternalLink /> Launch Tool`
- Not authenticated: `<LogIn /> Sign In to Access`

Clicking while unauthenticated should show a login prompt modal, not redirect silently.

## Deployment

### Vercel
All active projects deploy to Vercel:
- Push to `main` triggers auto-deploy
- Serverless functions go in `api/` directory
- `vercel.json` rewrites `/api/*` to the serverless function
- Environment variables are set in Vercel project settings, **never** committed

### Naming
- Branches: `feature/<name>`, `fix/<name>`, `docs/<name>`
- Commits: conventional commits — `feat:`, `fix:`, `docs:`, `chore:`
- Co-author line on AI-assisted commits: `Co-Authored-By: Oz <oz-agent@warp.dev>`

## Adding a New Grudge App

1. Set up auth using direct DB pattern (see GGE `grudgeAuth.ts` for reference)
2. Add your origin to GrudgeWars `ALLOWED_ORIGINS` in `server.js` and `api/index.js`
3. Add your origin to grudge-backend `CORS_ORIGINS` in `.env`
4. Create a typed API client for any GrudgeWars endpoints you need
5. Use `grudge_id` as the cross-platform player identifier
6. Follow the `grudge_` localStorage key prefix convention
7. Use the shared Tailwind theme tokens for consistent branding
8. Set `GRUDGE_BACKEND_URL` for cross-service token verification

---

*May your grudges be eternal.*
