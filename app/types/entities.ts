// app/types/entities.ts
// app/types/entities/entities.ts
// /types/entities.ts
// ⚠️ DEPRECADO: Este archivo ahora re-exporta desde entityTypes.ts
// La fuente de verdad es shared/schemas/

// Re-export desde entityTypes.ts (que viene de shared/schemas)
export * from './entityTypes'

// Tipos específicos de UI (no duplicados en shared/schemas)
export interface UserSummary {
  id: number
  email: string
  username: string
  status: string
  created_at: string
  modified_at: string
  roles: UserRole[]
  image: string | null
}

export interface UserRole {
  id: number
  name: string
  description: string | null
}

export interface CreateUserPayload {
  email: string
  username: string
  password: string
  status?: string
  roles?: number[]
}

export interface UpdateUserPayload {
  email?: string
  username?: string
  password?: string
  status?: string
  roles?: number[]
}

export interface UpdateCurrentUserPayload {
  email?: string
  username?: string
  password?: string
  status?: string
  roles?: number[]
  image?: string | null
}

// Import payloads
export interface BaseCardImportTranslation {
  name: string
  short_text?: string | null
  description?: string | null
}

export interface BaseCardImportItem {
  card_type_code: string
  code: string
  is_active?: boolean
  translations: Record<string, BaseCardImportTranslation>
}

export interface BaseCardImportPayload {
  base_cards: BaseCardImportItem[]
}

export interface BaseCardImportResponse {
  success: boolean
  data: {
    created: number
    errors: { code: string; message: string }[]
  }
}

export interface SkillImportTranslation {
  name: string
  short_text?: string | null
  description?: string | null
}

export interface SkillImportItem {
  facet_code: string
  code: string
  sort?: number | null
  is_active?: boolean
  translations: Record<string, SkillImportTranslation>
}

export interface SkillImportPayload {
  skills: SkillImportItem[]
}

export interface SkillImportResponse {
  success: boolean
  data: {
    created: number
    errors: { code: string; message: string }[]
  }
}

export interface TagImportTranslation {
  name: string
  short_text?: string
  description?: string
}

export interface TagImportItem {
  code: string
  category: string
  sort?: number
  is_active?: boolean
  parent_code?: string
  translations: Record<string, TagImportTranslation>
}

export interface TagImportPayload {
  tags: TagImportItem[]
}