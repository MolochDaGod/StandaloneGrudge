import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BETA_CHANNEL_ID = '1381760000946470987';
const PORT = 5000;

const pendingStates = new Map();

function getPublicOrigin(req) {
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers['host'];
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = forwardedHost?.split(',')[0]?.trim();
  if (host && !host.includes('localhost')) {
    return `${proto}://${host}`;
  }
  const domain = process.env.REPLIT_DOMAINS;
  if (domain) return `https://${domain}`;
  return `${proto}://${host || 'localhost:5000'}`;
}

app.get('/api/discord/login', (req, res) => {
  const origin = getPublicOrigin(req);
  const redirectUri = encodeURIComponent(`${origin}/discordauth`);
  const scope = encodeURIComponent('identify email guilds.join');
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, Date.now());
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
  res.json({ url, state });
});

app.post('/api/discord/callback', async (req, res) => {
  const { code, state } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  if (state && pendingStates.has(state)) {
    pendingStates.delete(state);
  }

  for (const [k, v] of pendingStates) {
    if (Date.now() - v > 600000) pendingStates.delete(k);
  }

  try {
    const origin = getPublicOrigin(req);
    const redirectUri = `${origin}/discordauth`;

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

    let inviteLink = null;
    try {
      inviteLink = await createBetaInvite();
    } catch (inviteErr) {
      console.error('Invite creation failed:', inviteErr.message);
    }

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
      invite: inviteLink,
    });
  } catch (err) {
    console.error('Discord callback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function createBetaInvite() {
  const botToken = process.env.GAME_API_GRUDA;
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
const ADMIN_TOKEN = process.env.GAME_API_GRUDA;

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

app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache');
  },
}));

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Grudge Warlords production server running on port ${PORT}`);
});
