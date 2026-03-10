# `/chat`

- 파일: `app/(content-header)/chat/page.tsx`
- 목적: 시스템 프롬프트, MCP 설정, 대화 이력을 함께 다루는 고급 채팅 화면
- 주요 동작:
  - 시스템 프롬프트 로컬 저장
  - 메시지 목록과 입력창 관리
  - 스트리밍 채팅 호출
  - MCP 서버 및 도구 선택 UI 제공
- 상태 관리: `useChat`, `useMcpConfig`
- 연관 구성: `ChatMessages.tsx`, `ChatInput.tsx`, `McpSelect.tsx`, `lib/chatClient.ts`
- 구현 메모: 운영형 대화 도구에 가장 가까운 화면이며 설정 옵션이 많음

# `/chat` 패키지 구조

```bash
app/(content-header)/chat/
├── components/
│   ├── ChatInput.tsx         # 채팅 입력창
│   ├── ChatMessages.tsx      # 채팅 메시지 목록
│   ├── McpSelect.tsx         # MCP 서버 선택 UI
│   ├── McpToolListDialog.tsx # 도구 목록 다이얼로그
│   ├── McpToolPicker.tsx     # 추천/선택 도구 피커
│   └── McpUpsertDialog.tsx   # MCP 설정 등록/수정 다이얼로그
├── lib/
│   └── chatClient.ts         # 스트리밍 채팅 클라이언트
├── store/
│   ├── chat.ts               # 채팅 상태 Store
│   ├── mcp.ts                # MCP 상태 Store
│   └── mcpConfig.ts          # MCP 설정 Store
├── types/
│   ├── chat.d.ts             # 채팅 타입 정의
│   └── mcp.d.ts              # MCP 타입 정의
├── utils/
│   └── utils.tsx             # 화면 유틸리티
└── page.tsx                  # 고급 채팅 메인 페이지
```
