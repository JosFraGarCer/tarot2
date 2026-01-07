// app/utils/manage/entityRows.ts

export type EntityRow = {
  id: number
  name: string
  short_text?: string | null
  description?: string | null
  status?: string | null
  statusKind?: 'card' | 'user' | 'feedback' | 'revision'
  userStatus?: string | null
  is_active?: boolean | null
  img?: string | null
  code?: string | null
  lang?: string | null
  card_type?: string | null
  arcana?: string | null
  facet?: string | null
  parent?: string | null
  category?: string | null
  tags?: string | null
  updated_at?: string | Date | null
  created_at?: string | Date | null
  email?: string | null
  username?: string | null
  roles?: string[]
  permissions?: Record<string, boolean>
  translationStatus?: string | null
  release_stage?: string | null
  releaseStage?: string | null
  revisionCount?: number | null
  version?: string | number | null
  raw?: Record<string, unknown>
}

export interface EntityRowOptions {
  resourcePath: string
  label: string
  entity?: string | null
}

// Helper type for nested entity objects that may have name/code/label/title
interface NestedEntity {
  name?: string
  code?: string
  label?: string
  title?: string
}

// Helper to safely access nested entity properties
function nested(value: unknown): NestedEntity | null {
  if (value && typeof value === 'object') return value as NestedEntity
  return null
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

function resolveImage(entity: Record<string, unknown>, options: EntityRowOptions): string | null {
  const src = pickString(entity.image, entity.thumbnail_url, entity.img)
  if (!src) return null
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:'))
    return src

  const { resourcePath, label, entity: entityKey } = options

  if (resourcePath.includes('/user')) {
    return src.startsWith('img/') ? `/${src}` : `/img/${src}`
  }

  if (typeof entity.entity_type === 'string') return `/img/${entity.entity_type}/${src}`

  const normalizedLabel = label?.toLowerCase?.() ?? ''
  const normalizedEntity = entityKey?.toLowerCase?.() ?? ''

  if (normalizedLabel.includes('card type') || normalizedEntity.includes('card_type')) return `/img/cardType/${src}`
  if (normalizedLabel.includes('world') || normalizedEntity.includes('world')) return `/img/world/${src}`
  if (normalizedLabel.includes('facet') || normalizedEntity.includes('facet')) return `/img/facet/${src}`
  if (normalizedLabel.includes('skill') || normalizedEntity.includes('skill')) return `/img/skill/${src}`
  if (normalizedLabel.includes('arcana') || normalizedEntity.includes('arcana')) return `/img/arcana/${src}`

  return `/img/${src}`
}

function resolveTranslationStatus(entity: Record<string, unknown>): string | null {
  const statusObj = entity.translation_status as Record<string, unknown> | undefined
  return pickString(
    entity.translation_status_label,
    entity.translation_status,
    entity.translationStatus,
    statusObj?.status,
  )
}

function resolveReleaseStage(entity: Record<string, unknown>): string | null {
  const releaseObj = entity.release as Record<string, unknown> | undefined
  return pickString(
    entity.release_stage,
    entity.releaseStage,
    releaseObj?.stage,
    releaseObj?.status,
  )
}

function resolveTags(entity: Record<string, unknown>): string | null {
  if (Array.isArray(entity.tags)) {
    const values = entity.tags
      .map((tag: unknown) => {
        const t = nested(tag)
        return pickString(t?.name, t?.label, t?.code)
      })
      .filter((value): value is string => Boolean(value))
    return values.length ? values.join(', ') : null
  }
  return pickString(entity.tags)
}

export function mapEntityToRow(entity: unknown, options: EntityRowOptions): EntityRow {
  const row = entity as Record<string, unknown>
  const { resourcePath, entity: entityKey } = options
  const normalizedEntity = entityKey?.toLowerCase?.() ?? ''
  const isUserEntity = resourcePath.includes('/user') || normalizedEntity === 'user'

  if (isUserEntity) {
    const rolesArray = Array.isArray(row.roles) ? row.roles : []
    const roleNames = rolesArray
      .map((role: unknown) => nested(role)?.name)
      .filter((val): val is string => typeof val === 'string' && val.length > 0)

    const id = normalizeId(row?.id)
    const name = pickString(row?.username, row?.email, `#${id || '—'}`) ?? `#${id || '—'}`
    const image = resolveImage(row, options)
    const permissions = typeof row.permissions === 'object' && row.permissions !== null
      ? row.permissions as Record<string, boolean>
      : {}

    return {
      id,
      name,
      short_text: (row.email as string) ?? '',
      description: null,
      status: typeof row.status === 'string' ? row.status : null,
      statusKind: 'user',
      userStatus: typeof row.status === 'string' ? row.status : null,
      img: image,
      email: (row.email as string) ?? null,
      username: (row.username as string) ?? null,
      roles: roleNames,
      permissions,
      created_at: (row.created_at as string) ?? null,
      updated_at: (row.modified_at as string) ?? null,
      translationStatus: resolveTranslationStatus(row),
      release_stage: resolveReleaseStage(row),
      releaseStage: resolveReleaseStage(row),
      revisionCount: pickNumber(row.revision_count, row.revisions_count),
      raw: row,
    }
  }

  const id = normalizeId(row.id ?? row.uuid ?? row.code)
  const name = pickString(
    row.name,
    row.title,
    row.label,
    row.code,
    row.slug,
    `#${row.id ?? '—'}`,
  ) ?? `#${row.id ?? '—'}`

  const shortText = pickString(row.short_text, row.summary, row.subtitle) ?? ''
  const description = pickString(row.description, row.long_text, row.details) ?? ''
  const status = pickString(row.status, row.state)
  const isActive = typeof row.is_active === 'boolean'
    ? row.is_active
    : (typeof row.isActive === 'boolean' ? row.isActive : null)
  const image = resolveImage(row, options)
  const tags = resolveTags(row)

  const translationStatus = resolveTranslationStatus(row)
  const releaseStage = resolveReleaseStage(row)

  const cardTypeObj = row.card_type as Record<string, unknown> | undefined
  const cardTypeObj2 = row.cardType as Record<string, unknown> | undefined
  const typeObj = row.type as Record<string, unknown> | undefined

  return {
    id,
    name,
    short_text: shortText,
    description,
    status: status,
    statusKind: normalizedEntity === 'cardtype' ? 'card' : undefined,
    is_active: isActive,
    img: image,
    code: (row.code as string) ?? null,
    lang: pickString(row.language_code_resolved, row.language_code, row.lang, row.locale),
    card_type: pickString(
      row.card_type_name,
      row.card_type_code,
      row.card_type_label,
      row.card_type_title,
      cardTypeObj?.name,
      cardTypeObj?.code,
      cardTypeObj?.label,
      cardTypeObj?.title,
      row.cardType_name,
      row.cardType_code,
      row.cardType_label,
      row.cardType_title,
      cardTypeObj2?.name,
      cardTypeObj2?.code,
      cardTypeObj2?.label,
      cardTypeObj2?.title,
      typeObj?.name,
      typeObj?.code,
      typeObj?.label,
      typeObj?.title,
      row.card_type,
    ),
    arcana: pickString(
      row.arcana_name,
      row.arcana_code,
      row.arcana_label,
      row.arcana_title,
      nested(row.arcana)?.name,
      nested(row.arcana)?.code,
      nested(row.arcana)?.label,
      nested(row.arcana)?.title,
      nested(row.Arcana)?.name,
      nested(row.Arcana)?.code,
      nested(row.Arcana)?.label,
      nested(row.Arcana)?.title,
      row.arcana,
    ),
    facet: pickString(
      row.facet_name,
      row.facet_code,
      row.facet_label,
      row.facet_title,
      nested(row.facet)?.name,
      nested(row.facet)?.code,
      nested(row.facet)?.label,
      nested(row.facet)?.title,
      nested(row.Facet)?.name,
      nested(row.Facet)?.code,
      nested(row.Facet)?.label,
      nested(row.Facet)?.title,
      nested(row.facetRel)?.name,
      nested(row.facetRel)?.code,
      nested(row.facetRel)?.label,
      nested(row.facetRel)?.title,
      row.facet,
    ),
    parent: pickString(row.parent_name, row.parent_code, nested(row.parent)?.name, nested(row.parent)?.code),
    category: pickString(row.category, row.category_name, row.category_label),
    tags,
    translationStatus,
    release_stage: releaseStage,
    releaseStage,
    revisionCount: pickNumber(row.revision_count, row.revisions_count),
    updated_at: (row.updated_at as string) ?? (row.modified_at as string) ?? null,
    created_at: (row.created_at as string) ?? null,
    raw: row,
  }
}

export function mapEntitiesToRows(entities: unknown[], options: EntityRowOptions): EntityRow[] {
  return entities.map(entity => mapEntityToRow(entity, options))
}

export function mapUserToRow(user: Record<string, unknown>): EntityRow {
  const rolesArray = Array.isArray(user?.roles) ? user.roles : []
  const roleNames = rolesArray
    .map((role: unknown) => {
      const r = nested(role)
      return typeof r?.name === 'string' ? r.name : null
    })
    .filter((name): name is string => Boolean(name))

  const id = normalizeId(user?.id)
  return {
    id,
    name: pickString(user?.username, user?.email, `#${id || '—'}`) ?? `#${id || '—'}`,
    email: typeof user?.email === 'string' ? user.email : null,
    username: typeof user?.username === 'string' ? user.username : null,
    roles: roleNames,
    status: typeof user?.status === 'string' ? user.status : null,
    img: resolveImage(user, { resourcePath: '/api/user', label: 'User', entity: 'user' }),
    created_at: (user?.created_at as string | Date) ?? null,
    updated_at: (user?.modified_at ?? user?.updated_at) as string | Date ?? null,
    raw: user,
  }
}

export function mapUsersToRows(users: Record<string, unknown>[]): EntityRow[] {
  if (!Array.isArray(users)) return []
  return users.map(mapUserToRow)
}

export function mapFeedbackToRow(feedback: Record<string, unknown>): EntityRow {
  const id = normalizeId(feedback?.id)
  const title = pickString(
    feedback?.title,
    feedback?.summary,
    feedback?.comment,
    feedback?.detail,
  )
  const shortText = pickString(feedback?.detail, feedback?.comment, feedback?.notes)
  const status = pickString(feedback?.status)
  const lang = pickString(feedback?.language_code, feedback?.lang, feedback?.locale)
  const category = pickString(feedback?.type, feedback?.category)
  const createdAt = (feedback?.created_at as string | Date) ?? null
  const updatedAt = (feedback?.resolved_at ?? feedback?.updated_at) as string | Date ?? null

  return {
    id,
    name: title ?? `#${id || '—'}`,
    short_text: shortText ?? '',
    description: shortText ?? null,
    status: status ?? null,
    statusKind: 'feedback',
    lang: lang,
    category: category,
    code: pickString(feedback?.card_code, feedback?.entity_code, feedback?.entity_slug),
    created_at: createdAt,
    updated_at: updatedAt,
    raw: feedback,
  }
}

export function mapFeedbackListToRows(feedback: Record<string, unknown>[]): EntityRow[] {
  if (!Array.isArray(feedback)) return []
  return feedback.map(entry => mapFeedbackToRow(entry))
}

export function mapRevisionToRow(revision: Record<string, unknown>): EntityRow {
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
  const version = (revision?.version_number ?? revision?.version) as string | number | null ?? null
  const lang = pickString(revision?.language_code, revision?.lang, revision?.locale)
  const createdAt = (revision?.created_at as string | Date) ?? null
  const updatedAt = (revision?.updated_at ?? revision?.modified_at) as string | Date ?? null

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

export function mapRevisionsToRows(revisions: Record<string, unknown>[]): EntityRow[] {
  if (!Array.isArray(revisions)) return []
  return revisions.map(entry => mapRevisionToRow(entry))
}
