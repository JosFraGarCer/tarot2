# Security Overview – Tarot2

Este documento resume el estado actual de autenticación, autorización, mitigación de abuso y logging en el backend de Tarot2. Todas las referencias apuntan a código real del repositorio y reflejan los cambios recientes (rate limiting aplicado a flujos editoriales, limpieza de sesión en logout y observabilidad estructurada).

## 1. Autenticación
- **Login** (`POST /api/auth/login`)
  - Valida `{ identifier, password }`, comprueba hash con `bcrypt.compare` y genera JWT HS256 con `createToken`.@server/api/auth/login.post.ts#1-140@server/plugins/auth.ts#1-210
  - Setea cookie `auth_token` con `HttpOnly`, `SameSite:'strict'`, `secure` en producción y `maxAge` configurable vía `JWT_EXPIRES_IN`.
- **Hydration**
  - `00.auth.hydrate.ts` verifica la cookie, carga usuario + roles, fusiona permisos (`mergePermissions`) y adjunta `event.context.user` para el resto del request.@server/middleware/00.auth.hydrate.ts#1-140@server/utils/users.ts#1-120
- **Me endpoint**
  - `GET /api/user/me` expone el usuario autenticado para hidratar el store front (`useAuth.fetchCurrentUser`).@server/api/user/me.get.ts#1-80@app/composables/auth/useAuth.ts#1-200
- **Logout** (`POST /api/auth/logout`)
  - Limpia la cookie (`setCookie(..., maxAge:0, path:'/'`) y retorna `createResponse(null)`; aplica rate limit adicional con `enforceRateLimit`.
  - Referencia a SECURITY.md mantenida sincronizada con implementación.@server/api/auth/logout.post.ts#1-70

## 2. Autorización
- **Middleware 01.auth.guard**
  - Bloquea todo `/api/*` excepto login/logout, devuelve 401 si falta usuario y 403 si `user.status === 'suspended'`. Permite paso a administradores o `permissions.canManageUsers`.
  - Valida granularmente rutas sensibles (`/api/role` exige `canManageUsers`).@server/middleware/01.auth.guard.ts#1-140
- **Capacidades declarativas**
  - `useEntityCapabilities` centraliza banderas (`canRevision`, `hasTags`, `actionsBatch`) usadas en Admin/Manage, manteniendo UI y backend alineados.@app/composables/common/useEntityCapabilities.ts#1-158
- **Directiva v-can**
  - En frontend restringe botones/componentes según permisos obtenidos del store (`useUserStore().hasPermission`).@app/directives/can.ts#1-120

## 3. Mitigación de abuso y rate limiting
- **Middleware global** `02.rate-limit.ts`
  - Buckets por IP+usuario: `300 req / 5 min` (global) y `10 req / 60 s` (sensibles). Registra éxitos y rechazos (`logger.debug` / `logger.warn`).@server/middleware/02.rate-limit.ts#1-140
- **enforceRateLimit** (`server/utils/rateLimit.ts`)
  - Endpoints críticos invocan límites adicionales: login/logout, publicación de versiones, revert de revisiones, uploads y acciones editoriales.
  - Ejemplos: `content_versions/publish.post.ts`, `content_revisions/[id]/revert.post.ts`, `auth/logout.post.ts`.
- **Import/export**
  - Operaciones masivas (`/api/database/import|export`) siguen sujetos al middleware y registran duración + contador para auditoría.

## 4. Sesiones y cookies
- Cookie `auth_token` es la única credencial persistida.
- Atributos forzados:
  - `httpOnly: true`, `sameSite: 'strict'`, `secure: isProd`, `maxAge: 7d` (configurable).
- Expiración del JWT controlada por `JWT_EXPIRES_IN` (formato `1d`, `12h`, `3600s`).
- Rotación manual (pendiente) planificada en `/informes/BRAINSTORMING.md`.

## 5. Integridad y validación
- **Zod**: todos los handlers usan schemas en `server/schemas/*` con `safeParseOrThrow`.
- **createCrudHandlers**: garantiza respuestas homogéneas, manejo transaccional y borrado multi-idioma seguro (`translatableUpsert`, `deleteLocalizedEntity`).@server/utils/createCrudHandlers.ts#1-240@server/utils/translatableUpsert.ts#1-191
- **Borrado por idioma**: si `lang !== 'en'` solo elimina la traducción; si `lang === 'en'` borra base + traducciones.
- **Uploads**: validan extensión, tamaño (≤15 MB), convierten a AVIF y saneado de rutas antes de guardar en `public/img`.@server/api/uploads/index.post.ts#1-170

## 6. Logging y auditoría
- **Logger** `server/plugins/logger.ts`: crea child logger por request (`requestId`, `method`, `url`, `userId`).@server/plugins/logger.ts#1-160
- **Listados**: incluyen `page`, `pageSize`, `count`, `filters`, `lang`, `timeMs` en `info`.
- **Mutaciones**: registran `entity`, `id`, `user_id`, `duration`, `scope`.
- **Eventos editoriales**: publicación y revert devuelven payload resumido (`totalEntities`, `revisionsPublished`) y quedan logueados para monitoreo.
- **Access logs**: rate limiting crea entradas `logger.debug/warn` para permitir correlación con abusos.

## 7. Frontend protections
- **Route guard** `app/middleware/auth.global.ts`:
  - Redirige invitados a `/login` y evita que usuarios autenticados regresen a login.
  - Aísla secciones `/admin` a usuarios con permisos (`canAccessAdmin`, `canManageUsers`, `canReview`, etc.).
- **Composables** `useAuth`/`useUserStore`: refrescan sesión, invalidan UI si el backend revoca permisos.
- **UI degradada**: directiva `v-can.disable` deshabilita botones en lugar de ocultarlos para mayor transparencia.

## 8. Configuración requerida
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (default `1d`)
- `UPLOAD_MAX_FILE_SIZE` (indirecto, validación hardcoded a 15MB)
- `LOG_LEVEL` (controla Pino)

## 9. Checklist de seguridad diario
- ✅ Revisión de logs `scope:middleware.rateLimit.*` y `scope:content_versions.publish`.
- ✅ Validar que `auth_token` use `Secure` en entornos productivos.
- ✅ Confirmar que endpoints nuevos usan `enforceRateLimit` y `createResponse`.
- ✅ Ejecutar pruebas manuales de logout múltiple (prevención de abuso) y rotación de credenciales admin.

## 10. Pendientes y roadmap
1. **Rotación automática de claves JWT** (mantenida en `/informes/BRAINSTORMING.md` Idea 19). Requiere soportar múltiples claves activas.
2. **Persistencia distribuida de rate limit** para despliegues multi-nodo (actualmente in-memory).
3. **Alerting**: propagar `requestId` a frontend y dashboards para correlación end-to-end.
4. **Security headers extra**: evaluar `Content-Security-Policy` y `Permissions-Policy` en respuesta SSR.

Con estas prácticas, Tarot2 mantiene una superficie de ataque reducida y homogénea, lista para endurecerse con la automatización de rotación JWT, métricas centralizadas y CSP estricta.
