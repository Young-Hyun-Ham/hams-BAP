# `/admin/board`

- 파일: `app/(siderbar-header)/admin/board/page.tsx`
- 목적: 게시글 목록과 상세를 관리하는 관리자 화면
- 주요 동작:
  - 목록 조회
  - 검색 조건과 페이징 반영
  - 등록, 상세, 삭제 모달 제공
- 상태 관리: `useAdminBoardStore`
- 연관 구성: `BoardSearchBar.tsx`, `BoardListPanel.tsx`, `BoardPagination.tsx`, 관련 modal들
- 구현 메모: 공개 게시판 데이터의 운영 백오피스 역할

# `/admin/board` 패키지 구조

```bash
app/(siderbar-header)/admin/board/
├── components/
│   ├── BoardListPanel.tsx       # 게시글 목록 패널
│   ├── BoardPagination.tsx      # 게시글 페이징 UI
│   ├── BoardSearchBar.tsx       # 검색/필터 UI
│   └── modal/
│       ├── BoardDeleteModal.tsx # 게시글 삭제 모달
│       ├── BoardDetailModal.tsx # 게시글 상세 모달
│       ├── BoardUnlockModal.tsx # 잠금 해제 모달
│       ├── BoardUpsertModal.tsx # 게시글 등록/수정 모달
│       ├── _components/
│       │   ├── ReplyComposer.tsx
│       │   ├── ReplyThreadCard.tsx
│       │   └── ShowDeletedToggle.tsx
│       └── _hooks/
│           ├── useReplyThreads.ts
│           └── useShowDeletedReplies.ts
├── store/
│   └── index.ts                 # 관리자 게시판 Store
├── types/
│   └── index.ts                 # 게시판 타입 정의
└── page.tsx                     # 관리자 게시판 메인 페이지
```
