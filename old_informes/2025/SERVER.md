# Server – Plan de optimización

## Estructura óptima

1. **Arbolado modular por dominio con utilidades comunes**  
   - **Descripción:** Consolidar `/server/api/<entidad>` manteniendo handlers livianos y moviendo lógica repetida a `server/utils` (filtros, tags, i18n, seguridad contextual).  
   - **Objetivo:** Simplificar la navegación del repositorio y reforzar la separación de responsabilidades dominio/utilidades.  
   - **Beneficios:** Refactors predecibles, incorporación de nuevas entidades más rápida y reducción de líneas duplicadas.  
   - **Referencia:** @docs/SERVER.md#20-112

2. **Capas de plugin explícitas**  
   - **Descripción:** Mantener `db`, `logger` y `auth` como plugins inicializados en Nitro, documentando su inicialización y dependencia en un README interno.  
   - **Objetivo:** Evitar inicializaciones circulares y facilitar pruebas unitarias mockeando estos servicios.  
   - **Beneficios:** Mayor testabilidad, load order claro y soporte para ejecución serverless.  
   - **Referencia:** @docs/SERVER.md#7-18

## Refactor de CRUD repetido

1. **Generar helpers `createCrudHandlers`**  
   - **Descripción:** Construir un generador que reciba tabla base, traducciones y metadatos para devolver `index/list`, `get`, `create`, `update`, `delete`, reutilizando `entityCrudHelpers` y `buildFilters`.  
   - **Objetivo:** Eliminar repetición en entidades similares (world, arcana, facet, base_card).  
   - **Beneficios:** Ciclo de desarrollo más rápido y menor riesgo de divergencias en validaciones o logs.  
   - **Referencia:** @docs/API.MD#334-673

2. **Zod schemas compartidos por dominio**  
   - **Descripción:** Extraer validaciones de queries/cuerpos a `server/schemas/<entidad>.ts` para consumo por generador CRUD.  
   - **Objetivo:** Centralizar reglas de negocio y habilitar reuso en pruebas contractuales.  
   - **Beneficios:** Menos bugs por validaciones omitidas y documentación autogenerable.  
   - **Referencia:** @docs/SERVER.md#573-588

## Patrones para handlers

1. **Pipeline estándar**  
   - **Descripción:** Aplicar secuencia `auth -> parse query -> lang -> filtros -> payload` con early returns, incorporando logs con contexto.  
   - **Objetivo:** Hacer handlers predecibles y fáciles de leer.  
   - **Beneficios:** Depuración acelerada y tiempos de desarrollo reducidos.  
   - **Referencia:** @docs/SERVER.md#307-332

2. **Middleware por capacidad**  
   - **Descripción:** Extender `01.auth.guard` para aceptar capacidades (ej. `requiresPermission('canManageUsers')`) en metadatos de ruta.  
   - **Objetivo:** Alinear la autorización de forma declarativa en cada handler.  
   - **Beneficios:** Seguridad reforzada y menor duplicación en checks manuales.  
   - **Referencia:** @docs/API.MD#31-42

## Limpieza de rutas

1. **Unificar convenciones singulares**  
   - **Descripción:** Mantener `/api/user/*` como estándar e introducir alias opcional `/api/users` con redirección/documentación clara hasta migrar clientes.  
   - **Objetivo:** Evitar confusiones entre singular/plural y reducir incidencias de documentación.  
   - **Beneficios:** Soporte más simple y menor carga cognitiva para nuevos devs.  
   - **Referencia:** @docs/PROJECT_INFO.md#154-164

2. **Endpoints de publicación claramente versionados**  
   - **Descripción:** Completar `POST /api/content_versions/publish` y `/api/content_revisions/:id/revert` usando patrones existentes de helpers y autorización.  
   - **Objetivo:** Cerrar discrepancias entre UI/documentación y API.  
   - **Beneficios:** Flujo editorial completo y disminución de errores manuales.  
   - **Referencia:** @docs/PROJECT_INFO.md#161-168

## Optimización de queries Kysely

1. **Subconsultas para tags reutilizables**  
   - **Descripción:** Extraer la subquery JSON de tags a helper `selectTagsAggregation({ entityType, alias, lang })` para aplicar en list/detalle.  
   - **Objetivo:** Evitar copiar SQL y asegurar semántica AND consistente.  
   - **Beneficios:** Mantenibilidad elevada y performance estable al permitir tuning centralizado.  
   - **Referencia:** @docs/SERVER.md#318-340

