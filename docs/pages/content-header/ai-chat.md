# `/ai-chat`

- 파일: `app/(content-header)/ai-chat/page.tsx`
- 목적: 시나리오 기반 AI 채팅 UI 프로토타입
- 주요 동작:
  - 샘플 JSON 시나리오를 로드
  - `ChatShell`에 노드/엣지 기반 대화 구조 주입
- 상태 관리: `useChatEngineStore`
- 연관 구성: `sample.json`, `components/ChatShell.tsx`
- 구현 메모: 샘플 시나리오를 기준으로 동작하는 데모 성격의 화면

# `/ai-chat` 패키지 구조

```bash
app/(content-header)/ai-chat/
├── README.md                 # AI Chat 화면 설명 문서
├── sample.json               # 샘플 시나리오 데이터
├── components/
│   ├── ChatComposer.tsx      # 입력 컴포저
│   ├── ChatHeader.tsx        # 상단 헤더
│   ├── ChatList.tsx          # 대화방 목록
│   ├── ChatMessageBubble.tsx # 말풍선 UI
│   ├── ChatMessageList.tsx   # 메시지 리스트
│   ├── ChatShell.tsx         # 메인 셸
│   ├── ChatWindow.tsx        # 대화창 본문
│   ├── FriendList.tsx        # 상대 목록
│   ├── LeftRail.tsx          # 좌측 레일
│   ├── ListItem.tsx          # 리스트 아이템
│   └── ListPanel.tsx         # 리스트 패널
├── store/
│   ├── chatEngineStore.ts    # 시나리오 엔진 Store
│   ├── chatMessages.ts       # 메시지 Store
│   └── index.ts              # store export
├── types/
│   └── index.ts              # 타입 정의
└── page.tsx                  # AI Chat 메인 페이지
```
