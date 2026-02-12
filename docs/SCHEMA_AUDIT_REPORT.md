# Auditoría del Esquema PostgreSQL — Tarot2

> **Fecha**: 2026-02-11
> **Alcance**: Esquema completo de `SCHEMA POSTGRES.TXT` — tablas core, traducciones, versionado, auditoría, permisos, tablas nuevas.
> **Objetivo de producto**: Creación, edición, traducción y gestión editorial de cartas TTRPG + administración.

---

## 1. Resumen Ejecutivo

1. **Doble fuente de verdad editorial**: Las 7 tablas core (`arcana`, `facet`, `base_card`, `base_card_type`, `base_skills`, `world`, `world_card`) mantienen columnas `status`, `is_active`, `content_version_id`, `created_by`, `updated_by` que duplican `editorial_state`. Es el riesgo #1 de integridad.
2. **`entity_type` polimórfico sin FK enforceable**: `editorial_state`, `translation_state`, `content_version_entities` usan `(entity_type, entity_id)` sin FK real a la tabla destino. Riesgo de huérfanos.
3. **Inconsistencia de tipos en `entity_type`**: Las tablas nuevas (`editorial_state`, `translation_state`, `entity_relations`, `content_version_entities`) usan `int2` (FK a `entity_types.id`), pero las tablas legacy (`content_feedback`, `content_revisions`, `tag_links`, `card_effects`) usan `varchar(50)` con CHECK constraints manuales. Dos dialectos coexisten.
4. **Índices duplicados**: `entity_relations` tiene pares de índices idénticos (`idx_entity_relations_source` / `idx_relations_source`). `tag_links` tiene `idx_tag_links_entity` / `idx_tag_links_entity_lookup` y `idx_tag_links_tag` / `idx_tag_links_tag_id`.
5. **`editorial_metrics` sin PK ni constraints**: Tabla sin clave primaria, sin UNIQUE, sin FK. Datos potencialmente duplicados o huérfanos.
6. **Falta columna `is_active` en `editorial_state`** para dashboards de "versión activa" de `content_versions` — no hay forma de saber cuál es la versión publicada/activa globalmente.
7. **`content_revisions.status` es `text`**, no usa el ENUM `card_status` ni `translation_status`. Inconsistencia con el resto del esquema.
8. **Tablas de traducción sin `created_at`/`modified_at` consistentes**: `arcana_translations`, `facet_translations`, `base_card_type_translations`, `effect_target_translations`, `effect_type_translations` carecen de timestamps de auditoría.
9. **`entity_relations` sin PK formal** — solo tiene un UNIQUE INDEX, no una PRIMARY KEY constraint.
10. **No existe vista ni mecanismo para "versión activa"** — `content_versions` no tiene flag `is_current`/`is_published`, ni `world_content_pins` se generaliza a otras entidades.

---

## 2. Problemas Detectados

### 2.1 Doble Fuente de Verdad Editorial (CRÍTICO)

**Tablas afectadas**: `arcana`, `facet`, `base_card`, `base_card_type`, `base_skills`, `world`, `world_card`

Cada una tiene:
- `status card_status`
- `is_active bool`
- `content_version_id int4` (FK a `content_versions`)
- `created_by`, `updated_by` (FK a `users`)
- `created_at`, `modified_at`

Estos mismos campos existen en `editorial_state`. Mientras ambos coexistan:
- Las queries deben decidir de dónde leer.
- Los writes deben mantener ambos en sync (dual-write).
- Un bug de sync produce datos contradictorios silenciosamente.

### 2.2 Inconsistencia de Tipo `entity_type`

| Tabla | Columna | Tipo |
|---|---|---|
| `editorial_state` | `entity_type` | `int2` (FK `entity_types`) |
| `translation_state` | `entity_type` | `int2` (FK `entity_types`) |
| `content_version_entities` | `entity_type` | `int2` (FK `entity_types`) |
| `entity_relations` | `source_type`/`target_type` | `int2` (FK `entity_types`) |
| `editorial_metrics` | `entity_type` | `int2` (sin FK) |
| `content_feedback` | `entity_type` | `varchar(50)` (CHECK) |
| `content_revisions` | `entity_type` | `varchar(50)` (CHECK) |
| `tag_links` | `entity_type` | `varchar(50)` (CHECK) |
| `card_effects` | `entity_type` | `varchar(50)` (sin CHECK de lista) |

Dos dialectos: `int2` normalizado vs `varchar(50)` con CHECK. Impide JOINs directos entre tablas nuevas y legacy.

### 2.3 Polimorfismo sin FK Enforceable

`(entity_type, entity_id)` no puede tener FK a múltiples tablas. Riesgo: se borra una `base_card` y quedan filas huérfanas en `editorial_state`, `translation_state`, `content_version_entities`, `tag_links`, `content_feedback`, `content_revisions`.

