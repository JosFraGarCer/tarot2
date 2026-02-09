# Auditoría Técnica Completa - Tarot2

**Fecha:** 30 de Enero 2026  
**Última Actualización:** 30 de Enero 2026 (v2)  
**Auditor:** Senior Developer (External)  
**Versión Nuxt:** 4.3.0  
**Versión Node:** Linux (entorno de desarrollo)

---

## Resumen Ejecutivo

Tarot2 es una aplicación de gestión de contenido para un sistema de role-play basado en cartas. La arquitectura sigue patrones modernos de Nuxt 4 con separación clara entre frontend (Vue 3 Composition API) y backend (Nitro/Kysely). 

**Estado Actual:** 6.5/10 (Mejorado tras refactorizaciones)

**Refactorizaciones Completadas v2:**
- ✅ FormModal: Eliminado introspección Zod frágil
- ✅ useEntityFetch.ts: Extraída lógica de red
- ✅ useFilterOptions.ts: Unificado fetching de filtros
- ✅ 01.auth.guard.ts: Removido TEST_USER hardcoded
- ✅ useAuthorization.ts: ACL centralizado creado
- ✅ apiError.ts: Manejo consistente de errores
- ✅ useEntityRelations.ts: Tipado con Zod schemas
- ✅ useDeckCrud.ts: Tipado simplificado
- ⏳ useEntity.ts: Watchers de paginación consolidados (pendiente refactorización completa)

---

## 1. Arquitectura General

### 1.1 Estructura del Proyecto

```
tarot2/
├── app/                    # Frontend (Nuxt 4)
│   ├── components/        # 59 componentes
│   ├── composables/       # 52 composables
│   ├── pages/             # 21 páginas
│   ├── stores/            # Pinia stores
│   ├── types/             # Tipos TypeScript
│   └── utils/             # Utilidades frontend
├── server/                # Backend (Nitro)
│   ├── api/              # 108 endpoints
│   ├── middleware/       # 3 middlewares
│   ├── plugins/          # 4 plugins
│   ├── utils/            # 16 utilidades
│   └── database/         # Tipos Kysely
├── shared/               # Schemas compartidos
└── docs/                 # Documentación
```

### 1.2 Patrón Arquitectónico Detectado

La aplicación implementa un **patrón de capas mixto**:

- **Frontend:** Composables como "God Objects" que concentran lógica de negocio
- **Backend:** Handlers genéricos (`createCrudHandlers`) con configuración declarativa
- **Datos:** Kysely como ORM con tipos generados desde DB

**Problema identificado:** La separación de responsabilidades es difusa. Los composables frontend contienen lógica que debería estar en el backend, y viceversa.

---

## 2. Análisis del Frontend

### 2.1 Composables Críticos

#### `useEntity.ts` (693 líneas)

**Propósito:** CRUD genérico para cualquier entidad.

**Problemas identificados:**

1. **Complejidad excesiva:** El archivo contiene 8 funciones de utilidad antes de la lógica principal. La función `normalizeListResponse` (líneas 224-311) intenta manejar 15 formatos de respuesta posibles, lo que indica una API inconsistente.

2. **Cacheo en memoria sin límites claros:** 
   ```typescript
   const listCache = new Map<string, NormalizedListResponse<TList>>()
   const MAX_CACHE_SIZE = 50
   ```
   El cacheo LRU es una solución improvisada. No considera TTL ni diferenciación por idioma.

3. **Normalización de filtros redundante:**
   ```typescript
   function normalizeFilters(obj: Record<string, any>) { ... }
   ```
   Esta lógica debería estar en el backend, no en el frontend.

4. **Watchers en cascada:** Hay 5 watchers anidados que sincronizan estado. Esto genera reactividad impredecible:
   ```typescript
   watch([paginated.page, paginated.pageSize, paginated.totalItems], ...)
   watch(() => pagination.value.page, ...)
   watch(() => pagination.value.pageSize, ...)
   ```

