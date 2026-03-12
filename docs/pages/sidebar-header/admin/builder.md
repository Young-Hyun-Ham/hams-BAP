# `/admin/builder`

- 파일: `app/(siderbar-header)/admin/builder/page.tsx`
- 목적: React Flow 기반 시나리오 빌더 관리자 화면
- 주요 상태 관리
  - `useBuilderStore`
  - `store/historyStore.ts`
  - 전역 `useStore`

## 주요 동작

- 시나리오 목록 조회, 선택, 생성, 이름 수정, 삭제
- 선택한 시나리오를 React Flow 상세 편집 화면으로 전환
- 노드 추가, 드래그 배치, 연결, 삭제, 복제, import/export
- 다른 시나리오를 `scenario` 그룹 노드로 import
- 선택 노드를 `selectionGroup` 으로 그룹화
- 그룹 노드 collapse/expand, ungroup, start node 연계
- builder 전용 시뮬레이터 실행
- 상단 `ReactFlow Panel` 에서 검색, undo/redo, 패널 토글, pan/select 전환 제공
- 런타임 상태 패널(`SlotDisplay`) 표시/숨김
- 전역 이벤트 `builder:reset` 처리

## 최근 반영 내용

- `selectionGroup` 타입과 `GroupNode.jsx` 추가
- 선택 노드 강조와 그룹 노드 편집 흐름 보강
- 직각 연결선 custom edge(`orthogonal`, `draggableStep`) 적용
- builder 레이아웃 스크롤 보정
  - 전체 화면 고정
  - 좌측 `Add Node` 패널만 스크롤
- 캔버스 상단 좌측 `ReactFlow Panel` 구성 확장
  - Undo / Redo 버튼
  - 좌측 패널 숨김/펼치기 버튼
  - Runtime State 패널 토글 버튼
  - Pan / Select 모드 버튼
  - Group 버튼
  - 검색 타입 선택 + 검색어 입력
  - 검색 결과 카드 목록
- 툴 버튼 hover / active 스타일 보강
- pan/select 모드에 따른 캔버스 커서 분리
- 캔버스 패널 숨김/펼치기 처리
- `SlotDisplay` 를 상단 패널 높이에 맞춰 동적으로 아래 배치

## 핵심 구성 요소

### 시나리오 목록 / 진입

- `page.tsx`
- `components/List.tsx`
- `components/Detail.tsx`

### 캔버스 / 편집

- `components/Detail.tsx`
- `components/Detail.module.css`
- `components/NodeController.tsx`
- `components/SlotDisplay.tsx`
- `components/SlotDisplay.module.css`
- `store/index.ts`
- `store/historyStore.ts`

### 노드 렌더링

- `components/nodes/MessageNode.jsx`
- `components/nodes/FormNode.jsx`
- `components/nodes/ApiNode.jsx`
- `components/nodes/ScenarioNode.jsx`
- `components/nodes/GroupNode.jsx`
- `components/nodes/NodeWrapper.jsx`

### 엣지 렌더링

- `components/edges/CustomDraggableEdge.jsx`
- `components/edges/CustomDraggableStepEdge.jsx`
- `components/edges/CustomOrthogonalEdge.jsx`

### 시뮬레이터

- `components/ChatbotSimulator.jsx`
- `components/simulator/SimulatorHeader.jsx`
- `components/simulator/MessageRenderer.jsx`
- `components/simulator/MessageHistory.jsx`

## ReactFlow Panel 메모

상단 좌측 패널 UI 는 `components/Detail.tsx` 의 `ReactFlow <Panel position="top-left">` 안에 배치한다.

- 툴 버튼
  - `Undo`, `Redo`
  - 좌측 패널 토글
  - Runtime State 패널 토글
  - `Pan mode`, `Select mode`
  - `Group Selected Nodes`
- 검색 영역
  - 노드 타입 `select`
  - 검색어 `input`