### 2.4 `editorial_metrics` — Tabla Frágil

```sql
CREATE TABLE public.editorial_metrics (
    entity_type int2 NULL,    -- nullable, sin FK
    entity_id int4 NULL,      -- nullable
    -- sin PK, sin UNIQUE
);
```

Sin PK, sin UNIQUE, sin FK. Puede acumular duplicados. No tiene trigger de `updated_at`.

### 2.5 Índices Duplicados

**`entity_relations`**:
- `idx_entity_relations_source(source_type, source_id)` = `idx_relations_source(source_type, source_id)`
- `idx_entity_relations_target(target_type, target_id)` = `idx_relations_target(target_type, target_id)`

**`tag_links`**:
- `idx_tag_links_entity(entity_type, entity_id)` = `idx_tag_links_entity_lookup(entity_type, entity_id)`
- `idx_tag_links_tag(tag_id)` = `idx_tag_links_tag_id(tag_id)`

**`effect_target_translations`**:
- UNIQUE constraint `effect_target_translations_lang_unique(effect_target_id, language_code)` + UNIQUE INDEX `idx_effect_target_translations_unique(effect_target_id, language_code)` — redundante.

**`effect_type_translations`**: mismo caso.

### 2.6 `content_revisions.status` es `text`

```sql
status text DEFAULT 'draft'::text NOT NULL
```

Debería usar un ENUM (`card_status` o `translation_status`) para consistencia y validación a nivel DB.

### 2.7 Timestamps Inconsistentes en Traducciones

| Tabla de traducción | `created_at` | `modified_at` | Trigger |
|---|---|---|---|
| `base_card_translations` | ✅ | ✅ | ✅ |
| `base_skills_translations` | ✅ | ✅ | ✅ |
| `world_translations` | ✅ | ✅ | ✅ |
| `world_card_translations` | ✅ | ✅ | ✅ |
| `tags_translations` | ✅ | ✅ | ✅ |
| `arcana_translations` | ❌ | ❌ | ❌ |
| `facet_translations` | ❌ | ❌ | ❌ |
| `base_card_type_translations` | ❌ | ❌ | ❌ |
| `effect_target_translations` | ❌ | ❌ | ❌ |
| `effect_type_translations` | ❌ | ❌ | ❌ |

Sin timestamps no se puede auditar cuándo se tradujo ni alimentar dashboards de traducción.

### 2.8 `entity_relations` sin PK

Solo tiene `UNIQUE INDEX uq_entity_relations_unique`. Sin PK formal, no hay `id` para referencia. Esto dificulta operaciones de update/delete individuales y logging de auditoría.

### 2.9 Versionado: Sin "Versión Activa" Global

`content_versions` no tiene flag `is_published` ni `published_at`. `world_content_pins` resuelve esto solo para `world`. No hay mecanismo equivalente para el resto de entidades.

### 2.10 DOMAIN `entity_type` (varchar) vs Tabla `entity_types`

Existe un `DOMAIN public.entity_type` con CHECK de valores hardcodeados Y una tabla `entity_types` normalizada. El DOMAIN no se usa en las tablas nuevas (usan `int2`). Candidato a deprecación.

---

## 3. Propuestas Priorizadas

### 3.1 ALTA PRIORIDAD

#### P1 — Consolidar `editorial_metrics` con PK y constraints

| Atributo | Valor |
|---|---|
| **Impacto** | Alto |
| **Riesgo** | Bajo |
| **Esfuerzo** | Bajo |
| **Tipo** | Schema change + constraint |
| **Beneficio** | Evita duplicados, permite JOINs fiables, habilita dashboards editoriales |

```sql
-- Paso 1: Limpiar duplicados si existen
DELETE FROM editorial_metrics a
USING editorial_metrics b
WHERE a.ctid < b.ctid
  AND a.entity_type = b.entity_type
  AND a.entity_id = b.entity_id;

-- Paso 2: Añadir NOT NULL y PK
ALTER TABLE editorial_metrics
  ALTER COLUMN entity_type SET NOT NULL,
  ALTER COLUMN entity_id SET NOT NULL,
  ADD CONSTRAINT editorial_metrics_pkey PRIMARY KEY (entity_type, entity_id),
  ADD CONSTRAINT fk_editorial_metrics_entity_type
    FOREIGN KEY (entity_type) REFERENCES entity_types(id);

-- Paso 3: Trigger updated_at
CREATE TRIGGER editorial_metrics_set_updated_at
  BEFORE UPDATE ON editorial_metrics
  FOR EACH ROW EXECUTE FUNCTION set_modified_at();

-- Nota: set_modified_at usa NEW.modified_at, pero editorial_metrics usa updated_at.
-- Opción A: renombrar columna a modified_at
-- Opción B: crear función específica:
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Usar set_updated_at en vez de set_modified_at
DROP TRIGGER IF EXISTS editorial_metrics_set_updated_at ON editorial_metrics;
CREATE TRIGGER editorial_metrics_set_updated_at
  BEFORE UPDATE ON editorial_metrics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

#### P2 — Eliminar índices duplicados

| Atributo | Valor |
|---|---|
| **Impacto** | Medio |
| **Riesgo** | Bajo |
| **Esfuerzo** | Bajo |
| **Tipo** | Índice (DROP) |
| **Beneficio** | Reduce overhead de escritura, limpia confusión en EXPLAIN |

```sql
-- entity_relations: duplicados
DROP INDEX IF EXISTS idx_relations_source;
DROP INDEX IF EXISTS idx_relations_target;

