const { chromium } = require('playwright');
const P = new URL('../index.html', 'file://' + __filename).href;
const pass = [], fail = [];
const ok = (n, c, d) => (c ? pass : fail).push(n + (d ? ' :: ' + d : ''));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const pageErrs = [];
  p.on('pageerror', e => pageErrs.push(e.message));
  await p.goto(P, { waitUntil: 'load' });
  await p.waitForTimeout(400);

  // ---------------------------------------------------------------- F1 no errors
  ok('F1 no uncaught JS errors', pageErrs.length === 0, pageErrs.join(' | '));

  // ---------------------------------------------------------------- F2 tiles exist and read
  for (const id of ['tNoAlt', 'tOverdue', 'tOpen']) {
    const v = await p.evaluate(i => { const e = document.getElementById(i); return e ? e.textContent : null; }, id);
    ok('F2 tile #' + id + ' present', v !== null && /^\d/.test(v), 'value=' + v);
  }
  const cap = await p.evaluate(() => document.getElementById('fuCap').textContent);
  ok('F2d follow-up caption written by JS', cap.length > 20, cap.slice(0, 40));

  // ---------------------------------------------------------------- F3 counters match an independent implementation
  const W = { data: 30, account: 20, vendor: 20, autonomy: 20, radius: 10 };
  function bandIdx(r) {
    let raw = 0; for (const k in W) raw += (r[k] || 0) * W[k];
    const score = Math.round(raw / 3);
    let i = score >= 75 ? 3 : score >= 50 ? 2 : score >= 25 ? 1 : 0;
    if (r.secrets) i = 3;
    if (r.data === 3 && r.account === 3) i = 3;
    if (!r.owner && r.autonomy >= 2) i = Math.min(3, i + 1);
    if (r.noOptOut) i = Math.min(3, i + 1);
    if (r.standing) i = Math.min(3, i + 1);
    return { score, i };
  }
  const reg = await p.evaluate(() => JSON.parse(JSON.stringify(register)));
  const today = await p.evaluate(() => todayISO());
  let eNoAlt = 0, eOver = 0, eOpen = 0;
  reg.forEach(r => {
    const b = bandIdx(r);
    const need = b.i >= 2, alt = (r.replacement || '').trim(), due = (r.reviewDue || '').trim(), done = (r.enforced || '').trim();
    if (need && !alt && !done) eNoAlt++;
    if (due && !done && due < today) eOver++;
    if (!done) eOpen++;
  });
  const shown = await p.evaluate(() => ({
    a: +document.getElementById('tNoAlt').textContent,
    b: +document.getElementById('tOverdue').textContent,
    c: +document.getElementById('tOpen').textContent
  }));
  ok('F3a noAlt tile matches independent count', shown.a === eNoAlt, shown.a + ' vs ' + eNoAlt);
  ok('F3b overdue tile matches independent count', shown.b === eOver, shown.b + ' vs ' + eOver);
  ok('F3c open tile matches independent count', shown.c === eOpen, shown.c + ' vs ' + eOpen);

  // ---------------------------------------------------------------- F4 today's date helper is a real ISO date
  ok('F4 todayISO is YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(today), today);
  const p3 = await p.evaluate(() => plusMonthsISO(3));
  ok('F4b plusMonthsISO returns a later date', p3 > today, p3 + ' > ' + today);

  // ---------------------------------------------------------------- F5 the gate: High/Critical cannot close without a replacement
  const gate = await p.evaluate(() => {
    const out = [];
    register.forEach(r => {
      const s = scoreRow(r);
      const alt = (r.replacement || '').trim();
      const f = followUp(r, s);
      out.push({ tool: r.tool, band: s.bandIdx, alt: !!alt, canClose: f.canClose });
    });
    return out;
  });
  const gateWrong = gate.filter(g => (g.band >= 2 && !g.alt && g.canClose) || (g.band < 2 && !g.canClose) || (g.alt && !g.canClose));
  ok('F5 canClose is false exactly when High/Critical has no replacement', gateWrong.length === 0, JSON.stringify(gateWrong));

  // ---------------------------------------------------------------- F6 blocked row: the button refuses and nothing is written
  const blockedTool = gate.filter(g => g.band >= 2 && !g.alt)[0];
  ok('F6 fixture: a blocked High/Critical row exists in the examples', !!blockedTool, JSON.stringify(gate));
  if (blockedTool) {
    // open its Plan panel
    const opened = await p.evaluate(t => {
      const rows = [...document.querySelectorAll('#regBody tr')];
      for (const tr of rows) {
        const strong = tr.querySelector('td strong');
        if (strong && strong.textContent === t) {
          const btn = [...tr.querySelectorAll('button')].find(b => /Plan/.test(b.textContent));
          if (btn) { btn.click(); return true; }
        }
      }
      return false;
    }, blockedTool.tool);
    ok('F6a Plan panel opens', opened);
    await p.waitForTimeout(120);
    const hasEditor = await p.evaluate(() => !!document.querySelector('tr.fuedit') && !!document.getElementById('fu_rep') && !!document.getElementById('fu_due') && !!document.getElementById('fu_enf'));
    ok('F6b editor renders all three fields', hasEditor);

    const before = await p.evaluate(t => { const r = register.filter(x => x.tool === t)[0]; return r.enforced; }, blockedTool.tool);
    const res = await p.evaluate(() => {
      const btn = [...document.querySelectorAll('tr.fuedit button')].find(b => /Mark as done|Tick it off/.test(b.textContent));
      btn.click();
      // the refusal lands in the empty .hint inside the toolbar, not in a field hint
      const bar = document.querySelector('tr.fuedit .toolbar .hint');
      return bar ? bar.textContent : '(no toolbar message element)';
    });
    const after = await p.evaluate(t => { const r = register.filter(x => x.tool === t)[0]; return r.enforced; }, blockedTool.tool);
    ok('F6c blocked row is NOT marked done', after === before && !after, 'before=' + before + ' after=' + after);
    ok('F6d refusal explains why', /cannot be closed|cannot tick/i.test(res), res.slice(0, 90));

    // typing a date directly into the enforced field is also refused
    await p.evaluate(() => { const e = document.getElementById('fu_enf'); e.value = '2026-01-01'; e.dispatchEvent(new Event('change', { bubbles: true })); });
    const after2 = await p.evaluate(t => register.filter(x => x.tool === t)[0].enforced, blockedTool.tool);
    ok('F6e typing the date directly is refused too', !after2, 'enforced=' + after2);

    // now name a replacement, and the same button works
    await p.evaluate(() => { const e = document.getElementById('fu_rep'); e.value = 'Sanctioned equivalent'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.evaluate(() => {
      const btn = [...document.querySelectorAll('tr.fuedit button')].find(b => /Mark as done|Tick it off/.test(b.textContent));
      btn.click();
    });
    await p.waitForTimeout(120);
    const after3 = await p.evaluate(t => register.filter(x => x.tool === t)[0], blockedTool.tool);
    ok('F6f with a replacement named, the row closes', !!after3.enforced && after3.enforced === today, JSON.stringify(after3.enforced));
    ok('F6g the replacement was stored', after3.replacement === 'Sanctioned equivalent', after3.replacement);

    // the score did not move
    const sc = await p.evaluate(t => { const r = register.filter(x => x.tool === t)[0]; return scoreRow(r).score; }, blockedTool.tool);
    const expectedScore = bandIdx(after3).score;
    ok('F6h closing a row does not change its score', sc === expectedScore, sc + ' vs ' + expectedScore);

    // tiles updated
    const openAfter = await p.evaluate(() => +document.getElementById('tOpen').textContent);
    ok('F6i "decided, not done" tile went down by one', openAfter === eOpen - 1, openAfter + ' vs ' + (eOpen - 1));
  }

  // ---------------------------------------------------------------- F7 Low/Moderate rows close on the date alone
  await p.reload({ waitUntil: 'load' });
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(300);
  const lowClose = await p.evaluate(() => {
    register = [{ tool: 'Harmless thing', vendorName: '', owner: 'Someone', users: 1, data: 0, account: 0, vendor: 0, autonomy: 0, radius: 0, secrets: false, noOptOut: false, standing: false, source: '', replacement: '', reviewDue: '', enforced: '' }];
    persistRegister();
    const s = scoreRow(register[0]);
    return { band: s.bandIdx, canClose: followUp(register[0], s).canClose };
  });
  ok('F7 a Low row can be closed with no replacement', lowClose.band === 0 && lowClose.canClose === true, JSON.stringify(lowClose));

  // ---------------------------------------------------------------- F8 CSV round trip carries the new columns
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(300);
  const csv = await p.evaluate(() => {
    const head = REG_HEADERS.concat(['score', 'band', 'decision']).join(',');
    const body = register.map(function (r) {
      const s = scoreRow(r);
      return [r.tool, r.vendorName || '', r.owner, r.users, r.data, r.account, r.vendor, r.autonomy, r.radius,
      r.secrets ? 1 : 0, r.noOptOut ? 1 : 0, r.standing ? 1 : 0, r.source || '', r.replacement || '', r.reviewDue || '', r.enforced || '',
      r.acceptedBy || '', r.acceptedReason || '', r.acceptedUntil || '',
      s.score, T(s.band.t, s.band.p), T(s.band.dispT, s.band.dispP)].map(csvCell).join(',');
    }).join('\n');
    return head + '\n' + body;
  });
  const headCols = csv.split('\n')[0].split(',');
  ok('F8a export header has 22 columns', headCols.length === 22, headCols.length + ': ' + headCols.join('|'));
  ok('F8b header names the new columns', ['source', 'replacement', 'review_due', 'enforced'].every(h => headCols.includes(h)), headCols.join('|'));
  const otterLine = csv.split('\n').find(l => /^Otter/.test(l));
  ok('F8c vendor column is no longer always empty', otterLine && otterLine.split(',')[1].length > 0, otterLine);
  ok('F8d replacement survives export', otterLine && /Teams built-in transcription/.test(otterLine), otterLine);

  // re-import that CSV and check every field comes back
  const rt = await p.evaluate(text => {
    register = [];
    document.getElementById('impMode').value = 'register';
    document.getElementById('impText').value = text;
    importCsv(text);
    return JSON.parse(JSON.stringify(register));
  }, csv);
  const otter = rt.filter(r => /Otter/.test(r.tool))[0];
  ok('F8e re-import restores vendor name', otter && otter.vendorName === 'Otter.ai', otter && otter.vendorName);
  ok('F8f re-import restores replacement', otter && otter.replacement === 'Teams built-in transcription', otter && otter.replacement);
  ok('F8g re-import restores review date', otter && otter.reviewDue === '2026-06-30', otter && otter.reviewDue);
  ok('F8h re-import restores source', otter && otter.source === 'oauth', otter && otter.source);

  // ---------------------------------------------------------------- F9 a v2.4 CSV (12 columns) still imports
  const oldCsv = 'tool,vendor,owner,users,data,account,vendor_handling,autonomy,radius,secrets,no_opt_out,standing_grant\nLegacy tool,LegacyCo,,26,2,3,2,1,1,0,0,0';
  const legacy = await p.evaluate(text => {
    register = [];
    document.getElementById('impMode').value = 'register';
    importCsv(text);
    return JSON.parse(JSON.stringify(register));
  }, oldCsv);
  ok('F9a a 12-column v2.4 export still imports', legacy.length === 1, JSON.stringify(legacy));
  ok('F9b legacy row gets empty follow-up fields, not undefined',
    legacy[0] && legacy[0].replacement === '' && legacy[0].reviewDue === '' && legacy[0].enforced === '' && legacy[0].source === '',
    JSON.stringify(legacy[0]));
  const legacyScore = await p.evaluate(() => scoreRow(register[0]).score);
  ok('F9c legacy row scores identically to v2.4 (2,3,2,1,1 = 63)', legacyScore === 63, String(legacyScore));

  // ---------------------------------------------------------------- F10 the CSV template matches the header count
  const tmpl = await p.evaluate(() => {
    document.getElementById('impMode').value = 'register';
    document.getElementById('tmplBtn').click();
    return document.getElementById('impText').value;
  });
  const tl = tmpl.split('\n');
  const hn = tl[0].split(',').length;
  ok('F10a template header has 19 columns', hn === 19, String(hn));
  ok('F10b every template row has the same column count', tl.slice(1).every(l => l.split(',').length === hn),
    tl.slice(1).map(l => l.split(',').length).join('/'));
  const tmplImported = await p.evaluate(text => { register = []; document.getElementById('impMode').value = 'register'; importCsv(text); return JSON.parse(JSON.stringify(register)); }, tmpl);
  ok('F10c the template imports cleanly', tmplImported.length === 2, JSON.stringify(tmplImported.length));
  ok('F10d the template demonstrates a replacement', tmplImported[0] && tmplImported[0].replacement === 'Teams transcription', tmplImported[0] && tmplImported[0].replacement);

  // ---------------------------------------------------------------- F11 save file v4 round trip
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(300);
  const st = await p.evaluate(() => JSON.stringify(currentState()));
  ok('F11a save file is version 4', JSON.parse(st).v === 4, String(JSON.parse(st).v));
  const restored = await p.evaluate(t => {
    register = [];
    restoreState(t);
    return JSON.parse(JSON.stringify(register));
  }, st);
  ok('F11b restore brings back every follow-up field',
    restored.length === 6 && restored.filter(r => /Otter/.test(r.tool))[0].replacement === 'Teams built-in transcription',
    JSON.stringify(restored.length));

  // a v3 save file with no follow-up fields still restores
  const v3 = JSON.stringify({ v: 3, plain: false, cats: [], maturity: {}, register: [{ tool: 'Old row', owner: '', users: 5, data: 2, account: 3, vendor: 2, autonomy: 1, radius: 1, secrets: false, noOptOut: false }] });
  const oldRestore = await p.evaluate(t => { restoreState(t); return JSON.parse(JSON.stringify(register)); }, v3);
  ok('F11c a v3 save file still restores', oldRestore.length === 1, JSON.stringify(oldRestore));
  ok('F11d and its missing fields are normalised to empty strings',
    oldRestore[0].replacement === '' && oldRestore[0].enforced === '' && oldRestore[0].vendorName === '',
    JSON.stringify(oldRestore[0]));

  // ---------------------------------------------------------------- F12 guided flow captures vendor and source
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(300);
  const guided = await p.evaluate(() => {
    setMode('guided'); gIndex = 0; renderGuided();
    return { vendor: !!document.getElementById('gVendor'), source: !!document.getElementById('gSource') };
  });
  ok('F12a guided step 1 has a vendor field', guided.vendor);
  ok('F12b guided step 1 has a source field', guided.source);
  const gAdded = await p.evaluate(() => {
    register = [];
    resetDraft();
    draft.tool = 'Guided test'; draft.vendorName = 'VendorCo'; draft.source = 'oauth'; draft.owner = 'Me'; draft.users = 4;
    DIMS.forEach(d => { draft[d.key] = 1; });
    gIndex = G_TOTAL - 1;
    guidedNext();
    return JSON.parse(JSON.stringify(register));
  });
  ok('F12c a guided row carries vendor, source and empty follow-up fields',
    gAdded.length === 1 && gAdded[0].vendorName === 'VendorCo' && gAdded[0].source === 'oauth' &&
    gAdded[0].replacement === '' && gAdded[0].reviewDue === '' && gAdded[0].enforced === '',
    JSON.stringify(gAdded[0]));

  // ---------------------------------------------------------------- F13 quick form captures vendor and source
  const qf = await p.evaluate(() => {
    register = [];
    setMode('form');
    document.getElementById('fTool').value = 'Form test';
    document.getElementById('fVendor').value = 'FormCo';
    document.getElementById('fOwner').value = 'Owner';
    document.getElementById('fUsers').value = '9';
    document.getElementById('fSource').value = 'endpoint';
    document.getElementById('addTool').click();
    return JSON.parse(JSON.stringify(register));
  });
  ok('F13a quick form row carries vendor and source',
    qf.length === 1 && qf[0].vendorName === 'FormCo' && qf[0].source === 'endpoint', JSON.stringify(qf[0]));
  ok('F13b quick form row starts with empty follow-up fields',
    qf[0].replacement === '' && qf[0].reviewDue === '' && qf[0].enforced === '', JSON.stringify(qf[0]));
  const cleared = await p.evaluate(() => document.getElementById('fVendor').value);
  ok('F13c the vendor box is cleared after adding', cleared === '', '"' + cleared + '"');

  // ---------------------------------------------------------------- F14 scoring is untouched by the new fields
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(300);
  const sweep = await p.evaluate(() => {
    const out = [];
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) for (let d = 0; d < 4; d++) for (let e = 0; e < 4; e++) {
      const bare = { tool: 'x', owner: 'o', users: 1, data: a, account: b, vendor: c, autonomy: d, radius: e, secrets: false, noOptOut: false, standing: false };
      const full = Object.assign({}, bare, { vendorName: 'V', source: 'oauth', replacement: 'Something', reviewDue: '2026-01-01', enforced: '2026-02-02' });
      const s1 = scoreRow(bare), s2 = scoreRow(full);
      if (s1.score !== s2.score || s1.bandIdx !== s2.bandIdx) out.push([a, b, c, d, e, s1.score, s2.score]);
    }
    return out;
  });
  ok('F14 all 1024 score combinations are identical with and without follow-up data', sweep.length === 0, JSON.stringify(sweep.slice(0, 3)));

  // ---------------------------------------------------------------- F15 plain English switches the new UI
  const plainTexts = await p.evaluate(() => {
    PLAIN = false; save('sapf.plain', false); renderAll();
    const pro = document.getElementById('fuCap').textContent;
    PLAIN = true; save('sapf.plain', true); renderAll();
    const plain = document.getElementById('fuCap').textContent;
    PLAIN = false; save('sapf.plain', false); renderAll();
    return { pro, plain };
  });
  ok('F15a the follow-up caption changes with the language switch', plainTexts.pro !== plainTexts.plain, plainTexts.plain.slice(0, 45));
  ok('F15b neither version is empty', plainTexts.pro.length > 20 && plainTexts.plain.length > 20);
  const noDash = await p.evaluate(() => document.body.innerText);
  ok('F15c no em or en dashes anywhere in the rendered page', !/[–—]/.test(noDash),
    (noDash.match(/.{0,30}[–—].{0,30}/g) || []).slice(0, 2).join(' // '));

  // ---------------------------------------------------------------- F16 schema table documents the new fields
  const fieldsTxt = await p.evaluate(() => document.getElementById('fieldBody').innerText);
  ok('F16a schema table lists replacement', /replacement/.test(fieldsTxt));
  ok('F16b schema table lists review_due', /review_due/.test(fieldsTxt));
  ok('F16c schema table lists enforced', /enforced/.test(fieldsTxt));
  ok('F16d schema table still lists source', /source/.test(fieldsTxt));

  // ---------------------------------------------------------------- F17 print summary carries the follow-up state
  const printTxt = await p.evaluate(() => { renderPrint(); return document.getElementById('printOut').innerText; });
  ok('F17a print summary has an Open actions section', /Open actions/.test(printTxt));
  ok('F17b print summary names rows with no alternative', /NONE NAMED|names an alternative/.test(printTxt));
  ok('F17c print register table has the Instead use column', /Instead use/.test(printTxt));

  // ---------------------------------------------------------------- F18 ticket summary carries it too
  // intercept the clipboard so we read the real text the button produces
  const mdText = await p.evaluate(async () => {
    let captured = '';
    const realWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = t => { captured = t; return Promise.resolve(); };
    document.getElementById('expMd').click();
    await new Promise(r => setTimeout(r, 50));
    navigator.clipboard.writeText = realWrite;
    return captured;
  });
  ok('F18a ticket summary counts rows with no safer option', /No safer option named: \d+/.test(mdText), mdText.split('\n')[5]);
  ok('F18b ticket summary counts overdue reviews', /Overdue for review: \d+/.test(mdText), mdText.split('\n')[6]);
  ok('F18c ticket summary counts decided-not-done', /Decided, not done: \d+/.test(mdText), mdText.split('\n')[7]);
  ok('F18d ticket summary flags a High row with no replacement', /NO REPLACEMENT NAMED/.test(mdText),
    (mdText.split('\n').find(l => /NO REPLACEMENT/.test(l)) || 'none').slice(0, 110));
  ok('F18e ticket summary marks open rows as OPEN', /\| OPEN/.test(mdText), (mdText.split('\n').find(l => /OPEN/.test(l)) || 'none').slice(0, 110));

  // ---------------------------------------------------------------- F19 mobile: no horizontal overflow with the new tiles
  const mob = await ctx.newPage();
  await mob.setViewportSize({ width: 390, height: 844 });
  await mob.goto(P, { waitUntil: 'load' });
  await mob.waitForTimeout(400);
  const ov = await mob.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok('F19a no horizontal overflow at 390px', ov.sw <= ov.cw + 1, ov.sw + ' vs ' + ov.cw);
  const tilesFit = await mob.evaluate(() => {
    const t = document.querySelectorAll('.tiles.fu .tile');
    if (t.length !== 4) return 'wrong count ' + t.length;
    const r = [...t].map(e => e.getBoundingClientRect());
    return r.every(x => x.width > 40 && x.height > 20) ? 'ok' : JSON.stringify(r.map(x => [x.width, x.height]));
  });
  ok('F19b the three follow-up tiles all render on a phone', tilesFit === 'ok', String(tilesFit));

  // open the editor on a phone and check it does not overflow
  const mobEdit = await mob.evaluate(() => {
    const btn = [...document.querySelectorAll('#regBody button')].find(b => /Plan/.test(b.textContent));
    if (!btn) return 'no plan button';
    btn.click();
    return 'clicked';
  });
  await mob.waitForTimeout(200);
  const ov2 = await mob.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, ed: !!document.querySelector('tr.fuedit') }));
  ok('F19c the plan panel opens on a phone', mobEdit === 'clicked' && ov2.ed === true, mobEdit + ' ' + ov2.ed);
  ok('F19d the plan panel does not cause horizontal overflow', ov2.sw <= ov2.cw + 1, ov2.sw + ' vs ' + ov2.cw);

  // ---------------------------------------------------------------- F20 keyboard: the Plan button is a real button with a label
  const a11y = await p.evaluate(() => {
    const btns = [...document.querySelectorAll('#regBody button')].filter(b => /Plan|Close/.test(b.textContent));
    return btns.map(b => ({ tag: b.tagName, label: b.getAttribute('aria-label') || '', exp: b.getAttribute('aria-expanded') }));
  });
  ok('F20a every Plan button is a <button>', a11y.length > 0 && a11y.every(x => x.tag === 'BUTTON'), JSON.stringify(a11y.slice(0, 2)));
  ok('F20b every Plan button names its row', a11y.every(x => x.label.length > 6), JSON.stringify(a11y.slice(0, 2)));
  ok('F20c every Plan button reports expanded state', a11y.every(x => x.exp === 'true' || x.exp === 'false'), JSON.stringify(a11y.slice(0, 2)));
  const labelled = await p.evaluate(() => {
    const btn = [...document.querySelectorAll('#regBody button')].find(b => /Plan/.test(b.textContent));
    btn.click();
    const ids = ['fu_rep', 'fu_due', 'fu_enf', 'fu_ven', 'fu_src'];
    return ids.map(i => {
      const e = document.getElementById(i);
      if (!e) return i + ':missing';
      const l = document.querySelector('label[for="' + i + '"]');
      return l && l.textContent.trim().length > 2 ? 'ok' : i + ':unlabelled';
    });
  });
  ok('F20d every field in the plan panel has a label', labelled.every(x => x === 'ok'), labelled.join(','));

  // ---------------------------------------------------------------- F21 no errors accumulated
  ok('F21 still no uncaught JS errors after all interaction', pageErrs.length === 0, pageErrs.join(' | '));

  await b.close();
  console.log('PASS ' + pass.length + '   FAIL ' + fail.length);
  if (fail.length) { console.log('\nFAILURES:'); fail.forEach(f => console.log('  - ' + f)); }
  else console.log('\n' + pass.map(x => '  ' + x).join('\n'));
})();
