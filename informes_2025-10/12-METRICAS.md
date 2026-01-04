# 📊 Métricas y KPIs - Tarot2

## 1. Métricas de Rendimiento

### 1.1 Latencia de Respuesta

| Endpoint | Objetivo | Actual | Estado |
|----------|----------|--------|--------|
| GET /api/world (lista) | < 200ms | Por medir | 📋 |
| GET /api/base_card (lista) | < 300ms | Por medir | 📋 |
| POST /api/*/publish | < 500ms | Por medir | 📋 |
| SSR /manage | < 300ms | Por medir | 📋 |
| SSR /admin | < 400ms | Por medir | 📋 |

### 1.2 Eficiencia de Cache

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Ratio 304/200 (listados) | ≥ 40% | Por medir | 📋 |
| Cache hit rate (ETag) | ≥ 50% | Por medir | 📋 |
| TTL promedio efectivo | > 60s | Por medir | 📋 |

### 1.3 Throughput

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Requests/segundo (peak) | > 100 | Por medir | 📋 |
| Usuarios concurrentes | > 50 | Por medir | 📋 |
| Rate limit hits (%) | < 1% | Por medir | 📋 |

---

## 2. Métricas de Calidad de Código

### 2.1 Deuda Técnica

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Componentes legacy | 0 | ~6 | ⚠️ |
| Uso de $fetch directo | 0 | ~5 | ⚠️ |
| Warnings ESLint | 0 | ~20 | ⚠️ |
| TODOs en código | < 10 | ~10 | ⚠️ |

### 2.2 Cobertura de Patrones

| Patrón | Objetivo | Actual | Estado |
|--------|----------|--------|--------|
| CommonDataTable en tablas | 100% | 90% | ⚠️ |
| EntityInspectorDrawer en previews | 100% | 90% | ⚠️ |
| FormModal en formularios | 100% | 85% | ⚠️ |
| useApiFetch en requests | 100% | 95% | ⚠️ |
| useEntityCapabilities | 100% | 80% | ⚠️ |

### 2.3 Complejidad

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Líneas promedio por componente | < 200 | ~150 | ✅ |
| Líneas promedio por composable | < 150 | ~100 | ✅ |
| Líneas promedio por handler | < 100 | ~80 | ✅ |
| Funciones con > 50 líneas | < 10 | ~15 | ⚠️ |

---

## 3. Métricas de i18n

### 3.1 Cobertura de Traducciones

| Área | EN | ES | Objetivo |
|------|----|----|----------|
| UI Labels | 100% | 100% | ✅ 100% |
| Mensajes | 100% | 100% | ✅ 100% |
| Errores | 100% | 100% | ✅ 100% |
| Tooltips | 90% | 85% | ⚠️ 100% |
| Placeholders | 95% | 90% | ⚠️ 100% |

### 3.2 Contenido de BD

| Entidad | EN | ES | Objetivo ES |
|---------|----|----|-------------|
| World | 100% | Por medir | 100% |
| Arcana | 100% | Por medir | 100% |
| Facet | 100% | Por medir | 100% |
| Skill | 100% | Por medir | 100% |
| Base Card | 100% | Por medir | 80% |
| Tag | 100% | Por medir | 100% |

### 3.3 Fallback Rate

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Fallback rate (ES→EN) | < 20% | Por medir | 📋 |
| Entidades sin traducción ES | < 50 | Por medir | 📋 |

---

## 4. Métricas de Seguridad

### 4.1 Autenticación

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Login failures/hora | < 100 | Por medir | 📋 |
| Token rejections/hora | < 50 | Por medir | 📋 |
| Sessions activas promedio | - | Por medir | 📋 |

### 4.2 Rate Limiting

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Rate limit hits (global) | < 1% | Por medir | 📋 |
| Rate limit hits (auth) | < 5% | Por medir | 📋 |
| Rate limit hits (publish) | < 1% | Por medir | 📋 |

### 4.3 Errores

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Errores 401/hora | < 100 | Por medir | 📋 |
| Errores 403/hora | < 50 | Por medir | 📋 |
| Errores 500/hora | < 10 | Por medir | 📋 |

---

## 5. Métricas Editoriales

### 5.1 Flujo de Contenido

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Publicaciones/semana | - | Por medir | 📋 |
| Revisiones pendientes | < 50 | Por medir | 📋 |
| Feedback abierto | < 100 | Por medir | 📋 |
| Time to publish (días) | < 7 | Por medir | 📋 |

### 5.2 Calidad de Contenido

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Reverts/semana | < 5 | Por medir | 📋 |
| Feedback ratio (issues/entidad) | < 0.5 | Por medir | 📋 |
| Entidades con effects inválidos | 0 | Por medir | 📋 |

---

## 6. Métricas de UX

### 6.1 Accesibilidad

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Lighthouse Accessibility | > 90 | Por medir | 📋 |
| Focus trap en modales | 100% | 90% | ⚠️ |
| aria-labels en botones | 100% | 70% | ⚠️ |
| Keyboard navigation | 100% | 85% | ⚠️ |

### 6.2 Usabilidad

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Clicks para crear entidad | < 3 | 2 | ✅ |
| Clicks para preview | < 2 | 1 | ✅ |
| Tiempo carga percibida (skeleton) | < 500ms | Por medir | 📋 |

---

## 7. Dashboard de Métricas (Propuesto)

### 7.1 Métricas en Tiempo Real

```
┌─────────────────────────────────────────────────────────────────┐
│                    TAROT2 METRICS DASHBOARD                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📈 Requests/min: 45        🕐 Avg latency: 150ms               │
│  📊 Cache hit: 55%          ❌ Error rate: 0.5%                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Latency Distribution (last hour)                        │   │
│  │  ████████████████████░░░░░░░░░░ p50: 120ms p99: 450ms   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Rate Limits (last hour)                                 │   │
│  │  Auth:    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.1%         │   │
│  │  Global:  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.0%         │   │
│  │  Publish: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.0%         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Alertas Propuestas

| Alerta | Condición | Severidad |
|--------|-----------|-----------|
| Latency spike | p99 > 1s por 5min | ⚠️ Warning |
| Error rate high | > 5% por 5min | 🔴 Critical |
| Rate limit storm | > 10% hits | ⚠️ Warning |
| Auth failures | > 100/hora | ⚠️ Warning |
| DB connection | pool exhausted | 🔴 Critical |

---

## 8. Plan de Implementación de Métricas

### 8.1 Fase 1: Logging Estructurado (Actual)

```typescript
// Ya implementado
logger.info({
  scope: 'world.list',
  page: 1,
  pageSize: 20,
  count: 15,
  timeMs: 45
})
```

### 8.2 Fase 2: Métricas OTLP (Planificado)

```typescript
// Propuesto
metrics.counter('tarot_requests_total', { endpoint, status })
metrics.histogram('tarot_request_duration_ms', duration, { endpoint })
metrics.gauge('tarot_active_sessions', activeCount)
```

### 8.3 Fase 3: Dashboard (Futuro)

- Grafana/Prometheus stack
- Dashboards por área (API, Auth, Editorial)
- Alertas configuradas

---

## 9. Benchmarks de Referencia

### 9.1 Comparación con Estándares

| Métrica | Tarot2 (Obj) | Industria | Estado |
|---------|--------------|-----------|--------|
| TTFB | < 200ms | < 500ms | ✅ |
| SSR Time | < 300ms | < 1s | ✅ |
| API Latency | < 200ms | < 500ms | ✅ |
| Error Rate | < 1% | < 5% | ✅ |
| Uptime | 99.9% | 99% | ✅ |

---

## 10. Cómo Medir

### 10.1 Métricas de Backend

```bash
# Logs estructurados
pnpm dev | pino-pretty

# Filtrar por scope
cat logs.json | jq 'select(.scope == "world.list")'

# Calcular promedio de latencia
cat logs.json | jq '[.timeMs] | add/length'
```

### 10.2 Métricas de Frontend

```javascript
// En consola del navegador
performance.getEntriesByType('navigation')[0].responseStart

// Lighthouse CLI
lighthouse http://localhost:3000/manage --only-categories=accessibility
```

### 10.3 Métricas de BD

```sql
-- Queries lentas
SELECT query, calls, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Conexiones activas
SELECT count(*) FROM pg_stat_activity;
```

---

*Este documento define las métricas y KPIs de Tarot2. Para sugerencias de funcionalidades, consultar SUGERENCIAS.md.*
