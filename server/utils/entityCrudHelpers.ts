import type { H3Event } from 'h3'
import { createError, getQuery, readBody } from 'h3'
import { sql, type Expression, type SelectQueryBuilder } from 'kysely'
import { z } from 'zod'
import { createResponse } from './response'

export interface CrudHelperOptions {
  event: H3Event
  table: string
  idField?: string
  translationsTable?: string | false
  translationForeignKey?: string
  translationFields?: string[]
  languageKey?: string
  where?: Expression<boolean> | ((eb: any) => any)
  extraJoins?: (qb: SelectQueryBuilder<any, any, any>) => SelectQueryBuilder<any, any, any>
  userId?: number | null
}

const defaultTextColumnNames = new Set(['name', 'short_text', 'description', 'story', 'title', 'subtitle'])

async function detectTranslationsConfig(opts: CrudHelperOptions) {
  const idField = opts.idField ?? 'id'
  if (opts.translationsTable === false) {
    return { hasTranslations: false as const }
  }

  const tTable = (opts.translationsTable ?? `${opts.table}_translations`)
  const languageKey = opts.languageKey ?? 'language_code'
  const fk = opts.translationForeignKey ?? `${opts.table.replace(/s$/, '')}_id`

  // Check existence by information_schema
  try {
    const exists = await globalThis.db
      .selectFrom(sql`information_schema.tables`.as('t'))
      .select(sql`count(*)`.as('c'))
      .where(sql`t.table_schema`, '=', sql`'public'`)
      .where(sql`t.table_name`, '=', tTable)
      .executeTakeFirst()
    const has = !!exists && Number((exists as any).c) > 0
    if (!has) return { hasTranslations: false as const }
  } catch {
    // Best-effort: assume exists; if later queries fail, caller will handle
  }

  let fields: string[] | null = null
  if (opts.translationFields && opts.translationFields.length > 0) {
    fields = opts.translationFields
  } else {
    try {
      const rows = await globalThis.db
        .selectFrom(sql`information_schema.columns`.as('c'))
        .select(['c.column_name as column_name', 'c.data_type as data_type'])
        .where(sql`c.table_schema`, '=', sql`'public'`)
        .where(sql`c.table_name`, '=', tTable)
        .execute()
      const detected: string[] = []
      for (const r of rows as any[]) {
        const col = r.column_name as string
        const dt = String(r.data_type || '').toLowerCase()
        if (col === 'id' || col === languageKey || col === fk) continue
        if (dt.includes('character') || dt.includes('text')) detected.push(col)
        else if (defaultTextColumnNames.has(col)) detected.push(col)
      }
      fields = detected
    } catch {
      fields = ['name', 'short_text', 'description']
    }
  }

  return { hasTranslations: true as const, tTable, languageKey, fk, fields: fields ?? [] }
}

function parseIdsParam(q: Record<string, any> | undefined, key = 'ids'): number[] | null {
  if (!q) return null
  const raw = (q as any)[key]
  if (raw == null) return null
  if (Array.isArray(raw)) {
    const arr = raw.flatMap((v) => Number(v)).filter((n) => Number.isFinite(n))
    return arr.length ? arr : null
  }
  const s = String(raw).trim()
  if (!s) return null
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s)
      if (Array.isArray(arr)) {
        const nums = arr.map((v) => Number(v)).filter((n) => Number.isFinite(n))
        return nums.length ? nums : null
      }
    } catch {}
  }
  const parts = s.split(',').map((v) => Number(v)).filter((n) => Number.isFinite(n))
  return parts.length ? parts : null
}

export async function exportEntities(opts: CrudHelperOptions) {
  const startedAt = Date.now()
  const { event, table } = opts
  try {
    const q = getQuery(event)
    const idField = opts.idField ?? 'id'
    const where = opts.where
    const ids = parseIdsParam(q, 'ids')

    const tr = await detectTranslationsConfig(opts)

    let baseQ = globalThis.db.selectFrom(sql`${sql.ref(table)} as t`).selectAll('t')
    if (typeof where === 'function') baseQ = baseQ.where((eb) => where(eb))
    else if (where) baseQ = baseQ.where(where)
    if (ids && ids.length) baseQ = baseQ.where(sql`t.${sql.ref(idField)}`, 'in', ids)

    const baseRows = await baseQ.execute()

    const translationsByEntity: Record<string | number, Record<string, any>> = {}
    if (tr.hasTranslations) {
      const entityIds = baseRows.map((r: any) => r[idField]).filter((v) => v != null)
      if (entityIds.length) {
        const rows = await globalThis.db
          .selectFrom(sql`${sql.ref(tr.tTable!)} as tt`)
          .selectAll('tt')
          .where(sql`tt.${sql.ref(tr.fk!)}`, 'in', entityIds)
          .execute()
        for (const r of rows as any[]) {
          const eid = r[tr.fk!]
          const lang = r[tr.languageKey!]
          translationsByEntity[eid] ||= {}
          const pack: Record<string, any> = {}
          for (const f of tr.fields!) {
            if (f in r) pack[f] = r[f]
          }
          translationsByEntity[eid][lang] = pack
        }
      }
    }

    const payload = (baseRows as any[]).map((row) => {
      const out: any = { ...row }
      if (tr.hasTranslations) {
        out.translations = translationsByEntity[(row as any)[idField]] ?? {}
      }
      return out
    })

    const data = { [table]: payload }
    globalThis.logger?.info('Export entities', { table, count: payload.length, timeMs: Date.now() - startedAt })
    return createResponse(data, null)
  } catch (error) {
    globalThis.logger?.error('Export entities failed', { table: opts.table, error: String(error) })
    throw error
  }
}

