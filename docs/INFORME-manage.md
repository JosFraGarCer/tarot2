# Auditoría exhaustiva: /manage (Gestión)

## Resumen actualizado
- `/manage` centraliza la administración de `card_type`, `base_card`, `world`, `arcana`, `facet`, `skill` y `tag` usando `EntityBase.vue` + `ManageTableBridge`/`CommonDataTable`.
- Vistas disponibles (`tabla`, `tarjeta`, `classic`, `carta`) se gestionan mediante `ViewControls` con presets guardados por entidad en `useManageView`.
- CRUD y filtros dependen de `useEntity` y composables específicos por entidad con SSR y cache ETag vía `useApiFetch`.
- Todos los endpoints `/api/<entity>` existen y siguen contratos `{ success, data, meta }`; export/import y operaciones batch están disponibles.
- Traducciones, tags y versionado de contenido respetan el dominio y las banderas de capacidades definidas en `useEntityCapabilities`.

## Funcionamiento y capacidades
- **Navegación**: pestañas `UTabs` en `manage.vue` definen la entidad activa y pasan configuración específica a `ManageEntity`.@app/pages/manage.vue#1-186
- **Controles de vista**: `ViewControls.vue` sincroniza modo (`viewMode`) y plantilla (`templateKey`) por entidad usando localStorage y presets declarados.
- **Filtros**: `EntityFilters.vue` y `AdvancedFiltersPanel.vue` combinan búsqueda, estado, `is_active`, relaciones (facet, card type, arcana), tags y parent. Configurados por `EntityFilterConfig` desde cada composable CRUD.
- **CRUD**: `FormModal.vue` construye formularios dinámicos a partir de schema Zod (`server/schemas/*`) y `entityFieldPresets`, soporta imágenes (`ImageUploadField`), efectos legacy (`legacy_effects`) y traducciones con fallback EN.
- **Acciones**: cada fila (tabla o tarjeta) permite editar, previsualizar (`EntityInspectorDrawer`), gestionar tags, enviar feedback y eliminar. Bulk actions utilizán `useTableSelection` y `BulkActionsBar` en `ManageTableBridge`.
- **Previews**: `EntityInspectorDrawer` renderiza resumen con badges de idioma/estado/release usando `useEntityPreviewFetch` para SSR seguro.
- **Export/Import**: acciones llaman a `entityCrudHelpers` para exportar/importar JSON preservando traducciones y tags.

## Dependencias frontend principales
- Página: `app/pages/manage.vue` (tabs, ViewControls, ManageEntity).
- Contenedor: `components/manage/EntityBase.vue` (coordinación de filtros, vista, modales, preview, bulk).
- Vistas: `EntityTableWrapper.vue`, `view/EntityCards.vue`, `view/EntityCardsClassic.vue`, `view/EntityCarta.vue`.
- Modales: `FormModal.vue`, `PreviewModal.vue` (legacy), `ImportJson.vue`, `EntityTagsModal.vue`, `FeedbackModal.vue`.
- Composables: `useEntity`, `use<entity>Crud`, `useManageView`, `useEntityPagination`, `useEntityTags`, `useEntityDeletion`, `useTranslationActions`, `useCardViewHelpers`, `useImageUpload`, `useEntityCapabilities`.

## Dependencias backend
- Middleware: `00.auth.hydrate`, `01.auth.guard`, `02.rate-limit`.
- CRUD handlers por entidad (`server/api/<entity>/_crud.ts`) usan `createCrudHandlers`, `buildFilters`, `translatableUpsert`, `deleteLocalizedEntity`.
- Tablas relevantes: consultar `docs/SCHEMA POSTGRES..TXT` (worlds, arcana, facets, base_card, base_skills, world_card, base_card_type, tags, tag_links, content_versions).

## Alineación con documentación oficial
- `docs/API.MD` refleja campos actuales (`card_family`, `metadata`, `legacy_effects`, `content_version_id`, etc.) y endpoints adicionales (`/content_versions/publish`, `/content_revisions/:id/revert`).
- `docs/SERVER.md` describe middleware, utilidades y patrones compartidos usados por Manage.
- `docs/effect-system.md` documenta los modos semántico y legacy utilizados por las entidades con efectos.
- `docs/SCHEMA POSTGRES..TXT` es la referencia del modelo de datos consumido desde Manage.

## Cambios recientes
- Migración completa a `CommonDataTable` + `ManageTableBridge` para unificar tablas y bulk actions.
- `EntityInspectorDrawer` sustituyó previews legacy; integra `UFocusTrap` y badges accesibles.
- `useEntityCapabilities` define banderas por entidad (`translatable`, `hasTags`, `hasPreview`, `actionsBatch`).
- `AdvancedFiltersPanel` y `useQuerySync` gestionan filtros avanzados con sincronización URL.
- `useEntityPreviewFetch` brinda preview SSR común para feedback y manage.

## Riesgos y mejoras pendientes
- **Semántica de tags**: algunos CRUD aplican OR; la documentación recomienda AND. Decidir política y alinear SQL + UI.
- **Edición de efectos**: falta un editor UI para `card_effects`; plan en `/informes/BRAINSTORMING.md`.
- **Imports**: aún hay llamadas `$fetch` residuales; migrar a `useApiFetch` para ETag/SSR consistente.
- **Consistencia de presets**: documentar y validar `entityFieldPresets` por entidad.

## Oportunidades de optimización
1. Centralizar badges de estado/release en `StatusBadge.vue` y reutilizar en todas las vistas.
2. Extraer `useSelection` compartido para tablas y tarjetas.
3. Implementar vistas guardadas (filtros + vista) por entidad.
4. Exponer CLI para generar nueva entidad (composable, presets, informes) siguiendo reglas de edición.

## Testing manual recomendado
- CRUD completo (crear, editar, traducir, borrar) en las 7 entidades con verificación de `status`, `is_active`, tags y efectos.
- Bulk actions (activar/desactivar, tags) y confirmación en API.
- Export/import JSON y verificación de traducciones/tags.
- Preview Drawer en EN/ES incluyendo fallback.
- Filtros avanzados + paginación + SSR sin errores.
- Envío de feedback y verificación en `/admin/feedback`.

## Referencias clave
- `@app/pages/manage.vue#1-186`
- `@app/components/manage/EntityBase.vue#1-424`
- `@app/components/manage/ManageTableBridge.vue#1-240`
- `@app/components/manage/modal/FormModal.vue#1-400`
- `@app/components/common/EntityInspectorDrawer.vue#1-220`
- `@app/composables/manage/useEntity.ts#1-200`
- `@server/api/base_card/_crud.ts#1-220`
- `@server/api/world_card/_crud.ts#1-238`
- `@server/utils/createCrudHandlers.ts#1-240`
- `@server/utils/filters.ts#40-158`
