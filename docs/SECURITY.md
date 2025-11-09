# Security Overview

This document describes how authentication, authorization, and session security work in this Nuxt 4 + H3 backend, along with recommended frontend protections.


## Authentication Flow

- **Login**
  - Endpoint: `POST /api/auth/login` (`server/api/auth/login.post.ts`)
  - Body: `{ identifier: string, password: string }` where `identifier` is username or email.
  - Verifies credentials with `bcrypt.compare` against `users.password_hash`.
  - Issues a JWT via `createToken` in `server/plugins/auth.ts`.
  - Sets `auth_token` as an HttpOnly cookie.
  - Response envelope is returned via `createResponse({ token, user })`.

- **Session Hydration**
  - Middleware `server/middleware/00.auth.hydrate.ts` extracts `auth_token` from cookies, verifies it via `verifyToken`, loads the full user (including roles), merges permissions with `mergePermissions`, and attaches `event.context.user`.

- **Session Fetch (Client)**
  - Composable: `app/composables/auth/useAuth.ts` → `fetchCurrentUser()` calls GET `/api/user/me` y setea el store de usuario con la respuesta.
  - Server endpoint providing the “me” response: `server/api/user/me.get.ts`.

- **Logout**
  - Intended endpoint: `POST /api/auth/logout`.
  - Note: A file exists at `server/api/auth/logout.post.ts`, but it currently returns the current user profile and does not clear the cookie. To fully log out, add cookie clearing, e.g. `setCookie(event, 'auth_token', '', { maxAge: 0, ... })`.


## Middleware Protections

- **00.auth.hydrate.ts**
  - Attaches `event.context.user = { ...user, roles, permissions }` when a valid `auth_token` is present.

- **01.auth.guard.ts**
  - Applies to all `/api/*` except `POST /api/auth/login` and `POST /api/auth/logout`.
  - Throws 401 if `event.context.user` is missing.
  - Blocks suspended users (403).
  - Grants all access to admin or `permissions.canManageUsers`.
  - Example granular rule: blocks access to `/api/role*` unless `canManageUsers`.

- **Public vs Protected**
  - Public: `POST /api/auth/login`, `POST /api/auth/logout` (per guard set).
  - Protected: everything else under `/api/*`.


## Cookie & Session Security

- Cookie name: `auth_token`.
- Attributes set on login (`setCookie` in `login.post.ts`):
  - `httpOnly: true`.
  - `sameSite: 'strict'`.
  - `secure: process.env.NODE_ENV === 'production'`.
  - `maxAge: 7 days`.
- JWT expiration: configured via `JWT_EXPIRES_IN` env (supports formats like `1d`, `12h`, `1800s`).
- Secret: `JWT_SECRET` env is required.


## Frontend Protection

- **Nuxt Route Guard**
  - File: `app/middleware/auth.global.ts`.
  - Behavior:
    - Guests can access public routes (`/`, `/login`) only.
    - Authenticated users are redirected away from `/login`.
    - Admins (`role === 'admin'` or `canManageUsers` or `canAccessAdmin`) can access everything.
    - Staff (e.g., `canEditContent`, `canReview`, `canTranslate`) can access management sections.
    - Regular users are constrained to `/user`.

- **Permission-based UI**
  - A `v-can` directive is not present in the repo. Recommended pattern:
    - Use `useUserStore().hasPermission(key)` and a small directive or component wrapper to conditionally render features.
    - Example idea:
      ```ts
      // pseudo: register v-can using user store
      app.directive('can', {
        mounted(el, binding) {
          const ok = useUserStore().hasPermission(binding.value)
          if (!ok) el.remove()
        }
      })
      ```


## Data Integrity

- **Validation**: Zod schemas and `safeParseOrThrow` (`server/utils/validate.ts`) are used across routes.
- **Error normalization**: Prefer `createError({ statusCode, statusMessage })` from H3 for consistent HTTP errors.


## Audit & Logging

- Logger: Pino via `server/plugins/logger.ts`, exposed as `globalThis.logger`.
- Typical logs:
  - Authentication events: login success/failed attempts.
  - Database import/export counts and timings.
  - List/detail handlers include timing and filter metadata.
- Rate limiting/throttling: not implemented. Recommended to add (e.g., per-IP and per-user limits on sensitive endpoints).


## File Uploads Security

- Endpoint: `POST /api/uploads?type=<bucket>`.
- Validates `type` with a strict regex, enforces max size (15 MB), and rejects unsupported/corrupted images.
- Sharp processing:
  - Reads metadata with `failOn: 'warning'`.
  - Resizes to fit within 1600x1600.
  - Rotates to fix orientation and strip EXIF.
  - Converts JPEG/PNG/WEBP to AVIF by default (quality 72; lossless=false).
- Persists under `public/img/<type>/`.


## Request Flow (textual)

[Client]
→ [Nuxt Route Middleware (app/middleware/auth.global.ts)]
→ [H3 00.auth.hydrate.ts attaches event.context.user]
→ [H3 01.auth.guard.ts enforces access]
→ [API Handler (server/api/*) uses Kysely/Postgres]
→ [Response via createResponse]


## Configuration

- `DATABASE_URL` (required)
- `JWT_SECRET` (required)
- `JWT_EXPIRES_IN` (default `1d`)
- Password hashing uses `bcrypt` with SALT_ROUNDS=10 (constant in `server/plugins/auth.ts`).
