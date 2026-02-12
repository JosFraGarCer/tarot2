# Tarot2 — Database & Editorial System Audit Report

> **Date**: 2026-02-11
> **Scope**: Full schema review (`SCHEMA POSTGRES.TXT`), editorial workflow, translation lifecycle, versioning/release semantics, integrity, performance.
> **Role**: Postgres data model architect + editorial workflow systems designer + integrity/performance reviewer.
> **Prerequisite**: Builds on `SCHEMA_AUDIT_REPORT.md` (same date). This report assumes familiarity with that document's findings and extends them with deeper editorial, translation, versioning, and administration analysis.

---

## 1. Executive Summary (Top 10)

1. **Dual source of truth is the #1 operational risk.** Seven core tables carry `status`, `is_active`, `content_version_id`, `created_by`, `updated_by` that duplicate `editorial_state`. Until cutover completes, every write is a divergence opportunity. A phased migration plan exists (SCHEMA_AUDIT_REPORT §4) but no automated divergence detector runs yet.

2. **`editorial_state` is structurally sound but not yet authoritative.** It has the right shape (UNIQUE on entity_type+entity_id, FK to entity_types, FK to content_versions, FK to users). But the application still reads/writes core table columns for editorial decisions. The table is ready; the application is not.

3. **`translation_state` is well-designed but under-instrumented.** The "absence = missing" model is correct and elegant. However, it lacks: (a) a `base_language_snapshot_at` timestamp to detect stale translations, (b) any link to the translation row it tracks, and (c) dashboard views to surface backlogs.

4. **Version Model B (`world_content_pins` + `content_version_entities`) is functional but has no safety rails.** Nothing prevents: pinning a world to an empty version, pinning to a version that doesn't include the world itself, or mutating a manifest after a world is pinned to it. These are silent data corruption vectors.

5. **Polymorphic `(entity_type, entity_id)` is used in 8+ tables without enforceable FK.** Orphan risk is real. The orphan detection views proposed in SCHEMA_AUDIT_REPORT P8 are necessary but not yet created. No cleanup triggers exist.

6. **`entity_type` dialect split (`int2` vs `varchar(50)`) blocks cross-table JOINs.** New tables use `int2` FK to `entity_types`; legacy tables use `varchar(50)` with CHECK constraints. This forces `get_entity_type_id()` calls or subqueries for every cross-table operation.

7. **Translation tables are inconsistent in audit columns.** 5 of 10 translation tables lack `created_at`/`modified_at` and triggers. This blocks translation dashboards and stale-translation detection.

8. **`editorial_metrics` is a denormalized cache with no integrity.** No PK, no UNIQUE, no FK, nullable columns. It should be either hardened (PK + FK + trigger) or replaced with a materialized view.

9. **`content_versions` has no lifecycle semantics.** No `is_published`, no `published_at`, no `frozen_at`. A version can be mutated after worlds are pinned to it. There is no way to distinguish "in development" from "released" from "frozen" versions.

10. **The editorial audit log (`editorial_audit_log`) exists in migrations but is not in the current schema dump.** Either it hasn't been applied or the dump is stale. This table is critical for traceability and should be verified.

---

## 2. System Strengths

### 2.1 What's Already Good

- **`editorial_state` design is clean.** Composite UNIQUE on `(entity_type, entity_id)`, proper FKs, `card_status` ENUM, timestamps with trigger. Ready to be the single authority.

- **`translation_state` with composite PK `(entity_type, entity_id, language_code)`.** Elegant. Absence = missing is the right model for a translation backlog system. The `translation_status` ENUM (`draft`, `review`, `approved`, `rejected`) is simpler and more appropriate than reusing `card_status`.

- **`entity_types` normalization.** Having a lookup table with `int2` IDs is correct for the polymorphic pattern. The `get_entity_type_id()` helper function is a good bridge.

- **`content_version_entities` as a manifest.** Explicit inclusion (not implicit "everything at this status") is the right model for TTRPG releases where you want precise control over what ships.

- **`world_content_pins` with `ON DELETE RESTRICT` on `content_version_id`.** Prevents accidental deletion of a version that a world depends on. Good safety.

- **`entity_relations` for semantic/editorial relationships.** Correct separation from structural FKs (facet→arcana, base_card→base_card_type). The UNIQUE index prevents duplicate relations.

- **Consistent `set_modified_at()` trigger pattern** on core tables and most translation tables. Good foundation for audit.

- **`card_status` ENUM with a well-defined state machine** in `shared/editorial/transitions.ts`. The transition graph is explicit, permission-guarded, and content-guarded for publication.

- **`content_feedback` with `feedback_status` ENUM** and proper entity+language indexing. Good for per-translation review comments.

- **`v_empty_content_versions` view** already exists for detecting empty manifests. Good defensive view.

---

## 3. Schema Inventory and Domain Mapping

### 3.1 Core Editorial Entities

| Entity | Content Table | Translation Table | Has `created_at`/`modified_at` trigger | Has `legacy_effects`/`effects` |
|---|---|---|---|---|
| Arcana | `arcana` | `arcana_translations` | ✅ / ❌ translations | ❌ |
| Facet | `facet` | `facet_translations` | ✅ / ❌ translations | ✅ |
| Base Card Type | `base_card_type` | `base_card_type_translations` | ✅ / ❌ translations | ❌ |
| Base Card | `base_card` | `base_card_translations` | ✅ / ✅ translations | ✅ |
| Base Skills | `base_skills` | `base_skills_translations` | ✅ / ✅ translations | ✅ |
| World | `world` | `world_translations` | ✅ / ✅ translations | ❌ |
| World Card | `world_card` | `world_card_translations` | ✅ / ✅ translations | ✅ |

### 3.2 Supporting/Catalog Entities

