// app/utils/manage/entityRows.ts
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'

export interface EntityRowOptions {
  resourcePath: string
  label: string
  entity?: string | null
}

function normalizeId(input: unknown): number {
  const value = typeof input === 'number' ? input : Number(input)
  return Number.isFinite(value) ? Number(value) : 0
}

function pickString(...candidates: Array<unknown>): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length) {
      return candidate
    }
  }
  return null
}

function pickNumber(...candidates: Array<unknown>): number | null {
  for (const candidate of candidates) {
    const value = normalizeId(candidate)
    if (value) return value
  }
  return null
}

function resolveImage(entity: any, options: EntityRowOptions): string | null {
  const src = entity?.image || entity?.thumbnail_url || entity?.img || null
  if (!src || typeof src !== 'string') return null
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:'))
    return src

  const { resourcePath, label, entity: entityKey } = options

  if (resourcePath.includes('/user')) {
    return src.startsWith('img/') ? `/${src}` : `/img/${src}`
  }

  if (entity?.entity_type) return `/img/${entity.entity_type}/${src}`

  const normalizedLabel = label?.toLowerCase?.() ?? ''
  const normalizedEntity = entityKey?.toLowerCase?.() ?? ''

  if (normalizedLabel.includes('card type') || normalizedEntity.includes('card_type')) return `/img/cardType/${src}`
  if (normalizedLabel.includes('world') || normalizedEntity.includes('world')) return `/img/world/${src}`
  if (normalizedLabel.includes('facet') || normalizedEntity.includes('facet')) return `/img/facet/${src}`
  if (normalizedLabel.includes('skill') || normalizedEntity.includes('skill')) return `/img/skill/${src}`
  if (normalizedLabel.includes('arcana') || normalizedEntity.includes('arcana')) return `/img/arcana/${src}`

  return `/img/${src}`
}

function resolveTranslationStatus(entity: any): string | null {
  return pickString(
    entity?.translation_status_label,
    entity?.translation_status,
    entity?.translationStatus,
    entity?.translation_status?.status,
  )
}

function resolveReleaseStage(entity: any): string | null {
  return pickString(
    entity?.release_stage,
    entity?.releaseStage,
    entity?.release?.stage,
    entity?.release?.status,
  )
}

function resolveTags(entity: any): string | null {
  if (Array.isArray(entity?.tags)) {
    const values = entity.tags
      .map((tag: any) => pickString(tag?.name, tag?.label, tag?.code))
      .filter((value): value is string => Boolean(value))
    return values.length ? values.join(', ') : null
  }
  return pickString(entity?.tags)
}

