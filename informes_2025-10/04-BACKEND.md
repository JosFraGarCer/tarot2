# ⚙️ Análisis del Backend - Tarot2

## 1. Visión General

El backend de Tarot2 está construido sobre **Nuxt 4/H3 (Nitro)** con **Kysely** como query builder tipado y **PostgreSQL** como base de datos. La arquitectura sigue patrones de handlers por entidad con utilidades compartidas para CRUD, validación y respuestas.

---

## 2. Arquitectura del Backend

```
server/
├── api/                         # Handlers por entidad
│   ├── auth/
│   │   ├── login.post.ts        # Autenticación JWT
│   │   └── logout.post.ts       # Cierre de sesión
│   ├── user/
│   │   ├── index.get.ts         # Listar usuarios
│   │   ├── index.post.ts        # Crear usuario
│   │   ├── [id].get.ts          # Obtener usuario
│   │   ├── [id].patch.ts        # Actualizar usuario
│   │   ├── [id].delete.ts       # Desactivar usuario
│   │   └── me.get.ts            # Usuario actual
│   ├── world/
│   │   ├── _crud.ts             # Lógica CRUD compartida ⭐
│   │   ├── index.get.ts         # Listar
│   │   ├── index.post.ts        # Crear
│   │   ├── [id].get.ts          # Obtener
│   │   ├── [id].patch.ts        # Actualizar
│   │   ├── [id].delete.ts       # Borrar
│   │   ├── batch.patch.ts       # Actualización masiva
│   │   ├── export.get.ts        # Exportar
│   │   └── import.post.ts       # Importar
│   ├── content_versions/
│   │   ├── index.get.ts         # Listar versiones
│   │   ├── index.post.ts        # Crear versión
│   │   ├── [id].get.ts          # Obtener versión
│   │   ├── [id].patch.ts        # Actualizar versión
│   │   ├── [id].delete.ts       # Borrar versión
│   │   └── publish.post.ts      # Publicar versión ⭐
│   ├── content_revisions/
│   │   ├── index.get.ts         # Listar revisiones
│   │   └── [id]/
│   │       └── revert.post.ts   # Revertir revisión ⭐
│   ├── content_feedback/        # Feedback QA
│   ├── uploads/
│   │   └── index.post.ts        # Upload de imágenes
│   └── database/
│       ├── export.get.ts        # Export JSON/SQL
│       └── import.post.ts       # Import JSON/SQL
│
├── middleware/
│   ├── 00.auth.hydrate.ts       # Hidratación de usuario
│   ├── 01.auth.guard.ts         # Protección de rutas
│   └── 02.rate-limit.ts         # Limitación de requests
│
├── plugins/
│   ├── db.ts                    # Conexión Kysely
│   ├── auth.ts                  # Helpers JWT
│   └── logger.ts                # Logger Pino
│
├── utils/
│   ├── createCrudHandlers.ts    # Factoría CRUD ⭐
│   ├── buildFilters.ts          # Constructor de filtros ⭐
│   ├── response.ts              # Respuestas uniformes
│   ├── translatableUpsert.ts    # Upsert multiidioma ⭐
│   ├── deleteLocalizedEntity.ts # Borrado multiidioma
│   ├── entityCrudHelpers.ts     # Export/Import helpers
│   ├── validate.ts              # Validación Zod
│   ├── i18n.ts                  # Helpers de idioma
│   ├── users.ts                 # Helpers de usuarios
│   └── rateLimit.ts             # Utilidades rate limit
│
├── schemas/                     # Schemas Zod
│   ├── auth.ts
│   ├── user.ts
│   └── entities/
│       ├── world.ts
│       ├── arcana.ts
│       └── ...
│
└── database/
    └── types.ts                 # Tipos Kysely generados
```

---

## 3. Plugins del Servidor

### 3.1 Plugin de Base de Datos (`db.ts`)

```typescript
export default defineNitroPlugin(() => {
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: process.env.DATABASE_URL })
    })
  })
  globalThis.db = db
})
```

### 3.2 Plugin de Autenticación (`auth.ts`)

