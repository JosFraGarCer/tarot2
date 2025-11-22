# Informe: Componentes compartidos entre /manage y /admin/users

## Resumen ejecutivo
- **Objetivo**: Reutilizar componentes de `/manage` en `/admin/users` sin incoherencias en i18n ni UX.
- **Hallazgos**:
  - `/admin/users` usa `EntityBase` (de Manage) y `useEntity`, pero los usuarios no son traducibles.
  - La lógica de traducciones/fallback de Manage afecta a modales y edición cuando la entidad no tiene `language_code`.
  - `EntityBase` ignora la prop `columns` (no permite columnas personalizadas desde `/admin/users`).
- **Opciones**: Presentamos 4 estrategias (banderas de capacidades, adaptador de datos, forking de componente, inversión de control por proveedor de capacidades) con implementación, pros/contras y recomendación.

## Contexto actual
- **En `/manage`**
  - `useEntity` añade `lang` a las peticiones y asume entidades traducibles (modales precargan versión en inglés, borrado con modal de traducción).
  - `EntityBase.vue` suma flujos de preview, tags, feedback y traducciones (vía `useTranslationActions`, `useEntityDeletion`, `useEntityModals`).
  - `EntityTableWrapper` normaliza filas hacia un `EntityRow` común y ya tiene un caso especial para usuarios.
- **En `/admin/users`**
  - Página `app/pages/admin/users.vue` reutiliza `EntityBase`, fuerza `viewMode='classic'`, y define `columns`, pero actualmente no se respetan porque `EntityBase` usa sus columnas internas.
  - Backend de usuarios no usa i18n; carece de `language_code`.

## Diferencias de formato relevantes
- **Manage (traducible)**: `name`, `short_text`, `description`, `language_code(_resolved)`, `tags`, `status`, `is_active`, `img`, etc.
- **Users (no traducible)**: `username`, `email`, `roles[]`, `permissions{}`, `status`, `created_at`, `modified_at`, `image`; no `language_code`.
- **Efecto colateral**: En `useEntityDeletion`, si `locale !== 'en'` y la entidad no tiene `language_code`, puede abrir el modal de borrar traducción en vez del modal de borrar entidad.

## Opción 1 — Banderas de capacidades en componentes compartidos (recomendada corto plazo)
- **Cómo funciona**
  - Añadir opciones de capacidad: `translatable: boolean`, `supportsTags: boolean`, `supportsPreview: boolean`, etc.
  - `EntityBase` y composables consultan estas banderas para activar/desactivar flujos de i18n y UI.
  - Permitir columnas personalizadas: si se pasa `columns`, usarlas en lugar de `useManageColumns`.
- **Implementación (pasos)**
  - `EntityBase.vue`: usar columnas externas si están presentes (`columns?.length ? columns : resolvedColumns`). Deshabilitar secciones/acciones según capacidades.
  - `useEntityDeletion(crud, t, toast, localeCode, opts?)`: aceptar `{ translatable?: boolean }` (default: true). Si `!translatable`, siempre abrir modal de entidad y nunca el de traducción.
  - `useEntityModals(...)`: aceptar `{ translatable?: boolean }`. Si `!translatable`, no precargar `englishItem` ni vaciar campos traducibles.
  - `admin/users.vue`: pasar `translatable=false`, `no-tags`, `card-type=false` y `columns` personalizados.
- **Beneficios**
  - Reutilización máxima, cambios acotados, sin duplicar componentes.
  - Elimina incoherencias de i18n para entidades no traducibles.
  - Desbloquea columnas específicas para usuarios.
- **Contras**
  - Aumenta complejidad por banderas en componentes genéricos.
- **Valoración**
  - Excelente equilibrio entre esfuerzo y robustez. Mitiga bugs actuales y sienta base para más entidades no traducibles.

## Opción 2 — Adaptador/normalizador de datos (DTO) para usuarios (corto plazo sin tocar componentes)
- **Cómo funciona**
  - Transformar los objetos `user` a una forma compatible con Manage añadiendo campos inertes de i18n (p.ej., `language_code_resolved = localeActual`), y mapeando `username→name`.
  - Mantener los componentes tal cual.
