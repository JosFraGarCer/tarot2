// server/plugins/db.ts
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { DB } from '../database/types'

declare global {
   
  var db: Kysely<DB>
}

export default defineNitroPlugin((nitroApp) => {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const pool = new Pool({ connectionString: url })
  const dialect = new PostgresDialect({ pool })
  const db = new Kysely<DB>({ dialect })

  globalThis.db = db

  nitroApp.hooks.hook('close', async () => {
    await pool.end().catch(() => {})
  })
})
