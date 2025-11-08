# Informe técnico: página /manage y dependencias

Fecha: 2025-11-08

## Resumen ejecutivo
- Objetivo: fijar, optimizar y limpiar el código de la sección `/manage`, separando lógica en composables para mejorar mantenibilidad, legibilidad y reducir redundancias.
- Estado: se unificó tipado del CRUD y entidades, se estandarizaron filtros, y se extrajo la lógica de `EntityBase.vue` en composables especializados.
- Próximos pasos: mejorar experiencia de carga (skeletons), cobertura de tipado restante, limpieza de logs, pruebas ligeras y verificación de accesibilidad.

---

## Alcance y componentes clave

- Página: `app/pages/manage.vue`
- Contenedor principal: `app/components/manage/EntityBase.vue`
- Vistas:
  - `app/components/manage/view/EntityTable.vue`
  - `app/components/manage/EntityTableWrapper.vue`
  - `app/components/manage/view/EntityCards.vue`
  - `app/components/manage/view/EntityCardsClassic.vue`
  - `app/components/manage/view/EntityCarta.vue`
- Controles y comunes:
  - `app/components/manage/ViewControls.vue`
  - `app/components/manage/EntityFilters.vue`
  - `app/components/manage/common/DeleteDialogs.vue`
  - `app/components/common/PaginationControls.vue`
- Modales:
  - `app/components/manage/modal/FormModal.vue`
  - `app/components/manage/modal/PreviewModal.vue`
- Composables manage:
  - `app/composables/manage/useEntity.ts` (CRUD genérico)
  - `app/composables/manage/useManageView.ts` (modo de vista y templateKey)
  - `app/composables/manage/useWorld.ts`, `useArcana.ts`, `useFacet.ts`, `useSkill.ts`, `useBaseCard.ts`, `useCardType.ts`, `useTag.ts`
  - Nuevos: `useEntityPagination`, `useEntityPreview`, `useImageUpload`, `useEntityDeletion`, `useOptimisticStatus`, `useEntityModals`
- Tipos:
  - `app/types/entities.ts` (entidades de dominio)
  - `app/types/manage.ts` (ManageEntity, ManageCrud, AnyManageCrud)
- Utilidades/UI:
  - `app/composables/common/useCardViewHelpers.ts`
  - i18n: `i18n/locales/*.json` y `i18n.config.ts`

---

## Arquitectura actual (después del refactor)

- `manage.vue` orquesta tabs/entidades y propaga `storageKey` a `useManageView`.
- `EntityBase.vue` es un contenedor delgado; delega en composables:
  - `useEntityPagination`: paginación reactiva y eventos.
  - `useEntityPreview`: estado y payload de previsualización.
  - `useImageUpload`: manejo de imagen para formularios.
  - `useEntityModals`: ciclo de vida de modales (crear/editar), normalización de payloads y preload inglés.
  - `useEntityDeletion`: flujos de borrado de entidad o traducción.
  - `useOptimisticStatus`: actualización de `status` optimista con rollback.
- `EntityTableWrapper` normaliza filas (`EntityRow`) para la tabla.
- `EntityCards*` usan `useCardViewHelpers` para helpers de presentación.
- `EntityFilters` mapea config de filtros y escribe en `crud.filters` tipado.

---

## Tipado y contratos

- `EntityCrud<TList, TCreate, TUpdate>` describe el contrato del CRUD genérico (items, loading, error, filters, schema, pagination, resourcePath y callbacks: fetchList, create, update, remove, updateStatus, etc.).
- `ManageCrud<TList, TCreate, TUpdate>` alias para el contexto `/manage`.
- `ManageEntity` tipa el shape mínimo esperado por las vistas (id, code, name/title, status, is_active, language, relaciones, tags, etc.).
- Los composables CRUD específicos devuelven `ManageCrud<...>`.

---

## Filtros estandarizados

- Claves comunes: `search`, `status`, `is_active`, `tag_ids` (+ específicas por entidad: `arcana_id`, `facet_id`, `card_type_id`, `parent_id`).
- Inicialización automática en `EntityBase` (al pasar `filtersConfig`):
  - `true` → inicializa a `[]` si es multi (`*_ids`/`tags`) o `undefined` si es simple.
  - Alias soportados vía config (p. ej. `tags: 'tag_ids'`).

---

## Optimizaciones realizadas

