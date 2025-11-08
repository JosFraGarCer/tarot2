# Informe Exhaustivo: `/manage` y `/deck/*`

## Resumen Ejecutivo
- El refactor reciente reduce la configuración duplicada de filtros y unifica alias desde los composables CRUD; la UI consume metadatos consistentes. @app/composables/manage/useEntity.ts#34-604 @app/components/manage/EntityBase.vue#22-237 @app/components/manage/EntityFilters.vue#96-258
- La invalidación del caché tras mutaciones en `/manage` evita desincronización con `/deck`, pero aún falta propagar invalidación para otras dependencias (p.ej. tags relacionadas o SSR warmups). @app/composables/manage/useEntity.ts#383-568
- El backend de tags presenta consultas complejas pero carece de reutilización central de normalización; se recomiendan helpers compartidos y vistas materializadas ligeras para métricas. @server/api/tag/index.get.ts#1-108
- El esquema PostgreSQL aporta bases para APIs de feedback y versionado; conviene definir contratos REST en torno a `content_feedback` y `content_versions` para cerrar el ciclo editorial. @docs/SCHEMA POSTGRES..TXT#368-426

## Alcance y Metodología
- **Frontend:** `app/pages/manage.vue`, `app/components/manage/*`, `app/composables/manage/*`, `app/components/deck/*`, `app/composables/deck/useDeckCrud.ts`.
- **Backend:** `server/api/*` (especialmente tags/base_card/facet), utilidades `server/utils/*`.
- **Base de datos:** `docs/SCHEMA POSTGRES..TXT` para analizar estructuras tags/feedback/versionado.
- Método: revisión estática, verificación de nuevas integraciones, correlación con esquema, búsqueda de duplicidades y rutas de optimización.

## Hallazgos Frontend `/manage`
### 1. Configuración de filtros unificada
- Los CRUD exponen `filterConfig` y defaults consistentes, consumidos por `EntityBase` y `EntityFilters`. @app/composables/manage/useBaseCard.ts#1-33 @app/components/manage/EntityBase.vue#193-225
- Falta auditar composables fuera de `/manage` (ej. admin/users) para adoptar el mismo patrón.

### 2. Invalidation tras mutaciones
- `useEntity` limpia la caché de `useApiFetch` al crear/editar/eliminar, sincronizando `/manage` con `/deck`. @app/composables/manage/useEntity.ts#385-566
- Recomendación: exponer un evento `onInvalidate` para que otros módulos (p.ej. dashboards) se suscriban.

### 3. Acciones placeholder
- `useManageActions` continúa mostrando notificaciones genéricas; no hay integración con exportaciones reales ni bulk update. @app/composables/manage/useManageActions.ts#1-39
- Se sugiere definir endpoints y UI modales reutilizables.

### 4. Logging y toasts
- Persisten `console.log` en `app/pages/manage.vue` para crear entidades. @app/pages/manage.vue#167-170
- Debe migrarse a `useToast` o `logger` global para consistencia.

## Hallazgos Frontend `/deck/*`
### 1. Cache + SSR
- `DeckSection` usa `useAsyncData` con claves por locale/entidad y respeta pagination compartida. @app/components/deck/DeckSection.vue#72-166
- Falta invalidar cuando tags se modifican desde `/manage` (misma entidad pero distinto endpoint), ya que el patrón actual usa regex por `resourcePath`; convendría ampliar el `pattern` con dependencias (ej. `/tag`).

### 2. Plantillas y estado
- Aún existe coupling fuerte entre plantillas y datos (p.ej. `resolveTemplate('Class')`). @app/components/deck/DeckSection.vue#147-149
- Propuesta: exponer mapping por entidad para permitir plantillas alternativas o vistas sin código duro.

## Backend y Base de Datos
### 1. Tags: normalización y métricas
- Peticiones tags repiten lógica de normalización; se recomienda extraer util `normalizeTagFilters` y `applyTagSearch`. @server/api/tag/index.get.ts#14-101
- El esquema muestra índices adecuados (`idx_tags_category`, `idx_tags_parent_id`), pero sería útil crear vistas/materializadas para conteos de uso (`tag_links` no aparece en el extracto; validar). @docs/SCHEMA POSTGRES..TXT#556-612