| Entity | Table | Translation Table | Participates in editorial_state? |
|---|---|---|---|
| Effect Type | `effect_type` | `effect_type_translations` | No (has own `status`/`is_active`) |
| Effect Target | `effect_target` | `effect_target_translations` | No (has own `status`/`is_active`) |
| Tags | `tags` | `tags_translations` | No |
| Card Effects | `card_effects` | — | No (has `validation_state`) |

### 3.3 Editorial Infrastructure

| Table | Purpose | Uses `int2` entity_type? |
|---|---|---|
| `editorial_state` | Single authority for status/active/version per entity | ✅ |
| `translation_state` | Translation lifecycle per entity+language | ✅ |
| `content_version_entities` | Version manifest (which entities are in which version) | ✅ |
| `entity_relations` | Semantic/editorial relationships between entities | ✅ |
| `editorial_metrics` | Denormalized counts (feedback, revisions, translations) | ✅ (but no FK) |
| `content_versions` | Global release milestones | N/A |
| `world_content_pins` | Per-world version selection | N/A |
| `content_feedback` | Review comments per entity+language | ❌ (varchar) |
| `content_revisions` | Change history per entity | ❌ (varchar) |
| `editorial_audit_log` | Status transition history | ❌ (varchar, if exists) |
| `tag_links` | Entity-tag associations | ❌ (varchar) |
| `card_effects` | Effect instances per entity | ❌ (varchar) |

### 3.4 Data Flow Diagram (Text)

```
AUTHORING FLOW:
  User → creates/edits → [core content table] + [translation table]
       → triggers → set_modified_at on content table
       → application writes → editorial_state (status, updated_by, modified_at)
       → application writes → translation_state (per language)
       → application writes → content_revisions (snapshot)
       → application writes → editorial_audit_log (on status change)

REVIEW FLOW:
  Reviewer → reads → editorial_state (review queue)
           → reads → content_feedback (open items)
           → reads → translation_state (translation backlog)
           → writes → editorial_state (status transition)
           → writes → content_feedback (comments)

PUBLISHING FLOW:
  Publisher → reads → editorial_state (approved entities)
           → writes → content_version_entities (add to manifest)
           → writes → editorial_state (status → published)
           → writes → world_content_pins (pin world to version)

ADMIN DASHBOARD:
  Admin → reads → editorial_state + editorial_metrics (overview)
        → reads → translation_state (per-language progress)
        → reads → content_version_entities (version contents)
        → reads → world_content_pins (world→version mapping)
```

---

## 4. Editorial State System Review

### 4.1 Is `editorial_state` the Intended Authority?

**Yes, by design. No, in practice.**

The table has the correct structure to be the single source of truth for:
- `status` (card_status ENUM)
- `is_active` (boolean)
- `content_version_id` (FK to content_versions)
- `created_by` / `updated_by` (FK to users)
- `created_at` / `modified_at` (timestamps)

But the application (`createCrudHandlers.ts`) still reads and writes these columns on core tables. The Zod schemas (`baseEntityFields` in `shared/schemas/common.ts`) include `status`, `is_active`, `content_version_id`, `created_by` — meaning the API contract exposes these from core tables, not from `editorial_state`.

### 4.2 Double Source of Truth: Where Divergence Can Happen

| Scenario | Risk | Likelihood |
|---|---|---|
| Application writes `status` to core table but not `editorial_state` | **Critical** — silent divergence | Medium (any code path that bypasses `createCrudHandlers`) |
| Application writes `editorial_state` but not core table | **Medium** — dashboard shows one thing, API returns another | Medium (during migration) |
| Direct SQL update to core table (admin fix, migration) | **Critical** — `editorial_state` not updated | High (operational reality) |
| Bulk import/seed that populates core tables without `editorial_state` rows | **Critical** — entities invisible to editorial dashboard | Medium |
| `content_version_id` updated in one place but not the other | **High** — entity appears in wrong version | Medium |

### 4.3 Invariants

#### MUST (enforce at DB level where possible)

| ID | Invariant | Current State | Enforcement |
|---|---|---|---|
| I1 | Every core entity has exactly one `editorial_state` row | Not enforced | Application-level (should add trigger on INSERT to core tables) |
| I2 | `editorial_state.status` is the authoritative status | Not enforced | Application reads core table `status` |
| I3 | `editorial_state.(entity_type, entity_id)` is UNIQUE | ✅ Enforced | DB UNIQUE constraint |
| I4 | `editorial_state.entity_type` references `entity_types` | ✅ Enforced | DB FK |
| I5 | `editorial_state.content_version_id` references `content_versions` | ✅ Enforced | DB FK |
| I6 | Status transitions follow the state machine | Not enforced at DB | Application-level (`canTransition`) |

#### SHOULD (enforce at application level, verify periodically)

| ID | Invariant | Current State |
|---|---|---|
| S1 | `editorial_state.status` = core table `.status` (during dual-write) | Not verified automatically |
| S2 | `editorial_state.is_active` = core table `.is_active` (during dual-write) | Not verified automatically |
| S3 | `editorial_state.content_version_id` = core table `.content_version_id` | Not verified automatically |
| S4 | No orphan `editorial_state` rows (entity deleted but state remains) | Not verified |
| S5 | No missing `editorial_state` rows (entity exists but no state) | Not verified |

### 4.4 Should `created_at`/`modified_at` Remain in Content Tables?

**Yes.** These timestamps serve different purposes:

| Column | In Content Table | In `editorial_state` |
|---|---|---|
| `created_at` | When the **content** was first authored | When the **editorial record** was created (should be same, but semantically different) |
| `modified_at` | When the **content** was last edited (text, effects, metadata) | When the **editorial state** was last changed (status transition, version assignment) |

A content edit that doesn't change status should update `content_table.modified_at` but NOT `editorial_state.modified_at`. A status transition should update `editorial_state.modified_at` but NOT `content_table.modified_at` (unless the transition itself modifies content).

