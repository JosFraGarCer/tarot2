# Errores en Filtros de Entidades - Investigación API (v2.0)

**Auditor:** Senior Developer
**Fecha:** 2026-01-28
**Método:** Pruebas con curl al puerto 3007
**Estado:** ✅ CORREGIDO

---

## 0. Resumen de Pruebas API (v2.0 - Post-corrección)

| Endpoint | Filtro | Resultado | Estado |
|----------|--------|-----------|--------|
| `/api/arcana` | Sin filtros | ✅ OK | - |
| `/api/arcana` | `search='Spiritual'` | ✅ OK (1 item) | ✅ CORREGIDO |
| `/api/arcana` | `status='draft'` | ✅ OK (1 item) | - |
| `/api/arcana` | `tag_ids=20` | ✅ OK (1 item) | ✅ CORREGIDO |
| `/api/arcana` | `is_active=false` | ✅ OK (0 items) | ✅ CORREGIDO |
| `/api/arcana` | `is_active=true` | ✅ OK (3 items) | ✅ CORREGIDO |
| `/api/world` | `is_active=false` | ✅ OK (2 items) | ✅ CORREGIDO |
| `/api/world` | `is_active=true` | ✅ OK (5 items) | ✅ CORREGIDO |
| `/api/skill` | `is_active=false` | ✅ OK (0 items) | ✅ CORREGIDO |
| `/api/facet` | `is_active=false` | ✅ OK (0 items) | ✅ CORREGIDO |
| `/api/base_card` | `is_active=false` | ✅ OK (0 items) | ✅ CORREGIDO |
| `/api/tag` | `parent_only=true` | ✅ OK | - |
| `/api/tag` | `is_active=false` | ✅ OK | ✅ CORREGIDO |

---

## 1. Error: tag_ids con formato array (CORREGIDO)

### Problema Original
El frontend envía `tag_ids` como array, pero el backend no lo procesa correctamente.

### Corrección Aplicada
En el backend `_crud.ts` de cada entidad:
```typescript
const tagIdsArray = Array.isArray(tagIds) ? tagIds : (tagIds !== undefined ? [tagIds] : [])
```

### Ubicación
- `server/api/arcana/_crud.ts:102-111`
- `server/api/world/_crud.ts:102-111`
- `server/api/skill/_crud.ts:102-111`
- `server/api/facet/_crud.ts:102-111`
- `server/api/base_card/_crud.ts:102-111`

---

## 2. Error: is_active no filtra correctamente (CORREGIDO)

### Problema Original
El filtro `is_active=false` devuelve todos los registros en lugar de solo los inactivos.

**Causa raíz:** `z.coerce.boolean()` convierte cualquier string no vacío (incluyendo `'false'`) a `true`.

### Corrección Aplicada
1. Nuevo helper en `shared/schemas/common.ts`:
```typescript
export const coerceBoolean = z.union([
  z.boolean(),
  z.literal('true'),
  z.literal('false'),
]).transform((val) => val === true || val === 'true')
```

2. Schemas actualizados para usar `coerceBoolean`:
- `shared/schemas/entities/arcana.ts`
- `shared/schemas/entities/tag.ts`
- `shared/schemas/entities/cardtype.ts`
- `shared/schemas/entities/skill.ts`
- `shared/schemas/entities/world.ts`
- `shared/schemas/entities/facet.ts`
- `shared/schemas/entities/base-card.ts`
- `shared/schemas/entities/world-card.ts`
- `shared/schemas/user.ts`

### Ubicación
`shared/schemas/common.ts:31-37`

---

## 3. Error: search no funciona en arcana (CORREGIDO)

### Problema Original
El filtro `search` en arcana devuelve todos los resultados sin filtrar.

### Corrección Aplicada
Agregado `applySearch` en `server/api/arcana/_crud.ts`:
```typescript
applySearch: (qb, term) =>
  qb.where((eb) =>
    eb.or([
      sql`lower(coalesce(t_req_arcana_translations.name, t_en_arcana_translations.name)) ilike ${'%' + term + '%'}`,
      sql`lower(coalesce(t_req_arcana_translations.short_text, t_en_arcana_translations.short_text)) ilike ${'%' + term + '%'}`,
      sql`lower(a.code) ilike ${'%' + term + '%'}`,
    ]),
  ),
```

