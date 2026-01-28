# Auditoría CRÍTICA de Servidor - Tarot2 (V2)

**Estado:** CRÍTICO - debt técnica masiva
**Auditor:** Senior Developer (Modo Hater)
**Fecha:** 2026-01-28

---

## 0. Introducción

He revisado `server/` con ojos de un senior que ha visto demasiado código malo. El verdict es claro: **el equipo de desarrollo ha generado una cantidad obscena de debt técnica**. Hay problemas en todas las capas, desde la seguridad básica hasta la lógica de negocio más simple.

---

## 1. Seguridad y Auth (Problemas CRÍTICOS)

### 🚨 1.1 `auth.ts` - Rendimiento Penoso
**Archivo:** `server/plugins/auth.ts`

```typescript
// Línea 24-29: La clave se codifica en CADA request
function secretKey() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw createError({...})
  return new TextEncoder().encode(secret) // ← SE EJECUTA SIEMPRE
}
```

**Problema:** El equipo implementó `secretKey()` como una función que se llama en cada verificación de token. `new TextEncoder().encode()` no es caro, pero es **estúpido** hacerlo repetidamente. La clave debería estar cacheada a nivel módulo.

**Veredicto:** Ineficiente. El equipo no entiende que el encoding es innecesario si ya tenemos la clave.

---

### 🚨 1.2 `auth.ts` - Validación de Payload LAXa
**Archivo:** `server/plugins/auth.ts:88-90`

```typescript
const id = payload['id']
const email = payload['email']
const username = payload['username']

if (typeof id !== 'number' || typeof email !== 'string' || typeof username !== 'string') {
  throw createError({...})
}
```

**Problema:** Se accede a `payload` como si fuera un objeto plano con claves literales. Si el token viene malformado o tiene un `sub` en lugar de `id`, esto falla silenciosamente o lanza errores crípticos.

**Veredicto:** El equipo no sabe usar tipado seguro con JOSE.

---

### 🚨 1.3 `auth.hydrate.ts` - JSON.parse Sin Error Handling
**Archivo:** `server/middleware/00.auth.hydrate.ts:80`

```typescript
permissions: (typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions) as Record<string, boolean>,
```

**Problema:** Si `r.permissions` es una cadena inválida (corrupción de DB, dato mal migrado), esto lanza un `SyntaxError` no capturado que puede tumbar el middleware entero.

**Veredicto:** El equipo no considera que la DB puede tener datos corruptos.

---

### 🚨 1.4 `auth.hydrate.ts` - Catch Silencioso
**Archivo:** `server/middleware/00.auth.hydrate.ts:90-92`

```typescript
} catch {
  // Silently fail - user will be treated as unauthenticated
}
```

**Problema:** El `catch` vacío swallowea TODO: timeouts de DB, errores de conexión, syntax errors, todo. Si la DB está caída, nadie sabe why.

**Veredicto:** Debugging nightmare garantizado.

---

## 2. Tipado y TypeScript (Desastre Total)

### 💀 2.1 `i18n.ts` - Abuso de `any` y casts manuales
**Archivo:** `server/utils/i18n.ts:47-66`

```typescript
const db = (globalThis as { db: Kysely<DB> }).db // ← Type assertion insegura

const fallbacks = await db
  .selectFrom(table as any) // ← 'any' para evitar error de tipo
  .select([
    fk as any, // ← 'any' para evitar error de tipo
    'language_code' as any,
    // ...
  ])
  .where(fk as any, 'in', ids) // ← 'any' para evitar error de tipo
  .execute()

const key = row[fk as string] as number // ← Dos casts para lo mismo
```

**Problema:** El equipo ha decidido que "si TypeScript se queja, usamos `any`". Esto elimina TODO el valor del tipado estático. La función `getLanguageWithFallback` es esencialmente JavaScript con sintaxis de TypeScript.

**Veredicto:** El equipo no entiende que `any` es un escape hatch, no una solución.

---

### 💀 2.2 `translatableUpsert.ts` - Interfaz Genérica Mal Usada
**Archivo:** `server/utils/translatableUpsert.ts:8-23`

```typescript
export interface TranslatableUpsertOptions<TEntityRow = any> {
  // ...
  baseData?: Record<string, any> // ← 'any' everywhere
  translationData?: Record<string, any> | null
  select: (db: Kysely<DB>, id: number, lang: string) => Promise<TEntityRow>
  // ...
}
```

