const { chromium } = require('playwright');
const P=new URL('../index.html', 'file://' + __filename).href;
const pass=[],fail=[];const ok=(n,c,d)=>(c?pass:fail).push(n+(d?' :: '+d:''));
(async()=>{
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900},permissions:['clipboard-read','clipboard-write']});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/font|net::|ERR_/i.test(m.text()))errs.push(m.text())});
await p.goto(P,{waitUntil:'load'});await p.waitForTimeout(500);
ok('B1 no JS errors',errs.length===0,errs.join(' | '));
ok('B2 feedback button in the header',await p.isVisible('#fbBtn'));
ok('B3 panel starts closed',await p.getAttribute('#fbPanel','hidden')!==null);
await p.click('#fbBtn');await p.waitForTimeout(250);
ok('B4 opens and announces it',await p.getAttribute('#fbPanel','hidden')===null && await p.getAttribute('#fbBtn','aria-expanded')==='true');

const boxes=await p.$$eval('#fbChecks input',n=>n.map(e=>({id:e.id,on:e.checked})));
ok('B5 four context items, all on by default',boxes.length===4&&boxes.every(x=>x.on),JSON.stringify(boxes.map(x=>x.id)));

await p.fill('#fbText','The regex over-matches on evil-chatgpt.com.xyz');
await p.waitForTimeout(200);
let prev=await p.inputValue('#fbPrev');
ok('B6 the message appears in the preview',prev.includes('evil-chatgpt.com.xyz'));
ok('B7 preview carries tool and version',/Shadow AI Posture Framework v\d+\.\d+/.test(prev),(prev.match(/Tool: .*/)||[''])[0]);
ok('B8 preview carries the section',/Section: .+/.test(prev)&&!/Section: \(not recorded\)/.test(prev),(prev.match(/Section: .*/)||[''])[0]);
ok('B9 preview carries screen and browser',/Screen: \d+ by \d+/.test(prev)&&/Browser: /.test(prev));
ok('B10 preview carries settings',/Language: Professional/.test(prev)&&/Reading: size 1/.test(prev));

// unticking actually removes it
await p.uncheck('#fb_screen');await p.waitForTimeout(200);
prev=await p.inputValue('#fbPrev');
ok('B11 unticking removes it from the report',!/Browser: /.test(prev)&&!/Screen: /.test(prev));
await p.uncheck('#fb_settings');await p.uncheck('#fb_section');await p.waitForTimeout(200);
prev=await p.inputValue('#fbPrev');
ok('B12 unticking all context leaves only the message',!/Section:|Browser:|Language:/.test(prev)&&prev.includes('evil-chatgpt'),prev.replace(/\n/g,' | ').slice(0,90));
await p.check('#fb_screen');await p.check('#fb_settings');await p.check('#fb_section');await p.waitForTimeout(200);

// copy
await p.click('#fbCopy');await p.waitForTimeout(400);
const clip=await p.evaluate(()=>navigator.clipboard.readText());
ok('B13 copy puts the whole report on the clipboard',clip.includes('evil-chatgpt.com.xyz')&&clip.includes('Shadow AI Posture Framework'),clip.length+' chars');
const lbl=await p.textContent('#fbCopy');
ok('B14 the button confirms the copy',/Copied/.test(lbl),lbl);

// send button hidden while no URL configured
const sendHref=await p.getAttribute('#fbSend','href');
ok('B15 send button live and pointing at the real profile',await p.getAttribute('#fbSend','hidden')===null && /^https:\/\/www\.linkedin\.com\/in\/[a-z0-9-]+\/?$/.test(sendHref),sendHref);
ok('B15b send opens in a new tab with noopener',await p.getAttribute('#fbSend','target')==='_blank' && /noopener/.test(await p.getAttribute('#fbSend','rel')||''));
const cfg=await p.evaluate(()=>Object.keys(FEEDBACK));
ok('B16 config is six strings in one place',cfg.join(',')==='tool,version,contactUrl,contactLabel,mailtoAddress,mailtoLabel',cfg.join(','));
const send2Href=await p.getAttribute('#fbSend2','href');
ok('B16b mailto button live and pointing at the right address',await p.getAttribute('#fbSend2','hidden')===null && /^mailto:mukoozasimon@gmail\.com\?subject=/.test(send2Href),send2Href);
ok('B16c mailto body carries the report',decodeURIComponent(send2Href.split('body=')[1]).indexOf('Feedback on Shadow AI Posture Framework')===0,send2Href.length);
await p.fill('#fbText','testing the mailto body updates live');
await p.waitForTimeout(150);
const send2HrefAfter=await p.getAttribute('#fbSend2','href');
ok('B16d mailto body updates as the message changes',decodeURIComponent(send2HrefAfter).indexOf('testing the mailto body updates live')!==-1);
await p.fill('#fbText','');
await p.waitForTimeout(150);
// simulate a URL being set
await p.evaluate(()=>{FEEDBACK.contactUrl='';fbRender();});
await p.waitForTimeout(200);
ok('B17 clearing the URL hides the button rather than breaking it',await p.getAttribute('#fbSend','hidden')!==null);
ok('B17b clearing the LinkedIn URL leaves the mailto button untouched',await p.getAttribute('#fbSend2','hidden')===null);
await p.evaluate(()=>{FEEDBACK.contactUrl='https://www.linkedin.com/in/simonmukooza/';fbRender();});
await p.waitForTimeout(200);

