# 📊 Estado Actual del Proyecto - Tarot2

## 1. Resumen de Estado

| Área | Madurez | Producción | Observaciones |
|------|---------|------------|---------------|
| **Arquitectura** | ⭐⭐⭐⭐ | ✅ Sí | Patrones consolidados |
| **Frontend Manage** | ⭐⭐⭐⭐ | ✅ Sí | 90% en patrones modernos |
| **Frontend Admin** | ⭐⭐⭐ | ⚠️ Parcial | Mezcla legacy/moderno |
| **Backend API** | ⭐⭐⭐⭐⭐ | ✅ Sí | CRUD robusto |
| **Seguridad** | ⭐⭐⭐⭐ | ✅ Sí | JWT + Rate limit |
| **i18n** | ⭐⭐⭐⭐⭐ | ✅ Sí | Cobertura completa |
| **Editorial** | ⭐⭐⭐⭐ | ✅ Sí | Versiones + revisiones |
| **Documentación** | ⭐⭐⭐⭐ | ✅ Sí | Extensa y actualizada |
| **Testing** | ⭐⭐ | ❌ No | Solo manual |

---

## 2. Inventario de Código

### 2.1 Estructura de Archivos

```
tarot2/
├── app/                    # Frontend
│   ├── components/         # ~60 componentes Vue
│   ├── composables/        # ~40 composables
│   ├── pages/              # ~15 páginas
│   └── directives/         # 1 directiva (v-can)
│
├── server/                 # Backend
│   ├── api/                # ~80 handlers
│   ├── middleware/         # 3 middlewares
│   ├── plugins/            # 4 plugins
│   └── utils/              # ~15 utilidades
│
├── docs/                   # ~12 documentos técnicos
├── informes/               # ~12 informes de desarrollo
└── i18n/                   # 2 locales (EN, ES)
```

### 2.2 Métricas de Código

| Métrica | Valor |
|---------|-------|
| Componentes Vue | ~60 |
| Composables | ~40 |
| API Handlers | ~80 |
| Líneas de código (estimado) | ~25,000 |
| Líneas de documentación | ~5,000 |
| Entidades de dominio | 14 |
| Endpoints API | ~80 |

---

## 3. Estado por Área Funcional

### 3.1 Manage (/manage)

| Funcionalidad | Estado | Cobertura |
|---------------|--------|-----------|
| Listado de entidades | ✅ Producción | 100% |
| CRUD completo | ✅ Producción | 100% |
| Filtros avanzados | ✅ Producción | 100% |
| Búsqueda | ✅ Producción | 100% |
| Paginación | ✅ Producción | 100% |
| Multiidioma | ✅ Producción | 100% |
| Vista tabla | ✅ Producción | 100% |
| Vista cards | ✅ Producción | 100% |
| Preview drawer | ✅ Producción | 100% |
| Tags | ✅ Producción | 100% |
| Bulk actions | ⚠️ Parcial | 70% |
| Import/Export | ✅ Producción | 100% |

**Componentes Legacy en Manage:**
- `EntityTableWrapper.vue` - A migrar
- `PreviewModal.vue` - A migrar a drawer

### 3.2 Admin (/admin)

| Funcionalidad | Estado | Cobertura |
|---------------|--------|-----------|
| Dashboard home | ✅ Producción | 100% |
| Gestión usuarios | ⚠️ Parcial | 80% |
| Gestión roles | ⚠️ Parcial | 70% |
| Versiones | ⚠️ Legacy | 60% |
| Revisiones | ⚠️ Legacy | 70% |
| Feedback | ✅ Producción | 90% |
| Import/Export DB | ✅ Producción | 100% |

**Componentes Legacy en Admin:**
- `VersionList.vue` - Tabla HTML manual
- `UserTable.vue` - Usa EntityTableWrapper
- `RoleForm.vue` - Formulario manual
- `RevisionsTable.vue` - Bridge parcial

### 3.3 Backend API

| Área | Estado | Endpoints |
|------|--------|-----------|
| Auth | ✅ Producción | 2 |
| Users | ✅ Producción | 6 |
| Roles | ✅ Producción | 5 |
| World | ✅ Producción | 8 |
| Arcana | ✅ Producción | 8 |
| Facet | ✅ Producción | 8 |
| Skill | ✅ Producción | 8 |
| Base Card | ✅ Producción | 8 |
| World Card | ✅ Producción | 8 |
| Card Type | ✅ Producción | 8 |
| Tag | ✅ Producción | 9 |
| Content Versions | ✅ Producción | 6 |
| Content Revisions | ✅ Producción | 5 |
| Content Feedback | ✅ Producción | 5 |
| Uploads | ✅ Producción | 1 |
| Database | ✅ Producción | 4 |

