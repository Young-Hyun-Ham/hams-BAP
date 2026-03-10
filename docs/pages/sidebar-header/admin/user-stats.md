# `/admin/user-stats`

- 파일: `app/(siderbar-header)/admin/user-stats/page.tsx`
- 목적: 사용자별 이용 통계를 조회하는 관리자 화면
- 주요 동작:
  - 사용자 검색
  - 선택 사용자 통계 조회
  - 일/주/월/년 단위 차트 표시
- 연관 API:
  - `/api/admin/firebase/user-stats`
  - `/api/admin/firebase/user-stats/[uid]`
- 구현 메모: Firebase 관리자 통계 흐름에 의존

# `/admin/user-stats` 패키지 구조

```bash
app/(siderbar-header)/admin/user-stats/
├── types/
│   └── index.ts # 사용자 통계 타입 정의
└── page.tsx     # 사용자 통계 메인 페이지
```
