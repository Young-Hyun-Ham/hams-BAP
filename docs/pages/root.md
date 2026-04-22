# Root

- 경로: `/`
- 주요 동작: 서버에서 `getUserServer()`로 세션 확인 후 인증되면 `/main`, 아니면 `/login`으로 즉시 이동
- 연관 구성: `lib/session.ts`, `app/(content)/login/page.tsx`
