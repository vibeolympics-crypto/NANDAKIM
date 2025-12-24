# AGENTS.md
> Version: 1.0.0
> Updated: 2025-12-20
> Scope: Tetris mini-app (Vite + TypeScript)

## Module Context
- Standalone Vite project under tetris/ with its own package.json.
- Keep isolated from root app dependencies; no cross-imports from src/ or server/.

## Tech Stack & Constraints
- Node >=18, TypeScript ~5.8, Vite ^6.
- Keep bundle lean; prefer pure TS/React utilities, minimal deps.
- Maintain accessibility for controls; ensure keyboard play is supported if applicable.

## Commands
```bash
dev: npm run dev
build: npm run build
preview: npm run preview
```

## Patterns & Rules
- Components should be typed; avoid `any`.
- Keep game loop performant: use requestAnimationFrame, avoid unnecessary state churn.
- No console logs or unused code in commits.
- Static assets belong in tetris/public or src assets; avoid reaching into root/public.

## Quick Validation
1) npm run lint (if configured) or run TypeScript build to catch errors
2) npm run build
Stop after three failed retries and report blockers.
