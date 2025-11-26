// app/types/api.ts
// /types/api.ts
export type Permissions = Record<string, boolean>

export interface RoleDTO {
  id: number
  name: string
  description?: string | null
  created_at?: string | null
  permissions?: Permissions
}

export interface UserDTO {
  id: number
  username: string
  email: string
  image?: string | null
  status: 'active' | 'inactive' | string
  created_at?: string
  modified_at?: string
  roles?: RoleDTO[]
  permissions?: Permissions // merged desde roles en el backend
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  meta: any | null
}

export type LoginData = { token: string; user: UserDTO }
export type LoginResponse = ApiEnvelope<LoginData>
export type MeResponse = ApiEnvelope<UserDTO>