- **Implementación (pasos)**
  - Extender `useEntity` o `useAdminUsersCrud` con un hook `normalizeItem(item): item` aplicado tras cada fetch.
  - Alternativa menos intrusiva: que el endpoint de usuarios devuelva `language_code_resolved='en'` (no recomendado semánticamente).
- **Beneficios**
  - Cambios mínimos en los componentes.
- **Contras**
  - Hack semántico: “fingir” i18n donde no existe.
  - No soluciona el problema de columnas ignoradas en `EntityBase`.
- **Valoración**
  - Útil para salir del paso, pero frágil y con deuda técnica.

## Opción 3 — Crear componentes específicos para Admin Users (fork ligero)
- **Cómo funciona**
  - Copiar `EntityBase` a `AdminEntityBase` con i18n eliminado y UI reducida.
  - Reutilizar subcomponentes neutros (`EntityTableWrapper`) y composables comunes.
- **Implementación (pasos)**
  - Nuevo `components/admin/EntityBaseSimple.vue` sin traducciones/tags/preview.
  - Ajustar `admin/users.vue` para usar el nuevo componente y pasar `columns` directamente.
- **Beneficios**
  - Separación total de preocupaciones; sin banderas.
  - Menor superficie de errores por i18n.
- **Contras**
  - Duplicación de lógica de listas, modales y acciones.
  - Mayor mantenimiento a medio plazo.
- **Valoración**
  - Válida si se prioriza aislar riesgos de producción de forma inmediata.

## Opción 4 — Proveedor de capacidades (inversión de control)
- **Cómo funciona**
  - Introducir `useEntityCapabilities(entityKind)` que provee `translatable`, `hasTags`, `hasPreview`, `hasStatus`, etc. vía provide/inject.
  - `EntityBase` y composables consultan capacidades; si no hay proveedor, usan defaults.
- **Implementación (pasos)**
  - Crear `capabilities.ts` y `InjectionKey`. Proveer en cada página (`manage` y `admin/users`) valores apropiados.
  - Sustituir condiciones actuales por lecturas de capacidades en: `EntityBase`, `useEntityDeletion`, `useEntityModals`, vistas de tarjetas/tablas.
- **Beneficios**
  - Diseño limpio y escalable; evita proliferación de props.
  - Facilita reutilización en más páginas admin no traducibles.
- **Contras**
  - Refactor transversal medio; requiere coordinación.
- **Valoración**
  - Mejor solución arquitectónica si hay varias áreas no traducibles compartiendo base.

## Recomendación
- **Corto plazo (entregable rápido y seguro)**: Opción 1.
  - Cambios mínimos, corrige modales, respeta columnas, mantiene un solo componente.
- **Medio plazo**: Opción 4 si prevemos más entidades no traducibles en Admin.
- **Alternativa inmediata si se quiere aislar riesgos**: Opción 3, asumiendo la duplicación temporal.

## Checklist de cambios sugeridos (para Opción 1)
- **EntityBase.vue**
  - Usar columnas externas si existen: `columns?.length ? columns : resolvedColumns`.
  - No renderizar secciones inertes según capacidades (`supportsTags`, `supportsPreview`).
- **useEntityDeletion.ts**
  - Nueva opción `{ translatable?: boolean }` (default true). Si `false`, siempre `deleteModalOpen=true` (nada de modal de traducción).
- **useEntityModals.ts**
  - Nueva opción `{ translatable?: boolean }`. Si `false`, no precargar inglés ni limpiar campos traducibles.
- **admin/users.vue**
  - Pasar `translatable=false`, `no-tags`, `card-type=false`, y `columns` personalizados.

## Impacto esperado
- **Consistencia**: modales y edición coherentes en `/admin/users` independientemente del idioma UI.
- **UX**: columnas correctas y sin elementos de UI innecesarios.
- **Mantenibilidad**: sin forks, con costes marginales de complejidad controlada por banderas.

---

# Extensión del informe a otras páginas de /admin

## /admin/versions

