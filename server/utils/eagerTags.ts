// server/utils/eagerTags.ts
import { sql, type Kysely } from 'kysely'
import type { DB } from '../database/types'
import { buildTranslationSelect } from './i18n'

export interface TagRow {
  id: number
  name: string
  language_code_resolved: string
}

export type TagMap = Map<number, TagRow[]>

/**
 * Eager load tags for multiple entities in a single batch query.
 * Eliminates N+1 queries when loading tags for lists of entities.
 * 
 * @param db - Kysely database instance
 * @param entityIds - Array of entity IDs to load tags for
 * @param entityType - The entity_type value (e.g., 'arcana', 'base_skills', 'world_card')
 * @param lang - Requested language code
 * @returns Map of entity_id -> array of TagRow
 */
export async function eagerLoadTags(
  db: Kysely<DB>,
  entityIds: number[],
  entityType: string,
  lang: string,
): Promise<TagMap> {
  if (entityIds.length === 0) return new Map<number, TagRow[]>()

  const { query, selects } = buildTranslationSelect(
    db.selectFrom('tag_links as tl')
      .innerJoin('tags as tg', 'tg.id', 'tl.tag_id'),
    {
      baseAlias: 'tg',
      translationTable: 'tags_translations',
      foreignKey: 'tag_id',
      lang,
      fields: ['name'],
    }
  )

  const tagLinks = await query
    .select([
      'tl.entity_id',
      'tg.id',
      ...selects,
    ])
    .where('tl.entity_type', '=', entityType)
    .where('tl.entity_id', 'in', entityIds)
    .execute()

  const tagMap = new Map<number, TagRow[]>()
  for (const row of tagLinks) {
    const entityId = row.entity_id as number
    if (!tagMap.has(entityId)) {
      tagMap.set(entityId, [])
    }
    tagMap.get(entityId)!.push({
      id: row.id as number,
      name: row.name as string,
      language_code_resolved: row.language_code_resolved as string,
    })
  }
  return tagMap
}

/**
 * Apply tag filtering to a query using EXISTS subquery.
 * Supports filtering by tag IDs or tag names (case-insensitive).
 */
export function applyTagFilter(
  qb: Kysely<DB>,
  baseAlias: string,
  entityType: string,
  tagIds?: number[],
  tagNames?: string[],
  lang = 'en',
) {
  let result = qb

  if (tagIds && tagIds.length > 0) {
    result = result.where(sql`exists (
      select 1
      from tag_links tl
      where tl.entity_type = ${entityType}
        and tl.entity_id = ${baseAlias}.id
        and tl.tag_id = any(${tagIds})
    )`)
  }

  if (tagNames && tagNames.length > 0) {
    result = result.where(sql`exists (
      select 1
      from tag_links tl
      join tags t on t.id = tl.tag_id
      left join tags_translations tt_req on tt_req.tag_id = t.id and tt_req.language_code = ${lang}
      left join tags_translations tt_en on tt_en.tag_id = t.id and tt_en.language_code = 'en'
      where tl.entity_type = ${entityType}
        and tl.entity_id = ${baseAlias}.id
        and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagNames.map(t => t.toLowerCase())})
    )`)
  }

  return result
}
