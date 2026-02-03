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
