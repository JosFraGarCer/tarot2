# Sugerencias priorizadas

Listado de 26 iniciativas concretas para optimizar y escalar Tarot2. Cada punto indica beneficio y referencia técnica.

1. **Implementar middleware `02.rate-limit`** para login, logout, publish y revert, usando Redis/PG como store y cabeceras `Retry-After`. _Beneficio_: mitiga abusos y cumple requisitos SECURITY. _Referencia_: @docs/PROJECT_INFO.md#132-170
2. **Corregir `POST /api/auth/logout`** limpiando la cookie `auth_token` con `setCookie(name, '', { maxAge: 0 })`. _Beneficio_: cierra sesiones de forma segura. _Referencia_: @docs/PROJECT_INFO.md#132-170
3. **Migrar tablas Admin/Manage a `CommonDataTable`** con soporte de capacidades y densidades. _Beneficio_: UX coherente y menos duplicación. _Referencia_: @app/components/common/CommonDataTable.vue#110-320
4. **Extraer `useTableSelection`** para gestionar selección, toggle y bulk actions en feedback, revisiones y tablas manage. _Beneficio_: reduce código duplicado y errores de selección. _Referencia_: @app/components/manage/EntityTableWrapper.vue#116-312
5. **Proveer `BulkActionsBar` sticky** con contadores y botones masivos (resolver, aprobar, publicar). _Beneficio_: mantiene acciones visibles en datasets largos. _Referencia_: @app/components/admin/RevisionsTable.vue#12-64
6. **Unificar badges de estado** en `StatusBadge` que soporte estados, release y traducción. _Beneficio_: estilos consistentes y fácil mantenimiento. _Referencia_: @app/components/common/CommonDataTable.vue#114-118
7. **Adoptar `useEntityCapabilities` en EntityBase y composables** para reemplazar props `translatable`, `noTags`, etc. _Beneficio_: configuración declarativa según entidad. _Referencia_: @app/composables/common/useEntityCapabilities.ts#1-158
8. **Crear helper `useServerPagination`** que envuelva `buildFilters` y normalice `meta` en handlers comunes. _Beneficio_: menos boilerplate en rutas H3. _Referencia_: @docs/SERVER.md#95-137
9. **Extender `AdvancedFiltersPanel`** con campo `date-range` basado en `UDatePicker` y serialización ISO. _Beneficio_: filtros avanzados uniformes. _Referencia_: @app/components/common/AdvancedFiltersPanel.vue#12-332
10. **Centralizar previews en `EntityInspectorDrawer`** (USlideover) usando `useEntityPreviewFetch`. _Beneficio_: UX consistente y elimina endpoints inexistentes. _Referencia_: @docs/INFORME-admin.md#112-214
11. **Introducir `useRequestMetrics`** para capturar `timeMs` de logs/respuestas y exponerlos en UI. _Beneficio_: visibilidad de performance. _Referencia_: @server/api/content_feedback/index.get.ts#95-137
12. **Monitorear ratio 304/200** desde `useApiFetch` agregando contadores en logger. _Beneficio_: valida efectividad de caché ETag. _Referencia_: @docs/PROJECT_INFO.md#124-170
13. **Crear presets de formulario por entidad** (`useEntityFormPreset`) alimentados por esquemas Zod. _Beneficio_: formularios homogéneos y menos lógica manual. _Referencia_: @app/composables/manage/useEntity.ts#33-82
14. **Alinear pruebas E2E (Playwright)** para flujos publish/revert, feedback multi-idioma y SSR inicial. _Beneficio_: reduce regresiones en pipelines críticos. _Referencia_: @docs/INFORME-admin.md#126-156
15. **Agregar lint/import rules** para evitar dependencias cruzadas Admin↔Manage salvo `common`. _Beneficio_: mantiene separación de responsabilidades. _Referencia_: @docs/PROJECT_INFO.md#110-120
16. **Extender logging Pino** con `entity_type`, `lang`, `tag_filters` y `requestId`. _Beneficio_: facilita depuración y trazabilidad. _Referencia_: @docs/SERVER.md#136-140
17. **Normalizar uso de `useApiFetch`** en todas las páginas admin, reemplazando `$fetch`. _Beneficio_: cache uniforme y headers consistentes. _Referencia_: @docs/INFORME-admin.md#96-100
18. **Crear skeletons reutilizables** para tablas/listas (loading states) en `components/common`. _Beneficio_: UX coherente y menos duplicación. _Referencia_: @app/components/manage/EntityTableWrapper.vue#35-39
19. **Documentar alias `/api/user` vs `/api/users`** y, de ser necesario, exponer alias temporal. _Beneficio_: evita confusiones en integraciones externas. _Referencia_: @docs/SERVER.md#155-157
20. **Automatizar métricas de release** (revisiones publicadas, tiempo de aprobación) almacenando summary en `content_versions`. _Beneficio_: seguimiento editorial. _Referencia_: @docs/PROJECT_INFO.md#136-170
21. **Implementar validación semántica de tags AND** unificando helper SQL y actualizando docs. _Beneficio_: comportamiento consistente en filtros. _Referencia_: @docs/API.MD#22-27
22. **Añadir accesibilidad a modales** (`aria-describedby`, focus trap, mensajes `aria-live`). _Beneficio_: cumplimiento WCAG y mejor UX. _Referencia_: @app/components/admin/VersionModal.vue#3-41
23. **Configurar telemetría ligera (OpenTelemetry/OTLP)** para instrumentar tiempo de handlers críticos. _Beneficio_: observabilidad en producción. _Referencia_: @docs/SERVER.md#136-140
24. **Integrar Effect System 2.0 en formularios** preparando campos semánticos y toggles legacy. _Beneficio_: transición ordenada desde efectos markdown. _Referencia_: @docs/PROJECT_INFO.md#143-148
25. **Crear dashboard de cobertura i18n** que reporte campos traducidos vs EN por entidad. _Beneficio_: prioriza esfuerzos de traducción. _Referencia_: @docs/PROJECT_INFO.md#14-41
26. **Publicar guía interna de componentes** (Storybook/MDX) para `EntityBase`, `AdvancedFiltersPanel`, `CommonDataTable`. _Beneficio_: onboarding rápido y diseño consistente. _Referencia_: @app/components/manage/EntityBase.vue#22-232
