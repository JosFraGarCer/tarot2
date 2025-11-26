# Informe de rutas Tarot2

## Índice
1. [Resumen](#1-resumen)
2. [Mapa frontend](#2-mapa-frontend)
3. [Mapa backend](#3-mapa-backend)
4. [Tabla entidad ↔ API ↔ DB ↔ Vista](#4-tabla-entidad--api--db--vista)
5. [Flujos especiales](#5-flujos-especiales)
6. [Zonas legacy o brechas](#6-zonas-legacy-o-brechas)
7. [Buenas prácticas de navegación](#7-buenas-prácticas-de-navegación)

## 1. Resumen
Visión cruzada de rutas frontend (`/manage`, `/admin`, `/login`, `/user`) y endpoints backend (`/api/<entity>`) con referencias directas a componentes, composables, CRUD handlers y tablas PostgreSQL. Útil para mantener coherencia al extender la plataforma o definir reglas de edición.

## 2. Mapa frontend
| Ruta | Componente raíz | Descripción |
| --- | --- | --- |
| `/` | `app/pages/index.vue` | Landing / wrapper inicial (redirecciones según auth). |
| `/login` | `app/pages/login.vue` | Autenticación; consume `/api/auth/login` vía `useAuth`. |
| `/manage` | `app/pages/manage.vue` | Tabs por entidad (`ManageEntity`), usa `EntityBase` y composables CRUD.@app/pages/manage.vue#1-186@
| `/manage/*` | Vistas hijas (cards, previews) | Renderizadas dentro de `EntityBase` (grid, classic, carta). |
| `/admin` | `app/pages/admin/index.vue` | Dashboard general Admin (cards overview). |
| `/admin/feedback` | `app/components/admin/FeedbackList.vue` via layout | Tabla bridge + filtros avanzados.@app/components/admin/FeedbackList.vue#1-380@
| `/admin/revisions` | `RevisionsTable.vue` con modales diff.@app/components/admin/RevisionsTable.vue#1-320@
| `/admin/versions` | `VersionList.vue` + `VersionModal`.@app/components/admin/VersionList.vue#1-86@
| `/admin/users` | `ManageUsers.vue` (tabs) + `UserTable.vue`.@app/components/admin/users/ManageUsers.vue#1-400@
| `/admin/import-export` | `DatabaseExport.vue`, `DatabaseImport.vue`. |
| `/admin/roles` | `RoleForm.vue` modal. |

## 3. Mapa backend
| Endpoint base | Handler principal | Descripción |
| --- | --- | --- |
| `/api/auth/login` | `server/api/auth/login.post.ts` | Autenticación (JWT). |
| `/api/auth/logout` | `logout.post.ts` | Limpieza cookie pendiente. |
| `/api/world` | `server/api/world/_crud.ts` | CRUD completo (traducciones, tags).@
| `/api/arcana` | `server/api/arcana/_crud.ts` | CRUD + joins tags/usuarios.@
| `/api/base_card` | `server/api/base_card/_crud.ts` | CRUD base cards (effects, tags).@
| `/api/card_type` | `server/api/card_type/_crud.ts` | Tipos de carta. |
| `/api/facet` | `server/api/facet/_crud.ts` | CRUD facets (effects, arcana).@
| `/api/skill` | `server/api/skill/_crud.ts` | CRUD skills (facet link).@
| `/api/world_card` | `server/api/world_card/_crud.ts` | Overrides de cartas por mundo.@
| `/api/tag` | `server/api/tag/_crud.ts`, `[id].get.ts`, `batch.patch.ts` | Gestión de tags, traducciones y jerarquía.@
| `/api/user` | `server/api/user/_crud.ts` | Gestión de usuarios y roles. |
| `/api/role` | `server/api/role/_crud.ts` | Roles + permisos JSONB. |
| `/api/content_versions` | `index.*`, `publish.post.ts` | Versionado editorial.@
| `/api/content_revisions` | `index.*`, `[id]/revert.post.ts` | Revisión editorial. |
| `/api/content_feedback` | `index.*`, `[id].patch.ts` | Feedback multi-idioma.@
| `/api/uploads` | `index.post.ts` | Subida de imágenes AVIF. |
| `/api/database` | `export.get.ts`, `import.post.ts` | Backup/restore JSON/SQL. |

## 4. Tabla entidad ↔ API ↔ DB ↔ Vista
| Entidad | Endpoints API | Handler `_crud` | Tablas PostgreSQL | Vista Manage/Admin | Composable principal |
| --- | --- | --- | --- | --- | --- |
| `world` | `/api/world/index|get|post|patch|delete` | `server/api/world/_crud.ts` | `worlds`, `worlds_translations`, `tag_links` | `/manage` tab `world` (EntityBase) | `useWorldCrud`@
| `arcana` | `/api/arcana/*` | `server/api/arcana/_crud.ts` | `arcana`, `arcana_translations`, `tag_links` | `/manage` tab `arcana` | `useArcanaCrud`@
| `card_type` | `/api/card_type/*` | `server/api/card_type/_crud.ts` | `base_card_type`, `base_card_type_translations` | `/manage` tab `cardType` | `useCardTypeCrud`@
| `base_card` | `/api/base_card/*` | `server/api/base_card/_crud.ts` | `base_card`, `base_card_translations`, `card_effects`, `tag_links` | `/manage` tab `baseCard` | `useBaseCardCrud`@
| `facet` | `/api/facet/*` | `server/api/facet/_crud.ts` | `facet`, `facet_translations`, `tag_links`, `arcana` | `/manage` tab `facet` | `useFacetCrud`@
| `skill` (base_skills) | `/api/skill/*` | `server/api/skill/_crud.ts` | `base_skills`, `base_skills_translations`, `tag_links` | `/manage` tab `skill` | `useSkillCrud`@
| `world_card` | `/api/world_card/*` | `server/api/world_card/_crud.ts` | `world_card`, `world_card_translations`, `tag_links` | `/manage` (vista world overrides) | `useWorldCardCrud` (planificado) |
| `tag` | `/api/tag/*`, `/api/tag/batch.patch` | `server/api/tag/_crud.ts` | `tags`, `tags_translations` | `/manage` tab `tag` | `useTagCrud`@
| `users` | `/api/user/*` | `server/api/user/_crud.ts` | `users`, `roles` | `/admin/users` | `useAdminUsersCrud`@
| `roles` | `/api/role/*` | `server/api/role/_crud.ts` | `roles` | `/admin/users` (RoleForm) | `useRoleCrud` (legacy) |
| `content_versions` | `/api/content_versions/*`, `/publish` | `server/api/content_versions/index.*` + `publish.post.ts` | `content_versions` | `/admin/versions` | `useContentVersions`@
| `content_revisions` | `/api/content_revisions/*`, `/[id]/revert` | `server/api/content_revisions/index.*` | `content_revisions` | `/admin/revisions` | `useRevisions`@
| `content_feedback` | `/api/content_feedback/*` | `server/api/content_feedback/index.*` | `content_feedback` | `/admin/feedback` | `useContentFeedback`@

## 5. Flujos especiales
1. **Autenticación**: `/login` → `useAuth` → `/api/auth/login` (JWT). Logout pendiente de limpieza cookie.
2. **Uploads**: `EntityBase` → `FormModal` → `useUpload` → `/api/uploads` (Sharp AVIF) → almacena path en entidad.
3. **Import/Export**: `/admin/import-export` → `useDatabaseExport`/`useDatabaseImport` ↔ `/api/database/export|get` y `/api/database/import|post`.
4. **Preview**: `EntityInspectorDrawer`/`FeedbackList` → `useEntityPreviewFetch` → `/api/<entity>/:id` (GET, multi-idioma).
5. **Publish/Revert**: `/admin/versions` → `/api/content_versions/publish`; `/admin/revisions` → `/api/content_revisions/[id]/revert`.

## 6. Zonas legacy o brechas
1. `/admin/versions` usa `VersionList.vue` con `<table>` manual; migrar a `AdminTableBridge` + `FormModal`.
2. `/admin/users` depende de `EntityTableWrapper`; migrar a `AdminTableBridge`.
3. Falta composable `useWorldCardCrud` dedicado.
4. `/login` sin rate limiting ni feedback detallado actualmente.

## 7. Buenas prácticas de navegación
+ Alinear rutas frontend con endpoints API (`entity` singular) y tablas correspondientes.
+ Documentar rutas nuevas con referencias a componentes/composables/handlers.
+ Evitar vistas sin `EntityBase`, bridges o drawers oficiales.
+ Garantizar que rutas protegidas pasen por middlewares auth + rate limit una vez habilitado.
