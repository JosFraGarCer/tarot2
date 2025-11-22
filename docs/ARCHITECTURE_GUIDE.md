# Tarot – Guía de Arquitectura y Metodología

## Propósito
Este documento establece las pautas prácticas para mantener coherencia entre frontend, backend e infra de contenido del proyecto Tarot. Complementa a `docs/PROJECT_INFO.md` y a los informes estratégicos (`informes/*.md`) con reglas operativas aplicables al desarrollo diario.

## Principios fundamentales
1. **Dominios cohesivos**  
   Agrupa código por entidad (ej. `world`, `arcana`, `base_card`) tanto en `/server` como en `/app`. Cada dominio debe exponer API, composables y componentes coherentes.

2. **Verticales completas**  
   Evoluciona funcionalidades recorriendo la cadena `DB → API → composables → UI`. Evita exponer endpoints sin soporte de UI o viceversa.

3. **Tipado compartido**  
   Deriva tipos desde Kysely y esquemas Zod. Exporta los contratos consumidos por el frontend mediante módulos compartidos (`~/types`).

4. **Observabilidad transversal**  
   Logs estructurados en backend y frontend, con `requestId` propagado y métricas claves (latencia, filtros, idioma). Los componentes críticos deben reportar errores mediante `useAppLogger`.

5. **Iteraciones medibles**  
   Cada entrega debe incluir checklist de aceptación y métricas trazables (p.ej. reducción de latencia, eliminación de deuda de i18n, cobertura de SSR).

## Filosofía SSR-first
- Usa `useAsyncData`/`useFetch` con `server: true` para listados críticos y paneles admin.  
- Prefiere `useApiFetch` (ver sección siguiente) con soporte de ETag y cache TTL definido.  
- Evita dependencias `client-only` salvo cuando el componente lo requiera explícitamente (`<ClientOnly>`).  
- Captura y loguea errores en SSR mediante `nuxtApp.hook('vue:error')` y `nuxtApp.hook('app:error')`, delegando a `event.context.logger` en el servidor.

## Convenciones i18n
- Todas las rutas que ofrecen contenido traducible deben aceptar `lang|language|locale`.  
- El backend devuelve siempre:
  - `language_code_resolved`: idioma efectivo.  
  - `language_is_fallback`: `true` cuando el idioma solicitado no tiene traducción y se usa fallback EN.  
- El frontend muestra badges e indicadores al detectar `language_is_fallback` y ofrece acciones rápidas para crear la traducción faltante.  
- Formularios muestran referencia EN cuando se edita en otro idioma (`FormModal.showFallbackHint`).

## API y helpers de servidor
- Respuestas normalizadas con `{ success, data, meta? }`.  
- `buildFilters` obligatorio para listados con paginación/ordenación.  
- Helpers transaccionales (`entityCrudHelpers`) encapsulan creación/edición/borrado multilenguaje.  
- Logging: todas las rutas deben usar `event.context.logger` con `info|warn|error` y payload estructurado (filtros, lang, duración, resultado).

## Composables y cliente
- `useApiFetch` provee caching con ETag, TTL configurable y logging. Inyecta automáticamente el `H3Event` en SSR para cache por request.  
- `useAppLogger` centraliza logs de UI: `logger.info`, `logger.warn`, `logger.error`.  
- Los composables de datos deben exponer `meta`, `pending`, `error` y aprovechar el payload SSR (sin refetch en mounted).  
- Revalida datos llamando a `refreshNuxtData(key)` o `crud.fetchList()` en lugar de duplicar fetches.

## Componentes y NuxtUI
- Tablas/paneles reutilizan `CommonDataTable` + `AdvancedFiltersPanel` (ver Roadmap fase 3). Mientras tanto, la UI existente debe respetar `langBadge` y `language_is_fallback`.  
- Formularios largos usan pestañas (`UTabs`) y guardado incremental.  
- Los badges de release e idioma deben apoyarse en datos provistos por la API (sin cálculo manual en cliente).

## Logging transversal
- Middleware `00.logger` crea `requestId` y adjunta `event.context.logger`.  
- `useApiFetch` registra `request`, `response` y `error` con nivel adecuado (info/ warn/ error).  
- El frontend reporta errores de componentes mediante `useAppLogger` y `nuxtApp.hook('vue:error')`.  
- Reutiliza la estructura `{ scope, message, meta }` para logs.

## Checklist de adopción
- [ ] Todas las rutas devuelven `language_is_fallback`.  
- [ ] `useApiFetch` con ETag + TTL + SSR-cache aplicado en composables críticos.  
- [ ] Logging per-request con `requestId`.  
- [ ] Badges de idioma y formularios mostrando fallback EN.  
- [ ] Documentación actualizada (esta guía + Roadmap) y referenciada en PRs.
