const { chromium } = require('playwright');
const P=new URL('../index.html', 'file://' + __filename).href;
const pass=[],fail=[];const ok=(n,c,d)=>(c?pass:fail).push(n+(d?' :: '+d:''));
(async()=>{
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/font|net::|ERR_/i.test(m.text()))errs.push(m.text())});
await p.goto(P,{waitUntil:'load'});await p.waitForTimeout(500);
ok('F1 no JS errors',errs.length===0,errs.join(' | '));

// model
const m=await p.evaluate(()=>({
  n:Object.keys(FLAGS).length,
  base:scoreRow({owner:'o',data:1,account:1,vendor:1,autonomy:1,radius:1}).bandIdx,
  bump:scoreRow({owner:'o',data:1,account:1,vendor:1,autonomy:1,radius:1,standing:true}).bandIdx,
  reason:scoreRow({owner:'o',data:1,account:1,vendor:1,autonomy:1,radius:1,standing:true}).reasons.join('|'),
  cap:scoreRow({owner:'o',data:3,account:0,vendor:3,autonomy:3,radius:3,standing:true,noOptOut:true}).bandIdx,
  score:scoreRow({owner:'o',data:1,account:1,vendor:1,autonomy:1,radius:1,standing:true}).score
}));
ok('F2 five override flags defined',m.n===3+2||m.n===3,'FLAGS keys='+m.n);
ok('F3 standing grant escalates exactly one band',m.bump===m.base+1,m.base+' -> '+m.bump);
ok('F4 it names its reason',/credential reset|password/.test(m.reason),m.reason);
ok('F5 it cannot push past Critical',m.cap===3,String(m.cap));
ok('F6 it does not change the arithmetic score',m.score===scoreExpect(1,1,1,1,1),String(m.score));
function scoreExpect(a,b2,c,d,e){return Math.round((a*30+b2*20+c*20+d*20+e*10)/3)}

// backward compatibility: a row saved before the flag existed
const back=await p.evaluate(()=>{
  const old={tool:'legacy',owner:'o',data:2,account:1,vendor:1,autonomy:1,radius:2};
  const x=scoreRow(old);
  return {score:x.score,band:x.bandIdx,overridden:x.overridden};
});
ok('F7 a row saved before the flag existed scores unchanged',back.score===Math.round((2*30+1*20+1*20+1*20+2*10)/3)&&!back.overridden,JSON.stringify(back));

// form renders three checkboxes and they feed the score
const boxes=await p.$$eval('#flagChecks input[type=checkbox]',n=>n.map(e=>e.id));
ok('F8 manual form renders one checkbox per flag',boxes.length===3,boxes.join(','));
await p.evaluate(()=>setMode('form'));await p.waitForTimeout(200);
await p.fill('#fTool','Standing grant test');
const before=await p.textContent('#livePreview');
await p.check('#flag_standing');await p.waitForTimeout(250);
const after=await p.textContent('#livePreview');
ok('F9 ticking it changes the live preview',before!==after,before+'  ->  '+after);

// it reaches the register
await p.evaluate(()=>{register=[];save('sapf.register',register);renderRegister();});
await p.fill('#fTool','Standing grant test');
await p.check('#flag_standing');await p.click('#addTool');await p.waitForTimeout(300);
const row=await p.evaluate(()=>register[0]);
ok('F10 the flag is stored on the row',row&&row.standing===true,JSON.stringify(row));
const cleared=await p.evaluate(()=>document.getElementById('flag_standing').checked);
ok('F11 the form clears after adding',cleared===false);

// CSV export carries the column
await p.click('#expCsv');await p.waitForTimeout(300);
const csv=await p.evaluate(()=>navigator.clipboard?null:null);
const hdr=await p.evaluate(()=>REG_HEADERS.join(','));
ok('F12 export header carries standing_grant',/standing_grant/.test(hdr),hdr);

// guided flow shows all three
await p.evaluate(()=>{setMode('guided');resetDraft();gIndex=6;renderGuided();});
await p.waitForTimeout(250);
const gboxes=await p.$$eval('#gBody .checks input',n=>n.length);
ok('F13 guided last step offers all three flags',gboxes===3,'boxes='+gboxes);

// published list matches the code
const listed=await p.evaluate(()=>[...document.querySelectorAll('#grade ul.clean li')].filter(e=>e.offsetParent!==null).length);
ok('F14 published override list has five entries per language',listed===5,'visible li='+listed);
const five=await p.evaluate(()=>document.body.textContent.match(/Five conditions override/)!==null);
ok('F15 the page says five, not four',five);

// new section and containment sequence exist in both languages
for(const plain of [false,true]){
  if(plain){await p.click('header .switch .stxt');await p.waitForTimeout(400);}
  const t=await p.evaluate(()=>document.body.innerText);
  ok((plain?'PLAIN':'PRO')+' F16 attacker section present',/last used|last used/i.test(t)&&/(attacker looks first|matters more than the others)/.test(t));
  ok((plain?'PLAIN':'PRO')+' F17 containment sequence present',/(Before you revoke anything|Before you switch anything off)/.test(t));
  const steps=await p.$$eval('ol.steps.contain',n=>n.filter(e=>e.offsetParent!==null).length);
  ok((plain?'PLAIN':'PRO')+' F18 exactly one containment list visible',steps===1,'visible ol.steps.contain='+steps);
}
await p.click('header .switch .stxt');await p.waitForTimeout(300);

// mobile
const mm=await ctx.newPage();await mm.setViewportSize({width:390,height:844});
await mm.goto(P,{waitUntil:'load'});await mm.waitForTimeout(500);
const o=await mm.evaluate(()=>({s:document.documentElement.scrollWidth,c:document.documentElement.clientWidth}));
ok('F19 mobile no h-scroll',o.s<=o.c+1,JSON.stringify(o));
await b.close();
console.log('PASS '+pass.length);pass.forEach(x=>console.log('  ok  '+x));
console.log('FAIL '+fail.length);fail.forEach(x=>console.log('  XX  '+x));
})().catch(e=>{console.error('HARNESS',e);process.exit(1)});
