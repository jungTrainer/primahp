// Firebase 웹 앱 연결 설정
// 이 값은 브라우저용 프로젝트 식별 정보이며, 실제 데이터 접근은 Firebase 보안 규칙이 통제합니다.
window.__app_id = 'prima-care-hospital-2026';
window.__firebase_config = {
  apiKey: 'AIzaSyAKyEMHDUHMgPYiy_98VAuD5hSy5CY6cR4',
  authDomain: 'prima-nhp.firebaseapp.com',
  projectId: 'prima-nhp',
  storageBucket: 'prima-nhp.firebasestorage.app',
  messagingSenderId: '1021859837693',
  appId: '1:1021859837693:web:c674b09f56f561ea6eb094'
};

// 홈 첫 화면을 좌측 문구·우측 병원 전경 이미지 구조로 구성합니다.
// 관리자 미리보기에서도 같은 레이아웃을 사용합니다.
(() => {
  const script = document.createElement('script');
  script.src = 'assets/hero-split.js';
  script.defer = true;
  document.head.appendChild(script);
})();
