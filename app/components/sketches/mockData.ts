// app/components/sketches/mockData.ts
// Shared mock data for sketch POCs.
// Mirrors the real API shape (editorial_state, translation_state, status, etc.)
// so sketches can be connected to useEntity.ts with minimal changes.

export type EditorialStatus = 'draft' | 'pending_review' | 'review' | 'translation_review' | 'approved' | 'published' | 'rejected' | 'archived'

export interface EditorialState {
  status: EditorialStatus
  updated_by: string | null
  updated_at: string | null
}

export interface TranslationLangState {
  lang: string
  has_translation: boolean
  is_fallback: boolean
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
  editorial_state: EditorialState | null
  editorial: EditorialMetadata | null
  translations: TranslationLangState[]
  tags: { id: number; code: string; name: string }[]
  is_active: boolean
}

// Editorial transition map (simplified state machine)
export const EDITORIAL_TRANSITIONS: Record<EditorialStatus, EditorialStatus[]> = {
  draft: ['pending_review'],
  pending_review: ['review', 'draft'],
  review: ['translation_review', 'approved', 'rejected', 'draft'],
  translation_review: ['approved', 'review'],
  approved: ['published', 'review'],
  published: ['archived'],
  rejected: ['draft'],
  archived: ['draft'],
}

export function computeEditorial(status: EditorialStatus, translations: TranslationLangState[]): EditorialMetadata {
  const allowed = EDITORIAL_TRANSITIONS[status] ?? []
  const allTranslated = translations.every(t => t.has_translation && !t.is_fallback)
  const blockingReasons: string[] = []
  if (!allTranslated) blockingReasons.push('Missing translations for some languages')
  if (status === 'draft') blockingReasons.push('Entity is still in draft')
  return {
    status,
    allowedTransitions: allowed,
    publishReady: blockingReasons.length === 0 && (status === 'approved'),
    blockingReasons,
  }
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
  'translation_review', 'approved', 'published', 'published',
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

function randomDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo))
  return d.toISOString()
}

function buildTranslations(status: EditorialStatus, index: number): TranslationLangState[] {
  const hasEn = true
  // Vary FR/ES coverage based on index
  const hasFr = index % 3 !== 0
  const hasEs = index % 4 !== 0
  return [
    { lang: 'en', has_translation: hasEn, is_fallback: false },
    { lang: 'fr', has_translation: hasFr, is_fallback: !hasFr },
    { lang: 'es', has_translation: hasEs, is_fallback: !hasEs },
  ]
}

export function generateMockEntities(count = 10): MockEntity[] {
  return Array.from({ length: count }, (_, i) => {
    const status = STATUSES[i % STATUSES.length]
    const translations = buildTranslations(status, i)
    const editorial = computeEditorial(status, translations)
    return {
      id: i + 1,
      code: CODES[i % CODES.length],
      name: NAMES[i % NAMES.length],
      status,
      entity_type: ENTITY_TYPES[i % ENTITY_TYPES.length],
      created_at: randomDate(60),
      modified_at: randomDate(10),
      updated_by: EDITORS[i % EDITORS.length],
      editorial_state: {
        status,
        updated_by: EDITORS[i % EDITORS.length],
        updated_at: randomDate(5),
      },
      editorial,
      translations,
      tags: TAGS_POOL.slice(0, (i % 3) + 1),
      is_active: i % 5 !== 0,
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
    translation_review: { color: 'warning', variant: 'soft', icon: 'i-lucide-languages', label: 'Translation Review' },
    approved: { color: 'primary', variant: 'soft', icon: 'i-lucide-check-circle', label: 'Approved' },
    published: { color: 'success', variant: 'soft', icon: 'i-lucide-megaphone', label: 'Published' },
    rejected: { color: 'error', variant: 'soft', icon: 'i-lucide-x-circle', label: 'Rejected' },
    archived: { color: 'neutral', variant: 'outline', icon: 'i-lucide-archive', label: 'Archived' },
  }
  return map[status ?? ''] ?? { color: 'neutral', variant: 'subtle', icon: 'i-lucide-help-circle', label: status ?? 'Unknown' }
}

export function translationCoverage(translations: TranslationLangState[]): { done: number; total: number; label: string; missing: string[] } {
  const total = translations.length
  const done = translations.filter(t => t.has_translation && !t.is_fallback).length
  const missing = translations.filter(t => !t.has_translation || t.is_fallback).map(t => t.lang.toUpperCase())
  return { done, total, label: `${done}/${total}`, missing }
}
