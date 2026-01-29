// server/utils/i18n.ts
import { sql, type SelectQueryBuilder, type RawBuilder } from 'kysely'
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
  return (lang || 'en').toLowerCase()
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

  // Safe access to global db instance with proper typing
  const db = (globalThis as unknown as { db: Kysely<DB> }).db
  if (!db) return rows

  // Type-safe query construction using Kysely's dynamic table/column access
  const fallbacks = await db
    .selectFrom(table)
    .select([
      fk,
      'language_code',
      'name',
      'short_text',
      'description',
    ])
    .where(fk, 'in', ids)
    .where('language_code', '=', 'en')
    .execute()

  const byId = new Map<number, typeof fallbacks[0]>()
  for (const t of fallbacks) {
    byId.set(t[fk as keyof typeof t] as number, t)
  }

  return rows.map((r) => {
    if (r.language_code) return r
    const t = byId.get(r.id)
    if (!t) return r
    return {
      ...r,
      name: t.name ?? r.name,
      short_text: t.short_text ?? r.short_text,
      description: t.description ?? r.description,
      language_code: t.language_code ?? 'en',
    }
  })
}

interface BuildTranslationSelectResult<TB extends keyof DB = keyof DB> {
  query: SelectQueryBuilder<DB, TB, Record<string, unknown>>
  selects: Array<RawBuilder<unknown>>
  tReq: string
  tEn: string
}

/**
 * Helper to build standard translation joins and coalesce selects for Kysely.
 * Reduces duplication in _crud.ts files.
 * 
 * NOTE: Kysely types don't fully support dynamic table/alias patterns.
 * The eslint-disable comments below address known type limitations.
 */
export function buildTranslationSelect<
  TB extends keyof DB,
  QB extends SelectQueryBuilder<DB, TB, Record<string, unknown>>
>(
  qb: QB,
  config: {
    baseAlias: string
    translationTable: keyof DB
    foreignKey: string
    lang: string
    fields: string[] | Record<string, string>
    aliasPrefix?: string
  }
): BuildTranslationSelectResult<TB> {
  const { baseAlias, translationTable, foreignKey, lang, fields, aliasPrefix = '' } = config
  const tableStr = String(translationTable)
  const tReq = `t_req_${aliasPrefix || tableStr}`
  const tEn = `t_en_${aliasPrefix || tableStr}`

  // Kysely doesn't support dynamic table aliases in types - using any for join callbacks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = qb.leftJoin(`${tableStr} as ${tReq}`, (join: any) =>
    join.onRef(sql.ref(`${tReq}.${foreignKey}`), '=', sql.ref(`${baseAlias}.id`))
      .on(sql.ref(`${tReq}.language_code`), '=', lang)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).leftJoin(`${tableStr} as ${tEn}`, (join: any) =>
    join.onRef(sql.ref(`${tEn}.${foreignKey}`), '=', sql.ref(`${baseAlias}.id`))
      .on(sql.ref(`${tEn}.language_code`), '=', sql`'en'`)
  )

  const selects: Array<RawBuilder<unknown>> = []

  if (Array.isArray(fields)) {
    for (const field of fields) {
      selects.push(sql`coalesce(${sql.ref(`${tReq}.${field}`)}, ${sql.ref(`${tEn}.${field}`)})`.as(field))
    }
  } else {
    for (const [field, alias] of Object.entries(fields)) {
      selects.push(sql`coalesce(${sql.ref(`${tReq}.${field}`)}, ${sql.ref(`${tEn}.${field}`)})`.as(alias))
    }
  }
  
  // Add resolved language code if no alias prefix (usually for the main entity)
  if (!aliasPrefix) {
    selects.push(sql`coalesce(${sql.ref(`${tReq}.language_code`)}, 'en')`.as('language_code_resolved'))
  }

  return { query, selects, tReq, tEn }
}
