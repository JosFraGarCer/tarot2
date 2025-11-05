

# Tarot Backend (/server) Technical Documentation

This document describes the backend code under `/server`. It covers folder structure, dependencies, API endpoints, utilities, schemas, plugins, database typing, logging, and error handling. It is a developer reference for understanding how to extend and maintain the backend.

## Structure Overview

- `server/api/`
  - Route handlers grouped by entity.
  - Each entity typically provides:
    - [index.get.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/api/tag/index.get.ts:0:0-0:0) (list)
    - [index.post.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/api/tag/index.post.ts:0:0-0:0) (create)
    - `[id].get.ts` (detail)
    - `[id].put.ts` (update)
    - `[id].delete.ts` (delete)
  - Authentication: [auth/login.post.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/api/auth/login.post.ts:0:0-0:0), [auth/logout.post.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/api/auth/logout.post.ts:0:0-0:0), [users/me.get.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/api/users/me.get.ts:0:0-0:0)
- `server/plugins/`
  - Cross-cutting plugins (logger, db, auth helpers)
- `server/utils/`
  - Cross-entity helpers: responses, filters, validation, i18n, error, user permission merging
- `server/schemas/`
  - Zod schemas by domain: users, roles, tags, etc.
- `server/database/`
  - Kysely DB types (DB interface for type-safe queries)

## Dependencies

- Kysely (Postgres): query builder with typed DB interface
- H3 (Nitro): define handlers, access query/body, throw HTTP errors
- Zod: validation
- bcrypt: password hashing/verification
- jose: JWT sign/verify (HS256)
- pino: logging (exposed via `globalThis.logger`)

Environment
- `DATABASE_URL`
- `JWT_SECRET`
- `SALT_ROUNDS=10`
- `JWT_EXPIRES_IN` (optional)

Patterns
- Multi-language support via double LEFT JOIN on `<entity>_translations` and COALESCE fallback to `'en'`
- Query validation via Zod
- Standardized responses via `createResponse` and `createPaginatedResponse`
- `buildFilters` for pagination, search, sorting, and total counting
- Detailed logging at info/warn/error with request context

---

# API Endpoints

Below each entity is summarized with available endpoints, inputs, and outputs. All list endpoints support pagination, sorting, search, filters, and AND-mode tag filtering with both tag ids and translated names.

