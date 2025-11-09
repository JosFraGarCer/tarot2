# Auditoría exhaustiva: /admin

## Resumen
- Módulo administrativo con páginas: versiones, historial por entidad, feedback, base de datos e interfaz de usuarios.
- Arquitectura moderna: páginas finas + componentes de UI + composables para datos (fetch, paginación, filtros).
- Backend Kysely + middleware de autenticación; la mayoría de endpoints existen y son consistentes.
- Se detectan endpoints faltantes referenciados por la UI (publish, revert) y pequeños bugs de rutas y contadores.

## Páginas, funcionamiento y capacidades

### /admin/versions
- Lista de versiones con búsqueda, filtro por estado, paginación.
- Acciones: crear/editar versión (incluye campo release), ver metadata, ver detalle, borrar, publicar revisiones aprobadas.
- Componentes y composables:
  - `components/admin/VersionList.vue`, `components/admin/VersionModal.vue`, `components/admin/RevisionsTable.vue`, `components/admin/JsonModal.vue`, `components/common/PaginationControls.vue`.
  - `composables/admin/useContentVersions.ts` (listado/CRUD), `composables/admin/useRevisions.ts` (tabla de revisiones aprobadas).
- Endpoints backend usados:
  - `GET/POST/PATCH/DELETE /api/content_versions` (presentes).
  - FALTANTE: `POST /api/content_versions/publish` (UI lo llama; no existe en `server/api`).

### /admin/versions/[id]
- Vista detalle de versión (semver, descripción, metadata) con edición en modal.
- Componentes: `VersionModal.vue`, `JsonModal.vue`.
- Endpoints: `GET /api/content_versions/:id`, `PATCH /api/content_versions/:id` (presentes; incluye campo `release`).

### /admin/versions/entity/[id]
- Historial de revisiones por entidad (con tabs Revisiones/Feedback).
- Capacidades:
  - Ver lista de revisiones, ver diff JSON de una revisión, comparar dos revisiones (A/B), revertir revisión, ver feedback asociado y gestionar notas.
- Componentes/composables:
  - `RevisionCompareModal.vue`, `JsonModal.vue`, `FeedbackList.vue`, `FeedbackNotesModal.vue`.
  - `useRevisions.ts` (listado/estado), `useContentFeedback.ts` (feedback vinculado), `useCurrentUser` (roles), `useApiFetch`.
- Endpoints backend usados:
  - `GET/PATCH/DELETE /api/content_revisions` (presentes).
  - FALTANTE: `POST /api/content_revisions/:id/revert` (UI lo llama; no existe en `server/api`).

### /admin/feedback
- Revisión/gestión de feedback con filtros: búsqueda, estado, tipo (bug/suggestion/balance/translation), "mineOnly" y selección múltiple.
- Acciones: previsualizar carta vinculada, ver JSON de entidad, resolver/reabrir/borrar y anotar notas internas, paginación.
- Componentes/composables:
  - `FeedbackDashboard.vue`, `FeedbackList.vue`, `FeedbackNotesModal.vue`, `JsonModal.vue`, `PaginationControls.vue`.
  - `useContentFeedback.ts`, `useCurrentUser.ts`, `useApiFetch`.
- Endpoints backend usados: `GET/POST/PATCH/DELETE /api/content_feedback` (presentes). Previsualización usa dinámicamente `GET /api/{base_card|arcana|facet|world}/:id` (presentes); ver errores más abajo.

### /admin/feedback/[id]
- Vista detalle de feedback con card preview (si aplica) y acciones de resolver/borrar.
- Endpoints: `GET /api/content_feedback/:id` (presente). Previsualización intenta `GET /api/base_card/by-translation/:id` (ver errores).

### /admin/database
- Export/Import global de Base de Datos en JSON y SQL.
- Endpoints backend: `GET /api/database/export.json`, `POST /api/database/import.json`, `GET /api/database/export.sql`, `POST /api/database/import.sql` (presentes).

