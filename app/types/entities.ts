// app/types/entities/entities.ts
// /types/entities.ts
// Tipos cliente optimizados para entidades del sistema (TTRPG Cards)

//
// 🧩 Tipos base reutilizables
//

export type CoreCardStatus =
  | 'draft'
  | 'review'
  | 'pending_review'
  | 'changes_requested'
  | 'translation_review'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived'

export interface BaseEntity {
  id: number
  code: string
  sort?: number | null
  image?: string | null
  is_active: boolean
  created_at: string
  modified_at: string
  status: CoreCardStatus
  created_by?: number | null
  content_version_id?: number | null
}

export interface WithTranslation {
  name?: string | null
  short_text?: string | null
  description?: string | null
  language_code?: string | null
}

export interface WithEffects {
  legacy_effects?: boolean
  effects?: Record<string, string[]> | null
}

//
// 🧠 Entidad base con idioma
//
export type CoreCard = BaseEntity & WithTranslation
export type CoreCardList = BaseEntity & Partial<WithTranslation>

//
// 🏗️ Utilitarios CRUD
//
export type CoreCardCreate = Omit<BaseEntity, 'id' | 'created_at' | 'modified_at'> &
  Required<Pick<WithTranslation, 'name'>> &
  Partial<WithTranslation> &
  Partial<WithEffects> & {
    status?: CoreCardStatus
  }

export type CoreCardUpdate = Partial<Omit<CoreCardCreate, 'name'>> &
  Pick<CoreCardCreate, 'name'>

//
// 🎴 Entidades concretas
//

// Arcana
export type Arcana = CoreCard
export type ArcanaCreate = CoreCardCreate
export type ArcanaUpdate = CoreCardUpdate
export type ArcanaList = CoreCardList

// CardType
export type CardType = CoreCard
export type CardTypeCreate = CoreCardCreate
export type CardTypeUpdate = CoreCardUpdate
export type CardTypeList = CoreCardList

// World
export type World = CoreCard
export type WorldCreate = CoreCardCreate
export type WorldUpdate = CoreCardUpdate
export type WorldList = CoreCardList

// Facet
export interface Facet extends CoreCard, WithEffects {
  arcana_id: number
  arcana_is_active?: boolean | null
}
export type FacetCreate = Omit<Facet, 'id' | 'created_at' | 'modified_at'>
export type FacetUpdate = Partial<FacetCreate>
export interface FacetList extends Facet {
  arcana_code?: string | null
  arcana_name?: string | null
  arcana_language_code?: string | null
}

// BaseCard
export interface BaseCard extends CoreCard, WithEffects {
  card_type_id: number
}
export type BaseCardCreate = Omit<BaseCard, 'id' | 'created_at' | 'modified_at'>
export type BaseCardUpdate = Partial<BaseCardCreate>
export interface BaseCardList extends BaseCard {
  card_type_code?: string | null
  card_type_name?: string | null
  card_type_language_code?: string | null
}

// Skill
export interface Skill extends CoreCard, WithEffects {
  card_type_id: number
}
export type SkillCreate = Omit<Skill, 'id' | 'created_at' | 'modified_at'>
export type SkillUpdate = Partial<SkillCreate>
export interface SkillList extends Skill {
  facet_code?: string | null
  facet_name?: string | null
  facet_language_code?: string | null
}

export interface WorldCard {
  id: number
  world_id: number
  base_card_id: number | null
  code: string
  is_override: boolean | null
  image: string | null
  // translations (optional)
  name?: string | null
  short_text?: string | null
  description?: string | null
}

// Tag minimal types
export interface Tag {
  id: number
  code: string
  category: string
  name?: string | null
  short_text?: string | null
  description?: string | null
  parent_id?: number | null
  is_active?: boolean
  sort?: number
  language_code?: string | null
  created_at?: string
  modified_at?: string
  created_by?: number | null
  updated_by?: number | null
  created_by_user?: any
  updated_by_user?: any
}

export interface TagCreate {
  code: string
  category: string
  name: string
  short_text?: string | null
  description?: string | null
  parent_id?: number | null
  is_active?: boolean
  sort?: number
}

export interface TagUpdate {
  code?: string
  category?: string
  name: string
  short_text?: string | null
  description?: string | null
  parent_id?: number | null
  is_active?: boolean
  sort?: number | null
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

// Users
export interface UserRole {
  id: number
  name: string
  description: string | null
}

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

// Import payloads for base cards (used by import UI)
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

// Import payloads for skills
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