export function mapEntityToRow(entity: any, options: EntityRowOptions): EntityRow {
  const { resourcePath, entity: entityKey } = options
  const normalizedEntity = entityKey?.toLowerCase?.() ?? ''
  const isUserEntity = resourcePath.includes('/user') || normalizedEntity === 'user'

  if (isUserEntity) {
    const rolesArray = Array.isArray(entity?.roles) ? entity.roles : []
    const roleNames = rolesArray
      .map((role: any) => role?.name)
      .filter((val: any): val is string => typeof val === 'string' && val.length > 0)

    const id = normalizeId(entity?.id)
    const name = pickString(entity?.username, entity?.email, `#${id || '—'}`) ?? `#${id || '—'}`
    const image = resolveImage(entity, options)
    const permissions = typeof entity?.permissions === 'object' && entity?.permissions !== null
      ? entity.permissions as Record<string, boolean>
      : {}

    return {
      id,
      name,
      short_text: entity?.email ?? '',
      description: null,
      status: typeof entity?.status === 'string' ? entity.status : null,
      statusKind: 'user',
      userStatus: typeof entity?.status === 'string' ? entity.status : null,
      img: image,
      email: entity?.email ?? null,
      username: entity?.username ?? null,
      roles: roleNames,
      permissions,
      created_at: entity?.created_at ?? null,
      updated_at: entity?.modified_at ?? null,
      translationStatus: resolveTranslationStatus(entity),
      release_stage: resolveReleaseStage(entity),
      releaseStage: resolveReleaseStage(entity),
      revisionCount: pickNumber(entity?.revision_count, entity?.revisions_count),
      raw: entity,
    }
  }

  const id = normalizeId(entity?.id ?? entity?.uuid ?? entity?.code)
  const name = pickString(
    entity?.name,
    entity?.title,
    entity?.label,
    entity?.code,
    entity?.slug,
    `#${entity?.id ?? '—'}`,
  ) ?? `#${entity?.id ?? '—'}`

  const shortText = pickString(entity?.short_text, entity?.summary, entity?.subtitle) ?? ''
  const description = pickString(entity?.description, entity?.long_text, entity?.details) ?? ''
  const status = pickString(entity?.status, entity?.state)
  const isActive = typeof entity?.is_active === 'boolean'
    ? entity.is_active
    : (typeof entity?.isActive === 'boolean' ? entity.isActive : null)
  const image = resolveImage(entity, options)
  const tags = resolveTags(entity)

  const translationStatus = resolveTranslationStatus(entity)
  const releaseStage = resolveReleaseStage(entity)

  return {
    id,
    name,
    short_text: shortText,
    description,
    status: status,
    statusKind: normalizedEntity === 'cardtype' ? 'card' : undefined,
    is_active: isActive,
    img: image,
    code: entity?.code ?? null,
    lang: pickString(entity?.language_code_resolved, entity?.language_code, entity?.lang, entity?.locale),
    card_type: pickString(
      entity?.card_type_name,
      entity?.card_type_code,
      entity?.card_type_label,
      entity?.card_type_title,
      entity?.card_type?.name,
      entity?.card_type?.code,
      entity?.card_type?.label,
      entity?.card_type?.title,
      entity?.cardType_name,
      entity?.cardType_code,
      entity?.cardType_label,
      entity?.cardType_title,
      entity?.cardType?.name,
      entity?.cardType?.code,
      entity?.cardType?.label,
      entity?.cardType?.title,
      entity?.type?.name,
      entity?.type?.code,
      entity?.type?.label,
      entity?.type?.title,
      entity?.card_type,
    ),
    arcana: pickString(
      entity?.arcana_name,
      entity?.arcana_code,
      entity?.arcana_label,
      entity?.arcana_title,
      entity?.arcana?.name,
      entity?.arcana?.code,
      entity?.arcana?.label,
      entity?.arcana?.title,
      entity?.Arcana?.name,
      entity?.Arcana?.code,
      entity?.Arcana?.label,
      entity?.Arcana?.title,
      entity?.arcana,
    ),
    facet: pickString(
      entity?.facet_name,
      entity?.facet_code,
      entity?.facet_label,
      entity?.facet_title,
      entity?.facet?.name,
      entity?.facet?.code,
      entity?.facet?.label,
      entity?.facet?.title,
      entity?.Facet?.name,
      entity?.Facet?.code,
      entity?.Facet?.label,
      entity?.Facet?.title,
      entity?.facetRel?.name,
      entity?.facetRel?.code,
      entity?.facetRel?.label,
      entity?.facetRel?.title,
      entity?.facet,
    ),
    parent: pickString(entity?.parent_name, entity?.parent_code, entity?.parent?.name, entity?.parent?.code),
    category: pickString(entity?.category, entity?.category_name, entity?.category_label),
    tags,
    translationStatus,
    release_stage: releaseStage,
    releaseStage,
    revisionCount: pickNumber(entity?.revision_count, entity?.revisions_count),
    updated_at: entity?.updated_at ?? entity?.modified_at ?? null,
    created_at: entity?.created_at ?? null,
    raw: entity,
  }
}

