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
- 그룹 노드 collapse/expand, ungroup, start node 연결
- builder 전용 시뮬레이터 실행
- 상단 `ReactFlow Panel` 에서 검색, undo/redo, 저장, 패널 토글, pan/select 전환 제공
- 런타임 상태 패널(`SlotDisplay`) 표시/숨김
- 패널형 메모 패드(`MemoPad`) 표시/숨김
- 캔버스 메모 오버레이(`memoNodes`) 추가 및 관리
- 전역 이벤트 `builder:reset` 처리

## 최근 반영 내용

- `selectionGroup` 타입과 `GroupNode.jsx` 추가
- 선택 노드 강조와 그룹 노드 편집 흐름 보강
- 직각 연결용 custom edge(`orthogonal`, `draggableStep`) 적용
- builder 레이아웃 스크롤 보정
  - 전체 화면 고정
  - 좌측 `Add Node` 패널만 스크롤
- 캔버스 상단 좌측 `ReactFlow Panel` 구성 확장
  - Undo / Redo 버튼
  - Save / Back 버튼
  - 좌측 패널 접기/펴기 버튼
  - Runtime State 패널 토글 버튼
  - Pan / Select 모드 버튼
  - 메모 관련 버튼
  - 시뮬레이터 / 로그 버튼
  - Group 버튼
  - 검색 타입 선택 + 검색어 입력
  - 검색 결과 카드 목록
- 각 버튼 hover / active 스타일 보강
- pan/select 모드에 따른 캔버스 커서 분리
- 캔버스 패널 접기/펴기 처리
- `SlotDisplay` 를 상단 패널 높이에 맞춰 동적으로 아래 배치
- 패널형 `MemoPad` 컴포넌트 추가
- 캔버스 메모 컴포넌트 추가
  - `CanvasMemoLayer.tsx`
  - `CanvasMemoItem.tsx`
  - `memoNodes` 상태로 별도 관리
  - 메모 이동, 접기/펴기, 배경색, 투명도, 크기 변경

## 전달 구성 요소

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
- `components/MemoPad.tsx`
- `components/MemoPad.module.css`
- `components/CanvasMemoLayer.tsx`
- `components/CanvasMemoItem.tsx`
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

상단 좌측 패널 UI 는 `components/Detail.tsx` 의 `ReactFlow <Panel position="top-left">` 안에 배치된다.

- 주요 버튼
  - `Undo`, `Redo`
  - `Save`, `Back`
  - 좌측 패널 토글
  - Runtime State 패널 토글
  - `Pan mode`, `Select mode`
  - 메모 관련 버튼
  - 시뮬레이터 / 로그 버튼
  - `Group Selected Nodes`
- 검색 영역
  - 노드 타입 `select`
  - 검색어 `input`
- 검색 결과
  - 카드 목록 렌더링
  - 클릭 시 해당 노드 선택
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
  - 그룹 내부 노드도 절대 좌표 계산 후 이동

## Undo / Redo 메모

- UI 위치: `components/Detail.tsx` 의 `ReactFlow Panel`
- 단축키
  - `Ctrl/Cmd + Z`: undo
  - `Ctrl + Y`: redo
  - `Cmd + Shift + Z`: redo
- 상태 관리
  - `store/historyStore.ts` 에서 `past/future` 관리
  - builder store 변경 시점만 snapshot 적재
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
  - 검색 결과가 늘어나면 상단 패널 높이가 변화
  - 고정 `top: 15px` 방식은 패널과 겹치므로 wrapper 기준 위치 계산으로 변경

## 메모 기능 메모

### 패널형 메모

- 컴포넌트: `components/MemoPad.tsx`
- 목적: 빌더 화면 내부 임시 메모 작성
- 특징
  - 메모 목록 추가/삭제
  - 배경색 변경
  - 오버레이 패널 표시

### 캔버스 메모

- 컴포넌트
  - `components/CanvasMemoLayer.tsx`
  - `components/CanvasMemoItem.tsx`
- 상태 관리
  - React Flow `nodes`와 분리된 `memoNodes`
  - 현재 선택 메모는 `selectedMemoId`
- 주요 기능
  - 현재 viewport 기준 메모 추가
  - 캔버스 이동/줌과 함께 위치 동기화
  - 메모 드래그 이동
  - 접기/펴기
  - 삭제
  - 배경색 변경
  - 배경 투명도 조절
  - 우하단 handle 기반 크기 변경
- 구현 메모
  - viewport transform 적용 필요
  - 드래그와 리사이즈 delta 계산 시 `zoom` 보정 필요
  - 메모 데이터는 노드 export/group/select 로직과 분리 유지

## 패키지 구조

