# Editorial + Translation Workflow — Migration Roadmap

> Generated: 2026-02-11
> Status: Proposal (not yet executed)

---

## Phase 1 — Backfill existing data (no schema changes)

**Goal:** Zero missing editorial_state/translation_state rows for all 7 core entities.

**DB changes:**
```sql
-- Run existing backfill:
psql -d tarot2 -f server/database/migrations/manual/2026_02_backfill_editorial_state.sql
```

**App changes:** None.

**Verification:**
```sql
-- Must return 0 for all entities:
SELECT et.code, count(*) AS missing
FROM (
  SELECT 'base_card' AS code, id FROM base_card
  UNION ALL SELECT 'world', id FROM world
  UNION ALL SELECT 'world_card', id FROM world_card
  UNION ALL SELECT 'facet', id FROM facet
  UNION ALL SELECT 'arcana', id FROM arcana
  UNION ALL SELECT 'base_skills', id FROM base_skills
  UNION ALL SELECT 'base_card_type', id FROM base_card_type
) e
JOIN entity_types et ON et.code = e.code
WHERE NOT EXISTS (
  SELECT 1 FROM editorial_state es
  WHERE es.entity_type = et.id AND es.entity_id = e.id
)
GROUP BY et.code;
```
```bash
STRICT=1 bash smoke_test.sh  # exit 0, pre-existing drift = 0
```

**Rollback:** Backfill is additive (INSERT ... WHERE NOT EXISTS). No rollback needed; rows can be deleted manually if necessary.

---

## Phase 2 — Add FK constraint: editorial_state → entity tables

**Goal:** Prevent orphan editorial_state rows at the DB level.

**DB changes:**
```sql
BEGIN;

-- base_card
ALTER TABLE editorial_state
  ADD CONSTRAINT fk_es_base_card
  CHECK (entity_type != get_entity_type_id('base_card')
         OR entity_id IN (SELECT id FROM base_card))
  NOT VALID;

-- Validate after confirming no violations:
-- ALTER TABLE editorial_state VALIDATE CONSTRAINT fk_es_base_card;
COMMIT;
```

> **Note:** True polymorphic FKs are not possible in Postgres. Options:
> - **Option A (recommended):** Rely on app-level cleanup (onBaseDelete) + periodic health-check queries. No DB constraint.
> - **Option B:** Add per-entity CHECK constraints with NOT VALID + deferred validation.
> - **Option C:** Add trigger-based FK enforcement.
>
> **Recommendation: Option A.** The app already guarantees cleanup. DB constraints for polymorphic tables add complexity without proportional safety.

**App changes:** None.

**Verification:** Health-check orphan query (see Phase 5).

**Rollback:**
```sql
ALTER TABLE editorial_state DROP CONSTRAINT IF EXISTS fk_es_base_card;
```

---

## Phase 3 — Add missing indexes for query performance

**Goal:** Ensure editorial_state and translation_state queries are indexed for all access patterns.

**DB changes:**
```sql
BEGIN;

-- editorial_state: already has UNIQUE(entity_type, entity_id) and idx_editorial_status_created
-- Add index for per-entity lookups by status (used in list filters):
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_editorial_state_type_status
  ON editorial_state (entity_type, status);

-- Add index for orphan detection queries:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_editorial_state_type_id
  ON editorial_state (entity_type, entity_id);
-- ^ This is already covered by the UNIQUE constraint, so skip if redundant.

-- translation_state: already has PK(entity_type, entity_id, language_code)
-- Add index for per-entity language listing:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_translation_state_entity
  ON translation_state (entity_type, entity_id);
-- ^ Already exists (idx_translation_state_entity). Verify:
-- \di idx_translation_state_entity

COMMIT;
```

**App changes:** None.

**Verification:**
```sql
-- Confirm indexes exist:
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('editorial_state', 'translation_state')
ORDER BY tablename, indexname;
```

**Rollback:**
```sql
DROP INDEX CONCURRENTLY IF EXISTS idx_editorial_state_type_status;
```

---

## Phase 4 — Wire onEntityCreate for remaining 6 entities

**Goal:** All 7 entities create editorial_state at insert time (not just base_card).

**DB changes:** None.

