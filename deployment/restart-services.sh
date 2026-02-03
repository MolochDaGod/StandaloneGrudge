#!/bin/bash

# Grudge Warlords MMO - Service Restart Script
# This script runs on the VPS to restart services after deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Restarting Grudge Warlords services...${NC}"

# Check if Docker is available
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    echo -e "${YELLOW}Using Docker to restart services...${NC}"
    
    # Stop existing containers
    if command -v docker-compose &> /dev/null; then
        docker-compose down 2>/dev/null || true
        docker-compose up -d
    else
        docker compose down 2>/dev/null || true
        docker compose up -d
    fi
    
    echo -e "${GREEN}✓ Docker services restarted${NC}"
else
    echo -e "${YELLOW}Docker not found, checking for systemd services...${NC}"
    
    # Restart systemd services if they exist
    if systemctl is-active --quiet grudge-warlords; then
        sudo systemctl restart grudge-warlords
        echo -e "${GREEN}✓ grudge-warlords service restarted${NC}"
    else
        echo -e "${YELLOW}⚠ No systemd service found${NC}"
    fi
fi

# Check if PM2 is available for Node.js process management
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Restarting PM2 processes...${NC}"
    pm2 restart all || pm2 start ecosystem.config.js
    echo -e "${GREEN}✓ PM2 processes restarted${NC}"
fi

echo -e "${GREEN}Service restart completed${NC}"
