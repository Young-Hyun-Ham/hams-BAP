# `[2026-03-12][HAMS-BAP] builder node search UI 정리`

## 개요

`/admin/builder` 캔버스에서 노드를 빠르게 찾기 위한 검색 UI 작업을 정리한 문서다.
목표는 노드 타입 선택 `select`와 검색어 `input`을 조합해 원하는 노드를 찾고, 검색 결과를 클릭하면 해당 노드가 선택되며 캔버스가 그 위치로 이동하도록 만드는 것이다.

## 작업 목표

- 캔버스 상단 좌측 패널에 검색 UI 추가
- 첫 줄에 툴 버튼과 검색창을 함께 배치
- 둘째 줄에 검색 결과를 `div` 목록으로 표시
- 노드 타입별 검색 대상 문자열 정의
- 검색 결과 클릭 시 노드 선택 및 뷰포트 이동 처리

## 주요 검토 파일

- `app/(siderbar-header)/admin/builder/components/Detail.tsx`
- `app/(siderbar-header)/admin/builder/components/Detail.module.css`
- `app/(siderbar-header)/admin/builder/store/index.ts`
- `app/(siderbar-header)/admin/builder/utils/nodeFactory.js`

## 구현 포인트

### 1. 검색 UI 배치

- 위치: `ReactFlow <Panel position="top-left">`
- 구성
  - 첫 줄: pan/select/group 툴 버튼 + 검색 타입 선택 + 검색어 입력
  - 둘째 줄: 검색 결과 카드 목록

### 2. 검색 대상

- `message`: `data.content`
- `form`: `data.title`
- `slotfilling`: `data.content`, `data.slot`
- `api`: `data.url`, `data.apis[].name`
- `branch`: `data.replies[].display`
- `link`: `data.display`, `data.content`
- `llm`: `data.prompt`
- `toast`: `data.message`
- `iframe`: `data.url`
- `scenario`: `data.label`
- `selectionGroup`: `data.label`, `data.title`
- `setSlot`: `data.assignments[].key`, `data.assignments[].value`
- `delay`: `data.duration`

### 3. 노드 포커스 처리

- 검색 결과 클릭 시 `selectedNodeId` 갱신
- `setNodes`로 대상 노드만 선택 상태 반영
- `useReactFlow().setCenter(...)` 로 대상 노드 위치로 이동
- 그룹 내부 노드 검색을 고려해 절대 좌표 계산 필요

## 확인된 이슈

### 1. 검색 결과 상태 미반영

초기 적용 과정에서 검색 결과를 계산만 하고 렌더링 상태에 반영하지 않아 UI는 보이지만 결과 목록이 표시되지 않는 문제가 있었다.

- 원인
  - 검색 결과 계산 함수가 배열을 `return`만 하고 `searchResults` 상태를 갱신하지 않음
  - 또는 `useMemo` 기반 값과 `useCallback` 기반 함수를 혼용해 사용 방식이 섞임

### 2. `filteredSearchResults` 사용 방식 혼선

`filteredSearchResults`는 아래 둘 중 하나로만 사용해야 한다.

- `useMemo` 값으로 사용
  - 입력 상태가 바뀔 때마다 자동 계산
  - 렌더링에서 `filteredSearchResults.length`, `filteredSearchResults.map(...)` 형태로 사용
- `handleSearch` 함수로 사용
  - 버튼 클릭 또는 엔터 시 결과 상태를 `setSearchResults(...)`로 저장

두 방식을 혼합하면 결과가 렌더링되지 않는다.

### 3. 그룹 내부 노드 포커스 좌표

그룹 내부 노드는 `node.position`만으로는 정확한 캔버스 좌표가 나오지 않는다.
부모 그룹의 `position`을 누적한 절대 좌표로 변환해야 검색 결과 클릭 시 올바른 위치로 이동한다.

## 권장 정리 방향

- 검색 결과는 `useMemo` 기반 `filteredSearchResults`로 고정
- 검색 버튼은 제거하거나 장식용으로만 유지
- 검색 결과는 `button` 대신 `div` 카드 목록으로 표시
- `Panel` 내부는 다음 구조로 통일
  - 첫 줄: 툴 버튼 + 검색창
  - 둘째 줄: 검색 결과 목록

## 관련 문서

- `2026-03-11` -> [../20260311/builder-react-flow-ui.md](../20260311/builder-react-flow-ui.md)
- 페이지 문서 -> [../../pages/sidebar-header/admin/builder.md](../../pages/sidebar-header/admin/builder.md)