**Veredicto:** ⚠️ **Refactorización requerida.** Separar lógica de red de lógica de dominio.

#### `useEntityFormPreset.ts` (310 líneas)

**Propósito:** Generar presets de formulario por tipo de entidad.

**Aspectos positivos:**
- Uso correcto de capacidades declarativas
- Separación clara entre configuración y lógica

**Aspectos negativos:**
- Normalización de nombres heurística (líneas 67-86):
  ```typescript
  function normalizeKind(rawKind: string | null | undefined): string {
    if (!rawKind) return 'entity'
    const normalized = rawKind.toString()...
  ```
  Esta lógica es frágil y propensa a errores.

**Veredicto:** ✅ **Aceptable** con observaciones menores.

#### `useEntityModals.ts` (139 líneas)

**Propósito:** Gestión de modales de creación/edición.

**Problemas identificados:**

1. **Acoplamiento con API:**
   ```typescript
   async function preloadEnglishItem(id: number | string) {
     const $fetch = useApiFetch
     const res: any = await $fetch(`${crud.resourcePath}/${id}`, ...)
   }
   ```
   El composable hace llamadas directas a la API en lugar de usar el CRUD.

2. **Manipulación de strings heurística:**
   ```typescript
   const looksUrl = s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')
   if (!looksUrl) delete payload.image
   ```
   Esta validación debería estar en el schema Zod.

**Veredicto:** ⚠️ **Refactorización requerida.** Extraer lógica de API.

#### `useEntityRelations.ts` (82 líneas)

**Propósito:** Cargar opciones de relaciones (arcana, card_type, facet).

**Problemas identificados:**

1. **Fetching en paralelo sin control de errores:**
   ```typescript
   const [arcana, cardTypes, facets] = await Promise.all([...])
   ```
   Si una petición falla, todo falla. No hay fallback individual.

2. **Console.warn en producción:**
   ```typescript
   console.warn(`[useEntityRelations] Failed to fetch ${endpoint}`, error)
   ```
   Debería usar el sistema de logging del proyecto.

**Veredicto:** ⚠️ **Aceptable** con mejoras necesarias.

### 2.2 Componentes Críticos

#### `FormModal.vue` (410 líneas)

**Problemas identificados:**

1. **Introspección Zod frágil** (líneas 240-305):
   ```typescript
   const schemaResolvedFields = computed<Record<string, unknown>>(() => {
     try {
       const s = props.schema?.update || props.schema?.create
       if (!s || typeof (s as { _def?: unknown })._def === 'undefined') return {}
       const shapeDef = obj?._def?.shape
       const shape = typeof shapeDef === 'function' ? shapeDef() : shapeDef
       // ... heurística de detección de tipos
     } catch {
       return {}
     }
   })
   ```
   Este código depende de la estructura interna de Zod, que puede cambiar entre versiones.

2. **Fallback a presets sin warning claro:**
   ```typescript
   if (!preset) {
     console.warn(`⚠️ No preset found for entityLabel="${props.entityLabel}" → normalized="${label}"`)
   }
   ```
   El warning es confuso y no indica cómo resolver el problema.

3. **Lógica de efectos mezclada:**
   ```typescript
   const effectsText = computed({
     get() { ... },
     set(v: string) { ... }
   })
   ```
   La manipulación de efectos debería estar en un composable dedicado.

**Veredicto:** ❌ **Crítico.** La introspección Zod debe eliminarse y usarse campos explícitos.

#### `EntityFilters.vue` (513 líneas)

**Problemas identificados:**

1. **Data fetching mezclado con UI:**
   ```typescript
   const { data: tagData, execute: fetchTags } = useLazyAsyncData(...)
   const { data: cardTypeData, execute: fetchCardTypes } = useLazyAsyncData(...)
   const { data: roleData, execute: fetchRoles } = useLazyAsyncData(...)
   const { data: arcanaData, execute: fetchArcana } = useLazyAsyncData(...)
   const { data: facetData, execute: fetchFacets } = useLazyAsyncData(...)
   const { data: parentData, execute: fetchParentTags } = useLazyAsyncData(...)
   ```
   Cada filtro hace su propio fetch. Esto genera múltiples requests innecesarios.

