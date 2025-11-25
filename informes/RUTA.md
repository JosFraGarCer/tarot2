# Hoja de ruta Tarot2

## Fase 0 · Endurecer cimientos
| Cambios | Motivación | Mejoras esperadas | Pruebas con `pnpm dev` |
| --- | --- | --- | --- |
| Aplicar middleware `02.rate-limit` en login/logout/publish/revert y limpiar cookie en `POST /api/auth/logout`. | Fortalecer seguridad y cumplimiento de las recomendaciones de SECURITY. | Disminución de abuso de endpoints sensibles y cierre correcto de sesiones. | Levantar `pnpm dev`, ejecutar flujo de login/logout múltiple verificando cabeceras `Retry-After` y que la cookie desaparece en DevTools. |
| Sustituir `$fetch` restantes por `useApiFetch` en vistas admin. | Garantizar coherencia SSR/ETag y reutilizar políticas de reintento. | Mayor ratio de respuestas 304 y coherencia entre render SSR y navegación cliente. | Con `pnpm dev`, navegar `/admin/versions` y `/admin/feedback` comprobando en Network que se usa `If-None-Match` y se reciben 304 tras el primer request. |
| Extraer `useTableSelection` y reutilizarlo en `EntityTableWrapper`, `RevisionsTable`, `FeedbackList`. | Reducir duplicación de estado de selección y prevenir inconsistencias en acciones masivas. | Selección estable, menor superficie de bugs y código más mantenible. | Desde `pnpm dev`, probar selección/bulk actions en `/manage` y `/admin/revisions` asegurando que los checkboxes sincronizan selección global. |
| Revisar accesibilidad básica en modales (focus trap, labels, mensajes). | Cumplir WCAG AA y mejorar UX de administración. | Navegación por teclado consistente y feedback audible/visible. | Con `pnpm dev`, abrir `VersionModal` y `FeedbackNotesModal`, verificando focus inicial y lectura de mensajes mediante inspección de accesibilidad. |

## Fase 1 · Convergencia UI
| Cambios | Motivación | Mejoras esperadas | Pruebas con `pnpm dev` |
| --- | --- | --- | --- |
| Integrar `useEntityCapabilities` como proveedor único en Manage/Admin. | Declarar capacidades por entidad sin props ad-hoc. | Configuración centralizada, menos lógica condicional en componentes. | Ejecutar `pnpm dev`, cambiar entre entidades en `/manage` y `/admin/users`, validando que la UI responde a capacidades (tags, traducciones, preview). |
| Migrar tablas Admin/Manage a `CommonDataTable` + nueva `BulkActionsBar`. | Unificar UI de listados y acciones masivas. | Experiencia homogénea, mantenimiento reducido, soporte de densidades. | Con `pnpm dev`, abrir `/admin/feedback` y `/manage`, probando densidades, selección y bulk actions. |
| Crear `EntityInspectorDrawer` para previews + enlazar `useEntityPreviewFetch`. | Evitar modales inconsistentes y endpoints inexistentes. | Previews consistentes, navegación rápida entre entidades. | Desde `pnpm dev`, disparar preview en feedback y manage verificando apertura del drawer y datos correctos. |
| Unificar badges (`StatusBadge`, `ReleaseStageChip`, traducción) y presets de formularios. | Mantener estética/semántica consistente y reducir branching en formularios. | Identidad visual unificada y formularios configurables por entidad. | Con `pnpm dev`, revisar `VersionModal`, `EntityCards`, `EntityTable` comprobando badges/labels y guardado sin errores. |

## Fase 2 · Observabilidad y releases
| Cambios | Motivación | Mejoras esperadas | Pruebas con `pnpm dev` |
| --- | --- | --- | --- |
| Registrar métricas de publicación (revisiones aprobadas, tiempo medio) en `content_versions`. | Ofrecer visibilidad editorial sobre releases. | Datos para analizar productividad y calidad de releases. | En `pnpm dev`, simular publicación desde `/admin/versions`, revisar logs/DB para ver metricas registradas. |
| Expandir logging Pino con `entity_type`, `lang`, `tag_filters`, `requestId` y exponer métricas (`useRequestMetrics`). | Correlacionar peticiones front-back y detectar cuellos. | Observabilidad fina, soporte futuro para dashboards. | Con `pnpm dev`, revisar consola/logs tras filtrar en `/admin/feedback`, asegurando campos adicionales y telemetría en UI. |
| Configurar telemetría ligera (OpenTelemetry/OTLP o equivalente). | Preparar monitorización continua de handlers críticos. | Alerta temprana ante degradaciones en SSR/API. | Arrancar `pnpm dev`, validar que spans se registran (con colector local) y no afectan latencia visible. |
| Añadir toggles UI basados en `content_versions.release`. | Controlar la exposición de contenido según etapa. | Deploys editoriales controlados, habilitando staging dentro de la app. | En `pnpm dev`, cambiar release de una versión y confirmar que la UI refleja el estado en listados y permisos. |

## Fase 3 · Expansión narrativa y evolutiva
| Cambios | Motivación | Mejoras esperadas | Pruebas con `pnpm dev` |
| --- | --- | --- | --- |
| Integrar Effect System 2.0 en formularios (campos semánticos + toggles legacy). | Adoptar el nuevo sistema sin perder compatibilidad. | Capacidades avanzadas de edición de efectos y transición gradual desde Markdown. | Con `pnpm dev`, editar cartas en `/manage` verificando alternancia legacy/semántico y guardado correcto. |
| Preparar mundos/mazos avanzados (nuevos tipos de carta, metadata extendida). | Escalar el sistema a nuevas ambientaciones. | Mayor riqueza de contenido y personalización. | Desde `pnpm dev`, crear/editar mundos y mazos, comprobando nuevos campos y su visualización. |
| Crear dashboard de cobertura i18n y guías internas (Storybook/MDX). | Dirigir esfuerzos de traducción y acelerar onboarding. | Transparencia de localización y consistencia en componentes. | Ejecutar `pnpm dev` + documentación (Storybook si aplica) revisando historias de `EntityBase`, `AdvancedFiltersPanel`, `CommonDataTable`. |

