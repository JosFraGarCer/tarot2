# Informe técnico: Server + API Tarot2

## Visión general
El backend de Tarot2 corre sobre Nuxt 4/H3, estructurado por dominio bajo `server/api/<entidad>`. Cada módulo aplica Zod para validar entradas, Kysely para consultas tipadas y helpers transversales (`buildFilters`, `createPaginatedResponse`). El middleware `00.auth.hydrate` hidrata el usuario desde cookie JWT y `01.auth.guard` protege el resto de rutas, garantizando políticas de roles centralizadas.[@docs/SERVER.md#1-140][@docs/API.MD#5-40]

## Arquitectura y middleware
- **Plugins globales**: `server/plugins/db.ts` (Kysely PostgresDialect), `server/plugins/logger.ts` (Pino), `server/plugins/auth.ts` (helpers JWT).[@docs/SERVER.md#49-110]
- **Middleware**:
  - `00.auth.hydrate`: verifica `auth_token`, carga usuario/roles, fusiona permisos.[@docs/SERVER.md#128-140]
  - `01.auth.guard`: bloquea `/api/*` salvo login/logout; niega usuarios suspendidos y usa permisos agregados.[@docs/API.MD#31-42]
- **Rate limiting pendiente**: docs y memorias indican necesidad de middleware `02.rate-limit` para login/logout/publish/revert; aún no implementado.

## Organización de rutas
Cada entidad dispone de CRUD completo y utilidades de export/import:
- `server/api/<entity>/index.get|post.ts`
- `server/api/<entity>/[id].get|patch|delete.ts`
- `server/api/<entity>/batch.patch.ts`
- `server/api/<entity>/export.get.ts`
- `server/api/<entity>/import.post.ts`
Esto aplica a `world`, `world_card`, `arcana`, `base_card`, `card_type`, `skill`, `facet`, `tag`, `user`, `role` y recursos editoriales (`content_versions`, `content_revisions`, `content_feedback`).[@docs/SERVER.md#285-335]

### Casos destacados
- **Auth**: `POST /api/auth/login` y `POST /api/auth/logout` (debe limpiar cookie).[ @docs/API.MD#31-40 ]
- **Users**: rutas singular `/api/user/*` con agregación de roles y JSONB `permissions`.
- **Content versions**: `GET/POST/PATCH/DELETE /api/content_versions`, `POST /api/content_versions/publish` (endpoint presente en UI; verificar estado en server).[@docs/SERVER.md#67-144]
- **Content revisions**: `GET/PATCH/DELETE /api/content_revisions`, `POST /api/content_revisions/:id/revert`.
- **Content feedback**: filtros avanzados con joins condicionados por `entity_relation`; logging registra página, filtros y `timeMs`.[@server/api/content_feedback/index.get.ts#28-136]
- **Uploads**: conversión a AVIF con Sharp, validaciones de peso/mimetype.[@docs/API.MD#313-332]
- **Database import/export**: endpoints JSON/SQL para respaldos (`server/api/database`).

## Conexión con PostgreSQL
- **Tipado**: `server/database/types.ts` define la interfaz `DB`, generada vía Kysely.
- **Esquema**: ver `docs/SCHEMA POSTGRES..TXT`, que incluye tipos enumerados (`card_status`, `release_stage`, `user_status`, `feedback_status`) y tablas con triggers de timestamps.[@docs/SCHEMA POSTGRES..TXT#7-884]
- **Internacionalización**: tablas `_translations` con FK `language_code` (dominio ISO 639-1 + ISO 3166 opcional). Borrado condicional por idioma (si `lang === 'en'` se elimina entidad completa).[@docs/SCHEMA POSTGRES..TXT#32-708]
- **Versionado**: `content_versions` y `content_revisions` permiten auditar cambios editoriales; `release` (enum) gobierna etapas `dev|alfa|beta|candidate|release|revision`.[@docs/SCHEMA POSTGRES..TXT#417-437]

## Estándares de API
- **Formato respuesta**: `{ success: true, data, meta? }` para éxito; helpers `createResponse` y `createPaginatedResponse` en `server/utils/response.ts`.[@docs/API.MD#26-33]
- **Validación**: `safeParseOrThrow` (Zod) lanza `createError` con detalles 400/422.
- **Filtros/paginación**: `buildFilters` gestiona `page`, `pageSize`, `search`, `sort`, `direction`, rangos `created/resolved`, semántica de tags y conteos totales.[@docs/SERVER.md#95-137][@docs/API.MD#15-27]
- **Idiomas**: `server/utils/i18n.ts` resuelve `lang|language|locale`, generando fallback `language_code_resolved` en consultas SQL.[@docs/SERVER.md#215-332]

## Observabilidad y seguridad
- **Logging**: Pino registra filtros, idioma y tiempos. Centros críticos: monitorear `timeMs`, `resolvedSort` y contadores de filas, sumado a errores con contexto.[@server/api/content_feedback/index.get.ts#95-137]
- **Seguridad pendiente**: añadir rate limiting, limpiar cookie en logout, reforzar validación de permisos en endpoints publish/revert, auditar import/export (tamaño, formato).
- **Métricas**: sugerido introducir `X-Request-Id`, logging de `user_id` (cuando aplique) y contadores de cambios (p.ej. revisiones aprobadas por publicación).

## Integración con frontend
- **useApiFetch**: wrapper con ETag y caché 304; conviene usarlo en todas las llamadas para evitar `$fetch` directo.[@docs/API.MD#24][@docs/SERVER.md#164]
- **Composables**: `useEntity`, `useContentVersions`, `useContentFeedback` consumen la semántica de meta y filtros, mapeando `meta` estándar a estado local.[@app/composables/manage/useEntity.ts#19-392][@app/composables/admin/useContentVersions.ts#76-159][@app/composables/admin/useContentFeedback.ts#114-360]
- **Permisos**: `useCurrentUser` expone roles/permissions merged; la UI habilita acciones según flags (resoluciones, aprobación, publicación).

## Checklist de mejora
1. Implementar middleware `02.rate-limit` con stores en Redis/PG (login/logout/publish/revert) y actualizar docs.[Memoria]
2. Garantizar que `POST /api/auth/logout` limpie cookie `auth_token` (`setCookie(name, '', { maxAge: 0 })`).
3. Consolidar helper SQL para agregación de tags repetido en distintos modules.
4. Introducir `useServerPagination` (wrapper `buildFilters`) para reducir boilerplate en handlers con lógica similar.
5. Uniformar logging de publish/revert con conteos (`totalEntities`, `totalRevisionsPublished`).
6. Validar semántica AND de tags vs OR en endpoints que aún usan ANY (alineación doc/código).
7. Ampliar tests E2E (Playwright) cubriendo flujos editoriales (publish, revert), feedback con filtros avanzados y SSR de listados.
8. Documentar alias de rutas legacy (`/api/users` vs `/api/user`) para compatibilidad, o exponer alias temporal.

## Roadmap backend
| Prioridad | Acción | Impacto |
| --- | --- | --- |
| Alta | Rate limiting, logout correcto, logging publish/revert | Seguridad, compliance |
| Media | Helper agregación tags + `useServerPagination` | Menos duplicación y bugs |
| Media | Pruebas integrales SSR/ETag | Rendimiento y coherencia |
| Baja | Telemetría avanzada (OpenTelemetry light) | Observabilidad |

## Conclusión
El backend ya cuenta con estructura modular sólida, contratos normalizados y soporte multi-idioma. El foco inmediato debe estar en seguridad (rate limits, logout), convergencia de helpers y observabilidad, asegurando que la UI y los composables sigan beneficiándose de metadatos coherentes y caché eficiente.
