import { useEntity } from '~/composables/manage/useEntity'
import type { AdminUserCrud, AdminUserEntity } from '@/types/admin'

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
    filters: {
      search: '',
      status: true,
      is_active: true,
      role_id: undefined,
    },
    pagination: true,
  })
}