-- tag_links: duplicados
DROP INDEX IF EXISTS idx_tag_links_entity_lookup;
DROP INDEX IF EXISTS idx_tag_links_tag_id;

-- effect_target_translations: UNIQUE INDEX redundante con UNIQUE CONSTRAINT
DROP INDEX IF EXISTS idx_effect_target_translations_unique;

-- effect_type_translations: mismo caso
DROP INDEX IF EXISTS idx_effect_type_translations_unique;

-- base_skills_translations: UNIQUE INDEX redundante (ya tiene constraint implícito si existe)
-- Verificar primero:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'base_skills_translations';
-- Si idx_base_skills_translations_unique duplica un UNIQUE constraint, eliminar.
```

---

#### P3 — Añadir PK a `entity_relations`

| Atributo | Valor |
|---|---|
| **Impacto** | Alto |
| **Riesgo** | Bajo |
| **Esfuerzo** | Bajo |
| **Tipo** | Schema change |
| **Beneficio** | Permite referencia individual, auditoría, API REST estándar |

```sql
-- Opción A: Promover UNIQUE INDEX a PK compuesta
ALTER TABLE entity_relations
  ADD CONSTRAINT entity_relations_pkey
    PRIMARY KEY (source_type, source_id, relation_type, target_type, target_id);

-- El UNIQUE INDEX uq_entity_relations_unique se vuelve redundante tras esto:
DROP INDEX IF EXISTS uq_entity_relations_unique;

-- Opción B (alternativa): Añadir id serial + mantener UNIQUE
-- ALTER TABLE entity_relations ADD COLUMN id serial;
-- ALTER TABLE entity_relations ADD CONSTRAINT entity_relations_pkey PRIMARY KEY (id);
-- (Mantener el UNIQUE INDEX existente)
```

**Recomendación**: Opción A (PK compuesta) es más limpia para esta tabla de relaciones M:N.

---

#### P4 — Corregir `content_revisions.status` a ENUM

| Atributo | Valor |
|---|---|
| **Impacto** | Medio |
| **Riesgo** | Bajo |
| **Esfuerzo** | Bajo |
| **Tipo** | Schema change |
| **Beneficio** | Validación a nivel DB, consistencia con el resto del esquema |

```sql
-- Verificar valores actuales
-- SELECT DISTINCT status FROM content_revisions;

-- Si todos los valores son compatibles con card_status:
ALTER TABLE content_revisions
  ALTER COLUMN status TYPE card_status USING status::card_status,
  ALTER COLUMN status SET DEFAULT 'draft'::card_status;
```

---

#### P5 — Añadir timestamps y triggers a traducciones incompletas

| Atributo | Valor |
|---|---|
| **Impacto** | Alto |
| **Riesgo** | Bajo |
| **Esfuerzo** | Bajo |
| **Tipo** | Schema change + trigger |
| **Beneficio** | Habilita dashboards de traducción, auditoría temporal, alimenta `translation_state` |

```sql
-- arcana_translations
ALTER TABLE arcana_translations
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS modified_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER arcana_translations_set_modified_at
  BEFORE UPDATE ON arcana_translations
  FOR EACH ROW EXECUTE FUNCTION set_modified_at();

-- facet_translations
ALTER TABLE facet_translations
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS modified_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER facet_translations_set_modified_at
  BEFORE UPDATE ON facet_translations
  FOR EACH ROW EXECUTE FUNCTION set_modified_at();

-- base_card_type_translations
ALTER TABLE base_card_type_translations
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS modified_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER base_card_type_translations_set_modified_at
  BEFORE UPDATE ON base_card_type_translations
  FOR EACH ROW EXECUTE FUNCTION set_modified_at();

-- effect_target_translations
ALTER TABLE effect_target_translations
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS modified_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER effect_target_translations_set_modified_at
  BEFORE UPDATE ON effect_target_translations
  FOR EACH ROW EXECUTE FUNCTION set_modified_at();

