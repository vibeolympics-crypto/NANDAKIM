# AGENTS.md

> Version: 2.1.0
> Updated: 2025-12-23
> Scope: Tetris Mini-App (Vite + TypeScript)

---

## Module Context

Standalone Vite project with its own package.json.
Keep isolated from root app dependencies.
No cross-imports from src/ or server/.

## Tech Stack & Constraints

- Node >=18
- TypeScript ~5.8
- Vite ^6
- Pure TS/React, minimal dependencies
- Keep bundle lean

## Directory Structure

```
tetris/
  src/            # Source code
  public/         # Static assets
  package.json    # Separate dependencies
  vite.config.ts  # Vite configuration
```

## Implementation Patterns

### Game Loop

```typescript
// Use requestAnimationFrame for smooth updates
const gameLoop = useCallback(() => {
  if (!gameOver) {
    updateGameState();
    requestRef.current = requestAnimationFrame(gameLoop);
  }
}, [gameOver, updateGameState]);

useEffect(() => {
  requestRef.current = requestAnimationFrame(gameLoop);
  return () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  };
}, [gameLoop]);
```

### State Management

```typescript
// Minimize state updates for performance
const [gameState, dispatch] = useReducer(gameReducer, initialState);

// Batch updates where possible
// Avoid unnecessary re-renders
```

### Keyboard Controls

```typescript
// Support keyboard play
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft': moveLeft(); break;
      case 'ArrowRight': moveRight(); break;
      case 'ArrowDown': moveDown(); break;
      case 'ArrowUp': rotate(); break;
      case ' ': hardDrop(); break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [moveLeft, moveRight, moveDown, rotate, hardDrop]);
```

## Commands

```bash
# Run from tetris/ directory
cd tetris
npm install
npm run dev
npm run build
npm run preview
```

## Accessibility

- Keyboard controls fully functional
- Focus indicators visible
- Pause/resume with keyboard
- Score announced to screen readers

## Performance Guidelines

- Use requestAnimationFrame
- Minimize DOM updates
- Avoid unnecessary state churn
- Keep render functions pure
- Use CSS transforms for animations

## Local Golden Rules

Do:
- Type all components and state
- Clean up animation frames
- Optimize render performance
- Support keyboard navigation
- Keep dependencies minimal

Don't:
- Import from root src/ or server/
- Add unnecessary dependencies
- Leave console.log in code
- Block main thread
- Use inline styles for animations

## Quick Validation

```bash
cd tetris
npm run build  # type check + build
npm run preview  # visual check
```

3 failures = stop and report.
