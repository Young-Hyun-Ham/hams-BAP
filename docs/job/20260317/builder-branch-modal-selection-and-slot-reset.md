# `[2026-03-17][HAMS-BAP] builder branch modal selection / slot reset 정리`

## 개요

`/admin/builder` 캔버스 플레이 기능에서 `branch` 노드의 `BUTTON` 타입 처리와 실행 시작 시 런타임 slot 초기화 정책을 정리한 문서다.

이번 정리의 핵심은 두 가지다.

- `branch(BUTTON)`는 첫 번째 reply를 자동 선택하지 않고, 플레이 중 모달에서 사용자가 직접 분기를 선택하도록 바꾼다.
- 플레이 버튼을 누를 때 이전 실행에서 남아 있던 `slots` 값을 초기화한 뒤 새 실행을 시작한다.

## 배경

기존 캔버스 실행 훅 `useBuilderExecution.ts` 는 `branch(CONDITION)`와 `branch(BUTTON)`를 함께 처리한다.

- `CONDITION`
  - slot 값을 평가해서 일치하는 handle로 자동 이동
- `BUTTON`
  - `replies[0]` 를 자동 선택해서 첫 번째 흐름으로 이동

이 구조는 실제 사용자 시나리오 플레이와 다르게 동작한다. 버튼형 branch는 사용자의 선택이 의미를 가지므로, 자동 선택보다는 실행 중 선택 UI가 필요하다.

또한 실행 시작 시 `currentSlots` 를 기존 builder store의 `slots` 에서 복사해 오고 있어, 이전 실행에서 `setSlot`, `api`, `llm` 등이 남긴 값이 다음 실행에 그대로 섞이는 문제가 있었다.

## 주요 확인 위치

- `app/(siderbar-header)/admin/builder/components/controllers/hooks/useBuilderExecution.ts`
- `app/(siderbar-header)/admin/builder/store/useBuilderExecutionStore.ts`
- `app/(siderbar-header)/admin/builder/components/Detail.tsx`
- `docs/pages/sidebar-header/admin/builder.md`

## 현재 문제점

### 1. branch(BUTTON) 자동 선택

`useBuilderExecution.ts` 의 `runNode()` 내부에서 `branch(BUTTON)` 처리 시 아래와 같은 흐름을 사용하고 있었다.

- `const replies = node.data?.replies ?? []`
- `const selectedReply = replies[0] ?? null`
- `findNextNode(node.id, selectedReply.value)` 로 다음 노드 결정

이 구조는 사용자가 분기 선택을 해야 하는 플레이 UX와 맞지 않는다.

### 2. 플레이 시작 시 slots 잔존

`runBetweenStartAndAnchor()` 시작 시 `currentSlots` 를 아래처럼 기존 store 값으로 초기화하고 있었다.

- `let currentSlots = { ...(slots ?? {}) }`

즉, 플레이 시작 전에 `setSlots({})` 를 하지 않으면 이전 실행 상태가 그대로 남는다.

## 변경 방향

### 1. branch(BUTTON) 모달 선택

버튼형 branch를 만나면 자동 선택하지 않고, 실행을 잠시 대기시킨 뒤 모달에서 reply 목록을 보여준다.

필요한 상태:

- `pendingBranchSelection`
- 현재 선택 대기 중인 branch node 참조
- 선택 결과를 Promise로 돌려줄 resolver 참조

권장 흐름:

1. `runNode(branch)` 진입
2. `evaluationType === "CONDITION"` 이면 기존 방식 유지
3. `evaluationType === "BUTTON"` 이면 reply 목록 검증
4. 실행 store에 branch 선택 대기 상태 저장
5. `requestBranchSelection()` Promise 대기
6. 사용자가 모달에서 reply 선택
7. 선택된 `reply.value` 로 `findNextNode()` 수행
8. `complete` 로그 기록 후 다음 노드 진행

### 2. 슬롯 초기화

플레이 시작 시점에는 실행 로그 store만 리셋하는 것이 아니라 실제 런타임 slot 데이터도 함께 초기화해야 한다.

권장 처리:

1. `resetExecution()`
2. `setSlots({})`
3. `startExecution(...)`
4. `let currentSlots = {}`

이렇게 해야 실행 중 `setSlot`, `api`, `llm` 결과가 이번 실행 범위 안에서만 유지된다.

## 세부 설계 메모

### useBuilderExecutionStore

branch 선택 모달을 위해 아래 상태를 추가하는 방향이 적합하다.

- `pendingBranchSelection`
  - `nodeId`
  - `nodeType`
  - `title`
  - `replies`

관련 액션:

- `openBranchSelection`
- `closeBranchSelection`

주의:

- `resetExecution`
- `finishExecution`
- `failExecution`
- `cancelExecution`

에서 모두 `pendingBranchSelection` 을 함께 비워야 한다.

### useBuilderExecution

훅 내부에는 `useRef` 기반으로 아래 두 값을 둔다.

- `pendingBranchNodeRef`
- `branchSelectionResolverRef`

역할:

- `pendingBranchNodeRef`
  - 현재 선택 대기 중인 branch 노드를 보관
- `branchSelectionResolverRef`
  - 사용자가 reply를 선택했을 때 `Promise` 를 종료하기 위한 resolver 보관

관련 함수:

- `requestBranchSelection(node, replies)`
- `selectBranchReply(replyValue)`
- `cancelBranchReplySelection()`

### Detail.tsx

캔버스 플레이 UI가 있는 `Detail.tsx` 에서 실행 store의 `pendingBranchSelection` 상태를 구독하고 전용 모달을 렌더링한다.

모달에서 해야 할 일:

- branch 질문 또는 title 표시
- reply 목록 버튼 렌더링
- 버튼 클릭 시 `selectBranchReply(reply.value)` 호출
- 취소 시 `cancelBranchReplySelection()` 또는 전체 실행 취소 처리

`ModalProvider` 의 `showConfirm()` 는 boolean 반환만 지원하므로 다중 분기 선택에는 적합하지 않다. 따라서 `Detail.tsx` 에 직접 JSX 모달을 두는 편이 단순하다.

## 확인 포인트

- 플레이 버튼을 누를 때 이전 실행의 `slots` 값이 비워지는지
- `setSlot` 노드 실행 후 생성된 slot 값이 이번 실행에서만 유지되는지
- `branch(CONDITION)` 는 기존처럼 자동 평가되는지
- `branch(BUTTON)` 에서 첫 번째 reply 자동 선택이 제거되었는지
- `branch(BUTTON)` 에서 모달 선택 후 올바른 handle 방향으로 진행되는지
- branch 선택 모달이 실행 종료/취소 후 남아 있지 않은지

## 관련 문서

- `2026-03-16` -> [../20260316/builder-canvas-execution-and-node-status.md](../20260316/builder-canvas-execution-and-node-status.md)
- 페이지 문서 -> [../../pages/sidebar-header/admin/builder.md](../../pages/sidebar-header/admin/builder.md)
