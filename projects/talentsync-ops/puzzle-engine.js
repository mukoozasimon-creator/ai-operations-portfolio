/* Fictional business puzzles. Research informs themes, never invented company results. */
const PuzzleEngine = (() => {
  const levels = ['Find your feet', 'Connect the dots', 'Balance the trade-offs', 'Work the whole system'];
  const topics = ['customer onboarding', 'AI-assisted support', 'a skills-sharing programme'];
  const names = ['Maya', 'Amara', 'Leo', 'Noor', 'Jo', 'Ming'];
  function random(seed) { return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; }; }
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = int(r, 0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function finish(p, r) {
    const options = shuffle(p.options, r);
    return {...p, answers:options.map(o=>o.label), feedback:options.map(o=>o.feedback), correct:options.findIndex(o=>o.ok), options};
  }
  function people(level, round, r) {
    const skills = shuffle(['customer insight','data checks','workflow design','AI evaluation','staff coaching'],r).slice(0,level+1);
    const staff = shuffle(names,r).slice(0,4).map((name,i)=>({name,skills:[],hours:int(r,2,6),available:true,reviewer:i%2===1}));
    // The first team covers every requirement; other candidates contain an observable gap.
    skills.forEach((skill,i)=>staff[i%2].skills.push(skill));
    staff[2].skills=staff[0].skills.slice();staff[3].skills=staff[1].skills.slice();
    if(level>=2)staff[2].available=false;
    if(level===1)staff[2].skills=[];
    const budget=staff[0].hours+staff[1].hours;
    staff[3].hours=staff[1].hours+int(r,1,3);
    const teams=[[0,1],[2,1],[0,3]];
    if(level===4){staff[0].reviewer=false;staff[1].reviewer=true;staff[3].reviewer=false;staff[3].hours=staff[1].hours;}
    const requirements=[`Cover: ${skills.join(' + ')}`,`At most ${budget} staff-hours`,...(level>=2?['Only available people can join']:[]),...(level===4?['Include an independent AI reviewer']:[])];
    const options=teams.map(team=>{
      const members=team.map(i=>staff[i]);const hours=members.reduce((s,p)=>s+p.hours,0);
      const missing=skills.filter(s=>!members.some(p=>p.skills.includes(s)));
      const absent=members.find(p=>!p.available);
      const noReviewer=level===4&&!members.some(p=>p.reviewer);
      const ok=!missing.length&&!absent&&hours<=budget&&!noReviewer;
      const feedback=missing.length?`This pair is missing ${missing.join(' and ')}.`:absent?`${absent.name} is unavailable. Skills alone do not make this match work.`:hours>budget?`This pair needs ${hours} staff-hours, above the ${budget}-hour limit.`:noReviewer?'This pair has no independent AI reviewer.':`Yes. ${members.map(p=>p.name).join(' and ')} cover every requirement within ${budget} staff-hours.`;
      return {value:team,label:`${members.map(p=>p.name).join(' + ')} · ${hours} hours`,ok,feedback};
    });
    return {title:['Build the right pair','Find the missing mix','Staff the pilot'][round],prompt:`For ${topics[round]}, which pair meets every requirement?`,clues:[...requirements,...shuffle(staff,r).map(p=>`${p.name}: ${p.skills.join(', ')||'project coordination'} · ${p.hours}h${!p.available?' · Unavailable':''}${level===4&&p.reviewer?' · Independent reviewer':''}`)],options,hint:'Check coverage first, then availability and the total hours.',lesson:'Staff the work by demonstrated skills and capacity, with human review where the task calls for it.',model:{kind:'people',staff,skills,budget,needReviewer:level===4}};
  }
  function connections(level,round,r){
    const [start,a,b,c,d,end]=shuffle(names,r);
    const weights=level===1?[1,1,1,1,1,1,1]:Array.from({length:7},()=>int(r,1,6));
    const pairs=[[start,a],[a,end],[start,b],[b,c],[c,end],[c,d],[d,end]];
    const edges=pairs.map(([from,to],i)=>({from,to,cost:weights[i]}));
    const routes=[[start,a,end],[start,b,c,end],[start,b,c,d,end]];
    const unavailable=level>=3?a:null,required=level===4?c:null;
    const cost=path=>path.slice(1).reduce((sum,to,i)=>sum+edges.find(e=>e.from===path[i]&&e.to===to).cost,0);
    // Changing these two edges changes only one route each; ties are never left to guesswork.
    if(level>1){
      if(cost(routes[1])===cost(routes[2]))edges[4].cost++;
      while(cost(routes[0])===cost(routes[1])||cost(routes[0])===cost(routes[2]))edges[0].cost++;
    }
    const valid=path=>(!unavailable||!path.includes(unavailable))&&(!required||path.includes(required));
    const best=Math.min(...routes.filter(valid).map(cost));
    const options=routes.map(path=>({value:path,label:path.join(' → '),ok:valid(path)&&cost(path)===best,feedback:!valid(path)?`${unavailable&&path.includes(unavailable)?unavailable+' is unavailable.':'This route skips the required reviewer.'} Check the route conditions.`:cost(path)!==best?`This route takes ${cost(path)} ${level===1?'introductions':'hours'}. Another valid route takes ${best}.`:`Exactly. This route meets the conditions in ${best} ${level===1?'introductions':'hours'}.`}));
    return {title:['Find a useful bridge','Route the handoff','Keep the chain connected'][round],prompt:`${start} needs to reach ${end} for ${topics[round]}. Choose the ${level===1?'fewest introductions':'fastest permitted route'}. Links go only in the arrow direction.${level>1?' Add the hours for each handoff.':''}`,clues:[...(unavailable?[`${unavailable} is unavailable${required?' · Required human review: '+required:''}`]:[]),...edges.map(e=>`${e.from} → ${e.to}${level>1?' · '+e.cost+'h':''}`)],options,hint:'Trace each route, rule out blocked people, then compare the total.',lesson:'A fast handoff is only useful when it reaches the right people and keeps required review intact.',model:{kind:'connections',edges,start,end,unavailable,required}};
  }
  function progress(level,round,r){
    const tasks=[{name:'Prepare data',time:int(r,2,5),after:[]},{name:'Check AI output',time:int(r,3,7),after:[0]}];
    if(level>=2)tasks.push({name:'Prepare staff',time:int(r,2,6),after:level>=3?[1]:[0]});
    tasks.push({name:'Run pilot',time:int(r,2,5),after:level>=2?[1,2]:[1]});
    if(level>=3)tasks.push({name:'Review customer feedback',time:int(r,1,4),after:[tasks.length-1]});
    if(level===4)tasks.push({name:'Approve release',time:int(r,1,3),after:[tasks.length-1]});
    const endTimes=[];tasks.forEach((t,i)=>endTimes[i]=t.time+Math.max(0,...t.after.map(j=>endTimes[j])));
    const baseline=endTimes.at(-1),saving=level>=2&&round===1?2:0;
    if(saving)tasks[1].time-=saving;
    const done=[];tasks.forEach((t,i)=>done[i]=t.time+Math.max(0,...t.after.map(j=>done[j])));
    const earliest=done.at(-1),deadline=earliest+int(r,2,5);
    const answer=round===2?deadline-earliest:earliest;
    const distractors=[answer+int(r,1,3),Math.max(0,answer-int(r,1,2))];
    const rule=round===2?`The deadline is hour ${deadline}. How many work-hours of buffer remain after the earliest finish?`:'At what work-hour can the final step finish at the earliest?';
    const explanation=`The earliest finishes are ${tasks.map((t,i)=>t.name+' '+done[i]).join(', ')}.${round===2?' Buffer: '+deadline+' - '+earliest+' = '+answer+'.':''}`;
    return {title:['Find the finish','What changes the timeline?','Protect the deadline'][round],prompt:`Plan ${topics[round]}. Start at hour 0. Independent tasks can run in parallel; each task starts after all its prerequisites finish. ${rule}`,clues:[...(level>=3?['The same specialist checks AI output and prepares staff, so those steps run in sequence.']:[]),...(saving?[`AI-output check shortened by ${saving}h; the updated time is shown below.`]:[]),...tasks.map(t=>`${t.name}: ${t.time}h · After ${t.after.map(i=>tasks[i].name).join(' + ')||'start'}`)],options:[answer,...distractors].map(n=>({value:n,label:`${n} work-hours`,ok:n===answer,feedback:n===answer?`Yes. ${explanation}`:`Try tracing the dependencies. ${round===2?'Find the finish first, then subtract it from the deadline.':'Parallel steps overlap; dependent steps add time.'}`})),hint:'Write down each earliest finish. At a join, use the later prerequisite finish.',lesson:'Automation can shorten a task without removing the human review or other dependencies around it.',model:{kind:'progress',tasks,deadline:round===2?deadline:null,baseline}};
  }
  function care(level,round,r){
    const staff=shuffle(names,r).slice(0,3).map((name,i)=>({name,minutes:int(r,4,7)*10,perReview:level>=2?int(r,2,4)*5:10,reserve:level>=3?10:0,critical:level===4?i===1:true}));
    const capacity=staff.map(s=>Math.floor((s.minutes-s.reserve)/s.perReview));
    const good=capacity.slice();
    const total=good.reduce((a,b)=>a+b,0);
    const bad=[good[0]+1,good[1]-1,good[2]];
    const alternative=level===1?[good[0],good[1],good[2]-1]:level===4?good.slice():[good[0]-1,good[1]+1,good[2]];
    const plans=[{loads:good,criticalOwner:1},{loads:bad,criticalOwner:0},{loads:alternative,criticalOwner:2}];
    const options=plans.map(plan=>{
      const sum=plan.loads.reduce((a,b)=>a+b,0),over=plan.loads.findIndex((n,i)=>n>capacity[i]);
      const wrongReviewer=level===4&&!staff[plan.criticalOwner].critical;
      const ok=sum===total&&over===-1&&!wrongReviewer;
      return {value:plan,label:plan.loads.map((n,i)=>staff[i].name+' '+n).join(' · ')+(level===4?' · Critical review: '+staff[plan.criticalOwner].name:''),ok,feedback:sum!==total?`This plan covers ${sum} of ${total} reviews. One is still unassigned.`:over!==-1?`${staff[over].name} has room for ${capacity[over]} reviews, but this plan assigns ${plan.loads[over]}.`:wrongReviewer?'The critical case needs the qualified reviewer.':`Yes. All ${total} reviews fit the available minutes${level>=3?', with the reserve protected':''}${level===4?' and the critical case with its qualified owner':''}.`};
    });
    return {title:['Share the review work','Keep space for surprises','Check the AI handoff'][round],prompt:`An AI assistant drafted ${total} ${['onboarding notes','support replies','skills summaries'][round]}. Every draft still needs a person to review it. Which plan assigns all reviews within capacity?${level===4?' One review is critical and must go to the qualified person.':''}`,clues:staff.map(s=>`${s.name}: ${s.minutes} minutes · ${s.perReview} min/review${level>=3?' · Keep '+s.reserve+' min free':''}${level===4&&s.critical?' · Critical-case qualified':''}`),options,hint:'Subtract reserved minutes, divide by minutes per review, then check the total assigned.',lesson:'Faster drafting can move the bottleneck to people reviewing the output. Plan that work too.',model:{kind:'care',staff,total,critical:level===4}};
  }
  function plainQuestion(p,level,round){
    const m=p.model;
    const skills={'customer insight':'understanding what customers need','data checks':'checking information for mistakes','workflow design':'planning the steps of a job','AI evaluation':"checking AI’s answers",'staff coaching':'teaching teammates'};
    if(m.kind==='people')return {
      intro:'Which two people can do this job together?',
      hint:'Check that the pair has every skill, can join, and fits the time limit.',
      steps:[`Together, they need all these skills: ${m.skills.map(s=>skills[s]).join('; ')}.`,`Add the hours for both people. The total must be ${m.budget} hours or less.`,...(level>=2?['Leave out anyone who is not available.']:[]),...(m.needReviewer?["One person must be marked as an independent reviewer: someone who checks the AI’s work separately."]:[])],
      clues:m.staff.slice().sort((a,b)=>p.clues.findIndex(c=>c.startsWith(a.name+':'))-p.clues.findIndex(c=>c.startsWith(b.name+':'))).map(s=>`${s.name}: ${s.skills.map(k=>skills[k]).join('; ')||'organising project work'}. Needs ${s.hours} hours.${!s.available?' Not available.':''}${m.needReviewer&&s.reviewer?' Independent reviewer.':''}`)
    };
    if(m.kind==='connections')return {
      intro:`${m.start} needs to reach ${m.end}. Which path should they use?`,
      hint:'Follow the arrows. Cross out paths that break a rule, then count what is left.',
      steps:[`Start with ${m.start} and finish with ${m.end}. Follow each arrow in its direction.`,...(m.unavailable?[`Do not go through ${m.unavailable}; they are not available.`]:[]),...(m.required?[`The path must include ${m.required}, who needs to check the work.`]:[]),level===1?'Count the arrows in each path. Pick the path with the fewest.':'Add the hours along each allowed path. Pick the path with the smallest total.'],
      clues:m.edges.map(e=>`${e.from} → ${e.to}${level===1?' = one introduction':` takes ${e.cost} ${e.cost===1?'hour':'hours'}`}`)
    };
    if(m.kind==='progress'){
      const labels={'Prepare data':'Get the information ready','Check AI output':"Check AI’s answers",'Prepare staff':'Show the team what to do','Run pilot':'Try it with a small group','Review customer feedback':'Read what customers said','Approve release':'Give the final go-ahead'};
      return {
        intro:`${m.deadline===null?'How soon can all the jobs be finished?':`The work must be done by hour ${m.deadline}. How many hours will be left between finishing and that deadline?`}`,
        hint:'If a job needs two other jobs, it waits for the one that finishes last.',
        steps:['Start counting at 0. Count working hours, not the time on a clock.', 'A job must wait until every job named before it is finished.','Jobs that do not need to wait for each other can happen at the same time. If two jobs must finish before the next one starts, wait for the one that finishes last.',...(level>=3?["The same person checks AI’s answers and teaches the team. They must finish checking before they start teaching."]:[]),...(level>=2&&round===1?['Use the times shown below. The time saving is already included.']:[]),...(m.deadline!==null?[`First find when all the jobs finish. Then subtract that number from ${m.deadline}.`]:[])],
        clues:m.tasks.map(t=>`${labels[t.name]}: ${t.time} ${t.time===1?'hour':'hours'}. ${t.after.length?'Wait for '+t.after.map(i=>labels[m.tasks[i].name]).join(' AND ')+'.':'Can start at 0.'}`)
      };
    }
    return {
      intro:`Which plan gives all ${m.total} checks to people who have enough time?`,
      hint:'Work out how many whole checks each person has time for. Keep any reserved minutes free.',
      steps:[`All ${m.total} drafts need to be checked. Do not leave any out.`,...(level>=3?['First take away the minutes each person must keep free for other work.']:[]),'For each person, divide the time they have by the time needed for one check. Count only whole checks.',...(m.critical?['One check needs special training. Give it to the person marked as trained for that check.']:[]),'Choose the plan that fits everyone’s time.'],
      clues:m.staff.map(s=>`${s.name}: has ${s.minutes} minutes. Each check takes ${s.perReview} minutes.${s.reserve?' Must keep '+s.reserve+' minutes free.':''}${m.critical&&s.critical?' Trained for the special check.':''}`)
    };
  }
  function scenarioFor(context,round){
    const scenarios={
      people:[
        'A new customer needs help getting started. You have room for two teammates, so their skills need to fit together.',
        'Your team is trying AI to help answer customer questions. Pick two people who can help the team use it well.',
        'Two teammates will run a small skills-sharing session. Together, they need to teach everything on the list.'
      ],
      connections:[
        'A new customer has a question for someone you do not know yet. People you already know can help make the introduction.',
        'An AI-written reply needs to reach the right person for checking. You must pass it along through the people shown.',
        'A teammate wants to learn from someone in another team. Find a path of introductions that connects them.'
      ],
      progress:[
        'A new customer is joining. Your team must get the information ready, check it and try the setup before calling the work finished.',
        'Your team is trying AI for customer support. Some jobs can happen together, but a job that needs earlier work must wait.',
        'You are preparing a session where teammates share skills. The jobs must fit together so everything is ready before the deadline.'
      ],
      care:[
        'AI helped write notes for new customers. The team still needs to check every note, and each person has only so much time.',
        'Draft replies are ready for customers, but people must check them first. Share the checks so nobody gets more than they can finish.',
        'AI has drafted summaries of what teammates can teach. People need to check them before the summaries are shared.'
      ]
    };
    return scenarios[context][round];
  }
  const builders={people,connections,progress,care};
  function get(context,index){
    if(!builders[context]||!Number.isSafeInteger(index)||index<0)throw Error('Invalid puzzle position');
    const cycle=Math.floor(index/3)+1,round=index%3,level=Math.min(cycle,4);
    const r=random((index+1)*7919+Object.keys(builders).indexOf(context)*104729);
    const p=finish(builders[context](level,round,r),r);
    if(p.options.filter(o=>o.ok).length!==1)throw Error('Puzzle must have one answer');
    return {...p,plain:{...plainQuestion(p,level,round),scenario:scenarioFor(context,round)},cycle,round:round+1,level,levelName:cycle>4?'Advanced remix':levels[level-1]};
  }
  return {get,contexts:Object.keys(builders)};
})();
if(typeof module!=='undefined')module.exports=PuzzleEngine;