2. **Indices y hints explícitos**  
   - **Descripción:** Validar que los índices definidos (ej. `idx_content_feedback_entity_status`) se utilicen y añadir `explainAnalyze` durante tuning; documentar recomendaciones en migraciones.  
   - **Objetivo:** Mantener tiempos de respuesta bajos al crecer el dataset.  
   - **Beneficios:** Latencia estable y previsibilidad bajo carga.  
   - **Referencia:** @docs/SCHEMA POSTGRES..TXT#384-408

3. **Caching fino con ETag/If-None-Match**  
   - **Descripción:** Propagar cabeceras ETag desde handlers list/detalle aprovechando `createPaginatedResponse`, combinando `hash({ items, meta })`.  
   - **Objetivo:** Reducir consumo de CPU/DB en consultas repetitivas.  
   - **Beneficios:** Mejor TTFB e integración óptima con SSR y `useApiFetch`.  
   - **Referencia:** @docs/PROJECT_INFO.md#126-165

## Seguridad y autenticación

1. **Logout efectivo**  
   - **Descripción:** Actualizar `POST /api/auth/logout` para limpiar cookie (`setCookie('auth_token', '', { maxAge: 0, ... })`) y registrar evento.  
   - **Objetivo:** Evitar sesiones persistentes tras logout.  
   - **Beneficios:** Cumplimiento de buenas prácticas y reducción de riesgo de secuestro de sesión.  
   - **Referencia:** @docs/PROJECT_INFO.md#131-135

2. **Rate limiting y auditoría**  
   - **Descripción:** Incorporar middleware de `event.context.logger` para registrar intentos fallidos y añadir rate limiting básico (ej. `h3-rate-limit`) a rutas sensibles.  
   - **Objetivo:** Mitigar ataques de fuerza bruta y abusos de API.  
   - **Beneficios:** Seguridad fortalecida y cumplimiento de requisitos de producción.  
   - **Referencia:** @docs/PROJECT_INFO.md#168-170

3. **Permisos derivados en contexto**  
   - **Descripción:** Extender `event.context.user` con `scopes` calculados (p.ej. `canPublish`, `canTranslate`) para consumo directo en handlers.  
   - **Objetivo:** Simplificar autorizaciones y reflejar cambios de roles en caliente.  
   - **Beneficios:** Lógica menos duplicada y menor riesgo de desincronización con frontend.  
   - **Referencia:** @docs/API.MD#31-118

## i18n back-end consistente

1. **Fallback explícito en responses**  
   - **Descripción:** Añadir campo `isFallback: boolean` junto a `language_code_resolved` para informar a la UI cuando usa traducción EN.  
   - **Objetivo:** Permitir a UI marcar contenidos sin traducción local.  
   - **Beneficios:** Mejor workflow de traducción y priorización de pendientes.  
   - **Referencia:** @docs/SERVER.md#315-332

2. **Operaciones CRUD multilenguaje transaccionales**  
   - **Descripción:** En create/update, envolver inserciones de base + traducción en transacción Kysely (`db.transaction().execute(...)`).  
   - **Objetivo:** Prevenir estados intermedios sin traducción inicial.  
   - **Beneficios:** Integridad de datos y rollback confiable ante errores.  
   - **Referencia:** @docs/API.MD#205-227

3. **Helpers para eliminación condicionada por idioma**  
   - **Descripción:** Generalizar lógica de borrado (si `lang==='en'` eliminar entidad; de lo contrario solo traducción) en helper `deleteLocalizedEntity`.  
   - **Objetivo:** Evitar errores cuando se añadan nuevas entidades traducibles.  
   - **Beneficios:** Comportamiento uniforme y menor duplicación.  
   - **Referencia:** @docs/PROJECT_INFO.md#18-21

## Uso de helpers transversales

1. **Respuesta unificada para import/export**  
   - **Descripción:** Encapsular `exportEntities` y `importEntities` en servicio `entityTransferService` con logging y validación previa.  
   - **Objetivo:** Normalizar la experiencia de import/export y preparar métricas.  
   - **Beneficios:** Observabilidad mejorada y facilidad para extender a nuevas tablas.  
   - **Referencia:** @docs/API.MD#223-312

2. **Validador de queries reusable**  
   - **Descripción:** Crear helper `parseQuery(event, schema)` que centralice lectura de query, validación Zod y logs de parámetros.  
   - **Objetivo:** Reducir boilerplate y asegurar logs consistentes.  
   - **Beneficios:** Código más limpio y auditoría fiable de filtros usados.  
   - **Referencia:** @docs/SERVER.md#506-549
