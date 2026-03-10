# 기능 맵

## 1. 사용자 포털

| 기능 | 경로 기준 | 목적 | 비고 |
| --- | --- | --- | --- |
| 로그인 | `app/(content)/login` | 사용자 인증 | 인증 API 연계 |
| 메인 | `app/(content-header)/main` | 메인 허브 화면 | 주요 기능 진입점 추정 |
| 게시판 | `app/(content-header)/board` | 공지/게시글 조회 | slug 기반 카테고리 구조 |
| FAQ | `app/(content-header)/faq` | 자주 묻는 질문 탐색 | 관리자 FAQ와 연동 가능성 높음 |
| 링크 | `app/(content-header)/link` | 외부/내부 링크 모음 | 포털형 탐색 기능 |
| 사이트맵 | `app/(content-header)/sitemap` | 메뉴/구조 안내 | 정보 구조 확인 포인트 |
| AI Chat | `app/(content-header)/ai-chat` | AI 기반 대화 UI | 독립 채팅 경험 제공 |
| Chat | `app/(content-header)/chat` | 일반 채팅 기능 | 별도 스토어/컴포넌트 보유 |
| Chatbot | `app/(content-header)/chatbot` | 챗봇 인터랙션 | 서비스/스토어 구조 존재 |
| Todo | `app/(content)/todos` | 개인 업무 관리 | 내부 생산성 기능 |
| Form Builder | `app/(content)/form-builder` | 폼 작성/실행 추정 | 최근 작업 중인 영역으로 보임 |

## 2. 관리자 포털

| 기능 | 경로 기준 | 목적 | 비고 |
| --- | --- | --- | --- |
| Board | `app/(siderbar-header)/admin/board` | 게시판 관리 | 사용자 게시판과 직접 연결 |
| Builder | `app/(siderbar-header)/admin/builder` | 빌더 관리 | 시나리오/구성 관리 가능성 |
| Category | `app/(siderbar-header)/admin/category` | 분류 체계 관리 | 게시판/메뉴 연계 가능 |
| Chatbot Shortcut Menu | `app/(siderbar-header)/admin/chatbot-shortcut-menu` | 챗봇 바로가기 관리 | 챗봇 UX 운영 포인트 |
| Customer Service | `app/(siderbar-header)/admin/customer-service` | 고객응대 운영 | 운영 정책 확인 필요 |
| FAQ | `app/(siderbar-header)/admin/faq` | FAQ 관리 | 사용자 FAQ와 연결 |
| Form Builder | `app/(siderbar-header)/admin/form-builder` | 폼 빌더 운영 | 최근 추가된 기능 |
| Knowledge | `app/(siderbar-header)/admin/knowledge` | 지식 관리 | AI 응답 품질과 연관 가능 |
| Menu | `app/(siderbar-header)/admin/menu` | 메뉴 구조 관리 | 포털 IA 핵심 |
| Settings | `app/(siderbar-header)/admin/settings` | 시스템 설정 | 환경값/정책과 연계 가능 |
| Stats | `app/(siderbar-header)/admin/stats` | 통계 확인 | 사용량/운영지표 후보 |
| Token Manage | `app/(siderbar-header)/admin/token-manage` | 토큰/사용량 관리 | AI 비용 관리 포인트 |
| Train | `app/(siderbar-header)/admin/train` | 학습/업데이트 운영 | AI/지식 운영과 연결 |
| User Info | `app/(siderbar-header)/admin/user-info` | 사용자 정보 관리 | 권한/정보 수정 가능성 |
| User Stats | `app/(siderbar-header)/admin/user-stats` | 사용자 통계 | 운영 보고 지표 후보 |

## 3. 공통 백엔드/API

| 분류 | 경로 기준 | 메모 |
| --- | --- | --- |
| 인증 | `app/api/auth` | login, logout, me, refresh 포함 |
| 관리자 API | `app/api/admin` | Firebase/Postgres 분리 흔적 있음 |
| 게시판 API | `app/api/board` | Firebase/Postgres 동시 존재 |
| 채팅 API | `app/api/chat` | agent, gemini, mcp, stream 포함 |
| 챗봇 API | `app/api/chatbot` | Firebase/Postgres 구조 |
| 메뉴 API | `app/api/menus`, `app/api/submenus` | 메뉴 데이터 제공 |
| 사용자 API | `app/api/users`, `app/api/user-token` | 사용자/토큰 관리 |
| 외부 연동 | `app/api/oauth/google`, `app/api/ollama` | OAuth 및 모델 연동 |

## 4. PM 후속 정리 필요 항목

- 각 기능의 실제 사용자 유형
- 필수 기능과 실험 기능 구분
- 관리자 기능별 운영 담당자
- API별 실제 운영 DB 기준(Firebase/Postgres)
- AI 기능별 KPI와 비용 기준
