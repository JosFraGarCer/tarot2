// app/utils/status.ts
// /app/utils/status.ts
// This module provides card status helpers
import type { CardStatus } from '~/../../shared/schemas/common'

type StatusMeta = { labelKey: string; color: 'neutral'|'primary'|'warning'|'success'|'error'; variant: 'subtle'|'soft'|'outline' }

const MAP: Record<CardStatus, StatusMeta> = {
  draft: { labelKey: 'system.status.draft', color: 'neutral', variant: 'subtle' },
  review: { labelKey: 'system.status.review', color: 'warning', variant: 'soft' },
  pending_review: { labelKey: 'system.status.pending_review', color: 'warning', variant: 'soft' },
  changes_requested: { labelKey: 'system.status.changes_requested', color: 'warning', variant: 'outline' },
  translation_review: { labelKey: 'system.status.translation_review', color: 'warning', variant: 'soft' },
  approved: { labelKey: 'system.status.approved', color: 'primary', variant: 'soft' },
  published: { labelKey: 'system.status.published', color: 'success', variant: 'soft' },
  rejected: { labelKey: 'system.status.rejected', color: 'error', variant: 'soft' },
  archived: { labelKey: 'system.status.archived', color: 'neutral', variant: 'outline' },
}

export function useCardStatus() {
  const all = Object.keys(MAP) as CardStatus[]
  const meta = (s?: CardStatus) => (s ? MAP[s] : MAP.draft)
  const options = () => all.map((s) => ({ value: s, ...MAP[s] }))
  const labelKey = (s?: CardStatus) => meta(s).labelKey
  const color = (s?: CardStatus) => meta(s).color
  const variant = (s?: CardStatus) => meta(s).variant
  return { options, labelKey, color, variant }
}