### /admin/users
- Gestión de usuarios reaprovechando el contenedor de gestión (`EntityBase.vue`) con vistas clásica/tarjeta/tabla.
- Composable: `composables/admin/useUsers.ts` → `resourcePath: '/api/user'` (endpoints presentes), filtros role/status/active.

## Dependencias frontend globales
- Páginas: `app/pages/admin/*`.
- Componentes admin: `VersionList`, `VersionModal`, `RevisionsTable`, `RevisionCompareModal`, `FeedbackList`, `FeedbackDashboard`, `FeedbackNotesModal`, `JsonModal`, `EntityViewer` (no existe en repo; no se usa en páginas abiertas).
- Composables admin: `useContentVersions`, `useRevisions`, `useContentFeedback`, `useUsers`, `useCurrentUser`.
- Utilidades: `utils/fetcher.ts` (ETag + cache), `utils/date.ts`, `utils/status.ts`.

## Dependencias backend relevantes
- Middleware auth: `server/middleware/00.auth.hydrate.ts`, `01.auth.guard.ts` (protegido todo `/api` excepto `/api/auth/login|logout`).
- Plugins: `server/plugins/db.ts` (Kysely+PG), `server/plugins/auth.ts` (JWT helpers).
- Rutas: `server/api/{content_versions,content_revisions,content_feedback,role,user,uploads,database,...}`.

## Alineación con /docs (API, SERVER, SECURITY, SCHEMA)

- `release` en `content_versions` está confirmado en el esquema (`release_stage`) y en la documentación de API; el UI ya lo usa correctamente.
- Seguridad: `POST /api/auth/logout` existe pero no limpia la cookie `auth_token` (SECURITY.md). Recomendado añadir limpieza del cookie.
- Convención de rutas de usuarios: la API actual usa `/api/user/*` (singular). Parte de la documentación antigua usa `/api/users/*` (plural). Recomendado unificar a singular y, si procede, ofrecer alias temporal para compatibilidad.
- `card_type` vs `base_card_type`: la documentación señala la diferencia de nombre entre la ruta y la tabla base; en el backend actual la ruta es `/api/card_type` y mapea a `base_card_type`. Mantener coherencia en nuevas utilidades/consultas.
- Filtros por tags: documentación (SERVER.md) describe semántica AND; en algunos listados actuales (p.ej. base_card) se aplica OR. Definir semántica objetivo y alinear código + documentación.

## Problemas y bugs detectados (con evidencia)
- [P0] Endpoint de publicación FALTANTE
  - UI llama `POST /api/content_versions/publish` desde `/admin/versions/index.vue` (líneas ~161–165). No existe en `server/api` (búsqueda global de "publish").
  - Impacto: botón "Publish approved revisions" fallará (404/405). Solución: implementar endpoint (ver sugerencias) o retirar acción temporalmente.
- [P0] Endpoint de revertir revisión FALTANTE
  - UI llama `POST /api/content_revisions/:id/revert` desde `/admin/versions/entity/[id].vue` (línea ~240). No existe en `server/api` (búsqueda de "revert").
  - Impacto: botón "Revert to this revision" no funciona. Solución: implementar endpoint.
- [P1] Ruta errónea con `useApiFetch` (doble `/api`)
  - `useContentFeedback.update()` usa `apiFetch('/api/content_feedback/:id', ...)` (línea ~220), pero `useApiFetch` ya tiene `baseURL:'/api'` → se invoca `/api/api/content_feedback/...`.
  - Solución: cambiar a `apiFetch('/content_feedback/:id', ...)`.
- [P1] Contador de la tab "Translation" en `/admin/feedback`
  - En `feedbackTabs`, el count de "Translation" usa `counts.balance` (línea ~192) en vez de `counts.translation`. Falta coherencia con el esquema de tipos.
  - Solución: añadir cómputo de `counts.translation` en `fetchCountsByType()` y usarlo en la tab.
- [P2] Previsualización de card en `/admin/feedback/[id]`
  - Intenta `GET /api/base_card/by-translation/:id` (líneas ~109–113). No existe ruta `by-translation`. La vista de lista usa un mapa distinto (funciona).
  - Solución: o implementar endpoint `by-translation`, o reutilizar la misma estrategia de `entityPreviewMap` para detalle.
