# Auditoría exhaustiva: /manage (Gestión)

## Resumen
- Página de gestión con pestañas para 7 entidades: `cardType`, `baseCard`, `world`, `arcana`, `facet`, `skill`, `tag`.
- UI flexible con 4 modos de vista: `tabla`, `tarjeta`, `classic`, `carta`.
- Lógica de negocio correctamente extraída a composables `useEntity*`, con SSR y paginación.
- Endpoints backend sólidos para CRUD, filtros, export/import y tags. Sin errores críticos en esta sección.

## Funcionamiento y capacidades de usuario
- Navegación por pestañas `UTabs` para elegir entidad.
- Controles de vista con persistencia local (`useManageView`): modo de vista y template (Class/Origin).
- Filtros por búsqueda, estado, activo, tipo, facet, tags y parent según la entidad (`EntityFilters`).
- Listado en tabla o tarjetas, con acciones por ítem: Editar, Feedback, Tags, Borrar, Previsualizar.
- Paginación con selector de `pageSize` (cliente/servidor) y memorias por entidad.
- Exportación/Importación JSON por entidad; edición con formularios dinámicos (Zod/presets) e imagen opcional.
- Gestión de etiquetas (`EntityTagsModal`) y envío de feedback contextual (`FeedbackModal`).

## Dependencias frontend
- Páginas: `app/pages/manage.vue`.
- Componentes principales:
  - `components/manage/EntityBase.vue` (contenedor principal de la entidad)
  - `components/manage/EntityFilters.vue`, `EntityTableWrapper.vue`, `view/EntityCards.vue`, `view/EntityCardsClassic.vue`, `view/EntityCarta.vue`
  - Modales: `modal/FormModal.vue`, `modal/PreviewModal.vue`, `modal/ImportJson.vue`, `modal/EntityTagsModal.vue`, `modal/FeedbackModal.vue`
  - Acciones/confirmaciones: `common/DeleteDialogs.vue`, `manage/EntityActions.vue`
- Composables clave:
  - Core CRUD: `composables/manage/useEntity.ts`
  - CRUD por entidad: `useWorldCrud`, `useArcanaCrud`, `useFacetCrud`, `useSkillCrud`, `useCardTypeCrud`, `useBaseCardCrud`
  - UI/estado: `useManageView`, `useManageFilters`, `useManageColumns`, `useManageActions`, `useEntityPagination`, `useEntityPreview`, `useEntityDeletion`, `useImageUpload`, `useOptimisticStatus`, `useEntityTags`, `useEntityTransfer`, `useFeedback`, `useTranslationActions`
- Utilidades: `utils/fetcher.ts` (ETag + cache), `utils/status.ts`, `composables/common/useCardTemplates`, `useCardViewHelpers`.

## Dependencias backend
- Middlewares: `server/middleware/00.auth.hydrate.ts`, `01.auth.guard.ts` (protegen todo `/api` excepto auth).
- Plugins: `server/plugins/db.ts` (Kysely/PG), `plugins/auth.ts` (JWT, helpers).
- Endpoints usados por /manage (presentes y consistentes):
  - `/api/card_type/*`, `/api/base_card/*`, `/api/world/*`, `/api/arcana/*`, `/api/facet/*`, `/api/skill/*`, `/api/tag/*`, `/api/tag_links` (POST/DELETE), export/import para cada entidad.

## Alineación con /docs (API, SERVER, SCHEMA, effect-system)

- Respuestas y paginación: `{ success, data, meta { page, pageSize, totalItems, totalPages, count, search } }`.
- I18n: uso de `<entidad>_translations` con fallback `'en'` y campo `language_code_resolved` en listados/detalles.
- Borrado por idioma: si la página está en `en`, el borrado elimina la entidad + traducciones; en otro idioma, se ofrece eliminar sólo la traducción (comportamiento ya reflejado en UI de `DeleteDialogs`).
- Tags: la documentación general (SERVER.md) señala filtros AND por múltiples tags; algunos listados actuales usan OR. Definir y alinear semántica a nivel de producto y actualizar consultas/UX.
- Card types: la ruta `/api/card_type` mapea a la tabla `base_card_type` (API.MD). Mantener esta convención en componentes/presets.
- Sistema de efectos: el esquema incorpora `effect_type`, `effect_target` y `card_effects` (semántico) y modo legacy (`legacy_effects` + `effects` JSONB). Se recomienda preparar `FormModal`/presets para soportar edición de efectos cuando se active el módulo en UI.

## Flujo de datos
- `useEntity` normaliza respuestas heterogéneas (meta/paginación) y expone `items`, `pagination`, `filters`, `fetchList/fetchOne/create/update/remove`.
- SSR: `useAsyncData` con `watch` por clave estable (`resourcePath + filtros + paginación + lang`).
- Caché HTTP: `useApiFetch` añade `If-None-Match` y maneja `304` para reusar datos en cliente.

## Problemas detectados
- No se detectaron errores funcionales en los endpoint usados por /manage.
- Mezcla de alias en imports (`@/` y `~/`) a lo largo de los componentes. Mejora menor de consistencia.

## Oportunidades de optimización y reducción de duplicados
- **[Estado/Badges]** Consolidar representación del estado (color/variant/labelKey) en un componente `StatusBadge.vue` para reutilizar en `EntityTable`, `EntityCards`, `EntityCardsClassic`, `EntityCarta` y `CartaRow`.
- **[Imágenes]** Ya existe `useCardViewHelpers.resolveImage`; asegurar uso en todas las vistas (p.ej. `CartaRow.vue` usa `img` directa). Extraer fallback y rutas a un solo helper.
- **[Selección]** La lógica de selección (mapa/ids) se repite en tablas/listas. Extraer `useSelection(ids)` común.
- **[Form presets]** `FormModal` mezcla Zod + presets; documentar presets por entidad y centralizar `entityFieldPresets` en un registro extensible.
- **[Imports]** Unificar uso de `useApiFetch` en todos los lugares (evitar `$fetch('/api/...')`).

## Refactors propuestos (mover lógica fuera de *.vue)
- **`EntityCards(.vue)` y `EntityCardsClassic(.vue)`**: extraer la construcción del view-model (titleOf, badges, tags) a `useEntityCardVM(entityKey)`.
- **`EntityTableWrapper.vue`**: la normalización de filas ya está, pero se puede exportar a `useEntityRowMapper(entityKey)` para reusar en futuras tablas.
- **`ManageEntity.vue`**: orquestación correcta; considerar mover handlers de export/import/feedback/tags a un composable `useManageEntityActions` para simplificar el setup.

## Funcionalidades posibles
- **Revisión por lotes**: aplicar estado/tags en batch sobre una selección multipágina (requiere endpoints batch ya disponibles para varias entidades).
- **Vistas guardadas**: persistir combinaciones de filtros + vista como “presets”.
- **Historial local**: recordar búsquedas por entidad.

## Testing sugerido
- E2E: flujos de CRUD, filtros, paginación, export/import por entidad.
- Unidad: `useEntity` (normalización de meta/paginación), `useManageFilters` (reset y alias), `useEntityTransfer` (errores JSON), `useImageUpload`.

## Prioridades (Plan de acción)
- **P1** Unificar imports a `~/` o `@/` de forma consistente.
- **P2** Componente `StatusBadge.vue` y `useSelection` para reducir duplicado.
- **P2** Adoptar `useApiFetch` en todas las llamadas (reemplazar `$fetch('/api/...')`).