**Recommendation**: Keep `created_at`/`modified_at` in content tables permanently. Only `status`, `is_active`, `content_version_id`, `created_by`, `updated_by` are candidates for removal.

### 4.5 Migration Path Recommendation

The phased plan in SCHEMA_AUDIT_REPORT §4 is correct. Additions:

**Phase 0.5 — Automated Divergence Detection (add before Phase 2)**

```sql
-- Run as a scheduled check or before any deployment
CREATE OR REPLACE VIEW v_editorial_divergence AS
SELECT
  et.code AS entity_code,
  es.entity_id,
  'status' AS field,
  es.status::text AS editorial_value,
  CASE et.code
    WHEN 'arcana' THEN (SELECT status::text FROM arcana WHERE id = es.entity_id)
    WHEN 'facet' THEN (SELECT status::text FROM facet WHERE id = es.entity_id)
    WHEN 'base_card' THEN (SELECT status::text FROM base_card WHERE id = es.entity_id)
    WHEN 'base_card_type' THEN (SELECT status::text FROM base_card_type WHERE id = es.entity_id)
    WHEN 'base_skills' THEN (SELECT status::text FROM base_skills WHERE id = es.entity_id)
    WHEN 'world' THEN (SELECT status::text FROM world WHERE id = es.entity_id)
    WHEN 'world_card' THEN (SELECT status::text FROM world_card WHERE id = es.entity_id)
  END AS core_value
FROM editorial_state es
JOIN entity_types et ON et.id = es.entity_type
HAVING es.status::text IS DISTINCT FROM CASE et.code
    WHEN 'arcana' THEN (SELECT status::text FROM arcana WHERE id = es.entity_id)
    WHEN 'facet' THEN (SELECT status::text FROM facet WHERE id = es.entity_id)
    WHEN 'base_card' THEN (SELECT status::text FROM base_card WHERE id = es.entity_id)
    WHEN 'base_card_type' THEN (SELECT status::text FROM base_card_type WHERE id = es.entity_id)
    WHEN 'base_skills' THEN (SELECT status::text FROM base_skills WHERE id = es.entity_id)
    WHEN 'world' THEN (SELECT status::text FROM world WHERE id = es.entity_id)
    WHEN 'world_card' THEN (SELECT status::text FROM world_card WHERE id = es.entity_id)
  END;
```

> **Note**: This view is expensive (correlated subqueries). It should be run as a periodic health check, not as a dashboard query. A simpler per-entity-type version using explicit JOINs (as in SCHEMA_AUDIT_REPORT §4 Phase 0) is preferred for frequent use.

**Phase 1.5 — Auto-create `editorial_state` on INSERT (add before Phase 2)**

```sql
-- Generic trigger: when a core entity is inserted, create its editorial_state row
CREATE OR REPLACE FUNCTION auto_create_editorial_state()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_type_id int2;
BEGIN
  SELECT id INTO v_type_id FROM entity_types WHERE code = TG_ARGV[0];
  INSERT INTO editorial_state (entity_type, entity_id, status, is_active, content_version_id, created_by, updated_by)
  VALUES (v_type_id, NEW.id, NEW.status, COALESCE(NEW.is_active, true), NEW.content_version_id, NEW.created_by, NEW.updated_by)
  ON CONFLICT (entity_type, entity_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Apply to each core table:
CREATE TRIGGER trg_arcana_auto_editorial
  AFTER INSERT ON arcana
  FOR EACH ROW EXECUTE FUNCTION auto_create_editorial_state('arcana');

-- Repeat for: facet, base_card, base_card_type, base_skills, world, world_card
```

This ensures I1 (every entity has an editorial_state row) is enforced at DB level during the transition period.

---

## 5. Translation System Review

### 5.1 Is "Missing = Absence of Row" Sufficient?

**For backlog detection: yes.** The query "find all active entities without a translation in language X" is a clean anti-join:

```sql
SELECT es.entity_type, es.entity_id
FROM editorial_state es
WHERE es.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM translation_state ts
    WHERE ts.entity_type = es.entity_type
      AND ts.entity_id = es.entity_id
      AND ts.language_code = 'es'
  );
```

**Edge cases where absence is insufficient:**

| Scenario | Problem | Mitigation |
|---|---|---|
| Translation row exists in `*_translations` table but no `translation_state` row | Translation exists but is invisible to the dashboard | Sync trigger or periodic check |
| `translation_state` row exists but translation row was deleted | State says "approved" but content is gone | Periodic integrity check |
| Translation was approved but base content changed since | Translation is stale but still marked "approved" | Need `base_content_modified_at` comparison |

### 5.2 Recommended Metadata Additions

| Field | Purpose | Justification |
|---|---|---|
| `base_snapshot_at timestamptz` | Timestamp of the base (English) content when this translation was last updated | Enables stale-translation detection: if `base_card.modified_at > translation_state.base_snapshot_at`, the translation may be outdated |
| `reviewed_by int4` | Who approved/rejected this translation | Currently only `updated_by` exists, which could be the translator or the reviewer |
| `notes text` | Reviewer notes on the translation | Parallel to `content_feedback` but lightweight and inline |

**Minimal viable addition** (only `base_snapshot_at`):

```sql
ALTER TABLE translation_state
  ADD COLUMN IF NOT EXISTS base_snapshot_at timestamptz;

COMMENT ON COLUMN translation_state.base_snapshot_at IS
  'Timestamp of the base-language content when this translation was last synced. If base content modified_at > this value, translation may be stale.';
```

### 5.3 Translation Table Audit Consistency

As documented in SCHEMA_AUDIT_REPORT §2.7, 5 of 10 translation tables lack timestamps:

| Missing timestamps | Tables |
|---|---|
| `created_at`, `modified_at`, trigger | `arcana_translations`, `facet_translations`, `base_card_type_translations`, `effect_target_translations`, `effect_type_translations` |

**Impact**: Without `modified_at` on translation tables, there is no way to:
- Detect when a translation was last touched
- Compare translation freshness to base content freshness
- Build "recently translated" dashboards
- Populate `translation_state.base_snapshot_at` automatically

**Recommendation**: Apply SCHEMA_AUDIT_REPORT P5 (add timestamps + triggers) as a prerequisite for any translation dashboard work.

### 5.4 Translation Dashboard Queries

#### Per-language backlog (entities missing translation)

```sql
-- Parameterized by :lang
SELECT et.code AS entity_code, es.entity_id, es.status AS editorial_status
FROM editorial_state es
JOIN entity_types et ON et.id = es.entity_type
WHERE es.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM translation_state ts
    WHERE ts.entity_type = es.entity_type
      AND ts.entity_id = es.entity_id
      AND ts.language_code = :lang
  )
ORDER BY es.modified_at DESC;
```

**Index needed**: `idx_translation_state_entity_lang` already exists on `(entity_type, entity_id)` and `(language_code)` separately. The composite PK `(entity_type, entity_id, language_code)` covers the anti-join efficiently.

#### Per-language progress summary

```sql
CREATE OR REPLACE VIEW v_translation_summary AS
SELECT
  ts.language_code,
  et.code AS entity_code,
  ts.status,
  count(*) AS count
FROM translation_state ts
JOIN entity_types et ON et.id = ts.entity_type
GROUP BY ts.language_code, et.code, ts.status
ORDER BY ts.language_code, et.code, ts.status;
```

#### Stale translations (requires `base_snapshot_at`)

```sql
-- After base_snapshot_at is added:
-- Find translations where base content has been modified since translation was last synced
-- This requires joining to the actual content table, which is entity-type-specific.
-- A per-type UNION is needed, or a trigger that updates translation_state when base content changes.
```

### 5.5 Recommended Indexes for Translation

```sql
-- Already exists (via PK): (entity_type, entity_id, language_code)
-- Already exists: idx_translation_state_lang_status (language_code, status)

-- NEW: For "stale translations" query (after base_snapshot_at is added)
CREATE INDEX idx_translation_state_stale
  ON translation_state (entity_type, entity_id, base_snapshot_at)
  WHERE status = 'approved';

-- NEW: For per-world translation backlog (join with content_version_entities)
-- No new index needed; the PK and idx_cve_entity cover this.
```

---

## 6. Versioning / Release Semantics (Model B)

### 6.1 Current Model

```
content_versions (id, version_semver, release_stage, ...)
    ↑
content_version_entities (content_version_id, entity_type, entity_id)  -- manifest
    ↑
world_content_pins (world_id → content_version_id)  -- per-world selection
```

**Semantics**: A world is pinned to a version. The version's manifest lists which entities are included. The world sees only those entities.

### 6.2 Capability Assessment

| Capability | Supported? | How |
|---|---|---|
| Per-world releases | ✅ | `world_content_pins` selects version per world |
| Rollback | ✅ Partially | Change `world_content_pins.content_version_id` to a previous version. But no "previous pin" history. |
| Staging vs production | ❌ | No `release_stage` semantics on pins. A world pinned to a `dev` version looks the same as one pinned to `release`. |
| Diff between versions | ✅ Partially | Compare `content_version_entities` rows between two version IDs. But no snapshot of entity state at pin time. |
| Freezing a version | ❌ | No `frozen_at` or `is_frozen` flag. Manifest can be mutated after worlds are pinned. |
| Clone version from previous | ❌ | No built-in mechanism. Must manually copy `content_version_entities` rows. |

### 6.3 Missing Safety Mechanisms

#### 6.3.1 Preventing Empty Manifests from Being Pinned

`v_empty_content_versions` exists to detect empty versions, but nothing prevents pinning a world to one.

```sql
-- Proposed: CHECK or trigger on world_content_pins
CREATE OR REPLACE FUNCTION check_version_has_manifest()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM content_version_entities
    WHERE content_version_id = NEW.content_version_id
  ) THEN
    RAISE EXCEPTION 'Cannot pin world % to version % — manifest is empty',
      NEW.world_id, NEW.content_version_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_world_pin_nonempty
  BEFORE INSERT OR UPDATE ON world_content_pins
  FOR EACH ROW EXECUTE FUNCTION check_version_has_manifest();
```

#### 6.3.2 Ensuring Pinned Version Includes the World Itself

A world pinned to a version should arguably be in that version's manifest. Currently not enforced.

```sql
-- Detection view
CREATE OR REPLACE VIEW v_world_not_in_own_version AS
SELECT
  wcp.world_id,
  wcp.content_version_id,
  cv.version_semver
FROM world_content_pins wcp
JOIN content_versions cv ON cv.id = wcp.content_version_id
WHERE NOT EXISTS (
  SELECT 1 FROM content_version_entities cve
  WHERE cve.content_version_id = wcp.content_version_id
    AND cve.entity_type = get_entity_type_id('world')
    AND cve.entity_id = wcp.world_id
);
```

> **Note**: This may be intentional (a world can pin to a version without being "in" it). Document the decision either way.

#### 6.3.3 Version Immutability After Pin

Once a world is pinned to a version, the manifest should not change (or changes should be audited).

**Option A — Soft freeze (recommended)**:

```sql
ALTER TABLE content_versions
  ADD COLUMN IF NOT EXISTS frozen_at timestamptz,
  ADD COLUMN IF NOT EXISTS frozen_by int4;

ALTER TABLE content_versions
  ADD CONSTRAINT fk_content_versions_frozen_by
    FOREIGN KEY (frozen_by) REFERENCES users(id) ON DELETE SET NULL;

-- Trigger: prevent manifest changes on frozen versions
CREATE OR REPLACE FUNCTION prevent_frozen_manifest_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM content_versions
    WHERE id = COALESCE(NEW.content_version_id, OLD.content_version_id)
      AND frozen_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot modify manifest of frozen version %',
      COALESCE(NEW.content_version_id, OLD.content_version_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_cve_frozen_guard
  BEFORE INSERT OR UPDATE OR DELETE ON content_version_entities
  FOR EACH ROW EXECUTE FUNCTION prevent_frozen_manifest_change();
```

