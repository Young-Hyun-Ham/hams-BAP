# `/admin`

- 파일: `app/(siderbar-header)/admin/page.tsx`
- 목적: 관리자 메인 대시보드
- 주요 동작:
  - 사용자 프로필, 인증 상태, 토큰 정보 요약 표시
  - 백엔드 종류와 provider 정보 표시
  - 사용자 객체 raw JSON 확인 지원
- 상태 관리: 전역 `useStore`
- 구현 메모: 토큰 사용량은 아직 실제 수치 연동보다 자리 UI 성격이 강함

# `/admin` 패키지 구조

```bash
app/(siderbar-header)/admin/
└── page.tsx # 관리자 메인 대시보드
```
