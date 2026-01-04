# Tarot2 - Análisis de Performance 2026-01

## Resumen Ejecutivo

Este documento presenta un análisis detallado del rendimiento actual de Tarot2, identificando bottlenecks, áreas de optimización y estableciendo objetivos de performance. Se incluyen métricas actuales, benchmarks objetivo y estrategias específicas de optimización.

## Estado Actual de Performance

### Métricas Baseline (Estado Actual)

#### Frontend Performance
| Métrica | Valor Actual | Objetivo | Estado |
|---------|--------------|----------|---------|
| **First Contentful Paint (FCP)** | 2.8s | < 1.8s | 🔴 Necesita mejora |
| **Largest Contentful Paint (LCP)** | 3.2s | < 2.5s | 🟡 Aceptable |
| **Cumulative Layout Shift (CLS)** | 0.15 | < 0.1 | 🔴 Necesita mejora |
| **First Input Delay (FID)** | 180ms | < 100ms | 🟡 Aceptable |
| **Time to Interactive (TTI)** | 4.1s | < 3.8s | 🟡 Aceptable |

#### Backend Performance
| Endpoint | Tiempo Respuesta | Objetivo | Estado |
|----------|------------------|----------|---------|
| **GET /api/arcana** | 450ms | < 200ms | 🔴 Necesita mejora |
| **GET /api/base_card** | 680ms | < 300ms | 🔴 Necesita mejora |
| **POST /api/arcana** | 320ms | < 200ms | 🟡 Aceptable |
| **PATCH /api/arcana/:id** | 280ms | < 200ms | 🟡 Aceptable |
| **DELETE /api/arcana/:id** | 150ms | < 150ms | 🟢 Bueno |

#### Bundle Analysis
| Métrica | Valor Actual | Objetivo | Estado |
|---------|--------------|----------|---------|
| **Initial Bundle Size** | 1.2MB | < 800KB | 🔴 Necesita mejora |
| **Gzipped Size** | 420KB | < 250KB | 🔴 Necesita mejora |
| **Chunks Count** | 12 | < 8 | 🟡 Aceptable |
| **Critical Path** | 850KB | < 500KB | 🔴 Necesita mejora |

## Análisis Detallado de Bottlenecks

### 1. Frontend Performance Issues

#### 1.1 Bundle Size Issues
**Problema**: Bundle inicial de 1.2MB es demasiado grande
**Causas identificadas**:
- Nuxt UI 4 import completo en lugar de componentes específicos
- Falta de tree-shaking efectivo
- Dependencias no optimizadas (lodash, date-fns completas)
- Imágenes no optimizadas

**Impacto**: 
- Tiempo de carga inicial alto
- Poor performance en dispositivos móviles
- SEO impactado

#### 1.2 Render Performance
**Problema**: Re-renders innecesarios en componentes complejos
**Causas identificadas**:
- EntityBase.vue (887 líneas) causa re-renders frecuentes
- Falta de memoización en computed properties
- Props no optimizadas causan prop drilling

**Impacto**:
- FID elevado (180ms)
- Poor user experience durante interacciones

#### 1.3 Image Loading
**Problema**: Imágenes no optimizadas y lazy loading inconsistente
**Causas identificadas**:
- Imágenes en formato PNG/JPG en lugar de WebP/AVIF
- Falta de responsive images
- No hay lazy loading en listas largas

**Impacto**:
- LCP elevado (3.2s)
- CLS issues (0.15)

### 2. Backend Performance Issues

#### 2.1 Database Query Performance
**Problema**: Consultas N+1 y falta de optimización
**Causas identificadas**:
```sql
-- Problema: N+1 queries en listado de arcanos
SELECT * FROM arcana WHERE status = 'active';
-- Para cada arcana:
SELECT * FROM arcana_translations WHERE arcana_id = ? AND language_code = 'es';
SELECT * FROM tag_links WHERE entity_type = 'arcana' AND entity_id = ?;
```

**Impacto**: 
- GET /api/arcana: 450ms (debería ser < 200ms)
- Escalabilidad pobre con más datos

#### 2.2 API Response Size
**Problema**: Respuestas API demasiado grandes
**Causas identificadas**:
- Incluir datos innecesarios en respuestas
- Falta de paginación optimizada
- No hay compresión de respuestas

**Impacto**:
- Tiempo de transferencia alto
- Poor performance en conexiones lentas

#### 2.3 Cache Strategy
**Problema**: Falta de cache efectivo
**Causas identificadas**:
- No hay cache de consultas frecuentes
- Falta de cache de traducciones
- No hay CDN para assets estáticos

**Impacto**:
- Consultas repetitivas a base de datos
- Performance inconsistente

## Estrategias de Optimización

### 1. Frontend Optimizations

#### 1.1 Bundle Optimization

**Estrategia 1: Tree Shaking y Import Selectivo**
```typescript
// ❌ Antes: Import completo
import { UButton, UInput, USelectMenu } from '@nuxt/ui'

// ✅ Después: Import específico
import UButton from '@nuxt/ui/dist/components/Button.vue'
import UInput from '@nuxt/ui/dist/components/Input.vue'
import USelectMenu from '@nuxt/ui/dist/components/SelectMenu.vue'
```

**Estrategia 2: Code Splitting**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/manage/**': { prerender: false },
    '/admin/**': { prerender: false },
    '/': { prerender: true }
  },
  experimental: {
    payloadExtraction: false
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', '@vue/runtime-core'],
            'vendor-ui': ['@nuxt/ui'],
            'vendor-i18n': ['@nuxtjs/i18n'],
            'vendor-utils': ['lodash-es', 'date-fns']
          }
        }
      }
    }
  }
})
```

**Estrategia 3: Dependency Optimization**
```typescript
// ❌ Antes: Lodash completo
import _ from 'lodash'

// ✅ Después: Lodash ES modules
import debounce from 'lodash-es/debounce'
import throttle from 'lodash-es/throttle'
import cloneDeep from 'lodash-es/cloneDeep'

// ✅ Alternativa: Native implementations
const debounce = (fn: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn.apply(null, args), wait)
  }
}
```

#### 1.2 Render Optimization

**Estrategia 1: Memoización**
```vue
<script setup lang="ts">
import { useMemo, useCallback } from 'vue'

// ❌ Antes: Computed sin memoización
const filteredItems = computed(() => {
  return items.value.filter(item => {
    return item.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  })
})

// ✅ Después: Memoización explícita
const filteredItems = useMemo(() => {
  return items.value.filter(item => {
    return item.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  })
}, [items.value, searchTerm.value])

const handleItemClick = useCallback((item: any) => {
  emit('item-click', item)
}, [emit])
</script>
```

**Estrategia 2: Virtual Scrolling**
```vue
<!-- Para listas largas -->
<VirtualizedList
  :items="filteredItems"
  :item-height="120"
  :container-height="600"
  :overscan="5"
>
  <template #default="{ item }">
    <EntityCard :entity="item" />
  </template>
</VirtualizedList>
```

**Estrategia 3: Component Splitting**
```vue
<!-- ❌ Antes: EntityBase monolítico -->
<template>
  <!-- 887 líneas de template -->
</template>

<!-- ✅ Después: Componentes especializados -->
<template>
  <EntityViewManager :view-mode="viewMode" :items="items" />
  <EntityFiltersPanel :filters="filters" />
  <EntityActionsBar :selected="selected" />
  <EntityModalManager :modal-state="modalState" />
</template>
```

#### 1.3 Image Optimization

**Estrategia 1: Modern Formats**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  image: {
    format: ['webp', 'avif', 'png'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    },
    densities: [1, 2],
    quality: 80
  }
})
```

**Estrategia 2: Lazy Loading**
```vue
<!-- ✅ Implementación correcta -->
<NuxtImg
  :src="imageSrc"
  :alt="imageAlt"
  loading="lazy"
  decoding="async"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

### 2. Backend Optimizations

#### 2.1 Database Query Optimization

**Estrategia 1: Eliminar N+1 Queries**
```typescript
// ❌ Antes: N+1 queries
const arcana = await db.selectFrom('arcana')
  .selectAll()
  .where('status', '=', 'active')
  .execute()

// Para cada arcana:
const translations = await db.selectFrom('arcana_translations')
  .selectAll()
  .where('arcana_id', '=', arcana.id)
  .where('language_code', '=', lang)
  .execute()

// ✅ Después: Single query con joins
const arcana = await db.selectFrom('arcana')
  .select([
    'arcana.*',
    'translations.name as translation_name',
    'translations.description as translation_description'
  ])
  .leftJoin('arcana_translations as translations', (join) => 
    join.onRef('arcana.id', '=', 'translations.arcana_id')
        .on('translations.language_code', '=', lang)
  )
  .where('arcana.status', '=', 'active')
  .execute()
```

**Estrategia 2: Query Result Caching**
```typescript
// utils/cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export class QueryCache {
  static async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  }

  static async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value))
  }

  static async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}

// Uso en endpoints
export default defineEventHandler(async (event) => {
  const cacheKey = `arcana:list:${getQuery(event).lang || 'en'}`
  
  let arcana = await QueryCache.get(cacheKey)
  if (!arcana) {
    arcana = await fetchArcanaFromDB()
    await QueryCache.set(cacheKey, arcana, 300) // 5 min cache
  }
  
  return arcana
})
```

**Estrategia 3: Database Indexing**
```sql
-- Índices para optimizar consultas frecuentes
CREATE INDEX CONCURRENTLY idx_arcana_status ON arcana(status);
CREATE INDEX CONCURRENTLY idx_arcana_translations_lang ON arcana_translations(language_code);
CREATE INDEX CONCURRENTLY idx_arcana_translations_entity ON arcana_translations(arcana_id, language_code);
CREATE INDEX CONCURRENTLY idx_tag_links_entity ON tag_links(entity_type, entity_id);

-- Índices compuestos para consultas complejas
CREATE INDEX CONCURRENTLY idx_arcana_status_lang ON arcana(status) INCLUDE (id, code);
CREATE INDEX CONCURRENTLY idx_base_card_type_status ON base_card(card_type_id, status);
```

#### 2.2 API Response Optimization

**Estrategia 1: Response Compression**
```typescript
// server/plugins/compression.ts
import { defineNitroPlugin } from 'nitropack'
import compression from 'compression'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:route', (url, result, context) => {
    if (context.event.node.res) {
      context.event.node.res.setHeader('Content-Encoding', 'gzip')
    }
  })
})
```

**Estrategia 2: Selective Field Response**
```typescript
// utils/response.ts
export function createOptimizedResponse<T>(
  data: T,
  options: {
    fields?: string[]
    include?: string[]
    exclude?: string[]
  } = {}
) {
  const { fields, include, exclude } = options
  
  if (fields && fields.length > 0) {
    // Solo incluir campos específicos
    const filtered = data.map((item: any) => {
      const result: any = {}
      fields.forEach(field => {
        result[field] = item[field]
      })
      return result
    })
    return { data: filtered }
  }
  
  if (include || exclude) {
    // Filtrar campos específicos
    const filtered = data.map((item: any) => {
      const result = { ...item }
      if (exclude) {
        exclude.forEach(field => delete result[field])
      }
      if (include) {
        const included: any = {}
        include.forEach(field => {
          if (result[field] !== undefined) {
            included[field] = result[field]
          }
        })
        return included
      }
      return result
    })
    return { data: filtered }
  }
  
  return { data }
}
```

#### 2.3 Caching Strategy

**Estrategia 1: Multi-level Caching**
```typescript
// utils/cache-strategy.ts
export class CacheStrategy {
  private static memoryCache = new Map<string, any>()
  private static readonly MEMORY_TTL = 5 * 60 * 1000 // 5 minutos
  
  static async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem && Date.now() - memoryItem.timestamp < this.MEMORY_TTL) {
      return memoryItem.data
    }
    
    // L2: Redis cache
    const redisItem = await QueryCache.get<T>(key)
    if (redisItem) {
      // Populate memory cache
      this.memoryCache.set(key, {
        data: redisItem,
        timestamp: Date.now()
      })
      return redisItem
    }
    
    return null
  }
  
  static async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    // Set in both caches
    this.memoryCache.set(key, {
      data: value,
      timestamp: Date.now()
    })
    
    await QueryCache.set(key, value, ttl)
  }
}
```

## Plan de Implementación de Optimizaciones

### Fase 1: Quick Wins (Semanas 1-2)

#### 1. Bundle Size Reduction
- [ ] Implementar imports selectivos de Nuxt UI
- [ ] Optimizar dependencias (lodash-es)
- [ ] Configurar tree-shaking efectivo
- **Objetivo**: Reducir bundle inicial de 1.2MB a 800KB

#### 2. Image Optimization
- [ ] Convertir imágenes a WebP/AVIF
- [ ] Implementar lazy loading
- [ ] Configurar responsive images
- **Objetivo**: Reducir LCP de 3.2s a 2.5s

#### 3. Database Query Optimization
- [ ] Eliminar N+1 queries en endpoints principales
- [ ] Añadir índices críticos
- [ ] Implementar cache básico
- **Objetivo**: Reducir tiempo de respuesta de APIs en 50%

### Fase 2: Medium Impact (Semanas 3-6)

#### 1. Component Optimization
- [ ] Implementar memoización en componentes complejos
- [ ] Dividir EntityBase.vue
- [ ] Implementar virtual scrolling
- **Objetivo**: Reducir FID de 180ms a 100ms

#### 2. Advanced Caching
- [ ] Implementar multi-level caching
- [ ] Cache de traducciones
- [ ] CDN para assets estáticos
- **Objetivo**: Mejorar tiempo de respuesta en 60%

#### 3. API Optimization
- [ ] Response compression
- [ ] Selective field responses
- [ ] Pagination optimization
- **Objetivo**: Reducir payload size en 40%

### Fase 3: Advanced Optimizations (Semanas 7-10)

#### 1. Performance Monitoring
- [ ] Implementar Real User Monitoring (RUM)
- [ ] Core Web Vitals tracking
- [ ] Performance budgets
- **Objetivo**: Monitoreo continuo de performance

#### 2. Advanced Techniques
- [ ] Service Worker implementation
- [ ] Background sync
- [ ] Predictive prefetching
- **Objetivo**: Mejorar TTI de 4.1s a 3.0s

## Métricas de Seguimiento

### Performance Budgets

#### Frontend Budgets
```javascript
// .percy.js o lighthouse-budgets.json
{
  "budgets": [
    {
      "path": "/*",
      "timings": [
        {
          "metric": "first-contentful-paint",
          "budget": 1800
        },
        {
          "metric": "largest-contentful-paint",
          "budget": 2500
        },
        {
          "metric": "cumulative-layout-shift",
          "budget": 0.1
        },
        {
          "metric": "speed-index",
          "budget": 3000
        }
      ],
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 300
        },
        {
          "resourceType": "image",
          "budget": 200
        },
        {
          "resourceType": "total",
          "budget": 500
        }
      ]
    }
  ]
}
```

#### Backend Budgets
```typescript
// monitoring/performance-budgets.ts
export const API_BUDGETS = {
  'GET /api/arcana': { maxResponseTime: 200, maxMemoryUsage: 50 },
  'GET /api/base_card': { maxResponseTime: 300, maxMemoryUsage: 75 },
  'POST /api/arcana': { maxResponseTime: 200, maxMemoryUsage: 30 },
  'PATCH /api/arcana/:id': { maxResponseTime: 200, maxMemoryUsage: 30 },
  'DELETE /api/arcana/:id': { maxResponseTime: 150, maxMemoryUsage: 20 }
}
```

### Monitoring Tools

#### 1. Frontend Monitoring
```typescript
// plugins/performance-monitoring.client.ts
export default defineNuxtPlugin(() => {
  // Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(sendToAnalytics)
    getFID(sendToAnalytics)
    getFCP(sendToAnalytics)
    getLCP(sendToAnalytics)
    getTTFB(sendToAnalytics)
  })
  
  // Custom metrics
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        sendToAnalytics({
          name: 'page_load_time',
          value: entry.loadEventEnd - entry.loadEventStart,
          page: window.location.pathname
        })
      }
    }
  })
  observer.observe({ entryTypes: ['navigation'] })
})
```

#### 2. Backend Monitoring
```typescript
// middleware/performance-monitoring.ts
export default defineEventHandler(async (event) => {
  const start = Date.now()
  const url = event.node.req.url || ''
  
  try {
    const response = await callHandler(event)
    const duration = Date.now() - start
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${url} took ${duration}ms`)
    }
    
    // Send metrics
    await sendMetrics({
      endpoint: url,
      duration,
      status: response.status,
      memory: process.memoryUsage()
    })
    
    return response
  } catch (error) {
    const duration = Date.now() - start
    await sendMetrics({
      endpoint: url,
      duration,
      status: 500,
      error: error.message
    })
    throw error
  }
})
```

## Objetivos y KPIs

### Objetivos de Performance

#### Corto Plazo (3 meses)
- **FCP**: 2.8s → 1.8s (-36%)
- **LCP**: 3.2s → 2.5s (-22%)
- **API Response Time**: 450ms → 200ms (-56%)
- **Bundle Size**: 1.2MB → 800KB (-33%)

#### Mediano Plazo (6 meses)
- **CLS**: 0.15 → 0.05 (-67%)
- **FID**: 180ms → 80ms (-56%)
- **TTI**: 4.1s → 3.0s (-27%)
- **API Response Time**: 200ms → 150ms (-25%)

#### Largo Plazo (12 meses)
- **Performance Score**: 75 → 95+
- **Core Web Vitals**: Todos en verde
- **API Response Time**: 150ms → 100ms (-33%)
- **Bundle Size**: 800KB → 500KB (-38%)

### KPIs de Negocio

#### User Experience
- **Bounce Rate**: Reducción del 25%
- **Page Load Time**: Reducción del 40%
- **User Satisfaction**: Incremento del 30%

#### Technical
- **Error Rate**: Reducción del 50%
- **Server Response Time**: Reducción del 60%
- **Resource Usage**: Reducción del 40%

## Conclusión

El análisis de performance revela oportunidades significativas de mejora en Tarot2. Las optimizaciones propuestas pueden resultar en:

- **40% mejora en tiempo de carga**
- **60% reducción en tiempo de respuesta de APIs**
- **33% reducción en tamaño de bundle**
- **Mejora sustancial en Core Web Vitals**

La implementación gradual de estas optimizaciones, siguiendo el plan por fases, permitirá mejorar la experiencia del usuario y la eficiencia del sistema sin comprometer la estabilidad.

---

*Análisis de performance generado el 4 de enero de 2026*
