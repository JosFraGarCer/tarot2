# Auditoría exhaustiva: /admin

## Resumen actualizado
- `/admin` agrupa paneles para `content_versions`, `content_revisions`, `content_feedback`, usuarios/roles y utilidades de base de datos.
- Arquitectura: páginas ligeras (`app/pages/admin/*`) respaldadas por componentes (`VersionList`, `RevisionsTable`, `FeedbackList`, etc.) y composables (`useContentVersions`, `useRevisions`, `useContentFeedback`, `useUsers`).
- Todos los endpoints mencionados en la UI existen: `content_versions/publish` y `content_revisions/:id/revert` están implementados y alineados con `docs/API.MD`.
- Se reforzó accesibilidad, rate limit y logging; quedan mejoras menores (preview por traducción y uniformidad de imports).

## Páginas, funcionamiento y capacidades

### /admin/versions
- Lista versiones, crea/edita (`VersionModal`), publica revisiones aprobadas, abre historial (`RevisionsTable`).@app/components/admin/VersionList.vue#1-86
- Composables: `useContentVersions` (CRUD + publish), `useRevisions` (revisiones asociadas).@app/composables/admin/useContentVersions.ts#1-200
- Backend: `/api/content_versions/*` + `/api/content_versions/publish` (existe y usa `contentVersionPublishSchema`).@server/api/content_versions/publish.post.ts#1-200

### /admin/versions/[id]
- Vista detalle de versión (semver, descripción, metadata) con edición en modal.
- Componentes: `VersionModal.vue`, `JsonModal.vue`.
- Endpoints: `GET /api/content_versions/:id`, `PATCH /api/content_versions/:id` (presentes; incluye campo `release`).

### /admin/versions/entity/[id]
- Tabs Revisiones/Feedback con diff (`RevisionCompareModal`, `JsonModal`) y revert (`useRevisions.revert`).@app/components/admin/RevisionCompareModal.vue#1-220
- Backend: `/api/content_revisions/*` + `POST /api/content_revisions/:id/revert` (existente, aplica `prev_snapshot`).@server/api/content_revisions/[id]/revert.post.ts#1-220

### /admin/feedback
- Revisión/gestión de feedback con filtros: búsqueda, estado, tipo (bug/suggestion/balance/translation), "mineOnly" y selección múltiple.
- Acciones: previsualizar carta vinculada, ver JSON de entidad, resolver/reabrir/borrar y anotar notas internas, paginación.
- Componentes/composables:
  - `FeedbackDashboard.vue`, `FeedbackList.vue`, `FeedbackNotesModal.vue`, `components/common/JsonModal.vue`, `components/common/AdvancedFiltersPanel.vue`, `components/common/PaginationControls.vue`.
  - `useContentFeedback.ts`, `useCurrentUser.ts`, `useApiFetch`, `composables/common/useQuerySync.ts`, `composables/common/useDateRange.ts`.
- Endpoints backend usados: `GET/POST/PATCH/DELETE /api/content_feedback` (presentes). Previsualización usa dinámicamente `GET /api/{base_card|arcana|facet|world}/:id` (presentes); ver errores más abajo.
- **Flujo completo**: el panel básico (search/estado/categoría/mineOnly) y el colapsible de “Filtros avanzados” construyen un payload unificado en `filters` → `useContentFeedback.buildParams()`.
  - Los rangos de fechas (`created_from|to`, `resolved_from|to`), idioma (`language_code`), tipo de entidad (`entity_type`), relación (`entity_relation`) y autores (`created_by`, `resolved_by`) se serializan con utilidades comunes y se sincronizan con la URL para compartir vistas.
  - Al aplicar/resetear se invoca `fetchList()` (lista) + `fetchCountsByType()` (dashboard), ambos reutilizan los mismos filtros, y el estado se refleja en la query mediante `useQuerySync`.
- **Backend**: `GET /api/content_feedback` valida con `contentFeedbackQuerySchema`, aplica joins a `users` y, si procede, a relaciones (`world -> base_card`). `buildFilters()` añade búsqueda full-text, paginación y ordenación whitelisteada.
- **Entidades y traducción**: `entity_type` define la tabla principal (`base_card`, `world_card`, `arcana`, etc.) y `language_code` filtra comentarios específicos por idioma. El frontend usa esos mismos campos para resolver previews traducidas (`lang`), garantizando que el editor revisa la versión correcta.

### /admin/feedback
- Lista filtrable (estado, tipo, idioma, rangos) con `AdvancedFiltersPanel` compartido y dashboard de conteos. Preview y acciones bulk reusan `useEntityPreviewFetch`.
- Backend: `/api/content_feedback/*` aplica joins a `users`, entidades relacionadas y soporta filtros avanzados (`entity_relation`, rangos).@server/api/content_feedback/index.get.ts#1-180
- Detalle `feedback/[id]` resuelve feedback y preview; bug pendiente: sigue llamando `/base_card/by-translation/:id`, se recomienda reemplazar por `useEntityPreviewFetch` (plan).

### /admin/database
- Export/import JSON y SQL (`useDatabaseExport`, `useDatabaseImport`). Endpoints `export.json/sql`, `import.json/sql` vigentes con validación y logging.