```typescript
export default defineNitroPlugin(() => {
  globalThis.hashPassword = async (password: string) => {
    return bcrypt.hash(password, 10)
  }
  
  globalThis.verifyPassword = async (password: string, hash: string) => {
    return bcrypt.compare(password, hash)
  }
  
  globalThis.createToken = async (payload: TokenPayload) => {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(process.env.JWT_EXPIRES_IN || '1d')
      .sign(secret)
  }
  
  globalThis.verifyToken = async (token: string) => {
    const { payload } = await jwtVerify(token, secret)
    return payload
  }
  
  globalThis.getUserFromEvent = async (event: H3Event) => {
    // Extrae usuario del contexto
  }
})
```

### 3.3 Plugin de Logger (`logger.ts`)

```typescript
export default defineNitroPlugin(() => {
  globalThis.logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined
  })
})
```

---

## 4. Middleware

### 4.1 Flujo de Middleware

```
Request → 00.auth.hydrate → 01.auth.guard → 02.rate-limit → Handler
                 │                  │               │
                 ▼                  ▼               ▼
          Carga usuario      Verifica      Limita requests
          y permisos         acceso        por IP/usuario
```

### 4.2 `00.auth.hydrate.ts`

```typescript
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) return
  
  try {
    const payload = await verifyToken(token)
    const user = await db.selectFrom('users')
      .where('id', '=', payload.userId)
      .selectAll()
      .executeTakeFirst()
    
    if (!user) return
    
    const roles = await getRolesForUser(user.id)
    event.context.user = {
      ...user,
      roles,
      permissions: mergePermissions(roles)
    }
  } catch {
    // Token inválido, continuar sin usuario
  }
})
```

### 4.3 `01.auth.guard.ts`

```typescript
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  
  // Rutas públicas
  if (path === '/api/auth/login' || path === '/api/auth/logout') {
    return
  }
  
  // Requiere autenticación
  if (!event.context.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  
  // Usuario suspendido
  if (event.context.user.status === 'suspended') {
    throw createError({ statusCode: 403, message: 'Account suspended' })
  }
  
  // Validación granular por ruta
  if (path.startsWith('/api/role')) {
    if (!event.context.user.permissions.canManageUsers) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
  }
})
```

### 4.4 `02.rate-limit.ts`

```typescript
const buckets = new Map<string, { count: number; resetAt: number }>()

export default defineEventHandler(async (event) => {
  const key = `${getClientIP(event)}-${event.context.user?.id || 'anon'}`
  const path = getRequestURL(event).pathname
  
  // Límites diferenciados
  const limit = path.includes('/auth/') ? { max: 10, window: 60 } 
              : path.includes('/publish') ? { max: 10, window: 60 }
              : { max: 300, window: 300 }
  
  const bucket = buckets.get(key) || { count: 0, resetAt: Date.now() + limit.window * 1000 }
  
  if (Date.now() > bucket.resetAt) {
    bucket.count = 0
    bucket.resetAt = Date.now() + limit.window * 1000
  }
  
  bucket.count++
  buckets.set(key, bucket)
  
  if (bucket.count > limit.max) {
    setHeader(event, 'Retry-After', Math.ceil((bucket.resetAt - Date.now()) / 1000))
    throw createError({ statusCode: 429, message: 'Too Many Requests' })
  }
})
```

---

## 5. Utilidades Core

### 5.1 `buildFilters.ts`

```typescript
interface FilterOptions {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  direction?: 'asc' | 'desc'
  status?: string
  allowedSorts: string[]
  searchColumns: string[]
}

export function buildFilters<T>(qb: SelectQueryBuilder<DB, T>, opts: FilterOptions) {
  let query = qb
  
  // Búsqueda
  if (opts.search && opts.searchColumns.length) {
    query = query.where((eb) =>
      eb.or(opts.searchColumns.map(col =>
        eb(col, 'ilike', `%${opts.search}%`)
      ))
    )
  }
  
  // Status
  if (opts.status) {
    query = query.where('status', '=', opts.status)
  }
  
  // Ordenación segura (whitelist)
  if (opts.sort && opts.allowedSorts.includes(opts.sort)) {
    query = query.orderBy(opts.sort, opts.direction || 'asc')
  }
  
  // Conteo total
  const countQuery = query.select(({ fn }) => fn.count('id').as('total'))
  
  // Paginación
  const page = opts.page || 1
  const pageSize = Math.min(opts.pageSize || 20, 100)
  query = query.offset((page - 1) * pageSize).limit(pageSize)
  
  return { query, countQuery, page, pageSize }
}
```

