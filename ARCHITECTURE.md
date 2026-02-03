# Grudge Warlords MMO - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Local Development Machine                    Production VPS Server
┌────────────────────┐                       ┌──────────────────────┐
│                    │                       │                      │
│  Unity Project     │                       │   Deployed Server    │
│  ├─ Game Logic    │                       │   ├─ Node.js API    │
│  ├─ Assets        │                       │   ├─ Unity Server   │
│  └─ Server Build  │                       │   └─ Static Files   │
│         │          │                       │          │           │
│         ▼          │                       │          ▼           │
│  Build Script      │   SSH/SCP Deploy     │   Docker Containers  │
│  (build-server.sh) │──────────────────────▶│   ├─ Game Server   │
│         │          │                       │   ├─ PostgreSQL     │
│         ▼          │                       │   ├─ Redis          │
│  ./builds/server/  │                       │   └─ Nginx          │
│                    │                       │                      │
│  Deploy Script     │                       │   Service Manager   │
│  (deploy-to-vps.sh)│──────────────────────▶│   ├─ Docker Compose│
│         │          │                       │   ├─ PM2            │
│         │          │                       │   └─ systemd        │
│         ▼          │                       │                      │
│  CLI Manager       │   Monitoring         │   Logs & Metrics    │
│  (grudge-cli.js)   │◀──────────────────────│   └─ /logs/         │
│                    │                       │                      │
└────────────────────┘                       └──────────────────────┘
```

## Production Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTION STACK                            │
└─────────────────────────────────────────────────────────────────┘

Internet Traffic
      │
      ▼
┌──────────────┐
│ Firewall/UFW │  Ports: 22, 80, 443, 3000, 7777
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Nginx     │  Reverse Proxy & Load Balancer
│  Port 80/443 │  - SSL/TLS Termination
└──────┬───────┘  - Rate Limiting
       │          - Static File Serving
       │
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│  Node.js    │      │ Unity Server │
│  API Server │      │ Game Logic   │
│  Port 3000  │      │ Port 7777    │
└──────┬──────┘      └──────┬───────┘
       │                    │
       ├────────────────────┘
       │
       ├──────────┬──────────┐
       │          │          │
       ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌─────────┐
│PostgreSQL│ │ Redis  │ │  Logs   │
│  Port    │ │ Cache  │ │ Winston │
│  5432    │ │ Port   │ │ Rotate  │
└──────────┘ │ 6379   │ └─────────┘
             └────────┘
```

## Directory Structure

```
StandaloneGrudge/
├── server/                     # Node.js API server
│   └── index.js               # Main server entry point
├── scripts/                   # Automation scripts
│   ├── build-server.sh       # Unity server build
│   ├── deploy-to-vps.sh      # VPS deployment
│   ├── grudge-cli.js         # AI-powered CLI
│   └── test-vps-connection.sh # Connection test
├── deployment/                # VPS configuration
│   ├── setup-vps.sh          # Initial VPS setup
│   ├── restart-services.sh   # Service management
│   ├── nginx.conf            # Nginx config
│   └── grudge-warlords.service # systemd service
├── logs/                      # Application logs
│   └── README.md             # Log documentation
├── builds/                    # Build outputs (gitignored)
│   └── server/               # Unity server builds
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── package.json              # Node.js dependencies
├── Dockerfile                # Container image
├── docker-compose.yml        # Multi-container setup
├── ecosystem.config.js       # PM2 configuration
├── setup.sh                  # Quick setup script
├── DEPLOYMENT.md             # Deployment guide
└── README.md                 # Main documentation
```

## Deployment Options

### Option 1: Docker Compose (Recommended)
```bash
# Start entire stack
docker-compose up -d

# Benefits:
# - Isolated containers
# - Easy scaling
# - Consistent environment
# - Built-in networking
```

### Option 2: PM2 Process Manager
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Benefits:
# - Cluster mode
# - Auto-restart
# - Log management
# - Zero-downtime reload
```

### Option 3: systemd Service
```bash
# Install service
sudo cp deployment/grudge-warlords.service /etc/systemd/system/
sudo systemctl enable grudge-warlords
sudo systemctl start grudge-warlords

