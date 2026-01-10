# 📋 INFORME DE CRÍTICA SENIOR - BACKEND API

**Fecha:** 2026-01-10  
**Analista:** Senior Dev Reviewer  
**Alcance:** Backend API y middleware

---

## 🚨 **CRÍTICAS GRAVES**

### 1. **N+1 Queries No Resueltos Realmente**

**Archivo:** `server/api/arcana/_crud.ts` (líneas 42-58)

**Problema:** A pesar de supuestas optimizaciones, sigue ejecutando subqueries por cada fila:

```sql
-- ESTE SUBQUERY SE EJECUTA POR CADA ARCANA
select coalesce(json_agg(
  json_build_object(
    'id', tg.id,
    'name', coalesce(tt_req.name, tt_en.name),
    'language_code_resolved', coalesce(tt_req.language_code, 'en')
  )
), '[]'::json)
from tag_links as tl
join tags as tg on tg.id = tl.tag_id
left join tags_translations as tt_req
  on tt_req.tag_id = tg.id and tt_req.language_code = ${lang}
left join tags_translations as tt_en
  on tt_en.tag_id = tg.id and tt_en.language_code = 'en'
where tl.entity_type = ${'arcana'} and tl.entity_id = a.id
```

**Impacto real:**
- 100 arcanas = 100+ subqueries adicionales
- Cada subquery con 3 joins = 300+ operaciones extras
- Tiempo de respuesta: O(n²) en lugar de O(n)

### 2. **createCrudHandlers - Abstracción Fallida**

**Archivo:** `server/utils/createCrudHandlers.ts`

**Problema:** Intento de abstraer CRUD que genera más complejidad:

```typescript
export function createCrudHandlers<T>(config: CrudConfig<T>) {
  // 200+ líneas de "magia" genérica
  // Intenta adivinar estructura de tablas
  // Genera queries dinámicas incomprensibles
}
```

**Issues críticos:**
- Imposible de debuggear
- Queries generadas no optimizables
- Oculta problemas de performance

### 3. **Auth Middleware - JOIN Pesado Persistente**

**Archivo:** `server/middleware/00.auth.hydrate.ts`

**Problema:** A pesar de optimizaciones reportadas, sigue haciendo JOIN costoso:

```typescript
// AÚN HACIENDO JSON_AGG EN CADA REQUEST
sql`coalesce(json_agg(r.*) filter (where r.id is not null), '[]'::json)`.as('roles')
```

**Problemas:**
- Cada request ejecuta aggregation
- No hay cache de roles
- User status check en cada llamada

---

## ⚠️ **CRÍTICAS MODERADAS**

### 4. **buildFilters - Lógica Espagueti**

**Archivo:** `server/utils/buildFilters.ts`

**Problema:** Función monolítica intentando manejar todo:

```typescript
export function buildFilters(params: any, config: FilterConfig) {
  // 100+ líneas de if/else anidados
  if (params.search) { /* lógica */ }
  if (params.status) { /* lógica */ }
  if (params.tag_ids) { /* lógica */ }
  if (params.created_by) { /* lógica */ }
  // ... 20+ más
}
```

**Issues:**
- Dificil de extender
- Testing imposible
- Performance impact por evaluar todo

### 5. **Error Handling Inconsistente**

**Múltiples archivos CRUD**

**Problema:** Algunos endpoints tienen error handling, otros no:

```typescript
// Algunos endpoints
try {
  const result = await db.insertInto(table).values(payload).execute()
  return { success: true, data: result }
} catch (error) {
  console.error('Insert failed:', error)
  return { success: false, error: error.message }
}

// Otros directamente
return await db.insertInto(table).values(payload).execute()
```

### 6. **SQL Injection Potential**

**Archivo:** `server/api/arcana/_crud.ts` (líneas 77, 102)

**Problema:** Interpolación directa de user input:

```typescript
const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
// SIN SANITIZACIÓN
and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower})
```

**Riesgo:** Si `tags` contiene SQL malicioso.

---

## 🔍 **CASOS EXTREMOS Y BUGS**

### 7. **Memory Leaks en Global DB Connection**

**Archivo:** Múltiples archivos usando `globalThis.db`

**Problema:** Connection pool nunca se cierra:

```typescript
// En cada CRUD handler
const result = await globalThis.db
  .selectFrom('arcana')
  .selectAll()
  .execute()
```

**Issue:** Sin connection closing, potential leaks bajo carga.

### 8. **Transaction Management Ausente**

**Todos los CRUD endpoints**

**Problema:** No hay transactions para operaciones complejas:

```typescript
// Crear entidad + traducciones + tags sin transaction
const baseData = await db.insertInto(table).values(payload).execute()
const translationData = await db.insertInto(transTable).values(trans).execute()
const tagLinks = await db.insertInto(tagLinksTable).values(links).execute()
```

**Riesgo:** Inconsistencia si falla parcialmente.

### 9. **Rate Limiting Bypass**

**Archivo:** `server/middleware/02.rate-limit.ts`

**Problema:** Rate limiting por IP pero no por usuario:

```typescript
const key = `rate_limit:${getClientIP(event)}`
// Usuario autenticado puede bypass con múltiples IPs
```

### 10. **Schema Validation Inconsistente**

**Endpoints CRUD**

**Problema:** Algunos endpoints validan, otros no:

```typescript
// Algunos con validación
const validated = arcanaCreateSchema.parse(input)

// Otros directamente
const result = await createArcana(input)  // Sin validación
```

---

## 📊 **ANÁLISIS DE PERFORMANCE**

### Queries Problemáticas Detectadas

| Query | Complejidad | Frecuencia | Impacto |
|-------|-------------|------------|---------|
| **Tags subquery** | O(n²) | Cada list | 🚨 Crítico |
| **Auth roles aggregation** | O(n) | Cada request | ⚠️ Alto |
| **Translation joins** | O(n) | Cada query | ⚠️ Medio |
| **Filter building** | O(n) | Cada list | ⚠️ Medio |

### Endpoints Más Lentos

1. **GET /api/arcana** - N+1 en tags
2. **GET /api/base_card** - Múltiples joins
3. **GET /api/world_card** - Subqueries anidados
4. **POST /api/* (cualquier)** - Auth overhead

---

## 🎯 **RECOMENDACIONES URGENTES**

### Inmediato (Esta semana)
1. **Implementar eager loading real** para tags
2. **Añadir prepared statements** para prevenir SQL injection
3. **Remover console.log** de middleware

### Corto plazo (2-4 semanas)
1. **Cache de roles por usuario** con TTL
2. **Transaction management** para operaciones complejas
3. **Query optimization** - analizar execution plans

### Mediano plazo (1-2 meses)
1. **Eliminar createCrudHandlers** - usar queries específicas
2. **Implementar connection pooling** apropiado
3. **Add comprehensive logging** estructurado

### Arquitectural Changes
1. **Separate read/write models** (CQRS)
2. **Implement proper caching layer** (Redis)
3. **Add database connection health checks**

---

## 💀 **VEREDICTO BACKEND**

**Calificación:** D- (Funciona pero es ineficiente y arriesgado)

**Problemas críticos:**
- Performance O(n²) en queries principales
- Abstracciones que ocultan problemas
- Falta de proper transaction management
- Security issues potenciales

**Riesgo en producción:** Alto - colapsará bajo carga real.

**Recomendación:** Refactor agresivo de queries y eliminación de abstracciones genéricas.
