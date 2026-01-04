# Informe técnico: Server + API Tarot2

## Índice
1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura base](#2-arquitectura-base)
3. [Middleware y seguridad](#3-middleware-y-seguridad)
4. [Patrones CRUD por entidad](#4-patrones-crud-por-entidad)
5. [Editorial y operaciones avanzadas](#5-editorial-y-operaciones-avanzadas)
6. [Integración con PostgreSQL](#6-integración-con-postgresql)
7. [Contratos y utilidades transversales](#7-contratos-y-utilidades-transversales)
8. [Zonas legacy o pendientes](#8-zonas-legacy-o-pendientes)
9. [Áreas de riesgo](#9-áreas-de-riesgo)
10. [Buenas prácticas](#10-buenas-prácticas)
11. [Roadmap backend](#11-roadmap-backend)

## 1. Resumen ejecutivo
El backend de Tarot2 combina Nuxt 4/H3, Kysely y Zod para exponer APIs tipadas y multi-idioma sobre PostgreSQL. La arquitectura agrupa handlers por entidad (`server/api/<entity>`), reusa `createCrudHandlers`, `buildFilters` y utilidades de traducción (`translatableUpsert`, `deleteLocalizedEntity`). Prioridades inmediatas: aplicar rate limiting uniforme, limpiar logout, consolidar helpers SQL de tags, fortalecer observabilidad editorial.

## 2. Arquitectura base
1. **Plugins**: `db.ts` (Kysely/PostgresDialect), `auth.ts` (bcrypt + JOSE), `logger.ts` (Pino) habilitan acceso a DB, autenticación y logging estructurado.@server/plugins/db.ts#1-80@server/plugins/auth.ts#1-210@
2. **Organización**: cada entidad dispone de `index`, `[id]`, `batch`, `export`, `import` implementados mediante `createCrudHandlers`.
3. **Alcance**: entidades principales (`world`, `world_card`, `arcana`, `base_card`, `skill`, `facet`, `tag`, `user`, `role`) más módulos editoriales (`content_versions`, `content_revisions`, `content_feedback`) siguen el mismo patrón.@docs/SERVER.md#285-335@

## 3. Middleware y seguridad
1. `00.auth.hydrate`: verifica cookie `auth_token`, carga usuario y permisos agregados.@docs/SERVER.md#128-140@
2. `01.auth.guard`: protege `/api/*`, valida roles/capabilities y corta sesiones suspendidas.@docs/API.MD#31-42@
3. `02.rate-limit`: disponible pero aún no aplicado de forma consistente en login/logout/publish/revert; usa buckets Pino y cabeceras `Retry-After`.@server/middleware/02.rate-limit.ts#1-140@
4. Falta limpiar cookie `auth_token` en `POST /api/auth/logout` (`setCookie(name, '', { maxAge: 0 })`), pendiente crítico.

## 4. Patrones CRUD por entidad
1. **Listados**: `buildFilters` aplica búsqueda (col/SQL custom), orden whitelisted, paginación y conteo total/distinct.@server/utils/filters.ts#40-158@
2. **Mutaciones**: `translatableUpsert` y `deleteLocalizedEntity` aseguran integridad multi-idioma con transacciones y logging.@server/utils/translatableUpsert.ts#83-190@server/utils/deleteLocalizedEntity.ts#21-97@
3. **Consultas complejas**: `_crud.ts` (arcana, world, facet, skill, world_card) combinan joins de traducciones, tags y usuarios para producir rows listos para UI.@server/api/world_card/_crud.ts#19-228@
4. **Batch/export/import**: `server/api/database` ofrece export/import JSON/SQL; handlers de entidad reutilizan utilidades compartidas.

## 5. Editorial y operaciones avanzadas
1. `content_versions`: CRUD + publish (`publish.post.ts`) gestionan releases, necesitan métricas adicionales y rate limiting.@server/api/content_versions/publish.post.ts#1-200@
2. `content_revisions`: soporta revert `[id]/revert.post.ts`, bulk approve/reject, logging detallado.
3. `content_feedback`: filtros complejos (entidad, idioma, status, rango fechas) y previews reutilizando `useEntityPreviewFetch` en frontend.@server/api/content_feedback/index.get.ts#28-136@
4. Uploads AVIF (`server/api/uploads/index.post.ts`) y endpoints de auth completan el ecosistema.

## 6. Integración con PostgreSQL
1. `server/database/types.ts` refleja el schema real (enums `card_status`, `release_stage`, `user_status`, `feedback_status`).@server/database/types.ts#1-400@
2. Tablas `_translations` utilizan `language_code`; fallback EN se marca con `markLanguageFallback` tras queries.
3. Relaciones y efectos: `world_cards` combinan `worlds`, `base_cards`, overrides y `effects` JSONB; `facets`/`skills` enlazan con `effects` y tags.
4. Editorial: `content_versions`, `content_revisions`, `content_feedback` guardan trazabilidad (usuarios, timestamps, estados).

## 7. Contratos y utilidades transversales
1. Respuestas `{ success, data, meta }` generadas via `createResponse` y `createPaginatedResponse` (incluye `lang`, `search`, `count`).@server/utils/response.ts#24-95@
2. `buildFilters` protege contra sort arbitrario, soporta rangos (`created`, `resolved`) y conteo distinct.
3. `translatableUpsert`/`deleteLocalizedEntity` registran operaciones (`scope`, `id`, `lang`, `created`) en logger; borrar EN elimina entidad completa.
4. Logging Pino se integra en cada handler (`timeMs`, `filters`, `lang`, `count`).

## 8. Zonas legacy o pendientes
1. Logout sin limpieza de cookie incumple SECURITY.
2. Falta helper SQL compartido para agregación de tags (AND vs ANY) replicado en varios `_crud.ts`.
3. Rate limit no aplicado sistemáticamente en publish/revert y endpoints editoriales.
4. Algunos consumidores frontend aún usan `$fetch` directo, perdiendo beneficios de ETag/logging.

## 9. Áreas de riesgo
1. **SQL compleja** (world_card, facet, skill): un cambio sin pruebas multi-idioma/tags puede romper Manage/Admin.
2. **Flujos editoriales** sin rate limiting ni métricas claras pueden saturar logs o publicar contenido incorrecto.
3. **Import/export** sin límites fuertes puede introducir DoS o datos corruptos.
4. **Tags** con semánticas distintas (ANY vs AND) generan resultados inconsistentes; urge helper único.
5. **Permisos**: divergencias entre backend y `useEntityCapabilities` abren acciones no deseadas.

## 10. Buenas prácticas
1. Reutilizar `createCrudHandlers`, `buildFilters`, `translatableUpsert` en cualquier handler nuevo.
2. Aplicar `02.rate-limit` a endpoints sensibles antes de exponerlos públicamente.
3. Mantener logs con `scope`, `entity`, `user_id`, `timeMs`, `requestId` para correlación front-back.
4. Validar payloads con Zod, asegurando compatibilidad con presets de formularios.
5. Coordinar cambios de schema con frontend/composables y actualizar codemaps + informes.

## 11. Roadmap backend
| Prioridad | Acción | Impacto |
| --- | --- | --- |
| Alta | Aplicar rate limiting en auth/editorial y limpiar cookie en logout. | Seguridad y cumplimiento inmediato. |
| Alta | Extraer helper SQL para agregación de tags (AND vs ANY) y documentarlo. | Consistencia en filtros Manage/Admin. |
| Media | Crear `useServerPagination` (wrapper `buildFilters` + meta) consumido por composables. | Menos duplicación y errores. |
| Media | Ampliar logging publish/revert (`totalEntities`, `durationMs`) y métricas editorial. | Observabilidad clara. |
| Baja | Endurecer import/export (tamaño máximo, schema) y documentar alias `/api/user(s)`. | Robustez operativa y DX. |

