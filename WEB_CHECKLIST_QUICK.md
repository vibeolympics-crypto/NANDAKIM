# Web Development Quick Checklist

> Version: 2.1.0
> Updated: 2025-12-23
> Purpose: Post-task validation (5-10 min)
> Scope: React (Vite) + Express + TypeScript

---

## Scope Declaration

This checklist applies to the Portfolio monorepo (frontend + backend).
Project-specific commands defined in AGENTS.md Operational Commands section.

---

## 0. Pre-Check

Validate before starting to prevent token waste.

- [ ] Requirements clearly defined
- [ ] Target files/scope identified
- [ ] Existing patterns checked

If unclear: Ask questions before work.

---

## 1. Build Verification

### Commands

| Check | Command |
|-------|---------|
| Build | `npm run build` |
| Type Check | `npx tsc --noEmit` |
| Lint | `npm run lint` |

- [ ] Build success (0 errors)
- [ ] Type check pass
- [ ] Critical warnings reviewed

### Failure Protocol

```
1st fail: Check error message -> Fix target line
2nd fail: Check imports/dependencies -> Fix path/version
3rd fail: STOP -> Report to user
```

---

## 2. Code Conflict Check

- [ ] New code does not break existing features
- [ ] Import/require paths correct
- [ ] No function/variable name collisions
- [ ] No circular references

### Quick Verification

```bash
# Circular reference check
npx madge --circular src/

# TypeScript import test
npx tsc --noEmit
```

---

## 3. React/TypeScript Rules

### Hooks

- [ ] Hooks called at component top level only
- [ ] No hooks inside conditionals/loops
- [ ] Dependency arrays correctly specified
- [ ] Cleanup logic implemented in useEffect

```typescript
// Correct Pattern
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();  // cleanup
}, [dependency]);  // dependencies explicit
```

### Components

- [ ] Props typed (no `any` abuse)
- [ ] Single responsibility maintained
- [ ] Event handlers properly bound

### TanStack Query

- [ ] Query keys unique and consistent
- [ ] Error/loading states handled
- [ ] Stale time configured appropriately

---

## 4. Style & Layout

- [ ] Layout renders correctly
- [ ] Responsive behavior verified (mobile/desktop)
- [ ] No z-index conflicts
- [ ] No unintended overflow clipping
- [ ] Scroll behavior normal

### Tailwind Specifics

- [ ] Utility classes follow project conventions
- [ ] No conflicting responsive breakpoints
- [ ] Dark mode variants work (if applicable)

### Common Issues

| Symptom | Check First |
|---------|-------------|
| Element invisible | z-index, display, visibility |
| Layout broken | flex/grid props, parent size |
| Scroll issues | overflow, position settings |

---

## 5. Media Resources

- [ ] Image paths valid
- [ ] Image alt attributes present
- [ ] Audio/video playback works
- [ ] Media controls functional

### Checklist by Type

```
Image:  path OK | alt OK | lazy loading OK
Audio:  path OK | controls OK | state managed OK
Video:  path OK | controls OK | autoplay+muted OK
Font:   path OK | fallback OK | display:swap OK
```

---

## 6. API & Network

### Frontend (React)

- [ ] API endpoints correct
- [ ] HTTP methods appropriate (GET/POST/PUT/DELETE)
- [ ] Error handling implemented
- [ ] Loading state displayed
- [ ] Timeout handling exists

### Backend (Express)

- [ ] Route path correct
- [ ] Middleware order maintained
- [ ] Input validation present
- [ ] Response sanitized

### Security Check

- [ ] No external CORS proxies used
- [ ] API keys not exposed to client
- [ ] Sensitive data not logged

```javascript
// Bad: External proxy
fetch('https://cors-anywhere.herokuapp.com/...')

// Good: Self-hosted proxy
fetch('/api/proxy?url=...')
```

---

## 7. Security Minimum

- [ ] No hardcoded API keys/tokens
- [ ] No sensitive info in console.log
- [ ] User input validation exists
- [ ] No XSS vulnerable code (innerHTML caution)

```javascript
// Bad: XSS vulnerable
element.innerHTML = userInput;

// Good: Safe method
element.textContent = userInput;
// Or use DOMPurify
```

---

## 8. Final Verification

### Development Server

| Stack | Command |
|-------|---------|
| Frontend | `npm run dev` |
| Backend | `npm run server` |
| Full | `npm run dev:full` |

- [ ] Dev server runs successfully
- [ ] New feature works correctly
- [ ] Existing features unaffected
- [ ] No console errors (warnings reviewed)

### Backend-Specific (if touched)

- [ ] Server starts without errors
- [ ] API endpoints respond correctly
- [ ] Middleware chain functions properly

---

## 9. Commit Ready

- [ ] Unused imports removed
- [ ] Unused variables/functions removed
- [ ] Debug console.log removed
- [ ] Commented code cleaned
- [ ] TODO comments reviewed

---

## Troubleshooting Quick Reference

| Symptom | 1st Check | 2nd Check |
|---------|-----------|-----------|
| White screen | Console errors | Import paths |
| Style broken | CSS loaded | Class name conflicts |
| API failure | Network tab | CORS settings |
| Infinite render | Dependency array | State update logic |
| Build failure | Type errors | Dependency versions |
| Server crash | Env validation | Middleware order |

---

## Retry Protocol

```
1st fail -> Analyze error -> Fix
2nd fail -> Change approach
3rd fail -> STOP + Report

Report format:
[QUICK-BLOCKED] {item}
- Symptom: {what happened}
- Attempts: {methods tried}
- Required: {user decision request}
```

---

## Completion Checklist

```
[ ] npm run build - success
[ ] npx tsc --noEmit - pass
[ ] npm run lint - no errors
[ ] New feature works
[ ] Existing features OK
[ ] Console errors: none

All pass -> Commit allowed
Any fail -> Fix -> Revalidate
3rd fail -> STOP + Report
```

---

**Full Review Required?** See WEB_DEVELOPMENT_CHECKLIST.md