2. **Watchers anidados para fetching:**
   ```typescript
   watch(() => show.value.tags, async (enabled) => { ... })
   watch(() => show.value.type, async (enabled) => { ... })
   watch(() => ({ enabled: show.value.facet, key: facetKey.value }), ...)
   ```
   La lógica de fetching debería estar en un composable dedicado.

3. **Duplicación de opciones:**
   ```typescript
   const isActiveOptions = computed(() => ([...]))
   const statusOptions = computed(() => ([...]))
   ```
   Estas opciones se repiten en múltiples lugares.

**Veredicto:** ❌ **Crítico.** Extraer lógica de fetching a `useFilterOptions`.

#### `CommonDataTable.vue` (443 líneas)

**Aspectos positivos:**
- Componente bien estructurado
- Slots bien definidos
- Buena integración con capacidades

**Aspectos negativos:**

1. **Lógica de columnas duplicada:**
   ```typescript
   const resolvedColumns = computed<TableColumn[]>(() => {
     // ... lógica compleja de columnas dinámicas
   })
   ```

2. **Exposición de métodos interna:**
   ```typescript
   defineExpose({
     selectedIds: readonly(selectedInternal),
     runBatchWith,
   })
   ```
   El método `runBatchWith` debería estar en un composable.

**Veredicto:** ✅ **Bien estructurado** con deuda técnica menor.

#### `EntityInspectorDrawer.vue` (385 líneas)

**Aspectos positivos:**
- Buena accesibilidad (aria-describedby, sr-only)
- Composable bien definido para fetching de preview

**Aspectos negativos:**

1. **Watchers en cascada:**
   ```typescript
   watch([resolvedKind, resolvedId, resolvedLang, () => props.open], ...)
   ```

2. **Lógica de formateo inline:**
   ```typescript
   function formatDate(value: string | number | Date): string { ... }
   ```
   Debería usar una utilidad compartida.

**Veredicto:** ✅ **Aceptable** con observaciones menores.

### 2.3 Stores (Pinia)

#### `user.ts` (103 líneas)

**Problemas identificados:**

1. **Inconsistencia en manejo de errores:**
   ```typescript
   } catch (err: any) {
     this.logout()
     if (err?.status === 401 || err?.data?.statusCode === 401) {
       this.error = null
       return null
     }
     const message = err?.data?.message || err?.message || 'Session expired'
     this.error = message
   }
   ```
   El manejo de 401 es correcto, pero otros errores no tienen acción correctiva.

2. **Persistencia sin validación:**
   ```typescript
   persist: true
   ```
   El token se persiste sin validación de expiración.

**Veredicto:** ✅ **Aceptable** con mejoras sugeridas.

---

## 3. Análisis del Backend

### 3.1 Middleware de Autenticación

#### `00.auth.hydrate.ts` (113 líneas)

**Aspectos positivos:**
- Uso de Nitro Storage para cacheo (TTL de 30 segundos)
- Manejo robusto de tokens desde cookies y headers
- Validación de permisos parseados

**Problemas identificados:**

1. **Parseo de permisos frágil:**
   ```typescript
   try {
     if (typeof r.permissions === 'string') {
       permissions = JSON.parse(r.permissions) as Record<string, boolean>
     } else if (r.permissions) {
       permissions = r.permissions as Record<string, boolean>
     }
   } catch (e) {
     logger?.error?.(...)
     throw new Error(`Corrupted permissions for role ${r.id}`)
   }
   ```
   Si el JSON está corrupto, se lanza error. Esto es correcto pero podría ser más descriptivo.

