# 📋 Resumen Ejecutivo - Tarot2

## 1. Visión General del Proyecto

**Tarot2** es una plataforma de gestión de contenido (CMS) diseñada específicamente para administrar el universo de cartas, mundos y reglas del sistema de juego de rol Tarot. El sistema está pensado para ser adaptable a múltiples mundos de fantasía o ambientaciones, permitiendo gestionar colecciones de cartas personalizadas.

### 1.1 Contexto del Negocio

El juego Tarot es un sistema de rol universal que organiza los atributos de personajes en tres Arcanos principales:

| Arcano | Facetas | Enfoque |
|--------|---------|---------|
| **Físico** | Fuerza, Agilidad, Vigor | Cuerpo, materia, acción directa |
| **Mental** | Ingenio, Percepción, Erudición | Mente, lógica, conocimiento |
| **Espiritual** | Voluntad, Carisma, Alma | Espíritu, voluntad, fuerza interior |

### 1.2 Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  Nuxt 4 (SSR) + Vue 3 + Nuxt UI 4 + TailwindCSS + Pinia    │
│  Composables auto-importados + i18n (EN/ES)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│  Nuxt 4/H3 (Nitro) + Kysely (ORM tipado) + Zod (validación)│
│  JWT Auth + Rate Limiting + Pino Logger                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BASE DE DATOS                           │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL + Tablas traducibles (_translations)            │
│  Enums: card_status, release_stage, user_status             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Estado Actual del Proyecto

### 2.1 Madurez por Área

| Área | Estado | Progreso |
|------|--------|----------|
| **Manage (Frontend)** | Producción | 90% migrado a patrones modernos |
| **Admin (Frontend)** | En transición | Mezcla Legacy + Moderno |
| **Backend API** | Producción | CRUD consolidado con helpers |
| **Seguridad** | Producción | JWT + Rate limit + Permisos |
| **i18n** | Completo | Cobertura EN/ES al 100% |
| **Editorial** | Producción | Versiones, revisiones, feedback |

### 2.2 Métricas Clave del Código

| Métrica | Valor |
|---------|-------|
| **Componentes Vue** | ~60 componentes organizados |
| **Composables** | ~40 composables especializados |
| **Endpoints API** | ~80 handlers RESTful |
| **Entidades gestionadas** | 14 tipos de entidad |
| **Líneas de documentación** | ~5,000+ líneas en docs/ |

---

## 3. Fortalezas del Proyecto

### ✅ Arquitectura Sólida
- Patrones compartidos bien definidos (`useEntity`, `createCrudHandlers`)
- Separación clara Admin/Manage con bridges reutilizables
- Wrapper `useApiFetch` para coherencia SSR

### ✅ Sistema Multi-idioma Robusto
- Fallback automático a inglés cuando falta traducción
- Indicadores visuales de idioma resuelto
- CRUD con soporte de borrado selectivo por idioma

### ✅ Pipeline Editorial Completo
- Sistema de versiones semánticas
- Revisiones con diff y revert
- Feedback con workflow de resolución

### ✅ Seguridad Integral
- JWT con cookies HttpOnly, SameSite strict
- Rate limiting por IP y usuario
- Permisos granulares basados en roles

### ✅ Documentación Extensa
- 12+ documentos técnicos detallados
- Guías de arquitectura y patrones
- Reglas de edición para desarrollo asistido

---

## 4. Áreas de Mejora Identificadas

### ⚠️ Deuda Técnica Controlada
- Tablas legacy pendientes de migración (`VersionList`, `RevisionsTable`)
- Modal `PreviewModal` debe migrar a `EntityInspectorDrawer`
- Uso de `$fetch` directo en algunos composables

### ⚠️ Observabilidad Limitada
- Faltan métricas editoriales en tiempo real
- No hay correlación `requestId` end-to-end completa
- Dashboard de cobertura i18n pendiente

### ⚠️ Testing Manual
- Suite de tests automatizados no implementada
- Dependencia de checklist manual para QA

---

## 5. Decisiones Arquitectónicas Clave

### 5.1 Invariantes del Sistema

| Invariante | Descripción |
|------------|-------------|
| **Tabla unificada** | Toda tabla usa `CommonDataTable` + bridges |
| **Preview unificado** | `EntityInspectorDrawer` para previsualizaciones |
| **Formularios preseteados** | `FormModal` + `entityFieldPresets` |
| **CRUD unificado** | `createCrudHandlers` en backend |
| **Capabilities declarativas** | `useEntityCapabilities` para configuración |

### 5.2 Patrones de Diseño

```
Frontend Flow:
  useEntity → ManageTableBridge → CommonDataTable → EntityInspectorDrawer

Backend Flow:
  H3 Handler → buildFilters → createPaginatedResponse → Kysely Query

i18n Flow:
  Request(lang) → COALESCE(lang, 'en') → markLanguageFallback → Response
```

---

## 6. Roadmap Resumido

### Fase 0 - Cimientos (Inmediata)
- ✅ Rate limiting implementado
- ✅ Logout seguro con limpieza de cookie
- 🔄 Migrar `$fetch` residual a `useApiFetch`

### Fase 1 - Convergencia UI
- Migrar tablas legacy → AdminTableBridge
- Eliminar PreviewModal → EntityInspectorDrawer
- Normalizar USelectMenu a v-model

### Fase 2 - Observabilidad
- Implementar `useRequestMetrics`
- Añadir `requestId` correlacionado
- Optimizar preview SSR con lazy-load

### Fase 3 - Expansión Narrativa
- Effect System 2.0 (editor guiado)
- Metadata extendida para mundos/mazos
- Dashboard i18n

---

## 7. Conclusiones

### 7.1 Valoración General

Tarot2 es un proyecto **maduro y bien arquitectado** que demuestra:

- **Excelente separación de responsabilidades** entre capas
- **Patrones consistentes** que facilitan el mantenimiento
- **Documentación exhaustiva** para onboarding y desarrollo
- **Visión clara** del roadmap evolutivo

### 7.2 Recomendaciones Prioritarias

1. **Completar migraciones de fase 1** para eliminar deuda técnica
2. **Implementar testing automatizado** para garantizar regresiones
3. **Activar observabilidad** para monitoreo proactivo
4. **Preparar Effect System 2.0** como siguiente funcionalidad mayor

### 7.3 Riesgos a Monitorear

- SQL compleja en `_crud.ts` requiere pruebas multi-idioma
- Flujos editoriales sin métricas pueden ocultar problemas
- Import/export sin límites fuertes podría introducir datos corruptos

---

## 8. Métricas de Éxito Propuestas

| KPI | Objetivo | Estado Actual |
|-----|----------|---------------|
| SSR latency `/manage` | < 300ms | Por medir |
| Ratio 304/200 | ≥ 40% | Por medir |
| Cobertura i18n | 100% EN/ES | ✅ Cumplido |
| Componentes legacy | 0 | ~5 pendientes |
| Errores 4xx/5xx | < 1% requests | Por medir |

---

*Este resumen ejecutivo proporciona una visión de alto nivel del estado, fortalezas y áreas de mejora de Tarot2. Para análisis detallado, consultar los documentos específicos del dossier.*