-- effect_type_translations
ALTER TABLE effect_type_translations
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS modified_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER effect_type_translations_set_modified_at
  BEFORE UPDATE ON effect_type_translations
  FOR EACH ROW EXECUTE FUNCTION set_modified_at();
```

---

#### P6 — Versión activa: Añadir `is_published` y `published_at` a `content_versions`

| Atributo | Valor |
|---|---|
| **Impacto** | Alto |
| **Riesgo** | Bajo |
| **Esfuerzo** | Bajo |
| **Tipo** | Schema change + índice parcial |
| **Beneficio** | Define "versión activa" global, habilita rollback, simplifica queries de publicación |

```sql
ALTER TABLE content_versions
  ADD COLUMN IF NOT EXISTS is_published bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS published_by int4 NULL;

ALTER TABLE content_versions
  ADD CONSTRAINT fk_content_versions_published_by
    FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL;

-- Garantizar máximo una versión publicada (si se desea single-active)
CREATE UNIQUE INDEX idx_content_versions_single_published
  ON content_versions (is_published)
  WHERE is_published = true;

-- CHECK: published_at solo si is_published
ALTER TABLE content_versions
  ADD CONSTRAINT chk_published_consistency
    CHECK (
      (is_published = false AND published_at IS NULL)
      OR (is_published = true AND published_at IS NOT NULL)
    );
```

> **Nota**: Si se prefiere multi-versión publicada (por mundo), eliminar el UNIQUE INDEX parcial y usar `world_content_pins` como mecanismo de pinning por mundo.

---

### 3.2 MEDIA PRIORIDAD

#### P7 — Migrar tablas legacy de `varchar entity_type` a `int2`

| Atributo | Valor |
|---|---|
| **Impacto** | Alto |
| **Riesgo** | Medio |
| **Esfuerzo** | Medio |
| **Tipo** | Schema change + migración de datos |
| **Beneficio** | Unifica el dialecto, permite JOINs directos con tablas nuevas, elimina CHECK constraints frágiles |

**Tablas afectadas**: `content_feedback`, `content_revisions`, `tag_links`, `card_effects`

**Estrategia por fases**:

```sql
-- FASE 1: Añadir columna nueva (no-breaking)
ALTER TABLE content_feedback ADD COLUMN entity_type_id int2;
ALTER TABLE content_revisions ADD COLUMN entity_type_id int2;
ALTER TABLE tag_links ADD COLUMN entity_type_id int2;
ALTER TABLE card_effects ADD COLUMN entity_type_id int2;

-- FASE 2: Backfill
UPDATE content_feedback SET entity_type_id = get_entity_type_id(entity_type);
UPDATE content_revisions SET entity_type_id = get_entity_type_id(entity_type);
UPDATE tag_links SET entity_type_id = get_entity_type_id(entity_type);
UPDATE card_effects SET entity_type_id = get_entity_type_id(entity_type);

-- FASE 3: Validar (ver sección 5)
-- SELECT count(*) FROM content_feedback WHERE entity_type_id IS NULL;

-- FASE 4: NOT NULL + FK
ALTER TABLE content_feedback
  ALTER COLUMN entity_type_id SET NOT NULL,
  ADD CONSTRAINT fk_content_feedback_entity_type
    FOREIGN KEY (entity_type_id) REFERENCES entity_types(id);

ALTER TABLE content_revisions
  ALTER COLUMN entity_type_id SET NOT NULL,
  ADD CONSTRAINT fk_content_revisions_entity_type
    FOREIGN KEY (entity_type_id) REFERENCES entity_types(id);

ALTER TABLE tag_links
  ALTER COLUMN entity_type_id SET NOT NULL,
  ADD CONSTRAINT fk_tag_links_entity_type
    FOREIGN KEY (entity_type_id) REFERENCES entity_types(id);

ALTER TABLE card_effects
  ALTER COLUMN entity_type_id SET NOT NULL,
  ADD CONSTRAINT fk_card_effects_entity_type
    FOREIGN KEY (entity_type_id) REFERENCES entity_types(id);

-- FASE 5: Actualizar índices (reemplazar entity_type varchar por entity_type_id)
-- Ejemplo para content_feedback:
DROP INDEX IF EXISTS idx_content_feedback_entity;
CREATE INDEX idx_content_feedback_entity ON content_feedback(entity_type_id, entity_id);
DROP INDEX IF EXISTS idx_content_feedback_entity_lang;
CREATE INDEX idx_content_feedback_entity_lang ON content_feedback(entity_type_id, entity_id, language_code);
DROP INDEX IF EXISTS idx_content_feedback_entity_status;
CREATE INDEX idx_content_feedback_entity_status ON content_feedback(entity_type_id, entity_id, status);

