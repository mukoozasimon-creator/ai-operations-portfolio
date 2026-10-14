const { chromium } = require('playwright');
const P=new URL('../index.html', 'file://' + __filename).href;
const pass=[],fail=[];const ok=(n,c,d)=>(c?pass:fail).push(n+(d?' :: '+d:''));
(async()=>{
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/font|net::|ERR_/i.test(m.text()))errs.push(m.text())});
await p.goto(P,{waitUntil:'load'});await p.waitForTimeout(600);
ok('A1 no JS errors with the Ask panel merged in',errs.length===0,errs.join(' | '));
ok('A2 all four header controls present',await p.isVisible('#fbBtn')&&await p.isVisible('#askBtn')&&await p.isVisible('#readBtn')&&await p.isVisible('header .switch'));

// three panels mutually exclusive
await p.click('#askBtn');await p.waitForTimeout(250);
ok('A3 Ask opens',await p.getAttribute('#askPanel','hidden')===null);
await p.click('#fbBtn');await p.waitForTimeout(250);
ok('A4 Feedback closes Ask',await p.getAttribute('#askPanel','hidden')!==null && await p.getAttribute('#askBtn','aria-expanded')==='false');
await p.click('#readBtn');await p.waitForTimeout(250);
ok('A5 Reading closes Feedback',await p.getAttribute('#fbPanel','hidden')!==null);
await p.click('#askBtn');await p.waitForTimeout(250);
ok('A6 Ask closes Reading',await p.getAttribute('#readPanel','hidden')!==null);

// graceful degradation with no runtime capability (this is the offline / file build)
const note=await p.textContent('#askNote');
ok('A7 Ask degrades to a clear message with no capability',/not available in this view/.test(note),note);
await p.fill('#askInput','what is a blast radius');
await p.click('#askSend');await p.waitForTimeout(400);
const log=await p.textContent('#askLog');
ok('A8 sending offline does not crash, it explains',/not available in this view/.test(log),log.slice(0,80));
ok('A9 still no JS errors after an offline send',errs.length===0,errs.join(' | '));

// the honesty fix
const t=await p.evaluate(()=>document.body.innerText);
ok('A10 the no-network claim now names the Ask exception',/One exception/.test(t)&&/Ask box in the header sends the question/.test(t));
ok('A11 the old absolute claim is gone',!/this page makes no network calls of its own once the fonts have loaded\./.test(t));
const liveNote=await p.evaluate(()=>{askSample=function(){};return askIdleNote();});
ok('A12 with the capability live, the panel says the question is sent',/sent to a model/.test(liveNote),liveNote);
await p.evaluate(()=>{askSample=null;});
ok('A13 hero no longer says nothing leaves your computer',!/Nothing leaves your computer/.test(await p.evaluate(()=>{document.getElementById('plainToggle').click();return document.body.innerText})));
await p.click('header .switch .stxt');await p.waitForTimeout(300);

// my four corrections survived the merge
ok('A14 43% denominator corrected',/of security incidents involved shadow AI/.test(t)&&!/AI-related security incidents involved shadow AI/.test(t));
ok('A15 regex caveat present',/unanchored/.test(t));
ok('A16 sources split by figure',/X-Force's own write-up/.test(t)&&/ComplexDiscovery/.test(t));
// Version is asserted for consistency, not against a hardcoded number, so a
// bump is a one-line edit in the page rather than a two-line edit plus a test.
{const fv=await p.evaluate(()=>FEEDBACK.version);
 const lic=await p.evaluate(()=>document.querySelector('.lic').textContent);
 const m=/v\d+\.\d+/.exec(lic);
 ok('A17 the footer version and the feedback version agree, and there is only one',
   !!m && m[0]===fv && (lic.match(/v\d+\.\d+/g)||[]).length===1, 'lic='+(m&&m[0])+' feedback='+fv);}

// their work survived my merge
ok('A18 Ask system prompt identifies the author and portfolio',await p.evaluate(()=>/Simon Mukooza/.test(ASK_SYSTEM)&&/sima-gated\.netlify\.app\/#about/.test(ASK_SYSTEM)));
ok('A19 standing-grant flag still present',await p.evaluate(()=>Object.keys(FLAGS).length===3));

// author lookup is deterministic, clickable and does not require the model
await p.evaluate(()=>{askSample=null;askLog=[];renderAskLog();});
await p.fill('#askInput','Author');
await p.click('#askSend');await p.waitForTimeout(200);
const authorLink=await p.locator('#askLog a').first();
ok('A20 Author returns Simon Mukooza',await authorLink.textContent()==='Simon Mukooza');
ok('A21 Author links to the SIMA About page',await authorLink.getAttribute('href')==='https://sima-gated.netlify.app/#about');
ok('A22 Author link opens safely in a new tab',await authorLink.getAttribute('target')==='_blank'&&/noopener/.test(await authorLink.getAttribute('rel')));

// network: nothing until you use Ask
const reqs=[];const np=await ctx.newPage();np.on('request',r=>reqs.push(r.url()));
await np.goto(P,{waitUntil:'load'});await np.waitForTimeout(700);
await np.click('#fbBtn');await np.fill('#fbText','x');await np.click('#fbCopy');await np.waitForTimeout(400);
const ext=reqs.filter(u=>!u.startsWith('file://')&&!/fonts\.(googleapis|gstatic)\.com/.test(u));
ok('A23 page still makes no calls of its own',ext.length===0,ext.join(' | '));
await np.close();

// mobile with four controls
const m=await ctx.newPage();await m.setViewportSize({width:390,height:844});
await m.goto(P,{waitUntil:'load'});await m.waitForTimeout(500);
const bar=await m.evaluate(()=>{const t=document.querySelector('.topbar');return t.scrollWidth<=t.clientWidth+1});
ok('A24 four header controls fit on mobile',bar);
await m.click('#askBtn');await m.waitForTimeout(300);
const mo=await m.evaluate(()=>({s:document.documentElement.scrollWidth,c:document.documentElement.clientWidth}));
ok('A25 mobile Ask panel: no horizontal scroll',mo.s<=mo.c+1,JSON.stringify(mo));
await b.close();
console.log('PASS '+pass.length);pass.forEach(x=>console.log('  ok  '+x));
console.log('FAIL '+fail.length);fail.forEach(x=>console.log('  XX  '+x));
})().catch(e=>{console.error('HARNESS',e);process.exit(1)});
