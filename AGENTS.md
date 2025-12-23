# AGENTS.md

> Version: 2.1.0
> Updated: 2025-12-23
> Compatibility: React (Vite) / Express / TypeScript / Node 18+

---

# Role

AI Context & Governance Architect for Portfolio monorepo. Central control tower for frontend (src), backend API (server), and mini-app (tetris). Delegate specifics to nested AGENTS.

---

# Core Philosophy

1. **500-Line Limit**: All AGENTS.md files under 500 lines
2. **No Fluff, No Emojis**: Clear text only, no decorative elements
3. **Central Control & Delegation**: Root controls governance, nested files handle implementation
4. **Machine-Readable Clarity**: Executable, specific instructions only
5. **Token Efficiency**: Prevent repetitive work and infinite loops

---

# Token Efficiency Protocol

## Loop Prevention

Pre-work checklist:
1. Requirements clear? If not, ask first
2. Existing code/pattern available? Reuse it
3. Impact scope understood? Map before editing

## Retry Limit Rule

```
[Attempt]
    |
    +-- 1st fail -> Analyze cause -> Fix
    |
    +-- 2nd fail -> Change approach
    |
    +-- 3rd fail -> STOP + Report to user
    |
    +-- Report: attempts, failure cause, alternatives
```

3 failures = mandatory stop and report.

## Scope Control

- Modify only requested areas
- No unrelated file changes
- Large refactors require approval

---

# Project Context & Operations

## Tech Stack Declaration

```yaml
Language: TypeScript, JavaScript
Framework: React 18 (Vite 5), Express 5
Package Manager: npm
Build Tool: Vite
Node: ">=18.0.0"
UI: Tailwind CSS, shadcn/ui, Radix UI
State: TanStack Query, React Context
Routing: React Router DOM
Testing: Vitest, Playwright, Testing Library
```

## Operational Commands

```bash
# Frontend Development
DEV_CMD=npm run dev
BUILD_CMD=npm run build
PREVIEW_CMD=npm run preview
LINT_CMD=npm run lint
TYPE_CMD=npx tsc --noEmit

# Testing
UNIT_CMD=npm run test:run
COVERAGE_CMD=npm run test:coverage
E2E_CMD=npm run test:e2e

# Backend
SERVER_CMD=npm run server
MIGRATE_UP=npm run migrate
MIGRATE_DOWN=npm run migrate:down
BACKUP_CMD=npm run backup

# Verification
VERIFY_CMD=npm run verify:all
SECURITY_CMD=npm run security:check
```

---

# Golden Rules

## Immutable

- API keys, tokens, passwords: never hardcode
- .env, .env.local files: never edit directly
- node_modules, .git, dist: never access
- Production database: never manipulate directly
- Files: never delete without user consent

## Do's

- Environment variables: use process.env.KEY
- Placeholders: use YOUR_API_KEY_HERE format
- Follow existing patterns and conventions
- Commit in small, focused units
- Assess impact scope before changes
- Provide clear error messages

## Don'ts

- External CORS proxies (corsproxy.io, allorigins.win, cors-anywhere): forbidden
- console.log in production code: forbidden
- TypeScript `any` abuse: forbidden
- Unused imports/variables: forbidden
- Long-term commented code: forbidden
- Complex logic without tests: forbidden

---

# Validation Protocol

## Validation Files

- **[Quick Validation](./WEB_CHECKLIST_QUICK.md)** - After every task (5-10 min)
- **[Full Validation](./WEB_DEVELOPMENT_CHECKLIST.md)** - Before deploy/PR merge (30-60 min)

## Trigger Conditions

| Task Type | Validation Level |
|-----------|-----------------|
| Single file edit | Quick |
| Multiple file edit | Quick |
| New feature | Quick |
| API/DB changes | Quick + relevant Full sections |
| Deploy/Release | Full |
| PR Merge | Full |

## Validation Flow

