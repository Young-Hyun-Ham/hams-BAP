# `/chatSample`

- 파일: `app/(content-header)/chatSample/page.tsx`
- 목적: MCP 도구 탐색과 스트리밍 응답을 시험하는 샘플 채팅 화면
- 주요 동작:
  - 질문 입력 후 도구 탐색 API 호출
  - 추천 도구 및 수동 도구 선택기 표시
  - 스트리밍 응답 텍스트 표시
- 연관 API: `/api/chat/agent/discover`
- 연관 구성: `McpToolPicker`, `lib/axios`
- 구현 메모: 데모용 사용자 ID가 하드코딩되어 있어 운영용 화면으로 보기 어렵다

# `/chatSample` 패키지 구조

```bash
app/(content-header)/chatSample/
└── page.tsx # MCP 도구 탐색 샘플 채팅 페이지
```
