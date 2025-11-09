# Auditoría exhaustiva: /deck (Catálogo)

## Resumen
- Sección pública de exploración del mazo: entidades `cardType`, `baseCard`, `world`, `arcana`, `facet`, `skill`.
- Arquitectura: páginas finas (`/deck/*`) + componentes genéricos (`DeckEntityPage`, `DeckSection`) + composable `useDeckCrud` que reusa los CRUD de `/manage`.
- SSR y caché: listado vía `useAsyncData` (server: true), ETag/304 vía `useApiFetch` en los composables reutilizados.
- Sin errores críticos detectados en frontend; backend de listados y filtros está implementado.

## Funcionamiento y capacidades de usuario
- Páginas `/deck/*` delegan en `DeckEntityPage`, que arma el layout y renderiza un `DeckSection` paginado de la entidad.
- `DeckSection`:
  - Carga inicial SSR con `useAsyncData` usando clave estable `deck:{lang}:{entity}`.
  - Integración con el CRUD de `manage` mediante `useDeckCrud(entity)`, heredando filtros y paginación.
  - Vista en grid con plantillas de cartas (`useCardTemplates`, template por defecto `Class`).
  - Paginación cliente/servidor mediante `PaginationControls` y `useEntityPagination` (delegado del CRUD reutilizado).
  - Empty/skeleton states y control de `pageSize` dinámico (cuando `limit` está presente en modo preview).

## Dependencias frontend
- Páginas: `app/pages/deck/{index,card-types,base-cards,arcana,facets,skills,worlds}.vue` (todas consumen `DeckEntityPage`).
- Componentes: `components/deck/DeckEntityPage.vue`, `components/deck/DeckSection.vue`.
- Composable principal: `composables/deck/useDeckCrud.ts`.
- Utilidades comunes: `composables/common/useCardTemplates`, `useCardViewHelpers`, `components/common/PaginationControls.vue`.

## Dependencias backend
- Reutiliza endpoints de `/api/{card_type, base_card, world, arcana, facet, skill}` que existen con operaciones completas (index.get/post, id.get/patch/delete, export/import, batch.patch).
- Filtros y paginación se resuelven en el servidor con Kysely + utilidades (`buildFilters`, `createPaginatedResponse`) y traducciones fallback (joins `*_translations` y coalesce con `en`).

## Alineación con /docs (API, SERVER, SCHEMA)

- Base URL `/api` y respuestas `{ success, data, meta? }` (API.MD/SERVER.md).
- I18n: los listados resuelven `name/short_text/description` con fallback a `'en'` y exponen `language_code_resolved`.
- Mapeo `card_type` → tabla base `base_card_type` (nota en API.MD). En /deck consumimos `/api/card_type` que internamente mapea a dicha tabla.
- Tags: la documentación generaliza filtros AND; algunos listados actuales (p.ej. base_card) aplican OR. Alinear semántica (decisión de producto) y actualizar consultas/documentación.
- Carga de imágenes: rutas bajo `/img/<entity>/...` servidas desde `public/img` y/o generadas por `/api/uploads`.

### Sistema de efectos (Effect System 2.0)

- El esquema y `effect-system.md` introducen `effect_type`, `effect_target` y `card_effects` (semántico), además de modo narrativo (`legacy_effects` + `effects` JSONB por idioma).
- /deck puede integrar una presentación de efectos (semánticos o legacy) en la previsualización de cartas base/world/skills/facets como mejora futura.

## Flujo de datos
- `useDeckCrud` mapea la entidad solicitada a su CRUD de `manage` (cacheado para no re-instanciar).
- `fetch(options)` de `useDeckCrud` ajusta paginación, status/is_active y dispara `crud.fetchList()`.
- `DeckSection` obtiene `items` y `loading` del CRUD, registrando opciones de pageSize para que la UI de paginación se mantenga coherente.

## Problemas detectados
- No se han encontrado errores funcionales en `/deck`. La integración con `manage` es correcta y evita duplicar lógica de datos.

## Oportunidades de optimización y reducción de duplicados
- **[Grid de cartas]** Extraer un componente reutilizable (por ejemplo `CardGrid.vue`) que parametrice: plantilla, badges de estado/activo, imagen y tags. Hoy esa lógica se repite parcialmente en `/manage` (`EntityCards`, `EntityCardsClassic`) y en `/deck`.
- **[ViewModel de carta]** Crear `useCardVM(entityKey)` que derive `titleOf`, `badges`, `image`, `langBadge`, evitando repetir helpers en varias vistas.
- **[Caché TTL]** Ajustar TTL del `useApiFetch` por entidad (por ejemplo mayor para contenido público `/deck`) con `context.cacheTTL` para mejorar percepción de rendimiento.
- **[Accesibilidad]** Añadir alt/aria-label consistentes en imágenes y botones dentro de las tarjetas.

## Refactors propuestos (mover lógica fuera de *.vue)
- `DeckSection.vue`: mover coordinación de `pageSizeItems` y `ensurePageSize()` a un composable `useDeckPagination(deckCrud)` para testearlo en aislamiento.
- Unificar resolución de imágenes usando siempre `useCardViewHelpers.resolveImage` (garantizar fallback y rutas por entidad).

## Funcionalidades posibles
- **Favoritos/Listas**: permitir al usuario marcar cartas y ver colecciones.
- **Búsqueda y filtros públicos**: exponer UI de filtrado (status/activo/tags) en `/deck` similar a `/manage` (solo lectura), reusando `useManageFilters` con una capa de mapeo.
- **Previsualización ampliada**: modal con detalles y navegación de cartas relacionadas (por tags o tipo).

## Testing sugerido
- E2E: navegar por todas las entidades, paginar, validar skeleton/empty states y rendering SSR.
- Unidad: `useDeckCrud` (mapeo y cacheo de CRUDs), `DeckSection` (coordinación de pageSize y carga inicial con `useAsyncData`).

## Prioridades (Plan de acción)
- **P2** Extraer `CardGrid` + `useCardVM` para reducir duplicación con `/manage`.
- **P3** Ajustar TTLs y auditoría de accesibilidad (labels/alt).
