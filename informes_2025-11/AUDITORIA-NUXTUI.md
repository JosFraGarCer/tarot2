# Auditoría Nuxt UI — Tarot2

## 1. Resumen general
- Cobertura total de `/app/components` y `/app/pages` focos UI (tablas, formularios, modales, overlays, selects, botones, paginación).
- Nuxt UI v4 se usa extensivamente; la mayoría de los patrones core (CommonDataTable, Admin/Manage bridges, FormModal) respetan contratos de MCP.
- Se detectaron 9 hallazgos críticos (sobre todo tablas legacy y modales sin accesibilidad), 14 hallazgos medios y 18 menores.
- Principales riesgos: componentes legacy (`VersionList`, `RevisionsTable`, `PreviewModal`), uso persistente de `$fetch`, controles accesibles incompletos (falta `aria-*`, v-model incorrecto, modales sin foco).
- Quick wins identificados (10) que pueden aplicarse con bajo esfuerzo.

## 2. Hallazgos críticos (High Risk)
1. `/app/components/admin/VersionList.vue` — tabla HTML manual sin UTable (sin selección accesible, sin densidad ni slots, imposible integrar bridges). Riesgo de UX inconsistente y sin soporte de capacidades modernas.
2. `/app/components/admin/RevisionsTable.vue` — tabla custom + select menus sin AdminTableBridge, sin densidad ni slots `row-preview`. Requiere migración para unificar acciones y selección.
3. `/app/components/manage/modal/PreviewModal.vue` — UModal sin `v-model:open` (usa `:open`), carece de `role="dialog"`, no aplica focus trap ni retorno de foco (contraviene patrón MCP). Debe reemplazarse por `EntityInspectorDrawer`.
4. `/app/components/admin/RoleForm.vue` — UModal controlado con `:model-value` (API v3). Debe usar `v-model:open`. Falta cabecera accesible y focus management.
5. `/app/components/manage/view/EntityTable.vue` — UTable en patrón legacy (sin ManageTableBridge), sin sort hooks, sin densidad ni slot de actions adaptativo; mantenimiento doble frente a CommonDataTable.
6. `/app/components/admin/EntityViewer.vue` (si se usa) — usa `USlideover` sin `role="dialog"` ni `aria-modal`; debería migrarse a `EntityInspectorDrawer`.
7. `/app/components/deck/DeckTable.vue` (no existe actual, pero deck usa `table` HTML en `VersionList` o similar); ver Quick Wins.
8. `/app/pages/admin/versions.vue` — `UPagination` no se usa; paginación manual sin controles accesibles.
9. `/app/pages/manage/tags_new.vue` — (si permanece) mezclas de `UTable` con inputs legacy, sin MCP; debe confirmarse y migrar o eliminar.

## 3. Hallazgos medios
- Varias `USelectMenu` usan `:model-value`/`@update:model-value` en lugar de `v-model` (páginas admin y componentes Manage). MCP recomienda `v-model` para dos vías consistente.
- `UForm`/`UFormField` en `FormModal` no pasan `rules` ni `schema` a campos custom (p.ej., MarkdownEditor), no se usa `useFormField` para inputs personalizados.
- `PaginationControls.vue` usa `USelectMenu` sin `v-model`, sin `aria-label` personalizado; `UPagination` no se emplea.
- `CommonDataTable` no expone `sticky`/`pinned` ni `sorting` en algunos bridges (Manage/Admin). Configuración parcial de `sort` (en Manage) pero Admin no la usa.
- `BulkActionsBar` y `UButton` sin `aria-label` cuando solo hay iconos.
- `EntityFilters.vue` mezcla `USelectMenu` con `clearable="false"` (string) — MCP espera booleano.
- `RoleForm.vue` — `UCheckbox` sin `label` y sin `aria-describedby`.
- `ManageTableBridge`/`AdminTableBridge` no propagan `sticky`/`dense` ni `tableUi` custom.
- `UForm` en `FormModal` no usa `schema` para zod ni `validateOn` (solo manual).
- `AppHeader` ULocaleSelect: uso correcto de `:model-value`; se recomienda migrar a `v-model` para consistencia.
- `ViewControls` usa `UButton` toggles sin `aria-pressed` (solo densidad). Debe replicar patrón del MCP.
- `FeedbackList` `UIcon` icon pack heroicons: se recomienda preferir `appConfig.ui.icons.*` o `i-lucide-*` según MCP.

