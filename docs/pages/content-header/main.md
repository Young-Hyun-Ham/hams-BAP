# `/main`

- 파일: `app/(content-header)/main/page.tsx`
- 목적: 로그인 후 진입하는 메인 대시보드
- 주요 동작:
  - 사용자 프로필 정보 표시
  - 키워드 검색 입력 제공
  - `builder`, `chatbot`, `chat`, `admin`으로 빠른 이동 제공
  - 추천 빌더와 최근 채팅 요약 카드 노출
- 상태 관리: 전역 `useStore`에서 사용자 정보 사용
- 구현 메모: 검색과 최근 활동 데이터는 아직 실제 연동보다 안내용 UI 비중이 큼

# `/main` 패키지 구조

```bash
app/(content-header)/main/
└── page.tsx # 메인 대시보드 페이지
```