```
[Task Complete]
     |
     v
[Run Quick Validation]
     |
     +-- Pass -> Commit allowed
     |
     +-- Fail -> Fix -> Revalidate (max 3x)
              |
              +-- 3rd fail -> STOP + Report

[Deploy/Deadline]
     |
     v
[Run Full Validation]
     |
     +-- Pass -> Deploy allowed
     |
     +-- Fail -> Resolve -> Restart from Quick
```

## Failure Recovery

1st fail: Analyze error -> Fix specific issue
2nd fail: Review approach -> Apply alternative
3rd fail: STOP -> Report -> Await user decision

Report format:
```
[BLOCKED] {task}
- Attempts: {methods tried}
- Cause: {suspected reason}
- Alternatives: {possible solutions}
- Required: {user decision needed}
```

---

# Priority Rules

Conflict resolution order:

1. Direct user command (highest)
2. Nearest AGENTS.md (current folder)
3. Parent AGENTS.md
4. Root AGENTS.md
5. Default behavior

---

# Standards & References

## Code Convention

- Follow existing codebase style
- Consistent naming (camelCase for JS/TS)
- Single responsibility per file
- Functions do one thing only
- TypeScript strict mode compliance

## Git Strategy

```bash
# Branch naming
feature/{feature-name}
fix/{bug-name}
refactor/{target}
chore/{task}

# Commit messages
feat: new feature
fix: bug fix
refactor: code improvement
docs: documentation
style: formatting
test: test additions
chore: maintenance

# AGENTS.md changes
[AGENTS] Rule update: {change description}
```

## Maintenance Policy

- Update rules when code diverges
- Quarterly cleanup of obsolete rules
- Update Version and Updated fields on changes

---

# Context Map (Action-Based Routing)

- **[Frontend UI](./src/AGENTS.md)** - Components, pages, styling
- **[Backend API](./server/AGENTS.md)** - Routes, middleware, services
- **[Tetris App](./tetris/AGENTS.md)** - Mini-app development
- **[Components](./src/components/AGENTS.md)** - UI component patterns
- **[Hooks](./src/hooks/AGENTS.md)** - Custom hook development
- **[Quick Validation](./WEB_CHECKLIST_QUICK.md)** - Post-task checklist
- **[Full Validation](./WEB_DEVELOPMENT_CHECKLIST.md)** - Pre-deploy checklist

---

# Known Issues (2025-12-23 Audit)

## Resolved

1. External CORS proxy: Migrated to self-hosted (server/routes/proxy.js)
2. console.log cleanup: Removed from component files
3. ESLint warnings: Reduced from 108 to ~90

## Remaining (Non-Critical)

1. ESLint warnings: ~90 total
   - @typescript-eslint/no-explicit-any: ~60 (mostly lib/ utilities)
   - react-hooks/exhaustive-deps: ~10
   - react-refresh/only-export-components: ~12 (shadcn/ui)
2. console.log in main.tsx: Development-only (acceptable)

## Passed Checks

- TypeScript: No errors
- ESLint errors: 0
- Hardcoded secrets: None
- XSS vulnerabilities: None
- External CORS proxy: None

---

# Quick Reference

```
Before work:
[ ] Requirements clear?
[ ] Impact scope mapped?
[ ] Existing patterns checked?

During work:
[ ] Modifying only requested scope?
[ ] Golden Rules compliance?
[ ] Same error 3+ times? -> STOP

After work:
[ ] Quick validation passed?
[ ] Pass -> Commit
[ ] Pre-deploy -> Full validation
```

---

# Rules for Agent

1. **Direct Execution**: No confirmation questions, execute immediately
2. **Overwrite Authority**: Update existing files to this structure
3. **Markdown Only**: Valid Markdown syntax required
4. **Scope Discipline**: Modify only requested areas
5. **Retry Limit**: 3 failures = stop and report
6. **Validation Required**: Quick validation after every task
