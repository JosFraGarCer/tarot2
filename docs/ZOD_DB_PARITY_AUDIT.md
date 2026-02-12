# Zod ↔ Postgres Parity Audit — Tarot2

> Generated: 2026-02-11
> Sources: `docs/SCHEMA POSTGRES.TXT`, `shared/schemas/**`, `server/api/**/_crud.ts`
> Scope: core entities only (base_card, world, world_card, facet, arcana, base_skills, base_card_type)

---

## Methodology

For each entity, I identified DB columns that are **NOT NULL with no DEFAULT**.
Then I checked whether the Zod **create** schema requires them, and whether `buildCreatePayload` passes them to the insert.

A mismatch means: if the field is omitted from the POST body, the insert will fail with a NOT NULL violation.

---

## Summary Table

| Entity | Field | DB Constraint | Zod Create | Handler Passes? | Severity | Status |
|---|---|---|---|---|---|---|
| **base_card** | `code` | `text NOT NULL` (UNIQUE) | required (`min(1)`) | ✅ yes | — | OK |
| **base_card** | `card_type_id` | `int4 NOT NULL` (FK) | required (`positive()`) | ✅ yes | — | OK |
| **base_card** | `card_family` | `text NOT NULL`, no default | required (`min(1)`) | ✅ yes | — | **FIXED** (was P0) |
| **world** | `code` | `text NOT NULL` (UNIQUE) | required (`min(1)`) | ✅ yes | — | OK |
| **world_card** | `code` | `text NOT NULL` | required (`min(1)`) | ✅ yes | — | OK |
| **world_card** | `world_id` | `int4 NOT NULL` (FK) | required (`positive()`) | ✅ yes | — | OK |
| **facet** | `code` | `text NOT NULL` | required (`min(1)`) | ✅ yes | — | OK |
| **facet** | `arcana_id` | `int4 NOT NULL` (FK) | required (`positive()`) | ✅ yes | — | OK |
| **arcana** | `code` | `text NOT NULL` (UNIQUE) | required (`min(1)`) | ✅ yes | — | OK |
| **base_skills** | `code` | `varchar(50) NOT NULL` (UNIQUE) | required (`min(1)`) | ✅ yes | — | OK |
| **base_skills** | `facet_id` | `int4 NOT NULL` (FK) | required (`positive()`) | ✅ yes | — | OK |
| **base_card_type** | `code` | `text NOT NULL` (UNIQUE) | required (`min(1)`) | ✅ yes | — | OK |

---

## Columns with NOT NULL + DEFAULT (safe — no mismatch risk)

These columns have DB defaults and are safe even if omitted from the Zod schema:

| Column | DB Default | Entities |
|---|---|---|
| `status` | `'draft'::card_status` | all 7 entities |
| `is_active` | `true` | all 7 entities |
| `created_at` | `now()` | all 7 entities |
| `modified_at` | `now()` | all 7 entities |
| `sort` | `0` | arcana, facet, base_skills, base_card_type, world_card |
| `legacy_effects` | `false` | base_card, facet, base_skills, world_card |
| `metadata` | `'{}'::jsonb` | world, arcana, facet, base_card, base_card_type |
| `effects` | `'[]'::jsonb` | base_card, facet, base_skills, world_card |

---

## Nullable columns (safe — no mismatch risk)

These are `NULL`-able and never cause NOT NULL violations:

`image`, `created_by`, `updated_by`, `content_version_id`, `base_card_id` (world_card), `is_override` (world_card)

---

## Potential Issues (P1 — Low Risk)

### P1-1: `baseEntityCreateFields.status` defaults to `'draft'` in Zod but handler may pass `undefined`

**Risk:** If `buildCreatePayload` includes `status: input.status` and the Zod default wasn't applied before reaching the handler, the insert could send `undefined`. However, Zod `.default('draft')` applies during `.parse()`, so `input.status` is always `'draft'` at minimum.

**Verdict:** Safe. No action needed.

### P1-2: `baseEntityCreateFields.is_active` defaults to `true` in Zod

Same analysis as P1-1. Zod default applies during parse. Safe.

### P1-3: `created_by` / `updated_by` set by handler, not Zod

These are set to `ctx.user?.id ?? null` in `buildCreatePayload`. They're nullable in DB, so `null` is safe. No mismatch.

---

## Potential Issues (P2 — Informational)

### P2-1: Zod `image` accepts `z.string().url()` but DB is plain `text`

Zod is stricter than DB. This is correct (Zod validates, DB stores). No mismatch.

### P2-2: `base_card.is_active` DB default is `true NULL` (unusual)

```sql
is_active bool DEFAULT true NULL
```

The column allows NULL despite having a default. Zod create schema defaults to `true` (boolean). Handler passes `input.is_active`. Safe, but the DB schema is unusual — most other entities have `NOT NULL`.

**Recommendation:** Future migration should add `NOT NULL` constraint to `base_card.is_active` for consistency.

### P2-3: `world_card.is_override` DB default is `false NULL`

Same pattern as P2-2. Allows NULL despite having a default. Zod defaults to `false`. Safe.

### P2-4: `base_skills.code` is `varchar(50)` but Zod uses `z.string().min(1)` (no max)

Zod doesn't enforce the 50-char limit. A long code would pass Zod validation but fail at DB level.

**Recommendation:** Add `.max(50)` to `skillCreateSchema.code` and `skillUpdateSchema.code`.

---

## Previously Fixed (P0)

### ~~P0-1: `base_card.card_family` — NOT NULL, no default, Zod was optional~~

**Fixed in this session.** `baseCardCreateSchema.card_family` changed from `z.string().optional()` to `z.string().min(1, 'card_family is required')`.

---

## Failing Payload Examples

### Before fix — would fail:

```json
POST /api/base_card
{
  "code": "test_card",
  "card_type_id": 1,
  "name": "Test Card",
  "lang": "en"
}
```
→ `null value in column "card_family" of relation "base_card" violates not-null constraint`

### After fix — correct:

```json
POST /api/base_card
{
  "code": "test_card",
  "card_type_id": 1,
  "card_family": "major_arcana",
  "name": "Test Card",
  "lang": "en"
}
```

### Would fail if base_skills code > 50 chars:

```json
POST /api/skill
{
  "code": "this_is_a_very_long_skill_code_that_exceeds_fifty_characters_limit",
  "facet_id": 1,
  "name": "Long Skill",
  "lang": "en"
}
```
→ DB `varchar(50)` constraint violation

---

## Minimal Fix Plan

| Priority | Entity | Field | Fix | Effort |
|---|---|---|---|---|
| ~~P0~~ | ~~base_card~~ | ~~card_family~~ | ~~Make required in Zod~~ | ~~Done~~ |
| P2 | base_skills | code | Add `.max(50)` to Zod create+update schemas | 2 lines |
| P2 | base_card | is_active | Future migration: add `NOT NULL` to DB column | Migration |
| P2 | world_card | is_override | Future migration: add `NOT NULL` to DB column | Migration |

---

## Conclusion

After the `card_family` fix, **all core entities have correct Zod ↔ DB parity for NOT NULL columns**. The only remaining gap is the `base_skills.code` varchar(50) length limit not enforced in Zod (P2, informational). All other NOT NULL columns either have DB defaults or are correctly required in Zod schemas.
