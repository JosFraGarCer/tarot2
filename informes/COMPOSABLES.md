# Informe técnico de composables Tarot2

## Índice
1. [Resumen general](#1-resumen-general)
2. [Mapa de familias y scope](#2-mapa-de-familias-y-scope)
3. [Composables comunes](#3-composables-comunes)
4. [Composables Manage](#4-composables-manage)
5. [Composables Admin](#5-composables-admin)
6. [Flujo SSR, cache e invalidaciones](#6-flujo-ssr-cache-e-invalidaciones)
7. [Capacities, presets y Zod](#7-capacities-presets-y-zod)
8. [Sincronización de queries](#8-sincronización-de-queries)
9. [Zonas legacy o pendientes](#9-zonas-legacy-o-pendientes)
10. [Áreas de riesgo](#10-áreas-de-riesgo)
11. [Buenas prácticas](#11-buenas-prácticas)
12. [Roadmap de composables](#12-roadmap-de-composables)

## 1. Resumen general
Los composables de Tarot2 encapsulan lógica SSR-safe, multi-idioma y editorial que alimenta componentes Manage/Admin. Las piezas clave son `useEntity` (CRUD genérico), `useListMeta` (contratos de paginación), `useQuerySync` (sincronización URL), `useEntityCapabilities` (capabilities declarativas) y especializaciones editoriales (`useContentVersions`, `useRevisions`, `useContentFeedback`). El objetivo actual es eliminar duplicación (selección, paginación), consolidar presets de formularios y habilitar telemetría ligera.

## 2. Mapa de familias y scope
| Familia | Ubicación | Responsabilidad |
| --- | --- | --- |
| Common | `app/composables/common` | Meta/paginación, capabilities, sincronización de query, rangos de fecha, previews.|@app/composables/common/useListMeta.ts#1-46@
| Manage | `app/composables/manage` | CRUD multi-idioma, filtros, modales, tags y previews para Manage.|@app/composables/manage/useEntity.ts#1-392@
| Admin | `app/composables/admin` | Flujos editoriales, usuarios, feedback y backups internos.|@app/composables/admin/useContentFeedback.ts#1-360@

## 3. Composables comunes
| Composable | Rol | Referencias |
| --- | --- | --- |
| `useListMeta` | Convierte `meta` de API a `{ page, pageSize, totalItems, totalPages, hasNext, hasPrev }`. | Base para `CommonDataTable` y `PaginationControls`.@app/composables/common/useListMeta.ts#1-46@
| `useQuerySync` | Sincroniza filtros con la ruta (parse/serialize, replace vs push). | Pilares de `AdvancedFiltersPanel`, dashboards Admin.@app/composables/common/useQuerySync.ts#1-180@
| `useEntityCapabilities` | Inyecta capacidades por entidad (translatable, tags, preview, effects). | Consumido por `EntityBase`, bridges, modales.@app/composables/common/useEntityCapabilities.ts#1-158@
| `useDateRange` | Gestiona rangos ISO y display amigable. | Usado en feedback, versiones, reportes.@app/composables/common/useDateRange.ts#1-120@
| `useEntityPreviewFetch` | Obtiene previews lazy via `useApiFetch`, aplica `markLanguageFallback`. | Integrado en `EntityInspectorDrawer` y Feedback.@app/composables/common/useEntityPreviewFetch.ts#1-120@

## 4. Composables Manage
1. **`useEntity`**: CRUD SSR-first con `useAsyncData`, cache SWR, validación opcional Zod y soporte multi-idioma (`lang`, `includeLangParam`).@app/composables/manage/useEntity.ts#1-392@
   - Controla abortos, invalidaciones por entidad/idioma y expone `{ items, meta, pending, error, create, update, remove }`.
2. **Complementos**:
   - `useManageFilters`, `useManageColumns`, `useEntityModals`, `useEntityDeletion`, `useEntityPreview` coordinan filtros, columnas, modales, borrado y previews.@app/composables/manage/useManageFilters.ts#1-140@
   - `useEntityTags`, `useEntityTransfer`, `useFeedback`, `useEntityBulk` encapsulan acciones específicas y actualizan caches Manage.
3. **Contratos**: todos comparten interfaz `EntityCrudResult` y sincronizan `meta` vía `useListMeta`.

## 5. Composables Admin
| Composable | Función | Detalles |
| --- | --- | --- |
| `useContentVersions` | CRUD + publish, conserva `lastQuery`, usa `useListMeta`. | Pendiente reforzar rate limit/logging publish.@app/composables/admin/useContentVersions.ts#76-159@
| `useRevisions` | Listado y aprobación de revisiones con bulk actions, watchers debounced. | Debe adoptar `useTableSelection` compartido.@app/composables/admin/useRevisions.ts#1-260@
| `useContentFeedback` | Filtros avanzados (entidad, idioma, status, fecha) + preview caching. | Usa `buildParams`, `useQuerySync`, `useEntityPreviewFetch`.@app/composables/admin/useContentFeedback.ts#114-360@
| `useAdminUsersCrud` | CRUD de usuarios sin i18n, gestiona roles, permisos JSONB. | Extiende `useEntity` con capabilities específicas.@app/composables/admin/useAdminUsersCrud.ts#1-160@
| `useDatabaseExport` / `useDatabaseImport` | Export/import JSON/SQL con tracking de progreso y errores. | Requiere límites de tamaño y feedback amigable.@app/composables/admin/useDatabaseExport.ts#1-120@

## 6. Flujo SSR, cache e invalidaciones
1. **Fetch**: `useApiFetch` (wrapper con ETag) reemplaza `$fetch` y es utilizado por `useEntity`, `useContentFeedback`, `useContentVersions` para coherencia SSR.@docs/API.MD#24-60@
2. **SSR**: `useAsyncData` hidrata listados Manage; `useLazyAsyncData` se aplica en algunos dashboards Admin para evitar SSR pesado.@app/composables/manage/useEntity.ts#50-140@
3. **Caché**: `clearApiFetchCache`, `invalidateList`, `refetchOnLanguageChange` mantienen datos consistentes tras mutations/publish.
4. **Debounce/Abort**: `useDebounceFn` (VueUse) y control de aborts evitan requests redundantes en filtros/búsquedas.

## 7. Capacities, presets y Zod
1. **Capacities**: `useEntityCapabilities` provee capacidades a `EntityBase`, `ManageTableBridge`, `FormModal` para condicionar columnas, tags, previews, traducciones.
2. **Presets/Zod**: `useEntity` admite schemas Zod, mientras `FormModal` consume `entityFieldPresets` y `useEntityFormPreset` (en diseño) para mapear campos declarativos.@app/composables/manage/useEntity.ts#120-210@
3. **Admin gap**: composables admin aún no consumen presets unificados; pendiente `useEntityFormPreset` compartido.

## 8. Sincronización de queries
1. `useQuerySync` se integra en `AdvancedFiltersPanel`, `useContentFeedback`, `ManageEntityFilters` para compartir filtro mediante URL.
2. Admite `replace` vs `push`, serialización custom (tags, rangos), y callbacks `onSync` para side-effects.

## 9. Zonas legacy o pendientes
1. **Selección**: falta `useTableSelection` unificado; `RevisionsTable`, `FeedbackList`, `EntityTableWrapper` manejan arrays locales.
2. **Capabilities**: algunos componentes aún dependen de props (`translatable`, `noTags`); requiere migración total a provider.
3. **Previews**: ciertos consumidores de feedback usan endpoints manuales en lugar de `useEntityPreviewFetch`.
4. **Server pagination**: repetición de normalización `meta` en composables admin; urge wrapper `useServerPagination` basado en `buildFilters`.

## 10. Áreas de riesgo
1. **Caché inconsistente** si se omiten invalidaciones tras publish/delete.
2. **Desalineación de filtros** al modificar `useQuerySync` sin actualizar consumidores.
3. **Permisos**: divergencias en objeto `permissions` pueden habilitar acciones indebidas en UI.
4. **Multi-idioma**: omitir `lang` en requests (Manage/Admin) rompe fallback y puede sobrescribir EN.@server/utils/translatableUpsert.ts#83-190@

## 11. Buenas prácticas
1. Centralizar `meta` via `useListMeta`/`toListMeta` antes de exponerlo a componentes.
2. Usar siempre `useApiFetch`; prohibir `$fetch` directo salvo utilidades internas sin SSR.
3. Normalizar manejo de errores con `toErrorMessage`, toasts localizados y logging útil.
4. Aplicar debounce en inputs y abort controllers para evitar spam de requests.
5. Documentar cada composable con comentario introductorio (propósito, invariantes) siguiendo reglas del repo.

## 12. Roadmap de composables
| Prioridad | Acción | Impacto |
| --- | --- | --- |
| Alta | Crear `useTableSelection` compartido Manage/Admin. | Bulk actions coherentes, menos duplicación. |
| Alta | Implementar `useServerPagination` (wrapper `buildFilters` + meta). | Consistencia backend/frontend, menor boilerplate. |
| Media | Integrar `useEntityCapabilities` en todos los consumidores Manage/Admin. | Configuración declarativa, menos props. |
| Media | Añadir `useRequestMetrics` y exponer telemetría ligera. | Observabilidad desde UI y logs. |
| Baja | Finalizar `useEntityFormPreset` para Admin + presets declarativos. | Formularios consistentes, compatibilidad Fase 1.5. |
