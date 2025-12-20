# AGENTS.md
> Version: 1.0.0
> Updated: 2025-12-20
> Scope: Backend API (Express + Node 18)

## Module Context
- Express server for content, media, email, social, adsense, contact, music APIs.
- Uses environment validation, layered middleware (helmet, CORS, sanitization, rate limit, csrf), logging, and data directory initialization.
- Data/config lives under server/data and server/config; avoid direct edits to production data without approval.

## Tech Stack & Constraints
- Node >=18, ES modules.
- Middlewares: helmetConfig, sanitizeAll, blockSqlInjection, apiRateLimiter, csrf, enforceHttps, timeout.
- Logging: utils/logger.js; prefer structured logs over console.
- Security: keep middleware order; do not bypass env validation (validateEnv) before boot.
- Storage/queues: check config/redis.js or storage.js before adding dependencies.

## Implementation Patterns
- Routes under server/routes: keep controllers thin, validate inputs, sanitize outputs.
- Use parameterized queries and validation helpers; never trust raw input.
- Health routes remain middleware-light and first.
- When adding routes, wire through middleware chain and export via index if aggregating.
- Maintain CSP and CORS allowlists; update allowedOrigins thoughtfully.

## Commands
```bash
SERVER_CMD=npm run server
MIGRATE_UP=npm run migrate
MIGRATE_DOWN=npm run migrate:down
MIGRATE_STATUS=npm run migrate:status
BACKUP_CMD=npm run backup
BACKUP_RESTORE=npm run backup:restore
```

## Testing & Checks
- Targeted server tests: npm run test -- server (or run full `npm run test:run`).
- Integration/API: supertest-based specs in server/routes and services; run npm run test:run when touching backend.
- Lint: npm run lint.

## Local Golden Rules
- No secrets or tokens committed; rely on process.env.
- Keep request timeouts reasonable; avoid blocking operations on main thread.
- Validate payload sizes and content types; sanitize all external-facing inputs.
- Log and handle errors via globalErrorHandler; do not swallow errors silently.

## Quick Validation (per backend change)
1) npm run lint
2) npm run test:run (or targeted server tests)
3) npm run server (smoke)
Stop after three failed retries and report blockers.
