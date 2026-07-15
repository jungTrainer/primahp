const fs = require('fs');

const sourcePath = 'index.html';
const adminPath = 'admin.html';
const source = fs.readFileSync(sourcePath, 'utf8');

function assertContains(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`Missing expected marker: ${label}`);
}

function removeBetween(text, start, end, label, keepEnd = true) {
  const startIndex = text.indexOf(start);
  if (startIndex < 0) throw new Error(`Missing start marker: ${label}`);
  const endIndex = text.indexOf(end, startIndex + start.length);
  if (endIndex < 0) throw new Error(`Missing end marker: ${label}`);
  return text.slice(0, startIndex) + (keepEnd ? text.slice(endIndex) : text.slice(endIndex + end.length));
}

function removeRegex(text, regex, label, required = true) {
  if (required && !regex.test(text)) throw new Error(`Missing regex target: ${label}`);
  regex.lastIndex = 0;
  return text.replace(regex, '');
}

function replaceRequired(text, search, replacement, label) {
  if (!text.includes(search)) throw new Error(`Missing replacement target: ${label}`);
  return text.replace(search, replacement);
}

// 1) Preserve the current all-in-one implementation as the administrator page.
let adminHtml = source;
adminHtml = replaceRequired(
  adminHtml,
  '<title>의료법인 건강한사람들 의료재단 - 프리마요양병원</title>',
  '<title>관리자 시스템 | 프리마요양병원</title>\n  <meta name="robots" content="noindex,nofollow,noarchive">',
  'admin title'
);
adminHtml = adminHtml.replace('<body class="', '<body data-page="admin" class="');
adminHtml = adminHtml.replace(
  '<span>🔒 원무 행정 로그인 시스템</span>',
  '<span>🔒 원무 행정 로그인</span>'
);
fs.writeFileSync(adminPath, adminHtml);

// 2) Remove administrator UI and administrator-only runtime from the public page.
let publicHtml = source;
publicHtml = publicHtml.replace('<body class="', '<body data-page="public" class="');

publicHtml = removeBetween(
  publicHtml,
  '  <!-- ================= TOP ADMIN NOTIFICATION BAR ================= -->',
  '  <!-- ================= TOP PUBLIC ANNOUNCEMENT BAR ================= -->',
  'admin top bar'
);

publicHtml = removeBetween(
  publicHtml,
  '    <!-- ================= [VIEW: ADMIN (원무 행정 CRM 대시보드)] ================= -->',
  '  </main>',
  'admin dashboard view'
);

publicHtml = removeRegex(
  publicHtml,
  /\n\s*<!-- 원무과 및 실무 행정진들이 쉽게 로그인할 수 있도록[\s\S]*?<button onclick="openLoginModal\(\)"[\s\S]*?<\/button>/,
  'footer administrator login'
);

publicHtml = removeRegex(publicHtml, /\n\s*<button id="add-album-btn"[\s\S]*?<\/button>/, 'add album button');
publicHtml = removeRegex(publicHtml, /\n\s*<button id="add-notice-btn"[\s\S]*?<\/button>/, 'add notice button');
publicHtml = removeRegex(publicHtml, /\n\s*<th id="notice-th-action"[\s\S]*?<\/th>/, 'notice action header');

for (const id of ['home-hero', 'about-greetings', 'guide-notes', 'directions-text']) {
  publicHtml = removeRegex(
    publicHtml,
    new RegExp(`\\n\\s*<div class="[^"]*admin-editable-trigger hidden[^"]*">[\\s\\S]*?<\\/div>`),
    `${id} administrator edit trigger`
  );
  publicHtml = removeRegex(
    publicHtml,
    new RegExp(`\\n\\s*<div id="editor-${id}"[\\s\\S]*?(?=\\n\\s*<div id="content-${id}")`),
    `${id} administrator editor`
  );
}

