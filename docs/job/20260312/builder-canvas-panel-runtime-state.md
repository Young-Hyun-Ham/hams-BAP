# `[2026-03-12][HAMS-BAP] builder canvas panel / runtime state 정리`

## 개요

`/admin/builder` 의 캔버스 상단 `ReactFlow Panel` 에 툴 버튼을 확장하고, `SlotDisplay` 를 별도 Runtime State 패널로 토글 표시하는 작업을 정리한 문서다.

이번 작업 범위는 다음 두 축이다.

- 캔버스 상단 패널 UI 확장
- `SlotDisplay` 표시/숨김 및 위치 보정

## 작업 목표

- 캔버스 상단 패널에 버튼 추가
  - 좌측 패널 숨김/펼치기
  - Runtime State 패널 표시/숨김
  - pan/select 모드 전환
- pan/select 버튼의 현재 상태를 hover 와 유사한 active 스타일로 표시
- pan/select 모드에 따라 캔버스 커서를 다르게 표시
- 캔버스 상단 패널 자체를 접고 펼칠 수 있도록 구성
- `SlotDisplay` 가 상단 패널 또는 검색 결과와 겹치지 않도록 동적 위치 계산 적용

## 주요 수정 파일

- `app/(siderbar-header)/admin/builder/components/Detail.tsx`
- `app/(siderbar-header)/admin/builder/components/Detail.module.css`
- `app/(siderbar-header)/admin/builder/components/SlotDisplay.tsx`
- `app/(siderbar-header)/admin/builder/components/SlotDisplay.module.css`

## 구현 요약

### 1. ReactFlow Panel 툴 버튼 확장

상단 좌측 `Panel position="top-left"` 내부 `toolRow` 에 아래 버튼을 배치한다.

- `Undo`
- `Redo`
- 좌측 패널 토글
- Runtime State 패널 토글
- `Pan mode`
- `Select mode`
- `Group Selected Nodes`
- 캔버스 패널 접기/펼치기

버튼들은 공통으로 `toolButton` 스타일을 사용하고, 상태가 있는 버튼은 `toolButtonActive` 를 함께 적용한다.

### 2. pan/select 모드 시각 상태

모드 상태는 `toolMode` 로 관리한다.

- `pan`
- `select`

현재 선택된 모드 버튼은 hover 와 유사한 active 스타일을 유지한다. 따라서 사용자는 hover 가 아닌 평상시에도 현재 모드를 즉시 식별할 수 있다.

### 3. 캔버스 커서 변경

`ReactFlow` 루트에 모드별 클래스를 연결해 커서를 제어한다.

- pan 모드: `grab`, 드래그 중 `grabbing`
- select 모드: `default`

버튼 아이콘과 동일한 포인터 커서를 쓰고 싶다면 별도 SVG/PNG 기반 custom cursor 가 필요하지만, 이번 반영에서는 브라우저 기본 `default` 를 사용한다.

### 4. 캔버스 패널 접기/펼치기

상단 패널 우측에 토글 버튼을 두고 `isCanvasPanelCollapsed` 상태로 제어한다.

- 접힘 상태
  - 툴 버튼만 유지
  - 검색 입력과 검색 결과 목록 숨김
- 펼침 상태
  - 검색 타입 선택, 검색 입력, 결과 목록 표시

이 방식은 패널 전체를 없애지 않고, 작업 중 자주 쓰는 툴 버튼 접근성을 유지한다.

### 5. Runtime State 패널 토글

`SlotDisplay` 는 원래 캔버스 좌상단에 직접 배치되던 패널이다. 이번 변경에서는 상단 `ReactFlow Panel` 의 버튼으로 표시 여부를 제어한다.

- 상태: `isSlotDisplayVisible`
- 버튼 아이콘: `Database`
- 버튼 활성 시 `toolButtonActive` 적용

표시 여부는 `Detail.tsx` 에서 관리하고, `SlotDisplay` 컴포넌트 자체는 값 렌더링 역할만 유지한다.

## 겹침 이슈와 위치 보정

초기 방식은 `SlotDisplay.module.css` 에서 아래처럼 좌표를 고정하던 구조였다.

- `top: 15px`
- `left: 15px`

이 방식은 상단 `ReactFlow Panel` 의 높이가 고정이라는 가정이 필요하다. 하지만 검색 결과가 렌더링되면 `filteredSearchResults` 길이에 따라 패널 높이가 커지므로, `SlotDisplay` 와 겹치는 문제가 발생한다.

해결 방식은 다음과 같다.

- `Detail.tsx` 에서 상단 패널 DOM 높이를 `ref` 로 측정
- `canvasPanelHeight` 상태에 반영
- `SlotDisplay` 는 별도 wrapper(`slotDisplayAnchor`) 안에서 렌더링
- wrapper 의 `top` 값을 `canvasPanelHeight + 여백` 으로 계산
- `SlotDisplay.module.css` 는 고정 좌표 대신 상대 배치만 담당

이렇게 하면 검색 결과가 늘어나도 Runtime State 패널이 항상 상단 패널 아래에 붙는다.

## 확인 포인트

- 캔버스 패널 접힘 상태에서도 Runtime State 버튼은 계속 노출되는지
- Runtime State 패널 토글 시 버튼 active 상태가 바로 반영되는지
- 검색 결과가 없는 상태 / 많은 상태 모두에서 `SlotDisplay` 가 겹치지 않는지
- pan/select 전환 시 버튼 active 스타일과 캔버스 커서가 일치하는지

## 관련 문서

- `2026-03-11` -> [../20260311/builder-react-flow-ui.md](../20260311/builder-react-flow-ui.md)
- `2026-03-12 검색 UI` -> [./builder-node-search.md](./builder-node-search.md)
- `2026-03-12 undo/redo` -> [./builder-undo-redo-history.md](./builder-undo-redo-history.md)
- 페이지 문서 -> [../../pages/sidebar-header/admin/builder.md](../../pages/sidebar-header/admin/builder.md)
