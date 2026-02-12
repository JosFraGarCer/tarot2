# Auditoría exhaustiva: /deck (Catálogo público)

## Resumen actualizado
- `/deck` ofrece catálogo público de `card_type`, `base_card`, `world`, `arcana`, `facet` y `skill`, reutilizando la capa de datos de `/manage` mediante `useDeckCrud`.
- Páginas del subdirectorio `app/pages/deck` son delgadas; delegan layout en `DeckEntityPage` y listados en `DeckSection` con paginación SSR.
- SSR + caching: `useAsyncData({ server:true })` + `useApiFetch` heredado de los CRUDs aseguran respuestas cacheables con ETag/304.
- No se registran errores funcionales; la integración con backend está alineada con `docs/API.MD` y `docs/SCHEMA POSTGRES..TXT`.

## Funcionamiento y capacidades
- **Layout**: `DeckEntityPage.vue` renderiza encabezado (título/descripcion traducidos) y un `DeckSection` por entidad.@app/components/deck/DeckEntityPage.vue#1-42
- **Listados**: `DeckSection.vue` usa `useDeckCrud(entity)` para obtener `items`, `loading`, `error`, `fetch` y paginación compartida. Registra tamaños de página y muestra skeletons/empty states.
- **CRUD compartido**: `useDeckCrud` normaliza nombres y cachea instancias `use<entity>Crud` para evitar duplicación de estado; ajusta filtros `status`/`is_active` y paginación antes de llamar a `crud.fetchList()`.
- **Rendering de cartas**: se apoya en plantillas (`useCardTemplates`, `useCardViewHelpers.resolveImage`) para mostrar tarjetas consistentes con Manage.

## Dependencias principales
- Frontend: `app/pages/deck/*.vue`, `components/deck/DeckEntityPage.vue`, `components/deck/DeckSection.vue`, `composables/deck/useDeckCrud.ts`, `composables/common/useCardTemplates`, `components/common/PaginationControls.vue`.
- Backend: CRUD handlers `/api/<entity>` reutilizados sin rutas especiales; `buildFilters` + `createPaginatedResponse` garantizan filtros y meta homogéneos.

## Alineación con documentación
- `docs/API.MD` recién actualizada cubre campos como `card_family`, `metadata`, `legacy_effects`, `content_version_id` que /deck consume indirectamente.
- `docs/SERVER.md` confirma uso de `createCrudHandlers`, `buildFilters` y contratos `{ success, data, meta }`.
- `docs/SCHEMA POSTGRES..TXT` es fuente de verdad para entidades mostradas en /deck.
- `docs/effect-system.md` describe los efectos semánticos/legacy que pueden mostrarse en tarjetas públicas.

## Cambios recientes
- `useDeckCrud` ahora cachea instancias de CRUD para evitar re-instanciación y loguea operaciones en dev.
- `DeckSection` admite `paginate` y registra `registerPageSizeOptions` para mantener UI consistente.
- `AdvancedFiltersPanel` aún no se expone en /deck; se mantiene UI minimalista.

## Riesgos y mejoras pendientes
- **Semántica de tags**: los endpoints usan OR en algunos casos; si se decide semántica AND, /deck deberá reflejar cambios.
- **Accesibilidad**: revisar alt/aria-label en tarjetas y botones de paginación.
- **TTL de cache**: evaluar aumentar TTL en `useApiFetch` para contenido público.

## Oportunidades
1. Extraer `CardGrid` + `useCardVM` compartidos con `/manage`.
2. Exponer filtros públicos (status, tags, idioma) reutilizando `useManageFilters` en modo solo lectura.
3. Añadir favoritos/listas guardadas (requiere persistencia de usuario).
4. Enriquecer preview con efectos (aprovechando `card_effects` y `legacy_effects`).

## Testing recomendado
- **E2E**: navegar por todas las secciones (`card-types`, `base-cards`, etc.), cambiar idioma, paginar y validar SSR sin errores.
- **Unidad**: `useDeckCrud` (alias → CRUD, cache), `DeckSection` (pageSize, inicialización SSR), `useCardTemplates` (render de layouts).

## Referencias clave
- `@app/pages/deck/index.vue#1-200`
- `@app/components/deck/DeckSection.vue`
- `@app/composables/deck/useDeckCrud.ts#1-200`
- `@app/composables/manage/useBaseCard.ts`, `useWorld.ts`, `useArcana.ts`, `useFacet.ts`, `useSkill.ts`, `useCardType.ts`
- `@server/api/base_card/_crud.ts#1-220`
- `@server/api/world/_crud.ts#1-195`
- `@server/utils/filters.ts#40-158`
