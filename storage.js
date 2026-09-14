import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
const COLLECTION = 'stat_trick_storage';

export default async function handler(req, res) {
  const key = req.query.key;
  if (!key || typeof key !== 'string') {
    res.status(400).json({ error: 'Missing key' });
    return;
  }

  const docRef = db.collection(COLLECTION).doc(key);

  try {
    if (req.method === 'GET') {
      const snap = await docRef.get();
      if (!snap.exists) {
        res.status(404).json({ error: 'not found' });
        return;
      }
      res.status(200).json({ key, value: snap.data().value });
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = req.body || {};
      if (typeof body.value !== 'string') {
        res.status(400).json({ error: 'value must be a string' });
        return;
      }
      await docRef.set({ value: body.value });
      res.status(200).json({ key, value: body.value });
      return;
    }

    if (req.method === 'DELETE') {
      await docRef.delete();
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
