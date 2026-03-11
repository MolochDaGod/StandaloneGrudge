#!/usr/bin/env node
/**
 * Discord Credential Verifier for Grudge Studio
 * 
 * Tests DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and DISCORD_BOT_TOKEN
 * to ensure they all belong to the SAME Discord application.
 *
 * Usage:
 *   node scripts/test-discord-creds.mjs
 *
 * Set env vars before running, or create a .env file:
 *   DISCORD_CLIENT_ID=...
 *   DISCORD_CLIENT_SECRET=...
 *   DISCORD_BOT_TOKEN=...
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Load .env if present ────────────────────────────────────────────────────
try {
  const envPath = resolve(process.cwd(), '.env');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

// ── Read credentials ────────────────────────────────────────────────────────
const CLIENT_ID = (process.env.DISCORD_CLIENT_ID || '').trim();
const CLIENT_SECRET = (process.env.DISCORD_CLIENT_SECRET || '').trim();
const BOT_TOKEN = (process.env.DISCORD_BOT_TOKEN || '').trim();

const REDIRECT_URIS = [
  'https://grudgewarlords.com/discordauth',
  'https://grudgewarlords.com/api/external/callback',
];

const ok = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg) => console.log(`  ❌ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const info = (msg) => console.log(`  ℹ️  ${msg}`);

console.log('\n══════════════════════════════════════════════════════');
console.log('  Grudge Studio — Discord Credential Verifier');
console.log('══════════════════════════════════════════════════════\n');

// ── Step 1: Check which vars are set ────────────────────────────────────────
console.log('1) Environment Variables');
if (CLIENT_ID) ok(`DISCORD_CLIENT_ID = ${CLIENT_ID}`);
else fail('DISCORD_CLIENT_ID is NOT SET');

if (CLIENT_SECRET) ok(`DISCORD_CLIENT_SECRET = ${CLIENT_SECRET.slice(0, 4)}...${CLIENT_SECRET.slice(-4)}`);
else fail('DISCORD_CLIENT_SECRET is NOT SET');

if (BOT_TOKEN) ok(`DISCORD_BOT_TOKEN = ${BOT_TOKEN.slice(0, 10)}...${BOT_TOKEN.slice(-6)}`);
else fail('DISCORD_BOT_TOKEN is NOT SET');

if (!CLIENT_ID || !CLIENT_SECRET || !BOT_TOKEN) {
  console.log('\n⛔ Missing credentials. Set all three env vars and retry.\n');
  process.exit(1);
}

// ── Step 2: Test Bot Token → get bot user + application info ────────────────
console.log('\n2) Bot Token → Application Check');

let botAppId = null;
let botUsername = null;

try {
  const res = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bot ${BOT_TOKEN}` },
  });
  if (!res.ok) {
    const err = await res.text();
    fail(`Bot token is INVALID (${res.status}): ${err}`);
  } else {
    const bot = await res.json();
    botUsername = bot.username;
    botAppId = bot.id;
    ok(`Bot user: ${bot.username}#${bot.discriminator}  (id: ${bot.id})`);

    if (bot.id === CLIENT_ID) {
      ok('Bot token matches DISCORD_CLIENT_ID ✓');
    } else {
      fail(`MISMATCH! Bot belongs to app ${bot.id} but DISCORD_CLIENT_ID is ${CLIENT_ID}`);
      fail('This is likely the "two different bots" problem.');
      info(`Fix: Use Client ID ${bot.id} OR get a bot token from app ${CLIENT_ID}`);
    }
  }
} catch (err) {
  fail(`Network error testing bot token: ${err.message}`);
}

// ── Step 3: Test Application info via bot token ─────────────────────────────
console.log('\n3) Application Details (via Bot Token)');

try {
  const res = await fetch('https://discord.com/api/v10/applications/@me', {
    headers: { Authorization: `Bot ${BOT_TOKEN}` },
  });
  if (res.ok) {
    const app = await res.json();
    ok(`App name: "${app.name}"  (id: ${app.id})`);
    if (app.redirect_uris && app.redirect_uris.length > 0) {
      info(`Registered redirect URIs:`);
      for (const uri of app.redirect_uris) {
        console.log(`       • ${uri}`);
      }
      // Check required URIs
      for (const required of REDIRECT_URIS) {
        if (app.redirect_uris.includes(required)) {
          ok(`Has required redirect: ${required}`);
        } else {
          fail(`MISSING redirect: ${required}`);
          info('Add it at https://discord.com/developers/applications/' + app.id + '/oauth2');
        }
      }
    } else {
      warn('No redirect URIs returned (may require OAuth2 scope to read)');
      info(`Manually verify at: https://discord.com/developers/applications/${app.id}/oauth2`);
    }

    if (app.bot_public !== undefined) {
      info(`Bot public: ${app.bot_public}`);
    }
  } else {
    warn(`Could not fetch app details (${res.status}) — check manually in Discord Developer Portal`);
  }
} catch (err) {
  warn(`Network error: ${err.message}`);
}

// ── Step 4: Test Client Credentials (client_id + client_secret) ─────────────
console.log('\n4) Client Credentials Grant Test');

try {
  const res = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'identify',
    }),
  });
  if (res.ok) {
    const data = await res.json();
    ok(`Client credentials grant succeeded (token type: ${data.token_type})`);

    // Use the token to verify which app it belongs to
    if (data.access_token) {
      const appRes = await fetch('https://discord.com/api/v10/oauth2/@me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (appRes.ok) {
        const appInfo = await appRes.json();
        ok(`OAuth app: "${appInfo.application?.name}"  (id: ${appInfo.application?.id})`);
        if (appInfo.application?.id !== CLIENT_ID) {
          fail(`OAuth app ID ${appInfo.application?.id} doesn't match CLIENT_ID ${CLIENT_ID}!`);
        }
        if (botAppId && appInfo.application?.id !== botAppId) {
          fail(`OAuth app ID ${appInfo.application?.id} ≠ Bot app ID ${botAppId} — DIFFERENT APPS!`);
        } else if (botAppId) {
          ok('OAuth app matches Bot app ✓');
        }
      }
    }
  } else {
    const err = await res.text();
    fail(`Client credentials FAILED (${res.status}): ${err}`);
    if (res.status === 401) {
      fail('CLIENT_SECRET does not match CLIENT_ID — they are from different Discord apps!');
    }
  }
} catch (err) {
  fail(`Network error: ${err.message}`);
}

// ── Step 5: Check production endpoint ───────────────────────────────────────
console.log('\n5) Production Endpoint Check');

try {
  const res = await fetch('https://grudgewarlords.com/api/discord/login');
  const data = await res.json();
  const prodId = data.clientId;
  ok(`Production client ID: ${prodId}`);
  if (prodId === CLIENT_ID) {
    ok('Matches local DISCORD_CLIENT_ID ✓');
  } else {
    warn(`Production uses ${prodId} but local env has ${CLIENT_ID}`);
    info('If you change creds, you must update Vercel env vars too.');
  }
} catch (err) {
  warn(`Could not reach production: ${err.message}`);
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════');
console.log('  Summary');
console.log('══════════════════════════════════════════════════════');

if (botAppId === CLIENT_ID) {
  ok('All credentials appear to belong to the SAME Discord application.');
  console.log(`\n  App ID: ${CLIENT_ID}`);
  if (botUsername) console.log(`  Bot:    ${botUsername}`);
  console.log(`\n  Required redirect URIs (add in Discord Developer Portal if missing):`);
  for (const uri of REDIRECT_URIS) {
    console.log(`    • ${uri}`);
  }
} else {
  fail('CREDENTIAL MISMATCH DETECTED');
  console.log(`\n  DISCORD_CLIENT_ID points to app: ${CLIENT_ID}`);
  console.log(`  DISCORD_BOT_TOKEN points to app: ${botAppId || '(could not determine)'}`);
  console.log('\n  Fix: Go to https://discord.com/developers/applications');
  console.log('  Pick ONE app and copy all 3 values from it:');
  console.log('    • OAuth2 → Client ID   → DISCORD_CLIENT_ID');
  console.log('    • OAuth2 → Client Secret → DISCORD_CLIENT_SECRET');
  console.log('    • Bot → Token           → DISCORD_BOT_TOKEN');
}

console.log('');
