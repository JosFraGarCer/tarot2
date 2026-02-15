// app/components/sketches/mockData.ts
// Shared mock data for sketch POCs.
// Mirrors the real API shape (editorial_state, translation_state, status, etc.)
// so sketches can be connected to useEntity.ts with minimal changes.
//
// Aligned with:
//   shared/editorial/card-status.ts  (CardStatus enum)
//   shared/editorial/transitions.ts  (cardStatusTransitions + transitionRequirements)
//   shared/schemas/common.ts         (baseEntityFields incl. content_version_id)
//   shared/schemas/content-version.ts (releaseStageEnum)
//   shared/schemas/version-context.ts (versionContextSchema)

export type EditorialStatus = 'draft' | 'pending_review' | 'review' | 'changes_requested' | 'translation_review' | 'approved' | 'published' | 'rejected' | 'archived'

export type ReleaseStage = 'dev' | 'alfa' | 'beta' | 'candidate' | 'release' | 'revision'

export interface EditorialState {
  status: EditorialStatus
  updated_by: string | null
  updated_at: string | null
  content_version_id: number | null
}

export interface TranslationLangState {
  lang: string
  has_translation: boolean
  is_fallback: boolean
  status: EditorialStatus | null
  updated_by: string | null
  updated_at: string | null
}

export interface EditorialMetadata {
  status: EditorialStatus
  allowedTransitions: EditorialStatus[]
  publishReady: boolean
  blockingReasons: string[]
}

export interface MockEntity {
  id: number
  code: string
  name: string
  status: EditorialStatus
  entity_type: string
  created_at: string
  modified_at: string
  updated_by: string
  created_by: string
  editorial_state: EditorialState | null
  editorial: EditorialMetadata | null
  translations: TranslationLangState[]
  tags: { id: number; code: string; name: string }[]
  is_active: boolean
  content_version_id: number | null
  release_stage: ReleaseStage | null
  version_semver: string | null
  image: string | null
  open_feedback_count: number
  world: { id: number; name: string } | null
}

