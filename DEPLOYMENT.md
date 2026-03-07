# Grudge Warlords - Deployment Guide

## Architecture Overview

This project has two main components:
1. **Frontend** - React/Vite SPA (can be deployed to Vercel, Netlify, etc.)
2. **Backend** - Express server + Discord bot (requires persistent process)

> ⚠️ **Important**: The Discord bot and arena system require a persistent server. Serverless platforms like Vercel can only host the frontend.

---

## Option 1: Split Deployment (Recommended)

### Frontend → Vercel
### Backend → Railway / Render / Fly.io

### Step 1: Deploy Backend to Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repo
3. Set environment variables:
   ```
   NODE_ENV=production
   PUBLIC_URL=https://your-railway-app.up.railway.app
   DISCORD_CLIENT_ID=...
   DISCORD_CLIENT_SECRET=...
   DISCORD_BOT_TOKEN=...
   DISCORD_GUILD_ID=...
   DISCORD_GRUDGE_WEBHOOK=...
   GRUDGE_ACCOUNT_DB=...
   DATABASE_URL=...          # Optional: Warlord-Crafting-Suite Neon DB
   ```
4. Set start command: `npm run start`
5. Note your Railway URL (e.g., `https://grudge-api.up.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. Create a new project on [Vercel](https://vercel.com)
2. Connect your GitHub repo
3. Set environment variable:
   ```
   BACKEND_URL=https://your-railway-app.up.railway.app
   ```
4. Deploy!

### Step 3: Update Discord OAuth Redirect URIs

In your [Discord Developer Portal](https://discord.com/developers/applications):
1. Go to OAuth2 → Redirects
2. Add both URLs:
   - `https://your-vercel-app.vercel.app/discordauth`
   - `https://your-railway-app.up.railway.app/discordauth`
   - `https://your-vercel-app.vercel.app/api/external/callback`

---

## Option 2: Single Server Deployment

Deploy everything to a platform that supports persistent processes:

### Railway / Render / Fly.io

1. Create new project
2. Connect GitHub repo
3. Set all environment variables (see `.env.example`)
4. Set build command: `npm run build`
5. Set start command: `npm run start`
6. The server will serve both API and static frontend

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (use Neon, Supabase, or local)

### Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your values

# Run both servers (frontend + backend)
npm run dev:all

# Or run separately:
npm run dev:server  # Backend on port 3001
npm run dev         # Frontend on port 5000
```

### Development URLs
- Frontend: http://localhost:5000
- API: http://localhost:3001 (proxied through Vite)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_URL` | Yes | Your deployed URL for OAuth redirects |
| `DISCORD_CLIENT_ID` | Yes | Discord OAuth app client ID |
| `DISCORD_CLIENT_SECRET` | Yes | Discord OAuth app secret |
| `DISCORD_BOT_TOKEN` | Yes | Discord bot token |
| `DISCORD_GUILD_ID` | Yes | Your Discord server ID |
| `GRUDGE_ACCOUNT_DB` | Yes | PostgreSQL connection string |
| `DATABASE_URL` | No | Warlord-Crafting-Suite Neon PostgreSQL connection string (enables crafting/inventory integration) |
| `DISCORD_GRUDGE_WEBHOOK` | No | Webhook for arena announcements |
| `GAME_API_GRUDA` | No | Admin API token |

---

## Discord App Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Go to OAuth2:
   - Add redirect URIs for your deployed URLs
   - Note the Client ID and Client Secret
4. Go to Bot:
   - Create bot
   - Copy the token
   - Enable "Server Members Intent" if needed
5. Invite bot to your server with required permissions

---

## Troubleshooting

### "Invalid redirect_uri" on Discord login
- Ensure your `PUBLIC_URL` matches what's in Discord OAuth redirects
- Check that the redirect URI exactly matches (including trailing slashes)

### Bot not responding
- Check `DISCORD_BOT_TOKEN` is set correctly
- Ensure bot has been invited to the guild
- Check `DISCORD_GUILD_ID` matches your server

### Database connection failed
- Verify `GRUDGE_ACCOUNT_DB` connection string
- Ensure SSL is enabled if required (`?sslmode=require`)
- Check that the database allows connections from your server's IP

### Crafting Suite not connecting
- Verify `DATABASE_URL` points to the Warlord-Crafting-Suite Neon database
- The suite integration is optional — if `DATABASE_URL` is not set, the game runs without crafting features
- Check the `/api/crafting/status` endpoint for connection status
- Suite sync in save/load is best-effort and won't break the game if unavailable
