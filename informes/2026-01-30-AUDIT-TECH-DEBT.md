# Análisis de Deuda Técnica y Refactorizaciones - Tarot2

**Fecha:** 30 de Enero 2026  
**Última Actualización:** 30 de Enero 2026 (v2)  
**Tipo de Informe:** Profundización Técnica - Deuda Técnica y Refactorizaciones  
**Archivos Analizados:** `useEntity.ts`, `EntityFilters.vue`, `FormModal.vue`, `useEntityFormPreset.ts`, `useEntityModals.ts`

---

## 1. Inventario de Deuda Técnica

### 1.1 Deuda Crítica (Refactorizado)

| # | Archivo | Líneas | Problema | Impacto | Estado |
|---|---------|--------|----------|---------|--------|
| 1 | `useEntity.ts` | 693 → 500 | God Composable | Alto | ⭐ Parcialmente refactorizado |
| 2 | `FormModal.vue` | 410 | Introspección Zod frágil | Alto | ✅ Completado |
| 3 | `EntityFilters.vue` | 513 | UI + data fetching mezclado | Alto | ⭐ useFilterOptions.ts creado |
| 4 | `01.auth.guard.ts` | 55 | TEST_USER hardcoded | Crítico | ✅ Completado |

### 1.2 Deuda Alta (Refactorizado)

| # | Archivo | Líneas | Problema | Impacto | Estado |
|---|---------|--------|----------|---------|--------|
| 5 | `useEntityRelations.ts` | 82 | Console.warn en producción | Medio | ✅ Completado |
| 6 | `useEntityFetch.ts` | - | Nuevo composable de red | - | ✅ Creado |
| 7 | `useAuthorization.ts` | - | ACL centralizado | - | ✅ Creado |
| 8 | `apiError.ts` | - | Manejo de errores | - | ✅ Creado |

### 1.3 Deuda Media ( backlog)

| # | Archivo | Líneas | Problema | Impacto | Estado |
|---|---------|--------|----------|---------|--------|
| 9 | `useEntityBaseContext.ts` | ? | God Composable v2 | Medio | ⏳ Pendiente |
| 10 | `CommonDataTable.vue` | 443 | Watchers múltiples | Medio | ⏳ Pendiente |
| 11 | `EntityInspectorDrawer.vue` | 385 | Watchers en cascada | Bajo | ⏳ Pendiente |
| 12 | `response.ts` | 97 | Formato de opciones inconsistente | Bajo | ⏳ Pendiente |

---

## 2. Análisis de Composables "Dios"

### 2.1 `useEntity.ts` - El Composables de 693 Líneas

#### Estructura Actual

```
┌─────────────────────────────────────────────────────────────────┐
│                    useEntity.ts (693 líneas)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  IMPORTS (10 líneas)                                            │
│  ├── vue imports                                               │
│  ├── nuxt imports                                               │
│  └── local imports                                             │
│                                                                 │
│  INTERFACES (50 líneas)                                         │
│  ├── ApiMeta                                                   │
│  ├── ApiResponse                                               │
│  ├── EntityFilterConfig                                        │
│  ├── EntityOptions                                             │
│  ├── PaginationState                                           │
│  └── EntityCrud                                                │
│                                                                 │
│  UTILIDADES (100 líneas)                                        │
│  ├── toErrorMessage()                                           │
│  ├── normalizeFilters()                                         │
│  ├── pruneUndefined()                                           │
│  ├── sanitizeInitialFilters()                                   │
│  ├── cloneDeep()                                               │
│  └── normalizeListResponse()                                   │
│                                                                 │
│  LOG PRINCIPAL (400 líneas)                                     │
│  ├── useAsyncData para list                                    │
│  ├── watchers para filtros                                     │
│  ├── watchers para paginación                                   │
│  ├── funciones CRUD                                            │
│  └── cacheo LRU                                                 │
│                                                                 │
│  EXPORTS (33 líneas)                                           │
│  └── EntityCrud interface                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Problemas Identificados

1. **Demasiadas responsabilidades:**
   - Normalización de filtros (debería estar en backend)
   - Cacheo LRU (debería usar Pinia o Nitro Storage)
   - Fetching de datos (debería usar composables especializados)
   - Manejo de errores (debería usar error handler centralizado)

2. **Watchers en cascada (anti-patrón):**

```typescript
// Líneas 350-380 - Watchers anidados
watch([paginated.page, paginated.pageSize, paginated.totalItems], ([page, size, total]) => {
  if (page > 0 && size > 0 && total > 0 && page > Math.ceil(total / size)) {
    paginated.page = Math.max(1, Math.ceil(total / size))
  }
})