export function avatarUrl(username: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}&radius=50&size=32`
}

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

// Editorial transition map — aligned with shared/editorial/transitions.ts
export const EDITORIAL_TRANSITIONS: Record<EditorialStatus, EditorialStatus[]> = {
  draft: ['pending_review', 'archived'],
  pending_review: ['review', 'changes_requested'],
  review: ['approved', 'changes_requested'],
  changes_requested: ['draft'],
  translation_review: ['approved', 'changes_requested'],
  approved: ['published', 'rejected'],
  rejected: ['draft'],
  published: ['archived'],
  archived: [],
}

export function computeEditorial(status: EditorialStatus, translations: TranslationLangState[], opts?: { hasImage?: boolean; hasEffects?: boolean; openFeedback?: number }): EditorialMetadata {
  const allowed = EDITORIAL_TRANSITIONS[status] ?? []
  const hasAtLeastOneTranslation = translations.some(t => t.has_translation && !t.is_fallback)
  const allTranslated = translations.every(t => t.has_translation && !t.is_fallback)
  const blockingReasons: string[] = []
  if (!hasAtLeastOneTranslation) blockingReasons.push('No translations defined')
  else if (!allTranslated) {
    const missing = translations.filter(t => !t.has_translation || t.is_fallback).map(t => t.lang.toUpperCase())
    blockingReasons.push(`Missing translations: ${missing.join(', ')}`)
  }
  if (opts?.hasImage === false) blockingReasons.push('No image assigned')
  if (opts?.hasEffects === false) blockingReasons.push('No effects defined')
  if ((opts?.openFeedback ?? 0) > 0) blockingReasons.push(`${opts!.openFeedback} unresolved feedback`)
  if (status === 'draft') blockingReasons.push('Entity is still in draft')
  return {
    status,
    allowedTransitions: allowed,
    publishReady: blockingReasons.length === 0 && (status === 'approved'),
    blockingReasons,
  }
}

// Release stage visual helpers
export function releaseStageColor(stage: ReleaseStage | null): string {
  const map: Record<ReleaseStage, string> = {
    dev: 'neutral',
    alfa: 'warning',
    beta: 'primary',
    candidate: 'success',
    release: 'success',
    revision: 'primary',
  }
  return map[stage ?? 'dev'] ?? 'neutral'
}

export function releaseStageLabel(stage: ReleaseStage | null): string {
  const map: Record<ReleaseStage, string> = {
    dev: 'Dev',
    alfa: 'Alfa',
    beta: 'Beta',
    candidate: 'RC',
    release: 'Release',
    revision: 'Revision',
  }
  return map[stage ?? 'dev'] ?? 'Dev'
}

export function releaseStageDot(stage: ReleaseStage | null): string {
  const map: Record<ReleaseStage, string> = {
    dev: 'bg-neutral-400',
    alfa: 'bg-amber-400',
    beta: 'bg-indigo-400',
    candidate: 'bg-emerald-400',
    release: 'bg-emerald-500',
    revision: 'bg-blue-400',
  }
  return map[stage ?? 'dev'] ?? 'bg-neutral-400'
}

export function translationStatusDot(status: EditorialStatus | null): { dot: string; label: string } {
  if (!status) return { dot: 'bg-red-500', label: 'Missing' }
  if (status === 'published' || status === 'approved') return { dot: 'bg-emerald-500', label: status }
  if (status === 'draft' || status === 'changes_requested') return { dot: 'bg-amber-400', label: status }
  if (status === 'review' || status === 'pending_review' || status === 'translation_review') return { dot: 'bg-amber-400', label: status }
  return { dot: 'bg-neutral-400', label: status }
}

const NAMES = [
  'The Fool', 'The Magician', 'The High Priestess', 'The Empress',
  'The Emperor', 'The Hierophant', 'The Lovers', 'The Chariot',
  'Strength', 'The Hermit',
]

const CODES = [
  'fool', 'magician', 'high_priestess', 'empress',
  'emperor', 'hierophant', 'lovers', 'chariot',
  'strength', 'hermit',
]

const STATUSES: EditorialStatus[] = [
  'draft', 'draft', 'pending_review', 'review',
  'changes_requested', 'translation_review', 'approved', 'published',
  'rejected', 'archived',
]

const ENTITY_TYPES = [
  'base_card', 'base_card', 'arcana', 'facet',
  'world', 'base_card', 'skill', 'base_card',
  'base_card_type', 'world_card',
]

const EDITORS = [
  'alice', 'bob', 'carol', 'dave', 'eve',
  'frank', 'grace', 'heidi', 'ivan', 'judy',
]

const TAGS_POOL = [
  { id: 1, code: 'major', name: 'Major Arcana' },
  { id: 2, code: 'minor', name: 'Minor Arcana' },
  { id: 3, code: 'fire', name: 'Fire' },
  { id: 4, code: 'water', name: 'Water' },
  { id: 5, code: 'earth', name: 'Earth' },
]

const WORLDS = [
  { id: 1, name: 'Ethereal Realm' },
  { id: 2, name: 'Shadow Domain' },
  { id: 3, name: 'Crystal Wastes' },
]

function randomDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo))
  return d.toISOString()
}

const RELEASE_STAGES: ReleaseStage[] = ['dev', 'dev', 'alfa', 'beta', 'beta', 'candidate', 'release', 'release', 'revision', 'dev']

const TRANSLATION_STATUSES: (EditorialStatus | null)[] = ['published', 'approved', 'draft', 'review', null, 'changes_requested', 'published', 'draft', null, 'approved']

function buildTranslations(status: EditorialStatus, index: number): TranslationLangState[] {
  const hasEn = true
  const hasFr = index % 3 !== 0
  const hasEs = index % 4 !== 0
  const frStatus: EditorialStatus | null = hasFr ? (TRANSLATION_STATUSES[(index + 1) % TRANSLATION_STATUSES.length] ?? 'draft') : null
  const esStatus: EditorialStatus | null = hasEs ? (TRANSLATION_STATUSES[(index + 2) % TRANSLATION_STATUSES.length] ?? 'draft') : null
  return [
    { lang: 'en', has_translation: hasEn, is_fallback: false, status: status, updated_by: EDITORS[index % EDITORS.length] ?? 'alice', updated_at: randomDate(3) },
    { lang: 'fr', has_translation: hasFr, is_fallback: !hasFr, status: frStatus, updated_by: hasFr ? (EDITORS[(index + 1) % EDITORS.length] ?? 'bob') : null, updated_at: hasFr ? randomDate(7) : null },
    { lang: 'es', has_translation: hasEs, is_fallback: !hasEs, status: esStatus, updated_by: hasEs ? (EDITORS[(index + 2) % EDITORS.length] ?? 'carol') : null, updated_at: hasEs ? randomDate(10) : null },
  ]
}

export function generateMockEntities(count = 10): MockEntity[] {
  return Array.from({ length: count }, (_, i) => {
    const status = STATUSES[i % STATUSES.length] ?? 'draft' as EditorialStatus
    const entityType = ENTITY_TYPES[i % ENTITY_TYPES.length] ?? 'base_card'
    const translations = buildTranslations(status, i)
    const hasImage = i % 3 !== 2
    const hasEffects = i % 4 !== 3
    const openFeedback = i % 5 === 1 ? 2 : i % 7 === 0 ? 1 : 0
    const editorial = computeEditorial(status, translations, { hasImage, hasEffects, openFeedback })
    const contentVersionId = 10 + i
    const releaseStage = RELEASE_STAGES[i % RELEASE_STAGES.length] ?? 'dev' as ReleaseStage
    const major = Math.floor(i / 4) + 1
    const minor = i % 4
    return {
      id: i + 1,
      code: CODES[i % CODES.length] ?? 'unknown',
      name: NAMES[i % NAMES.length] ?? 'Unknown',
      status,
      entity_type: entityType,
      created_at: randomDate(60),
      modified_at: randomDate(10),
      updated_by: EDITORS[i % EDITORS.length] ?? 'alice',
      created_by: EDITORS[(i + 2) % EDITORS.length] ?? 'carol',
      editorial_state: {
        status,
        updated_by: EDITORS[i % EDITORS.length] ?? 'alice',
        updated_at: randomDate(5),
        content_version_id: contentVersionId,
      },
      editorial,
      translations,
      tags: TAGS_POOL.slice(0, (i % 3) + 1),
      is_active: i % 5 !== 0,
      content_version_id: contentVersionId,
      release_stage: releaseStage,
      version_semver: `${major}.${minor}.0`,
      image: hasImage ? `https://picsum.photos/seed/${CODES[i % CODES.length]}${i}/400/700` : null,
      open_feedback_count: openFeedback,
      world: (entityType === 'world_card' || entityType === 'base_card') && i % 3 !== 0 ? (WORLDS[i % WORLDS.length] ?? WORLDS[0]!) : null,
    }
  })
}

