# Web Development Full Checklist

> Version: 2.1.0
> Updated: 2025-12-23
> Purpose: Pre-deploy/PR merge validation (30-60 min)
> Scope: React (Vite) + Express + TypeScript

---

## When to Use

- Before production deploy
- Before PR merge to main
- Before major release
- After significant refactoring

---

## 1. Build & Type Safety

### Build Verification

```bash
npm run build
```

- [ ] Build completes without errors
- [ ] Output size reasonable (check dist/)
- [ ] No unexpected warnings

### Type Check

```bash
npx tsc --noEmit
```

- [ ] Zero type errors
- [ ] No implicit `any` in new code
- [ ] Generic types properly constrained

### Lint Check

```bash
npm run lint
```

- [ ] Zero lint errors
- [ ] Warnings reviewed and justified

---

## 2. Testing Suite

### Unit Tests

```bash
npm run test:run
```

- [ ] All tests pass
- [ ] New features have tests
- [ ] Edge cases covered

### Coverage (if required)

```bash
npm run test:coverage
```

- [ ] Coverage meets threshold
- [ ] Critical paths covered
- [ ] No untested business logic

### E2E Tests

```bash
npm run test:e2e
```

- [ ] All E2E tests pass
- [ ] User flows validated
- [ ] Cross-browser scenarios covered

---

## 3. Security Audit

### Automated Check

```bash
npm run security:check
npm audit
```

- [ ] No high/critical vulnerabilities
- [ ] Known vulnerabilities documented

### Manual Check

- [ ] No hardcoded secrets in code
- [ ] No secrets in git history
- [ ] Environment variables properly used
- [ ] API keys use placeholders in examples

### Frontend Security

- [ ] No external CORS proxies
- [ ] XSS prevention (no raw innerHTML)
- [ ] CSRF tokens used where needed
- [ ] Sensitive data not in localStorage

### Backend Security

- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting configured
- [ ] Helmet middleware active
- [ ] CORS properly configured

---

## 4. Performance

### Lighthouse Audit

```bash
npm run lighthouse
```

Target scores:
- [ ] Performance: 90+
- [ ] Accessibility: 90+
- [ ] Best Practices: 90+
- [ ] SEO: 90+

### Bundle Analysis

```bash
npm run bundle:analyze
```

- [ ] No unexpected large dependencies
- [ ] Code splitting effective
- [ ] Tree shaking working

### Core Web Vitals

- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### Resource Optimization

- [ ] Images optimized (WebP/AVIF where possible)
- [ ] Fonts subset and preloaded
- [ ] CSS purged of unused styles
- [ ] JavaScript minified

---

## 5. Accessibility (a11y)

### Automated

```bash
npm run test:accessibility
```

- [ ] No WCAG 2.1 AA violations

### Manual Check

- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Skip links present
- [ ] ARIA labels appropriate
- [ ] Color contrast sufficient
- [ ] Screen reader tested

### Form Accessibility

- [ ] Labels associated with inputs
- [ ] Error messages accessible
- [ ] Required fields indicated
- [ ] Autocomplete attributes set

---

## 6. Cross-Browser & Device

### Browser Testing

```bash
npm run test:cross-browser
```

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Device Testing

```bash
npm run test:devices
```

- [ ] Desktop (1920x1080, 1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667, 414x896)

### Responsive Breakpoints

- [ ] sm (640px)
- [ ] md (768px)
- [ ] lg (1024px)
- [ ] xl (1280px)
- [ ] 2xl (1536px)

---

## 7. API & Backend

### Endpoint Verification

- [ ] All routes respond correctly
- [ ] Error responses consistent
- [ ] Status codes appropriate
- [ ] Response times acceptable

### Database (if applicable)

- [ ] Migrations up to date
- [ ] Indexes optimized
- [ ] Connections properly closed
- [ ] Backup/restore tested

### Server Health

```bash
npm run server
# Then test health endpoint
curl http://localhost:3001/api/health
```

- [ ] Server starts cleanly
- [ ] Health check passes
- [ ] Graceful shutdown works

---

## 8. Documentation

- [ ] README up to date
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Breaking changes noted
- [ ] Changelog updated

---

## 9. Git & Version Control

### Branch State

- [ ] All commits meaningful
- [ ] No merge conflicts
- [ ] Branch up to date with main

### Commit Quality

- [ ] Commit messages follow convention
- [ ] No sensitive data committed
- [ ] No large binary files

### PR Readiness

- [ ] Description complete
- [ ] Related issues linked
- [ ] Reviewers assigned
- [ ] CI checks passing

---

## 10. Deployment Readiness

### Environment Configuration

- [ ] Production env vars documented
- [ ] Staging tested successfully
- [ ] Rollback plan exists

### Infrastructure

- [ ] CDN configured
- [ ] SSL certificates valid
- [ ] DNS properly configured
- [ ] Monitoring active

### Post-Deploy Plan

- [ ] Smoke test checklist ready
- [ ] Monitoring alerts configured
- [ ] Support team notified

---

## Failure Recovery Protocol

```
1st fail: Analyze -> Fix specific issue
2nd fail: Review approach -> Alternative solution
3rd fail: STOP -> Report with details

Report format:
[FULL-BLOCKED] {section}
- Item: {failed check}
- Symptom: {what happened}
- Attempts: {solutions tried}
- Impact: {deployment risk}
- Required: {user decision}
```

---

## Pre-Deploy Final Checklist

```
Build & Types:
[ ] npm run build - success
[ ] npx tsc --noEmit - pass
[ ] npm run lint - clean

Testing:
[ ] npm run test:run - all pass
[ ] npm run test:e2e - all pass

Security:
[ ] npm audit - no critical
[ ] No hardcoded secrets

Performance:
[ ] Lighthouse 90+ all categories
[ ] Bundle size acceptable

Final:
[ ] Staging tested
[ ] Rollback plan ready
[ ] Team notified

All pass -> Deploy allowed
Any critical fail -> Resolve first
```

---

## Quick Commands Reference

```bash
# Full validation sequence
npm run build
npx tsc --noEmit
npm run lint
npm run test:run
npm run test:e2e
npm run security:check
npm run lighthouse

# Backend validation
npm run server
npm run migrate:status

# Performance check
npm run bundle:analyze
npm run perf:full
```

---

**Quick Check Only?** See WEB_CHECKLIST_QUICK.md
