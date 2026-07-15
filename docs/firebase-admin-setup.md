# 프리마요양병원 Firebase 관리자 설정

홈페이지는 Firebase 연결 전에도 정적 샘플 화면을 표시합니다. 관리자 이미지 업로드와 콘텐츠 변경을 사용하려면 아래 설정이 필요합니다.

## 1. Firebase 프로젝트와 웹 앱

1. Firebase Console에서 프로젝트를 만듭니다.
2. 웹 앱(`</>`)을 등록합니다.
3. 발급된 `firebaseConfig` 객체를 `firebase-config.js`에 입력합니다.

## 2. 사용할 서비스

- Authentication: 관리자 이메일 로그인과 방문자 익명 접수 인증
- Cloud Firestore: 홈페이지 문구와 콘텐츠 정보 저장
- Cloud Storage: 대표 이미지, 시설, 직원, 갤러리, 인증 이미지 저장

Authentication에서 이메일/비밀번호와 익명 로그인 방식을 활성화합니다.

## 3. 첫 관리자 계정

1. Authentication > Users에서 관리자 이메일 사용자를 추가합니다.
2. 생성된 사용자의 UID를 복사합니다.
3. Firestore 루트에 `admins` 컬렉션을 만듭니다.
4. 문서 ID를 관리자 UID와 동일하게 입력합니다.
5. Boolean 필드 `active: true`를 저장합니다.

예시:

```text
admins/{관리자 UID}
  active: true
  role: "content-admin"
```

## 4. 보안 규칙

- Firestore Database > Rules에 `firestore.rules`를 게시합니다.
- Storage > Rules에 `storage.rules`를 게시합니다.

## 5. 관리자 화면

설정 후 `admin.html`에서 로그인합니다. 다음 콘텐츠를 관리할 수 있습니다.

- 홈 대표 이미지와 문구
- 시설 사진과 설명
- 의료진·직원 사진과 소개
- 병원 프로그램 갤러리
- 인증서, 적정성 평가, 표창 및 협약 이미지

## 6. 이미지 운영 기준

- JPG, PNG, WEBP
- 최대 5MB
- 홈 대표 이미지 권장: 1920×1080px
- 시설·갤러리 권장: 1600×900px
- 직원 및 환자가 포함된 사진은 게시 동의를 확인해야 합니다.
- 인증과 평가 자료는 실제 증빙의 명칭, 등급, 연도를 대조한 뒤 게시합니다.

공개 홈페이지는 실시간 감시를 사용하지 않고 페이지 접속 시 공개 콘텐츠를 한 번 조회합니다.
