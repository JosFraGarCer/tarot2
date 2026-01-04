# 🔐 Análisis de Seguridad - Tarot2

## 1. Visión General

Tarot2 implementa un modelo de seguridad en capas que cubre:
- **Autenticación** basada en JWT con cookies HttpOnly
- **Autorización** granular basada en roles y permisos
- **Mitigación de abuso** mediante rate limiting
- **Logging** estructurado para auditoría

---

## 2. Arquitectura de Seguridad

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Cookie: auth_token (HttpOnly, Secure, SameSite=strict)       │  │
│  │  Store: useUserStore (permisos cacheados)                     │  │
│  │  Directiva: v-can (control de UI)                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MIDDLEWARE CHAIN                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ 00.auth.hydrate │─▶│ 01.auth.guard   │─▶│ 02.rate-limit   │     │
│  │                 │  │                 │  │                 │     │
│  │ • Verifica JWT  │  │ • Valida acceso │  │ • Buckets IP    │     │
│  │ • Carga usuario │  │ • Bloquea susp. │  │ • Buckets user  │     │
│  │ • Merge permisos│  │ • Check rutas   │  │ • Headers retry │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API HANDLERS                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  event.context.user = { id, roles, permissions }              │  │
│  │  Validación: Zod schemas                                      │  │
│  │  Logging: scope, userId, timeMs                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Autenticación

### 3.1 Flujo de Login

```
1. POST /api/auth/login { identifier, password }
2. Buscar usuario por email/username
3. Verificar password con bcrypt
4. Generar JWT (HS256) con payload { userId, iat, exp }
5. Establecer cookie auth_token con:
   - HttpOnly: true (no accesible desde JS)
   - Secure: true (solo HTTPS en producción)
   - SameSite: 'strict' (previene CSRF)
   - MaxAge: configurable (default 1 día)
6. Retornar { token, user } (token también en body para uso alternativo)
```

### 3.2 Configuración JWT

```typescript
// Variables de entorno
JWT_SECRET=<secreto-fuerte-256-bits>
JWT_EXPIRES_IN=1d  // Formato: 1d, 12h, 3600s

// Generación de token
const token = await new SignJWT({ userId: user.id })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime(process.env.JWT_EXPIRES_IN || '1d')
  .sign(new TextEncoder().encode(process.env.JWT_SECRET))
```

### 3.3 Flujo de Logout

```typescript
// POST /api/auth/logout
export default defineEventHandler(async (event) => {
  // Limpiar cookie con maxAge: 0
  setCookie(event, 'auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  })
  
  return createResponse(null, { message: 'Logged out' })
})
```

### 3.4 Hidratación de Usuario

```typescript
// 00.auth.hydrate.ts
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) return
  
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    )
    
    const user = await db
      .selectFrom('users')
      .where('id', '=', payload.userId as number)
      .selectAll()
      .executeTakeFirst()
    
    if (!user) return
    
    // Cargar roles y merge permisos
    const roles = await db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', '=', user.id)
      .selectAll('roles')
      .execute()
    
    event.context.user = {
      ...user,
      roles,
      permissions: mergePermissions(roles)
    }
  } catch (error) {
    // Token inválido o expirado - continuar sin usuario
    logger.debug({ scope: 'auth.hydrate', error: 'Invalid token' })
  }
})
```

---

## 4. Autorización

### 4.1 Estructura de Permisos

```typescript
interface Permissions {
  canReview: boolean         // Revisar contenido
  canPublish: boolean        // Publicar versiones
  canTranslate: boolean      // Gestionar traducciones
  canAssignTags: boolean     // Asignar tags
  canEditContent: boolean    // Editar contenido
  canManageUsers: boolean    // Gestionar usuarios/roles
  canResolveFeedback: boolean // Resolver feedback
}
```

### 4.2 Merge de Permisos

```typescript
function mergePermissions(roles: Role[]): Permissions {
  const merged: Permissions = {
    canReview: false,
    canPublish: false,
    canTranslate: false,
    canAssignTags: false,
    canEditContent: false,
    canManageUsers: false,
    canResolveFeedback: false
  }
  
  for (const role of roles) {
    const perms = role.permissions as Partial<Permissions>
    for (const key of Object.keys(merged)) {
      if (perms[key as keyof Permissions]) {
        merged[key as keyof Permissions] = true
      }
    }
  }
  
  return merged
}
```

### 4.3 Guard de Rutas

