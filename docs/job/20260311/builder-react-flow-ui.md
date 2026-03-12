# `[2026-03-11][HAMS-BAP] react flow UI 개선`

## 개요

`/admin/builder`의 React Flow 기반 builder UI를 개선한 작업이다. 주요 목표는 선택 노드 강조, 현재 시나리오 내부 그룹화, 그룹 노드 실행 연계, 엣지 드래그 편집, 레이아웃 안정화였다.

## 작업 범위

- detail 패널에서 선택된 노드에 그림자 강조 CSS 적용
- 현재 시나리오 내부 선택 노드를 별도 `selectionGroup` 노드로 그룹화
- 저장된 시나리오 import용 `scenario` 그룹과 현재 편집용 그룹 분리
- `selectionGroup` 전용 `GroupNode.jsx` 추가
- 그룹 노드 기능 보강
  - 제목 표시
  - Start Node 지정
  - Collapse/Expand
  - Delete
  - Ungroup
  - Resize
- 그룹화 방어 로직 추가
  - 그룹 내부 시작 노드가 2개 이상이면 그룹화 차단
- 그룹화 시 외부 edge를 그룹 노드로 재배선
- 그룹 해제 시 자식 노드 및 edge 복원
- builder 시뮬레이터에서 `selectionGroup` 실행 지원
- `(content-header)/chatbot` 시나리오 에뮬레이터에서 `selectionGroup` 실행 지원
- React Flow 엣지를 기본 직각선 기반으로 드래그 편집 가능하게 변경 ( custom edge option )
  - 가로 선분은 `y`축 이동
  - 세로 선분은 `x`축 이동
  - 대각선이 생기지 않도록 직각 polyline 정규화
  - 반복 이동 시 중복 꼭지점 제거
- builder 레이아웃 스크롤 보정
  - 전체 화면 스크롤 억제
  - `Add Node` 패널만 세로 스크롤 허용
- 줌 설정 가이드 정리

## 핵심 파일

- `app/(siderbar-header)/admin/builder/components/Detail.tsx`
- `app/(siderbar-header)/admin/builder/components/Detail.module.css`
- `app/(siderbar-header)/admin/builder/components/nodes/GroupNode.jsx`
- `app/(siderbar-header)/admin/builder/components/nodes/ScenarioNode.jsx`
- `app/(siderbar-header)/admin/builder/components/nodes/NodeWrapper.jsx`
- `app/(siderbar-header)/admin/builder/components/nodes/ChatNodes.module.css`
- `app/(siderbar-header)/admin/builder/components/edges/CustomDraggableEdge.jsx`
- `app/(siderbar-header)/admin/builder/components/edges/CustomDraggableStepEdge.jsx`
- `app/(siderbar-header)/admin/builder/components/edges/CustomOrthogonalEdge.jsx`
- `app/(siderbar-header)/admin/builder/store/index.ts`
- `app/(siderbar-header)/admin/builder/components/controllers/hooks/useChatFlow.js`
- `app/(siderbar-header)/admin/builder/utils/nodeExecutors.js`
- `app/(content-header)/chatbot/components/emulator/core/graph.ts`
- `app/(content-header)/chatbot/components/emulator/hooks/useScenarioAutoRunner.ts`
- `app/(content-header)/chatbot/components/emulator/handlers/createUiHandlers.ts`
- `app/(content-header)/chatbot/types/index.ts`
- `components/ResizableSidebarLayout.tsx`

## 구현 메모

- `selectionGroup` 타입명은 React Flow 기본 `group` 타입과 충돌을 피하기 위해 별도로 사용했다.
- 그룹 실행은 "그룹 진입 시 내부 entry node 탐색"과 "그룹 내부 종료 시 parent group outgoing edge로 복귀" 규칙으로 맞췄다.
- edge drag 기능은 `edge.data`에 함수 참조를 저장하지 않고 store를 직접 읽는 구조가 더 안전하다.
- 저장/로드 시 dangling edge 정리 로직이 필요하다.
- `Delete` 키와 노드 내 `X` 버튼이 같은 결과를 내도록 그룹 자식 노드/edge 정리 로직을 통일해야 한다.

## 후속 확인 포인트

- builder와 `(content-header)/chatbot` 양쪽에서 `selectionGroup` 진입/복귀 경로가 동일하게 동작하는지 확인
- branch edge label 갱신 시 edge 타입이 `smoothstep`으로 되돌아가지 않는지 확인
- 그룹 collapse/expand 후 resize 상태가 의도대로 유지되는지 확인
- 직각 edge 저장 후 재진입 시 points 데이터가 정상 복원되는지 확인
