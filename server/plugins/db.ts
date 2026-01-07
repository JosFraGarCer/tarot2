import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { DB } from '../database/types'

declare global {
  var db: Kysely<DB>
}

declare module 'h3' {
  interface H3EventContext {
    db: Kysely<DB>
  }
}

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  const url = config.databaseUrl
  if (!url) {
    console.error('[db] DATABASE_URL is not set in runtime config')
    return
  }

  const pool = new Pool({ 
    connectionString: url,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
  
  const dialect = new PostgresDialect({ pool })
  const db = new Kysely<DB>({ dialect })

  // Inyección nativa en el contexto de Nitro
  nitroApp.hooks.hook('request', (event) => {
    event.context.db = db
  })

  // Fallback para procesos fuera de request (Tasks, Scheduled)
  globalThis.db = db

  nitroApp.hooks.hook('close', async () => {
    await pool.end().catch(() => {})
  })
})
