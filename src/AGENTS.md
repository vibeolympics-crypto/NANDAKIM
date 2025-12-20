# AGENTS.md
> Version: 1.0.0
> Updated: 2025-12-20
> Scope: Frontend (React + Vite + TypeScript)

## Module Context
- Vite + React 18 SPA using Tailwind, shadcn/ui patterns, lucide icons, TanStack Query, React Router.
- Data sources: static JSON under src/data or public/, APIs under server/ routes.
- Goal: performant, accessible UI with consistent design tokens.

## Tech Stack & Constraints
- Node >=18, TypeScript 5, Vite 5.
- Styling via Tailwind; prefer utility-first with design tokens; avoid inline styles unless necessary.
- Avoid `any`; keep component props typed; prefer derived types from data schema/zod where available.
- Keep components focused (single responsibility) and composable.

## Implementation Patterns
- Components: functional, hooks-first. Keep side effects in `useEffect`, data fetching via TanStack Query where applicable.
- Routing: use React Router; ensure lazy loading for heavy pages when possible.
- Accessibility: supply `aria-*`, keyboard focus states, semantic roles; prefer buttons for actions, anchors for navigation.
- Assets: prefer public/ URLs or imported assets; avoid hardcoded external links without rel="noopener noreferrer" when opening new tabs.
- State: favor local state; lift only when shared; avoid prop drilling by using contexts already defined.

## Testing & Checks
- Unit/component: npm run test:run (Vitest + RTL).
- Coverage (as needed): npm run test:coverage.
- Lint: npm run lint.
- E2E (UI changes impacting flows): npm run test:e2e or targeted Playwright specs.

## Local Golden Rules
- No console logs or unused code in commits; clean unused imports.
- Keep CSS animations and gradients performant (prefer transform/opacity).
- When consuming JSON (e.g., projects), guard against missing fields and validate before render.
- Avoid direct `window` access in SSR-able utilities; isolate to effects or event handlers only.

## Quick Validation (per change)
1) npm run lint
2) npm run test:run
3) npm run preview (if build-impacting)
Stop after three failed retries and report blockers.
