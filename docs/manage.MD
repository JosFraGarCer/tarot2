# Informe técnico de la sección /manage

Este informe detalla la arquitectura actual, dependencias, problemas detectados, oportunidades de optimización y un plan de acción para fijar, optimizar y limpiar el código de la página `/manage` y sus dependencias.

## Alcance
- Página: `app/pages/manage.vue`
- Componentes núcleo:
  - `app/components/manage/EntityBase.vue`
  - `app/components/manage/EntityFilters.vue`
  - `app/components/manage/EntityTable.vue`
  - `app/components/manage/ViewControls.vue`
  - `app/components/manage/EntityActions.vue`
  - Vistas de lista:
    - `app/components/manage/view/EntityCardsView.vue`
    - `app/components/manage/view/EntityCardsView2.vue`
    - `app/components/manage/view/EntityCarta.vue`
    - `app/components/manage/view/EntityTable.vue` (tabla visual interna)
  - Modales/comunes:
    - `app/components/manage/modal/FormModal.vue`
    - `app/components/manage/modal/PreviewModal.vue`
    - `app/components/manage/common/DeleteDialogs.vue`
    - `app/components/manage/common/ImageUploadField.vue`
- Composables:
  - `app/composables/manage/useManageView.ts`
  - `app/composables/manage/useEntity.ts`
  - `app/composables/manage/useEntityRelations.ts`
  - `app/composables/manage/useTranslationActions.ts`
  - CRUD específicos:
    - `useWorld.ts`, `useArcana.ts`, `useFacet.ts`, `useSkill.ts`, `useCardType.ts`, `useBaseCard.ts`, `useTag.ts`
  - Presets: `entityFieldPresets.ts`

# Mapa de dependencias y flujo
- **/app/pages/manage.vue**
  - Usa `useManageView()` para estado de vista (`viewMode`, `templateKey`, `templateOptions`).
  - Renderiza `ViewControls` (cambia modo de vista y plantilla)
  - Configura pestañas y por cada pestaña monta `ManageEntity (EntityBase.vue)` con:
    - `label`, `useCrud` (composable de CRUD), `viewMode`, `entity`, `filtersConfig`, `cardType`, `noTags`.

- **EntityBase.vue** (contenedor de lógica y UI)
  - Muestra `EntityFilters` arriba y una vista según `viewMode`: `tabla` → `ManageEntityTable`, `tarjeta` → `ManageEntityCards`, `tarjeta2` → `ManageEntityCards2`, caso por defecto → `ManageEntityCarta`.
  - Pagina con `PaginationControls`.
  - Maneja modales: `PreviewModal`, `FormModal`, `DeleteDialogs`.
  - Contiene mucha lógica de UI/negocio: edición/creación, carga de imágenes, prefetch de traducción en inglés, borrado vs borrado de traducción, cambios de estado optimistas, preview, tags, feedback, paginación, exportación y lote.

- **EntityFilters.vue**
  - Controla filtros con `crud.filters.*` y carga perezosa de datasets (tags, tipos, arcana, facets, padres) con `useLazyAsyncData` + `useApiFetch` según configuración recibida.

- **Vistas de tarjetas y carta**
  - `EntityCardsView.vue` y `EntityCardsView2.vue`: dos layouts muy similares para tarjetas; ambas usan `EntityActions` y duplican helpers de estado/resolución de imagen.
  - `EntityCarta.vue`: compone una tarjeta grande (plantilla de carta) + acciones + badges. Usa `useCardTemplates` para resolver componentes de template.

- **ViewControls.vue**
  - Cambia `viewMode` y, si `carta`, permite elegir `templateKey`; persiste en `localStorage` si `storageKey` está presente.

# Hallazgos y problemas detectados
- **[bloqueante] Template no conectado en `EntityCarta.vue`**
  - `EntityCarta.vue` fija `const templateKey = 'Class'` y no acepta `templateKey` por props; ignora el valor seleccionado en `ViewControls`/`useManageView`.
  - `EntityBase.vue` tampoco pasa `templateKey` a `ManageEntityCarta`.
  - Efecto: cambiar la plantilla en el UI no tiene impacto en la vista "carta".

- **[bug] Falta import de `computed` en `EntityCarta.vue`**
  - Se usa `computed(() => resolveTemplate(...))` sin importar `computed` de `vue`.

- **[consistencia] Duplicación de helpers en vistas de tarjetas**
  - `EntityCardsView.vue` y `EntityCardsView2.vue` duplican:
    - `resolveImage`, `titleOf`, `isActive`, `langBadge`, y utilidades de estado (`statusColor/Variant/LabelKey`).
  - Oportunidad clara de extraer a composables/utilidades compartidas.