# Benefits:
# - System integration
# - Auto-start on boot
# - Resource limits
# - Security features
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      GAME CLIENT                              │
│  Unity Client connects to server on port 7777                │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                   UNITY SERVER (Port 7777)                    │
│  ├─ Game State Management                                    │
│  ├─ Player Synchronization                                   │
│  └─ Game Logic Processing                                    │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                  NODE.JS API (Port 3000)                      │
│  ├─ Authentication & Authorization                           │
│  ├─ Player Data Management                                   │
│  ├─ Leaderboards & Statistics                                │
│  └─ RESTful API Endpoints                                    │
└──────────────────┬───────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │
│              │      │              │
│ ├─ Players   │      │ ├─ Sessions  │
│ ├─ Scores    │      │ ├─ Cache     │
│ └─ Game Data │      │ └─ Queues    │
└──────────────┘      └──────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│  1. Network Security                        │
│     ├─ UFW Firewall                        │
│     ├─ fail2ban (Brute Force Protection)   │
│     └─ SSH Key Authentication              │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  2. Application Security                    │
│     ├─ Environment Variables (.env)        │
│     ├─ JWT Authentication                  │
│     ├─ API Rate Limiting                   │
│     └─ Input Validation                    │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  3. Container Security (Docker)             │
│     ├─ Non-root User                       │
│     ├─ Read-only Filesystem                │
│     └─ Resource Limits                     │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  4. Data Security                           │
│     ├─ Database SSL/TLS                    │
│     ├─ Password Hashing                    │
│     └─ Encrypted Connections               │
└─────────────────────────────────────────────┘
```

## CLI Features

```
┌────────────────────────────────────────────────────────────┐
│              Grudge Warlords CLI Manager                   │
└────────────────────────────────────────────────────────────┘

Commands:
┌──────────────┬──────────────────────────────────────────────┐
│ help         │ Show all available commands                  │
│ deploy       │ Deploy to VPS (build + upload + restart)     │
│ build        │ Build Unity server locally                   │
│ status       │ Check server status and configuration        │
│ logs [N]     │ Show last N lines of logs                    │
│ ai <query>   │ AI-powered assistance (OpenAI integration)   │
│ config       │ View/edit configuration                      │
│ exit         │ Exit the CLI                                 │
└──────────────┴──────────────────────────────────────────────┘

AI Integration:
├─ Natural language queries
├─ Troubleshooting assistance
├─ Performance optimization tips
└─ Configuration help
```

## Monitoring & Health Checks

```
Health Check Endpoints:
├─ GET /health          → Basic health status
├─ GET /api/status      → Server status & player count
└─ GET /api/info        → Server information

Monitoring Tools:
├─ Docker healthcheck   → Container health
├─ PM2 monitoring       → Process metrics
├─ Winston logging      → Application logs
└─ Sentry (optional)    → Error tracking
```

## Scaling Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    HORIZONTAL SCALING                       │
└────────────────────────────────────────────────────────────┘

Small Scale (1-100 players)
┌──────────────────────┐
│  Single VPS          │
│  ├─ All services     │
│  └─ Shared resources │
└──────────────────────┘

Medium Scale (100-1000 players)
┌──────────────────────┐  ┌──────────────────────┐
│  Game Servers (x3)   │  │  Database Server     │
│  ├─ Unity Server     │  │  ├─ PostgreSQL       │
│  └─ Load Balanced    │──│  └─ Redis            │
└──────────────────────┘  └──────────────────────┘

Large Scale (1000+ players)
┌──────────────────────┐  ┌──────────────────────┐
│  Load Balancer       │  │  DB Cluster          │
│  (Multiple Nginx)    │  │  ├─ Primary DB       │
└──────┬───────────────┘  │  ├─ Read Replicas    │
       │                  │  └─ Redis Cluster    │
       ├─────────┬────────┴──────────────────────┘
       │         │
┌──────▼────┐ ┌─▼──────────┐
│ Game      │ │ Game       │  (Auto-scaling)
│ Server #1 │ │ Server #N  │
└───────────┘ └────────────┘
```

---

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)
