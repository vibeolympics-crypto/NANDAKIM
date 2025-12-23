# AGENTS.md

> Version: 2.1.0
> Updated: 2025-12-23
> Scope: Backend API (Express + Node 18)

---

## Module Context

Express server for content, media, email, social, adsense, contact, music APIs.
Uses environment validation, layered middleware, logging, and data directory initialization.
Data/config in server/data and server/config.

## Tech Stack & Constraints

- Node >=18, ES modules
- Express 5
- Middleware: helmet, CORS, sanitization, rate limit, CSRF
- Logging: utils/logger.js (structured logs)
- Security: env validation required before boot

## Directory Structure

```
server/
  config/         # Configuration (Redis, storage, etc.)
  data/           # Data files
  docs/           # API documentation
  lib/            # Shared libraries
  middleware/     # Express middleware
  routes/         # API route handlers
  scripts/        # Migration, backup scripts
  services/       # Business logic services
  utils/          # Utility functions
  index.js        # Server entry point
```

## Implementation Patterns

### Route Structure

```javascript
// routes/{feature}.js
import express from 'express';
import { validateInput } from '../middleware/validation.js';
import { featureService } from '../services/feature.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await featureService.getAll();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Middleware Order

```javascript
// Critical order - do not change
1. Health check (minimal middleware)
2. Helmet (security headers)
3. CORS configuration
4. Rate limiting
5. Body parsing
6. Input sanitization
7. CSRF protection
8. Route handlers
9. Error handler (last)
```

### Input Validation

```javascript
// Always validate and sanitize
import { body, validationResult } from 'express-validator';

router.post('/',
  body('email').isEmail().normalizeEmail(),
  body('name').trim().escape(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // proceed
  }
);
```

### Error Handling

```javascript
// Use global error handler
try {
  // operation
} catch (error) {
  next(error); // forward to globalErrorHandler
}

// Never swallow errors
// Always log via utils/logger.js
```

## Commands

```bash
SERVER_CMD=npm run server
MIGRATE_UP=npm run migrate
MIGRATE_DOWN=npm run migrate:down
MIGRATE_STATUS=npm run migrate:status
BACKUP_CMD=npm run backup
BACKUP_RESTORE=npm run backup:restore
```

## Testing Strategy

- API tests: Supertest + Vitest
- Run: `npm run test:run -- server`
- Integration: Test full request/response cycle
- Mock external services

## Local Golden Rules

Do:
- Validate all inputs
- Use parameterized queries
- Log errors with context
- Keep request timeouts reasonable
- Close database connections properly
- Use environment variables for config

Don't:
- Commit secrets or tokens
- Trust raw user input
- Bypass env validation
- Block main thread
- Swallow errors silently
- Use external CORS proxies

## Security Checklist

- [ ] Helmet middleware active
- [ ] CORS allowlist configured
- [ ] Rate limiting enabled
- [ ] CSRF protection on state-changing routes
- [ ] Input sanitization applied
- [ ] SQL injection prevention
- [ ] No secrets in code

## Quick Validation

```bash
npm run lint
npm run test:run -- server
npm run server  # smoke test
curl http://localhost:3001/api/health
```

3 failures = stop and report.
