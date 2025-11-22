// server/api/base_skills/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { createBaseSkillsSchema } from '../../schemas/base-skills'
import type { CardStatus } from '../../database/types'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const body = safeParseOrThrow(createBaseSkillsSchema, await readBody(event))

    const inserted = await globalThis.db
      .insertInto('base_skills')
      .values({
        code: body.code,
        facet_id: body.facet_id,
        image: body.image ?? null,
        legacy_effects: body.legacy_effects ?? false,
        effects: body.effects ?? null,
        ...(body.status !== undefined ? { status: body.status as CardStatus } : {}),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await globalThis.db
      .insertInto('base_skills_translations')
      .values({
        base_skill_id: inserted.id as number,
        language_code: 'en',
        name: body.name,
        short_text: body.short_text ?? null,
        description: body.description ?? null,
      })
      .execute()

    const row = await globalThis.db
      .selectFrom('base_skills as s')
      .leftJoin('base_skills_translations as t', (join) =>
        join.onRef('t.base_skill_id', '=', 's.id').on('t.language_code', '=', 'en'),
      )
      .select([
        's.id',
        's.code',
        's.facet_id',
        's.status',
        's.legacy_effects',
        sql`coalesce(s.effects, '{}'::jsonb)`.as('effects'),
        's.created_at',
        's.modified_at',
        't.name as name',
        't.short_text as short_text',
        't.description as description',
        't.language_code as language_code',
      ])
      .where('s.id', '=', inserted.id as number)
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('Base skill created', { id: inserted.id, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create base skill', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