**Option B — Auto-freeze on pin**: Automatically set `frozen_at` when a world pins to a version.

#### 6.3.4 Clone Version Operation

```sql
-- Admin operation: clone manifest from version A to new version B
-- This is a data operation, not a schema change.
INSERT INTO content_version_entities (content_version_id, entity_type, entity_id, added_by)
SELECT :new_version_id, entity_type, entity_id, :user_id
FROM content_version_entities
WHERE content_version_id = :source_version_id;
```

### 6.4 Version Invalid State Detector

```sql
CREATE OR REPLACE VIEW v_version_health AS
SELECT
  cv.id AS version_id,
  cv.version_semver,
  cv.release,
  cv.frozen_at IS NOT NULL AS is_frozen,
  (SELECT count(*) FROM content_version_entities cve WHERE cve.content_version_id = cv.id) AS manifest_count,
  (SELECT count(*) FROM world_content_pins wcp WHERE wcp.content_version_id = cv.id) AS pinned_world_count,
  -- Flag: empty manifest but has pinned worlds
  CASE WHEN
    (SELECT count(*) FROM content_version_entities cve WHERE cve.content_version_id = cv.id) = 0
    AND (SELECT count(*) FROM world_content_pins wcp WHERE wcp.content_version_id = cv.id) > 0
  THEN true ELSE false END AS is_empty_but_pinned,
  -- Flag: has orphaned manifest entries (entities that no longer exist)
  (SELECT count(*) FROM v_orphan_content_version_entities ocve
   WHERE ocve.content_version_id = cv.id) AS orphan_entity_count
FROM content_versions cv
ORDER BY cv.created_at DESC;
```

### 6.5 Recommended Admin Operations (Not Code)

| Operation | Purpose | Prerequisites |
|---|---|---|
| **Freeze version** | Mark a version as immutable | `frozen_at` column + trigger |
| **Clone version** | Create new version from existing manifest | INSERT...SELECT on `content_version_entities` |
| **Pin world to version** | Select which version a world uses | Validate manifest non-empty, optionally validate world is in manifest |
| **Unpin world** | Remove world's version selection | DELETE from `world_content_pins` |
| **Diff versions** | Show entities added/removed between two versions | Set difference on `content_version_entities` |
| **Validate version** | Check for orphans, empty manifest, unpublished entities in manifest | `v_version_health` view |

---

## 7. Integrity and Polymorphism Risk Assessment

### 7.1 Orphan Risk Map

| Polymorphic Table | Entity Deleted From | Orphan Row Contains | Cascade? |
|---|---|---|---|
| `editorial_state` | Any core table | Status, active flag, version | No |
| `translation_state` | Any core table | Translation status per language | No |
| `content_version_entities` | Any core table | Version manifest entry | No |
| `content_feedback` | Any core table | Review comments | No |
| `content_revisions` | Any core table | Change history | No |
| `tag_links` | Any core table | Tag associations | No |
| `card_effects` | Any core table | Effect instances | No |
| `editorial_metrics` | Any core table | Denormalized counts | No |
| `editorial_audit_log` | Any core table | Transition history | No (append-only, orphans acceptable) |

### 7.2 Minimum Viable Mitigation Plan

**Tier 1 — Detection (implement now)**:

Create orphan detection views for all polymorphic tables (SCHEMA_AUDIT_REPORT P8 covers `editorial_state`, `translation_state`, `content_version_entities`). Extend to:

```sql
-- Orphans in content_feedback (uses varchar entity_type)
CREATE OR REPLACE VIEW v_orphan_content_feedback AS
SELECT cf.id, cf.entity_type, cf.entity_id
FROM content_feedback cf
WHERE
  (cf.entity_type = 'arcana'       AND NOT EXISTS (SELECT 1 FROM arcana WHERE id = cf.entity_id))
  OR (cf.entity_type = 'facet'     AND NOT EXISTS (SELECT 1 FROM facet WHERE id = cf.entity_id))
  OR (cf.entity_type = 'base_card' AND NOT EXISTS (SELECT 1 FROM base_card WHERE id = cf.entity_id))
  OR (cf.entity_type = 'base_card_type' AND NOT EXISTS (SELECT 1 FROM base_card_type WHERE id = cf.entity_id))
  OR (cf.entity_type = 'base_skills' AND NOT EXISTS (SELECT 1 FROM base_skills WHERE id = cf.entity_id))
  OR (cf.entity_type = 'world'     AND NOT EXISTS (SELECT 1 FROM world WHERE id = cf.entity_id))
  OR (cf.entity_type = 'world_card' AND NOT EXISTS (SELECT 1 FROM world_card WHERE id = cf.entity_id));

-- Same pattern for: content_revisions, tag_links, card_effects
```

**Tier 2 — Cleanup triggers (implement when ready)**:

The `cleanup_polymorphic_refs()` trigger from SCHEMA_AUDIT_REPORT P8 is the right approach. Apply to all 7 core tables.

**Tier 3 — Scheduled health check (implement for production)**:

A periodic job (cron or application-level) that queries all `v_orphan_*` views and alerts if count > 0.

### 7.3 Triggers vs Scheduled Checks

