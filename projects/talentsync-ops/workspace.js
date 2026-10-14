
    const META = {
        overview:      ['Dashboard', 'Fictional June 2026 snapshot - no live connections'],
        members:       ['Member Network', 'Fictional profiles in a proposed database layout'],
        intros:        ['Introduction Pipeline', 'Fictional introductions and outcomes'],
        hiring:        ['Hiring Rounds', 'Illustrative June 2026 hiring activity'],
        conversations: ['Career Conversations', 'Proposed scheduling via Zapier calendar sync'],
        match:         ['AI Match', 'Fixed examples of suggestions for human review'],
        automation:    ['Automation', '8 proposed Zapier flows, gated by human review'],
        trust:         ['Trust Layer', 'Proposed checks, illustrated with fictional records'],
        learning:      ['Learning Log', 'Fictional cases and possible lessons'],
        learn:         ['Learn the System', 'Search written explanations of the concept'],
        schema:        ['Database Layout', 'Proposed tables and governance fields'],
        users:         ['Users and Access', 'Example roles and a proposed onboarding path']
    };

    let _curView = 'overview';
    const _trail = ['overview'];
    function _sbFor(id) { return [...document.querySelectorAll('.sb-item')].find(el => el.dataset.view === id); }
    function switchView(id, el) {
        if(!Object.hasOwn(META,id))return;
        el=_sbFor(id);
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.sb-item').forEach(i => {i.classList.remove('active');i.removeAttribute('aria-current');});
        const view = document.getElementById('view-' + id);
        if (view) view.classList.add('active');
        if (el) {el.classList.add('active');el.setAttribute('aria-current','page');}
        const m = META[id];
        if (m) {
            document.getElementById('view-title').textContent = m[0];
            document.getElementById('view-sub').textContent = m[1];
        }

        document.querySelector('.content').scrollTop=0;
        document.getElementById('view-title').focus({preventScroll:true});
        if(innerWidth<=700)document.getElementById('view-title').scrollIntoView({block:'start',behavior:'instant'});
        _curView = id;
        if (location.hash !== '#' + id) location.hash = id;  // records a history step - browser back works
    }
    window.addEventListener('hashchange', () => {
        const id = (location.hash || '#overview').slice(1);
        if (!Object.hasOwn(META,id)) return;
        // trail bookkeeping: a step back pops, anything else pushes
        if (_trail.length > 1 && _trail[_trail.length - 2] === id) _trail.pop();
        else if (_trail[_trail.length - 1] !== id) _trail.push(id);
        document.getElementById('nav-back').classList.toggle('show', _trail.length > 1);
        if (id !== _curView) switchView(id, _sbFor(id));
    });

    /* ---- SIX PROMISES ---- */
    const PROMISES = [
        { t: 'Every task has an owner', b: 'The proposed workflow gives each introduction, hiring round and conversation an owner and a next step.', nav: 'intros' },
        { t: 'Fails well', b: 'Example missed follow-ups show what a team could record, review and change.', nav: 'learning' },
        { t: 'Teaches by doing', b: 'Fixed sample suggestions include reasons for a person to question and check.', nav: 'match' },
        { t: 'People approve important actions', b: 'A live pilot would need a tested approval gate before sending. A field in a database is part of the design, not proof that the gate works.', nav: 'automation' },
        { t: 'A clear shared view', b: 'Owners and next steps could be visible to the right people, within agreed access limits.', nav: 'overview', anchor: 'anchor-fullpicture' },
        { t: 'Work people can sustain', b: 'Workload examples invite a conversation about capacity. Optional pause prompts are available without recording whether anyone uses them.', nav: 'overview', anchor: 'anchor-workload' }
    ];
    let _prOpenIdx = -1;
    function prOpen(i) {
        const d = document.getElementById('pr-detail');
        for (let j = 0; j < PROMISES.length; j++) {const control=document.getElementById('pr-c'+j);control.classList.remove('pr-open');control.setAttribute('aria-expanded','false');}
        if (_prOpenIdx === i) { _prOpenIdx = -1; d.classList.remove('open');d.hidden=true; return; }
        _prOpenIdx = i;
        document.getElementById('pr-c' + i).classList.add('pr-open');
        document.getElementById('pr-c' + i).setAttribute('aria-expanded','true');
        const p = PROMISES[i];
        d.innerHTML = '<p><strong>' + p.t + '.</strong> ' + p.b + '</p><button class="pr-go" data-promise="' + i + '">Explore the example →</button>';
        d.hidden=false;d.classList.add('open');
    }
    function prGo(i) {
        const p = PROMISES[i];
        kbGo(p.nav, p.anchor);
    }

    function runMatch() {
        const result=document.getElementById('match-result');result.hidden=false;result.focus();
    }

    /* ---- TRUST LAYER flow walkthrough ---- */
    const TL_STEPS = {
        trigger: ['Trigger', 'In the proposed workflow, a new record or a scheduled follow-up would start a task. Nothing runs against a live system here.'],
        enrich: ['Gather facts', 'A live pilot would retrieve only approved fields needed for the task, with sensitive details minimised.'],
        decide: ['Draft a next step', 'An AI assistant could draft a next step and explain its reasoning for a person to review.'],
        verify: ['Check work', 'Proposed checks would compare details with sources, apply agreed rules and flag missing or unusual content. These checks are not implemented in this preview.'],
        gate: ['Human approval', 'A named reviewer would approve or reject the draft. A live pilot would need to test that unapproved actions cannot proceed.'],
        act: ['Approved action', 'The proposed system would carry out only the approved action, with monitoring and a way to stop it.'],
        log: ['Record what happened', 'A live implementation would record the action, checks and approval in an audit trail. The log shown here is fictional.']
    };
    function tlStep(key, el) {
        const d = document.getElementById('tl-detail');
        const wasOn = el.classList.contains('tl-on');
        document.querySelectorAll('.tl-step').forEach(s => {s.classList.remove('tl-on');s.setAttribute('aria-expanded','false');});
        if (wasOn) { d.classList.remove('open');d.hidden=true; return; }
        el.classList.add('tl-on');el.setAttribute('aria-expanded','true');
        const s = TL_STEPS[key];
        d.innerHTML = '<div class="tl-detail-title">' + s[0] + '</div><p>' + s[1] + '</p>';
        d.hidden=false;d.classList.add('open');
    }

    /* ================= KNOWLEDGE BASE =================
       Rule: keys are literal phrases separated by | and matched
       with query.includes(phrase). Every key must contain at least
       one phrase a real person would actually type. */
    const KB = [
        { k: 'what is talentsync ops|what is this|about this dashboard|what am i looking at', q: 'What is TalentSync Ops?', a: 'A prototype network operating system built for a cross-functional consultant-matching network. It uses synthetic sample data and is not connected to any live systems. It shows how a network\'s core work - members, introductions, hiring rounds, career conversations - could be made easier to see and manage.', nav: 'overview' },
        { k: 'synthetic|sample data|is this real|real data|fake data', q: 'Is this real data?', a: "No. Workspace people, figures and results are fictional examples in a June 2026 snapshot. The owner profile identifies the creator. No live database, AI, calendar or sending service is connected.", nav: 'overview' },
        { k: 'safe pilot|pilot path|how would this go live|rollout|phases', q: 'What is the Safe Pilot Path?', a: 'Five phases. Phase 0: this synthetic prototype. Phase 1: client-owned sandbox. Phase 2: read-only shadow pilot on a tiny approved data slice. Phase 3: human-approved suggestions. Phase 4: limited write-back only after access controls, audit logs, consent rules, and rollback are proven.', nav: 'overview' },
        { k: 'ai match|how does matching work|claude match|find matches|suggestions', q: 'How does AI Match work?', a: "This preview reveals fixed sample suggestions for a read-only fictional brief. It does not run AI. A live pilot could ask an approved AI tool to suggest introductions, with source checks and human review.", nav: 'match' },
        { k: 'human review|human in the loop|does ai send|automatic|who approves', q: 'Does the AI ever act on its own?', a: "No AI or sending service runs in this preview. The proposed workflow requires a person to approve important actions. That gate would need implementation and testing before a live pilot.", nav: 'automation' },
        { k: 'automation|zapier|flows|what runs automatically', q: 'What do the automations do?', a: "The eight proposed flows illustrate reminders, summaries and follow-ups that could be prepared for approval. They do not run here. A live pilot would agree consent, working hours and delivery rules.", nav: 'automation' },
        { k: 'trust|trust layer|verification|what gets checked|how do you know it is safe|checks|audit', q: 'How do I know a draft is safe before it sends?', a: "This preview cannot certify a draft as safe. The Trust Layer illustrates proposed source checks, agreed rules and human review. A live pilot would need tested controls and monitoring.", nav: 'trust' },
        { k: 'learning log|fail|failure|what went wrong|stale', q: 'What is the Learning Log?', a: "Fictional cases show how missed follow-ups and changed requirements could be recorded, reviewed and used to agree a better next step.", nav: 'learning' },
        { k: 'carry|workload|overload|who is carrying|load', q: 'What is Carry?', a: "A proposed count of open introductions, hiring rounds, conversations and approvals. The sample workload display is a prompt to discuss capacity, not a health assessment.", nav: 'overview', anchor: 'anchor-workload' },
        { k: 'recovery debt|burnout|consecutive weeks|exhausted', q: 'What is Recovery Debt?', a: "A proposed signal for repeated weeks above an agreed workload threshold. The figures are illustrative. A real team would define its threshold and discuss the circumstances with each person.", nav: 'overview', anchor: 'anchor-recovery' },
        { k: 'after hours|weekend|working hours|sunday|respect time', q: 'What is the After-Hours meter?', a: "An illustrative share of actions outside agreed working hours. A live pilot would need clear consent, privacy limits and a shared definition of working time before collecting this information.", nav: 'overview', anchor: 'anchor-afterhours' },
        { k: 'mental hygiene|reset|breathing|wellbeing|wellness|enjoy what you do', q: 'What is the Mental Hygiene strip?', a: "An optional daily pause prompt. Try it if useful or skip it. The preview does not record use, and the prompts make no promise of a health or productivity result.", nav: 'overview', anchor: 'anchor-hygiene' },
        { k: 'lessons logged|psychological safety|safe to fail', q: 'Why count Lessons Logged?', a: "An illustrative count of recorded lessons. A change in reporting may be worth discussing, but the count alone cannot show whether people feel safe or whether work has improved.", nav: 'learning' },
        { k: 'users|access|sandbox|invite|add a user|new user|trust ladder', q: 'How do new users get access?', a: "Users and Access shows a proposed path: practise with fictional records, review readiness with an owner, then grant only the permissions needed. This public preview has no sign-in or role enforcement.", nav: 'users' },
        { k: 'photo|profile picture|avatar|upload', q: 'What are the profile photo rules?', a: "A future pilot could agree member-photo guidelines and an option to use initials instead. The creator portrait in this preview is read-only; no photo uploads are accepted.", nav: 'users' },
        { k: 'consent|privacy|pseudonymous|audit|sensitive|gdpr', q: 'How is member privacy protected?', a: "The proposed schema includes consent, pseudonymous IDs and access labels. These are design ideas, not operating privacy controls. A live pilot would need enforceable permissions, data minimisation and tested audit logging.", nav: 'schema' },
        { k: 'airtable|database|schema|tables|where is data', q: 'How is the data structured?', a: "The proposed layout has Members, Introductions and Hiring Rounds as its three core tables. A live implementation would also need audit records and tested governance controls. No Airtable database is connected here.", nav: 'schema' },
        { k: 'stack|tools|claude|what is it built on|technology', q: 'What is the stack?', a: "This browser preview uses HTML, CSS and JavaScript. Airtable, Claude, Zapier and Google Workspace are proposed tools for a future pilot. Their integrations, permissions and costs would need assessment.", nav: 'overview' },
        { k: 'who built|simon|author|owner|empyrean', q: 'Who built this?', a: 'Simon Mukooza - operations background across aviation (Emirates, Dubai), logistics, and clean energy (Empyrean Roots, Uganda), now building AI operations systems. This instance is his: built as a self-directed prototype of how he thinks about network operations. empyreanroots.earth', nav: 'overview' },
        { k: 'colors|colour|cream|green|dyslexia|design|why does it look', q: 'Why these colours?', a: 'The colour you chose in the introduction continues here: teal for People, blue for Connections, amber for Progress and violet for Care. Dark, tinted surfaces and pale text keep the workspace visually connected. Labels and icons explain each action as well as colour. Your chosen theme stays with you as you explore.', nav: 'overview' },
        { k: 'hiring rounds|rounds|placements', q: 'What are Hiring Rounds?', a: "These fictional examples group work around open roles, with an owner, deadline, candidates and stage. The counts illustrate a proposed workflow.", nav: 'hiring' },
        { k: 'career conversations|advising|1:1', q: 'What are Career Conversations?', a: "Fictional one-to-one calls show how guidance conversations and follow-ups could be tracked. Calendar synchronisation is proposed, not connected.", nav: 'conversations' },
        { k: 'member network|members|consultants|profiles', q: 'What is the Member Network?', a: 'Six fictional profiles illustrate background, expertise, availability and introductions. A live pilot could store consented profiles in its own database with tested access rules.', nav: 'members' },
        { k: 'adopt|my org|reuse|fork|stretch|scale this', q: 'Can this stretch beyond this network?', a: "The approach could be adapted to other teams. A pilot would test the workflow, permissions and usefulness with that team before claiming it scales.", nav: 'users' }
    ];

    const KB_CHIPS = ['How does AI Match work', 'What is Recovery Debt', 'Is this real data', 'How do new users get access', 'Why these colours', 'What is the Learning Log', 'Mental hygiene'];

    function kbRender(list, msg) {
        const out = document.getElementById('kb-results');
        document.getElementById('kb-status').textContent=list.length ? list.length+(list.length===1?' explanation shown':' explanations shown') : 'No matching explanation';
        if (!list.length) {
            out.innerHTML = '<div class="kb-empty">' + (msg || 'No match yet. Try fewer words - "carry", "photo", "consent", "sandbox" - or pick a suggestion above.') + '</div>';
            return;
        }
        out.innerHTML = list.map(e =>
            '<div class="kb-card"><div class="kb-q">' + e.q + '</div><div class="kb-a">' + e.a + '</div>' +
            '<button class="kb-nav" data-kb-view="' + e.nav + '" data-kb-anchor="' + (e.anchor || '') + '">Open this example →</button></div>'
        ).join('');
    }

    function kbSearch(q) {
        const ql = (q || '').toLowerCase().trim();
        const pv = document.getElementById('kb-preview-note');
        if (ql.length < 2) {
            kbRender(KB.slice(0, 4), '');
            if (pv) pv.innerHTML = 'Preview - showing 4 of ' + KB.length + '. Search or choose a suggested question to see more.';
            return;
        }
        if (pv) pv.innerHTML = '';
        const hits = KB.filter(e => {
            if (e.q.toLowerCase().includes(ql)) return true;
            return e.k.split('|').some(p => ql.includes(p) || p.includes(ql));
        });
        kbRender(hits);
    }

    function kbGo(id, anchor) {
        const el = _sbFor(id);
        switchView(id, el);
        if (anchor) {
            setTimeout(() => {
                const t = document.getElementById(anchor);
                if (!t) return;
                t.scrollIntoView({ behavior: 'instant', block: 'center' });
                t.classList.add('flash-target');
                setTimeout(() => t.classList.remove('flash-target'), 2200);
            }, 120);
        }
    }

    function kbBoot() {
        const chips = document.getElementById('kb-chips');
        if (chips) chips.innerHTML = KB_CHIPS.map(c =>
            '<button class="kb-chip" data-kb-chip>' + c + '</button>'
        ).join('');
        kbRender(KB.slice(0, 4), '');
        const pv = document.getElementById('kb-preview-note');
        if (pv) pv.innerHTML = 'Preview - showing 4 of ' + KB.length + '. Search or choose a suggested question to see more.';
    }

    /* ================= MENTAL HYGIENE ROTATION ================= */
    const HYG_DAILY = [
        { t: 'Notice something that went well', d: 'If useful, name one small thing that went well today. You do not need to write it down.' },
        { t: 'Choose one next step', d: 'What is the next useful thing to do? Make it small enough to start.' },
        { t: 'Pause for a breath', d: 'If comfortable, take a few easy breaths at your own pace. Skip this if it does not suit you.' },
        { t: 'Look away from the screen', d: 'Let your eyes rest on something farther away for a moment, if that feels comfortable.' },
        { t: 'Notice your surroundings', d: 'Choose something around you to notice: a shape, a sound or a texture. Use whatever sense feels comfortable.' },
        { t: 'Change position', d: 'If comfortable and possible, adjust your position or move a little before the next task.' },
        { t: 'Leave a little space', d: 'You can pause between tasks. Choose a length of time that works for you.' }
    ];
    const HYG_FACTS = [
        'A pause is an option, not another task to complete.',
        'Different people find different pauses useful. Choose what suits you.',
        'You can skip this prompt and continue your work.',
        'These prompts do not measure health, performance or participation.',
        'Your use of these prompts is not recorded in this preview.'
    ];
    function hygBoot() {
        const d = new Date();
        const today = d.getDay();
        const p = HYG_DAILY[today];
        const t = document.getElementById('hyg-title'), de = document.getElementById('hyg-desc'), f = document.getElementById('hyg-fact');
        if (t) t.textContent = p.t;
        if (de) de.textContent = p.d;
        if (f) f.textContent = HYG_FACTS[d.getDate() % HYG_FACTS.length];
        const pv = document.getElementById('hyg-preview');
        if (pv) {
            const dots = HYG_DAILY.map((_, i) => '<span class="preview-dot' + (i === today ? ' on' : '') + '"></span>').join('');
            pv.innerHTML = 'Today\'s optional prompt. <span class="preview-dots">' + dots + '</span> ' + HYG_DAILY.length + ' prompts rotate through the week.';
        }
    }

    /* Read-only author identity: no file input or browser-stored portrait. */
    function idOpen() { const dialog=document.getElementById('id-overlay'); dialog.showModal(); dialog.classList.add('open'); }
    function idClose() { const dialog=document.getElementById('id-overlay'); dialog.classList.remove('open'); dialog.close(); }
    document.getElementById('id-overlay').addEventListener('cancel', event => { event.preventDefault(); idClose(); });

    kbBoot();
    hygBoot();




