-- =============================================================================
-- Backfill: editorial_state for all core entities
-- =============================================================================
-- Purpose:  Insert missing editorial_state rows for pre-existing entities.
-- Safety:   Idempotent — uses INSERT ... SELECT ... WHERE NOT EXISTS.
--           Does NOT overwrite existing editorial_state rows.
-- Scope:    base_card, world, world_card, facet, arcana, base_skills, base_card_type
-- Run:      psql -d <dbname> -f server/database/migrations/manual/2026_02_backfill_editorial_state.sql
-- Date:     2026-02-11
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- PRE-CHECK: count missing editorial_state per entity
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '=== PRE-BACKFILL MISSING COUNTS ===';
END $$;

SELECT 'base_card' AS entity,
       count(*) AS missing
  FROM base_card bc
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('base_card')
      AND es.entity_id = bc.id
 )
UNION ALL
SELECT 'world',
       count(*)
  FROM world w
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('world')
      AND es.entity_id = w.id
 )
UNION ALL
SELECT 'world_card',
       count(*)
  FROM world_card wc
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('world_card')
      AND es.entity_id = wc.id
 )
UNION ALL
SELECT 'facet',
       count(*)
  FROM facet f
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('facet')
      AND es.entity_id = f.id
 )
UNION ALL
SELECT 'arcana',
       count(*)
  FROM arcana a
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('arcana')
      AND es.entity_id = a.id
 )
UNION ALL
SELECT 'base_skills',
       count(*)
  FROM base_skills bs
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('base_skills')
      AND es.entity_id = bs.id
 )
UNION ALL
SELECT 'base_card_type',
       count(*)
  FROM base_card_type bct
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('base_card_type')
      AND es.entity_id = bct.id
 );

-- ─────────────────────────────────────────────────────────────────────────────
-- BACKFILL: base_card
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO editorial_state (entity_type, entity_id, status, is_active, content_version_id, created_by, updated_by)
SELECT get_entity_type_id('base_card'),
       bc.id,
       bc.status,
       COALESCE(bc.is_active, true),
       bc.content_version_id,
       bc.created_by,
       bc.updated_by
  FROM base_card bc
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('base_card')
      AND es.entity_id = bc.id
 );

-- ─────────────────────────────────────────────────────────────────────────────
-- BACKFILL: world
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO editorial_state (entity_type, entity_id, status, is_active, content_version_id, created_by, updated_by)
SELECT get_entity_type_id('world'),
       w.id,
       w.status,
       w.is_active,
       w.content_version_id,
       w.created_by,
       w.updated_by
  FROM world w
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('world')
      AND es.entity_id = w.id
 );

-- ─────────────────────────────────────────────────────────────────────────────
-- BACKFILL: world_card
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO editorial_state (entity_type, entity_id, status, is_active, content_version_id, created_by, updated_by)
SELECT get_entity_type_id('world_card'),
       wc.id,
       wc.status,
       wc.is_active,
       wc.content_version_id,
       wc.created_by,
       wc.updated_by
  FROM world_card wc
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('world_card')
      AND es.entity_id = wc.id
 );

-- ─────────────────────────────────────────────────────────────────────────────
-- BACKFILL: facet
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO editorial_state (entity_type, entity_id, status, is_active, content_version_id, created_by, updated_by)
SELECT get_entity_type_id('facet'),
       f.id,
       f.status,
       f.is_active,
       f.content_version_id,
       f.created_by,
       f.updated_by
  FROM facet f
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('facet')
      AND es.entity_id = f.id
 );

-- ─────────────────────────────────────────────────────────────────────────────
-- BACKFILL: arcana
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO editorial_state (entity_type, entity_id, status, is_active, content_version_id, created_by, updated_by)
SELECT get_entity_type_id('arcana'),
       a.id,
       a.status,
       a.is_active,
       a.content_version_id,
       a.created_by,
       a.updated_by
  FROM arcana a
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('arcana')
      AND es.entity_id = a.id
 );

