#!/bin/bash

# VPS connection test script
# Tests connectivity to your configured VPS

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Testing VPS connection...${NC}\n"

# Check if VPS_HOST is configured
if [ -z "$VPS_HOST" ] || [ "$VPS_HOST" == "your-vps-hostname-or-ip" ]; then
    echo -e "${RED}✗ VPS_HOST not configured in .env${NC}"
    exit 1
fi

echo -e "VPS Host: ${GREEN}$VPS_HOST${NC}"
echo -e "VPS User: ${GREEN}$VPS_USER${NC}"
echo ""

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"

SSH_CMD="ssh"
if [ -n "$VPS_SSH_KEY_PATH" ] && [ "$VPS_SSH_KEY_PATH" != "~/.ssh/grudge_warlords_deploy_key" ]; then
    SSH_CMD="ssh -i $VPS_SSH_KEY_PATH"
fi

if $SSH_CMD -o ConnectTimeout=10 -o BatchMode=yes "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check VPS_HOST and VPS_USER in .env"
    echo "  2. Verify SSH key path: $VPS_SSH_KEY_PATH"
    echo "  3. Ensure SSH key permissions: chmod 600 $VPS_SSH_KEY_PATH"
    echo "  4. Test manually: ssh $VPS_USER@$VPS_HOST"
    exit 1
fi

# Test deployment directory
echo -e "${YELLOW}Checking deployment directory...${NC}"
if $SSH_CMD "$VPS_USER@$VPS_HOST" "test -d $VPS_DEPLOY_PATH && echo 'exists'" 2>/dev/null | grep -q "exists"; then
    echo -e "${GREEN}✓ Deployment directory exists: $VPS_DEPLOY_PATH${NC}"
else
    echo -e "${YELLOW}⚠ Deployment directory does not exist${NC}"
    echo -e "  Run deployment/setup-vps.sh on your VPS to create it"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  VPS connection test completed         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