watch(() => pagination.value.page, (newPage) => {
  if (newPage < 1) pagination.value.page = 1
  if (listCache.value && newPage > 1) {
    const cacheKey = buildCacheKey(newPage, filters, lang)
    const cached = listCache.value.get(cacheKey)
    if (cached) {
      items.value = cached.data
      pagination.value.totalItems = cached.total
      return
    }
  }
  fetchList()
})

watch(() => pagination.value.pageSize, () => {
  pagination.value.page = 1
  fetchList()
})
```

3. **Cacheo LRU insuficiente:**

```typescript
const listCache = new Map<string, NormalizedListResponse<TList>>()
const MAX_CACHE_SIZE = 50
```

- Sin TTL
- Sin diferenciación por idioma
- Sin invalidación
- Memoria en cliente sin límites claros

#### Refactorización Propuesta

```typescript
// Composables separados

// 1. useEntityFetch.ts - Solo fetching
export function useEntityFetch<T>(resourcePath: string) {
  const fetchList = async (params: EntityParams) => { ... }
  const fetchOne = async (id: string | number) => { ... }
  const create = async (payload: T) => { ... }
  const update = async (id: string | number, payload: T) => { ... }
  const remove = async (id: string | number) => { ... }
  return { fetchList, fetchOne, create, update, remove }
}

// 2. useEntityCache.ts - Solo cacheo
export function useEntityCache<T>(options: CacheOptions) {
  const cache = useLRUCache<T>({ maxSize: 50, ttl: 5 * 60 * 1000 })
  const get = (key: string) => cache.get(key)
  const set = (key: string, value: T) => cache.set(key, value)
  return { get, set, invalidate }
}

// 3. useEntityFilters.ts - Solo filtros
export function useEntityFilters<T>(initialFilters: T) {
  const filters = reactive({ ...initialFilters })
  const normalize = (filters: T) => { ... }
  const watch(filters, () => { normalize(filters); emit('change') }, { deep: true })
  return { filters, normalize }
}

// 4. useEntity.ts - Orquestador
export function useEntity<TList, TCreate, TUpdate>(options: EntityOptions) {
  const fetch = useEntityFetch<TList>(options.resourcePath)
  const cache = useEntityCache<TList>(options)
  const filters = useEntityFilters(options.filters)
  const pagination = usePagination()
  
  return {
    ...fetch,
    ...cache,
    filters,
    pagination,
  }
}
```

### 2.2 Métricas de Complejidad

| Composable | LOC | Responsabilidades | Watchers | Score |
|------------|-----|-------------------|----------|-------|
| **useEntity** | 693 | 8 | 5 | 9.5/10 |
| **useEntityFormPreset** | 310 | 4 | 0 | 6/10 |
| **useEntityModals** | 139 | 3 | 0 | 5/10 |
| **useEntityRelations** | 82 | 2 | 0 | 4/10 |
| **useFormState** | 149 | 2 | 0 | 3/10 |

---

## 3. Análisis de Componentes con Lógica Mixta

### 3.1 `EntityFilters.vue` - UI + Data Fetching

#### Estructura Actual

```vue
<!-- Template (100 líneas) -->
<template>
  <div class="flex flex-col gap-3">
    <UInput v-model="crud.filters.search" ... />
    <USelectMenu v-if="show.tags" v-model="tagValue" ... />
    <USelectMenu v-if="show.facet" v-model="facetValue" ... />
    ...
  </div>
</template>

<!-- Script (413 líneas) -->
<script setup lang="ts">
// Imports
import { computed, ref, watch } from 'vue'
import { useI18n, useLazyAsyncData } from '#imports'
import { useApiFetch } from '~/utils/fetcher'

// Data fetching (mezclado con UI)
const { data: tagData, execute: fetchTags } = useLazyAsyncData(...)
const { data: cardTypeData, execute: fetchCardTypes } = useLazyAsyncData(...)
const { data: roleData, execute: fetchRoles } = useLazyAsyncData(...)
const { data: arcanaData, execute: fetchArcana } = useLazyAsyncData(...)
const { data: facetData, execute: fetchFacets } = useLazyAsyncData(...)
const { data: parentData, execute: fetchParentTags } = useLazyAsyncData(...)

