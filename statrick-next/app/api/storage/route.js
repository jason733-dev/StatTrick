import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
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

export async function GET(req) {
  if (!sql) {
    return Response.json(
      { error: 'No Postgres connection string found in environment variables (checked DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING)' },
      { status: 500 }
    );
  }
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });

  try {
    await ensureTable();
    const rows = await sql`SELECT value FROM stat_trick_storage WHERE key = ${key}`;
    if (rows.length === 0) return Response.json({ error: 'not found' }, { status: 404 });
    return Response.json({ key, value: rows[0].value });
  } catch (err) {
    console.error('storage GET error', err);
    return Response.json({ error: err.message || 'Storage error' }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!sql) {
    return Response.json(
      { error: 'No Postgres connection string found in environment variables' },
      { status: 500 }
    );
  }
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof body.value !== 'string') {
    return Response.json({ error: 'value must be a string' }, { status: 400 });
  }

  try {
    await ensureTable();
    await sql`
      INSERT INTO stat_trick_storage (key, value)
      VALUES (${key}, ${body.value})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
    return Response.json({ key, value: body.value });
  } catch (err) {
    console.error('storage PUT error', err);
    return Response.json({ error: err.message || 'Storage error' }, { status: 500 });
  }
}

export async function POST(req) {
  return PUT(req);
}

export async function DELETE(req) {
  if (!sql) {
    return Response.json(
      { error: 'No Postgres connection string found in environment variables' },
      { status: 500 }
    );
  }
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });

  try {
    await ensureTable();
    await sql`DELETE FROM stat_trick_storage WHERE key = ${key}`;
    return Response.json({ key });
  } catch (err) {
    console.error('storage DELETE error', err);
    return Response.json({ error: err.message || 'Storage error' }, { status: 500 });
  }
}