### 2. Feedback y versiones
- Tablas `content_feedback` y `content_versions` ofrecen base para endpoints de moderación y releases. @docs/SCHEMA POSTGRES..TXT#368-426
- Recomendaciones:
  - Exponer `/api/content_feedback` con filtros por `entity_type`, `status`, `language_code` y `version_number`.
  - Integrar triggers o jobs para cerrar feedback al publicar una versión (`content_versions`).

### 3. Preparativos API Feedback/Versiones
- Añadir foreign keys desde entidades (`arcana`, `base_card`, etc.) hacia `content_versions` (ya existe `content_version_id`) y exponer endpoints para asignar versiones.
- Diseñar eventos o webhooks para notificar cuando `content_feedback.status` cambie, habilitando UI de seguimiento.

## Problemas Detectados y Riesgos
| Severidad | Problema | Impacto | Referencia |
| --- | --- | --- | --- |
| Media | `console.log` en `/manage` | Logging inconsistente | @app/pages/manage.vue#167-170 |
| Media | `useManageActions` sin implementación real | Acciones críticas indisponibles | @app/composables/manage/useManageActions.ts#1-39 |
| Media | Invalidation limitada a resourcePath | `/deck` puede mostrar datos stale (tags, relaciones) | @app/composables/manage/useEntity.ts#383-566 |
| Baja | Tag API sin helper compartido | Código duplicado/riesgo de divergencia | @server/api/tag/index.get.ts#14-101 |
| Baja | Falta de endpoints para feedback/version | No se aprovecha el esquema editorial | @docs/SCHEMA POSTGRES..TXT#368-426 |

## Oportunidades de Optimización
1. **Helper global de filtros tags**: crear util en `server/utils/tagFilters.ts` que gestione `tags`, `tag_ids`, `category`, `parent_id`, reutilizable entre endpoints.
2. **Invalidación ampliada**: en `useEntity`, permitir registrar patrones extra (ej. `['/base_card', '/tag']`) para limpiar cache relacionado.
3. **Bulk actions reales**: implementar endpoints `POST /api/{entity}/export` (CSV/JSON) y `PATCH /api/{entity}/bulk`, integrarlos en `useManageActions`.
4. **API Feedback**: diseñar CRUD + filtros con paginación, integrando indexes ya disponibles. Preparar UI en `/manage` para mostrar feedback por entidad.
5. **Versionado**: crear endpoint `POST /api/content_versions` y permitir asignación desde `/manage`; registrar cambios en `content_version_id` para auditar releases.
6. **Smoke tests `/deck`**: agregar pruebas e2e que verifiquen invalidación tras mutaciones (ej. Playwright con SSR warm + fetch). @app/components/deck/DeckSection.vue#72-166

## Recomendaciones Prioritarias
1. **Completar migración de logging/actions en `/manage` (Media)** – Reemplazar `console.log`, exponer acciones reales y bloquear botones hasta tener backend.
2. **Ampliar invalidación de caché (Media)** – Permitir patrones múltiples o callbacks para entidades relacionadas.
3. **Centralizar filtros de tags (Media)** – Reducir duplicidad y preparar métricas/analytics.
4. **Diseñar API de feedback/versionado (Media)** – Aprovechar tablas `content_feedback` y `content_versions` para cerrar ciclo editorial.
5. **Documentar nuevos patrones** – Actualizar `docs/manage-deck-audit.md` con refactors recientes e instrucciones de caché.

## Próximos Pasos Sugeridos
1. Sesión técnica (2h) para definir alcance de export/batch y API feedback.
2. Sprint corto para implementar helper `normalizeTagFilters` y ampliar invalidación cache.
3. Elaborar PR con reemplazo de `console.log` y conexión a logger/toast.
4. Planificar endpoints feedback/version y UI correspondiente.
5. Redactar smoke tests `/deck` y estrategia de warm-cache SSR.

## Anexos
- CRUD/Filters: @app/composables/manage/useEntity.ts#34-618, @app/composables/manage/useBaseCard.ts#1-33, @app/components/manage/EntityFilters.vue#96-258
- Deck: @app/components/deck/DeckSection.vue#72-166, @app/composables/deck/useDeckCrud.ts#80-202
- Backend: @server/api/tag/index.get.ts#1-108, @docs/SCHEMA POSTGRES..TXT#368-612
