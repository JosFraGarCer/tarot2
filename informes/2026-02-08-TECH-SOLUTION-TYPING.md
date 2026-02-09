# 🛠️ SOLUCIÓN TÉCNICA: Tipado Estricto Kysely + Zod (Sin `any`)

Para dejar de usar `any` y que el compilador de TypeScript trabaje para nosotros en lugar de contra nosotros, debemos seguir estos tres pilares:

## 1. El Triángulo de Poder: Inferencia, DB y Response

No podemos usar un solo tipo para todo. Necesitamos:
- **`Input` (Zod)**: Lo que envía el cliente (validado).
- **`Database` (Kysely)**: Lo que entiende Postgres (tipos generados).
- **`Output` (DTO)**: Lo que devolvemos (la unión de tabla base + traducciones).

## 2. Refactorización de `createCrudHandlers`

El problema actual es que `TRow` se define como `any`. La solución es tipar el handler basándose en la tabla de Kysely:

```typescript
import type { Selectable, Insertable, Updateable } from 'kysely'
import type { DB } from '../database/types'

interface CrudHandlersConfig<
  TTable extends keyof DB, // Obligamos a que sea una tabla real
  TQuerySchema extends ZodTypeAny,
  TCreateSchema extends ZodTypeAny,
  TUpdateSchema extends ZodTypeAny,
  // Inferimos automáticamente de Zod
  TQuery = z.infer<TQuerySchema>,
  TCreate = z.infer<TCreateSchema>,
  TUpdate = z.infer<TUpdateSchema>,
  // TRow es el resultado de un Select en esa tabla
  TRow = Selectable<DB[TTable]> 
> {
  baseTable: TTable
  // ... resto de la config
}
```

## 3. Mapeo Explícito en lugar de Casts

En los archivos `_crud.ts`, en lugar de devolver `Record<string, any>`, debemos usar los tipos `Insertable` y `Updateable` de Kysely:

```typescript
// Ejemplo en arcana/_crud.ts
mutations: {
  buildCreatePayload: (input: ArcanaCreate): { 
    baseData: Insertable<DB['arcana']>, 
    translationData: Insertable<DB['arcana_translations']> 
  } => {
    return {
      baseData: {
        code: input.code,
        status: input.status,
        // TS nos avisará si falta un campo obligatorio en la DB
      },
      translationData: {
        name: input.name,
        language_code: input.lang
      }
    }
  }
}
```

## 4. Por qué es complejo tipar el CRUD
El tipado estricto de Kysely es excelente para queries estáticas, pero en un sistema genérico como `createCrudHandlers`, la flexibilidad editorial prima. El uso de `any` en ciertos puntos internos es una decisión pragmática para permitir que el sistema de **English-first** y **fallback** funcione sin la sobrecarga de una arquitectura de tipos excesivamente rígida que dificultaría la creación de nuevas entidades.

### Ejemplo de uso correcto:
```typescript
export const arcanaCrud = createCrudHandlers<'arcana', typeof arcanaQuerySchema, ... , MiTipoPersonalizadoDeRespuesta>({
  // ...
})
```

---

## 🚀 Próximo Paso
Voy a refactorizar `server/utils/createCrudHandlers.ts` para eliminar los `any` en la estructura principal y demostrar que la complejidad no es "inútil", es **seguridad**.