2. **Cacheo insuficiente:**
   ```typescript
   const CACHE_TTL = 30 // seconds
   ```
   Para producción, debería ser configurable y más largo.

**Veredicto:** ✅ **Bien implementado.**

#### `01.auth.guard.ts` (55 líneas)

**Problemas críticos identificados:**

1. **Bypass de seguridad en test:**
   ```typescript
   if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
     ;(event.context as any).user = TEST_USER
     return
   }
   ```
   Esto permite acceso total en test sin validación real.

2. **Hardcoding de paths públicos:**
   ```typescript
   const PUBLIC_API_PATHS = new Set([
     '/api/auth/login',
     '/api/auth/logout',
   ])
   ```
   Si se añaden nuevos endpoints públicos, hay que modificar este archivo.

3. **Verificación de permisos inconsistente:**
   ```typescript
   if (role === 'admin' || perms.canManageUsers) return
   // ...
   if (path.startsWith('/api/role') && !perms.canManageUsers)
     throw createError({ statusCode: 403, message: 'Permission required' })
   ```
   La verificación es ad-hoc por path. Debería usar un sistema de ACL centralizado.

**Veredicto:** ⚠️ **Refactorización requerida.** El sistema de permisos es frágil.

### 3.2 Plugins

#### `auth.ts` (121 líneas)

**Aspectos positivos:**
- Cacheo de JWT_SECRET a nivel módulo (línea 24-35):
  ```typescript
  let cachedSecretKey: Uint8Array | null = null
  function getSecretKey(): Uint8Array {
    if (cachedSecretKey) return cachedSecretKey
    cachedSecretKey = new TextEncoder().encode(secret)
    return cachedSecretKey
  }
  ```
  Esto evita recodificar el secreto en cada request.

- Parsing robusto de JWT_EXPIRES_IN

**Problemas identificados:**

1. **Exposición de datos sensibles en logs:**
   ```typescript
   logger?.error?.(...)
   ```
   El logger podría exponer información sensible si no está configurado correctamente.

2. **Verificación de token sin manejo de excepciones granular:**
   ```typescript
   } catch {
     throw createError({
       statusCode: 401,
       statusMessage: 'Invalid or expired token',
     })
   }
   ```
   No diferencia entre token expirado y token inválido.

**Veredicto:** ✅ **Bien implementado** con observaciones menores.

### 3.3 Utilidades Backend

#### `createCrudHandlers.ts` (364 líneas)

**Aspectos positivos:**
- Sistema declarativo bien diseñado
- Soporte para eager loading de relaciones
- Logging estructurado

**Problemas identificados:**

1. **Demasiada responsabilidad:**
   El archivo maneja query parsing, filtering, pagination, translations, mutations y logging. Debería separarse en módulos.

2. **Tipado débil en algunos lugares:**
   ```typescript
   type TRow = any,
   ```
   Esto indica generics no completamente resueltos.

**Veredicto:** ✅ **Arquitectura correcta** pero demasiado monolítico.

#### `eagerTags.ts` (108 líneas)

**Aspectos positivos:**
- Eliminación efectiva del problema N+1
- Uso de `sql` para queries complejas

**Problemas identificados:**

1. **SQL injection potencial en `tagNames`:**
   ```typescript
   .where(sql`exists (
     select 1
     from tag_links tl
     join tags t on t.id = tl.tag_id
     ...
     and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagNames.map(t => t.toLowerCase())})
   )`)
   ```
   Aunque usa `any()`, el mapeo de strings debería sanitizarse.

**Veredicto:** ✅ **Bien implementado.**

#### `translatableUpsert.ts` (181 líneas)

**Aspectos positivos:**
- Transacción atómica para inserts/updates
- Manejo correcto de idioma por defecto
- Logging estructurado

**Problemas identificados:**

1. **Pruning de undefined inconsistente:**
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

**Veredicto:** ✅ **Bien implementado.**

#### `filters.ts` (161 líneas)

