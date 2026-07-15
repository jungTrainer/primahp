const fs = require('fs');

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(search, replacement, label) {
  if (html.includes(replacement)) return;
  if (!html.includes(search)) throw new Error(`Patch target not found: ${label}`);
  html = html.replace(search, replacement);
}

replaceOnce(
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <link rel="icon" href="favicon.svg" type="image/svg+xml">',
  'favicon'
);

replaceOnce(
`                  <div>
                    <label class="block text-brand-navy font-bold mb-1"><i class="fa-solid fa-pen mr-1 text-brand-blue"></i> 주요 기저 질환 및 상태 요약</label>
                    <textarea id="inquiryMsg" required rows="2" placeholder="뇌졸중 회복, 중증 인지장애, 한방 병행 등 간략 기재" class="w-full bg-brand-lightBg border border-brand-border rounded px-3 py-2.5 focus:ring-1 focus:ring-brand-blue focus:outline-none resize-none"></textarea>
                  </div>
                  <button type="submit"`,
`                  <div>
                    <label class="block text-brand-navy font-bold mb-1"><i class="fa-solid fa-pen mr-1 text-brand-blue"></i> 주요 기저 질환 및 상태 요약</label>
                    <textarea id="inquiryMsg" required rows="2" placeholder="뇌졸중 회복, 중증 인지장애, 한방 병행 등 간략 기재" class="w-full bg-brand-lightBg border border-brand-border rounded px-3 py-2.5 focus:ring-1 focus:ring-brand-blue focus:outline-none resize-none"></textarea>
                  </div>

                  <div class="space-y-2 rounded-xl border border-brand-border bg-brand-lightBg p-3 text-[11px] leading-relaxed text-slate-600">
                    <label class="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" id="inquiryPrivacyConsent" required class="mt-0.5 h-4 w-4 rounded text-brand-blue focus:ring-brand-blue">
                      <span><strong class="text-brand-navy">[필수] 개인정보 수집·이용에 동의합니다.</strong><br>수집항목: 환우 성명, 보호자 전화번호, 희망 병실 / 목적: 입원 상담 및 연락 / 보유기간: 상담 종료 후 1년</span>
                    </label>
                    <label class="flex items-start gap-2 cursor-pointer border-t border-brand-border pt-2">
                      <input type="checkbox" id="inquirySensitiveConsent" required class="mt-0.5 h-4 w-4 rounded text-brand-blue focus:ring-brand-blue">
                      <span><strong class="text-rose-700">[필수] 건강정보 등 민감정보 처리에 별도로 동의합니다.</strong><br>수집항목: 주요 기저질환 및 건강상태 / 목적: 입원·돌봄 가능성 사전 상담 / 보유기간: 상담 종료 후 1년</span>
                    </label>
                    <p>동의를 거부할 권리가 있으나, 필수정보 동의 거부 시 온라인 입원 상담 접수가 제한됩니다. <a href="privacy.html" target="_blank" rel="noopener" class="font-bold text-brand-blue underline">개인정보처리방침 보기</a></p>
                  </div>
                  <div id="inquiryReceiptBox" class="hidden rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-900" role="status" aria-live="polite"></div>
                  <button type="submit"`,
  'inquiry consent'
);

replaceOnce(
`              <div class="flex gap-2">
                <input type="text" id="commentText" required placeholder="감사 댓글 혹은 안심 소통을 적어보세요." class="flex-grow p-2.5 border border-brand-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue">
                <button type="submit" class="bg-brand-navy hover:bg-brand-blue text-white px-5 py-2.5 rounded font-bold transition-colors">등록</button>
              </div>
            </form>`,
`              <div class="flex gap-2">
                <input type="text" id="commentText" required placeholder="감사 댓글 혹은 안심 소통을 적어보세요." class="flex-grow p-2.5 border border-brand-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue">
                <button type="submit" class="bg-brand-navy hover:bg-brand-blue text-white px-5 py-2.5 rounded font-bold transition-colors">등록</button>
              </div>
              <label class="flex items-start gap-2 rounded-lg border border-brand-border bg-white p-3 text-[11px] leading-relaxed text-slate-600 cursor-pointer">
                <input type="checkbox" id="commentPrivacyConsent" required class="mt-0.5 h-4 w-4 rounded text-brand-blue focus:ring-brand-blue">
                <span><strong class="text-brand-navy">[필수] 댓글 작성자 개인정보 수집·이용에 동의합니다.</strong><br>수집항목: 작성자 성명, 댓글 내용 / 목적: 의견 확인 및 답변 / 보유기간: 처리 완료 후 1년. <a href="privacy.html" target="_blank" rel="noopener" class="font-bold text-brand-blue underline">자세히 보기</a></span>
              </label>
            </form>`,
  'comment consent'
);

