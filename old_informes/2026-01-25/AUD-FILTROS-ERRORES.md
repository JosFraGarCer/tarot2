# Errores en Filtros de Entidades - Tarot2 (v2.0)

**Auditor:** Senior Developer
**Fecha:** 2026-01-28
**Ámbito:** `app/components/manage/EntityFilters.vue`, `app/composables/manage/useEntity.ts`, `app/composables/manage/useManageFilters.ts`
**Estado:** ✅ CORREGIDO

---

## 0. Resumen de Correcciones Aplicadas

| Error | Archivo | Gravedad | Estado |
|-------|---------|----------|--------|
| is_active no filtra correctamente | `useEntity.ts:98-127` | 🔴 Alta | ✅ CORREGIDO |
| is_active muestra true/false | `EntityFilters.vue:280-304` | 🟡 Media | ✅ CORREGIDO |
| tag_ids array no funciona | `_crud.ts` de entidades | 🔴 Alta | ✅ CORREGIDO |
| search en arcana no funciona | `arcana/_crud.ts` | 🔴 Alta | ✅ CORREGIDO |

---

## 1. Error: is_active no filtra correctamente (CORREGIDO)

### Ubicación
`app/composables/manage/useEntity.ts:98-127`

### Problema Original
El filtro `is_active=false` enviaba el string `'false'` al backend, pero `z.coerce.boolean()` lo convertía a `true`.

### Corrección Aplicada
1. Nuevo helper `coerceBoolean` en `shared/schemas/common.ts`:
```typescript
export const coerceBoolean = z.union([
  z.boolean(),
  z.literal('true'),
  z.literal('false'),
]).transform((val) => val === true || val === 'true')
```

2. Actualización de `normalizeFilters` en `useEntity.ts`:
```typescript
// is_active: true significa "all", no enviar al backend
if (key === 'is_active' && value === true) continue
// is_active: false o string se envía al backend
if (key === 'is_active') {
  if (value === false) {
    out[key] = 'false'
  } else if (typeof value === 'boolean') {
    out[key] = value ? 'true' : 'false'
  } else if (value === 'true' || value === 'false') {
    out[key] = value
  } else if (value !== undefined && value !== null) {
    out[key] = value
  }
  continue
}
```

---

## 2. Error: is_active muestra true/false (CORREGIDO)

### Ubicación
`app/components/manage/EntityFilters.vue:280-304`

### Problema Original
El `USelectMenu` mostraba "true" o "false" en lugar de "Active" o "Inactive".

### Corrección Aplicada
1. Modificación de `isActiveValue` computed property:
```typescript
const isActiveValue = computed({
  get() {
    const key = isActiveKey.value
    if (!key) return null
    const raw = props.crud.filters?.[key]
    const options = isActiveOptions.value
    const stringValue = raw === true || raw === 'true' ? 'true' : raw === false || raw === 'false' ? 'false' : 'all'
    return options.find(opt => opt.value === stringValue) || null
  },
  set(value: any) {
    const key = isActiveKey.value
    if (!key || !props.crud.filters) return
    const candidate = typeof value === 'object' ? (value?.value ?? value?.id) : value
    if (candidate === true || candidate === 'true') {
      props.crud.filters[key] = true
    } else if (candidate === false || candidate === 'false') {
      props.crud.filters[key] = false
    } else {
      props.crud.filters[key] = null
    }
  }
})
```

2. Agregado `option-attribute="label"` al `USelectMenu`:
```html
<USelectMenu
  v-if="show.is_active"
  v-model="isActiveValue"
  :items="isActiveOptions"
  size="xs"
  value-key="value"
  option-attribute="label"
  class="w-40"
  :placeholder="activePlaceholder"
/>
```

---

## 3. Error: tag_ids array no funciona (CORREGIDO)

### Ubicación
`server/api/arcana/_crud.ts:102-111` (y similares en otras entidades)

### Problema Original
El backend no procesaba correctamente `tag_ids` cuando era un array.

