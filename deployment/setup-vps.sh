#!/bin/bash

# Grudge Warlords MMO - VPS Initial Setup Script
# Run this once on a fresh VPS to set up the environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Grudge Warlords VPS Initial Setup    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
apt-get update
apt-get upgrade -y
echo -e "${GREEN}✓ System updated${NC}"

echo ""
echo -e "${YELLOW}Step 2: Installing essential packages...${NC}"
apt-get install -y \
    curl \
    git \
    build-essential \
    ufw \
    fail2ban \
    htop \
    vim
echo -e "${GREEN}✓ Essential packages installed${NC}"

echo ""
echo -e "${YELLOW}Step 3: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 5: Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js installed${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 6: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 7: Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw allow 3000/tcp   # Game API
ufw allow 7777/tcp   # Unity Server
echo -e "${GREEN}✓ Firewall configured${NC}"

echo ""
echo -e "${YELLOW}Step 8: Creating deployment directory...${NC}"
DEPLOY_DIR="/var/www/grudge-warlords"
mkdir -p $DEPLOY_DIR
chown -R $SUDO_USER:$SUDO_USER $DEPLOY_DIR
echo -e "${GREEN}✓ Deployment directory created: $DEPLOY_DIR${NC}"

echo ""
echo -e "${YELLOW}Step 9: Setting up log rotation...${NC}"
cat > /etc/logrotate.d/grudge-warlords << EOF
$DEPLOY_DIR/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $SUDO_USER $SUDO_USER
    sharedscripts
}
EOF
echo -e "${GREEN}✓ Log rotation configured${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    VPS setup completed successfully!   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Deployment directory: ${GREEN}$DEPLOY_DIR${NC}"
echo -e "Next steps:"
echo -e "  1. Configure your .env file locally"
echo -e "  2. Run ./scripts/deploy-to-vps.sh to deploy"
echo ""
