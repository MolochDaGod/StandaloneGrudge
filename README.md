# Grudge Warlords MMO - StandaloneGrudge

**Deployment and merge of Unity and Gruda - Complete Infrastructure**

This repository provides a complete production-ready infrastructure for deploying and managing the Grudge Warlords MMO server, including VPS deployment automation, server build management, AI-powered CLI tools, and containerized deployment options.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 3. Deploy to VPS
npm run deploy

# Or use the interactive CLI
npm run cli
```

## 📋 Features

- ✅ **Automated VPS Deployment** - One-command deployment with backup and rollback
- ✅ **Server Build Management** - Automated Unity server builds
- ✅ **AI-Powered CLI** - Interactive management with OpenAI integration
- ✅ **Docker Support** - Full containerization with Docker Compose
- ✅ **Production Ready** - Nginx, PM2, logging, monitoring
- ✅ **Security First** - Environment-based config, firewall, SSL support

## 📚 Documentation

For detailed setup and deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 🛠️ Available Commands

```bash
npm run start      # Start the server
npm run build      # Build Unity server
npm run deploy     # Deploy to VPS
npm run cli        # Interactive CLI management
npm run docker:up  # Start with Docker
```

## 🔧 Configuration

All configuration is managed through environment variables. Copy `.env.example` to `.env` and configure:

- VPS connection details
- Database credentials
- Unity server settings
- AI API keys (optional)
- Security settings

## 📦 What's Included

```
├── scripts/              # Deployment and build scripts
│   ├── deploy-to-vps.sh # VPS deployment automation
│   ├── build-server.sh  # Unity server build
│   └── grudge-cli.js    # AI-powered CLI tool
├── deployment/          # VPS setup and service management
│   ├── setup-vps.sh     # Initial VPS configuration
│   ├── restart-services.sh
│   └── nginx.conf       # Nginx reverse proxy config
├── server/              # Node.js server
├── docker-compose.yml   # Docker orchestration
├── Dockerfile           # Container definition
├── ecosystem.config.js  # PM2 process management
└── .env.example         # Environment template
```

## 🤖 AI CLI Assistant

The included CLI tool provides AI-powered assistance for server management:

```bash
npm run cli
> ai how do I optimize server performance?
> deploy
> status
> logs 100
```

## 🐳 Docker Deployment

Deploy the entire stack with Docker:

```bash
docker-compose up -d
```

Includes: Game server, PostgreSQL, Redis, and Nginx.

## 📖 Support

- Full documentation: [DEPLOYMENT.md](DEPLOYMENT.md)
- Issues: [GitHub Issues](https://github.com/MolochDaGod/StandaloneGrudge/issues)

## ⚔️ May your grudges be eternal!

---

*For detailed deployment instructions, troubleshooting, and advanced configuration, see [DEPLOYMENT.md](DEPLOYMENT.md)*