---

## 4. Patrones Implementados

### 4.1 Patrones Consolidados ✅

| Patrón | Descripción | Adopción |
|--------|-------------|----------|
| Bridge Tables | ManageTableBridge, AdminTableBridge | 90% |
| CommonDataTable | Tabla unificada con slots | 100% |
| EntityInspectorDrawer | Preview accesible | 90% |
| FormModal + Presets | Formularios declarativos | 85% |
| useEntity | CRUD genérico SSR | 100% |
| useEntityCapabilities | Config declarativa | 80% |
| createCrudHandlers | Factoría backend | 100% |
| buildFilters | Paginación/ordenación | 100% |
| translatableUpsert | CRUD multiidioma | 100% |

### 4.2 Patrones Pendientes de Adopción ⚠️

| Patrón | Estado | Bloqueador |
|--------|--------|------------|
| useTableSelection | ✅ **Implementado** | - |
| BulkActionsBar compartida | ✅ **Implementado** | - |
| useServerPagination | No implementado | Tiempo |
| Skeletons reutilizables | ✅ Usa `<USkeleton>` de Nuxt UI | - |

> **Nota:** La revisión de código reveló que `useTableSelection` y `BulkActionsBar` ya están implementados, contradiciendo informes previos.

---

## 5. Deuda Técnica

### 5.1 Frontend - Alta Prioridad

| Deuda | Impacto | Esfuerzo | Ubicación |
|-------|---------|----------|-----------|
| Migrar VersionList → AdminTableBridge | Alto | Medio | admin/VersionList.vue |
| Migrar RevisionsTable completamente | Alto | Medio | admin/RevisionsTable.vue |
| Eliminar PreviewModal | Alto | Bajo | manage/modal/PreviewModal.vue |
| Migrar UserTable → AdminTableBridge | Medio | Medio | admin/users/UserTable.vue |
| Migrar RoleForm → FormModal | Medio | Medio | admin/RoleForm.vue |

### 5.2 Frontend - Media Prioridad

| Deuda | Impacto | Esfuerzo | Ubicación |
|-------|---------|----------|-----------|
| Reemplazar $fetch → useApiFetch | Medio | Bajo | stores/user.ts |
| Normalizar USelectMenu a v-model | Bajo | Bajo | Múltiples archivos |
| Añadir aria-label a botones icónicos | Bajo | Bajo | Múltiples archivos |
| Eliminar EntityTableWrapper | Bajo | Medio | manage/EntityTableWrapper.vue |

### 5.3 Backend - Pendientes

