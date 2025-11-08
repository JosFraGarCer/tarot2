# Informe de Auditoría: /manage y /deck/*

> ### Prompt del informe
> Debes hacer informes exhaustivo en formato MarkDown que guardaras en /docs
> Se trata de buscar errores, posibles optimizaciones, analisis minicioso de las paginas solicitadas yTODAS sus dependencias. Tanto frontend como backend
>
> Las paginas son: 
> - /manage
> - /deck/*
> 
> Entre las optimizaciones posibles hay que buscar como eliminar codigo duplicado y separar la logica de los *.vue para pasarla a composables.

## Resumen Ejecutivo

- El sistema de gestión (`/manage`) comparte un único componente genérico (`EntityBase.vue`) con alta complejidad (≈400 líneas) y dependencias múltiples. No se detectaron fallos críticos, pero sí múltiples oportunidades de modularización (pagos de deuda técnica) y mejoras de UX.
- Las páginas públicas del mazo (`/deck/*`) reutilizan la misma infraestructura de CRUD que el área de gestión, exponiendo potenciales problemas de rendimiento (peticiones redundantes) y acoplamientos fuertes.
- En backend, los endpoints `server/api/{entity}/index.*` están alineados, pero existen inconsistencias en filtros (operadores OR/AND sobre tags) y ausencia de límites claros de cache/ETag, lo que podría impactar escalabilidad.
- Se recomiendan refactors para extraer lógica repetida a composables especializados, homogenizar el manejo de filtros/estado y actualizar la documentación/contratos entre frontend-backend.

## Alcance del Análisis

- Frontend: `app/pages/manage.vue`, `app/components/manage/*`, `app/composables/manage/*`, `app/pages/deck/*`, `app/components/deck/*`, `app/composables/deck/useDeckCrud.ts`, `app/composables/common/*`.
- Backend: directorios `server/api/{card_type, base_card, world, arcana, facet, skill, tag}` (archivos `index.get.ts`, `index.post.ts`, `[id].*.ts`), utilidades compartidas en `server/utils`.
- Internacionalización: `i18n/locales/{en,es}.json` para validar uso de claves.

## Hallazgos Clave

### [x] 1. Complejidad del componente `ManageEntity` (frontend)

- `EntityBase.vue` concentra responsabilidades: inicialización de filtros, paginación, columnas dinámicas, gestión de modales, previews, borrados optimistas y logs. @app/components/manage/EntityBase.vue#1-395
- Consecuencias: curva de mantenimiento alta, dificultad para pruebas unitarias, riesgo de efectos secundarios.
- Recomendaciones:
  1. Extraer composables/módulos para responsabilidades específicas:
     - `useManageColumns(entity, lang)` → encapsular resolución y cacheo de columnas.
     - `useManageFilters(config)` → manejar `initializeFilterDefaults` y `resetFilters` con reglas y normalización coherentes.
     - `useManageActions(crud)` → centralizar `onExport`, `onBatchUpdate`, `onFeedback`, `onTags` (actualmente placeholders).
  2. Reducir dependencia directa de `console.log` reemplazándolo por servicios de logging o eventos.

> ### RESPUESTA
>
> - Extraje la lógica de filtros a [useManageFilters](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useManageFilters.ts:27:0-79:1), centralizando inicialización y reseteo con soporte configurable; `EntityBase` la consume para arrancar y limpiar filtros sin duplicar código. @app/composables/manage/useManageFilters.ts#1-68 @app/components/manage/EntityBase.vue#219-227
> - Moví la resolución de columnas a [useManageColumns](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useManageColumns.ts:11:0-64:1), reutiliza memoización por entidad/idioma y mantiene la misma estructura dinámica de columnas. @app/composables/manage/useManageColumns.ts#1-65 @app/components/manage/EntityBase.vue#232-237
> - Reemplacé los [console.log](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/deck/useDeckCrud.ts:71:2-74:3) por [useManageActions](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useManageActions.ts:15:0-48:1), que encapsula placeholders de export, batch, feedback y tags con notificaciones extensibles. @app/composables/manage/useManageActions.ts#1-39 @app/components/manage/EntityBase.vue#284-287
> - Creé los nuevos composables dedicados ([useManageFilters](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useManageFilters.ts:27:0-79:1), [useManageColumns](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useManageColumns.ts:11:0-64:1), [useManageActions](cci:1://file:///home/bulu/work/devel/tarot2/app/composables/manage/useManageActions.ts:15:0-48:1)) para reducir responsabilidades en `EntityBase`. @app/composables/manage/useManageFilters.ts#1-68 @app/composables/manage/useManageColumns.ts#1-65 @app/composables/manage/useManageActions.ts#1-39



### [x] 2. Duplicidad en filtros y paginación

- Lógica de filtros replicada entre `EntityBase`, `EntityFilters`, `useEntity`, `useDeckCrud` (e.g., normalización de arrays, alias, resets). @app/components/manage/EntityBase.vue#193-372, @app/components/manage/EntityFilters.vue#94-258, @app/composables/manage/useEntity.ts#268-374
- `useEntityPagination` y `DeckSection` establecen tamaños de página de manera divergente (10/20/50 vs 6/12/24/48), generando confusión entre vistas. @app/composables/manage/useEntityPagination.ts#4-41, @app/components/deck/DeckSection.vue#70-128
- Recomendación: crear composable compartido `usePaginatedList({ defaultSizes, initialSize })` consumido por `useEntity` y `DeckSection`, permitiendo personalización por entidad.

> ### Respuesta
> Añadí usePaginatedList, composable compartido que centraliza página actual, tamaño, total, opciones y helpers (setPage, setPageSize, 
reset, syncMeta, registerPageSizeOptions) evitando duplicidad en filtros/paginación. app/composables/manage/usePaginatedList.ts
Refactoricé useEntity para usar usePaginatedList, exponer pageSizeOptions/registerPageSizeOptions, y sincronizar el estado de paginación con las respuestas del backend y filtros debounced sin lógica duplicada. app/composables/manage/useEntity.ts
Actualicé useEntityPagination para consumir las opciones dinámicas registradas y normalizar cambios de página/tamaño con la nueva API. 
app/composables/manage/useEntityPagination.ts 
Ajusté useDeckCrud para registrar tamaños de página personalizados cuando se pasa pageSize, manteniendo coherencia con el nuevo sistema. app/composables/deck/useDeckCrud.ts


### [x] 3. Fetch redundante en `/deck`

- `DeckSection` llama a `useDeckCrud` que a su vez invoca `crud.fetchList()` en cada instancia. En tabs de `/deck/index.vue`, esto dispara múltiples peticiones simultáneas al cambiar de pestaña o renderizar SSR, sin mecanismos de cache compartida. @app/components/deck/DeckSection.vue#61-118, @app/composables/deck/useDeckCrud.ts#43-125
- `useDeckCrud` reinicia paginación (`crud.pagination.value.page = 1`) en cada llamada, rompiendo continuidad entre re-montajes.
- Recomendaciones:
  1. Añadir memoización por entidad en `useDeckCrud`, almacenando `crud` instanciados en un Map reutilizable.
  2. Implementar `fetchOnce`/`useAsyncData` en `DeckSection` para SSR y caching predictivo.
  3. Evitar side-effects en composables al instanciar (e.g., mover reset de paginación a momento explícito).

> ### Resumen 
> useDeckCrud  ahora reutiliza instancias por entidad mediante un Map compartido, evita reinicios de paginación al montar el composable y expone un helper explícito resetPagination() para quienes lo necesiten app/composables/deck/useDeckCrud.ts.
DeckSection ejecuta useAsyncData con clave dependiente de entidad/idioma para precargar datos en SSR, respeta la caché devuelta por 
useDeckCrud y combina el estado pending inicial con el loading del CRUD antes de renderizar app/components/deck/DeckSection.vue.
>
> #### Actualizacion DeckSection y controles asociados
> - Eliminé basePageSizeOptions de DeckSection y ahora registro el límite de vista previa en el CRUD para incluirlo en las opciones globales. app/components/deck/DeckSection.vue
> - Las opciones mostradas en PaginationControls provienen de pagination.defaultPageSizes, garantizando coherencia con el nuevo sistema centralizado de paginación. app/components/deck/DeckSection.vue

### [x] 4. Manejo inconsistente de filtros de tags entre entidades

- Backends de `world`, `arcana`, `facet`, `skill`, `base_card` aplican OR contra tags, mientras `base_card` permite AND via `ANY` (tag_ids) pero sin garantías. @server/api/base_card/index.get.ts#132-153 vs @server/api/arcana/index.get.ts#120-141
- Frontend `EntityFilters` asume listas múltiples pero no sincroniza `crud.filters` con respuesta normalizada (IDs vs objetos). @app/components/manage/EntityFilters.vue#168-208
- Recomendaciones: documentar contrato `tag_ids` (AND/OR) y unificar backend. Ajustar `useFilterBinding` para asegurar sincronía (convertir arrays a números/strings según backend).

> ### Respuesta
>
> - Unifiqué la semántica de filtrado por tags con OR en el endpoint world_card, reemplazando el antiguo HAVING que exigía coincidencia total por un EXISTS consistente con el resto de entidades. server/api/world_card/index.get.ts
> - Aclaré el comentario en base_card para reflejar explícitamente la semántica OR ya implementada. server/api/base_card/index.get.ts



### 5. Internacionalización y claves en `/deck`

- Tabs utilizan `labelKey` y `descriptionKey`, pero `DeckEntityPage` no pasa `description-key` al componente `DeckSection`, lo que impide mostrar descripciones localizadas dentro de la sección. @app/components/deck/DeckEntityPage.vue#12-19
- Claves `card-types.title`, `base_card.title` deben validarse en `i18n/locales`. Se detecta posible inconsistencia `nav.cardTypes` vs `card-types.title` (ingles/español). Requiere QA manual.

### [x] 6. Gestión de estado de modales

- `useEntityModals` manipula `modalFormState` mutando referencias directamente, con resets manuales. No existe validación antes de envío en front (dependen sólo de Zod en backend). @app/composables/manage/useEntityModals.ts#20-121
- Recomendación: extraer `useFormState(initialSchema)` que produzca estado controlado y ofrezca helpers (`reset`, `patch`, `setDirty`). Podría alinear con libs externas (vee-validate).

> ### Respuesta
>
> Creé useFormState para gestionar formularios con estado controlado, clonando valores iniciales, seguimiento de dirty y helpers (replace
, reset, patch, markClean, etc.) app/composables/manage/useFormState.ts. useEntityModals ahora usa useFormState, elimina mutaciones anuales de modalFormState, reutiliza helpers para resetear/establecer datos y marca el formulario como limpio tras guardar app/composables/manage/useEntityModals.ts.


### 7. Falta de pruebas

- No se encontraron tests específicos para `useEntity` o endpoints. Dependencia en runtime para detectar errores.

### [x] 7 bis. typings explícitos

- Tipos `ManageCrud` provienen de `@/types/manage`, pero composables retornan `any` en varias partes (e.g., `useDeckCrud` returns `ManageCrud<any, any, any>`). Recomendación: definir generics adecuados o `interface DeckCrud<T>` para tipado fuerte.

> ### Respuesta
>
> - Fortifiqué useDeckCrud  con tipados específicos por entidad: ahora mapea cada DeckEntityKey a su ManageCrud<TList, TCreate, TUpdate> respectivo, preserva el tipo de items, y restringe aliases válidos. El retorno puede ser DeckCrudSuccess  tipado o DeckCrudFallback cuando la entidad es inválida. app/composables/deck/useDeckCrud.ts



### 8. Seguridad y control de acceso

- Botones de creación usan directiva `v-can.disable`, pero `onCreateEntity` en `/manage` sólo `console.log`. No se valida rol antes de abrir modales. @app/components/manage/EntityFilters.vue#73-80, @app/pages/manage.vue#167-170
- Backend confía en middleware de auth global (`server/middleware`), pero no se auditaron scopes específicos por endpoint → sugiere revisar permisos.

### [x] 9. Gestión de errores

- `useEntity` transforma errores a mensajes genéricos; sin embargo, UI sólo muestra `crud.error?.value` en `UAlert` sin mapear multiple errores simultáneos (create/update vs list). @app/components/manage/EntityBase.vue#5-12, @app/composables/manage/useEntity.ts#372-386
- Sugerencia: separar `listError` y `actionError` en composable.

> Gestioné errores diferenciando solicitudes de listado y acciones en 
useEntity, exponiendo listError y actionError además de un error derivado app/composables/manage/useEntity.ts. EntityBase ahora muestra alertas independientes y usa esas señales al lanzar toasts app/components/manage/EntityBase.vue, app/components/manage/EntityBase.vue. Ajusté composables relacionados (useEntityDeletion, useOptimisticStatus,useEntityModals) para reutilizar las nuevas propiedades de error app/composables/manage/useEntityDeletion.ts
, app/composables/manage/useOptimisticStatus.ts, app/composables/manage/useEntityModals.ts.

### [x] 10. Rendimiento y caching

- `useApiFetch` implementa cache con ETags pero no limpia `responseCache`, potencial de fuga de memoria en sesiones largas. @app/utils/fetcher.ts#1-85
- Recomendación: exponer `clearCache` y utilizar TTL.

> Implementé gestión de caché con TTL en useApiFetch. Ahora usamos 
CacheEntry con storedAt y ttl, se purgan entradas expiradas en cada petición GET y se reutilizan valores sólo si siguen vigentes. También añadí resolveTTL para permitir TTL personalizado vía options.context.cacheTTL, getCachedData con invalidación automática, y expuse clearApiFetchCache para limpiado manual por patrón. Cambios en app/utils/fetcher.ts.

## Recomendaciones Prioritarias

1. **Refactor composable de filtros/paginación** (impacto alto, esfuerzo medio):
   - Crear `useManageFilters` y `usePaginatedCrud` reusables; actualizar `EntityBase`, `EntityFilters`, `useDeckCrud`.
   - Resultado: menos duplicidad y consistencia UX.
2. **Memoización de `useDeckCrud` y fetch SSR controlado** (impacto alto, esfuerzo bajo-medio):
   - Evita peticiones redundantes y mejora tiempo de carga.
   - Añadir `useAsyncData` dentro de `DeckSection` usando `entity` y `locale` como key.
3. **Revisión de contrato de tags en backend** (impacto medio):
   - Documentar AND/OR; agregar pruebas y, si procede, parámetro explícito `match=all|any`.
4. **Extraer lógica de columnas y acciones de `EntityBase`** (impacto medio, esfuerzo medio-alto):
   - Aislar en composables, facilita mantenimiento.
5. **Fortalecer validación y estados en modales** (impacto medio):
   - Introducir helper de formularios, mejorar mensajes y evitar mutaciones accidentales.

## Posibles Trabajos Futuros

- Implementar pruebas unitarias para `useEntity` (mock de fetch, filtros) y para `DeckSection` (paginación).
- Añadir lazy loading de imágenes con `v-lazy` o `IntersectionObserver` para tarjetas del deck.
- Aprovechar directivas de permisos para ocultar botones en lugar de deshabilitarlos, mejorando accesibilidad.
- Revisar traducciones faltantes; asegurar que todas las claves utilizadas existen en `i18n/locales`.
- Documentar en `docs/` la arquitectura de composables y flujo de datos manage/deck.

## Riesgos Detectados

- **Duplicación de lógica**: Mantener filtros y paginación en múltiples sitios incrementa riesgo de regresiones al actualizar una sola variante.
- **Estados compartidos no controlados**: Resets implícitos de paginación pueden causar bugs difíciles de reproducir.
- **Falta de pruebas**: Cambios en backend/queries podrían romper integraciones sin detección temprana.

## Conclusión

El módulo de gestión y las vistas del mazo comparten una base sólida pero necesitan un plan de refactor por etapas para mejorar mantenibilidad y rendimiento. Priorizar la extracción de lógica en composables especializados y la homogenización del manejo de filtros/paginación proporcionará beneficios inmediatos. Asimismo, estandarizar contratos de filtros (especialmente tags) entre frontend y backend reducirá sorpresas y simplificará la experiencia del usuario final.
