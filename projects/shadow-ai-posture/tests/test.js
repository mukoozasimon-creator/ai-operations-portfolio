const { chromium } = require('playwright');
const path = require('path').resolve(__dirname, '..', 'index.html');
const pass = [], fail = [];
function ok(n, cond, detail) { (cond ? pass : fail).push(n + (detail ? ' :: ' + detail : '')); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrs = [], pageErrs = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text()); });
  page.on('pageerror', e => pageErrs.push(e.message));
  await page.goto('file://' + path, { waitUntil: 'load' });
  await page.waitForTimeout(400);

  // 1. no JS errors
  const realConsole = consoleErrs.filter(t => !/fonts\.googleapis|fonts\.gstatic|ERR_|net::/i.test(t));
  ok('T1 no uncaught JS errors', pageErrs.length === 0, pageErrs.join(' | '));
  ok('T1b no console errors', realConsole.length === 0, realConsole.join(' | '));

  // 2. every dynamic container rendered
  const ids = ['srcBody','clickBody','fieldBody','dimBody','bandKey','dictList','catRow','mDomains','dispBody','cwBody'];
  for (const id of ids) {
    const n = await page.evaluate(i => { const e = document.getElementById(i); return e ? e.children.length : -1; }, id);
    ok('T2 container #' + id + ' populated', n > 0, 'children=' + n);
  }

  // 3. scoring math vs independent implementation
  const W = { data:30, account:20, vendor:20, autonomy:20, radius:10 };
  function expected(r) {
    let raw = 0; for (const k in W) raw += (r[k]||0) * W[k];
    const s = Math.round(raw/3);
    let idx = s>=75?3:s>=50?2:s>=25?1:0;
    if (r.secrets) idx = 3;
    if (r.data===3 && r.account===3) idx = 3;
    if (!r.owner && r.autonomy>=2) idx = Math.min(3, idx+1);
    if (r.noOptOut) idx = Math.min(3, idx+1);
    if (r.standing) idx = Math.min(3, idx+1);
    return { s, idx };
  }
  const cases = [];
  // exhaustive over all 4^5 = 1024 dimension combos, owner present, no flags
  for (let a=0;a<4;a++) for (let b=0;b<4;b++) for (let c=0;c<4;c++) for (let d=0;d<4;d++) for (let e=0;e<4;e++)
    cases.push({ tool:'t', owner:'o', data:a, account:b, vendor:c, autonomy:d, radius:e, secrets:false, noOptOut:false });
  // flag permutations on a mid-range row
  for (const sec of [false,true]) for (const noo of [false,true]) for (const own of ['o','']) for (const st of [false,true])
    cases.push({ tool:'t', owner:own, data:1, account:1, vendor:1, autonomy:2, radius:1, secrets:sec, noOptOut:noo, standing:st });
  // the two hard overrides
  cases.push({ tool:'t', owner:'o', data:3, account:3, vendor:0, autonomy:0, radius:0, secrets:false, noOptOut:false });

  const got = await page.evaluate(rows => rows.map(r => { const x = scoreRow(r); return { s:x.score, idx:x.bandIdx }; }), cases);
  let mism = 0, firstMis = '';
  cases.forEach((r,i) => {
    const e = expected(r);
    if (e.s !== got[i].s || e.idx !== got[i].idx) { mism++; if (!firstMis) firstMis = JSON.stringify(r) + ' expected ' + JSON.stringify(e) + ' got ' + JSON.stringify(got[i]); }
  });
  ok('T3 scoring matches spec across ' + cases.length + ' cases', mism === 0, mism + ' mismatches; first: ' + firstMis);

  // 3b. anchors
  const anchors = await page.evaluate(() => ({
    allZero: scoreRow({owner:'o',data:0,account:0,vendor:0,autonomy:0,radius:0}).score,
    allThree: scoreRow({owner:'o',data:3,account:3,vendor:3,autonomy:3,radius:3}).score,
    b24: scoreRow({owner:'o',data:0,account:0,vendor:0,autonomy:3,radius:2}).score,
  }));
  ok('T3b all-zero = 0', anchors.allZero === 0, 'got ' + anchors.allZero);
  ok('T3b all-three = 100', anchors.allThree === 100, 'got ' + anchors.allThree);

  // 3c. band boundary exactness
  const bands = await page.evaluate(() => [0,24,25,49,50,74,75,100].map(s => bandIndex(s)));
  ok('T3c band cut points 25/50/75 exact', JSON.stringify(bands) === JSON.stringify([0,0,1,1,2,2,3,3]), JSON.stringify(bands));

  // 3d. override reasons surface
  const ov = await page.evaluate(() => {
    const a = scoreRow({owner:'o',data:0,account:0,vendor:0,autonomy:0,radius:0,secrets:true});
    const b = scoreRow({owner:'',data:0,account:0,vendor:0,autonomy:2,radius:0});
    return { secretsBand:a.bandIdx, secretsFlagged:a.overridden && a.reasons.length===1, ownerBump:b.bandIdx, ownerFlagged:b.overridden };
  });
  ok('T3d secrets forces Critical', ov.secretsBand === 3 && ov.secretsFlagged);
  ok('T3d no-owner + write access bumps one band', ov.ownerBump === 1 && ov.ownerFlagged);

  // 4. presets score as published
  const presets = await page.evaluate(() => PRESETS.map(p => ({ name:p.name, v:p.v, out:scoreRow(Object.assign({owner:'o'}, p.v)) })));
  let pbad = 0;
  presets.forEach(p => { const e = expected(Object.assign({owner:'o'}, p.v)); if (e.s !== p.out.score) pbad++; });
  ok('T4 all ' + presets.length + ' presets score correctly', pbad === 0, pbad + ' wrong');

  // 5. plain english toggle: never both languages visible
  async function langCheck(label) {
    return await page.evaluate(() => {
      const vis = el => el.offsetParent !== null || el.getClientRects().length > 0;
      const pro = [...document.querySelectorAll('#app .pro-only')].filter(vis).length;
      const pl = [...document.querySelectorAll('#app .plain-only')].filter(vis).length;
      return { pro, pl };
    });
  }
  const proMode = await langCheck();
  await page.click('header .switch .stxt');
  await page.waitForTimeout(250);
  const plainMode = await langCheck();
  ok('T5 pro mode hides all plain text', proMode.pro > 20 && proMode.pl === 0, JSON.stringify(proMode));
  ok('T5 plain mode hides all pro text', plainMode.pl > 20 && plainMode.pro === 0, JSON.stringify(plainMode));
  await page.click('header .switch .stxt');
  await page.waitForTimeout(200);

  // 6. dictionary output formats
  const fmts = ['domains','regex','splunk','kql','csv'];
  for (const f of fmts) {
    await page.selectOption('#outFmt', f);
    await page.click('#genOut');
    const v = await page.inputValue('#dictOut');
    let good = v.length > 20;
    if (f === 'regex') { try { new RegExp(v); } catch(e) { good = false; } }
    if (f === 'splunk') good = good && /index|OR|=/.test(v);
    if (f === 'kql') good = good && /where|in\s*\(|\|/i.test(v);
    if (f === 'csv') good = good && v.split('\n').length > 5 && v.includes(',');
    ok('T6 dictionary output "' + f + '" generates', good, v.slice(0,80).replace(/\n/g,'\\n'));
  }
  // regex must escape dots so it cannot over-match
  await page.selectOption('#outFmt','regex'); await page.click('#genOut');
  const rx = await page.inputValue('#dictOut');
  let overmatch = false;
  try { const re = new RegExp(rx, 'i'); overmatch = re.test('openaiXcom.evil.example'); } catch(e) { overmatch = true; }
  ok('T6b regex escapes dots (no over-match)', !overmatch, rx.slice(0,60));

  // 7. dictionary filter + select all/clear
  await page.click('#dictNone'); await page.waitForTimeout(120);
  const emptyRows = await page.evaluate(() => document.querySelectorAll('#dictList .dictrow').length);
  await page.click('#dictAll'); await page.waitForTimeout(120);
  const allRows = await page.evaluate(() => document.querySelectorAll('#dictList .dictrow').length);
  ok('T7 clear -> 0 rows, select all -> full list', emptyRows === 0 && allRows > 40, emptyRows + ' / ' + allRows);
  await page.fill('#dictSearch','openai'); await page.waitForTimeout(150);
  const filtered = await page.evaluate(() => document.querySelectorAll('#dictList .dictrow').length);
  ok('T7b search narrows the list', filtered > 0 && filtered < allRows, filtered + ' of ' + allRows);
  await page.fill('#dictSearch','');

  // 8. CSV import: quoted comma, clamping, derived radius, header skip
  const csv = [
    'tool,vendor,owner,users,data,account,vendor_handling,autonomy,radius,secrets,no_opt_out',
    '"Acme, Inc AI",Acme,Jo,40,9,-2,2,3,,yes,no,yes',
    'Plain Tool,V,,1,1,1,1,1,1,false,true,no'
  ].join('\n');
  await page.evaluate(() => { register = []; save('sapf.register', register); renderRegister(); });
  await page.selectOption('#impMode','register');
  await page.fill('#impText', csv);
  await page.click('#doImport');
  await page.waitForTimeout(250);
  const reg = await page.evaluate(() => register.slice());
  const r0 = reg[0] || {};
  ok('T8 CSV: quoted comma kept in name', r0.tool === 'Acme, Inc AI', r0.tool);
  ok('T8 CSV: out-of-range values clamped to 0-3', r0.data === 3 && r0.account === 0, JSON.stringify([r0.data, r0.account]));
  ok('T8 CSV: blank radius derived from 40 users -> 2', r0.radius === 2, String(r0.radius));
  ok('T8 CSV: yes/no parsed as booleans', r0.secrets === true && r0.noOptOut === false, JSON.stringify([r0.secrets, r0.noOptOut]));
  ok('T8 CSV: standing_grant column imported', r0.standing === true && reg[1] && reg[1].standing === false, JSON.stringify([r0.standing, reg[1] && reg[1].standing]));
  ok('T8 CSV: header row not imported as a tool', reg.length === 2, 'rows=' + reg.length);

  // 8b. signal-mode import maps a known domain to defaults
  await page.evaluate(() => { register = []; save('sapf.register', register); renderRegister(); });
  await page.selectOption('#impMode','signal');
  await page.fill('#impText', 'chat.openai.com,300\nsome-unknown-thing.example,2');
  await page.click('#doImport');
  await page.waitForTimeout(250);
  const sig = await page.evaluate(() => register.slice());
  ok('T8b signal import matched a known AI domain', sig.length === 2 && sig[0].tool !== 'chat.openai.com', JSON.stringify(sig.map(r=>r.tool)));
  ok('T8b signal import derived radius from 300 users -> 3', sig[0].radius === 3, String(sig[0] && sig[0].radius));
  const msg = await page.textContent('#impMsg');
  ok('T8c import warns the defaults are guesses', /correct|guess/i.test(msg), msg);

  // 9. register renders and totals
  const rows = await page.evaluate(() => document.querySelectorAll('#regBody tr').length);
  ok('T9 register table renders imported rows', rows === 2, 'rows=' + rows);

  // 10. save / restore round trip
  await page.evaluate(() => { answers['C1'] = 3; save('sapf.maturity', answers); });
  const state = await page.evaluate(() => JSON.stringify(currentState()));
  await page.evaluate(() => { register = []; answers = {}; save('sapf.register',register); save('sapf.maturity',answers); renderAll(); });
  const cleared = await page.evaluate(() => register.length);
  await page.evaluate(s => restoreState(s), state);
  const restored = await page.evaluate(() => ({ n: register.length, a: Object.keys(answers).length, tool: register[0] && register[0].tool }));
  ok('T10 save/restore round trip', cleared === 0 && restored.n === 2 && restored.a === 1, JSON.stringify(restored));
  await page.evaluate(() => restoreState('not json at all'));
  const badMsg = await page.textContent('#saveMsg');
  ok('T10b bad restore input fails gracefully', /does not look like|could not be read/i.test(badMsg), badMsg);

  // 11. persistence across reload
  await page.evaluate(s => restoreState(s), state);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  const afterReload = await page.evaluate(() => register.length);
  ok('T11 register survives a page reload', afterReload === 2, 'rows=' + afterReload);

  // 12. guided flow end to end
  await page.evaluate(() => { setMode('guided'); resetDraft(); gIndex = 0; renderGuided(); updateGuidedButtons(); });
  await page.fill('#gTool', 'Test Tool').catch(()=>{});
  let steps = 0;
  for (let i = 0; i < 12; i++) {
    const done = await page.evaluate(() => gIndex >= G_TOTAL);
    if (done) break;
    const clicked = await page.evaluate(() => {
      const o = document.querySelector('#gBody .opt');
      if (o) { o.click(); return 'opt'; }
      return 'none';
    });
    await page.waitForTimeout(80);
    await page.click('#gNext').catch(()=>{});
    await page.waitForTimeout(120);
    steps++;
  }
  const guidedEnd = await page.evaluate(() => ({ idx: gIndex, total: G_TOTAL }));
  ok('T12 guided interview walks all steps', guidedEnd.idx >= guidedEnd.total - 1, JSON.stringify(guidedEnd) + ' after ' + steps + ' clicks');

  // 13. maturity assessment math
  const mat = await page.evaluate(() => {
    answers = {}; CONTROLS.forEach(c => answers[c.id] = 3);
    renderMaturityForm(); renderMaturityResults();
    const full = maturityTotals();
    answers = {}; CONTROLS.forEach(c => answers[c.id] = 0);
    renderMaturityResults();
    const zero = maturityTotals();
    answers = {}; CONTROLS.forEach((c,i) => { if (i < 3) answers[c.id] = 2; });
    renderMaturityResults();
    const part = maturityTotals();
    return { n: CONTROLS.length, full: full.pct, zero: zero.pct, partPct: part.pct, partAns: part.answered,
             expectPart: Math.round(6 / (CONTROLS.length*3) * 100) };
  });
  ok('T13 maturity all-max = 100', mat.full === 100, String(mat.full));
  ok('T13 maturity all-zero = 0', mat.zero === 0, String(mat.zero));
  ok('T13 maturity partial score arithmetic', mat.partPct === mat.expectPart && mat.partAns === 3, mat.partPct + ' vs ' + mat.expectPart);
  ok('T13b thirteen controls as claimed', mat.n === 13, 'controls=' + mat.n);

  // 14. print view builds
  const printLen = await page.evaluate(() => { renderPrint(); const p = document.getElementById('printOut'); return p ? p.innerHTML.length : 0; });
  ok('T14 print view renders content', printLen > 500, 'chars=' + printLen);

  // 15. mobile: no horizontal overflow, primary action above the fold
  const m = await ctx.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto('file://' + path, { waitUntil: 'load' });
  await m.waitForTimeout(400);
  const mob = await m.evaluate(() => {
    const de = document.documentElement;
    const cta = document.querySelector('.hero-cta .btn');
    const r = cta ? cta.getBoundingClientRect() : null;
    let widest = null, maxw = 0;
    document.querySelectorAll('body *').forEach(e => {
      const rr = e.getBoundingClientRect();
      if (rr.right > maxw) { maxw = rr.right; widest = e.tagName + '.' + (e.className||'').toString().slice(0,30); }
    });
    return { scrollW: de.scrollWidth, clientW: de.clientWidth, ctaTop: r ? Math.round(r.top) : -1, widest, maxw: Math.round(maxw) };
  });
  ok('T15 mobile 390px: no horizontal scroll', mob.scrollW <= mob.clientW + 1, JSON.stringify(mob));
  ok('T15b mobile: a primary button is within the first screen', mob.ctaTop > 0 && mob.ctaTop < 844, 'top=' + mob.ctaTop);

  // 16. dark mode renders (no invisible text)
  const dk = await ctx.newPage();
  await dk.emulateMedia({ colorScheme: 'dark' });
  await dk.goto('file://' + path, { waitUntil: 'load' });
  await dk.waitForTimeout(300);
  const contrast = await dk.evaluate(() => {
    const b = getComputedStyle(document.body);
    return { bg: b.backgroundColor, fg: b.color };
  });
  ok('T16 dark mode applies its own palette', contrast.bg !== 'rgba(0, 0, 0, 0)' && contrast.bg !== contrast.fg, JSON.stringify(contrast));

  // 17. no network calls to anything but fonts (offline / privacy claim)
  const reqs = [];
  const np = await ctx.newPage();
  np.on('request', r => reqs.push(r.url()));
  await np.goto('file://' + path, { waitUntil: 'load' });
  await np.waitForTimeout(600);
  await np.evaluate(() => { renderAll(); });
  await np.waitForTimeout(300);
  const external = reqs.filter(u => !u.startsWith('file://') && !/fonts\.(googleapis|gstatic)\.com/.test(u));
  ok('T17 no data leaves the page (no calls beyond Google Fonts)', external.length === 0, external.join(' | '));

  // 18. accessibility smoke: every input has a label or aria-label
  const a11y = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(e => {
      const hasLabel = (e.id && document.querySelector('label[for="' + CSS.escape(e.id) + '"]')) || e.closest('label') || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby');
      if (!hasLabel) bad.push(e.tagName + '#' + (e.id || '(no id)'));
    });
    const btnNoName = [...document.querySelectorAll('button')].filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length;
    return { bad, btnNoName };
  });
  ok('T18 every form control is labelled', a11y.bad.length === 0, a11y.bad.join(', '));
  ok('T18b every button has an accessible name', a11y.btnNoName === 0, 'unnamed=' + a11y.btnNoName);

  await browser.close();

  console.log('\n===== PASS (' + pass.length + ') =====');
  pass.forEach(p => console.log('  PASS  ' + p));
  console.log('\n===== FAIL (' + fail.length + ') =====');
  fail.forEach(f => console.log('  FAIL  ' + f));
  console.log('\nTOTAL ' + (pass.length + fail.length) + ' checks, ' + fail.length + ' failing.');
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });
