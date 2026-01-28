# Roadmap de Mejoras y Escalamiento - Tarot2 Server

**Estado:** Plan Estratégico
**Autor:** Senior Developer Architecture
**Fecha:** 2026-01-28
**Versión:** 1.0

---

## 1. Resumen Ejecutivo

Este documento establece el roadmap técnico para la capa `server/` de Tarot2, priorizando mejoras de rendimiento, escalabilidad y mantenibilidad. El objetivo es transformar el backend de un estado "funcional pero frágil" a una arquitectura enterprise-ready.

**Fases:**
- **Fase 1 (Inmediata):** Quick wins y seguridad crítica
- **Fase 2 (Corto plazo):** Cacheo con Redis y optimización de queries
- **Fase 3 (Mediano plazo):** Escalamiento horizontal y patrones avanzados
- **Fase 4 (Largo plazo):** Arquitectura event-driven y microservicios

---

## 2. Arquitectura Actual vs. Objetivo

### 2.1 Estado Actual (Problemas Identificados)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA ACTUAL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client → Nitro Server → Kysely → PostgreSQL                    │
│                          │                                      │
│                    In-Memory Cache (Map)                        │
│                    (30s TTL, sin cleanup)                       │
│                          │                                      │
│                    RateLimit (Map)                              │
│                    (sin cleanup, potencial leak)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Estado Objetivo (Arquitectura Target)

```
┌─────────────────────────────────────────────────────────────────┐
│                 ARQUITECTURA TARGET (v2)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client → CDN → Nginx → Nitro Server (Multi-instance)          │
│                          │                                      │
│                    Redis Cluster                                │
│                    ├─ Session Cache                            │
│                    ├─ Rate Limit Buckets                        │
│                    ├─ Query Cache (API responses)              │
│                    └─ Pub/Sub (eventos)                        │
│                          │                                      │
│                    PostgreSQL + Read Replicas                   │
│                          │                                      │
│                    Message Queue (BullMQ/RabbitMQ)              │
│                    ├─ Jobs de indexing                         │
│                    └─ Jobs de notifications                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Fase 1: Quick Wins y Seguridad Crítica (Semana 1-2)

### 3.1 Items Completados ✅

| Item | Archivo | Estado |
|------|---------|--------|
| JSON.parse safe en auth | `auth.hydrate.ts` | ✅ Listo |
| Logging en catch vacío | `auth.hydrate.ts` | ✅ Listo |
| JWT secret cache | `auth.ts` | ✅ Listo |
| Zod API correcto | `validate.ts` | ✅ Listo |
| Tipado i18n.ts | `i18n.ts` | ✅ Listo |

### 3.2 Items Pendientes de Fase 1

#### 3.2.1 Rate Limit con Cleanup Automático
**Archivo:** `server/utils/rateLimit.ts`

```typescript
// PROBLEMA: El cleanup actual es hourly pero Map puede crecer indefinidamente
// SOLUCIÓN: Usar WeakRef o LinkedList para cleanup automático

// Implementación target:
interface Bucket {
  count: number
  expiresAt: number
  next?: Bucket
  prev?: Bucket
}

// O mejor: migrar a Redis (ver Fase 2)
```

**Impacto:** Media | **Esfuerzo:** Bajo | **Prioridad:** Alta

#### 3.2.2 Validación de Input en Todos los Endpoints
**Archivos:** `server/api/*/_crud.ts`

**Problema:** Algunos endpoints no validan todos los campos entrantes.

**Solución:**
```typescript
// Asegurar que todos los handlers usen:
const body = config.schema.create.parse(raw)  // CREATE
const body = config.schema.update.parse(raw)  // UPDATE
```

**Impacto:** Alta | **Esfuerzo:** Bajo | **Prioridad:** Crítica

#### 3.2.3 Headers de Seguridad
**Archivo:** `server/middleware/*.ts`

**Solución:** Añadir helmet-style headers en todos los responses.

```typescript
// En plugin de Nitro o middleware global
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.node.res.setHeader('X-Content-Type-Options', 'nosniff')
    event.node.res.setHeader('X-Frame-Options', 'DENY')
    event.node.res.setHeader('X-XSS-Protection', '1; mode=block')
    event.node.res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  })
})
```

**Impacto:** Alta | **Esfuerzo:** Bajo | **Prioridad:** Alta

---

## 4. Fase 2: Cacheo con Redis y Optimización (Semana 3-6)

### 4.1 Arquitectura de Redis

```
┌─────────────────────────────────────────────────────────────────┐
│                    REDIS DATA MODEL                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Key Pattern                    TTL        Description          │
│  ─────────────────────────────────────────────────────────────  │
│  session:{userId}              30min      User session data    │
│  ratelimit:{identifier}:{ip}    1h         Rate limit buckets  │
│  api:cache:{hash}               5-60min    API response cache   │
│  entity:{entity}:{id}:{lang}   1h         Entity translations  │
│  tags:{entity}:{id}            30min      Eager loaded tags    │
│  user_perms:{userId}           15min      Merged permissions   │
│                                                                 │
│  Pub/Sub Channels:                                               │
│  - invalidate:entity        → Invalidar cache de entidades      │
│  - invalidate:session       → Invalidar sesiones                │
│  - job:complete             → Notificar jobs completados        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Implementación de Redis Client

**Archivo:** `server/utils/redis.ts`

```typescript
// server/utils/redis.ts
import { createClient, type RedisClientType } from 'redis'

let redisClient: RedisClientType | null = null

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) return redisClient

  const url = process.env.REDIS_URL || 'redis://localhost:6379'
  redisClient = createClient({ url })

  redisClient.on('error', (err) => {
    const logger = (globalThis as any).logger
    logger?.error?.({ err }, 'Redis Client Error')
  })

  redisClient.on('connect', () => {
    const logger = (globalThis as any).logger
    logger?.info?.('Redis Client Connected')
  })

  await redisClient.connect()
  return redisClient
}

// Helper functions
export const redis = {
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl = 300): Promise<T> {
    const client = await getRedisClient()
    const cached = await client.get(key)
    if (cached) return JSON.parse(cached) as T

    const value = await fn()
    await client.setEx(key, ttl, JSON.stringify(value))
    return value
  },

  async invalidatePattern(pattern: string): Promise<void> {
    const client = await getRedisClient()
    const keys = await client.keys(pattern)
    if (keys.length > 0) await client.del(keys)
  },

  async publish(channel: string, message: unknown): Promise<void> {
    const client = await getRedisClient()
    await client.publish(channel, JSON.stringify(message))
  },

  async subscribe<T>(channel: string, callback: (msg: T) => void): Promise<void> {
    const client = await getRedisClient()
    const subscriber = client.duplicate()
    await subscriber.connect()
    await subscriber.subscribe(channel, (msg) => {
      callback(JSON.parse(msg) as T)
    })
  },
}
```

### 4.3 Migración de Auth Hydrate a Redis

**Archivo:** `server/middleware/00.auth.hydrate.ts` (refactorizado)

```typescript
// PROBLEMA ACTUAL: In-memory cache no funciona en multi-instance
// SOLUCIÓN: Redis con key por userId

export default defineEventHandler(async (event) => {
  // ... existing token extraction ...

  const userId = Number(userPayload.id)
  
  // Try cache first
  const cachedUser = await redis.getOrSet(
    `session:${userId}`,
    async () => {
      // ... fetch from DB ...
      return userData
    },
    1800 // 30 minutes
  )

  if (cachedUser) {
    context.user = cachedUser
    return
  }
  
  // ... rest of auth logic ...
})
```

### 4.4 Rate Limit con Redis

**Archivo:** `server/utils/rateLimit.ts` (refactorizado)

```typescript
// PROBLEMA ACTUAL: Map en memoria no escalable
// SOLUCIÓN: Redis con sliding window o fixed window

import { redis } from './redis'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export async function enforceRateLimitRedis(
  event: H3Event,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const ip = getClientIp(event) ?? 'unknown'
  const user = event.context.user as { id?: number } | undefined
  const userKey = user?.id ?? 'anon'
  const key = `ratelimit:${options.identifier}:${userKey}:${ip}`
  
  const now = Date.now()
  const windowMs = options.windowMs
  const windowStart = now - windowMs
  
  const client = await redis.getRedisClient()
  
  // Use Redis sorted set for sliding window
  const pipeline = client.multi()
  pipeline.zRemRangeByScore(key, 0, windowStart)
  pipeline.zCard(key)
  pipeline.zAdd(key, { score: now, value: now.toString() })
  pipeline.expire(key, Math.ceil(windowMs / 1000))
  
  const results = await pipeline.exec()
  const count = results[1][1] as number
  
  if (count >= options.max) {
    // Get oldest entry to calculate reset time
    const oldest = await client.zRange(key, 0, 0, { REV: false })
    const resetAt = oldest.length > 0 
      ? parseInt(oldest[0]) + windowMs 
      : now + windowMs
    
    return { allowed: false, remaining: 0, resetAt }
  }
  
  return { allowed: true, remaining: options.max - count - 1, resetAt: now + windowMs }
}
```

### 4.5 API Response Caching

**Helper para cache de queries:**

```typescript
// server/utils/apiCache.ts
import { redis } from './redis'

interface CacheOptions {
  ttl: number
  keyGenerator?: (event: H3Event) => string
  invalidateOn?: string[] // event patterns
}

export function withApiCache<T>(
  handler: EventHandler<T>,
  options: CacheOptions,
): EventHandler<T> {
  return defineEventHandler(async (event) => {
    const method = event.method
    if (method !== 'GET') return handler(event)

    const cacheKey = options.keyGenerator 
      ? options.keyGenerator(event)
      : `api:cache:${method}:${event.path}:${JSON.stringify(getQuery(event))}`

    return redis.getOrSet(cacheKey, () => handler(event), options.ttl)
  })
}

// Uso en endpoints:
export default withApiCache(listHandler, {
  ttl: 300, // 5 minutos
  keyGenerator: (event) => `api:cache:arcana:list:${JSON.stringify(getQuery(event))}`,
})
```

---

## 5. Fase 3: Optimización de Queries y Database (Semana 7-10)

### 5.1 Índices PostgreSQL Recomendados

> **NOTA:** Tras auditoría de la DB existente, **6 de 8 índices sugeridos YA EXISTEN**.
> Solo se requieren **2 índices adicionales** para queries compuestos.

```sql
-- Índices YA EXISTEN (verificados en schema):
-- ✅ idx_arcana_translations_arcana_lang ON arcana_translations(arcana_id, language_code)
-- ✅ idx_base_skills_translations_lang ON base_skills_translations(base_skill_id, language_code)
-- ✅ idx_facet_translations_facet_lang ON facet_translations(facet_id, language_code)
-- ✅ idx_world_translations_world_lang ON world_translations(world_id, language_code)
-- ✅ idx_tag_links_entity ON tag_links(entity_type, entity_id)
-- ✅ idx_tag_links_tag ON tag_links(tag_id)

-- SOLO FALTAN estos 2 índices compuestos:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_base_skills_status_active
  ON base_skills(status, is_active, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arcana_status_active
  ON arcana(status, is_active, created_at DESC);
```

**Conclusión:** La fase 3 (DB optimization) se simplifica significativamente. No se requieren nuevos índices de traducción.

### 5.2 Read Replicas para Queries de Lectura

```typescript
// server/database/multi-db.ts
import { Kysely, PostgresDialect } from 'kysely'
import type { DB } from './types'

// Primary writer (writes)
const primaryDialect = new PostgresDialect({
  pool: new Pool({
    host: process.env.DB_PRIMARY_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
  }),
})

// Read replica (reads)
const replicaDialect = new PostgresDialect({
  pool: new Pool({
    host: process.env.DB_REPLICA_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 40,
  }),
})

export const primaryDb = new Kysely<DB>({ dialect: primaryDialect })
export const replicaDb = new Kysely<DB>({ dialect: replicaDialect })

// Helper para routing automático
export function getDbForQuery(isWrite: boolean): Kysely<DB> {
  return isWrite ? primaryDb : replicaDb
}
```

### 5.3 Query Optimization: Pagination Keyset

```typescript
// PROBLEMA: OFFSET pagination es lento en páginas grandes
// SOLUCIÓN: Keyset pagination (cursor-based)

// En filters.ts o nuevo archivo pagination.ts
export interface Cursor {
  id: number
  created_at: Date
}

export function applyKeysetPagination<T>(
  qb: SelectQueryBuilder<DB, TB, O>,
  cursor: Cursor | null,
  pageSize: number,
  orderField: 'created_at' | 'id' = 'created_at',
  direction: 'asc' | 'desc' = 'desc',
) {
  if (!cursor) {
    // First page - use regular pagination
    return qb.limit(pageSize)
  }

  const operator = direction === 'desc' ? '<' : '>'
  
  return qb
    .where((eb) => eb.or([
      eb(orderField, operator, cursor[orderField]),
      eb.and([
        eb(orderField, '=', cursor[orderField]),
        eb('id', operator, cursor.id),
      ]),
    ]))
    .limit(pageSize)
}
```

---

## 6. Fase 4: Arquitectura Event-Driven (Semana 11-14)

### 6.1 Message Queue Setup

```typescript
// server/utils/queue.ts
import { Queue, Worker, type Job } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
})

// Queue definitions
export const queues = {
  indexing: new Queue('indexing', { connection }),
  notifications: new Queue('notifications', { connection }),
  analytics: new Queue('analytics', { connection }),
  cleanup: new Queue('cleanup', { connection }),
}

// Job types
export interface IndexJobData {
  entityType: string
  entityId: number
  action: 'create' | 'update' | 'delete'
}

export interface NotificationJobData {
  userId: number
  type: 'email' | 'push' | 'in_app'
  payload: Record<string, unknown>
}

// Add job helper
export async function addIndexJob(data: IndexJobData) {
  await queues.indexing.add('process', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  })
}
```

### 6.2 Workers

```typescript
// server/workers/indexing.worker.ts
import { Worker } from 'bullmq'
import { queues, type IndexJobData } from '../utils/queue'
import { primaryDb } from '../database/multi-db'

new Worker('indexing', async (job: Job<IndexJobData>) => {
  const { entityType, entityId, action } = job.data

  const logger = (globalThis as any).logger
  logger?.info?.({ jobId: job.id, entityType, entityId, action }, 'Processing indexing job')

  switch (entityType) {
    case 'arcana':
      await handleArcanaIndexing(entityId, action)
      break
    case 'base_card':
      await handleBaseCardIndexing(entityId, action)
      break
    // ... other entities
  }

  // Invalidate cache
  await redis.invalidatePattern(`api:cache:*${entityType}*`)
  await redis.publish('invalidate:entity', { entityType, entityId })
}, { connection, concurrency: 5 })

async function handleArcanaIndexing(id: number, action: string) {
  if (action === 'delete') {
    // Remove from search index (Elasticsearch/Algolia)
    return
  }

  const entity = await primaryDb
    .selectFrom('arcana')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  if (entity) {
    // Update search index
    // await elasticsearch.index(...)
  }
}
```

### 6.3 Event-Driven Cache Invalidation

```typescript
// server/plugins/cacheInvalidation.ts
import { redis } from '../utils/redis'

export default defineNitroPlugin((nitroApp) => {
  // Subscribe to invalidation events
  redis.subscribe('invalidate:entity', (msg: { entityType: string; entityId: number }) => {
    const pattern = `api:cache:*${msg.entityType}*`
    redis.invalidatePattern(pattern)
    console.log(`Invalidated cache for ${msg.entityType}:${msg.entityId}`)
  })

  redis.subscribe('invalidate:session', (msg: { userId: number }) => {
    redis.invalidatePattern(`session:${msg.userId}`)
    console.log(`Invalidated session for user ${msg.userId}`)
  })
})
```

---

## 7. Métricas y Observabilidad

### 7.1 Métricas a Monitorizar

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD MÉTRICAS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  API Layer:                                                    │
│  ├─ Request latency (p50, p95, p99)                            │
│  ├─ Requests per second                                         │
│  ├─ Error rate by endpoint                                      │
│  └─ Cache hit rate                                              │
│                                                                 │
│  Database Layer:                                               │
│  ├─ Query latency                                              │
│  ├─ Connection pool usage                                       │
│  ├─ Deadlocks                                                  │
│  └─ Replication lag (if replicas)                               │
│                                                                 │
│  Redis Layer:                                                  │
│  ├─ Memory usage                                               │
│  ├─ Hit rate                                                   │
│  ├─ Connected clients                                          │
│  └─ Commands per second                                         │
│                                                                 │
│  Queue Layer:                                                  │
│  ├─ Jobs processed per second                                   │
│  ├─ Queue depth                                                │
│  ├─ Job failure rate                                           │
│  └─ Processing time                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Health Checks

```typescript
// server/api/health.ts
export default defineEventHandler(async () => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      db: await checkDatabase(),
      redis: await checkRedis(),
      queue: await checkQueue(),
    },
  }

  const allHealthy = Object.values(checks.checks).every(c => c.status === 'ok')
  checks.status = allHealthy ? 'ok' : 'degraded'

  return checks
})

async function checkDatabase() {
  try {
    await primaryDb.execute('SELECT 1')
    return { status: 'ok', latency: 0 }
  } catch (e) {
    return { status: 'error', error: String(e) }
  }
}

async function checkRedis() {
  try {
    const start = Date.now()
    const client = await redis.getRedisClient()
    await client.ping()
    return { status: 'ok', latency: Date.now() - start }
  } catch (e) {
    return { status: 'error', error: String(e) }
  }
}
```

---

## 8. Roadmap Timeline

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         TIMELINE ROADMAP                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Semana 1-2    │████████████│ Quick wins + Seguridad                       │
│               │             │ ✅ Auth fixes                                │
│               │             │ ✅ Zod validation                            │
│               │             │ ⬜ Headers de seguridad                       │
│               │             │ ⬜ Rate limit cleanup                         │
│               │             │                                              │
│ Semana 3-6    │████████████│ Redis Implementation                         │
│               │             │ ⬜ Redis client setup                         │
│               │             │ ⬜ Session cache migration                   │
│               │             │ ⬜ Rate limit Redis                           │
│               │             │ ⬜ API response cache                         │
│               │             │                                              │
│ Semana 7-10   │████████████│ Database Optimization                        │
│               │             │ ⬜ PostgreSQL indices                         │
│               │             │ ⬜ Read replicas                             │
│               │             │ ⬜ Keyset pagination                          │
│               │             │ ⬜ Query optimization                         │
│               │             │                                              │
│ Semana 11-14  │████████████│ Event-Driven Architecture                    │
│               │             │ ⬜ BullMQ setup                               │
│               │             │ ⬜ Indexing workers                          │
│               │             │ ⬜ Cache invalidation events                  │
│               │             │ ⬜ Analytics pipeline                         │
│               │             │                                              │
│ Post-Launch   │────────────│ Mantenimiento Continuo                       │
│               │             │ ⬜ Monitoring dashboards                     │
│               │             │ ⬜ Auto-scaling policies                      │
│               │             │ ⬜ Performance tuning                         │
│               │             │                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Costos y Recursos

### 9.1 Infraestructura Objetivo

| Componente | Actual | Objetivo | Costo Incremental |
|------------|--------|----------|-------------------|
| Database | 1x PostgreSQL | 1x Primary + 2x Replicas | +$100/mes |
| Cache | In-memory | Redis Cluster | +$50/mes |
| Queue | - | BullMQ + Redis | Incluido |
| CDN | - | Cloudflare | +$20/mes |
| **Total** | - | - | **+$170/mes** |

### 9.2 Recursos de Desarrollo

| Fase | Esfuerzo (developer-weeks) |
|------|----------------------------|
| Fase 1 | 2 |
| Fase 2 | 4 |
| Fase 3 | 3 |
| Fase 4 | 4 |
| **Total** | **13** |

---

## 10. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Redis no disponible | Media | Alto | Fallback a in-memory con circuit breaker |
| Cache invalidation延迟 | Media | Medio | Event-driven invalidation con retry |
| Read replica lag | Baja | Medio | Strong consistency para writes críticos |
| Queue backlog | Baja | Alto | Auto-scaling de workers + alerts |
| Cost overrun | Media | Medio | Start con最小的配置, scale según métricas |

---

## 11. Conclusión

Este roadmap transforma la arquitectura de `server/` de un sistema monolítico simple a una arquitectura enterprise-ready con:

1. **Escalabilidad:** Redis + Read replicas + Queue-based processing
2. **Confiabilidad:** Circuit breakers, fallback strategies, proper error handling
3. **Observabilidad:** Health checks, métricas, distributed tracing
4. **Mantenibilidad:** Clear separation of concerns, event-driven patterns

**Próximo paso:** Obtener aprobación de arquitectura y comenzar con Fase 1 (semana 1-2).