- [P2] Uso inconsistente de `$fetch` vs `useApiFetch`
  - Varias páginas (`/admin/database`, `/admin/versions/[id]`, parte de `/admin/versions`) usan `$fetch('/api/...')` directo, perdiendo ETag/304 y política de reintentos de `useApiFetch`.
  - Solución: unificar en `useApiFetch` cuando aplique (especialmente GETs).
- [P3] Desfase documental sobre usuarios y card types
  - Parte de la documentación antigua usa `/api/users/*` (plural) pero el backend expone `/api/user/*` (singular). Ajustar documentación/consumidores.
  - La ruta `/api/card_type` mapea a la tabla `base_card_type` (nota en API.MD). Mantener la convención y documentar el mapeo.

## Seguridad y permisos
- Middleware exige sesión para todo `/api` (correcto para admin).
- Gating de UI: "editor" o "admin" habilitan acciones de publicar, aprobar/rechazar revisiones y resolver feedback.
- Recomendación: exponer mensajería más explícita si falta permiso (se hace parcialmente).

## Optimización y eliminación de duplicados
- StatusBadge reutilizable
  - Extraer componente `StatusBadge.vue` para consolidar colores/variants/labelKey (hoy replicado en `EntityTable`, `EntityCards`, `CartaRow`, `admin` vistas).
- Selección y acciones masivas
  - Extraer `useSelection(ids)` común (tabla feedback y tablas de entidades repiten patrón de selección y acciones bulk).
- Previsualización unificada
  - Unificar carga de snapshot de entidad (lista/detalle de feedback) en `useEntityPreviewFetch(entityType, id, lang)` para evitar divergencias (y el bug del endpoint by-translation).
- Fetch wrapper
  - Adoptar `useApiFetch` para GETs en admin (beneficios: ETag, cache TTL configurable, reintentos controlados).

## Funcionalidades posibles
- Publicación guiada real
  - Backend `POST /content_versions/publish`: publicar revisiones `approved` → crear snapshot, subir `content_version_id` a entidades afectadas, auditar acciones, devolver resumen.
- Revert de revisión
  - Backend `POST /content_revisions/:id/revert`: aplicar `prev_snapshot` o `next_snapshot` según estrategia; auditar.
- Auditoría y trazabilidad
  - Registro de "quién hizo qué y cuándo" en aprobaciones/publicaciones/reversiones.
- Buscador avanzado en feedback
  - Filtros por rango de fechas, idioma, entidad base/relación, con guardado de vistas.

## Testing sugerido
- E2E
  - Flujos de creación/edición de versión (release incluido), publicación (cuando exista endpoint), gestión de feedback, importar/exportar DB, gestión de usuarios.
- Unidad
  - `useContentVersions` (params y meta), `useRevisions` (filtro por entidad/lang), `useContentFeedback` (buildParams y update con ruta corregida), `useApiFetch` (cache/Etag), `RevisionCompareModal` (marcado de cambios).

## Sugerencias de implementación (endpoints faltantes)
- `POST /api/content_versions/publish`
  - Body: `{ id?: number; version_semver?: string; notes?: string|null }`.
  - Lógica: recopilar revisiones `approved`, aplicar a entidades, guardar `content_version_id`, registrar conteo `totalEntities`, `totalRevisionsPublished` y actualizar `content_versions` si se crea.
- `POST /api/content_revisions/:id/revert`
  - Body vacío. Lógica: aplicar `prev_snapshot` (o `next_snapshot` como target) sobre entidad base; crear nueva revisión `published`/`approved` según política; auditar.

## Plan y prioridades
- **P0** Implementar `content_versions/publish` y `content_revisions/:id/revert`.
- **P1** Corregir ruta en `useContentFeedback.update()` y el contador de "Translation" en `/admin/feedback`.
- **P2** Unificar previsualización de entidad (evitar `by-translation`), adoptar `useApiFetch` en GETs de admin.
- **P3** Refactors de duplicados: `StatusBadge`, `useSelection`, fetch preview unificado.
