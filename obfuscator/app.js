const $=id=>document.getElementById(id);

function normalizeText(s){return String(s??'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n')}

async function request(url,options,stage){
  try{return await fetch(url,options)}
  catch(e){throw new Error(`${stage} failed: ${e?.message||e}. Browser CORS/network restrictions can block GitHub Pages requests.`)}
}

async function uploadRubis(content){
  const title=(($('scriptTitle')&&$('scriptTitle').value.trim())||'IND HUB SCRIPT').slice(0,120);
  const res=await request('https://api.rubis.app/v2/scrap',{
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({content,title,public:true})
  },'Rubiš upload');

  const text=await res.text();
  let data={};
  try{data=JSON.parse(text)}catch{}

  if(!res.ok)throw new Error(`Rubiš upload rejected (${res.status}): ${data.message||data.error||text.slice(0,600)||'Unknown API error'}`);
  if(data.success===false)throw new Error(`Rubiš upload rejected: ${data.message||data.error||text.slice(0,600)||'Unknown API error'}`);

  const id=data.scrapID||data.scrapId||data.id||data.data?.scrapID||data.data?.scrapId||data.data?.id;
  const raw=data.raw||data.raw_url||data.rawUrl||data.data?.raw||data.data?.raw_url||data.data?.rawUrl;
  const rawWithKey=data.raw_with_key||data.rawWithKey||data.data?.raw_with_key||data.data?.rawWithKey;

  // Never invent a URL. Use exactly what Rubiš returned.
  const url=raw||rawWithKey;
  if(!id)throw new Error(`Rubiš accepted the upload but returned no scrap ID. No loader was generated. API response: ${text.slice(0,900)}`);
  if(!url)throw new Error(`Rubiš created scrap ${id}, but returned no raw URL. No loader was generated.`);

  return{raw:url,id,public:data.public===true,title,response:data};
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
  try{await navigator.clipboard.writeText(value)}
  catch{const a=document.createElement('textarea');a.value=value;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}
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
  $('status').textContent='Creating a NEW Rubiš scrap…';

  try{
    const result=await uploadRubis(source);

    // The URL below is the exact URL returned by Rubiš.
    // We intentionally do not construct a URL from the ID.
    $('rubisUrl').value=result.raw;
    $('loader').value=`loadstring(game:HttpGet(${JSON.stringify(result.raw)}))()`;
    $('status').textContent=`Success ✓ Rubiš created ${result.id}. The loadstring uses Rubiš's exact returned raw URL.`;
  }catch(e){
    $('status').textContent=e.message||'Upload failed.';
  }finally{$('upload').disabled=false}
};