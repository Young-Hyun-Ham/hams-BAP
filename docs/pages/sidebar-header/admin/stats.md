# `/admin/stats`

- 파일: `app/(siderbar-header)/admin/stats/page.tsx`
- 목적: 서비스 전반의 통계를 차트로 확인하는 관리자 대시보드
- 주요 동작:
  - 기간 범위와 기준일(anchor) 선택
  - 라인, 바, 도넛 차트 렌더링
  - 통계 API 호출 결과 요약 표시
- 연관 API: `/api/admin/firebase/stats`
- 연관 구성: `chart.js`, `react-chartjs-2`
- 구현 메모: Firebase 통계 API에 의존하는 시각화 화면

# `/admin/stats` 패키지 구조

```bash
app/(siderbar-header)/admin/stats/
├── types/
│   └── index.ts # 관리자 통계 타입 정의
└── page.tsx     # 관리자 통계 메인 페이지
```