Conventions
- Language resolution: [getRequestedLanguage(query)](cci:1://file:///home/bulu/work/devel/tarot2/server/utils/i18n.ts:25:0-30:1) reads `lang|language|locale`
- Fallback fields use COALESCE between requested language and `'en'`
- Responses: `{ success: boolean, data, meta? }`
- Errors: standardized via H3 `createError` and helpers

## /api/auth

### POST /api/auth/login
Authenticate and issue JWT. Sets `auth_token` httpOnly cookie.

- Body
  - `email` (string)
  - `password` (string)

- Response (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "u@example.com",
      "username": "user",
      "roles": [{ "id": 1, "name": "admin", "permissions": { "users_read": true } }],
      "permissions": { "users_read": true /* merged */ }
    },
    "token": "<jwt>"
  },
  "meta": null
}
```

- Errors

# Tarot Backend (/server) – Technical Documentation

This is the developer reference for the backend code under `/server`. It documents structure, dependencies, cross-cutting patterns, and each API module’s purpose, inputs, outputs, and internal logic.

## Overview

- **Language & runtime**
  - TypeScript on H3/Nitro style handlers (`defineEventHandler`, `getQuery`, `readBody`).
  - PostgreSQL via Kysely for type-safe queries (`selectFrom`, `leftJoin`, `sql`, etc).
- **Core patterns**
  - Validation with Zod schemas.
  - Standard response helpers for all endpoints.
  - Multi-language translations via double LEFT JOIN + `coalesce(...)` fallback to `'en'`.
  - Pagination + sorting + search via `buildFilters`.
  - Global logger via `globalThis.logger`.
  - Global DB via `globalThis.db`.
  - Authentication helpers (JWT) via [server/utils/auth.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/utils/auth.ts:0:0-0:0).

---

## Project Structure

- **server/api/**
  - Route handlers grouped by resource, e.g. `world`, `world_card`, `arcana`, `base_card`, `skill`, `facet`, `users`, `roles`, `tag`, `auth`.
  - Each resource typically exposes:
    - [index.get.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/api/tag/index.get.ts:0:0-0:0): list with pagination/search/sorting/filters.
    - [index.post.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/api/tag/index.post.ts:0:0-0:0): create.
    - `[id].get.ts`: detail.
    - `[id].put.ts`: update.
    - `[id].delete.ts`: delete/soft delete (varies by entity).
- **server/utils/**
  - `filters.ts`: pagination, sorting, search assembly.
  - `response.ts`: `createResponse`, `createPaginatedResponse`.
  - `validate.ts`: `safeParseOrThrow` wrapper for Zod.
  - [i18n.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/utils/i18n.ts:0:0-0:0): language resolution (`lang|language|locale`).
  - `users.ts`: `mergePermissions`.
  - [auth.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/utils/auth.ts:0:0-0:0): JWT helpers (`sign`, `verify`, [getTokenFromEvent](cci:1://file:///home/bulu/work/devel/tarot2/server/utils/auth.ts:18:0-24:1)).
- **server/schemas/**
  - Zod schemas used in API routes (`user.ts`, [role.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/schemas/role.ts:0:0-0:0), [tag.ts](cci:7://file:///home/bulu/work/devel/tarot2/server/schemas/tag.ts:0:0-0:0), ...).
- **server/database/**
  - `types.ts` Kysely `DB` interface for typed SQL.

---

## Common API Behavior

- **Standard response**
  - `createResponse(data, meta?) -> { success: true, data, meta: meta ?? null }`
  - `createPaginatedResponse(items, totalItems, page, pageSize, search) -> { success, data: items, meta: { page, pageSize, totalItems, count: items.length, search } }`
- **Validation**
  - All inputs validated via Zod. Use `safeParseOrThrow(schema, input)`.
- **Language & translations**
  - `const lang = getRequestedLanguage(query)` from `lang|language|locale`.
  - Use `coalesce(<requested>.field, <en>.field)` for translated outputs.
  - Also expose `language_code_resolved: coalesce(<requested>.language_code, 'en')`.
- **Tags on entities**
  - List & detail endpoints return `tags: Array<{ id, name, language_code_resolved }>` via JSON subquery joining `tag_links -> tags -> tags_translations` with fallback.
  - List endpoints log `count_tags` (sum of tags across rows).
- **Filtering by tags (AND mode)**
  - Query params:
    - `tags`: string or array (comma-separated or JSON), matched against `lower(coalesce(tt_req.name, tt_en.name))`.
    - `tag_ids`: string or array of ids.
  - AND semantics enforced by `GROUP BY entity_id HAVING COUNT(DISTINCT tl.tag_id) = <number of filters>`.
- **Sorting**
  - Unified across lists via `buildFilters(...)` and a `sortColumnMap` per entity (includes text `lower(coalesce(name))`).
- **Logging**
  - Info logs at the end of list handlers include: `page, pageSize, count, search, sort, direction, lang, status/is_active/...`, `tag_ids`, `tags`, `count_tags`, `timeMs`.
  - Detail handlers log `{ id, lang, timeMs }`.

---

## API Modules

Below is a concise reference. All list endpoints support:
- Pagination: `page`, `pageSize (<=100)`
- Search: `q` or `search`
- Sorting: `sort`, `direction`
- Filters: `status` (when present), `is_active`, `created_by`, plus entity-specific filters.
- Tag filters (AND): `tag_ids`, `tags` with language fallback.

For brevity, only highlights differ per entity are listed.

### /api/auth

- **POST /api/auth/login**
  - Body: `{ email: string, password: string }`
  - Verifies bcrypt hash, signs JWT (HS256), sets `auth_token` httpOnly cookie.
  - Response includes enriched user with roles array and merged `permissions`.
  - Errors: 400 (validation), 401 (invalid credentials).

- **POST /api/auth/logout**
  - Clears `auth_token` cookie.
  - Response: `{ success: true }`.

- **GET /api/users/me**
  - Extracts/validates JWT.
  - Loads current user with roles and merged permissions.
  - Errors: 401 (missing/invalid token).

### /api/users

- Purpose: CRUD for users; password hashing on create/update; role assignments; soft delete for `[id].delete.ts` (inactive).
- List GET
  - Filters: `status`, `is_active`, `created_by`, plus search over `username/email`.
  - Sorting includes `created_at`, `modified_at`, `name`, `is_active`, `created_by`.
  - Returns each user with aggregated roles (`json_agg`) and merged `permissions`.
- Detail GET
  - Enriched same as list item.
- POST
  - Hashes password (bcrypt), inserts user and `user_roles`.
- PUT
  - Partial updates; optional password re-hash; transactional update + role reassignment.
- DELETE
  - Soft delete: set inactive, remove roles.

### /api/roles

- Purpose: CRUD over existing schema (Option A: only columns present).
- Permissions: JSONB stored; parsed to object if string in DB.
- List GET
  - Filters: `name`, `created_at` ranges (if applicable), `status` limited to existing fields.
  - Sorting: existing columns only (`created_at`, `modified_at`, `name`).
- Detail/POST/PUT/DELETE
  - Standard CRUD; DELETE is hard delete.

### /api/tag

- Purpose: Multi-language tags with parent/child hierarchy (`parent_id`).
- Tables: `tags`, `tags_translations(tag_id, language_code, name, short_text, description)`.
- List GET
  - Filters: `is_active`, `category`, `parent_id`, `search` (over translated `name`, `short_text`, `description`, plus `code`).
  - Sorting: `created_at`, `modified_at`, `code`, `category`, `name`, `is_active`, `created_by`.
  - Outputs include translation fields (with fallback) and `parent_name` via join on parent tag translations:
    - `parent_name = coalesce(tp_req.name, tp_en.name)`.
- Detail GET
  - Same fields; includes `parent_name`.
- POST
  - Transactionally create base tag and initial EN translation; `name` required.
- PUT
  - Transactionally update base fields and upsert translation in requested language; `name` required when inserting new translation.
- DELETE
  - If `lang=en`: delete tag and all translations; otherwise delete only that translation.

Example (GET /api/tag/5?lang=es)
```json
{
  "success": true,
  "data": {
    "id": 5,
    "code": "balance",
    "category": "concept",
    "name": "Equilibrio",
    "parent_id": 1,
    "parent_name": "Virtud",
    "language_code_resolved": "es"
  },
  "meta": null
}
```

### /api/world

- Purpose: Worlds registry with multi-idioma fields.
- List GET
  - Filters: `status`, `is_active`, `created_by`.
  - Tag filters: `tag_ids`, `tags` (AND).
  - Returns `create_user` (join to `users.username`).
  - Includes `tags` array.
- Detail GET
  - Same enrichments.

Example (GET /api/world?tag_ids=1,5&lang=es)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "Gaia",
      "name": "Mundo de Gaia",
      "language_code_resolved": "es",
      "create_user": "admin",
      "tags": [
        { "id": 2, "name": "Naturaleza", "language_code_resolved": "es" },
        { "id": 5, "name": "Equilibrio", "language_code_resolved": "en" }
      ]
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalItems": 1, "count": 1, "search": null }
}
```

