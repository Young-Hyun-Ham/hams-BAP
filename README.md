# hams-BAP 프로젝트 : **"비즈니스 자동화 포털(Business Automation Portal)의 약자이자, 우리 비즈니스의 든든한 '밥'이 되어준다"**

---

# Nextjs + React + TypeScript + Zustand + VITE + Pnpm + firebase + Figma

## 프로젝트 실행
```bash 
git clone https://github.com/Young-Hyun-Ham/hamsfam.git
cd ./portfolio

/portfolio> pnpm -v
# 버전이 나오면 install 실행 오류 혹은 버전이 안나오면 아래 실행
/portfolio> npm install -g pnpm
# npm 오류 발생 시 
# window powershell 관리자실행
/> Set-ExecutionPolicy RemoteSigned 
# mac
/> brew install node

/portfolio> pnpm install
/portfolio> pnpm run build
/portfolio> pnpm dev
```
---

# 코드 스니펫 프로젝트
## 1. pnpm 설치
설치확인: 
```bash
pnpm -v
# 설치가 되어 있지 않다면 아래 명령어 실행
npm install -g pnpm
```

## 2. 프로젝트 생성 
```bash
pnpm create next-app [프로젝트명]
```

# 3. 의존성 설치
<details>
<summary>의존성 (package.json)</summary>
<pre>
{
  "name": "basic",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "@hello-pangea/dnd": "^18.0.1",
    "@mui/icons-material": "^6.5.0",
    "@mui/material": "^6.5.0",
    "@rjsf/core": "^5.24.12",
    "@rjsf/mui": "^5.24.12",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/pg": "^8.15.6",
    "@types/ws": "^8.18.1",
    "axios": "^1.11.0",
    "bcryptjs": "^3.0.3",
    "chart.js": "^4.5.1",
    "dotenv": "^17.2.3",
    "firebase": "^12.2.1",
    "firebase-admin": "^13.5.0",
    "googleapis": "^166.0.0",
    "jose": "^6.0.13",
    "jsonwebtoken": "^9.0.2",
    "jwt-decode": "^4.0.0",
    "next": "16.0.7",
    "openai": "^6.9.1",
    "pg": "^8.16.3",
    "react": "19.2.1",
    "react-chartjs-2": "^5.3.1",
    "react-dom": "19.2.1",
    "reactflow": "^11.11.4",
    "uuid": "^13.0.0",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@xyflow/react": "^12.8.2",
    "eslint": "^9",
    "eslint-config-next": "16.0.7",
    "lucide-react": "^0.541.0",
    "react-flow": "^1.0.3",
    "react-redux": "^9.2.0",
    "redux-persist": "^6.0.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
</pre>
</details>
<details>
<summary>공통 css(global.css)</summary>
<pre>
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

/* 전역 (globals.css) */
html, body, #__next { height: 100%; }

/* layout 구조에 따라 main 등도 100% 명시 */
body { margin: 0; }
.app-root { height: 100%; display: flex; flex-direction: column; }
.app-main { height: 100%; min-height: 0; } /* 내부 스크롤 허용 */

/* 채팅 시 llm 로딩 표시 */
.loading-dots span {
  display: inline-block;
  animation: loadingDots 1.2s infinite;
  opacity: 0.2;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes loadingDots {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}
</pre>
</details>
```bash 
pnpm install
```

# 4. 실행
```bash 
pnpm run build
pnpm dev
```
---

🧠 참고사항
<pre>
Next.js 프로젝트에 pnpm이 좋을까?
Next.js + React 환경에서는 빌드, 의존성, 워크스페이스가 많기 때문에 pnpm이 특히 유리함.
</pre>

✅ 이점 정리:
<pre>
빌드 속도 향상 — npm보다 2~3배 빠름
저장공간 절약 — 패키지 캐시를 재활용
워크스페이스 관리 쉬움 — frontend, backend 등 여러 패키지 한 번에 관리
CI/CD 속도 향상 — GitHub Actions 등에서 설치 시간 단축
의존성 충돌 방지 — 각 모듈이 자기 버전을 명확히 가짐
</pre>
