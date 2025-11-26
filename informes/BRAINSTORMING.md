# Brainstorming de mejoras – Tarot2

## Índice
- [UX/UI](#uxui)
- [Rendimiento/SSR](#rendimiento-ssr)
- [Backend/API](#backendapi)
- [Editorial & Contenido](#editorial--contenido)
- [I18n](#i18n)
- [Seguridad](#seguridad)
- [Developer Experience](#developer-experience)
- [Observabilidad](#observabilidad)
- [Datos/Modelo](#datosmodelo)
- [Misc / exploratorias](#misc--exploratorias)

## UX/UI
### Idea 1. Toolbars declarativos por entidad
**Descripción:**
Definir un preset de acciones por entidad que `EntityBase` consuma para componer toolbars contextuales.
Permitir configurar botones primarios/secundarios y atajos sin duplicar slots en ManageTableBridge.
Sincronizar iconografía y órdenes con `ViewControls` para una experiencia consistente.
**Motivación:** Mejora la coherencia de acciones y facilita escalar nuevas entidades sin tocar plantillas manualmente.
**Factibilidad técnica:** Alta
**Partes afectadas:** EntityBase, ManageTableBridge, presets de entidad
**Referencias:** @app/components/manage/EntityBase.vue#1-232, @app/components/manage/ManageTableBridge.vue#1-240

### Idea 2. Skeletons adaptativos reutilizables
**Descripción:**
Extraer los placeholders de carga actuales en `EntityTableWrapper` a un componente `SkeletonDataTable` reutilizable.
Soportar variaciones por densidad y vista (tabla, tarjetas) con tokens Tailwind ya presentes.
Integrar el skeleton en `CommonDataTable` para eliminar flashes inconsistentes entre Admin y Manage.
**Motivación:** Reduce duplicación de estados loading y mejora percepción de rendimiento.
**Factibilidad técnica:** Alta
**Partes afectadas:** CommonDataTable, EntityTableWrapper, AdminTableBridge
**Referencias:** @app/components/common/CommonDataTable.vue#1-127, @app/components/manage/EntityTableWrapper.vue#1-100

### Idea 3. Drawer accesible con retorno de foco
**Descripción:**
Implementar `UFocusTrap` y manejo de foco en `EntityInspectorDrawer` para asegurar retorno al disparador tras cerrar.
Agregar encabezados accesibles y relación aria-labelledby según patrón oficial de Nuxt UI.
Documentar el patrón en los presets de bridges para migrar modales legacy.
**Motivación:** Cumple las reglas de accesibilidad y evita pérdida de foco para teclado/lectores.
**Factibilidad técnica:** Alta
**Partes afectadas:** EntityInspectorDrawer, AdminTableBridge, ManageTableBridge
**Referencias:** @app/components/common/EntityInspectorDrawer.vue#1-220, @docs/COMPONENTES.md#40-72

### Idea 4. Plantillas visuales extensibles en ViewControls
**Descripción:**
Permitir que `ViewControls` cargue presets declarativos desde `useManageView`, incluyendo grids específicos por entidad.
Agregar vista "lore" para entidades narrativas que muestre tarjetas con metadata adicional.
Centralizar estilos en `app/assets/css` para evitar overrides locales.
**Motivación:** Mejora la flexibilidad para storytelling y reduce overrides CSS dispersos.
**Factibilidad técnica:** Media
**Partes afectadas:** ViewControls, useManageView, EntityBase
**Referencias:** @app/pages/manage.vue#1-186, @app/composables/manage/useManageView.ts#1-160

## Rendimiento/SSR
### Idea 5. Prefetch inteligente con useEntity
**Descripción:**
Aprovechar `useEntity` para disparar `nuxtApp.hooks('page:finish')` y refrescar datos solo cuando los filtros cambian realmente.
Persistir la última respuesta en `useState` compartido para acelerar tab switching dentro de `/manage`.
Integrar invalidación manual cuando se completa un CRUD exitoso.
**Motivación:** Reduce llamadas redundantes y mantiene coherencia SSR.
**Factibilidad técnica:** Media
**Partes afectadas:** useEntity, useWorldCrud y derivados, ManageEntity
**Referencias:** @app/composables/manage/useEntity.ts#1-200, @app/pages/manage.vue#1-186

### Idea 6. Optimización de imágenes con Nuxt Image
**Descripción:**
Configurar `nuxt.config.ts` para servir imágenes de entidades vía `@nuxt/image` con presets AVIF/WebP.
Actualizar `EntityCard` y `EntitySummary` para usar el componente `<NuxtImg>` y lazy-loading.
Agregar compresión automática al pipeline de uploads.
**Motivación:** Reduce peso de assets en SSR y mejora puntuación LCP.
**Factibilidad técnica:** Media
**Partes afectadas:** EntityCard, EntitySummary, nuxt.config, uploads API
**Referencias:** @app/components/common/EntityCard.vue#1-220, @nuxt.config.ts#1-180

### Idea 7. Helper useServerPagination compartido
**Descripción:**
Crear un composable server-only que envuelva `buildFilters` y `createPaginatedResponse` para endpoints homogéneos.
Inyectar metadatos (`lang`, `search`) directamente en la respuesta para reducir trabajo del frontend.
Documentar contrato en `/docs/SERVER.md` y consumirlo en nuevos `_crud.ts`.
**Motivación:** Disminuye duplicación en API y facilita caching SSR coherente.
**Factibilidad técnica:** Alta
**Partes afectadas:** server/utils/filters, server/utils/response, composables Manage/Admin
**Referencias:** @server/utils/filters.ts#40-158, @server/utils/response.ts#24-95

## Backend/API
### Idea 8. Helper SQL para tags AND/ANY
**Descripción:**
Extraer en `server/utils/tags.ts` la lógica repetida de filtrado AND/ANY usada en world_card, facet y skill.
Permitir elegir semántica desde `buildFilters` mediante una opción documentada.
Añadir pruebas de integración ligeras con Kysely mocks.
**Motivación:** Evita inconsistencias entre entidades y reduce errores cuando se agregan nuevos filtros.
**Factibilidad técnica:** Media
**Partes afectadas:** world_card/_crud, facet/_crud, skill/_crud, buildFilters
**Referencias:** @server/api/world_card/_crud.ts#19-228, @server/api/facet/_crud.ts#19-212, @server/utils/filters.ts#40-158

### Idea 9. Validación estricta en import/export
**Descripción:**
Agregar validadores Zod a `/api/database/import.post.ts` limitando tamaño, estructura y tipos antes de ejecutar SQL.
Emitir métricas sobre filas importadas y rechazar payloads con entidades desconocidas.
Versionar formato export para compatibilidad retro.
**Motivación:** Protege la base de datos y reduce riesgo de corrupciones durante migraciones.
**Factibilidad técnica:** Media
**Partes afectadas:** database import/export endpoints, logging backend
**Referencias:** @server/api/database/import.post.ts#1-180, @server/api/database/export.get.ts#1-140

### Idea 10. Respuestas tipadas con generics en createCrudHandlers
**Descripción:**
Ampliar `createCrudHandlers` para aceptar tipos genéricos que definan `data` y `meta` de la respuesta.
Proveer inferencia automática desde schemas Zod para evitar casting manual en cada `_crud.ts`.
Actualizar plantilla documental en `/docs/SERVER.md`.
**Motivación:** Mejora DX backend y facilita mantenimiento de contratos API.
**Factibilidad técnica:** Media
**Partes afectadas:** createCrudHandlers, `_crud.ts` de entidades, tipos Kysely
**Referencias:** @server/utils/createCrudHandlers.ts#1-240, @docs/SERVER.md#285-335

## Editorial & Contenido
### Idea 11. Tablero editorial con estados kanban
**Descripción:**
Construir un dashboard en `/admin/versions` que agrupe entidades por `card_status` y `release_stage`.
Permitir arrastrar tarjetas entre columnas para disparar `PATCH` controlados.
Sincronizar mensajes audit log por acción.
**Motivación:** Facilita la coordinación editorial y reduce trabajo manual con filtros repetidos.
**Factibilidad técnica:** Media
**Partes afectadas:** VersionList, content_versions API, useContentVersions
**Referencias:** @app/components/admin/VersionList.vue#1-86, @server/api/content_versions/publish.post.ts#1-200

### Idea 12. Asistente Effect System 2.0 en FormModal
**Descripción:**
Agregar un editor guiado para `card_effects` que combine markdown y bloques estructurados.
Validar shape con Zod y ofrecer snippets reutilizables por tipo de efecto.
Mostrar preview en vivo dentro del modal.
**Motivación:** Reduce errores al editar efectos complejos y prepara transición al nuevo sistema.
**Factibilidad técnica:** Media
**Partes afectadas:** FormModal, card_effects schema, entityFieldPresets
**Referencias:** @app/components/manage/modal/FormModal.vue#1-400, @docs/PROJECT_INFO.md#143-148

### Idea 13. Difusión automática de cambios de lore
**Descripción:**
Emitir eventos cuando `world` o `arcana` actualicen `flavor_text`, notificando a equipos de contenido.
Registrar diff en una tabla `content_notifications` para seguimiento.
Integrar resumen en `/admin/revisions` para saber qué se comunicó.
**Motivación:** Mejora coordinación narrativa y evita olvidar actualizaciones en múltiples idiomas.
**Factibilidad técnica:** Baja
**Partes afectadas:** world/arcana `_crud`, content_revisions, nueva tabla notificaciones
**Referencias:** @server/api/world/_crud.ts#19-195, @server/api/arcana/_crud.ts#19-184, @app/components/admin/RevisionsTable.vue#1-320

## I18n
### Idea 14. Radar de cobertura traducible
**Descripción:**
Construir un panel que muestre porcentaje de campos traducidos por entidad y idioma.
Consumir metadatos `markLanguageFallback` para identificar gaps.
Exportar CSV para editors.
**Motivación:** Permite priorizar esfuerzos de traducción y detectar regresiones.
**Factibilidad técnica:** Media
**Partes afectadas:** useEntity, EntityInspectorDrawer, i18n locales
**Referencias:** @server/utils/response.ts#65-95, @i18n/locales/en.json#1-400

### Idea 15. Auto-sugerencias para missing locales
**Descripción:**
Agregar en FormModal un aviso cuando se guarde una entidad sin traducción en idioma activo.
Proponer duplicar contenido EN y marcarlo como pendiente con badges.
Registrar tarea en un backlog interno usando `content_feedback`.
**Motivación:** Reduce contenido parcial y mantiene consistencia multi-idioma.
**Factibilidad técnica:** Media
**Partes afectadas:** FormModal, useEntityCapabilities, content_feedback API
**Referencias:** @app/components/manage/modal/FormModal.vue#1-400, @app/composables/common/useEntityCapabilities.ts#1-158

### Idea 16. Script de reconciliación i18n → presets
**Descripción:**
Crear utilitario que compare claves en `i18n/locales` con campos esperados en `entityFieldPresets`.
Generar reporte en `/informes` para detectar etiquetas faltantes o inconsistentes.
Integrar en script `sort-i18n.mjs` para automatizar.
**Motivación:** Asegura que nuevas entidades tengan traducciones completas en UI.
**Factibilidad técnica:** Alta
**Partes afectadas:** scripts/add-leading-comments, entityFieldPresets, i18n locales
**Referencias:** @scripts/sort-i18n.mjs#1-120, @app/composables/manage/entityFieldPresets.ts#1-120

## Seguridad
### Idea 17. Rate limiting contextual para auth/editorial
**Descripción:**
Aplicar `enforceRateLimit` con buckets diferenciados en login, logout y publish/revert.
Persistir métricas de rechazo en logs Pino para monitoreo.
Documentar valores recomendados en SECURITY.md.
**Motivación:** Reduce riesgo de abuso y se alinea a recomendaciones existentes.
**Factibilidad técnica:** Alta
**Partes afectadas:** auth endpoints, content_versions, middleware rate-limit
**Referencias:** @server/middleware/02.rate-limit.ts#1-140, @server/api/auth/logout.post.ts#1-60, @docs/SECURITY.md#70-118

### Idea 18. Auditoría granular de permisos
**Descripción:**
Registrar en tabla `audit_logs` cada uso de `useEntityCapabilities` sensible (approve, publish).
Incluir user_id, entidad, payload resumido y requestId.
Exponer reporte en Admin.
**Motivación:** Incrementa trazabilidad y facilita investigaciones de seguridad.
**Factibilidad técnica:** Media
**Partes afectadas:** useEntityCapabilities, middleware auth.guard, logging backend
**Referencias:** @server/middleware/01.auth.guard.ts#1-120, @app/composables/common/useEntityCapabilities.ts#1-158

### Idea 19. Rotación de claves JWT automatizada
**Descripción:**
Extender `server/plugins/auth.ts` para admitir múltiples claves activas con expiración.
Agregar script que rota secretos y actualiza configuración en `nuxt.config.ts`.
Notificar a admins cuando se realice la rotación.
**Motivación:** Mejora postura de seguridad y reduce exposición ante filtraciones.
**Factibilidad técnica:** Baja
**Partes afectadas:** auth plugin, nuxt config, deployment pipeline
**Referencias:** @server/plugins/auth.ts#1-210, @nuxt.config.ts#1-180

## Developer Experience
### Idea 20. Generador de entidades CLI
**Descripción:**
Construir comando pnpm que genere esqueletos para nueva entidad (composable CRUD, presets, informes).
Basarse en plantillas existentes para evitar omisiones de reglas.
Actualizar documentación en `/docs/ARCHITECTURE_GUIDE.md`.
**Motivación:** Acelera onboarding y garantiza cumplimiento de invariantes.
**Factibilidad técnica:** Media
**Partes afectadas:** scripts/, composables manage, informes
**Referencias:** @scripts/add-leading-comments.mjs#1-160, @docs/ARCHITECTURE_GUIDE.md#1-200

### Idea 21. Storybook/MDX de componentes críticos
**Descripción:**
Configurar Storybook con MDX para CommonDataTable, bridges y modal FormModal.
Escribir escenarios de capabilities para documentar variantes.
Integrar check de accesibilidad automático.
**Motivación:** Mejora comunicación entre diseño y desarrollo, facilita QA visual.
**Factibilidad técnica:** Media
**Partes afectadas:** CommonDataTable, ManageTableBridge, FormModal
**Referencias:** @app/components/common/CommonDataTable.vue#1-127, @app/components/manage/modal/FormModal.vue#1-400

### Idea 22. Lint rule para importaciones cruzadas
**Descripción:**
Crear regla ESLint que impida importar componentes admin dentro de manage y viceversa.
Usar `eslint.config.mjs` para definir boundaries con `eslint-plugin-boundaries`.
Añadir autofix donde corresponda.
**Motivación:** Refuerza separación arquitectónica y previene deuda inadvertida.
**Factibilidad técnica:** Alta
**Partes afectadas:** eslint config, componentes admin/manage
**Referencias:** @eslint.config.mjs#1-200, @docs/COMPONENTES.md#80-110

## Observabilidad
### Idea 23. Correlación end-to-end con requestId
**Descripción:**
Inyectar `X-Request-Id` en middleware y propagarlo a logs Pino.
Exponerlo en respuestas API para facilitar debugging entre frontend y backend.
Actualizar logger de frontend para imprimirlo en consola dev.
**Motivación:** Simplifica trazabilidad de errores y performance issues.
**Factibilidad técnica:** Media
**Partes afectadas:** server/middleware, server/plugins/logger, useApiFetch
**Referencias:** @server/plugins/logger.ts#1-160, @server/middleware/00.auth.hydrate.ts#1-140

### Idea 24. Métricas editoriales en tiempo real
**Descripción:**
Instrumentar `publish.post.ts` y `revert.post.ts` para emitir métricas a Prometheus/OTLP.
Seguir la cantidad de entidades publicadas, tiempo promedio y errores.
Visualizar en dashboard interno.
**Motivación:** Brinda visibilidad sobre pipelines críticos y detectar cuellos.
**Factibilidad técnica:** Media
**Partes afectadas:** content_versions publish, content_revisions revert, logger
**Referencias:** @server/api/content_versions/publish.post.ts#1-200, @server/api/content_revisions/[id]/revert.post.ts#1-220

### Idea 25. Alertas por errores de traducción
**Descripción:**
Configurar hook en `createPaginatedResponse` para contar resultados con `langFallback`.
Si supera umbral, enviar alerta a Slack webhooks configurables.
Registrar evento en informes.
**Motivación:** Detecta degradación de cobertura i18n sin revisar manualmente.
**Factibilidad técnica:** Media
**Partes afectadas:** response utils, monitoring, i18n equipo
**Referencias:** @server/utils/response.ts#65-95, @docs/PROJECT_INFO.md#124-170

## Datos/Modelo
### Idea 26. Documentación formal de card_effects
**Descripción:**
Crear especificación en `/docs` para JSON de efectos, incluyendo ejemplos y contratos.
Agregar validación Zod compartida entre backend y frontend.
Permitir versionado del schema.
**Motivación:** Reduce ambigüedad y facilita migración a Effect System 2.0.
**Factibilidad técnica:** Media
**Partes afectadas:** docs, card_effects en base_card, FormModal
**Referencias:** @docs/PROJECT_INFO.md#143-148, @server/api/base_card/_crud.ts#19-220

### Idea 27. Indexación adicional en content_feedback
**Descripción:**
Agregar índices compuestos por `status`, `language_code` y `entity_type` según consultas actuales.
Revisar selectividad y actualizar SCHEMA POSTGRES doc.
Generar migración Kysely.
**Motivación:** Acelera filtros frecuentes en FeedbackList y reduce consumo de CPU.
**Factibilidad técnica:** Alta
**Partes afectadas:** database schema, content_feedback queries, FeedbackList
**Referencias:** @docs/SCHEMA POSTGRES..TXT#378-410, @app/components/admin/FeedbackList.vue#1-380

### Idea 28. Sincronización de tag_links huérfanos
**Descripción:**
Crear script que detecte `tag_links` sin entidad activa y ofrezca limpieza.
Registrar reporte y opción de auto-fix en Admin.
Actualizar documentación en informes.
**Motivación:** Mantiene integridad referencial y evita resultados erróneos en Manage.
**Factibilidad técnica:** Media
**Partes afectadas:** tag_links consultas, utils backend, Manage filters
**Referencias:** @server/api/tag/batch.patch.ts#1-180, @server/api/world_card/_crud.ts#19-228

## Misc / exploratorias
### Idea 29. Gamificación del feedback editorial
**Descripción:**
Asignar puntos a usuarios que resuelvan feedback rápidamente y mostrar leaderboard interno.
Utilizar metadata en `content_feedback` para almacenar puntaje.
Publicar resumen semanal en Admin dashboard.
**Motivación:** Incentiva participación de revisores y acelera ciclos de calidad.
**Factibilidad técnica:** Baja
**Partes afectadas:** content_feedback API, Admin dashboard, informes
**Referencias:** @server/api/content_feedback/index.get.ts#28-136, @app/components/admin/FeedbackList.vue#1-380

### Idea 30. Generador de mock de mundos narrativos
**Descripción:**
Crear script que lea efectos y tags para generar mundos ficticios útiles en demos.
Proveer dataset exportable que respete invariantes.
Usar para pruebas de carga UI.
**Motivación:** Facilita presentaciones y pruebas sin tocar datos reales.
**Factibilidad técnica:** Media
**Partes afectadas:** scripts/, world/base_card APIs, export tool
**Referencias:** @server/api/world/_crud.ts#19-195, @server/api/base_card/_crud.ts#19-220

### Idea 31. Laboratorio de presets UI experimentales
**Descripción:**
Montar ruta `/admin/labs` protegida para probar nuevos presets de UI sin afectar producción.
Cargar componentes en modo aislado con datos mock proveídos por composables.
Registrar hallazgos en informes.
**Motivación:** Promueve innovación controlada y evita riesgos sobre vistas core.
**Factibilidad técnica:** Media
**Partes afectadas:** Admin routing, ViewControls, Entity presets
**Referencias:** @app/pages/admin/index.vue#1-140, @app/components/manage/ViewControls.vue#1-180


Idea 32. “Health Check UI” para entidades

Descripción:
Crear una vista en /admin/health que revise automáticamente cada entidad del dominio y detecte:

    traducciones faltantes

    tags huérfanos

    efectos con estructura inválida

    entidades sin content_version_id

    imágenes corruptas o ausentes
    Mostrar un resumen con badges (ok, warning, error) y permitir navegar a la entidad problemática.
    Motivación: Aporta control editorial y previene errores antes de publicar contenido.
    Factibilidad técnica: Alta
    Partes afectadas: composables Manage/Admin, createCrudHandlers, utils i18n
    Referencias: useEntity, markLanguageFallback, _crud.ts

Idea 33. “Smart Diff” para contenido multilenguaje

Descripción:
Un componente basado en JsonModal que muestre diferencias por idioma: EN vs ES vs fallback.
Resalta campos nuevos, eliminados o divergentes, usando colores temáticos Nuxt UI.
Integrar este diff en RevisionsTable y FormModal para dar visibilidad antes de guardar.
Motivación: Evita errores en traducciones y facilita QA editorial.
Factibilidad técnica: Media
Partes afectadas: JsonModal, RevisionsTable, FormModal
Referencias: @app/components/admin/JsonModal.vue
Idea 34. “Predictive Filters” con memoria local

Descripción:
Los filtros más usados (tags, estados, idiomas) se guardan en localStorage con TTL.
ManageEntityFilters propondría automáticamente los más comunes al entrar a una entidad.
Opcional: ranking de filtros usados históricamente.
Motivación: Acelera flujos diarios de editores y reduce clics repetitivos.
Factibilidad técnica: Alta
Partes afectadas: ManageEntityFilters, useQuerySync
Referencias: @app/components/manage/ManageEntityFilters.vue
Idea 35. “Bridge Analytics”: medir uso de tablas

Descripción:
Instrumentar ManageTableBridge y AdminTableBridge para registrar (solo en dev):

    densidad usada

    si el usuario usa más tabla o tarjetas

    número promedio de selección masiva

    columnas más ocultadas/mostradas
    Publicar reporte automático en /informes/analytics-ui.md.
    Motivación: Mejora diseño basado en datos reales internos.
    Factibilidad técnica: Alta
    Partes afectadas: ManageTableBridge, AdminTableBridge
    Referencias: CommonDataTable.vue

Idea 36. Validación automática del esquema POSTGRES.txt

Descripción:
Crear script que compare el archivo docs/SCHEMA POSTGRES..TXT con los tipos reales de server/database/types.ts.

    Detecta divergencias

    Genera un diff navegable

    Señala campos sin documentar o que sobran
    Motivación: asegura que el esquema es la “fuente de verdad” y que Windsurf/MCP trabajan con datos correctos.
    Factibilidad técnica: Alta
    Partes afectadas: tipos Kysely, scripts
    Referencias: server/database/types.ts, docs/SCHEMA POSTGRES..TXT

Idea 37. “UI Stress Mode” para testear rendimiento

Descripción:
Modo experimental en /admin/labs para renderizar:

    tablas con 1k filas mock

    drawers simultáneos

    filtros y previews en ráfagas
    Sirve para validar que los bridges, skeletons e imágenes optimizadas soportan estrés.
    Motivación: Previene regresiones de rendimiento mientras crece el contenido real.
    Factibilidad técnica: Alta
    Partes afectadas: Admin labs, CommonDataTable, bridges
    Referencias: ViewControls, AdminTableBridge

Idea 38. “Hardened Save Mode” para FormModal

Descripción:
Un modo opcional donde FormModal requiere confirmación adicional cuando:

    se borra traducción por accidente

    se cambia content_version_id

    se modifica status → published
    Permite interceptar guardados peligrosos y mostrar advertencias contextualizadas.
    Motivación: Reduce errores críticos en contenido editorial.
    Factibilidad técnica: Media
    Partes afectadas: FormModal, entity presets
    Referencias: FormModal.vue, useEntityCapabilities

Idea 39. Sincronización bidireccional Admin ↔ Manage

Descripción:
Cuando un admin apruebe una revisión o versión, enviar un “hint” a Manage para refrescar automáticamente la entidad en vista si está abierta.
Basado en eventos nuxtApp.hooks('tarot:entity-updated') + invalidación de cache.
Motivación: Evita trabajar con datos stale en Manage mientras se realizan aprobaciones en Admin.
Factibilidad técnica: Media
Partes afectadas: useEntity, useRevisions, useContentVersions
Referencias: useEntity, Admin editorial modules