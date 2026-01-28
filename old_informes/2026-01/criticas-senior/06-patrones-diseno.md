# 📋 INFORME DE CRÍTICA SENIOR - PATRONES DE DISEÑO ROTOS

**Fecha:** 2026-01-10  
**Analista:** Senior Dev Reviewer  
**Alcance:** Patrones de diseño y arquitectónicos violados

---

## 🚨 **ANTI-PATRONES CATASTRÓFICOS**

### 1. **God Object Anti-Pattern**

**Archivo:** `app/composables/manage/useEntity.ts` (659 líneas)

**Problema:** Un composable que hace TODO:

```typescript
export function useEntity<TList, TCreate, TUpdate>(options) {
  // ❌ Data fetching
  const { data } = useAsyncData(...)
  
  // ❌ Pagination logic  
  const pagination = ref(...)
  
  // ❌ Filtering logic
  const filters = reactive(...)
  
  // ❌ Caching logic
  const listCache = new Map(...)
  
  // ❌ CRUD operations
  async function create() { ... }
  async function update() { ... }
  async function remove() { ... }
  
  // ❌ State synchronization
  watch([paginated.page, paginated.pageSize], ...)
  
  // ❌ Error handling
  function toErrorMessage(err) { ... }
  
  // ❌ Data transformation
  function normalizeListResponse(raw) { ... }
  
  // ❌ 20+ funciones utilitarias más
}
```

**Violaciones:**
- ❌ Single Responsibility Principle
- ❌ Open/Closed Principle  
- ❌ Dependency Inversion Principle
- ❌ Interface Segregation Principle

### 2. **Magic Reflection Anti-Pattern**

**Archivo:** `app/components/manage/modal/FormModal.vue`

**Problema:** Introspección runtime en lugar de diseño explícito:

```typescript
// ❌ MAGIA NEGRA - IMPOSIBLE DE RAZONAR
const schemaResolvedFields = computed(() => {
  try {
    const s = props.schema?.update || props.schema?.create
    function unwrap(t: unknown): unknown {
      // Desempaquetado recursivo de internals de Zod
      while (t && (t as any) && ((t as any)._def?.typeName === 'ZodOptional' || 
             (t as any)._def?.typeName === 'ZodNullable' || 
             (t as any)._def?.typeName === 'ZodEffects')) {
        t = (t as any)._def?.innerType || (t as any)._def?.schema || (t as any)._def?.inner
      }
      return t
    }
    
    // ❌ Heurística por regex - AMATEUR HOUR
    if (/(^|_)arcana_id$/.test(key)) field = { ...field, type: 'select', relation: 'arcana' }
    if (/(^|_)facet_id$/.test(key)) field = { ...field, type: 'select', relation: 'facet' }
  } catch {
    // ❌ Silenciar errores - PEOR PRÁCTICA
    return {}
  }
})
```

**Problemas de este anti-patrón:**
- Frágil a cambios internos de librerías
- Imposible de debuggear
- Sin type safety
- Errores en runtime no detectados

### 3. **Abstraction Inversion Anti-Pattern**

**Archivo:** `server/utils/createCrudHandlers.ts`

**Problema:** Abstracción de alto nivel que expone detalles de bajo nivel:

```typescript
export function createCrudHandlers<T>(config: CrudConfig<T>) {
  return {
    // ❌ "Abstracción" que requiere conocimiento interno
    buildListQuery: ({ db, lang, query }) => {
      // Usuario necesita saber sobre Kysely internals
      let base = db.selectFrom('table').leftJoin(...)
      return { baseQuery: base, filters: {...} }
    },
    
    // ❌ "Abstracción" que no abstrae nada
    mutations: {
      buildCreatePayload: (input, ctx) => {
        // Usuario hace todo el trabajo manualmente
        return { baseData: {...}, translationData: {...} }
      }
    }
  }
}
```

**Violación:** La abstracción no simplifica, complica.

---

## ⚠️ **ANTI-PATRONES MODERADOS**

### 4. **Singleton Global Anti-Pattern**

**Múltiples archivos usando `globalThis.db`**

**Problema:** Dependencia de estado global no controlado:

```typescript
// ❌ En 20+ archivos
const result = await globalThis.db
  .selectFrom('arcana')
  .selectAll()
  .execute()
```

**Issues:**
- Testing imposible
- Connection leaks
- No control de concurrencia
- Acoplamiento invisible

### 5. **Spaghetti Inheritance Anti-Pattern**

**Archivo:** `app/utils/manage/entityRows.ts` (342 líneas)

**Problema:** Funciones que intentan manejar todos los casos:

```typescript
// ❌ UNA FUNCIÓN PARA TODO
export function mapEntityToRow(entity: any, options: EntityRowOptions): EntityRow {
  const isUserEntity = resourcePath.includes('/user') || normalizedEntity === 'user'
  
  if (isUserEntity) {
    // 50+ líneas de lógica específica de usuario
  }
  
  // 100+ líneas de lógica genérica
  const id = normalizeId(entity?.id ?? entity?.uuid ?? entity?.code)
  const name = pickString(entity?.name, entity?.title, entity?.label, ...)
  // ... 20+ más fallbacks
  
  // ❌ Knowledge de todos los entity types
  if (normalizedLabel.includes('card type')) return `/img/cardType/${src}`
  if (normalizedLabel.includes('world')) return `/img/world/${src}`
  if (normalizedLabel.includes('facet')) return `/img/facet/${src}`
  // ... 10+ más casos específicos
}
```

