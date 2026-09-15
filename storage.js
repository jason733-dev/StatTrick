import { neon } from '@neondatabase/serverless';

// Vercel's Postgres/Neon integration can name the connection string a few
// different ways depending on how it was connected — try them in order.
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

const sql = connectionString ? neon(connectionString) : null;

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS stat_trick_storage (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
}

export default async function handler(req, res) {
  if (!sql) {
    res.status(500).json({ error: 'No Postgres connection string found in environment variables (checked POSTGRES_URL, DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING)' });
    return;
  }

  const key = req.query.key;
  if (!key || typeof key !== 'string') {
    res.status(400).json({ error: 'Missing key' });
    return;
  }

  try {
    await ensureTable();

    if (req.method === 'GET') {
      const rows = await sql`SELECT value FROM stat_trick_storage WHERE key = ${key}`;
      if (rows.length === 0) {
        res.status(404).json({ error: 'not found' });
        return;
      }
      res.status(200).json({ key, value: rows[0].value });
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = req.body || {};
      if (typeof body.value !== 'string') {
        res.status(400).json({ error: 'value must be a string' });
        return;
      }
      await sql`
        INSERT INTO stat_trick_storage (key, value)
        VALUES (${key}, ${body.value})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
      res.status(200).json({ key, value: body.value });
      return;
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM stat_trick_storage WHERE key = ${key}`;
      res.status(200).json({ key });
      return;
    }

    res.setHeader('Allow', 'GET, PUT, POST, DELETE');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('storage API error', err);
    res.status(500).json({ error: err.message || 'Storage error' });
  }
}