### Particularidades
- **Modelo**: `content_versions` no es traducible. Campos clave: `version_semver`, `description`, `metadata`, `release`, `created_at`, `created_by`.
- **UI actual**: componentes dedicados `VersionList`, `VersionModal`, `RevisionsTable`, `JsonModal`. Paginación con `PaginationControls`.
- **Flujos**: listados con búsqueda/estado (draft/published), creación/edición de versión, publicación masiva de revisiones aprobadas.
- **Composables**: `useContentVersions()` con `fetchList|create|update|remove|publish` y meta propia.

### Opciones de adaptación (al menos 3)
- **Opción V1 — Alinear a interfaz genérica `useEntity` con capacidades**
  - **Cómo funciona**: exponer desde `useContentVersions` una interfaz compatible (items, meta, fetchList, create/update/remove) y consumir `EntityTableWrapper` con `columns` específicos; capacidades `translatable=false`, `supportsTags=false`, `supportsPreview=false`.
  - **Implementación**:
    - Añadir adaptador ligero en `useContentVersions` que mapee meta a `{ page, pageSize, totalItems }` estándar.
    - En una vista alternativa, usar `EntityTableWrapper` y `ViewControls` si se desea un layout consistente con Manage; mantener `VersionModal` para el formulario específico.
  - **Beneficios**: UI homogénea, reutiliza tabla y paginación; mínima intrusión.
  - **Contras**: dos patrones de UI si se mantiene la tabla actual en paralelo.
  - **Valoración**: recomendable si buscamos consistencia visual con el resto del backoffice sin perder el modal específico.

- **Opción V2 — Mantener componentes dedicados y extraer utilidades comunes**
  - **Cómo funciona**: dejar `VersionList/Modal` como están y extraer a utilidades compartidas: normalización de meta, `PaginationControls`, helpers de fetch y notificaciones.
  - **Implementación**:
    - Crear helper `useAdminListMeta()` para normalizar `meta` como en `useEntity`.
    - Reusar `PaginationControls` y unificar patrón de `tt()` para i18n con fallback.
  - **Beneficios**: cero riesgo funcional, mantenimiento acotado.
  - **Contras**: no unifica la tabla ni filtros con Manage.
  - **Valoración**: buena opción si priorizamos estabilidad y bajo coste inmediato.

- **Opción V3 — Proveedor de capacidades (IoC) y tabla común**
  - **Cómo funciona**: usar provider de capacidades para desactivar i18n/tags/preview y renderizar una tabla común con `EntityTableWrapper` + `columns` específicas de versiones.
  - **Implementación**:
    - Introducir `useEntityCapabilities('versions')` con `{ translatable:false, hasTags:false, hasPreview:false }`.
    - Añadir `columns` propias: semver, release, description, created_at, actions.
  - **Beneficios**: arquitectura consistente con futuras páginas admin.
  - **Contras**: requiere el provider (refactor de base).
  - **Valoración**: ideal si adoptamos la Opción 4 global del informe.

- **Opción V4 — Fork ligero `AdminEntityBase` (solo si se desea aislar)**
  - **Cómo funciona**: crear `components/admin/EntityBaseSimple.vue` sin i18n/tags/preview, y usarlo con columnas de versiones.
  - **Beneficios**: aislamiento total de Manage.
  - **Contras**: duplicación y mayor mantenimiento.
  - **Valoración**: alternativa si se quiere evitar tocar Manage por ahora.

### Recomendación para versions
- Corto plazo: V2 (extraer utilidades) o V1 (interfaz compatible + tabla común) según objetivo de consistencia visual.
- Medio plazo: V3 con provider si se adopta el patrón en todo Admin.

### Checklist mínimo (V1)
- Mapear meta a `{ page, pageSize, totalItems }` en `useContentVersions`.
- Permitir `columns` externas en la tabla (si se reutiliza EntityBase/Wrapper).
- Definir `columns` específicas: `version_semver`, `release`, `description`, `created_at`, `actions`.

---

## /admin/feedback

### Particularidades
- **Modelo**: `content_feedback` no es traducible per se, pero se filtra por `language_code` y relaciones de entidad; fecha de creación y resolución; autores.
- **UI actual**: lista con acciones (resolver/reabrir/borrar), panel de filtros avanzados (idioma, entidad, relación, rangos de fechas, usuarios), tabs con contadores por categoría; usa `CartaRow` para previews.
- **Composables**: `useContentFeedback` con normalización de meta y parámetros (incluye `lang`).

