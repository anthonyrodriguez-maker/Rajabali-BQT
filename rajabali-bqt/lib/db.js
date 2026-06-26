import { Pool } from 'pg';

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
  }
  return pool;
}

export async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS store_status (
      store_name TEXT PRIMARY KEY,
      status TEXT DEFAULT 'pending',
      ops_complete BOOLEAN DEFAULT FALSE,
      plan_submitted BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS visit_logs (
      id SERIAL PRIMARY KEY,
      store_name TEXT NOT NULL,
      network TEXT NOT NULL,
      visit_date DATE NOT NULL,
      q3_week INTEGER NOT NULL,
      focus_area TEXT NOT NULL,
      coaching_notes TEXT,
      progress TEXT NOT NULL,
      logged_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS visit_tracker (
      store_name TEXT NOT NULL,
      week_number INTEGER NOT NULL,
      completed BOOLEAN DEFAULT TRUE,
      completed_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (store_name, week_number)
    );
  `);
}
