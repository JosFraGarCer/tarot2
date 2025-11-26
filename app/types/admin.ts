// app/types/admin.ts
import type { Permissions } from '@/types/permissions'
import type { ManageCrud } from '@/types/manage'

export interface AdminUserRole {
  id: number
  name: string
  description?: string | null
  permissions?: Permissions | Record<string, any>
}

export interface AdminUserEntity {
  id: number
  username: string
  email: string
  image?: string | null
  status: string
  created_at: string
  modified_at?: string | null
  roles: AdminUserRole[]
  permissions: Record<string, boolean>
  is_active?: boolean | null
  role_ids?: number[]
  [key: string]: unknown
}

export type AdminUserCrud = ManageCrud<AdminUserEntity>