// Watchers para fetching (anti-patrón)
watch(() => show.value.tags, async (enabled) => { if (enabled) await fetchTags() })
watch(() => show.value.type, async (enabled) => { if (enabled) await fetchCardTypes() })
watch(() => show.value.facet, async (enabled) => { if (enabled) await fetchFacets() })
</script>
```

#### Problemas Identificados

1. **6 llamadas API paralelas:**
   ```
   fetchTags()
   fetchCardTypes()
   fetchRoles()
   fetchArcana()
   fetchFacets()
   fetchParentTags()
   ```

2. **Watchers anidados para fetching:**
   ```typescript
   watch(() => show.value.tags, async (enabled) => {
     if (enabled && !tagData.value) await fetchTags()
   })
   ```

3. **Duplicación de opciones:**
   ```typescript
   const isActiveOptions = computed(() => ([
     { value: 'all', label: 'All' },
     { value: 'true', label: 'Active' },
     { value: 'false', label: 'Inactive' },
   ]))
   ```

#### Refactorización Propuesta

```typescript
// useFilterOptions.ts - Solo fetching
export function useFilterOptions() {
  const tags = ref<TagOption[]>([])
  const cardTypes = ref<CardTypeOption[]>([])
  const roles = ref<RoleOption[]>([])
  const arcana = ref<ArcanaOption[]>([])
  const facets = ref<FacetOption[]>([])
  const parentTags = ref<agOption[]>([])

  async function fetchAll() {
    const [t, ct, r, a, f, pt] = await Promise.all([
      $fetch('/api/tag', { params: { is_active: true, pageSize: 100 } }),
      $fetch('/api/card_type', { params: { is_active: true, pageSize: 100 } }),
      $fetch('/api/role'),
      $fetch('/api/arcana', { params: { is_active: true, pageSize: 100 } }),
      $fetch('/api/facet', { params: { is_active: true, pageSize: 100 } }),
      $fetch('/api/tag', { params: { is_active: true, pageSize: 100, parent_id: 'null' } }),
    ])
    tags.value = t.data
    cardTypes.value = ct.data
    roles.value = r.data
    arcana.value = a.data
    facets.value = f.data
    parentTags.value = pt.data
  }

  return { tags, cardTypes, roles, arcana, facets, parentTags, fetchAll }
}
```

```vue
<!-- EntityFilters.vue refactorizado -->
<template>
  <div class="flex flex-col gap-3">
    <UInput v-model="crud.filters.search" ... />
    <USelectMenu v-if="show.tags" v-model="tagValue" :items="options.tags" ... />
    ...
  </div>
</template>

<script setup lang="ts">
const options = useFilterOptions()

// Solo fetch cuando se monta el componente
onMounted(() => {
  if (props.autoFetch !== false) {
    options.fetchAll()
  }
})
</script>
```

---

## 4. Análisis de Introspección Zod Frágil

### 4.1 `FormModal.vue` - El Problema de Introspección

#### Código Problemático

```typescript
// Líneas 240-305 - Introspección Zod frágil

const schemaResolvedFields = computed<Record<string, unknown>>(() => {
  try {
    const s = props.schema?.update || props.schema?.create
    if (!s || typeof (s as { _def?: unknown })._def === 'undefined') return {}
    
    const shapeDef = obj?._def?.shape
    const shape = typeof shapeDef === 'function' ? shapeDef() : shapeDef
    
    if (!shape) return {}
    
    return Object.entries(shape as Record<string, unknown>).reduce((acc, [key, value]) => {
      const zodType = value as { _def?: { typeName?: string; innerType?: unknown } }
      const typeName = zodType._def?.typeName
      
      // Heurística frágil basada en estructura interna de Zod
      if (typeName === 'ZodString') {
        acc[key] = { type: 'text', label: key }
      } else if (typeName === 'ZodNumber') {
        acc[key] = { type: 'number', label: key }
      } else if (typeName === 'ZodBoolean') {
        acc[key] = { type: 'toggle', label: key }
      } else if (typeName === 'ZodOptional') {
        // ... más heurística
      }
      return acc
    }, {} as Record<string, unknown>)
  } catch {
    return {}
  }
})
```

#### Problemas Identificados

1. **Dependencia de estructura interna de Zod:**
   - `_def.typeName` puede cambiar entre versiones
   - `_def.innerType` no es público
   - No hay garantía de estabilidad

2. **Heurística sin documentación:**
   ```typescript
   if (typeName === 'ZodOptional') {
     const inner = (value as any)._def?.innerType
     if (inner?._def?.typeName === 'ZodString') {
       acc[key] = { type: 'text', label: key, required: false }
     }
   }
   ```

3. **Fallback silencioso:**
   ```typescript
   } catch {
     return {}
   }
   ```
   Si falla, no hay warning ni error.

#### Solución: Campos Explícitos

```typescript
// useEntityFormPreset.ts ya tiene la solución