```bash
app/(siderbar-header)/admin/builder/
├─ ClientErrorButton.tsx
├─ error.tsx
├─ layout.tsx
├─ loading.tsx
├─ not-found.tsx
├─ template.tsx
├─ components/
│  ├─ CanvasMemoItem.tsx
│  ├─ CanvasMemoLayer.tsx
│  ├─ ChatbotSimulator.jsx
│  ├─ ChatbotSimulator.module.css
│  ├─ Detail.tsx
│  ├─ Detail.module.css
│  ├─ List.tsx
│  ├─ MemoPad.tsx
│  ├─ MemoPad.module.css
│  ├─ NodeController.tsx
│  ├─ NodeController.module.css
│  ├─ SlotDisplay.tsx
│  ├─ SlotDisplay.module.css
│  ├─ controllers/
│  ├─ edges/
│  ├─ icons/
│  ├─ modals/
│  ├─ nodes/
│  └─ simulator/
├─ services/
│  ├─ backendService.ts
│  ├─ fastApi.ts
│  └─ firebaseApi.ts
├─ store/
│  ├─ historyStore.ts
│  └─ index.ts
├─ types/
│  └─ types.ts
├─ utils/
│  ├─ gridUtils.js
│  ├─ nodeExecutors.js
│  ├─ nodeFactory.js
│  └─ simulatorUtils.js
└─ page.tsx
```

## 관련 작업 로그

- `2026-03-11` -> [../../../job/20260311/builder-react-flow-ui.md](../../../job/20260311/builder-react-flow-ui.md)
- `2026-03-12 검색 UI` -> [../../../job/20260312/builder-node-search.md](../../../job/20260312/builder-node-search.md)
- `2026-03-12 undo/redo` -> [../../../job/20260312/builder-undo-redo-history.md](../../../job/20260312/builder-undo-redo-history.md)
- `2026-03-12 canvas panel / runtime state` -> [../../../job/20260312/builder-canvas-panel-runtime-state.md](../../../job/20260312/builder-canvas-panel-runtime-state.md)
- `2026-03-16 memo pad / canvas memo` -> [../../../job/20260316/builder-memo-pad-and-canvas-memo.md](../../../job/20260316/builder-memo-pad-and-canvas-memo.md)
- `2026-03-16 canvas execution / node status` -> [../../../job/20260316/builder-canvas-execution-and-node-status.md](../../../job/20260316/builder-canvas-execution-and-node-status.md)
- `2026-03-16 selected node + edge drag sync` -> [../../../job/20260316/builder-selected-node-edge-drag-sync.md](../../../job/20260316/builder-selected-node-edge-drag-sync.md)

## 2026-03-16 canvas execution / node status 메모

- builder graph/edit store 와 분리된 실행 상태 store 설계
- `startNodeId` ~ `anchorNodeId` 실행 hook 정리
- 실행 중 노드 우측 상단 로딩 아이콘 표시
- 실행 완료 노드 우측 상단 체크 아이콘 누적 표시
- step 진입 시 기본 1초 로딩 표시
- API 실패 시 전체 종료 대신 `onError` edge 분기 처리
## 2026-03-16 selected node + edge drag sync 메모

- 다중 선택 상태에서 노드 드래그 시 커스텀 edge 내부 좌표도 같이 이동되도록 정리
- 원인 지점: `store/index.ts` 의 `onNodesChange`
- 대상 edge 데이터
  - `data.points`
  - `data.controlX`
  - `data.controlY`
- 처리 방향
  - 이동한 노드의 `dx`, `dy` 계산
  - source/target 이 같은 delta 로 이동한 edge 의 내부 좌표를 평행 이동
  - edge 선택 상태도 함께 고려
- 상세 메모 문서
  - [../../../job/20260316/builder-selected-node-edge-drag-sync.md](../../../job/20260316/builder-selected-node-edge-drag-sync.md)

- `2026-03-17 branch modal / slot reset` -> [../../../job/20260317/builder-branch-modal-selection-and-slot-reset.md](../../../job/20260317/builder-branch-modal-selection-and-slot-reset.md)
- `2026-03-17 context menu / layer menu` -> [../../../job/20260317/builder-context-menu-layer-and-node-edge-delete.md](../../../job/20260317/builder-context-menu-layer-and-node-edge-delete.md)

## 2026-03-17 branch modal / slot reset 메모

