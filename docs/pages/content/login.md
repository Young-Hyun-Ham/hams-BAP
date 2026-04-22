# Login

- 경로: `/login`
- 주요 동작: `hams-BAP` 내부 로그인 UI 없이 `/api/sso/login`으로 즉시 리다이렉트
- 인증 처리: `hams-oauth` SSO 서버가 로그인 화면과 사용자 인증을 담당
- 콜백 처리: `app/api/sso/callback/route.ts`에서 authorization code 교환 후 로컬 세션 쿠키를 생성
