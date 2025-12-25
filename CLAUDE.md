# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack portfolio/blog monorepo with React frontend, Express backend, and Cloudflare Workers for edge functionality.

## Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript
- **Backend**: Express 5, Node.js >=18
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **State**: TanStack Query, React Context
- **Routing**: React Router DOM 6
- **Testing**: Vitest, Playwright
- **Deployment**: Cloudflare Pages/Workers

## Commands

```bash
# Development
npm run dev              # Frontend dev server (port 8093)
npm run server           # Backend server (port 3001)
npm run dev:full         # Both frontend + backend

# Build & Verify
npm run build            # Production build
npm run lint             # ESLint
npx tsc --noEmit         # Type check

# Testing
npm run test:run         # Unit tests (single run)
npm run test:coverage    # With coverage
npm run test:e2e         # Playwright E2E

# Verification
npm run verify:all       # Integrity + lint checks
npm run security:check   # Security audit

# Database
npm run migrate          # Run migrations
npm run backup           # Database backup
```

## Architecture

```
src/                      # React frontend
├── components/           # UI components (shadcn/ui in ui/)
├── pages/                # Route pages
├── hooks/                # 24+ custom hooks
├── contexts/             # React contexts
├── services/             # API service functions
├── lib/                  # Utilities (cn, api helpers)
├── types/                # TypeScript definitions
└── data/                 # Static JSON data

server/                   # Express backend
├── routes/               # API routes (email, content, music, news, etc.)
├── middleware/           # Security (helmet, csrf, rate-limit, sanitization)
├── services/             # Business logic
├── config/               # Configuration
└── scripts/              # Migration, backup scripts

tetris/                   # Mini Tetris game (separate Vite app)
Contact Form/             # Cloudflare Worker for contact form
notion-blog/              # Cloudflare Worker for Notion blog
public/                   # Static assets, JSON data files
```

## Path Alias

`@` maps to `./src` (configured in vite.config.ts and tsconfig.json)

---

## Token Efficiency Protocol

### Pre-Work Checklist

작업 시작 전 필수 확인:
1. 요구사항이 명확한가? 불명확 시 먼저 질문
2. 기존 코드/패턴이 있는가? 있으면 재사용
3. 영향 범위를 파악했는가? 파악 후 작업 시작

### Retry Limit Rule (3회 실패 시 중단)

```
1차 실패 -> 원인 분석 -> 수정 시도
2차 실패 -> 접근 방식 변경
3차 실패 -> 작업 중단 + 사용자에게 보고

보고 형식:
[BLOCKED] {작업명}
- 시도: {시도한 방법들}
- 원인: {추정 원인}
- 대안: {가능한 대안들}
- 필요: {사용자 결정 필요 사항}
```

### Scope Control

- 요청받은 범위만 수정
- 관련 없는 파일 수정 금지
- 대규모 리팩토링은 사전 승인 필요

---

## Validation Workflow

### Quick Validation (작업 완료 후, 5-10분)

모든 작업 완료 후 실행:

```bash
npm run build           # 빌드 성공 확인
npx tsc --noEmit        # 타입 에러 0개
npm run lint            # 린트 에러 0개
npm run dev             # 개발 서버 정상 실행 확인
```

**체크 항목:**
- [ ] 빌드 성공 (에러 0개)
- [ ] 타입 체크 통과
- [ ] 새 기능 정상 작동
- [ ] 기존 기능 영향 없음
- [ ] 콘솔 에러 없음

### Full Validation (배포/PR 전, 30분-1시간)

Quick Validation 통과 후 실행:

```bash
npm run test:run        # 단위 테스트
npm run test:coverage   # 커버리지
npm run test:e2e        # E2E 테스트
npm run security:check  # 보안 점검
npm run build && npm run preview  # 프로덕션 빌드 테스트
```

**필수 체크 섹션:**
- Build & Type Safety
- Code Quality
- Security
- Deployment Preparation
- Final Verification

---

## Troubleshooting Quick Reference

| 증상 | 1차 확인 | 2차 확인 |
|------|---------|---------|
| 흰 화면 | 콘솔 에러 | import 경로 |
| 스타일 깨짐 | CSS 로드 | 클래스명 충돌 |
| API 실패 | Network 탭 | CORS 설정 |
| 무한 렌더링 | 의존성 배열 | 상태 업데이트 로직 |
| 빌드 실패 | 타입 에러 | 의존성 버전 |
| 서버 크래시 | 환경 변수 | 미들웨어 순서 |

### 에러 발생 시 실행 순서

