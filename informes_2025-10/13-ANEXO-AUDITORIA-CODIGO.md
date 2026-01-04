# 🔬 Anexo: Auditoría de Código Real - Tarot2

*Este documento refleja hallazgos de una revisión directa del código fuente, no solo de la documentación existente.*

---

## 1. Resumen de Revisión

### Archivos Analizados

| Área | Archivos | Líneas (est.) |
|------|----------|---------------|
| **server/utils** | 15 archivos | ~2,500 |
| **server/middleware** | 3 archivos | ~200 |
| **server/plugins** | 4 archivos | ~300 |
| **server/schemas** | 16 archivos | ~1,200 |
| **server/api** | 109 endpoints | ~5,000 |
| **app/composables** | 48 archivos | ~4,000 |
| **app/components** | 56 archivos | ~6,000 |
| **app/pages** | 15 archivos | ~1,500 |
| **Total** | **~261 archivos** | **~20,700 líneas** |

---

## 2. Backend - Hallazgos Reales

### 2.1 createCrudHandlers.ts (333 líneas)

**Archivo:** `/server/utils/createCrudHandlers.ts`

**Características implementadas:**
- ✅ Factoría completa de handlers CRUD (list, create, detail, update, remove)
- ✅ Soporte integrado de traducción con `translatableUpsert` y `deleteLocalizedEntity`
- ✅ Integración automática con `buildFilters` para paginación/ordenación
- ✅ Logging estructurado con scope, timeMs, métricas
- ✅ Marcado de fallback de idioma con `markLanguageFallback`
- ✅ Validación Zod de query/body via schemas configurables
- ✅ Aborto de peticiones in-flight

**Código destacado:**
```typescript
export function createCrudHandlers<...>(config: CrudHandlersConfig<...>): CrudHandlers {
  const translation = config.translation === undefined ? {
    table: `${String(config.baseTable)}_translations` as keyof DB,
    foreignKey: `${String(config.baseTable).replace(/s$/, '')}_id`,
    languageKey: 'language_code',
    defaultLang: 'en',
  } : config.translation
  // ...
}
```

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Patrón robusto y bien tipado.

---

### 2.2 translatableUpsert.ts (192 líneas)

**Archivo:** `/server/utils/translatableUpsert.ts`

**Características:**
- ✅ Upsert transaccional para entidades traducibles
- ✅ Creación automática de traducción EN fallback en nuevas entidades
- ✅ Lógica de pruning de undefined values
- ✅ Resultado detallado: `{ id, lang, wasCreated, translationInserted, translationUpdated, row }`

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Maneja edge cases correctamente.

---

### 2.3 filters.ts (162 líneas)

**Archivo:** `/server/utils/filters.ts`

**Características:**
- ✅ Paginación segura con límites (1-100 items)
- ✅ Whitelist de campos de ordenación (previene SQL injection)
- ✅ Búsqueda configurable via `applySearch` o `searchColumns`
- ✅ Filtro de status con columna configurable
- ✅ Filtro de rangos de fecha (createdRange, resolvedRange)
- ✅ Count distinct para entidades con joins

**Código destacado:**
```typescript
if (sortFieldInput && !allowedSortFields.includes(sortFieldInput)) {
  throw createError({
    statusCode: 400,
    statusMessage: `Invalid sort field '${sortFieldInput}'. Allowed: ${allowedSortFields.join(', ')}`,
  })
}
```

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Seguro y extensible.

---

### 2.4 Middleware de Autenticación

**Archivos:** `/server/middleware/00.auth.hydrate.ts`, `01.auth.guard.ts`, `02.rate-limit.ts`

**00.auth.hydrate.ts (64 líneas):**
- ✅ Extrae token de cookie `auth_token`
- ✅ Verifica JWT con jose
- ✅ Carga usuario con roles via JOIN
- ✅ Merge de permisos de todos los roles
- ✅ Popula `event.context.user`

**01.auth.guard.ts (38 líneas):**
- ✅ Rutas públicas: `/api/auth/login`, `/api/auth/logout`
- ✅ Bloqueo de usuarios suspendidos
- ✅ Verificación de permisos para rutas admin

**02.rate-limit.ts (86 líneas):**
- ✅ Límite global: 300 req/5min
- ✅ Límite sensible: 10 req/min para login/logout/publish/revert
- ✅ Patrones regex para rutas sensibles
- ✅ Logging de hits de rate limit

**Calidad:** ⭐⭐⭐⭐ Muy bueno - Falta migrar a Redis para multi-nodo.

---

### 2.5 auth.ts Plugin (120 líneas)

**Archivo:** `/server/plugins/auth.ts`

