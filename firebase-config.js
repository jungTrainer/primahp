// Firebase 공개 설정과 페이지별 기능 로더를 분리합니다.
// firebase-public-config.js는 브라우저 식별 정보만 포함하며,
// 실제 데이터 접근 권한은 Firebase 보안 규칙에서 통제합니다.
if (!window.__firebase_config) {
  document.write('<script src="firebase-public-config.js?v=20260716-6"><\/script>');
}

(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  const version = '20260716-6';

  const loadScript = (src, onload) => {
    const script = document.createElement('script');
    script.src = `${src}?v=${version}`;
    script.defer = true;
    if (onload) script.addEventListener('load', onload, { once: true });
    document.head.appendChild(script);
  };

  if (page === 'index.html') {
    loadScript('assets/hero-split.js', () => {
      loadScript('assets/admission-responsive.js', () => {
        loadScript('assets/site-footer-admin.js', () => {
          loadScript('assets/site-oncanvas.js');
        });
      });
    });
    return;
  }

  if (page === 'admin.html') {
    loadScript('assets/image-utils.js', () => {
      loadScript('assets/admin-image-enhancements.js');
    });
  }
})();