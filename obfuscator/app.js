const $=id=>document.getElementById(id);
const DTC=`local function _IND_DTC(n,v) if not v then warn("DTC:",n) return false end return true end
local function _IND_CHECK()
 local _p=game:GetService("Players").LocalPlayer
 if not _IND_DTC("player",_p) then return false end
 local _c=_p.Character if not _IND_DTC("character",_c) then return false end
 local _h=_c:FindFirstChildOfClass("Humanoid") local _r=_c:FindFirstChild("HumanoidRootPart")
 if not _IND_DTC("humanoid",_h) or not _IND_DTC("root",_r) then return false end
 local _tests={{"health",typeof(_h.Health)=="number"},{"maxhealth",typeof(_h.MaxHealth)=="number"},{"cframe",typeof(_r.CFrame)=="CFrame"},{"position",typeof(_r.Position)=="Vector3"},{"size",typeof(_r.Size)=="Vector3"},{"color",typeof(_r.Color)=="Color3"},{"material",typeof(_r.Material)=="EnumItem"},{"transparency",typeof(_r.Transparency)=="number"},{"anchored",typeof(_r.Anchored)=="boolean"},{"collide",typeof(_r.CanCollide)=="boolean"},{"walkspeed",typeof(_h.WalkSpeed)=="number"},{"platformstand",typeof(_h.PlatformStand)=="boolean"},{"userid",typeof(_p.UserId)=="number"},{"name",typeof(_p.Name)=="string"},{"displayname",typeof(_p.DisplayName)=="string"}}
 for _,_t in ipairs(_tests) do if not _IND_DTC(_t[1],_t[2]) then return false end end
 local _q=Instance.new("Part") _q.Anchored=true _q.CanCollide=false _q.Size=Vector3.new(1,1,1) _q.Parent=workspace
 local _v=_q.Color if not _IND_DTC("partcolor",typeof(_v)=="Color3" and _v.R>=0 and _v.R<=1 and _v.G>=0 and _v.G<=1 and _v.B>=0 and _v.B<=1) then _q:Destroy() return false end
 _q:Destroy() return _IND_DTC("destroy",_q.Parent==nil)
end
if not _IND_CHECK() then return end
`;
function stripComments(s){let o='',i=0,q=null;while(i<s.length){let c=s[i],n=s[i+1];if(q){o+=c;if(c==='\\')o+=s[++i]||'';else if(c===q)q=null;i++;continue}if(c==='"'||c==="'"){q=c;o+=c;i++;continue}if(c==='-'&&n==='-'){i+=2;while(i<s.length&&s[i]!=='\n')i++;if(s[i]==='\n')o+='\n';continue}o+=c;i++}return o}
function encodeStrings(s){let o='',i=0;while(i<s.length){let q=s[i];if(q!=='"'&&q!=="'"){o+=q;i++;continue}let j=i+1,v='',ok=false;while(j<s.length){let c=s[j];if(c==='\\'){v+=c+(s[j+1]||'');j+=2;continue}if(c===q){ok=true;break}v+=c;j++}if(!ok){o+=q;i++;continue}if(v.length&&v.length<=512){o+=`string.char(${Array.from(new TextEncoder().encode(v)).join(',')})`}else o+=q+v+q;i=j+1}return o}
function renameLocals(s){const m=new Map();let n=0;s=s.replace(/\blocal\s+([A-Za-z_][A-Za-z0-9_]*)/g,(x,k)=>{if(!m.has(k))m.set(k,`_i${(++n).toString(36)}`);return`local ${m.get(k)}`});for(const[k,v]of m){const e=k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');s=s.replace(new RegExp(`\\b${e}\\b`,'g'),v)}return s}
function junk(s){const a=Math.random().toString(36).slice(2,8);return`local _IND_${a}=0\nif _IND_${a}~=0 then return end\n`+s}
function integrity(s){return`local _IND_MARKER=${JSON.stringify(Math.random().toString(36).slice(2,14))}\n`+s}
function transform(s,level,o){let out=stripComments(s);if(o.rename)out=renameLocals(out);if(o.strings)out=encodeStrings(out);if(o.junk&&level!=='normal')out=junk(out);if(o.integrity&&level!=='normal')out=integrity(out);if(o.dtc&&(level==='extreme'||level==='max'||level==='vm'))out=DTC+out;if(level==='extreme'||level==='max')out=out.split('\n').map(x=>x.trim()).filter(Boolean).join('\n');return`-- IND OBFUSCATOR | ${level.toUpperCase()}\n${out.trim()}\n`}
function vmOutput(s){if(!window.INDVM||typeof INDVM.compile!=='function')throw new Error('VM core failed to load. Refresh the page.');const p=INDVM.compile(s);return`-- IND OBFUSCATOR | VM MAX EXPERIMENTAL\n-- VM BYTECODE PACKAGE (not directly executable Luau)\n-- SOURCE HASH: ${p.sourceHash}\n-- BUILD SEED: ${p.seed}\nlocal _IND_VM={v=${p.version},seed=${p.seed},constants=${JSON.stringify(p.constants)},code=${JSON.stringify(p.code)},opcodes=${JSON.stringify(p.opcodes)}}\nreturn _IND_VM`}
async function copyText(v,msg){if(!v)return;try{await navigator.clipboard.writeText(v)}catch{const a=document.createElement('textarea');a.value=v;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}$('status').textContent=msg}
$('copySource').onclick=()=>copyText($('payload').value,'Output copied.');
$('obfuscate').onclick=()=>{const s=$('source').value.trim();if(!s){$('status').textContent='Paste Luau source first.';return}const level=$('level').value,o={rename:$('rename').checked,strings:$('strings').checked,junk:$('junk').checked,integrity:$('integrity').checked,dtc:$('dtc').checked};$('obfuscate').disabled=true;$('status').textContent='Processing…';try{$('payload').value=level==='vm'?vmOutput(s):transform(s,level,o);$('status').textContent=level==='vm'?'VM package generated. Note: prototype output is not executable Luau yet.':`Done — ${level.toUpperCase()} obfuscation complete.`}catch(e){$('status').textContent=e.message||'Obfuscation failed.'}finally{$('obfuscate').disabled=false}};