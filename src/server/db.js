import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.GRUDGE_ACCOUNT_DB,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

export async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

export async function getClient() {
  return pool.connect();
}

export async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        grudge_id VARCHAR(64) UNIQUE,
        discord_id VARCHAR(64) UNIQUE,
        username VARCHAR(128) NOT NULL,
        email VARCHAR(256),
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ,
        gold INTEGER DEFAULT 0,
        resources INTEGER DEFAULT 0,
        premium BOOLEAN DEFAULT FALSE
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

      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(128);
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS wallet_chain VARCHAR(32);
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS wallet_created_at TIMESTAMPTZ;
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS grudge_id VARCHAR(64) UNIQUE;
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS game_state JSONB DEFAULT NULL;
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS game_state_updated_at TIMESTAMPTZ;

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
    `);

    console.log('[DB] Tables initialized successfully');
    return true;
  } catch (err) {
    console.error('[DB] Failed to initialize tables:', err.message);
    return false;
  }
}

export async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() as time');
    console.log('[DB] Connected at:', res.rows[0].time);
    return true;
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    return false;
  }
}

export default pool;