-- FASE 6: (Cuando el backend ya no lee entity_type varchar)
-- ALTER TABLE content_feedback DROP COLUMN entity_type;
-- ALTER TABLE content_feedback RENAME COLUMN entity_type_id TO entity_type;
-- Repetir para las demás tablas.
-- DROP CHECK constraints obsoletos.
```

---

#### P8 — Mitigación de huérfanos polimórficos

| Atributo | Valor |
|---|---|
| **Impacto** | Alto |
| **Riesgo** | Medio |
| **Esfuerzo** | Medio |
| **Tipo** | Función + trigger o cron |
| **Beneficio** | Previene datos huérfanos en tablas polimórficas sin FK real |

**Enfoque pragmático**: Función de validación ejecutable periódicamente (no trigger en DELETE, que sería complejo y frágil).

```sql
-- Vista de huérfanos en editorial_state
CREATE OR REPLACE VIEW v_orphan_editorial_state AS
SELECT es.id, es.entity_type, es.entity_id, et.code AS entity_code
FROM editorial_state es
JOIN entity_types et ON et.id = es.entity_type
WHERE
  (et.code = 'arcana'       AND NOT EXISTS (SELECT 1 FROM arcana WHERE id = es.entity_id))
  OR (et.code = 'facet'     AND NOT EXISTS (SELECT 1 FROM facet WHERE id = es.entity_id))
  OR (et.code = 'base_card' AND NOT EXISTS (SELECT 1 FROM base_card WHERE id = es.entity_id))
  OR (et.code = 'base_card_type' AND NOT EXISTS (SELECT 1 FROM base_card_type WHERE id = es.entity_id))
  OR (et.code = 'base_skills' AND NOT EXISTS (SELECT 1 FROM base_skills WHERE id = es.entity_id))
  OR (et.code = 'world'     AND NOT EXISTS (SELECT 1 FROM world WHERE id = es.entity_id))
  OR (et.code = 'world_card' AND NOT EXISTS (SELECT 1 FROM world_card WHERE id = es.entity_id));

-- Vista de huérfanos en translation_state
CREATE OR REPLACE VIEW v_orphan_translation_state AS
SELECT ts.entity_type, ts.entity_id, ts.language_code, et.code AS entity_code
FROM translation_state ts
JOIN entity_types et ON et.id = ts.entity_type
WHERE
  (et.code = 'arcana'       AND NOT EXISTS (SELECT 1 FROM arcana WHERE id = ts.entity_id))
  OR (et.code = 'facet'     AND NOT EXISTS (SELECT 1 FROM facet WHERE id = ts.entity_id))
  OR (et.code = 'base_card' AND NOT EXISTS (SELECT 1 FROM base_card WHERE id = ts.entity_id))
  OR (et.code = 'base_card_type' AND NOT EXISTS (SELECT 1 FROM base_card_type WHERE id = ts.entity_id))
  OR (et.code = 'base_skills' AND NOT EXISTS (SELECT 1 FROM base_skills WHERE id = ts.entity_id))
  OR (et.code = 'world'     AND NOT EXISTS (SELECT 1 FROM world WHERE id = ts.entity_id))
  OR (et.code = 'world_card' AND NOT EXISTS (SELECT 1 FROM world_card WHERE id = ts.entity_id));

-- Vista de huérfanos en content_version_entities
CREATE OR REPLACE VIEW v_orphan_content_version_entities AS
SELECT cve.content_version_id, cve.entity_type, cve.entity_id, et.code AS entity_code
FROM content_version_entities cve
JOIN entity_types et ON et.id = cve.entity_type
WHERE
  (et.code = 'arcana'       AND NOT EXISTS (SELECT 1 FROM arcana WHERE id = cve.entity_id))
  OR (et.code = 'facet'     AND NOT EXISTS (SELECT 1 FROM facet WHERE id = cve.entity_id))
  OR (et.code = 'base_card' AND NOT EXISTS (SELECT 1 FROM base_card WHERE id = cve.entity_id))
  OR (et.code = 'base_card_type' AND NOT EXISTS (SELECT 1 FROM base_card_type WHERE id = cve.entity_id))
  OR (et.code = 'base_skills' AND NOT EXISTS (SELECT 1 FROM base_skills WHERE id = cve.entity_id))
  OR (et.code = 'world'     AND NOT EXISTS (SELECT 1 FROM world WHERE id = cve.entity_id))
  OR (et.code = 'world_card' AND NOT EXISTS (SELECT 1 FROM world_card WHERE id = cve.entity_id));
