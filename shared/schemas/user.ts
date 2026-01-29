// shared/schemas/user.ts
import { z } from 'zod'
import {
  coerceBoolean,
  baseQueryFields,
  withLanguageTransform,
  baseEntityCreateFields,
} from './common'

// User status enum
export const userStatusEnum = z.enum([
  'active',
  'inactive',
  'suspended',
  'banned',
  'pending'
])

// Schema for user queries
export const userQuerySchema = z.object({
  ...baseQueryFields,
  status: userStatusEnum.optional(),
  is_active: coerceBoolean.optional(),
  role_id: z.coerce.number().int().optional(),
  sort: z.enum([
    'username',
    'email',
    'created_at',
    'modified_at',
    'status',
    'is_active'
  ]).optional(),
}).transform(withLanguageTransform)

// Schema for creating users
export const userCreateSchema = z.object({
  ...baseEntityCreateFields,
  username: z.string().min(3, 'Username must have at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must have at least 6 characters'),
  role_ids: z.array(z.coerce.number().int().positive()).optional().default([1]), // Default to role ID 1 for initial setup
})

// Schema for updating own profile (Self)
export const userUpdateSelfSchema = z.object({
  username: z.string().min(3, 'Username must have at least 3 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must have at least 6 characters').optional(),
  image: z.string().url('Invalid image URL').nullable().optional(),
})

// Schema for admin updates (Full access)
export const userUpdateAdminSchema = userUpdateSelfSchema.extend({
  status: userStatusEnum.optional(),
  is_active: z.boolean().optional(),
  role_ids: z.array(z.coerce.number().int().positive()).optional(),
})

// Legacy alias for backward compatibility
export const userUpdateSchema = userUpdateAdminSchema

// Schema for user login
export const userLoginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
})

// Schema for user registration
export const userRegisterSchema = z.object({
  username: z.string().min(3, 'Username must have at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must have at least 6 characters'),
})

// Types exportados
export type UserStatus = z.infer<typeof userStatusEnum>
export type UserQuery = z.infer<typeof userQuerySchema>
export type UserCreate = z.infer<typeof userCreateSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
export type UserLogin = z.infer<typeof userLoginSchema>
export type UserRegister = z.infer<typeof userRegisterSchema>
