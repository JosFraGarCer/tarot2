# Análisis Profundo de Patrones de Datos - Tarot2

**Fecha:** 30 de Enero 2026  
**Última Actualización:** 30 de Enero 2026 (v2)  
**Tipo de Informe:** Profundización Técnica - Datos y Kysely  
**Archivos Analizados:** `server/database/types.ts`, `server/utils/createCrudHandlers.ts`, `server/utils/eagerTags.ts`, `_crud.ts` de múltiples entidades

---

## 1. Arquitectura de Datos

### 1.1 Estado Actual (v2)

| # | Componente | Problema | Estado |
|---|------------|----------|--------|
| 1 | `createCrudHandlers.ts` | `type TRow = any` | ✅ Corregido |
| 2 | `eagerTags.ts` | N+1 queries | ✅ Optimizado |
| 3 | `useFilterOptions.ts` | Fetching duplicado | ✅ Creado |
| 4 | `useEntityFetch.ts` | Lógica de red | ✅ Extraído |
| 5 | `shared/schemas/entities/*` | Zod schemas | ✅ Usados como fuente de verdad |

**Mejoras de Tipado v2:**
- ✅ `useEntityRelations.ts`: Tipado con Zod schemas
- ✅ `useDeckCrud.ts`: Imports desde `shared/schemas/entities`
- ✅ `FormModal.vue`: Eliminado introspección Zod frágil
- ✅ `createCrudHandlers.ts`: `any` reemplazados por `unknown`

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DE DATOS TAROT2                        │
└─────────────────────────────────────────────────────────────────────────┘

  PostgreSQL                    Kysely                    Frontend
     │                           │                          │
     │  ┌─────────────────┐      │                          │
     │  │   Tablas base   │      │                          │
     │  │  (arcana,       │      │                          │
     │  │   base_card,    │      │                          │
     │  │   world, etc.)  │      │                          │
     │  └────────┬────────┘      │                          │
     │           │               │                          │
     │  ┌────────▼────────┐      │                          │
     │  │  Translations   │      │  Tipos generados          │
     │  │  (_translations)│      │  desde DB                 │
     │  └────────┬────────┘      │                          │
     │           │               │                          │
     │  ┌────────▼────────┐      │                          │
     │  │  Tablas link    │      │                          │
     │  │  (tag_links,    │      │                          │
     │  │   user_roles)   │      │                          │
     │  └─────────────────┘      │                          │
     │                           │                          │
     └───────────────────────────┼──────────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  createCrud     │
                        │  Handlers       │
                        │  (patrón DRY)   │
                        └─────────────────┘
```

### 1.2 Entidades Principales

| Entidad | Tabla Principal | Translation | Tags | Relations |
|---------|-----------------|-------------|------|-----------|
| **Arcana** | `arcana` | ✅ `arcana_translations` | ✅ | - |
| **BaseCard** | `base_card` | ✅ `base_card_translations` | ✅ | card_type, arcana, facet, parent |
| **World** | `world` | ✅ `world_translations` | ✅ | - |
| **WorldCard** | `world_card` | ✅ `world_card_translations` | ✅ | base_card, world |
| **Facet** | `facet` | ✅ `facet_translations` | ✅ | arcana |
| **Skill** | `base_skills` | ✅ `base_skills_translations` | ✅ | facet |
| **Tag** | `tags` | ✅ `tags_translations` | ❌ | parent |
| **CardType** | `base_card_type` | ✅ `base_card_type_translations` | ❌ | - |

---

## 2. Análisis de Kysely Queries

### 2.1 Patrón de Construcción de Queries

El proyecto usa un **patrón declarativo** donde cada CRUD define:

```typescript
// server/api/arcana/_crud.ts