**Problema:** La interfaz usa genéricos (`TEntityRow`) pero luego todo lo demás es `any`. No hay consistencia. El tipo genérico no sirve de nada si los datos que pasan son `any`.

**Veredicto:** El equipo copió código de Stack Overflow sin entender genéricos.

---

### 💀 2.3 `filters.ts` - Type Casting Inseguro
**Archivo:** `server/utils/filters.ts:52`

```typescript
const normalizedSearchRaw = (options.search ?? (options as any).q ?? '').toString().trim()
```

**Problema:** Se usa `(options as any)` para acceder a `q` porque la interfaz `BuildFiltersOptions` no la define. Esto es un parche feo.

**Veredicto:** El equipo añade propiedades sobre la marcha sin actualizar tipos.

---

## 3. Lógica de Negocio y Consistencia

### ⚠️ 3.1 `createCrudHandlers.ts` - Heurística de Foreign Key Peligrosa
**Archivo:** `server/utils/createCrudHandlers.ts:109-114`

```typescript
const translation = config.translation === undefined ? {
  table: `${String(config.baseTable)}_translations` as keyof DB,
  foreignKey: `${String(config.baseTable).replace(/s$/, '')}_id`, // ← Heurística peligrosa
  languageKey: 'language_code',
  defaultLang: 'en',
} : config.translation
```

**Problema:** La heurística `${String(config.baseTable).replace(/s$/, '')}_id` asume que las tablas plurales terminan en 's' y la FK singular es el singular. Esto falla para:
- `base_card` → `base_card_id` (correcto)
- `base_skills` → `base_skill_id` (correcto)
- Pero si alguien nombra una tabla `people` → `peopl_id` (ERROR)

**Veredicto:** El equipo asume convenciones de nomenclatura que no son universales.

---

### ⚠️ 3.2 `filters.ts` - Límite de Página Sin Validación Real
**Archivo:** `server/utils/filters.ts:58`

```typescript
const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 100)
```

**Problema:** El límite hardcodeado de 100 items por página puede ser arbitrario para algunas entidades. No hay forma de configurarlo por entidad.

**Veredicto:** El equipo hardcodea constantes sin pensar en flexibilidad.

---

### ⚠️ 3.3 `deleteLocalizedEntity.ts` - Posible FK Constraint Violation
**Archivo:** `server/utils/deleteLocalizedEntity.ts:62`

```typescript
await trx.deleteFrom(translationTable).where(foreignKey, '=', id).execute()
```

**Problema:** Si hay FK constraints con `ON DELETE RESTRICT`, esto falla. El código no verifica ni loguea si la FK constraint impide el borrado.

**Veredicto:** El equipo asume que siempre se puede borrar.

---

## 4. Rendimiento y SQL

### 🔥 4.1 `world_card/_crud.ts` - Filtros de Tags con SQL Literales
**Archivo:** `server/api/world_card/_crud.ts:152-166`

```typescript
if (tagsLower && tagsLower.length > 0) {
  base = base.where((eb: ExpressionBuilder<DB, any>) => eb.exists(
    eb.selectFrom('tag_links as tl')
      .innerJoin('tags as t', 't.id', 'tl.tag_id')
      .leftJoin('tags_translations as tt_req', (join: any) =>
        join.onRef('tt_req.tag_id', '=', 't.id').on('tt_req.language_code', '=', lang),
      )
      // ... más joins
  ))
}
```

**Problema:** Este patrón se repite en CADA controlador con tags. Son 7-8 controladores con código casi idéntico de 15 líneas cada uno. El equipo no abstractó esto en un helper reusable.

**Veredicto:** Copy-paste massif. El equipo no sabe reutilizar código.

---

### 🔥 4.2 `skill/_crud.ts` - Inconsistencia de Tipado
**Archivo:** `server/api/skill/_crud.ts:53`

```typescript
async function eagerLoadTags(db: DB, skillIds: number[], lang: string) {
```

**Problema:** `db: DB` es un tipo de esquema, no una instancia de Kysely. Debería ser `Kysely<DB>` o `any`. Esto compila pero es semánticamente incorrecto.

**Veredicto:** El equipo confunde tipos de esquema con instancias de base de datos.

---

## 5. Manejo de Errores y Logging

### 🗑️ 5.1 `parseQuery.ts` - Logger Sin Verificación
**Archivo:** `server/utils/parseQuery.ts:22-24`

```typescript
if (logger && typeof logger[level] === 'function') {
  logger[level]({ scope, params: parsed }, 'Parsed query parameters')
}
```

