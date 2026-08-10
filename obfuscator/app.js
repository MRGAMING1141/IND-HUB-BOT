const $ = id => document.getElementById(id);

function randomName() {
  return '_IND_' + Math.random().toString(36).slice(2, 8);
}

function stripComments(source) {
  let out = '', i = 0, quote = null;
  while (i < source.length) {
    const c = source[i], n = source[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') { out += source[++i] || ''; }
      else if (c === quote) quote = null;
      i++; continue;
    }
    if (c === '"' || c === "'") { quote = c; out += c; i++; continue; }
    if (c === '-' && n === '-') {
      i += 2;
      while (i < source.length && source[i] !== '\n') i++;
      if (source[i] === '\n') out += '\n';
      continue;
    }
    out += c; i++;
  }
  return out;
}

function encodeStrings(source) {
  let out = '', i = 0;
  while (i < source.length) {
    const q = source[i];
    if (q !== '"' && q !== "'") { out += q; i++; continue; }
    let j = i + 1, value = '', closed = false;
    while (j < source.length) {
      const c = source[j];
      if (c === '\\') {
        const e = source[j + 1];
        const map = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '\\': '\\', '"': '"', "'": "'" };
        if (e in map) value += map[e]; else value += e || '';
        j += 2; continue;
      }
      if (c === q) { closed = true; break; }
      value += c; j++;
    }
    if (!closed) { out += q; i++; continue; }
    if (value.length === 0) out += '""';
    else if (value.length <= 512) out += `string.char(${Array.from(new TextEncoder().encode(value)).join(',')})`;
    else out += q + value + q;
    i = j + 1;
  }
  return out;
}

function renameLocals(source) {
  const names = new Map();
  let counter = 0;
  const reserve = new Set(['self', 'script']);
  source = source.replace(/\blocal\s+([A-Za-z_][A-Za-z0-9_]*)/g, (m, name) => {
    if (reserve.has(name)) return m;
    if (!names.has(name)) names.set(name, `_i${(++counter).toString(36)}`);
    return `local ${names.get(name)}`;
  });
  for (const [name, replacement] of names) {
    source = source.replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'g'), replacement);
  }
  return source;
}

function addJunk(source) {
  const a = Math.floor(Math.random() * 9000) + 1000;
  const b = Math.floor(Math.random() * 9000) + 1000;
  return `local _IND_${a} = (${b} - ${b})\nif _IND_${a} ~= 0 then return end\n` + source;
}

function addIntegrity(source) {
  const marker = Math.random().toString(36).slice(2, 12);
  return `local _IND_MARKER = ${JSON.stringify(marker)}\n` + source;
}

function minifySafe(source) {
  return source.split('\n').map(x => x.trim()).filter(Boolean).join('\n');
}

function transform(source, level, options) {
  let out = stripComments(source);
  if (options.rename) out = renameLocals(out);
  if (options.strings) out = encodeStrings(out);
  if (options.junk && level !== 'normal') out = addJunk(out);
  if (options.integrity && level !== 'normal') out = addIntegrity(out);
  if (level === 'extreme' || level === 'max') out = minifySafe(out);
  return `-- IND OBFUSCATOR | ${level.toUpperCase()}\n${out.trim()}\n`;
}

async function uploadPastefy(content, title, token) {
  if (!token) throw new Error('Pastefy API token is required for Auto Upload.');
  const response = await fetch('https://pastefy.app/api/v2/paste', {
    method: 'POST',
    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, visibility: 'UNLISTED', type: 'LUA' })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `Pastefy request failed (${response.status})`);
  const paste = data.paste || data;
  if (!paste.raw_url) throw new Error('Pastefy did not return a raw URL.');
  return paste.raw_url;
}

async function copyText(value, message) {
  if (!value) return;
  try { await navigator.clipboard.writeText(value); }
  catch { const area = document.createElement('textarea'); area.value = value; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); }
  $('status').textContent = message;
}

$('clearToken').onclick = () => { $('pasteToken').value = ''; $('status').textContent = 'Pastefy token cleared from this page.'; };
$('copy').onclick = () => copyText($('loader').value, 'Loader copied.');
$('copyPaste').onclick = () => copyText($('pasteUrl').value, 'Pastefy URL copied.');
$('copySource').onclick = () => copyText($('payload').value, 'Obfuscated source copied.');

$('obfuscate').onclick = async () => {
  const source = $('source').value.trim();
  if (!source) { $('status').textContent = 'Paste Luau source first.'; return; }
  const level = $('level').value;
  const options = { rename: $('rename').checked, strings: $('strings').checked, junk: $('junk').checked, integrity: $('integrity').checked };
  $('obfuscate').disabled = true;
  $('status').textContent = 'Transforming locally…';
  try {
    const transformed = transform(source, level, options);
    $('payload').value = transformed;
    $('pasteUrl').value = '';
    $('loader').value = '';
    if ($('pastefy').checked) {
      $('status').textContent = 'Uploading protected source to Pastefy…';
      const raw = await uploadPastefy(transformed, $('display').value.trim() || 'IND OBFUSCATOR', $('pasteToken').value.trim());
      $('pasteUrl').value = raw;
      $('loader').value = `-- ${($('display').value || 'IND OBFUSCATOR').replace(/\n/g, ' ')}\nloadstring(game:HttpGet(${JSON.stringify(raw)}))()`;
      $('status').textContent = 'Done — Pastefy upload and loadstring created.';
    } else {
      $('status').textContent = 'Done — local obfuscation complete. Enable Pastefy to create a short loader.';
    }
  } catch (e) {
    $('status').textContent = e.message || 'Obfuscation failed.';
  } finally { $('obfuscate').disabled = false; }
};