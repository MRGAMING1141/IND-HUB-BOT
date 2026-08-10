const { take } = require('../_lib/store');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('-- method not allowed');
  const id = req.query?.token;
  if (!id) return res.status(400).send('-- token required');

  try {
    const item = await take(id);
    if (!item) return res.status(404).send('-- invalid or expired token');

    const secret = process.env.PAYLOAD_SECRET || 'dev-secret-change-me';
    const key = Buffer.from(secret + id);
    const data = Buffer.from(item.payload, 'base64url');
    for (let i = 0; i < data.length; i++) data[i] ^= key[i % key.length];

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).send(data.toString('utf8'));
  } catch {
    return res.status(500).send('-- payload error');
  }
};
