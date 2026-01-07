// server/tasks/db/cleanup.ts
import { defineNitroTask } from 'nitro/runtime'

export default defineNitroTask({
  async run({ payload, context }) {
    console.log('[Task] Starting DB cleanup...', payload)
    
    // Aquí iría la lógica de limpieza de sesiones expiradas, logs viejos, etc.
    // Nitro Tasks permiten ejecutar esto sin bloquear el hilo principal de la API.
    
    return { result: 'success' }
  }
})
