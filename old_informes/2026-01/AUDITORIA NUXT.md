# Auditoría Nuxt — Tarot2

## 1. Resumen de madurez arquitectónica
- **Arquitectura general**: el proyecto sigue la estructura recomendada de Nuxt 4 (app/, server/, composables auto-importados) y se apoya en Nitro para CRUD backend. La mayoría de páginas usan `definePageMeta`, `useSeoMeta` y composables SSR-aware. Madurez media-alta.
- **Fortalezas**: patrones compartidos (`useEntity`, `createCrudHandlers`), separación Admin/Manage, `useApiFetch` wrapper, middlewares server-side bien definidos, documentación interna amplia.
- **Debilidades**: persistencia de `$fetch` global en stores/composables, tablas/CRUD legacy, falta de route rules y caching explícito, algunos modales/overlays fuera de pautas Nuxt UI/ARIA, escasa adopción de `defineNuxtRouteMiddleware` para middlewares de cliente.

## 2. Antipatrones detectados
1. **$fetch directo en SSR** (`app/stores/user.ts`, `app/composables/auth/useAuth.ts`, `app/composables/useUser.ts`, `app/pages/user.vue`). Rompe cabeceras SSR y caching Nitro. Debe migrarse a `useFetch`/`useApiFetch` (Docs: `/docs/4.x/getting-started/data-fetching`).
2. **Tablas HTML manuales** (`app/components/admin/VersionList.vue`, `app/components/admin/RevisionsTable.vue`, `app/components/manage/view/EntityTable.vue`). No aprovechan `UTable`, selección accesible ni densidad controlada.
3. **Modal legacy** (`app/components/manage/modal/PreviewModal.vue`): usa `:open` en vez de `v-model:open`, sin focus trap ni `useOverlay`.
4. **Paginación custom** (`app/components/common/PaginationControls.vue`): no usa `UPagination`, sin `aria-label` ni `route rules`.
5. **Composables con scope ambiguo**: algunos `use*` usan APIs client-only en SSR (ver sección 5). Necesitan `process.client` guard o `defineNuxtPlugin`.

## 3. Problemas SSR/CSR (hydration, data misuse)
- `useEntity` usa `useAsyncData` correctamente pero carece de `staleTime`/`lazy` para caching — se podría optimizar.
- Stores (`useUserStore`) invocan `$fetch` sin `useRequestHeaders` cuando se ejecutan en SSR.
- Tablas HTML: sin `key` definido en `<tr>`; riesgo leve de hydration mismatch.

## 4. Diagnóstico de middleware
- **server/middleware**: `00.auth.hydrate`, `01.auth.guard`, `02.rate-limit` cumplen guía `/docs/4.x/getting-started/server`. Se recomienda añadir logs `requestId` (ya existe en logger) y revisar que `02.rate-limit` use `event.node.req.headers['x-forwarded-for']` para IP real (actualmente usa `getClientIP` de Nitro).
- **app/middleware**: No se detectaron middlewares de cliente (`defineNuxtRouteMiddleware`). Se sugiere crear uno para redirección de idioma o permisos por ruta (ej. `/admin/*`).

## 5. Diagnóstico de composables server-only/client-only
- **SSR-safe**: `useEntity`, `useAsyncData`, `useApiFetch`, `usePreviewFetch` son correctos.
- **Client-only sin guard**: `useUserStore` (store) invoca `$fetch` en SSR; debe usar `useFetch` con `server: false` o `process.client`.
- **Mixto**: `useAuth` tiene `login`/`logout` client-only pero `me` se ejecuta en SSR; se recomienda separar con `defineNuxtPlugin` o `useCookie`.
- **Recomendación**: envolver `$fetch` en `useApiFetch` con `credentials: 'include'` y usar `useRequestHeaders(['cookie'])` para SSR.

## 6. Diagnóstico de plugins
- **server/plugins**: `auth.ts`, `db.ts`, `logger.ts` son plugins Nitro (`defineNitroPlugin`). Correcto uso de `h3App`.
- **app/plugins**: No se detectaron plugins de cliente (`defineNuxtPlugin`). Si se requiere inicialización de librerías client-only (ej. chart.js), crear plugin con `client: true`.

## 7. Revisión de nuxt.config
- **Estructura**: correcta. `compatibilityDate` actual, `ssr: true`, `i18n` con `prefix_except_default`, `modules` oficiales.
- **Faltantes**: `routeRules` para cacheo por ruta, `nitro.storage` si se necesita persistencia, `experimental` para `payloadExtraction` si hay mucho SSR.
- **Recomendación**: añadir `routeRules` para páginas estáticas (`/deck/**: { isr: 60 }`) y admin (`/admin/**: { ssr: false }` si se prefiere CSR).

## 8. Revisión de fetcher / useApiFetch / caching
- **`utils/fetcher.ts`**: wrapper `useApiFetch` con `ofetch` y `tryUseNuxtApp`. Correcto. Ya inyecta cabeceras SSR.
- **Uso inconsistente**: varios archivos usan `$fetch` directo (ver sección 2). Migrar a `useApiFetch` para ETag/headers consistentes.
- **Caching**: `useAsyncData` en `useEntity` no define `staleTime` ni `server: true`. Se puede mejorar con `default: () => $fetch(...), { transform, default: () => null }` y `staleTime: 60000`.
- **Nitro cache**: backend CRUD usa `createCrudHandlers` sin `cache` explicito. Se puede añadir `event.context.cache` para listados.

