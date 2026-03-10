# `/admin/builder`

- 파일: `app/(siderbar-header)/admin/builder/page.tsx`
- 목적: 시나리오 빌더 관리자 화면
- 주요 동작:
  - 시나리오 목록 조회
  - 선택 시 상세 편집 화면 전환
  - 도움말 및 시나리오 생성/수정 모달 제공
  - 전역 이벤트 `builder:reset` 처리
- 상태 관리: `useBuilderStore`, 전역 `useStore`
- 연관 구성: `components/List.tsx`, `components/Detail.tsx`, 관련 modal들
- 구현 메모: 프로젝트 핵심 편집 도구 중 하나이며 화면 복잡도가 높음

# `/admin/builder` 패키지 구조

```bash
app/(siderbar-header)/admin/builder/
├── ClientErrorButton.tsx         # 에러 테스트 버튼
├── error.tsx                     # 에러 경계 화면
├── layout.tsx                    # 빌더 전용 레이아웃
├── loading.tsx                   # 로딩 화면
├── not-found.tsx                 # 404 화면
├── template.tsx                  # 템플릿 래퍼
├── components/
│   ├── ChatbotSimulator.jsx      # 시뮬레이터 본체
│   ├── ChatbotSimulator.module.css
│   ├── Detail.tsx                # 시나리오 상세 편집 패널
│   ├── Detail.module.css
│   ├── List.tsx                  # 시나리오 목록
│   ├── LogPreviewPenal.tsx       # 로그 미리보기 패널
│   ├── NodeController.tsx        # 노드 속성 컨트롤러
│   ├── NodeController.module.css
│   ├── SlotDisplay.tsx           # 슬롯 표시 UI
│   ├── SlotDisplay.module.css
│   ├── controllers/
│   │   ├── ApiNodeController.jsx
│   │   ├── BranchNodeController.jsx
│   │   ├── DefaultNodeController.jsx
│   │   ├── DelayNodeController.jsx
│   │   ├── FixedMenuNodeController.jsx
│   │   ├── FormNodeController.jsx
│   │   ├── IframeNodeController.jsx
│   │   ├── LinkNodeController.jsx
│   │   ├── LlmNodeController.jsx
│   │   ├── MessageNodeController.jsx
│   │   ├── SetSlotNodeController.jsx
│   │   ├── SlotFillingNodeController.jsx
│   │   ├── ToastNodeController.jsx
│   │   ├── common/
│   │   │   └── ChainNextCheckbox.jsx
│   │   └── hooks/
│   │       ├── useChatFlow.js
│   │       ├── useDraggableScroll.js
│   │       └── useNodeController.js
│   ├── icons/
│   │   └── Icons.tsx
│   ├── modals/
│   │   ├── ApiTemplateModal.jsx
│   │   ├── ApiTemplateModal.module.css
│   │   ├── FormTemplateModal.jsx
│   │   ├── HelpModal.jsx
│   │   ├── HelpModal.module.css
│   │   ├── LogPreview.tsx
│   │   ├── ScenarioGroupModal.jsx
│   │   ├── ScenarioModal.jsx
│   │   └── ScenarioModal.module.css
│   ├── nodes/
│   │   ├── ApiNode.jsx
│   │   ├── BranchNode.jsx
│   │   ├── ChatNodes.module.css
│   │   ├── DelayNode.jsx
│   │   ├── FixedMenuNode.jsx
│   │   ├── FormNode.jsx
│   │   ├── IframeNode.jsx
│   │   ├── LinkNode.jsx
│   │   ├── LlmNode.jsx
│   │   ├── MessageNode.jsx
│   │   ├── NodeWrapper.jsx
│   │   ├── ScenarioNode.jsx
│   │   ├── SetSlotNode.jsx
│   │   ├── SlotFillingNode.jsx
│   │   └── ToastNode.jsx
│   └── simulator/
│       ├── MessageHistory.jsx
│       ├── MessageRenderer.jsx
│       └── SimulatorHeader.jsx
├── services/
│   ├── backendService.ts         # 백엔드 추상화
│   ├── fastApi.ts                # FastAPI 연동
│   └── firebaseApi.ts            # Firebase 연동
├── store/
│   └── index.ts                  # 빌더 Store
├── types/
│   └── types.ts                  # 빌더 타입 정의
├── utils/
│   ├── gridUtils.js              # 그리드 유틸
│   ├── nodeExecutors.js          # 노드 실행 유틸
│   ├── nodeFactory.js            # 노드 생성 유틸
│   └── simulatorUtils.js         # 시뮬레이터 유틸
└── page.tsx                      # 빌더 메인 페이지
```
