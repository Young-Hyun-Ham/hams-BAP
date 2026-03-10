# `/`

- 파일: `app/page.tsx`
- 목적: 서버에서 사용자 세션을 조회한 뒤 클라이언트 루트 레이아웃으로 전달하는 진입 페이지
- 주요 동작: `getUserServer()` 호출 후 `RootClient`에 `initialUser` 주입
- 연관 구성: `lib/session.ts`, `components/RootClient.tsx`
- 구현 메모: 실제 UI보다는 인증 초기화와 라우팅 분기 역할이 중심인 엔트리 포인트

# `/` 패키지 구조

```bash
app/
├── layout.tsx      # 전역 레이아웃
├── globals.css     # 전역 스타일
├── favicon.ico     # 파비콘
└── page.tsx        # 루트 진입 페이지
```
