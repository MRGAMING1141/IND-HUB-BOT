const $=id=>document.getElementById(id);

function normalizeText(s){return String(s??'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n')}

async function uploadRubis(content){
  const title=(($('scriptTitle')&&$('scriptTitle').value.trim())||'IND HUB SCRIPT').slice(0,120));
  const res=await fetch('https://api.rubis.app/v2/scrap',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({content,title,public:true})});
  const text=await res.text();
  let data={};
  try{data=JSON.parse(text)}catch{}
  if(!res.ok)throw new Error(`Rubiš upload failed (${res.status}): ${data.message||data.error||text.slice(0,400)||'Unknown API error'}`);
  if(data.success===false)throw new Error(`Rubiš upload failed: ${data.message||data.error||text.slice(0,400)||'Unknown API error'}`);
  const raw=data.raw||data.raw_url||data.rawUrl||data.data?.raw||data.data?.raw_url||data.data?.rawUrl;
  const id=data.scrapID||data.scrapId||data.id||data.data?.scrapID||data.data?.scrapId||data.data?.id;
  const url=raw||(id?`https://api.rubis.app/v2/scrap/${encodeURIComponent(id)}/raw`:null);
  if(!url)throw new Error(`Rubiš returned success but no raw URL was found. Response: ${text.slice(0,700)}`);

  // Never trust the returned URL alone: read it back and verify it contains exactly what was uploaded.
  const verifyUrl=url+(url.includes('?')?'&':'?')+'_ind_verify='+Date.now();
  const verify=await fetch(verifyUrl,{method:'GET',cache:'no-store',headers:{'Accept':'text/plain'}});
  const remote=await verify.text();
  if(!verify.ok)throw new Error(`Rubiš created scrap ${id||'(unknown)'} but its raw URL could not be read back (${verify.status}). No loader was generated.`);
  if(normalizeText(remote)!==normalizeText(content)){
    throw new Error(`Rubiš created scrap ${id||'(unknown)'}, but raw content verification FAILED. The generated URL was not accepted because its contents do not match your uploaded script.`);
  }
  return{raw:url,id};
}

async function loadFile(file){
  if(!file)return;
  const name=file.name.toLowerCase();
  if(!name.endsWith('.lua')&&!name.endsWith('.luau')){$('status').textContent='Please choose a .lua or .luau file.';return}
  if(file.size>3*1024*1024){$('status').textContent='File is too large for the Rubiš free plan (3 MB).';return}
  try{
    $('source').value=await file.text();
    $('fileInfo').textContent=`${file.name} • ${(file.size/1024).toFixed(1)} KB`;
    $('status').textContent=`Loaded ${file.name} locally.`;
  }catch(e){$('status').textContent=`Could not read file: ${e.message||e}`}
}

$('chooseFile').onclick=()=>$('luaFile').click();
$('luaFile').addEventListener('change',e=>loadFile(e.target.files?.[0]));
const dz=$('dropZone');
['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();dz.classList.add('dragover')}));
['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();dz.classList.remove('dragover')}));
dz.addEventListener('drop',e=>loadFile(e.dataTransfer.files?.[0]));
dz.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('luaFile').click()}});

async function copyText(value,message){
  if(!value)return;
  try{await navigator.clipboard.writeText(value)}catch{const a=document.createElement('textarea');a.value=value;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}
  $('status').textContent=message;
}
$('copyLoader').onclick=()=>copyText($('loader').value,'Loadstring copied.');
$('copyUrl').onclick=()=>copyText($('rubisUrl').value,'Rubiš URL copied.');

$('upload').onclick=async()=>{
  const source=$('source').value;
  if(!source.trim()){$('status').textContent='Choose a Lua/Luau file first.';return}
  $('upload').disabled=true;
  $('loader').value='';
  $('rubisUrl').value='';
  $('status').textContent='Uploading a NEW script to Rubiš…';
  try{
    const result=await uploadRubis(source);
    $('rubisUrl').value=result.raw;
    $('loader').value=`loadstring(game:HttpGet(${JSON.stringify(result.raw)}))()`;
    $('status').textContent=`Verified ✓ — NEW Rubiš scrap ${result.id} contains your uploaded data.`;
  }catch(e){$('status').textContent=e.message||'Upload failed.'}
  finally{$('upload').disabled=false}
};