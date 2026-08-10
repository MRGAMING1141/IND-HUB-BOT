/* IND OBFUSCATOR VM MAX - browser-safe prototype
 * This is a source-to-bytecode VM layer, not a promise of unbreakable protection.
 */
(function(global){
  'use strict';
  const OPCODES = Object.freeze({CONST:11, SET:23, GET:37, ADD:41, SUB:53, MUL:67, DIV:79, CONCAT:83, JMP:97, JZ:101, CALL:113, RETURN:127, POP:131});
  const reverse = Object.fromEntries(Object.entries(OPCODES).map(([k,v])=>[v,k]));
  function seed(){let x=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;};}
  function permute(seedFn){const a=Object.values(OPCODES).slice();for(let i=a.length-1;i>0;i--){const j=seedFn()%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
  function tokenize(src){return src.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|==|~=|<=|>=|\.\.|[+\-*/=()]/g)||[];}
  function compile(src){
    const seedFn=seed(), map=permute(seedFn), remap={};Object.keys(OPCODES).forEach((k,i)=>remap[OPCODES[k]]=map[i]);
    const constants=[], constMap=new Map();
    function constant(v){const key=typeof v+':'+String(v);if(!constMap.has(key)){constMap.set(key,constants.length);constants.push(v);}return constMap.get(key);}
    const tokens=tokenize(src);const code=[];const locals=new Map();let reg=0;
    function emit(op,a,b){code.push([remap[op]??op,a,b]);}
    for(let i=0;i<tokens.length;i++){
      const t=tokens[i];
      if(t==='local'&&tokens[i+1]){const n=tokens[++i];locals.set(n,reg++);if(tokens[i+1]==='='){i++;const v=tokens[++i];const val=/^\d/.test(v)?Number(v):((v[0]==='"'||v[0]==="'")?v.slice(1,-1):v);emit(OPCODES.CONST,locals.get(n),constant(val));emit(OPCODES.SET,locals.get(n));}}
    }
    return {version:1,seed:seedFn(),opcodes:remap,constants,code,sourceHash:hash(src)};
  }
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
  global.INDVM={compile,hash,reverse};
})(window);
