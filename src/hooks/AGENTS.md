# AGENTS.md

> Version: 2.1.0
> Updated: 2025-12-23
> Scope: Custom Hooks (React)

---

## Module Context

Custom React hooks for state management, data fetching, side effects, and utility functions.
Hooks provide reusable logic across components without prop drilling.

## Tech Stack & Constraints

- React 18 hooks API
- TypeScript strict typing
- TanStack Query for server state (where applicable)
- No external state libraries (use React Context for shared state)

## Existing Hooks

| Hook | Purpose |
|------|---------|
| useAIVibeNewsFeed | AI/Vibe news data fetching |
| useAudioManager | Audio playback state management |
| useAutoSave | Form auto-save functionality |
| useBlogExpansion | Blog section expand/collapse |
| useDataLoader | Generic data loading utility |
| useDebounce | Input debouncing |
| useKeyboardNavigation | Keyboard navigation logic |
| useKeyboardShortcuts | Global keyboard shortcuts |
| useLayoutStability | CLS prevention utilities |
| useLazyLoad | Lazy loading observer |
| useLoadingState | Loading state management |
| useMultipleRssFeed | Multiple RSS feed fetching |
| useMusicConfigSync | Music player config sync |
| usePreview | Preview mode state |
| useReducedMotion | Accessibility motion preference |
| useRssFeed | Single RSS feed fetching |
| useServiceWorker | SW registration and updates |
| useSessionManager | Session lifecycle management |
| useSessionState | Session-scoped state |
| useSessionTimeout | Session timeout handling |
| useYouTubeFeed | YouTube RSS feed fetching |
| use-mobile | Mobile viewport detection |
| use-toast | Toast notification system |

## Implementation Patterns

### Hook Structure

```typescript
// Naming: use{Feature}
// File: use{Feature}.ts or use-{feature}.ts

import { useState, useEffect, useCallback } from 'react';

interface UseFeatureOptions {
  // typed options
}

interface UseFeatureReturn {
  // typed return
}

export function useFeature(options: UseFeatureOptions): UseFeatureReturn {
  // 1. State declarations
  const [state, setState] = useState<Type>(initial);

  // 2. Derived values (useMemo if expensive)

  // 3. Callbacks (useCallback for stability)
  const handler = useCallback(() => {
    // logic
  }, [dependencies]);

  // 4. Effects (cleanup required)
  useEffect(() => {
    // setup
    return () => {
      // cleanup
    };
  }, [dependencies]);

  // 5. Return object
  return { state, handler };
}
```

### Rules of Hooks

1. Call at top level only (no conditionals/loops)
2. Call from React functions only
3. Prefix with "use"
4. Include cleanup in effects
5. Specify all dependencies

### Data Fetching Pattern

```typescript
// For server state, prefer TanStack Query integration
import { useQuery } from '@tanstack/react-query';

export function useFeatureData(id: string) {
  return useQuery({
    queryKey: ['feature', id],
    queryFn: () => fetchFeature(id),
    staleTime: 5 * 60 * 1000,
  });
}
```

## Testing Strategy

```bash
# Run hook tests
npm run test:run -- hooks

# Coverage
npm run test:coverage -- hooks
```

Test patterns:
- Use @testing-library/react-hooks (renderHook)
- Test state changes
- Test effect triggers
- Mock external dependencies

## Local Golden Rules

Do:
- Type all parameters and returns
- Provide JSDoc comments for complex hooks
- Use useCallback for returned functions
- Clean up subscriptions, timers, listeners
- Handle loading/error states

Don't:
- Use `any` type
- Return unstable references
- Forget dependency arrays
- Create infinite loops
- Access window/document without guards

## Quick Validation

1. `npm run lint -- src/hooks`
2. `npm run test:run -- hooks`
3. Verify no circular dependencies

3 failures = stop and report.
