# `[2026-03-16][HAMS-BAP] builder selected node + edge drag sync 정리`

## 개요

`/admin/builder` 캔버스에서 노드와 edge를 함께 선택한 뒤 이동하면, edge의 시작점과 끝점은 React Flow가 따라오지만 커스텀 edge가 저장하는 중간 좌표(`data.points`, `controlX`, `controlY`)는 같이 이동하지 않는 문제가 있다.

이번 문서는 소스 수정 전 기준으로 원인과 수정 방향을 정리한 작업 메모다.

## 문제 현상

- 여러 노드와 edge를 함께 선택한다.
- 선택된 노드를 드래그해 이동한다.
- edge의 source/target 앵커는 새 위치로 이동한다.
- 하지만 커스텀 edge의 꺾임 좌표 또는 제어점은 이전 절대 좌표를 유지한다.
- 결과적으로 edge 경로가 어색하게 꺾이거나, 선택 이동과 함께 자연스럽게 따라오지 않는다.

## 원인 정리

현재 builder store의 `onNodesChange`는 `applyNodeChanges(...)`로 노드 상태만 갱신한다.

- 파일: `app/(siderbar-header)/admin/builder/store/index.ts`
- 위치: `onNodesChange`

반면 커스텀 edge는 별도 좌표를 `edge.data`에 저장한다.

- `CustomOrthogonalEdge.jsx`
  - `data.points`를 bend point로 사용
- `CustomDraggableStepEdge.jsx`
  - `data.points`를 polyline 중간 점으로 사용
- `CustomDraggableEdge.jsx`
  - `data.controlX`, `data.controlY`를 제어점으로 사용

즉, 노드 좌표와 edge 내부 좌표 저장 방식이 분리되어 있어서, 노드 이동 시 edge 내부 좌표를 평행 이동해 주는 보정이 필요하다.

## 관련 파일

- `app/(siderbar-header)/admin/builder/store/index.ts`
- `app/(siderbar-header)/admin/builder/store/edgeControlActionStore.ts`
- `app/(siderbar-header)/admin/builder/components/edges/CustomOrthogonalEdge.jsx`
- `app/(siderbar-header)/admin/builder/components/edges/CustomDraggableStepEdge.jsx`
- `app/(siderbar-header)/admin/builder/components/edges/CustomDraggableEdge.jsx`
- `docs/pages/sidebar-header/admin/builder.md`

## 수정 방향

핵심 수정 지점은 `store/index.ts`의 `onNodesChange`다.

처리 방향:

1. `changes`에서 실제 드래그 중인 `position` 변경만 추린다.
2. 각 이동 노드별 `dx`, `dy`를 계산한다.
3. source와 target이 같은 delta로 이동한 edge는 해당 delta만큼 `data.points`를 같이 평행 이동한다.
4. edge 자체가 선택된 상태인 경우에도 같은 delta를 적용할 수 있게 한다.
5. `controlX`, `controlY`를 사용하는 edge 타입도 함께 보정한다.

## 구현 시 주의점

- `sameDelta`를 boolean으로 두면 안 된다.
  - 아래처럼 조건을 만족할 때 delta 객체를 직접 넣어야 한다.

```ts
const sameDelta: any =
  sourceDelta &&
  targetDelta &&
  sourceDelta.dx === targetDelta.dx &&
  sourceDelta.dy === targetDelta.dy
    ? sourceDelta
    : null;
```

- 한쪽 노드만 이동한 edge에 대해 `data.points` 전체를 통째로 옮기면 경로가 더 부자연스러워질 수 있다.
- 따라서 source/target이 같은 delta로 이동한 경우를 우선 처리하는 편이 안전하다.
- 현재 코드베이스는 `Node<any>`, `Edge<any>` 패턴을 많이 사용하므로, 필요한 범위에서는 `change: any`, `edge: any`, `point: any`로 처리해 타입 오류를 줄일 수 있다.

## 적용 대상 데이터

- `edge.data.points`
- `edge.data.controlX`
- `edge.data.controlY`

## 기대 결과

- 선택된 노드 묶음을 드래그하면 연결된 커스텀 edge 경로도 함께 자연스럽게 이동한다.
- orthogonal edge의 bend point가 노드 이동 이후에도 기존 형태를 유지한 채 같이 따라온다.
- draggable edge의 control point도 같은 delta만큼 보정된다.

## 확인 항목

- 노드 여러 개를 선택 후 이동할 때 edge 꺾임 좌표가 같이 움직이는지
- 선택된 edge가 포함된 상태에서 이동해도 경로가 깨지지 않는지
- orthogonal edge와 draggableStep edge 모두 동일하게 동작하는지
- 단일 노드만 이동할 때 기존 edge 라우팅이 과도하게 틀어지지 않는지
- 저장 후 다시 불러와도 edge 좌표가 의도한 위치로 유지되는지

## 관련 문서

- `2026-03-11` -> [../20260311/builder-react-flow-ui.md](../20260311/builder-react-flow-ui.md)
- `2026-03-12 검색 UI` -> [../20260312/builder-node-search.md](../20260312/builder-node-search.md)
- `2026-03-12 undo/redo` -> [../20260312/builder-undo-redo-history.md](../20260312/builder-undo-redo-history.md)
- `2026-03-12 canvas panel / runtime state` -> [../20260312/builder-canvas-panel-runtime-state.md](../20260312/builder-canvas-panel-runtime-state.md)
- `2026-03-16 memo pad / canvas memo` -> [./builder-memo-pad-and-canvas-memo.md](./builder-memo-pad-and-canvas-memo.md)
- `2026-03-16 canvas execution / node status` -> [./builder-canvas-execution-and-node-status.md](./builder-canvas-execution-and-node-status.md)
- 페이지 문서 -> [../../pages/sidebar-header/admin/builder.md](../../pages/sidebar-header/admin/builder.md)
