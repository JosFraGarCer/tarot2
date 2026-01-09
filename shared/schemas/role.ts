// shared/schemas/role.ts
import { z } from 'zod'

// Role permissions schema
export const permissionsSchema = z.object({
  canReview: z.boolean().default(false),
  canPublish: z.boolean().default(false),
  canTranslate: z.boolean().default(false),
  canAssignTags: z.boolean().default(false),
  canEditContent: z.boolean().default(false),
  canManageUsers: z.boolean().default(false),
  canResolveFeedback: z.boolean().default(false),
  canSeeAllStatuses: z.boolean().default(false),
})

// Base role schema
export const roleBaseSchema = z.object({
  name: z.string().min(2, 'Role name must have at least 2 characters'),
  description: z.string().optional(),
  permissions: permissionsSchema,
})

// Schema for creating roles
export const roleCreateSchema = roleBaseSchema

// Schema for updating roles
export const roleUpdateSchema = roleBaseSchema.partial()

// Schema for role queries
export const roleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  search: z.string().optional(),
  name: z.string().optional(),
  sort: z.enum(['name', 'created_at']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

// Types exportados
export type RolePermissions = z.infer<typeof permissionsSchema>
export type RoleBase = z.infer<typeof roleBaseSchema>
export type RoleCreate = z.infer<typeof roleCreateSchema>
export type RoleUpdate = z.infer<typeof roleUpdateSchema>
export type RoleQuery = z.infer<typeof roleQuerySchema>
