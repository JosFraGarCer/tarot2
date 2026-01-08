// server/schemas/user.ts
import { z } from 'zod'

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  role_id: z.coerce.number().optional(),
  sort: z
    .enum(['username', 'email', 'created_at', 'modified_at', 'status', 'is_active'])
    .optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

export const userCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  image: z.string().nullable().optional().refine(v => !v || v.length <= 2000, { message: 'Image path too long' }),
  status: z.string().max(20).default('active'),
  is_active: z.boolean().default(true),
  role_ids: z.array(z.number()).nonempty(),
})

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(),
})
