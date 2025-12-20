# AGENTS.md
> Version: 2.0.0
> Updated: 2025-12-20
> Compatibility: React (Vite) / Express / TypeScript / Node 18+

## Role
Portfolio monorepo control tower for frontend (src), backend API (server), and mini-app (tetris). Centralize governance; delegate specifics to nested AGENTS.

## Tech Stack Declaration
```yaml
Language: TypeScript, JavaScript
Framework: React (Vite), Express
Package Manager: npm
Build Tool: Vite
Node: ">=18.0.0"
```

## Operational Commands
```bash
# Frontend
DEV_CMD=npm run dev
BUILD_CMD=npm run build
PREVIEW_CMD=npm run preview
LINT_CMD=npm run lint
UNIT_CMD=npm run test:run
COVERAGE_CMD=npm run test:coverage
E2E_CMD=npm run test:e2e
VERIFY_CMD=npm run verify:all

# Backend
SERVER_CMD=npm run server
MIGRATE_UP=npm run migrate
MIGRATE_DOWN=npm run migrate:down
BACKUP_CMD=npm run backup
```

## Token Efficiency & Retry
- Validate requirements first; reuse existing patterns; understand impact before edits.
- Retry limit: three attempts max. On third failure, stop and report causes and options.
- Scope discipline: touch only requested areas; no broad refactors without approval.

## Golden Rules (Immutable)
- Never hardcode secrets or edit .env*. Avoid committing secrets.
- Do not touch node_modules, .git, build outputs, or production data.
- Follow TypeScript typing; avoid `any` unless justified.
- Keep prod code free of debug logs; use structured logger utilities where provided.
- Preserve accessibility (ARIA), security headers, and middleware order.

## Validation Flow
- Quick check (default): npm run verify:integrity, npm run lint, npm run test:run, npm run preview (build smoke), npm run server (only if backend touched).
- Full check (before release/PR): Quick check + npm run test:e2e, npm run coverage, npm run lighthouse:verify.
- If a step fails, analyze, fix, retry. After three failed attempts, stop and report.

## Context Map
- Frontend/UI: see src/AGENTS.md
- Backend/API: see server/AGENTS.md
- Mini-app (Tetris): see tetris/AGENTS.md

## Change Management
- Branch naming: feature/{name}, fix/{issue}, chore/{task}.
- Commits: concise prefixes (feat/fix/refactor/docs/test/chore/style).
- Keep files under 500 lines here; no emojis; concise actionable language only.
