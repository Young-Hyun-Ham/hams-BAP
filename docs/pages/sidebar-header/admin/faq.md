# `/admin/faq`

- 파일: `app/(siderbar-header)/admin/faq/page.tsx`
- 목적: FAQ 등록 및 수정 관리자 화면
- 주요 동작:
  - FAQ 목록 조회
  - 검색 조건 변경 시 디바운스 재조회
  - 좌측 목록, 우측 상세 패널 구성
  - 등록/삭제 모달 제공
- 상태 관리: `useAdminFaqStore`
- 연관 구성: `FaqListPanel.tsx`, `FaqDetailPanel.tsx`, FAQ 모달들
- 구현 메모: 공개 FAQ 화면의 원천 데이터를 관리하는 백오피스

# `/admin/faq` 패키지 구조

```bash
app/(siderbar-header)/admin/faq/
├── components/
│   ├── FaqDetailPanel.tsx     # FAQ 상세 패널
│   ├── FaqListPanel.tsx       # FAQ 목록 패널
│   ├── FaqSearchBar.tsx       # 검색/필터 UI
│   └── modal/
│       ├── FaqDeleteModal.tsx # FAQ 삭제 모달
│       └── FaqUpsertModal.tsx # FAQ 등록/수정 모달
├── store/
│   └── index.ts               # FAQ 관리 Store
├── types/
│   └── index.ts               # FAQ 타입 정의
└── page.tsx                   # FAQ 관리 메인 페이지
```
