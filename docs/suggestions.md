# Suggestions and Improvements

A curated list of potential improvements for future iterations.


## SERVER

- Optimize `server/utils/entityCrudHelpers.ts` to handle nested entities or relations.
- Add pagination and filters for entity exports.
- Implement versioned API endpoints (e.g., `/api/v1`, `/api/v2`).


## SECURITY

- Implement refresh tokens or short‑lived access tokens with rotation.
- Add 2FA (TOTP) for privileged operations.
- Integrate CSRF protection for state‑changing requests.
- Use `helmet` or Nuxt’s built‑in security headers for stricter defaults.


## PERFORMANCE

- Introduce a caching layer (e.g., Redis) for read‑heavy endpoints.
- Use streaming or chunked responses for large exports/imports.


## UX / DX

- Add admin dashboard metrics for users and database operations.
- Improve file upload feedback and error messages (progress, retries).
- Add command‑line utilities for database import/export.


## TESTING

- Implement automated integration tests (Vitest + Supertest) for endpoints and middleware.
- Mock PostgreSQL with `pg-mem` for CI.


## MONITORING

- Pipe structured logs into Loki or Sentry for observability.
- Add request timing and performance tracing (e.g., OpenTelemetry).
