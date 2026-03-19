# `[2026-03-16][HAMS-BAP] builder canvas execution / node status 정리`

## 개요

`/admin/builder` 캔버스 상단에서 실행 버튼으로 시나리오를 시작하고, 실행 중인 노드와 완료된 노드를 캔버스 위에서 직접 확인할 수 있도록 정리한 작업 메모다.

이번 작업의 초점은 기존 builder graph store를 유지하면서, 실행 상태를 별도 store로 분리해 캔버스 UI와 로그 모달이 같은 런타임 상태를 공유하도록 만드는 것이다.

## 작업 목표

- 기존 `store/index.ts` 와 분리된 builder 실행 전용 store 설계
- `startNodeId` 부터 `anchorNodeId` 까지 실행하는 전용 hook 설계
- 캔버스 상단 툴바에 실행 버튼과 실행 로그 모달 연결
- 실행 중인 노드는 우측 상단 로딩 아이콘 표시
- 실행 완료한 노드는 우측 상단 녹색 체크 아이콘 누적 표시
- 각 step 진입 시 기본 1초 로딩 표시
- API 노드 실패 시 전체 종료 대신 `onError` 분기 처리

## 주요 대상 파일

- `app/(siderbar-header)/admin/builder/store/useBuilderExecutionStore.ts`
- `app/(siderbar-header)/admin/builder/components/controllers/hooks/useBuilderExecution.ts`
- `app/(siderbar-header)/admin/builder/components/nodes/NodeWrapper.jsx`
- `app/(siderbar-header)/admin/builder/components/nodes/ChatNodes.module.css`
- `app/(siderbar-header)/admin/builder/components/Detail.tsx`
- `docs/pages/sidebar-header/admin/builder.md`

## 설계 요약

### 1. 실행 상태 store 분리

기존 builder의 `store/index.ts` 는 그래프 편집 상태 전용으로 유지하고, 캔버스 실행 상태는 `useBuilderExecutionStore.ts` 로 분리한다.

주요 상태:

- `executionRunning`
- `executionCurrentNodeId`
- `executionCompletedNodeIds`
- `executionVisitedNodeIds`
- `executionLogs`
- `executionStartedAt`
- `executionEndedAt`
- `executionError`

주요 액션:

- `resetExecution`
- `startExecution`
- `setExecutionCurrentNode`
- `markExecutionCompleted`
- `appendExecutionLog`
- `finishExecution`
- `failExecution`
- `cancelExecution`

### 2. 실행 hook 분리

`useBuilderExecution.ts` 는 기존 builder store에서 아래 값만 읽는다.

- `startNodeId`
- `anchorNodeId`
- `slots`
- `setSlots`

실행 상태 갱신은 전부 `useBuilderExecutionStore.ts` 로 보낸다.

주요 책임:

- 시작/종료 노드 검증
- 다음 노드 탐색
- 노드 타입별 실행
- 실행 상태 갱신
- 콘솔 로그 및 모달 로그 누적

### 3. 노드 상태 오버레이

공통 노드 래퍼인 `NodeWrapper.jsx` 에서 실행 상태 store를 읽어 우측 상단 오버레이를 렌더한다.

- 현재 실행 중인 노드
  - 로딩 아이콘
- 이미 완료된 노드
  - 녹색 체크 아이콘

표시 기준:

- `executionRunning && executionCurrentNodeId === id`
- `executionCompletedNodeIds.includes(id)`

## 실행 흐름 정리

### 1. 기본 step 흐름

캔버스 실행 루프는 아래 순서로 진행한다.

1. 현재 노드를 `executionCurrentNodeId` 로 설정
2. `enter` 로그 기록
3. 기본 1초 로딩 대기
4. 노드 실행
5. 완료 시 `executionCompletedNodeIds` 에 누적
6. `complete` 로그 기록
7. 다음 노드로 이동

이 순서를 지켜야 이전 노드는 체크로 남고, 현재 노드만 로딩으로 보인다.

### 2. delay 노드 처리

일반 노드는 진입 시 기본 1초를 적용한다.

`delay` 노드는 자체 `duration` 이 있으므로 기본 1초와 중복할지 여부를 정책으로 정해야 한다. 이번 정리에서는 중복 딜레이를 피하기 위해 `delay` 노드는 기본 1초를 생략하는 방향으로 정리했다.

### 3. branch(button) 처리

버튼형 branch는 사용자 입력형 노드이므로 자동 실행 정책이 없으면 첫 노드에서 `wait/cancel` 로 끝난다.

따라서 builder 자동 실행에서는 아래 중 하나가 필요하다.

- 첫 번째 reply 자동 선택
- 지정된 기본 reply 자동 선택
- 입력 대기 후 실행 중단

이번 정리에서는 자동 실행이 필요한 경우 첫 번째 reply 자동 선택을 권장했다.

## API 실패 분기 정리

API 노드는 실패를 전체 실행 실패로 취급하면 안 된다. 실패도 정상적인 분기 결과로 처리해야 한다.

잘못된 흐름:

- API 실패
- `throw`
- 바깥 `failExecution`
- 전체 종료

의도한 흐름:

- API 실패
- `onError` edge 탐색
- 실패 브랜치 노드로 이동
- 해당 노드 로딩 및 체크 진행

즉 API 노드 실행 함수는 실패 시 `throw` 로 종료하지 말고, 아래와 같은 결과를 반환해야 한다.

- `nextNode: findNextNode(node.id, "onError")`
- `payload.status: "error"`

단, `onError` edge 자체가 없으면 그때는 전체 실패로 보는 것이 맞다.

## 로그 모달 정리

실행 로그는 두 군데에서 사용한다.

- 콘솔 출력
- 실행 로그 모달

로그 entry 기본 형식:

- `at`
- `phase`
- `nodeId`
- `nodeType`
- `message`
- `payload`

권장 phase:

- `start`
- `enter`
- `complete`
- `wait`
- `error`
- `finish`
- `cancel`

## 확인 포인트

- 실행 중 이전 노드는 체크가 누적되는지
- 현재 노드만 로딩으로 보이는지
- anchor 노드까지 도달하면 마지막 노드도 체크되는지
- API 실패 시 `onError` 브랜치 노드로 정상 이동하는지
- `onError` edge 가 없을 때만 전체 실패 처리되는지
- branch(button) 자동 선택 정책이 없으면 첫 노드에서 멈춘다는 점이 문서화되어 있는지

## 관련 문서

- `2026-03-11` -> [../20260311/builder-react-flow-ui.md](../20260311/builder-react-flow-ui.md)
- `2026-03-12 검색 UI` -> [../20260312/builder-node-search.md](../20260312/builder-node-search.md)
- `2026-03-12 undo/redo` -> [../20260312/builder-undo-redo-history.md](../20260312/builder-undo-redo-history.md)
- `2026-03-12 canvas panel / runtime state` -> [../20260312/builder-canvas-panel-runtime-state.md](../20260312/builder-canvas-panel-runtime-state.md)
- `2026-03-16 memo pad / canvas memo` -> [./builder-memo-pad-and-canvas-memo.md](./builder-memo-pad-and-canvas-memo.md)
- 페이지 문서 -> [../../pages/sidebar-header/admin/builder.md](../../pages/sidebar-header/admin/builder.md)
