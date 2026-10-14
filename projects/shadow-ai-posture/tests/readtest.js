const { chromium } = require('playwright');
const P=new URL('../index.html', 'file://' + __filename).href;
const pass=[],fail=[];const ok=(n,c,d)=>(c?pass:fail).push(n+(d?' :: '+d:''));
const openPanel=async pg=>{ if(await pg.getAttribute('#readPanel','hidden')!==null){ await pg.click('#readBtn'); await pg.waitForTimeout(200);} };
(async()=>{
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:900}});
const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/font|net::|ERR_/i.test(m.text()))errs.push(m.text())});
await p.goto(P,{waitUntil:'load'});await p.waitForTimeout(500);
ok('R1 no JS errors',errs.length===0,errs.join(' | '));

ok('R2 Reading button present',await p.isVisible('#readBtn'));
ok('R3 panel starts closed',await p.getAttribute('#readPanel','hidden')!==null);
await p.click('#readBtn');await p.waitForTimeout(200);
ok('R4 panel opens and reports it',await p.getAttribute('#readPanel','hidden')===null && await p.getAttribute('#readBtn','aria-expanded')==='true');

// text size actually scales real rendered text
const measure=()=>p.evaluate(()=>{const e=document.querySelector('.deck');const r=e.getBoundingClientRect();return {h:Math.round(r.height),fs:getComputedStyle(e).fontSize}});
const base=await measure();
await p.click('[data-zoom="1.35"]');await p.waitForTimeout(300);
const big=await measure();
ok('R5 largest text size visibly enlarges content',big.h>base.h*1.2,JSON.stringify(base)+' -> '+JSON.stringify(big));
await p.click('[data-zoom="0.9"]');await p.waitForTimeout(300);
const small=await measure();
ok('R6 small size shrinks content',small.h<base.h,JSON.stringify(small));
await p.click('[data-zoom="1"]');await p.waitForTimeout(250);

// spacing
const lh=()=>p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.p')).lineHeight));
const ws=()=>p.evaluate(()=>getComputedStyle(document.querySelector('.p')).wordSpacing);
const l0=await lh();
await p.click('[data-sp="sp-wide"]');await p.waitForTimeout(250);
const l2=await lh(),w2=await ws();
ok('R7 widest spacing opens up lines and words',l2>l0*1.25&&parseFloat(w2)>1,l0+' -> '+l2+' / word '+w2);
// mono eyebrows must NOT be re-tracked
const eyebrowLs=await p.evaluate(()=>getComputedStyle(document.querySelector('.eyebrow')).letterSpacing);
ok('R8 mono eyebrow keeps its own tracking',/0\.14em|1\.[0-9]/.test(eyebrowLs)||parseFloat(eyebrowLs)>1,eyebrowLs);
await p.click('[data-sp=""]');await p.waitForTimeout(200);

// typeface
await p.check('#legibleTog');await p.waitForTimeout(250);
const ff=await p.evaluate(()=>getComputedStyle(document.querySelector('.p')).fontFamily);
ok('R9 high legibility typeface applies',/Atkinson|Verdana|Tahoma/i.test(ff),ff);
await p.uncheck('#legibleTog');await p.waitForTimeout(150);

// contrast
await p.check('#hcTog');await p.waitForTimeout(250);
const hc=await p.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,fg:getComputedStyle(document.querySelector('.p')).color}));
ok('R10 maximum contrast applies',hc.bg==='rgb(255, 255, 255)'&&hc.fg==='rgb(10, 10, 10)',JSON.stringify(hc));
await p.uncheck('#hcTog');await p.waitForTimeout(150);

// persistence
await p.click('[data-zoom="1.15"]');await p.check('#legibleTog');await p.waitForTimeout(250);
await p.reload({waitUntil:'load'});await p.waitForTimeout(500);
const kept=await p.evaluate(()=>({z:document.getElementById('app').style.zoom,leg:document.body.classList.contains('legible'),chk:document.getElementById('legibleTog').checked}));
ok('R11 settings survive a reload',kept.z==='1.15'&&kept.leg&&kept.chk,JSON.stringify(kept));
// reset
await openPanel(p);
await p.click('#readReset');await p.waitForTimeout(250);
const rst=await p.evaluate(()=>({z:document.getElementById('app').style.zoom,leg:document.body.classList.contains('legible'),hc:document.body.classList.contains('hc')}));
ok('R12 reset returns everything to default',rst.z==='1'&&!rst.leg&&!rst.hc,JSON.stringify(rst));

// note follows the Plain English toggle
const noteA=await p.textContent('#readNote');
await p.click('header .switch .stxt');await p.waitForTimeout(350);
const noteB=await p.textContent('#readNote');
ok('R13 note rewrites with Plain English',noteA!==noteB&&noteB.length>20,noteB.slice(0,60));
await p.click('header .switch .stxt');await p.waitForTimeout(250);

// settings must NOT ride along in the save file
const st=await p.evaluate(()=>JSON.stringify(currentState()));
ok('R14 reading settings stay out of the save file',!/zoom|legible|"hc"/.test(st));

// sticky header still sticks while zoomed
await openPanel(p);
await p.click('[data-zoom="1.35"]');await p.waitForTimeout(250);
await p.evaluate(()=>window.scrollTo(0,1800));await p.waitForTimeout(300);
const stick=await p.evaluate(()=>{const r=document.querySelector('header.top').getBoundingClientRect();return Math.round(r.top)});
ok('R15 sticky header still pinned at largest size',stick>=-2&&stick<=4,'top='+stick);
await p.evaluate(()=>window.scrollTo(0,0));
await p.click('[data-zoom="1"]');await p.waitForTimeout(200);

// a11y
const a=await p.evaluate(()=>{
 const bad=[];document.querySelectorAll('#readPanel input,#readPanel select').forEach(e=>{
  const l=(e.id&&document.querySelector('label[for="'+CSS.escape(e.id)+'"]'))||e.closest('label')||e.getAttribute('aria-label');
  if(!l)bad.push(e.id||e.tagName);});
 const groups=[...document.querySelectorAll('#readPanel [role=group]')].filter(g=>!g.getAttribute('aria-labelledby')).length;
 const nb=[...document.querySelectorAll('#readPanel button')].filter(b=>!b.textContent.trim()&&!b.getAttribute('aria-label')).length;
 return {bad,groups,nb};});
ok('R16 panel controls all labelled',a.bad.length===0&&a.groups===0&&a.nb===0,JSON.stringify(a));
await p.close();

// mobile, panel open, largest size
const m=await ctx.newPage();await m.setViewportSize({width:390,height:844});
await m.goto(P,{waitUntil:'load'});await m.waitForTimeout(500);
const barFits=await m.evaluate(()=>{const t=document.querySelector('.topbar');return t.scrollWidth<=t.clientWidth+1});
ok('R17 mobile top bar fits without squashing',barFits);
await openPanel(m);
await m.click('[data-zoom="1.35"]');await m.click('[data-sp="sp-wide"]');await m.check('#legibleTog');await m.waitForTimeout(400);
const mo=await m.evaluate(()=>({s:document.documentElement.scrollWidth,c:document.documentElement.clientWidth}));
ok('R18 mobile 390px: no h-scroll at largest size + widest spacing',mo.s<=mo.c+1,JSON.stringify(mo));
await m.close();
await b.close();
console.log('PASS '+pass.length);pass.forEach(x=>console.log('  ok  '+x));
console.log('FAIL '+fail.length);fail.forEach(x=>console.log('  XX  '+x));
})().catch(e=>{console.error('HARNESS',e);process.exit(1)});
