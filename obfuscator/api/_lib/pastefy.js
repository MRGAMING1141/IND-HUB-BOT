async function uploadToPastefy({ title, content, visibility = 'UNLISTED' }) {
  const token = process.env.PASTEFY_API_TOKEN;
  if (!token) return { enabled: false, rawUrl: null, reason: 'PASTEFY_API_TOKEN is not configured' };

  const response = await fetch('https://pastefy.app/api/v2/paste', {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: String(title || 'IND OBFUSCATOR').slice(0, 120),
      content,
      visibility,
      type: 'LUA'
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Pastefy returned ${response.status}`);
  }

  return {
    enabled: true,
    id: data?.paste?.id || data?.id || null,
    rawUrl: data?.paste?.raw_url || data?.raw_url || null,
    url: data?.paste?.id ? `https://pastefy.app/${data.paste.id}` : null
  };
}

module.exports = { uploadToPastefy };
