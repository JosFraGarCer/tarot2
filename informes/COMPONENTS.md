# Informe de componentes Tarot2

## Resumen
El frontend de Tarot2 se apoya en NuxtUI 4 y una jerarquía de componentes organizados por ámbito (`common`, `manage`, `admin`). La reutilización se basa en contenedores polimórficos (`EntityBase`, `EntityTableWrapper`), paneles especializados (feedback, revisiones, users) y elementos de UI compartidos (PaginationControls, AdvancedFiltersPanel, badges). Este informe detalla el estado actual, dependencias y oportunidades de mejora.

## Componentes comunes (`app/components/common`)
| Componente | Rol | Observaciones |
| --- | --- | --- |
| `PaginationControls.vue` | Control de paginación con NuxtUI `UPagination`, `USelect`. | Parametrizable (`page`, `pageSize`, `totalItems`, `hasServerPagination`). Utilizado en Manage y Admin.[@app/components/manage/EntityBase.vue#126-135][@app/components/admin/RevisionsTable.vue#52-62] |
| `AdvancedFiltersPanel.vue` | Panel colapsable de filtros con sincronización de query y auto-apply opcional.[@app/components/common/AdvancedFiltersPanel.vue#1-332] | Usa `UCollapsible`, `UForm`, `USelectMenu`, `UToggle`. Escalable por schema. |
| `JsonModal.vue` | Modal de NuxtUI para visualizar JSON formateado. | Compartido entre versiones, revisiones y feedback. |
| Badges (`StatusChip`, `ReleaseStageChip`, `TranslationStatusBadge`) | Indicadores visuales de estado. | Deberían extenderse a un `StatusBadge` unificado. |
| `CommonDataTable.vue` | Tabla NuxtUI parametrizable con capacidades (`useListMeta`, `useEntityCapabilities`). | Excelente base para uniformar tablas Admin/Manage, pendiente adopción total.[@app/components/common/CommonDataTable.vue#110-320] |

### Oportunidades
- Consolidar badges de estado/etapa en componente único.
- Exponer `CommonDataTable` como wrapper oficial para tablas Admin, reduciendo personalizaciones duplicadas.
- Añadir accesibilidad (ARIA) consistente en modales y toolbars.

## Componentes Manage (`app/components/manage`)
### Contenedor principal: `EntityBase.vue`
- Coordina filtros (`ManageEntityFilters`), vistas múltiples (tabla, tarjeta, classic, carta) y modales (form, preview, tags, feedback, import).[@app/components/manage/EntityBase.vue#22-232]
- Propiedades clave: `columns`, `translatable`, `cardType`, `noTags`.
- Conecta composables (`useEntity`, `useManageFilters`, `useEntityModals`, `useEntityDeletion`, `useEntityPreview`).

### Vistas y wrappers
| Componente | Descripción |
| --- | --- |
| `EntityTableWrapper.vue` | Envuelve `EntityTable`, maneja selección, toolbar de acciones, normalización de filas; utiliza `UButton`, `UCheckbox`, `UIcon`.[@app/components/manage/EntityTableWrapper.vue#1-312] |
| `EntityTable.vue` | (Dentro de `view/`) construye tabla con NuxtUI `UTable` y slots de acciones. |
| `EntityCards.vue`, `EntityCardsClassic.vue`, `EntityCarta.vue` | Distintas representaciones visuales (cards tipo grid, lista clásica, carta temática). |
| `ManageEntityCarta` | Renderiza la vista “carta” con plantillas y preview.

### Modales y acciones
- `modal/FormModal.vue`: formulario dinámico con Zod, `UForm` y `UInput`/`USelect`.
- `modal/PreviewModal.vue`: previsualización de carta con `UCard`.
- `modal/EntityTagsModal.vue`, `modal/FeedbackModal.vue`, `modal/ImportJson.vue`.
- `common/DeleteDialogs.vue`: confirmación para borrar entidad/traducción.

### Observaciones
- `EntityTableWrapper` repite lógica de selección que conviene extraer.
- `FormModal` debería alinearse con presets por entidad para reducir branching.
- La integración con `useEntityCapabilities` puede simplificar props (`translatable`, `noTags`, etc.).

## Componentes Admin (`app/components/admin`)
### Users
- `users/ManageUsers.vue`: orquesta vista con componentes personalizados de tabla, lista y grid.[@app/components/admin/users/ManageUsers.vue#180-199]
- `users/UserTable.vue`: wrapper de `EntityTableWrapper` adaptado a usuarios (badges, métricas en header).[ @app/components/admin/users/UserTable.vue#1-83 ]
- `users/UserListClassic.vue`, `UserCardsGrid.vue`, `UserCartaView.vue`: vistas alternativas reutilizando Manage components.

### Versions & Revisions
| Componente | Rol |
| --- | --- |
| `VersionList.vue` | Lista de versiones con filtros básicos, crea/edita mediante `VersionModal`. |
| `VersionModal.vue` | Modal NuxtUI (`UModal`, `UInput`, `UTextarea`, `USelectMenu`) para crear/editar versiones y release stage.[@app/components/admin/VersionModal.vue#1-123] |
| `RevisionsTable.vue` | Tabla de revisiones con selección, acciones masivas, `PaginationControls`, `JsonModal` para diffs.[@app/components/admin/RevisionsTable.vue#1-215] |
| `RevisionCompareModal.vue` | Comparación A/B de revisiones. |

### Feedback
- `FeedbackDashboard.vue`: métricas agregadas y tabs.
- `FeedbackList.vue`: tabla con preview, badges de idioma, estado, acciones (view, notes, resolve, link entity).[ @app/components/admin/FeedbackList.vue#1-105 ]
- `FeedbackNotesModal.vue`: modal para notas internas con historial estilo log.[@app/components/admin/FeedbackNotesModal.vue#1-63]

### Database & Misc
- `DatabaseExport.vue`, `DatabaseImport.vue`: manejo de backups.
- `AdminHomeCards.vue`: tarjetas de acceso rápido.

### Observaciones
- Tablas Admin replican patrones (selección, toolbars, badges) que pueden migrarse a `CommonDataTable` + `BulkActionsBar`.
- `FeedbackList` necesita integración con `useEntityPreviewFetch` para unificar previews (evitar rutas inexistentes).
- `VersionModal` y `Revision` carecen de validaciones NuxtUI accesibles (mensajes `aria-live`).

## Integración NuxtUI 4
- Se utilizan componentes `UButton`, `UInput`, `USelectMenu`, `UBadge`, `UTooltip`, `UCheckbox`, `UModal`, `USkeleton`, `UPagination`, etc.
- Colores siguen escala neutral/primary/warning/error; se recomienda revisar contraste y modo oscuro.
- Se habilita densidad configurables en tablas (`CommonDataTable`), aunque no en todas las vistas (pendiente unificar).

## Dependencias notables con composables
- `EntityBase` ↔ `useEntity` / `useManageFilters` / `useEntityDeletion` / `useEntityModals`.
- `UserTable` ↔ `useAdminUsersCrud` y capabilities personalizadas (`translatable=false`).
- `RevisionsTable` ↔ `useRevisions`, `useCurrentUser`, `useDebounceFn`.
- `FeedbackList` ↔ `useContentFeedback`, `useEntityPreviewFetch`, `useQuerySync` (a través de dashboard).

## Oportunidades de refactor
1. **`CommonDataTable` como base única**: migrar `EntityTableWrapper`, `FeedbackList`, `RevisionsTable` y tablas Admin a este componente para unificar selección, densidad y toolbar.
2. **`BulkActionsBar`**: extraer barra sticky con acciones masivas (resolve/reopen/publish) y contadores, disponible tanto en Manage como Admin.
3. **`StatusBadge` unificado**: combinar `StatusChip`, `ReleaseStageChip`, `TranslationStatusBadge` con API declarativa (`variant`, `icon`).
4. **Form presets**: `FormModal` debería recibir metadata (schema, fields) desde composable central para evitar condicionales por entidad.
5. **Accesibilidad**: añadir `aria-describedby`, `aria-live` en modales de error/success y asegurar focus management (`UFocusTrap`).
6. **Preview drawer**: crear `EntityInspectorDrawer` (USlideover) reutilizable para previews en tablas (feedback, manage) y eliminar modales ad-hoc.
7. **Skeletons reutilizables**: extraer skeleton para tablas/listas a componente compartido (`TableSkeleton`, `CardSkeleton`).

## Buenas prácticas de implementación
- Mantener imports con alias consistentes (`~/` para componentes, `@/` para utilidades).[@docs/INFORME-manage.md#55-80]
- Usar `defineModel`/`v-model:open` para modales con tipado claro.
- Validar formularios con Zod o NuxtUI `UForm` y mostrar mensajes localizados (`tt()` helpers).
- Documentar props y slots en componentes comunes para facilitar adopción.
- Añadir stories/demos (Storybook o documentación interna) para componentes complejos (EntityBase, AdvancedFiltersPanel).

## Roadmap de componentes
| Prioridad | Acción | Impacto |
| --- | --- | --- |
| Alta | Migrar tablas Admin/Manage a `CommonDataTable` + `BulkActionsBar` | Consistencia, menos duplicación |
| Media | Unificar badges y toolbars, integrar `EntityCapabilities` | Configuración declarativa |
| Media | Refactor previews en Drawer + `useEntityPreviewFetch` | UX consistente, evita endpoints inexistentes |
| Baja | Stories y documentación interna | Onboarding y QA |

## Conclusión
Tarot2 dispone de un set rico de componentes reutilizables y específicos. Para escalar sin deuda, es prioritario unificar tablas, badges y previews, alinear formularios con presets declarativos y reforzar la accesibilidad, siempre apalancando NuxtUI 4 para garantizar cohesión visual y mantenibilidad.
