# `/admin/category`

- 파일: `app/(siderbar-header)/admin/category/page.tsx`
- 목적: 게시판 카테고리 관리자 화면
- 주요 동작:
  - 카테고리 목록 로드
  - 좌측 목록, 우측 상세 편집 패널 구성
  - 생성/삭제 모달 제공
- 상태 관리: `useAdminBoardCategoryStore`
- 연관 구성: `BoardCategoryListPanel.tsx`, `BoardCategoryDetailPanel.tsx`
- 구현 메모: 게시판 구조와 공개 FAQ/게시글 분류에 연동될 수 있는 기초 관리 화면

# `/admin/category` 패키지 구조

```bash
app/(siderbar-header)/admin/category/
├── components/
│   ├── BoardCategoryDetailPanel.tsx     # 카테고리 상세 패널
│   ├── BoardCategoryListPanel.tsx       # 카테고리 목록 패널
│   └── modal/
│       ├── BoardCategoryDeleteModal.tsx # 카테고리 삭제 모달
│       └── BoardCategoryUpsertModal.tsx # 카테고리 등록/수정 모달
├── store/
│   └── index.ts                         # 카테고리 관리 Store
├── types/
│   └── index.ts                         # 카테고리 타입 정의
└── page.tsx                             # 카테고리 메인 페이지
```
