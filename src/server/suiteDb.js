/**
 * Suite Database Connection
 * Connects to the Warlord-Crafting-Suite Neon PostgreSQL database.
 * Used for crafting, inventory, resources, and account linking.
 * Separate from the local GRUDGE_ACCOUNT_DB game-state pool.
 */
import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

let pool = null;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('[SuiteDB] Unexpected pool error:', err.message);
  });
} else {
  console.warn('[SuiteDB] DATABASE_URL not set — suite integration disabled');
}

export function isConnected() {
  return pool !== null;
}

export async function suiteQuery(text, params) {
  if (!pool) throw new Error('Suite DB not configured (DATABASE_URL missing)');
  const result = await pool.query(text, params);
  return result;
}

export async function getSuiteClient() {
  if (!pool) throw new Error('Suite DB not configured (DATABASE_URL missing)');
  return pool.connect();
}

export async function testSuiteConnection() {
  if (!pool) {
    console.warn('[SuiteDB] Skipping connection test — DATABASE_URL not set');
    return false;
  }
  try {
    const res = await pool.query('SELECT NOW() as time');
    console.log('[SuiteDB] Connected to suite DB at:', res.rows[0].time);
    return true;
  } catch (err) {
    console.error('[SuiteDB] Connection failed:', err.message);
    return false;
  }
}

export default pool;