- Extracción de lógica de `EntityBase.vue` a composables (SRP, testabilidad):
  - `useEntityPagination`, `useEntityPreview`, `useImageUpload`, `useEntityDeletion`, `useOptimisticStatus`, `useEntityModals`.
- Eliminación de `any` en componentes y wrappers clave (`ManageCrud` adoptado en filtros, tarjetas y tabla).
- Unificación de helpers visuales (`useCardViewHelpers`).
- Persistencia de UI por `storageKey` en `useManageView` (modo de vista y `templateKey`).

---

## Hallazgos y correcciones

- Duplicación: función `setPreviewOpen` definida localmente y provista por composable → corregido (se usa solo la de `useEntityPreview`).
- Eventos UI: se mantienen alias compatibles para `edit` vs `editform` donde aplica (backward compatibility).
- Tooltips/l10n: clave `view.classic` ajustada en es/en.

---

## Áreas de mejora (pendientes)

- Tipado restante:
  - Parametrizar `EntityRow` por entidad opcionalmente o mantenerlo genérico.
  - Tipar `onTranslate` y payloads de formularios por entidad (Derivar de `schema.update`).
- Limpieza de imports/logs:
  - Revisar imports no usados en `EntityBase.vue` y vistas; eliminar logs temporales.
- Estructura de `EntityFilters`:
  - Validar coerción de `status` y `is_active` con valores string/boolean, asegurar arrays numéricos para ids.
- Errores potenciales:
  - Campos imagen: normalización de URL/paths; considerar subida real con API (actualmente sólo preview + saneo de cadena).
  - Traducciones: confirmación de flujos en idiomas no-EN (fallbacks) y permisos del backend.

---

## Recomendaciones UX/Performance

- Loading/skeletons (USkeleton/Placeholder):
  - Tabla: esqueleto de filas y cabecera mientras `crud.loading.value`.
  - Tarjetas: grid de `USkeleton` con la misma malla que Cards/Classic.
  - Modales: deshabilitar acciones y mostrar `USkeleton` en imagen/inputs pesados.
- Empty states:
  - Mensaje con CTA “Crear” cuando `items` vacío y sin filtros.
- Optimización de fetch:
  - Debounce en `search`; `watch` sobre `filters` con diff superficial y invalidación de fetch.
  - Paginación server-side consistente y reset de página al cambiar `pageSize` o filtros.
- Accesibilidad (a11y):
  - Etiquetas `aria-*` en botones de acciones.
  - Focus management en apertura de modales.
- Observabilidad:
  - Errores del CRUD: normalizar mensajes y añadir códigos de error.
  - Telemetría básica: eventos `edit/create/delete/translate` (si aplica).

---

## Roadmap propuesto (iteraciones)

1) UX de carga y vacíos
- Añadir `USkeleton` a Tabla y Tarjetas.
- Empty states y CTA de creación.

2) Tipado y pruebas
- Tipar `onTranslate` y payloads.
- Tests ligeros de composables (`useEntityModals`, `useEntityDeletion`, `useOptimisticStatus`).

3) Limpieza y coherencia
- Quitar logs/inports no usados.
- Revisar claves de filtros por entidad y documentación en `docs/`.

4) Performance
- Debounce a `search` (300ms) y fetch condicional.
- Memoización de columnas calculadas por `entity`.

---

## Checklist de validación

- Navegación y persistencia:
  - Cambiar entre `tabla`, `tarjeta`, `classic`, `carta` y verificar persistencia (`useManageView`).
  - Seleccionar distintas `templateKey` y verificar render en `EntityCarta`.
- Filtros:
  - Probar `status`, `is_active`, ids (`*_id/_ids`) y `tag_ids` por entidad.
- CRUD:
  - Crear/editar/borrar entidad.
  - Borrar traducción en idioma local vs entidad completa en inglés.
- Estado optimista:
  - Cambiar `status` con rollback si hay error.
- i18n:
  - Textos de botones, tooltips y mensajes de error.

---

## Guía rápida de nuevos composables

- `useEntityPagination(crud)`
  - Expone: `page`, `pageSize`, `totalItems`, `totalPages`, `defaultPageSizes`, `onPageChange`, `onPageSizeChange`.
- `useEntityPreview()`
  - Expone: `previewOpen`, `previewData`, `setPreviewOpen`, `openPreviewFromEntity(entity, t)`.
