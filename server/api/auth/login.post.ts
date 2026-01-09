// server/api/auth/login.post.ts
import { defineEventHandler, setCookie, readBody, createError } from 'h3'
import { userLoginSchema } from '@shared/schemas/user'
import type { RoleBase } from '@shared/schemas/role'
import bcrypt from 'bcrypt'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { createToken } from '../../plugins/auth'
import { mergePermissions } from '../../utils/users'
import { sql } from 'kysely'
import { enforceRateLimit } from '../../utils/rateLimit'

interface RolesQueryResult {
  roles: RoleBase[] | string | null
}

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  let attemptedIdentifier: string | undefined

  try {
    // Fallback limiter in case middleware chain is bypassed (e.g. unit tests)
    enforceRateLimit(event, {
      scope: 'auth.login.rate_limit',
      identifier: `${event.node.req.method}:auth.login`,
      max: 10,
      windowMs: 60_000,
    })

    const raw = await readBody(event)
    const body = safeParseOrThrow(userLoginSchema, raw)
    const { identifier, password } = body
    attemptedIdentifier = identifier

    // Buscar usuario por email o username (solo activos)
    const user = await globalThis.db
      .selectFrom('users')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb('email', '=', identifier),
          eb('username', '=', identifier),
        ]),
      )
      .where('status', '=', sql`'active'`)
      .executeTakeFirst()

    if (!user)
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok)
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

    // Roles
    const rolesRow = await globalThis.db
      .selectFrom('user_roles as ur')
      .leftJoin('roles as r', 'r.id', 'ur.role_id')
      .select(
        sql`coalesce(json_agg(r.*) filter (where r.id is not null), '[]'::json)`.as('roles'),
      )
      .where('ur.user_id', '=', user.id)
      .executeTakeFirst()

    const rolesArr: RoleBase[] = (() => {
      const rolesVal = (rolesRow as RolesQueryResult)?.roles
      if (Array.isArray(rolesVal)) return rolesVal
      try {
        return JSON.parse(rolesVal as string)
      } catch {
        return []
      }
    })()

    const permissions = mergePermissions(rolesArr)

    const token = await createToken({
      id: user.id,
      email: user.email,
      username: user.username,
    })

    // Cookie segura
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    })

    const ip =
      (event.node.req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ||
      event.node.req.socket?.remoteAddress ||
      null

    globalThis.logger?.info('User login', {
      id: user.id,
      identifier,
      ip,
      timeMs: Date.now() - startedAt,
    })

    return createResponse(
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          image: user.image,
          status: user.status,
          created_at: user.created_at,
          modified_at: user.modified_at,
          roles: rolesArr,
          permissions,
        },
      },
      null,
    )
  } catch (error) {
    globalThis.logger?.warn('Login failed', {
      identifier: attemptedIdentifier,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