// panels are mutually exclusive
await p.click('#readBtn');await p.waitForTimeout(250);
ok('B18 opening Reading closes Feedback',await p.getAttribute('#fbPanel','hidden')!==null && await p.getAttribute('#fbBtn','aria-expanded')==='false');
await p.click('#fbBtn');await p.waitForTimeout(250);
ok('B19 opening Feedback closes Reading',await p.getAttribute('#readPanel','hidden')!==null);
await p.click('#fbClose');await p.waitForTimeout(250);
ok('B20 close returns focus to the button',await p.evaluate(()=>document.activeElement.id)==='fbBtn');

// plain english
await p.click('header .switch .stxt');await p.waitForTimeout(400);
await p.click('#fbBtn');await p.waitForTimeout(250);
const note=await p.textContent('#fbNote');
const first=await p.textContent('#fbChecks label');
ok('B21 panel text switches to Plain English',/does not send anything anywhere/.test(note),note.slice(0,60));
const prevPlain=await p.inputValue('#fbPrev');
ok('B22 report records the language mode',/Language: Plain English/.test(prevPlain));
await p.click('header .switch .stxt');await p.waitForTimeout(300);

// still no network
const reqs=[];const np=await ctx.newPage();np.on('request',r=>reqs.push(r.url()));
await np.goto(P,{waitUntil:'load'});await np.waitForTimeout(500);
await np.click('#fbBtn');await np.fill('#fbText','test');await np.click('#fbCopy');await np.waitForTimeout(500);
const ext=reqs.filter(u=>!u.startsWith('file://')&&!/fonts\.(googleapis|gstatic)\.com/.test(u));
ok('B23 submitting feedback still makes no network calls',ext.length===0,ext.join(' | '));
await np.close();

// a11y
const a=await p.evaluate(()=>{
 const bad=[];document.querySelectorAll('#fbPanel input,#fbPanel textarea').forEach(e=>{
  const l=(e.id&&document.querySelector('label[for="'+CSS.escape(e.id)+'"]'))||e.closest('label')||e.getAttribute('aria-label')||e.getAttribute('aria-labelledby');
  if(!l)bad.push(e.id||e.tagName);});
 const nb=[...document.querySelectorAll('#fbPanel button, #fbPanel a')].filter(x=>!x.textContent.trim()&&!x.getAttribute('aria-label')).length;
 return {bad,nb};});
ok('B24 every field labelled, every control named',a.bad.length===0&&a.nb===0,JSON.stringify(a));
await p.close();

// mobile
const m=await ctx.newPage();await m.setViewportSize({width:390,height:844});
await m.goto(P,{waitUntil:'load'});await m.waitForTimeout(500);
const bar=await m.evaluate(()=>{const t=document.querySelector('.topbar');return {fits:t.scrollWidth<=t.clientWidth+1,lines:Math.round(t.getBoundingClientRect().height)}});
ok('B25 three header controls still fit on mobile',bar.fits,JSON.stringify(bar));
await m.click('#fbBtn');await m.waitForTimeout(300);
const mo=await m.evaluate(()=>({s:document.documentElement.scrollWidth,c:document.documentElement.clientWidth}));
ok('B26 mobile panel open: no horizontal scroll',mo.s<=mo.c+1,JSON.stringify(mo));
await b.close();
console.log('PASS '+pass.length);pass.forEach(x=>console.log('  ok  '+x));
console.log('FAIL '+fail.length);fail.forEach(x=>console.log('  XX  '+x));
})().catch(e=>{console.error('HARNESS',e);process.exit(1)});