```typescript
// 01.auth.guard.ts
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  
  // Rutas públicas
  const publicRoutes = ['/api/auth/login', '/api/auth/logout']
  if (publicRoutes.includes(path)) return
  
  // Requiere autenticación
  if (!event.context.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }
  
  // Usuario suspendido
  if (event.context.user.status === 'suspended') {
    throw createError({ statusCode: 403, message: 'Account suspended' })
  }
  
  // Validación por ruta
  const { permissions } = event.context.user
  
  // Rutas de administración de usuarios
  if (path.startsWith('/api/role') || path.startsWith('/api/user')) {
    if (path !== '/api/user/me' && !permissions.canManageUsers) {
      throw createError({ statusCode: 403, message: 'Insufficient permissions' })
    }
  }
  
  // Publicación de versiones
  if (path.includes('/publish')) {
    if (!permissions.canPublish) {
      throw createError({ statusCode: 403, message: 'Publish permission required' })
    }
  }
  
  // Revert de revisiones
  if (path.includes('/revert')) {
    if (!permissions.canPublish && !permissions.canReview) {
      throw createError({ statusCode: 403, message: 'Revert permission required' })
    }
  }
})
```

### 4.4 Directiva v-can (Frontend)

```typescript
// app/directives/can.ts
export const vCan: Directive = {
  mounted(el, binding) {
    const userStore = useUserStore()
    const permission = binding.value as keyof Permissions
    const modifier = binding.modifiers
    
    if (!userStore.hasPermission(permission)) {
      if (modifier.disable) {
        el.disabled = true
        el.classList.add('opacity-50', 'cursor-not-allowed')
      } else {
        el.remove()
      }
    }
  }
}

// Uso en templates
<UButton v-can="'canPublish'">Publicar</UButton>
<UButton v-can.disable="'canManageUsers'">Gestionar Usuarios</UButton>
```

---

## 5. Rate Limiting

### 5.1 Configuración de Buckets

| Contexto | Límite | Ventana | Rutas |
|----------|--------|---------|-------|
| Global | 300 req | 5 min | `/api/*` |
| Auth | 10 req | 1 min | `/api/auth/*` |
| Editorial | 10 req | 1 min | `*/publish`, `*/revert` |
| Uploads | 20 req | 1 min | `/api/uploads` |

### 5.2 Implementación

```typescript
// 02.rate-limit.ts
const buckets = new Map<string, { count: number; resetAt: number }>()

function getLimit(path: string): { max: number; window: number } {
  if (path.includes('/auth/')) return { max: 10, window: 60 }
  if (path.includes('/publish') || path.includes('/revert')) return { max: 10, window: 60 }
  if (path.includes('/uploads')) return { max: 20, window: 60 }
  return { max: 300, window: 300 }
}

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) return
  
  const ip = getHeader(event, 'x-forwarded-for')?.split(',')[0] || 
             getClientIP(event) || 
             'unknown'
  const userId = event.context.user?.id || 'anon'
  const key = `${ip}-${userId}`
  
  const limit = getLimit(path)
  const now = Date.now()
  
  let bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + limit.window * 1000 }
  }
  
  bucket.count++
  buckets.set(key, bucket)
  
  // Headers informativos
  setHeader(event, 'X-RateLimit-Limit', limit.max)
  setHeader(event, 'X-RateLimit-Remaining', Math.max(0, limit.max - bucket.count))
  setHeader(event, 'X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000))
  
  if (bucket.count > limit.max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    setHeader(event, 'Retry-After', retryAfter)
    
    logger.warn({
      scope: 'middleware.rateLimit',
      ip,
      userId,
      path,
      rejected: true
    })
    
    throw createError({
      statusCode: 429,
      message: `Too many requests. Retry after ${retryAfter} seconds`
    })
  }
  
  logger.debug({
    scope: 'middleware.rateLimit',
    ip,
    userId,
    path,
    count: bucket.count,
    limit: limit.max
  })
})
```

### 5.3 Enforcing Adicional

```typescript
// utils/rateLimit.ts
export async function enforceRateLimit(
  event: H3Event,
  key: string,
  limit: { max: number; window: number }
): Promise<void> {
  // Lógica adicional para endpoints específicos
  // Usado en login, publish, revert, uploads
}
```

---

## 6. Validación de Datos

### 6.1 Schemas Zod

```typescript
// server/schemas/auth.ts
export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6)
})

// server/schemas/user.ts
export const userCreateSchema = z.object({
  username: z.string().min(3).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role_ids: z.array(z.number()).min(1)
})

// server/schemas/entities/world.ts
export const worldCreateSchema = z.object({
  code: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/),
  name: z.string().min(1).max(255),
  status: z.enum(['draft', 'review', 'approved', 'published']).optional(),
  description: z.string().nullable().optional()
})
```