### /api/world_card

- Purpose: World-specific card overrides.
- List GET
  - Filters: `status`, `is_active`, `created_by`, `world_id`.
  - Tag filters: `tag_ids`, `tags` (AND).
  - Includes `tags`, `create_user`.
- Detail GET
  - Same enrichments.

### /api/arcana

- Purpose: Arcana catalog (Major/Minor).
- List GET
  - Filters: `status`, `is_active`, `created_by`.
  - Tag filters: `tag_ids`, `tags` (AND).
  - Includes `tags`, `create_user`.
- Detail GET
  - Same enrichments.

### /api/base_card

- Purpose: Base card catalog with card type translations.
- List GET
  - Filters: `status`, `is_active`, `created_by`, `card_type_id`.
  - Tag filters: `tag_ids`, `tags` (AND).
  - Includes `card_type` translated, `create_user`, and `tags`.
- Detail GET
  - Same enrichments.

### /api/skill

- Purpose: Base skills (abilities), linked to facets.
- List GET
  - Filters: `status`, `is_active`, `created_by`, `facet_id`.
  - Tag filters: `tag_ids`, `tags` (AND).
  - Includes `facet` translated, `create_user`, and `tags`.
- Detail GET
  - Same enrichments.

### /api/facet

- Purpose: Facets (attributes) linked to an Arcana.
- List GET
  - Filters: `status`, `is_active`, `created_by`, `arcana_id`.
  - Tag filters: `tag_ids`, `tags` (AND).
  - Includes `arcana` translated, `create_user`, and `tags`.
- Detail GET
  - Same enrichments.

---

## Utils

### server/utils/filters.ts