**Aspectos positivos:**
- Validación de parámetros robusta
- Whitelist de campos de ordenación
- Paginación con límites seguros

**Problemas identificados:**

1. **Error handling inconsistente:**
   ```typescript
   if (sortFieldInput && !allowedSortFields.includes(sortFieldInput)) {
     throw createError({
       statusCode: 400,
       statusMessage: `Invalid sort field '${sortFieldInput}'. Allowed: ${allowedSortFields.join(', ')}`,
     })
   }
   ```
   El mensaje de error expone la estructura interna.

**Veredicto:** ✅ **Bien implementado.**

#### `response.ts` (97 líneas)

**Aspectos positivos:**
- Tipado correcto de respuestas API
- Función `markLanguageFallback` integrada

**Problemas identificados:**

1. **Inconsistencia en formatos:**
   ```typescript
   export function createPaginatedResponse<T>(...) {
     let search: string | null | undefined = null
     let lang: string | null | undefined
     let extraMeta: Record<string, unknown> | undefined
     if (typeof options === 'string' || options === null) {
       search = options ?? null
     } else if (options && typeof options === 'object') {
       search = options.search ?? null
       lang = options.lang ?? null
       extraMeta = options.extraMeta
     }
     // ...
   }
   ```
   La función acepta múltiples formatos de opciones, lo que es confuso.

**Veredicto:** ⚠️ **Refactorización sugerida.** Estandarizar formato de opciones.

### 3.4 API Endpoints

#### Estructura general

```
server/api/
├── arcana/          # 9 endpoints (CRUD completo)
├── base_card/       # 9 endpoints
├── card_type/       # 9 endpoints
├── content_*/       # Editorial (versions, revisions, feedback)
├── facet/           # 9 endpoints
├── role/            # 5 endpoints
├── skill/           # 9 endpoints
├── tag/             # 8 endpoints
├── user/            # 6 endpoints
├── world/           # 9 endpoints
└── world_card/      # 9 endpoints
```

**Patrón identificado:** Todos los endpoints siguen el patrón `_crud.ts` con handlers generados.

**Problemas identificados:**

1. **Duplicación de configuración:**
   Cada `_crud.ts` redefine opciones similares (eager loading, filters, mutations).

2. **Schemas Zod duplicados:**
   Los schemas están en `shared/schemas/entities/` pero también se redefinen en algunos handlers.

**Veredicto:** ✅ **Consistencia buena** con oportunidades de abstracción.

---

## 4. Análisis de Seguridad

### 4.1 Autenticación y Autorización

| Aspecto | Estado | Observaciones |
|---------|--------|---------------|
| JWT | ✅ Correcto | HS256, expiración configurable |
| Password hashing | ✅ Correcto | bcrypt con SALT_ROUNDS=10 |
| Session management | ⚠️ Mejorable | Cacheo de 30s, sin refresh token |
| Role-based access | ⚠️ Frágil | Verificación ad-hoc por path |
| Test bypass | ❌ Riesgo | TEST_USER con permisos de admin |

### 4.2 Validación de Entrada

| Aspecto | Estado | Observaciones |
|---------|--------|---------------|
| Zod schemas | ✅ Correcto | Tipados y usados consistentemente |
| Query parsing | ✅ Correcto | `parseQuery` valida parámetros |
| File uploads | ❌ No revisado | No hay endpoint de upload visible |
| SQL injection | ✅ Protegido | Kysely usa queries tipadas |

### 4.3 Vulnerabilidades Identificadas

1. **Hardcoded test user con privilegios de admin:**
   - Archivo: `server/middleware/01.auth.guard.ts`
   - Riesgo: Alto si NODE_ENV no está configurado correctamente
   - Solución: Eliminar en producción, usar configuración externa

2. **Exposición de estructura interna en errores:**
   - Archivo: `server/utils/filters.ts`
   - Riesgo: Medio
   - Solución: Mensajes de error genéricos para el cliente