-- ─────────────────────────────────────────────────────────────────────────────
-- BACKFILL: base_skills
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO editorial_state (entity_type, entity_id, status, is_active, content_version_id, created_by, updated_by)
SELECT get_entity_type_id('base_skills'),
       bs.id,
       bs.status,
       bs.is_active,
       bs.content_version_id,
       bs.created_by,
       bs.updated_by
  FROM base_skills bs
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('base_skills')
      AND es.entity_id = bs.id
 );

-- ─────────────────────────────────────────────────────────────────────────────
-- BACKFILL: base_card_type
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO editorial_state (entity_type, entity_id, status, is_active, content_version_id, created_by, updated_by)
SELECT get_entity_type_id('base_card_type'),
       bct.id,
       bct.status,
       bct.is_active,
       bct.content_version_id,
       bct.created_by,
       bct.updated_by
  FROM base_card_type bct
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('base_card_type')
      AND es.entity_id = bct.id
 );

-- ─────────────────────────────────────────────────────────────────────────────
-- POST-CHECK: count missing editorial_state per entity (should all be 0)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '=== POST-BACKFILL MISSING COUNTS (expect all 0) ===';
END $$;

SELECT 'base_card' AS entity,
       count(*) AS missing
  FROM base_card bc
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('base_card')
      AND es.entity_id = bc.id
 )
UNION ALL
SELECT 'world',
       count(*)
  FROM world w
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('world')
      AND es.entity_id = w.id
 )
UNION ALL
SELECT 'world_card',
       count(*)
  FROM world_card wc
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('world_card')
      AND es.entity_id = wc.id
 )
UNION ALL
SELECT 'facet',
       count(*)
  FROM facet f
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('facet')
      AND es.entity_id = f.id
 )
UNION ALL
SELECT 'arcana',
       count(*)
  FROM arcana a
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('arcana')
      AND es.entity_id = a.id
 )
UNION ALL
SELECT 'base_skills',
       count(*)
  FROM base_skills bs
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('base_skills')
      AND es.entity_id = bs.id
 )
UNION ALL
SELECT 'base_card_type',
       count(*)
  FROM base_card_type bct
 WHERE NOT EXISTS (
   SELECT 1 FROM editorial_state es
    WHERE es.entity_type = get_entity_type_id('base_card_type')
      AND es.entity_id = bct.id
 );

-- ─────────────────────────────────────────────────────────────────────────────
-- SAMPLE: recently inserted rows (created_at within last 5 seconds)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT es.id,
       et.code AS entity_code,
       es.entity_id,
       es.status,
       es.is_active,
       es.content_version_id,
       es.created_by,
       es.created_at
  FROM editorial_state es
  JOIN entity_types et ON et.id = es.entity_type
 WHERE es.created_at >= now() - interval '5 seconds'
 ORDER BY et.code, es.entity_id
 LIMIT 20;

-- ─────────────────────────────────────────────────────────────────────────────
-- TOTAL COVERAGE: editorial_state row counts vs entity counts
-- ─────────────────────────────────────────────────────────────────────────────
SELECT et.code AS entity,
       entity_total.cnt AS total_entities,
       COALESCE(es_count.cnt, 0) AS editorial_state_rows,
       entity_total.cnt - COALESCE(es_count.cnt, 0) AS missing
  FROM (
    SELECT 'base_card' AS code, count(*) AS cnt FROM base_card
    UNION ALL SELECT 'world', count(*) FROM world
    UNION ALL SELECT 'world_card', count(*) FROM world_card
    UNION ALL SELECT 'facet', count(*) FROM facet
    UNION ALL SELECT 'arcana', count(*) FROM arcana
    UNION ALL SELECT 'base_skills', count(*) FROM base_skills
    UNION ALL SELECT 'base_card_type', count(*) FROM base_card_type
  ) entity_total
  JOIN entity_types et ON et.code = entity_total.code
  LEFT JOIN (
    SELECT entity_type, count(*) AS cnt
      FROM editorial_state
     GROUP BY entity_type
  ) es_count ON es_count.entity_type = et.id
 ORDER BY et.code;

COMMIT;
