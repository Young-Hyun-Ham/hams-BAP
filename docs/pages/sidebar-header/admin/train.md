# `/admin/train`

- 파일: `app/(siderbar-header)/admin/train/page.tsx`
- 목적: 지식 학습 작업을 실행하고 이력을 모니터링하는 화면
- 주요 동작:
  - 프로젝트 목록 조회
  - 선택 프로젝트 기준 학습 작업 목록 조회
  - 작업 실행 패널과 실시간 로그 패널 표시
- 상태 관리: `useStudyStore`
- 연관 구성: `ProjectSelector.tsx`, `StudyActionPanel.tsx`, `StudyJobTable.tsx`, `RealtimeLogPanel.tsx`
- 구현 메모: 학습 파이프라인 운영 화면

# `/admin/train` 패키지 구조

```bash
app/(siderbar-header)/admin/train/
├── components/
│   ├── ProjectSelector.tsx       # 프로젝트 선택 패널
│   ├── RealtimeLogPanel.tsx      # 실시간 로그 패널
│   ├── StudyActionPanel.tsx      # 학습 실행 액션 패널
│   ├── StudyJobTable.tsx         # 학습 작업 목록 테이블
│   └── modal/
│       └── ConfirmTrainModal.tsx # 학습 실행 확인 모달
├── store/
│   └── index.ts                  # 학습 관리 Store
├── types/
│   └── index.ts                  # 학습 관련 타입 정의
└── page.tsx                      # 학습 메인 페이지
```
