# Informe técnico de composables Tarot2

## Panorama general
El ecosistema de composables en Tarot2 se divide en tres familias principales:
1. **Common** (`app/composables/common`) – utilidades agnósticas de dominio (`useListMeta`, `useQuerySync`, `useEntityCapabilities`).
2. **Manage** (`app/composables/manage`) – orquestan CRUD genéricos para entidades traducibles, incluyendo filtros, paginación, tags, previews y modales.
3. **Admin** (`app/composables/admin`) – focalizados en operaciones editoriales (`useContentVersions`, `useRevisions`, `useContentFeedback`, `useAdminUsersCrud`).

Todos siguen el patrón de exponer refs reactivas (`items`, `pending`, `error`, `meta`) además de acciones (`fetchList`, `create`, `update`, `remove`) y, cuando aplica, estados derivados (selección, filtros sincronizados con la URL).

## Composables comunes clave
| Composable | Propósito | Notas |
| --- | --- | --- |
| `useListMeta` | Normaliza `meta` de paginación en `{ page, pageSize, totalItems, totalPages, hasNext, hasPrev }` con fallback reactivo.[@app/composables/common/useListMeta.ts#1-46] | Útil para tablas con datos cliente/servidor, se usa en `CommonDataTable`, `useContentVersions` y otros. |
| `useQuerySync` | Sincroniza filtros con la ruta (querystring), soportando parse/serialize personalizado y reemplazo vs push. | Base para `AdvancedFiltersPanel` en admin feedback, permite compartir vistas. |
| `useEntityCapabilities` | Provider/consumer de capacidades por entidad (translatable, tags, preview, etc.).[@app/composables/common/useEntityCapabilities.ts#1-158] | Aísla opciones y permite overrides por proveedor, favoreciendo modularidad Admin/Manage. |
| `useDateRange` | Gestiona rangos de fechas normalizados (ISO) con utilidades de parse, display y sincronización. | Permite filtros complejos en feedback, versiones y futuros reports. |
| `useEntityPreviewFetch` | Resuelve previews de entidades (cards, worlds, etc.) reutilizando `useApiFetch`. | Evita duplicar lógica de endpoints preview entre feedback y manage. |

### Buenas prácticas
- Mantener firmas genéricas (MaybeRefOrGetter, InjectionKey) para facilitar DI.
- Aceptar `fallback` y `overrides` en composables reutilizables (`useListMeta`, `useEntityCapabilities`).
- Integrar watchers con `watchEffect` o debounced states para evitar fetch excesivo (`useEntity`).

## Composables Manage
### `useEntity`
Composable genérico SSR-safe que provee CRUD con filtros reactivamente sincronizados y paginación configurable.[@app/composables/manage/useEntity.ts#1-392]
- Usa `useAsyncData` para SSR y caché SWR (`listCache`) evitando refetch innecesario.
- Recibe esquemas Zod opcionales para validar create/update.
- Gestiona idioma (`lang`) automáticamente con `includeLangParam` y `includeLangInCreateBody` (default true).
- Expone `pagination` + `pageSizeOptions`, integrándose con `usePaginatedList`.
- Soporta invalidación manual y control de aborts para requests concurrentes.

### Complementos Manage
| Composable | Rol |
| --- | --- |
| `useManageFilters` | Inicializa filtros por entidad con defaults y provee `resetFilters` opcionalmente re-fetching. |
| `useManageColumns` | Determina columnas por entidad para tablas (status, tags, arcana, etc.), centralizando configuración. |
| `useEntityModals` | Orquesta estado de modales (formulario, import, tags) y la carga de datos base/EN para traducciones. |
| `useEntityDeletion` | Controla flujos de borrado entidad/traducción, aceptando bandera `translatable`. |
| `useEntityPreview` | Maneja la apertura de previsualizaciones con fallback a slideover o modal. |
| `useEntityTags`, `useFeedback`, `useEntityTransfer` | Acciones específicas (tags, feedback, traslado) encapsuladas. |

### Fortalezas / pendientes
- Fortalezas: reutilización masiva, SSR-ready, integración multi-idioma automática.
- Pendientes: extraer `useTableSelection` (selección replicada en tablas) y consolidar `useManageActions` en un provider de capabilities.

## Composables Admin
| Composable | Propósito | Detalles |
| --- | --- | --- |
| `useContentVersions` | CRUD para versiones + publish, normaliza `meta` con `toListMeta` y recuerda última query.[@app/composables/admin/useContentVersions.ts#76-159] | Debe migrar todos los consumidores a `useApiFetch` (ya lo usa) y añadir logging para publish. |
| `useRevisions` | Maneja listado/aprobación/bulk operations sobre revisiones; integra notificaciones y watchers debounced. | Ideal para `RevisionsTable` con selección y meta compartidos. |
| `useContentFeedback` | Gestiona feedback con filtros complejos (rango fechas, entidad, idioma), sincroniza `lastQuery` y optimiza actualizaciones in-place. | Usa `buildParams` que normaliza entradas y toasts de error. |
| `useAdminUsersCrud` | Adapta `useEntity` a la semántica de usuarios (sin i18n, con roles/permissions). | Garantiza que `translatable=false` se respete en la UI. |
| `useDatabaseExport`, `useDatabaseImport` | Reutilizan endpoints de backup (JSON/SQL). | Deben incorporar manejo de progreso/errores para archivos grandes. |

## Integración con NuxtUI y SSR
- Los composables actúan como fuente de verdad para componentes (tablas, modales, paneles). La documentación recomienda usar `useApiFetch` (ETag) y watchers debounced para entradas (`useDebounceFn` en Revisions, Manage Users).
- `useQuerySync` + `AdvancedFiltersPanel` y `useListMeta` permiten vistas compartibles y UX consistente.
- SSR: `useAsyncData` en `useEntity` y `useLazyAsyncData` en algunos admin (p.ej. Manage Users) aseguran que los listados se hidraten con la misma cache, evitando flickers.

## Oportunidades de optimización
1. **Provider de capabilities unificado**: aprovechar `useEntityCapabilities` (ya creado) para que `useEntity`, `useEntityDeletion`, `useEntityModals` y `EntityBase` lean capacidades dinámicas en vez de props repetidas.
2. **`useServerPagination`**: crear wrapper para endpoints con `buildFilters` y normalización meta, reduciendo duplicación en composables admin.
3. **Composables de selección**: `useSelection(ids)` central (mapa `selectedMap`, `toggleOne`, `toggleAll`) para feedback, revisiones, tablas Manage.
4. **Cache managers**: extender `clearApiFetchCache` en `useEntity` a granularidad por entidad/idioma para invalidaciones específicas (publish/revert).
5. **Telemetry hooks**: `useRequestMetrics` que capture `timeMs` del header/log y exponga latencia a la UI para dashboards internos.
6. **Form presets**: composable `useEntityFormPreset(entity)` que devuelva presets de campos (Zod schema, default values) sincronizado con backend.

## Buenas prácticas de uso
- **Mantener contrato meta**: siempre mapear `meta` a `toListMeta` o `useListMeta` antes de exponerlo a componentes.
- **Evitar `$fetch` directo**: usar `useApiFetch` para beneficiarse de ETag y logging consistente.
- **Error handling uniforme**: replicar patrón de `toErrorMessage` (`useEntity`) y toasts centralizados para UX consistente.
- **Debounce**: aplicar `useDebounceFn` o watchers con `setTimeout` (como `useEntity`) para reducir requests en filtros.
- **Type inference**: exportar tipos `EntityCrud` y `ListMeta` para reuso en componentes (TS).

## Roadmap composables
| Prioridad | Acción | Impacto |
| --- | --- | --- |
| Alta | `useTableSelection` + `useServerPagination` | Menos duplicación en tablas y handlers |
| Media | Integrar `useEntityCapabilities` en todos los composables Manage/Admin | Configuración declarativa, menos props |
| Media | Hooks de telemetría (`useRequestMetrics`) | Observabilidad desde UI |
| Baja | `useEntityFormPreset` compartido | Formularios consistentes, menos duplicación |

## Conclusiones
El set de composables de Tarot2 ya ofrece una base robusta para SSR, multi-idioma y administración. Las mejoras deben enfocarse en centralizar capacidades, reducir duplicación (selección, paginación) y añadir telemetría ligera, manteniendo el patrón de contratos tipados y caché coherente que caracteriza al proyecto.