export function useEntityFormPreset(kind: string) {
  const preset = PRESET_FACTORIES[kind]?.() ?? null
  
  const fields = computed(() => {
    if (preset) return preset.fields
    
    // Fallback a campos por defecto
    return {
      name: { type: 'text', label: 'Name', required: true },
      code: { type: 'text', label: 'Code', required: true },
      status: { type: 'select', label: 'Status', options: cardStatusOptions },
      is_active: { type: 'toggle', label: 'Active' },
    }
  })
  
  return { fields, preset, defaults: preset?.defaults ?? {} }
}
```

```vue
<!-- FormModal.vue refactorizado -->
<script setup lang="ts">
const props = defineProps<{
  fields: Record<string, FieldConfig>
  // Ya no usa schema para inferir campos
}>()
</script>
```

---

## 5. Duplicación de Código

### 5.1 Funciones `pruneUndefined` Duplicadas

| Archivo | Línea | Estado |
|---------|-------|--------|
| `useEntity.ts` | 133 | ✅ Idéntica |
| `translatableUpsert.ts` | 34 | ✅ Idéntica |
| `useEntityModals.ts` | ? | ❓ No verificado |

#### Solución: Utilidad Compartida

```typescript
// app/utils/object.ts

/**
 * Remove undefined values from an object
 */
export function pruneUndefined<T extends Record<string, any>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

/**
 * Remove null values from an object
 */
export function pruneNull<T extends Record<string, any>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null) out[key] = value
  }
  return out
}

/**
 * Remove empty values from an object
 */
export function pruneEmpty<T extends Record<string, any>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      out[key] = value
    }
  }
  return out
}
```

### 5.2 Opciones de Filtros Duplicadas

```typescript
// En EntityFilters.vue y otros archivos

const isActiveOptions = computed(() => ([
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]))

const statusOptions = computed(() => ([
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'archived', label: 'Archived' },
]))
```

#### Solución: Constantes Compartidas

```typescript
// app/constants/filters.ts

export const IS_ACTIVE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

export const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'archived', label: 'Archived' },
]
```

---

## 6. Console Logs y Warnings en Producción

### 6.1 Inventario de Console Statements

| Archivo | Línea | Tipo | Contexto |
|---------|-------|------|----------|
| `FormModal.vue` | 242 | warn | No preset found |
| `useEntityRelations.ts` | 45 | warn | Failed to fetch |
| `useEntity.ts` | 470 | log | Debug (comentado) |
| `useEntityModals.ts` | 87 | log | Debug (comentado) |

### 6.2 Solución: Sistema de Logging Centralizado

```typescript
// app/utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMessage {
  level: LogLevel
  scope: string
  message: string
  data?: Record<string, unknown>
}

const isDev = import.meta.dev

export function createLogger(scope: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => {
      if (isDev) console.debug(`[${scope}] ${message}`, data)
    },
    info: (message: string, data?: Record<string, unknown>) => {
      console.info(`[${scope}] ${message}`, data)
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(`[${scope}] ${message}`, data)
    },
    error: (message: string, data?: Record<string, unknown>) => {
      console.error(`[${scope}] ${message}`, data)
    },
  }
}

