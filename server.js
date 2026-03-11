import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, testConnection } from './src/server/db.js';
import { registerDbRoutes } from './src/server/dbRoutes.js';
import { registerWalletRoutes } from './src/server/walletRoutes.js';
import { registerCraftingRoutes } from './src/server/craftingRoutes.js';
import { testSuiteConnection } from './src/server/suiteDb.js';
import { startBot, addUserToGuild } from './src/server/discordBot.js';
import {
  accountInit, accountLinkDiscord, accountLinkCharacters, accountGet,
  syncPush, syncPull, kvGet, kvSet, kvList, prefsGet, prefsSet,
  healthCheck as puterHealthCheck, deployLogAppend,
} from './api/lib/puter-service.js';

const __filename_server = fileURLToPath(import.meta.url);
const __dirname_server = path.dirname(__filename_server);

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (isProd ? 5000 : 3001);

const app = express();

const ALLOWED_ORIGINS = [
  'https://grudgewarlords.com',
  'https://www.grudgewarlords.com',
  'https://gdevelop-assistant.vercel.app',
  'https://grudgeplatform.com',
  'https://www.grudgeplatform.com',
  'https://molochdagod.github.io',
  'https://warlord-crafting-suite.vercel.app',
  'https://grudge-crafting.puter.site',
  'https://grudge-studio-app.puter.site',
];

const CSP_FRAME_ANCESTORS = [
  "frame-ancestors 'self'",
  'https://grudgewarlords.com',
  'https://www.grudgewarlords.com',
  'https://gdevelop-assistant.vercel.app',
  'https://grudgeplatform.com',
  'https://grudge-crafting.puter.site',
  'https://puter.com',
  'https://*.puter.com',
].join(' ');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', CSP_FRAME_ANCESTORS);

  const origin = req.headers.origin || '';
  const isPuterOrigin = origin.endsWith('.puter.com') || origin === 'https://puter.com';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin) || isPuterOrigin;

  if (origin && isAllowedOrigin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, X-Puter-Token, X-Api-Key');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '1mb' }));

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_BOT_TOKEN_VAL = process.env.DISCORD_BOT_TOKEN;
const BETA_CHANNEL_ID = '1394826401311625306';

const pendingStates = new Map();
const activeSessions = new Map();

// ── JWT Auth ────────────────────────────────────────────────────────────────
const JWT_SECRET = () => process.env.JWT_SECRET || process.env.GAME_API_GRUDA || 'grudge-default-secret';

function base64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function createJWT(payload, expiresInDays = 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInDays * 86400 };
  const segments = [base64url(JSON.stringify(header)), base64url(JSON.stringify(body))];
  const sig = crypto.createHmac('sha256', JWT_SECRET()).update(segments.join('.')).digest('base64url');
  return [...segments, sig].join('.');
}

function verifyJWT(token) {
  if (!token) return null;
  try {
    const [headerB64, bodyB64, sigB64] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET()).update(`${headerB64}.${bodyB64}`).digest('base64url');
    if (sigB64 !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(bodyB64, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// ── Grudge ID Generator ─────────────────────────────────────────────────────
function generateGrudgeId() {
  return `GRUDGE-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function ensureGrudgeId(accountId) {
  const { query: dbQuery } = await import('./src/server/db.js');
  const result = await dbQuery('SELECT grudge_id FROM accounts WHERE id = $1', [accountId]);
  if (result.rows[0]?.grudge_id) return result.rows[0].grudge_id;
  const grudgeId = generateGrudgeId();
  await dbQuery('UPDATE accounts SET grudge_id = $1 WHERE id = $2', [grudgeId, accountId]);
  return grudgeId;
}

// ── Auto Wallet Creation (Crossmint) ────────────────────────────────────────
async function ensureWallet(account) {
  if (account.wallet_address) return { address: account.wallet_address, chain: account.wallet_chain || 'solana', existing: true };
  const CROSSMINT_KEY = (process.env.CROSSMINT_SERVER_API_KEY || '').trim();
  if (!CROSSMINT_KEY) return null;
  try {
    const { query: dbQuery } = await import('./src/server/db.js');
    const linkedUser = `userId:${account.grudge_id || account.discord_id || account.id}`;
    const walletRes = await fetch('https://www.crossmint.com/api/v1-alpha2/wallets', {
      method: 'POST',
      headers: { 'X-API-KEY': CROSSMINT_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkedUser, chain: 'solana' }),
    });
    const walletData = await walletRes.json();
    const address = walletData.address || walletData.publicKey;
    if (!address) { console.warn('[Wallet] Auto-create returned no address:', walletData); return null; }
    await dbQuery('UPDATE accounts SET wallet_address=$1, wallet_chain=$2, wallet_created_at=NOW() WHERE id=$3', [address, 'solana', account.id]);
    console.log(`[Wallet] Auto-created Solana wallet for ${account.username}: ${address}`);
    return { address, chain: 'solana', existing: false };
  } catch (err) {
    console.warn('[Wallet] Auto-create failed:', err.message);
    return null;
  }
}

// ── Discord Account Upsert ──────────────────────────────────────────────────
async function upsertDiscordAccount(user) {
  const { query: dbQuery } = await import('./src/server/db.js');
  const result = await dbQuery(
    `INSERT INTO accounts (discord_id, username, email, avatar_url, auth_type, last_login)
     VALUES ($1, $2, $3, $4, 'discord', NOW())
     ON CONFLICT (discord_id) DO UPDATE SET
       username = EXCLUDED.username,
       email = COALESCE(EXCLUDED.email, accounts.email),
       avatar_url = COALESCE(EXCLUDED.avatar_url, accounts.avatar_url),
       last_login = NOW(),
       updated_at = NOW()
     RETURNING *`,
    [user.id, user.username, user.email || null, user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null]
  );
  const account = result.rows[0];
  const grudgeId = await ensureGrudgeId(account.id);
  const wallet = await ensureWallet({ ...account, grudge_id: grudgeId });
  const jwt = createJWT({
    accountId: account.id,
    grudgeId,
    discordId: account.discord_id,
    username: account.username,
    authType: 'discord',
  });
  return { account, grudgeId, wallet, jwt };
}

function getPublicOrigin(req) {
  // Check for configured public URL first
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL.replace(/\/$/, '');
  }
  
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers['host'];
  const proto = req.headers['x-forwarded-proto'] || (isProd ? 'https' : 'http');
  const host = forwardedHost?.split(',')[0]?.trim();
  
  if (host && !host.includes('localhost')) {
    return `${proto}://${host}`;
  }

  // Fallback: check platform-specific env vars
  const domain = process.env.VERCEL_URL 
    || process.env.RAILWAY_PUBLIC_DOMAIN 
    || process.env.RENDER_EXTERNAL_URL
    || process.env.REPLIT_DOMAINS 
    || process.env.REPLIT_DEV_DOMAIN;

  if (domain) {
    const cleanDomain = domain.replace(/^https?:\/\//, '');
    return `https://${cleanDomain}`;
  }

  return `${proto}://${host || `localhost:${PORT}`}`;
}

app.get('/api/discord/login', (req, res) => {
  const redirectUrl = req.query.redirect_uri || null;
  const origin = getPublicOrigin(req);
  const redirectUri = redirectUrl || `${origin}/discordauth`;
  const scope = encodeURIComponent('identify email guilds.join');
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, { ts: Date.now(), redirectUri });
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;
  res.json({ url, state, clientId: DISCORD_CLIENT_ID, scope: 'identify email guilds.join' });
});

app.post('/api/discord/callback', async (req, res) => {
  const { code, state } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  if (!state || !pendingStates.has(state)) {
    return res.status(403).json({ error: 'Invalid or missing state parameter' });
  }
  const stateEntry = pendingStates.get(state);
  pendingStates.delete(state);

  for (const [k, v] of pendingStates) {
    const ts = typeof v === 'object' ? v.ts : v;
    if (Date.now() - ts > 600000) pendingStates.delete(k);
  }

  try {
    const redirectUri = req.body.redirect_uri || (typeof stateEntry === 'object' ? stateEntry.redirectUri : null) || `${getPublicOrigin(req)}/discordauth`;

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Token exchange failed:', err);
      return res.status(400).json({ error: 'Token exchange failed' });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return res.status(400).json({ error: 'Failed to fetch user' });
    }

    const user = await userRes.json();

    let guildJoined = false;
    try {
      guildJoined = await addUserToGuild(accessToken, user.id);
    } catch (joinErr) {
      console.error('Auto guild join failed:', joinErr.message);
    }

    // Upsert account into DB, assign grudge_id, provision wallet, generate JWT
    const { account, grudgeId, wallet, jwt } = await upsertDiscordAccount(user);

    // Keep in-memory session for backward compat
    activeSessions.set(jwt, {
      discordId: user.id,
      username: user.username,
      accountId: account.id,
      grudgeId,
      createdAt: Date.now(),
    });

    if (activeSessions.size > 5000) {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      for (const [k, v] of activeSessions) {
        if (v.createdAt < cutoff) activeSessions.delete(k);
      }
    }

    // Upsert account to DB so record exists immediately on login
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : null;
    try {
      const { query: dbQuery } = await import('./src/server/db.js');
      await dbQuery(
        `INSERT INTO accounts (discord_id, username, email, avatar_url, last_login)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (discord_id) DO UPDATE SET
           username = EXCLUDED.username,
           email = COALESCE(EXCLUDED.email, accounts.email),
           avatar_url = COALESCE(EXCLUDED.avatar_url, accounts.avatar_url),
           updated_at = NOW(), last_login = NOW()`,
        [user.id, user.username, user.email || null, avatarUrl]
      );
    } catch (dbErr) {
      console.error('[Discord] Account upsert failed (non-fatal):', dbErr.message);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        accountId: account.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        email: user.email,
        globalName: user.global_name,
        grudgeId,
      },
      guildJoined,
      sessionToken: jwt,
      wallet: wallet || undefined,
    });
  } catch (err) {
    console.error('Discord callback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function createBetaInvite() {
  const botToken = DISCORD_BOT_TOKEN_VAL || process.env.GAME_API_GRUDA;
  if (!botToken) throw new Error('Bot token not configured');

  const inviteRes = await fetch(`https://discord.com/api/v10/channels/${BETA_CHANNEL_ID}/invites`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      max_age: 86400,
      max_uses: 1,
      unique: true,
    }),
  });

  if (!inviteRes.ok) {
    const err = await inviteRes.text();
    throw new Error(`Invite creation failed: ${err}`);
  }

  const invite = await inviteRes.json();
  return `https://discord.gg/${invite.code}`;
}