**Características:**
- ✅ Hash bcrypt con 10 rounds
- ✅ JWT HS256 con expiración configurable
- ✅ Parser de formato de expiración (1d, 2h, 30m)
- ✅ `getUserFromEvent` con fallback header/cookie
- ✅ `tryGetUserId` para casos opcionales

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Implementación segura.

---

### 2.6 logger.ts Plugin (72 líneas)

**Archivo:** `/server/plugins/logger.ts`

**Características:**
- ✅ Pino con pretty-print en desarrollo
- ✅ requestId UUID por petición
- ✅ Child logger con method/url
- ✅ Hook de request start/end con durationMs
- ✅ Hook de error para unhandled exceptions

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Observabilidad bien implementada.

---

### 2.7 Ejemplo de CRUD: world/_crud.ts (232 líneas)

**Archivo:** `/server/api/world/_crud.ts`

**Características:**
- ✅ Uso correcto de `createCrudHandlers`
- ✅ Query builder con COALESCE para traducciones
- ✅ Subquery para tags con JSON aggregation
- ✅ Filtros por tags (name o ids)
- ✅ SortColumnMap con expresiones SQL
- ✅ Logging con metadatos personalizados

**Código destacado:**
```typescript
sql`
  (select coalesce(json_agg(
    json_build_object('id', tg.id, 'name', coalesce(tt_req.name, tt_en.name), ...)
  ) filter (where tg.id is not null), '[]'::json)
  from tag_links as tl ...
  where tl.entity_type = ${'world'} and tl.entity_id = w.id)
`.as('tags')
```

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Patrón reproducible para otras entidades.

---

### 2.8 publish.post.ts (219 líneas)

**Archivo:** `/server/api/content_versions/publish.post.ts`

**Características:**
- ✅ Rate limiting enforced
- ✅ Verificación de permiso `canPublish`
- ✅ Transacción para crear/actualizar version
- ✅ Actualiza revisiones `approved` → `published`
- ✅ Actualiza `content_version_id` en entidades
- ✅ Logging detallado con métricas

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Flujo editorial robusto.

---

### 2.9 Schemas Zod

**Directorio:** `/server/schemas/`

**Patrones observados:**
- ✅ Schemas separados: query, create, update por entidad
- ✅ Helpers reutilizables: `stringArrayParam`, `numberArrayParam`, `languageCodeSchema`
- ✅ Preprocess para arrays de query string
- ✅ Transformaciones lowercase para idiomas

**Ejemplo world.ts:**
```typescript
export const worldQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(150).optional(),
  status: z.string().optional(),
  is_active: queryBoolean.optional(),
  tags: stringArrayParam,
  tag_ids: numberArrayParam,
  sort: z.enum(worldSortFields).optional(),
  direction: sortDirectionSchema,
  lang: optionalLanguageCodeSchema,
})
```

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Tipado fuerte y validación completa.

---

### 2.10 database/types.ts (575 líneas)

**Generado por:** kysely-codegen

**Entidades definidas:**
- `Arcana`, `ArcanaTranslations`
- `BaseCard`, `BaseCardTranslations`
- `BaseCardType`, `BaseCardTypeTranslations`
- `BaseSkills`, `BaseSkillsTranslations`
- `CardEffects`
- `ContentFeedback`, `ContentRevisions`, `ContentVersions`
- `EffectTarget`, `EffectTargetTranslations`
- `EffectType`, `EffectTypeTranslations`
- `Facet`, `FacetTranslations`
- `Roles`, `Users`, `UserRoles`
- `Tags`, `TagsTranslations`, `TagLinks`
- `World`, `WorldTranslations`
- `WorldCard`, `WorldCardTranslations`

**Enums:**
- `CardStatus`: draft, review, approved, published, archived, etc.
- `FeedbackStatus`: open, resolved, dismissed
- `UserStatus`: active, inactive, suspended, banned, pending
- `ReleaseStage`: dev, alfa, beta, candidate, release, revision

**Calidad:** ⭐⭐⭐⭐⭐ Tipos completos y documentados.

---

## 3. Frontend - Hallazgos Reales

### 3.1 useEntity.ts (661 líneas)

**Archivo:** `/app/composables/manage/useEntity.ts`

**Características implementadas:**
- ✅ CRUD genérico SSR-safe con `useAsyncData`
- ✅ Filtros reactivos con debounce (300ms)
- ✅ Paginación integrada con `usePaginatedList`
- ✅ Caché en memoria con invalidación
- ✅ Revalidación on focus (visibilitychange)
- ✅ Abort de peticiones in-flight
- ✅ Normalización robusta de respuestas API (múltiples formatos)
- ✅ Soporte para validación Zod opcional
- ✅ Métodos: fetchList, fetchOne, create, update, remove, updateStatus, updateTags

