const main=document.querySelector('main'),note=document.querySelector('dialog');
const icons={people:'<circle cx="9" cy="8" r="3"/><circle cx="20" cy="10" r="2.5"/><path d="M3 24v-4a6 6 0 0 1 12 0v4M18 17a5 5 0 0 1 7 4v3"/>',connections:'<path d="M11 18l7-7M9 20l-1 1a5 5 0 0 1-7-7l5-5a5 5 0 0 1 7 0M16 8l1-1a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7 0"/>',progress:'<path d="M3 24h22M6 20v-5M14 20V9M22 20V3"/>',care:'<path d="M14 2l10 4v8c0 6-10 12-10 12S4 20 4 14V6zM9 13l4 4 6-7"/>'};
const glyph=k=>`<span class="glyph" aria-hidden="true"><svg viewBox="0 0 28 28">${icons[k]}</svg></span>`;
const data={
people:{name:'People',color:'Teal',verb:'Who is here?',title:'Know who can help.',copy:'See each person’s experience, interests and availability before making a connection.',nodes:[['MR','Maya','Looking for advice'],['AO','Amara','Open to helping']],example:'Maya is exploring operations. Amara has relevant experience and room for a conversation.',features:[['Member Network','members','Explore the sample profiles and who is open to introductions.'],['Users and Access','users','See how access and onboarding are organised.']]},
connections:{name:'Connections',color:'Blue',verb:'Who could connect?',title:'Give an introduction a reason.',copy:'Find a possible match, understand the suggestion, then let a person review the introduction.',nodes:[['MR','Maya','Needs perspective'],['AO','Amara','Shares experience']],example:'Their shared background suggests a conversation. A match is a possibility, not a decision.',features:[['AI Match','match','Explore the existing illustrative match suggestions.'],['Introduction Pipeline','intros','See the stages from a suggested match to a recorded outcome.'],['Career Conversations','conversations','See sample conversations and the people involved.']]},
progress:{name:'Progress',color:'Amber',verb:'What happens next?',title:'Keep the next step visible.',copy:'Track conversations, hiring activity and follow-ups, with a clear owner for the work.',nodes:[['1','Introduced','Jordan owns it'],['2','Conversation','Next step logged']],example:'After the introduction, Jordan follows up and records whether the conversation helped.',features:[['Hiring Rounds','hiring','Explore the sample hiring activity.'],['Follow-ups and Flows','automation','See the proposed reminders and follow-up workflows.'],['Recorded Outcomes','intros','Return to the pipeline and its outcome stage.']]},
care:{name:'Care',color:'Violet',verb:'Is the work sustainable?',title:'Keep people in control.',copy:'Check workload, review important actions and learn from what did not go as planned.',nodes:[['3','Ming','Open conversations'],['1','Amara','Room to help']],example:'Check availability before adding work. Every introduction still needs a human review.',features:[['Workload','overview','See the existing dashboard, including workload balance.'],['Trust Layer','trust','Explore the modelled checks and human approval steps.'],['Learning Log','learning','See sample lessons and what would change next time.'],['Learn the System','learn','Search the built-in explanations.'],['Database Layout','schema','Understand how the example records connect.']]}};
const keys=Object.keys(data),modes=['compass'];let mode='compass',selected=null,feature=0,lessonIndex=0,lastSelection={};
const legacyViews={overview:'people',members:'people',users:'people',match:'connections',intros:'connections',conversations:'connections',hiring:'progress',automation:'progress',trust:'care',learning:'care',learn:'care',schema:'care'};
const legacyView=location.hash.slice(1);
if(Object.hasOwn(legacyViews,legacyView))history.replaceState(null,'','#compass/workspace/'+legacyView+'/'+legacyViews[legacyView]);
const introText='TalentSync helps a team connect people with useful experience, organise introductions and follow up so nobody gets forgotten.';
function header(){return '<header class="appbar"><div class="brand-lockup"><div class="brand">TalentSync <b>Ops</b></div><p class="audience">For people, talent &amp; customer success teams.</p></div><a class="quiet-link" href="#'+mode+'/workspace/overview/people">Open workspace ↗</a></header>'}
function footer(){return '<footer class="footer"><span>Designed by Simon Mukooza</span><button id="notes">About TalentSync</button><span>Concept preview · Fictional data · Nothing is sent</span></footer>'}
function intro(sub){return `<div class="intro"><h1>What can you do with TalentSync?</h1><p>${introText}</p><div class="hint">${sub}</div></div>`}
function contextButton(k,extra=''){const d=data[k];return `<button class="context ${k} select-context" data-context="${k}" aria-pressed="${selected===k}" aria-label="Explore ${d.name}">${extra}${glyph(k)}<strong>${d.name}</strong><small>${d.verb}</small></button>`}
// Invisible native-button hit areas follow the photographic flower's four bracts.
// Clip the approved photograph into complementary display layers, without editing the asset.
// Shared boundaries follow the petal seams; the central florets stay anchored.
function flowerArt(){
 const seams={
  people:'M0 0H685V224C652 304 650 400 644 505L644 600L520 625Q420 634 322 675H0Z',
  connections:'M685 0H1308V575H970L770 618L644 600V505C650 400 652 304 685 224Z',
  progress:'M0 675H322Q420 634 520 625L644 600V755Q645 900 584 1000L550 1202H0Z',
  care:'M644 600L770 618L970 575H1308V1202H550L584 1000Q645 900 644 755Z'
 };
 return `<svg class="dogwood-art" viewBox="0 0 1308 1202" aria-hidden="true" focusable="false"><defs>${keys.map(k=>`<clipPath id="flower-${k}"><path d="${seams[k]}"/></clipPath>`).join('')}<clipPath id="flower-heart"><path d="M589 482Q585 457 610 453Q630 452 633 485L651 496Q657 477 678 481Q699 487 691 510L720 494L734 506L719 525Q752 514 764 534L751 554L769 569L753 588L771 612Q797 612 793 640L771 655L756 651L765 678L745 693L722 688L710 711L687 707L692 742Q686 763 665 757L647 727L629 711L612 727L591 722L580 700L560 700L557 677L534 679L526 657L536 646L510 643L502 623L520 606L504 592L500 571L516 560L539 568L535 541L551 529L534 517L526 504L543 499L542 480L557 475L568 495L589 499Z"/></clipPath></defs>${keys.map(k=>`<g class="petal-art ${k}"><image href="assets/dogwood-lettered-approved.png" width="1308" height="1202" clip-path="url(#flower-${k})"/></g>`).join('')}<image href="assets/dogwood-lettered-approved.png" width="1308" height="1202" clip-path="url(#flower-heart)"/></svg>`;
}
function flowerButton(k){const d=data[k];return `<button class="context ${k} select-context petal" data-context="${k}" aria-pressed="${selected===k}" aria-label="Explore ${d.name}"></button>`}
function detail(k){const d=data[k],f=d.features[feature]||d.features[0];return `<section class="detail context ${k}" aria-label="${d.name} explained"><div class="detail-top"><div class="label">${glyph(k)}${d.name}</div><button class="tag" data-puzzle="${k}" aria-label="${d.color} = ${d.name.toLowerCase()}: open a short puzzle" aria-haspopup="dialog" title="A little puzzle inside">${d.color} = ${d.name.toLowerCase()} <span aria-hidden="true">◇</span></button></div><h2 tabindex="-1">${d.title}</h2><p>${d.copy}</p><div class="features" aria-label="${d.name} features">${d.features.map((x,i)=>`<button data-feature="${i}" aria-pressed="${i===feature}">${x[0]}</button>`).join('')}</div><div class="example"><small>HOW IT FITS / FICTIONAL EXAMPLE</small><div class="visual">${d.nodes.map((n,i)=>`${i?'<span class="join" aria-hidden="true">'+(k==='people'?'·':'→')+'</span>':''}<div class="node"><span class="initial">${n[0]}</span>${n[1]}<small>${n[2]}</small></div>`).join('')}</div><p>${d.example}</p></div><div class="detail-bottom"><span class="step-counter">${f[2]}</span><a class="primary" href="#${mode}/workspace/${f[1]}/${k}">Open ${f[0]} <span aria-hidden="true">→</span></a></div></section>`}
function render(){const parts=location.hash.slice(1).split('/');mode=modes.includes(parts[0])?parts[0]:'compass';document.querySelectorAll('.study nav a').forEach(a=>{if(a.hash==='#'+mode)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});if(parts[1]==='workspace'){workspace(parts[2],parts[3]);return}main.className='';if(mode==='walkthrough'){selected=keys[lessonIndex]}else selected=lastSelection[mode]||null;
let content='';if(mode==='compass'){content=intro('Choose a petal to explore.')+`<div class="compass-content ${selected?'':'is-unselected'}"><div><div class="compass-wheel flower" role="group" aria-label="Explore the four parts of TalentSync">${flowerArt()}${keys.map(k=>flowerButton(k)).join('')}<button id="reset-flower" class="flower-reset" type="button" aria-label="Restore all four petals" title="Restore all four petals"></button></div><p class="wheel-note">Four parts. One connected network.</p><details class="text-navigation"><summary>Use text navigation</summary><div>${keys.map(k=>`<button data-context="${k}" aria-pressed="${selected===k}">${data[k].name}</button>`).join('')}</div></details></div>${selected?`<div id="reveal">${detail(selected)}</div>`:''}</div>`}
if(mode==='chapters'){content=intro('Open one chapter at a time. Its colour follows you into the app.')+'<div class="chapter-list">'+keys.map((k,i)=>`<section class="chapter context ${k}"><button class="select-context context ${k}" data-context="${k}" aria-expanded="${selected===k}" aria-controls="chapter-${k}"><span class="num">0${i+1}</span>${glyph(k)}<strong>${data[k].name}</strong><small>${data[k].verb}</small><span class="expand" aria-hidden="true">${selected===k?'−':'+'}</span></button>${selected===k?`<div id="chapter-${k}" class="chapter-panel">${detail(k)}</div>`:`<div id="chapter-${k}" hidden></div>`}</section>`).join('')+'</div>'}
if(mode==='walkthrough'){content=intro('Meet the four parts at your own pace. Start anywhere or follow the steps.')+`<div class="lesson"><div class="lesson-tabs" aria-label="Choose a part">${keys.map(k=>`<button class="context ${k} select-context" data-context="${k}" aria-pressed="${selected===k}">${glyph(k)}<strong>${data[k].name}</strong></button>`).join('')}</div>${detail(selected)}<div class="lesson-controls"><button data-previous ${lessonIndex===0?'disabled':''}>← Previous</button><span>Part ${lessonIndex+1} of 4 · No rush</span><button data-next>${lessonIndex===3?'Start again ↺':'Next part →'}</button></div></div>`}
if(mode==='map'){content=intro('See how the parts relate. Select an area to discover the features inside.')+`<div class="map-area ${selected?'':'is-unselected'}"><div class="network-map"><svg class="map-lines" viewBox="0 0 500 360" preserveAspectRatio="none" aria-hidden="true"><path d="M100 75H400V285H100V75M100 75L400 285M400 75L100 285"/></svg>${keys.map(k=>contextButton(k)).join('')}<span class="map-center">One connected workflow</span></div>${selected?`<div id="reveal">${detail(selected)}</div>`:''}<p class="map-note">People lead to connections. Progress and care keep the work moving.</p></div>`}
main.innerHTML=`<section class="app ${mode}-app">${header()}${content}${footer()}</section>`;document.title='TalentSync | Explore';}
function workspace(view,k){const allowed=['overview','members','users','match','intros','conversations','hiring','automation','trust','learning','learn','schema'];if(!allowed.includes(view))view='overview';if(!keys.includes(k))k='people';main.className='workspace-mode';main.innerHTML=`<div class="workspace-bar context ${k}"><a href="#${mode}">← Back to introduction</a>${glyph(k)}<strong>${data[k].name}</strong><small>Workspace preview · Sample data</small></div><iframe title="TalentSync workspace" class="workspace-frame" src="workspace.html?context=${k}#${view}"></iframe>`;document.title='TalentSync | Workspace';}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='reset-flower'){lastSelection[mode]=null;selected=null;feature=0;render();main.querySelector('#reset-flower')?.focus({preventScroll:true});return;}if(b.dataset.context){const fromText=!!b.closest('.text-navigation');const k=b.dataset.context;if(!keys.includes(k))return;feature=0;if(mode==='walkthrough'){lessonIndex=keys.indexOf(k)}else lastSelection[mode]=mode==='chapters'&&selected===k?null:k;render();if(fromText)main.querySelector('.text-navigation').open=true;const chosen=main.querySelector(fromText?`.text-navigation [data-context="${k}"]`:`.petal[data-context="${k}"]`);chosen?.focus({preventScroll:true});if(innerWidth<751){const target=mode==='chapters'?main.querySelector(`#chapter-${k}`):main.querySelector('.detail');if(target&&!target.hidden){target.scrollIntoView({block:'start',behavior:'instant'});target.querySelector('h2')?.focus({preventScroll:true})}}}
if(b.dataset.feature!==undefined){feature=Number(b.dataset.feature);render();main.querySelector(`[data-feature="${feature}"]`)?.focus({preventScroll:true})}
if(b.hasAttribute('data-next')||b.hasAttribute('data-previous')){lessonIndex=b.hasAttribute('data-next')?(lessonIndex+1)%4:Math.max(0,lessonIndex-1);feature=0;render();main.querySelector('[data-next]')?.focus({preventScroll:true})}
if(b.id==='notes'){document.querySelector('#note-body').innerHTML='<p>TalentSync is a concept for teams connecting people, organising introductions and following through. The preview uses fictional data; nothing is sent.</p><p>The flower has four choices: People, Connections, Progress and Care. Each colour keeps its meaning inside the workspace. Names and symbols accompany the colours.</p><p>The photographic flower was adapted from a flowering dogwood reference using AI image editing. Its bold colours represent the app contexts. Botanical references: NC State Extension Plant Toolbox.</p><p>Puzzle themes include skills, AI-assisted work, human review and capacity. Fictional scenarios, informed by Microsoft’s 2026 Work Trend Index and the World Economic Forum’s Four Futures for Jobs in the New Economy: AI and Talent in 2030 (2026). These are original logic puzzles, not questions taken from those reports. Reviewed 2 October 2026.</p>';note.showModal()}
if(b.id==='close-note')note.close();});
window.addEventListener('hashchange',()=>{if(location.hash==='#main')return;feature=0;render();window.scrollTo(0,0)});render();

