import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const key = req.query.key;
  if (!key || typeof key !== 'string') {
    res.status(400).json({ error: 'Missing key' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const value = await kv.get(key);
      if (value === null || value === undefined) {
        res.status(404).json({ error: 'not found' });
        return;
      }
      res.status(200).json({ key, value });
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = req.body || {};
      if (typeof body.value !== 'string') {
        res.status(400).json({ error: 'value must be a string' });
        return;
      }
      await kv.set(key, body.value);
      res.status(200).json({ key, value: body.value });
      return;
    }

    if (req.method === 'DELETE') {
      await kv.del(key);
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