- **buildFilters(baseQuery, options)**
  - Input:
    - `page`, `pageSize`
    - `search` and [applySearch(qb, s)](cci:1://file:///home/bulu/work/devel/tarot2/server/api/world_card/index.get.ts:103:6-111:9) to inject search conditions (usually over `coalesce(...) ilike %s%`).
    - `status`, `statusColumn`
    - `countDistinct`: column used for counting total rows.
    - `sort`, `defaultSort`, `sortColumnMap`: validates field and direction, supports raw `sql` expressions for text sorting.
  - Output:
    - `{ query, totalItems, page, pageSize, resolvedSortField, resolvedSortDirection }`
  - Behavior:
    - Applies search callback if provided.
    - Validates sort field against `sortColumnMap`, builds `orderBy`.
    - Applies pagination via `limit`/`offset`.
    - Calculates `totalItems` using a `count(distinct ...)` subquery.
  - Example usage:
    ```ts
    const { query, totalItems } = await buildFilters(base, {
      page, pageSize,
      search,
      applySearch: (qb, s) => qb.where(sql`lower(name) ilike ${'%' + s + '%'}`),
      countDistinct: 'w.id',
      sort: { field: q.sort ?? 'created_at', direction: q.direction ?? 'desc' },
      defaultSort: { field: 'created_at', direction: 'desc' },
      sortColumnMap: { created_at: 'w.created_at', name: sql`lower(name)` }
    })
    ```

### server/utils/response.ts

- **createResponse(data, meta?)**
  - Uniform success response: `{ success: true, data, meta: meta ?? null }`.

- **createPaginatedResponse(items, totalItems, page, pageSize, search)**
  - Adds `meta: { page, pageSize, totalItems, count: items.length, search }`.

### server/utils/validate.ts

- **safeParseOrThrow(schema, input)**
  - Parses and either returns data or throws `createError(400)` with validation message.

### server/utils/i18n.ts

- **getRequestedLanguage(queryLike)**
  - Reads `lang | language | locale` from request (in that order).
  - Returns a string language code, used in all translation joins and fallbacks.

### server/utils/users.ts

- **mergePermissions(roles[])**
  - Iterates role permissions, merges boolean flags with OR semantics into a single `permissions` object.
  - Used by `/api/users` list/detail and auth login/me responses.

### server/utils/auth.ts

- **signJwt(payload, options?)**
- **verifyJwt(token)**
- **getTokenFromEvent(event)**
  - Extracts from cookie `auth_token` or `Authorization: Bearer ...`.
  - Throws controlled errors for invalid/missing tokens.
  - JWT secret from `process.env.JWT_SECRET`.

---

## Schemas (Zod)

- **server/schemas/user.ts**
  - `userQuerySchema`: pagination, sorting, filters for list.
  - `userCreateSchema`: required `email`, `username`, `password`, optional `roles`.
  - `userUpdateSchema`: partial fields, optional password, roles array.

- **server/schemas/role.ts**
  - Role base fields allowed by current DB schema.
  - Permissions as JSON object (parsed/stringified).

- **server/schemas/tag.ts**
  - `tagQuerySchema`: `page`, `pageSize`, `search`, `is_active`, `category`, `parent_id`, sorting.
  - `tagCreateSchema`: base tag + initial EN translation (name required).
  - `tagUpdateSchema`: partial base + translation upsert in requested language (name required on insert).

Schemas are enforced in corresponding endpoints using `safeParseOrThrow`.

---

## Database & Typing

- **server/database/types.ts**
  - Kysely `DB` interface with tables:
    - Users, Roles, UserRoles, World, WorldTranslations, Arcana, Facet, BaseCard, BaseCardType, Skills, and their translation tables, plus `tags`, `tags_translations`, `tag_links`.
  - Enables type-safe `.selectFrom('table')` and joins.

- **SQL conventions**
  - Translations:
    ```ts
    leftJoin('<entity>_translations as t_req', join => join
      .onRef('t_req.<entity>_id', '=', '<alias>.id')
      .on('t_req.language_code', '=', lang)
    )
    leftJoin('<entity>_translations as t_en', join => join
      .onRef('t_en.<entity>_id', '=', '<alias>.id')
      .on('t_en.language_code', '=', sql`'en'`)
    )
    select sql`coalesce(t_req.name, t_en.name)`.as('name')
    select sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved')
    ```
  - Tags aggregation:
    ```ts
    sql`(
      select coalesce(json_agg(
        json_build_object(
          'id', tg.id,
          'name', coalesce(tt_req.name, tt_en.name),
          'language_code_resolved', coalesce(tt_req.language_code, 'en')
        )
      ), '[]'::json)
      from tag_links tl
      join tags tg on tg.id = tl.tag_id
      left join tags_translations tt_req on tt_req.tag_id = tg.id and tt_req.language_code = ${lang}
      left join tags_translations tt_en on tt_en.tag_id = tg.id and tt_en.language_code = 'en'
      where tl.entity_type = ${'<entity_type>'} and tl.entity_id = <alias>.id
    )`.as('tags')
    ```

---

## Logging & Errors

- **Logging**
  - `globalThis.logger?.info('Entity listed', { page, pageSize, count, search, sort, direction, lang, ...filters, tag_ids, tags, count_tags, timeMs })`
  - `globalThis.logger?.info('Entity fetched', { id, lang, timeMs })`
  - Warnings for destructive ops (e.g., deletes).
  - Errors logged with `error.message`.

- **Errors**
  - Use H3 `createError({ statusCode, statusMessage })`.
  - Typical codes:
    - 400: invalid input (Zod), invalid id.
    - 401: authentication required/invalid token.
    - 404: entity not found.

---

## Example: /api/world

### GET /api/world
List worlds with pagination, filtering, sorting, and AND-joined tag filters.

- Query params
  - `page`, `pageSize`
  - `q` or `search`
  - `lang` (fallback `'en'`)
  - `status`, `is_active`, `created_by`
  - `tag_ids` (string or array)
  - `tags` (string or array; comma-separated or JSON)

- Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "Gaia",
      "name": "Mundo de Gaia",
      "short_text": "...",
      "description": "...",
      "language_code_resolved": "es",
      "create_user": "admin",
      "tags": [
        { "id": 2, "name": "Naturaleza", "language_code_resolved": "es" },
        { "id": 5, "name": "Equilibrio", "language_code_resolved": "en" }
      ]
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalItems": 1, "count": 1, "search": null }
}
```

- Internal logic
  - Double LEFT JOIN on `world_translations` for requested and `'en'`.
  - `coalesce(t_req.*, t_en.*)` selects for i18n fallback.
  - Subquery for `tags` using `tag_links`, translated with fallback.
  - `buildFilters` handles pagination, search, sorting, total count.
  - Tag AND filter through `having count(distinct tl.tag_id) = <filters_count>`.

- Errors
  - 400 invalid params, 401 (if guarded elsewhere), others bubbled.

---

## Example: /api/tag

### GET /api/tag
List tags with translations and parent name.

- Query params
  - `page`, `pageSize`, `search`
  - `lang`
  - `is_active`, `category`, `parent_id`
  - Sorting over: `created_at`, `modified_at`, `code`, `category`, `name`, `is_active`, `created_by`

- Response item fields
  - Base: `id, code, category, parent_id, sort, is_active, created_by, created_at, modified_at`
  - Translated: `name, short_text, description, language_code_resolved`
  - Parent: `parent_name` via `coalesce(tp_req.name, tp_en.name)`

- Notes
  - No tag aggregation here (this is the tag entity).
  - Create (`index.post`) inserts base + EN translation (transactional).
  - Update (`[id].put`) upserts translation for requested language (transactional).
  - Delete (`[id].delete`): if `lang=en`, deletes tag + translations; else deletes only translation.

---

## Quick Tips for Extending

- Add new fields? Update Zod schemas first, then select lists and detail queries, then `sortColumnMap`.
- Add new tag-bound entity? Follow existing pattern:
  - Translation joins and fallback.
  - `tags` aggregated subquery with `entity_type` and `<alias>.id`.
  - In list: implement tag AND filters for both `tag_ids` and `tags` with translation fallback in the WHERE subquery.
  - Extend list logging with `tag_ids`, `tags`, `count_tags`.

---

## Changelog Highlights (Recent)

- Added `tags` aggregation on list/detail for: world, world_card, arcana, base_card, skill, facet.
- Added AND filtering by multiple `tag_ids` and/or `tags` (translated name) to all list endpoints above.
- `tag` API list/detail now includes `parent_name` and allows filter by `parent_id`.

---

## Final Notes

- All queries use Kysely with typed `DB` interface defined in `server/database/types.ts`.
- Fallback to English (`'en'`) is consistent across endpoints.
- Responses and logging are standardized for observability and predictable client consumption.

If you need examples for a specific endpoint’s request/response or its filtering/sorting, check the corresponding file under `server/api/<entity>/` for the exact field set and log payload.