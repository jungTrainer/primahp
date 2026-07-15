(() => {
  'use strict';
  const A = window.__app_id || 'prima-care-hospital-2026';
  let auth, db, storage, user, homePhoto = '', previewPhoto = '', pendingBlob = null, sortable = null;

  // 슬롯(칸)별 이미지 비율 — 업로드 이미지를 이 비율로 잘라 왜곡 없이 칸에 맞춥니다.
  const ASPECT = { facilities: 16 / 9, staff: 4 / 3, gallery: 16 / 9, certifications: NaN, hero: 16 / 9 };
  const ASPECT_LABEL = { facilities: '16:9 (시설)', staff: '4:3 (의료진)', gallery: '16:9 (갤러리)', certifications: '자유 (인증서)', hero: '16:9 (대표 배너)' };

  const $ = id => document.getElementById(id),
    col = n => db.collection('artifacts').doc(A).collection('public').doc('data').collection(n),
    esc = v => String(v ?? '').replace(/[&<>'"]/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[x])),
    viewOf = k => ({ facilities: 'facilities', staff: 'staff', gallery: 'gallery', certifications: 'about' }[k]);

  function note(m, type = 'success') {
    let b = $('msg'), s = { success: 'border-emerald-200 bg-emerald-50 text-emerald-900', error: 'border-rose-200 bg-rose-50 text-rose-900' };
    b.className = `mb-5 rounded-xl border p-4 text-xs ${s[type]}`;
    b.textContent = m;
    b.classList.remove('hidden');
  }

  function fileOK(f) {
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) throw Error('JPG, PNG, WEBP 이미지만 가능합니다.');
    if (f.size > 5 * 1024 * 1024) throw Error('이미지는 5MB 이하로 줄여 주세요.');
  }

  // File 또는 Blob(크롭 결과) 모두 업로드 가능
  async function upload(f, kind) {
    if (!f) return '';
    fileOK(f);
    let ext = (f.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg'),
      base = (f.name || `image.${ext}`).toLowerCase().replace(/[^a-z0-9._-]/g, '-'),
      r = storage.ref(`public/${kind}/${Date.now()}-${base}`);
    await r.put(f, { contentType: f.type });
    return r.getDownloadURL();
  }

  /* ---------------- 이미지 크롭(칸 맞춤) 모달 ---------------- */
  let cropper = null, cropCb = null, cropObjectUrl = '';
  function ensureCropModal() {
    if ($('crop-modal')) return;
    let m = document.createElement('div');
    m.id = 'crop-modal';
    m.className = 'fixed inset-0 z-50 hidden items-center justify-center bg-black/70 p-4';
    m.innerHTML = `
      <div class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white">
        <div class="flex items-center justify-between border-b border-brand-border px-5 py-3">
          <div><strong class="text-sm">이미지 위치·크기 맞춤</strong><span id="crop-ratio" class="ml-2 text-xs text-slate-500"></span></div>
          <button id="crop-cancel" type="button" class="rounded-lg border px-3 py-1.5 text-xs font-bold">취소</button>
        </div>
        <div class="bg-slate-100 p-3"><div class="mx-auto max-h-[60vh] overflow-hidden"><img id="crop-img" class="block max-w-full" alt=""></div></div>
        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-brand-border px-5 py-3">
          <div class="flex gap-1">
            <button data-rot="-90" type="button" class="crop-tool rounded-lg border px-3 py-2 text-xs font-bold">↺ 회전</button>
            <button data-rot="90" type="button" class="crop-tool rounded-lg border px-3 py-2 text-xs font-bold">회전 ↻</button>
            <button id="crop-reset" type="button" class="rounded-lg border px-3 py-2 text-xs font-bold">초기화</button>
          </div>
          <p class="text-[11px] text-slate-500">드래그로 위치 이동, 모서리로 크기 조절, 휠로 확대·축소</p>
          <button id="crop-apply" type="button" class="rounded-xl bg-brand-blue px-5 py-2.5 text-xs font-bold text-white">이 위치로 적용</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    $('crop-cancel').onclick = closeCrop;
    $('crop-reset').onclick = () => cropper && cropper.reset();
    document.querySelectorAll('.crop-tool').forEach(b => b.onclick = () => cropper && cropper.rotate(Number(b.dataset.rot)));
    $('crop-apply').onclick = applyCrop;
  }
  function openCrop(file, kind, cb) {
    if (!file) return;
    try { fileOK(file); } catch (e) { return note(e.message, 'error'); }
    if (!window.Cropper) { // 라이브러리 미로드 시 크롭 없이 원본 사용
      previewFile(file, cb); pendingBlob = file; return;
    }
    ensureCropModal();
    cropCb = cb;
    cropObjectUrl = URL.createObjectURL(file);
    $('crop-ratio').textContent = ASPECT_LABEL[kind] || '';
    let img = $('crop-img');
    img.src = cropObjectUrl;
    let modal = $('crop-modal');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    if (cropper) cropper.destroy();
    cropper = new Cropper(img, {
      aspectRatio: ASPECT[kind], viewMode: 1, autoCropArea: 1,
      background: false, movable: true, zoomable: true, responsive: true
    });
  }
  function closeCrop() {
    let modal = $('crop-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
    if (cropper) { cropper.destroy(); cropper = null; }
    if (cropObjectUrl) { URL.revokeObjectURL(cropObjectUrl); cropObjectUrl = ''; }
  }
  function applyCrop() {
    if (!cropper) return;
    let canvas = cropper.getCroppedCanvas({ maxWidth: 1600, maxHeight: 1600, imageSmoothingQuality: 'high' });
    canvas.toBlob(blob => {
      if (!blob) return note('이미지 처리에 실패했습니다.', 'error');
      pendingBlob = blob;
      previewPhoto = canvas.toDataURL('image/jpeg', 0.9);
      closeCrop();
      if (cropCb) cropCb();
    }, 'image/jpeg', 0.9);
  }
  // 크롭 없이 미리보기만 필요할 때 (fallback)
  function previewFile(f, cb) {
    if (!f) return;
    try { fileOK(f); let r = new FileReader(); r.onload = () => { previewPhoto = r.result; cb(); }; r.readAsDataURL(f); }
    catch (e) { note(e.message, 'error'); }
  }

  async function admin(u) { let d = await db.collection('admins').doc(u.uid).get(); return d.exists && d.data().active === true; }
  function loginMsg(m) { let b = $('login-msg'); b.className = 'rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900'; b.textContent = m; b.classList.remove('hidden'); }

  function init() {
    if (!window.__firebase_config || !window.firebase) { $('setup').classList.remove('hidden'); return; }
    let app = firebase.apps.length ? firebase.app() : firebase.initializeApp(window.__firebase_config);
    auth = app.auth(); db = app.firestore(); storage = app.storage();
    auth.onAuthStateChanged(async u => {
      if (!u) { $('login').classList.remove('hidden'); $('panel').classList.add('hidden'); $('logout').classList.add('hidden'); return; }
      if (!await admin(u)) { await auth.signOut(); return loginMsg('관리자 권한이 없는 계정입니다.'); }
      user = u; $('login').classList.add('hidden'); $('panel').classList.remove('hidden'); $('logout').classList.remove('hidden');
      buildPreview(); await loadHome(); await loadList();
    });
  }
  $('login-form').onsubmit = async e => { e.preventDefault(); try { await auth.signInWithEmailAndPassword($('email').value.trim(), $('password').value); } catch { loginMsg('로그인에 실패했습니다.'); } };
  $('logout').onclick = () => auth.signOut();

  function post(action, payload = {}, view = 'home') { let f = $('site-preview'); f?.contentWindow.postMessage({ type: 'prima-preview', action, payload, view }, '*'); }

  function buildPreview() {
    if ($('site-preview')) return;
    let panel = $('panel'), kids = [...panel.children], left = document.createElement('div'), right = document.createElement('div');
    left.className = 'space-y-6'; kids.forEach(k => left.appendChild(k));
    right.className = 'overflow-hidden rounded-3xl bg-slate-200 p-4 shadow-inner';
    right.innerHTML = `<div class="mb-3 flex items-center justify-between"><div><strong class="text-sm">실제 홈페이지 미리보기</strong><span id="preview-name" class="ml-2 text-xs text-slate-500">홈</span></div><select id="preview-route" class="rounded-lg border bg-white px-3 py-2 text-xs font-bold"><option value="home">홈</option><option value="about">병원소개</option><option value="facilities">시설안내</option><option value="staff">의료진·조직도</option><option value="admission">입·퇴원안내</option><option value="guide">이용안내</option><option value="gallery">가족갤러리</option><option value="notice">공지사항</option><option value="directions">오시는 길</option></select></div><iframe id="site-preview" src="index.html?preview=1" class="h-[900px] w-full rounded-2xl border-0 bg-white"></iframe>`;
    panel.innerHTML = ''; panel.className = 'grid gap-6 lg:grid-cols-[minmax(440px,0.85fr)_minmax(600px,1.45fr)]';
    panel.append(left, right);
    $('preview-route').onchange = e => { post('route', {}, e.target.value); $('preview-name').textContent = e.target.options[e.target.selectedIndex].text; };
    injectExtraFields(); bindPreview();
  }

  function injectExtraFields() {
    if ($('aboutTitle')) return;
    let box = document.createElement('div');
    box.className = 'space-y-3 border-t border-brand-border pt-5';
    box.innerHTML = `<h3 class="font-black">메뉴별 문구 편집</h3><p class="text-xs text-slate-500">병원소개·입퇴원·오시는 길 문구도 함께 저장됩니다.</p><textarea id="aboutTitle" rows="2" maxlength="250" placeholder="병원소개 핵심 인사말" class="w-full rounded-xl border p-3"></textarea><textarea id="aboutBody" rows="7" maxlength="3000" placeholder="병원소개 본문. 문단 사이는 한 줄 비워주세요." class="w-full rounded-xl border p-3"></textarea><textarea id="guideNote" rows="4" maxlength="1500" placeholder="입퇴원·제증명 주요 안내" class="w-full rounded-xl border p-3"></textarea><textarea id="hoursNote" rows="3" maxlength="1000" placeholder="진료시간 (줄바꿈 그대로 표시)" class="w-full rounded-xl border p-3"></textarea><textarea id="visitNote" rows="3" maxlength="1000" placeholder="면회 안내" class="w-full rounded-xl border p-3"></textarea><textarea id="pricingNote" rows="4" maxlength="2000" placeholder="비급여 진료비용 안내" class="w-full rounded-xl border p-3"></textarea><textarea id="floorNote" rows="3" maxlength="1000" placeholder="층별 안내" class="w-full rounded-xl border p-3"></textarea><textarea id="dirSubway" rows="2" maxlength="700" placeholder="지하철 안내" class="w-full rounded-xl border p-3"></textarea><textarea id="dirBus" rows="2" maxlength="700" placeholder="버스 안내" class="w-full rounded-xl border p-3"></textarea>`;
    $('home-form').querySelector('.mt-5').insertBefore(box, $('home-form').querySelector('button'));
  }

  function homePayload() {
    let d = {
      heroEyebrow: $('heroEyebrow').value.trim(), homeTitle: $('homeTitle').value.trim().replace(/\n/g, '<br>'), homeDesc: $('homeDesc').value.trim(),
      heroImageAlt: $('heroImageAlt').value.trim(), facilityIntro: $('facilityIntro').value.trim(), certificationIntro: $('certificationIntro').value.trim(),
      aboutTitle: $('aboutTitle').value.trim(), aboutBody: $('aboutBody').value.trim(), guideNote: $('guideNote').value.trim(),
      dirSubway: $('dirSubway').value.trim(), dirBus: $('dirBus').value.trim(),
      hoursNote: $('hoursNote').value.trim(), visitNote: $('visitNote').value.trim(), pricingNote: $('pricingNote').value.trim(), floorNote: $('floorNote').value.trim()
    };
    if (previewPhoto || homePhoto) d.heroImage = previewPhoto || homePhoto;
    return d;
  }
  function draft() {
    let kind = $('kind').value, title = $('title').value.trim(), desc = $('desc').value.trim(), sub = $('sub').value.trim(), photo = previewPhoto || $('current-photo').value || '';
    let d = { title, desc, photo, order: Number($('order').value) || 10 };
    if (kind === 'staff') d = { ...d, name: title, bio: desc, department: $('department').value, position: $('position').value.trim() };
    if (kind === 'facilities') d.category = sub;
    if (kind === 'gallery') d.date = sub;
    if (kind === 'certifications') d.year = sub;
    return { kind, data: d };
  }
  function bindPreview() {
    ['heroEyebrow', 'homeTitle', 'homeDesc', 'heroImageAlt', 'facilityIntro', 'certificationIntro', 'aboutTitle', 'aboutBody', 'guideNote', 'hoursNote', 'visitNote', 'pricingNote', 'floorNote', 'dirSubway', 'dirBus']
      .forEach(id => $(id).addEventListener('input', () => post('content', homePayload(), $('preview-route').value)));
    ['title', 'sub', 'desc', 'position', 'department', 'order']
      .forEach(id => $(id).addEventListener('input', () => post('draft', draft(), viewOf($('kind').value))));
    // 이미지 선택 → 크롭 모달 → 적용 후 미리보기 갱신
    $('heroImage').onchange = e => openCrop(e.target.files[0], 'hero', () => post('content', homePayload(), 'home'));
    $('photo').onchange = e => openCrop(e.target.files[0], $('kind').value, () => post('draft', draft(), viewOf($('kind').value)));
  }

  async function loadHome() {
    let d = await col('page-content').doc('home').get();
    if (!d.exists) return;
    let x = d.data();
    ['heroEyebrow', 'homeTitle', 'homeDesc', 'heroImageAlt', 'facilityIntro', 'certificationIntro', 'aboutTitle', 'aboutBody', 'guideNote', 'hoursNote', 'visitNote', 'pricingNote', 'floorNote', 'dirSubway', 'dirBus']
      .forEach(k => { if ($(k)) $(k).value = x[k] || ''; });
    homePhoto = x.heroImage || '';
    post('content', homePayload(), 'home');
  }
  $('home-form').onsubmit = async e => {
    e.preventDefault(); let b = e.currentTarget.querySelector('button'); b.disabled = true;
    try {
      let p = await upload(pendingBlob || $('heroImage').files[0], 'hero') || homePhoto;
      if (!p) throw Error('대표 이미지를 선택해 주세요.');
      let d = { ...homePayload(), heroImage: p, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      await col('page-content').doc('home').set(d, { merge: true });
      homePhoto = p; previewPhoto = ''; pendingBlob = null;
      note('홈페이지 문구와 대표 영역을 저장했습니다.'); post('reload');
    } catch (x) { note(x.message, 'error'); } finally { b.disabled = false; }
  };

  $('kind').onchange = () => {
    $('staff-fields').classList.toggle('hidden', $('kind').value !== 'staff');
    $('preview-route').value = viewOf($('kind').value);
    $('preview-route').dispatchEvent(new Event('change'));
    loadList();
  };

  function reset() {
    ['item-id', 'current-photo', 'title', 'sub', 'desc', 'position'].forEach(k => $(k).value = '');
    $('photo').value = ''; $('verified').checked = false; $('order').value = 10;
    previewPhoto = ''; pendingBlob = null; post('clear');
  }
  $('reset').onclick = reset;

  $('item-form').onsubmit = async e => {
    e.preventDefault(); let b = e.currentTarget.querySelector('button[type="submit"]'); b.disabled = true;
    try {
      let kind = $('kind').value, id = $('item-id').value || crypto.randomUUID(),
        p = await upload(pendingBlob || $('photo').files[0], kind) || $('current-photo').value;
      if (!p) throw Error('사진을 선택해 주세요.');
      let d = draft().data; d.photo = p; d.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await col(kind).doc(id).set(d, { merge: true });
      note('콘텐츠를 저장했습니다.'); reset(); await loadList(); post('reload');
    } catch (x) { note(x.message || '저장 실패', 'error'); } finally { b.disabled = false; }
  };

  // 드래그로 순서 변경 → order 자동 저장
  async function saveOrder() {
    let kind = $('kind').value, ids = [...$('list').querySelectorAll('[data-id]')].map(el => el.dataset.id);
    try {
      let batch = db.batch();
      ids.forEach((id, i) => batch.update(col(kind).doc(id), { order: (i + 1) * 10, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }));
      await batch.commit();
      note('순서를 저장했습니다. 홈페이지에 반영됩니다.'); post('reload');
    } catch (x) { note('순서 저장 실패: ' + (x.message || ''), 'error'); await loadList(); }
  }

  async function loadList() {
    let kind = $('kind').value, s = await col(kind).get(), g = $('list');
    g.innerHTML = '';
    s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).forEach(x => {
      let a = document.createElement('article'), title = kind === 'staff' ? x.name : x.title;
      a.className = 'overflow-hidden rounded-2xl border bg-brand-light';
      a.dataset.id = x.id;
      a.innerHTML = `<div class="relative aspect-video bg-white"><img src="${esc(x.photo || 'assets/facility-placeholder.svg')}" class="h-full w-full object-cover"><span class="drag-handle absolute left-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white" title="드래그해서 순서 변경">⠿ 이동</span></div><div class="p-4"><h3 class="font-bold">${esc(title)}</h3><p class="mt-2 line-clamp-2 text-xs text-slate-500">${esc(kind === 'staff' ? x.bio : x.desc)}</p><div class="mt-4 flex gap-2"><button class="edit rounded-lg border bg-white px-3 py-2 text-[11px] font-bold">수정</button><button class="del rounded-lg bg-rose-600 px-3 py-2 text-[11px] font-bold text-white">삭제</button></div></div>`;
      a.querySelector('.edit').onclick = () => {
        $('item-id').value = x.id; $('current-photo').value = x.photo || ''; $('title').value = title || '';
        $('desc').value = kind === 'staff' ? x.bio || '' : x.desc || ''; $('order').value = x.order ?? 10;
        if (kind === 'staff') { $('department').value = x.department || 'medical'; $('position').value = x.position || ''; }
        $('verified').checked = true; previewPhoto = ''; pendingBlob = null;
        post('draft', draft(), viewOf(kind));
        $('item-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      a.querySelector('.del').onclick = async () => { if (confirm('삭제할까요?')) { await col(kind).doc(x.id).delete(); await loadList(); post('reload'); } };
      g.appendChild(a);
    });
    if (!s.size) g.innerHTML = '<p class="text-xs text-slate-500">등록된 항목이 없습니다. (기본 예시는 data 폴더의 JSON에서 표시됩니다)</p>';
    // 드래그 정렬 초기화
    if (sortable) { sortable.destroy(); sortable = null; }
    if (window.Sortable && s.size) sortable = new Sortable(g, { animation: 150, handle: '.drag-handle', ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', onEnd: saveOrder });
  }

  $('refresh').onclick = loadList;
  init();
})();