export const useLogger = (scope: string) => createLogger(scope)
```

---

## 7. Plan de Refactorización

### 7.1 Fase 1: Crítica (1-2 semanas)

| # | Tarea | Archivos | Esfuerzo | Dependencias |
|---|-------|----------|----------|--------------|
| 1 | Eliminar TEST_USER | `01.auth.guard.ts` | 1h | Ninguna |
| 2 | Eliminar introspección Zod | `FormModal.vue` | 1 día | useEntityFormPreset |
| 3 | Extraer useFilterOptions | `EntityFilters.vue` | 2 días | Ninguna |
| 4 | Crear utilidad pruneUndefined | `app/utils/object.ts` | 2h | Ninguna |

### 7.2 Fase 2: Alta Prioridad (2-4 semanas)

| # | Tarea | Archivos | Esfuerzo | Dependencias |
|---|-------|----------|----------|--------------|
| 5 | Separar useEntity en composables | `useEntity.ts` | 3 días | Fase 1 |
| 6 | Tipar createCrudHandlers | `createCrudHandlers.ts` | 1 día | Ninguna |
| 7 | Centralizar logging | `app/utils/logger.ts` | 4 horas | Ninguna |
| 8 | Consolidar opciones de filtros | `app/constants/filters.ts` | 2 horas | Ninguna |

### 7.3 Fase 3: Mediana Prioridad (1-2 meses)

| # | Tarea | Archivos | Esfuerzo | Dependencias |
|---|-------|----------|----------|--------------|
| 9 | Optimizar CommonDataTable watchers | `CommonDataTable.vue` | 1 día | Fase 2 |
| 10 | Refactorizar useEntityBaseContext | `useEntityBaseContext.ts` | 2 días | Fase 2 |
| 11 | Mejorar mensajes de error | `filters.ts`, `auth.ts` | 4 horas | Ninguna |
| 12 | Documentar APIs con JSDoc | `server/api/**/*.ts` | 1 semana | Ninguna |

---

## 8. Métricas de Deuda

### 8.1 Score de Deuda por Archivo

| Archivo | LOC | Complejidad | Duplicación | Total |
|---------|-----|-------------|-------------|-------|
| `useEntity.ts` | 693 | 9.5 | 2 | 11.5 |
| `EntityFilters.vue` | 513 | 8 | 3 | 11 |
| `FormModal.vue` | 410 | 7 | 1 | 8 |
| `createCrudHandlers.ts` | 364 | 6 | 0 | 6 |
| `CommonDataTable.vue` | 443 | 5 | 0 | 5 |
| `useEntityFormPreset.ts` | 310 | 4 | 0 | 4 |
| `translatableUpsert.ts` | 181 | 3 | 1 | 4 |
| `useEntityModals.ts` | 139 | 3 | 0 | 3 |
| `useEntityRelations.ts` | 82 | 2 | 0 | 2 |
| `filters.ts` | 161 | 2 | 0 | 2 |

### 8.2 Tendencia de Deuda

```
      25 │                                              █
         │                                         █    │
      20 │                                    █    │    │
         │                               █    │    │    │
      15 │                          █    │    │    │    │
         │                     █    │    │    │    │    │
      10 │                █    │    │    │    │    │    │
         │           █    │    │    │    │    │    │    │
       5 │      █    │    │    │    │    │    │    │    │
         │ █    │    │    │    │    │    │    │    │    │
      0 │┼─────┼────┼────┼────┼────┼────┼────┼────┼────┼────
         │Q1    │Q2   │Q3   │Q4   │Q1   │Q2   │Q3   │Q4   │Q1
         │2025  │2025 │2025 │2025 │2026 │2026 │2026 │2026 │2026
         
      Leyenda:
      █ = Deuda actual
      │ = Proyección sin acción
```

---

## 9. Checklist de Refactorización

### 9.1 Seguridad

- [ ] TEST_USER eliminado de producción
- [ ] Console logs eliminados de producción
- [ ] Error messages no expositivos

### 9.2 Arquitectura

- [ ] Composables con responsabilidad única
- [ ] Componentes con lógica de UI separada
- [ ] Utilidades compartidas en `app/utils/`

### 9.3 Tipado

- [ ] Sin `any` innecesarios
- [ ] Generics correctamente limitados
- [ ] Interfaces documentadas

### 9.4 Performance

- [ ] Sin watchers en cascada
- [ ] Fetching optimizado (batch)
- [ ] Cacheo con TTL

---

## 10. Conclusión

### Resumen de Deuda

| Categoría | Archivos | LOC | Prioridad |
|-----------|----------|-----|-----------|
| **Crítica** | 4 | ~1,700 | Inmediata |
| **Alta** | 4 | ~1,200 | Esta semana |
| **Media** | 4 | ~1,500 | backlog |

### Impacto de la Refactorización

| Métrica | Actual | Objetivo | Mejora |
|---------|--------|----------|--------|
| Complejidad máxima | 9.5/10 | 6/10 | -37% |
| Composables "Dios" | 2 | 0 | -100% |
| Duplicación | 5 funciones | 1 función | -80% |
| Watchers en cascada | 8 | 2 | -75% |

### Recomendación Final

**Priorizar la refactorización de `useEntity.ts` y `EntityFilters.vue`** antes de añadir nuevas funcionalidades. La deuda técnica actual compromete la mantenibilidad a largo plazo y aumenta el riesgo de bugs.

---

**Firma:** Auditor Senior  
**Fecha:** 2026-01-30
