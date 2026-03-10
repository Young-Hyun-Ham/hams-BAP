# `/admin/menu`

- 파일: `app/(siderbar-header)/admin/menu/page.tsx`
- 목적: 메뉴 데이터 관리 화면
- 주요 동작:
  - 메뉴 목록 조회
  - 검색, 레벨 필터, 페이징
  - 메뉴 생성/수정 모달
  - 메뉴 선택 상태 관리
- 상태 관리: `useMenuStore`, 전역 `useStore`
- 연관 구성: `MenuModal.tsx`
- 구현 메모: 사이트맵 및 네비게이션 구조 유지보수와 직접 연결되는 화면

# `/admin/menu` 패키지 구조

```bash
app/(siderbar-header)/admin/menu/
├── components/
│   └── modal/
│       └── MenuModal.tsx # 메뉴 등록/수정 모달
├── store/
│   └── index.ts          # 메뉴 관리 Store
├── types/
│   └── types.ts          # 메뉴 타입 정의
└── page.tsx              # 메뉴 관리 메인 페이지
```
