// server/api/auth/logout.post.ts
import { defineEventHandler, setCookie } from 'h3'
import { createResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  // 🔹 Limpia cookie de sesión
  setCookie(event, 'auth_token', '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })

  // 🔹 Respuesta estándar
  return createResponse({ success: true, message: 'Logged out successfully' }, null)
})