| Approach | Pros | Cons |
|---|---|---|
| **DELETE triggers** | Immediate cleanup, no orphan window | Adds latency to DELETE, complex for 7 tables × 8+ polymorphic tables, risk of cascading failures |
| **Scheduled checks** | Zero impact on write path, simple to implement, can alert without auto-deleting | Orphans exist temporarily, requires external scheduler |
| **Hybrid** (recommended) | Triggers for critical tables (`editorial_state`, `translation_state`, `content_version_entities`), scheduled checks for the rest | Moderate complexity |

**Recommendation**: Hybrid. Triggers on DELETE for the 3 most critical polymorphic tables. Scheduled checks for `content_feedback`, `content_revisions`, `tag_links`, `card_effects`, `editorial_metrics`.

---

## 8. Performance and Indexing Review

### 8.1 Recommended Indexes

#### Editorial Review Queue

```sql
-- Already exists: idx_editorial_status_created (status, created_at DESC)
-- This covers: WHERE status = 'review' ORDER BY created_at DESC

-- NEW: Partial index for active review queue (most common dashboard query)
CREATE INDEX idx_editorial_review_queue
  ON editorial_state (entity_type, modified_at DESC)
  WHERE status IN ('pending_review', 'review', 'changes_requested');
```

#### Translation Backlog

```sql
-- Already exists: idx_translation_state_lang_status (language_code, status)
-- Covers: WHERE language_code = 'es' AND status = 'draft'

-- NEW: Partial index for pending translations
CREATE INDEX idx_translation_pending
  ON translation_state (language_code, updated_at DESC)
  WHERE status IN ('draft', 'review');
```

#### Version/World Queries

```sql
-- Already exists: idx_cve_entity (entity_type, entity_id)
-- Already exists: idx_cve_version (content_version_id)
-- Already exists: idx_world_content_pins_version (content_version_id)

-- These are sufficient for current query patterns.
```

#### Name Search

```sql
-- Already exists: idx_base_card_translations_name_lower (lower(name))
-- MISSING for other translation tables:
CREATE INDEX idx_world_card_translations_name_lower
  ON world_card_translations (lower(name));
CREATE INDEX idx_base_skills_translations_name_lower
  ON base_skills_translations (lower(name::text));
CREATE INDEX idx_arcana_translations_name_lower
  ON arcana_translations (lower(name));
CREATE INDEX idx_facet_translations_name_lower
  ON facet_translations (lower(name));
```

#### Tag Filtering

```sql
-- Already exists: idx_tag_links_entity (entity_type, entity_id)
-- Already exists: idx_tag_links_tag (tag_id)
-- Sufficient for: "find all tags for entity X" and "find all entities with tag Y"
```

### 8.2 Redundant Indexes (Write Amplification Risk)

As documented in SCHEMA_AUDIT_REPORT §2.5:

| Table | Redundant Index | Duplicate Of | Action |
|---|---|---|---|
| `tag_links` | `idx_tag_links_entity_lookup` | `idx_tag_links_entity` | DROP |
| `tag_links` | `idx_tag_links_tag_id` | `idx_tag_links_tag` | DROP |
| `tag_links` | `idx_tag_links_entity_id` | Subset of `idx_tag_links_entity` | DROP (entity_id alone is rarely queried without entity_type) |
| `tag_links` | `idx_tag_links_entity_type` | Subset of `idx_tag_links_entity` | DROP (entity_type alone is rarely useful) |
| `card_effects` | `idx_card_effects_parent` | `idx_card_effects_parent_cascade` covers non-null case | Keep both (different use cases: one for all, one partial) |
| `card_effects` | `idx_card_effects_group` | Subset of `idx_card_effects_entity_group` | DROP if entity_group index is always used with entity filter |
| `base_card` | `idx_base_card_status` | Subset of `idx_base_card_status_active` | DROP after cutover (both become unnecessary when status moves to editorial_state) |

**Estimated write amplification savings**: ~6 indexes removed across 3 tables. For `tag_links` (frequently written during bulk tag operations), this is meaningful.

### 8.3 Canonical Admin Views

#### v_editorial_dashboard (from SCHEMA_AUDIT_REPORT P9, refined)

```sql
CREATE OR REPLACE VIEW v_editorial_dashboard AS
SELECT
  es.id AS editorial_id,
  et.code AS entity_code,
  es.entity_type,
  es.entity_id,
  es.status,
  es.is_active,
  es.content_version_id,
  cv.version_semver,
  cv.release AS version_release,
  es.created_by,
  uc.username AS created_by_name,
  es.updated_by,
  uu.username AS updated_by_name,
  es.created_at,
  es.modified_at,
  em.open_feedback_count,
  em.revision_count,
  em.translation_count
FROM editorial_state es
JOIN entity_types et ON et.id = es.entity_type
LEFT JOIN content_versions cv ON cv.id = es.content_version_id
LEFT JOIN users uc ON uc.id = es.created_by
LEFT JOIN users uu ON uu.id = es.updated_by
LEFT JOIN editorial_metrics em
  ON em.entity_type = es.entity_type AND em.entity_id = es.entity_id;
```

#### v_translation_progress (from SCHEMA_AUDIT_REPORT P10, refined)

```sql
CREATE OR REPLACE VIEW v_translation_progress AS
SELECT
  et.code AS entity_code,
  ts.entity_type,
  ts.entity_id,
  ts.language_code,
  ts.status AS translation_status,
  es.status AS editorial_status,
  es.is_active,
  ts.updated_at AS translation_updated_at,
  ts.updated_by AS translation_updated_by
FROM translation_state ts
JOIN entity_types et ON et.id = ts.entity_type
LEFT JOIN editorial_state es
  ON es.entity_type = ts.entity_type AND es.entity_id = ts.entity_id;
```

#### v_world_effective_version (new)

