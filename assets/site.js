(() => {
  'use strict';

  const APP_ID = window.__app_id || 'prima-care-hospital-2026';
  const PRIVACY_VERSION = '2026-07-15';
  const PREVIEW = new URLSearchParams(location.search).get('preview') === '1';
  const DEPARTMENTS = { medical: '의료부', nursing: '간호부', rehab: '재활치료과', admin: '행정지원과' };
  const FALLBACK_FACILITIES = [
    { id: 'fallback-building', category: '병원 전경', title: '연산역 인근의 편리한 접근성', desc: '부산광역시 연제구 고분로 4에 위치하며 전화로 방문 상담을 안내합니다.', photo: 'assets/home.png', order: 10 },
    { id: 'fallback-care-space', category: '진료·재활', title: '진료와 재활을 연계하는 병원', desc: '외과, 재활의학과, 한방진료와 간병서비스를 환자 상태에 맞춰 안내합니다.', photo: 'assets/home.png', order: 20 },
    { id: 'fallback-life-space', category: '입원 생활', title: '생활과 간병을 함께 지원', desc: '병실과 생활 공간은 입원 상담과 방문 상담을 통해 자세히 확인할 수 있습니다.', photo: 'assets/home.png', order: 30 }
  ];

  const state = {
    auth: null, db: null, firebaseReady: false, page: {}, staff: [], gallery: [], facilities: [], certifications: [], notices: [], departments: [], meals: [], draft: null, activeDepartment: 'medical', mealVisible: 6, map: null
  };

  const $ = id => document.getElementById(id);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const sortByOrder = items => [...items].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const collection = name => state.db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection(name);

  function safeImageUrl(value, fallback = 'assets/home.png') {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    if (PREVIEW && (raw.startsWith('data:image/') || raw.startsWith('blob:'))) return raw;
    try {
      const parsed = new URL(raw, location.href);
      const allowedRemote = ['firebasestorage.googleapis.com', 'storage.googleapis.com'].includes(parsed.hostname);
      if (parsed.origin === location.origin || allowedRemote) return parsed.href;
    } catch (_) { return fallback; }
    return fallback;
  }

  function imageMarkup(src, alt, options = {}) {
    const loading = options.eager ? 'eager' : 'lazy';
    const priority = options.eager ? ' fetchpriority="high"' : '';
    const width = options.width || 800;
    const height = options.height || 600;
    const pos = esc(options.pos || '50% 50%');
    return `<img src="${esc(safeImageUrl(src, options.fallback))}" alt="${esc(alt)}" width="${width}" height="${height}" loading="${loading}" decoding="async"${priority} style="object-position:${pos}">`;
  }

  function isPlaceholder(record) {
    const id = String(record?.id || '').toLowerCase();
    const title = String(record?.title || record?.name || '').toLowerCase();
    const photo = String(record?.photo || record?.image || record?.menuImage || '').toLowerCase();
    return id.includes('placeholder') || photo.includes('placeholder') || title.includes('등록해') || title.includes('준비 중') || title.includes('등록 예정');
  }

  function withDraft(kind, items) {
    if (!PREVIEW || !state.draft || state.draft.kind !== kind) return items;
    return [{ id: '__preview__', order: -1, ...state.draft.data }, ...items];
  }

  async function fetchJson(path, fallback) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error(String(response.status));
      return await response.json();
    } catch (_) { return fallback; }
  }

  function initFirebase() {
    if (!window.firebase || !window.__firebase_config) return;
    try {
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(window.__firebase_config);
      state.auth = app.auth(); state.db = app.firestore(); state.firebaseReady = true;
    } catch (error) { console.warn('Firebase 연결 없이 정적 안내를 표시합니다.', error); }
  }

  async function withTimeout(promise, timeoutMs) {
    return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))]);
  }

  async function loadCloudData() {
    if (!state.firebaseReady) return;
    try {
      const names = ['staff', 'gallery', 'facilities', 'certifications', 'notices', 'departments', 'meals'];
      const [pageSnapshot, ...snapshots] = await withTimeout(Promise.all([collection('page-content').get(), ...names.map(name => collection(name).get())]), 4500);
      pageSnapshot.docs.forEach(doc => Object.assign(state.page, doc.data()));
      names.forEach((name, index) => { const snapshot = snapshots[index]; if (!snapshot.empty) state[name] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); });
    } catch (error) { console.warn('Firestore 응답이 없어 정적 안내를 유지합니다.', error); }
  }

  function applyText(id, value) {
    const element = $(id);
    if (element && value !== undefined && value !== null && value !== '') element.textContent = value;
  }

  function applyPageContent() {
    const page = state.page;
    applyText('hero-eyebrow', page.heroEyebrow);
    const heroTitle = $('hero-title');
    if (heroTitle && page.homeTitle) heroTitle.innerHTML = esc(page.homeTitle).replace(/&lt;br\s*\/?&gt;|\n/gi, '<br class="desktop-break">');
    applyText('hero-description', page.homeDesc); applyText('facility-intro', page.facilityIntro); applyText('certification-intro', page.certificationIntro); applyText('about-title', page.aboutTitle); applyText('guide-note', page.guideNote); applyText('hours-note', page.hoursNote); applyText('visit-note', page.visitNote); applyText('pricing-note', page.pricingNote); applyText('floor-note', page.floorNote); applyText('direction-subway', page.dirSubway); applyText('direction-bus', page.dirBus);
    const aboutBody = $('about-body');
    if (aboutBody && page.aboutBody) aboutBody.innerHTML = String(page.aboutBody).split(/\n{2,}/).map(paragraph => `<p>${esc(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
    const heroImage = $('hero-image');
    if (heroImage) {
      const src = safeImageUrl(page.heroImage, 'assets/home.png');
      heroImage.src = src; heroImage.alt = page.heroImageAlt || '프리마요양병원 전경'; heroImage.style.objectPosition = page.heroImagePos || '50% 50%'; heroImage.loading = 'eager'; heroImage.fetchPriority = 'high';
      const absolute = new URL(src, location.href).href;
      const og = document.querySelector('meta[property="og:image"]'); const twitter = document.querySelector('meta[name="twitter:image"]');
      if (og) og.content = absolute; if (twitter) twitter.content = absolute;
    }
  }

  function detailsFrom(record) {
    const raw = record.detail || '';
    if (Array.isArray(raw)) return raw;
    return String(raw).split(/\s*\|\s*|\n+/).map(value => value.trim()).filter(Boolean);
  }

  function renderDepartments() {
    const records = sortByOrder(withDraft('departments', state.departments)).filter(record => !isPlaceholder(record));
    const detailGrid = $('department-grid'); const homeGrid = $('home-care-grid');
    if (!detailGrid || !homeGrid) return;
    detailGrid.innerHTML = records.map(record => {
      const details = detailsFrom(record); const id = esc(record.id || crypto.randomUUID());
      return `<article id="department-${id}" class="department-card" data-item="departments|${id}"><div class="department-card-media">${imageMarkup(record.image, `프리마요양병원 ${record.name} 안내`, { pos: record.photoPos, fallback: 'assets/home.png' })}</div><div class="department-card-body"><div class="department-title"><i class="${esc(record.icon || 'fa-solid fa-stethoscope')}" aria-hidden="true"></i><h3>${esc(record.name)}</h3></div><p>${esc(record.summary)}</p><ul class="department-details">${details.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div></article>`;
    }).join('') || '<div class="empty-state">진료·케어 정보를 준비하고 있습니다. 입원·원무 상담은 051-867-7500으로 문의해 주세요.</div>';
    homeGrid.innerHTML = records.slice(0, 4).map(record => {
      const details = detailsFrom(record).slice(0, 4);
      return `<article class="care-card"><i class="${esc(record.icon || 'fa-solid fa-stethoscope')}" aria-hidden="true"></i><h3>${esc(record.name)}</h3><p>${esc(record.summary)}</p><ul>${details.map(item => `<li>${esc(item)}</li>`).join('')}</ul><a class="text-link" href="#department-${esc(record.id)}" data-view="departments" data-dept="${esc(record.id)}">자세히 보기 <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></article>`;
    }).join('');
    bindRouteLinks(homeGrid);
  }

  function facilityRecords() {
    const records = sortByOrder(withDraft('facilities', state.facilities)).filter(record => !isPlaceholder(record));
    return records.length ? records : FALLBACK_FACILITIES;
  }

  function facilityCard(record, compact = false) {
    const id = esc(record.id || crypto.randomUUID());
    return `<article class="photo-card" data-item="facilities|${id}"${compact ? ' data-summary-card="true"' : ''}>${imageMarkup(record.photo, record.title || '프리마요양병원 시설', { pos: record.photoPos, fallback: 'assets/home.png' })}<div><span>${esc(record.category || '병원 시설')}</span><h3>${esc(record.title || '프리마요양병원 시설')}</h3>${compact ? '' : `<p>${esc(record.desc || '')}</p>`}</div></article>`;
  }

  function renderFacilities() {
    const records = facilityRecords(); const detail = $('facility-grid'); const home = $('home-facility-grid');
    if (detail) detail.innerHTML = records.map(record => facilityCard(record)).join('');
    if (home) home.innerHTML = records.slice(0, 3).map(record => facilityCard(record, true)).join('');
  }

  function renderStaffTabs() {
    const tabs = $('staff-tabs'); if (!tabs) return;
    tabs.innerHTML = Object.entries(DEPARTMENTS).map(([key, label]) => `<button type="button" role="tab" aria-selected="${key === state.activeDepartment}" data-staff-department="${key}">${label}</button>`).join('');
    qsa('[data-staff-department]', tabs).forEach(button => button.addEventListener('click', () => { state.activeDepartment = button.dataset.staffDepartment; renderStaffTabs(); renderStaff(); }));
  }

  function renderStaff() {
    const grid = $('staff-grid'); if (!grid) return;
    const records = sortByOrder(withDraft('staff', state.staff)).filter(record => !isPlaceholder(record) && (record.department === state.activeDepartment || record.id === '__preview__'));
    grid.innerHTML = records.map(record => `<article class="staff-card" data-item="staff|${esc(record.id)}"><div class="staff-card-media">${imageMarkup(record.photo, `${record.name || '의료진'} 사진`, { pos: record.photoPos, fallback: 'assets/logo.png', width: 640, height: 480 })}</div><div class="staff-card-body"><span>${esc(record.position || '')}</span><h3>${esc(record.name || record.title || '')}</h3><p>${esc(record.bio || record.desc || '')}</p></div></article>`).join('') || '<div class="empty-state">게시 동의가 확인된 의료진 정보를 준비하고 있습니다.</div>';
  }

  function renderGallery() {
    const grid = $('gallery-grid'); if (!grid) return;
    const records = sortByOrder(withDraft('gallery', state.gallery)).filter(record => !isPlaceholder(record));
    grid.innerHTML = records.map(record => `<article class="photo-card" data-item="gallery|${esc(record.id)}">${imageMarkup(record.photo, record.title || '프리마요양병원 프로그램 사진', { pos: record.photoPos, fallback: 'assets/home.png' })}<div><span>${esc(record.date || '')}</span><h3>${esc(record.title || '')}</h3><p>${esc(record.desc || '')}</p></div></article>`).join('') || '<div class="empty-state">게시 동의가 확인된 가족갤러리 사진을 준비하고 있습니다.</div>';
  }

  function renderCertifications() {
    const detail = $('certification-grid'); const home = $('home-certification-grid');
    const records = sortByOrder(withDraft('certifications', state.certifications)).filter(record => !isPlaceholder(record));
    if (detail) detail.innerHTML = records.map(record => `<article class="cert-card" data-item="certifications|${esc(record.id)}"><div class="cert-card-media">${imageMarkup(record.photo, `${record.title} 증빙 이미지`, { pos: record.photoPos, fallback: 'assets/logo.png', width: 640, height: 480 })}</div><span>${esc(record.year || '')}</span><h3>${esc(record.title || '')}</h3><p>${esc(record.desc || '')}</p></article>`).join('') || '<div class="empty-state">게시 가능한 인증·평가 자료를 확인 중입니다. 자세한 내용은 원무과로 문의해 주세요.</div>';
    if (home && records.length) home.innerHTML = records.slice(0, 3).map(record => `<article><strong>${esc(record.title)}</strong><span>${esc(record.year || '증빙 확인')}</span></article>`).join('');
  }

  function renderNotices() {
    const list = $('notice-list'); const select = $('comment-notice');
    const records = sortByOrder(withDraft('notices', state.notices)).filter(record => !isPlaceholder(record));
    if (list) list.innerHTML = records.map(record => `<article class="notice-card" data-item="notices|${esc(record.id)}"><span>${esc(record.createdAt || '')}</span><h3>${esc(record.title || '')}</h3><p>${esc(record.body || record.desc || '')}</p></article>`).join('') || '<div class="empty-state">등록된 공지사항이 없습니다.</div>';
    if (select) { select.innerHTML = records.length ? records.map(record => `<option value="${esc(record.id)}">${esc(record.title)}</option>`).join('') : '<option value="">등록된 공지 없음</option>'; select.disabled = records.length === 0; }
  }

  function bindLightbox() {
    const box = $('meal-lightbox'); if (!box) return;
    qsa('.meal-image').forEach(button => button.addEventListener('click', () => { const image = box.querySelector('img'); image.src = button.dataset.src; box.hidden = false; box.querySelector('button').focus(); }));
    const close = () => { box.hidden = true; };
    box.querySelector('button')?.addEventListener('click', close); box.addEventListener('click', event => { if (event.target === box) close(); });
  }

  function renderMeals() {
    const list = $('meal-list'); const more = $('meal-more'); if (!list || !more) return;
    const records = [...withDraft('meals', state.meals)].filter(record => !isPlaceholder(record)).sort((a, b) => String(b.periodStart || '').localeCompare(String(a.periodStart || '')));
    list.innerHTML = records.slice(0, state.mealVisible).map(record => {
      const menuImage = safeImageUrl(record.menuImage, 'assets/logo.png'); const photos = Array.isArray(record.photos) ? record.photos : [];
      return `<article class="meal-card" data-item="meals|${esc(record.id)}"><div class="meal-card-header"><span>${esc(record.periodStart || '')}</span><h3>${esc(record.title || '주간 식단')}</h3><p>${esc(record.note || '')}</p></div><button type="button" class="meal-image" data-src="${esc(menuImage)}" aria-label="${esc(record.title || '주간 식단')} 이미지 확대">${imageMarkup(menuImage, `${record.title || '주간 식단'} 식단표`, { fallback: 'assets/logo.png', width: 1200, height: 1600 })}</button>${photos.length ? `<div class="meal-photos">${photos.map((photo, index) => { const src = safeImageUrl(typeof photo === 'string' ? photo : photo.url, 'assets/logo.png'); return `<button type="button" class="meal-image" data-src="${esc(src)}" aria-label="음식 사진 ${index + 1} 확대">${imageMarkup(src, `음식 사진 ${index + 1}`, { fallback: 'assets/logo.png', width: 500, height: 500 })}</button>`; }).join('')}</div>` : ''}</article>`;
    }).join('') || '<div class="empty-state">등록된 식단표가 없습니다.</div>';
    more.hidden = state.mealVisible >= records.length; more.onclick = () => { state.mealVisible += 6; renderMeals(); }; bindLightbox();
  }

  function applyLayoutVisibility() {
    const hiddenSections = Array.isArray(state.page.sectionsHidden) ? state.page.sectionsHidden : [];
    qsa('[data-view]').forEach(link => { const view = link.dataset.view; link.hidden = view && hiddenSections.includes(view); });
  }

  function renderAll() { applyPageContent(); renderDepartments(); renderFacilities(); renderStaffTabs(); renderStaff(); renderGallery(); renderCertifications(); renderNotices(); renderMeals(); applyLayoutVisibility(); }

  function hashFor(view, detail) { if (view === 'departments' && detail) return `#departments/${detail}`; if (view === 'admission' && detail) return `#admission/${detail}`; return `#${view || 'home'}`; }
  function parseHash() {
    const [view, detail] = (location.hash || '#home').slice(1).split('/');
    const valid = ['home', 'about', 'departments', 'facilities', 'staff', 'certifications', 'programs', 'meals', 'gallery', 'admission', 'guide', 'notice', 'directions'];
    return { view: valid.includes(view) ? view : 'home', detail };
  }

  function closeMobileMenu() {
    const menu = $('mobile-menu'); const button = $('mobile-menu-button'); if (menu) menu.hidden = true;
    if (button) { button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', '모바일 메뉴 열기'); const icon = button.querySelector('i'); if (icon) icon.className = 'fa-solid fa-bars'; }
  }

  function route(view, options = {}) {
    const homeSections = qsa('[data-home-section]'); const detailSections = qsa('[data-route-section]');
    if (view === 'home') { homeSections.forEach(section => { section.hidden = false; }); detailSections.forEach(section => { section.hidden = true; }); }
    else { homeSections.forEach(section => { section.hidden = true; }); detailSections.forEach(section => { section.hidden = section.id !== view; }); }
    document.body.dataset.activeView = view; closeMobileMenu(); qsa('[data-view]').forEach(link => link.classList.toggle('is-active', link.dataset.view === view)); if (view === 'directions') setTimeout(initMap, 50);
    const detail = options.detail || options.dept || options.anchor; if (options.updateHash !== false) history.pushState(null, '', hashFor(view, detail));
    const scrollTarget = options.dept ? $(`department-${options.dept}`) : options.anchor ? $(options.anchor) : view === 'home' ? $('home') : $(view);
    if (options.scroll !== false && scrollTarget) requestAnimationFrame(() => scrollTarget.scrollIntoView({ behavior: PREVIEW ? 'auto' : 'smooth', block: 'start' }));
  }

  function bindRouteLinks(root = document) {
    qsa('[data-view]', root).forEach(link => {
      if (link.dataset.routeBound === '1') return; link.dataset.routeBound = '1';
      link.addEventListener('click', event => { event.preventDefault(); route(link.dataset.view, { dept: link.dataset.dept, anchor: link.dataset.anchor }); });
    });
  }

  function setupNavigation() {
    bindRouteLinks();
    const mobileButton = $('mobile-menu-button'); const mobileMenu = $('mobile-menu');
    mobileButton?.addEventListener('click', () => { const open = mobileButton.getAttribute('aria-expanded') === 'true'; mobileButton.setAttribute('aria-expanded', String(!open)); mobileButton.setAttribute('aria-label', open ? '모바일 메뉴 열기' : '모바일 메뉴 닫기'); mobileMenu.hidden = open; const icon = mobileButton.querySelector('i'); if (icon) icon.className = open ? 'fa-solid fa-bars' : 'fa-solid fa-xmark'; });
    qsa('.mobile-submenu-toggle').forEach(button => button.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') === 'true'; button.setAttribute('aria-expanded', String(!open)); const submenu = button.nextElementSibling; if (submenu) submenu.hidden = open; }));
    qsa('.nav-group-toggle').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); const group = button.closest('.nav-group'); const open = group.classList.contains('is-open'); qsa('.nav-group').forEach(item => { item.classList.remove('is-open'); item.querySelector('.nav-group-toggle')?.setAttribute('aria-expanded', 'false'); }); if (!open) { group.classList.add('is-open'); button.setAttribute('aria-expanded', 'true'); } }));
    document.addEventListener('click', () => qsa('.nav-group').forEach(item => { item.classList.remove('is-open'); item.querySelector('.nav-group-toggle')?.setAttribute('aria-expanded', 'false'); }));
    window.addEventListener('popstate', () => { const parsed = parseHash(); route(parsed.view, { detail: parsed.detail, dept: parsed.view === 'departments' ? parsed.detail : undefined, anchor: parsed.view === 'admission' ? parsed.detail : undefined, updateHash: false }); });
  }

  function setupAccordions() {
    qsa('[data-accordion-group] .accordion-item button').forEach(button => button.addEventListener('click', () => { const item = button.closest('.accordion-item'); const panel = button.nextElementSibling; const open = button.getAttribute('aria-expanded') === 'true'; button.setAttribute('aria-expanded', String(!open)); item.classList.toggle('is-open', !open); panel.hidden = open; }));
  }

  function showStatus(id, message, type = 'warning') { const box = $(id); if (!box) return; box.hidden = false; box.className = `form-status full ${type}`; box.textContent = message; }
  async function anonymousUser() { if (!state.auth) throw new Error('Firebase 연결 전입니다.'); if (state.auth.currentUser) return state.auth.currentUser; return state.auth.signInAnonymously(); }

  function setupForms() {
    const inquiry = $('inquiry-form');
    inquiry?.addEventListener('submit', async event => {
      event.preventDefault(); const button = inquiry.querySelector('button[type="submit"]'); const name = $('inquiry-name').value.trim(); const phone = $('inquiry-phone').value.trim(); const message = $('inquiry-message').value.trim();
      if (!/^(01[016789]|02|0[3-9][0-9])-[0-9]{3,4}-[0-9]{4}$/.test(phone)) { showStatus('inquiry-status', '전화번호 형식을 010-0000-0000 형태로 입력해 주세요.', 'error'); $('inquiry-phone').focus(); return; }
      if (!state.firebaseReady) { showStatus('inquiry-status', '온라인 접수 연결이 원활하지 않습니다. 051-867-7500으로 전화해 주세요.', 'warning'); return; }
      button.disabled = true;
      try {
        await anonymousUser(); const now = new Date(); const receiptNo = `PR-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(now.getTime()).slice(-8)}`;
        await collection('inquiries').add({ receiptNo, name, phone, type: $('inquiry-room').value, message, status: '신규', followUp: false, memos: [], privacyConsent: true, sensitiveConsent: true, consentedAt: now.toISOString(), privacyPolicyVersion: PRIVACY_VERSION, createdAt: now.toISOString().slice(0, 10) });
        inquiry.reset(); showStatus('inquiry-status', `접수되었습니다. 접수번호: ${receiptNo}`, 'success');
      } catch (error) { console.error(error); showStatus('inquiry-status', '저장에 실패했습니다. 입력 내용은 유지됩니다. 051-867-7500으로 전화해 주세요.', 'error'); }
      finally { button.disabled = false; }
    });

    const comment = $('comment-form');
    comment?.addEventListener('submit', async event => {
      event.preventDefault(); const notice = state.notices.find(item => String(item.id) === String($('comment-notice').value));
      if (!notice || !state.firebaseReady) { showStatus('comment-status', '온라인 문의 연결이 원활하지 않습니다. 입원 상담은 051-867-7500으로 문의해 주세요.', 'warning'); return; }
      const button = comment.querySelector('button[type="submit"]'); button.disabled = true;
      try {
        await anonymousUser(); await collection('comments').add({ author: $('comment-author').value.trim(), noticeId: String(notice.id), noticeTitle: notice.title, comment: $('comment-text').value.trim(), isAnswered: false, privacyConsent: true, consentedAt: new Date().toISOString(), privacyPolicyVersion: PRIVACY_VERSION, createdAt: new Date().toISOString() });
        comment.reset(); renderNotices(); showStatus('comment-status', '문의가 등록되었습니다.', 'success');
      } catch (error) { console.error(error); showStatus('comment-status', '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'error'); }
      finally { button.disabled = false; }
    });
  }

  function initMap() {
    if (state.map || !window.L || !$('live-map-container')) return;
    const container = $('live-map-container'); container.innerHTML = '';
    try { state.map = L.map(container).setView([35.1862, 129.0802], 17); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(state.map); L.marker([35.1862, 129.0802]).addTo(state.map).bindPopup('프리마요양병원').openPopup(); }
    catch (error) { console.warn('지도를 불러오지 못해 주소 안내를 유지합니다.', error); container.innerHTML = '<div class="map-fallback"><strong>프리마요양병원</strong><span>부산광역시 연제구 고분로 4</span><a href="tel:051-867-7500">051-867-7500</a></div>'; }
  }

  function setupPreviewMessaging() {
    if (!PREVIEW) return; document.body.classList.add('is-preview');
    window.addEventListener('message', event => {
      if (event.source !== parent || !event.data || event.data.type !== 'prima-preview') return;
      if (location.origin !== 'null' && event.origin !== location.origin) return;
      const message = event.data;
      if (message.action === 'route') route(message.view || 'home', { updateHash: false, scroll: false });
      if (message.action === 'content') { state.page = { ...state.page, ...(message.payload || {}) }; renderAll(); route(message.view || 'home', { updateHash: false, scroll: false }); }
      if (message.action === 'draft') { state.draft = message.payload; renderAll(); route(message.view || 'home', { updateHash: false, scroll: false }); }
      if (message.action === 'clear') { state.draft = null; renderAll(); }
      if (message.action === 'reload') location.reload();
    });
  }

  async function load() {
    setupNavigation(); setupAccordions(); setupForms(); setupPreviewMessaging();
    const initial = parseHash(); route(initial.view, { detail: initial.detail, dept: initial.view === 'departments' ? initial.detail : undefined, anchor: initial.view === 'admission' ? initial.detail : undefined, updateHash: false, scroll: false });
    initFirebase();
    const defaults = await Promise.all([fetchJson('data/site-content.json', {}), fetchJson('data/staff.json', []), fetchJson('data/gallery.json', []), fetchJson('data/facilities.json', []), fetchJson('data/certifications.json', []), fetchJson('data/notices.json', []), fetchJson('data/departments.json', []), fetchJson('data/meals.json', [])]);
    [state.page, state.staff, state.gallery, state.facilities, state.certifications, state.notices, state.departments, state.meals] = defaults; renderAll(); await loadCloudData(); renderAll();
    if (PREVIEW) parent.postMessage({ type: 'prima-preview-ready' }, location.origin === 'null' ? '*' : location.origin);
  }

  load().catch(error => {
    console.error('홈페이지 초기화 오류', error);
    const toast = $('toast'); if (toast) { toast.hidden = false; toast.textContent = '일부 정보를 불러오지 못했습니다. 전화 상담은 051-867-7500으로 가능합니다.'; }
  });
})();