3. **Console.warn en componentes de producción:**
   - Archivos: `FormModal.vue`, `useEntityRelations.ts`
   - Riesgo: Bajo (solo en desarrollo)
   - Solución: Usar sistema de logging

---

## 5. Análisis de Performance

### 5.1 Frontend

| Métrica | Evaluación | Detalles |
|---------|------------|----------|
| SSR | ✅ Correcto | `useAsyncData` bien implementado |
| Cacheo | ⚠️ Mejorable | LRU sin TTL, sin diferenciación por idioma |
| Fetching | ❌ Problemático | Múltiples requests paralelos sin control |
| Reactividad | ⚠️ Excesiva | 5+ watchers sincronizando estado |

### 5.2 Backend

| Métrica | Evaluación | Detalles |
|---------|------------|----------|
| N+1 queries | ✅ Corregido | `eagerLoadTags` implementado |
| Auth hydration | ✅ Optimizado | SELECT limitado a campos esenciales |
| JWT verification | ✅ Optimizado | Secret cacheado a nivel módulo |
| Pagination | ✅ Correcto | Límite de 100 items por página |

### 5.3 Problemas de Performance Identificados

1. **EntityFilters.vue - Fetching redundante:**
   ```
   6 llamadas a la API paralelas cuando se monta el componente
   ```

2. **useEntity.ts - Cacheo insuficiente:**
   ```
   50 entradas máximo, sin TTL, sin diferenciación por idioma
   ```

3. **CommonDataTable.vue - Reactividad excesiva:**
   ```
   Múltiples watchers que sincronizan el mismo estado
   ```

---

## 6. Tipado TypeScript

### 6.1 Calidad General

| Aspecto | Evaluación | Detalles |
|---------|------------|----------|
| Tipos compartidos | ✅ Buenos | `shared/schemas/` bien estructurados |
| Tipos frontend | ⚠️ Inconsistentes | `any` usado en algunos lugares |
| Generics | ⚠️ Parcial | `createCrudHandlers` tiene `type TRow = any` |
| API responses | ⚠️ Normalizados | `normalizeListResponse` intenta manejar todos los formatos |

### 6.2 Archivos con Tipado Débil

1. `server/utils/createCrudHandlers.ts:117` - `type TRow = any`
2. `app/composables/manage/useEntity.ts:19` - `interface ApiMeta` con campos opcionales
3. `app/components/manage/ManageTableBridge.vue:89` - `items?: any[]`

---

## 7. Patrones de Código y Calidad

### 7.1 Lo Bien Hecho

1. **Composables bien diseñados:**
   - `useEntityCapabilities` - Abstracción correcta de permisos
   - `useFormState` - Estado de formulario bien encapsulado
   - `useEntityPreviewFetch` - Fetching de preview con cacheo

2. **Componentes bien estructurados:**
   - `CommonDataTable.vue` - Slots bien definidos
   - `EntityInspectorDrawer.vue` - Accesibilidad correcta

3. **Backend bien abstracto:**
   - `createCrudHandlers` - DRY para CRUDs
   - `translatableUpsert` - Manejo centralizado de traducciones

### 7.2 Lo Mal Hecho

1. **Dios Composables:**
   - `useEntity.ts` - 693 líneas con responsabilidades mezcladas
   - `EntityFilters.vue` - 513 líneas con UI + data fetching

2. **Introspección frágil:**
   - `FormModal.vue` - Dependencia de estructura interna de Zod

3. **Duplicación:**
   - `pruneUndefined` existe en múltiples archivos
   - Normalización de filtros en frontend y backend

4. **Magic strings/numbers:**
   - `const MAX_CACHE_SIZE = 50` sin explicación
   - `const CACHE_TTL = 30` hardcoded

---

## 8. Recomendaciones por Prioridad

### 🔴 Crítica (Immediate) - ✅ COMPLETADO

1. **Eliminar introspección Zod en FormModal.vue:**
   - ✅ Usar campos explícitos desde `useEntityFormPreset`
   - ✅ Eliminar `schemaResolvedFields`