publicHtml = removeBetween(
  publicHtml,
  '  <!-- ================= [MODAL: ADMIN LOGIN] ================= -->',
  '  <!-- ================= [MODAL: STAFF ADD/EDIT (Canvas 1:1 크롭 탑재)] ================= -->',
  'administrator login modal'
);
publicHtml = removeBetween(
  publicHtml,
  '  <!-- ================= [MODAL: STAFF ADD/EDIT (Canvas 1:1 크롭 탑재)] ================= -->',
  '  <!-- ================= [MODAL: ALBUM ADD (가로 800px 비례 최적화 리사이징 탑재)] ================= -->',
  'staff management modal'
);
publicHtml = removeBetween(
  publicHtml,
  '  <!-- ================= [MODAL: ALBUM ADD (가로 800px 비례 최적화 리사이징 탑재)] ================= -->',
  '  <!-- ================= NOTICE MODAL ================= -->',
  'gallery management modal'
);
publicHtml = removeBetween(
  publicHtml,
  '  <!-- ================= NOTICE MODAL ================= -->',
  '  <!-- ================= PUBLIC DETAIL NOTICE VIEW ================= -->',
  'notice management modal'
);
publicHtml = removeBetween(
  publicHtml,
  '  <!-- ================= CUSTOM SAFETY CONFIRM MODAL (NO ALERT/CONFIRM BROWSER DEFAULT) ================= -->',
  '  <!-- =========================================================================\n       FIREBASE INTEGRATION & SECURE ES MODULE ARCHITECTURE (Console Hack Proof)',
  'administrator confirm modal'
);

publicHtml = removeBetween(
  publicHtml,
  '      /* ================= 4. SHA-256 CLIENT DECRYPTION HASHING ================= */',
  '      /* ================= 5. REALTIME FIRESTORE DATA STREAMING (RULE 1, 2, 3) ================= */',
  'public SHA-256 administrator authentication'
);

publicHtml = removeBetween(
  publicHtml,
  "        getCollectionRef('inquiries').onSnapshot",
  "        getCollectionRef('comments').onSnapshot",
  'public inquiry administrator listener'
);
publicHtml = removeBetween(
  publicHtml,
  "        getCollectionRef('comments').onSnapshot",
  "        getCollectionRef('notices').onSnapshot",
  'public comments administrator listener'
);

publicHtml = publicHtml.replace('        if (isAdminLoggedIn) renderAdminDashboard();\n', '');
publicHtml = publicHtml.replace(/\n\s*renderAdminDashboard\(\);/g, '');

publicHtml = removeBetween(
  publicHtml,
  '      /* ================= 9. IMAGE COMPRESS & CROP MECHANICS ================= */',
  '      /* ================= 10. PUBLIC USER INPUTS & VALIDATION ================= */',
  'administrator image processing'
);
publicHtml = removeBetween(
  publicHtml,
  '      /* ================= 11. HIGH PERFORMANCE ADMIN CRM ENGINE ================= */',
  '      /* ================= 13. STAFF / GALLERY / PUBLIC NOTICES ================= */',
  'administrator CRM and CRUD core'
);

publicHtml = publicHtml.replace(
  /\n\s*let overlay = isAdminLoggedIn \? `[\s\S]*?` : "";/,
  '\n          let overlay = "";'
);
publicHtml = removeRegex(
  publicHtml,
  /\n\s*if \(isAdminLoggedIn\) \{\s*document\.getElementById\(`btn-delete-staff-\$\{s\.id\}`\)[\s\S]*?\n\s*\}/,
  'staff delete event'
);
publicHtml = removeRegex(
  publicHtml,
  /\n\s*if \(isAdminLoggedIn\) \{\s*const addBtn[\s\S]*?addBtn\.addEventListener\('click', openStaffAddModal\);\s*\}/,
  'staff add control'
);
publicHtml = removeBetween(
  publicHtml,
  '      const openStaffAddModal = () => {',
  '      const renderGallery = () => {',
  'staff administrator functions'
);

publicHtml = publicHtml.replace(
  /\n\s*let tools = isAdminLoggedIn \? `[\s\S]*?` : "";/,
  '\n          let tools = "";'
);
publicHtml = removeRegex(
  publicHtml,
  /\n\s*if \(isAdminLoggedIn\) \{\s*document\.getElementById\(`btn-delete-album-\$\{a\.id\}`\)[\s\S]*?\n\s*\}/,
  'gallery delete event'
);
publicHtml = removeBetween(
  publicHtml,
  '      const openAddAlbumModal = () => {',
  '      const renderNotice = () => {',
  'gallery administrator functions'
);

