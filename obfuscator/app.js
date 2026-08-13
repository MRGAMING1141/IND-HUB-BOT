const $ = id => document.getElementById(id);

async function copyText(value, message) {
  if (!value) return;
  try { await navigator.clipboard.writeText(value); }
  catch {
    const a = document.createElement('textarea'); a.value = value;
    document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove();
  }
  $('status').textContent = message;
}

async function loadFile(file) {
  if (!file) return;
  const name = file.name.toLowerCase();
  if (!name.endsWith('.lua') && !name.endsWith('.luau')) {
    $('status').textContent = 'Please choose a .lua or .luau file.'; return;
  }
  if (file.size > 5 * 1024 * 1024) {
    $('status').textContent = 'File is too large (5 MB maximum).'; return;
  }
  try {
    $('source').value = await file.text();
    $('fileInfo').textContent = `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;
    $('status').textContent = `Loaded ${file.name} locally.`;
  } catch (e) { $('status').textContent = `Could not read file: ${e.message || e}`; }
}

$('chooseFile').onclick = () => $('luaFile').click();
$('luaFile').addEventListener('change', e => loadFile(e.target.files?.[0]));
const dz = $('dropZone');
['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('dragover'); }));
['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('dragover'); }));
dz.addEventListener('drop', e => loadFile(e.dataTransfer.files?.[0]));
dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('luaFile').click(); } });

$('copyLoader').onclick = () => copyText($('loader').value, 'Loadstring copied.');
$('copyUrl').onclick = () => copyText($('rubisUrl').value, 'Pastefy URL copied.');

$('upload').onclick = async () => {
  const source = $('source').value;
  if (!source.trim()) { $('status').textContent = 'Paste or choose a Lua/Luau script first.'; return; }

  $('upload').disabled = true;
  $('loader').value = '';
  $('rubisUrl').value = '';
  $('status').textContent = 'Creating a new Pastefy paste…';

  try {
    const response = await fetch('/api/create-paste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        content: source,
        title: (($('scriptTitle').value.trim() || 'IND HUB SCRIPT').slice(0, 120))
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Server error (${response.status})`);
    if (!data.raw_url) throw new Error('Pastefy did not return a raw URL.');

    $('rubisUrl').value = data.raw_url;
    $('loader').value = `loadstring(game:HttpGet(${JSON.stringify(data.raw_url)}))()`;
    $('status').textContent = `Success ✓ New Pastefy paste created${data.id ? ` (${data.id})` : ''}.`;
  } catch (e) {
    $('status').textContent = e.message || 'Upload failed.';
  } finally { $('upload').disabled = false; }
};