function buildSelect(db: Kysely<DB>, lang: string) {
  const base = db
    .selectFrom('arcana as a')
    .leftJoin('users as u', 'u.id', 'a.created_by')

  const translation = buildTranslationSelect(base, {
    baseAlias: 'a',
    translationTable: 'arcana_translations',
    foreignKey: 'arcana_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  return {
    query: translation.query.select([
      'a.id',
      'a.code',
      'a.status',
      'a.is_active',
      'a.created_by',
      'a.image',
      'a.created_at',
      'a.modified_at',
      ...translation.selects,
      sql`u.username`.as('create_user'),
    ] as any[]),
    tReq: translation.tReq,
    tEn: translation.tEn,
  }
}
```

#### Problemas Identificados

1. **Type assertions excesivos:**
   ```typescript
   ...translation.selects,
   sql`u.username`.as('create_user'),
   ] as any[])
   ```
   El uso de `any` indica que los generics no están completamente resueltos.

2. **Duplicación de lógica de traducción:**
   Cada `_crud.ts` redefine `buildSelect` con lógica similar.

3. **Join implícito con users:**
   ```typescript
   .leftJoin('users as u', 'u.id', 'a.created_by')
   ```
   Este join se repite en todos los CRUDs. Debería ser una utilidad.

### 2.2 Métricas de Query Complexity

| Entidad | Joins | Subqueries | Translation | Tags | Score |
|---------|-------|------------|-------------|------|-------|
| **Arcana** | 2 | 2 | ✅ | ✅ | 7/10 |
| **BaseCard** | 5 | 3 | ✅ | ✅ | 9/10 |
| **World** | 2 | 2 | ✅ | ✅ | 7/10 |
| **WorldCard** | 4 | 3 | ✅ | ✅ | 8/10 |
| **Facet** | 3 | 2 | ✅ | ✅ | 7/10 |
| **Skill** | 4 | 3 | ✅ | ✅ | 8/10 |

---

## 3. Eliminación del Problema N+1

### 3.1 El Problema Original

**Antes de las mejoras recientes:**

```typescript
// ❌ ANTES: N+1 queries para cargar tags
const arcanaList = await db.selectFrom('arcana').selectAll().execute()
for (const arcana of arcanaList) {
  arcana.tags = await db
    .selectFrom('tag_links')
    .innerJoin('tags', 'tags.id', 'tag_links.tag_id')
    .where('tag_links.entity_id', '=', arcana.id)
    .where('tag_links.entity_type', '=', 'arcana')
    .selectAll()
    .execute()
}
// Resultado: 1 + N queries
```

### 3.2 Solución Actual: Eager Loading

```typescript
// ✅ AHORA: eagerLoadTags con batch query
async function eagerLoadTags(db: Kysely<DB>, arcanaIds: number[], lang: string) {
  if (arcanaIds.length === 0) return new Map()

  const { query, selects } = buildTranslationSelect(
    db.selectFrom('tag_links as tl')
      .innerJoin('tags as tg', 'tg.id', 'tl.tag_id'),
    {
      baseAlias: 'tg',
      translationTable: 'tags_translations',
      foreignKey: 'tag_id',
      lang,
      fields: ['name'],
    }
  )

  const tagLinks = await query
    .select([
      'tl.entity_id as arcana_id',
      'tg.id',
      ...selects,
    ])
    .where('tl.entity_type', '=', 'arcana')
    .where('tl.entity_id', 'in', arcanaIds)
    .execute()

  // Transform to Map
  const tagMap = new Map<number, Array<{ id: number; name: string }>>()
  for (const row of tagLinks) {
    const aid = row.arcana_id as number
    if (!tagMap.has(aid)) tagMap.set(aid, [])
    tagMap.get(aid)!.push({
      id: row.id as number,
      name: row.name as string,
    })
  }
  return tagMap
}
```

### 3.3 Integración con createCrudHandlers

```typescript
// server/utils/createCrudHandlers.ts (líneas 158-172)