const importSchema = z.object({}).passthrough()

export async function importEntities(opts: CrudHelperOptions) {
  const startedAt = Date.now()
  const { event, table } = opts
  try {
    const body = await readBody(event)
    if (!body || typeof body !== 'object' || !(table in body)) {
      throw createError({ statusCode: 400, statusMessage: `Body must be { "${table}": [...] }` })
    }
    const items = body[table]
    if (!Array.isArray(items)) throw createError({ statusCode: 400, statusMessage: `${table} must be an array` })

    // Validate shapes loosely with Zod passthrough
    const parsed = z.array(importSchema).parse(items)

    const idField = opts.idField ?? 'id'
    const tr = await detectTranslationsConfig(opts)

    let created = 0
    let updated = 0
    const errors: Array<{ index: number; message: string }> = []

    await globalThis.db.transaction().execute(async (trx) => {
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i] as any
        try {
          // Separate base and translations
          const translations = tr.hasTranslations ? (item.translations ?? {}) : null
          const base: Record<string, any> = { ...item }
          if (tr.hasTranslations) delete (base as any).translations

          // Determine existing row
          let entityId: number | null = null
          if (item[idField] != null) {
            const ex = await trx.selectFrom(sql`${sql.ref(table)}`).select([sql`${sql.ref(idField)} as id`]).where(sql`${sql.ref(idField)}`, '=', item[idField]).executeTakeFirst()
            if (ex) entityId = Number((ex as any).id)
          }
          if (entityId == null && 'code' in item) {
            try {
              const ex2 = await trx
                .selectFrom(sql`${sql.ref(table)} as t`)
                .select([sql`t.${sql.ref(idField)} as id`])
                .where(sql`t.code`, '=', item.code)
                .executeTakeFirst()
              if (ex2) entityId = Number((ex2 as any).id)
            } catch { /* code column might not exist */ }
          }

          // Remove immutable fields
          delete base[idField]
          delete base.created_at
          delete base.modified_at

          if (opts.userId != null) base.updated_by = opts.userId

          if (entityId == null) {
            if (opts.userId != null && !('created_by' in base)) base.created_by = opts.userId
            const ins = await trx.insertInto(sql`${sql.ref(table)}`).values(base).returning(sql`${sql.ref(idField)} as id`).executeTakeFirst()
            entityId = Number((ins as any).id)
            created++
          } else {
            await trx.updateTable(sql`${sql.ref(table)}`).set(base).where(sql`${sql.ref(idField)}`, '=', entityId).execute()
            updated++
          }

          if (tr.hasTranslations && translations && entityId != null) {
            const langs = Object.keys(translations)
            for (const lang of langs) {
              const tvaluesFull = translations[lang] || {}
              const tvalues: Record<string, any> = {}
              for (const f of tr.fields!) {
                if (f in tvaluesFull) tvalues[f] = tvaluesFull[f]
              }
              const exists = await trx
                .selectFrom(sql`${sql.ref(tr.tTable!)} as tt`)
                .select([sql`tt.id as id`])
                .where(sql`tt.${sql.ref(tr.fk!)}`, '=', entityId)
                .where(sql`tt.${sql.ref(tr.languageKey!)}`, '=', lang)
                .executeTakeFirst()
              if (exists) {
                await trx
                  .updateTable(sql`${sql.ref(tr.tTable!)}`)
                  .set(tvalues)
                  .where('id', '=', (exists as any).id)
                  .execute()
              } else {
                await trx
                  .insertInto(sql`${sql.ref(tr.tTable!)}`)
                  .values({
                    [tr.fk!]: entityId,
                    [tr.languageKey!]: lang,
                    ...tvalues,
                  })
                  .execute()
              }
            }
          }
        } catch (e: any) {
          errors.push({ index: i, message: e?.message ?? String(e) })
        }
      }
    })

    const data = { created, updated, errors }
    globalThis.logger?.info('Import entities', { table, created, updated, errors: errors.length, timeMs: Date.now() - startedAt })
    return createResponse(data, null)
  } catch (error) {
    globalThis.logger?.error('Import entities failed', { table: opts.table, error: String(error) })
    throw error
  }
}

export async function batchUpdateEntities(opts: CrudHelperOptions) {
  const startedAt = Date.now()
  const { event, table } = opts
  const idField = opts.idField ?? 'id'
  try {
    const body = await readBody(event)
    const schema = z.object({
      ids: z.array(z.coerce.number().int()).min(1),
    }).passthrough()
    const parsed = schema.parse(body)

    const ids: number[] = parsed.ids
    const patch: Record<string, any> = { ...parsed }
    delete patch.ids

    if (Object.keys(patch).length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
    }

    if (opts.userId != null) patch.updated_by = opts.userId

    const res = await globalThis.db
      .updateTable(sql`${sql.ref(table)}`)
      .set(patch)
      .where(sql`${sql.ref(idField)}`, 'in', ids)
      .execute()

    const updated = Array.isArray(res) ? res.length : 0
    globalThis.logger?.info('Batch update entities', { table, updated, timeMs: Date.now() - startedAt })
    return createResponse({ updated }, null)
  } catch (error) {
    globalThis.logger?.error('Batch update failed', { table: opts.table, error: String(error) })
    throw error
  }
}
