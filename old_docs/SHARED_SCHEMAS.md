# 📋 Shared Schemas - Guía de Uso

## 🎯 Propósito

Este documento explica la arquitectura de schemas compartidos entre frontend y backend usando Zod para mantener una única fuente de verdad.

## 📁 Estructura de Directorios

```
shared/
├── schemas/
│   ├── index.ts              # Export principal
│   ├── common.ts            # Enums y schemas base
│   └── entities/
│       ├── arcana.ts        # Schema unificado Arcana
│       ├── base-card.ts     # Schema unificado BaseCard
│       ├── facet.ts         # Schema unificado Facet
│       ├── world.ts         # Schema unificado World
│       ├── skill.ts         # Schema unificado Skill
│       └── world-card.ts    # Schema unificado WorldCard
```

## 🔧 Configuración

### Nuxt Config
```typescript
// nuxt.config.ts
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  alias: {
    '@shared': fileURLToPath(new URL('./shared', import.meta.url))
  },
  nitro: {
    imports: {
      dirs: ['shared/schemas']
    }
  }
})
```

## 📖 Uso en Backend

### API Routes
```typescript
// server/api/arcana/_crud.ts
import { arcanaCreateSchema, arcanaUpdateSchema } from '@shared/schemas/entities/arcana'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = arcanaCreateSchema.parse(body)
  // ... lógica del CRUD
})
```

### Server Middleware
```typescript
// server/middleware/validation.ts
import { arcanaQuerySchema } from '@shared/schemas/entities/arcana'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const validated = arcanaQuerySchema.parse(query)
  event.context.validatedQuery = validated
})
```

## 📖 Uso en Frontend

### Composables
```typescript
// app/composables/manage/useArcanaValidation.ts
import { arcanaCreateSchema, arcanaUpdateSchema } from '@shared/schemas/entities/arcana'

export function useArcanaValidation() {
  const validateCreate = (data: unknown) => {
    return arcanaCreateSchema.safeParse(data)
  }

  return { validateCreate }
}
```

### Componentes
```vue
<!-- app/components/manage/ArcanaForm.vue -->
<script setup lang="ts">
import { arcanaCreateSchema } from '@shared/schemas/entities/arcana'

const schema = arcanaCreateSchema
const formData = ref({
  code: '',
  name: '',
  status: 'draft'
})

const validateForm = () => {
  const result = schema.safeParse(formData.value)
  if (!result.success) {
    // mostrar errores
    return false
  }
  return true
}
</script>
```

## 🎯 Schemas Disponibles

### Common Schemas
- `CardStatusEnum`: Enum de estados desde PostgreSQL
- `cardStatusSchema`: Validación de estados
- `languageCodeSchema`: Validación de códigos de idioma (ISO 639-1)
- `paginationSchema`: Paginación y filtros comunes

### Entity Schemas
Cada entidad incluye:
- `{entity}Schema`: Schema completo
- `{entity}CreateSchema`: Validación para creación
- `{entity}UpdateSchema`: Validación para actualización
- `{entity}QuerySchema`: Validación para consultas

## 🔍 Validaciones Incluidas

### Enums PostgreSQL
```typescript
// Desde docs/SCHEMA POSTGRES..TXT
export const CardStatusEnum = [
  'draft', 'approved', 'archived', 'review',
  'pending_review', 'changes_requested',
  'translation_review', 'rejected', 'published'
] as const
```

### Validación de Idioma
```typescript
export const languageCodeSchema = z
  .string()
  .min(2)
  .max(10)
  .regex(/^[a-z]{2}(-[A-Z]{2})?$/)
  .transform((val) => val.toLowerCase())
```

### Campos Comunes
```typescript
export const baseEntityFields = {
  id: z.number().int().positive(),
  code: z.string().min(1),
  image: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
  status: cardStatusSchema.default('draft'),
  // ...
}
```

## 🧪 Testing

### Ejecutar Tests
```bash
npm run test:schemas
```

### Estructura de Tests
```
tests/schemas/
├── common.test.ts      # Tests de schemas comunes
├── arcana.test.ts      # Tests de Arcana
├── base-card.test.ts   # Tests de BaseCard
└── ...
```

### Ejemplo de Test
```typescript
import { arcanaCreateSchema } from '@shared/schemas/entities/arcana'

describe('arcanaCreateSchema', () => {
  it('should validate valid data', () => {
    const data = { code: 'test', name: 'Test', lang: 'en' }
    const result = arcanaCreateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})
```

## 🚀 Mejores Prácticas

### 1. Siempre usar schemas compartidos
```typescript
// ✅ Correcto
import { arcanaCreateSchema } from '@shared/schemas/entities/arcana'

// ❌ Incorrecto - no duplicar validaciones
const localSchema = z.object({ /* duplicación */ })
```

### 2. Manejo de errores
```typescript
const result = schema.safeParse(data)
if (!result.success) {
  console.error('Validation errors:', result.error.issues)
  return
}
```

### 3. Types inferidos
```typescript
type ArcanaCreate = z.infer<typeof arcanaCreateSchema>
```

### 4. Extender schemas base
```typescript
export const arcanaSchema = z.object({
  ...baseEntityFields,
  sort: z.number().int().default(0),
  name: z.string().min(2),
  // campos específicos
})
```

## 🔗 Referencias

- [Documentación Zod](https://zod.dev/)
- [Schema PostgreSQL](./SCHEMA_POSTGRES.txt)
- [Guía Nuxt 4](https://nuxt.com/docs/4.x/)

## 📝 Notas de Mantenimiento

1. **Single Source of Truth**: Siempre actualizar desde PostgreSQL
2. **Backward Compatibility**: Considerar versionado para cambios breaking
3. **Documentation**: Mantener esta guía actualizada
4. **Tests**: Añadir tests para cualquier nuevo schema o validación