replaceOnce(
`        <div>
          <p>의료기관명: 프리마요양병원 | 의료재단명: 의료법인 건강한사람들 의료재단 | 사업자등록번호: 605-82-12345</p>
          <p>COPYRIGHT © 2026 PRIMA CARE HOSPITAL. ALL RIGHTS RESERVED.</p>
        </div>`,
`        <div>
          <p>의료기관명: 프리마요양병원 | 의료재단명: 의료법인 건강한사람들 의료재단 | 사업자등록번호: 605-82-12345</p>
          <p class="mt-1"><a href="privacy.html" class="font-bold text-slate-300 hover:text-white underline underline-offset-2">개인정보처리방침</a></p>
          <p>COPYRIGHT © 2026 PRIMA CARE HOSPITAL. ALL RIGHTS RESERVED.</p>
        </div>`,
  'footer privacy link'
);

replaceOnce(
'        <button onclick="closeConfirmModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-xs transition-colors font-sans">취소</button>',
'        <button id="confirmModalBtnNo" onclick="closeConfirmModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-xs transition-colors font-sans">취소</button>',
'confirm cancel id'
);

replaceOnce(
`      const navigateTo = (viewId) => {
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(\`view-\${viewId}\`);
        if (target) {
          target.classList.add('active');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          if (viewId === 'directions') {
            setTimeout(() => {
              if (liveMap) {
                liveMap.invalidateSize(); // 지도 가로 깨짐 연출 정정 버그 완전 해소
              }
            }, 200);
          }
        }

        const menus = ['home', 'about', 'staff', 'guide', 'gallery', 'notice', 'directions'];
        menus.forEach(m => {
          const btn = document.getElementById(\`gnb-\${m}\`);
          if (btn) {
            if (m === viewId) btn.classList.add('text-brand-blue', 'border-brand-blue');
            else btn.classList.remove('text-brand-blue', 'border-brand-blue');
          }
        });
      };`,
`      const publicViews = ['home', 'about', 'staff', 'guide', 'gallery', 'notice', 'directions'];

      const navigateTo = (viewId, options = {}) => {
        const safeViewId = (publicViews.includes(viewId) || (viewId === 'admin' && isAdminLoggedIn)) ? viewId : 'home';
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(\`view-\${safeViewId}\`);
        if (target) {
          target.classList.add('active');
          if (!options.preserveScroll) window.scrollTo({ top: 0, behavior: 'smooth' });

          if (safeViewId === 'directions') {
            setTimeout(() => {
              if (liveMap) liveMap.invalidateSize();
            }, 200);
          }
        }

        publicViews.forEach(m => {
          const btn = document.getElementById(\`gnb-\${m}\`);
          if (btn) {
            if (m === safeViewId) btn.classList.add('text-brand-blue', 'border-brand-blue');
            else btn.classList.remove('text-brand-blue', 'border-brand-blue');
          }
        });

        if (!options.fromHash && safeViewId !== 'admin') {
          const nextHash = \`#\${safeViewId}\`;
          if (window.location.hash !== nextHash) window.location.hash = nextHash;
        }
      };

      const routeFromHash = () => {
        const raw = window.location.hash.replace(/^#/, '') || 'home';
        const [viewId, detailId] = raw.split('/');
        navigateTo(viewId, { fromHash: true });
        if (viewId === 'notice' && detailId) {
          setTimeout(() => openNoticePublicView(detailId, { fromHash: true }), 0);
        } else {
          closeNoticeViewModal({ preserveHash: true });
        }
      };`,
  'hash navigation'
);

replaceOnce(
`        const room = document.getElementById('inquiryRoom').value;
        const msg = document.getElementById('inquiryMsg').value.trim();

        // 전화번호 정규식 검증`,
`        const room = document.getElementById('inquiryRoom').value;
        const msg = document.getElementById('inquiryMsg').value.trim();
        const privacyConsent = document.getElementById('inquiryPrivacyConsent').checked;
        const sensitiveConsent = document.getElementById('inquirySensitiveConsent').checked;

        if (!privacyConsent || !sensitiveConsent) {
          showToast("개인정보 및 민감정보 처리 동의가 모두 필요합니다.");
          return;
        }

        // 전화번호 정규식 검증`,
  'inquiry consent validation'
);