export function mapEntitiesToRows(entities: any[], options: EntityRowOptions): EntityRow[] {
  return entities.map(entity => mapEntityToRow(entity, options))
}

export function mapUserToRow(user: any): EntityRow {
  const rolesArray = Array.isArray(user?.roles) ? user.roles : []

  const result = {
    id: normalizeId(user?.id),
    name: pickString(user?.username, user?.email, `#${normalizeId(user?.id) || '—'}`) ?? `#${normalizeId(user?.id) || '—'}`,
    email: typeof user?.email === 'string' ? user.email : null,
    username: typeof user?.username === 'string' ? user.username : null,
    roles: rolesArray, // <-- Keep original roles array
    status: typeof user?.status === 'string' ? user.status : null,
    img: resolveImage(user, { resourcePath: '/api/user', label: 'User', entity: 'user' }),
    created_at: user?.created_at ?? null,
    updated_at: user?.modified_at ?? user?.updated_at ?? null,
    raw: user,
  }
  return result
}

export function mapUsersToRows(users: any[]): EntityRow[] {
  if (!Array.isArray(users)) return []
  return users.map(mapUserToRow)
}

export function mapFeedbackToRow(feedback: any): EntityRow {
  const id = normalizeId(feedback?.id)
  const title = pickString(
    feedback?.comment,  // Priorizar comment
    feedback?.title,
    feedback?.detail,
  )
  const shortText = pickString(feedback?.detail, feedback?.comment)
  const status = pickString(feedback?.status)
  const lang = pickString(feedback?.language_code)
  const category = pickString(feedback?.category)
  const createdAt = feedback?.created_at ?? null
  const updatedAt = feedback?.resolved_at ?? null

  return {
    id,
    name: title ?? `#${id || '—'}`,
    short_text: shortText ?? '',
    description: shortText ?? null,
    status: status ?? null,
    statusKind: 'card' as const,
    lang: lang,
    category: category,
    code: feedback?.entity_code || `${feedback?.entity_type || '—'} #${feedback?.entity_id || '—'}`, // Usar entity_code de la API o fallback
    created_at: createdAt,
    updated_at: updatedAt,
    raw: feedback, // Aquí pasamos todos los campos originales
  }
}

export function mapFeedbackListToRows(feedback: any[]): EntityRow[] {
  if (!Array.isArray(feedback)) return []
  return feedback.map(entry => mapFeedbackToRow(entry))
}

export function mapRevisionToRow(revision: any): EntityRow {
  const id = normalizeId(revision?.id)
  const entityType = pickString(
    revision?.entity_type,
    revision?.entityType,
    revision?.entity_kind,
  )
  const entityId = pickNumber(revision?.entity_id, revision?.entityId)
  const fallbackCode = entityType && entityId != null
    ? `${entityType}#${entityId}`
    : null
  const entityCode = pickString(
    revision?.entity_code,
    revision?.entityCode,
    revision?.entity_slug,
    fallbackCode,
  )
  const entityName = pickString(
    revision?.entity_name,
    revision?.entityName,
    revision?.entity_title,
    revision?.entity_label,
  )
  const name = entityName ?? entityCode ?? `#${id || '—'}`
  const status = pickString(revision?.status)
  const version = revision?.version_number ?? revision?.version ?? null
  const lang = pickString(revision?.language_code, revision?.lang, revision?.locale)
  const createdAt = revision?.created_at ?? null
  const updatedAt = revision?.updated_at ?? revision?.modified_at ?? null

  return {
    id,
    name,
    code: entityCode ?? null,
    status: status ?? null,
    statusKind: 'revision',
    lang,
    version,
    category: entityType ?? null,
    short_text: pickString(revision?.notes, revision?.summary) ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    raw: revision,
  }
}

export function mapRevisionsToRows(revisions: any[]): EntityRow[] {
  if (!Array.isArray(revisions)) return []
  return revisions.map(entry => mapRevisionToRow(entry))
}