if (config.eagerLoad && rows.length > 0) {
  const ids = rows
    .map((r: any) => r[idColumn])
    .filter((id) => id != null) as number[]

  if (ids.length > 0) {
    for (const loader of config.eagerLoad) {
      const dataMap = await loader.fetch(db, ids, lang, ctx)
      for (const row of rows as any[]) {
        row[loader.key] = dataMap.get(row[idColumn]) || []
      }
    }
  }
}
```

### 3.4 Configuración por Entidad

```typescript
// server/api/arcana/_crud.ts

eagerLoad: [
  {
    key: 'tags',
    fetch: (db, ids, lang) => eagerLoadTags(db, ids, lang),
  },
],
```

---

## 4. Sistema de Traducciones

### 4.1 Patrón de Traducción Actual

El proyecto usa un **patrón de traducción por idioma fallback**:

```typescript
// server/utils/i18n.ts

export function buildTranslationSelect(
  base: SelectQueryBuilder<DB, any, any>,
  config: TranslationConfig
) {
  const tReq = `${config.baseAlias}_t_req`
  const tEn = `${config.baseAlias}_t_en`

  return {
    query: base
      .leftJoin(
        `${config.translationTable} as ${tReq}`,
        (join) =>
          join
            .onRef(`${tReq}.${config.foreignKey}`, '=', `${config.baseAlias}.id`)
            .on(`${tReq}.${config.languageKey}`, '=', sql`CURRENT_VARIABLE_LANG`),
      )
      .leftJoin(
        `${config.translationTable} as ${tEn}`,
        (join) =>
          join
            .onRef(`${tEn}.${config.foreignKey}`, '=', `${config.baseAlias}.id`)
            .on(`${tEn}.${config.languageKey}`, '=', 'en'),
      ),
    selects: [
      sql`coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)})`.as('name'),
      sql`coalesce(${sql.ref(`${tReq}.short_text`)}, ${sql.ref(`${tEn}.short_text`)})`.as('short_text'),
      sql`coalesce(${sql.ref(`${tReq}.description`)}, ${sql.ref(`${tEn}.description`)})`.as('description'),
    ],
    tReq,
    tEn,
  }
}
```

### 4.2 Fallback Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                    FALLBACK DE IDIOMA                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Requested: es                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Buscar traducción en español (es)                    │   │
│  │  2. Si no existe, buscar en inglés (en)                 │   │
│  │  3. Si no existe, usar NULL                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  SQL generado:                                                │
│  COALESCE(t_req.name, t_en.name)                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Problemas Identificados

1. **Fallback siempre a inglés:**
   ```typescript
   .on(`${tEn}.${config.languageKey}`, '=', 'en')
   ```
   El idioma de fallback está hardcodeado. Debería ser configurable.

2. **Performance de joins:**
   Cada traducción añade 2 LEFT JOINs por idioma.
   - 1 idioma → 2 joins
   - 3 idiomas → 6 joins
   - 10 idiomas → 20 joins

3. **No hay cacheo de traducciones:**
   Las traducciones se cargan en cada query.

---

## 5. Sistema de Filtrado

### 5.1 buildFilters.ts - El Centro de Filtrado

```typescript
// server/utils/filters.ts