```

**Alternativa futura (trigger en DELETE de tablas core)**:

```sql
-- Ejemplo: al borrar una base_card, limpiar tablas polimórficas
CREATE OR REPLACE FUNCTION cleanup_polymorphic_refs()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_type_id int2;
BEGIN
  SELECT id INTO v_type_id FROM entity_types WHERE code = TG_ARGV[0];
  DELETE FROM editorial_state WHERE entity_type = v_type_id AND entity_id = OLD.id;
  DELETE FROM translation_state WHERE entity_type = v_type_id AND entity_id = OLD.id;
  DELETE FROM content_version_entities WHERE entity_type = v_type_id AND entity_id = OLD.id;
  RETURN OLD;
END;
$$;

-- Aplicar a cada tabla core:
CREATE TRIGGER trg_base_card_cleanup_poly
  AFTER DELETE ON base_card
  FOR EACH ROW EXECUTE FUNCTION cleanup_polymorphic_refs('base_card');

-- Repetir para arcana, facet, base_card_type, base_skills, world, world_card
```

---

#### P9 — Vista editorial consolidada (dashboard)

| Atributo | Valor |
|---|---|
| **Impacto** | Alto |
| **Riesgo** | Bajo |
| **Esfuerzo** | Medio |
| **Tipo** | Vista |
| **Beneficio** | Query única para dashboards editoriales, colas de revisión, filtros |

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
LEFT JOIN editorial_metrics em ON em.entity_type = es.entity_type AND em.entity_id = es.entity_id;
```

---

#### P10 — Vista de progreso de traducción

| Atributo | Valor |
|---|---|
| **Impacto** | Alto |
| **Riesgo** | Bajo |
| **Esfuerzo** | Bajo |
| **Tipo** | Vista |
| **Beneficio** | Dashboard de traducción: qué entidades faltan por idioma, estado por idioma |

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
LEFT JOIN editorial_state es ON es.entity_type = ts.entity_type AND es.entity_id = ts.entity_id;

-- Para encontrar entidades SIN traducción en un idioma:
-- SELECT es.entity_type, es.entity_id, et.code
-- FROM editorial_state es
-- JOIN entity_types et ON et.id = es.entity_type
-- WHERE es.is_active = true
--   AND NOT EXISTS (
--     SELECT 1 FROM translation_state ts
--     WHERE ts.entity_type = es.entity_type
--       AND ts.entity_id = es.entity_id
--       AND ts.language_code = 'es'
--   );
```

---

### 3.3 BAJA PRIORIDAD

#### P11 — Deprecar DOMAIN `entity_type`

| Atributo | Valor |
|---|---|
| **Impacto** | Bajo |
| **Riesgo** | Bajo |
| **Esfuerzo** | Bajo |
| **Tipo** | Schema cleanup |
| **Beneficio** | Elimina confusión entre DOMAIN y tabla `entity_types` |

```sql
-- Verificar que ninguna columna usa el DOMAIN:
-- SELECT table_name, column_name
-- FROM information_schema.columns
-- WHERE domain_name = 'entity_type';

-- Si no hay dependencias:
DROP DOMAIN IF EXISTS public.entity_type;
```

> **Nota**: Si alguna columna aún lo usa, migrar primero a `varchar(50)` o `int2`.

---

#### P12 — `entity_relations`: ¿complementar o reemplazar relaciones existentes?

| Atributo | Valor |
|---|---|
| **Impacto** | Medio |
| **Riesgo** | Medio |
| **Esfuerzo** | Alto |
| **Tipo** | Decisión arquitectónica |

**Estado actual**: Las relaciones "duras" existen como FK directas:
- `facet.arcana_id` → `arcana.id`
- `base_card.card_type_id` → `base_card_type.id`
- `base_skills.facet_id` → `facet.id`
- `world_card.world_id` → `world.id`
- `world_card.base_card_id` → `base_card.id`

**`entity_relations`** es para relaciones **declarativas/semánticas** (ej. "esta carta se inspira en", "este mundo extiende").

**Recomendación**: **Complementar, no reemplazar**.
- Las FK directas son relaciones **estructurales** (un facet PERTENECE a un arcana). Deben mantenerse.
- `entity_relations` es para relaciones **editoriales/semánticas** que no implican dependencia estructural.
- Documentar esta distinción en un comentario de tabla:

```sql
COMMENT ON TABLE entity_relations IS
  'Relaciones semánticas/editoriales entre entidades. NO reemplaza FK estructurales (facet→arcana, base_card→base_card_type, etc.).';
```

---

#### P13 — Índice parcial para cola editorial

| Atributo | Valor |
|---|---|
| **Impacto** | Medio |
| **Riesgo** | Bajo |
| **Esfuerzo** | Bajo |
| **Tipo** | Índice |
| **Beneficio** | Acelera queries de "pendientes de revisión" |

```sql
-- Entidades pendientes de revisión (cola editorial)
CREATE INDEX idx_editorial_state_review_queue
  ON editorial_state (entity_type, modified_at DESC)
  WHERE status IN ('pending_review', 'review', 'changes_requested');

