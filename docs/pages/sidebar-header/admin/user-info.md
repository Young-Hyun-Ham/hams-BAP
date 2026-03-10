# `/admin/user-info`

- 파일: `app/(siderbar-header)/admin/user-info/page.tsx`
- 목적: 사용자 계정 목록과 상세 수정 관리
- 주요 동작:
  - 사용자 목록 조회
  - 검색, 페이징, provider 표시
  - 사용자 생성/수정/삭제
  - 편집 모달 제공
- 상태 관리: `useUserStore`
- 연관 구성: `UserEditModal.tsx`
- 구현 메모: 계정 운영 화면이며 폼 상태를 페이지에서 직접 관리하는 비중이 높음

# `/admin/user-info` 패키지 구조

```bash
app/(siderbar-header)/admin/user-info/
├── components/
│   └── modal/
│       └── UserEditModal.tsx # 사용자 편집 모달
├── store/
│   └── index.ts              # 사용자 관리 Store
├── types/
│   └── index.ts              # 사용자 관리 타입 정의
└── page.tsx                  # 사용자 정보 메인 페이지
```
