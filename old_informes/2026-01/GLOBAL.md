# Informe global de arquitectura Tarot2

## Índice
1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Capas del sistema](#2-capas-del-sistema)
3. [Frontend: patrones e invariantes](#3-frontend-patrones-e-invariantes)
4. [Backend: servicios y middleware](#4-backend-servicios-y-middleware)
5. [Datos, entidades y multi-idioma](#5-datos-entidades-y-multi-idioma)
6. [Invariantes transversales](#6-invariantes-transversales)
7. [Zonas legacy o en transición](#7-zonas-legacy-o-en-transición)
8. [Áreas de riesgo](#8-áreas-de-riesgo)
9. [Buenas prácticas recomendadas](#9-buenas-prácticas-recomendadas)
10. [Métricas clave](#10-métricas-clave)
11. [Próximos pasos](#11-próximos-pasos)

## 1. Resumen ejecutivo
Tarot2 es una plataforma Nuxt 4 con SSR completo que integra paneles Manage/Admin sobre Nuxt UI 4 y un backend H3/Kysely conectado a PostgreSQL multi-idioma. La estrategia actual prioriza patrones convergentes (CommonDataTable, EntityInspectorDrawer, FormModal), contratos API tipados y flujos editoriales versionados. El foco inmediato es cerrar brechas legacy, reforzar seguridad (rate limiting, logout), consolidar capabilities declarativas y preparar observabilidad ligera.

## 2. Capas del sistema
| Capa | Artefactos clave | Responsabilidades |
| --- | --- | --- |
| Presentación | Nuxt 4, Nuxt UI 4, TailwindCSS, componentes en `app/components` | Render SSR/SPA, accesibilidad, interacciones UI coherentes.@app/components/manage/EntityBase.vue#22-232@
| Lógica cliente | Composables (`app/composables`), Pinia-like pattern | CRUD genérico (`useEntity`), filtros sincronizados (`useQuerySync`), capabilities y modales.@app/composables/manage/useEntity.ts#1-392@
| API | H3 handlers en `server/api/<entity>` | CRUD, batch, editoriales, auth, import/export, uploads.@server/api/world/_crud.ts#19-195@
| Persistencia | PostgreSQL (`docs/SCHEMA POSTGRES..TXT`), enums, traducciones | Modelo relacional con entidades base, tablas `_translations`, relaciones tags y efectos JSON.@

## 3. Frontend: patrones e invariantes
1. **Manage (`/manage`)**: `EntityBase.vue` coordina filtros (`ManageEntityFilters`, `AdvancedFiltersPanel`), vistas (tabla/cards/carta), modales y preview drawer.@app/components/manage/EntityBase.vue#22-232@
2. **Admin (`/admin`)**: dashboards (`FeedbackList`, `RevisionsTable`, `ManageUsers`) reutilizan bridges, filtros avanzados y drawers.@app/components/admin/FeedbackList.vue#1-380@
3. **Componentes comunes**: `CommonDataTable`, `StatusBadge`, `EntityInspectorDrawer`, `BulkActionsBar` (en diseño) definen la base compartida.@app/components/common/CommonDataTable.vue#1-320@
4. **SSR/Reactive flow**: vistas usan `useAsyncData`/`useApiFetch`, `useListMeta`, `useEntityCapabilities` para capacidades declarativas.@app/composables/common/useEntityCapabilities.ts#1-158@

## 4. Backend: servicios y middleware
1. **Plugins**: `db.ts` (Kysely/PostgresDialect), `auth.ts` (bcrypt + JOSE), `logger.ts` (Pino).@server/plugins/db.ts#1-80@
2. **Middleware**: `00.auth.hydrate`, `01.auth.guard`, `02.rate-limit` (pendiente adoption total).@server/middleware/02.rate-limit.ts#1-140@
3. **CRUD pattern**: `createCrudHandlers` orquesta `index`, `show`, `create`, `update`, `delete`, `batch`, `export`, `import` usando `buildFilters`, `translatableUpsert`, `deleteLocalizedEntity` y logging unificado.@server/utils/createCrudHandlers.ts#1-240@
4. **Editorial**: `content_versions`, `content_revisions`, `content_feedback` exponen flujos publish/revert, bulk approvals, feedback multi-idioma.@server/api/content_versions/publish.post.ts#1-200@
5. **Servicios adicionales**: uploads (`server/api/uploads/index.post.ts`), import/export (`server/api/database/*`), auth JWT.

## 5. Datos, entidades y multi-idioma
1. **Esquema base**: tablas principales (`worlds`, `arcana`, `base_cards`, `card_types`, `facets`, `skills`, `world_cards`, `tags`, `users`, `roles`) con claves primarias y metadata estructurada.@docs/SCHEMA POSTGRES..TXT#1-884@
2. **Traducciones**: cada entidad traducible posee `*_translations` con `language_code`, fallback EN gestionado por SQL + `markLanguageFallback`.
3. **Tags**: `tag_links` relaciona entidades usando dominio `entity_type` (invariante compartido).
4. **Effects JSON**: `effects` (JSONB) para facets/skills/world_cards requiere mantener shape esperada por UI y backend.@server/api/world_card/_crud.ts#43-232@

## 6. Invariantes transversales
1. **Contratos API** `{ success, data, meta? }` con `createPaginatedResponse` y `createResponse`.@server/utils/response.ts#24-95@
2. **Filtrado/paginación** exclusivamente via `buildFilters` (rango fechas, tags, sort whitelists).@server/utils/filters.ts#40-158@
3. **Internacionalización de CRUD** con `translatableUpsert`/`deleteLocalizedEntity`; borrado EN elimina entidad completa.@server/utils/translatableUpsert.ts#83-190@
4. **SSR-first**: `useApiFetch` + `useAsyncData` y ETag 304 obligatorios en vistas conectadas a API.
5. **Capabilities**: configuraciones declarativas vía `useEntityCapabilities` definen acciones disponibles (preview, tags, traducciones).
6. **Seguridad**: middleware auth, permisos JSONB, rate limit pendiente, logging Pino con contexto (`entity`, `lang`, `timeMs`).

## 7. Zonas legacy o en transición
1. `EntityTableWrapper.vue` y `EntityTable.vue` (Manage/Admin Users) replican features ya cubiertas por `CommonDataTable` y bridges.@app/components/manage/EntityTableWrapper.vue#1-107@
2. `PreviewModal.vue` sigue activo como modal heredado en Manage.@app/components/manage/modal/PreviewModal.vue#1-47@
3. Tablas Admin (`VersionList.vue`, `users/UserTable.vue`) renderizan `<table>` manual o wrapper legacy.@app/components/admin/VersionList.vue#1-86@
4. Formularios Admin (`VersionModal.vue`, `RoleForm.vue`) no reutilizan `FormModal` ni presets declarativos.@app/components/admin/RoleForm.vue#1-84@
5. Endpoints front con `$fetch` suelto deben migrarse a `useApiFetch` (ver ManageUsers, algunos dashboards Admin).@

## 8. Áreas de riesgo
1. **SQL compleja** en `_crud.ts` (world_card, facet, skill): riesgo de romper filtros multi-idioma/tags.@server/api/world_card/_crud.ts#19-228@
2. **Editorial publish/revert** sin rate limit ni métricas consistentes.
3. **Borrado EN** elimina entidad completa; requiere confirmaciones UI estrictas.
4. **Import/export** sin límites fuertes de tamaño/formato.
5. **Desfase capabilities/permissions** si frontend/back divergen.

## 9. Buenas prácticas recomendadas
1. Seguir pipeline DB → API → composable → componente documentando invariantes.
2. Reutilizar CommonDataTable, bridges, EntityInspectorDrawer, FormModal antes de crear variantes.
3. Usar `useApiFetch` para lecturas/escrituras; prohibir `$fetch` directo salvo utilidades internas.
4. Agregar checklist de accesibilidad y telemetría ligera tras cada feature.
5. Registrar excepciones en `/informes` y codemaps, manteniendo las reglas Windsurf actualizadas.

## 10. Métricas clave
1. **SSR latency** `< 300 ms` para `/manage` y vistas administrativas críticas (medir en Pino + `useRequestMetrics`).
2. **304/200 ratio** ≥ 40 % en listados tras primer request.
3. **Cobertura i18n** (% campos traducidos vs base EN por entidad).
4. **Publish lead time** (aprobado → publicado) registrado en `content_versions`.
5. **Errores 4xx/5xx controlados** por endpoint, correlacionados con `entity_type` y usuario.

## 11. Próximos pasos
1. Completar migraciones de tablas, previews y formularios a patrones modernos (Fase 1).
2. Activar rate limit y logout seguro, consolidar helper SQL de tags y `useServerPagination` (Fase 0/1).
3. Instrumentar telemetría ligera, métricas editoriales y dashboards i18n (Fase 2).
4. Preparar Effect System 2.0 y metadata extendida para entidades narrativas (Fase 3).
