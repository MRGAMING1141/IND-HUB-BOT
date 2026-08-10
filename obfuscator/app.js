const $ = id => document.getElementById(id);
const API_BASE = (window.IND_API_URL || localStorage.getItem('IND_API_URL') || '').replace(/\/$/, '');

function api(path) {
  return `${API_BASE}${path}`;
}

async function copyText(value, message) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const area = document.createElement('textarea');
    area.value = value;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  $('status').textContent = message;
}

$('obfuscate').onclick = async () => {
  const source = $('source').value.trim();
  if (!source) {
    $('status').textContent = 'Paste Luau source first.';
    return;
  }
  if (!API_BASE) {
    $('status').textContent = 'Set your Vercel API URL first.';
    $('apiBox').focus();
    return;
  }

  $('status').textContent = 'Protecting…';
  $('obfuscate').disabled = true;
  try {
    const r = await fetch(api('/api/obfuscate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        level: $('level').value,
        display: $('display').value,
        pastefy: $('pastefy').checked,
        options: {
          rename: $('rename').checked,
          strings: $('strings').checked,
          junk: $('junk').checked,
          integrity: $('integrity').checked
        }
      })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);

    $('loader').value = d.pastefyLoader || d.loader || '';
    $('payload').value = `${d.preview || 'Protected payload'}\nStorage: ${d.storage || 'server'}\nExpires: ${d.expiresIn || '?'} seconds`;
    $('pasteUrl').value = d.pastefy?.rawUrl || d.pastefy?.url || '';
    $('status').textContent = d.pastefy?.rawUrl ? 'Protected + uploaded to Pastefy.' : 'Protected successfully.';
  } catch (e) {
    $('status').textContent = e.message;
  } finally {
    $('obfuscate').disabled = false;
  }
};

$('copy').onclick = () => copyText($('loader').value, 'Loader copied.');
$('copyPaste').onclick = () => copyText($('pasteUrl').value, 'Pastefy URL copied.');

$('saveApi').onclick = () => {
  const value = $('apiBox').value.trim().replace(/\/$/, '');
  localStorage.setItem('IND_API_URL', value);
  $('status').textContent = value ? 'API URL saved.' : 'API URL cleared.';
};

$('apiBox').value = API_BASE;