const previewView = location.hash.slice(1);
switchView(Object.hasOwn(META,previewView)?previewView:'overview');

document.querySelector('[data-event-click="0"]').addEventListener('click',function(event){switchView('overview',this)});
document.querySelector('[data-event-click="1"]').addEventListener('click',function(event){switchView('members',this)});
document.querySelector('[data-event-click="2"]').addEventListener('click',function(event){switchView('intros',this)});
document.querySelector('[data-event-click="3"]').addEventListener('click',function(event){switchView('hiring',this)});
document.querySelector('[data-event-click="4"]').addEventListener('click',function(event){switchView('conversations',this)});
document.querySelector('[data-event-click="5"]').addEventListener('click',function(event){switchView('match',this)});
document.querySelector('[data-event-click="6"]').addEventListener('click',function(event){switchView('automation',this)});
document.querySelector('[data-event-click="7"]').addEventListener('click',function(event){switchView('trust',this)});
document.querySelector('[data-event-click="8"]').addEventListener('click',function(event){switchView('learning',this)});
document.querySelector('[data-event-click="9"]').addEventListener('click',function(event){switchView('learn',this)});
document.querySelector('[data-event-click="10"]').addEventListener('click',function(event){switchView('schema',this)});
document.querySelector('[data-event-click="11"]').addEventListener('click',function(event){switchView('users',this)});
document.querySelector('[data-event-click="12"]').addEventListener('click',function(event){idOpen()});
document.querySelector('[data-event-click="13"]').addEventListener('click',function(event){history.back()});
document.querySelector('[data-event-click="14"]').addEventListener('click',function(event){switchView('intros')});
document.querySelector('[data-event-click="15"]').addEventListener('click',function(event){prOpen(0)});
document.querySelector('[data-event-click="16"]').addEventListener('click',function(event){prOpen(1)});
document.querySelector('[data-event-click="17"]').addEventListener('click',function(event){prOpen(2)});
document.querySelector('[data-event-click="18"]').addEventListener('click',function(event){prOpen(3)});
document.querySelector('[data-event-click="19"]').addEventListener('click',function(event){prOpen(4)});
document.querySelector('[data-event-click="20"]').addEventListener('click',function(event){prOpen(5)});
document.querySelector('[data-event-click="21"]').addEventListener('click',function(event){switchView('learning')});
document.querySelector('[data-event-click="22"]').addEventListener('click',function(event){switchView('intros')});
document.querySelector('[data-event-click="23"]').addEventListener('click',function(event){switchView('match')});
document.querySelector('[data-event-click="24"]').addEventListener('click',function(event){switchView('automation')});
document.querySelector('[data-event-click="25"]').addEventListener('click',function(event){runMatch()});
document.querySelector('[data-event-click="26"]').addEventListener('click',function(event){tlStep('trigger',this)});
document.querySelector('[data-event-click="27"]').addEventListener('click',function(event){tlStep('enrich',this)});
document.querySelector('[data-event-click="28"]').addEventListener('click',function(event){tlStep('decide',this)});
document.querySelector('[data-event-click="29"]').addEventListener('click',function(event){tlStep('verify',this)});
document.querySelector('[data-event-click="30"]').addEventListener('click',function(event){tlStep('gate',this)});
document.querySelector('[data-event-click="31"]').addEventListener('click',function(event){tlStep('act',this)});
document.querySelector('[data-event-click="32"]').addEventListener('click',function(event){tlStep('log',this)});
document.querySelector('[data-event-input="33"]').addEventListener('input',function(event){kbSearch(this.value)});
document.querySelector('[data-event-click="34"]').addEventListener('click',function(event){if(event.target===this)idClose()});
document.querySelector('[data-event-click="35"]').addEventListener('click',function(event){idClose()});
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.dataset.promise!==undefined){const i=Number(b.dataset.promise);if(Number.isInteger(i)&&i>=0&&i<PROMISES.length)prGo(i);}
 if(b.dataset.kbView)kbGo(b.dataset.kbView,b.dataset.kbAnchor);
 if(b.hasAttribute('data-kb-chip')){document.getElementById('kb-input').value=b.textContent;kbSearch(b.textContent);}
});
