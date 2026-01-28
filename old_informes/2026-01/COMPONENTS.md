# Informe de componentes Tarot2

## Índice
1. [Resumen general](#1-resumen-general)
2. [Componentes comunes](#2-componentes-comunes)
3. [Bridges y pipelines de tablas](#3-bridges-y-pipelines-de-tablas)
4. [Vistas y componentes Manage](#4-vistas-y-componentes-manage)
5. [Vistas y componentes Admin](#5-vistas-y-componentes-admin)
6. [Modales y formularios](#6-modales-y-formularios)
7. [Previews y drawers](#7-previews-y-drawers)
8. [Dependencias y flujos cruzados](#8-dependencias-y-flujos-cruzados)
9. [Zonas legacy y oportunidades](#9-zonas-legacy-y-oportunidades)
10. [Áreas de riesgo](#10-áreas-de-riesgo)
11. [Buenas prácticas](#11-buenas-prácticas)
12. [Roadmap de componentes](#12-roadmap-de-componentes)

## 1. Resumen general
El frontend de Tarot2 se sustenta en Nuxt UI 4 y una jerarquía organizada por ámbitos (`common`, `manage`, `admin`). Los patrones modernos pivotan sobre `CommonDataTable`, los bridges (`ManageTableBridge`, `AdminTableBridge`), el drawer `EntityInspectorDrawer` y el formulario dinámico `FormModal`. La convergencia aún convive con capas legacy (tablas manuales, modales específicos), por lo que este informe sirve como mapa para migraciones, mantenimiento y reglas de edición futuras.

## 2. Componentes comunes
| Componente | Rol | Observaciones |
| --- | --- | --- |
| `CommonDataTable.vue` | Shell de tabla Nuxt UI con selección, densidad, toolbar y paginación integradas. | Base para Manage/Admin, expone slots (`row`, `cell:<key>`, `toolbar`).@app/components/common/CommonDataTable.vue#1-320@
| `AdvancedFiltersPanel.vue` | Panel colapsable de filtros dinámicos (schema-driven) con sincronización de query. | Usa `UForm`, `USelectMenu`, `UCalendar`, `useQuerySync` para compartir filtros.@app/components/common/AdvancedFiltersPanel.vue#1-332@
| `PaginationControls.vue` | Control de paginación/densidad reutilizado por tablas puente. | Opera con `ListMeta` generado por composables.@app/components/common/PaginationControls.vue#1-160@
| `StatusBadge.vue` | Badge unificado para estados, releases y traducciones. | Sustituye chips legacy (`ReleaseStageChip`, `TranslationStatusBadge`).@app/components/common/StatusBadge.vue#1-120@
| `EntityInspectorDrawer.vue` | Drawer accesible para previews, integrando `EntitySummary` y tabs adicionales. | Conecta con `useEntityPreviewFetch` y capabilities de entidad.@app/components/common/EntityInspectorDrawer.vue#1-220@
| `JsonModal.vue` | Modal genérico para diffs/JSON estructurado. | Consumido por Revisions y Feedback para comparaciones.@app/components/admin/JsonModal.vue#1-110@

## 3. Bridges y pipelines de tablas
| Bridge | Descripción | Dependencias |
| --- | --- | --- |
| `ManageTableBridge.vue` | Adapta datos Manage a `CommonDataTable`, integra selección, `BulkActionsBar`, slots y capabilities.@app/components/manage/ManageTableBridge.vue#1-240@
| `AdminTableBridge.vue` | Variante Admin que añade inspección integrada y bulk actions administrativas.@app/components/admin/AdminTableBridge.vue#1-210@
| **Legacy** `EntityTableWrapper.vue` | Wrapper previo basado en `EntityTable` y `UTable`; mantiene lógica duplicada de selección.@app/components/manage/EntityTableWrapper.vue#1-107@

**Pipeline recomendado**: Composable CRUD (`useEntity`/`useContentFeedback`) → Bridge → `CommonDataTable` → Slots específicos (celdas, toolbar). Este patrón asegura capabilities declarativas y reduce duplicación.

## 4. Vistas y componentes Manage
1. **Contenedor**: `EntityBase.vue` coordina filtros (`ManageEntityFilters` + `AdvancedFiltersPanel`), vistas (tabla/cards/classic/carta), modales, preview y bulk actions.@app/components/manage/EntityBase.vue#22-232@
2. **Vistas**:
   - `EntityCards.vue`, `EntityCardsClassic.vue`, `EntityCarta.vue` reutilizan `EntitySummary`, `StatusBadge` y capabilities para distintos layouts.@app/components/manage/view/EntityCards.vue#1-160@
3. **Modales asociados**: `FormModal`, `EntityTagsModal`, `FeedbackModal`, `ImportJson` cubren CRUD, tags, feedback y carga masiva.@app/components/manage/modal/FormModal.vue#1-340@
4. **Legacy**: `EntityTable.vue` (dentro de `view`) y `PreviewModal.vue` siguen activos por compatibilidad.

## 5. Vistas y componentes Admin
1. **Usuarios**: `ManageUsers.vue` orquesta tabs y vistas; `UserTable.vue` aún se apoya en `EntityTableWrapper` y métricas custom.@app/components/admin/users/UserTable.vue#1-90@
2. **Versiones/Revisiones**: `VersionList.vue` (tabla manual), `RevisionsTable.vue` (bridge parcially adoptado), `RevisionCompareModal.vue`, `JsonModal` para diffs.@app/components/admin/RevisionsTable.vue#1-320@
3. **Feedback**: `FeedbackList.vue` utiliza `AdminTableBridge`, previews integrados y bulk resolve/reopen/delete.@app/components/admin/FeedbackList.vue#1-380@
4. **Dashboards**: `FeedbackDashboard.vue`, `AdminHomeCards.vue` presentan resúmenes y accesos rápidos.

## 6. Modales y formularios
| Componente | Ámbito | Observaciones |
| --- | --- | --- |
| `modal/FormModal.vue` | Manage | Genera formularios dinámicos usando presets (`entityFieldPresets`) + Zod, con soporte multi-idioma y uploads.@app/components/manage/modal/FormModal.vue#1-340@
| `VersionModal.vue` | Admin | Modal manual (`UModal`, `UForm`) para versiones; requiere migración a presets/FormModal.@app/components/admin/VersionModal.vue#1-123@
| `RoleForm.vue` | Admin | Formulario ad-hoc de permisos; no reutiliza presets ni `FormModal` aún.@app/components/admin/RoleForm.vue#1-84@
| `FeedbackNotesModal.vue` | Admin | Modal para notas internas con historial de cambios.@app/components/admin/FeedbackNotesModal.vue#1-63@

**Invariante**: toda nueva experiencia CRUD debe usar `FormModal` o un wrapper equivalente con presets declarativos, integrando Zod + capabilities.

## 7. Previews y drawers
1. `EntityInspectorDrawer.vue` es el patrón objetivo para Manage/Admin; integra breadcrumbs, tabs, `EntitySummary` y acciones contextuales.@app/components/common/EntityInspectorDrawer.vue#1-220@
2. `useEntityPreviewFetch` suministra datos lazy con soporte multi-idioma.@app/composables/common/useEntityPreviewFetch.ts#1-120@
3. `PreviewModal.vue` (legacy) persiste en Manage; debe eliminarse tras migrar vistas a drawer.@app/components/manage/modal/PreviewModal.vue#1-47@

## 8. Dependencias y flujos cruzados
- **Componente ↔ Composable**: `ManageTableBridge` ↔ `useEntity`, `useManageColumns`; `FeedbackList` ↔ `useContentFeedback`; `RevisionsTable` ↔ `useRevisions`.
- **Componente ↔ API**: `CommonDataTable` renderiza datos normalizados por `createPaginatedResponse`; `EntityInspectorDrawer` consume endpoints preview (`/api/<entity>/:id`).
- **Capacities**: `useEntityCapabilities` alimenta componentes Manage/Admin para habilitar features (tags, translations, preview) sin props sueltas.
- **SSR**: `useApiFetch` + `useAsyncData` proveen datos a `EntityBase`, `ManageUsers`, `FeedbackList`, asegurando coherencia 200/304.

## 9. Zonas legacy y oportunidades
| Área | Estado actual | Acción recomendada |
| --- | --- | --- |
| Tablas legacy (`EntityTableWrapper`, `VersionList`, `UserTable`) | Lógica de selección duplicada, sin densidades modernas. | Migrar a bridges + `CommonDataTable` con `BulkActionsBar`. |
| Previews (`PreviewModal`) | Modal sin focus trap ni capabilities declarativas. | Consolidar en `EntityInspectorDrawer`. |
| Formularios Admin | Implementaciones manuales no compatibles con presets. | Extender `FormModal`/presets a roles, versiones, usuarios. |
| Toolbars/Bulk actions | Botones repetidos en varias vistas. | Crear `BulkActionsBar` compartida con contadores y slots. |
| Skeletons/loading | Estructuras manuales por vista. | Extraer `TableSkeleton`, `CardSkeleton` reutilizables. |

## 10. Áreas de riesgo
1. **Selección dual** entre `EntityTableWrapper` y `CommonDataTable` puede provocar inconsistencias en bulk actions.
2. **Previews mixtos** (drawer + modal) dificultan accesibilidad y mantenimiento.
3. **Formularios manuales** pueden divergir del backend/Zod, generando errores de validación.
4. **Badges dispersos**: convivencia de `StatusBadge` y chips antiguos causa inconsistencias visuales.
5. **Falta `useApiFetch`** en dashboards Admin compromete SSR y caching.

## 11. Buenas prácticas
1. Usar bridges oficiales (`ManageTableBridge`, `AdminTableBridge`) para cualquier tabla nueva o migrada.
2. Integrar `useApiFetch` y `useListMeta` en componentes SSR para mantener contratos `{ success, data, meta }`.
3. Respetar accesibilidad: `UModal`/`USlideover` con `role="dialog"`, `aria-modal`, `UFocusTrap` y retorno de foco.
4. Documentar propósito/invariantes en comentarios iniciales al crear componentes nuevos siguiendo reglas del repositorio.
5. Coordinar cambios UI ↔ backend ↔ composables, actualizando codemaps y este informe tras cada migración relevante.

## 12. Roadmap de componentes
| Prioridad | Acción | Impacto |
| --- | --- | --- |
| Alta | Migrar `EntityTableWrapper`, `UserTable`, `VersionList` a bridges + `CommonDataTable`. | Unificación UI, reducción deuda. |
| Alta | Sustituir `PreviewModal` por `EntityInspectorDrawer` en todo Manage. | UX accesible y consistente. |
| Media | Ampliar `FormModal` + presets a flujos Admin (roles, versiones). | Formularios declarativos, compatibilidad presets. |
| Media | Extraer `BulkActionsBar` y skeletons comunes. | UX homogénea en cargas y acciones masivas. |
| Baja | Documentar componentes en Storybook/MDX + lint de imports cross-scope. | Onboarding ágil, evita dependencias cruzadas. |
