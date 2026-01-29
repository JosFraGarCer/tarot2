// app/types/entityTypes.ts
// Tipos derivados de schemas Zod para uso en componentes frontend
// Fuente de verdad: shared/schemas/

import type { Arcana, ArcanaCreate, ArcanaUpdate } from '~/../../shared/schemas/entities/arcana'
import type { BaseCard, BaseCardCreate, BaseCardUpdate } from '~/../../shared/schemas/entities/base-card'
import type { CardType, CardTypeCreate, CardTypeUpdate } from '~/../../shared/schemas/entities/cardtype'
import type { Facet, FacetCreate, FacetUpdate } from '~/../../shared/schemas/entities/facet'
import type { Skill, SkillCreate, SkillUpdate } from '~/../../shared/schemas/entities/skill'
import type { World, WorldCreate, WorldUpdate } from '~/../../shared/schemas/entities/world'
import type { WorldCard, WorldCardCreate, WorldCardUpdate } from '~/../../shared/schemas/entities/world-card'
import type { Tag, TagCreate, TagUpdate } from '~/../../shared/schemas/entities/tag'
import type { CardStatus } from '~/../../shared/schemas/common'

// Re-export desde shared schemas
export type {
  Arcana,
  ArcanaCreate,
  ArcanaUpdate,
  BaseCard,
  BaseCardCreate,
  BaseCardUpdate,
  CardType,
  CardTypeCreate,
  CardTypeUpdate,
  Facet,
  FacetCreate,
  FacetUpdate,
  Skill,
  SkillCreate,
  SkillUpdate,
  World,
  WorldCreate,
  WorldUpdate,
  WorldCard,
  WorldCardCreate,
  WorldCardUpdate,
  Tag,
  TagCreate,
  TagUpdate,
  CardStatus,
}

// Union de todos los tipos de entidades
export type EntityType = Arcana | BaseCard | CardType | Facet | Skill | World | WorldCard | Tag

// Tipo genérico para cualquier entidad
export interface EntityRow {
  id: number
  code: string
  name?: string | null
  short_text?: string | null
  description?: string | null
  status: CardStatus | string
  release_stage?: string | null
  image?: string | null
  is_active: boolean
  created_at: string
  modified_at: string
  tags?: Array<{ id: number; name: string }>
  language_code_resolved?: string | null
  language_is_fallback?: boolean
  translation_status?: 'complete' | 'partial' | 'missing'
  [key: string]: unknown
}

// Tipo para columnas de tabla
export interface TableColumn<T = EntityRow> {
  key: keyof T | string
  label?: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  hidden?: boolean
}

// Tipo para meta de paginación
export interface ListMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages?: number
  count?: number
}

// Tipo para filtros de entidad
export interface EntityFilters {
  search?: string
  q?: string
  status?: CardStatus | string
  is_active?: boolean
  tags?: number[]
  page?: number
  pageSize?: number
  sort?: string
  direction?: 'asc' | 'desc'
  lang?: string
  [key: string]: unknown
}

// Tipo para opciones de selección
export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

// Tipo para acciones de tabla
export interface TableAction {
  key: string
  label: string
  icon?: string
  handler: (row: EntityRow) => void
  disabled?: (row: EntityRow) => boolean
}

// Tipo para configuración de badge
export interface BadgeConfig {
  type: 'status' | 'release' | 'translation' | 'user'
  value: string | null | undefined
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'soft' | 'subtle' | 'outline'
}

// Tipo para configuración de modal
export interface ModalConfig {
  open: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
}

// Helper para obtener tipo de entidad
export type EntityKind = 'arcana' | 'base_card' | 'card_type' | 'facet' | 'skill' | 'world' | 'world_card' | 'tag'

// Mapping de tipos por entidad
export interface EntityTypeMap {
  arcana: Arcana
  base_card: BaseCard
  card_type: CardType
  facet: Facet
  skill: Skill
  world: World
  world_card: WorldCard
  tag: Tag
}

// Helper para obtener tipo específico
export type EntityOfKind<K extends EntityKind> = EntityTypeMap[K]

// Tipo para respuesta de API
export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: ListMeta
}

// Tipo para error de API
export interface ApiError {
  status: number
  message: string
  data?: {
    message?: string
    statusCode?: number
  }
}