- `useImageUpload()`
  - Expone: `isUploadingImage`, `imageFile`, `imagePreview`, `modalImageFieldConfig`, `handleImageFile`, `handleRemoveImage`.
- `useEntityDeletion(crud, t, toast, localeCode)`
  - Expone: `deleteModalOpen`, `deleteTranslationModalOpen`, `deleteTranslationLoading`, `deleteTarget`, `pendingDeleteTranslationItem`, `saving`, `cancelDeleteDialogs`, `confirmDeleteEntity`, `confirmDeleteTranslation`, `onDelete`.
- `useOptimisticStatus(crud, t, toast)`
  - Expone: `onChangeStatus(entity, nextStatus)`.
- `useEntityModals(crud, { localeCode, t, toast, imagePreview })`
  - Expone: `isModalOpen`, `isEditing`, `saving`, `modalFormState`, `manage`, `et`, `onEdit`, `onCreateClick(emit)`, `handleSubmit`, `handleCancel`.

---

## Gestión de tags y propuesta opcional de API (tag_links)

### Objetivo
- Simplificar y robustecer la asignación, edición y consulta de tags sobre entidades (baseCard, facet, skill, world, arcana, etc.).
- Minimizar sobrecarga de red, evitar inconsistencias y facilitar UIs de selección múltiple.

### Situación actual (patrón típico)
- Lectura de entidades incluye un array `tags` (nombre/código), y los filtros usan `tag_ids`.
- La actualización suele pasar por `update` del recurso principal con `tag_ids` en el payload.

### Opciones de gestión
- **O1. Incrustado en update del recurso**
  - PUT/PATCH `/{entity}/{id}` con `{ tag_ids: number[] }`.
  - Pros: menos endpoints, atomicidad con otros campos de la entidad.
  - Contras: payloads más pesados, validaciones mixtas (dominio + relación), posibles conflictos de concurrencia.

- **O2. API dedicada de enlaces (tag_links) por entidad**
  - Estructura: una tabla pivote `tag_links` con `entity_type`, `entity_id`, `tag_id`, `created_at`.
  - Endpoints RESTful:
    - GET `/api/tag_links?entity_type=base_card&entity_id=123`
    - POST `/api/tag_links` body: `{ entity_type, entity_id, tag_id }`
    - DELETE `/api/tag_links/:id` (o DELETE por query compuesta `?entity_type=&entity_id=&tag_id=`)
    - Opcional: PUT/PATCH bulk `/api/tag_links/bulk` body: `{ entity_type, entity_id, tag_ids: number[] }` (reconcilia set objetivo)
  - Pros: separación de responsabilidades, operaciones parciales (añadir/quitar sin tocar otros campos), fácil de auditar.
  - Contras: más endpoints, UX debe reconciliar estado local vs remoto (útil añadir bulk reconcile).

- **O3. Hybrid: mantener update con `tag_ids` y añadir solo bulk reconcile**
  - Mantiene el flujo actual para CRUD básico y agrega un endpoint específico para operaciones masivas/rápidas de tags.
  - Pros: incremental, bajo impacto; las UIs pueden usar bulk cuando interese.
  - Contras: dos vías de actualización a mantener coherentes (documentar fuente de verdad).

### Recomendación
- Si el volumen de edición de tags es bajo y se hace junto a la edición del recurso → usar O1.
- Si hay necesidades de edición frecuente de tags, auditoría, o acciones en lote → adoptar O2 con endpoint bulk (o O3 como transición).

### Diseño de API propuesto (solo si aporta valor)

- Recurso: `tag_links`
- Seguridad: autorizado por rol para cada `entity_type`.
- Validaciones: existencia de `entity` y `tag`, unicidad (`entity_type`,`entity_id`,`tag_id`).
- Respuestas estándar `{ data, error }`.

Endpoints:

1) GET collection
```
GET /api/tag_links?entity_type={string}&entity_id={number}
200 { data: Array<{ id, entity_type, entity_id, tag_id, tag?: { id, code, name } } > }
```

2) POST crear vínculo
```
POST /api/tag_links
{ entity_type: 'base_card', entity_id: 123, tag_id: 7 }
201 { data: { id, entity_type, entity_id, tag_id } }
```

3) DELETE desvincular
```
DELETE /api/tag_links/:id
204 {}
```
o bien
```
DELETE /api/tag_links?entity_type=base_card&entity_id=123&tag_id=7
204 {}
```

