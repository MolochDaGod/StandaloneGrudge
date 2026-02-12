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