```sql
CREATE OR REPLACE VIEW v_world_effective_version AS
SELECT
  w.id AS world_id,
  w.code AS world_code,
  wcp.content_version_id,
  cv.version_semver,
  cv.release AS version_release,
  cv.frozen_at IS NOT NULL AS is_frozen,
  wcp.pinned_at,
  wcp.pinned_by,
  u.username AS pinned_by_name,
  (SELECT count(*) FROM content_version_entities cve
   WHERE cve.content_version_id = wcp.content_version_id) AS manifest_entity_count
FROM world w
LEFT JOIN world_content_pins wcp ON wcp.world_id = w.id
LEFT JOIN content_versions cv ON cv.id = wcp.content_version_id
LEFT JOIN users u ON u.id = wcp.pinned_by;
```

#### v_version_diff (new — compare two versions)

```sql
-- Usage: SELECT * FROM v_version_diff WHERE version_a = 1 AND version_b = 2;
-- This is better as a function than a view:
CREATE OR REPLACE FUNCTION fn_version_diff(p_version_a int, p_version_b int)
RETURNS TABLE (
  entity_type int2,
  entity_code varchar,
  entity_id int4,
  in_version_a bool,
  in_version_b bool
) LANGUAGE sql STABLE AS $$
  SELECT
    COALESCE(a.entity_type, b.entity_type),
    et.code,
    COALESCE(a.entity_id, b.entity_id),
    a.entity_id IS NOT NULL AS in_version_a,
    b.entity_id IS NOT NULL AS in_version_b
  FROM content_version_entities a
  FULL OUTER JOIN content_version_entities b
    ON a.entity_type = b.entity_type
    AND a.entity_id = b.entity_id
    AND b.content_version_id = p_version_b
  JOIN entity_types et ON et.id = COALESCE(a.entity_type, b.entity_type)
  WHERE a.content_version_id = p_version_a
    OR b.content_version_id = p_version_b
  HAVING a.entity_id IS NULL OR b.entity_id IS NULL;
$$;
```

---

## 9. Improvement Proposals (Prioritized)

### A) High Impact

#### H1 — Automated Divergence Detection + Auto-Create Trigger

| | |
|---|---|
| **Problem** | `editorial_state` and core tables can silently diverge |
| **Why it matters** | Dashboard shows wrong status, publish guard reads wrong data, audit trail is unreliable |
| **SQL** | `v_editorial_divergence` view + `auto_create_editorial_state()` trigger (see §4.5) |
| **Risk** | Low (additive, no existing behavior changed) |
| **Dependencies** | None |
| **Migration** | Phase 1: Create view. Phase 2: Create trigger on all 7 core tables. Phase 3: Run divergence check, fix any discrepancies. |
| **Validation** | `SELECT count(*) FROM v_editorial_divergence; -- Expected: 0` |

#### H2 — Version Lifecycle (frozen_at + is_published)

| | |
|---|---|
| **Problem** | Versions have no lifecycle. Manifests can be mutated after worlds are pinned. No way to distinguish dev from released versions. |
| **Why it matters** | A world pinned to a "released" version could have its manifest silently changed, breaking the release. |
| **SQL** | Add `frozen_at`, `frozen_by`, `is_published`, `published_at`, `published_by` to `content_versions` + manifest freeze trigger (see §6.3.3) |
| **Risk** | Low (additive columns, trigger only blocks mutation of frozen versions) |
| **Dependencies** | None |
| **Migration** | Phase 1: Add columns (nullable, no default). Phase 2: Add freeze trigger. Phase 3: Freeze existing versions that have pinned worlds. |
| **Validation** | `SELECT * FROM v_version_health WHERE is_empty_but_pinned = true; -- Expected: 0 rows` |

#### H3 — Translation Timestamps on All Tables

| | |
|---|---|
| **Problem** | 5 translation tables lack `created_at`/`modified_at` |
| **Why it matters** | Cannot build translation dashboards, cannot detect stale translations, cannot audit translation activity |
| **SQL** | SCHEMA_AUDIT_REPORT P5 (already specified) |
| **Risk** | Very low (additive columns with defaults) |
| **Dependencies** | None |
| **Migration** | Single ALTER + CREATE TRIGGER per table |
| **Validation** | `SELECT table_name FROM information_schema.columns WHERE column_name = 'modified_at' AND table_name LIKE '%translations'; -- Should list all 10` |

#### H4 — Orphan Detection Views + Cleanup Triggers

| | |
|---|---|
| **Problem** | Deleting a core entity leaves orphan rows in 8+ polymorphic tables |
| **Why it matters** | Orphans corrupt dashboards, waste storage, and can cause confusing query results |
| **SQL** | SCHEMA_AUDIT_REPORT P8 (views) + cleanup triggers for critical tables (see §7.2) |
| **Risk** | Medium (triggers add DELETE latency) |
| **Dependencies** | None |
| **Migration** | Phase 1: Create all `v_orphan_*` views. Phase 2: Add cleanup triggers for `editorial_state`, `translation_state`, `content_version_entities`. Phase 3: Run orphan views, clean up existing orphans. |
| **Validation** | `SELECT count(*) FROM v_orphan_editorial_state; -- Expected: 0` (repeat for all views) |

### B) Medium Impact

#### M1 — Harden `editorial_metrics`

| | |
|---|---|
| **Problem** | No PK, no UNIQUE, no FK. Can accumulate duplicates. |
| **SQL** | SCHEMA_AUDIT_REPORT P1 |
| **Risk** | Low |
| **Migration** | Clean duplicates → add PK → add FK → add trigger |

#### M2 — PK on `entity_relations`

| | |
|---|---|
| **Problem** | No PK, only UNIQUE INDEX |
| **SQL** | SCHEMA_AUDIT_REPORT P3 |
| **Risk** | Low |

#### M3 — `content_revisions.status` → ENUM

| | |
|---|---|
| **Problem** | `text` column instead of `card_status` ENUM |
| **SQL** | SCHEMA_AUDIT_REPORT P4 |
| **Risk** | Low (verify existing values first) |

#### M4 — Drop Redundant Indexes