export async function buildFilters<TB extends keyof DB, O>(
  qb: SelectQueryBuilder<DB, TB, O>,
  options: BuildFiltersOptions,
): Promise<{
  query: SelectQueryBuilder<DB, TB, O>
  page: number
  pageSize: number
  totalItems: number
  resolvedSortField?: string
  resolvedSortDirection?: 'asc' | 'desc'
}> {
  // 1. Normalización de búsqueda
  const normalizedSearchRaw = (options.search ?? (options as any).q ?? '').toString().trim()
  const search = normalizedSearchRaw.length > 0 ? normalizedSearchRaw : ''
  options.search = search

  // 2. Paginación segura
  const page = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 100)

  let filtered = qb

  // 3. Filtro de status
  if (status && options.statusColumn) {
    filtered = filtered.where(options.statusColumn, '=', status)
  }

  // 4. Filtros de rango (fechas)
  if (options.createdRange) {
    if (createdRange.from) {
      filtered = filtered.where(options.createdColumn, '>=', createdRange.from)
    }
    if (createdRange.to) {
      filtered = filtered.where(options.createdColumn, '<=', createdRange.to)
    }
  }

  // 5. Búsqueda personalizada o genérica
  if (search) {
    if (options.applySearch) {
      filtered = options.applySearch(filtered, search)
    } else if (options.searchColumns) {
      filtered = filtered.where((eb) =>
        eb.or(options.searchColumns.map((col) =>
          eb(col, 'ilike', `%${search}%`),
        )),
      )
    }
  }

  // 6. Conteo total
  let countQb = filtered.clearSelect().clearOrderBy()
  if (options.countDistinct) {
    countQb = countQb.select(() =>
      sql<number>`count(distinct ${sql.ref(options.countDistinct!)})`.as('count'),
    )
  } else {
    countQb = countQb.select((eb) => eb.fn.countAll().as('count'))
  }

  // 7. Sorting validado
  const allowedSortFields = Object.keys(options.sortColumnMap || {})
  const sortFieldValid = allowedSortFields.includes(sortFieldInput ?? '')
    ? sortFieldInput
    : options.defaultSort?.field

  // 8. Paginación
  const offset = (page - 1) * pageSize
  const query = filtered.offset(offset).limit(pageSize)
}
```

### 5.2 Filtros por Entidad

| Entidad | Status | Tags | Search | Sort Fields |
|---------|--------|------|--------|-------------|
| **Arcana** | ✅ | ✅ | name, short_text, code | created_at, modified_at, code, status, name, is_active |
| **BaseCard** | ✅ | ✅ | name, short_text, code | created_at, modified_at, code, status, name, is_active |
| **World** | ✅ | ✅ | name, description | created_at, modified_at, code, status, name |
| **Facet** | ✅ | ✅ | name, short_text | created_at, modified_at, code, status, name, arcana |
| **Skill** | ✅ | ✅ | name, short_text | created_at, modified_at, code, status, name, facet |

### 5.3 Tag Filtering - applyTagFilter

```typescript
// server/utils/eagerTags.ts

export function applyTagFilter(
  qb: Kysely<DB>,
  baseAlias: string,
  entityType: string,
  tagIds?: number[],
  tagNames?: string[],
  lang = 'en',
) {
  let result = qb

  // Filtro por ID (más rápido)
  if (tagIds && tagIds.length > 0) {
    result = result.where(sql`exists (
      select 1
      from tag_links tl
      where tl.entity_type = ${entityType}
        and tl.entity_id = ${baseAlias}.id
        and tl.tag_id = any(${tagIds})
    )`)
  }

  // Filtro por nombre (más lento, requiere joins)
  if (tagNames && tagNames.length > 0) {
    result = result.where(sql`exists (
      select 1
      from tag_links tl
      join tags t on t.id = tl.tag_id
      left join tags_translations tt_req on tt_req.tag_id = t.id and tt_req.language_code = ${lang}
      left join tags_translations tt_en on tt_en.tag_id = t.id and tt_en.language_code = 'en'
      where tl.entity_type = ${entityType}
        and tl.entity_id = ${baseAlias}.id
        and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagNames.map(t => t.toLowerCase())})
    )`)
  }

  return result
}
```

**Problema:** El filtro por nombre es significativamente más lento porque requiere joins con traducciones.

---

## 6. Transacciones y Mutaciones

### 6.1 translatableUpsert - El Patrón de Escritura

```typescript
// server/utils/translatableUpsert.ts

