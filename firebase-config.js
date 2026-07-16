// 브라우저용 Firebase 공개 설정만 불러옵니다.
// 페이지별 기능 스크립트는 각 HTML에서 명시적으로 로드해 실행 순서를 고정합니다.
if (!window.__firebase_config) {
  document.write('<script src="firebase-public-config.js?v=20260716-8"><\/script>');
}