replaceOnce(
`        const dateStr = new Date().toISOString().split('T')[0];

        // 중요: DB에는 '원본 데이터'를 저장하고 렌더링 시점에만 이스케이프 이행
        const payload = {`,
`        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const receiptNo = \`PR-\${dateStr.replace(/-/g, '')}-\${String(now.getTime()).slice(-6)}\`;

        // 중요: DB에는 '원본 데이터'를 저장하고 렌더링 시점에만 이스케이프 이행
        const payload = {
          receiptNo,`,
  'receipt number creation'
);

replaceOnce(
`          memos: [],
          createdAt: dateStr
        };`,
`          memos: [],
          privacyConsent: true,
          sensitiveConsent: true,
          consentedAt: now.toISOString(),
          privacyPolicyVersion: "2026-07-15",
          createdAt: dateStr
        };`,
  'inquiry consent metadata'
);

replaceOnce(
`        document.getElementById('widgetInquiryForm').reset();
        showToast("간편 문의서가 행정 대시보드로 실시간 연동 전달되었습니다.");`,
`        document.getElementById('widgetInquiryForm').reset();
        const receiptBox = document.getElementById('inquiryReceiptBox');
        receiptBox.innerHTML = \`<strong>입원 문의가 접수되었습니다.</strong><br>접수번호: <span class="font-mono font-black">\${escapeHtml(receiptNo)}</span><br>상담 확인을 위해 접수번호를 보관해 주세요.\`;
        receiptBox.classList.remove('hidden');
        showToast(\`문의 접수 완료: \${receiptNo}\`);`,
  'receipt display'
);

replaceOnce(
`        const noticeTitle = document.getElementById('commentNoticeSelect').value;
        const comment = document.getElementById('commentText').value.trim();

        const now = new Date();`,
`        const noticeTitle = document.getElementById('commentNoticeSelect').value;
        const comment = document.getElementById('commentText').value.trim();
        const privacyConsent = document.getElementById('commentPrivacyConsent').checked;

        if (!privacyConsent) {
          showToast("댓글 등록을 위해 개인정보 수집·이용 동의가 필요합니다.");
          return;
        }

        const now = new Date();`,
  'comment consent validation'
);

replaceOnce(
`          isAnswered: false,
          createdAt: timeStr
        };`,
`          isAnswered: false,
          privacyConsent: true,
          consentedAt: now.toISOString(),
          privacyPolicyVersion: "2026-07-15",
          createdAt: timeStr
        };`,
  'comment consent metadata'
);

replaceOnce(
`        document.getElementById('commentAuthor').value = "";
        document.getElementById('commentText').value = "";`,
`        document.getElementById('commentPublicForm').reset();`,
  'comment form reset'
);

replaceOnce(
`      const openNoticePublicView = async (id) => {`,
`      const openNoticePublicView = async (id, options = {}) => {`,
  'notice open signature'
);

replaceOnce(
`          document.getElementById('noticeViewModal').classList.replace('hidden', 'flex');
        }
      };
      
      const closeNoticeViewModal = () => { 
        document.getElementById('noticeViewModal').classList.replace('flex', 'hidden'); 
      };`,
`          document.getElementById('noticeViewModal').classList.replace('hidden', 'flex');
          if (!options.fromHash && window.location.hash !== \`#notice/\${id}\`) {
            window.location.hash = \`#notice/\${id}\`;
          }
        }
      };
      
      const closeNoticeViewModal = (options = {}) => { 
        const modal = document.getElementById('noticeViewModal');
        if (modal) modal.classList.replace('flex', 'hidden');
        if (!options.preserveHash && window.location.hash.startsWith('#notice/')) {
          window.location.hash = '#notice';
        }
      };`,
  'notice hash detail'
);

replaceOnce(
`      const initApp = () => {
        initAuth();
        initLeafletMap();
      };

      initApp();`,
`      const initApp = () => {
        initAuth();
        initLeafletMap();
        window.addEventListener('hashchange', routeFromHash);
        routeFromHash();
      };

      initApp();`,
  'router bootstrap'
);

fs.writeFileSync(file, html);
console.log('Priority patch applied successfully.');
