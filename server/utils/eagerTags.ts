import { sql } from 'kysely'
import type { DB } from '../database/types'
import type { Kysely } from 'kysely'

export interface TagInfo {
  id: number
  name: string
  language_code_resolved: string
}

export async function fetchTagsForEntities(
  db: Kysely<DB>,
  entityType: string,
  entityIds: number[],
  lang: string
): Promise<Record<number, TagInfo[]>> {
  if (entityIds.length === 0) return {}

  const rows = await db
    .selectFrom('tag_links as tl')
    .innerJoin('tags as tg', 'tg.id', 'tl.tag_id')
    .leftJoin('tags_translations as tt_req', (join) =>
      join.onRef('tt_req.tag_id', '=', 'tg.id').on('tt_req.language_code', '=', lang)
    )
    .leftJoin('tags_translations as tt_en', (join) =>
      join.onRef('tt_en.tag_id', '=', 'tg.id').on('tt_en.language_code', '=', sql`'en'`)
    )
    .select([
      'tl.entity_id',
      'tg.id',
      sql`coalesce(tt_req.name, tt_en.name)`.as('name'),
      sql`coalesce(tt_req.language_code, 'en')`.as('language_code_resolved'),
    ])
    .where('tl.entity_type', '=', entityType)
    .where('tl.entity_id', 'in', entityIds)
    .execute()

  const map: Record<number, TagInfo[]> = {}
  
  for (const row of rows) {
    const eid = Number(row.entity_id)
    if (!map[eid]) map[eid] = []
    
    if (row.name) {
      map[eid].push({
        id: row.id,
        name: String(row.name),
        language_code_resolved: String(row.language_code_resolved),
      })
    }
  }

  return map
}
