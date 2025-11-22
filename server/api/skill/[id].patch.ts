// server/api/skill/[id].patch.ts
// PATCH: update partial fields for Base Skill entity
import { defineEventHandler, getQuery, readBody } from 'h3'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { getRequestedLanguage } from '../../utils/i18n'
import { updateBaseSkillsSchema } from '../../schemas/base-skills'
import { notFound } from '../../utils/error'
import type { CardStatus } from '../../database/types'
import { sql } from 'kysely'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = Number(event.context.params?.id)
    const lang = getRequestedLanguage(getQuery(event))
    const body = safeParseOrThrow(updateBaseSkillsSchema, await readBody(event))

    const baseUpdate: Record<string, unknown> = {}
    if (body.code !== undefined) baseUpdate.code = body.code
    if (body.facet_id !== undefined) baseUpdate.facet_id = body.facet_id
    if (body.image !== undefined) baseUpdate.image = body.image ?? null
    if (body.status !== undefined) baseUpdate.status = body.status as CardStatus
    if (body.legacy_effects !== undefined) baseUpdate.legacy_effects = body.legacy_effects
    if (body.effects !== undefined) baseUpdate.effects = body.effects ?? null

    if (Object.keys(baseUpdate).length) {
      const res = await globalThis.db
        .updateTable('base_skills')
        .set(baseUpdate)
        .where('id', '=', id)
        .returning('id')
        .executeTakeFirst()
      if (!res) notFound('Base skill not found')
    }

    if (body.name !== undefined || body.short_text !== undefined || body.description !== undefined) {
      const exists = await globalThis.db
        .selectFrom('base_skills_translations')
        .select('id')
        .where('base_skill_id', '=', id)
        .where('language_code', '=', lang)
        .executeTakeFirst()

      if (exists) {
        await globalThis.db
          .updateTable('base_skills_translations')
          .set({
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.short_text !== undefined ? { short_text: body.short_text ?? null } : {}),
            ...(body.description !== undefined ? { description: body.description ?? null } : {}),
          })
          .where('id', '=', exists.id as number)
          .execute()
      } else {
        await globalThis.db
          .insertInto('base_skills_translations')
          .values({
            base_skill_id: id,
            language_code: lang,
            name: body.name ?? '',
            short_text: body.short_text ?? null,
            description: body.description ?? null,
          })
          .execute()
      }
    }

    const row = await globalThis.db
      .selectFrom('base_skills as s')
      .leftJoin('base_skills_translations as t_req', (join) =>
        join.onRef('t_req.base_skill_id', '=', 's.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('base_skills_translations as t_en', (join) =>
        join.onRef('t_en.base_skill_id', '=', 's.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .select([
        's.id',
        's.code',
        's.facet_id',
        's.status',
        's.created_at',
        's.modified_at',
        's.legacy_effects',
        sql`coalesce(s.effects, '{}'::jsonb)`.as('effects'),
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
      ])
      .where('s.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Base skill not found')

    globalThis.logger?.info('Base skill updated', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update base skill', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