### /admin/users / roles
- Usa `EntityBase` con capacidades `translatable=false`, `hasTags=false`. `UserTable` (wrapper) respeta columnas personalizadas y bulk actions.
- `useUsers` consume `/api/user/*`; roles se gestionan vía `useRoles` + `RoleForm.vue`.

## Dependencias frontend
- Páginas: `app/pages/admin/index.vue`, `versions.vue`, `feedback.vue`, `feedback/[id].vue`, `database.vue`, `users.vue`, `roles.vue`.
- Componentes: `VersionList`, `VersionModal`, `RevisionsTable`, `RevisionCompareModal`, `FeedbackDashboard`, `FeedbackList`, `FeedbackNotesModal`, `JsonModal` (common), `AdminTableBridge`, `UserTable`.
- Composables: `useContentVersions`, `useRevisions`, `useContentFeedback`, `useUsers`, `useRoles`, `useEntityPreviewFetch`, `useListMeta`, `useQuerySync`, `useDateRange`.

## Dependencias backend relevantes
- Middleware auth: `server/middleware/00.auth.hydrate.ts`, `01.auth.guard.ts` (protegido todo `/api` excepto `/api/auth/login|logout`).
- Plugins: `server/plugins/db.ts` (Kysely+PG), `server/plugins/auth.ts` (JWT helpers).
- Rutas: `server/api/{content_versions,content_revisions,content_feedback,role,user,uploads,database,...}`.

## Alineación con documentación
- `docs/API.MD` refleja rutas actuales (`/api/content_versions/publish`, `/api/content_revisions/:id/revert`, `/api/user/*`).
- `docs/SERVER.md` detalla middleware y contratos usados en Admin.
- `docs/SECURITY.md` describe rate limiting aplicado a rutas editoriales.
- `docs/SCHEMA POSTGRES..TXT` confirma tablas y relaciones consumidas (content_versions, content_revisions, content_feedback, users, roles).

-## Estado de issues (evidencia)
- ✅ `POST /api/content_versions/publish` implementado y activo.
- ✅ `POST /api/content_revisions/:id/revert` implementado; crea revisión `reverted` y registra logs.
- ✅ `useContentFeedback.update` usa `apiFetch` sin duplicar `/api`.
- ✅ Dashboard de feedback incluye tab "translation" (counts sincronizados).
- ⚠️ `/admin/feedback/[id]` sigue consultando `/base_card/by-translation/:id` (endpoint inexistente).Pendiente ajustar a `useEntityPreviewFetch`.
- ⚠️ Algunos componentes admin usan `$fetch`; migrar a `useApiFetch` para ETag/SSR consistente.

## Seguridad y permisos
- Middleware exige sesión para todo `/api` (correcto para admin).
- Gating de UI: "editor" o "admin" habilitan acciones de publicar, aprobar/rechazar revisiones y resolver feedback.
- Recomendación: exponer mensajería más explícita si falta permiso (se hace parcialmente).

## Optimización y duplicados
- **Selección**: extraer `useSelection` compartido para Admin (feedback) y Manage.
- **Preview**: integrar `useEntityPreviewFetch` en `/admin/feedback/[id]` para evitar llamada inexistente.
- **Filtros**: `AdvancedFiltersPanel` ya se usa en feedback; considerar plugin de filtros guardados.
- **Logging**: asegurar `requestId` propagado en `useApiFetch` (plan de observabilidad).


## Funcionalidades en roadmap
1. Publicación guiada con resumen visual (UI). Backend listo.
2. Auditoría granular (logs persistidos) para publish/revert.
3. Vistas guardadas de filtros en feedback e informes.
4. Previews enriquecidos (diff multi-idioma, `useEntityPreviewFetch` extendido).

## Testing recomendado
- **E2E**: CRUD versiones (incl. publish), revert revisiones, flujo feedback (resolver/reabrir/borrar), export/import database, gestión usuarios/roles.
- **Unidad**: `useContentVersions` (filters/meta/publish), `useRevisions` (diff, revert), `useContentFeedback` (buildParams, counts), `useEntityPreviewFetch`, `useUsers` (permisos).

## Sugerencias de implementación (endpoints faltantes)
- `POST /api/content_versions/publish`
  - Body: `{ id?: number; version_semver?: string; notes?: string|null }`.
  - Lógica: recopilar revisiones `approved`, aplicar a entidades, guardar `content_version_id`, registrar conteo `totalEntities`, `totalRevisionsPublished` y actualizar `content_versions` si se crea.
- `POST /api/content_revisions/:id/revert`
  - Body vacío. Lógica: aplicar `prev_snapshot` (o `next_snapshot` como target) sobre entidad base; crear nueva revisión `published`/`approved` según política; auditar.

## Plan y prioridades
- **Fase 0 (completada)**: flags de capacidades (`translatable=false`), movimiento de `JsonModal` a common, creación de `useQuerySync`, `useDateRange`, `useListMeta`, `useEntityPreviewFetch`, adopción de `AdvancedFiltersPanel` y normalización de paginación en versiones.
- **Fase 1 (en curso)**:
  - Migrar `$fetch` pendientes a `useApiFetch`.
  - Sustituir preview por `useEntityPreviewFetch` en feedback detail.
  - Extraer `useSelection` compartido.
- **Fase 2 (próxima)**:
  - Investigar provider de capacidades global (inversión de control) para Admin/Manage.
  - Documentar audit logs y exponer métricas en dashboards.
