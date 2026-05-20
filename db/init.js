const { Pool } = require('pg');

// Use DATABASE_URL from Supabase (set in .env or Render env vars)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

console.log('[DB] Connecting to PostgreSQL (Supabase)...');

async function getDb() {
  try {
    const client = await pool.connect();
    console.log('[DB] ✅ Connected to Supabase PostgreSQL');
    client.release();
    await initTables();
    return pool;
  } catch (err) {
    console.error('[DB] ❌ Connection failed:', err.message);
    throw err;
  }
}

async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reset_token TEXT,
      reset_expires TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      razorpay_signature TEXT,
      amount INTEGER DEFAULT 99900,
      status TEXT DEFAULT 'created',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, course_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS answers (
      id SERIAL PRIMARY KEY,
      question_id INTEGER NOT NULL,
      answer TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      author_name TEXT DEFAULT 'Student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);
  console.log('[DB] ✅ Tables ready');
}

// Helper: run a query that returns all rows
async function all(sql, params = []) {
  // Convert SQLite ? placeholders to PostgreSQL $1, $2, ...
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  const result = await pool.query(pgSql, params);
  return result.rows;
}

// Helper: get a single row
async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run insert/update/delete — returns lastInsertRowid
async function run(sql, params = []) {
  let i = 0;
  let pgSql = sql.replace(/\?/g, () => `$${++i}`);

  // For INSERT, append RETURNING id so we can get lastInsertRowid
  if (pgSql.trim().toUpperCase().startsWith('INSERT')) {
    pgSql += ' RETURNING id';
  }

  // Fix SQLite-specific datetime() calls → NOW()
  pgSql = pgSql.replace(/datetime\("now"\)/gi, 'NOW()');
  pgSql = pgSql.replace(/datetime\('now'\)/gi, 'NOW()');

  const result = await pool.query(pgSql, params);
  const lastInsertRowid = result.rows && result.rows[0] ? result.rows[0].id : 0;
  return { lastInsertRowid };
}

module.exports = { getDb, all, get, run, pool };
