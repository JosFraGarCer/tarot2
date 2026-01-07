/**
 * Utility: kind normalization for entity management
 * Purpose: Ensure consistency in entity kind identifiers across the system
 */

export const allowedSlideoverKinds = ['arcana', 'card_type', 'base_card', 'skill', 'world', 'world_card'] as const
export type SlideoverKind = typeof allowedSlideoverKinds[number]

/**
 * Normalizes an entity kind string to a valid SlideoverKind
 */
export function normalizeSlideoverKind(kind: string | null | undefined): SlideoverKind {
  const candidate = toSlideoverKind(kind)
  return (allowedSlideoverKinds as readonly string[]).includes((candidate ?? '') as SlideoverKind)
    ? (candidate as SlideoverKind)
    : 'arcana'
}

/**
 * Basic normalization of entity kind strings
 */
export function toSlideoverKind(kind: string | null | undefined): string | null {
  if (!kind) return null
  // Handle cases where kind might not be a string despite types
  const str = typeof kind === 'string' ? kind : String(kind)
  
  const normalized = str
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[-]+/g, '_')
    .toLowerCase()

  switch (normalized) {
    case 'cardtype':
    case 'card_type':
    case 'card-type':
      return 'card_type'
    case 'basecard':
    case 'base_card':
    case 'base-card':
      return 'base_card'
    case 'worldcard':
    case 'world_card':
    case 'world-card':
      return 'world_card'
    default:
      return normalized
  }
}