| | |
|---|---|
| **Problem** | 6+ redundant indexes cause write amplification |
| **SQL** | SCHEMA_AUDIT_REPORT P2 + additional drops from §8.2 |
| **Risk** | Very low |

#### M5 — Partial Indexes for Editorial Queues

| | |
|---|---|
| **Problem** | Full-table scans for common dashboard queries |
| **SQL** | See §8.1 |
| **Risk** | Very low (additive) |

#### M6 — Name Search Indexes on All Translation Tables

| | |
|---|---|
| **Problem** | Only `base_card_translations` has `lower(name)` index |
| **SQL** | See §8.1 |
| **Risk** | Very low |

### C) Low Impact

#### L1 — Deprecate DOMAIN `entity_type`

SCHEMA_AUDIT_REPORT P11. No urgency.

#### L2 — Document `entity_relations` Purpose

SCHEMA_AUDIT_REPORT P12. Add COMMENT ON TABLE.

#### L3 — `translation_state.base_snapshot_at`

See §5.2. Only valuable after translation timestamps are in place (H3).

---

## 10. "Cutover Readiness" Checklist

### When Is It Safe to Stop Writing Legacy Editorial Columns?

All of the following must be true:

| # | Criterion | Verification Query |
|---|---|---|
| 1 | Every core entity has an `editorial_state` row | See query below |
| 2 | Zero divergence between `editorial_state` and core table columns | See query below |
| 3 | All application read paths use `editorial_state` (not core columns) | Code audit (grep for `.status`, `.is_active`, `.content_version_id` on entity queries) |
| 4 | All application write paths write to `editorial_state` | Code audit |
| 5 | Zod schemas no longer include `status`/`is_active`/`content_version_id` in entity response types (or they are populated from `editorial_state`) | Schema audit |
| 6 | Dashboard views (`v_editorial_dashboard`, `v_translation_progress`) are deployed and used | Deployment check |

### Verification Queries

```sql
-- Criterion 1: Every entity has editorial_state
SELECT 'arcana' AS entity, count(*) AS total,
  (SELECT count(*) FROM editorial_state es
   WHERE es.entity_type = get_entity_type_id('arcana')) AS editorial_count
FROM arcana
UNION ALL
SELECT 'facet', count(*),
  (SELECT count(*) FROM editorial_state es
   WHERE es.entity_type = get_entity_type_id('facet'))
FROM facet
UNION ALL
SELECT 'base_card', count(*),
  (SELECT count(*) FROM editorial_state es
   WHERE es.entity_type = get_entity_type_id('base_card'))
FROM base_card
UNION ALL
SELECT 'base_card_type', count(*),
  (SELECT count(*) FROM editorial_state es
   WHERE es.entity_type = get_entity_type_id('base_card_type'))
FROM base_card_type
UNION ALL
SELECT 'base_skills', count(*),
  (SELECT count(*) FROM editorial_state es
   WHERE es.entity_type = get_entity_type_id('base_skills'))
FROM base_skills
UNION ALL
SELECT 'world', count(*),
  (SELECT count(*) FROM editorial_state es
   WHERE es.entity_type = get_entity_type_id('world'))
FROM world
UNION ALL
SELECT 'world_card', count(*),
  (SELECT count(*) FROM editorial_state es
   WHERE es.entity_type = get_entity_type_id('world_card'))
FROM world_card;
-- Expected: total = editorial_count for every row

-- Criterion 2: Zero divergence (example for base_card)
SELECT bc.id, bc.status AS core, es.status AS editorial
FROM base_card bc
JOIN editorial_state es
  ON es.entity_type = get_entity_type_id('base_card') AND es.entity_id = bc.id
WHERE bc.status IS DISTINCT FROM es.status
   OR bc.is_active IS DISTINCT FROM es.is_active
   OR bc.content_version_id IS DISTINCT FROM es.content_version_id;
-- Expected: 0 rows. Repeat for all 7 core tables.
```

### When Is It Safe to Stop Reading Legacy Columns?

After criterion 3 (all reads from `editorial_state`) is verified. At this point, core table columns are frozen artifacts.

### When Is It Safe to Drop Legacy Columns?

After ALL of the above, PLUS:

| # | Criterion | Verification |
|---|---|---|
| 7 | No index on core tables references `status`, `is_active`, or `content_version_id` | `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'base_card' AND indexdef LIKE '%status%';` |
| 8 | No view references core table editorial columns | `SELECT viewname, definition FROM pg_views WHERE definition LIKE '%base_card.status%';` |
| 9 | No trigger references core table editorial columns | Manual review |
| 10 | Backup taken | Operational |

```sql
-- Final drop (example for base_card):
ALTER TABLE base_card
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS content_version_id,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS updated_by;

-- Drop indexes that referenced those columns:
DROP INDEX IF EXISTS idx_base_card_status;
DROP INDEX IF EXISTS idx_base_card_status_active;
DROP INDEX IF EXISTS idx_base_card_version_status;
DROP INDEX IF EXISTS idx_base_card_content_version;
DROP INDEX IF EXISTS idx_base_card_created_status;
```

---

## 11. Suggested Next Focus Areas

1. **Execute Sprint 1 from SCHEMA_AUDIT_REPORT** (quick wins: drop duplicate indexes, PK on `editorial_metrics` and `entity_relations`, timestamps on translations, ENUM on `content_revisions.status`). These are zero-risk, high-value, and unblock everything else.

2. **Deploy `auto_create_editorial_state` trigger + divergence detection view** (H1). This is the single most important step toward cutover. It ensures no new entity is created without an `editorial_state` row, and provides a mechanism to detect and fix divergence.

3. **Add version lifecycle columns** (`frozen_at`, `is_published`) **and the manifest freeze trigger** (H2). This is critical before any real release management happens. Without it, published content can be silently mutated.

---

> "No code changes were made. This report is advisory."