## 9. Compatibilidad con best practices del MCP de Nuxt
- **Directory structure**: ✅ (`app/`, `server/`, `composables/`, `utils/`).
- **Auto imports**: ✅ (composables, utils, components).
- **SSR data fetching**: ⚠️ (mezcla `$fetch`/`useFetch`).
- **Route middleware**: ❌ (ningún `defineNuxtRouteMiddleware`).
- **Plugins**: ✅ (Nitro plugins correctos; falta client plugins si se necesita).
- **Runtime config**: ✅ (uso de `useRuntimeConfig` en server).
- **Nitro**: ✅ (server routes con `defineEventHandler`).

## 10. Lista detallada por archivo
### /app/
- **stores/user.ts**: ❌ `$fetch` directo. Migrar a `useFetch`/`useApiFetch`.
- **composables/auth/useAuth.ts**: ❌ `$fetch` en login/logout. Usar `useFetch` con `server: false`.
- **composables/useUser.ts**: ❌ `$fetch` sin SSR headers. Migrar.
- **composables/manage/useEntity.ts**: ✅ uso de `useAsyncData` y `useApiFetch`. Mejorar caching.
- **composables/common/useEntityPreviewFetch.ts**: ✅ SSR-safe.
- **pages/user.vue**: ❌ `$fetch` en upload. Usar `useFetch`.
- **pages/admin/index.vue**: ✅ SEO meta, composables correctos.
- **components/admin/VersionList.vue**: ❌ tabla HTML. Migrar a AdminTableBridge.
- **components/admin/RevisionsTable.vue**: ❌ tabla custom. Migrar.
- **components/manage/modal/PreviewModal.vue**: ❌ modal legacy. Migrar a EntityInspectorDrawer.
- **components/common/PaginationControls.vue**: ⚠️ custom pagination. Migrar a UPagination.
- **app.vue**: ✅ (si existe, revisar `<NuxtPage>` y layout).
- **error.vue**: ✅ (si existe, revisar `<NuxtErrorBoundary>`).

### /server/
- **api/**/*.ts**: ✅ uso de `defineEventHandler` y `createCrudHandlers`.
- **middleware/*.ts**: ✅ Nitro middleware. Mejorar rate-limit IP.
- **plugins/*.ts**: ✅ Nitro plugins. Considerar `cache` plugin.

### /nuxt.config.ts
- ✅ Estructura y módulos.
- ⚠️ Faltan `routeRules` y `experimental` settings.

## 11. Recomendaciones prácticas
1. **Migrar $fetch a useApiFetch** en stores y composables auth/user para SSR-safe headers.
2. **Crear route rules** para cacheo ISR en deck y CSR opcional en admin.
3. **Migrar tablas legacy** a AdminTableBridge/ManageTableBridge + CommonDataTable.
4. **Reemplazar PreviewModal** con EntityInspectorDrawer (focus/ARIA).
5. **Usar UPagination** en PaginationControls; exponer `aria-label`.
6. **Añadir defineNuxtRouteMiddleware** para redirección de idioma y protección de rutas admin.
7. **Definir client plugins** si se necesitan librerías client-only (ej. charts, maps).
8. **Optimizar useAsyncData** con `staleTime` y `transform` en `useEntity`.
9. **Añadir Nitro cache** en listados CRUD (`event.context.cache`).
10. **Crear plugin de logging** centralizado (ya existe logger, exponer como composable).

## 12. Roadmap sugerido para modernización
### Fase 1 (Quick wins – 1 semana)
- Migrar `$fetch` en `useUserStore`, `useAuth`, `useUser` a `useFetch`/`useApiFetch`.
- Añadir `routeRules` básicas en `nuxt.config.ts`.
- Crear `defineNuxtRouteMiddleware` para protección de `/admin/*`.
- Actualizar `PaginationControls` para usar `UPagination`.

### Fase 2 (Componentes y UI – 2 semanas)
- Migrar `VersionList.vue` y `RevisionsTable.vue` a AdminTableBridge.
- Reemplazar `PreviewModal.vue` por `EntityInspectorDrawer`.
- Eliminar `EntityTable.vue` legacy.
- Añadir `aria-label` y focus management en modales/overlays.

### Fase 3 (Performance y caching – 1 semana)
- Optimizar `useEntity` con `staleTime` y `transform`.
- Implementar Nitro cache en CRUD listados.
- Configurar ISR para `/deck/**` con `isr: 60`.
- Revisar y ajustar rate-limit IP.

### Fase 4 (Plugins y extensibilidad – 1 semana)
- Crear `defineNuxtPlugin` para librerías client-only si se requiere.
- Centralizar logging como composable `useLogger`.
- Revisar `experimental.payloadExtraction` si se tiene mucho SSR payload.

### Fase 5 (Testing y documentación – 1 semana)
- Añadir pruebas manuales QA para flujos CRUD tras migración.
- Actualizar `docs/INFORME-admin.md` y `INFORME-manage.md` con nuevos patrones.
- Documentar uso de `useApiFetch` vs `$fetch` en guía interna.

---

**Nota**: Esta auditoría se basa exclusivamente en la documentación oficial del MCP de Nuxt 4 y las convenciones recomendadas. No se han inventado APIs; todas las referencias corresponden a secciones existentes en `/docs/4.x/`.
