// server/utils/i18n.ts
import type { DB } from '../database/types'

export type I18nEntityKey =
  | 'arcana'
  | 'base_card'
  | 'base_card_type'
  | 'base_skills'
  | 'facet'
  | 'world'
  | 'world_card'

const TRANSLATION_MAP: Record<
  I18nEntityKey,
  { table: keyof DB; fk: string }
> = {
  arcana: { table: 'arcana_translations', fk: 'arcana_id' },
  base_card: { table: 'base_card_translations', fk: 'card_id' },
  base_card_type: { table: 'base_card_type_translations', fk: 'card_type_id' },
  base_skills: { table: 'base_skills_translations', fk: 'base_skill_id' },
  facet: { table: 'facet_translations', fk: 'facet_id' },
  world: { table: 'world_translations', fk: 'world_id' },
  world_card: { table: 'world_card_translations', fk: 'card_id' },
}

export function getRequestedLanguage(query: Record<string, unknown> | undefined): string {
  const lang = typeof query?.lang === 'string' ? query!.lang : undefined
  const language = typeof query?.language === 'string' ? query!.language : undefined
  const locale = typeof query?.locale === 'string' ? query!.locale : undefined
  return (lang || language || locale || 'en').toLowerCase()
}

export async function getLanguageWithFallback<T extends {
  id: number
  language_code?: string | null
  name?: string | null
  short_text?: string | null
  description?: string | null
}>(rows: T[], entity: I18nEntityKey, language: string): Promise<T[]> {
  if (!rows.length) return rows
  const missing = rows.filter((r) => !r.language_code)
  if (!missing.length || language === 'en') return rows

  const ids = missing.map((r) => r.id)
  const { table, fk } = TRANSLATION_MAP[entity]

  const fallbacks = await globalThis.db
    .selectFrom(table as any)
    .select([fk as any, 'language_code', 'name', 'short_text', 'description'])
    .where(fk as any, 'in', ids)
    .where('language_code', '=', 'en')
    .execute()

  const byId = new Map<number, unknown>()
  for (const t of fallbacks) {
    const key = (t as Record<string, unknown>)[fk] as number
    byId.set(key, t)
  }

  return rows.map((r) => {
    if (r.language_code) return r
    const t = byId.get(r.id) as
      | (Record<string, unknown> & {
          language_code?: string | null
          name?: string | null
          short_text?: string | null
          description?: string | null
        })
      | undefined
    if (!t) return r
    return {
      ...r,
      name: (t.name as string | null | undefined) ?? r.name,
      short_text: (t.short_text as string | null | undefined) ?? r.short_text,
      description: (t.description as string | null | undefined) ?? r.description,
      language_code: (t.language_code as string | null | undefined) ?? 'en',
    }
  })
}
