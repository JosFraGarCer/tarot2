import { z } from 'zod'

export const adminUserStatusEnum = z.enum(['active', 'inactive', 'suspended', 'banned', 'pending'])

const adminUserBaseSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  image: z.string().url().optional().nullable(),
  status: adminUserStatusEnum.default('active'),
  role_ids: z.array(z.number()).nonempty(),
})

export const adminUserCreateSchema = adminUserBaseSchema.extend({
  password: z.string().min(6),
})

export const adminUserUpdateSchema = adminUserBaseSchema.partial().extend({
  role_ids: z.array(z.number()).optional(),
  password: z.string().min(6).optional(),
})
