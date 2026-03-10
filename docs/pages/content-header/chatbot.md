# `/chatbot`

- 파일: `app/(content-header)/chatbot/page.tsx`
- 목적: 프로젝트의 주력 챗봇 UI 화면
- 주요 동작: `ChatContainer`를 중심으로 채팅 인터페이스 전체 렌더링
- 연관 구성: `components/ChatContainer.tsx`, 관련 store/hooks/services
- 구현 메모: 실제 기능 복잡도는 하위 컴포넌트에 집중되어 있으며 페이지 파일은 컨테이너 역할만 수행

# `/chatbot` 패키지 구조

```bash
app/(content-header)/chatbot/
├── components/
│   ├── ChatContainer.tsx        # 챗봇 메인 컨테이너
│   ├── ChatInput.tsx            # 입력 UI
│   ├── ChatMessageItem.tsx      # 메시지 렌더러
│   ├── Icons.tsx                # 아이콘 모음
│   ├── ScenarioEmulator.tsx     # 시나리오 실행 UI
│   ├── ScenarioMenuPanel.tsx    # 메뉴 패널
│   ├── ScenarioNodeControls.tsx # 노드 제어 UI
│   ├── ScenarioPanel.tsx        # 시나리오 패널
│   ├── scenarioSamples.ts       # 샘플 시나리오 데이터
│   └── emulator/
│       ├── README.md
│       ├── ScenarioEmulator.tsx
│       ├── core/
│       │   ├── graph.ts
│       │   └── stableStringify.ts
│       ├── handlers/
│       │   └── createUiHandlers.ts
│       ├── hooks/
│       │   ├── useScenarioAutoRunner.ts
│       │   ├── useScenarioDefinition.ts
│       │   ├── useScenarioHistoryAppend.ts
│       │   ├── useScenarioHydration.ts
│       │   ├── useScenarioProgress.ts
│       │   └── useScenarioReset.ts
│       └── runners/
│           ├── runApiNode.ts
│           ├── runLlmNode.ts
│           └── runSetSlotNode.ts
├── hooks/
│   └── useChatOrchestrator.ts   # 채팅 오케스트레이션 훅
├── services/
│   └── chatbotFirebaseService.ts # Firebase 챗봇 서비스
├── store/
│   └── index.ts                 # 챗봇 Store
├── types/
│   ├── index.ts
│   └── shortcutMenu.ts
├── utils/
│   ├── engine.ts
│   ├── index.ts
│   ├── knowledge.ts
│   └── streamText.ts
└── page.tsx                     # 챗봇 메인 페이지
```