- 캔버스 플레이에서 `branch(BUTTON)` 첫 번째 reply 자동 선택을 제거하고 사용자 선택 기반 흐름으로 정리
- `useBuilderExecutionStore.ts` 에 branch 선택 대기 상태를 추가하는 방향 정리
- `useBuilderExecution.ts` 에 `pendingBranchNodeRef`, `branchSelectionResolverRef` 기반 비동기 선택 구조 정리
- `Detail.tsx` 에 실행 중 branch 선택용 전용 모달을 두는 방향 정리
- 플레이 시작 시 builder store의 `slots` 를 초기화한 뒤 실행을 시작해야 한다는 점 정리
- 상세 메모 문서
  - [../../../job/20260317/builder-branch-modal-selection-and-slot-reset.md](../../../job/20260317/builder-branch-modal-selection-and-slot-reset.md)

## 2026-03-17 context menu / layer menu 메모

- 캔버스 상단 `ReactFlow Panel` 의 과밀한 버튼 구성을 우클릭 기반 `layer` 메뉴로 일부 이동하는 방향 정리
- 빈 캔버스 우클릭 시 `pane` 대상 메뉴를 띄우고, 임시 5개 항목으로
  - `Left Panel`
  - `Runtime State`
  - `Pan Mode`
  - `Select Mode`
  - `Add Memo`
  를 제공하는 구조 정리
- `node` 우클릭 시 해당 node 선택 후 `Delete Node` 메뉴를 띄우는 방향 정리
- `edge` 우클릭 시 해당 edge 를 `selected: true` 로 만든 뒤 `Delete Edge` 메뉴를 띄우고 `deleteSelectedEdges()` 를 재사용하는 방향 정리
- 컨텍스트 메뉴 상태를 `target.type = pane | node | edge` 로 통합 관리하는 구조 정리
- 메뉴 좌표와 CSS positioning 기준이 어긋나면 중앙 근처에 잘못 뜰 수 있으므로
  - `position: fixed` + `clientX/clientY`
  - 또는 `position: absolute` + wrapper bounds 보정
  중 하나로 기준을 맞춰야 한다는 점 정리
- `setEdges` 는 함수형 setter 가 아니라 최종 `Edge[]` 배열을 받으므로, edge 선택 처리 시 `edges.map(...)` 결과를 직접 넘겨야 한다는 점 정리
- 상세 메모 문서
  - [../../../job/20260317/builder-context-menu-layer-and-node-edge-delete.md](../../../job/20260317/builder-context-menu-layer-and-node-edge-delete.md)

- `2026-03-17 context menu node clipboard` -> [../../../job/20260317/builder-context-menu-node-clipboard.md](../../../job/20260317/builder-context-menu-node-clipboard.md)
- `2026-03-18 simulator scenario-core migration` -> [../../../job/20260318/builder-simulator-scenario-core-migration.md](../../../job/20260318/builder-simulator-scenario-core-migration.md)

## 2026-03-18 simulator scenario-core migration 메모

- simulator execution path is being migrated from hook-owned runtime logic to `@chatbot/scenario-core`
- `ChatbotEngine.ts` owns traversal and generic node execution
- `useChatFlow.js` must remain the React/UI adapter for:
  - simulator `history` shaping
  - `fixedMenu` state
  - slot synchronization into builder store
  - API and LLM callback integration
  - user input re-entry into engine execution
- `useChatFlow-bak.js` remains the reference for legacy simulator responsibilities during migration
- detailed notes are documented in:
  - [../../../job/20260318/builder-simulator-scenario-core-migration.md](../../../job/20260318/builder-simulator-scenario-core-migration.md)

## 2026-03-17 context menu node clipboard 메모

- 기존 `Export Nodes` / `Import Nodes` 는 유지하고, 우클릭 메뉴 전용 clipboard 흐름을 별도 정리
- `useBuilderClipboardStore.ts` 기반으로 `copySelection`, `cutSelection`, `pasteClipboard` 를 관리하는 방향 정리
- `cut` 동작을 위해 builder store 에 `deleteNodesByIds(nodeIds)` bulk delete 액션을 추가하는 방향 정리
- bulk delete 는 history snapshot 1회 적재, group 자식 node 포함 제거, 관련 edge 제거를 함께 처리해야 한다는 점 정리
- paste 시 node / edge id 재매핑뿐 아니라 group 내부 node 의 `parentNode` 도 새 id 기준으로 재매핑해야 한다는 점 정리
- `makeSnapshot` 은 `store/index.ts` 에 이미 정의되어 있으며, `Detail.tsx` 에서는 `useBuilderHistoryStore` 와 함께 직접 호출 helper 를 만드는 방향 정리
- `Paste` 메뉴는 clipboard 가 비어 있으면 disabled 처리하고 회색 텍스트 스타일을 적용하는 방향 정리
- ?곸꽭 硫붾え 臾몄꽌
  - [../../../job/20260317/builder-context-menu-node-clipboard.md](../../../job/20260317/builder-context-menu-node-clipboard.md)
