// server/api/auth/session.get.ts
import { defineEventHandler } from 'h3'
import { createResponse, createErrorResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (!user) {
    return createErrorResponse('No active session', 401)
  }

  // Nuxt 5 / Future: Return clean user state for hydration
  return createResponse({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      image: user.image,
      status: user.status,
      roles: user.roles || [],
      permissions: user.permissions || {}
    }
  })
})
