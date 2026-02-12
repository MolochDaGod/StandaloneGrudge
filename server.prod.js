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

const arenaTeams = new Map();
const arenaBattles = [];
const challengeNonces = new Map();
let arenaSeq = 0;

function generateArenaUuid(prefix = 'TEAM') {
  const now = Date.now();
  const ts = now.toString(36).toUpperCase();
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

app.post('/api/arena/submit', (req, res) => {
  try {
    const { ownerId, ownerName, heroes, shareToken } = req.body;
    if (!ownerId || !heroes || !Array.isArray(heroes) || heroes.length === 0 || heroes.length > 3) {
      return res.status(400).json({ error: 'Valid ownerId and 1-3 heroes required' });
    }
    for (const h of heroes) {
      if (!h.name || !h.raceId || !h.classId) {
        return res.status(400).json({ error: 'Hero missing name/race/class' });
      }
    }
    for (const [id, team] of arenaTeams) {
      if (team.ownerId === ownerId && team.status === 'ranked') {
        team.status = 'unranked';
        team.demotedAt = Date.now();
        team.demoteReason = 'replaced';
      }
    }
    const teamId = generateArenaUuid('TEAM');
    const snapshotJson = JSON.stringify(heroes);
    const snapshotHash = computeSha256Hex(snapshotJson);
    const team = {
      teamId, ownerId, ownerName: ownerName || 'Unknown Warlord', status: 'ranked',
      heroes, heroCount: heroes.length, shareToken: shareToken || null, snapshotHash,
      wins: 0, losses: 0, totalBattles: 0, rewards: { gold: 0, resources: 0, equipment: [] },
      createdAt: Date.now(), demotedAt: null, demoteReason: null,
      avgLevel: Math.round(heroes.reduce((s, h) => s + (h.level || 1), 0) / heroes.length),
    };
    arenaTeams.set(teamId, team);
    res.json({ success: true, teamId, snapshotHash, status: 'ranked', message: 'Team submitted to Ranked Arena!' });
  } catch (err) {
    console.error('Arena submit error:', err);
    res.status(500).json({ error: 'Failed to submit team' });
  }
});

app.get('/api/arena/lobby', (req, res) => {
  const { status, page, limit: lim } = req.query;
  const pageNum = Math.max(0, parseInt(page) || 0);
  const pageSize = Math.min(50, Math.max(1, parseInt(lim) || 20));
  let teams = Array.from(arenaTeams.values());
  if (status === 'ranked' || status === 'unranked') teams = teams.filter(t => t.status === status);
  teams.sort((a, b) => {
    if (a.status === 'ranked' && b.status !== 'ranked') return -1;
    if (b.status === 'ranked' && a.status !== 'ranked') return 1;
    return b.wins - a.wins || a.losses - b.losses || b.createdAt - a.createdAt;
  });
  const total = teams.length;
  const paged = teams.slice(pageNum * pageSize, (pageNum + 1) * pageSize);
  const safe = paged.map(t => ({
    teamId: t.teamId, ownerName: t.ownerName, status: t.status, heroCount: t.heroCount,
    avgLevel: t.avgLevel, wins: t.wins, losses: t.losses, totalBattles: t.totalBattles,
    createdAt: t.createdAt,
    heroSummary: t.heroes.map(h => ({ name: h.name, raceId: h.raceId, classId: h.classId, level: h.level || 1 })),
  }));
  res.json({ teams: safe, total, page: pageNum, pageSize, totalPages: Math.ceil(total / pageSize) });
});

app.get('/api/arena/team/:teamId', (req, res) => {
  const team = arenaTeams.get(req.params.teamId);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  const nonce = crypto.randomBytes(16).toString('hex');
  challengeNonces.set(nonce, { teamId: team.teamId, createdAt: Date.now() });
  if (challengeNonces.size > 1000) {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [k, v] of challengeNonces) { if (v.createdAt < cutoff) challengeNonces.delete(k); }
  }
  res.json({
    teamId: team.teamId, ownerId: team.ownerId, ownerName: team.ownerName, status: team.status,
    heroes: team.heroes, snapshotHash: team.snapshotHash, wins: team.wins, losses: team.losses,
    totalBattles: team.totalBattles, rewards: team.rewards, createdAt: team.createdAt, avgLevel: team.avgLevel,
    challengeNonce: nonce,
  });
});

app.post('/api/arena/battle/result', (req, res) => {
  try {
    const { teamId, challengerName, result, challengeNonce } = req.body;
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
    const team = arenaTeams.get(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const battleId = generateArenaUuid('BTLE');
    arenaBattles.push({ battleId, teamId, challengerName: challengerName || 'Arena Challenger', result, timestamp: Date.now() });
    if (arenaBattles.length > 500) arenaBattles.splice(0, arenaBattles.length - 500);
    team.totalBattles++;
    let rewardData = null;
    if (result === 'team_won') {
      team.wins++;
      if (team.status === 'ranked') {
        const goldReward = 50 + team.avgLevel * 10 + team.wins * 5;
        const resourceReward = 10 + team.avgLevel * 2;
        team.rewards.gold += goldReward;
        team.rewards.resources += resourceReward;
        if (team.wins % 5 === 0) {
          const eqTier = Math.min(8, Math.max(1, Math.ceil(team.avgLevel / 3)));
          const equipReward = { type: 'equipment', tier: eqTier, wonAt: Date.now() };
          team.rewards.equipment.push(equipReward);
          rewardData = { gold: goldReward, resources: resourceReward, equipment: equipReward };
        } else {
          rewardData = { gold: goldReward, resources: resourceReward };
        }
      }
    } else if (result === 'team_lost') {
      team.losses++;
      if (team.status === 'ranked' && team.losses >= 3) {
        team.status = 'unranked';
        team.demotedAt = Date.now();
        team.demoteReason = 'losses';
      }
    }
    res.json({
      success: true, battleId, teamStatus: team.status, wins: team.wins, losses: team.losses,
      demoted: team.status === 'unranked' && team.demoteReason === 'losses' && team.losses === 3,
      rewards: rewardData,
    });
  } catch (err) {
    console.error('Arena battle result error:', err);
    res.status(500).json({ error: 'Failed to record battle result' });
  }
});

app.get('/api/arena/rewards/:teamId', (req, res) => {
  const team = arenaTeams.get(req.params.teamId);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json({ teamId: team.teamId, ownerName: team.ownerName, status: team.status, wins: team.wins, losses: team.losses, rewards: team.rewards });
});

app.get('/api/arena/stats', (req, res) => {
  const all = Array.from(arenaTeams.values());
  res.json({
    totalTeams: all.length, rankedTeams: all.filter(t => t.status === 'ranked').length,
    unrankedTeams: all.filter(t => t.status === 'unranked').length,
    totalBattles: arenaBattles.length, recentBattles: arenaBattles.slice(-10).reverse(),
  });
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