### Opciones de adaptación (al menos 3)
- **Opción F1 — Unificar paneles de filtros con un componente genérico**
  - **Cómo funciona**: extraer un `AdvancedFiltersPanel` genérico que reciba schema de filtros (tipos: select, rango de fechas, usuario, texto) y callbacks de serialización.
  - **Implementación**:
    - Crear `components/common/AdvancedFiltersPanel.vue` con slots y mapping de `v-model` a query.
    - Reusar en `/admin/feedback` y considerar su uso en Manage (`EntityFilters`) para converger.
  - **Beneficios**: reduce duplicación y asegura UX consistente.
  - **Contras**: requiere acordar un schema común de filtros.
  - **Valoración**: muy recomendable por impacto transversal.

- **Opción F2 — Proveedor de capacidades y tabla común con previews**
  - **Cómo funciona**: usar provider para declarar capacidades `{ hasPreview:true, translatable:false, hasTags:false }` y renderizar con `EntityTableWrapper`; celda de preview resuelve `CartaRow` vía slot.
  - **Implementación**:
    - Añadir columna `entity` con slot que abra preview (`CartaRow`) reutilizando `useEntityPreviewFetch`.
    - Mantener acciones específicas (resolver/reabrir/borrar) como botones en la columna de acciones.
  - **Beneficios**: tabla homogénea en Admin; previews consistentes.
  - **Contras**: trabajo de slots/columnas y provider.
  - **Valoración**: buena si buscamos uniformidad visual.

- **Opción F3 — Mantener componentes dedicados y extraer utilidades comunes**
  - **Cómo funciona**: dejar la lista actual y externalizar utilidades: normalización de fecha, sincronización query↔URL, `entity_relation` join helper, y preview fetch.
  - **Implementación**:
    - Mover helpers a `composables/common` (`useQuerySync`, `useDateRange`, `useEntityRelationJoins`).
    - Alinear la documentación de API con el schema de filtros.
  - **Beneficios**: bajo riesgo, reutilizable por otras páginas con filtros.
  - **Contras**: no hay tabla común; se mantiene estilo propio.
  - **Valoración**: eficaz y de rápida adopción.

- **Opción F4 — Adaptador de filas a `EntityRow` y uso de `EntityTableWrapper`**
  - **Cómo funciona**: normalizar cada feedback a un `EntityRow` mínimo (`id`, `name/title`, `status`, `lang`, `updated_at`) para renderizar en tabla común, y colocar detalle/nota en celda expandible.
  - **Implementación**:
    - Crear `toEntityRow(feedback)` y columnas específicas (categoría, status, fechas, usuarios, idioma, acciones).
  - **Beneficios**: reutiliza tabla y selección/batch; prepara export homogéneo.
  - **Contras**: mapeo adicional y riesgo de perder matices propios.
  - **Valoración**: viable si queremos unificar tablas.

### Recomendación para feedback
- Corto plazo: F3 (extraer utilidades) + mantener lista actual; o F1 si priorizamos convergencia de filtros.
- Medio plazo: F2 o F4 para converger en tabla común con previews por slot.

### Checklist mínimo (F1+F3)
- Extraer `AdvancedFiltersPanel` genérico con tipos de filtro y slots.
- Externalizar utilidades de sincronización de query y rangos de fecha.
- Centralizar `useEntityPreviewFetch` para previews desde feedback y manage.

---

# Decisión y plan de ruta para separar /admin de /manage

## Decisión de arquitectura
- Mantener las responsabilidades de `/admin` separadas de `/manage`.
- Evitar forks innecesarios; aplicar cambios mínimos y seguros en componentes compartidos.
- Extraer y consolidar solo piezas neutrales en `components/common` y `composables/common`.

## Plan por fases (incremental y reversible)

### Fase 0 — Correcciones mínimas y utilidades compartidas (ahora)
- **Componentes a crear (common)**
  - `components/common/AdvancedFiltersPanel.vue`.
- **Componentes a mover o clonar en common**
  - `components/admin/JsonModal.vue` → `components/common/JsonModal.vue` (mantener compatibilidad de import).
  - Evaluar `components/manage/CartaRow.vue` → `components/common/EntityPreviewRow.vue` (alias temporal desde `CartaRow`).
