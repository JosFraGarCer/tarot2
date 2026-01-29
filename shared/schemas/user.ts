// shared/schemas/user.ts
import { z } from 'zod'
import { coerceBoolean } from './common'

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
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  search: z.string().optional(),
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
  direction: z.enum(['asc', 'desc']).optional(),
})

// Schema for creating users
export const userCreateSchema = z.object({
  username: z.string().min(3, 'Username must have at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must have at least 6 characters'),
  image: z.string().url('Invalid image URL').nullable().optional(),
  status: userStatusEnum.default('active'),
  is_active: z.boolean().default(true),
  role_ids: z.array(z.coerce.number().int().positive(), {
    errorMap: () => ({ message: 'Role IDs must be positive integers' })
  }).optional().default([1]), // Default to role ID 1 for initial setup
})

// Schema for updating users
export const userUpdateSchema = userCreateSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6, 'Password must have at least 6 characters').optional(),
})

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