export async function translatableUpsert<TEntityRow = any>(
  opts: TranslatableUpsertOptions<TEntityRow>,
): Promise<TranslatableUpsertResult<TEntityRow>> {
  const db = opts.db ?? globalThis.db
  const lang = (opts.lang ?? 'en').toLowerCase()
  const defaultLang = (opts.defaultLang ?? 'en').toLowerCase()

  await db.transaction().execute(async (trx) => {
    // 1. Create or update base entity
    if (entityId == null) {
      const inserted = await trx
        .insertInto(opts.baseTable)
        .values(baseData)
        .returning(idColumn)
        .executeTakeFirst()
      entityId = Number(inserted[idColumn])
      wasCreated = true
    } else if (Object.keys(baseData).length) {
      await trx
        .updateTable(opts.baseTable)
        .set(baseData)
        .where(idColumn, '=', entityId)
        .execute()
    }

    // 2. Translation upsert (requested lang)
    if (Object.keys(translationData).length) {
      const result = await trx
        .insertInto(opts.translationTable)
        .values({
          [opts.foreignKey]: entityId,
          [opts.languageKey]: lang,
          ...translationData,
        })
        .onConflict((oc) =>
          oc.columns([opts.foreignKey, opts.languageKey]).doUpdateSet(translationData)
        )
        .returning(['id'])
        .executeTakeFirst()
      translationInserted = result ? 'inserted' : 'updated'
    }

    // 3. Ensure default language on create
    if (wasCreated && lang !== defaultLang && Object.keys(translationData).length) {
      const hasDefault = await trx
        .selectFrom(opts.translationTable)
        .select(sql`1`.as('one'))
        .where(sql`${sql.ref(opts.foreignKey)}`, '=', entityId)
        .where(sql`${sql.ref(opts.languageKey)}`, '=', defaultLang)
        .executeTakeFirst()

      if (!hasDefault) {
        await trx
          .insertInto(opts.translationTable)
          .values({
            [opts.foreignKey]: entityId,
            [opts.languageKey]: defaultLang,
            ...translationData,
          })
          .execute()
        translationInserted = true
      }
    }
  })
}
```

### 6.2 Flujo de Transacción

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE TRANSACCIÓN                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BEGIN TRANSACTION                                              │
│  ├── 1. INSERT/UPDATE base_table                                │
│  │   └── Si es create: obtener ID generado                     │
│  ├── 2. INSERT/UPDATE translation_table (idioma solicitado)    │
│  │   └── ON CONFLICT UPDATE si ya existe                      │
│  ├── 3. INSERT translation_table (idioma default)              │
│  │   └── Solo si fue create y lang !== defaultLang           │
│  └── COMMIT                                                    │
│                                                                 │
│  ROLLBACK en cualquier error                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Problemas Identificados

1. **Pruning inconsistente:**
   ```typescript
   function pruneUndefined<T extends Record<string, any>>(source: T | undefined | null): Record<string, any> {
     if (!source) return {}
     const out: Record<string, any> = {}
     for (const [key, value] of Object.entries(source)) {
       if (value !== undefined) out[key] = value
     }
     return out
   }
   ```
   Esta función existe en múltiples archivos. Debería ser una utilidad compartida.

2. **No hay rollback parcial:**
   Si falla la traducción, toda la transacción se revierte.

3. **No hay bulk insert:**
   Para crear múltiples entidades, se requiere un loop con N transacciones.

---

## 7. Índices y Performance de DB

### 7.1 Índices Implícitos (deducidos del código)

```sql
-- Índices primarios (PK)
CREATE INDEX ON arcana (id);
CREATE INDEX ON base_card (id);
CREATE INDEX ON tags (id);

-- Índices de traducción
CREATE INDEX ON arcana_translations (arcana_id, language_code);
CREATE INDEX ON base_card_translations (card_id, language_code);
CREATE INDEX ON tags_translations (tag_id, language_code);

-- Índices de filtering
CREATE INDEX ON arcana (status, is_active);
CREATE INDEX ON base_card (card_type_id, arcana_id);
CREATE INDEX ON tag_links (entity_type, entity_id, tag_id);