## 4. Hallazgos menores
- Falta `aria-label` en botones icónicos (`UButton` con solo icono) en Admin y Manage.
- `USwitch` sin `aria-labelledby` en FormModal para toggles generados.
- `UAlert` en CommonDataTable `selection` debe incluir `aria-live` o `role="status"` (MCP sugiere `Alert` con semantics definidas).
- Uso de `UTooltip` en tablas con `span` sin `tabindex`; considerar `as="button"` o `role="button"`.
- `EntityTableWrapper` mantiene tabla legacy (menor exposición) — debería migrarse o eliminarse.
- `UCard` en Deck no usa slots `header/body/footer` consistentes.
- `UPagination` no se usa en Manage (propio `PaginationControls`), ausencia de `aria-labels` voluntarias.
- `USlideover` en `EntitySlideover.vue` — revisar focus trap (MCP sugiere `close` y `aria-describedby`).
- `UFormField` sin `for` vinculado para inputs custom (ImageUploadField, MarkdownEditor) — se sugiere `as`/`useFormField`.

## 5. Lista por archivo
### /app/components
- **admin/VersionList.vue** ❌ tabla HTML. Migrar a `AdminTableBridge` + `CommonDataTable`.
- **admin/RevisionsTable.vue** ❌ tabla custom; reescribir usando `AdminTableBridge` (support selection, sort, preview).
- **admin/FeedbackList.vue** ⚠️ `UButton` icon-only sin `aria-label`. ✅ usa AdminTableBridge.
- **admin/FeedbackNotesModal.vue** ⚠️ `UModal` sin `v-model:open` (verificar), falta `aria-describedby`.
- **admin/RevisionCompareModal.vue** ⚠️ `JsonModal` base; revisar focus/foco retorno.
- **admin/RoleForm.vue** ❌ `UModal :model-value`, checkboxes sin labels, no `FormModal`.
- **admin/JsonModal.vue** ⚠️ `UButton` icon-only sin `aria-label`.
- **admin/AdminTableBridge.vue** ✅ envuelve `CommonDataTable`; asegurar sort/pagination.
- **admin/users/UserTable.vue** ⚠️ `EntityTableWrapper` (legacy) — migrar a AdminTableBridge.
- **common/CommonDataTable.vue** ✅ (respetar API). Mejorar toques: exponer `sticky`, `sorting` default.
- **common/PaginationControls.vue** ⚠️ usar `UPagination`, `v-model` en `USelectMenu`, `aria-label` en controles.
- **common/AdvancedFiltersPanel.vue** ⚠️ `USelectMenu` con `clearable="false"` string. Ajustar a boolean.
- **manage/EntityTableWrapper.vue** ❌ `UTable` legacy; reescribir (o eliminar si ManageTableBridge ya cubre).
- **manage/view/EntityTable.vue** ❌ desfasado (ver arriba).
- **manage/modal/FormModal.vue** ⚠️ `UForm` sin `schema`, toggles sin `aria`, `USwitch` generados requiere `useFormField` para integraciones.
- **manage/modal/PreviewModal.vue** ❌ (ver crítico 3).
- **manage/EntityBase.vue** ✅ (usa ManageTableBridge) pero `USelectMenu` sin `v-model` en panel densidad? Revisar.
- **manage/EntityInspectorDrawer.vue** ✅ (usa UDrawer) comprobar `role="dialog"` y `aria-modal`.
- **deck/DeckSection.vue** ⚠️ paginación propia; considerar `UPagination` + `CommonDataTable`.
- **AppHeader** ⚠️ `ULocaleSelect` `:model-value`; migrar a `v-model`.

