# Informe de entidades Tarot2

## Índice
1. [Resumen](#1-resumen)
2. [world](#2-world)
3. [arcana](#3-arcana)
4. [card_type](#4-card_type)
5. [base_card](#5-base_card)
6. [facet](#6-facet)
7. [skill (base_skills)](#7-skill-base_skills)
8. [world_card](#8-world_card)
9. [tag](#9-tag)
10. [users](#10-users)
11. [roles](#11-roles)
12. [content_versions](#12-content_versions)
13. [content_revisions](#13-content_revisions)
14. [content_feedback](#14-content_feedback)

## 1. Resumen
Documento maestro para entidades gestionadas por Manage/Admin. Cada sección detalla campos base, traducibles, relaciones, tags, efectos, estados editoriales, capabilities y su correspondencia con rutas API, componentes frontend y presets de formularios. Compatible con iniciativas de Form Presets y reglas Windsurf.

## 2. world
- **Tablas**: `worlds`, `worlds_translations`, `tag_links` (`entity_type='world'`).
- **Campos base**: `id`, `slug`, `status`, `is_active`, `image_url`, `created_at`, `updated_at`.
- **Campos traducibles**: `name`, `short_description`, `lore`, `flavor_text` en `worlds_translations`.
- **Relaciones**: tags (many-to-many), usuarios (`created_by`, `updated_by`).
- **Effects JSON**: N/A directa (se asocia vía `world_card`).
- **Status/Release**: usa `card_status` (draft, approved, etc.).
- **Capabilities**: translatable, tags, preview, feedback, import/export.
- **API**: `/api/world/*` (`_crud.ts`).
- **Composable**: `useWorldCrud`.@app/composables/manage/useWorld.ts#1-33@
- **Vista Manage**: `/manage` tab `world` → `EntityBase` + `ManageTableBridge`.
- **Form presets**: `schemas/entities/world.*`, `entityFieldPresets['world']` (pend. ampliar).
- **Riesgos**: consultas con joins múltiples (tags, traducciones), borrar EN elimina entidad.

## 3. arcana
- **Tablas**: `arcana`, `arcana_translations`, `tag_links` (`entity_type='arcana'`).
- **Campos base**: `id`, `slug`, `status`, `is_active`, `icon`, `arcana_type`.
- **Traducibles**: `name`, `short_description`, `lore`, `flavor_text`.
- **Relaciones**: tags, usuarios (`created_by`, `updated_by`).
- **Effects JSON**: No directo; se asocia a facets/skills.
- **Status/Release**: `card_status`.
- **Capabilities**: translatable, tags, preview, feedback.
- **API**: `/api/arcana/*`.
- **Composable**: `useArcanaCrud`.
- **Vista**: `/manage` tab `arcana`.
- **Form presets**: `schema/entities/arcana`, presets Manage.
- **Riesgos**: join con tags y traducciones, queries costosas.

## 4. card_type
- **Tablas**: `base_card_type`, `base_card_type_translations`.
- **Campos base**: `id`, `code`, `icon`, `status`, `is_active`.
- **Traducibles**: `name`, `description`.
- **Relaciones**: base cards.
- **Effects JSON**: N/A.
- **Status/Release**: `card_status`.
- **Capabilities**: translatable, no tags, no preview custom.
- **API**: `/api/card_type/*`.
- **Composable**: `useCardTypeCrud`.
- **Vista**: `/manage` tab `cardType`.
- **Form presets**: `entityFieldPresets['card_type']`.
- **Riesgos**: mantener coherencia con `base_card` (FK).

## 5. base_card
- **Tablas**: `base_card`, `base_card_translations`, `card_effects`, `tag_links` (`entity_type='base_card'`).
- **Campos base**: `id`, `card_type_id`, `slug`, `status`, `is_active`, `image_url`, `metadata`.
- **Traducibles**: `name`, `summary`, `description`, `flavor_text`.
- **Relaciones**: card_type (FK), tags, efectos (`card_effects` JSONB).
- **Effects JSON**: `card_effects` (schema legacy + Effect System 2.0 planificado).
- **Status/Release**: `card_status`.
- **Capabilities**: translatable, tags, preview, feedback, import/export.
- **API**: `/api/base_card/*`.
- **Composable**: `useBaseCardCrud`.
- **Vista Manage**: `/manage` tab `baseCard` + vistas cards/clasic/carta.
- **Form presets**: `schemas/entities/base_card.*`, presets Manage.
- **Riesgos**: efectos JSON heredados; migración a Effect System 2.0.

## 6. facet
- **Tablas**: `facet`, `facet_translations`, `tag_links` (`entity_type='facet'`).
- **Campos base**: `id`, `arcana_id`, `status`, `is_active`, `icon`, `color`, `metadata`.
- **Traducibles**: `name`, `short_description`, `effects_summary`.
- **Relaciones**: arcana (FK), tags, skills (`base_skills`), efectos JSON.
- **Status/Release**: `card_status`.
- **Capabilities**: translatable, tags, preview, feedback.
- **API**: `/api/facet/*`.
- **Composable**: `useFacetCrud`.
- **Vista**: `/manage` tab `facet`.
- **Form presets**: `schemas/entities/facet.*`, presets Manage.
- **Riesgos**: join con arcana/tags, efectos JSON.

## 7. skill (base_skills)
- **Tablas**: `base_skills`, `base_skills_translations`, `tag_links` (`entity_type='base_skills'`).
- **Campos base**: `id`, `facet_id`, `status`, `is_active`, `icon`, `metadata`.
- **Traducibles**: `name`, `description`, `effect_text`.
- **Relaciones**: facet (FK), tags, efectos JSON.
- **Status/Release**: `card_status`.
- **Capabilities**: translatable, tags, preview.
- **API**: `/api/skill/*`.
- **Composable**: `useSkillCrud`.
- **Vista**: `/manage` tab `skill`.
- **Form presets**: `schemas/entities/skill.*`.
- **Riesgos**: mantener integridad facet-skill, efectos JSON.

## 8. world_card
- **Tablas**: `world_card`, `world_card_translations`, `tag_links` (`entity_type='world_card'`).
- **Campos base**: `id`, `world_id`, `base_card_id`, `status`, `is_override`, `metadata`, `image_url`.
- **Traducibles**: `name`, `summary`, `description`, `flavor_text`.
- **Relaciones**: world (FK), base_card (FK), tags, efectos JSON overrides.
- **Status/Release**: `card_status`.
- **Capabilities**: translatable, tags, preview, import/export.
- **API**: `/api/world_card/*`.
- **Composable**: planificado (`useWorldCardCrud`).
- **Vista**: Manage (módulo overrides) + preview en `EntityInspectorDrawer`.
- **Form presets**: pend. consolidar (usa presets base_card).
- **Riesgos**: SQL complejo (joins world/base_card/tags), overrides effect JSON.

## 9. tag
- **Tablas**: `tags`, `tags_translations`.
- **Campos base**: `id`, `code`, `category`, `parent_id`, `is_active`, `sort`.
- **Traducibles**: `name`, `description`.
- **Relaciones**: jerarquía (parent_id), tag_links múltiples entidades.
- **Status/Release**: boolean `is_active`.
- **Capabilities**: translatable, jerarquía, no preview.
- **API**: `/api/tag/*`, `/api/tag/batch.patch`.
- **Composable**: `useTagCrud`.
- **Vista**: `/manage` tab `tag`.
- **Form presets**: `schemas/entities/tag.*`.
- **Riesgos**: batch patch con traducciones, parent relacional.

## 10. users
- **Tablas**: `users`, relación `roles` (many-to-many via JSONB `permissions`).
- **Campos base**: `id`, `email`, `username`, `password_hash`, `status`, `image`, `effects` JSONB (metadata), timestamps.
- **Traducibles**: N/A.
- **Relaciones**: roles (JSONB), feedback (`created_by`, `resolved_by`), versions (`created_by`).
- **Status**: `user_status` enum.
- **Capabilities**: no tags, no translations, bulk actions limitadas.
- **API**: `/api/user/*`.
- **Composable**: `useAdminUsersCrud`.
- **Vista Admin**: `/admin/users` (`ManageUsers.vue`, `UserTable.vue`).
- **Form presets**: legacy `RoleForm` + panel de usuario (pend. migrar a presets).
- **Riesgos**: permisos JSONB deben alinearse con capabilities front/back.

## 11. roles
- **Tablas**: `roles`.
- **Campos base**: `id`, `name`, `description`, `permissions` JSONB, timestamps.
- **Traducibles**: N/A.
- **Relaciones**: usuarios (asignación en UI, no FK directa).
- **Capabilities**: no tags, no translations.
- **API**: `/api/role/*`.
- **Composable**: legacy (`useRoleCrud` aún por estandarizar).
- **Vista**: `/admin/users` (modal `RoleForm.vue`).
- **Form presets**: inexistente; se recomienda migrar a `FormModal` + presets declarativos.
- **Riesgos**: permisos JSONB deben mantenerse sincronizados con middleware.

## 12. content_versions
- **Tablas**: `content_versions`.
- **Campos base**: `id`, `version_semver`, `description`, `metadata` JSONB, `release`, `created_by`, `created_at`.
- **Traducibles**: N/A.
- **Relaciones**: effect targets/types (FK opcional), revisions/feedback.
- **Status/Release**: enum `release_stage`.
- **Capabilities**: no tags, no translations, publish, metrics.
- **API**: `/api/content_versions/*`, `/publish`.
- **Composable**: `useContentVersions`.
- **Vista Admin**: `/admin/versions` (`VersionList`, `VersionModal`).
- **Form presets**: manual; objetivo migrar a `FormModal`.
- **Riesgos**: publish sin rate limit/logging consistente.

## 13. content_revisions
- **Tablas**: `content_revisions`.
- **Campos base**: `id`, `entity_type`, `entity_id`, `language_code`, `snapshot` JSONB, `status`, `created_by`, `approved_by`, `created_at`, `approved_at`.
- **Traducibles**: no aplica (snapshot JSON guarda estructura completa).
- **Relaciones**: usuarios (`created_by`, `approved_by`), versiones (vía metadata), entidades referenciadas por `entity_type`/`entity_id`.
- **Capabilities**: revert, diff, bulk approve/reject.
- **API**: `/api/content_revisions/*`, `/api/content_revisions/[id]/revert`.
- **Composable**: `useRevisions`.
- **Vista Admin**: `/admin/revisions` (`RevisionsTable.vue`, `RevisionCompareModal.vue`).
- **Form presets**: no aplica (acciones específicas por modal).
- **Riesgos**: revert sin rate limit, snapshots JSON deben permanecer compatibles con entidades base.

## 14. content_feedback
- **Tablas**: `content_feedback`.
- **Campos base**: `id`, `entity_type`, `entity_id`, `version_number`, `language_code`, `comment`, `category`, `status`, `created_by`, `resolved_by`, timestamps.
- **Traducibles**: N/A (comentarios por idioma).
- **Relaciones**: usuarios (`created_by`, `resolved_by`), versiones (opcional), entidades via `entity_type`/`entity_id`.
- **Capabilities**: filtros avanzados, preview, bulk resolve/reopen.
- **API**: `/api/content_feedback/*`.
- **Composable**: `useContentFeedback`.
- **Vista Admin**: `/admin/feedback` (`FeedbackList`, `FeedbackNotesModal`).
- **Form presets**: N/A (acciones de estado/nota interna).
- **Riesgos**: filtros AND/OR tags, preview endpoints deben existir, manejo multi-idioma en comentarios.
