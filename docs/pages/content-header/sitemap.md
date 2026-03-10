# `/sitemap`

- 파일: `app/(content-header)/sitemap/page.tsx`
- 목적: 현재 메뉴 구조를 시각적으로 확인하는 사이트맵 화면
- 주요 동작:
  - 메뉴 목록 조회
  - 1레벨 메뉴 카드 표시
  - Admin 메뉴 트리 토글 표시
- 연관 구성: `components/SitemapTree.tsx`, `services/backendService.ts`
- 구현 메모: 메뉴 데이터 품질 점검과 IA 확인에 유용한 운영 보조 화면

# `/sitemap` 패키지 구조

```bash
app/(content-header)/sitemap/
├── components/
│   └── SitemapTree.tsx   # 사이트맵/어드민 트리 UI
├── dto/
│   ├── firebaseApi.ts    # Firebase 메뉴 조회 DTO
│   └── postgresApi.ts    # Postgres 메뉴 조회 DTO
├── services/
│   └── backendService.ts # 백엔드별 메뉴 조회 추상화
├── types/
│   └── types.ts          # 사이트맵 타입 정의
└── page.tsx              # 사이트맵 메인 페이지
```
