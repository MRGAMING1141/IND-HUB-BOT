const crypto = require('crypto');
const { put, token, hasRedis } = require('./_lib/store');
const { transform } = require('./_lib/transform');
const { uploadToPastefy } = require('./_lib/pastefy');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const { source, level = 'max', display = 'IND OBFUSCATOR PROTECTED LOADER', options = {}, pastefy = true } = req.body || {};
    if (typeof source !== 'string' || !source.trim()) return json(res, 400, { error: 'Source is required' });
    if (source.length > 1500000) return json(res, 413, { error: 'Source is too large' });

    const payload = transform(source, level, options);
    const id = token();
    const secret = process.env.PAYLOAD_SECRET || 'dev-secret-change-me';
    const key = Buffer.from(secret + id);
    const data = Buffer.from(payload, 'utf8');
    for (let i = 0; i < data.length; i++) data[i] ^= key[i % key.length];

    const ttl = Math.max(60, Number(process.env.PAYLOAD_TTL_SECONDS || 86400));
    await put(id, { payload: data.toString('base64url') }, ttl);

    const publicUrl = process.env.PUBLIC_URL || `https://${req.headers.host}`;
    const loader = `-- ${String(display).replace(/[\r\n]/g, ' ').slice(0, 120)}\nloadstring(game:HttpGet("${publicUrl}/api/loader/${id}"))()`;

    let paste = null;
    if (pastefy) {
      try {
        paste = await uploadToPastefy({
          title: display,
          content: payload,
          visibility: 'UNLISTED'
        });
        if (paste.rawUrl) {
          paste.loader = `-- ${String(display).replace(/[\r\n]/g, ' ').slice(0, 120)}\nloadstring(game:HttpGet("${paste.rawUrl}"))()`;
        }
      } catch (e) {
        paste = { enabled: false, rawUrl: null, error: e.message };
      }
    }

    return json(res, 200, {
      ok: true,
      loader,
      pastefyLoader: paste?.loader || null,
      pastefy: paste || { enabled: false },
      preview: `Protected payload: ${payload.length} bytes`,
      storage: hasRedis ? 'redis' : 'memory-fallback',
      expiresIn: ttl
    });
  } catch (e) {
    return json(res, 500, { error: 'Obfuscation failed', detail: process.env.NODE_ENV === 'development' ? e.message : undefined });
  }
};