// Status color/variant resolver (mirrors app/utils/badges.ts STATUS_MAP)
export function editorialStatusMeta(status: EditorialStatus | string | null): {
  color: 'neutral' | 'warning' | 'primary' | 'success' | 'error'
  variant: 'soft' | 'subtle' | 'outline'
  icon: string
  label: string
} {
  type StatusColor = 'neutral' | 'warning' | 'primary' | 'success' | 'error'
  type StatusVariant = 'soft' | 'subtle' | 'outline'
  const map: Record<string, { color: StatusColor; variant: StatusVariant; icon: string; label: string }> = {
    draft: { color: 'neutral', variant: 'subtle', icon: 'i-lucide-pencil', label: 'Draft' },
    pending_review: { color: 'warning', variant: 'soft', icon: 'i-lucide-clock', label: 'Pending Review' },
    review: { color: 'warning', variant: 'soft', icon: 'i-lucide-eye', label: 'Review' },
    changes_requested: { color: 'error', variant: 'soft', icon: 'i-lucide-message-circle-warning', label: 'Changes Requested' },
    translation_review: { color: 'warning', variant: 'soft', icon: 'i-lucide-languages', label: 'Translation Review' },
    approved: { color: 'primary', variant: 'soft', icon: 'i-lucide-check-circle', label: 'Approved' },
    published: { color: 'success', variant: 'soft', icon: 'i-lucide-megaphone', label: 'Published' },
    rejected: { color: 'error', variant: 'soft', icon: 'i-lucide-x-circle', label: 'Rejected' },
    archived: { color: 'neutral', variant: 'outline', icon: 'i-lucide-archive', label: 'Archived' },
  }
  return map[status ?? ''] ?? { color: 'neutral', variant: 'subtle', icon: 'i-lucide-help-circle', label: status ?? 'Unknown' }
}

export function translationCoverage(translations: TranslationLangState[]): { done: number; total: number; label: string; missing: string[]; details: { lang: string; status: EditorialStatus | null; complete: boolean }[] } {
  const total = translations.length
  const done = translations.filter(t => t.has_translation && !t.is_fallback).length
  const missing = translations.filter(t => !t.has_translation || t.is_fallback).map(t => t.lang.toUpperCase())
  const details = translations.map(t => ({
    lang: t.lang,
    status: t.status,
    complete: t.has_translation && !t.is_fallback,
  }))
  return { done, total, label: `${done}/${total}`, missing, details }
}