### 5.2 `translatableUpsert.ts`

```typescript
interface UpsertOptions {
  table: string
  translationsTable: string
  baseData: Record<string, unknown>
  translationData: Record<string, unknown>
  lang: string
  id?: number
}

export async function translatableUpsert(opts: UpsertOptions) {
  return db.transaction().execute(async (trx) => {
    let entityId = opts.id
    
    // Crear o actualizar base
    if (!entityId) {
      const result = await trx
        .insertInto(opts.table)
        .values(opts.baseData)
        .returning('id')
        .executeTakeFirst()
      entityId = result.id
    } else {
      await trx
        .updateTable(opts.table)
        .set({ ...opts.baseData, modified_at: sql`now()` })
        .where('id', '=', entityId)
        .execute()
    }
    
    // Upsert traducción
    await trx
      .insertInto(opts.translationsTable)
      .values({
        entity_id: entityId,
        language_code: opts.lang,
        ...opts.translationData
      })
      .onConflict((oc) =>
        oc.columns(['entity_id', 'language_code']).doUpdateSet(opts.translationData)
      )
      .execute()
    
    return entityId
  })
}
```

### 5.3 `deleteLocalizedEntity.ts`

```typescript
export async function deleteLocalizedEntity(opts: {
  table: string
  translationsTable: string
  id: number
  lang: string
}) {
  if (opts.lang === 'en') {
    // Borrar entidad completa
    await db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom(opts.translationsTable)
        .where('entity_id', '=', opts.id)
        .execute()
      
      await trx
        .deleteFrom(opts.table)
        .where('id', '=', opts.id)
        .execute()
    })
    return { deleted: 'entity' }
  } else {
    // Solo borrar traducción
    await db
      .deleteFrom(opts.translationsTable)
      .where('entity_id', '=', opts.id)
      .where('language_code', '=', opts.lang)
      .execute()
    return { deleted: 'translation' }
  }
}
```

### 5.4 `response.ts`

```typescript
export function createResponse<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true, data, meta: meta || null }
}

export function createPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  page: number,
  pageSize: number,
  search?: string
) {
  return {
    success: true,
    data,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      count: data.length,
      search: search || null
    }
  }
}

export function markLanguageFallback<T extends Record<string, unknown>>(
  item: T,
  requestedLang: string
): T & { language_is_fallback: boolean } {
  const resolved = item.language_code_resolved as string
  return {
    ...item,
    language_is_fallback: resolved !== requestedLang
  }
}
```

---

## 6. Patrón CRUD por Entidad

### 6.1 Estructura de `_crud.ts`