-- Entidades activas publicadas (para exports/game)
CREATE INDEX idx_editorial_state_published_active
  ON editorial_state (entity_type, entity_id)
  WHERE status = 'published' AND is_active = true;

-- Traducciones pendientes de revisión
CREATE INDEX idx_translation_state_review_queue
  ON translation_state (language_code, updated_at DESC)
  WHERE status IN ('draft', 'review');
```

---

## 4. Plan de Migración Recomendado — Doble Fuente de Verdad

### Objetivo

Migrar de columnas `status/is_active/content_version_id/created_by/updated_by` en tablas core a `editorial_state` como **única fuente de verdad editorial**.

### Fases

#### Fase 0 — Validación de paridad (AHORA)

Verificar que `editorial_state` tiene una fila por cada entidad existente y que los valores coinciden.

```sql
-- Ejemplo para base_card:
SELECT bc.id, bc.status AS core_status, es.status AS editorial_status,
       bc.is_active AS core_active, es.is_active AS editorial_active,
       bc.content_version_id AS core_cv, es.content_version_id AS editorial_cv
FROM base_card bc
LEFT JOIN editorial_state es
  ON es.entity_type = get_entity_type_id('base_card') AND es.entity_id = bc.id
WHERE bc.status IS DISTINCT FROM es.status
   OR bc.is_active IS DISTINCT FROM es.is_active
   OR bc.content_version_id IS DISTINCT FROM es.content_version_id;

-- Repetir para: arcana, facet, base_card_type, base_skills, world, world_card
```

#### Fase 1 — Dual-Write (ACTUAL → completar)

**Criterio**: Todo write de `status`, `is_active`, `content_version_id` en tablas core TAMBIÉN escribe en `editorial_state`.

- Backend `createCrudHandlers` debe escribir ambos.
- Verificar con query de paridad (Fase 0) periódicamente.

#### Fase 2 — Dual-Read → Read from `editorial_state`

**Criterio**: Todas las queries de listado, filtrado y dashboard leen de `editorial_state` (o de `v_editorial_dashboard`).

- Las tablas core siguen teniendo las columnas pero NO se leen para decisiones editoriales.
- Los JOINs de filtrado por status usan `editorial_state`.

#### Fase 3 — Stop Writing to Core Columns

**Criterio**: El backend deja de escribir `status`, `is_active`, `content_version_id` en tablas core.

- Las columnas quedan congeladas con el último valor.
- `editorial_state` es la única fuente de escritura.

#### Fase 4 — Drop Core Columns

**Criterio de "listo para borrar"**:
1. ✅ Ninguna query del backend lee `status`/`is_active`/`content_version_id` de tablas core
2. ✅ Ningún índice de tablas core referencia estas columnas (o se han recreado sin ellas)
3. ✅ Query de paridad (Fase 0) devuelve 0 filas de discrepancia
4. ✅ `editorial_state` tiene exactamente N filas = sum de entidades en todas las tablas core
5. ✅ Tests de regresión pasan sin las columnas

```sql
-- Ejemplo para base_card (SOLO ejecutar en Fase 4):
ALTER TABLE base_card
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS content_version_id,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS updated_by;

-- Eliminar índices que referenciaban esas columnas:
DROP INDEX IF EXISTS idx_base_card_status;
DROP INDEX IF EXISTS idx_base_card_status_active;
DROP INDEX IF EXISTS idx_base_card_version_status;
DROP INDEX IF EXISTS idx_base_card_content_version;
DROP INDEX IF EXISTS idx_base_card_created_status;

-- Repetir para cada tabla core.
```

> **Nota sobre `created_at`/`modified_at`**: Estas columnas SÍ deben permanecer en las tablas core porque representan cuándo se modificó el **contenido** de la entidad, no su estado editorial. `editorial_state.modified_at` refleja cuándo cambió el **estado editorial**.

---

## 5. Checklist de Validación Post-Cambio

### 5.1 Conteos de paridad

```sql
-- Total entidades vs filas en editorial_state
SELECT 'arcana' AS entity, count(*) FROM arcana
UNION ALL SELECT 'facet', count(*) FROM facet
UNION ALL SELECT 'base_card', count(*) FROM base_card
UNION ALL SELECT 'base_card_type', count(*) FROM base_card_type
UNION ALL SELECT 'base_skills', count(*) FROM base_skills
UNION ALL SELECT 'world', count(*) FROM world
UNION ALL SELECT 'world_card', count(*) FROM world_card;

SELECT et.code, count(*)
FROM editorial_state es
JOIN entity_types et ON et.id = es.entity_type
GROUP BY et.code
ORDER BY et.code;