**Problema:** Se verifica que `logger[level]` sea una función, pero si el logger no existe, simplemente no se loguea nada. No hay fallback a `console`.

**Veredicto:** El equipo no considera que el logger puede ser undefined en desarrollo.

---

### 🗑️ 5.2 `response.ts` - Fallback Language Incompleto
**Archivo:** `server/utils/response.ts:84`

```typescript
const normalizedData = lang ? markLanguageFallback(data, lang) : data
```

**Problema:** Si `lang` es vacío o null string (`''`), `markLanguageFallback` no se ejecuta. Esto puede llevar a datos sin resolved language code en la respuesta.

**Veredicto:** El equipo no considera casos edge de strings vacíos.

---

## 6. Code Smells y Malas Prácticas

### 🤢 6.1 `users.ts` - Lógica de Permisos Fragil
**Archivo:** `server/utils/users.ts:12`

```typescript
merged[key] = merged[key] || !!perms[key]
```

**Problema:** La lógica `merged[key] || !!perms[key]` significa que si un rol tiene `false` para un permiso, y otro tiene `true`, el resultado es `true`. Esto es correcto para OR, pero si el primer rol tiene `false` y no hay otro, el resultado es `false`. Sin embargo, si el primer rol tiene `undefined` y el segundo tiene `false`, el resultado es `false`. Es confuso.

**Veredicto:** La lógica es correcta pero confusa. Falta un comentario explicativo.

---

### 🤢 6.2 `language.ts` - Mutación de Objetos
**Archivo:** `server/utils/language.ts:19-31`

```typescript
function applyFallbackFlag(record: unknown, lang?: string | null) {
  if (!record || typeof record !== 'object') return
  if ('language_code_resolved' in (record as any) || 'language_code' in (record as any)) {
    const fallback = resolveFallbackFlag(record as LanguageAware, lang)
    ;(record as LanguageAware).language_is_fallback = fallback // ← Mutación
  }
  // ...
}
```

**Problema:** La función muta los objetos del input (`record`). Esto es un side effect que puede ser inesperado para el caller.

**Veredicto:** El equipo no sigue principios de programación funcional donde es posible.

---

### 🤢 6.3 `validate.ts` - Extracción de Errores Manual
**Archivo:** `server/utils/validate.ts:14-22`

```typescript
let errorsArr: unknown[] | null = null
if ('error' in parsed) {
  const errUnknown = (parsed as { error: unknown }).error
  if (typeof errUnknown === 'object' && errUnknown !== null && 'errors' in errUnknown) {
    const maybeErrors = (errUnknown as Record<string, unknown>)['errors']
    if (Array.isArray(maybeErrors)) errorsArr = maybeErrors
  }
}
```

**Problema:** Zod tiene `parsed.error.errors`, pero el equipo usa casts manuales para acceder a propiedades. Esto es propenso a errores si la estructura de error de Zod cambia.

**Veredicto:** El equipo no usa la API pública de Zod correctamente.

---

## 7. Resumen de Debt Técnica

| Categoría | Severidad | Count |
|-----------|-----------|-------|
| Seguridad | CRÍTICA | 4 |
| Tipado | DESASTRE | 5 |
| Lógica de Negocio | ALTA | 3 |
| Rendimiento | MEDIA | 2 |
| Code Smells | BAJA | 4 |

**Total de Issues:** 18

---

## 8. Recomendaciones de Alto Nivel

1. **Tipado Estricto:** Eliminar TODO `any` de `i18n.ts` y `translatableUpsert.ts`. Usar tipos genéricos correctamente.
2. **Seguridad:** Añadir error handling para `JSON.parse` y eliminar catch silenciosos.
3. **Abstracción:** Crear un helper para filtros de tags para eliminar duplicación.
4. **Cache:** Cachear `secretKey()` a nivel módulo en `auth.ts`.
5. **Validación:** Usar la API de Zod correctamente en `validate.ts`.

---

## 9. Conclusión

El código de `server/` funciona, pero está escrito por un equipo junior que no entiende TypeScript, no sabe abstraer lógica, y trata los errores como si no existieran. La deuda técnica es manejable pero **no ignorable**. Si siguen añadiendo features así, el proyecto se volverá inmanejable en 6 meses.

El equipo necesita:
- Mentoría en TypeScript
- Revisión de código obligatoria
- Formación en manejo de errores
- Un senior que les pegue cuando usen `any`