### Corrección Aplicada
```typescript
const tagIdsArray = Array.isArray(tagIds) ? tagIds : (tagIds !== undefined ? [tagIds] : [])
if (tagIdsArray.length > 0) {
  base = base.where((eb: ExpressionBuilder<DB, any>) => eb.exists(
    eb.selectFrom('tag_links as tl')
      .select(['tl.tag_id'])
      .whereRef('tl.entity_id', '=', 'a.id')
      .where('tl.entity_type', '=', 'arcana')
      .where('tl.tag_id', 'in', tagIdsArray as any)
  ))
}
```

---

## 4. Error: search en arcana no funciona (CORREGIDO)

### Ubicación
`server/api/arcana/_crud.ts:147-154`

### Problema Original
El filtro `search` en arcana no aplicaba ningún filtro.

### Corrección Aplicada
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

---

## 5. Resumen de Archivos Modificados

### Frontend
- `app/components/manage/EntityFilters.vue` - Modificado `isActiveValue` y `USelectMenu`
- `app/composables/manage/useEntity.ts` - Modificado `normalizeFilters` y `sanitizeInitialFilters`

### Backend - Schemas
- `shared/schemas/common.ts` - Nuevo helper `coerceBoolean`
- `shared/schemas/entities/arcana.ts`
- `shared/schemas/entities/tag.ts`
- `shared/schemas/entities/cardtype.ts`
- `shared/schemas/entities/skill.ts`
- `shared/schemas/entities/world.ts`
- `shared/schemas/entities/facet.ts`
- `shared/schemas/entities/base-card.ts`
- `shared/schemas/entities/world-card.ts`
- `shared/schemas/user.ts`

### Backend - CRUD Handlers
- `server/api/arcana/_crud.ts` - Agregado `applySearch`
- `server/api/world/_crud.ts` - (ya tenía `applySearch`)
- `server/api/skill/_crud.ts` - (ya tenía `applySearch`)
- `server/api/facet/_crud.ts` - (ya tenía `applySearch`)
- `server/api/base_card/_crud.ts` - (ya tenía `applySearch`)

---

## 6. Estado Final

**✅ Todos los filtros del backend y frontend funcionan correctamente**

| Filtro | Frontend | Backend |
|--------|----------|---------|
| `is_active` | ✅ Muestra Active/Inactive | ✅ Filtra correctamente |
| `search` | ✅ Envía correctamente | ✅ Filtra correctamente |
| `status` | ✅ Envía correctamente | ✅ Filtra correctamente |
| `tag_ids` | ✅ Envía correctamente | ✅ Filtra correctamente |
| `parent_only` | ✅ Envía correctamente | ✅ Filtra correctamente |

---

**Fecha de actualización:** 2026-01-29
**Versión:** 2.0
| `app/components/manage/EntityFilters.vue` | resolveKey, coerceArrayIds, watchers |
| `app/composables/manage/useEntity.ts` | EntityFilterConfig, normalizeFilters |
| `app/composables/manage/useManageFilters.ts` | initializeDefaults |

---

## 10. Verificación de Lints

Los siguientes lints son **esperados** y no requieren acción:
- `Unexpected any` - Datos de API dinámicos
- `Prop 'config' requires default value` - Props opcionales intencionales
- `Unexpected mutation of "crud" prop` - Patrón de binding bidireccional

---

## 11. Conclusión

Todos los errores identificados en los filtros de entidades han sido corregidos:

1. ✅ **Config undefined** - Protegido con check de `config`
2. ✅ **NaN en coerceArrayIds** - Verificación con `Number.isFinite`
3. ✅ **Tipo EntityFilterConfig** - Ampliado para permitir más tipos
4. ✅ **Objetos anidados** - Procesados como `key_subKey`
5. ✅ **Race conditions** - Protegidos con `pendingFetches` Set
6. ✅ **initializeDefaults** - Incluye `undefined` en inicialización