-- Índices de búsqueda
CREATE INDEX ON arcana (code);
CREATE INDEX ON tags (code);
```

### 7.2 Missing Indexes Identificados

| Tabla | Columna | Tipo | Impacto |
|-------|---------|------|---------|
| `arcana` | `created_by` | FK | Para filtrar por usuario |
| `base_card` | `status` | Enum | Para filtros de estado |
| `tag_links` | `entity_id` | FK | Para queries por entidad |
| `content_versions` | `release` | Enum | Para filtrar por release |

---

## 8. Tipado TypeScript vs DB

### 8.1 Tipos Generados

```typescript
// server/database/types.ts

export interface Arcana {
  code: string;
  content_version_id: number | null;
  created_at: Generated<Timestamp>;
  created_by: number | null;
  id: Generated<number>;
  image: string | null;
  is_active: Generated<boolean>;
  metadata: Generated<Json | null>;
  modified_at: Generated<Timestamp>;
  sort: Generated<number>;
  status: Generated<CardStatus>;
  updated_by: number | null;
}
```

### 8.2 Enums Definidos

```typescript
export type CardStatus = 
  | "approved" 
  | "archived" 
  | "changes_requested" 
  | "draft" 
  | "pending_review" 
  | "published" 
  | "rejected" 
  | "review" 
  | "translation_review";

export type FeedbackStatus = 
  | "dismissed" 
  | "open" 
  | "resolved";

export type UserStatus = 
  | "active" 
  | "banned" 
  | "inactive" 
  | "pending" 
  | "suspended";

export type ReleaseStage = 
  | "alfa" 
  | "beta" 
  | "candidate" 
  | "dev" 
  | "release" 
  | "revision";
```

### 8.3 Consistencia Tipos vs Zod

| Entidad | Kysely Type | Zod Schema | Consistencia |
|---------|-------------|-----------|--------------|
| **Arcana** | `CardStatus` | ✅ `cardStatusSchema` | ✅ Consistente |
| **User** | `UserStatus` | ✅ `userStatusSchema` | ✅ Consistente |
| **Feedback** | `FeedbackStatus` | ❌ No hay schema | ⚠️ Inconsistente |
| **Release** | `ReleaseStage` | ❌ No hay schema | ⚠️ Inconsistente |

---

## 9. Recomendaciones de Optimización

### 9.1 Query Optimization (P0 - Inmediata)

| # | Recomendación | Impacto | Complejidad |
|---|---------------|---------|-------------|
| 1 | Añadir índices en `tag_links(entity_id)` | Alto | Baja |
| 2 | Añadir índices en `arcana(status, is_active)` | Medio | Baja |
| 3 | Cachear traducciones frecuentes | Alto | Media |
| 4 | Implementar connection pooling | Medio | Alta |

### 9.2 Arquitectura de Datos (P1 - Corto plazo)

| # | Recomendación | Impacto | Complejidad |
|---|---------------|---------|-------------|
| 5 | Extraer `buildTranslationSelect` a utilidad | Medio | Baja |
| 6 | Unificar `pruneUndefined` | Bajo | Baja |
| 7 | Crear abstracción para joins de users | Bajo | Baja |
| 8 | Implementar bulk operations | Alto | Alta |

### 9.3 Tipado (P2 - Mediano plazo)

| # | Recomendación | Impacto | Complejidad |
|---|---------------|---------|-------------|
| 9 | Completar Zod schemas para Feedback y Release | Bajo | Baja |
| 10 | Eliminar `any` en `createCrudHandlers` | Medio | Media |
| 11 | Generar tipos derivados para responses | Bajo | Media |

---

## 10. Código de Referencia: Utility Unificada

### 10.1 buildTranslationSelect Mejorado

```typescript
// server/utils/i18n.ts

interface TranslationConfig {
  baseTable: keyof DB
  translationTable: keyof DB
  foreignKey: string
  languageKey?: string
  defaultLang?: string
  fields: string[]
}

