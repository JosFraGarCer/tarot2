// server/plugins/auth.ts
import bcrypt from 'bcrypt'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { getCookie, getHeader, createError, type H3Event } from 'h3'

const SALT_ROUNDS = 10

// -------------------- PASSWORD HELPERS --------------------
export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

// -------------------- JWT HELPERS --------------------
function secretKey() {
  const secret = process.env.JWT_SECRET
  if (!secret)
    throw createError({ statusCode: 500, statusMessage: 'JWT secret not configured' })
  return new TextEncoder().encode(secret)
}

export async function createToken(payload: Record<string, unknown>) {
  const expiresEnv = process.env.JWT_EXPIRES_IN || '1d'

  // Convertimos expresiones tipo "1d", "2h", "30m" → segundos
  const parseExpiresIn = (val: string): number => {
    const match = val.match(/^(\d+)([smhd])$/)
    if (!match) {
      const n = parseInt(val, 10)
      if (!isNaN(n)) return n
      throw new Error(`Invalid JWT_EXPIRES_IN format: ${val}`)
    }
    const n = parseInt(match[1], 10)
    const unit = match[2]
    const mult = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1
    return n * mult
  }

  const expiresInSeconds = parseExpiresIn(expiresEnv)
  const expUnix = Math.floor(Date.now() / 1000) + expiresInSeconds

  return await new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expUnix)
    .sign(secretKey())
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ['HS256'],
    })
    return payload
  } catch (err) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token',
    })
  }
}

// -------------------- USER EXTRACTION --------------------
export async function getUserFromEvent(event: H3Event) {
  const authHeader = getHeader(event, 'authorization')
  const cookieToken = getCookie(event, 'auth_token') || getCookie(event, 'token')

  let token: string | null = null
  if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7)
  if (!token && cookieToken) token = cookieToken

  if (!token)
    throw createError({ statusCode: 401, statusMessage: 'Missing authentication token' })

  const payload = await verifyToken(token)
  if (!payload || typeof payload !== 'object')
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = payload['id']
  const email = payload['email']
  const username = payload['username']

  if (typeof id !== 'number' || typeof email !== 'string' || typeof username !== 'string') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid token payload',
    })
  }

  const user = await globalThis.db
    .selectFrom('users')
    .select(['id', 'email', 'username', 'image', 'status', 'created_at'])
    .where('id', '=', id)
    .executeTakeFirst()

  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'User not found or inactive' })

  if (user.status !== 'active')
    throw createError({ statusCode: 403, statusMessage: 'User inactive' })

  return user
}

export default defineNitroPlugin(() => {})
