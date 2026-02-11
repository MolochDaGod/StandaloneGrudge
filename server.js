import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BETA_CHANNEL_ID = '1381760000946470987';
const PORT = 3001;

const pendingStates = new Map();

function getPublicOrigin(req) {
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers['host'];
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = forwardedHost?.split(',')[0]?.trim();
  if (host && !host.includes('localhost')) {
    return `${proto}://${host}`;
  }
  const domain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS;
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Discord API server running on port ${PORT}`);
});
