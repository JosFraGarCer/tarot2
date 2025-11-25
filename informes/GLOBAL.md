# Informe global de arquitectura Tarot2

## Resumen ejecutivo
Tarot2 consolida un ecosistema Nuxt 4 full-stack que ofrece SSR, administración avanzada de contenido y un modelo relacional en PostgreSQL. Las decisiones clave giran en torno a: tipado extremo a extremo con Kysely+Zod, internacionalización completa, paneles administrativos sobre NuxtUI 4 y políticas editoriales apoyadas en `content_versions` y `content_revisions`.[@docs/PROJECT_INFO.md#8-170][@docs/SERVER.md#1-200]

## Principios rectores
1. **Dominios cohesivos**: agrupar código por entidad (`world`, `arcana`, `base_card`, etc.) tanto en `app/` como en `server/api`. Facilita localizar artefactos CRUD+i18n y reduce regresiones cruzadas.[@docs/PROJECT_INFO.md#32-141]
2. **SSR-first con caché ETag**: los listados críticos deben servirse vía `useAsyncData`/`useApiFetch` habilitando `If-None-Match` para coherencia cliente-servidor y rendimiento óptimo.[@docs/PROJECT_INFO.md#124-170][@docs/SERVER.md#49-140]
3. **Internacionalización end-to-end**: toda lectura se resuelve con fallback a inglés mediante joins dobles y `language_code_resolved`; la UI debe espelhar el mismo flujo.[@docs/PROJECT_INFO.md#14-41][@docs/SERVER.md#215-332]
4. **Contratos normalizados**: todas las rutas devuelven `{ success, data, meta? }` y reutilizan `buildFilters` + `createPaginatedResponse` para metadatos consistentes.[@docs/API.MD#5-70][@docs/SERVER.md#95-137]
5. **Observabilidad transversal**: Pino registra filtros, idioma y tiempos; extender ese patrón a front (telemetría de interacción) es clave para detectar cuellos de botella.[@docs/SERVER.md#136-140]
6. **Separación Admin/Manage**: mantener responsabilidades y capacidades diferenciadas (permisos, UX y flujos), evitando mezclar componentes salvo utilidades neutras.[@docs/PROJECT_INFO.md#110-120][@docs/INFORME-admin.md#223-170]

## Estado actual del sistema
### Frontend (Nuxt 4 + NuxtUI 4)
- `/manage`: contenedor polimórfico basado en `EntityBase.vue` con vistas tabla, tarjeta, classic y carta; apalanca composables genéricos (`useEntity`, `useManageFilters`, `useEntityModals`).[@app/components/manage/EntityBase.vue#22-232]
- `/admin`: dashboards especializados (versions, feedback, users) que consumen wrappers como `UserTable`, `RevisionsTable` y `AdvancedFiltersPanel` para filtros complejos.[@app/components/admin/RevisionsTable.vue#1-215][@app/components/admin/users/UserTable.vue#1-90]
- Componentes comunes (`PaginationControls`, `AdvancedFiltersPanel`, badges de estado) estandarizan interacción y accesibilidad.

### Backend (H3 + Kysely)
- Rutas agrupadas por entidad bajo `server/api/*` con middleware `00.auth.hydrate` y `01.auth.guard` (JWT + roles).[`@docs/SERVER.md#49-140`]
- `buildFilters` normaliza ordenación/ búsqueda, incluyendo rangos de fecha y semántica AND de tags en listados.[@docs/SERVER.md#318-335][@server/api/content_feedback/index.get.ts#28-136]
- `content_versions` gobierna releases (`release_stage` enum) y se complementa con endpoints de publicación y revert pendientes de endurecer métricas.[@docs/SCHEMA POSTGRES..TXT#38-437]

### Datos e internacionalización
- Esquema `*_translations` con dominio `language_code`; eliminación condicionada por idioma garantiza soft-delete de traducciones.[@docs/SCHEMA POSTGRES..TXT#318-842]
- Tablas editoriales (`content_feedback`, `content_revisions`) incluyen referencias a usuarios y versión, habilitando auditorías.[@docs/SCHEMA POSTGRES..TXT#384-408][@docs/SCHEMA POSTGRES..TXT#845-888]

## Lineamientos operativos
1. **Pipeline vertical**: cualquier feature nueva debe recorrer DB → API → composables → UI asegurando tests y documentación actualizados.[@docs/PROJECT_INFO.md#27-113]
2. **Gestión de versiones**: exponer chips de `release` y herramientas de `publish/revert` integradas con métricas para liberar contenido controladamente.[@docs/PROJECT_INFO.md#136-170]
3. **Seguridad**: reforzar logout limpiando cookie, añadir rate limiting (login/logout/publish/revert) y aprovechar permisos agregados backend para gating UI.[@docs/PROJECT_INFO.md#132-170][@docs/API.MD#31-88]
4. **Observabilidad**: enriquecer logs con `entity_type`, `lang`, `tag_filters` y latencias; incorporar tracing light (p. ej. `X-Request-Id`) para correlación front-back.
5. **Accesibilidad**: mantener componentes NuxtUI con WCAG AA (contraste, focus ring, shortcuts) y aprovechar densidades configurables en tablas.

## Roadmap recomendado
| Fase | Alcance | Entregables clave |
| --- | --- | --- |
| F0 | Endurecer cimientos | Limpieza cookie logout, rate limiting básico, adopción completa de `useApiFetch` en admin, extraer `useTableSelection` |
| F1 | Convergencia UI | `useEntityCapabilities`, `BulkActionsBar`, `EntityInspectorDrawer`, refactor de badges y presets de formularios |
| F2 | Observabilidad y releases | Métricas de publicación, dashboards Pino → OpenTelemetry light, toggles UI por `release` |
| F3 | Expansión narrativa | Integrar Effect System 2.0 en formularios, preparar mundos/mazos avanzados por configuración |

## Riesgos y mitigación
- **Divergencia Admin/Manage** → establecer contractos (`EntityRow`, capabilities) y lint de imports para evitar acoplamientos accidentales.
- **Fragilidad i18n** → tests e2e multi-idioma + mocks DB con traducciones incompletas para validar fallback.
- **Cargas pesadas SSR** → monitorear `timeMs` > 500 ms en logs y adoptar caching incremental por entidad.
- **Sync permisos** → centralizar roles y feature flags en JSONB `permissions` con helpers en front (`usePermission`) enlazados a merging backend.

## Métricas recomendadas
- **Render SSR (<300 ms)** para `/manage` y `/admin/versions`.
- **Ratio 304/200**: objetivo ≥40 % en listados paginados gracias a ETag.
- **Cobertura i18n**: % campos traducidos por idioma vs base EN.
- **Revisiones publicadas**: lead time promedio por release (aprobado → publicado).

## Stack y convenciones
- **Frontend**: Nuxt 4, NuxtUI 4, Pinia, VueUse, TailwindCSS.
- **Backend**: H3, Kysely, PostgreSQL, Pino, Zod, bcrypt, jose.[@docs/SERVER.md#1-200]
- **Infra**: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, almacenamiento de imágenes optimizado AVIF vía `server/api/uploads`.
- **Formato repositorio**: alias `~/` (frontend) y `@/` (resolver unificado) con ESLint/TSConfig alineados.

## Próximos pasos inmediatos
1. Completar los informes específicos (server, composables, componentes, sugerencias) para detallar acciones ejecutables.
2. Abrir issues/fichas de trabajo alineadas al roadmap, incluyendo pruebas y documentación.
3. Socializar este resumen con el equipo para validar prioridades y riesgos antes del siguiente sprint.