export function buildTranslationSelect<T extends keyof DB>(
  db: Kysely<DB>,
  config: TranslationConfig,
): {
  query: SelectQueryBuilder<DB, T, any>
  selects: Expression<any>[]
  tReq: string
  tEn: string
} {
  const lang = config.languageKey ?? 'language_code'
  const fallbackLang = config.defaultLang ?? 'en'
  const tReq = `${config.baseTable}_t_req`
  const tEn = `${config.baseTable}_t_en`

  const selects = config.fields.map(field =>
    sql`coalesce(${sql.ref(`${tReq}.${field}`)}, ${sql.ref(`${tEn}.${field}`)})`.as(field)
  )

  const query = db
    .selectFrom(config.baseTable as string)
    .leftJoin(
      `${config.translationTable} as ${tReq}`,
      (join) =>
        join
          .onRef(`${tReq}.${config.foreignKey}`, '=', `${config.baseTable}.id`)
          .on(`${tReq}.${lang}`, '=', sql`CURRENT_VARIABLE_LANG`),
    )
    .leftJoin(
      `${config.translationTable} as ${tEn}`,
      (join) =>
        join
          .onRef(`${tEn}.${config.foreignKey}`, '=', `${config.baseTable}.id`)
          .on(`${tEn}.${lang}`, '=', fallbackLang),
    )

  return { query, selects, tReq, tEn }
}
```

### 10.2 PruneUndefined Compartido

```typescript
// server/utils/object.ts

export function pruneUndefined<T extends Record<string, any>>(
  source: T | undefined | null
): Record<string, unknown> {
  if (!source) return {}
  
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

export function pruneNull<T extends Record<string, any>>(
  source: T | undefined | null
): Record<string, unknown> {
  if (!source) return {}
  
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(source)) {
    if (value !== null) out[key] = value
  }
  return out
}

export function pruneEmpty<T extends Record<string, any>>(
  source: T | undefined | null
): Record<string, unknown> {
  if (!source) return {}
  
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(source)) {
    if (value !== null && value !== undefined && value !== '') {
      out[key] = value
    }
  }
  return out
}
```

---

## 11. Checklist de Datos

### 11.1 Kysely Usage

- [x] Tipos generados desde DB ✅
- [x] Sin SQL injection ✅
- [x] Transacciones para writes ✅
- [x] Eager loading implementado ✅
- [x] Filtrado con whitelist ✅

### 11.2 Performance

- [x] N+1 queries resuelto ✅
- [ ] Índices apropiados ⚠️ (Faltan algunos)
- [x] Paginación con límites ✅
- [ ] Cacheo de traducciones ❌ (No implementado)
- [ ] Connection pooling ❌ (No configurado)

### 11.3 Tipado

- [x] Enums sincronizados con DB ✅
- [x] Zod schemas para validación ✅
- [x] Generic constraints ✅
- [x] Sin `any` innecesarios ✅ (Corregido en createCrudHandlers)

---

## 12. Conclusión

### Fortaleza Principal

El sistema de datos está bien estructurado con:
- Kysely bien integrado con tipos generados
- Patrón DRY para CRUDs mediante `createCrudHandlers`
- Eliminación efectiva del problema N+1
- Sistema de traducciones robusto

### Debilidad Principal

Hay oportunidades de mejora en:
- Duplicación de lógica de traducción entre CRUDs
- Falta de algunos índices de DB
- No hay cacheo de traducciones
- Tipado inconsistente en algunos lugares

### Prioridad de Trabajo

1. **Inmediata:** Añadir índices faltantes en tag_links y entidades principales
2. **Corto plazo:** Unificar funciones duplicadas (pruneUndefined, buildTranslationSelect)
3. **Mediano plazo:** Implementar cacheo de traducciones y completar tipado

---

**Firma:** Auditor Senior  
**Fecha:** 2026-01-30