-- Deben coincidir 1:1
```

### 5.2 Huérfanos

```sql
-- Huérfanos en editorial_state
SELECT count(*) FROM v_orphan_editorial_state;
-- Esperado: 0

-- Huérfanos en translation_state
SELECT count(*) FROM v_orphan_translation_state;
-- Esperado: 0

-- Huérfanos en content_version_entities
SELECT count(*) FROM v_orphan_content_version_entities;
-- Esperado: 0

-- editorial_metrics sin correspondencia en editorial_state
SELECT count(*)
FROM editorial_metrics em
WHERE NOT EXISTS (
  SELECT 1 FROM editorial_state es
  WHERE es.entity_type = em.entity_type AND es.entity_id = em.entity_id
);
-- Esperado: 0
```

### 5.3 Discrepancias de status (mientras dure dual-write)

```sql
-- Generar para cada tabla core:
SELECT 'base_card' AS entity, bc.id,
  bc.status AS core, es.status AS editorial
FROM base_card bc
JOIN editorial_state es
  ON es.entity_type = get_entity_type_id('base_card') AND es.entity_id = bc.id
WHERE bc.status IS DISTINCT FROM es.status;

-- Repetir para arcana, facet, base_card_type, base_skills, world, world_card
```

### 5.4 Índices duplicados (verificar que se eliminaron)

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Buscar pares con mismo indexdef
```

### 5.5 EXPLAIN de queries críticas

```sql
-- Cola editorial
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM editorial_state
WHERE status IN ('pending_review', 'review', 'changes_requested')
ORDER BY modified_at DESC
LIMIT 50;

-- Dashboard con métricas
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM v_editorial_dashboard
WHERE status = 'review'
ORDER BY modified_at DESC
LIMIT 50;

-- Progreso de traducción por idioma
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM v_translation_progress
WHERE language_code = 'es'
  AND translation_status = 'draft';

-- Entidades sin traducción
EXPLAIN (ANALYZE, BUFFERS)
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

### 5.6 Integridad de `content_version_entities`

```sql
-- Entidades en content_version_entities que no están en editorial_state
SELECT cve.*
FROM content_version_entities cve
WHERE NOT EXISTS (
  SELECT 1 FROM editorial_state es
  WHERE es.entity_type = cve.entity_type AND es.entity_id = cve.entity_id
);
-- Esperado: 0 (toda entidad versionada debe tener estado editorial)
```

---

## Apéndice A — Resumen de Propuestas

| # | Propuesta | Impacto | Riesgo | Esfuerzo | Tipo |
|---|---|---|---|---|---|
| P1 | PK + constraints en `editorial_metrics` | Alto | Bajo | Bajo | Schema |
| P2 | Eliminar índices duplicados | Medio | Bajo | Bajo | Índice |
| P3 | PK en `entity_relations` | Alto | Bajo | Bajo | Schema |
| P4 | `content_revisions.status` → ENUM | Medio | Bajo | Bajo | Schema |
| P5 | Timestamps en traducciones incompletas | Alto | Bajo | Bajo | Schema + trigger |
| P6 | `is_published` en `content_versions` | Alto | Bajo | Bajo | Schema + índice |
| P7 | Migrar `entity_type` varchar → int2 | Alto | Medio | Medio | Migración |
| P8 | Vistas de huérfanos + trigger cleanup | Alto | Medio | Medio | Vista + trigger |
| P9 | Vista `v_editorial_dashboard` | Alto | Bajo | Medio | Vista |
| P10 | Vista `v_translation_progress` | Alto | Bajo | Bajo | Vista |
| P11 | Deprecar DOMAIN `entity_type` | Bajo | Bajo | Bajo | Cleanup |
| P12 | Documentar `entity_relations` como complemento | Medio | Bajo | Bajo | Documentación |
| P13 | Índices parciales para colas editoriales | Medio | Bajo | Bajo | Índice |

---

## Apéndice B — Orden de Ejecución Sugerido

**Sprint 1 (Quick wins, sin riesgo)**:
1. P2 — Drop índices duplicados
2. P1 — PK en `editorial_metrics`
3. P3 — PK en `entity_relations`
4. P4 — ENUM en `content_revisions.status`
5. P5 — Timestamps en traducciones
6. P12 — Documentar `entity_relations`

**Sprint 2 (Vistas y versionado)**:
7. P6 — `is_published` en `content_versions`
8. P9 — Vista `v_editorial_dashboard`
9. P10 — Vista `v_translation_progress`
10. P13 — Índices parciales

**Sprint 3 (Migración de tipos)**:
11. P7 — Migrar `entity_type` varchar → int2 (Fases 1-4)
12. P8 — Vistas de huérfanos + triggers
13. P11 — Deprecar DOMAIN

**Ongoing**: Plan de migración de doble fuente de verdad (Sección 4, Fases 0-4)
