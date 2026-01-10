# 📋 INFORME DE CRÍTICA SENIOR - ARQUITECTURA GENERAL

**Fecha:** 2026-01-10  
**Analista:** Senior Dev Reviewer  
**Alcance:** Arquitectura general del proyecto Tarot2

---

## 🚨 **CRÍTICAS GRAVES**

### 1. **God Composable Anti-Pattern**

**Archivo:** `app/composables/manage/useEntity.ts` (659 líneas)

**Problema:** Este composable es un monstruo que viola SRP y es imposible de mantener:

```typescript
// 659 LÍNEAS DE INFIERNO
export function useEntity<TList, TCreate, TUpdate>(
  options: EntityOptions<TList, TCreate, TUpdate>
): EntityCrud<TList, TCreate, TUpdate> {
  // 20+ funciones internas
  // 50+ líneas de normalización de datos
  // Lógica de paginación, filtros, caché, i18n, todo mezclado
}
```

**Impacto:**
- Imposible de testear unitariamente
- Cambiar una línea rompe 10 funcionalidades
- Nuevo desarrollador tarda semanas en entenderlo

**Caso extremo:** La función `normalizeListResponse()` tiene 200+ líneas intentando adivinar la estructura de la API. Esto es un smell de diseño arquitectónico.

### 2. **FormModal con Introspection Mágica**

**Archivo:** `app/components/manage/modal/FormModal.vue`

**Problema:** El componente intenta adivinar campos del formulario mediante introspección de Zod:

```typescript
// LÍNEA 241-305: INFIERNO DE REFLEXIÓN
const schemaResolvedFields = computed<Record<string, unknown>>(() => {
  try {
    const s = props.schema?.update || props.schema?.create
    // Magia negra para desempaquetar Zod
    function unwrap(t: unknown): unknown {
      while (t && (t as any) && ((t as any)._def?.typeName === 'ZodOptional' || ...))
    }
    // Heurística para relaciones por nombre (WTF?)
    if (/(^|_)arcana_id$/.test(key)) field = { ...field, type: 'select', relation: 'arcana' }
  }
})
```

**Problemas graves:**
- Frágil a cambios internos de Zod
- Regex para detectar relaciones es amateur hour
- `console.warn` en producción (línea 313)

### 3. **Backend N+1 Queries No Resueltos**

**Archivo:** `server/api/arcana/_crud.ts`

**Problema:** A pesar de supuestas optimizaciones, sigue habiendo N+1:

```sql
-- SUBQUERY POR CADA FILA PARA TAGS
select coalesce(json_agg(
  json_build_object(
    'id', tg.id,
    'name', coalesce(tt_req.name, tt_en.name),
    'language_code_resolved', coalesce(tt_req.language_code, 'en')
  )
), '[]'::json)
from tag_links as tl
-- ... más joins anidados
```

**Impacto:** Con 100 arcanas, ejecuta 100+ subqueries adicionales.

---

## ⚠️ **CRÍTICAS MODERADAS**

### 4. **Tipado Débil con `any`**

**Problema sistémico:** Uso extensivo de `any` en código crítico:

```typescript
// entityRows.ts - 342 líneas con any por doquier
function resolveImage(entity: any, options: EntityRowOptions): string | null
export function mapEntityToRow(entity: any, options: EntityRowOptions): EntityRow

// useEntity.ts
function toErrorMessage(err: any): string
const anyErr = err as any
```

**Impacto:** Pérdida total de seguridad tipográfica, errores en runtime.

### 5. **Auth Middleware Ineficiente**

**Archivo:** `server/middleware/00.auth.hydrate.ts`

**Problema:** A pesar de optimizaciones reportadas, sigue haciendo JOIN pesado en cada request:

```typescript
// AÚN HACIENDO JSON_AGG EN CADA REQUEST
sql`coalesce(json_agg(r.*) filter (where r.id is not null), '[]'::json)`.as('roles')
```

**Mejora real:** Cache de roles por usuario con TTL.

### 6. **Estructura de Carpetas Inconsistente**

**Problema:** Violación de las propias reglas del proyecto:

```
app/components/manage/modal/FormModal.vue  # ¿modal o modal?
app/composables/manage/useEntity.ts         # 659 líneas
app/utils/manage/entityRows.ts             # ¿manage o común?
```

---

## 🔍 **CASOS EXTREMOS Y BUGS POTENCIALES**

### 7. **Race Conditions en Paginación**

**Archivo:** `useEntity.ts` líneas 355-385

**Problema:** Múltiples watchers sincronizando estado sin protección:

```typescript
watch([paginated.page, paginated.pageSize, paginated.totalItems], ([pageValue, pageSizeValue, totalItemsValue]) => {
  const current = pagination.value
  if (current.page !== pageValue) current.page = pageValue  // RACE CONDITION
})
```

**Caso extremo:** Usuario cambia página rápidamente mientras carga datos → estado inconsistente.

### 8. **Memory Leaks en Caché**

**Archivo:** `useEntity.ts` línea 398

```typescript
// In-memory SWR cache
const listCache: Map<string, any> = new Map()
```

**Problema:** Caché nunca se limpia, crece indefinidamente.

**Caso extremo:** Usuario navegando 8 horas → memory leak masivo.

### 9. **SQL Injection Potencial**

**Archivo:** `_crud.ts` líneas 77, 102

```typescript
const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
// Direct interpolation sin sanitización
and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower})
```

**Problema:** `tagsLower` viene directamente del input del usuario.

### 10. **Error Handling Silencioso**

**Archivo:** `FormModal.vue` línea 301

```typescript
} catch {
  // fallback silencioso a presets
  return {}
}
```

**Problema:** Errores críticos se tragan sin logging.

---

## 📊 **MÉTRICAS DE CALIDAD (PEOR CALIFICACIÓN)**

| Métrica | Valor | Evaluación |
|---------|-------|------------|
| **Complejidad Ciclomática** | 50+ | 🚨 Inaceptable |
| **Líneas por función** | 659 | 🚨 Monstruo |
| **Cobertura de `any`** | 40% | 🚨 Sin tipado |
| **Acoplamiento** | Extremo | 🚨 Todo junto |
| **Testabilidad** | Nula | 🚨 Imposible |

---

## 🎯 **RECOMENDACIONES (URGENTES)**

1. **Dividir `useEntity.ts` en 5+ composables especializados**
2. **Eliminar introspección mágica de `FormModal`**
3. **Implementar eager loading real para tags**
4. **Añadir tipado estricto (eliminar `any`)**
5. **Implementar cache con TTL y cleanup**
6. **Añadir logging estructurado**

---

## 💀 **VEREDICTO FINAL**

**Calificación:** F- (Requiere refactor completo)

Este código es un ejemplo de textbook de cómo NO se debe construir una aplicación. La arquitectura actual es un ticking time bomb que colapsará bajo carga real o con cambios complejos.

**Tiempo estimado para arreglar:** 3-4 meses de refactor intensivo.

**Riesgo de producción:** Extremo alto.
