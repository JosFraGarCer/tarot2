# Mejoras propuestas para el backend (/server)

Lista priorizada de oportunidades de mejora, con pros y contras. Se centra en Nuxt 4 + H3 + Kysely + PostgreSQL y en los módulos actuales (auth, user, role, tag, world, world_card, arcana, base_card, card_type, skill, facet, uploads, database).

## Autenticación y sesiones

- **Logout real (limpiar cookie y sesión)**
  - Descripción: que `POST /api/auth/logout` borre `auth_token` con `setCookie(..., '', { maxAge: 0, ... })` y devuelva `{ success: true }`.
  - Pros: comportamiento estándar, evita confusiones, reduce riesgo de sesiones persistentes.
  - Contras: rompe clientes que hoy esperan un perfil en la respuesta de logout.

- **Tokens de corta duración + refresh tokens**
  - Descripción: emitir access tokens cortos (15–30 min) y refresh tokens de mayor duración, con rotación.
  - Pros: seguridad fuerte, revocación granular, menor ventana de ataque.
  - Contras: mayor complejidad (endpoints de refresh, storage/blacklist de refresh tokens, más lógica en frontend).

- **Unificar origen del token**
  - Descripción: `getUserFromEvent` acepta `Authorization` y cookies `auth_token` (y `token`). Reducir a un solo nombre (`auth_token`).
  - Pros: simplifica, reduce vectores de error.
  - Contras: cambios en clientes antiguos si usan otra cookie.

## Seguridad

- **Rate limiting y protección por IP/usuario**
  - Pros: mitiga abuso/DoS, sobre todo en login, import/export y uploads.
  - Contras: requiere almacenamiento (in-memory/Redis) y tuning.

- **Cabeceras de seguridad**
  - Descripción: añadir `helmet` equivalente (Nitro: route rules, security headers) y CSP ajustada.
  - Pros: defensa adicional (XSS/Clickjacking/MI TM).
  - Contras: ajustes finos de CSP pueden romper recursos si no se revisan.

- **CSRF en cambios de estado**
  - Descripción: si cookie httpOnly + sameSite no es suficiente para el contexto, añadir token CSRF para POST/PATCH/DELETE.
  - Pros: defensa adicional frente a CSRF.
  - Contras: más lógica de intercambio de tokens.

## Permisos (RBAC)

- **Scopes/granularidad por módulo**
  - Descripción: definir permisos específicos por entidad/acción (p.ej. `world_read`, `world_update`, `tag_manage`).
  - Pros: control fino, auditoría clara.
  - Contras: más mantenimiento y mapeos UI.

- **Guardas por ruta**
  - Descripción: mover reglas de acceso sensibles directamente a handlers o un middleware por prefijo (además de `01.auth.guard.ts`).
  - Pros: menor acoplamiento al cliente y menos sorpresas.
  - Contras: duplicación si no se abstrae.

## Consistencia de API

- **Uso exclusivo de PATCH para updates**
  - Descripción: ya aplicado en el código; documentar la guía de diseño y mantener consistencia en nuevos módulos.
  - Pros: semántica REST correcta para actualizaciones parciales.
  - Contras: ninguno relevante.

- **Envoltorio de respuesta uniforme**
  - Descripción: mantener `{ success, data, meta }` en todos los endpoints, incluidos errores tipificados.
  - Pros: DX consistente, fácil de consumir en frontend.
  - Contras: ligero overhead de envoltura.

## Validación y errores

- **Mapeo de errores Zod a códigos semánticos**
  - Descripción: normalizar mensajes (i18n opcional) y `statusCode` por tipo de fallo.
  - Pros: diagnósticos claros, UI puede reaccionar mejor.
  - Contras: trabajo de catalogación.

- **Catálogo de códigos de error**
  - Descripción: documentar códigos/causas (p.ej., `E_TAG_DUPLICATE`, `E_USER_INACTIVE`).
  - Pros: soporte y depuración más rápidos.
  - Contras: mantenimiento del catálogo.

## Rendimiento y SQL

