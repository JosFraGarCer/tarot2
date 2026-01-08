<template>
  <div class="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
    <div class="flex items-center gap-3">
      <div 
        class="w-3 h-3 rounded-full animate-pulse"
        :class="isDbHealthy ? 'bg-green-500' : 'bg-red-500'"
      />
      <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {{ isDbHealthy ? 'Server: Operational' : 'Server: Database Issue' }}
      </span>
    </div>
    <div class="mt-2 grid grid-cols-2 gap-4 text-xs text-neutral-500 dark:text-neutral-400">
      <div>
        <p class="font-semibold text-neutral-400 uppercase tracking-wider">Nitro Engine</p>
        <p>v3.x (h3 v2)</p>
      </div>
      <div>
        <p class="font-semibold text-neutral-400 uppercase tracking-wider">Uptime</p>
        <p>{{ uptime }}s</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Componente Island (Server Component) para Tarot2.
 * Propósito: Renderizar información técnica del servidor sin enviar JS al cliente.
 * Invariantes: Solo se ejecuta en el servidor. No tiene hidratación.
 */
import { sql } from 'kysely'
import type { Kysely } from 'kysely'

const uptime = import.meta.server ? Math.floor(process.uptime()) : 0
let isDbHealthy = false

try {
  // Verificación directa de salud de la DB usando el singleton global con cast para evitar errores de tipado en compilación
  const database = (globalThis as any).db as Kysely<any> | undefined
  if (database) {
    const result = await database.executeQuery(sql`SELECT 1`.compile(database))
    isDbHealthy = !!result
  }
} catch (e) {
  console.error('[Island] DB Health Check failed:', e)
}
</script>
