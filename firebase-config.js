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

// 기본 화면 구조를 불러온 뒤 로고·입퇴원 반응형 보정 기능을 순서대로 적용합니다.
(() => {
  const base = document.createElement('script');
  base.src = 'assets/hero-split.js';
  base.defer = true;
  base.addEventListener('load', () => {
    const enhancement = document.createElement('script');
    enhancement.src = 'assets/admission-responsive.js';
    enhancement.defer = true;
    document.head.appendChild(enhancement);
  });
  document.head.appendChild(base);
})();
