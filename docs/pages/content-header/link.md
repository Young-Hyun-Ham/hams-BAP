# `/link`

- 파일: `app/(content-header)/link/page.tsx`
- 목적: 외부 서비스 모음 허브
- 주요 동작:
  - 사전 정의된 서비스 목록을 버튼 형태로 노출
  - 선택한 서비스의 설명과 연결 카드 렌더링
  - 팝업 또는 iframe 방식 연결을 구분하도록 설계
- 연관 구성: `IframeCard.tsx`, `ExternalLink.tsx`
- 구현 메모: 현재 대상 서비스는 Hams 계열 외부 사이트 중심이며, `openExternal` 로직은 비활성 상태

# `/link` 패키지 구조

```bash
app/(content-header)/link/
├── components/
│   ├── ExternalLink.tsx # 외부 링크 안내/연결 UI
│   └── IframeCard.tsx   # iframe 렌더링 카드
├── types/
│   └── index.ts         # 링크 대상 타입 정의
└── page.tsx             # 외부 서비스 허브 페이지
```
