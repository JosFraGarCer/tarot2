// app/composables/admin/useUsers.ts
import { useEntity } from '~/composables/manage/useEntity'
import type { AdminUserCrud, AdminUserEntity } from '@/types/admin'
import { adminUserCreateSchema, adminUserUpdateSchema } from '@shared/index'

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  role_ids: number[]
  status?: string
}

export interface UpdateUserPayload {
  username?: string
  email?: string
  password?: string | null
  role_ids?: number[]
  status?: string
}

export function useAdminUsersCrud(): AdminUserCrud {
  return useEntity<AdminUserEntity, CreateUserPayload, UpdateUserPayload>({
    resourcePath: '/api/user',
    schema: {
      create: adminUserCreateSchema,
      update: adminUserUpdateSchema,
    },
    filters: {
      search: '',
      status: undefined,
      role_id: undefined,
    },
    pagination: true,
    includeLangParam: false,
    includeLangInCreateBody: false,
  })
}
