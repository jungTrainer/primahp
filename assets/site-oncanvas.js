(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('preview') !== '1') return;

  const A = window.__app_id || 'prima-care-hospital-2026';
  const ORIGIN = location.origin === 'null' ? '*' : location.origin;
  const $ = id => document.getElementById(id);
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const sorted = a => [...a].sort((x, y) => (x.order ?? 999) - (y.order ?? 999));
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const FILES = ['staff','gallery','facilities','certifications','notices','departments','meals'];
  const GRIDS = {facilities:'facility-grid',staff:'staff-grid',gallery:'gallery-grid',certifications:'certification-grid',departments:'department-grid',meals:'meal-list',notices:'notice-list'};
  const LABEL = {facilities:'시설',staff:'의료진',gallery:'갤러리',certifications:'인증·평가',departments:'진료·케어',meals:'주간 식단',notices:'공지사항'};
  const FIELD_MAP = {
    'hero-eyebrow':['heroEyebrow','히어로 상단 문구'], 'hero-title':['homeTitle','히어로 제목'],
    'hero-description':['homeDesc','히어로 설명'], 'facility-intro':['facilityIntro','시설 소개 문구'],
    'certification-intro':['certificationIntro','인증 소개 문구'], 'about-title':['aboutTitle','병원소개 제목'],
    'about-body':['aboutBody','병원소개 본문'], 'guide-note':['guideNote','입·퇴원 및 제증명'],
    'hours-note':['hoursNote','진료시간'], 'visit-note':['visitNote','면회 안내'],
    'pricing-note':['pricingNote','비급여 안내'], 'floor-note':['floorNote','층별 안내'],
    'direction-subway':['dirSubway','지하철 안내'], 'direction-bus':['dirBus','버스 안내']
  };

  let db = null, mode = 'view', active = null, timer = 0, muting = false;
  const data = Object.fromEntries(FILES.map(k => [k, []]));
  let page = {};
  const sortables = new Map();
  const col = n => db?.collection('artifacts').doc(A).collection('public').doc('data').collection(n);
  const send = (action, extra = {}) => parent.postMessage({type:'prima-preview', action, ...extra}, ORIGIN);

  function css() {
    if ($('prima-canvas-style')) return;
    const s = document.createElement('style'); s.id = 'prima-canvas-style';
    s.textContent = `
      html.prima-edit-mode [data-edit],html.prima-edit-mode [data-item]{cursor:pointer;position:relative}
      html.prima-edit-mode [data-edit]:hover,html.prima-edit-mode [data-item]:hover{outline:1px solid #0369A1;outline-offset:3px}
      .prima-selected{outline:3px solid #0369A1!important;outline-offset:4px!important}
      .prima-edit-label{position:absolute;z-index:60;left:4px;top:4px;padding:3px 7px;border-radius:7px;background:#0369A1;color:#fff;font:700 10px/1.3 'Noto Sans KR',sans-serif;pointer-events:none;box-shadow:0 4px 12px rgba(15,23,42,.2)}
      .prima-drag-handle{position:absolute;z-index:65;right:8px;top:8px;display:none;border:0;border-radius:9px;background:rgba(15,23,42,.82);color:#fff;padding:5px 8px;font:700 10px/1 sans-serif;cursor:grab}
      html.prima-edit-mode .prima-drag-handle{display:block}
      .prima-canvas-add{display:none;margin:16px 0 0;border:1px dashed #0369A1;border-radius:12px;background:#fff;color:#0369A1;padding:10px 15px;font-size:12px;font-weight:900}
      html.prima-edit-mode .prima-canvas-add{display:inline-flex}
      .prima-sort-ghost{opacity:.35}.prima-sort-chosen{outline:3px solid #0369A1!important}
      html.prima-edit-mode a,html.prima-edit-mode button[data-view]{cursor:pointer}
    `;
    document.head.appendChild(s);
  }

  async function json(name) { try { const r = await fetch(`data/${name}.json`); return r.ok ? r.json() : []; } catch { return []; } }
  async function initData() {
    FILES.forEach(async name => { data[name] = await json(name); decorateSoon(); });
    try {
      if (!window.firebase || !window.__firebase_config) return;
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(window.__firebase_config); db = app.firestore();
      const p = await col('page-content').get(); p.docs.forEach(d => Object.assign(page, d.data()));
      await Promise.all(FILES.map(async name => { const s = await col(name).get(); if (!s.empty) data[name] = s.docs.map(d => ({id:d.id, ...d.data()})); }));
    } catch (e) { console.warn('온캔버스 데이터는 정적 기본값을 사용합니다.', e); }
    decorateSoon();
  }

  function mark(el, type, path, label, kind = '') {
    if (!el) return;
    el.dataset.edit = `${type}|${path}${kind ? `|${kind}` : ''}`;
    el.dataset.editLabel = label;
  }
  function applyPos(img, pos) { if (img) img.style.objectPosition = pos || '50% 50%'; }
  function titleOf(coll, x) { return coll === 'staff' ? (x.name || x.title) : coll === 'departments' ? x.name : x.title; }
  function matchCards(coll, root) {
    if (!root) return;
    const records = sorted(data[coll] || []);
    qsa(':scope > article', root).forEach((card, index) => {
      const heading = qs('h3', card)?.textContent.trim();
      const x = records.find(r => titleOf(coll, r) === heading) || records[index];
      if (!x?.id) return;
      card.dataset.item = `${coll}|${x.id}`; card.dataset.editLabel = `${LABEL[coll]} 카드`;
      const img = qs('img', card), imageField = coll === 'departments' ? 'image' : coll === 'meals' ? 'menuImage' : 'photo';
      if (img) { mark(img, 'image', `${coll}.${x.id}.${imageField}`, `${LABEL[coll]} 이미지`, coll); applyPos(img, x.photoPos); }
      if (!qs('.prima-drag-handle', card)) {
        const h = document.createElement('button'); h.type = 'button'; h.className = 'prima-drag-handle'; h.textContent = '⠿ 이동'; h.setAttribute('aria-label', `${LABEL[coll]} 순서 이동`); card.appendChild(h);
      }
    });
  }
  function matchLoose(coll, root, selector = 'article') {
    if (!root) return;
    const records = sorted(data[coll] || []), cards = qsa(`:scope > ${selector}`, root);
    cards.forEach((card, i) => {
      const heading = qs('h3', card)?.textContent.trim(); const x = records.find(r => titleOf(coll, r) === heading) || records[i];
      if (!x?.id) return;
      card.dataset.item = `${coll}|${x.id}`; card.dataset.editLabel = `${LABEL[coll]} 카드`;
      const img = qs('img', card), field = coll === 'meals' ? 'menuImage' : 'photo';
      if (img) { mark(img, 'image', `${coll}.${x.id}.${field}`, `${LABEL[coll]} 이미지`, coll); applyPos(img, x.photoPos); }
      if (!qs('.prima-drag-handle', card)) { const h=document.createElement('button');h.type='button';h.className='prima-drag-handle';h.textContent='⠿ 이동';card.appendChild(h); }
    });
  }
  function addButton(section, coll, anchor) {
    if (!section || qs(`.prima-canvas-add[data-coll="${coll}"]`, section)) return;
    const b = document.createElement('button'); b.type='button'; b.className='prima-canvas-add'; b.dataset.coll=coll; b.textContent=`＋ ${LABEL[coll]} 추가`; b.setAttribute('aria-label', `${LABEL[coll]} 추가`);
    (anchor || section).insertAdjacentElement('afterend', b);
  }
  function decorate() {
    muting = true;
    try {
      css();
      Object.entries(FIELD_MAP).forEach(([id,[field,label]]) => mark($(id),'text',`home.${field}`,label));
      const hero = $('hero-image'); mark(hero,'image','home.heroImage','히어로 이미지','hero'); applyPos(hero,page.heroImagePos);
      const mappings = [['facilities','facilities'],['staff','staff'],['gallery','gallery'],['certifications','certifications'],['departments','departments'],['meals','meals'],['notice','notices']];
      mappings.forEach(([sectionId,coll]) => { const s=$(sectionId); if(s)s.dataset.section=coll; });
      matchCards('facilities',$('facility-grid')); matchCards('staff',$('staff-grid')); matchCards('gallery',$('gallery-grid'));
      matchCards('certifications',$('certification-grid')); matchCards('departments',$('department-grid'));
      matchLoose('meals',$('meal-list')); matchCards('notices',$('notice-list'));
      addButton($('facilities'),'facilities',$('facility-grid')); addButton($('staff'),'staff',$('staff-grid'));
      addButton($('gallery'),'gallery',$('gallery-grid')); addButton($('certifications'),'certifications',$('certification-grid'));
      addButton($('departments'),'departments',$('department-grid')); addButton($('meals'),'meals',$('meal-list'));
      addButton($('notice'),'notices',$('notice-list'));
      bindSortables(); refreshLabels(); highlight(active);
    } finally { setTimeout(() => { muting = false; }, 0); }
  }
  function decorateSoon() { clearTimeout(timer); timer = setTimeout(decorate, 100); }

  function parseItem(el) { const [coll,id] = (el?.dataset.item || '').split('|'); return coll && id ? {coll,id} : null; }
  function parseEdit(el) {
    const [editType,path,uploadKind] = (el?.dataset.edit || '').split('|'); const parts = (path || '').split('.');
    if (parts[0] === 'home') return {kind:'field',editType,coll:'page-content',id:'home',field:parts[1],uploadKind,label:el.dataset.editLabel};
    return {kind:'field',editType,coll:parts[0],id:parts[1],field:parts[2],uploadKind,label:el.dataset.editLabel};
  }
  function sameTarget(el, t) {
    if (!el || !t) return false; const item=parseItem(el.closest('[data-item]')), edit=parseEdit(el.closest('[data-edit]'));
    return (item && item.coll===t.coll && item.id===t.id) || (edit && edit.coll===t.coll && edit.id===t.id && (!t.field || edit.field===t.field));
  }
  function clearHighlight(){qsa('.prima-selected').forEach(x=>x.classList.remove('prima-selected'));}
  function highlight(t) { clearHighlight(); active=t||null; if(!t)return; qsa('[data-edit],[data-item]').find(el=>sameTarget(el,t))?.classList.add('prima-selected'); }
  function refreshLabels() {
    qsa('.prima-edit-label').forEach(x=>x.classList.toggle('hidden',mode!=='edit')); if(mode!=='edit')return;
    qsa('[data-item][data-edit-label],[data-edit][data-edit-label]:not(img)').forEach(el=>{ if(el.querySelector(':scope > .prima-edit-label'))return; const b=document.createElement('span');b.className='prima-edit-label';b.textContent=el.dataset.editLabel;el.appendChild(b); });
  }
  function setMode(next) { mode=next==='edit'?'edit':'view'; document.documentElement.classList.toggle('prima-edit-mode',mode==='edit'); if(mode!=='edit')clearHighlight(); refreshLabels(); }

  function loadSortable() {
    if (window.Sortable) return Promise.resolve();
    return new Promise(resolve=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.2/Sortable.min.js';s.onload=resolve;s.onerror=resolve;document.head.appendChild(s);});
  }
  async function bindSortables() {
    if(mode!=='edit')return; await loadSortable(); if(!window.Sortable)return;
    Object.entries(GRIDS).forEach(([coll,id])=>{const g=$(id);if(!g||sortables.has(g))return; sortables.set(g,new Sortable(g,{animation:150,handle:'.prima-drag-handle',draggable:'[data-item]',ghostClass:'prima-sort-ghost',chosenClass:'prima-sort-chosen',onEnd:()=>send('reordered',{coll,orderedIds:qsa(':scope > [data-item]',g).map(x=>parseItem(x)?.id).filter(Boolean)})}));});
  }

  function selectFromClick(e) {
    if(mode!=='edit')return;
    const add=e.target.closest('.prima-canvas-add'); if(add){e.preventDefault();e.stopPropagation();const t={kind:'create',editType:'item',coll:add.dataset.coll,label:`${LABEL[add.dataset.coll]} 추가`};highlight(t);send('select',{target:t});return;}
    if(e.target.closest('.prima-drag-handle'))return;
    const editable=e.target.closest('[data-edit]'), item=e.target.closest('[data-item]'); if(!editable&&!item)return;
    e.preventDefault();e.stopPropagation(); let t;
    if(editable)t=parseEdit(editable);
    else {const x=parseItem(item);t={kind:'item',editType:'item',...x,label:item.dataset.editLabel};}
    highlight(t);send('select',{target:t});
  }

  let focal=null;
  function focalStart(e){if(mode!=='edit'||!active||e.button!==0)return;const img=e.target.closest('img[data-edit]');if(!img||!sameTarget(img,active))return;e.preventDefault();const p=(img.style.objectPosition||'50% 50%').match(/[\d.]+/g)||[50,50];focal={img,x:e.clientX,y:e.clientY,px:+p[0],py:+p[1],target:{...active,posField:active.coll==='page-content'?`${active.field}Pos`:'photoPos'}};img.setPointerCapture?.(e.pointerId);}
  function focalMove(e){if(!focal)return;const r=focal.img.getBoundingClientRect();const x=Math.max(0,Math.min(100,focal.px+(e.clientX-focal.x)/r.width*100));const y=Math.max(0,Math.min(100,focal.py+(e.clientY-focal.y)/r.height*100));focal.img.style.objectPosition=`${x.toFixed(0)}% ${y.toFixed(0)}%`;}
  function focalEnd(){if(!focal)return;const pos=focal.img.style.objectPosition||'50% 50%';send('focal',{target:focal.target,pos});focal=null;}

  function patch(message) {
    const t=message.target,d=message.data||{}; if(!t)return;
    if(t.coll==='page-content'&&t.field){const el=qsa('[data-edit]').find(x=>{const p=parseEdit(x);return p&&p.coll===t.coll&&p.id===t.id&&p.field===t.field;});if(!el)return;const v=d[t.field]??'';if(t.editType==='image'){el.src=v||el.src;applyPos(el,d[`${t.field}Pos`]);}else if(t.field==='homeTitle')el.innerHTML=esc(v).replace(/&lt;br\s*\/?&gt;|\n/gi,'<br>');else el.textContent=v;return;}
    const card=qsa('[data-item]').find(x=>{const p=parseItem(x);return p&&p.coll===t.coll&&p.id===t.id;});if(!card)return;
    const schema={staff:['name','position','bio','photo'],facilities:['title','category','desc','photo'],gallery:['title','date','desc','photo'],certifications:['title','year','desc','photo'],departments:['name','summary','detail','image'],meals:['title','periodStart','note','menuImage'],notices:['title','createdAt','body']}[t.coll]||[];
    const texts=qsa('h3,p,span',card); schema.forEach(k=>{if(!(k in d))return;if(['photo','image','menuImage'].includes(k)){const img=qs('img',card);if(img)img.src=d[k];}else{const el=texts.find(x=>x.textContent.trim()===(page.__old?.[k]||'') )|| (k==='name'||k==='title'?qs('h3',card):null);if(el)el.textContent=d[k]??'';}});applyPos(qs('img',card),d.photoPos);
  }

  window.addEventListener('message',e=>{if(e.source!==parent||!e.data||e.data.type!=='prima-preview')return;if(location.origin!=='null'&&e.origin!==location.origin)return;const m=e.data;if(m.action==='setMode')setMode(m.mode);if(m.action==='highlight')highlight(m.target);if(m.action==='oncanvasPatch')patch(m);if(m.action==='reload')location.reload();if(m.action==='route')setTimeout(decorateSoon,50);});
  document.addEventListener('click',selectFromClick,true);document.addEventListener('pointerdown',focalStart,true);document.addEventListener('pointermove',focalMove,true);document.addEventListener('pointerup',focalEnd,true);document.addEventListener('pointercancel',focalEnd,true);
  new MutationObserver(()=>{if(!muting)decorateSoon();}).observe(document.documentElement,{subtree:true,childList:true});
  css();initData();decorateSoon();send('ready');
})();