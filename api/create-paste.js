export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = process.env.OlgI1kNFFj6NQwyDeoGwGTivmWh6VUxzfRWgGKDdzaFEEpqYixA1n0u8dtBO;
    if (!token) return res.status(500).json({ error: 'PASTEFY_API_TOKEN is not configured.' });

    const { content, title } = req.body || {};
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Script content is required.' });
    }
    if (content.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Script is too large.' });
    }

    const response = await fetch('https://pastefy.app/api/v2/paste', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        content,
        title: String(title || 'IND HUB SCRIPT').slice(0, 120)
      })
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || data?.error || 'Pastefy rejected the request.'
      });
    }

    const rawUrl = data.raw_url || data.rawUrl || data.data?.raw_url || data.data?.rawUrl;
    if (!rawUrl) return res.status(502).json({ error: 'Pastefy returned no raw URL.' });

    return res.status(200).json({ raw_url: rawUrl, id: data.id || data.data?.id || null });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Server error.' });
  }
}
