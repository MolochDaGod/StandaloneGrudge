#!/bin/bash

# Grudge Warlords MMO - VPS Deployment Script
# This script handles deployment to the production VPS

set -e  # Exit on any error

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found. Copy .env.example to .env and configure it."
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Grudge Warlords MMO - VPS Deploy     ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo ""

# Verify required environment variables
if [ -z "$VPS_HOST" ] || [ -z "$VPS_USER" ] || [ -z "$VPS_DEPLOY_PATH" ]; then
    echo -e "${RED}Error: VPS configuration missing in .env${NC}"
    echo "Required: VPS_HOST, VPS_USER, VPS_DEPLOY_PATH"
    exit 1
fi

# Function to run commands on VPS
run_on_vps() {
    if [ -n "$VPS_SSH_KEY_PATH" ]; then
        ssh -i "$VPS_SSH_KEY_PATH" "$VPS_USER@$VPS_HOST" "$1"
    else
        ssh "$VPS_USER@$VPS_HOST" "$1"
    fi
}

# Function to copy files to VPS
copy_to_vps() {
    if [ -n "$VPS_SSH_KEY_PATH" ]; then
        scp -i "$VPS_SSH_KEY_PATH" -r "$1" "$VPS_USER@$VPS_HOST:$2"
    else
        scp -r "$1" "$VPS_USER@$VPS_HOST:$2"
    fi
}

echo -e "${YELLOW}Step 1: Testing VPS connection...${NC}"
if run_on_vps "echo 'Connection successful'"; then
    echo -e "${GREEN}✓ VPS connection established${NC}"
else
    echo -e "${RED}✗ Failed to connect to VPS${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Preparing deployment directory...${NC}"
run_on_vps "mkdir -p $VPS_DEPLOY_PATH"
run_on_vps "mkdir -p $VPS_DEPLOY_PATH/backups"
echo -e "${GREEN}✓ Deployment directory ready${NC}"

echo ""
echo -e "${YELLOW}Step 3: Creating backup of current deployment...${NC}"
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
run_on_vps "if [ -d $VPS_DEPLOY_PATH/current ]; then cp -r $VPS_DEPLOY_PATH/current $VPS_DEPLOY_PATH/backups/$BACKUP_NAME; echo 'Backup created'; else echo 'No existing deployment to backup'; fi"
echo -e "${GREEN}✓ Backup completed${NC}"

echo ""
echo -e "${YELLOW}Step 4: Building server locally...${NC}"
if [ -f "./scripts/build-server.sh" ]; then
    bash ./scripts/build-server.sh
    echo -e "${GREEN}✓ Server built successfully${NC}"
else
    echo -e "${YELLOW}⚠ Build script not found, skipping local build${NC}"
fi

echo ""
echo -e "${YELLOW}Step 5: Uploading files to VPS...${NC}"
copy_to_vps "./" "$VPS_DEPLOY_PATH/new-deployment"
echo -e "${GREEN}✓ Files uploaded${NC}"

echo ""
echo -e "${YELLOW}Step 6: Installing dependencies on VPS...${NC}"
run_on_vps "cd $VPS_DEPLOY_PATH/new-deployment && if [ -f package.json ]; then npm install --production; fi"
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo -e "${YELLOW}Step 7: Switching to new deployment...${NC}"
run_on_vps "rm -rf $VPS_DEPLOY_PATH/current && mv $VPS_DEPLOY_PATH/new-deployment $VPS_DEPLOY_PATH/current"
echo -e "${GREEN}✓ Deployment switched${NC}"

echo ""
echo -e "${YELLOW}Step 8: Restarting services...${NC}"
run_on_vps "cd $VPS_DEPLOY_PATH/current && if [ -f deployment/restart-services.sh ]; then bash deployment/restart-services.sh; fi"
echo -e "${GREEN}✓ Services restarted${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Deployment completed successfully  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Deployed to: ${GREEN}$VPS_USER@$VPS_HOST:$VPS_DEPLOY_PATH${NC}"
echo -e "Backup saved as: ${GREEN}$BACKUP_NAME${NC}"
