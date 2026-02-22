# Changelog

## [2026-02-22b] — Env Var Sanitization

### Fixed
- **Discord OAuth broken on Vercel** — `DISCORD_CLIENT_ID` env var had embedded `\r\n` from paste, poisoning all OAuth URLs and token exchanges
- Added `env()` helper that `.trim()`s all Discord-related env var reads defensively
- Applied to all 8 `process.env.DISCORD_*` call sites (client ID, secret, bot token, guild ID, webhook URL)

## [2026-02-22] — Arena UI + Stateless OAuth

### Added
- **ArenaPanel component** (`src/components/ArenaPanel.jsx`) — full-screen overlay with two panels:
  - **Post Squad** — select up to 3 heroes from roster and submit to ranked arena
  - **Challenge** — browse lobby, pick a team, and run server-side battle simulation
- **ARENA launcher button** on lobby/account screens (bottom-right pill)
- **HMAC-signed OAuth state tokens** (`signOAuthState` / `verifyOAuthState`) — stateless, survives Vercel cold starts
- **`POST /api/arena/battle/simulate`** — server-authoritative battle endpoint with challenge token validation
- **Discord webhook integration** on arena team submissions (auto-posts "New Arena Challenger!" embeds)

### Fixed
- **"Security check failed"** error on Discord login — caused by stale client-side OAuth state in localStorage/sessionStorage
- **"Token exchange failed"** error — caused by in-memory `pendingStates` Map being lost on Vercel serverless cold starts
- Removed all in-memory OAuth state storage; replaced with cryptographic HMAC-signed state tokens
- All 4 OAuth routes (discord login/callback, external login/callback) are now fully stateless
- Normalized redirect URIs to canonical `grudgewarlords.com` domain (removed www/replit/platform references)
- Updated `DISCORD_GUILD_ID` fallback to correct guild `960983121019437076`

### Changed
- `discordauth.html` — removed client-side state mismatch check; server validates via HMAC signature
- `DiscordAuth.jsx` — same client-side state check removal
- Arena challenge tokens use same HMAC pattern (30-minute TTL, replay-resistant)
- Legacy nonce-based battle flow returns 410 with migration instructions

### Infrastructure
- Vercel environment variables configured for all environments (production, preview, development)
- CORS and CSP updated to only allow `grudgewarlords.com` origins

## [2026-02-21] — Equipment & Combat Polish

### Fixed
- Equipment tab: slot frames, ghost icons, clipping issues
- SPA catch-all rewrite in `vercel.json` to resolve 404s

### Changed
- Combat polish, loot UX, and skill particle overhaul

## [2026-02-20] — Multi-Auth Deploy

### Added
- Multi-auth system: Grudge ID, Puter SSO, Discord OAuth
- Initial Vercel deployment
- Human ranger sprite improvements
- Sound mute button on opening screen
- Melee and ranged attack animations
