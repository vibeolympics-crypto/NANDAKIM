# AGENTS.md

> v2.2 | 2025-12-25 | React/Vite + Express + TypeScript

## Role

Portfolio monorepo 중앙 통제. Frontend (src), Backend (server), Mini-app (tetris) 관리.

## Tech Stack

```yaml
Frontend: React 18, Vite 5, TypeScript
Backend: Express 5, Node 18+
UI: Tailwind, shadcn/ui, Radix UI
State: TanStack Query, React Context
Test: Vitest, Playwright
Deploy: Cloudflare Pages/Workers
```

## Commands

```bash
# Dev
npm run dev          # Frontend :8093
npm run server       # Backend :3001
npm run dev:full     # Both

# Build & Verify
npm run build
npx tsc --noEmit
npm run lint
npm run verify:all

# Test
npm run test:run
npm run test:e2e

# Deploy
npm run migrate
npm run backup
```

## Token Efficiency

### Pre-Work
1. 요구사항 명확? → 불명확 시 질문
2. 기존 패턴 있음? → 재사용
3. 영향 범위 파악? → 파악 후 시작

### Retry Limit (3회 규칙)

```
1차 실패 → 원인 분석 → 수정
2차 실패 → 접근 변경
3차 실패 → 중단 + 보고

[BLOCKED] {작업}
- 시도: {방법}
- 원인: {추정}
- 대안: {제안}
```

### Scope Control
- 요청 범위만 수정
- 관련 없는 파일 수정 금지
- 대규모 리팩토링은 승인 필요

## Golden Rules

### Immutable
- API 키/토큰 하드코딩 금지
- .env 파일 직접 수정 금지
- node_modules, .git, dist 접근 금지
- 프로덕션 DB 직접 조작 금지

### Do's
- `process.env.KEY` 사용
- 플레이스홀더: `YOUR_API_KEY_HERE`
- 기존 패턴 따르기
- 작은 단위 커밋

### Don'ts
- 외부 CORS 프록시 금지
- console.log 프로덕션 코드 금지
- `any` 타입 남용 금지
- 미사용 import 방치 금지

## Validation

### Quick (작업 후)
```bash
npm run build && npx tsc --noEmit && npm run lint
```

### Full (배포 전)
```bash
npm run test:run && npm run test:e2e
npm run security:check
```

→ 상세: `WEB_CHECKLIST_QUICK.md`, `WEB_DEVELOPMENT_CHECKLIST.md`

## Context Map

- **Frontend**: `src/AGENTS.md`
- **Backend**: `server/AGENTS.md`
- **Tetris**: `tetris/AGENTS.md`
- **References**: `docs/references/`

## Priority (충돌 시)

1. 사용자 직접 명령
2. 가장 가까운 AGENTS.md
3. 상위 AGENTS.md
4. 루트 AGENTS.md
5. 기본 동작

## Git

```bash
# Branch
feature/{name}
fix/{bug}
refactor/{target}

# Commit
feat: 새 기능
fix: 버그 수정
refactor: 개선
docs: 문서
test: 테스트
chore: 기타
```