### 6. **Cargo Cult Programming Anti-Pattern**

**Uso de patrones sin entender su propósito**

**Ejemplo:** Table Bridges que solo pasan props:

```vue
<!-- ❌ Bridge inútil - over-engineering -->
<template>
  <CommonDataTable
    :columns="columns"
    :rows="rows"
    :loading="loading"
    @selection-change="emit('selection-change', $event)"
  />
</template>

<script setup>
// ❌ 150 líneas para... pasar props?
const props = defineProps<{
  columns: any[]
  rows: any[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'selection-change', items: any[]): void
}>()
</script>
```

---

## 🔍 **CASOS EXTREMOS DE DISEÑO ROTO**

### 7. **Hardcoded Dependencies Anti-Pattern**

**Archivo:** `app/components/manage/modal/FormModal.vue`

```typescript
// ❌ Dependencias hardcodeadas - no inyectables
const { arcanaOptions, cardTypeOptions, facetOptions, loadAll } = useEntityRelations()
const statusUtil = useCardStatus()
```

**Problema:** Imposible de testear, no configurable.

### 8. **Primitive Obsession Anti-Pattern**

**Por todo el códigobase**

```typescript
// ❌ Tipos primitivos sin significado
function updateStatus(id: number, status: string) { ... }

// ✅ Debería ser
function updateStatus(id: EntityId, status: CardStatus) { ... }
```

### 9. **Feature Envy Anti-Pattern**

**Archivo:** `app/composables/manage/useEntityTags.ts`

```typescript
// ❌ Función que hace todo el trabajo de otros objetos
export function useEntityTags() {
  async function updateTags(entityId: number, tagIds: number[]) {
    // ❌ Manipula directamente DB, state, UI, todo junto
    const currentTags = await fetchTags(entityId)
    const toAdd = tagIds.filter(id => !currentTags.includes(id))
    const toRemove = currentTags.filter(id => !tagIds.includes(id))
    
    // ❌ Business logic mezclada con data access
    for (const tagId of toAdd) {
      await db.insertInto('tag_links').values({entity_id: entityId, tag_id}).execute()
    }
    
    // ❌ UI updates desde data layer
    selectedTags.value = tagIds
    showSuccessMessage('Tags updated')
  }
}
```

### 10. **Shotgun Surgery Anti-Pattern**

**Cambio simple requiere modificar 10+ archivos**

**Ejemplo:** Añadir nuevo campo a formulario requiere:
1. Modificar schema Zod
2. Actualizar `useEntityFormPreset.ts`
3. Cambiar `FormModal.vue` 
4. Actualizar `entityRows.ts`
5. Modificar CRUD handler
6. Cambiar translations
7. Actualizar 3+ componentes más

---

## 📊 **ANÁLISIS DE PATRONES POR ARCHIVO**

| Archivo | Anti-Patrones Principales | Complejidad | Testeabilidad |
|---------|---------------------------|-------------|---------------|
| **useEntity.ts** | God Object, Global State | 🚨 Extrema | ❌ Imposible |
| **FormModal.vue** | Magic Reflection, Hardcoded | 🚨 Extrema | ❌ Imposible |
| **createCrudHandlers.ts** | Abstraction Inversion | ⚠️ Alta | ❌ Difícil |
| **entityRows.ts** | Spaghetti Inheritance | ⚠️ Alta | ❌ Difícil |
| **Table Bridges** | Cargo Cult, Feature Envy | ⚠️ Media | ⚠️ Posible |

---

## 🎯 **PATRONES CORRECTOS A IMPLEMENTAR**

### 1. **Composition Over Inheritance**
```typescript
// ✅ Composables pequeños y enfocados
export function useEntityData<T>(resourcePath: string) { /* solo data fetching */ }
export function useEntityPagination() { /* solo paginación */ }
export function useEntityFilters() { /* solo filtros */ }
export function useEntityCRUD<T>(resourcePath: string) { /* solo CRUD */ }
```

### 2. **Dependency Injection**
```typescript
// ✅ Inyectar dependencias, no hardcodear
export function useFormModal(options: {
  relations: EntityRelations
  statusUtil: StatusUtil
  imageResolver: ImageResolver
}) { ... }
```

### 3. **Explicit Configuration**
```typescript
// ✅ Configuración explícita, no magia
export interface FormFieldConfig {
  type: 'select' | 'text' | 'textarea'
  relation?: string
  options?: Option[]
}

// No introspección, configuración directa
const fields: Record<string, FormFieldConfig> = {
  arcana_id: { type: 'select', relation: 'arcana' },
  name: { type: 'text' }
}
```

### 4. **Repository Pattern**
```typescript
// ✅ Separar data access de business logic
export interface ArcanaRepository {
  findAll(query: ArcanaQuery): Promise<Arcana[]>
  findById(id: number): Promise<Arcana>
  create(data: ArcanaCreate): Promise<Arcana>
  update(id: number, data: ArcanaUpdate): Promise<Arcana>
  delete(id: number): Promise<void>
}
```

---

## 💀 **VEREDICTO DE DISEÑO**

**Calificación:** F- (Anti-patrones textbook)

**Problemas críticos:**
- God Objects que hacen todo
- Magia reflection que es frágil
- Abstracciones que complican
- Acoplamiento invisible

**Impacto en mantenimiento:**
Cada cambio requiere entender 10+ anti-patrones interconectados.

**Recomendación:** Rewrite de arquitectura usando patrones correctos desde cero.
