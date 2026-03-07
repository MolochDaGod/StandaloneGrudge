#!/bin/bash

# Grudge Warlords MMO - Server Build Script
# Builds the Unity server and prepares it for deployment

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Building Grudge Warlords Server...${NC}"

# Create build directory
BUILD_DIR="${UNITY_BUILD_PATH:-./builds/server}"
mkdir -p "$BUILD_DIR"

echo -e "${YELLOW}Build directory: $BUILD_DIR${NC}"

# Check if Unity project exists
if [ -d "./UnityProject" ]; then
    echo -e "${YELLOW}Unity project found, building server...${NC}"
    
    # Unity build command (requires Unity installed)
    # This is a placeholder - adjust based on your Unity project structure
    if command -v unity &> /dev/null; then
        unity -quit -batchmode \
            -projectPath ./UnityProject \
            -buildTarget Server \
            -buildLinux64Player "$BUILD_DIR/GrudgeWarlordsServer" \
            -logFile "$BUILD_DIR/build.log"
        echo -e "${GREEN}✓ Unity server build completed${NC}"
    else
        echo -e "${YELLOW}⚠ Unity not found in PATH, skipping Unity build${NC}"
        echo -e "${YELLOW}  Build manually or ensure Unity is installed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Unity project not found at ./UnityProject${NC}"
    echo -e "${YELLOW}  Creating placeholder build structure${NC}"
    mkdir -p "$BUILD_DIR"
    echo "Grudge Warlords Server Build" > "$BUILD_DIR/README.txt"
fi

# Copy server configuration
if [ -f ".env.example" ]; then
    cp .env.example "$BUILD_DIR/.env.example"
fi

echo -e "${GREEN}✓ Server build preparation completed${NC}"
echo -e "Build location: $BUILD_DIR"
