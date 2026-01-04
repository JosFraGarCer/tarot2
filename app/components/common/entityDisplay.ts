// app/components/common/entityDisplay.ts
import type { FallbackStatus } from '~/utils/fallbackUtils'

export type ReleaseStage = 'dev' | 'alpha' | 'beta' | 'candidate' | 'release' | 'revision'

export type StatusCode = 'draft' | 'review' | 'approved' | 'archived' | (string & {})

export interface TagChipInput {
  label: string
  color?: string
  variant?: 'soft' | 'subtle'
  size?: 'xs' | 'sm'
  icon?: string | null
  tooltip?: boolean | string
  tooltipThreshold?: number
}

export type TagInput = string | TagChipInput

export interface NormalizedTag extends TagChipInput {
  label: string
  color: string
  variant: 'soft' | 'subtle'
  size: 'xs' | 'sm'
  icon: string | null
  tooltip?: string | boolean
  tooltipThreshold?: number
}

export interface EntityMetadataItem {
  label: string
  value: string | number | null | undefined
  icon?: string | null
  tooltip?: string | boolean
}

export interface EntityTranslationStatus {
  hasTranslation?: boolean | null
  isFallback?: boolean | null
  status?: FallbackStatus
}

export interface EntityCapabilitiesLike {
  translatable?: boolean
  hasTags?: boolean
  hasStatus?: boolean
  hasReleaseStage?: boolean
  hasPreview?: boolean
  hasLanguage?: boolean
}

export function normalizeTags(tags?: TagInput[]): NormalizedTag[] {
  if (!Array.isArray(tags)) return []
  return tags
    .map<NormalizedTag | null>((tag) => {
      if (typeof tag === 'string') {
        const trimmed = tag.trim()
        if (!trimmed) return null
        return {
          label: trimmed,
          color: 'neutral',
          variant: 'subtle',
          size: 'xs',
          icon: null,
          tooltip: undefined,
          tooltipThreshold: undefined,
        }
      }

      if (!tag?.label) return null

      return {
        label: tag.label,
        color: tag.color ?? 'neutral',
        variant: tag.variant ?? 'subtle',
        size: tag.size ?? 'xs',
        icon: tag.icon ?? null,
        tooltip: tag.tooltip,
        tooltipThreshold: tag.tooltipThreshold,
      }
    })
    .filter((tag): tag is NormalizedTag => Boolean(tag))
}

export function filterMetadata(items?: EntityMetadataItem[]): EntityMetadataItem[] {
  if (!Array.isArray(items)) return []
  return items.filter((item) => hasDisplayValue(item.value))
}

export function hasDisplayValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

export function formatMetadataValue(value: EntityMetadataItem['value'], locale?: string): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value instanceof Date) return value.toLocaleString(locale || undefined)
  if (Array.isArray(value)) return value.map((entry) => String(entry)).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function toMetadataDisplay(items: EntityMetadataItem[] | null | undefined, locale?: string) {
  return filterMetadata(items ?? []).map((item) => ({
    ...item,
    display: formatMetadataValue(item.value, locale),
  }))
}
