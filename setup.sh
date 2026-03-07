#!/bin/bash

# Quick start script for Grudge Warlords MMO setup

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Grudge Warlords MMO - Quick Setup    ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "✓ Node.js $(node --version) found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✓ npm $(npm --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env from template..."
    cp .env.example .env
    echo "✓ .env created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env with your configuration before deploying!"
else
    echo "✓ .env already exists"
fi
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs builds/server
echo "✓ Directories created"
echo ""

echo "╔════════════════════════════════════════╗"
echo "║        Setup Complete! 🎉             ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your configuration"
echo "  2. Run 'npm run cli' to start the management CLI"
echo "  3. Run 'npm run deploy' to deploy to your VPS"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"
echo ""