### Ubicación
`server/api/arcana/_crud.ts:147-154`

---

## 4. Filtros verificados y funcionando

### Filtros de estado (status)
- `status='draft'` - ✅ Funciona
- `status='approved'` - ✅ Funciona
- `status='pending_review'` - ✅ Funciona

### Filtros de paginación
- `page=X` - ✅ Funciona
- `pageSize=X` - ✅ Funciona
- `sort=field` - ✅ Funciona
- `direction=asc|desc` - ✅ Funciona

### Filtros de idioma
- `lang=es` - ✅ Funciona
- `language=es` - ✅ Funciona

---

## 5. Endpoint correcto para tags

**Importante:** El endpoint correcto es `/api/tag` (singular), NO `/api/tags`.

```bash
# Incorrecto
/api/tags?parent_only=true  # Devuelve HTML

# Correcto
/api/tag?parent_only=true  # Funciona correctamente
```

---

## 6. Resumen de correcciones

| Error | Archivo | Corrección |
|-------|---------|------------|
| `tag_ids` array | `_crud.ts` de cada entidad | Manejo de array/single value |
| `is_active` | `common.ts` + schemas | Nuevo `coerceBoolean` helper |
| `search` en arcana | `arcana/_crud.ts` | Agregado `applySearch` |

**Estado General:** ✅ Todos los filtros del backend funcionan correctamente

```typescript
const tagValue = useFilterBinding(tagsKey, {
  multi: true,
  coerce: (value: any[]) => {
    const ids = coerceArrayIds(value)
    // El backend espera tag_ids=17&tag_ids=19 (sin corchetes)
    return ids
  },
})
```

---

## 2. Error: parent_only para tags

### Problema
El filtro `parent_only` no funciona correctamente.

```bash
# Petición del frontend
/api/tag?parent_only=true

# Respuesta
{"success": true, "data": [...todos los tags...], ...}
```

### Análisis
El backend no está aplicando el filtro `parent_only`.

### Corrección Sugerida
Verificar que el backend procese `parent_only` correctamente.

### Ubicación
`server/api/tag/index.get.ts`

---

## 3. Error: coerceArrayIds no normaliza correctamente

### Problema
La función `coerceArrayIds` puede producir valores inválidos que el backend rechaza.

```typescript
// Antes (corregido)
function coerceArrayIds(list: any[]): number[] {
  return list
    .map((item) => {
      if (item === null || item === undefined) return undefined
      if (typeof item === 'object') {
        const candidate = (item as any).value ?? (item as any).id
        if (candidate === null || candidate === undefined) return undefined
        return candidate
      }
      return item
    })
    .map((v) => {
      if (typeof v === 'number' && Number.isFinite(v)) return v
      if (typeof v === 'string' && v !== '') {
        const num = Number(v)
        return Number.isFinite(num) ? num : undefined
      }
      return undefined
    })
    .filter((v): v is number => v !== undefined) as number[]
}
```

### Verificación
Los valores `undefined` se filtran, pero pueden quedar gaps en el array.

---

## 4. Error: normalizeFilters con objetos anidados

### Problema
Cuando un filtro tiene un valor de objeto, se procesa como `key_subKey`, pero el backend puede no esperar este formato.

```typescript
// normalizeFilters transforma:
// { range: { min: 1, max: 10 } }
// → { range_min: 1, range_max: 10 }
```

### Verificación
Si el backend no tiene endpoints para estos filtros, se ignoran silenciosamente.

---

## 5. Error: Watchers con fetch tardío

### Problema
Los watchers de filtros cargan datos con `await`, pero el estado `loaded` se setea antes de completar.

