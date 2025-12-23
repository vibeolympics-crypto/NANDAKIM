# AGENTS.md

> Version: 2.1.0
> Updated: 2025-12-23
> Scope: Frontend (React + Vite + TypeScript)

---

## Module Context

Vite + React 18 SPA using Tailwind, shadcn/ui, lucide icons, TanStack Query, React Router.
Data sources: static JSON (src/data, public/), APIs (server/ routes).
Goal: performant, accessible UI with consistent design tokens.

## Tech Stack & Constraints

- Node >=18, TypeScript 5, Vite 5
- React 18 functional components
- Tailwind CSS utility-first styling
- shadcn/ui + Radix UI primitives
- TanStack Query for server state
- React Router DOM for routing

## Directory Structure

```
src/
  components/     # UI components (see components/AGENTS.md)
  hooks/          # Custom hooks (see hooks/AGENTS.md)
  pages/          # Route pages
  contexts/       # React contexts
  data/           # Static JSON data
  lib/            # Utilities and helpers
  services/       # API service functions
  types/          # TypeScript type definitions
  test/           # Test utilities
  assets/         # Static assets
```

## Implementation Patterns

### Components

- Functional, hooks-first
- Side effects in useEffect
- Data fetching via TanStack Query
- Props typed with interfaces

### Routing

- React Router for navigation
- Lazy loading for heavy pages
- Use Link for navigation, button for actions

### Styling

```typescript
// Tailwind utilities
className="flex items-center gap-4 p-4"

// cn() for conditional classes
import { cn } from '@/lib/utils';
className={cn('base', isActive && 'active')}

// Avoid inline styles unless necessary
```

### State Management

- Local state (useState) preferred
- Lift state only when shared
- Context for cross-cutting concerns
- TanStack Query for server state

### Accessibility

- Semantic HTML elements
- ARIA attributes where needed
- Keyboard focus states
- buttons for actions, anchors for navigation
- rel="noopener noreferrer" for external links

## Commands

```bash
DEV_CMD=npm run dev
BUILD_CMD=npm run build
PREVIEW_CMD=npm run preview
LINT_CMD=npm run lint
UNIT_CMD=npm run test:run
E2E_CMD=npm run test:e2e
```

## Testing Strategy

- Unit/component: Vitest + Testing Library
- Coverage: npm run test:coverage
- E2E: Playwright for UI flows
- Accessibility: jest-axe

## Local Golden Rules

Do:
- Type all props and state
- Clean up effects (subscriptions, timers)
- Handle loading/error states
- Guard window/document access
- Use semantic HTML
- Optimize images (lazy loading, proper sizing)

Don't:
- Leave console.log in commits
- Use `any` type
- Access window in SSR-able code
- Use external CORS proxies
- Forget alt text on images
- Skip error boundaries for async components

## Nested Context

- **[Components](./components/AGENTS.md)** - UI patterns
- **[Hooks](./hooks/AGENTS.md)** - Custom hook patterns

## Quick Validation

```bash
npm run lint
npm run test:run
npm run build
npm run preview  # smoke test
```

3 failures = stop and report.