4) BULK reconcile (opcional pero recomendada)
```
PUT /api/tag_links/bulk
{ entity_type: 'base_card', entity_id: 123, tag_ids: [1,2,3] }
200 { data: { added: number[], removed: number[] } }
```

### Integración UI/CRUD
- Filtros se mantienen con `tag_ids` (GET lista).
- `EntityFilters` ya soporta multi-select; para escritura:
  - En O1: `crud.update(id, { tag_ids })`.
  - En O2/O3: llamar a `/tag_links/bulk` tras confirmar cambios del selector (más rápido y menos 422 por otros campos).

### Beneficios esperados
- Mejor separación de dominios y simplicidad de validación.
- Menor riesgo de colisiones al editar metadata vs relaciones.
- Facilita acciones masivas, auditoría y permisos específicos por relación.

---

## Conclusión

La sección `/manage` quedó más modular, tipada y preparada para evolucionar. Los próximos focos deben ser la experiencia de carga (skeletons), mayor precisión de tipos en formularios y traducciones, y limpieza de residuos. Este informe sirve de base para coordinar tareas y validar progreso en iteraciones cortas.



# Ideas accionables para mejorar /manage

- **Skeletons y estados**
  - USkeleton en tabla y tarjetas durante `crud.loading.value`.
  - Empty states con CTA “Crear” y reset rápido de filtros.

- **Productividad de edición**
  - Acciones en lote: cambiar `status`, activar/desactivar, añadir/eliminar tags (usar endpoint bulk si se adopta).
  - “Quick edit” inline para campos simples (nombre, categoría, `is_active`).
  - Undo/Toast con “Revertir” tras borrar o cambiar `status`.

- **Lista y tabla**
  - Selector de columnas visibles y persistencia en localStorage.
  - Ordenación por columnas (id, nombre, updated_at), multi-sort opcional.
  - Búsqueda con debounce y resaltado de texto coincidente.
  - Virtualización de filas si la lista supera las ~200 (p. ej. Vue Virtual Scroller).

- **Filtros**
  - Chips de filtros activos con botón “Limpiar todo”.
  - Selectores avanzados: tags con búsqueda, categorías jerárquicas (tag parent).
  - Guardar “vistas” de filtros (favoritos) por entidad.

- **Rendimiento/Networking**
  - SWR/Cache por `filters+pagination` (revalidate on focus).
  - ETags/If-None-Match o `updated_at` para evitar cargas redundantes.
  - Prefetch de página siguiente si el usuario llega al 80% de la actual.
  - Carga perezosa de imágenes y `srcset` para thumbnails.

- **Accesibilidad (a11y)**
  - Roles/aria-labels en acciones; foco automático al abrir modales.
  - Atajos de teclado: “n” (nuevo), “/” (buscar), “Esc” (cerrar modal).

- **UX de formularios**
  - Validación in-situ con mensajes i18n de `schema`.
  - Autosave draft del modal para no perder datos al cerrar.
  - Selector de imagen con recorte (opcional) y validación de tamaño/mime.

- **i18n**
  - Conmutador de idioma en lista (vista previa rápida).
  - Indicador de “fallback” cuando no existe traducción (ya soportado, añadir badge visual).
  - Bulk translate stub: crear entradas vacías para `lang` objetivo.

- **Observabilidad**
  - Integrar Sentry/LogRocket (o consola centralizada) para errores de CRUD.
  - Trazas ligeras: `edit/create/delete/translate` para medir uso.

- **Seguridad y permisos**
  - Directiva `v-can` consistente en botones (crear, borrar, estado).
  - Ocultar acciones no permitidas y deshabilitar con tooltip explicativo.