- **Composables a crear (common)**
  - `composables/common/useQuerySync.ts` (URL ↔ estado, fechas ISO).
  - `composables/common/useDateRange.ts` (normalización de rangos y límites).
  - `composables/common/useListMeta.ts` (normalizar `{ page, pageSize, totalItems, totalPages }`).
  - `composables/common/useEntityPreviewFetch.ts` (unificado para feedback/manage).
- **Composables a ajustar (mínimos y seguros)**
  - `useEntityDeletion`: aceptar opción `{ translatable?: boolean }` (default true).
  - `useEntityModals`: aceptar opción `{ translatable?: boolean }`.
  - `EntityBase.vue`: respetar `props.columns` si se pasan.

### Fase 1 — Aislar Admin sin romper UX existente
- **/admin/users**
  - Seguir usando `EntityBase` con `translatable=false`, `no-tags`, `card-type=false` y `columns` personalizados.
  - Preparar `components/admin/users/UserTable.vue` (wrapper fino) para transición futura, pero sin cambiar aún.
- **/admin/versions**
  - Mantener `VersionList`/`VersionModal`.
  - Adoptar `useListMeta` y `PaginationControls` estandarizados.
- **/admin/feedback**
  - Sustituir panel inline por `AdvancedFiltersPanel` (common), conservando lógica de negocio.
  - Adoptar `useQuerySync` y `useDateRange`.

### Fase 2 — Consolidación opcional (medio plazo)
- Introducir `useEntityCapabilities` (provide/inject) para evitar proliferación de props en compartidos.
- Evaluar `components/common/DataTable.vue` con columnas declarativas y slots (unificar tablas sin mezclar /manage).
- Migrar `CartaRow` a `EntityPreviewRow` en common y ajustar imports.

## Inventario detallado

- **Componentes a crear**
  - `components/common/AdvancedFiltersPanel.vue`.
  - (Futuro) `components/common/EntityPreviewRow.vue` (alias desde `manage/CartaRow`).
  - (Opcional Fase 2) `components/common/DataTable.vue`.
  - (Opcional transición) `components/admin/users/UserTable.vue` (wrapper fino).

- **Componentes a poner en common**
  - `components/admin/JsonModal.vue` → `components/common/JsonModal.vue`.
  - Confirmar `components/common/ConfirmDeleteModal.vue` ya centralizado.
  - Mantener `components/common/PaginationControls.vue` como estándar.

- **Composables a crear**
  - `composables/common/useQuerySync.ts`.
  - `composables/common/useDateRange.ts`.
  - `composables/common/useListMeta.ts`.
  - `composables/common/useEntityPreviewFetch.ts`.

- **Composables/Componentes a modificar (mínimo)**
  - `app/components/manage/EntityBase.vue`: respetar `columns` externas.
  - `app/composables/manage/useEntityDeletion.ts`: opción `{ translatable?: boolean }`.
  - `app/composables/manage/useEntityModals.ts`: opción `{ translatable?: boolean }`.

## Criterios de aceptación
- `/admin/users` muestra columnas propias y no ofrece acciones de traducción ni modales erróneos.
- `/admin/versions` usa meta/paginación estándar y conserva su UI nativa.
- `/admin/feedback` mantiene funcionalidad actual con filtros avanzados usando el panel común.
- Ninguna regresión en `/manage` (tests manuales básicos de listado/edición/borrado/traducción).

## Riesgos y mitigación
- Cambios en compartidos afectan a Manage: limitar modificaciones a banderas explícitas y defaults conservadores.
- Duplicidad temporal de `JsonModal`: mover con export re-dirigido para evitar roturas de import.

## Orden sugerido (milestones)
1) Ajustes mínimos: `EntityBase` (columns), `useEntityDeletion/Modals` (flags).
2) Crear `useQuerySync`, `useDateRange`, `useListMeta`, `useEntityPreviewFetch`.
3) Mover `JsonModal` a common con alias de import.
4) Implementar `AdvancedFiltersPanel` y aplicarlo en `/admin/feedback`.
5) Adoptar `useListMeta` en `/admin/versions` y validar paginación.
6) (Opcional) Wrapper `UserTable.vue` para transición.