- **Índices recomendados**
  - Descripción: revisar y añadir índices para campos usados en filtros/ordenaciones: `created_at`, `modified_at`, `status`, `is_active`, `created_by`, y claves externas (p.ej., `facet.arcana_id`, `base_card.card_type_id`).
  - Pros: respuestas más rápidas en listados grandes.
  - Contras: coste de escritura y espacio.

- **Índices para búsquedas por nombre traducido**
  - Descripción: índices sobre `lower(name)` en tablas de traducción o índices collation/case-insensitive si procede.
  - Pros: mejora búsquedas/ordenaciones por nombre.
  - Contras: requiere migración y espacio adicional.

- **Optimizar filtros por tags**
  - Descripción: índices en `tag_links(entity_type, entity_id, tag_id)` y quizá multicolumna para HAVING con AND.
  - Pros: aceleración de listas con muchos tags.
  - Contras: tuning y pruebas.

## Caching y HTTP

- **ETag / Last-Modified en GET**
  - Pros: menos transferencia y carga en servidor/DB.
  - Contras: requiere exponer `modified_at` o hash estable.

- **Cache en Redis para listas frecuentes**
  - Pros: gran mejora en lecturas repetidas.
  - Contras: invalidación y coherencia a gestionar.

## Export/Import y trabajos largos

- **Streaming y chunking**
  - Descripción: export SQL/JSON en flujo y división de import en lotes con reporte incremental.
  - Pros: menor uso de memoria, mejor UX en datasets grandes.
  - Contras: más complejidad y manejo de reintentos.

- **Jobs en background**
  - Descripción: colas (BullMQ) para imports/exports masivos.
  - Pros: resiliencia, reintentos, progreso.
  - Contras: infraestructura Redis adicional.

## Observabilidad

- **Correlation IDs y métricas**
  - Descripción: añadir `x-request-id` y tiempos por handler; exponer métricas (Prometheus) de latencia/errores.
  - Pros: troubleshooting y SLOs.
  - Contras: instrumentación y costes.

- **Estructura de logs estandarizada**
  - Descripción: incluir usuario, entidad afectada, filtros, `timeMs`, `ip`, `requestId`.
  - Pros: mejores auditorías e investigaciones.
  - Contras: volumen de logs.

## Subida de ficheros

- **Almacenamiento externo (S3/compatible)**
  - Pros: escalabilidad, CDN, presigned URLs.
  - Contras: gestión de credenciales y costes.

- **Escaneo antivirus opcional (ClamAV)**
  - Pros: seguridad adicional en contenidos subidos.
  - Contras: consumo CPU/latencia.

- **Política de retención y versiones**
  - Pros: control de espacio y reversión.
  - Contras: mayor gestión.

## Internacionalización (i18n)

- **Restricciones de unicidad**
  - Descripción: garantizar `unique(<entity>_id, language_code)` en tablas de traducción.
  - Pros: integridad de datos.
  - Contras: requiere migración si falta.

- **Respuesta coherente de `language_code_resolved`**
  - Descripción: mantener el campo ya expuesto y documentarlo en todas las entidades.
  - Pros: UX consistente.
  - Contras: ninguno.

## Borrado y consistencia de entidades

- **Soft delete consistente**
  - Descripción: hoy `user` usa soft delete. Definir estrategia uniforme por entidad (`is_active`/`deleted_at`).
  - Pros: reglas claras a nivel de negocio.
  - Contras: migración y adaptación de listados.

## Pruebas y DX

- **Tests unitarios/E2E de API**
  - Descripción: Vitest + supertest para rutas críticas (auth, user, tag, uploads, import/export).
  - Pros: confianza en cambios, evita regresiones.
  - Contras: tiempo inicial de cobertura.

- **Seeds y datos de ejemplo**
  - Descripción: scripts para poblar datos mínimos de desarrollo.
  - Pros: onboarding rápido.
  - Contras: mantenimiento del seed.

- **OpenAPI como fuente de verdad (opcional)**
  - Descripción: generar/validar esquemas y docs desde los handlers.
  - Pros: cliente tipado, documentación viva.
  - Contras: curva de integración.