**App changes:** Add `onEntityCreate` hook to each CRUD config (world, world_card, facet, arcana, skill, card_type) — same pattern as base_card:
```typescript
onEntityCreate: async (entityId, baseData, userId) => {
  const db = globalThis.db
  if (!db) return
  await upsertEditorialState(db, '<entity_types.code>', entityId, {
    status: typeof baseData.status === 'string' ? baseData.status : 'draft',
    isActive: typeof baseData.is_active === 'boolean' ? baseData.is_active : true,
    createdBy: userId,
    updatedBy: userId,
  })
},
```

**Verification:**
- Extend smoke_test.sh to create+delete one entity per type (or add per-entity integration tests).
- Run backfill health-check query — must return 0.

**Rollback:** Remove `onEntityCreate` hooks. Backfill covers any gap.

---

## Phase 5 — CI health-check + monitoring

**Goal:** Automated drift and orphan detection in CI pipeline.

**DB changes:** None.

**App changes:**
- Add `GET /api/admin/health/editorial` endpoint (admin-only) that runs health-check queries and returns JSON.
- Or: add a CLI script `scripts/check_editorial_health.sh`.

**Verification:** Integrate into CI:
```bash
STRICT=1 bash smoke_test.sh
psql -d tarot2 -f scripts/check_editorial_health.sql
```

**Rollback:** N/A (read-only).

---

## Minimal Migration Plan — Recommended Constraints & Indexes

```sql
-- =============================================================================
-- Migration: editorial_state + translation_state hardening
-- Safe to run on live DB (uses CONCURRENTLY, no locks)
-- =============================================================================

-- 1. Index for editorial_state filtered queries by entity_type + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_editorial_state_type_status
  ON editorial_state (entity_type, status);

-- 2. Index for editorial_state lookups by updated_by (audit queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_editorial_state_updated_by
  ON editorial_state (updated_by) WHERE updated_by IS NOT NULL;

-- 3. Verify existing indexes cover primary access patterns:
--    - UNIQUE(entity_type, entity_id) → single-entity lookup ✓
--    - idx_editorial_status_created → status + created_at DESC ✓
--    - idx_translation_state_entity → entity_type + entity_id ✓
--    - PK(entity_type, entity_id, language_code) → translation lookup ✓

-- 4. NOT NULL constraint on editorial_state.status (already NOT NULL, confirm):
-- ALTER TABLE editorial_state ALTER COLUMN status SET NOT NULL;

-- 5. CHECK constraint: status must be valid card_status enum (already enforced by type)
-- No action needed.
```

---

## Health-Check Queries

### Drift: entities missing editorial_state
```sql
SELECT et.code AS entity, count(*) AS missing_editorial_state
FROM (
  SELECT 'base_card' AS code, id FROM base_card
  UNION ALL SELECT 'world', id FROM world
  UNION ALL SELECT 'world_card', id FROM world_card
  UNION ALL SELECT 'facet', id FROM facet
  UNION ALL SELECT 'arcana', id FROM arcana
  UNION ALL SELECT 'base_skills', id FROM base_skills
  UNION ALL SELECT 'base_card_type', id FROM base_card_type
) e
JOIN entity_types et ON et.code = e.code
WHERE NOT EXISTS (
  SELECT 1 FROM editorial_state es
  WHERE es.entity_type = et.id AND es.entity_id = e.id
)
GROUP BY et.code
HAVING count(*) > 0;
```

### Orphans: editorial_state rows without matching entity
```sql
SELECT et.code AS entity, count(*) AS orphan_editorial_state
FROM editorial_state es
JOIN entity_types et ON et.id = es.entity_type
WHERE (et.code = 'base_card'      AND NOT EXISTS (SELECT 1 FROM base_card      WHERE id = es.entity_id))
   OR (et.code = 'world'          AND NOT EXISTS (SELECT 1 FROM world          WHERE id = es.entity_id))
   OR (et.code = 'world_card'     AND NOT EXISTS (SELECT 1 FROM world_card     WHERE id = es.entity_id))
   OR (et.code = 'facet'          AND NOT EXISTS (SELECT 1 FROM facet          WHERE id = es.entity_id))
   OR (et.code = 'arcana'         AND NOT EXISTS (SELECT 1 FROM arcana         WHERE id = es.entity_id))
   OR (et.code = 'base_skills'    AND NOT EXISTS (SELECT 1 FROM base_skills    WHERE id = es.entity_id))
   OR (et.code = 'base_card_type' AND NOT EXISTS (SELECT 1 FROM base_card_type WHERE id = es.entity_id))
GROUP BY et.code
HAVING count(*) > 0;
```

