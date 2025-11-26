// server/api/user/schema.ts
// server/api/users/schema.ts
import { z } from 'zod'

export const statusEnum = z.enum(['active', 'inactive'])

export const userBaseSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  image: z
    .string()
    .url()
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  status: statusEnum.default('active'),
})

export const userCreateSchema = userBaseSchema.extend({
  password: z.string().min(6),
})

export const userUpdateSchema = userBaseSchema.extend({
  password: z.string().min(6).optional(),
})

export const userPatchSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  image: z
    .string()
    .url()
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  status: statusEnum.optional(),
})
