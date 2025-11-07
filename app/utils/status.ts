// /app/utils/status.ts
import type { CoreCardStatus } from '@/types/entities'

type StatusMeta = { labelKey: string; color: 'neutral'|'primary'|'warning'|'success'|'error'; variant: 'subtle'|'soft'|'outline' }

const MAP: Record<CoreCardStatus, StatusMeta> = {
  draft: { labelKey: 'status.draft', color: 'neutral', variant: 'subtle' },
  review: { labelKey: 'status.review', color: 'warning', variant: 'soft' },
  pending_review: { labelKey: 'status.pending_review', color: 'warning', variant: 'soft' },
  changes_requested: { labelKey: 'status.changes_requested', color: 'warning', variant: 'outline' },
  translation_review: { labelKey: 'status.translation_review', color: 'warning', variant: 'soft' },
  approved: { labelKey: 'status.approved', color: 'primary', variant: 'soft' },
  published: { labelKey: 'status.published', color: 'success', variant: 'soft' },
  rejected: { labelKey: 'status.rejected', color: 'error', variant: 'soft' },
  archived: { labelKey: 'status.archived', color: 'neutral', variant: 'outline' },
}

export function useCardStatus() {
  const all = Object.keys(MAP) as CoreCardStatus[]
  const meta = (s?: CoreCardStatus) => (s ? MAP[s] : MAP.draft)
  const options = () => all.map((s) => ({ value: s, ...MAP[s] }))
  const labelKey = (s?: CoreCardStatus) => meta(s).labelKey
  const color = (s?: CoreCardStatus) => meta(s).color
  const variant = (s?: CoreCardStatus) => meta(s).variant
  return { options, labelKey, color, variant }
}