- **DevX**
  - Storybook de componentes de manage (Cards, Classic, Table, Filters).
  - Tests de composables: [useEntityModals](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntityModals.ts:3:0-121:1), [useEntityDeletion](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntityDeletion.ts:3:0-75:1), [useOptimisticStatus](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useOptimisticStatus.ts:2:0-17:1), [useEntityPagination](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntityPagination.ts:3:0-39:1).
  - Lint estricto: prohibir `any` en manage, preferir tipos [ManageCrud](cci:2://file:///home/bulu/work/devel/tarot2/app/types/manage.ts:52:0-52:112)/[ManageEntity](cci:2://file:///home/bulu/work/devel/tarot2/app/types/manage.ts:18:0-50:1).
  - Zod/Yup compartido entre cliente y servidor para schemas (si aplica).

- **API/datos**
  - Bulk de tags (opción O3 en el informe) para reconciliar `tag_ids`.
  - Campos de respuesta uniformes (`{ data, meta, error }`) y códigos de error normalizados.
  - Campos `include=tags,relations` para evitar overfetch/underfetch.
  - Paginación cursor-based opcional si el dataset crece.

# Sugerencias destacadas (rápido impacto)

- Skeletons + Empty states.
- Debounce de búsqueda + SWR en listas.
- Acciones en lote con confirmación y undo.
- Selector de columnas con persistencia.
- Badges de traducción/fallback y quick edit de `status`/`is_active`.

# Próximos pasos recomendados

- **Iteración 1 (UX base)**: Skeletons, empty states, debounce de búsqueda, badges de fallback.
- **Iteración 2 (Productividad)**: Bulk actions + undo, selector de columnas, quick edit.
- **Iteración 3 (Rendimiento)**: SWR/ETag/prefetch y lazy images.
- **Iteración 4 (DevX/Calidad)**: Tests de composables y limpieza de logs/imports.

Puedo empezar con Skeletons (Tabla/Tarjetas) y Debounce en filtros de búsqueda. ¿Te implemento esos primero?


---

# Sugerencias carga

## Ideas para mejorar la carga de items

- **Debounce y cancelación**
  - Debounce en `search` y filtros (300–500ms) antes de [fetchList](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:205:2-210:3).
  - Cancelar peticiones en curso al cambiar filtros/paginación (AbortController en [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:117:0-363:1)).

- **SWR/Cache**
  - Cache por clave `JSON.stringify({entity, filters, page, pageSize})`.
  - Revalidar al hacer focus o tras mutaciones (SWR). Devolver cache inmediato + refrescar en background.

- **Prefetch**
  - Prefetch de página siguiente cuando el usuario se acerque al final (80%) o al pasar de página.

- **Paginación eficiente**
  - Cursor-based si el dataset crece mucho; evita costos de `COUNT(*)`.
  - Si se mantiene offset/limit, exponer `meta.total` ya calculado en BD para evitar `COUNT` repetidos.

- **Proyección selectiva**
  - Reducir payloads: incluir solo campos necesarios para la vista actual (añadir `?fields=id,name,...` o `include=tags`).
  - Evitar N+1: usar joins con paginado o endpoints “list” que ya devuelvan tags básicos.

- **Imágenes**
  - Thumbnails + lazy loading + `srcset`. Evitar URLs grandes en listados.
  - Caché del navegador/CDN y `Cache-Control` adecuados.

- **UI/UX**
  - `USkeleton` para tabla y tarjetas mientras `loading`.
  - Empty states con CTA y “Reset filtros”. Evita “parpadeo” si hay cache.

- **Render y reactividad**
  - `watchDebounced` en `filters`.
  - `shallowRef` para `items` (evita deep reactive cost en listas grandes).
  - Memoizar `resolvedColumns` y normalización de filas; no recrearlas por render.
  - Virtualización de filas si >200 items (Virtual Scroller).

- **API y BD**
  - Índices en campos de filtro (`status`, `is_active`, `tag_id`, `facet_id`, `card_type_id`, `updated_at`).
  - Texto: `tsvector`/full-text para `search`.
  - Respuestas uniformes `{ data, meta: { total, page, pageSize }, error }`.
  - ETag/If-None-Match para listas “estables”.

- **Control de concurrencia**
  - Cola con “última gana”: sólo la última búsqueda actualiza estado.
  - Retries con backoff solo para errores transitorios (5xx/timeout).

- **Batching**
  - Acumular cambios rápidos de filtros y enviar una sola petición.

## Qué implementaría primero (impacto vs esfuerzo)

1) Debounce + cancelación de [fetchList](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:205:2-210:3) en [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:117:0-363:1).
2) SWR simple con cache por clave y revalidación al foco.
3) Skeletons en Tabla/Tarjetas + lazy images.

Si te parece, puedo preparar un PR corto con:
- `watchDebounced` en filtros y `AbortController` en [useEntity](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useEntity.ts:117:0-363:1).
- Cache en memoria por clave y revalidación.
- `USkeleton` básico en `EntityTableWrapper` y vistas de tarjetas.