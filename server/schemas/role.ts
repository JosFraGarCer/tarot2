// server/schemas/role.ts
import { z } from 'zod'
import type { RolePermissions } from '../types/permissions'

export const permissionsSchema: z.ZodType<RolePermissions> = z.object({
  canReview: z.boolean().default(false),
  canPublish: z.boolean().default(false),
  canTranslate: z.boolean().default(false),
  canAssignTags: z.boolean().default(false),
  canEditContent: z.boolean().default(false),
  canManageUsers: z.boolean().default(false),
  canResolveFeedback: z.boolean().default(false),
})

// Option A: only existing DB columns (name, description, permissions)
export const roleBaseSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: permissionsSchema,
})

export const roleCreateSchema = roleBaseSchema

export const roleUpdateSchema = roleBaseSchema.partial()

export const roleQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['name', 'created_at']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})
