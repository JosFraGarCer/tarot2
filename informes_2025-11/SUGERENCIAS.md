# Sugerencias priorizadas Tarot2

## Índice
1. [Resumen](#1-resumen)
2. [Fase 0 · Cimientos](#2-fase-0--cimientos)
3. [Fase 1 · Convergencia UI](#3-fase-1--convergencia-ui)
4. [Fase 2 · Observabilidad](#4-fase-2--observabilidad)
5. [Fase 3 · Expansión narrativa](#5-fase-3--expansión-narrativa)
6. [Iniciativas continuas](#6-iniciativas-continuas)
7. [Áreas de riesgo](#7-áreas-de-riesgo)
8. [Buenas prácticas recomendadas](#8-buenas-prácticas-recomendadas)

## 1. Resumen
Backlog accionable priorizado por fases. Todas las sugerencias referencian código real y se apegan a las reglas de edición para Windsurf.

## 2. Fase 0 · Cimientos
| Acción | Beneficio | Referencia |
| --- | --- | --- |
| Aplicar `02.rate-limit` en login/logout/publish/revert. | Bloquea abuso de endpoints sensibles. | @server/middleware/02.rate-limit.ts#1-140 |
| Limpiar cookie `auth_token` en `POST /api/auth/logout`. | Cierra sesiones de forma segura. | @server/api/auth/logout.post.ts#1-60 |
| Reemplazar `$fetch` restante por `useApiFetch`. | Coherencia SSR + ETag. | @docs/PROJECT_INFO.md#124-170 |
| Extraer `useTableSelection` compartido. | Bulk actions consistentes. | @app/components/manage/EntityTableWrapper.vue#1-107 |
| Auditoría de accesibilidad (focus trap, `aria-*`). | Cumplimiento WCAG AA. | @app/components/admin/VersionModal.vue#1-80 |

## 3. Fase 1 · Convergencia UI
| Acción | Beneficio | Referencia |
| --- | --- | --- |
| Migrar tablas a `ManageTableBridge`/`AdminTableBridge` + `CommonDataTable`. | UI homogénea, menos deuda. | @app/components/manage/ManageTableBridge.vue#1-240 |
| Implementar `BulkActionsBar` sticky compartida. | Acciones visibles en datasets largos. | @app/components/admin/RevisionsTable.vue#12-120 |
| Consolidar previews en `EntityInspectorDrawer` + `useEntityPreviewFetch`. | UX consistente y accesible. | @app/components/common/EntityInspectorDrawer.vue#1-220 |
| Expandir `StatusBadge` a Admin (reemplazo chips legacy). | Semántica unificada. | @app/components/common/StatusBadge.vue#1-120 |
| Adoptar `useEntityCapabilities` como provider global. | Configuración declarativa. | @app/composables/common/useEntityCapabilities.ts#1-158 |

## 4. Fase 2 · Observabilidad
| Acción | Beneficio | Referencia |
| --- | --- | --- |
| Crear `useRequestMetrics` y ampliar logging (`entity_type`, `lang`, `tag_filters`, `requestId`). | Telemetría ligera end-to-end. | @server/api/content_feedback/index.get.ts#95-136 |
| Monitorear ratio 304/200 en logs/dashboards. | Validar efectividad de caché. | @docs/PROJECT_INFO.md#124-170 |
| Registrar métricas publish/revert en `content_versions`. | Seguimiento editorial. | @docs/SCHEMA POSTGRES..TXT#417-437 |
| Configurar telemetría OTLP ligera para endpoints críticos. | Alertas tempranas en producción. | @docs/SERVER.md#136-140 |

## 5. Fase 3 · Expansión narrativa
| Acción | Beneficio | Referencia |
| --- | --- | --- |
| Integrar Effect System 2.0 en formularios con toggles legacy. | Evolución controlada de efectos. | @docs/PROJECT_INFO.md#143-148 |
| Extender mundos/mazos con metadata adicional. | Nuevos contenidos alineados a schema. | @server/api/world_card/_crud.ts#19-228 |
| Crear dashboard de cobertura i18n + guías internas (Storybook/MDX). | Prioriza traducción y onboarding. | @docs/PROJECT_INFO.md#14-41 |

## 6. Iniciativas continuas
| Acción | Beneficio | Referencia |
| --- | --- | --- |
| Implementar `useServerPagination` y helper SQL para tags AND/ANY. | Reduce duplicación backend. | @server/utils/filters.ts#40-158 |
| Documentar alias `/api/user` vs `/api/users`. | Evita confusiones en integraciones. | @docs/SERVER.md#155-157 |
| Mantener lint/import rules para aislar Admin vs Manage. | Respeta arquitectura. | @docs/PROJECT_INFO.md#110-120 |
| Extraer skeletons reutilizables para tablas/listas. | UX consistente en loading. | @app/components/manage/EntityTableWrapper.vue#35-90 |
| Publicar guía interna de componentes y presets. | Facilita onboarding y coherencia. | @app/components/manage/EntityBase.vue#22-232 |

## 7. Áreas de riesgo
1. Cambios en SQL compleja (`_crud.ts`) deben acompañarse de pruebas multi-idioma y validación de tags.
2. Ventana de abuso mientras rate limiting y logout seguro no se completan.
3. Migraciones parciales a bridges o presets pueden dejar UI inconsistente; documentar estado y checklist QA.

## 8. Buenas prácticas recomendadas
1. Ejecutar checklist manual previa a cada merge (CRUD, bulk, preview, filtros, paginación, consola).
2. Registrar excepciones temporales en `/informes` y reglas de edición para evitar regresiones.
3. Coordinar refactors backend/frontend usando codemaps y `docs/SCHEMA POSTGRES..TXT` como fuente de verdad.
