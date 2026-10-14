const { chromium } = require('playwright');
const P=new URL('../index.html', 'file://' + __filename).href;
const pass=[],fail=[];const ok=(n,c,d)=>(c?pass:fail).push(n+(d?' :: '+d:''));
(async()=>{
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900}});
const p=await ctx.newPage();
await p.goto(P,{waitUntil:'load'});await p.waitForTimeout(500);

// keyboard-only traversal: can you reach and operate the three header controls with Tab alone?
await p.evaluate(()=>document.body.focus());
const order=[];
for(let i=0;i<14;i++){
  await p.keyboard.press('Tab');
  const id=await p.evaluate(()=>{const e=document.activeElement;return e.id||e.className||e.tagName});
  order.push(id);
}
ok('K1 feedback button reachable by Tab',order.some(x=>/fbBtn/.test(x)),order.slice(0,10).join(' > '));
ok('K2 reading button reachable by Tab',order.some(x=>/readBtn/.test(x)));
ok('K3 plain english switch reachable by Tab',order.some(x=>/plainToggle|switch/.test(x)));
// operate feedback by keyboard alone
await p.evaluate(()=>document.getElementById('fbBtn').focus());
await p.keyboard.press('Enter');await p.waitForTimeout(300);
ok('K4 panel opens with Enter',await p.getAttribute('#fbPanel','hidden')===null);
await p.keyboard.type('typed with no mouse');await p.waitForTimeout(250);
ok('K5 focus lands in the message box on open',/typed with no mouse/.test(await p.inputValue('#fbText')));
await p.evaluate(()=>document.getElementById('fbClose').focus());
await p.keyboard.press('Enter');await p.waitForTimeout(250);
ok('K6 closes with Enter and returns focus',await p.getAttribute('#fbPanel','hidden')!==null && await p.evaluate(()=>document.activeElement.id)==='fbBtn');

// the corrected claims
const t=await p.evaluate(()=>document.body.innerText);
ok('C1 43% no longer narrows the denominator',/of security incidents involved shadow AI/.test(t)&&!/AI-related security incidents involved shadow AI/.test(t));
ok('C2 regex caveat present in pro mode',/unanchored/.test(t)&&/evil-chatgpt\.com\.example/.test(t));
ok('C3 X-Force credit explained in sources',/X-Force's own write-up/.test(t)&&/not in the press release/.test(t));
ok('C4 the 35 and 33 split now cites ComplexDiscovery',/ComplexDiscovery/.test(t));
ok('C5 prior-year unit mismatch disclosed',/counts organisations rather than incidents/.test(t));
await p.click('header .switch .stxt');await p.waitForTimeout(400);
const tp=await p.evaluate(()=>document.body.innerText);
ok('C6 68% plain version no longer overstates',!/no rules at all about how people use AI/.test(tp)&&/About half of those had nothing written down/.test(tp));
ok('C7 regex caveat present in plain mode',/matches any address that contains one of these names/.test(tp));
const dual=await p.evaluate(()=>{
  const vis=e=>e.offsetParent!==null;
  return {pro:[...document.querySelectorAll('#app .pro-only')].filter(vis).length,
          pl:[...document.querySelectorAll('#app .plain-only')].filter(vis).length};
});
ok('C8 language toggle still exclusive after the edits',dual.pro===0&&dual.pl>20,JSON.stringify(dual));
await p.click('header .switch .stxt');await p.waitForTimeout(300);

// every external link is a real absolute https URL, no placeholders
const links=await p.evaluate(()=>[...document.querySelectorAll('a[href^="http"]')].map(a=>a.href));
ok('C9 no placeholder or relative links left',links.every(u=>/^https:\/\//.test(u))&&!links.some(u=>/example\.com|TODO|xxx/i.test(u)),links.length+' links');

// print output still builds after the edits
const plen=await p.evaluate(()=>{renderPrint();return document.getElementById('printOut').innerHTML.length});
ok('C10 print summary still builds',plen>500,'chars='+plen);
await b.close();
console.log('PASS '+pass.length);pass.forEach(x=>console.log('  ok  '+x));
console.log('FAIL '+fail.length);fail.forEach(x=>console.log('  XX  '+x));
})().catch(e=>{console.error('HARNESS',e);process.exit(1)});
