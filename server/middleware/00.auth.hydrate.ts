// server/middleware/00.auth.hydrate.ts
// /server/middleware/00.auth.hydrate.ts
import { defineEventHandler } from 'h3'
import { sql } from 'kysely'
import { verifyToken } from '../plugins/auth'
import { mergePermissions } from '../utils/users'

export default defineEventHandler(async (event) => {
  try {
    const token = event.node.req.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('auth_token='))
      ?.split('=')[1]

    if (!token) return

    const userPayload = await verifyToken(token)
    const userId = Number(userPayload?.id)
    if (!userId || isNaN(userId)) return

    // OPTIMIZACIÓN: Query ligera solo para validar estado activo
    // Los roles completos no se cargan en cada request para evitar sobrecarga
    const user = await globalThis.db
      .selectFrom('users')
      .select(['id', 'username', 'email', 'status', 'image', 'created_at', 'modified_at'])
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user || user.status === 'suspended') return

    // Mantenemos la estructura pero con roles vacíos por defecto en middleware
    // Si un endpoint necesita roles, debe consultarlos explícitamente
    const permissions: string[] = [] 
    
    event.context.user = { 
      ...user, 
      roles: [], // Se evita el join masivo
      permissions 
    }
  } catch (err) {
    console.warn('[auth.hydrate] Failed to decode user:', err)
  }
})
