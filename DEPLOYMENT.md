
# Grudge Warlords MMO - Deployment Guide

## Overview

This repository contains the complete infrastructure setup for deploying and managing the Grudge Warlords MMO server. It includes VPS deployment scripts, server build automation, CLI AI management tools, and production environment configuration.

## Features

- 🚀 **Automated VPS Deployment** - One-command deployment to your production server
- 🏗️ **Server Build Management** - Automated Unity server builds
- 🤖 **AI-Powered CLI** - Interactive command-line interface with AI assistance
- 🐳 **Docker Support** - Containerized deployment with Docker Compose
- 🔒 **Security** - Environment-based configuration with secure defaults
- 📊 **Monitoring** - Built-in health checks and logging

## Quick Start

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/MolochDaGod/StandaloneGrudge.git
cd StandaloneGrudge

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration
```

### 2. Configure Your VPS

On your VPS server, run the initial setup script:

```bash
# Copy the setup script to your VPS
scp deployment/setup-vps.sh user@your-vps:/tmp/

# SSH into your VPS and run the setup
ssh user@your-vps
sudo bash /tmp/setup-vps.sh
```

This will install:
- Docker and Docker Compose
- Node.js and PM2
- Firewall configuration
- Log rotation
- Required directories

### 3. Deploy to VPS

```bash
# Build and deploy in one command
npm run deploy

# Or use the CLI
npm run cli
> deploy
```

## CLI Management Tool

The Grudge Warlords CLI provides an interactive interface for managing your server:

```bash
npm run cli
```

### Available Commands

- `help` - Show all available commands
- `deploy` - Deploy to VPS server
- `build` - Build the game server
- `status` - Check server status
- `logs [lines]` - Show server logs
- `ai <query>` - Ask AI for assistance
- `config [key] [val]` - View or set configuration
- `exit` - Exit the CLI

### AI Assistance

Configure your OpenAI API key in `.env` to enable AI-powered assistance:

```bash
OPENAI_API_KEY=your-api-key-here
```

Then use the AI command:

```bash
grudge-cli> ai how do I optimize server performance?
grudge-cli> ai what ports need to be open?
grudge-cli> ai troubleshoot connection issues
```

## Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

The Docker setup includes:
- Game server (Node.js + Unity)
- PostgreSQL database
- Redis cache
- Nginx reverse proxy

### Service Architecture

```
┌─────────────┐
│   Nginx     │  (Port 80/443)
│   Proxy     │
└──────┬──────┘
       │
┌──────▼──────────┐
│  Game Server    │  (Port 3000, 7777)
│  Node.js +      │
│  Unity Server   │
└──────┬──────────┘
       │
   ┌───▼────┐  ┌─────────┐
   │ Redis  │  │ Postgres│
   └────────┘  └─────────┘
```

## Environment Configuration

### Required Variables

```env
# VPS Configuration
VPS_HOST=your-server-ip
VPS_USER=root
VPS_SSH_KEY_PATH=~/.ssh/deploy_key
VPS_DEPLOY_PATH=/var/www/grudge-warlords

# Database
DB_HOST=localhost
DB_NAME=grudge_warlords
DB_USER=grudge_admin
DB_PASSWORD=secure-password

# Unity Server
UNITY_SERVER_PORT=7777
UNITY_MAX_PLAYERS=100

# AI (Optional)
OPENAI_API_KEY=sk-...
```

See `.env.example` for the complete list of configuration options.

## Build Process

### Unity Server Build

The build script automatically compiles your Unity server:

```bash
npm run build
```

Build outputs are placed in `./builds/server/`.

### Manual Build

If you need to build manually:

```bash
# For Unity 2022.3+
unity -quit -batchmode \
  -projectPath ./UnityProject \
  -buildTarget Server \
  -buildLinux64Player ./builds/server/GrudgeWarlordsServer
```

## Deployment Workflow

1. **Build Locally** - Server is built on your development machine
2. **Upload to VPS** - Files are transferred via SSH/SCP
3. **Install Dependencies** - npm packages installed on VPS
4. **Backup Current** - Previous deployment backed up
5. **Switch Deployment** - New version activated
6. **Restart Services** - Docker/PM2/systemd services restarted

### Rollback

If deployment fails, backups are stored in:
```
/var/www/grudge-warlords/backups/backup-YYYYMMDD-HHMMSS/
```

To rollback:
```bash
ssh user@vps
cd /var/www/grudge-warlords
cp -r backups/backup-YYYYMMDD-HHMMSS current
bash current/deployment/restart-services.sh
```

## Security Best Practices

1. **Never commit `.env`** - Always use `.env.example` as template
2. **Use SSH keys** - Disable password authentication
3. **Enable firewall** - Only open required ports
4. **Rotate secrets** - Change passwords and API keys regularly
5. **Enable SSL** - Use Let's Encrypt for HTTPS
6. **Monitor logs** - Check for suspicious activity

## Monitoring & Logs

### View Logs

```bash
# Using CLI
npm run cli
> logs 100

# Docker logs
docker-compose logs -f grudge-server

# PM2 logs
pm2 logs grudge-warlords-server
```

### Log Files

- Application logs: `./logs/grudge-warlords.log`
- PM2 logs: `./logs/pm2-*.log`
- Docker logs: `docker-compose logs`

## Troubleshooting

### Connection Issues

1. Check VPS firewall: `sudo ufw status`
2. Verify SSH key permissions: `chmod 600 ~/.ssh/deploy_key`
3. Test VPS connection: `ssh -i ~/.ssh/deploy_key user@vps`

### Build Failures

1. Verify Unity installation
2. Check Unity version in `.env`
3. Review build logs in `./builds/server/build.log`

### Deployment Failures

1. Check `.env` configuration
2. Verify VPS disk space: `df -h`
3. Review deployment logs
4. Test SSH connection manually

## Advanced Configuration

### Custom Nginx Configuration

Edit `deployment/nginx.conf` for custom routing, SSL, or rate limiting.

### PM2 Process Management

Edit `ecosystem.config.js` to configure:
- Process instances
- Memory limits
- Auto-restart policies
- Log rotation

### Database Migrations

```bash
# SSH into VPS
ssh user@vps
cd /var/www/grudge-warlords/current

# Run migrations (example)
npm run migrate
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/MolochDaGod/StandaloneGrudge/issues
- Documentation: This README
- AI Help: Use the CLI AI assistant

## License

MIT License - See LICENSE file for details

---

**May your grudges be eternal! ⚔️**
=======
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

