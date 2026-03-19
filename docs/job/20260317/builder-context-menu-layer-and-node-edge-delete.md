# `[2026-03-17][HAMS-BAP] builder context menu / layer menu 정리`

## 개요

`/admin/builder` 의 React Flow 캔버스 상단 패널에 버튼이 과도하게 몰려 있어, 일부 기능을 우클릭 기반 `layer` 메뉴로 이동하는 방향을 정리한 문서다.

이번 정리 범위는 두 가지다.

- 빈 캔버스 우클릭 시 상단 패널 일부 기능을 대신하는 `layer` 메뉴를 띄운다.
- `node` 또는 `edge` 우클릭 시 해당 대상을 선택하고, 삭제 중심의 전용 컨텍스트 메뉴를 띄운다.

## 배경

기존 builder UI 는 `components/Detail.tsx` 의 `ReactFlow <Panel position="top-left">` 내부 `toolRow` 에 다수의 버튼을 직접 나열하는 구조다.

- undo / redo
- save / back
- 좌측 패널 토글
- runtime state 토글
- pan / select 모드 전환
- 메모 관련 기능
- 시뮬레이터 / 로그
- 실행 관련 기능
- group 관련 기능

기능은 늘었지만, 상단 패널 밀도가 높아져 캔버스 작업 중 마우스 이동량이 커지고 시야가 분산되는 문제가 생겼다. 따라서 자주 쓰지만 즉시 노출이 필수는 아닌 기능을 우클릭 메뉴로 이동하는 방향이 적합하다.

## 주요 확인 위치

- `app/(siderbar-header)/admin/builder/components/Detail.tsx`
- `app/(siderbar-header)/admin/builder/components/Detail.module.css`
- `app/(siderbar-header)/admin/builder/store/index.ts`
- `docs/pages/sidebar-header/admin/builder.md`

## UI 방향

### 1. 빈 캔버스 우클릭 `layer` 메뉴

빈 캔버스에서 우클릭하면 `pane` 대상 메뉴를 띄운다.

임시 메뉴 5개 구성:

- `Left Panel`
- `Runtime State`
- `Pan Mode`
- `Select Mode`
- `Add Memo`

메뉴 항목에는 아이콘을 앞쪽에 배치하고, 중간에 divider 를 두어 시각적으로 묶음을 나눈다.

### 2. 노드 / 엣지 우클릭 전용 메뉴

캔버스 외부가 아니라 실제 graph element 위에서 우클릭한 경우에는 대상 선택 후 별도 메뉴를 띄운다.

- `node` 우클릭
  - 해당 node 를 선택
  - `Delete Node` 메뉴 표시
- `edge` 우클릭
  - 해당 edge 를 선택 상태로 표시
  - `Delete Edge` 메뉴 표시

즉, 메뉴는 단일 컴포넌트가 아니라 `target.type` 에 따라 `pane | node | edge` 세 가지 케이스로 분기하는 구조가 적합하다.

## 상태 구조 메모

### layer 메뉴

빈 캔버스 메뉴만 따로 관리하려면 아래 수준의 상태로 충분하다.

- `open`
- `x`
- `y`

### context 메뉴

대상별 분기를 하려면 아래 구조가 더 적합하다.

- `open`
- `x`
- `y`
- `target`
  - `{ type: "pane" }`
  - `{ type: "node", id }`
  - `{ type: "edge", id }`

실제 구현에서는 `layerMenu` 와 `contextMenu` 를 분리하기보다 `contextMenu.target` 으로 통합 관리하는 쪽이 중복이 적다.

## 이벤트 처리 방향

React Flow 이벤트를 아래처럼 분리해서 받는다.

- `onPaneContextMenu`
- `onNodeContextMenu`
- `onEdgeContextMenu`
- `onPaneClick`

핵심 처리:

1. `pane` 우클릭
   - 브라우저 기본 컨텍스트 메뉴 차단
   - node / edge 선택 해제
   - `target: { type: "pane" }` 로 메뉴 오픈
2. `node` 우클릭
   - 브라우저 기본 컨텍스트 메뉴 차단
   - 이벤트 전파 중단
   - `setSelectedNodeId(node.id)`
   - edge 선택 해제
   - `target: { type: "node", id: node.id }` 로 메뉴 오픈
3. `edge` 우클릭
   - 브라우저 기본 컨텍스트 메뉴 차단
   - 이벤트 전파 중단
   - node 선택 해제
   - `edges` 배열에서 대상 edge 만 `selected: true`
   - `target: { type: "edge", id: edge.id }` 로 메뉴 오픈
