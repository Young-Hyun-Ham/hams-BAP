| 영역 | 경로 | 역할 | 비고 |
| --- | --- | --- | --- |
| 로그인 | `app/(content)/login` | `hams-oauth` SSO 서버로 리다이렉트 | 로컬 로그인 UI 제거 |
| Token Manage | `app/(siderbar-header)/admin/token-manage` | 토큰/사용량 관리 | AI 비용 관리 포인트 |
| 인증 | `app/api/sso`, `app/api/auth/me`, `app/api/auth/logout` | SSO 시작, code 교환, 세션 조회/정리 | 자체 로그인 API 제거 |
| 사용자 API | `app/api/users`, `app/api/user-token` | 사용자/토큰 관리 | |
| 외부 연동 | `app/api/ollama` | 모델 연동 | Google OAuth 제거 |