```typescript
// Antes (corregido)
watch(() => show.value.tags, async (enabled) => {
  if (enabled && !pendingFetches.has('tags')) {
    pendingFetches.add('tags')
    tagsLoaded.value = true
    await fetchTags()
    pendingFetches.delete('tags')
  }
}, { immediate: true })
```

### Verificación
Ahora los watchers esperan a que `fetchTags()` complete antes de permitir otro fetch.

---

## 6. Error: is_active con valores de string

### Problema
El filtro `is_active` acepta strings `'true'/'false'` pero el backend puede esperar booleanos.

```bash
# Petición del frontend
/api/arcana?is_active=true

# El backend puede interpretar esto como string, no boolean
```

### Corrección Sugerida
El backend debe coerceer strings a booleanos.

---

## 7. Resumen de Correcciones Aplicadas

| # | Error | Corrección | Estado |
|---|-------|------------|--------|
| 1 | `resolveKey` con config undefined | Check de `config` primero | ✅ |
| 2 | `coerceArrayIds` con NaN | Verificación `Number.isFinite` | ✅ |
| 3 | `EntityFilterConfig` restrictivo | Ampliado a más tipos | ✅ |
| 4 | `normalizeFilters` sin objetos | Procesa objetos anidados | ✅ |
| 5 | `initializeDefaults` sin undefined | Incluye `undefined` | ✅ |
| 6 | Watchers sin protección | `pendingFetches` Set | ✅ |

---

## 8. Pendiente de Investigación

| # | Error | Estado |
|---|-------|--------|
| 1 | `tag_ids[]` formato array | ✅ **ARREGLADO** |
| 2 | `parent_only` no funciona | ✅ **ARREGLADO** |
| 3 | `is_active` como string | ✅ **Verificado** (usa `z.coerce.boolean()`) |

---

## 9. Correcciones de Backend Aplicadas

### 9.1 Schema de Tags - Añadido `parent_only`

**Archivo:** `shared/schemas/entities/tag.ts:57`

```typescript
// Antes
parent_id: z.coerce.number().int().optional(),

// Después
parent_id: z.coerce.number().int().optional(),
parent_only: z.coerce.boolean().optional(),
```

### 9.2 Endpoint de Tags - Procesa `parent_only`

**Archivo:** `server/api/tag/index.get.ts:57`

```typescript
if (query.parent_only === true) base = base.where('t.parent_id', 'is', null)
```

### 9.3 Schema de Arcana - Añadido `tag_ids`

**Archivo:** `shared/schemas/entities/arcana.ts:51`

```typescript
tag_ids: z.union([z.coerce.number().int(), z.array(z.coerce.number().int())]).optional(),
```

### 9.4 Verificación de `is_active`

El schema ya usa `z.coerce.boolean()` en todos los query schemas:
- `tagQuerySchema:57` - ✅ `is_active: z.coerce.boolean().optional()`
- `arcanaQuerySchema:50` - ✅ `is_active: z.coerce.boolean().optional()`

---

## 10. Recomendaciones

### ✅ Todas las correcciones completadas (2026-01-28)

| # | Corrección | Archivo | Estado |
|---|------------|---------|--------|
| 1 | `parent_only` en schema tags | `shared/schemas/entities/tag.ts` | ✅ |
| 2 | `parent_only` en endpoint | `server/api/tag/index.get.ts` | ✅ |
| 3 | `tag_ids` en schema arcana | `shared/schemas/entities/arcana.ts` | ✅ |
| 4 | `is_active` coerce verificado | Schemas | ✅ |

---

## 11. Comandos de Verificación

```bash
# Login
TOKEN=$(curl -s -X POST "http://localhost:3007/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"wsurf","password":"windsurf"}' | jq -r '.data.token')

# Test tag_ids (ahora funciona)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3007/api/arcana?page=1&pageSize=3&tag_ids=17" | jq

# Test parent_only (ahora funciona)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3007/api/tag?page=1&pageSize=5&parent_only=true" | jq

# Test is_active (ya funcionaba)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3007/api/arcana?page=1&pageSize=3&is_active=false" | jq
```
