# `/admin/knowledge`

- 파일: `app/(siderbar-header)/admin/knowledge/page.tsx`
- 목적: 지식 프로젝트, 인텐트, 엔티티를 관리하는 화면
- 주요 동작:
  - 프로젝트 목록 로드 및 선택
  - 프로젝트 생성/수정/삭제
  - 선택 프로젝트의 인텐트/엔티티 탭 관리
- 상태 관리: `useKnowledgeStore`
- 연관 구성: `ProjectListPanel.tsx`, `IntentEntityTabs.tsx`
- 구현 메모: 지식 베이스 운영의 중심 화면

# `/admin/knowledge` 패키지 구조

```bash
app/(siderbar-header)/admin/knowledge/
├── components/
│   ├── IntentEntityTabs.tsx      # 인텐트/엔티티 탭 컨테이너
│   ├── ProjectListPanel.tsx      # 프로젝트 목록 패널
│   └── modal/
│       ├── ConfirmDeleteModal.tsx
│       ├── ConfirmDeleteProjectModal.tsx
│       ├── EntityModal.tsx
│       ├── IntentModal.tsx
│       └── ScenarioPickerModal.tsx
├── store/
│   └── index.ts                  # 지식 관리 Store
├── types/
│   └── index.ts                  # 지식 관리 타입 정의
├── utils/
│   └── index.ts                  # 보조 유틸
└── page.tsx                      # 지식 관리 메인 페이지
```