// Each colour keeps its own place. Storage is optional; memory still works if it is blocked.
const puzzleDialog=document.querySelector('#puzzle');
const progressKey='talentsync-puzzles-v2';
let puzzleProgress={};
try {
  const raw=localStorage.getItem(progressKey)||'{}';
  const saved=raw.length<=16000?JSON.parse(raw):{};
  for(const k of keys){const s=saved?.[k];if(s&&Number.isSafeInteger(s.index)&&s.index>=0&&s.index<1000000)puzzleProgress[k]={index:s.index,solved:s.solved===true};}
} catch { /* Storage is optional for these local puzzles. */ }
let activePuzzle=null,currentChallenge=null,plainWording=false;
function savePuzzleProgress(){try{localStorage.setItem(progressKey,JSON.stringify(puzzleProgress));}catch{/* Keep in-memory progress. */}}
function questionMarkup(p){
  if(!plainWording)return `<p class="puzzle-prompt">${p.prompt}</p><ul class="puzzle-clues">${p.clues.map(c=>`<li>${c}</li>`).join('')}</ul>`;
  return `<div class="puzzle-scenario"><span>Picture this</span><p>${p.plain.scenario}</p></div><p class="puzzle-prompt">${p.plain.intro}</p><ol class="puzzle-steps">${p.plain.steps.map(s=>`<li>${s}</li>`).join('')}</ol><ul class="puzzle-clues plain-clues">${p.plain.clues.map(c=>`<li>${c}</li>`).join('')}</ul>`;
}
function renderPuzzle(){
  const state=puzzleProgress[activePuzzle],p=PuzzleEngine.get(activePuzzle,state.index);
  currentChallenge=p;
  puzzleDialog.className=`puzzle context ${activePuzzle}`;
  puzzleDialog.innerHTML=`<button class="puzzle-close" data-close-puzzle aria-label="Close puzzle">×</button><p class="eyebrow">${data[activePuzzle].name} · Cycle ${p.cycle} · ${p.round} of 3</p><div class="puzzle-level">${p.levelName}<span class="puzzle-dots" aria-hidden="true">${[1,2,3,4].map(n=>`<i class="${n<=p.level?'filled':''}"></i>`).join('')}</span></div><h2 id="puzzle-title" tabindex="-1">${p.title}</h2><button class="puzzle-flip" data-flip-question aria-pressed="${plainWording}" aria-controls="puzzle-question">${plainWording?'Original wording':'Break it down'} <span aria-hidden="true">↔</span></button><div id="puzzle-question" aria-live="polite">${questionMarkup(p)}</div><div class="puzzle-answers" aria-label="Choose an answer">${p.answers.map((a,i)=>`<button data-answer="${i}" aria-pressed="${state.solved&&i===p.correct}" ${state.solved?'disabled':''}>${a}</button>`).join('')}</div><button class="puzzle-hint" data-hint aria-expanded="false" aria-controls="puzzle-hint-text">A small hint</button><p id="puzzle-hint-text" hidden>${plainWording?p.plain.hint:p.hint}</p><p class="puzzle-feedback" role="status" aria-live="polite">${state.solved?p.feedback[p.correct]:''}</p><p class="puzzle-lesson" ${state.solved?'':'hidden'}>${p.lesson}</p><div class="puzzle-bottom"><button class="puzzle-return" data-close-puzzle>Back to exploring</button><button class="primary" data-next-challenge ${state.solved?'':'hidden'}>${p.round===3?'Next cycle':'Next challenge'} →</button></div><button class="puzzle-restart" data-restart-puzzles aria-expanded="false">Restart this path</button><div class="restart-confirm" hidden><p>Start this path again from cycle 1?</p><button data-confirm-restart>Yes, restart</button><button data-cancel-restart>Keep my progress</button></div><p class="puzzle-source">Original fictional puzzles. Themes informed by Microsoft’s Work Trend Index (2026) and the World Economic Forum’s Four Futures for Jobs in the New Economy: AI and Talent in 2030 (2026).</p>`;
}
function openPuzzle(k){
  if(!keys.includes(k))return;
  activePuzzle=k;puzzleProgress[k]||={index:0,solved:false};
  renderPuzzle();puzzleDialog.showModal();
}
puzzleDialog.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const state=puzzleProgress[activePuzzle];
  if(b.hasAttribute('data-close-puzzle')){puzzleDialog.close();return;}
  if(b.hasAttribute('data-flip-question')){
    plainWording=!plainWording;
    b.setAttribute('aria-pressed',String(plainWording));
    b.innerHTML=`${plainWording?'Original wording':'Break it down'} <span aria-hidden="true">↔</span>`;
    puzzleDialog.querySelector('#puzzle-question').innerHTML=questionMarkup(currentChallenge);
    puzzleDialog.querySelector('#puzzle-hint-text').textContent=plainWording?currentChallenge.plain.hint:currentChallenge.hint;
    return;
  }
  if(b.hasAttribute('data-next-challenge')&&state.solved){
    state.index++;state.solved=false;savePuzzleProgress();renderPuzzle();
    puzzleDialog.scrollTop=0;puzzleDialog.querySelector('h2').focus({preventScroll:true});return;
  }
  if(b.hasAttribute('data-restart-puzzles')){puzzleDialog.querySelector('.restart-confirm').hidden=false;b.setAttribute('aria-expanded','true');puzzleDialog.querySelector('[data-cancel-restart]').focus();return;}
  if(b.hasAttribute('data-cancel-restart')){puzzleDialog.querySelector('.restart-confirm').hidden=true;const trigger=puzzleDialog.querySelector('[data-restart-puzzles]');trigger.setAttribute('aria-expanded','false');trigger.focus();return;}
  if(b.hasAttribute('data-confirm-restart')){
    puzzleProgress[activePuzzle]={index:0,solved:false};savePuzzleProgress();renderPuzzle();
    puzzleDialog.scrollTop=0;puzzleDialog.querySelector('h2').focus({preventScroll:true});return;
  }
  if(b.hasAttribute('data-hint')){
    const hint=puzzleDialog.querySelector('#puzzle-hint-text');hint.hidden=!hint.hidden;
    b.setAttribute('aria-expanded',String(!hint.hidden));b.textContent=hint.hidden?'A small hint':'Hide hint';return;
  }
  if(b.dataset.answer===undefined||state.solved)return;
  const p=currentChallenge,choice=Number(b.dataset.answer),solved=choice===p.correct;
  puzzleDialog.querySelectorAll('[data-answer]').forEach(a=>{a.setAttribute('aria-pressed',String(a===b));if(solved)a.disabled=true;});
  puzzleDialog.querySelector('.puzzle-feedback').textContent=p.feedback[choice];
  puzzleDialog.querySelector('.puzzle-lesson').hidden=!solved;
  if(solved){state.solved=true;savePuzzleProgress();const next=puzzleDialog.querySelector('[data-next-challenge]');next.hidden=false;next.focus({preventScroll:true});}
});
document.addEventListener('click',e=>{const pill=e.target.closest('[data-puzzle]');if(pill)openPuzzle(pill.dataset.puzzle);});
