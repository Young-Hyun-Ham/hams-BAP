# `/form-builder`

- 파일: `app/(content)/form-builder/page.tsx`
- 목적: Form.io 기반 폼 스키마를 작성하고 즉시 미리보기하는 샌드박스 화면
- 주요 동작:
  - `FormBuilderCanvas`에서 스키마 편집
  - 최신 스키마를 `ref`에 보관
  - `Preview` 버튼으로 미리보기 갱신
- 연관 구성: `FormBuilderCanvas.tsx`, `SectionArea.tsx`, `@formio/react`
- 구현 메모: 실험용 성격이 강하며 저장/배포 플로우는 아직 없음

# `/form-builder` 패키지 구조

```bash
app/(content)/form-builder/
├── form-builder.css      # Form Builder 전용 스타일
├── FormBuilderCanvas.tsx # 스키마 편집 캔버스
└── page.tsx              # Form Builder 메인 페이지
```
