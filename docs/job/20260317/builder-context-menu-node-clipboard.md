# `[2026-03-17][HAMS-BAP] builder context menu node clipboard 정리`

## 개요

`/admin/builder` 에서 현재 선택한 node 를 기준으로 `copy / cut / paste` 를 우클릭 메뉴에 추가하는 작업 내용을 정리한다.

이번 정리 범위는 아래와 같다.

- 기존 `Export Nodes` / `Import Nodes` 는 그대로 유지
- 우클릭 메뉴 전용 clipboard store 추가
- `node` 우클릭 메뉴에 `Copy Node`, `Cut Node`, `Paste` 추가
- `pane` 우클릭 메뉴에 `Paste` 추가
- 다중 선택 상태와 group node 를 고려한 bulk delete 경로 추가

## 배경

builder 에는 이미 clipboard 기반 기능이 일부 존재한다.

- `exportSelectedNodes(selectedNodes)`
- `importNodes()`

하지만 이 흐름은 좌측 패널 버튼 기준이며, 사용자가 원하는 상호작용은 “현재 선택한 node 를 우클릭해서 복사/잘라내기/붙여넣기” 이다.

따라서 기존 import/export 와는 별개로, builder 내부 상태만 사용하는 경량 clipboard store 를 두는 방향으로 정리했다.

## 주요 변경 포인트

- `app/(siderbar-header)/admin/builder/store/useBuilderClipboardStore.ts`
- `app/(siderbar-header)/admin/builder/store/index.ts`
- `app/(siderbar-header)/admin/builder/components/Detail.tsx`
- `app/(siderbar-header)/admin/builder/components/Detail.module.css`

## 상태 구조

### clipboard store

builder 내부 clipboard 는 브라우저 시스템 clipboard 가 아니라 zustand store 로 관리한다.

```ts
type ClipboardPayload = {
  nodes: Node<any>[];
  edges: Edge<any>[];
  copiedAt: string;
};
```

store action 방향:

- `copySelection(...)`
- `cutSelection(...)`
- `pasteClipboard(...)`
- `clearClipboard()`

## 동작 방향

### 1. copy

- 현재 우클릭한 node 가 이미 selection 안에 있으면 전체 선택 집합을 복사
- 그렇지 않으면 우클릭한 단일 node 만 복사
- 선택된 node 사이에만 연결된 edge 를 clipboard 에 포함

### 2. cut

- `copySelection(...)` 먼저 실행
- 이후 선택 node 를 한 번에 제거
- 단건 `deleteNode(nodeId)` 반복 호출 대신 bulk delete 액션 사용

이유:

- history snapshot 이 1회만 쌓여야 함
- `scenario` / `selectionGroup` 의 자식까지 일괄 제거해야 함
- 관련 edge 도 한 번에 제거해야 함

### 3. paste

- clipboard 내부 node / edge 를 deep copy
- 새 node id 생성
- edge 의 `source`, `target`, `id` 재매핑
- group 내부 node 의 `parentNode` 도 새 id 기준으로 재매핑
- pane 우클릭 시 클릭한 flow 좌표 기준으로 배치
- node 우클릭 시 해당 위치 근처에 배치

## builder store 추가 사항

기존 `deleteNode(nodeId)` 만으로는 cut 을 안정적으로 처리하기 어렵기 때문에 bulk delete 액션을 추가한다.

```ts
deleteNodesByIds: (nodeIds: string[]) => void;
```

핵심 처리:

- history snapshot 적재
- 삭제 대상 id 집합 구성
- `scenario`, `selectionGroup` 이면 자식 node 포함
- 관련 edge 제거
- `selectedNodeId`, `startNodeId` 정리

## history 처리 메모

paste 전에 snapshot 이 필요하다.

`makeSnapshot` 은 `store/index.ts` 에 이미 정의되어 있으므로, `Detail.tsx` 에서는 아래 조합으로 사용할 수 있다.

```ts
import useBuilderStore, { ALL_NODE_TYPES, makeSnapshot } from "../store/index";
import useBuilderHistoryStore from "../store/historyStore";
```

그리고 helper 는 아래처럼 만든다.

```ts
const pushHistory = useCallback(() => {
  useBuilderHistoryStore.getState().push(makeSnapshot(useBuilderStore.getState()));
}, []);
```

## 타입 메모

clipboard paste 구현 중 `setNodes([...nodes, ...normalizedNodes])` 타입 오류가 있었다.

원인은 paste 과정에서 `parentNode` 를 `null` 로 넣으면서 `Node<any>` 타입이 깨진 것이었다.

정리:

- `parentNode` 는 `null` 대신 `undefined` 사용
- `pastedNodes`, `normalizedNodes` 를 `Node<any>[]` 로 명시

예시:

```ts
parentNode: undefined
```

## 우클릭 메뉴 UX 메모

node 메뉴:

- `Copy Node`
- `Cut Node`
- `Paste`
- `Delete Node`

pane 메뉴:

- `Paste`

clipboard 가 비어 있으면 `Paste` 버튼은 `disabled` 상태로 두고, 글자색을 회색으로 처리한다.

## 확인 포인트

- 단일 node 우클릭 copy / cut / paste 동작
- 다중 선택 후 선택 집합 내부 node 우클릭 시 전체 selection 기준 동작
- 선택 외부 node 우클릭 시 단일 node 기준 동작
- group node cut 시 자식 node 와 edge 가 함께 제거되는지
- paste 후 `parentNode` 재연결이 정상인지
- disabled 된 `Paste` 메뉴가 hover 색 없이 회색 텍스트로 보이는지

## 관련 문서

- `2026-03-17 context menu / layer menu` -> [./builder-context-menu-layer-and-node-edge-delete.md](./builder-context-menu-layer-and-node-edge-delete.md)
- 페이지 문서 -> [../../pages/sidebar-header/admin/builder.md](../../pages/sidebar-header/admin/builder.md)
