# 프리마요양병원 홈페이지

정적 HTML·CSS·JavaScript와 Firebase를 사용하는 프리마요양병원 홈페이지 및 관리자 콘솔입니다.

## 핵심 개발 원칙

홈페이지에 표시되는 콘텐츠와 앞으로 추가되는 기능은 개발자가 코드를 수정하지 않아도 관리자가 홈페이지 미리보기 화면에서 직접 관리할 수 있어야 합니다.

새 섹션·필드·컬렉션·기능을 추가할 때는 반드시 다음 네 가지를 함께 구현합니다.

1. 공개 화면의 `data-edit` 또는 `data-item` 편집 대상 매핑
2. 관리자 인라인 편집 또는 컨텍스트 패널 CRUD
3. Firestore 저장 구조와 필요한 보안 규칙
4. Firebase를 불러오지 못해도 표시되는 `data/*.json` 정적 기본값

하드코딩된 화면 문구만 추가하고 관리자 편집 기능을 누락하지 않습니다. 반복 콘텐츠는 추가·수정·삭제·정렬을 지원해야 합니다.

## 구조

- `index.html`: 공개 홈페이지 기본 HTML과 JavaScript 실패 시 폴백
- `assets/site.js`: 공개 데이터 렌더링, 라우팅, 문의 폼
- `assets/site-content-enhancements.js`: 인사말·히어로 배지·이용안내 카드와 인라인 편집
- `admin.html`, `assets/admin*.js`: 관리자 콘솔, 미리보기, 콘텐츠 CRUD
- `data/*.json`: 정적 기본 콘텐츠
- `firestore.rules`, `storage.rules`: Firebase 보안 규칙

## 콘텐츠 저장 경로

공개 콘텐츠는 다음 경로를 사용합니다.

```text
artifacts/{appId}/public/data/{collection}/{document}
```

인사말, 히어로 배지와 이용안내 카드는 `page-content/home` 문서에 저장하며 기존 규칙 범위 안에서 동작합니다.

## 변경 시 필수 검증

- 관련 JavaScript `node --check`
- 모든 JSON 파일 파싱
- HTML 닫힘 구조와 중복 `id`
- 공개 페이지의 기본 상담 폴백
- 관리자 미리보기 및 저장·삭제·정렬 회귀
- 360px, 768px, 1024px, 1440px 반응형 확인
- 보안 규칙을 변경했다면 Firebase 규칙 재배포 안내
