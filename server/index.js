/**
 * Grudge Warlords MMO - Main Server Entry Point
 * This is a basic server setup that can be extended with game logic
 */

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    server: 'Grudge Warlords MMO',
    version: '1.0.0',
    status: 'online',
    players: {
      online: 0,
      max: parseInt(process.env.UNITY_MAX_PLAYERS) || 100
    },
    timestamp: new Date().toISOString()
  });
});

// Server info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: process.env.GAME_SERVER_NAME || 'Grudge Warlords Server',
    region: process.env.GAME_SERVER_REGION || 'unknown',
    maxPlayers: parseInt(process.env.UNITY_MAX_PLAYERS) || 100,
    tickRate: parseInt(process.env.UNITY_TICK_RATE) || 30,
    version: '1.0.0'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.url
  });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Grudge Warlords MMO Server Started  ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\nServer running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Unity Server Port: ${process.env.UNITY_SERVER_PORT || 7777}`);
  console.log('\nPress Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