```bash
# 1. 순환 참조 검사
npx madge --circular src/

# 2. TypeScript import 테스트
npx tsc --noEmit

# 3. 린트 검사
npm run lint

# 4. 전체 검증
npm run verify:all
```

---

## Golden Rules

### Immutable (절대 불변)

- API 키, 토큰, 비밀번호 하드코딩 금지
- .env, .env.local 파일 직접 수정 금지
- node_modules, .git, dist 디렉토리 접근 금지
- 프로덕션 데이터베이스 직접 조작 금지
- 사용자 동의 없는 파일 삭제 금지

### Do's

- 환경 변수 참조: `process.env.KEY`
- 플레이스홀더 사용: `YOUR_API_KEY_HERE`
- 기존 패턴과 컨벤션 따르기
- 작은 단위로 커밋
- 에러 발생 시 명확한 메시지 제공

### Don'ts

- 외부 CORS 프록시 사용 금지 (보안 위험)
- console.log 프로덕션 코드에 남기기 금지
- any 타입 남용 금지 (TypeScript)
- 미사용 import/변수 방치 금지
- 주석 처리된 코드 장기 방치 금지

---

## Key Patterns

- **Hooks**: Custom hooks in `src/hooks/` follow `use*` naming
- **Components**: Functional components with TypeScript, props typed explicitly
- **API calls**: Use TanStack Query for server state
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind utilities, use `cn()` from `@/lib/utils` for class merging

## Security Middleware Order (Backend)

1. Helmet (security headers)
2. CORS
3. Rate limiting
4. CSRF protection
5. Input sanitization
6. Route handlers
7. Error handler

---

## Governance & Context Map

### AGENTS.md 시스템

- **Root AGENTS.md**: Central control tower with golden rules
- **src/AGENTS.md**: Frontend-specific patterns
- **server/AGENTS.md**: Backend-specific patterns

### Validation Files

- **WEB_CHECKLIST_QUICK.md**: 작업 완료 후 빠른 검증 (5-10분)
- **WEB_DEVELOPMENT_CHECKLIST.md**: 배포/PR 전 정밀 검증 (30분-1시간)

### Priority Rules (충돌 시 우선순위)

1. 사용자 직접 명령 (최우선)
2. 가장 가까운 AGENTS.md (해당 폴더)
3. 상위 AGENTS.md
4. 루트 AGENTS.md
5. 기본 동작

---

## Git Strategy

```bash
# 브랜치 네이밍
feature/{기능명}
fix/{버그명}
refactor/{대상}
chore/{작업명}

# 커밋 메시지
feat: 새 기능 추가
fix: 버그 수정
refactor: 코드 개선
docs: 문서 수정
style: 포맷팅
test: 테스트 추가
chore: 기타 작업
```

---

## Quick Reference

```
작업 시작 전:
[ ] 요구사항 명확한가?
[ ] 영향 범위 파악했는가?
[ ] 기존 패턴 확인했는가?

작업 중:
[ ] 요청 범위만 수정하는가?
[ ] Golden Rules 위반 없는가?
[ ] 3회 이상 같은 에러 반복하는가? -> 중단

작업 완료 후:
[ ] Quick Validation 실행
[ ] 검증 통과 -> 커밋
[ ] 배포 전 -> Full Validation
```

---

## Reference Documents

작업 시 상황별 참조:

| 상황 | 파일 |
|------|-----|
| API 연동 | `docs/references/API_INTEGRATION.md` |
| 검증/테스트 | `docs/references/VALIDATION.md` |
| 에러/트러블슈팅 | `docs/references/TROUBLESHOOTING.md` |
| 아키텍처 이해 | `docs/references/ARCHITECTURE.md` |
| 정리 현황 | `docs/references/CLEANUP_REPORT.md` |
| SuperClaude | `docs/references/SUPERCLAUDE.md` |

## SuperClaude (Enhanced Claude Code)

설치 완료: `~/.claude/` 에 30개 명령어, 16개 에이전트 설치됨

주요 명령어:
- `/sc:analyze` - 코드 분석
- `/sc:implement` - 구현
- `/sc:brainstorm` - 브레인스토밍
- `/sc:research` - 리서치
- `/sc:pm` - 프로젝트 관리

## Known Issues

- ~90 ESLint warnings (mostly `@typescript-eslint/no-explicit-any` in lib/) - non-critical
- API 클라이언트 중복: `api.ts` → `apiClient.ts` 마이그레이션 필요
- Worker 중복: `workers/notion-blog-feed/worker.js` 사용 권장