```typescript
// server/api/world/_crud.ts
export const worldCrud = {
  async list(event: H3Event) {
    const query = getQuery(event)
    const lang = getRequestedLanguage(query)
    
    const { query: q, countQuery, page, pageSize } = buildFilters(
      db.selectFrom('worlds as w')
        .leftJoin('worlds_translations as t', (join) =>
          join.onRef('t.world_id', '=', 'w.id')
               .on('t.language_code', '=', lang)
        )
        .leftJoin('worlds_translations as t_en', (join) =>
          join.onRef('t_en.world_id', '=', 'w.id')
               .on('t_en.language_code', '=', 'en')
        )
        .select([
          'w.id', 'w.code', 'w.status', 'w.is_active',
          sql`coalesce(t.name, t_en.name)`.as('name'),
          sql`coalesce(t.description, t_en.description)`.as('description'),
          sql`coalesce(t.language_code, 'en')`.as('language_code_resolved')
        ]),
      {
        ...query,
        allowedSorts: ['name', 'code', 'created_at', 'status'],
        searchColumns: ['t.name', 't_en.name', 'w.code']
      }
    )
    
    const [items, total] = await Promise.all([
      q.execute(),
      countQuery.executeTakeFirst()
    ])
    
    return createPaginatedResponse(
      items.map(i => markLanguageFallback(i, lang)),
      Number(total?.total || 0),
      page,
      pageSize,
      query.search
    )
  },
  
  async create(event: H3Event) {
    const body = await readBody(event)
    const validated = safeParseOrThrow(worldCreateSchema, body)
    
    const id = await translatableUpsert({
      table: 'worlds',
      translationsTable: 'worlds_translations',
      baseData: { code: validated.code, status: 'draft', created_by: event.context.user?.id },
      translationData: { name: validated.name, description: validated.description },
      lang: 'en'
    })
    
    logger.info({ scope: 'world.create', id, user: event.context.user?.id })
    
    return createResponse({ id })
  },
  
  // get, update, delete, batch, export, import...
}
```

### 6.2 Handlers Individuales

```typescript
// server/api/world/index.get.ts
export default defineEventHandler((event) => worldCrud.list(event))

// server/api/world/index.post.ts
export default defineEventHandler((event) => worldCrud.create(event))

// server/api/world/[id].get.ts
export default defineEventHandler((event) => worldCrud.get(event))

// server/api/world/[id].patch.ts
export default defineEventHandler((event) => worldCrud.update(event))

// server/api/world/[id].delete.ts
export default defineEventHandler((event) => worldCrud.delete(event))
```

---

## 7. Endpoints Editoriales

### 7.1 Publicación de Versiones

```typescript
// server/api/content_versions/publish.post.ts
export default defineEventHandler(async (event) => {
  // Verificar permiso
  if (!event.context.user?.permissions.canPublish) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  
  const body = await readBody(event)
  const validated = safeParseOrThrow(publishSchema, body)
  
  return db.transaction().execute(async (trx) => {
    // Crear o actualizar versión
    let versionId = validated.version_id
    if (!versionId) {
      const result = await trx
        .insertInto('content_versions')
        .values({
          version_semver: validated.version_semver,
          description: validated.description,
          release: validated.release || 'alfa',
          created_by: event.context.user!.id
        })
        .returning('id')
        .executeTakeFirst()
      versionId = result!.id
    }
    
    // Marcar revisiones aprobadas como publicadas
    const publishedRevisions = await trx
      .updateTable('content_revisions')
      .set({ status: 'published', content_version_id: versionId })
      .where('status', '=', 'approved')
      .returning('id')
      .execute()
    
    // Actualizar content_version_id en entidades
    for (const rev of publishedRevisions) {
      // Lógica de actualización de entidades...
    }
    
    logger.info({
      scope: 'content_versions.publish',
      versionId,
      revisionsPublished: publishedRevisions.length,
      user: event.context.user!.id
    })
    
    return createResponse({
      versionId,
      revisionsPublished: publishedRevisions.length
    })
  })
})
```

### 7.2 Revert de Revisiones

```typescript
// server/api/content_revisions/[id]/revert.post.ts
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  
  // Verificar permisos
  const { canRevert, canPublish, canReview } = event.context.user?.permissions || {}
  if (!canRevert && !canPublish && !canReview) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  
  const revision = await db
    .selectFrom('content_revisions')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst()
  
  if (!revision) {
    throw createError({ statusCode: 404, message: 'Revision not found' })
  }
  
  return db.transaction().execute(async (trx) => {
    // Restaurar snapshot previo
    const snapshot = revision.prev_snapshot
    await trx
      .updateTable(revision.entity_type as 'worlds')
      .set(snapshot)
      .where('id', '=', revision.entity_id)
      .execute()
    
    // Crear revisión de revert
    await trx
      .insertInto('content_revisions')
      .values({
        entity_type: revision.entity_type,
        entity_id: revision.entity_id,
        status: 'reverted',
        prev_snapshot: revision.next_snapshot,
        next_snapshot: snapshot,
        created_by: event.context.user!.id,
        notes: `Reverted from revision ${id}`
      })
      .execute()
    
    return createResponse({ reverted: true, revisionId: id })
  })
})
```

