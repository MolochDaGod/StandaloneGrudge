import express from 'express';
import crypto from 'crypto';
import pg from 'pg';

const { Pool } = pg;

const app = express();

// ── DB ──────────────────────────────────────────────────────────────────────
let _pool;
function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.GRUDGE_ACCOUNT_DB,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    });
    _pool.on('error', (err) => console.error('[DB] Pool error:', err.message));
  }
  return _pool;
}

async function dbQuery(text, params) {
  return getPool().query(text, params);
}

async function getClient() {
  return getPool().connect();
}

// ── JWT ─────────────────────────────────────────────────────────────────────
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

// ── Password Hashing ────────────────────────────────────────────────────────
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(`${salt}:${key.toString('hex')}`);
    });
  });
}

function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex') === key);
    });
  });
}

// ── DB Init ─────────────────────────────────────────────────────────────────
let _dbInitialized = false;
async function ensureDB() {
  if (_dbInitialized) return;
  try {
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(64) UNIQUE,
        username VARCHAR(128) NOT NULL,
        email VARCHAR(256),
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ,
        gold INTEGER DEFAULT 0,
        resources INTEGER DEFAULT 0,
        premium BOOLEAN DEFAULT FALSE,
        wallet_address VARCHAR(128),
        wallet_chain VARCHAR(32),
        wallet_created_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS characters (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name VARCHAR(128) NOT NULL,
        race_id VARCHAR(64) NOT NULL,
        class_id VARCHAR(64) NOT NULL,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        attribute_points JSONB DEFAULT '{}',
        abilities JSONB DEFAULT '[]',
        skill_tree JSONB DEFAULT '{}',
        status_effects JSONB DEFAULT '[]',
        current_health REAL,
        current_mana REAL,
        current_stamina REAL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        slot_index INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
        item_key VARCHAR(128) NOT NULL,
        item_type VARCHAR(64) NOT NULL,
        tier INTEGER DEFAULT 1,
        slot VARCHAR(64),
        stats JSONB DEFAULT '{}',
        equipped BOOLEAN DEFAULT FALSE,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS crafted_items (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
        item_key VARCHAR(128) NOT NULL,
        item_type VARCHAR(64) NOT NULL,
        tier INTEGER DEFAULT 1,
        base_item_key VARCHAR(128),
        enchantments JSONB DEFAULT '[]',
        stats JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS islands (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name VARCHAR(128) NOT NULL,
        zone_data JSONB DEFAULT '{}',
        conquer_progress JSONB DEFAULT '{}',
        quest_progress JSONB DEFAULT '{}',
        unlocked_locations JSONB DEFAULT '[]',
        harvest_state JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS arena_teams (
        team_id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        owner_name TEXT NOT NULL DEFAULT 'Unknown Warlord',
        status TEXT NOT NULL DEFAULT 'ranked',
        heroes JSONB NOT NULL DEFAULT '[]',
        hero_count INTEGER NOT NULL DEFAULT 0,
        avg_level INTEGER NOT NULL DEFAULT 1,
        share_token TEXT,
        snapshot_hash TEXT,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        total_battles INTEGER NOT NULL DEFAULT 0,
        rewards JSONB NOT NULL DEFAULT '{"gold":0,"resources":0,"equipment":[]}',
        demoted_at TIMESTAMPTZ,
        demote_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS arena_battles (
        id SERIAL PRIMARY KEY,
        battle_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        challenger_name TEXT NOT NULL DEFAULT 'Arena Challenger',
        result TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_arena_teams_wins ON arena_teams(wins DESC);
      CREATE INDEX IF NOT EXISTS idx_arena_teams_owner ON arena_teams(owner_id);
      CREATE INDEX IF NOT EXISTS idx_arena_teams_status ON arena_teams(status);
      CREATE INDEX IF NOT EXISTS idx_arena_battles_team ON arena_battles(team_id);
      CREATE INDEX IF NOT EXISTS idx_arena_battles_created ON arena_battles(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_characters_account ON characters(account_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_character ON inventory_items(character_id);
      CREATE INDEX IF NOT EXISTS idx_crafted_character ON crafted_items(character_id);
      CREATE INDEX IF NOT EXISTS idx_islands_account ON islands(account_id);

      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS grudge_username VARCHAR(64);
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password_hash VARCHAR(256);
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS auth_type VARCHAR(32) DEFAULT 'discord';
    `);
    // Create unique index on grudge_username where not null
    await dbQuery(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_grudge_username
      ON accounts(grudge_username) WHERE grudge_username IS NOT NULL;
    `).catch(() => {});
    _dbInitialized = true;
  } catch (err) {
    console.error('[DB] Init error:', err.message);
  }
}

// ── CORS & Middleware ────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://grudgewarlords.com',
  'https://www.grudgewarlords.com',
  'https://grudgeplatform.com',
  'https://www.grudgeplatform.com',
];

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const origin = req.headers.origin || '';
  const isPuterOrigin = origin.endsWith('.puter.com') || origin === 'https://puter.com';
  const isSameOrigin = origin === `https://${req.headers.host}`;
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || isPuterOrigin || isSameOrigin;

  if (origin && isAllowed) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, X-Admin-Token, X-Api-Key');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '1mb' }));

// Ensure DB on every request
app.use(async (req, res, next) => {
  await ensureDB();
  next();
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function getPublicOrigin(req) {
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers['host'];
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = forwardedHost?.split(',')[0]?.trim();
  if (host && !host.includes('localhost')) return `${proto}://${host}`;
  return `${proto}://${host || 'localhost:3000'}`;
}

function requireSession(req, res, next) {
  const token = req.headers['x-session-token'] || req.body?.sessionToken;
  if (!token) return res.status(401).json({ error: 'Session token required' });
  const payload = verifyJWT(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired session' });
  req.session = payload;
  next();
}

const ADMIN_TOKEN = () => process.env.GAME_API_GRUDA;

function requireAdmin(req, res, next) {
  const auth = req.headers['x-admin-token'];
  const tok = ADMIN_TOKEN();
  if (!auth || !tok || auth !== tok) return res.status(403).json({ error: 'Unauthorized' });
  next();
}

function requireAuth(req, res, next) {
  const token = req.headers['x-api-key'] || req.query.token;
  const tok = ADMIN_TOKEN();
  if (!token || !tok || token !== tok) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── AUTH: Register ──────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (username.length < 3 || username.length > 32) return res.status(400).json({ error: 'Username must be 3-32 characters' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return res.status(400).json({ error: 'Username can only contain letters, numbers, _ and -' });

    const existing = await dbQuery('SELECT id FROM accounts WHERE grudge_username = $1', [username.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Username already taken' });

    const hashed = await hashPassword(password);
    const result = await dbQuery(
      `INSERT INTO accounts (grudge_username, username, password_hash, auth_type, last_login)
       VALUES ($1, $2, $3, 'grudge', NOW()) RETURNING *`,
      [username.toLowerCase(), username, hashed]
    );
    const account = result.rows[0];
    const jwt = createJWT({
      accountId: account.id,
      username: account.username,
      grudgeUsername: account.grudge_username,
      authType: 'grudge',
    });
    res.json({
      success: true,
      sessionToken: jwt,
      user: { id: account.id, username: account.username, grudgeUsername: account.grudge_username, authType: 'grudge' },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── AUTH: Login ─────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const result = await dbQuery('SELECT * FROM accounts WHERE grudge_username = $1', [username.toLowerCase()]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Invalid username or password' });
    const account = result.rows[0];
    if (!account.password_hash) return res.status(401).json({ error: 'This account uses a different login method' });

    const valid = await verifyPassword(password, account.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });

    await dbQuery('UPDATE accounts SET last_login = NOW() WHERE id = $1', [account.id]);

    const jwt = createJWT({
      accountId: account.id,
      username: account.username,
      grudgeUsername: account.grudge_username,
      discordId: account.discord_id,
      authType: 'grudge',
    });
    res.json({
      success: true,
      sessionToken: jwt,
      user: {
        id: account.id,
        username: account.username,
        grudgeUsername: account.grudge_username,
        discordId: account.discord_id,
        authType: 'grudge',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── AUTH: Puter ─────────────────────────────────────────────────────────────
app.post('/api/auth/puter', async (req, res) => {
  try {
    const { puterUsername } = req.body;
    if (!puterUsername) return res.status(400).json({ error: 'puterUsername required' });

    const existing = await dbQuery('SELECT * FROM accounts WHERE grudge_username = $1', [puterUsername.toLowerCase()]);
    let account;
    if (existing.rows[0]) {
      account = existing.rows[0];
      await dbQuery('UPDATE accounts SET last_login = NOW() WHERE id = $1', [account.id]);
    } else {
      const result = await dbQuery(
        `INSERT INTO accounts (grudge_username, username, auth_type, last_login)
         VALUES ($1, $2, 'puter', NOW()) RETURNING *`,
        [puterUsername.toLowerCase(), puterUsername]
      );
      account = result.rows[0];
    }

    const jwt = createJWT({
      accountId: account.id,
      username: account.username,
      grudgeUsername: account.grudge_username,
      discordId: account.discord_id,
      authType: 'puter',
    });
    res.json({
      success: true,
      sessionToken: jwt,
      user: {
        id: account.id,
        username: account.username,
        grudgeUsername: account.grudge_username,
        discordId: account.discord_id,
        authType: 'puter',
      },
    });
  } catch (err) {
    console.error('Puter auth error:', err);
    res.status(500).json({ error: 'Puter auth failed' });
  }
});

// ── AUTH: Verify ────────────────────────────────────────────────────────────
app.post('/api/auth/verify', (req, res) => {
  const { sessionToken } = req.body;
  if (!sessionToken) return res.status(400).json({ error: 'sessionToken required' });
  const payload = verifyJWT(sessionToken);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired session' });
  res.json({
    valid: true,
    accountId: payload.accountId,
    discordId: payload.discordId,
    username: payload.username,
    grudgeUsername: payload.grudgeUsername,
    authType: payload.authType,
  });
});

// ── Discord OAuth ───────────────────────────────────────────────────────────
const pendingStates = new Map();

app.get('/api/discord/login', (req, res) => {
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const redirectUrl = req.query.redirect_uri || null;
  const origin = getPublicOrigin(req);
  const redirectUri = redirectUrl || `${origin}/discordauth`;
  const scope = encodeURIComponent('identify email guilds.join');
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, { ts: Date.now(), redirectUri });

  // Cleanup old states
  if (pendingStates.size > 500) {
    const cutoff = Date.now() - 600000;
    for (const [k, v] of pendingStates) { if (v.ts < cutoff) pendingStates.delete(k); }
  }

  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;
  res.json({ url, state, clientId: DISCORD_CLIENT_ID, scope: 'identify email guilds.join' });
});

app.post('/api/discord/callback', async (req, res) => {
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const { code, state } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  if (!state || !pendingStates.has(state)) {
    return res.status(403).json({ error: 'Invalid or missing state parameter' });
  }
  const stateEntry = pendingStates.get(state);
  pendingStates.delete(state);

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
    if (!userRes.ok) return res.status(400).json({ error: 'Failed to fetch user' });
    const user = await userRes.json();

    // Auto-join guild
    let guildJoined = false;
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || '1371299544725704766';
    if (DISCORD_BOT_TOKEN && DISCORD_GUILD_ID) {
      try {
        const joinRes = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${user.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken }),
        });
        guildJoined = joinRes.ok || joinRes.status === 204;
      } catch (e) { console.error('Guild join failed:', e.message); }
    }

    // Upsert account
    const accountResult = await dbQuery(
      `INSERT INTO accounts (discord_id, username, email, avatar_url, auth_type, last_login)
       VALUES ($1, $2, $3, $4, 'discord', NOW())
       ON CONFLICT (discord_id) DO UPDATE SET
         username = EXCLUDED.username, email = EXCLUDED.email,
         avatar_url = EXCLUDED.avatar_url, updated_at = NOW(), last_login = NOW()
       RETURNING *`,
      [user.id, user.username, user.email, user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null]
    );
    const account = accountResult.rows[0];

    const jwt = createJWT({
      accountId: account.id,
      discordId: user.id,
      username: user.username,
      authType: 'discord',
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        email: user.email,
        globalName: user.global_name,
      },
      guildJoined,
      sessionToken: jwt,
    });
  } catch (err) {
    console.error('Discord callback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/discord/webhook/verify', (req, res) => {
  const auth = req.headers['x-admin-token'];
  const tok = ADMIN_TOKEN();
  if (!auth || !tok || auth !== tok) return res.status(403).json({ authorized: false });
  res.json({ authorized: true });
});

// ── External OAuth ──────────────────────────────────────────────────────────
const ALLOWED_RETURN_ORIGINS = [...ALLOWED_ORIGINS];

app.get('/api/external/login', (req, res) => {
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  let returnUrl = req.query.returnUrl || 'https://grudgewarlords.com/dungeon';
  try {
    const parsed = new URL(returnUrl);
    if (!ALLOWED_RETURN_ORIGINS.includes(parsed.origin)) returnUrl = 'https://grudgewarlords.com/dungeon';
  } catch { returnUrl = 'https://grudgewarlords.com/dungeon'; }
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, { ts: Date.now(), returnUrl });
  const origin = getPublicOrigin(req);
  const redirectUri = `${origin}/api/external/callback`;
  const scope = 'identify email guilds.join';
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
  res.redirect(url);
});

app.get('/api/external/callback', async (req, res) => {
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
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
    if (!tokenData.access_token) return res.status(400).send('Discord login failed. Please try again.');

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    // Upsert
    const accountResult = await dbQuery(
      `INSERT INTO accounts (discord_id, username, email, auth_type, last_login)
       VALUES ($1, $2, $3, 'discord', NOW())
       ON CONFLICT (discord_id) DO UPDATE SET
         username = EXCLUDED.username, email = EXCLUDED.email, updated_at = NOW(), last_login = NOW()
       RETURNING *`,
      [user.id, user.username, user.email]
    );
    const account = accountResult.rows[0];

    const jwt = createJWT({
      accountId: account.id,
      discordId: user.id,
      username: user.username,
      authType: 'discord',
    });

    const returnOrigin = new URL(returnUrl).origin;
    res.send(`<!DOCTYPE html><html><head><title>Grudge Login</title></head><body>
<script>
try {
  var data = ${JSON.stringify({ sessionToken: jwt, user: { id: user.id, username: user.username, avatar: user.avatar, email: user.email } })};
  localStorage.setItem('grudge_session_token', data.sessionToken);
  localStorage.setItem('discordUser', JSON.stringify(data.user));
  if (window.opener) {
    window.opener.postMessage({ type: 'grudge_login', data: data }, ${JSON.stringify(returnOrigin)});
    window.close();
  } else { window.location.href = ${JSON.stringify(returnUrl)}; }
} catch(e) { window.location.href = ${JSON.stringify(returnUrl)}; }
</script></body></html>`);
  } catch (err) {
    res.status(500).send('Login error: ' + err.message);
  }
});

// ── Webhooks ────────────────────────────────────────────────────────────────
const EMBED_COLORS = { update: 0x6ee7b3, patch: 0xa78bfa, challenge: 0xf59e0b, event: 0xef4444, milestone: 0x3b82f6, lore: 0x8b5cf6, tip: 0x10b981 };

async function sendWebhookMessage({ content, embeds, username, avatar_url }) {
  const DISCORD_WEBHOOK_URL = process.env.DISCORD_GRUDGE_WEBHOOK;
  if (!DISCORD_WEBHOOK_URL) throw new Error('Webhook URL not configured');
  const payload = {};
  if (content) payload.content = content;
  if (embeds) payload.embeds = embeds;
  payload.username = username || 'Grudge Warlords';
  payload.avatar_url = avatar_url || 'https://grudgewarlords.com/icons/logo.png';
  const r = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Webhook failed (${r.status}): ${await r.text()}`);
  return true;
}

app.post('/api/discord/webhook/update', requireAdmin, async (req, res) => {
  const { title, description, features, version } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
  try {
    const fields = (features || []).map(f => ({ name: f.name || 'Feature', value: f.value || f, inline: true }));
    if (version) fields.unshift({ name: 'Version', value: version, inline: true });
    await sendWebhookMessage({ content: '## Game Update Available!', embeds: [{ title: `Update: ${title}`, description, color: EMBED_COLORS.update, fields, footer: { text: 'Grudge Warlords | grudgewarlords.com' }, timestamp: new Date().toISOString() }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/discord/webhook/patch', requireAdmin, async (req, res) => {
  const { version, changes, bugfixes } = req.body;
  if (!version) return res.status(400).json({ error: 'Version required' });
  try {
    const changeList = (changes || []).map(c => `- ${c}`).join('\n') || 'No changes listed';
    const bugList = (bugfixes || []).map(b => `- ${b}`).join('\n');
    const fields = [{ name: 'Changes', value: changeList }];
    if (bugList) fields.push({ name: 'Bug Fixes', value: bugList });
    await sendWebhookMessage({ content: `## Patch Notes - v${version}`, embeds: [{ title: `Patch ${version}`, description: 'A new patch has been deployed!', color: EMBED_COLORS.patch, fields, footer: { text: 'Grudge Warlords | Patch Notes' }, timestamp: new Date().toISOString() }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/discord/webhook/challenge', requireAdmin, async (req, res) => {
  const { title, description, reward, deadline } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
  try {
    const fields = [];
    if (reward) fields.push({ name: 'Reward', value: reward, inline: true });
    if (deadline) fields.push({ name: 'Deadline', value: deadline, inline: true });
    await sendWebhookMessage({ content: '## New Community Challenge!', embeds: [{ title: `Challenge: ${title}`, description, color: EMBED_COLORS.challenge, fields, footer: { text: 'Grudge Warlords | Community Challenge' }, timestamp: new Date().toISOString() }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/discord/webhook/event', requireAdmin, async (req, res) => {
  const { title, description, startTime, endTime } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
  try {
    const fields = [];
    if (startTime) fields.push({ name: 'Starts', value: startTime, inline: true });
    if (endTime) fields.push({ name: 'Ends', value: endTime, inline: true });
    await sendWebhookMessage({ content: '## Live Event Announcement!', embeds: [{ title: `Event: ${title}`, description, color: EMBED_COLORS.event, fields, footer: { text: 'Grudge Warlords | Events' }, timestamp: new Date().toISOString() }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/discord/webhook/lore', requireAdmin, async (req, res) => {
  const { title, story, character } = req.body;
  if (!title || !story) return res.status(400).json({ error: 'Title and story required' });
  try {
    const fields = [];
    if (character) fields.push({ name: 'Featured Character', value: character, inline: true });
    await sendWebhookMessage({ content: '## Lore Drop', embeds: [{ title: `Lore: ${title}`, description: `*${story}*`, color: EMBED_COLORS.lore, fields, footer: { text: 'Grudge Warlords | World Lore' }, timestamp: new Date().toISOString() }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/discord/webhook/tip', requireAdmin, async (req, res) => {
  const { title, tip, category } = req.body;
  if (!title || !tip) return res.status(400).json({ error: 'Title and tip required' });
  try {
    const fields = [];
    if (category) fields.push({ name: 'Category', value: category, inline: true });
    await sendWebhookMessage({ content: '## Warlord Tip of the Day', embeds: [{ title: `Tip: ${title}`, description: tip, color: EMBED_COLORS.tip, fields, footer: { text: 'Grudge Warlords | Tips & Tricks' }, timestamp: new Date().toISOString() }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/discord/webhook/custom', requireAdmin, async (req, res) => {
  const { content, title, description, color, fields } = req.body;
  if (!content && !title) return res.status(400).json({ error: 'Content or title required' });
  try {
    const payload = {};
    if (content) payload.content = content;
    if (title) payload.embeds = [{ title, description: description || '', color: color || EMBED_COLORS.update, fields: fields || [], footer: { text: 'Grudge Warlords' }, timestamp: new Date().toISOString() }];
    await sendWebhookMessage(payload);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), platform: 'vercel' });
});

// ── Arena ────────────────────────────────────────────────────────────────────
let arenaSeq = 0;
const challengeNonces = new Map();

function generateArenaUuid(prefix) {
  const now = new Date();
  const ts = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
  arenaSeq++;
  const seq = arenaSeq.toString(16).toUpperCase().padStart(6, '0');
  let hash = 0x811c9dc5;
  const input = `${prefix}-${ts}-${seq}-${Math.random()}`;
  for (let i = 0; i < input.length; i++) { hash ^= input.charCodeAt(i); hash = Math.imul(hash, 0x01000193); }
  hash = ((hash >>> 0) ^ ((hash >>> 0) >>> 16)) >>> 0;
  const h = hash.toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
  return `${prefix}-${ts}-${seq}-${h}`;
}

function computeSha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function teamRowToObj(row) {
  return {
    teamId: row.team_id, ownerId: row.owner_id, ownerName: row.owner_name, status: row.status,
    heroes: row.heroes, heroCount: row.hero_count, avgLevel: row.avg_level,
    shareToken: row.share_token, snapshotHash: row.snapshot_hash,
    wins: row.wins, losses: row.losses, totalBattles: row.total_battles,
    rewards: row.rewards, createdAt: new Date(row.created_at).getTime(),
    demotedAt: row.demoted_at ? new Date(row.demoted_at).getTime() : null, demoteReason: row.demote_reason,
  };
}

app.post('/api/arena/submit', async (req, res) => {
  try {
    const { ownerId, ownerName, heroes, shareToken } = req.body;
    if (!ownerId || !heroes || !Array.isArray(heroes) || heroes.length === 0 || heroes.length > 3) return res.status(400).json({ error: 'Valid ownerId and 1-3 heroes required' });
    for (const h of heroes) { if (!h.name || !h.raceId || !h.classId) return res.status(400).json({ error: 'Hero missing name/race/class' }); }

    await dbQuery(`UPDATE arena_teams SET status = 'unranked', demoted_at = NOW(), demote_reason = 'replaced', updated_at = NOW() WHERE owner_id = $1 AND status = 'ranked'`, [ownerId]);
    const teamId = generateArenaUuid('TEAM');
    const snapshotJson = JSON.stringify(heroes);
    const snapshotHash = computeSha256Hex(snapshotJson);
    const heroCount = heroes.length;
    const avgLevel = Math.round(heroes.reduce((s, h) => s + (h.level || 1), 0) / heroCount);

    await dbQuery(
      `INSERT INTO arena_teams (team_id, owner_id, owner_name, status, heroes, hero_count, avg_level, share_token, snapshot_hash, wins, losses, total_battles, rewards) VALUES ($1,$2,$3,'ranked',$4,$5,$6,$7,$8,0,0,0,'{"gold":0,"resources":0,"equipment":[]}')`,
      [teamId, ownerId, ownerName || 'Unknown Warlord', JSON.stringify(heroes), heroCount, avgLevel, shareToken || null, snapshotHash]
    );
    sendWebhookMessage({ embeds: [{ title: 'New Arena Challenger!', description: `**${ownerName || 'Unknown Warlord'}** has entered the Ranked Arena!`, color: EMBED_COLORS.challenge, fields: [{ name: 'Team', value: heroes.map(h => `${h.name} (Lv.${h.level || 1} ${h.raceId} ${h.classId})`).join('\n'), inline: false }, { name: 'Avg Level', value: `${avgLevel}`, inline: true }, { name: 'Heroes', value: `${heroCount}`, inline: true }], footer: { text: 'GRUDA PvP Arena' }, timestamp: new Date().toISOString() }] }).catch(() => {});
    res.json({ success: true, teamId, snapshotHash, status: 'ranked', message: 'Team submitted to Ranked Arena!' });
  } catch (err) { console.error('Arena submit error:', err); res.status(500).json({ error: 'Failed to submit team' }); }
});

app.get('/api/arena/lobby', async (req, res) => {
  try {
    const { status, page, limit: lim } = req.query;
    const pageNum = Math.max(0, parseInt(page) || 0);
    const pageSize = Math.min(50, Math.max(1, parseInt(lim) || 20));
    const offset = pageNum * pageSize;
    let whereClause = ''; const params = [];
    if (status === 'ranked' || status === 'unranked') { whereClause = 'WHERE status = $1'; params.push(status); }
    const countResult = await dbQuery(`SELECT COUNT(*) as count FROM arena_teams ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);
    const teamsResult = await dbQuery(`SELECT * FROM arena_teams ${whereClause} ORDER BY CASE WHEN status = 'ranked' THEN 0 ELSE 1 END, wins DESC, losses ASC, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, pageSize, offset]);
    const safe = teamsResult.rows.map(row => { const t = teamRowToObj(row); return { teamId: t.teamId, ownerName: t.ownerName, status: t.status, heroCount: t.heroCount, avgLevel: t.avgLevel, wins: t.wins, losses: t.losses, totalBattles: t.totalBattles, createdAt: t.createdAt, heroSummary: (t.heroes || []).map(h => ({ name: h.name, raceId: h.raceId, classId: h.classId, level: h.level || 1 })) }; });
    res.json({ teams: safe, total, page: pageNum, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { console.error('Arena lobby error:', err); res.status(500).json({ error: 'Failed to load lobby' }); }
});

app.get('/api/arena/team/:teamId', async (req, res) => {
  try {
    const result = await dbQuery('SELECT * FROM arena_teams WHERE team_id = $1', [req.params.teamId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Team not found' });
    const team = teamRowToObj(result.rows[0]);
    const nonce = crypto.randomBytes(16).toString('hex');
    challengeNonces.set(nonce, { teamId: team.teamId, createdAt: Date.now() });
    if (challengeNonces.size > 1000) { const cutoff = Date.now() - 30 * 60 * 1000; for (const [k, v] of challengeNonces) { if (v.createdAt < cutoff) challengeNonces.delete(k); } }
    res.json({ teamId: team.teamId, ownerId: team.ownerId, ownerName: team.ownerName, status: team.status, heroes: team.heroes, snapshotHash: team.snapshotHash, wins: team.wins, losses: team.losses, totalBattles: team.totalBattles, rewards: team.rewards, createdAt: team.createdAt, avgLevel: team.avgLevel, challengeNonce: nonce });
  } catch (err) { console.error('Arena team error:', err); res.status(500).json({ error: 'Failed to load team' }); }
});

app.post('/api/arena/battle/result', async (req, res) => {
  try {
    const { teamId, challengerName, result, challengeNonce } = req.body;
    if (!teamId || !result) return res.status(400).json({ error: 'teamId and result required' });
    if (!challengeNonce) return res.status(400).json({ error: 'challengeNonce is required' });
    const nonceData = challengeNonces.get(challengeNonce);
    if (!nonceData || nonceData.teamId !== teamId) return res.status(403).json({ error: 'Invalid or expired challenge token' });
    if (Date.now() - nonceData.createdAt > 30 * 60 * 1000) { challengeNonces.delete(challengeNonce); return res.status(403).json({ error: 'Challenge token expired' }); }
    challengeNonces.delete(challengeNonce);

    const client = await getClient();
    let team, battleId, rewardData, newWins, newLosses, newStatus, demoted, demoteReason;
    try {
      await client.query('BEGIN');
      const teamResult = await client.query('SELECT * FROM arena_teams WHERE team_id = $1 FOR UPDATE', [teamId]);
      if (!teamResult.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Team not found' }); }
      team = teamRowToObj(teamResult.rows[0]);
      battleId = generateArenaUuid('BTLE');
      await client.query(`INSERT INTO arena_battles (battle_id, team_id, challenger_name, result) VALUES ($1,$2,$3,$4)`, [battleId, teamId, challengerName || 'Arena Challenger', result]);

      rewardData = null; newWins = team.wins; newLosses = team.losses; newStatus = team.status;
      let newRewards = { ...team.rewards }; demoteReason = team.demoteReason;

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
          } else { rewardData = { gold: goldReward, resources: resourceReward }; }
        }
      } else if (result === 'team_lost') {
        newLosses++;
        if (team.status === 'ranked' && newLosses >= 3) { newStatus = 'unranked'; demoteReason = 'losses'; }
      }
      demoted = newStatus === 'unranked' && demoteReason === 'losses' && newLosses === 3;

      await client.query(`UPDATE arena_teams SET wins=$1, losses=$2, total_battles=total_battles+1, status=$3, rewards=$4, demoted_at=$5, demote_reason=$6, updated_at=NOW() WHERE team_id=$7`,
        [newWins, newLosses, newStatus, JSON.stringify(newRewards), demoted ? new Date() : team.demotedAt ? new Date(team.demotedAt) : null, demoteReason, teamId]);
      await client.query('COMMIT');
    } catch (txErr) { await client.query('ROLLBACK'); throw txErr; } finally { client.release(); }

    if (demoted) { sendWebhookMessage({ embeds: [{ title: 'Relegation!', description: `**${team.ownerName}**'s team has been relegated after 3 defeats!`, color: EMBED_COLORS.event, fields: [{ name: 'Record', value: `${newWins}W / ${newLosses}L`, inline: true }], footer: { text: 'GRUDA PvP Arena' }, timestamp: new Date().toISOString() }] }).catch(() => {}); }
    res.json({ success: true, battleId, teamStatus: newStatus, wins: newWins, losses: newLosses, demoted, rewards: rewardData });
  } catch (err) { console.error('Arena battle error:', err); res.status(500).json({ error: 'Failed to record battle result' }); }
});

app.get('/api/arena/rewards/:teamId', async (req, res) => {
  try {
    const result = await dbQuery('SELECT * FROM arena_teams WHERE team_id = $1', [req.params.teamId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Team not found' });
    const t = teamRowToObj(result.rows[0]);
    res.json({ teamId: t.teamId, ownerName: t.ownerName, status: t.status, wins: t.wins, losses: t.losses, rewards: t.rewards });
  } catch (err) { res.status(500).json({ error: 'Failed to load rewards' }); }
});

app.get('/api/arena/stats', async (req, res) => {
  try {
    const teamStats = await dbQuery(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='ranked') as ranked, COUNT(*) FILTER (WHERE status='unranked') as unranked FROM arena_teams`);
    const battleCount = await dbQuery('SELECT COUNT(*) as total FROM arena_battles');
    const recentBattles = await dbQuery('SELECT battle_id, team_id, challenger_name, result, created_at FROM arena_battles ORDER BY created_at DESC LIMIT 10');
    const row = teamStats.rows[0];
    res.json({ totalTeams: parseInt(row.total), rankedTeams: parseInt(row.ranked), unrankedTeams: parseInt(row.unranked), totalBattles: parseInt(battleCount.rows[0].total), recentBattles: recentBattles.rows.map(b => ({ battleId: b.battle_id, teamId: b.team_id, challengerName: b.challenger_name, result: b.result, timestamp: new Date(b.created_at).getTime() })) });
  } catch (err) { res.json({ totalTeams: 0, rankedTeams: 0, unrankedTeams: 0, totalBattles: 0, recentBattles: [] }); }
});

app.get('/api/arena/leaderboard', async (req, res) => {
  try {
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const result = await dbQuery(`SELECT * FROM arena_teams WHERE total_battles > 0 ORDER BY wins DESC, losses ASC, created_at ASC LIMIT $1`, [pageSize]);
    const leaderboard = result.rows.map((row, i) => { const t = teamRowToObj(row); return { rank: i + 1, teamId: t.teamId, ownerName: t.ownerName, status: t.status, wins: t.wins, losses: t.losses, totalBattles: t.totalBattles, avgLevel: t.avgLevel, heroCount: t.heroCount, heroes: (t.heroes || []).map(h => ({ name: h.name, raceId: h.raceId, classId: h.classId, level: h.level || 1 })), winRate: t.totalBattles > 0 ? Math.round((t.wins / t.totalBattles) * 100) : 0, createdAt: t.createdAt }; });
    const totalResult = await dbQuery('SELECT COUNT(*) as count FROM arena_teams WHERE total_battles > 0');
    res.json({ leaderboard, totalEntries: parseInt(totalResult.rows[0].count), updatedAt: Date.now() });
  } catch (err) { res.json({ leaderboard: [], totalEntries: 0, updatedAt: Date.now() }); }
});

// ── Public API ───────────────────────────────────────────────────────────────
app.get('/api/public/profile', requireSession, async (req, res) => {
  try {
    let account;
    if (req.session.discordId) {
      const r = await dbQuery('SELECT * FROM accounts WHERE discord_id = $1', [req.session.discordId]);
      account = r.rows[0];
    } else if (req.session.accountId) {
      const r = await dbQuery('SELECT * FROM accounts WHERE id = $1', [req.session.accountId]);
      account = r.rows[0];
    }
    if (!account) return res.json({ found: false });
    const chars = await dbQuery('SELECT * FROM characters WHERE account_id = $1 ORDER BY slot_index', [account.id]);
    res.json({ found: true, account: { id: account.id, discordId: account.discord_id, username: account.username, grudgeUsername: account.grudge_username, gold: account.gold, resources: account.resources, premium: account.premium, avatarUrl: account.avatar_url }, heroes: chars.rows.map(c => ({ name: c.name, raceId: c.race_id, classId: c.class_id, level: c.level, experience: c.experience, isActive: c.is_active })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/public/leaderboard', async (req, res) => {
  try {
    const result = await dbQuery(`SELECT owner_name, wins, losses, hero_count FROM arena_teams WHERE total_battles > 0 ORDER BY wins DESC LIMIT 50`);
    res.json({ leaderboard: result.rows.map((row, i) => ({ ownerName: row.owner_name, rank: i + 1, wins: row.wins || 0, losses: row.losses || 0, heroCount: row.hero_count || 0 })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/public/stats', async (req, res) => {
  try {
    const accountCount = await dbQuery('SELECT COUNT(*) as count FROM accounts');
    const charCount = await dbQuery('SELECT COUNT(*) as count FROM characters');
    const arenaTeamCount = await dbQuery('SELECT COUNT(*) as count FROM arena_teams');
    const arenaBattleCount = await dbQuery('SELECT COUNT(*) as count FROM arena_battles');
    res.json({ totalPlayers: parseInt(accountCount.rows[0]?.count || 0), totalHeroes: parseInt(charCount.rows[0]?.count || 0), arenaTeams: parseInt(arenaTeamCount.rows[0]?.count || 0), arenaBattles: parseInt(arenaBattleCount.rows[0]?.count || 0), serverTime: Date.now() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/public/sync', requireSession, async (req, res) => {
  try {
    let account;
    if (req.session.discordId) {
      const r = await dbQuery('SELECT * FROM accounts WHERE discord_id = $1', [req.session.discordId]);
      account = r.rows[0];
    } else if (req.session.accountId) {
      const r = await dbQuery('SELECT * FROM accounts WHERE id = $1', [req.session.accountId]);
      account = r.rows[0];
    }
    if (!account) return res.json({ found: false });
    const charsResult = await dbQuery('SELECT * FROM characters WHERE account_id = $1 ORDER BY slot_index', [account.id]);
    const heroes = [];
    for (const c of charsResult.rows) {
      const invResult = await dbQuery('SELECT * FROM inventory_items WHERE character_id = $1', [c.id]);
      heroes.push({ name: c.name, raceId: c.race_id, classId: c.class_id, level: c.level, experience: c.experience, attributePoints: c.attribute_points || {}, abilities: c.abilities || [], skillTree: c.skill_tree || {}, currentHealth: c.current_health, currentMana: c.current_mana, currentStamina: c.current_stamina, isActive: c.is_active, inventory: invResult.rows.map(i => ({ itemKey: i.item_key, itemType: i.item_type, tier: i.tier, slot: i.slot, stats: i.stats || {}, equipped: i.equipped, quantity: i.quantity })) });
    }
    const islandResult = await dbQuery('SELECT * FROM islands WHERE account_id = $1 LIMIT 1', [account.id]);
    const island = islandResult.rows[0] ? { name: islandResult.rows[0].name, zoneData: islandResult.rows[0].zone_data || {}, conquerProgress: islandResult.rows[0].conquer_progress || {}, questProgress: islandResult.rows[0].quest_progress || {}, unlockedLocations: islandResult.rows[0].unlocked_locations || [] } : null;
    res.json({ found: true, account: { id: account.id, discordId: account.discord_id, username: account.username, gold: account.gold, resources: account.resources, premium: account.premium }, heroes, island });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DB Admin Routes ──────────────────────────────────────────────────────────
app.get('/api/db/status', requireAuth, async (req, res) => {
  try {
    const result = await dbQuery('SELECT NOW() as time');
    const tables = await dbQuery(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    res.json({ connected: true, time: result.rows[0].time, tables: tables.rows.map(r => r.table_name) });
  } catch (err) { res.status(500).json({ connected: false, error: err.message }); }
});

app.post('/api/db/accounts', requireAuth, async (req, res) => {
  try {
    const { discord_id, username, email, avatar_url } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });
    const result = await dbQuery(
      `INSERT INTO accounts (discord_id, username, email, avatar_url) VALUES ($1,$2,$3,$4) ON CONFLICT (discord_id) DO UPDATE SET username=EXCLUDED.username, email=EXCLUDED.email, avatar_url=EXCLUDED.avatar_url, updated_at=NOW(), last_login=NOW() RETURNING *`,
      [discord_id, username, email, avatar_url]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/db/accounts', requireAuth, async (req, res) => {
  try {
    const { discord_id, id } = req.query;
    if (discord_id) { const r = await dbQuery('SELECT * FROM accounts WHERE discord_id = $1', [discord_id]); return res.json(r.rows[0] || null); }
    if (id) { const r = await dbQuery('SELECT * FROM accounts WHERE id = $1', [parseInt(id)]); return res.json(r.rows[0] || null); }
    const r = await dbQuery('SELECT * FROM accounts ORDER BY created_at DESC LIMIT 100');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/db/accounts/:id', requireAuth, async (req, res) => {
  try {
    const { gold, resources, premium, username } = req.body;
    const sets = []; const vals = []; let idx = 1;
    if (gold !== undefined) { sets.push(`gold = $${idx++}`); vals.push(gold); }
    if (resources !== undefined) { sets.push(`resources = $${idx++}`); vals.push(resources); }
    if (premium !== undefined) { sets.push(`premium = $${idx++}`); vals.push(premium); }
    if (username !== undefined) { sets.push(`username = $${idx++}`); vals.push(username); }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
    sets.push('updated_at = NOW()'); vals.push(parseInt(req.params.id));
    const r = await dbQuery(`UPDATE accounts SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    res.json(r.rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/db/characters', requireAuth, async (req, res) => {
  try {
    const { account_id, name, race_id, class_id, level, attribute_points, abilities, skill_tree } = req.body;
    if (!account_id || !name || !race_id || !class_id) return res.status(400).json({ error: 'account_id, name, race_id, class_id required' });
    const r = await dbQuery(`INSERT INTO characters (account_id, name, race_id, class_id, level, attribute_points, abilities, skill_tree) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [account_id, name, race_id, class_id, level || 1, JSON.stringify(attribute_points || {}), JSON.stringify(abilities || []), JSON.stringify(skill_tree || {})]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/db/characters', requireAuth, async (req, res) => {
  try {
    const { account_id, id } = req.query;
    if (id) { const r = await dbQuery('SELECT * FROM characters WHERE id = $1', [parseInt(id)]); return res.json(r.rows[0] || null); }
    if (account_id) { const r = await dbQuery('SELECT * FROM characters WHERE account_id = $1 ORDER BY slot_index', [parseInt(account_id)]); return res.json(r.rows); }
    const r = await dbQuery('SELECT * FROM characters ORDER BY created_at DESC LIMIT 100');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/db/characters/:id', requireAuth, async (req, res) => {
  try {
    const fields = ['name','level','experience','attribute_points','abilities','skill_tree','status_effects','current_health','current_mana','current_stamina','is_active','slot_index'];
    const jsonFields = ['attribute_points','abilities','skill_tree','status_effects'];
    const sets = []; const vals = []; let idx = 1;
    for (const f of fields) { if (req.body[f] !== undefined) { sets.push(`${f} = $${idx++}`); vals.push(jsonFields.includes(f) ? JSON.stringify(req.body[f]) : req.body[f]); } }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
    sets.push('updated_at = NOW()'); vals.push(parseInt(req.params.id));
    const r = await dbQuery(`UPDATE characters SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    res.json(r.rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/db/characters/:id', requireAuth, async (req, res) => {
  try { await dbQuery('DELETE FROM characters WHERE id = $1', [parseInt(req.params.id)]); res.json({ deleted: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/db/inventory', requireAuth, async (req, res) => {
  try {
    const { character_id, item_key, item_type, tier, slot, stats, equipped, quantity } = req.body;
    if (!character_id || !item_key || !item_type) return res.status(400).json({ error: 'character_id, item_key, item_type required' });
    const r = await dbQuery(`INSERT INTO inventory_items (character_id, item_key, item_type, tier, slot, stats, equipped, quantity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [character_id, item_key, item_type, tier || 1, slot, JSON.stringify(stats || {}), equipped || false, quantity || 1]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/db/inventory', requireAuth, async (req, res) => {
  try {
    const { character_id } = req.query;
    if (!character_id) return res.status(400).json({ error: 'character_id required' });
    const r = await dbQuery('SELECT * FROM inventory_items WHERE character_id = $1 ORDER BY created_at', [parseInt(character_id)]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/db/inventory/:id', requireAuth, async (req, res) => {
  try {
    const fields = ['equipped','quantity','stats','tier','slot']; const jsonFields = ['stats'];
    const sets = []; const vals = []; let idx = 1;
    for (const f of fields) { if (req.body[f] !== undefined) { sets.push(`${f} = $${idx++}`); vals.push(jsonFields.includes(f) ? JSON.stringify(req.body[f]) : req.body[f]); } }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
    vals.push(parseInt(req.params.id));
    const r = await dbQuery(`UPDATE inventory_items SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    res.json(r.rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/db/inventory/:id', requireAuth, async (req, res) => {
  try { await dbQuery('DELETE FROM inventory_items WHERE id = $1', [parseInt(req.params.id)]); res.json({ deleted: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/db/crafted', requireAuth, async (req, res) => {
  try {
    const { character_id, item_key, item_type, tier, base_item_key, enchantments, stats } = req.body;
    if (!character_id || !item_key || !item_type) return res.status(400).json({ error: 'character_id, item_key, item_type required' });
    const r = await dbQuery(`INSERT INTO crafted_items (character_id, item_key, item_type, tier, base_item_key, enchantments, stats) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [character_id, item_key, item_type, tier || 1, base_item_key, JSON.stringify(enchantments || []), JSON.stringify(stats || {})]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/db/crafted', requireAuth, async (req, res) => {
  try {
    const { character_id } = req.query;
    if (!character_id) return res.status(400).json({ error: 'character_id required' });
    const r = await dbQuery('SELECT * FROM crafted_items WHERE character_id = $1 ORDER BY created_at', [parseInt(character_id)]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/db/crafted/:id', requireAuth, async (req, res) => {
  try { await dbQuery('DELETE FROM crafted_items WHERE id = $1', [parseInt(req.params.id)]); res.json({ deleted: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/db/islands', requireAuth, async (req, res) => {
  try {
    const { account_id, name, zone_data, conquer_progress, quest_progress, unlocked_locations, harvest_state } = req.body;
    if (!account_id || !name) return res.status(400).json({ error: 'account_id, name required' });
    const r = await dbQuery(`INSERT INTO islands (account_id, name, zone_data, conquer_progress, quest_progress, unlocked_locations, harvest_state) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [account_id, name, JSON.stringify(zone_data || {}), JSON.stringify(conquer_progress || {}), JSON.stringify(quest_progress || {}), JSON.stringify(unlocked_locations || []), JSON.stringify(harvest_state || {})]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/db/islands', requireAuth, async (req, res) => {
  try {
    const { account_id, id } = req.query;
    if (id) { const r = await dbQuery('SELECT * FROM islands WHERE id = $1', [parseInt(id)]); return res.json(r.rows[0] || null); }
    if (account_id) { const r = await dbQuery('SELECT * FROM islands WHERE account_id = $1 ORDER BY created_at', [parseInt(account_id)]); return res.json(r.rows); }
    const r = await dbQuery('SELECT * FROM islands ORDER BY created_at DESC LIMIT 100');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/db/islands/:id', requireAuth, async (req, res) => {
  try {
    const fields = ['name','zone_data','conquer_progress','quest_progress','unlocked_locations','harvest_state'];
    const jsonFields = ['zone_data','conquer_progress','quest_progress','unlocked_locations','harvest_state'];
    const sets = []; const vals = []; let idx = 1;
    for (const f of fields) { if (req.body[f] !== undefined) { sets.push(`${f} = $${idx++}`); vals.push(jsonFields.includes(f) ? JSON.stringify(req.body[f]) : req.body[f]); } }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
    sets.push('updated_at = NOW()'); vals.push(parseInt(req.params.id));
    const r = await dbQuery(`UPDATE islands SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    res.json(r.rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Save/Load Game ───────────────────────────────────────────────────────────
app.post('/api/db/save-game', requireAuth, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { discord_id, username, email, avatar_url, gold, resources, heroes, island } = req.body;
    if (!discord_id || !username) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'discord_id, username required' }); }
    const accountResult = await client.query(
      `INSERT INTO accounts (discord_id, username, email, avatar_url, gold, resources) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (discord_id) DO UPDATE SET username=EXCLUDED.username, email=EXCLUDED.email, avatar_url=EXCLUDED.avatar_url, gold=EXCLUDED.gold, resources=EXCLUDED.resources, updated_at=NOW(), last_login=NOW() RETURNING *`,
      [discord_id, username, email, avatar_url, gold || 0, resources || 0]
    );
    const account = accountResult.rows[0];

    if (heroes && Array.isArray(heroes)) {
      await client.query('DELETE FROM characters WHERE account_id = $1', [account.id]);
      for (let i = 0; i < heroes.length; i++) {
        const h = heroes[i];
        const charResult = await client.query(`INSERT INTO characters (account_id, name, race_id, class_id, level, experience, attribute_points, abilities, skill_tree, status_effects, current_health, current_mana, current_stamina, is_active, slot_index) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
          [account.id, h.name, h.raceId || h.race_id, h.classId || h.class_id, h.level || 1, h.experience || 0, JSON.stringify(h.attributePoints || h.attribute_points || {}), JSON.stringify(h.abilities || []), JSON.stringify(h.skillTree || h.skill_tree || {}), JSON.stringify(h.statusEffects || h.status_effects || []), h.currentHealth ?? h.current_health ?? null, h.currentMana ?? h.current_mana ?? null, h.currentStamina ?? h.current_stamina ?? null, h.isActive !== undefined ? h.isActive : true, i]);
        const charId = charResult.rows[0].id;
        if (h.inventory && Array.isArray(h.inventory)) {
          for (const item of h.inventory) { await client.query(`INSERT INTO inventory_items (character_id, item_key, item_type, tier, slot, stats, equipped, quantity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [charId, item.itemKey || item.item_key, item.itemType || item.item_type || 'equipment', item.tier || 1, item.slot, JSON.stringify(item.stats || {}), item.equipped || false, item.quantity || 1]); }
        }
        if (h.craftedItems && Array.isArray(h.craftedItems)) {
          for (const ci of h.craftedItems) { await client.query(`INSERT INTO crafted_items (character_id, item_key, item_type, tier, base_item_key, enchantments, stats) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [charId, ci.itemKey || ci.item_key, ci.itemType || ci.item_type || 'crafted', ci.tier || 1, ci.baseItemKey || ci.base_item_key || null, JSON.stringify(ci.enchantments || []), JSON.stringify(ci.stats || {})]); }
        }
      }
    }
    if (island) {
      await client.query('DELETE FROM islands WHERE account_id = $1', [account.id]);
      await client.query(`INSERT INTO islands (account_id, name, zone_data, conquer_progress, quest_progress, unlocked_locations, harvest_state) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [account.id, island.name || 'Main Island', JSON.stringify(island.zoneData || island.zone_data || {}), JSON.stringify(island.conquerProgress || island.conquer_progress || {}), JSON.stringify(island.questProgress || island.quest_progress || {}), JSON.stringify(island.unlockedLocations || island.unlocked_locations || []), JSON.stringify(island.harvestState || island.harvest_state || {})]);
    }
    await client.query('COMMIT');
    res.json({ success: true, account_id: account.id });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); } finally { client.release(); }
});

app.get('/api/db/load-game', requireAuth, async (req, res) => {
  try {
    const { discord_id } = req.query;
    if (!discord_id) return res.status(400).json({ error: 'discord_id required' });
    const accountResult = await dbQuery('SELECT * FROM accounts WHERE discord_id = $1', [discord_id]);
    if (!accountResult.rows[0]) return res.json({ found: false });
    const account = accountResult.rows[0];
    const charsResult = await dbQuery('SELECT * FROM characters WHERE account_id = $1 ORDER BY slot_index', [account.id]);
    const heroes = [];
    for (const c of charsResult.rows) {
      const invResult = await dbQuery('SELECT * FROM inventory_items WHERE character_id = $1', [c.id]);
      const craftResult = await dbQuery('SELECT * FROM crafted_items WHERE character_id = $1', [c.id]);
      heroes.push({ id: c.id, accountId: c.account_id, name: c.name, raceId: c.race_id, classId: c.class_id, level: c.level, experience: c.experience, attributePoints: c.attribute_points || {}, abilities: c.abilities || [], skillTree: c.skill_tree || {}, statusEffects: c.status_effects || [], currentHealth: c.current_health, currentMana: c.current_mana, currentStamina: c.current_stamina, isActive: c.is_active, slotIndex: c.slot_index, inventory: invResult.rows.map(i => ({ id: i.id, characterId: i.character_id, itemKey: i.item_key, itemType: i.item_type, tier: i.tier, slot: i.slot, stats: i.stats || {}, equipped: i.equipped, quantity: i.quantity })), craftedItems: craftResult.rows.map(ci => ({ id: ci.id, characterId: ci.character_id, itemKey: ci.item_key, itemType: ci.item_type, tier: ci.tier, baseItemKey: ci.base_item_key, enchantments: ci.enchantments || [], stats: ci.stats || {} })) });
    }
    const islandResult = await dbQuery('SELECT * FROM islands WHERE account_id = $1 LIMIT 1', [account.id]);
    const island = islandResult.rows[0] ? { id: islandResult.rows[0].id, accountId: islandResult.rows[0].account_id, name: islandResult.rows[0].name, zoneData: islandResult.rows[0].zone_data || {}, conquerProgress: islandResult.rows[0].conquer_progress || {}, questProgress: islandResult.rows[0].quest_progress || {}, unlockedLocations: islandResult.rows[0].unlocked_locations || [], harvestState: islandResult.rows[0].harvest_state || {} } : null;
    res.json({ found: true, account: { id: account.id, discordId: account.discord_id, username: account.username, email: account.email, avatarUrl: account.avatar_url, gold: account.gold, resources: account.resources, premium: account.premium, lastLogin: account.last_login }, heroes, island });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Wallet ───────────────────────────────────────────────────────────────────
app.post('/api/wallet/create', requireSession, async (req, res) => {
  try {
    const CROSSMINT_SERVER_KEY = process.env.CROSSMINT_SERVER_API_KEY;
    let account;
    if (req.session.discordId) { const r = await dbQuery('SELECT * FROM accounts WHERE discord_id = $1', [req.session.discordId]); account = r.rows[0]; }
    else if (req.session.accountId) { const r = await dbQuery('SELECT * FROM accounts WHERE id = $1', [req.session.accountId]); account = r.rows[0]; }
    if (!account) return res.status(404).json({ error: 'Account not found' });
    if (account.wallet_address) return res.json({ exists: true, wallet: { address: account.wallet_address, chain: account.wallet_chain || 'solana' } });
    if (!CROSSMINT_SERVER_KEY) return res.status(500).json({ error: 'Wallet service not configured' });
    const walletRes = await fetch('https://www.crossmint.com/api/v1-alpha2/wallets', { method: 'POST', headers: { 'X-API-KEY': CROSSMINT_SERVER_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ linkedUser: `userId:${account.discord_id || account.id}`, chain: 'solana' }) });
    const walletData = await walletRes.json();
    const address = walletData.address || walletData.publicKey;
    if (!address) return res.status(500).json({ error: 'Wallet created but no address returned' });
    await dbQuery('UPDATE accounts SET wallet_address=$1, wallet_chain=$2, wallet_created_at=NOW() WHERE id=$3', [address, 'solana', account.id]);
    res.json({ exists: false, created: true, wallet: { address, chain: 'solana' } });
  } catch (err) { res.status(500).json({ error: 'Failed to create wallet' }); }
});

app.get('/api/wallet/status', requireSession, async (req, res) => {
  try {
    let account;
    if (req.session.discordId) { const r = await dbQuery('SELECT wallet_address, wallet_chain, wallet_created_at FROM accounts WHERE discord_id = $1', [req.session.discordId]); account = r.rows[0]; }
    else if (req.session.accountId) { const r = await dbQuery('SELECT wallet_address, wallet_chain, wallet_created_at FROM accounts WHERE id = $1', [req.session.accountId]); account = r.rows[0]; }
    if (!account) return res.status(404).json({ error: 'Account not found' });
    if (account.wallet_address) res.json({ hasWallet: true, wallet: { address: account.wallet_address, chain: account.wallet_chain || 'solana', createdAt: account.wallet_created_at } });
    else res.json({ hasWallet: false });
  } catch (err) { res.status(500).json({ error: 'Failed to check wallet status' }); }
});

app.get('/api/wallet/all', requireAdmin, async (req, res) => {
  try {
    const r = await dbQuery(`SELECT discord_id, username, wallet_address, wallet_chain, wallet_created_at FROM accounts WHERE wallet_address IS NOT NULL ORDER BY wallet_created_at DESC`);
    res.json({ count: r.rows.length, wallets: r.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to list wallets' }); }
});

// ── Discord Invite ───────────────────────────────────────────────────────────
app.get('/api/discord/invite', async (req, res) => {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN || process.env.GAME_API_GRUDA;
    const BETA_CHANNEL_ID = '1381760000946470987';
    if (!botToken) throw new Error('Bot token not configured');
    const inviteRes = await fetch(`https://discord.com/api/v10/channels/${BETA_CHANNEL_ID}/invites`, { method: 'POST', headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ max_age: 86400, max_uses: 1, unique: true }) });
    if (!inviteRes.ok) throw new Error('Invite creation failed');
    const invite = await inviteRes.json();
    res.json({ invite: `https://discord.gg/${invite.code}` });
  } catch (err) { res.status(500).json({ error: 'Could not create invite' }); }
});

export default app;