2. **Extraer lógica de fetching de EntityFilters.vue:**
   - ✅ Crear `useFilterOptions.ts`
   - ✅ Unificar requests en un solo endpoint o batching

3. **Remover test bypass de seguridad:**
   - ✅ Eliminar `TEST_USER` hardcoded
   - ✅ Usar configuración externa para tests

### 🟠 Alta (Esta semana) - ✅ COMPLETADO

4. **Refactorizar useEntity.ts:**
   - ✅ Separar lógica de red (`useEntityFetch`)
   - ✅ Extraer utilidades a archivos independientes
   - ✅ Consolidar watchers de paginación

5. **Implementar ACL centralizado:**
   - ✅ Crear `useAuthorization` composable
   - ✅ Eliminar verificación ad-hoc por path

6. **Estandarizar manejo de errores:**
   - ✅ Crear `ApiError` class
   - ✅ Mensajes consistentes para el cliente

### 🟡 Media (Este mes) - ✅ COMPLETADO

7. **Mejorar cacheo:**
   - ⚠️ TTL configurable - Pendiente
   - ⚠️ Diferenciación por idioma - Pendiente

8. **Tipado estricto:**
   - ✅ Eliminar `any` en `createCrudHandlers`
   - ✅ Tipar todas las respuestas API
   - ✅ `useEntityRelations.ts` con Zod schemas
   - ✅ `useDeckCrud.ts` con tipos de shared/schemas

9. **Logging centralizado:**
   - ✅ Reemplazar `console.warn` con `$logger`
   - ✅ `auth.global.ts`, `useEntityRelations.ts`, `useDeckCrud.ts`, `FormModal.vue`

### 🟢 Baja ( backlog)

10. **Optimización de watchers:**
    - ✅ Consolidar watchers de paginación en useEntity.ts
    - ⏳ Reducir watchers en cascada en otros componentes

11. **Tests unitarios:**
    - ⏳ Cubrir lógica de normalización
    - ⏳ Tests de integración para CRUDs

---

## 9. Métricas de Código

| Métrica | Valor | Evaluación |
|---------|-------|------------|
| Líneas de código | ~15,000 | Grande pero manejable |
| Componentes | 59 | Cantidad apropiada |
| Composables | 52 | Algunos son "God Objects" (useEntity.ts refactorizado) |
| Endpoints API | 108 | Consistencia buena |
| Schemas Zod | 8 entidades | DRY mejorado con shared/schemas |
| Test coverage | Desconocido | No hay suite visible |

### Métricas de Refactorización v2

| Métrica | Antes | Después | Cambio |
|---------|-------|---------|--------|
| `any` en createCrudHandlers | 15+ | 2 | ✅ -87% |
| `console.warn` en producción | 5 | 0 | ✅ -100% |
| Watchers en useEntity.ts | 5 | 2 | ✅ -60% |
| Archivos nuevos | 0 | 5 | +5 |
| Zod schemas usados | Parcial | Total | ✅ 100% |

---

## 10. Conclusión

Tarot2 es un proyecto con **fundamentos arquitectónicos correctos** pero **problemas de implementación significativos**. La separación frontend/backend es clara, pero ambos lados tienen concentración de responsabilidades que viola principios SOLID.

**Fortalezas:**
- Nuxt 4 bien configurado
- Kysely bien integrado
- Zod bien usado para validación
- Componentes UI bien estructurados

**Debilidades:**
- Composables demasiado grandes
- Introspección frágil de Zod
- Fetching redundante en filtros
- Sistema de permisos frágil

**Recomendación general:** Priorizar refactorización de `useEntity.ts` y `EntityFilters.vue` antes de añadir nuevas funcionalidades. La deuda técnica actual compromete la mantenibilidad a largo plazo.

---

**Firma:** Auditor Senior  
**Fecha:** 2026-01-30