### 6.2 Validación en Handlers

```typescript
// Uso típico
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = safeParseOrThrow(worldCreateSchema, body)
  
  // validated tiene tipos inferidos correctos
  const { code, name, status } = validated
})

// Helper de validación
export function safeParseOrThrow<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): T {
  const result = schema.safeParse(input)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: { errors: result.error.errors }
    })
  }
  
  return result.data
}
```

---

## 7. Protección de Uploads

```typescript
// server/api/uploads/index.post.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = query.type as string
  
  // Validar tipo de bucket
  const allowedTypes = ['arcana', 'worlds', 'cards', 'avatars']
  if (!allowedTypes.includes(type)) {
    throw createError({ statusCode: 400, message: 'Invalid upload type' })
  }
  
  const formData = await readFormData(event)
  const file = formData.get('file') as File
  
  // Validar presencia
  if (!file) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }
  
  // Validar tamaño (15MB max)
  if (file.size > 15 * 1024 * 1024) {
    throw createError({ statusCode: 400, message: 'File too large (max 15MB)' })
  }
  
  // Validar MIME
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  if (!allowedMimes.includes(file.type)) {
    throw createError({ statusCode: 400, message: 'Invalid file type' })
  }
  
  // Verificar contenido real (magic bytes)
  const buffer = Buffer.from(await file.arrayBuffer())
  const actualType = await fileTypeFromBuffer(buffer)
  if (!actualType || !allowedMimes.includes(actualType.mime)) {
    throw createError({ statusCode: 400, message: 'File content mismatch' })
  }
  
  // Procesar con Sharp (sanitiza y optimiza)
  const processed = await sharp(buffer)
    .rotate() // Auto-rotate según EXIF
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .avif({ quality: 80 })
    .toBuffer()
  
  // Generar nombre seguro
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.avif`
  const safePath = path.join('public/img', type, filename)
  
  // Verificar que no escapa del directorio
  if (!safePath.startsWith('public/img/')) {
    throw createError({ statusCode: 400, message: 'Invalid path' })
  }
  
  await writeFile(safePath, processed)
  
  return createResponse({ url: `/img/${type}/${filename}` })
})
```

---

## 8. Logging de Seguridad

### 8.1 Eventos Logueados

| Evento | Nivel | Datos |
|--------|-------|-------|
| Login exitoso | info | userId, ip |
| Login fallido | warn | identifier, ip, reason |
| Logout | info | userId |
| Rate limit hit | warn | ip, userId, path |
| Permiso denegado | warn | userId, path, required |
| Token inválido | debug | ip |
| Publicación | info | userId, versionId, count |
| Revert | info | userId, revisionId |

### 8.2 Formato de Log

```typescript
logger.info({
  scope: 'auth.login',
  userId: user.id,
  ip: getClientIP(event),
  timeMs: Date.now() - startTime
})

logger.warn({
  scope: 'auth.guard',
  userId: event.context.user?.id,
  path: getRequestURL(event).pathname,
  reason: 'Insufficient permissions',
  required: 'canPublish'
})
```

---

## 9. Checklist de Seguridad

### 9.1 Verificaciones Diarias

- [ ] Revisar logs de rate limit rechazados
- [ ] Verificar intentos de login fallidos
- [ ] Confirmar `auth_token` usa `Secure` en producción
- [ ] Validar que endpoints nuevos usan validación Zod

### 9.2 Verificaciones Semanales

- [ ] Auditar cambios en roles/permisos
- [ ] Revisar accesos a rutas admin
- [ ] Verificar rotación de logs

### 9.3 Pendientes de Implementación

| Tarea | Prioridad | Estado |
|-------|-----------|--------|
| Rotación automática JWT | Media | 🔄 Pendiente |
| Rate limit distribuido (Redis) | Media | 🔄 Pendiente |
| CSP headers | Baja | 🔄 Pendiente |
| 2FA opcional | Baja | 🔄 Pendiente |

---

## 10. Configuración de Producción

### 10.1 Variables de Entorno

```bash
# Obligatorias
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<min-256-bits-random>

# Opcionales
JWT_EXPIRES_IN=1d
LOG_LEVEL=info
NODE_ENV=production
```

### 10.2 Headers de Seguridad Recomendados

```typescript
// En nuxt.config.ts o middleware
export default defineEventHandler((event) => {
  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  })
})
```

---

*Este documento detalla la seguridad de Tarot2. Para información sobre internacionalización, consultar 07-I18N.md.*