publicHtml = publicHtml.replace(
  /\n\s*let action = isAdminLoggedIn \? `[^`]*` : "";/,
  '\n          let action = "";'
);
publicHtml = removeRegex(
  publicHtml,
  /\n\s*if \(isAdminLoggedIn\) \{\s*document\.getElementById\(`btn-notice-delete-\$\{n\.id\}`\)[\s\S]*?\n\s*\}/,
  'notice delete event'
);
publicHtml = removeBetween(
  publicHtml,
  '      const openAddNoticeModal = () => {',
  '      /* ================= 13. SYSTEM ACCESS LOGINS ================= */',
  'notice administrator functions'
);
publicHtml = removeBetween(
  publicHtml,
  '      /* ================= 13. SYSTEM ACCESS LOGINS ================= */',
  '      /* ================= 14. EXPOSE MODULE SYSTEM TO WINDOW ================= */',
  'administrator login runtime'
);

publicHtml = removeBetween(
  publicHtml,
  '      /* ================= 14. EXPOSE MODULE SYSTEM TO WINDOW ================= */',
  '      /* ================= 15. Firebase Auth listener (RULE 3) ================= */',
  'administrator global exposure'
);
publicHtml = publicHtml.replace(
  '      /* ================= 15. Firebase Auth listener (RULE 3) ================= */',
  `      /* ================= PUBLIC GLOBAL EXPOSURE ================= */\n      window.navigateTo = navigateTo;\n      window.toggleMobileMenu = toggleMobileMenu;\n      window.submitHomeInquiry = submitHomeInquiry;\n      window.submitPublicComment = submitPublicComment;\n      window.openNoticePublicView = openNoticePublicView;\n      window.closeNoticeViewModal = closeNoticeViewModal;\n      window.switchStaffDept = switchStaffDept;\n\n      /* ================= 15. Firebase Auth listener (RULE 3) ================= */`
);

publicHtml = publicHtml.replace(
  "      let tempStaffPhoto = null;\n      let tempAlbumPhoto = null;\n      let currentDept = 'medical';\n      let isAdminLoggedIn = false;",
  "      let currentDept = 'medical';"
);
publicHtml = publicHtml.replace(
  "        const safeViewId = (publicViews.includes(viewId) || (viewId === 'admin' && isAdminLoggedIn)) ? viewId : 'home';",
  "        const safeViewId = publicViews.includes(viewId) ? viewId : 'home';"
);
publicHtml = publicHtml.replace(
  `              isAdminLoggedIn = sessionStorage.getItem('isAdminPrimaHash') === 'true';\n              if (isAdminLoggedIn) {\n                showAdminUIs();\n              }\n              startFirestoreListeners();`,
  '              startFirestoreListeners();'
);

// The public page does not use destructive administrator confirmation UI.
publicHtml = publicHtml.replace(/\n\s*const closeConfirmModal = \(\) => \{[\s\S]*?\n\s*\};/, '');

// Validate the intended separation before writing.
for (const forbidden of [
  'id="view-admin"',
  'id="loginModal"',
  'id="staffModal"',
  'id="albumModal"',
  'id="noticeModal"',
  'submitAdminLogin',
  'renderAdminDashboard',
  'openStaffAddModal',
  'openAddAlbumModal',
  'openAddNoticeModal',
  'handleStaffPhotoUpload',
  'handleAlbumPhotoUpload',
  'isAdminPrimaHash'
]) {
  if (publicHtml.includes(forbidden)) throw new Error(`Administrator code remains in public index: ${forbidden}`);
}

for (const required of [
  'id="widgetInquiryForm"',
  'id="commentPublicForm"',
  'const submitHomeInquiry',
  'const submitPublicComment',
  'const renderStaff',
  'const renderGallery',
  'const renderNotice',
  'const routeFromHash',
  'privacy.html'
]) {
  assertContains(publicHtml, required, `public requirement ${required}`);
}

for (const required of [
  'id="view-admin"',
  'id="loginModal"',
  'const submitAdminLogin',
  'const renderAdminDashboard',
  'const saveStaffProfile',
  'const submitNewAlbum',
  'const submitNotice'
]) {
  assertContains(adminHtml, required, `admin requirement ${required}`);
}

fs.writeFileSync(sourcePath, publicHtml);
console.log('Created admin.html and removed administrator UI/runtime from public index.html.');