app.get('/api/discord/invite', async (req, res) => {
  try {
    const link = await createBetaInvite();
    res.json({ invite: link });
  } catch (err) {
    console.error('Invite error:', err.message);
    res.status(500).json({ error: 'Could not create invite' });
  }
});

const DISCORD_WEBHOOK_URL = process.env.DISCORD_GRUDGE_WEBHOOK;
const ADMIN_TOKEN = process.env.GAME_API_GRUDA || DISCORD_BOT_TOKEN_VAL;

function requireAdmin(req, res, next) {
  const auth = req.headers['x-admin-token'];
  if (!auth || !ADMIN_TOKEN || auth !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/discord/webhook/verify', (req, res) => {
  const auth = req.headers['x-admin-token'];
  if (!auth || !ADMIN_TOKEN || auth !== ADMIN_TOKEN) {
    return res.status(403).json({ authorized: false });
  }
  res.json({ authorized: true });
});

const EMBED_COLORS = {
  update: 0x6ee7b3,
  patch: 0xa78bfa,
  challenge: 0xf59e0b,
  event: 0xef4444,
  milestone: 0x3b82f6,
  lore: 0x8b5cf6,
  tip: 0x10b981,
};

async function sendWebhookMessage({ content, embeds, username, avatar_url }) {
  if (!DISCORD_WEBHOOK_URL) throw new Error('Webhook URL not configured');
  const payload = {};
  if (content) payload.content = content;
  if (embeds) payload.embeds = embeds;
  payload.username = username || 'Grudge Warlords';
  payload.avatar_url = avatar_url || 'https://grudgewarlords.com/icons/logo.png';
  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Webhook failed (${res.status}): ${err}`);
  }
  return true;
}

app.post('/api/discord/webhook/update', requireAdmin, async (req, res) => {
  const { title, description, features, version } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
  try {
    const fields = (features || []).map(f => ({ name: f.name || 'Feature', value: f.value || f, inline: true }));
    if (version) fields.unshift({ name: 'Version', value: version, inline: true });
    await sendWebhookMessage({
      content: '## Game Update Available!',
      embeds: [{
        title: `Update: ${title}`,
        description,
        color: EMBED_COLORS.update,
        fields,
        footer: { text: 'Grudge Warlords | grudgewarlords.com' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/patch', requireAdmin, async (req, res) => {
  const { version, changes, bugfixes } = req.body;
  if (!version) return res.status(400).json({ error: 'Version required' });
  try {
    const changeList = (changes || []).map(c => `- ${c}`).join('\n') || 'No changes listed';
    const bugList = (bugfixes || []).map(b => `- ${b}`).join('\n');
    const fields = [{ name: 'Changes', value: changeList }];
    if (bugList) fields.push({ name: 'Bug Fixes', value: bugList });
    await sendWebhookMessage({
      content: `## Patch Notes - v${version}`,
      embeds: [{
        title: `Patch ${version}`,
        description: 'A new patch has been deployed! Here\'s what changed:',
        color: EMBED_COLORS.patch,
        fields,
        footer: { text: 'Grudge Warlords | Patch Notes' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook patch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/challenge', requireAdmin, async (req, res) => {
  const { title, description, reward, deadline } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
  try {
    const fields = [];
    if (reward) fields.push({ name: 'Reward', value: reward, inline: true });
    if (deadline) fields.push({ name: 'Deadline', value: deadline, inline: true });
    await sendWebhookMessage({
      content: '## New Community Challenge!',
      embeds: [{
        title: `Challenge: ${title}`,
        description,
        color: EMBED_COLORS.challenge,
        fields,
        footer: { text: 'Grudge Warlords | Community Challenge' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook challenge error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/event', requireAdmin, async (req, res) => {
  const { title, description, startTime, endTime } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
  try {
    const fields = [];
    if (startTime) fields.push({ name: 'Starts', value: startTime, inline: true });
    if (endTime) fields.push({ name: 'Ends', value: endTime, inline: true });
    await sendWebhookMessage({
      content: '## Live Event Announcement!',
      embeds: [{
        title: `Event: ${title}`,
        description,
        color: EMBED_COLORS.event,
        fields,
        footer: { text: 'Grudge Warlords | Events' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook event error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/lore', requireAdmin, async (req, res) => {
  const { title, story, character } = req.body;
  if (!title || !story) return res.status(400).json({ error: 'Title and story required' });
  try {
    const fields = [];
    if (character) fields.push({ name: 'Featured Character', value: character, inline: true });
    await sendWebhookMessage({
      content: '## Lore Drop',
      embeds: [{
        title: `Lore: ${title}`,
        description: `*${story}*`,
        color: EMBED_COLORS.lore,
        fields,
        footer: { text: 'Grudge Warlords | World Lore' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook lore error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/tip', requireAdmin, async (req, res) => {
  const { title, tip, category } = req.body;
  if (!title || !tip) return res.status(400).json({ error: 'Title and tip required' });
  try {
    const fields = [];
    if (category) fields.push({ name: 'Category', value: category, inline: true });
    await sendWebhookMessage({
      content: '## Warlord Tip of the Day',
      embeds: [{
        title: `Tip: ${title}`,
        description: tip,
        color: EMBED_COLORS.tip,
        fields,
        footer: { text: 'Grudge Warlords | Tips & Tricks' },
        timestamp: new Date().toISOString(),
      }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook tip error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/discord/webhook/custom', requireAdmin, async (req, res) => {
  const { content, title, description, color, fields } = req.body;
  if (!content && !title) return res.status(400).json({ error: 'Content or title required' });
  try {
    const payload = {};
    if (content) payload.content = content;
    if (title) {
      payload.embeds = [{
        title,
        description: description || '',
        color: color || EMBED_COLORS.update,
        fields: fields || [],
        footer: { text: 'Grudge Warlords' },
        timestamp: new Date().toISOString(),
      }];
    }
    await sendWebhookMessage(payload);
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook custom error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const ALLOWED_RETURN_ORIGINS = [...ALLOWED_ORIGINS];

app.get('/api/external/login', (req, res) => {
  let returnUrl = req.query.returnUrl || 'https://grudgewarlords.com/dungeon';
  try {
    const parsed = new URL(returnUrl);
    if (!ALLOWED_RETURN_ORIGINS.includes(parsed.origin)) {
      returnUrl = 'https://grudgewarlords.com/dungeon';
    }
  } catch (e) {
    returnUrl = 'https://grudgewarlords.com/dungeon';
  }
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, { ts: Date.now(), returnUrl });
  const origin = getPublicOrigin(req);
  const redirectUri = `${origin}/api/external/callback`;
  const scope = 'identify email guilds.join';
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
  res.redirect(url);
});

app.get('/api/external/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || !pendingStates.has(state)) {
    return res.status(403).send('Invalid or expired login attempt. Please try again.');
  }
  const stateData = pendingStates.get(state);
  pendingStates.delete(state);
  const returnUrl = (typeof stateData === 'object' ? stateData.returnUrl : null) || 'https://grudgewarlords.com/dungeon';

  try {
    const origin = getPublicOrigin(req);
    const redirectUri = `${origin}/api/external/callback`;
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).send('Discord login failed. Please try again.');
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    try {
      await addUserToGuild(tokenData.access_token, user.id);
    } catch (e) {}

    // Upsert account into DB, assign grudge_id, provision wallet, generate JWT
    const { account, grudgeId, wallet, jwt } = await upsertDiscordAccount(user);

    // Keep in-memory session for backward compat
    activeSessions.set(jwt, {
      discordId: user.id,
      username: user.username,
      accountId: account.id,
      grudgeId,
      createdAt: Date.now(),
    });

    const returnOrigin = new URL(returnUrl).origin;
    const loginData = { sessionToken: jwt, user: { id: user.id, accountId: account.id, username: user.username, avatar: user.avatar, email: user.email, grudgeId } };
    res.send(`<!DOCTYPE html><html><head><title>Grudge Login</title></head><body>
<script>
  try {
    var data = ${JSON.stringify(loginData)};
    localStorage.setItem('grudge_studio_session', data.sessionToken);
    localStorage.setItem('grudge_studio_user', JSON.stringify(data.user));
    localStorage.setItem('grudge_session_token', data.sessionToken);
    if (window.opener) {
      window.opener.postMessage({ type: 'grudge_login', data: data }, ${JSON.stringify(returnOrigin)});
      window.close();
    } else {
      window.location.href = ${JSON.stringify(returnUrl)};
    }
  } catch(e) {
    window.location.href = ${JSON.stringify(returnUrl)};
  }
</script></body></html>`);
  } catch (err) {
    res.status(500).send('Login error: ' + err.message);
  }
});

const challengeNonces = new Map();
let arenaSeq = 0;

function generateArenaUuid(prefix) {
  const now = new Date();
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  arenaSeq++;
  const seq = arenaSeq.toString(16).toUpperCase().padStart(6, '0');
  let hash = 0x811c9dc5;
  const input = `${prefix}-${ts}-${seq}-${Math.random()}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash = ((hash >>> 0) ^ ((hash >>> 0) >>> 16)) >>> 0;
  const h = hash.toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
  return `${prefix}-${ts}-${seq}-${h}`;
}

function computeSha256Hex(str) {
  const hashModule = crypto.createHash('sha256');
  hashModule.update(str);
  return hashModule.digest('hex').slice(0, 16);
}

async function arenaQuery(text, params) {
  const { query: dbQuery } = await import('./src/server/db.js');
  return dbQuery(text, params);
}

function teamRowToObj(row) {
  return {
    teamId: row.team_id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    status: row.status,
    heroes: row.heroes,
    heroCount: row.hero_count,
    avgLevel: row.avg_level,
    shareToken: row.share_token,
    snapshotHash: row.snapshot_hash,
    wins: row.wins,
    losses: row.losses,
    totalBattles: row.total_battles,
    rewards: row.rewards,
    createdAt: new Date(row.created_at).getTime(),
    demotedAt: row.demoted_at ? new Date(row.demoted_at).getTime() : null,
    demoteReason: row.demote_reason,
  };
}

app.post('/api/arena/submit', async (req, res) => {
  try {
    const { ownerId, ownerName, heroes, shareToken } = req.body;
    if (!ownerId || !heroes || !Array.isArray(heroes) || heroes.length === 0 || heroes.length > 3) {
      return res.status(400).json({ error: 'Valid ownerId and 1-3 heroes required' });
    }

    for (const h of heroes) {
      if (!h.name || !h.raceId || !h.classId) {
        return res.status(400).json({ error: `Hero missing name/race/class` });
      }
    }

    await arenaQuery(
      `UPDATE arena_teams SET status = 'unranked', demoted_at = NOW(), demote_reason = 'replaced', updated_at = NOW() WHERE owner_id = $1 AND status = 'ranked'`,
      [ownerId]
    );

    const teamId = generateArenaUuid('TEAM');
    const snapshotJson = JSON.stringify(heroes);
    const snapshotHash = computeSha256Hex(snapshotJson);
    const heroCount = heroes.length;
    const avgLevel = Math.round(heroes.reduce((s, h) => s + (h.level || 1), 0) / heroCount);

    await arenaQuery(
      `INSERT INTO arena_teams (team_id, owner_id, owner_name, status, heroes, hero_count, avg_level, share_token, snapshot_hash, wins, losses, total_battles, rewards)
       VALUES ($1, $2, $3, 'ranked', $4, $5, $6, $7, $8, 0, 0, 0, '{"gold":0,"resources":0,"equipment":[]}')`,
      [teamId, ownerId, ownerName || 'Unknown Warlord', JSON.stringify(heroes), heroCount, avgLevel, shareToken || null, snapshotHash]
    );

    sendWebhookMessage({
      embeds: [{
        title: 'New Arena Challenger!',
        description: `**${ownerName || 'Unknown Warlord'}** has entered the Ranked Arena!`,
        color: EMBED_COLORS.challenge,
        fields: [
          { name: 'Team', value: heroes.map(h => `${h.name} (Lv.${h.level || 1} ${h.raceId} ${h.classId})`).join('\n'), inline: false },
          { name: 'Avg Level', value: `${avgLevel}`, inline: true },
          { name: 'Heroes', value: `${heroCount}`, inline: true },
        ],
        footer: { text: 'GRUDA PvP Arena | grudgewarlords.com/arena' },
        timestamp: new Date().toISOString(),
      }],
    }).catch(err => console.error('Arena webhook error:', err.message));

    res.json({
      success: true,
      teamId,
      snapshotHash,
      status: 'ranked',
      message: 'Team submitted to Ranked Arena!',
    });
  } catch (err) {
    console.error('Arena submit error:', err);
    res.status(500).json({ error: 'Failed to submit team' });
  }
});

app.get('/api/arena/lobby', async (req, res) => {
  try {
    const { status, page, limit: lim } = req.query;
    const pageNum = Math.max(0, parseInt(page) || 0);
    const pageSize = Math.min(50, Math.max(1, parseInt(lim) || 20));
    const offset = pageNum * pageSize;

    let whereClause = '';
    const params = [];
    if (status === 'ranked' || status === 'unranked') {
      whereClause = 'WHERE status = $1';
      params.push(status);
    }

    const countResult = await arenaQuery(`SELECT COUNT(*) as count FROM arena_teams ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const teamsResult = await arenaQuery(
      `SELECT * FROM arena_teams ${whereClause}
       ORDER BY CASE WHEN status = 'ranked' THEN 0 ELSE 1 END, wins DESC, losses ASC, created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    const safe = teamsResult.rows.map(row => {
      const t = teamRowToObj(row);
      return {
        teamId: t.teamId,
        ownerName: t.ownerName,
        status: t.status,
        heroCount: t.heroCount,
        avgLevel: t.avgLevel,
        wins: t.wins,
        losses: t.losses,
        totalBattles: t.totalBattles,
        createdAt: t.createdAt,
        heroSummary: (t.heroes || []).map(h => ({
          name: h.name,
          raceId: h.raceId,
          classId: h.classId,
          level: h.level || 1,
        })),
      };
    });

    res.json({ teams: safe, total, page: pageNum, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error('Arena lobby error:', err);
    res.status(500).json({ error: 'Failed to load lobby' });
  }
});

app.get('/api/arena/team/:teamId', async (req, res) => {
  try {
    const result = await arenaQuery('SELECT * FROM arena_teams WHERE team_id = $1', [req.params.teamId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Team not found' });
    const team = teamRowToObj(result.rows[0]);

    const nonce = crypto.randomBytes(16).toString('hex');
    challengeNonces.set(nonce, { teamId: team.teamId, createdAt: Date.now() });
    if (challengeNonces.size > 1000) {
      const cutoff = Date.now() - 30 * 60 * 1000;
      for (const [k, v] of challengeNonces) { if (v.createdAt < cutoff) challengeNonces.delete(k); }
    }

    res.json({
      teamId: team.teamId,
      ownerId: team.ownerId,
      ownerName: team.ownerName,
      status: team.status,
      heroes: team.heroes,
      snapshotHash: team.snapshotHash,
      wins: team.wins,
      losses: team.losses,
      totalBattles: team.totalBattles,
      rewards: team.rewards,
      createdAt: team.createdAt,
      avgLevel: team.avgLevel,
      challengeNonce: nonce,
    });
  } catch (err) {
    console.error('Arena team error:', err);
    res.status(500).json({ error: 'Failed to load team' });
  }
});

app.post('/api/arena/battle/result', async (req, res) => {
  try {
    const { teamId, challengerName, challengerHeroes, result, battleLog, challengeNonce } = req.body;
    if (!teamId || !result) return res.status(400).json({ error: 'teamId and result required' });

    if (!challengeNonce) {
      return res.status(400).json({ error: 'challengeNonce is required' });
    }
    const nonceData = challengeNonces.get(challengeNonce);
    if (!nonceData || nonceData.teamId !== teamId) {
      return res.status(403).json({ error: 'Invalid or expired challenge token' });
    }
    if (Date.now() - nonceData.createdAt > 30 * 60 * 1000) {
      challengeNonces.delete(challengeNonce);
      return res.status(403).json({ error: 'Challenge token expired' });
    }
    challengeNonces.delete(challengeNonce);

    const { getClient } = await import('./src/server/db.js');
    const client = await getClient();
    let team, battleId, rewardData, newWins, newLosses, newStatus, demoted, demoteReason;

    try {
      await client.query('BEGIN');

      const teamResult = await client.query('SELECT * FROM arena_teams WHERE team_id = $1 FOR UPDATE', [teamId]);
      if (!teamResult.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Team not found' });
      }
      team = teamRowToObj(teamResult.rows[0]);

      battleId = generateArenaUuid('BTLE');

      await client.query(
        `INSERT INTO arena_battles (battle_id, team_id, challenger_name, result) VALUES ($1, $2, $3, $4)`,
        [battleId, teamId, challengerName || 'Arena Challenger', result]
      );

      rewardData = null;
      newWins = team.wins;
      newLosses = team.losses;
      newStatus = team.status;
      let newRewards = { ...team.rewards };
      demoteReason = team.demoteReason;

      if (result === 'team_won') {
        newWins++;
        if (team.status === 'ranked') {
          const goldReward = 50 + team.avgLevel * 10 + newWins * 5;
          const resourceReward = 10 + team.avgLevel * 2;
          newRewards.gold = (newRewards.gold || 0) + goldReward;
          newRewards.resources = (newRewards.resources || 0) + resourceReward;

          if (newWins % 5 === 0) {
            const eqTier = Math.min(8, Math.max(1, Math.ceil(team.avgLevel / 3)));
            const equipReward = { type: 'equipment', tier: eqTier, wonAt: Date.now() };
            if (!Array.isArray(newRewards.equipment)) newRewards.equipment = [];
            newRewards.equipment.push(equipReward);
            rewardData = { gold: goldReward, resources: resourceReward, equipment: equipReward };
          } else {
            rewardData = { gold: goldReward, resources: resourceReward };
          }
        }
      } else if (result === 'team_lost') {
        newLosses++;
        if (team.status === 'ranked' && newLosses >= 3) {
          newStatus = 'unranked';
          demoteReason = 'losses';
        }
      }

      demoted = newStatus === 'unranked' && demoteReason === 'losses' && newLosses === 3;

      await client.query(
        `UPDATE arena_teams SET wins = $1, losses = $2, total_battles = total_battles + 1, status = $3,
         rewards = $4, demoted_at = $5, demote_reason = $6, updated_at = NOW()
         WHERE team_id = $7`,
        [newWins, newLosses, newStatus, JSON.stringify(newRewards),
         demoted ? new Date() : team.demotedAt ? new Date(team.demotedAt) : null,
         demoteReason, teamId]
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    if (demoted) {
      sendWebhookMessage({
        embeds: [{
          title: 'Relegation!',
          description: `**${team.ownerName}**'s team has been relegated to Unranked after 3 defeats!`,
          color: EMBED_COLORS.event,
          fields: [
            { name: 'Record', value: `${newWins}W / ${newLosses}L`, inline: true },
            { name: 'Defeated By', value: challengerName || 'Arena Challenger', inline: true },
          ],
          footer: { text: 'GRUDA PvP Arena' },
          timestamp: new Date().toISOString(),
        }],
      }).catch(err => console.error('Relegation webhook error:', err.message));
    } else if (newWins > 0 && newWins % 5 === 0 && result === 'team_won') {
      const rankTiers = [
        { name: 'Bronze', minWins: 0 },
        { name: 'Silver', minWins: 5 },
        { name: 'Gold', minWins: 15 },
        { name: 'Platinum', minWins: 30 },
        { name: 'Diamond', minWins: 50 },
        { name: 'Legend', minWins: 100 },
      ];
      let rank = rankTiers[0];
      for (const t of rankTiers) { if (newWins >= t.minWins) rank = t; }

      sendWebhookMessage({
        embeds: [{
          title: `${rank.name === 'Legend' ? '🏆' : '⚔️'} Win Streak! ${rank.name} Rank`,
          description: `**${team.ownerName}**'s team reached **${newWins} wins** in the Arena! Rank: **${rank.name}**`,
          color: EMBED_COLORS.milestone,
          fields: [
            { name: 'Record', value: `${newWins}W / ${newLosses}L`, inline: true },
            { name: 'Rank', value: `${rank.name}`, inline: true },
            { name: 'Status', value: newStatus, inline: true },
          ],
          footer: { text: 'GRUDA PvP Arena | grudgewarlords.com/arena' },
          timestamp: new Date().toISOString(),
        }],
      }).catch(err => console.error('Win streak webhook error:', err.message));
    }

    res.json({
      success: true,
      battleId,
      teamStatus: newStatus,
      wins: newWins,
      losses: newLosses,
      demoted,
      rewards: rewardData,
    });
  } catch (err) {
    console.error('Arena battle result error:', err);
    res.status(500).json({ error: 'Failed to record battle result' });
  }
});

app.get('/api/arena/rewards/:teamId', async (req, res) => {
  try {
    const result = await arenaQuery('SELECT * FROM arena_teams WHERE team_id = $1', [req.params.teamId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Team not found' });
    const team = teamRowToObj(result.rows[0]);
    res.json({
      teamId: team.teamId,
      ownerName: team.ownerName,
      status: team.status,
      wins: team.wins,
      losses: team.losses,
      rewards: team.rewards,
    });
  } catch (err) {
    console.error('Arena rewards error:', err);
    res.status(500).json({ error: 'Failed to load rewards' });
  }
});

app.get('/api/arena/stats', async (req, res) => {
  try {
    const teamStats = await arenaQuery(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'ranked') as ranked, COUNT(*) FILTER (WHERE status = 'unranked') as unranked FROM arena_teams`);
    const battleCount = await arenaQuery('SELECT COUNT(*) as total FROM arena_battles');
    const recentBattles = await arenaQuery('SELECT battle_id, team_id, challenger_name, result, created_at FROM arena_battles ORDER BY created_at DESC LIMIT 10');

    const row = teamStats.rows[0];
    res.json({
      totalTeams: parseInt(row.total),
      rankedTeams: parseInt(row.ranked),
      unrankedTeams: parseInt(row.unranked),
      totalBattles: parseInt(battleCount.rows[0].total),
      recentBattles: recentBattles.rows.map(b => ({
        battleId: b.battle_id,
        teamId: b.team_id,
        challengerName: b.challenger_name,
        result: b.result,
        timestamp: new Date(b.created_at).getTime(),
      })),
    });
  } catch (err) {
    console.error('Arena stats error:', err);
    res.json({ totalTeams: 0, rankedTeams: 0, unrankedTeams: 0, totalBattles: 0, recentBattles: [] });
  }
});

app.get('/api/arena/leaderboard', async (req, res) => {
  try {
    const { limit: lim } = req.query;
    const pageSize = Math.min(100, Math.max(1, parseInt(lim) || 20));

    const result = await arenaQuery(
      `SELECT * FROM arena_teams WHERE total_battles > 0 ORDER BY wins DESC, losses ASC, created_at ASC LIMIT $1`,
      [pageSize]
    );

    const leaderboard = result.rows.map((row, i) => {
      const t = teamRowToObj(row);
      return {
        rank: i + 1,
        teamId: t.teamId,
        ownerName: t.ownerName,
        status: t.status,
        wins: t.wins,
        losses: t.losses,
        totalBattles: t.totalBattles,
        avgLevel: t.avgLevel,
        heroCount: t.heroCount,
        heroes: (t.heroes || []).map(h => ({ name: h.name, raceId: h.raceId, classId: h.classId, level: h.level || 1 })),
        winRate: t.totalBattles > 0 ? Math.round((t.wins / t.totalBattles) * 100) : 0,
        createdAt: t.createdAt,
      };
    });

    const totalResult = await arenaQuery('SELECT COUNT(*) as count FROM arena_teams WHERE total_battles > 0');

    res.json({
      leaderboard,
      totalEntries: parseInt(totalResult.rows[0].count),
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.error('Arena leaderboard error:', err);
    res.json({ leaderboard: [], totalEntries: 0, updatedAt: Date.now() });
  }
});

app.post('/api/auth/verify', (req, res) => {
  const { sessionToken } = req.body;
  if (!sessionToken) return res.status(400).json({ error: 'sessionToken required' });

  // Try JWT first
  const jwtPayload = verifyJWT(sessionToken);
  if (jwtPayload) {
    return res.json({
      valid: true,
      accountId: jwtPayload.accountId,
      discordId: jwtPayload.discordId,
      username: jwtPayload.username,
      grudgeId: jwtPayload.grudgeId,
    });
  }

  // Fallback to in-memory sessions
  const session = activeSessions.get(sessionToken);
  if (!session) return res.status(401).json({ error: 'Invalid or expired session' });
  const age = Date.now() - session.createdAt;
  if (age > 7 * 24 * 60 * 60 * 1000) {
    activeSessions.delete(sessionToken);
    return res.status(401).json({ error: 'Session expired' });
  }
  res.json({
    valid: true,
    discordId: session.discordId,
    username: session.username,
    grudgeId: session.grudgeId,
  });
});

app.post('/api/auth/extension', async (req, res) => {
  const { sessionToken } = req.body;
  if (!sessionToken) return res.status(400).json({ error: 'sessionToken required' });
  const session = activeSessions.get(sessionToken);
  if (!session) return res.status(401).json({ error: 'Invalid session' });
  const age = Date.now() - session.createdAt;
  if (age > 7 * 24 * 60 * 60 * 1000) {
    activeSessions.delete(sessionToken);
    return res.status(401).json({ error: 'Session expired' });
  }
  const extensionToken = crypto.randomBytes(32).toString('hex');

  activeSessions.set(extensionToken, {
    discordId: session.discordId,
    username: session.username,
    createdAt: Date.now(),
    isExtension: true,
  });

  res.json({
    extensionToken,
    discordId: session.discordId,
    username: session.username,
    expiresIn: '7d',
  });
});

// ── Password Utilities (scrypt — no extra deps) ──────────────────────────────

function generateGrudgeAccountId() {
  const now = new Date();
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `GRD-${ts}-${rand}`;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, buf) => {
      if (err) reject(err);
      else resolve(`${salt}:${buf.toString('hex')}`);
    });
  });
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, buf) => {
      if (err) reject(err);
      else {
        try {
          resolve(crypto.timingSafeEqual(buf, Buffer.from(hash, 'hex')));
        } catch { resolve(false); }
      }
    });
  });
}

// ── Grudge ID / Username Auth ─────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (username.length < 3 || username.length > 24) return res.status(400).json({ error: 'Username must be 3–24 chars' });
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Alphanumeric and _ only' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 chars' });
  try {
    const { query: dbQuery } = await import('./src/server/db.js');
    const existing = await dbQuery('SELECT id FROM accounts WHERE LOWER(username) = $1 AND password_hash IS NOT NULL', [username.toLowerCase()]);
    if (existing.rows[0]) return res.status(409).json({ error: 'Username already taken' });

    const grudgeId = generateGrudgeAccountId();
    const pwHash = await hashPassword(password);
    const result = await dbQuery(
      `INSERT INTO accounts (username, password_hash, grudge_id, last_login)
       VALUES ($1, $2, $3, NOW()) RETURNING id, username, grudge_id`,
      [username, pwHash, grudgeId]
    );
    const acc = result.rows[0];

    const sessionToken = crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, { discordId: null, username: acc.username, accountId: acc.id, createdAt: Date.now() });

    res.json({ success: true, sessionToken, user: { id: acc.id, username: acc.username, grudgeId: acc.grudge_id } });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const { query: dbQuery } = await import('./src/server/db.js');
    const result = await dbQuery(
      'SELECT id, username, grudge_id, password_hash FROM accounts WHERE LOWER(username) = $1 AND password_hash IS NOT NULL',
      [username.toLowerCase()]
    );
    const acc = result.rows[0];
    if (!acc) return res.status(401).json({ error: 'Invalid username or password' });

    const valid = await verifyPassword(password, acc.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });

    await dbQuery('UPDATE accounts SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [acc.id]);

    const sessionToken = crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, { discordId: null, username: acc.username, accountId: acc.id, createdAt: Date.now() });

    res.json({ success: true, sessionToken, user: { id: acc.id, username: acc.username, grudgeId: acc.grudge_id } });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/puter', async (req, res) => {
  const { puterUsername, puterUuid } = req.body;
  if (!puterUsername) return res.status(400).json({ error: 'puterUsername required' });
  try {
    const { query: dbQuery } = await import('./src/server/db.js');
    const grudgeId = generateGrudgeAccountId();
    const result = await dbQuery(
      `INSERT INTO accounts (username, grudge_id, last_login)
       VALUES ($1, $2, NOW())
       ON CONFLICT (username) DO UPDATE SET
         last_login = NOW(), updated_at = NOW()
       RETURNING id, username, grudge_id`,
      [puterUsername, grudgeId]
    );
    const acc = result.rows[0];

    const sessionToken = crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, { discordId: null, username: acc.username, accountId: acc.id, createdAt: Date.now() });

    res.json({ success: true, sessionToken, user: { id: acc.id, username: acc.username, grudgeId: acc.grudge_id } });
  } catch (err) {
    console.error('[Auth] Puter error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function requireSession(req, res, next) {
  const token = req.headers['x-session-token'] || req.body?.sessionToken;
  if (!token) return res.status(401).json({ error: 'Session token required' });

  // Try JWT first (persistent, survives restarts)
  const jwtPayload = verifyJWT(token);
  if (jwtPayload) {
    req.session = jwtPayload;
    return next();
  }

  // Fallback to in-memory sessions (legacy)
  const session = activeSessions.get(token);
  if (!session) return res.status(401).json({ error: 'Invalid session' });
  const age = Date.now() - session.createdAt;
  if (age > 7 * 24 * 60 * 60 * 1000) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }
  req.session = session;
  next();
}

app.get('/api/public/profile', requireSession, async (req, res) => {
  try {
    const { query: dbQuery } = await import('./src/server/db.js');
    const account = await dbQuery('SELECT * FROM accounts WHERE discord_id = $1', [req.session.discordId]);
    if (!account.rows[0]) return res.json({ found: false });
    const acc = account.rows[0];
    const chars = await dbQuery('SELECT * FROM characters WHERE account_id = $1 ORDER BY slot_index', [acc.id]);
    res.json({
      found: true,
      account: {
        id: acc.id, discordId: acc.discord_id, username: acc.username,
        gold: acc.gold, resources: acc.resources, premium: acc.premium,
        avatarUrl: acc.avatar_url,
      },
      heroes: chars.rows.map(c => ({
        name: c.name, raceId: c.race_id, classId: c.class_id,
        level: c.level, experience: c.experience, isActive: c.is_active,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/public/leaderboard', async (req, res) => {
  try {
    const result = await arenaQuery(
      `SELECT owner_name, wins, losses, hero_count FROM arena_teams WHERE total_battles > 0 ORDER BY wins DESC LIMIT 50`
    );
    const entries = result.rows.map((row, i) => ({
      ownerName: row.owner_name,
      rank: i + 1,
      wins: row.wins || 0,
      losses: row.losses || 0,
      heroCount: row.hero_count || 0,
    }));
    res.json({ leaderboard: entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/public/stats', async (req, res) => {
  try {
    const { query: dbQuery } = await import('./src/server/db.js');
    const accountCount = await dbQuery('SELECT COUNT(*) as count FROM accounts');
    const charCount = await dbQuery('SELECT COUNT(*) as count FROM characters');
    const arenaTeamCount = await dbQuery('SELECT COUNT(*) as count FROM arena_teams');
    const arenaBattleCount = await dbQuery('SELECT COUNT(*) as count FROM arena_battles');
    res.json({
      totalPlayers: parseInt(accountCount.rows[0]?.count || 0),
      totalHeroes: parseInt(charCount.rows[0]?.count || 0),
      arenaTeams: parseInt(arenaTeamCount.rows[0]?.count || 0),
      arenaBattles: parseInt(arenaBattleCount.rows[0]?.count || 0),
      serverTime: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/public/sync', requireSession, async (req, res) => {
  try {
    const { query: dbQuery } = await import('./src/server/db.js');
    const discordId = req.session.discordId;

    const accountResult = await dbQuery('SELECT * FROM accounts WHERE discord_id = $1', [discordId]);
    if (!accountResult.rows[0]) return res.json({ found: false });
    const account = accountResult.rows[0];

    const charsResult = await dbQuery('SELECT * FROM characters WHERE account_id = $1 ORDER BY slot_index', [account.id]);
    const heroes = [];
    for (const c of charsResult.rows) {
      const invResult = await dbQuery('SELECT * FROM inventory_items WHERE character_id = $1', [c.id]);
      heroes.push({
        name: c.name, raceId: c.race_id, classId: c.class_id,
        level: c.level, experience: c.experience,
        attributePoints: c.attribute_points || {},
        abilities: c.abilities || [],
        skillTree: c.skill_tree || {},
        currentHealth: c.current_health,
        currentMana: c.current_mana,
        currentStamina: c.current_stamina,
        isActive: c.is_active,
        inventory: invResult.rows.map(i => ({
          itemKey: i.item_key, itemType: i.item_type, tier: i.tier,
          slot: i.slot, stats: i.stats || {}, equipped: i.equipped, quantity: i.quantity,
        })),
      });
    }

    const islandResult = await dbQuery('SELECT * FROM islands WHERE account_id = $1 LIMIT 1', [account.id]);
    const island = islandResult.rows[0] ? {
      name: islandResult.rows[0].name,
      zoneData: islandResult.rows[0].zone_data || {},
      conquerProgress: islandResult.rows[0].conquer_progress || {},
      questProgress: islandResult.rows[0].quest_progress || {},
      unlockedLocations: islandResult.rows[0].unlocked_locations || [],
    } : null;

    res.json({
      found: true,
      account: {
        id: account.id, discordId: account.discord_id, username: account.username,
        gold: account.gold, resources: account.resources, premium: account.premium,
      },
      heroes,
      island,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Grudge Studio Cloud Sync ─────────────────────────────────────────────────
// Called by src/services/cloudSync.js (pushSave / pullSave)

app.post('/api/studio/sync/push', requireSession, async (req, res) => {
  try {
    const { gameState } = req.body;
    if (!gameState) return res.status(400).json({ error: 'gameState required' });
    const { query: dbQuery } = await import('./src/server/db.js');
    const discordId = req.session.discordId;
    const username = req.session.username;
    const gold = typeof gameState.gold === 'number' ? gameState.gold : null;

    await dbQuery(
      `INSERT INTO accounts (discord_id, username, game_state, game_state_updated_at, last_login)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (discord_id) DO UPDATE SET
         game_state = EXCLUDED.game_state,
         game_state_updated_at = NOW(),
         gold = COALESCE($4, accounts.gold),
         updated_at = NOW(),
         last_login = NOW()`,
      [discordId, username, JSON.stringify(gameState), gold]
    );

    res.json({ success: true, timestamp: Date.now() });
  } catch (err) {
    console.error('[StudioSync] Push error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/studio/sync/pull', requireSession, async (req, res) => {
  try {
    const { query: dbQuery } = await import('./src/server/db.js');
    // Support both Discord and username-based accounts
    const discordId = req.session.discordId;
    const accountId = req.session.accountId;

    let result;
    if (discordId) {
      result = await dbQuery(
        'SELECT game_state, game_state_updated_at FROM accounts WHERE discord_id = $1',
        [discordId]
      );
    } else if (accountId) {
      result = await dbQuery(
        'SELECT game_state, game_state_updated_at FROM accounts WHERE id = $1',
        [accountId]
      );
    } else {
      return res.json({ data: null, source: 'empty' });
    }

    if (!result.rows[0] || !result.rows[0].game_state) {
      return res.json({ data: null, source: 'empty' });
    }

    // Wrap in { gameState } so TitleScreen's completePuterAuth / handleDiscordContinue
    // can check pull.data.gameState consistently
    res.json({
      data: { gameState: result.rows[0].game_state },
      timestamp: result.rows[0].game_state_updated_at
        ? new Date(result.rows[0].game_state_updated_at).getTime()
        : null,
      source: 'db',
    });
  } catch (err) {
    console.error('[StudioSync] Pull error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

if (!isProd) {
  function scanDir(dir, baseUrl, category) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        results.push(...scanDir(full, `${baseUrl}/${e.name}`, category));
      } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(e.name)) {
        const stat = fs.statSync(full);
        results.push({
          name: e.name,
          path: `${baseUrl}/${e.name}`,
          dir: baseUrl,
          category,
          size: stat.size,
          modified: stat.mtimeMs,
        });
      }
    }
    return results;
  }

  app.get('/api/assets/scan', (req, res) => {
    try {
      const pub = path.join(__dirname_server, 'public');
      const cats = [
        { dir: 'sprites', category: 'sprites' },
        { dir: 'effects', category: 'effects' },
        { dir: 'icons', category: 'icons' },
        { dir: 'backgrounds', category: 'backgrounds' },
        { dir: 'ui', category: 'ui' },
        { dir: 'images', category: 'images' },
        { dir: 'map_nodes', category: 'map_nodes' },
      ];
      const all = [];
      for (const c of cats) {
        all.push(...scanDir(path.join(pub, c.dir), `/${c.dir}`, c.category));
      }
      const attached = [];
      const attachDir = path.join(__dirname_server, 'attached_assets');
      if (fs.existsSync(attachDir)) {
        const entries = fs.readdirSync(attachDir);
        for (const e of entries) {
          if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(e)) {
            const stat = fs.statSync(path.join(attachDir, e));
            attached.push({ name: e, path: `/attached/${e}`, dir: '/attached', category: 'attached', size: stat.size, modified: stat.mtimeMs });
          }
        }
      }
      const summary = {};
      for (const a of all) {
        summary[a.category] = (summary[a.category] || 0) + 1;
      }
      summary.attached = attached.length;
      res.json({ total: all.length + attached.length, summary, assets: all, attached });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

app.get('/favicon.ico', (req, res) => {
  const ico = path.join(__dirname_server, 'public', 'favicon.ico');
  res.sendFile(ico, err => {
    if (err) res.status(204).end();
  });
});

if (isProd) {
  app.use('/assets', express.static(path.join(__dirname_server, 'dist', 'assets'), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
    fallthrough: true,
  }));

  app.use(express.static(path.join(__dirname_server, 'dist'), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-cache');
    },
    fallthrough: true,
  }));
}

// ── Crafting Suite SSO ──────────────────────────────────────────────────────
const CRAFTING_SUITE_URL = process.env.CRAFTING_SUITE_URL || 'https://grudge-crafting.puter.site';
const SSO_SECRET = process.env.SSO_SECRET || process.env.SESSION_SECRET || 'grudge-cross-app-sso-secret';
const SSO_TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function generateSsoSignature(payload) {
  return crypto.createHmac('sha256', SSO_SECRET).update(payload).digest('hex');
}

/**
 * POST /api/crafting/sso-token
 * Generates a short-lived HMAC-signed SSO token so the player can
 * open the Crafting Suite and land authenticated with their account.
 * Requires a valid Discord session (X-Session-Token header).
 */
app.post('/api/crafting/sso-token', requireSession, async (req, res) => {
  try {
    const { discordId, username } = req.session;
    const { characterId } = req.body;

    // Try to resolve suite account for richer context
    let suiteAccountId = null;
    let grudgeId = null;
    try {
      const { suiteQuery, isConnected } = await import('./src/server/suiteDb.js');
      if (isConnected()) {
        const result = await suiteQuery(
          `SELECT id, grudge_id FROM accounts WHERE discord_id = $1`,
          [discordId]
        );
        if (result.rows[0]) {
          suiteAccountId = result.rows[0].id;
          grudgeId = result.rows[0].grudge_id;
        }
      }
    } catch (err) {
      console.warn('[SSO] Suite DB lookup failed (non-fatal):', err.message);
    }

    const expiresAt = Date.now() + SSO_TOKEN_EXPIRY_MS;
    const payload = JSON.stringify({
      discordId,
      username,
      suiteAccountId,
      grudgeId,
      characterId: characterId || null,
      expiresAt,
      source: 'grudge-wars',
    });
    const signature = generateSsoSignature(payload);
    const token = Buffer.from(payload).toString('base64') + '.' + signature;

    const params = new URLSearchParams({ sso_token: token });
    if (characterId) params.set('characterId', characterId);

    res.json({
      success: true,
      token,
      redirectUrl: `${CRAFTING_SUITE_URL}/?${params.toString()}`,
      expiresAt,
    });
  } catch (err) {
    console.error('[SSO] Token generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate SSO token' });
  }
});

/**
 * POST /api/crafting/sso-verify
 * Allows the Crafting Suite to verify an SSO token server-side.
 * Called by the Crafting Suite backend to validate tokens it receives.
 */
app.post('/api/crafting/sso-verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ valid: false, error: 'Token required' });

    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) {
      return res.status(400).json({ valid: false, error: 'Invalid token format' });
    }

    let payload;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
    } catch {
      return res.status(400).json({ valid: false, error: 'Invalid token payload' });
    }

    // Verify HMAC signature
    const expected = generateSsoSignature(JSON.stringify({
      discordId: payload.discordId,
      username: payload.username,
      suiteAccountId: payload.suiteAccountId,
      grudgeId: payload.grudgeId,
      characterId: payload.characterId,
      expiresAt: payload.expiresAt,
      source: payload.source,
    }));

    if (expected !== signature) {
      return res.status(403).json({ valid: false, error: 'Invalid signature' });
    }

    if (payload.expiresAt < Date.now()) {
      return res.status(401).json({ valid: false, error: 'Token expired' });
    }

    res.json({
      valid: true,
      discordId: payload.discordId,
      username: payload.username,
      suiteAccountId: payload.suiteAccountId,
      grudgeId: payload.grudgeId,
      characterId: payload.characterId,
    });
  } catch (err) {
    console.error('[SSO] Token verify error:', err.message);
    res.status(500).json({ valid: false, error: 'Verification failed' });
  }
});

// ── Studio Hub Bridge ────────────────────────────────────────────────────────
// These routes let the Grudge Studio App (Puter) interact with game data.
// Auth is either via Discord session (X-Session-Token) or Puter token (X-Puter-Token).

/**
 * POST /api/studio/account/init
 * Initialise or fetch the unified Puter KV account record.
 * Body: { puterId, puterUsername }
 */
app.post('/api/studio/account/init', async (req, res) => {
  try {
    const { puterId, puterUsername } = req.body;
    if (!puterId) return res.status(400).json({ error: 'puterId required' });
    const result = await accountInit(puterId, puterUsername || 'unknown', req);
    res.json(result);
  } catch (err) {
    console.error('[Studio] Account init error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/studio/account/link-discord
 * Link Discord identity to Puter account. Requires Discord session.
 */
app.post('/api/studio/account/link-discord', requireSession, async (req, res) => {
  try {
    const { puterId } = req.body;
    if (!puterId) return res.status(400).json({ error: 'puterId required' });
    const { discordId, username: discordUsername } = req.session;

    // Try to resolve grudgeId from suite DB
    let grudgeId = null;
    try {
      const { suiteQuery, isConnected } = await import('./src/server/suiteDb.js');
      if (isConnected()) {
        const result = await suiteQuery('SELECT grudge_id FROM accounts WHERE discord_id = $1', [discordId]);
        if (result.rows[0]) grudgeId = result.rows[0].grudge_id;
      }
    } catch { /* non-fatal */ }

    const result = await accountLinkDiscord(puterId, discordId, discordUsername, grudgeId, req);
    res.json(result);
  } catch (err) {
    console.error('[Studio] Link discord error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/studio/account/:puterId
 * Fetch the unified account from Puter KV.
 */
app.get('/api/studio/account/:puterId', async (req, res) => {
  try {
    const result = await accountGet(req.params.puterId, req);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/studio/characters
 * Returns characters for the authenticated player.
 * Resolves identity via Discord session → suite DB → characters.
 */
app.get('/api/studio/characters', requireSession, async (req, res) => {
  try {
    const { discordId } = req.session;
    const { suiteQuery, isConnected } = await import('./src/server/suiteDb.js');
    if (!isConnected()) return res.status(503).json({ error: 'Suite DB not available' });

    const accResult = await suiteQuery('SELECT id, grudge_id FROM accounts WHERE discord_id = $1', [discordId]);
    if (!accResult.rows[0]) return res.json({ characters: [], linked: false });
    const accountId = accResult.rows[0].id;

    const charResult = await suiteQuery(
      `SELECT id, name, race_id, class_id, level, experience, profession,
              attribute_points, current_health, current_mana, current_stamina,
              profession_progression, created_at, updated_at
       FROM characters WHERE account_id = $1 ORDER BY created_at`, [accountId]
    );

    res.json({
      characters: charResult.rows.map(c => ({
        id: c.id, name: c.name, raceId: c.race_id, classId: c.class_id,
        level: c.level, experience: c.experience, profession: c.profession,
        attributes: c.attribute_points || {},
        currentHealth: c.current_health, currentMana: c.current_mana, currentStamina: c.current_stamina,
        professionProgression: c.profession_progression || {},
        createdAt: c.created_at, updatedAt: c.updated_at,
      })),
      linked: true,
      grudgeId: accResult.rows[0].grudge_id,
    });
  } catch (err) {
    console.error('[Studio] Characters error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/studio/character/:id/full
 * Full character data: character + inventory + crafted items + skills + recipes.
 */
app.get('/api/studio/character/:id/full', requireSession, async (req, res) => {
  try {
    const charId = req.params.id;
    const { discordId } = req.session;
    const { suiteQuery, isConnected } = await import('./src/server/suiteDb.js');
    if (!isConnected()) return res.status(503).json({ error: 'Suite DB not available' });

    // Verify ownership
    const accResult = await suiteQuery('SELECT id FROM accounts WHERE discord_id = $1', [discordId]);
    if (!accResult.rows[0]) return res.status(404).json({ error: 'Account not found' });
    const accountId = accResult.rows[0].id;

    const charResult = await suiteQuery('SELECT * FROM characters WHERE id = $1 AND account_id = $2', [charId, accountId]);
    if (!charResult.rows[0]) return res.status(404).json({ error: 'Character not found or not owned' });
    const char = charResult.rows[0];

    // Fetch related data in parallel
    const [invResult, craftResult, skillResult, recipeResult] = await Promise.all([
      suiteQuery('SELECT * FROM inventory_items WHERE character_id = $1', [charId]),
      suiteQuery('SELECT * FROM crafted_items WHERE character_id = $1', [charId]),
      suiteQuery('SELECT * FROM unlocked_skills WHERE character_id = $1', [charId]),
      suiteQuery('SELECT * FROM unlocked_recipes WHERE character_id = $1', [charId]),
    ]);

    res.json({
      character: {
        id: char.id, name: char.name, raceId: char.race_id, classId: char.class_id,
        level: char.level, experience: char.experience, gold: char.gold,
        profession: char.profession,
        attributes: char.attribute_points || {},
        equipment: char.equipment || {},
        currentHealth: char.current_health, currentMana: char.current_mana, currentStamina: char.current_stamina,
        professionProgression: char.profession_progression || {},
      },
      inventory: invResult.rows.map(i => ({
        id: i.id, itemKey: i.item_key || i.item_name, itemType: i.item_type,
        tier: i.tier, quantity: i.quantity, equipped: i.equipped, stats: i.stats || {},
      })),
      craftedItems: craftResult.rows.map(c => ({
        id: c.id, itemName: c.item_name, profession: c.profession,
        tier: c.tier, equipped: c.equipped, itemType: c.item_type,
      })),
      skills: skillResult.rows.map(s => ({
        id: s.id, nodeId: s.node_id, profession: s.profession,
        skillName: s.skill_name, tier: s.tier,
      })),
      recipes: recipeResult.rows.map(r => ({
        id: r.id, recipeId: r.recipe_id, source: r.source,
      })),
    });
  } catch (err) {
    console.error('[Studio] Character full error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/studio/crafting/jobs
 * Active crafting queue for authenticated player.
 */
app.get('/api/studio/crafting/jobs', requireSession, async (req, res) => {
  try {
    const { discordId } = req.session;
    const { suiteQuery, isConnected } = await import('./src/server/suiteDb.js');
    if (!isConnected()) return res.status(503).json({ error: 'Suite DB not available' });

    const accResult = await suiteQuery('SELECT id FROM accounts WHERE discord_id = $1', [discordId]);
    if (!accResult.rows[0]) return res.json({ jobs: [] });

    const jobResult = await suiteQuery(
      `SELECT cj.*, c.name as character_name FROM crafting_jobs cj
       JOIN characters c ON c.id = cj.character_id
       WHERE c.account_id = $1 ORDER BY cj.started_at DESC LIMIT 50`, [accResult.rows[0].id]
    );

    const now = Date.now();
    res.json({
      jobs: jobResult.rows.map(j => ({
        id: j.id, recipeId: j.recipe_id, characterId: j.character_id,
        characterName: j.character_name, quantity: j.quantity,
        status: j.status, startedAt: j.started_at,
        completesAt: j.completes_at,
        isReady: j.status === 'pending' && new Date(j.completes_at).getTime() <= now,
      })),
    });
  } catch (err) {
    console.error('[Studio] Crafting jobs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/studio/crafting/claim
 * Claim a completed crafting job remotely.
 * Body: { jobId }
 */
app.post('/api/studio/crafting/claim', requireSession, async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: 'jobId required' });
    const { discordId } = req.session;
    const { suiteQuery, isConnected } = await import('./src/server/suiteDb.js');
    if (!isConnected()) return res.status(503).json({ error: 'Suite DB not available' });

    // Verify ownership through account → character → job
    const accResult = await suiteQuery('SELECT id FROM accounts WHERE discord_id = $1', [discordId]);
    if (!accResult.rows[0]) return res.status(404).json({ error: 'Account not found' });

    const jobResult = await suiteQuery(
      `SELECT cj.* FROM crafting_jobs cj
       JOIN characters c ON c.id = cj.character_id
       WHERE cj.id = $1 AND c.account_id = $2`, [jobId, accResult.rows[0].id]
    );
    if (!jobResult.rows[0]) return res.status(404).json({ error: 'Job not found or not owned' });

    const job = jobResult.rows[0];
    if (job.status === 'claimed') return res.status(400).json({ error: 'Already claimed' });
    if (new Date(job.completes_at).getTime() > Date.now()) return res.status(400).json({ error: 'Not yet complete' });

    await suiteQuery(
      `UPDATE crafting_jobs SET status = 'claimed', claimed_at = NOW() WHERE id = $1`, [jobId]
    );

    res.json({ success: true, jobId });
  } catch (err) {
    console.error('[Studio] Crafting claim error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/studio/sync/push
 * Push full game state snapshot to Puter KV.
 * Body: { accountId, gameState }
 */
app.post('/api/studio/sync/push', requireSession, async (req, res) => {
  try {
    const { accountId, gameState } = req.body;
    if (!accountId || !gameState) return res.status(400).json({ error: 'accountId and gameState required' });
    const result = await syncPush(accountId, gameState, req);
    res.json(result);
  } catch (err) {
    console.error('[Studio] Sync push error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/studio/sync/pull
 * Pull game state from Puter KV.
 * Body: { accountId }
 */
app.post('/api/studio/sync/pull', requireSession, async (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });
    const result = await syncPull(accountId, req);
    res.json(result);
  } catch (err) {
    console.error('[Studio] Sync pull error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/studio/saves
 * List all save keys for the player.
 */
app.get('/api/studio/saves', async (req, res) => {
  try {
    const result = await kvList('grudge:save:*', req);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/studio/health
 * Health check for Puter KV + Suite DB connectivity.
 */
app.get('/api/studio/health', async (req, res) => {
  try {
    const puterStatus = await puterHealthCheck();
    let suiteStatus = { available: false };
    try {
      const { isConnected } = await import('./src/server/suiteDb.js');
      suiteStatus = { available: isConnected() };
    } catch { /* non-fatal */ }

    res.json({
      puter: puterStatus,
      suiteDb: suiteStatus,
      server: { status: 'ok', uptime: process.uptime() },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

console.log('[Server] Studio Hub bridge routes registered');

registerDbRoutes(app);
registerWalletRoutes(app, requireSession);
registerCraftingRoutes(app);
console.log('[Server] Crafting routes registered');

if (isProd) {
  const htmlPages = ['compendium', 'arena', 'discordauth', 'hero-codex'];
  htmlPages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
      const filePath = path.join(__dirname_server, 'dist', `${page}.html`);
      res.sendFile(filePath, err => {
        if (err) res.sendFile(path.join(__dirname_server, 'dist', 'index.html'));
      });
    });
  });

  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname_server, 'dist', 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

(async () => {
  const connected = await testConnection();
  if (connected) await initDatabase();
  // Test suite DB connection (crafting/inventory integration)
  await testSuiteConnection();
  await startBot(new Map(), []);
})();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Grudge Warlords server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
});

function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
