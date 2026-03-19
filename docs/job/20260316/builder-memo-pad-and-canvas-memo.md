# `[2026-03-16][HAMS-BAP] builder memo pad / canvas memo 정리`

## 개요

`/admin/builder` 화면에 메모 기능을 2가지 형태로 확장한 작업을 정리한 문서다.

- 패널형 메모 패드 추가
- 캔버스 위에 직접 배치하는 메모 오버레이 추가
- 상단 `ReactFlow Panel` 툴바 버튼 구성 조정

이번 작업에서 메모 데이터는 기존 React Flow `nodes`와 섞지 않고, 별도 상태로 관리하는 방향을 사용했다.

## 작업 목표

- 빌더 화면 안에서 빠르게 임시 메모를 작성할 수 있는 패널형 메모 UI 추가
- 노드와 별개로 캔버스에 주석성 메모를 띄울 수 있는 캔버스 메모 추가
- 캔버스 메모를 `nodes`가 아닌 `memoNodes` 상태로 분리 관리
- 캔버스 메모에 이동, 접기/펴기, 배경색, 투명도, 크기 변경 기능 제공
- 상단 툴바에서 메모 관련 액션을 직접 실행할 수 있도록 버튼 확장

## 주요 수정 파일

- `app/(siderbar-header)/admin/builder/components/Detail.tsx`
- `app/(siderbar-header)/admin/builder/components/Detail.module.css`
- `app/(siderbar-header)/admin/builder/components/MemoPad.tsx`
- `app/(siderbar-header)/admin/builder/components/MemoPad.module.css`
- `app/(siderbar-header)/admin/builder/components/CanvasMemoLayer.tsx`
- `app/(siderbar-header)/admin/builder/components/CanvasMemoItem.tsx`
- `docs/pages/sidebar-header/admin/builder.md`

## 구현 요약

### 1. 패널형 메모 패드 추가

기존 빌더 화면에 별도 메모 패널을 띄우는 `MemoPad` 컴포넌트를 추가했다.

- 메모 목록 추가/삭제
- 메모 배경색 변경
- 메모 내용 편집
- 빌더 화면 우측 오버레이 패널 형태로 표시

초기 구현은 `contentEditable` 기반이어서 커서 이동과 한글 IME 조합 문제가 있었다. 이후 일반 `textarea` 기반 구조로 정리하는 방향을 검토했다.

### 2. 캔버스 메모 상태 분리

캔버스 메모는 React Flow `nodes`와 섞지 않고 `memoNodes` 상태로 분리했다.

- 노드 저장/선택/그룹 기능과 결합되지 않음
- 다이어그램 주석성 UI로 별도 관리
- `selectedMemoId`로 현재 선택 메모 관리
- 이동/리사이즈 중 상태는 `ref` 기반으로 관리

권장 상태 예시는 아래와 같다.

```ts
type MemoCanvasItem = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  backgroundColor: string;
  backgroundOpacity: number;
  textColor: string;
  isCollapsed: boolean;
  zIndex: number;
};
```

### 3. 캔버스 메모 레이어 구성

캔버스 메모는 `CanvasMemoLayer`와 `CanvasMemoItem`으로 분리했다.

- `CanvasMemoLayer`
  - 전체 메모 오버레이 레이어
  - React Flow viewport transform 적용
  - `memoNodes.map(...)`로 각 메모 렌더
- `CanvasMemoItem`
  - 메모 카드 단일 UI
  - 헤더 드래그
  - 본문 textarea
  - 접기/펴기
  - 삭제
  - 배경색 / 투명도
  - 우하단 resize handle

### 4. viewport 동기화

캔버스 메모는 화면 고정 패널이 아니라 실제 캔버스 오브젝트처럼 보여야 하므로, 현재 viewport와 함께 이동/확대/축소되어야 한다.

- `ReactFlow`의 `onMove`에서 현재 viewport 상태 갱신
- `CanvasMemoLayer`에서 `translate(x, y) scale(zoom)` 적용
- 새 메모 추가 시 `project(...)`를 사용해 현재 화면 중앙을 캔버스 좌표로 변환

### 5. 드래그와 리사이즈 처리

캔버스 메모 이동과 크기 변경은 전역 `pointermove` / `pointerup` 리스너를 사용한다.

- 드래그 시작: `dragStateRef`
- 리사이즈 시작: `resizeStateRef`
- 이동/리사이즈 delta 계산 시 `viewport.zoom` 보정 필요
- 메모 헤더만 drag handle로 사용
- resize handle은 우하단에 별도 노출

## 확인된 이슈와 정리

### 1. 패널형 메모의 `contentEditable` 이슈

초기 `MemoPad`는 `contentEditable + dangerouslySetInnerHTML + onInput setState` 구조였다.

- 입력 시 DOM 재주입으로 커서가 앞으로 튀는 문제
- 한글 IME 조합 입력이 깨지는 문제

이 구조는 일반 텍스트 입력용 메모에서는 유지 비용이 높아, `textarea` 중심 구조로 단순화하는 방향이 적절하다.

### 2. 캔버스 메모가 보이지 않던 이슈

캔버스 메모 추가 후 화면에 보이지 않던 원인은 2가지였다.

- `viewport` 상태가 실제 `ReactFlow` 이동과 동기화되지 않음
- `CanvasMemoLayer`가 `ReactFlow` 뒤가 아니라 앞에 렌더되어 시각적으로 가려짐

정리 방향:

- `ReactFlow onMove`로 viewport 상태 갱신
- `CanvasMemoLayer`는 `ReactFlow` 이후 DOM에 두거나 `z-index`를 명시

### 3. 리사이즈가 동작하지 않던 이슈

`Detail.tsx`의 `pointermove` 처리에서 `dragStateRef.current`가 없으면 바로 `return`하던 구조 때문에, resize-only 상황에서 리사이즈 로직이 실행되지 않았다.

정리 방향:

- drag 처리와 resize 처리를 독립 분기 처리
- `if (!drag) return` 형태의 조기 종료 제거

## 툴바 반영 내용

상단 `ReactFlow Panel` 툴바에도 메모 관련 버튼이 추가되거나 재배치되었다.

- 저장 버튼
- 뒤로 가기 버튼
- 패널/런타임 상태 토글 버튼
- pan/select 버튼
- 메모 관련 버튼
- 시뮬레이터 / 로그 버튼

메모 버튼은 패널형 메모 토글과 캔버스 메모 추가 중 어느 역할로 둘지 명확히 분리하는 것이 좋다.

## 후속 권장 사항

- 패널형 메모는 `textarea` 기반으로 안정화
- 캔버스 메모 저장/복원 시 `scenario` payload에 `memoNodes` 포함
- undo/redo에 캔버스 메모를 포함할지 범위를 명확히 결정
- 캔버스 메모 선택 시 z-index를 자동으로 올리는 처리 검토
- 캔버스 메모 리사이즈 최소/최대 크기 정책 정리

## 관련 문서

- `2026-03-11` -> [../20260311/builder-react-flow-ui.md](../20260311/builder-react-flow-ui.md)
- `2026-03-12 검색 UI` -> [../20260312/builder-node-search.md](../20260312/builder-node-search.md)
- `2026-03-12 undo/redo` -> [../20260312/builder-undo-redo-history.md](../20260312/builder-undo-redo-history.md)
- `2026-03-12 canvas panel / runtime state` -> [../20260312/builder-canvas-panel-runtime-state.md](../20260312/builder-canvas-panel-runtime-state.md)
- 페이지 문서 -> [../../pages/sidebar-header/admin/builder.md](../../pages/sidebar-header/admin/builder.md)