### Orphans: translation_state rows without matching entity
```sql
SELECT et.code AS entity, count(*) AS orphan_translation_state
FROM translation_state ts
JOIN entity_types et ON et.id = ts.entity_type
WHERE (et.code = 'base_card'      AND NOT EXISTS (SELECT 1 FROM base_card      WHERE id = ts.entity_id))
   OR (et.code = 'world'          AND NOT EXISTS (SELECT 1 FROM world          WHERE id = ts.entity_id))
   OR (et.code = 'world_card'     AND NOT EXISTS (SELECT 1 FROM world_card     WHERE id = ts.entity_id))
   OR (et.code = 'facet'          AND NOT EXISTS (SELECT 1 FROM facet          WHERE id = ts.entity_id))
   OR (et.code = 'arcana'         AND NOT EXISTS (SELECT 1 FROM arcana         WHERE id = ts.entity_id))
   OR (et.code = 'base_skills'    AND NOT EXISTS (SELECT 1 FROM base_skills    WHERE id = ts.entity_id))
   OR (et.code = 'base_card_type' AND NOT EXISTS (SELECT 1 FROM base_card_type WHERE id = ts.entity_id))
GROUP BY et.code
HAVING count(*) > 0;
```

### Status consistency: editorial_state.status vs entity.status
```sql
SELECT et.code AS entity, count(*) AS status_mismatch
FROM editorial_state es
JOIN entity_types et ON et.id = es.entity_type
LEFT JOIN base_card      bc  ON et.code = 'base_card'      AND bc.id  = es.entity_id
LEFT JOIN world          w   ON et.code = 'world'          AND w.id   = es.entity_id
LEFT JOIN world_card     wc  ON et.code = 'world_card'     AND wc.id  = es.entity_id
LEFT JOIN facet          f   ON et.code = 'facet'          AND f.id   = es.entity_id
LEFT JOIN arcana         a   ON et.code = 'arcana'         AND a.id   = es.entity_id
LEFT JOIN base_skills    bs  ON et.code = 'base_skills'    AND bs.id  = es.entity_id
LEFT JOIN base_card_type bct ON et.code = 'base_card_type' AND bct.id = es.entity_id
WHERE es.status != COALESCE(
  bc.status, w.status, wc.status, f.status, a.status, bs.status, bct.status
)
GROUP BY et.code
HAVING count(*) > 0;
```

---

## CI Plan

### Now (smoke_test.sh STRICT=1)
- ✅ Auth login succeeds
- ✅ editorial/state endpoint returns 200 or 404 (not 500)
- ✅ translation/state missing → data:null
- ✅ Create base_card → editorial_state exists (HTTP 200)
- ✅ Create base_card → translation_state exists
- ✅ Delete translation → translation_state gone
- ✅ Delete base → editorial_state gone (HTTP 404)
- ✅ Delete base → translation_state gone
- ✅ Delete base → entity returns 404
- ✅ Pre-existing drift reported (WARN, not FAIL)
- ✅ New entity drift = 0 (FAIL if > 0)

### Next (after Phase 1 backfill)
- Pre-existing drift = 0 (promote from WARN to FAIL)
- Orphan count = 0 (add SQL health-check step)

### Later (after Phase 4)
- Create+delete cycle for each entity type (not just base_card)
- Status consistency check (editorial_state.status matches entity.status)
- Translation coverage report (entities with < N languages translated)

---

## Risks

1. **Backfill run order** — If backfill runs before app deploy with onBaseDelete, entities deleted between backfill and deploy will leave orphans. **Mitigation:** Deploy app first, then backfill.

2. **Polymorphic FK gap** — No DB-level FK prevents orphans. App-level cleanup is the only guard. **Mitigation:** Periodic health-check queries in CI; alert on orphan count > 0.

3. **Status drift** — editorial_state.status can diverge from entity.status if status updates bypass the editorial workflow. **Mitigation:** Status consistency health-check query; ensure all status transitions go through editorial pipeline.

4. **Cascade deletes** — Some entities have ON DELETE CASCADE (e.g., facet → arcana, world_card → world). If a parent is deleted, child entities vanish but their editorial_state/translation_state rows remain. **Mitigation:** Wire onBaseDelete for parent entities to also clean child state, or add cascade-aware cleanup. Short-term: periodic orphan cleanup script.

5. **Missing onEntityCreate for 6 entities** — Only base_card currently creates editorial_state on insert. Other entities rely on backfill. **Mitigation:** Phase 4 wires all 7 entities. Until then, backfill covers the gap.
