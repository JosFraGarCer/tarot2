# Fase 2 – Backend / Server

## Resumen ejecutivo
- Consolidación de CRUDs editoriales mediante generadores centralizados (`createCrudHandlers`) y esquemas consistentes.
- Refactor de helpers de entidades traducibles para garantizar consistencia multilenguaje y auditoría automática.
- Implementación de endpoints editoriales críticos: publicar versiones de contenido y revertir revisiones con permisos declarativos.
- Fortalecimiento de autenticación con logout auditado y limitación de peticiones.
- Introducción de rate limiting global y específico para rutas sensibles, asegurando resiliencia ante abusos.

## Migraciones CRUD completadas
- Arcana (`server/api/arcana/_crud.ts` y handlers delegados)
- Base cards (`server/api/base_card/_crud.ts`)
- Card types (`server/api/card_type/_crud.ts`)
- Facets (`server/api/facet/_crud.ts`)
- Skills (`server/api/skill/_crud.ts`)
- Worlds (`server/api/world/_crud.ts`)
- World cards (`server/api/world_card/_crud.ts`)
- Tags (refactor a pipeline normalizado con helpers compartidos)

## Cambios en helpers clave
- `translatableUpsert`: soporte robusto para inserciones/actualizaciones multilenguaje con control de campos protegidos.
- `deleteLocalizedEntity`: limpieza coordinada de traducciones con logging y auditoría.
- `parseQuery`: normalización de filtros, paginación y búsqueda con Zod y metadatos consistentes.
- `entityTransferService` y helpers asociados: import/export/batch homogenizados para todas las entidades editoriales.
- `createCrudHandlers`: factor común para generar handlers CRUD con permisos, logging y respuestas normalizadas.

## Implementación publish/revert
- `POST /api/content_versions/publish`: validación Zod, permisos declarativos (`canPublish`), transacción Kysely, auditoría detallada y rate limiting.
- `POST /api/content_revisions/:id/revert`: validación de params/body, permisos compuestos (`canRevert`/`canPublish`/`canReview`), restauración transaccional de snapshots, nueva revisión auditada y rate limiting.

## Logout con auditoría
- Limpieza segura de cookie `auth_token` con flags (`httpOnly`, `sameSite`, `secure`, `maxAge: 0`).
- Logs de inicio/fin con `scope: 'auth.logout.*'`, `user_id`, `requestId` y `timeMs`.
- Respuesta normalizada vía `createResponse`.

## Rate limiting
- Utilidad `enforceRateLimit` (`server/utils/rateLimit.ts`): bucket por IP+usuario, logging estructurado, error 429 normalizado. 
- Aplicación directa (fallback) en handlers sensibles: login, logout, publish, revert.
- Middleware global `02.rate-limit.ts`: límites suaves (300 req/5min) + estrictos (10 req/min) para rutas sensibles, logging centralizado.

## Archivos principales modificados/agregados
- `server/api/**`: CRUD delegados, publish/revert, login/logout, pipelines de tags.
- `server/middleware/00.auth.hydrate.ts`, `01.auth.guard.ts`, **nuevo** `02.rate-limit.ts`.
- `server/utils/**`: `rateLimit.ts`, `parseQuery.ts`, `entityTransferService.ts`, `translatableUpsert.ts`, `deleteLocalizedEntity.ts`, `createCrudHandlers.ts`.
- `server/schemas/**`: normalización de esquemas para entidades, versiones y revisiones.
- `informes/FASE2.md` (este documento).

## Riesgos y mitigaciones
1. **Memoria del rate limiter en instancias múltiples**: El bucket en memoria es por proceso; se recomienda migrar a storage compartido (Redis) en Fase 3.
2. **Cobertura de pruebas para generadores CRUD**: Añadir suites específicas que verifiquen permisos y auditoría.
3. **Consistencia de traducciones**: Reforzar validaciones en import/export para evitar campos huérfanos.

## Recomendaciones para Fase 3
- Implementar rate limiting distribuido y métricas/alertas.
- Añadir pruebas end-to-end para pipelines editoriales y CRUD generados.
- Extender auditoría a operaciones de publicación con metadatos adicionales (e.g., diff de campos).
- Preparar endpoints de publicación para internacionalización avanzada (batch publish por idioma).

