# Guía de composables

## Arquitectura y estructura

1. **Carpetas por dominio con índice público**  
   - **Descripción:** Organizar `composables/` en subdirectorios por dominio (`arcana`, `versions`, `feedback`) exponiendo un `index.ts` que reexporte entradas de alto nivel.  
   - **Objetivo:** Mantener cohesión con el árbol de API y facilitar la búsqueda de hooks relacionados.  
   - **Beneficios:** Onboarding más rápido, rutas de import consistentes y reducción de imports absolutos confusos.  
   - **Referencia:** @docs/PROJECT_INFO.md#110-130

2. **Capas comunes en `composables/common`**  
   - **Descripción:** Centralizar hooks reutilizables (`useQuerySync`, `useListMeta`, `useEntityCapabilities`) para compartir lógica entre `/admin` y `/manage`.  
   - **Objetivo:** Evitar duplicación y mantener patrones uniformes.  
   - **Beneficios:** Facilita evoluciones globales y minimiza regresiones.  
   - **Referencia:** @docs/COMPONENTES manage y admin.MD#223-305

## División por responsabilidades

1. **Hooks de datos vs hooks de UI**  
   - **Descripción:** Separar composables que hablan con la API (`useArcanaApi`) de los que gestionan estado de formulario (`useArcanaForm`).  
   - **Objetivo:** Simplificar pruebas y reutilizar lógica de negocio en múltiples componentes.  
   - **Beneficios:** Código más testeable y menor acoplamiento entre datos y presentación.  
   - **Referencia:** @docs/API.MD#69-118

2. **Servicios por entidad**  
   - **Descripción:** Mantener un patrón `use<Entity>()` que retorne { list, detail, create, update, remove, meta } encapsulando `useApiFetch`.  
   - **Objetivo:** Homogeneizar interacción con CRUD y permitir reemplazar backend sin tocar UI.  
   - **Beneficios:** Mayor coherencia y menos boilerplate en páginas.  
   - **Referencia:** @docs/SERVER.md#285-332

## Uso de `useFetch` / `useAsyncData`

1. **`useApiFetch` con ETag por defecto**  
   - **Descripción:** Envolver `useFetch` con cabeceras ETag/If-None-Match y control de `server: true` para SSR.  
   - **Objetivo:** Reducir cargas innecesarias y mantener sincronía SSR/cliente.  
   - **Beneficios:** Performance optimizada y coherencia de datos en multisesión.  
   - **Referencia:** @docs/PROJECT_INFO.md#126-165

2. **Cargando inicial con `useAsyncData` en SSR crítico**  
   - **Descripción:** Reservar `useAsyncData` para listados grandes (arcana, versiones) ejecutándolo en servidor y rehidratando meta.  
   - **Objetivo:** Garantizar TTFB bajo y evitar flashes de contenido vacío.  
   - **Beneficios:** Mejora Core Web Vitals y reduce trabajo en cliente.  
   - **Referencia:** @docs/PROJECT_INFO.md#124-168

3. **Revalidación selectiva**  
   - **Descripción:** Usar `watch` con `refreshNuxtData` para refrescar caches cuando cambien filtros/paginación, evitando refetch global.  
   - **Objetivo:** Controlar invalidación y minimizar llamadas.  
   - **Beneficios:** Experiencia fluida y ahorro de recursos.  
   - **Referencia:** @docs/API.MD#15-33

## Estado y manejo de errores

1. **Núcleo reactivo con `ref` y `shallowRef`**  
   - **Descripción:** Usar `shallowRef` para colecciones grandes y `ref` para ids/filtros, limitando reactividad innecesaria.  
   - **Objetivo:** Optimizar renderizados y mantener claridad en dependencias.  
   - **Beneficios:** Mejor rendimiento y menos watchers.  
   - **Referencia:** @docs/PROJECT_INFO.md#8-10

2. **Errores estandarizados**  
   - **Descripción:** Normalizar errores de API en hooks (`{ message, statusCode }`) tomando datos de `{ success:false }` cuando exista.  
   - **Objetivo:** Mostrar mensajes coherentes y facilitar tracing.  
   - **Beneficios:** UX consistente y logging simplificado.  
   - **Referencia:** @docs/API.MD#26-33

3. **Retry y fallback controlado**  
   - **Descripción:** Ofrecer opciones `{ retry?: number, retryDelay?: number }` en hooks de fetch, con fallback a datos cacheados cuando falle.  
   - **Objetivo:** Robustecer la app ante fallos intermitentes de red.  
   - **Beneficios:** Menor frustración del usuario y resiliencia operacional.  
   - **Referencia:** @docs/PROJECT_INFO.md#124-166

## Caching y sincronización