- **[naming] Colisión semántica `EntityTable.vue`**
  - `app/components/manage/EntityTable.vue` es un wrapper que importa y envuelve `app/components/manage/view/EntityTable.vue`.
  - El mismo nombre "EntityTable" para wrapper y vista interna puede confundir mantenedores y herramientas.

- **[UX/i18n] Tooltips repetidos**
  - En `ViewControls.vue` ambas vistas de tarjeta usan `:text="$t('view.card')"`; idealmente distinguir `view.card` vs `view.columns` o similar para `tarjeta2`.

- **[dead code] `statusMenu` en `EntityActions.vue`**
  - `statusMenu` se computa pero no se usa ni se expone.

- **[tipado] Uso extensivo de `any`**
  - En varios componentes y eventos (`crud`, entidades, emisiones), lo que dificulta refactor y validación en tiempo de compilación.

- **[consistencia eventos] `EntityActions` emite `editform` pero padres usan `@edit`**
  - En las vistas se mapea correctamente (`@editform="() => emit('edit', item)"`), pero convendría alinear los nombres y evitar adaptadores innecesarios.

- **[ruido] `console.log` en producción**
  - `manage.vue` deja un `console.log` en `onCreateEntity`. También hay logs de stub en `EntityBase.vue`.

- **[persistencia UI] `ViewControls` guarda en `localStorage` pero no se inyecta `storageKey` desde `manage.vue`**
  - Si se desea persistencia entre sesiones, falta pasar `storage-key`.

# Oportunidades de refactor (separación a composables)
- **useManageView**
  - Ya centraliza `viewMode`, `templateKey`, `templateOptions`. Extender para incluir `storageKey` y restaurar desde `localStorage` si está presente.

- **Nuevos composables propuestos**
  - `useEntityPagination(crud)`: `page`, `pageSize`, `totalItems`, `totalPages`, handlers, default page sizes.
  - `useEntityPreview()`: `previewData`, `previewOpen`, `setPreviewOpen`, `openPreview(entity)`.
  - `useEntityModals(crud)`: estado de modal de formulario, `isEditing`, `modalFormState`, validación, submit/cancel, precarga de traducciones, integración de `useTranslationActions`.
  - `useImageUpload()`: `imageFile`, `imagePreview`, `handleImageFile`, `handleRemoveImage`.
  - `useOptimisticStatus(crud)`: `onChangeStatus(entity, nextStatus)` con rollback y toasts.
  - `useEntityDeletion(crud)`: flujos de borrado total vs borrado de traducción, `DeleteDialogs` state y confirmaciones.
  - `useCardViewHelpers(entityType)`: `resolveImage`, `titleOf`, `isActive`, `langBadge`, y helpers de estado (`statusColor/Variant/LabelKey`).

- **Helpers/constantes**
  - Extraer `entityConfigs` de `manage.vue` a `composables/manage/useManageConfigs.ts` o `configs/manageEntities.ts` (constante) para facilitar pruebas y reutilización.
  - Unificar claves de `useLazyAsyncData` y parametrizarlas por entidad para evitar colisiones si hay múltiples instancias.

- **Naming/estructura**
  - Renombrar `app/components/manage/EntityTable.vue` (wrapper) a `EntityTableWrapper.vue` o `ManageTable.vue` para evitar confusión con `view/EntityTable.vue`.

# Errores concretos y cómo corregirlos
- **Conectar template en `EntityCarta.vue`**
  - Aceptar `templateKey` por `props` y usarlo en la resolución del template.
  - En `EntityBase.vue`, pasar `:template-key="templateKey"` cuando `viewMode === 'carta'`.


- **Tooltips de `ViewControls.vue`**
  - Cambiar el tooltip de `tarjeta2` a una clave distinta (`view.cardsCompact` o `view.columns`). Añadir traducciones en `i18n/locales`.

- **Eliminar código muerto y logs**
  - Quitar `statusMenu` si no se usa, o implementarlo en UI.
  - Remover `console.log` de producción o guardarlo tras una bandera de `dev`.

- **Alinear eventos**
  - Cambiar emisión de `EntityActions` de `editform` a `edit` y ajustar consumidores, o mantener ambos eventos por compatibilidad temporal.

# Sugerencias de optimización y limpieza
- **Reducir duplicación en vistas**
  - Crear `useCardViewHelpers` y usarlo en `EntityCardsView.vue`, `EntityCardsView2.vue`, `EntityCarta.vue`.

- **Tipado fuerte**
  - Definir `Entity` base (id, name/title/code, status, is_active, language_code, image, tags, relaciones) y usar `Partial<>` o variantes por entidad.
  - Tipar `crud` con una interfaz común: `items`, `loading`, `error`, `filters`, `schema`, `pagination`, `resourcePath`, y callbacks (`fetchList`, `updateStatus`, etc.).

