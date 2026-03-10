# `/admin/form-builder`

- 파일: `app/(siderbar-header)/admin/form-builder/page.tsx`
- 목적: 관리자 레이아웃 안에서 Form Builder 샌드박스를 노출하는 화면
- 주요 동작:
  - `FormBuilderSandbox` 렌더링
  - 관리자 화면 스타일에 맞춘 래퍼 제공
- 연관 구성: `components/FormBuilderSandbox.tsx`
- 구현 메모: `/form-builder`와 성격이 유사하지만 관리자 영역에서 접근하기 위한 별도 진입점

# `/admin/form-builder` 패키지 구조

```bash
app/(siderbar-header)/admin/form-builder/
└── page.tsx # 관리자용 Form Builder 진입 페이지
```
