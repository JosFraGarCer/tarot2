// shared/schemas/admin/user.ts
import { z } from 'zod'

// Enums para administración de usuarios
export const adminUserStatusEnum = z.enum([
  'active',
  'inactive',
  'suspended',
  'banned',
  'pending'
])

// Schema base para usuarios admin
const adminUserBaseSchema = z.object({
  username: z.string().min(3, 'Username must have at least 3 characters'),
  email: z.string().email('Invalid email format'),
  image: z.string().url('Invalid image URL').nullable().optional(),
  status: adminUserStatusEnum.default('active'),
  role_ids: z.array(z.coerce.number().int().positive()).nonempty('At least one role is required'),
})

// Schema para creación de usuarios admin
export const adminUserCreateSchema = adminUserBaseSchema.extend({
  password: z.string().min(6, 'Password must have at least 6 characters'),
})

// Schema para actualización de usuarios admin
export const adminUserUpdateSchema = adminUserBaseSchema.partial().extend({
  role_ids: z.array(z.coerce.number().int().positive()).optional(),
  password: z.string().min(6, 'Password must have at least 6 characters').optional(),
})

// Types exportados
export type AdminUserStatus = z.infer<typeof adminUserStatusEnum>
export type AdminUserCreate = z.infer<typeof adminUserCreateSchema>
export type AdminUserUpdate = z.infer<typeof adminUserUpdateSchema>
