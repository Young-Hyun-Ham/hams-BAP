# `/admin/token-manage`

- 파일: `app/(siderbar-header)/admin/token-manage/page.tsx`
- 목적: 사용자 토큰 잔액과 충전 이력을 관리하는 화면
- 주요 동작:
  - 사용자 목록 조회
  - 검색, 페이징
  - 충전 모달 및 이력 모달 제공
- 상태 관리: `useUserTokenStore`
- 연관 구성: `TokenChargeModal.tsx`, `TokenHistoryModal.tsx`
- 구현 메모: TODO 주석이 남아 있어 일부 흐름은 추가 정리가 필요

# `/admin/token-manage` 패키지 구조

```bash
app/(siderbar-header)/admin/token-manage/
├── components/
│   ├── Icons.tsx                 # 토큰 관리 아이콘
│   └── modal/
│       ├── TokenChargeModal.tsx  # 토큰 충전 모달
│       └── TokenHistoryModal.tsx # 토큰 이력 모달
├── store/
│   └── index.ts                  # 토큰 관리 Store
├── types/
│   └── index.ts                  # 토큰 관리 타입 정의
├── utils/
│   └── index.ts                  # 숫자 포맷 등 유틸
└── page.tsx                      # 토큰 관리 메인 페이지
```