| Deuda | Impacto | Esfuerzo | Ubicación |
|-------|---------|----------|-----------|
| Helper SQL tags AND/ANY | Medio | Medio | utils/tags.ts (crear) |
| Límites en import/export | Medio | Bajo | api/database/*.ts |
| Métricas editoriales | Bajo | Medio | api/content_versions/*.ts |

---

## 6. Auditorías Realizadas

### 6.1 Auditoría Nuxt (Noviembre 2024)

**Hallazgos Principales:**
- ✅ Estructura de proyecto correcta
- ⚠️ Uso de `$fetch` directo en algunos lugares
- ⚠️ Falta de `routeRules` para caching
- ❌ No hay `defineNuxtRouteMiddleware` para cliente

**Acciones Tomadas:**
- Documentadas en `informes/AUDITORIA NUXT.md`
- Roadmap de modernización definido

### 6.2 Auditoría Nuxt UI (Noviembre 2024)

**Hallazgos Principales:**
- ✅ Mayoría de componentes siguen MCP
- ⚠️ 9 hallazgos críticos (tablas legacy, modales)
- ⚠️ 14 hallazgos medios (v-model, aria)
- ⚠️ 18 hallazgos menores

**Quick Wins Identificados:**
1. Añadir v-model:open en modales
2. Agregar aria-label a botones icónicos
3. Cambiar :model-value a v-model
4. Ajustar clearable a booleano

---

## 7. Dependencias

### 7.1 Dependencias Principales

```json
{
  "nuxt": "^4.2.1",
  "@nuxt/ui": "4.2.1",
  "@nuxtjs/i18n": "^10.2.1",
  "pinia": "^3.0.4",
  "kysely": "^0.28.8",
  "zod": "^4.1.12",
  "vue": "^3.5.24"
}
```

### 7.2 Dependencias de Desarrollo

```json
{
  "typescript": "^5.9.3",
  "eslint": "^9.39.1",
  "prettier": "^3.6.2",
  "tailwindcss": "^4.1.17"
}
```

### 7.3 Estado de Dependencias

| Dependencia | Versión | Estado |
|-------------|---------|--------|
| Nuxt | 4.2.1 | ✅ Actualizado |
| Nuxt UI | 4.2.1 | ✅ Actualizado |
| Vue | 3.5.24 | ✅ Actualizado |
| Kysely | 0.28.8 | ✅ Actualizado |
| Zod | 4.1.12 | ✅ Actualizado |
| Sharp | 0.34.4 | ✅ Actualizado |

---

## 8. Configuración de Entorno

### 8.1 Variables Requeridas

```bash
DATABASE_URL=postgresql://user:pass@host:5432/tarot2
JWT_SECRET=<secreto-seguro-256-bits>
```

### 8.2 Variables Opcionales

```bash
JWT_EXPIRES_IN=1d
LOG_LEVEL=info
NODE_ENV=development|production
```

---

## 9. Scripts Disponibles

```bash
pnpm dev          # Desarrollo
pnpm build        # Build producción
pnpm preview      # Preview de build
pnpm lint         # Linting ESLint
pnpm format       # Formateo Prettier
pnpm typecheck    # Verificación TypeScript
pnpm db:migrate   # Ejecutar migraciones
pnpm db:codegen   # Generar tipos Kysely
```

---

## 10. Documentación Existente

### 10.1 En /docs

| Documento | Propósito | Actualizado |
|-----------|-----------|-------------|
| PROJECT_INFO.md | Visión general | ✅ Reciente |
| ARCHITECTURE_GUIDE.md | Guía arquitectónica | ✅ Reciente |
| API.MD | Documentación API | ✅ Reciente |
| SERVER.md | Backend detallado | ✅ Reciente |
| SECURITY.md | Seguridad | ✅ Reciente |
| effect-system.md | Sistema de efectos | ✅ Reciente |
| SCHEMA POSTGRES.TXT | Esquema BD | ✅ Reciente |

### 10.2 En /informes

| Documento | Propósito | Actualizado |
|-----------|-----------|-------------|
| ROADMAP.md | Plan de trabajo | ✅ Reciente |
| BRAINSTORMING.md | Ideas y mejoras | ✅ Reciente |
| GLOBAL.md | Estado arquitectura | ✅ Reciente |
| COMPONENTS.md | Estado componentes | ✅ Reciente |
| COMPOSABLES.md | Estado composables | ✅ Reciente |
| SERVER.md | Estado backend | ✅ Reciente |
| AUDITORIA NUXT.md | Auditoría Nuxt | ✅ Reciente |
| AUDITORIA-NUXTUI.md | Auditoría Nuxt UI | ✅ Reciente |

---

## 11. Riesgos Activos

### 11.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| SQL compleja rompe filtros | Media | Alto | Tests multi-idioma |
| Rate limit en memoria (multi-nodo) | Baja | Medio | Considerar Redis |
| Permisos divergentes front/back | Baja | Alto | useEntityCapabilities centralizado |

### 11.2 Riesgos de Proyecto

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Deuda técnica acumulada | Media | Medio | Roadmap priorizado |
| Falta de testing automatizado | Alta | Alto | Implementar suite |
| Documentación desactualizada | Baja | Medio | Revisión post-fase |

---

## 12. Próximos Hitos

### 12.1 Inmediato (1-2 semanas)

- [ ] Completar migraciones Admin a bridges
- [ ] Eliminar PreviewModal
- [ ] Normalizar v-model en componentes

### 12.2 Corto Plazo (1 mes)

- [ ] Implementar useTableSelection
- [ ] Crear BulkActionsBar compartida
- [ ] Helper SQL para tags

### 12.3 Medio Plazo (2-3 meses)

- [ ] Observabilidad con métricas
- [ ] Effect System 2.0 en formularios
- [ ] Suite de testing básica

---

*Este documento describe el estado actual de Tarot2. Para información sobre la evolución histórica, consultar 09-EVOLUCION.md.*
