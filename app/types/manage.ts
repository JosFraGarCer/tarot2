// app/types/manage.ts
import type { EntityCrud } from '~/composables/manage/useEntity'
import type { CoreCardStatus } from '@/types/entities'

export interface ManageEntityTag {
  id?: number
  code?: string | null
  name?: string | null
  label?: string | null
  language_code?: string | null
}

export interface ManageEntityRelation {
  id?: number | null
  code?: string | null
  name?: string | null
  language_code?: string | null
}

export interface ManageEntity {
  id: number
  code?: string | null
  name?: string | null
  title?: string | null
  status?: CoreCardStatus | string | null
  is_active?: boolean | null
  language_code?: string | null
  language_code_resolved?: string | null
  short_text?: string | null
  description?: string | null
  image?: string | null
  thumbnail_url?: string | null
  entity_type?: string | null
  tags?: ManageEntityTag[] | null
  card_type_id?: number | null
  card_type_code?: string | null
  card_type_name?: string | null
  card_type_language_code?: string | null
  arcana_id?: number | null
  arcana_code?: string | null
  arcana_name?: string | null
  arcana_language_code?: string | null
  facet_id?: number | null
  facet_code?: string | null
  facet_name?: string | null
  facet_language_code?: string | null
  parent_id?: number | null
  parent_code?: string | null
  parent_name?: string | null
  parent_language_code?: string | null
  [key: string]: unknown
}

export type ManageCrud<TList = ManageEntity, TCreate = Record<string, unknown>, TUpdate = Record<string, unknown>> = EntityCrud<TList, TCreate, TUpdate>
export type AnyManageCrud = ManageCrud<ManageEntity, Record<string, unknown>, Record<string, unknown>>