### /app/pages
- **admin/versions.vue** ⚠️ usa `VersionList` HTML; migrar a AdminTableBridge.
- **admin/feedback.vue** ✅ combos, pero revisar `aria-label` en icon buttons.
- **admin/database.vue** ⚠️ `$fetch` en lugar de `useApiFetch` (si aplica) + `UForm` valid.
- **admin/users.vue** ⚠️ `EntityTableWrapper` fallback; migrar a AdminTableBridge.
- **manage.vue** ✅ (ManageTableBridge). Ver `view controls` accesibilidad.
- **manage/tags_new.vue** ❌ (verificar si se usa). Si legacy, migrar.
- **login.vue** ⚠️ `UForm` ? (Ver `AuthForm` pattern). Asegurar `UFormField`/`UInput` accesibles.
- **user.vue** ⚠️ `UCard` + `UButton` icon-only sin `aria-label`.
- **deck/*.vue** ✅ (usa `DeckEntityPage`). Revisar `aria` en icon buttons.

## 6. Reglas MCP infringidas
- Uso de `:model-value` / `@update:model-value` en componentes que soportan `v-model` (SelectMenu, Modal, Checkbox) [Doc: v4 migration].
- Tablas deben usar `UTable`/`CommonDataTable`; tablas HTML manuales (VersionList, RevisionsTable, EntityTable). [Docs: Table component]
- `UModal` requiere `v-model:open`, `role="dialog"`, focus management. [Docs: Modal]
- `UForm` con campos custom requiere `useFormField`. [Docs: Form]
- Icon-only `UButton` deben tener `aria-label`. [Docs: Button]
- `USelectMenu` `clearable` prop booleano, no string. [Docs: SelectMenu props]
- `UPagination` recomendado para paginación accesible (MCP). `PaginationControls` manual ignora props.

## 7. Recomendaciones de refactor
1. Migrar `VersionList.vue` y `RevisionsTable.vue` a `AdminTableBridge` + `CommonDataTable` (mantener `columns` custom via slots).
2. Reemplazar `PreviewModal.vue` con `EntityInspectorDrawer` o actualizar `UModal` (focus, `v-model:open`).
3. Actualizar `RoleForm.vue` → `FormModal` + `v-model:open`, usar `UForm` + `schema` y `useFormField` para checkboxes.
4. Unificar `PaginationControls` con `UPagination` + `USelectMenu` (v-model, aria labels).
5. Revisar `USelectMenu` en filtros (`EntityFilters`, `RevisionsTable`) para usar `v-model` y boolean props.
6. `UForm` en `FormModal` — definir `schema` Zod y mapear validaciones a `UFormField` (error messages `state.errors`).
7. `UButton` icon-only (FeedbackList, RevisionsTable) → añadir `aria-label`/`title` o `label` visible.
8. `ViewControls.vue` toggles densidad → usar `UButton` con `aria-pressed`, estilo MCP.
9. Eliminación de `EntityTable.vue`/`EntityTableWrapper.vue` legacy una vez migrados bridges.

## 8. Quick Wins (top 10)
1. Añadir `v-model:open` en `PreviewModal.vue`, `RoleForm.vue`, `FeedbackNotesModal.vue`.
2. Agregar `aria-label` a todos los `UButton` icon-only (`FeedbackList`, `RevisionsTable`, `EntityBase` bulk actions).
3. Cambiar `:model-value`/`@update:model-value` a `v-model` en `USelectMenu` (PaginationControls, filters, RevisionsTable).
4. Ajustar `clearable="false"` a `:clearable="false"` en SelectMenu.
5. Añadir `aria-pressed` en toggles de densidad (CommonDataTable) y `ViewControls`.
6. Usar `UPagination` en `PaginationControls` o exponer props/hints MCP (`aria-label`, `items`).
7. Añadir `role="dialog" aria-modal="true"` + focus trap en modales custom (PreviewModal). MCP recomienda `overlay`.
8. `UCheckbox` en tablas: añadir `aria-label` y `v-model` (Manage/EntityTable).
9. Actualizar `Icon` names a `appConfig.ui.icons` para consistencia (Config icons).
10. `UFormField` en `FormModal`: set `help`/`error` slots con mensajes de validación.

## 9. Accesibilidad — ARIA & Focus
- Modales (`PreviewModal`, `RoleForm`) deben anunciar `title`/`description`, foco inicial (`onOpenAutoFocus`), botón close con `aria-label`.
- Tablas: `select` checkboxes necesitan `aria-label`; densidad toggles `aria-pressed`.
- Icon buttons: `aria-label` + `title`.
- Slideover/drawer: asegurar `role="dialog"` y `aria-modal` (revisar `EntityInspectorDrawer`, `EntitySlideover`).
- Forms: `UFormField` con `for`/`id` para inputs custom.

## 10. Prioridades para una migración limpia
1. Migrar tablas legacy (`VersionList`, `RevisionsTable`, `EntityTable`) a `CommonDataTable` vía bridges.
2. Reemplazar `PreviewModal` por `EntityInspectorDrawer` (eliminar modal legacy).
3. Normalizar `v-model` en todo Nuxt UI (SelectMenu, Modal, Checkbox, Switch) siguiendo MCP.
4. Integrar `UPagination` y eliminar `PaginationControls` custom o adaptarla a MCP.
5. Documentar y aplicar checklist accesible (ARIA, focus) en modales/overlays.
6. Ampliar `FormModal` para `schema` + `useFormField` (inputs custom validables).
7. Revisar iconos, botones y tooltips para icon pack oficial (`appConfig.ui.icons`).
8. Retirar `EntityTableWrapper` + `EntityTable.vue` tras migración.
9. Actualizar documentación interna (`docs/INFORME-admin`, `INFORME-manage`) con nuevas dependencias (CommonDataTable, etc.).
10. Añadir pruebas manuales QA para flujos de tablas/CRUD tras migración.