**Código destacado:**
```typescript
function normalizeListResponse<TItem>(raw: unknown): NormalizedListResponse<TItem> {
  const containers = [r, r.data, r.payload, r.body, r.result]
  for (const container of containers) {
    if (Array.isArray(container)) { items = container; break }
    for (const key of ['data', 'results', 'items', 'rows', 'list', 'records']) {
      const candidate = (container as Record<string, unknown>)?.[key]
      if (Array.isArray(candidate)) { items = candidate; break }
    }
  }
  // ...
}
```

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Muy robusto y flexible.

---

### 3.2 useEntityCapabilities.ts (158 líneas)

**Archivo:** `/app/composables/common/useEntityCapabilities.ts`

**Características:**
- ✅ Configuración declarativa por tipo de entidad
- ✅ Defaults sensatos + overrides por inject/provide
- ✅ Capabilities: translatable, hasTags, hasPreview, hasRevisions, hasStatus, hasReleaseStage, hasLanguage, actionsBatch

**Mapa de capabilities:**
```typescript
const ENTITY_CAPABILITIES_MAP: Record<string, Partial<EntityCapabilities>> = {
  arcana: { translatable: true, hasTags: true, hasPreview: true, hasRevisions: true, ... },
  base_card: { translatable: true, hasTags: true, ... },
  world: { translatable: true, hasTags: true, hasRevisions: false, ... },
  content_version: { translatable: false, hasTags: false, hasReleaseStage: true, ... },
  users: { translatable: false, hasLanguage: false, actionsBatch: true, ... },
}
```

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Patrón muy limpio.

---

### 3.3 useQuerySync.ts (287 líneas)

**Archivo:** `/app/composables/common/useQuerySync.ts`

**Características:**
- ✅ Sincronización bidireccional state ↔ URL query
- ✅ Parsers/serializers configurables por campo
- ✅ Deep clone con structuredClone + fallback JSON
- ✅ Skip de sincronización para evitar loops
- ✅ Soporte para arrays, booleans, numbers, dates

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - SSR-safe y robusto.

---

### 3.4 useTableSelection.ts (126 líneas)

**Archivo:** `/app/composables/common/useTableSelection.ts`

**Características:**
- ✅ **YA IMPLEMENTADO** (contradice informes previos)
- ✅ selectedIds como ShallowRef<Set<number>>
- ✅ selectedList como computed array
- ✅ toggleOne, toggleAll, clear, isSelected
- ✅ isAllSelected, isIndeterminate para checkbox header
- ✅ Normalización de IDs (string → number)

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Implementación completa.

---

### 3.5 CommonDataTable.vue (448 líneas)

**Archivo:** `/app/components/common/CommonDataTable.vue`

**Características:**
- ✅ Wrapper de `<UTable>` con slots extensibles
- ✅ Selección integrada con checkbox header
- ✅ Columnas condicionales por capabilities
- ✅ Density toggle (compact/regular/comfortable)
- ✅ StatusBadge automático para status/release/translation
- ✅ Paginación integrada con `<PaginationControls>`
- ✅ Slots: title, toolbar, selection, cell-*, row-preview, empty, loading, footer
- ✅ Expose: selectedIds, runBatchWith

**Código destacado:**
```typescript
const resolvedColumns = computed<TableColumn[]>(() => {
  if (selectable.value) list.push({ id: 'select', ... })
  list.push(...baseColumns.value)
  if (caps.hasStatus && !existing.has('status')) list.push({ id: 'status', ... })
  if (caps.translatable && !existing.has('translationStatus')) list.push({ id: 'translationStatus', ... })
  if (caps.hasTags && !existing.has('tags')) list.push({ id: 'tags', ... })
  // ...
})
```

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Muy completo y flexible.

---

### 3.6 ManageTableBridge.vue (257 líneas)

**Archivo:** `/app/components/manage/ManageTableBridge.vue`

**Características:**
- ✅ Bridge entre datos crudos y CommonDataTable
- ✅ Transformación via `mapEntitiesToRows`
- ✅ BulkActionsBar condicional
- ✅ Adaptador de selección para composables externos
- ✅ Normalización de columnas legacy → ColumnDefinition
- ✅ Inferencia automática de capabilities por key

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Abstracción bien diseñada.

---

### 3.7 EntityInspectorDrawer.vue (387 líneas)

**Archivo:** `/app/components/manage/EntityInspectorDrawer.vue`

**Características:**
- ✅ USlideover con aria-describedby accesible
- ✅ Lazy fetch de preview con `useEntityPreviewFetch`
- ✅ EntitySummary para metadatos
- ✅ Sección de traducciones
- ✅ Sección de tags
- ✅ Campos estándar (status, active, language, author)
- ✅ Slot actions para botones de acción
- ✅ Skeleton loading

