import { query } from './db.js';

const CROSSMINT_SERVER_KEY = process.env.CROSSMINT_SERVER_API_KEY;
const CROSSMINT_BASE = 'https://www.crossmint.com/api/v1-alpha2';

async function crossmintFetch(endpoint, options = {}) {
  const res = await fetch(`${CROSSMINT_BASE}${endpoint}`, {
    ...options,
    headers: {
      'X-API-KEY': CROSSMINT_SERVER_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export function registerWalletRoutes(app, requireSession) {
  app.post('/api/wallet/create', requireSession, async (req, res) => {
    try {
      const discordId = req.session.discordId;
      const account = await query('SELECT * FROM accounts WHERE discord_id = $1', [discordId]);
      if (!account.rows[0]) {
        return res.status(404).json({ error: 'Account not found' });
      }
      const acc = account.rows[0];

      if (acc.wallet_address) {
        return res.json({ 
          exists: true, 
          wallet: { address: acc.wallet_address, chain: acc.wallet_chain || 'solana' } 
        });
      }

      const walletData = await crossmintFetch('/wallets', {
        method: 'POST',
        body: JSON.stringify({
          linkedUser: `userId:${discordId}`,
          chain: 'solana',
        }),
      });

      const address = walletData.address || walletData.publicKey;
      if (!address) {
        console.error('[Wallet] No address in response:', walletData);
        return res.status(500).json({ error: 'Wallet created but no address returned' });
      }

      await query(
        'UPDATE accounts SET wallet_address = $1, wallet_chain = $2, wallet_created_at = NOW() WHERE discord_id = $3',
        [address, 'solana', discordId]
      );

      console.log(`[Wallet] Created Solana wallet for ${acc.username}: ${address}`);
      res.json({ 
        exists: false, 
        created: true, 
        wallet: { address, chain: 'solana' } 
      });
    } catch (err) {
      console.error('[Wallet] Create error:', err.message);
      res.status(500).json({ error: 'Failed to create wallet. Please try again later.' });
    }
  });

  app.get('/api/wallet/status', requireSession, async (req, res) => {
    try {
      const discordId = req.session.discordId;
      const account = await query(
        'SELECT wallet_address, wallet_chain, wallet_created_at FROM accounts WHERE discord_id = $1',
        [discordId]
      );
      if (!account.rows[0]) {
        return res.status(404).json({ error: 'Account not found' });
      }
      const acc = account.rows[0];
      if (acc.wallet_address) {
        res.json({
          hasWallet: true,
          wallet: {
            address: acc.wallet_address,
            chain: acc.wallet_chain || 'solana',
            createdAt: acc.wallet_created_at,
          },
        });
      } else {
        res.json({ hasWallet: false });
      }
    } catch (err) {
      console.error('[Wallet] Status error:', err.message);
      res.status(500).json({ error: 'Failed to check wallet status' });
    }
  });

  app.get('/api/wallet/all', async (req, res) => {
    const auth = req.headers['x-admin-token'];
    const ADMIN_TOKEN = process.env.GAME_API_GRUDA;
    if (!auth || !ADMIN_TOKEN || auth !== ADMIN_TOKEN) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
      const result = await query(
        `SELECT discord_id, username, wallet_address, wallet_chain, wallet_created_at 
         FROM accounts 
         WHERE wallet_address IS NOT NULL 
         ORDER BY wallet_created_at DESC`
      );
      res.json({
        count: result.rows.length,
        wallets: result.rows,
      });
    } catch (err) {
      console.error('[Wallet] List error:', err.message);
      res.status(500).json({ error: 'Failed to list wallets' });
    }
  });
}
