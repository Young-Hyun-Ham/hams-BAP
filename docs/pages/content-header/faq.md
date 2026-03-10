# `/faq`

- 파일: `app/(content-header)/faq/page.tsx`
- 목적: 공개 FAQ 조회 화면
- 주요 동작:
  - 최초 FAQ 목록 로드
  - 키워드/카테고리 변경 시 디바운스 조회
  - 아코디언 형태 목록 표시
  - 페이지 이동 버튼 제공
- 상태 관리: `usePublicFaqStore`
- 연관 구성: `FaqPublicSearchBar.tsx`, `FaqCategoryChips.tsx`, `FaqAccordionList.tsx`
- 구현 메모: 사용자용 FAQ 소비 화면이며 관리 기능은 포함하지 않음

# `/faq` 패키지 구조

```bash
app/(content-header)/faq/
├── components/
│   ├── FaqAccordionList.tsx   # FAQ 목록 아코디언
│   ├── FaqCategoryChips.tsx   # 카테고리 선택 칩
│   └── FaqPublicSearchBar.tsx # 공개 검색 바
├── store/
│   └── index.ts               # 공개 FAQ Store
├── types/
│   └── index.ts               # FAQ 타입 정의
└── page.tsx                   # 공개 FAQ 메인 페이지
```
