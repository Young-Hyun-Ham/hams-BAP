# 프로젝트 개요

## 한 줄 설명

HAMS-BAP는 업무 자동화 포털 형태의 웹 애플리케이션으로, 사용자 기능과 관리자 기능을 함께 제공한다.

## 목표

- 사용자에게 게시판, FAQ, 링크, 챗봇, AI 채팅 등 정보 접근 및 업무 지원 기능 제공
- 운영자에게 메뉴, 게시판, FAQ, 지식, 고객응대, 통계, 토큰, 사용자 관리 기능 제공
- AI/자동화 기능을 포털 안에서 통합 운영

## 현재 확인된 제품 구성

### 사용자 영역

- 로그인
- 메인
- 게시판
- FAQ
- 링크
- 사이트맵
- AI Chat
- Chat
- Chatbot
- Todo
- Form Builder

### 관리자 영역

- Board 관리
- Builder 관리
- Category 관리
- Chatbot Shortcut Menu 관리
- Customer Service 관리
- FAQ 관리
- Form Builder 관리
- Knowledge 관리
- Menu 관리
- Settings
- Stats
- Token Manage
- Train
- User Info
- User Stats

### API 영역

- 인증(`auth`)
- 게시판(`board`)
- 관리자(`admin`)
- 채팅(`chat`)
- 챗봇(`chatbot`)
- 메뉴(`menus`, `submenus`)
- 사용자/토큰(`users`, `user-token`)
- OAuth Google
- Ollama 연동

## 이해관계자 관점 핵심 가치

- 사용자: 필요한 정보와 업무 기능에 빠르게 접근
- 운영자: 콘텐츠와 메뉴를 직접 관리
- 관리자/기획: AI 기능과 운영 기능을 한 포털에서 통합 관리

## PM 관점 주요 관리 포인트

- 사용자 기능별 진입 경로와 권한 구분
- 관리자 기능별 운영 책임자와 사용 빈도
- Firebase/Postgres 이원 구조의 운영 기준 정리
- AI 기능별 목적, 비용, 품질 기준 정의
- 기능 간 중복 영역 정리(`chat`, `ai-chat`, `chatbot`)

## 현재 문서화 시점의 리스크

- 일부 기존 README가 인코딩 깨짐 상태여서 제품 설명 정합성 재정비 필요
- 기능은 많지만 우선순위 문서와 릴리즈 기준 문서는 아직 없음
- 관리자 메뉴와 실제 운영 프로세스 연결 문서가 부족함
