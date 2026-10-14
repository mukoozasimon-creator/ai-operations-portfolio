const { chromium } = require('playwright');
const P = new URL('../index.html', 'file://' + __filename).href;
const pass = [], fail = [];
const ok = (n, c, d) => (c ? pass : fail).push(n + (d ? ' :: ' + d : ''));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(P, { waitUntil: 'load' });
  await p.waitForTimeout(500);

  ok('G1 no JS errors with the explainer merged in', errs.length === 0, errs.join(' | '));

  // ---------------------------------------------------------- G2 words got linked
  const linked = await p.evaluate(() => [...document.querySelectorAll('button.lgw')].map(b => ({
    text: b.textContent, id: b.getAttribute('data-lg')
  })));
  ok('G2a a useful number of terms were linked', linked.length >= 22, linked.length + ' linked');
  // Each term may be marked twice in the DOM, once in the professional copy and
  // once in the plain English copy, but only one of those is ever on screen.
  const perSide = await p.evaluate(() => {
    const pro = {}, plain = {}, visible = {};
    document.querySelectorAll('button.lgw').forEach(b => {
      const id = b.getAttribute('data-lg');
      const bucket = b.closest('.plain-only') ? plain : pro;
      bucket[id] = (bucket[id] || 0) + 1;
      if (b.offsetParent !== null) visible[id] = (visible[id] || 0) + 1;
    });
    return {
      proRepeats: Object.keys(pro).filter(k => pro[k] > 1),
      plainRepeats: Object.keys(plain).filter(k => plain[k] > 1),
      visRepeats: Object.keys(visible).filter(k => visible[k] > 1)
    };
  });
  ok('G2b no word is marked twice in the same copy of the prose',
    perSide.proRepeats.length === 0 && perSide.plainRepeats.length === 0,
    JSON.stringify(perSide));
  ok('G2b2 and the reader never sees the same word marked twice',
    perSide.visRepeats.length === 0, perSide.visRepeats.join(','));
  ok('G2c every marker carries a known term id',
    linked.every(l => l.id && l.text), JSON.stringify(linked.slice(0, 3)));
  const unknown = await p.evaluate(() =>
    [...document.querySelectorAll('button.lgw')].filter(b => !LGTERMS.some(t => t.id === b.getAttribute('data-lg'))).length);
  ok('G2d no marker points at a term that does not exist', unknown === 0, String(unknown));

  // the linked text must actually be the word, not a fragment of another word
  const fragments = await p.evaluate(() =>
    [...document.querySelectorAll('button.lgw')].filter(b => {
      const t = LGTERMS.filter(x => x.id === b.getAttribute('data-lg'))[0];
      const names = [t.term].concat(t.also || []).map(s => s.toLowerCase());
      return !names.includes(b.textContent.toLowerCase());
    }).map(b => b.textContent));
  ok('G2e every marker wraps a whole word, not part of one', fragments.length === 0, fragments.join(','));

  // ---------------------------------------------------------- G3 nothing was linked where it must not be
  const forbidden = await p.evaluate(() =>
    [...document.querySelectorAll('button.lgw')]
      .filter(b => b.closest('.panel, #dict, a, code, .mono'))
      .map(b => b.textContent + ' in ' + (b.closest('.panel') ? 'panel' : b.closest('#dict') ? 'dictionary' : b.closest('a') ? 'link' : 'code')));
  ok('G3a nothing was linked inside a panel, the dictionary, a link or code', forbidden.length === 0, forbidden.join(' | '));

  // the reference tables carry the densest jargon, so they must be covered
  const inTables = await p.evaluate(() =>
    [...document.querySelectorAll('table td button.lgw')].map(b => b.textContent));
  ok('G3c the reference tables are linked too', inTables.length >= 6, inTables.join(', '));

  // tables are rebuilt from data on every render, so linking must survive that
  const tableRerender = await p.evaluate(() => {
    const before = document.querySelectorAll('table td button.lgw').length;
    renderAll();
    const after = document.querySelectorAll('table td button.lgw').length;
    renderAll(); renderAll();
    return { before, after, afterThree: document.querySelectorAll('table td button.lgw').length };
  });
  ok('G3d table markers are restored after a render, and never multiply',
    tableRerender.after === tableRerender.before && tableRerender.afterThree === tableRerender.before,
    JSON.stringify(tableRerender));

  const nested = await p.evaluate(() => document.querySelectorAll('button.lgw button').length);
  ok('G3b no marker sits inside another marker', nested === 0, String(nested));

  // ---------------------------------------------------------- G4 the popover
  const popped = await p.evaluate(() => {
    const b = document.querySelector('button.lgw');
    b.click();
    const pop = document.getElementById('lgpop');
    return {
      open: !!pop,
      expanded: b.getAttribute('aria-expanded'),
      title: pop ? pop.querySelector('.lgt').textContent : null,
      keys: pop ? [...pop.querySelectorAll('.lgk')].map(k => k.textContent) : [],
      paras: pop ? [...pop.querySelectorAll('p')].map(x => x.textContent.length) : [],
      role: pop ? pop.getAttribute('role') : null
    };
  });
  ok('G4a clicking a word opens the explanation', popped.open && popped.expanded === 'true', JSON.stringify(popped.expanded));
  ok('G4b it names the term', popped.title && popped.title.length > 0, popped.title);
  ok('G4c it shows what it is and the catch, in that order',
    popped.keys.join('|') === 'What it is|The catch', popped.keys.join('|'));
  ok('G4d both have real text', popped.paras.length === 2 && popped.paras.every(l => l > 25), JSON.stringify(popped.paras));
  ok('G4e it is announced as a dialog', popped.role === 'dialog', popped.role);

  // content must match the shared data exactly, not a retyped copy
  const matches = await p.evaluate(() => {
    const b = document.querySelector('button.lgw');
    const t = LGTERMS.filter(x => x.id === b.getAttribute('data-lg'))[0];
    const pop = document.getElementById('lgpop');
    const ps = [...pop.querySelectorAll('p')].map(x => x.textContent);
    return { lede: ps[0] === t.lede, cat: ps[1] === t['catch'] };
  });
  ok('G4f the text comes straight from the shared data', matches.lede && matches.cat, JSON.stringify(matches));

  // ---------------------------------------------------------- G5 closing
  const closes = await p.evaluate(() => {
    const out = {};
    const b = document.querySelector('button.lgw');
    b.click(); out.afterSecondClick = !!document.getElementById('lgpop');   // toggles shut
    b.click(); document.querySelector('h1').click();
    out.afterOutsideClick = !!document.getElementById('lgpop');
    b.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    out.afterEscape = !!document.getElementById('lgpop');
    return out;
  });
  ok('G5a clicking the word again closes it', closes.afterSecondClick === false);
  ok('G5b clicking elsewhere closes it', closes.afterOutsideClick === false);
  ok('G5c Escape closes it', closes.afterEscape === false);

  const onlyOne = await p.evaluate(() => {
    const bs = [...document.querySelectorAll('button.lgw')];
    bs[0].click(); bs[1].click();
    return { pops: document.querySelectorAll('#lgpop').length, firstState: bs[0].getAttribute('aria-expanded'), secondState: bs[1].getAttribute('aria-expanded') };
  });
  ok('G5d opening a second word replaces the first, never stacks',
    onlyOne.pops === 1 && onlyOne.firstState === 'false' && onlyOne.secondState === 'true', JSON.stringify(onlyOne));

  // ---------------------------------------------------------- G6 keyboard
  await p.evaluate(() => { document.getElementById('lgpop') && lgClose(); });
  const kb = await p.evaluate(() => {
    const b = document.querySelector('button.lgw');
    b.focus();
    const focused = document.activeElement === b;
    b.click();
    const pop = !!document.getElementById('lgpop');
    const closeBtn = document.querySelector('#lgpop .lgx');
    closeBtn.click();
    return { focused, pop, gone: !document.getElementById('lgpop'), backTo: document.activeElement.className };
  });
  ok('G6a a marker is focusable', kb.focused);
  ok('G6b it opens from the keyboard', kb.pop);
  ok('G6c the close button works and returns focus to the word', kb.gone && /lgw/.test(kb.backTo), JSON.stringify(kb));

  const named = await p.evaluate(() =>
    [...document.querySelectorAll('button.lgw')].filter(b => !b.getAttribute('aria-label')).length);
  ok('G6d every marker has an accessible label', named === 0, String(named));

  // ---------------------------------------------------------- G7 link out is configurable and honest
  const noUrl = await p.evaluate(() => {
    lgClose();
    document.querySelector('button.lgw').click();
    const foot = document.querySelector('#lgpop .lgfoot');
    return { hasLink: !!foot.querySelector('a'), note: foot.querySelector('.lgnote') ? foot.querySelector('.lgnote').textContent : null };
  });
  ok('G7a with no address set, no dead link is offered', noUrl.hasLink === false, JSON.stringify(noUrl.hasLink));
  ok('G7b it still says where the full entry lives', noUrl.note && /Level Ground/.test(noUrl.note), noUrl.note);

  const withUrl = await p.evaluate(() => {
    lgClose();
    LG_URL = 'https://example.test/level-ground';
    const b = document.querySelector('button.lgw');
    b.click();
    const a = document.querySelector('#lgpop .lgfoot a');
    const id = b.getAttribute('data-lg');
    const r = { href: a ? a.getAttribute('href') : null, target: a ? a.target : null, rel: a ? a.rel : null, id: id };
    LG_URL = '';
    lgClose();
    return r;
  });
  ok('G7c once an address is set the link appears and deep links to the word',
    withUrl.href === 'https://example.test/level-ground#term/' + withUrl.id, withUrl.href);
  ok('G7d the link opens safely in a new tab', withUrl.target === '_blank' && /noopener/.test(withUrl.rel), JSON.stringify(withUrl));

  // ---------------------------------------------------------- G8 Plain English still works
  const plainSwap = await p.evaluate(() => {
    const before = document.querySelectorAll('button.lgw').length;
    document.getElementById('plainToggle').checked = true;
    document.getElementById('plainToggle').dispatchEvent(new Event('change', { bubbles: true }));
    const afterPlain = document.querySelectorAll('button.lgw').length;
    document.getElementById('plainToggle').checked = false;
    document.getElementById('plainToggle').dispatchEvent(new Event('change', { bubbles: true }));
    return { before, afterPlain, afterBack: document.querySelectorAll('button.lgw').length };
  });
  // The two registers do not carry the same jargon, so the count legitimately
  // differs between them. What must hold is that switching and switching back
  // lands exactly where it started, with nothing accumulated or lost.
  ok('G8a switching language and back leaves the markers exactly as they were',
    plainSwap.before === plainSwap.afterBack, JSON.stringify(plainSwap));
  ok('G8a2 and both registers carry markers', plainSwap.afterPlain > 0, JSON.stringify(plainSwap.afterPlain));

  const plainVisible = await p.evaluate(() => {
    document.getElementById('plainToggle').checked = true;
    document.getElementById('plainToggle').dispatchEvent(new Event('change', { bubbles: true }));
    const vis = [...document.querySelectorAll('button.lgw')].filter(b => b.offsetParent !== null).length;
    document.getElementById('plainToggle').checked = false;
    document.getElementById('plainToggle').dispatchEvent(new Event('change', { bubbles: true }));
    return vis;
  });
  ok('G8b words are linked in the plain English text too', plainVisible > 0, String(plainVisible) + ' visible in plain mode');

  // re-running the linker must not double up
  const rerun = await p.evaluate(() => {
    const before = document.querySelectorAll('button.lgw').length;
    lgInit(); lgInit();
    return { before, after: document.querySelectorAll('button.lgw').length };
  });
  ok('G8c calling the linker again is a no-op', rerun.before === rerun.after, JSON.stringify(rerun));

  const afterRender = await p.evaluate(() => {
    const before = document.querySelectorAll('button.lgw').length;
    renderAll();
    return { before, after: document.querySelectorAll('button.lgw').length };
  });
  ok('G8d a full re-render of the tables and panels leaves the prose markers intact',
    afterRender.before === afterRender.after, JSON.stringify(afterRender));

  // ---------------------------------------------------------- G9 the page still reads correctly
  const textIntact = await p.evaluate(() => {
    const t = document.body.innerText;
    return { hasOauth: /OAuth/.test(t), hasDash: /[–—]/.test(t), len: t.length };
  });
  ok('G9a the prose still reads as prose', textIntact.hasOauth && textIntact.len > 5000, JSON.stringify(textIntact.len));
  ok('G9b no em or en dashes introduced', textIntact.hasDash === false);

  // ---------------------------------------------------------- G10 mobile
  const mob = await ctx.newPage();
  await mob.setViewportSize({ width: 390, height: 844 });
  await mob.goto(P, { waitUntil: 'load' });
  await mob.waitForTimeout(500);
  const mobOv = await mob.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok('G10a no horizontal overflow at 390px with markers present', mobOv.sw <= mobOv.cw + 1, JSON.stringify(mobOv));

  const mobPop = await mob.evaluate(() => {
    const b = document.querySelector('button.lgw');
    b.scrollIntoView({ block: 'center' });
    b.click();
    const pop = document.getElementById('lgpop');
    const r = pop.getBoundingClientRect();
    return { open: !!pop, left: Math.round(r.left), right: Math.round(r.right), vw: window.innerWidth,
             sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth };
  });
  ok('G10b the explanation opens on a phone', mobPop.open);
  ok('G10c it stays inside the screen', mobPop.left >= -1 && mobPop.right <= mobPop.vw + 1, JSON.stringify(mobPop));
  ok('G10d it does not cause horizontal overflow', mobPop.sw <= mobPop.cw + 1, JSON.stringify(mobPop));

  // ---------------------------------------------------------- G11 dark mode
  const dctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  const dp = await dctx.newPage();
  await dp.goto(P, { waitUntil: 'load' });
  await dp.waitForTimeout(400);
  const darkPop = await dp.evaluate(() => {
    document.querySelector('button.lgw').click();
    const pop = document.getElementById('lgpop');
    return { bg: getComputedStyle(pop).backgroundColor, fg: getComputedStyle(pop.querySelector('p')).color };
  });
  ok('G11 the explanation is not left painted white in dark mode', !/255, 255, 255/.test(darkPop.bg), JSON.stringify(darkPop));
  await dctx.close();

  ok('G12 still no JS errors after everything', errs.length === 0, errs.join(' | '));

  await b.close();
  console.log('PASS ' + pass.length + '   FAIL ' + fail.length);
  if (fail.length) { console.log('\nFAILURES:'); fail.forEach(f => console.log('  - ' + f)); }
  else console.log('\nlinked words: ' + linked.map(l => l.text).join(', '));
})();
