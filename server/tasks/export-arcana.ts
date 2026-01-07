// server/tasks/export-arcana.ts
import { defineTask } from 'nitro/runtime'

/**
 * Nitro Task para exportación masiva de Arcana.
 * Optimizado para Nuxt 5: se ejecuta en segundo plano sin bloquear el hilo principal.
 * Utiliza el singleton global de la base de datos inyectado por el plugin.
 */
export default defineTask({
  meta: {
    name: 'arcana:export',
    description: 'Genera un volcado JSON de todas las arcanas con sus traducciones'
  },
  async run({ payload }) {
    console.info('[Task] Starting Arcana export...')
    
    try {
      // Usar globalThis.db (inyectado en server/plugins/db.ts)
      const data = await globalThis.db
        .selectFrom('arcana as a')
        .leftJoin('arcana_translations as t', 'a.id', 't.arcana_id')
        .selectAll()
        .execute()

      console.info(`[Task] Successfully exported ${data.length} records.`)
      
      return { 
        result: data,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('[Task] Arcana export failed:', error)
      throw error
    }
  }
})