4. 캔버스 좌클릭
   - 메뉴 닫기

## 선택 / 삭제 처리 메모

### node 삭제

`deleteNode(nodeId)` 는 builder store 에 이미 존재한다.

- 위치: `store/index.ts`
- 동작:
  - history snapshot 적재
  - node 삭제
  - 관련 edge 삭제
  - scenario / selectionGroup 인 경우 자식 node 도 함께 제거

### edge 삭제

현재 store 에 `deleteEdge(edgeId)` 는 없고, `deleteSelectedEdges()` 만 있다.

따라서 edge 우클릭 삭제는 아래 흐름으로 처리하는 것이 자연스럽다.

1. 우클릭한 edge 를 `selected: true` 로 만든다.
2. 메뉴의 `Delete Edge` 클릭 시 `deleteSelectedEdges()` 호출

이 프로젝트의 `setEdges` 는 React `useState` setter 와 달리 함수형 업데이트를 받지 않는다. 즉, `setEdges((prev) => ...)` 방식은 맞지 않는다. 항상 최종 `Edge[]` 배열을 만들어 넘겨야 한다.

## 좌표 처리 메모

우클릭 위치에 메뉴가 바로 붙지 않고 중앙 근처에 보이는 문제는 메뉴 좌표 기준과 CSS positioning 기준이 어긋날 때 발생한다.

정리:

- `position: fixed`
  - `event.clientX`, `event.clientY` 사용
- `position: absolute`
  - `reactFlowWrapper.getBoundingClientRect()` 기준으로 보정
  - `clientX - bounds.left`, `clientY - bounds.top` 사용

추가 주의:

- `setContextMenu(...)` 직후 같은 함수에서 `contextMenu.x` 를 로그로 읽으면 이전 state 가 보일 수 있다.
- 좌표 확인 시에는 `event.clientX / event.clientY` 또는 `nextMenu` 객체를 직접 로그로 찍어야 한다.

## 스타일 메모

메뉴 항목은 공통 버튼 클래스로 관리하는 것이 안정적이다.

- `.layerMenu`
  - 배경, border, shadow, z-index
- `.layerMenuItem`
  - `display: flex`
  - `align-items: center`
  - `gap`
  - hover 배경
- `.layerMenuIcon`
  - `flex-shrink: 0`
- `.layerMenuDivider`
  - 얇은 구분선
  - 약한 shadow 가능

`button` 내부에 icon + text 를 넣을 때는 `layerMenu button` 같은 느슨한 선택자보다 별도 item 클래스를 주는 쪽이 기존 전역 버튼 스타일과 충돌이 적다.

## 상단 패널 재배치 기준

1차 기준:

- 상단 패널에 유지
  - `Undo`
  - `Redo`
  - `Save`
  - `Back`
  - 검색 관련 UI
- 우클릭 메뉴로 이동 후보
  - 좌측 패널 토글
  - runtime state 토글
  - pan / select 모드
  - canvas memo 추가

즉, 검색과 핵심 전역 액션은 상단에 남기고, 작업 보조 성격의 토글류를 우클릭 메뉴로 이동하는 방향이다.

## 확인 포인트

- 빈 캔버스 우클릭 시 브라우저 기본 메뉴 대신 `layer` 메뉴가 뜨는가
- node 우클릭 시 node 선택 후 `Delete Node` 메뉴가 뜨는가
- edge 우클릭 시 edge 선택 후 `Delete Edge` 메뉴가 뜨는가
- 메뉴 아이템 클릭 후 메뉴가 닫히는가
- `onPaneClick` 시 메뉴가 닫히는가
- 메뉴가 마우스 우클릭 위치와 어긋나지 않는가
- `setEdges` 호출 시 타입 오류 없이 `Edge[]` 로 처리되는가

## 관련 문서

- `2026-03-12 canvas panel / runtime state` -> [../20260312/builder-canvas-panel-runtime-state.md](../20260312/builder-canvas-panel-runtime-state.md)
- `2026-03-16 memo pad / canvas memo` -> [../20260316/builder-memo-pad-and-canvas-memo.md](../20260316/builder-memo-pad-and-canvas-memo.md)
- 페이지 문서 -> [../../pages/sidebar-header/admin/builder.md](../../pages/sidebar-header/admin/builder.md)