- **Consistencia de filtros**
  - Estandarizar claves de filtros en cada CRUD (ej. `status`, `is_active`, `tag_ids`, etc.) y mapear en `EntityFilters` mediante `config`.

- **Persistencia de vista**
  - Pasar `storage-key` a `ViewControls` desde `manage.vue` (p. ej., `storage-key="manage"`) y retomar valor inicial desde `localStorage` en `useManageView`.

- **Accesibilidad**
  - Asegurar `aria-label` o `title` consistente en icon buttons (algunos ya lo tienen).

- **Rendimiento**
  - Evitar recrear funciones inline en bucles (`v-for`) cuando no es necesario; usar `@click="() => ..."` puede crear closures por item. Considerar handlers con parámetro.
  - `useLazyAsyncData` con `server: false` y claves estáticas: parametrizar por `locale` si el dataset depende del idioma.

# Tareas propuestas (plan de acción)
- **[Alta] Conectar plantilla de carta**
  - EntityCarta: props `templateKey` y `import { computed }`.
  - EntityBase: pasar `:template-key="templateKey"` a `ManageEntityCarta`.

- **[Alta] Extraer helpers compartidos**
  - Crear `composables/common/useCardViewHelpers.ts` con: `resolveImage(entityType, src)`, `titleOf`, `isActive`, `langBadge(locale)`, y helpers de estado (`useCardStatus` wrappers).
  - Reemplazar duplicaciones en `EntityCardsView.vue`, `EntityCardsClassic.vue`, `EntityCarta.vue`.

- **[Media] Renombrar wrapper de tabla**
  - `EntityTable.vue` → `ManageEntityTableWrapper.vue` (o similar) y actualizar imports.

- **[Media] Limpiar eventos y código muerto**
  - Unificar evento `edit` en `EntityActions` (seguir emitiendo `editform` deprecado en una versión) y eliminar `statusMenu` si no se usa.

- **[Media] Mover lógica de EntityBase a composables**
  - Dividir en los composables propuestos (`useEntityModals`, `useEntityDeletion`, `useEntityPagination`, `useImageUpload`, `useOptimisticStatus`, `useEntityPreview`).

- **[Baja] Mejoras de i18n/UX**
  - Claves diferenciales para tooltips.
  - Añadir `storageKey` y recuperación inicial en `useManageView`.

# Riesgos y pruebas recomendadas
- **Riesgos**
  - Cambios en eventos (`editform` → `edit`) pueden romper integraciones; aplicar deprecación progresiva.
  - Renombrar componentes requiere actualizar rutas de import en múltiples archivos.
  - Extraer lógica a composables puede alterar dependencias reactivas; escribir pruebas básicas de interacción.

- **Pruebas manuales**
  - Cambiar entre `tarjeta`, `tarjeta2`, `carta`, `tabla` y verificar renders y persistencia.
  - Seleccionar distintas `templateKey` y confirmar que `EntityCarta` muestra el template correcto.
  - Filtrar por cada tipo de filtro en cada entidad.
  - Crear/editar/borrar entidad y borrar traducción en idioma local vs entidad completa en inglés.

- **Pruebas unitarias ligeras (si aplica)**
  - Helpers de `useCardViewHelpers` y normalización de filas de tabla.
  - `useManageView` con `storageKey`.

# Checklist de implementación
- **Correcciones**
  - [ ] `EntityCarta.vue` importa `computed` y usa `props.templateKey`.
  - [ ] `EntityBase.vue` pasa `:template-key`.
- **Refactor inicial**
  - [ ] Crear `useCardViewHelpers` y reemplazar duplicados.
  - [ ] Renombrar wrapper de tabla y ajustar imports.
  - [ ] Limpiar logs y código muerto.
- **Refactor progresivo (composables)**
  - [ ] Extraer modales/preview/paginación/estado/imagen/borrado a composables.
  - [ ] Tipar `crud` y entidades.

---

Este documento sirve como guía para abordar la limpieza y optimización de la sección `/manage` de forma incremental y segura, priorizando correcciones visibles para el usuario y mejoras estructurales que reduzcan duplicaciones y faciliten el mantenimiento.

Haz un nuevo informe minucioso en markdown  que guardaras en /docs/nuevo_manage.MD de la pagina /manage y toda sus dependencias. 
Nuestro objetivo es fijar, optimizar y limpiar el codigo de esta seccion.
Separar parte logica a composables para mejor mantenimiento y legibilidad evitar redundacias de codigo y funciones.
Buscar errores.
Por ultimo en el informe destaca sugerencias para esta seccion como por ejemlo Uskeleton para los loading