# AGENTS.md

> Version: 2.1.0
> Updated: 2025-12-23
> Scope: React Components

---

## Module Context

React components for the Portfolio application.
Structure: Custom components at root, shadcn/ui primitives in ui/ subdirectory.

## Tech Stack & Constraints

- React 18 functional components
- TypeScript strict typing
- Tailwind CSS utility-first styling
- shadcn/ui + Radix UI primitives
- lucide-react icons

## Directory Structure

```
components/
  ui/              # shadcn/ui primitives (do not modify directly)
  icons/           # Custom icon components
  *.tsx            # Application-specific components
```

## Component Categories

### Layout Components
- Header, Footer
- AnimatedSection
- SkipLink

### Section Components
- HeroSection
- AboutSection
- BlogSNSSection
- BlogTimelineSection
- AIVibeNewsSection
- ContactSection
- MapSection
- YouTubeSection
- SNSGridSection

### Interactive Components
- MusicPlayer
- YouTubeCarousel
- CategoriesGrid
- SNSDropdownCard
- LoginModal
- ProjectDetailModal

### UI Utilities
- OptimizedImage
- SkeletonUI
- CardBlur, CardGlow
- BackToTopButton
- LazyLoadFallback
- AdSenseAd

## Implementation Patterns

### Component Structure

```typescript
// File: ComponentName.tsx

import { type ComponentProps, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ComponentNameProps extends ComponentProps<'div'> {
  // custom props
  variant?: 'default' | 'secondary';
}

export const ComponentName = forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'base-styles',
          variant === 'secondary' && 'variant-styles',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ComponentName.displayName = 'ComponentName';
```

### Styling Rules

```typescript
// Use Tailwind utilities
className="flex items-center gap-4 p-4"

// Use cn() for conditional classes
className={cn(
  'base-class',
  isActive && 'active-class',
  className
)}

// Avoid inline styles unless dynamic values required
style={{ transform: `translateX(${offset}px)` }}
```

### Accessibility Requirements

```typescript
// Interactive elements
<button
  aria-label="Close modal"
  aria-expanded={isOpen}
  onClick={handleClose}
>

// Images
<img src={src} alt="Descriptive text" />

// Focus management
const buttonRef = useRef<HTMLButtonElement>(null);
useEffect(() => {
  if (isOpen) buttonRef.current?.focus();
}, [isOpen]);
```

## shadcn/ui Guidelines

Location: `components/ui/`

Rules:
- Do NOT modify ui/ components directly
- Extend via wrapper components if customization needed
- Import from @/components/ui/{component}
- Follow shadcn patterns for new primitives

```typescript
// Correct: Import shadcn component
import { Button } from '@/components/ui/button';

// Correct: Extend with wrapper
export const PrimaryButton = ({ children, ...props }) => (
  <Button variant="default" size="lg" {...props}>
    {children}
  </Button>
);
```

## Testing Strategy

```bash
# Run component tests
npm run test:run -- components

# Visual regression (if configured)
npm run test:e2e -- components
```

Test patterns:
- Use @testing-library/react
- Test user interactions
- Test accessibility (jest-axe)
- Mock external hooks/APIs

## Local Golden Rules

Do:
- Keep components focused (single responsibility)
- Type all props explicitly
- Use semantic HTML elements
- Provide aria labels for interactive elements
- Implement keyboard navigation
- Use forwardRef for reusable components
- Memoize expensive renders

Don't:
- Use `any` type
- Nest more than 3-4 levels deep
- Put business logic in components (use hooks)
- Forget alt text on images
- Use onClick on non-interactive elements
- Leave console.log in commits
- Modify ui/ components directly

## Performance Guidelines

```typescript
// Memoize expensive components
export const ExpensiveList = memo(({ items }) => (
  // render
));

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Use stable callbacks
const handleClick = useCallback(() => {
  // handler
}, [dependencies]);
```

## Quick Validation

1. `npm run lint -- src/components`
2. `npm run test:run -- components`
3. Visual check in dev server
4. Accessibility check (keyboard nav, screen reader)

3 failures = stop and report.