1. **Cache local con `Map` por key**  
   - **Descripción:** Implementar cache in-memory por entidad (id → payload) sincronizado con actualizaciones.  
   - **Objetivo:** Reducir llamadas repetidas a detalle cuando se navega entre tabs.  
   - **Beneficios:** Respuesta instantánea y menos carga sobre el servidor.  
   - **Referencia:** @docs/SERVER.md#318-340

2. **Sincronización con URL (query-state)**  
   - **Descripción:** `useQuerySync` para leer/escribir filtros en `route.query`, aplicando parseo seguro (`parseInt`, `toISO`).  
   - **Objetivo:** Permitir compartir URLs y mantener estado entre recargas.  
   - **Beneficios:** Mejor colaboración y depuración.  
   - **Referencia:** @docs/COMPONENTES manage y admin.MD#232-305

3. **Persistencia temporal en Pinia**  
   - **Descripción:** Guardar filtros y draft de formularios en Pinia con expiración (`setTimeout`/TTL).  
   - **Objetivo:** Evitar pérdida de trabajo en wizard de cartas.  
   - **Beneficios:** Incrementa satisfacción del usuario y reduce reprocesos.  
   - **Referencia:** @docs/PROJECT_INFO.md#27-41

## Interacción con API

1. **Factories de endpoints**  
   - **Descripción:** Crear `createCrudEndpoints(basePath)` que devuelva métodos tipados (`list`, `get`, `post`, `patch`, `delete`) usando Kysely types.  
   - **Objetivo:** Evitar hardcodeo de rutas y mantener tipado común.  
   - **Beneficios:** Cambios rápidos si se versiona API y reducción de errores de string.  
   - **Referencia:** @docs/SERVER.md#285-334

2. **Soporte para import/export**  
   - **Descripción:** Incluir helpers `useEntityExport` y `useEntityImport` que llamen a endpoints dedicados y manejen descargas/subidas con feedback de progreso.  
   - **Objetivo:** Simplificar operaciones masivas desde UI.  
   - **Beneficios:** Mayor productividad editorial y menor riesgo de errores manuales.  
   - **Referencia:** @docs/API.MD#223-312

3. **Batch actions con confirmación**  
   - **Descripción:** Implementar `useBatchMutation` que reciba `{ ids, payload }` y maneje confirmaciones, loaders y toasts homogéneos.  
   - **Objetivo:** Establecer patrón para `batch.patch` (tags, estados).  
   - **Beneficios:** UX coherente y menor duplicación de lógica en tablas.  
   - **Referencia:** @docs/API.MD#348-417

## i18n en composables

1. **Idioma derivado del runtime**  
   - **Descripción:** Resolver `const lang = useI18n().locale.value` y pasarlo a `useApiFetch` como query `lang`, centralizando fallback.  
   - **Objetivo:** Sincronizar capa cliente con reglas del servidor.  
   - **Beneficios:** Traducciones coherentes y reducción de bugs por idioma.  
   - **Referencia:** @docs/SERVER.md#315-332

2. **Indicadores de fallback**  
   - **Descripción:** Retornar `isFallback` cuando `language_code_resolved !== lang`, para mostrar badges en UI.  
   - **Objetivo:** Alertar al usuario de traducciones incompletas.  
   - **Beneficios:** Priorización más rápida de localización.  
   - **Referencia:** @docs/SERVER.md#315-332

3. **Helpers de traducción para formularios**  
   - **Descripción:** Crear `useTranslationFields({ entity, lang })` que prepare modelo con campos traducibles y fallback a EN.  
   - **Objetivo:** Reducir boilerplate en formularios multilenguaje.  
   - **Beneficios:** Menos errores y formularios auto poblados correctamente.  
   - **Referencia:** @docs/PROJECT_INFO.md#14-21

## Patrones recomendados

1. **Composable de capacidades**  
   - **Descripción:** `useEntityCapabilities(kind)` que concentre banderas (`translatable`, `hasTags`, `hasPreview`) y se consuma en componentes.  
   - **Objetivo:** Evitar props booleanas múltiples y habilitar configuración central.  
   - **Beneficios:** Escalabilidad y coherencia entre admin/manage.  
   - **Referencia:** @docs/COMPONENTES manage y admin.MD#75-94

2. **Composición funcional**  
   - **Descripción:** Combinar hooks especializados (`useFilters`, `usePagination`, `useSorting`) dentro de `useEntity`.  
   - **Objetivo:** Mantener SRP y permitir reutilizar piezas pequeñas según contexto.  
   - **Beneficios:** Mayor flexibilidad y tests unitarios más granulares.  
   - **Referencia:** @docs/SERVER.md#506-549

3. **Testing con escenarios mock**  
   - **Descripción:** Proveer factories `createMockEntityComposable` que usen datos de fixtures para storybook/tests.  
   - **Objetivo:** Validar UX y lógica sin depender del backend.  
   - **Beneficios:** Desarrollo paralelo frontend/backend y detección temprana de regressions.  
   - **Referencia:** @docs/PROJECT_INFO.md#27-41
