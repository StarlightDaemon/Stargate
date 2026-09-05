'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const signs = [
    {name:'Spore', path:'M12 4v16M12 9L5 5M12 9l7-4M12 14l-7-4M12 14l7-4'},
    {name:'Furrow', path:'M3 6q9 7 18 0M3 12q9 7 18 0M3 18q9 7 18 0'},
    {name:'Nodule', path:'M4 20L17 4M9 14a4 4 0 1 0 0-8M13 10a4 4 0 1 0 6 5'},
    {name:'Leaf', path:'M4 20Q1 5 20 4Q20 23 4 20ZM4 20L16 8M9 15V9M9 15h6'},
    {name:'Pore', path:'M7 3L2 12l5 9M17 3l5 9-5 9M10 8l4 4-4 4'},
    {name:'Hypha', path:'M12 22V12L5 5M12 12l7-7M5 5V2M5 5H2M19 5V2M19 5h3'},
    {name:'Cairn', path:'M3 20h18L17 14H7ZM7 11h10l-2-5H9ZM10 3h4'},
    {name:'Rain', path:'M5 3v7M12 7v7M19 3v7M3 18q4-4 9 0t9 0'},
  ];
  const routes = {hollow:{name:'Morrow Hollow', address:[0,3,5,1]},bank:{name:'Thimble Bank',address:[7,4,2,6]}};
  const entries = [
    {id:'hollow',kind:'PLACE / 01',title:'Morrow Hollow',lede:'An orchard fed by the generosity of its own fallen leaves.',body:'The hollow’s stewards leave a ring of leaf litter beneath every tree. Neighbors bring clean peelings to the shared bays, then return a basket of finished compost to the ground that fed them. The exchange carries observations and invitations; restoration still happens by hand.',note:'Field note 18 · Three households counted six pale threads beneath the eastern leaf bed. Leave the bed undisturbed until the next rain.',links:[['compost','Receives nourishment from'],['thread','Shelters'],['cover','Practices']],route:'hollow'},
    {id:'bank',kind:'PLACE / 02',title:'Thimble Bank',lede:'A once-bare slope learning how to hold on to rain.',body:'Small contour pockets slow runoff long enough for roots to settle. No steward works the whole bank: each tends one pocket, then checks the two beside it. The shared map records where water rests, where it slips through, and where a new hand is needed.',note:'Field note 23 · The lower pocket held its shape through two showers. The upper crossing needs another season of rest.',links:[['pockets','Shaped by'],['clover','Planted with'],['rainbook','Observed in']],route:'bank'},
    {id:'thread',kind:'ORGANISM / 03',title:'Lantern-thread mycelium',lede:'A fictional pale decomposer, making connections out of what falls.',body:'Fine branching threads travel through damp leaf litter. Where compatible threads meet, their walls open a shared passage: anastomosis. Our instrument borrows that joining gesture, not a claim to control the living network. Each new sign grows a separate pair of threads before their tips fuse.',note:'Care note · Observe at the edge of an existing leaf bed. Replace lifted litter gently; a useful record does not require a specimen.',links:[['hollow','Recorded at'],['union','Inspires'],['cover','Protected by']]},
    {id:'compost',kind:'PRACTICE / 04',title:'The return-basket cycle',lede:'What leaves the table can return to the orchard.',body:'Neighbors alternate dry leaves with fruit and vegetable scraps in a shared, tended compost bay. Each basket is logged as a gift to a place, never as a debt from a person. Mature compost is shared when it smells of earth and the original ingredients have broken down.',note:'Stewards’ agreement · Leave a basket for households unable to visit. Care has more forms than carrying.',links:[['hollow','Returns to'],['cover','Complements'],['rainbook','Checked alongside']]},
    {id:'pockets',kind:'PRACTICE / 05',title:'Patient contour pockets',lede:'A line that welcomes water without asking it to stop forever.',body:'Shallow, staggered pockets follow the slope’s contours. Stewards observe a small trial through several rains before extending it. Sediment, rooted cover, and the paths people use are considered together. A sketch is an invitation to look, not a universal construction plan.',note:'Field note 21 · Keep the footpath open. The shortest way home is part of this place, too.',links:[['bank','Trial site'],['rainbook','Evaluated through'],['clover','Held together by']]},
    {id:'clover',kind:'ORGANISM / 06',title:'Small-cup clover',lede:'An invented groundcover with an outsized role in a small patch.',body:'Small-cup clover spreads low leaves over newly settled soil. Its root nodules lend the station its paired-dot sign. The bank’s stewards mix it with other cover, leaving flowering patches for small visitors and clear edges for neighbors on foot.',note:'Care note · A single thriving species is not the whole story. Record the bare patches and unexpected arrivals, too.',links:[['bank','Tended at'],['cover','Part of'],['union','Contributes a sign to']]},
    {id:'cover',kind:'PRACTICE / 07',title:'Leave a living cover',lede:'The ground does not need to be tidy to be well cared for.',body:'Living plants, fallen leaves, and unfinished edges shelter the work beneath them. Each place chooses a different balance. Orchard stewards favor deep leaf beds; bank stewards favor rooted cover. Both mark small resting patches and explain them to visitors.',note:'Commons rule · A resting-soil hold means pause and ask the local stewards. On this instrument it prevents opening, while leaving disengage available.',links:[['hollow','Leaf-bed example'],['bank','Rooted example'],['thread','Makes room for']]},
    {id:'rainbook',kind:'OBSERVATION / 08',title:'The two-rain notebook',lede:'One rain makes an impression. A second makes a question worth keeping.',body:'After each shower, stewards sketch where moisture lingered and where loose soil moved. Returning after the next rain keeps a single observation from becoming a rule. Compare drawings with the people who walk the paths daily; their memory gives the marks their scale.',note:'Current comparison · Hollow leaf beds stayed damp; the bank’s upper crossing dried first. Revisit both before extending the contour pockets.',links:[['hollow','Compares'],['bank','Compares'],['pockets','Informs']]},
    {id:'union',kind:'INSTRUMENT / 09',title:'The root-union protocol',lede:'Four small agreements before a shared passage opens.',body:'Each address sign sends two schematic roots toward a common junction. Their tips fuse, a local arc holds, and two tones converge. Four unions make a route ready. Only an explicit opening draws the filaments inward, crosses the contact threshold, and establishes a sustained exchange.',note:'Remembered tracings · Stewards have already measured these routes, so each sign can be retraced in 480 milliseconds. Manual unions take 900 milliseconds. Both wait for your decision to open.',links:[['thread','Borrows its gesture from'],['clover','Borrows a sign from'],['cover','Honors its resting hold']]},
  ];
  const read = (key, fallback) => { try { const v=JSON.parse(localStorage.getItem(key)); return v && typeof v==='object' ? v : fallback; } catch { return fallback; } };
  let storageFailed=false;
  const save = (key,value) => { try {localStorage.setItem(key,JSON.stringify(value));} catch {storageFailed=true;$('#last-route').textContent='Browser storage unavailable; this visit stays in memory.';} };
  const prefs=read('loamwake.preferences.v1',{});
  const ledger=read('loamwake.ledger.v1',{});
  const bookmarks=new Set(Array.isArray(ledger.bookmarks)?ledger.bookmarks.filter(id=>entries.some(e=>e.id===id)):[]);
  let selectedEntry=entries.some(e=>e.id===ledger.lastEntry)?ledger.lastEntry:'hollow';
  let muted=prefs.muted===true, savedOnly=false, view='exchange';
  let state='idle', address=[], locking=null, auto=null, stageStart=0, hold=false, blocked=false, warningUntil=0, rotorAngle=0;
  let audioContext=null, voices=[], master=null;
  const pathIcon = (i) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="node-icon" d="${signs[i].path}"/></svg>`;
  function svg(tag,attrs,parent){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));parent.append(e);return e;}
  const point=(r,a)=>[380+r*Math.sin(a*Math.PI/180),315-r*Math.cos(a*Math.PI/180)];
  const arc=(r,a,b)=>{const p=point(r,a),q=point(r,b);return `M${p}A${r} ${r} 0 0 1 ${q}`;};
  for(let i=0;i<8;i++){
    const [x,y]=point(250,i*45);const g=svg('g',{class:'symbol-node',id:`node-${i}`,transform:`translate(${x} ${y})`},$('#ring-symbols'));
    svg('circle',{class:'socket',r:22},g);svg('path',{class:'node-icon',d:signs[i].path,transform:'translate(-12 -12)'},g);
    const [tx,ty]=point(290,i*45);const label=svg('text',{class:'node-label',x:tx,y:ty+3,'text-anchor':'middle'},$('#ring-symbols'));label.textContent=signs[i].name.toUpperCase();
  }
  const bundles=[];
  for(let i=0;i<4;i++){
    const a=i*90+45,p=point(199,a-24),q=point(199,a+24),j=point(156,a),r=point(123,a),t=point(180,a-34),u=point(179,a+32);
    const d=`M${p}Q${point(160,a-28)} ${j}M${q}Q${point(168,a+28)} ${j}M${j}L${r}M${t}Q${point(175,a-14)} ${j}M${u}Q${point(170,a+18)} ${j}`;
    svg('path',{class:'root-track',d},$('#root-bundles'));
    const live=svg('path',{class:'root-live',d},$('#root-bundles')),len=live.getTotalLength();live.style.strokeDasharray=len;live.style.strokeDashoffset=len;
    const ringArc=svg('path',{class:'union-arc',d:arc(208,i*90+9,i*90+81)},$('#root-bundles'));
    const dot=svg('circle',{class:'fusion-point',cx:j[0],cy:j[1],r:4},$('#root-bundles'));
    bundles.push({live,len,ringArc,dot});
  }
  const rising=[];
  for(let i=0;i<16;i++){
    const p=point(132,i*22.5),q=point(39,i*22.5+30),r=point(88,i*22.5-20);
    const e=svg('path',{d:`M${p}Q${r} ${q}`},$('#rising-roots')),len=e.getTotalLength();e.style.strokeDasharray=len;e.style.strokeDashoffset=len;rising.push({e,len});
  }
  $('#symbol-palette').innerHTML=signs.map((s,i)=>`<button class="symbol-button" data-sign="${i}" aria-label="Trace ${s.name}">${pathIcon(i)}<span>${s.name}</span></button>`).join('');
  function fit(){const scale=innerWidth<=800?1:Math.min(innerWidth/1600,innerHeight/900);document.documentElement.style.setProperty('--scale',String(scale));document.body.style.height=innerWidth<=800?'auto':`${900*scale}px`;document.body.style.width=innerWidth<=800?'auto':`${1600*scale}px`;}
  addEventListener('resize',fit);fit();
  function ensureAudio(){
    if(muted)return;
    try{
      if(!audioContext)audioContext=new (window.AudioContext||window.webkitAudioContext)();
      if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
      if(voices.length)return;
      master=audioContext.createGain();master.gain.value=0;master.connect(audioContext.destination);
      [0,1,2].forEach(i=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=110*(i+1);gain.gain.value=i===0?.6:.25;osc.connect(gain);gain.connect(master);osc.start();voices.push({osc,gain});});
    }catch{muted=true;updateAudio();}
  }
  function silence(){if(master){master.gain.cancelScheduledValues(0);master.gain.value=0;master.disconnect();}voices.forEach(v=>{v.osc.stop();v.osc.disconnect();v.gain.disconnect();});voices=[];master=null;}
  function soundTick(now){
    if(!master||!audioContext)return;
    let gain=0,f=[110,165,220];
    if(warningUntil>now){gain=.13*(.5+.5*Math.sin((warningUntil-now)*.04));f=[155,161,310];}
    else if(locking){const p=Math.min(1,(now-locking.start)/locking.duration);gain=.085*Math.sin(p*Math.PI);const base=170+locking.sign*23;f=[base,base+65*(1-p),base/2];}
    else if(state==='buildup'){const p=Math.min(1,(now-stageStart)/2100);gain=.025+.1*p;f=[90+120*p,135+180*p,180+240*p];}
    else if(state==='breakthrough'){gain=.14;f=[220,330,440];}
    else if(state==='active'){gain=.035+.006*Math.sin(now/1200);f=[110,165,220];}
    master.gain.setTargetAtTime(gain,audioContext.currentTime,.025);voices.forEach((v,i)=>v.osc.frequency.setTargetAtTime(f[i],audioContext.currentTime,.03));
  }
  function caption(text){$('#caption').textContent=text;}
  function updateAudio(){$('#audio').setAttribute('aria-pressed',String(!muted));$('#audio span').textContent=muted?'Sound off':'Sound on';}
  function recent(){const last=read('loamwake.lastExchange.v1',{});if(Array.isArray(last.address)&&last.address.length===4&&last.address.every(i=>Number.isInteger(i)&&i>=0&&i<8))$('#last-route').textContent=`Last opened: ${routeName(last.address)}.`;}
  function routeName(a){return Object.values(routes).find(r=>r.address.join()===a.join())?.name||'Neighbor-to-neighbor';}
  function render(){
    $('#instrument').dataset.state=state;$('#instrument').classList.toggle('blocked',blocked);
    $('#union-count').innerHTML=`${String(address.length).padStart(2,'0')}<span>/04</span>`;
    $('#address-count').textContent=`${address.length} OF 4 JOINED`;
    $('#address').innerHTML=Array.from({length:4},(_,i)=>`<div class="address-slot ${address[i]!==undefined?'filled':''}"><span>0${i+1}</span>${address[i]!==undefined?pathIcon(address[i])+signs[address[i]].name:'···'}</div>`).join('');
    const busy=!!locking||!!auto||['buildup','breakthrough','active'].includes(state);
    $$('.symbol-button').forEach(b=>b.disabled=busy||address.length>=4);
    $$('.preset').forEach(b=>b.disabled=busy);
    $('#activate').disabled=state!=='ready';
    $('#hold').setAttribute('aria-pressed',String(hold));$('#hold').innerHTML=`<span></span>Soil hold: ${hold?'engaged':'released'}`;
    $('#phase').textContent=blocked?'SOIL HOLD':state.toUpperCase();
    const center={idle:['ROOTS FIND A WAY','Begin below.','FOUR SIGNS · ONE SHARED PATH'],composing:['A SMALL AGREEMENT',`${address.length} roots joined`,'EACH CONTACT HOLDS ITS OWN ARC'],ready:['FOUR AGREEMENTS HELD','A path is ready.','OPEN ONLY WHEN YOU CHOOSE'],buildup:['BUILDUP / DRAWING IN','Roots reach inward.','GATHERING AT THE CONTACT LINE'],breakthrough:['BREAKTHROUGH / CONTACT','The roots meet.','A SHARED PASSAGE TAKES HOLD'],active:['EXCHANGE IS OPEN','Life, in common.','A QUIET CURRENT BETWEEN NEIGHBORS']}[state];
    ['#center-kicker','#center-main','#center-sub'].forEach((s,i)=>$(s).textContent=center[i]);
    $('#ring-status').textContent=({idle:'AWAITING A TRACING',composing:'FORMING LOCAL CONTACT',ready:'AWAITING YOUR CHOICE',buildup:'DRAWING IN FILAMENTS',breakthrough:'CONTACT THRESHOLD',active:routeName(address).toUpperCase()})[state];
    bundles.forEach((b,i)=>{b.ringArc.classList.toggle('joined',i<address.length);b.dot.classList.toggle('joined',i<address.length);if(!locking||i!==address.length)b.live.style.strokeDashoffset=i<address.length?0:b.len;});
    for(let i=0;i<8;i++)$(`#node-${i}`).classList.toggle('lit',address.includes(i)||locking?.sign===i);
  }
  function startLock(sign,duration=900,now=null){
    if(address.length>=4||locking||['buildup','breakthrough','active'].includes(state))return;
    ensureAudio();now=now??performance.now();state='composing';blocked=false;locking={sign,start:now,duration};
    rotorAngle+=((sign*45-rotorAngle)%360+360)%360||360;$('#rotor').style.transform=`rotate(${rotorAngle}deg)`;
    $('#rotor').style.transitionDuration=`${duration/1000}s`;
    caption(`${auto?'Remembered tracing':'Tracing'} ${address.length+1} of 4: ${signs[sign].name}. Two root tips approach their junction.`);render();
  }
  function disengage(announce=true){
    state='idle';address=[];locking=null;auto=null;stageStart=0;blocked=false;warningUntil=0;rotorAngle=0;
    silence();$('#rotor').style.transitionDuration='0s';$('#rotor').style.transform='rotate(0deg)';
    rising.forEach(({e,len})=>e.style.strokeDashoffset=len);$('#phase-readout').textContent='UNION PRESSURE · 00%';$('.break-wave').setAttribute('r',155);
    if(announce)caption('Disengaged. Every root union is released; the soil is at rest.');render();
  }
  function preset(key){const r=routes[key];if(!r)return;disengage(false);showView('exchange');auto={address:r.address.slice(),next:0};startLock(auto.address[0],480);auto.next=1;}
  function activate(){
    if(state!=='ready')return;
    ensureAudio();
    if(hold){blocked=true;warningUntil=performance.now()+650;caption('RESTING-SOIL HOLD — Opening blocked. Release the soil hold to open this exchange.');render();return;}
    blocked=false;state='buildup';stageStart=performance.now();caption('Buildup: root filaments draw inward. The contact pressure is rising.');render();
  }
  function tick(now){
    if(locking){const p=Math.min(1,(now-locking.start)/locking.duration),b=bundles[address.length];b.live.style.strokeDashoffset=b.len*(1-p);$('#phase-readout').textContent=`LOCAL CONTACT · ${Math.round(p*100).toString().padStart(2,'0')}%`;
      if(p>=1){address.push(locking.sign);locking=null;if(address.length===4){auto=null;state='ready';caption(`Four root unions held. ${routeName(address)} is ready. Choose Open exchange; nothing opens automatically.`);$('#phase-readout').textContent='UNION PRESSURE · HELD';}else caption(`${address.length} of 4 joined. Choose the next sign.`);render();if(auto&&auto.next<4){const sign=auto.address[auto.next++];startLock(sign,480,now);}}
    }
    if(state==='buildup'){
      const p=Math.min(1,(now-stageStart)/2100);rising.forEach(({e,len})=>e.style.strokeDashoffset=len*(1-p));$('#phase-readout').textContent=`UNION PRESSURE · ${Math.round(p*100).toString().padStart(2,'0')}%`;
      if(p>=1){state='breakthrough';stageStart=now;caption('Breakthrough: the root tips meet. A bright contact wave crosses the union.');render();}
    }else if(state==='breakthrough'){
      const p=Math.min(1,(now-stageStart)/800);$('.break-wave').setAttribute('r',155+95*p);
      if(p>=1){state='active';stageStart=now;caption(`Exchange sustained with ${routeName(address)}. The roots carry a quiet, continuous chord. Disengage whenever you choose.`);$('#phase-readout').textContent='RECIPROCAL FLOW · STEADY';save('loamwake.lastExchange.v1',{address:[...address],routeName:routeName(address)});if(!storageFailed)recent();render();}
    }
    soundTick(now);requestAnimationFrame(tick);
  }
  function showView(next){view=next;$('#exchange-view').hidden=next!=='exchange';$('#atlas-view').hidden=next!=='atlas';$('#ledger-disengage').hidden=next!=='atlas';['exchange','atlas'].forEach(v=>{$(`#${v}-tab`).classList.toggle('selected',v===next);$(`#${v}-tab`).setAttribute('aria-pressed',String(v===next));});$('#view-name').textContent=next==='exchange'?'ROOT EXCHANGE':'FIELD LEDGER';if(next==='atlas')renderArchive();}
  function persistLedger(){save('loamwake.ledger.v1',{bookmarks:[...bookmarks],lastEntry:selectedEntry});}
  function selectEntry(id){if(!entries.some(e=>e.id===id))return;selectedEntry=id;persistLedger();renderArchive();$('#entry-detail').scrollTop=0;}
  function renderArchive(){
    const term=$('#archive-search').value.toLowerCase().trim();const filtered=entries.filter(e=>(!savedOnly||bookmarks.has(e.id))&&`${e.title} ${e.kind} ${e.lede} ${e.body}`.toLowerCase().includes(term));
    $('#entry-list').innerHTML=filtered.length?filtered.map(e=>`<button class="entry-choice" data-entry="${e.id}" aria-current="${e.id===selectedEntry}"><small>${e.kind}${bookmarks.has(e.id)?' / SAVED':''}</small><strong>${e.title}</strong></button>`).join(''):'<p role="status">No field notes match. Try another word or turn off the bookmark filter.</p>';
    const e=entries.find(e=>e.id===selectedEntry);const backlinks=entries.filter(x=>x.id!==e.id&&x.links.some(([id])=>id===e.id));
    $('#entry-detail').innerHTML=`<div class="detail-top"><span>${e.kind}</span><button class="bookmark" aria-pressed="${bookmarks.has(e.id)}">${bookmarks.has(e.id)?'Bookmarked ✓':'Bookmark +'}</button></div><h3 tabindex="-1">${e.title}</h3><p class="lede">${e.lede}</p><p>${e.body}</p><p class="field-observation">${e.note}</p><h4>FOLLOW THE CONNECTIONS</h4>${e.links.map(([id,rel])=>`<button class="relation" data-relation="${id}"><span><small>${rel}</small><br><strong>${entries.find(x=>x.id===id).title}</strong></span><span>↗</span></button>`).join('')}<h4>REFERENCED BY ${backlinks.length} FIELD NOTES</h4>${backlinks.map(x=>`<button class="relation" data-relation="${x.id}"><strong>${x.title}</strong><span>↗</span></button>`).join('')}${e.route?`<button class="entry-dial" data-ledger-route="${e.route}"><span>Trace a route to ${e.title}</span><span>↗</span></button>`:''}`;
  }
  $('#symbol-palette').addEventListener('click',e=>{const b=e.target.closest('[data-sign]');if(b&&!b.disabled&&!auto)startLock(Number(b.dataset.sign));});
  $$('.preset').forEach(b=>b.addEventListener('click',()=>preset(b.dataset.route)));
  $('#activate').addEventListener('click',activate);$('#disengage').addEventListener('click',()=>disengage());$('#ledger-disengage').addEventListener('click',()=>{disengage();showView('exchange');$('#disengage').focus();});
  $('#hold').addEventListener('click',()=>{hold=!hold;blocked=false;warningUntil=0;caption(hold?'Resting-soil hold engaged. Opening is blocked; disengage remains available.':'Resting-soil hold released. You may open a completed route.');render();});
  $('#audio').addEventListener('click',()=>{muted=!muted;if(muted)silence();else ensureAudio();save('loamwake.preferences.v1',{muted});updateAudio();});
  $('#home-link').addEventListener('click',e=>{e.preventDefault();showView('exchange');});
  $('#exchange-tab').addEventListener('click',()=>showView('exchange'));$('#atlas-tab').addEventListener('click',()=>showView('atlas'));
  $('#archive-search').addEventListener('input',renderArchive);
  $('#saved-filter').addEventListener('click',()=>{savedOnly=!savedOnly;$('#saved-filter').setAttribute('aria-pressed',String(savedOnly));renderArchive();});
  $('#entry-list').addEventListener('click',e=>{const b=e.target.closest('[data-entry]');if(b){selectEntry(b.dataset.entry);$(`[data-entry="${selectedEntry}"]`)?.focus();}});
  $('#entry-detail').addEventListener('click',e=>{const relation=e.target.closest('[data-relation]');if(relation){selectEntry(relation.dataset.relation);$('#entry-detail h3').focus();}if(e.target.closest('.bookmark')){bookmarks.has(selectedEntry)?bookmarks.delete(selectedEntry):bookmarks.add(selectedEntry);persistLedger();renderArchive();$('.bookmark').focus();}const route=e.target.closest('[data-ledger-route]');if(route){preset(route.dataset.ledgerRoute);$('#disengage').focus();}});
  // A read-only diagnostic snapshot lets local verification observe audio and state.
  window.loamwakeSnapshot=()=>({state,address:[...address],locking:locking?{sign:locking.sign,progress:Math.min(1,(performance.now()-locking.start)/locking.duration)}:null,auto:!!auto,hold,blocked,muted,view,audio:{context:audioContext?.state||'uncreated',voices:voices.length,gain:master?.gain.value||0},joinedArcs:$$('.union-arc.joined').length,liveOffsets:bundles.map(b=>Number(b.live.style.strokeDashoffset)),risingOffsets:rising.map(b=>Number(b.e.style.strokeDashoffset)),storageFailed});
  updateAudio();recent();render();requestAnimationFrame(tick);
})();
