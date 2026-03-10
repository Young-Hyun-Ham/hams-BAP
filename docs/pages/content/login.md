# `/login`

- 파일: `app/(content)/login/page.tsx`
- 목적: 프로젝트 로그인 진입 화면
- 주요 동작: 백엔드 종류에 따라 로그인 UI를 다르게 렌더링
- 로그인 방식:
  - Firebase: Google 로그인, 테스트 ID 로그인, 이메일 로그인
  - Postgres: 이메일 로그인, Google 로그인
- 상태 관리: 전역 `useStore`의 `loginWithGoogle`, `loginWithTestId`, `loginWithEmail` 사용
- 구현 메모: 기본 계정값과 테스트 흐름이 남아 있어 운영 전 정리가 필요

# `/login` 패키지 구조

```bash
app/(content)/login/
├── Login.module.css # 로그인 전용 스타일
└── page.tsx         # 로그인 메인 페이지
```
