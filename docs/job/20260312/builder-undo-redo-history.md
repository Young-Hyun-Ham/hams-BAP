# `[2026-03-12][HAMS-BAP] builder undo/redo history 정리`

## 개요

`/admin/builder` React Flow 캔버스에 `undo/redo` 기능을 추가한 작업을 정리한 문서다.
이번 작업의 핵심은 상단 `Panel`에 되돌리기/다시실행 버튼을 배치하고, 그래프 이력 관리를 기존 `store/index.ts`에서 분리해 별도 history store로 관리하도록 구조를 정리하는 것이다.

## 작업 목표

- `ReactFlow Panel` 상단 툴바에 `undo/redo` 버튼 추가
- `Ctrl/Cmd + Z`, `Ctrl + Y`, `Cmd + Shift + Z` 단축키 지원
- 그래프 이력을 별도 store 파일로 분리
- 노드 추가, 삭제, 이동, 엣지 연결, 그룹화, 컨트롤러 저장 등 그래프 변경을 undo/redo 대상으로 포함
- React Flow 내부 선택/치수 보정 같은 UI성 변경은 history stack에서 제외

## 주요 파일

- `app/(siderbar-header)/admin/builder/components/Detail.tsx`
- `app/(siderbar-header)/admin/builder/store/index.ts`
- `app/(siderbar-header)/admin/builder/store/historyStore.ts`

## 구현 요약

### 1. UI 배치

- 위치: `ReactFlow <Panel position="top-left">`
- 구성
  - `Undo`, `Redo` 버튼
  - pan/select/group 툴 버튼
  - 노드 검색 타입 선택, 검색어 입력

### 2. history store 분리

기존 builder store는 그래프, 색상, 가시성, 저장, import/export, 시뮬레이터 관련 상태까지 모두 포함하고 있어 책임이 과도했다.
이번 작업에서는 undo/redo 이력만 `store/historyStore.ts`로 분리했다.

- `past`: 이전 스냅샷 스택
- `future`: redo 스냅샷 스택
- `push(snapshot)`: 현재 상태를 undo stack에 적재
- `undoSnapshot(current)`: 현재 상태를 future로 보내고 이전 snapshot 반환
- `redoSnapshot(current)`: 현재 상태를 past로 보내고 다음 snapshot 반환
- `clear()`: 시나리오 재로딩 시 history 초기화

### 3. snapshot 기준

snapshot에는 아래 그래프 핵심 상태만 포함한다.

- `nodes`
- `edges`
- `selectedNodeId`
- `startNodeId`

색상 설정, 노드 표시 여부, 슬롯 값 같은 부가 상태는 undo/redo 대상에 포함하지 않는다.

### 4. history 기록 시점

다음 액션은 실행 직전에 snapshot을 적재한다.

- `addNode`
- `deleteNode`
- `duplicateNode`
- `updateNodeData`
- `onConnect`
- `groupSelectedNodes`
- `ungroupNode`
- `importNodes`
- `updateEdgePoints`
- `updateEdgeSegment`
- `onNodesChange`
- `onEdgesChange`

### 5. React Flow 내부 변경 제외

초기 구현에서는 `onNodesChange`, `onEdgesChange`가 모든 변경을 history에 적재해서 문제가 있었다.
특히 노드 생성 직후 React Flow가 발생시키는 `select`, `dimensions`, `reset` 성격의 내부 보정까지 이력에 들어가면서 첫 `undo`가 "노드 생성 취소"가 아니라 "생성 직후 내부 상태 취소"로 동작했다.

이 때문에 생성한 노드가 첫 `undo`에서 즉시 사라지지 않는 현상이 발생했다.

해결 방향은 다음과 같다.

- `onNodesChange`
  - history 기록 대상: `add`, `remove`, `position`
  - 제외 대상: `select`, `dimensions`, `reset`
- `onEdgesChange`
  - history 기록 대상: `add`, `remove`
  - 제외 대상: `select`, `reset`

즉, 실제 그래프 구조나 위치가 바뀌는 변경만 history에 넣고, React Flow 내부 UI 보정은 제외해야 한다.

## 적용 시 주의사항

### 1. `setNodes`, `setEdges`는 직접 history에 연결하지 않는다

`Detail.tsx`의 검색 결과 포커스처럼 선택 상태만 바꾸기 위해 `setNodes`를 호출하는 경로가 있다.
여기에 history를 직접 연결하면 undo/redo가 단순 선택 변경까지 되돌리는 부작용이 생긴다.

따라서 history는 공용 setter가 아니라 실제 그래프 변경 액션에서만 적재하는 방식이 적합하다.

### 2. 시나리오 로딩 시 history 초기화 필요

`fetchScenario`로 다른 시나리오를 불러오면 기존 undo stack은 무효가 된다.
새 시나리오 로드 직후 `historyStore.clear()`를 호출해 초기화해야 한다.

### 3. 컨트롤러 저장 단위

`NodeController.tsx`는 입력 중 즉시 저장하지 않고 `Save Changes` 버튼을 눌렀을 때 `updateNodeData()`를 호출한다.
따라서 undo 단위도 "타이핑 중"이 아니라 "저장 시점" 기준으로 동작한다.

## 권장 정리 방향

- builder 그래프 이력은 `historyStore.ts`가 전담
- `store/index.ts`는 어떤 액션을 history에 넣을지 결정
- `Detail.tsx`는 버튼/단축키 UI만 연결
- React Flow 내부 `change.type`은 라이브러리 버전에 맞는 union만 비교
  - 존재하지 않는 타입 비교는 TypeScript 오류를 유발할 수 있음

## 관련 문서

- `2026-03-11` -> [../20260311/builder-react-flow-ui.md](../20260311/builder-react-flow-ui.md)
- `2026-03-12 검색 UI` -> [./builder-node-search.md](./builder-node-search.md)
- 페이지 문서 -> [../../pages/sidebar-header/admin/builder.md](../../pages/sidebar-header/admin/builder.md)