**Calidad:** ⭐⭐⭐⭐⭐ Excelente - Accesible y completo.

---

### 3.8 EntityBase.vue (28,746 bytes - ~700 líneas)

**Archivo:** `/app/components/manage/EntityBase.vue`

**Observación:** Componente grande que maneja:
- Listado con tabla/cards
- Filtros
- Modales de crear/editar
- Preview drawer
- Bulk actions

**Posible refactor:** Podría dividirse en componentes más pequeños.

---

### 3.9 Páginas

**manage.vue (188 líneas):**
- ✅ Tabs para cada tipo de entidad
- ✅ ViewControls para cambiar modo tabla/cards
- ✅ Configuración declarativa por entidad
- ✅ 7 entidades: cardType, baseCard, world, arcana, facet, skill, tag

**admin/index.vue (4,794 bytes):**
- Dashboard de administración

**admin/versions/ y admin/feedback/:**
- Gestión de versiones y feedback

---

## 4. Métricas Reales del Código

### 4.1 Conteo de Archivos

| Directorio | Archivos | Extensión |
|------------|----------|-----------|
| server/api | 109 | .ts |
| server/utils | 15 | .ts |
| server/schemas | 16 | .ts |
| server/middleware | 3 | .ts |
| server/plugins | 4 | .ts |
| app/composables | 48 | .ts |
| app/components | 56 | .vue |
| app/pages | 15 | .vue |

### 4.2 Líneas de Código Estimadas

| Área | Líneas |
|------|--------|
| Backend total | ~8,000 |
| Frontend total | ~12,000 |
| Documentación | ~5,000 |
| **Total** | **~25,000** |

### 4.3 Dependencias Principales (package.json)

```json
{
  "nuxt": "^4.2.1",
  "@nuxt/ui": "4.2.1",
  "@nuxtjs/i18n": "^10.2.1",
  "kysely": "^0.28.8",
  "zod": "^4.1.12",
  "pinia": "^3.0.4",
  "jose": "^6.0.11",
  "bcrypt": "^6.0.0",
  "pino": "^9.8.0",
  "sharp": "^0.34.4"
}
```

---

## 5. Correcciones a Documentación Previa

### 5.1 useTableSelection YA EXISTE

**Documentación previa decía:** "useTableSelection: No implementado"

**Realidad:** Está implementado en `/app/composables/common/useTableSelection.ts` con 126 líneas de código funcional.

### 5.2 BulkActionsBar YA EXISTE

**Realidad:** Existe en `/app/components/manage/BulkActionsBar.vue` (1,507 bytes).

### 5.3 Skeletons Reutilizables

**Documentación previa decía:** "No implementado"

**Realidad:** `EntityInspectorDrawer` ya usa `<USkeleton>` de Nuxt UI.

---

## 6. Calidad Global del Código

### Puntuación por Área

| Área | Puntuación | Observación |
|------|------------|-------------|
| Backend Utils | ⭐⭐⭐⭐⭐ | Patrones sólidos, bien tipado |
| Backend API | ⭐⭐⭐⭐⭐ | Consistente, usa factory |
| Middleware | ⭐⭐⭐⭐ | Funcional, falta Redis |
| Schemas Zod | ⭐⭐⭐⭐⭐ | Completos y reutilizables |
| Composables | ⭐⭐⭐⭐⭐ | SSR-safe, bien estructurados |
| Componentes | ⭐⭐⭐⭐ | Buenos, algunos grandes |
| Páginas | ⭐⭐⭐⭐ | Funcionales, config declarativa |
| **Promedio** | **⭐⭐⭐⭐½** | **Muy buena calidad** |

---

## 7. Recomendaciones Actualizadas

### Alta Prioridad (Corregidas)

1. ~~Implementar useTableSelection~~ → **Ya existe**
2. ~~Crear BulkActionsBar~~ → **Ya existe**
3. **Migrar VersionList.vue a AdminTableBridge** → Pendiente real
4. **Migrar RevisionsTable.vue a AdminTableBridge** → Pendiente real
5. **Rate limit a Redis** → Pendiente real

### Media Prioridad

1. Refactorizar `EntityBase.vue` (muy grande)
2. Añadir aria-labels a botones icónicos
3. Normalizar v-model en USelectMenu
4. Helper SQL para tags AND/ANY

### Baja Prioridad

1. Storybook para documentación visual
2. Dashboard de métricas
3. Testing automatizado (Playwright)

---

*Este anexo refleja el estado real del código al momento de la revisión. La documentación previa contenía algunas imprecisiones que han sido corregidas.*