- 검색 결과
  - 카드 목록 렌더링
  - 클릭 시 노드 선택
  - `setCenter(...)` 로 해당 노드 위치로 이동

## 검색 기능 메모

- 검색 조건
  - 노드 타입 `select`
  - 검색어 `input`
- 검색 대상 예시
  - `message`: `data.content`
  - `form`: `data.title`
  - `api`: `data.url`, `data.apis[].name`
  - `branch`: `data.replies[].display`
  - `selectionGroup`: `data.label`, `data.title`
- 결과 처리
  - `filteredSearchResults` 기반 목록 렌더링
  - 카드 클릭 시 노드 선택
  - 그룹 내부 노드는 절대 좌표 계산 후 이동

## Undo / Redo 메모

- UI 위치: `components/Detail.tsx` 의 `ReactFlow Panel`
- 단축키
  - `Ctrl/Cmd + Z`: undo
  - `Ctrl + Y`: redo
  - `Cmd + Shift + Z`: redo
- 상태 관리
  - `store/historyStore.ts` 에서 `past/future` 관리
  - builder store 변경 시점에만 snapshot 적재
- history 포함 대상
  - 노드 추가 / 삭제 / 이동
  - 엣지 연결 / 삭제
  - 노드 데이터 수정
  - 그룹 / 그룹 해제
  - import
- history 제외 대상
  - 선택 상태 변경
  - 노드 치수 측정
  - React Flow 내부 reset 성격 변경

## Runtime State 패널 메모

- 컴포넌트: `components/SlotDisplay.tsx`
- 목적: 시나리오 실행 중 slot 값과 `selectedRow` 표시
- 표시 방식
  - 상단 `ReactFlow Panel` 의 Runtime State 버튼으로 토글
  - `Detail.tsx` 에서 표시 여부 상태 관리
  - 상단 패널 높이를 기준으로 `SlotDisplay` 위치를 동적으로 계산
- 배치 이유
  - 검색 결과가 늘어나면 상단 패널 높이가 변함
  - 고정 `top: 15px` 방식은 패널과 겹치므로 wrapper 기준 위치 계산으로 변경

## 패키지 구조

```bash
app/(siderbar-header)/admin/builder/
├── ClientErrorButton.tsx
├── error.tsx
├── layout.tsx
├── loading.tsx
├── not-found.tsx
├── template.tsx
├── components/
│   ├── ChatbotSimulator.jsx
│   ├── ChatbotSimulator.module.css
│   ├── Detail.tsx
│   ├── Detail.module.css
│   ├── List.tsx
│   ├── LogPreviewPenal.tsx
│   ├── NodeController.tsx
│   ├── NodeController.module.css
│   ├── SlotDisplay.tsx
│   ├── SlotDisplay.module.css
│   ├── controllers/
│   ├── edges/
│   ├── icons/
│   ├── modals/
│   ├── nodes/
│   └── simulator/
├── services/
│   ├── backendService.ts
│   ├── fastApi.ts
│   └── firebaseApi.ts
├── store/
│   ├── historyStore.ts
│   └── index.ts
├── types/
│   └── types.ts
├── utils/
│   ├── gridUtils.js
│   ├── nodeExecutors.js
│   ├── nodeFactory.js
│   └── simulatorUtils.js
└── page.tsx
```

## 관련 작업 로그

- `2026-03-11` -> [../../../job/20260311/builder-react-flow-ui.md](../../../job/20260311/builder-react-flow-ui.md)
- `2026-03-12 검색 UI` -> [../../../job/20260312/builder-node-search.md](../../../job/20260312/builder-node-search.md)
- `2026-03-12 undo/redo` -> [../../../job/20260312/builder-undo-redo-history.md](../../../job/20260312/builder-undo-redo-history.md)
- `2026-03-12 canvas panel / runtime state` -> [../../../job/20260312/builder-canvas-panel-runtime-state.md](../../../job/20260312/builder-canvas-panel-runtime-state.md)