---

## 8. Sistema de Uploads

```typescript
// server/api/uploads/index.post.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = query.type as string
  
  // Validar tipo
  if (!/^[a-z0-9_-]+$/i.test(type)) {
    throw createError({ statusCode: 400, message: 'Invalid type' })
  }
  
  const formData = await readFormData(event)
  const file = formData.get('file') as File
  
  // Validar archivo
  if (!file) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }
  
  if (file.size > 15 * 1024 * 1024) {
    throw createError({ statusCode: 400, message: 'File too large (max 15MB)' })
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  if (!allowedTypes.includes(file.type)) {
    throw createError({ statusCode: 400, message: 'Invalid file type' })
  }
  
  // Procesar con Sharp
  const buffer = Buffer.from(await file.arrayBuffer())
  const processed = await sharp(buffer)
    .rotate() // Auto-rotate basado en EXIF
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .avif({ quality: 80 })
    .toBuffer()
  
  // Guardar archivo
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.avif`
  const path = `public/img/${type}/${filename}`
  await writeFile(path, processed)
  
  return createResponse({
    type,
    filename,
    path: `${type}/${filename}`,
    url: `/img/${type}/${filename}`
  })
})
```

---

## 9. Logging

### 9.1 Estructura de Logs

```typescript
// Listados
logger.info({
  scope: 'world.list',
  page: 1,
  pageSize: 20,
  count: 15,
  totalItems: 150,
  search: 'fire',
  lang: 'es',
  timeMs: 45,
  userId: 2
})

// Mutaciones
logger.info({
  scope: 'world.create',
  id: 42,
  userId: 2,
  timeMs: 23
})

// Errores
logger.error({
  scope: 'world.update',
  id: 42,
  error: 'Validation failed',
  userId: 2
})

// Rate limit
logger.warn({
  scope: 'middleware.rateLimit',
  ip: '192.168.1.1',
  userId: 2,
  path: '/api/auth/login',
  rejected: true
})
```

---

## 10. Zonas Legacy y Pendientes

### 10.1 Pendientes de Implementación

| Tarea | Prioridad | Impacto |
|-------|-----------|---------|
| Limpieza cookie en logout | Alta | Seguridad |
| Helper SQL tags AND/ANY | Alta | Consistencia |
| `useServerPagination` wrapper | Media | DX |
| Métricas publish/revert | Media | Observabilidad |
| Límites import/export | Media | Robustez |

### 10.2 Riesgos Identificados

| Riesgo | Mitigación |
|--------|------------|
| SQL compleja en `_crud.ts` | Tests multi-idioma obligatorios |
| Rate limit en memoria | Considerar Redis para multi-nodo |
| Import sin límites | Añadir validación de tamaño/schema |
| Permisos divergentes | Sincronizar con capabilities frontend |

---

## 11. Roadmap Backend

### Fase 0 - Cimientos (Inmediata)

| Tarea | Estado |
|-------|--------|
| Rate limit en login/logout | ✅ Implementado |
| Limpieza cookie en logout | ✅ Implementado |
| Rate limit en publish/revert | ✅ Implementado |

### Fase 1 - Consolidación

| Tarea | Estado |
|-------|--------|
| Helper SQL tags AND/ANY | 🔄 Pendiente |
| `useServerPagination` | 🔄 Pendiente |
| Documentar alias `/api/user` | 🔄 Pendiente |

### Fase 2 - Observabilidad

| Tarea | Estado |
|-------|--------|
| Métricas OTLP editoriales | 🔄 Pendiente |
| `requestId` correlacionado | 🔄 Pendiente |
| Dashboard de logs | 🔄 Pendiente |

---

*Este documento detalla el análisis del backend de Tarot2. Para información sobre el modelo de datos, consultar 05-MODELO-DATOS.md.*
