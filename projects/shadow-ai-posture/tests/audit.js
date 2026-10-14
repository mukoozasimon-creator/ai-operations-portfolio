const { chromium } = require('playwright');
const P=new URL('../index.html', 'file://' + __filename).href;
(async()=>{
const b=await chromium.launch();
for(const W of [1440,1280,1120,1000]){
  const p=await b.newPage();
  await p.setViewportSize({width:W,height:1000});
  await p.goto(P,{waitUntil:'load'});await p.waitForTimeout(400);
  const res=await p.evaluate(()=>{
    const sel='.deck,.p,.note,ul.clean,.hint,.guide-help,.srclist,.foot-note';
    const els=[...document.querySelectorAll(sel)].filter(e=>getComputedStyle(e).display!=='none'&&e.textContent.trim());
    const before=els.map(e=>e.getBoundingClientRect().width);
    const st=document.createElement('style');
    st.textContent=sel.split(',').map(s=>s+'{max-width:none !important}').join('');
    document.head.appendChild(st);
    const after=els.map(e=>e.getBoundingClientRect().width);
    st.remove();
    const agg={};
    els.forEach((e,i)=>{
      const k=(e.className||e.tagName).split(' ')[0];
      const waste=Math.round(after[i]-before[i]);
      if(waste>6){ agg[k]=agg[k]||{n:0,max:0}; agg[k].n++; agg[k].max=Math.max(agg[k].max,waste); }
    });
    return agg;
  });
  const ks=Object.keys(res);
  console.log('viewport '+W+'px: '+(ks.length?ks.map(k=>'.'+k+' x'+res[k].n+' up to '+res[k].max+'px').join(', '):'no wasted width'));
  await p.close();
}
await b.close();
})();
