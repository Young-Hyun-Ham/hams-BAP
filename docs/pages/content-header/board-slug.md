# `/board/[slug]`

- 파일: `app/(content-header)/board/[slug]/page.tsx`
- 목적: 게시판 slug에 따라 공개 게시글 목록과 상세를 조회하는 화면
- 주요 동작:
  - URL 파라미터 `slug` 읽기
  - slug 기준 게시글 목록 조회
  - 검색 조건 반영한 목록 필터링
  - 상세 패널 슬라이드 표시
- 상태 관리: `usePublicBoardStore`
- 연관 구성: `BoardListPanel.tsx`, `BoardDetailPanel.tsx`, 등록/삭제 모달
- 구현 메모: 공개 게시판이지만 모달 구성이 함께 있어 작성 권한 정책 확인이 필요

# `/board/[slug]` 패키지 구조

```bash
app/(content-header)/board/
├── README.md                    # Board Front 문서
└── [slug]/
    ├── components/
    │   ├── BoardDetailPanel.tsx # 게시글 상세 패널
    │   ├── BoardListPanel.tsx   # 게시글 목록 패널
    │   ├── BoardSearchBar.tsx   # 검색/필터 UI
    │   └── modal/
    │       ├── BoardDeleteModal.tsx # 게시글 삭제 모달
    │       └── BoardUpsertModal.tsx # 게시글 등록/수정 모달
    ├── store/
    │   └── index.ts             # Board 전용 Zustand Store
    ├── types/
    │   └── index.ts             # Board 관련 타입 정의
    └── page.tsx                 # Board 메인 페이지
```
