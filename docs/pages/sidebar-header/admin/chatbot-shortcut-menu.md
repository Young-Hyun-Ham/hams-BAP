# `/admin/chatbot-shortcut-menu`

- 파일: `app/(siderbar-header)/admin/chatbot-shortcut-menu/page.tsx`
- 목적: 챗봇 바로가기 메뉴를 관리하는 화면
- 주요 동작:
  - 그룹별 메뉴 목록 조회
  - 검색, 필터, 페이징
  - 등록/수정 모달 제공
- 상태 관리: `useShortcutMenuStore`
- 연관 구성: `ShortcutMenuModal.tsx`
- 구현 메모: 챗봇 첫 진입 UX와 추천 액션 구성에 영향이 큰 운영 화면

# `/admin/chatbot-shortcut-menu` 패키지 구조

```bash
app/(siderbar-header)/admin/chatbot-shortcut-menu/
├── components/
│   └── modal/
│       └── ShortcutMenuModal.tsx # 바로가기 메뉴 등록/수정 모달
├── store/
│   └── index.ts                  # 바로가기 메뉴 Store
├── types/
│   └── types.ts                  # 바로가기 메뉴 타입 정의
└── page.tsx                      # 바로가기 메뉴 메인 페이지
```
