// app/composables/manage/useArcanaValidation.ts
// Ejemplo de uso de schemas compartidos en frontend
import { z } from 'zod'
import { arcanaCreateSchema, arcanaUpdateSchema, arcanaQuerySchema } from '@shared/schemas/entities/arcana'

export function useArcanaValidation() {
  
  // Validación para creación
  const validateCreate = (data: unknown) => {
    return arcanaCreateSchema.safeParse(data)
  }

  // Validación para actualización  
  const validateUpdate = (data: unknown) => {
    return arcanaUpdateSchema.safeParse(data)
  }

  // Validación para queries
  const validateQuery = (data: unknown) => {
    return arcanaQuerySchema.safeParse(data)
  }

  // Types exportados para uso en componentes
  type ArcanaCreate = z.infer<typeof arcanaCreateSchema>
  type ArcanaUpdate = z.infer<typeof arcanaUpdateSchema>
  type ArcanaQuery = z.infer<typeof arcanaQuerySchema>

  return {
    validateCreate,
    validateUpdate,
    validateQuery,
    schemas: {
      create: arcanaCreateSchema,
      update: arcanaUpdateSchema,
      query: arcanaQuerySchema,
    },
    types: {
      ArcanaCreate,
      ArcanaUpdate,
      ArcanaQuery,
    }
  }
}
