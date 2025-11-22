# Guía de componentes (NuxtUI 4)

## Tablas y listados inteligentes

1. **Tabla declarativa basada en NuxtUI `UTable` extendida**  
   - **Descripción:** Crear un wrapper `CommonDataTable` que exponga schema de columnas (keys, heading, sort, slot) y active paginación/ordenación integrada con `PaginationControls`.  
   - **Objetivo:** Unificar tablas de `/manage` y `/admin` garantizando consistencia de UX y mínima duplicación.  
   - **Beneficios:** Configuración por entidad más simple, soporte inmediato a capacidades (`translatable`, `hasTags`, `hasPreview`) y personalización vía slots.  
   - **Referencia:** @docs/COMPONENTES manage y admin.MD#97-110

2. **Slots de preview reutilizables**  
   - **Descripción:** Establecer un slot `row-preview` que reciba el item y renderice `CartaRow` o variantes, conservando contexto de idioma y tags.  
   - **Objetivo:** Evitar forks de componentes de preview en feedback/manage y facilitar su expansión a nuevos dominios.  
   - **Beneficios:** Patrón uniforme para previews, reducción del coste de mantenimiento y UX consistente en paneles.  
   - **Referencia:** @docs/COMPONENTES manage y admin.MD#204-211

3. **Columnas dinámicas controladas por capacidades**  
   - **Descripción:** Añadir mapeo `columnCapabilities` para mostrar/ocultar columnas (tags, idiomas, status, acciones) según `useEntityCapabilities`.  
   - **Objetivo:** Reutilizar tabla base sin exponer campos irrelevantes (p.ej. usuarios no traducibles).  
   - **Beneficios:** Flexibilidad para nuevas entidades, menor lógica condicional en vistas y coherencia con permisos.  
   - **Referencia:** @docs/COMPONENTES manage y admin.MD#25-43

4. **Soporte de selección múltiple y acciones masivas**  
   - **Descripción:** Integrar checkboxes en la tabla con barra de acciones masivas (activar/desactivar, asignar tags, resolver feedback).  
   - **Objetivo:** Optimizar flujos editoriales que trabajan con grandes lotes de entidades.  
   - **Beneficios:** Mayor productividad y menos clics, especialmente en tareas repetitivas de moderación.  
   - **Referencia:** @docs/API.MD#205-312

## Formularios y modales

1. **Formularios multi-pestaña con NuxtUI `UTabs`**  
   - **Descripción:** Dividir formularios extensos (cartas, efectos) en tabs (Datos básicos, Traducciones, Metadata, Reglas) con validación incremental.  
   - **Objetivo:** Mejorar la legibilidad y la tasa de finalización al editar entidades complejas.  
   - **Beneficios:** Experiencia enfocada, menos scroll y posibilidad de guardado parcial por sección.  
   - **Referencia:** @docs/PROJECT_INFO.md#99-113

2. **Modales JSON unificados**  
   - **Descripción:** Mover `JsonModal` a `components/common/JsonModal.vue` y reutilizarlo tanto en admin como en manage con atajos de teclado y pretty-print.  
   - **Objetivo:** Evitar duplicados y asegurar que todas las vistas manejen metadata estructurada de igual manera.  
   - **Beneficios:** Mantenimiento centralizado y mejoras instantáneas para cualquier módulo que edite JSON.  
   - **Referencia:** @docs/COMPONENTES manage y admin.MD#232-276

3. **Wizard de creación con guardado en borrador**  
   - **Descripción:** Implementar `EntityWizard` para guiar la creación de cartas/efectos mediante pasos con `useAsyncData` y almacenamiento temporal en Pinia.  
   - **Objetivo:** Reducir errores y pérdidas de datos durante procesos largos de creación.  
   - **Beneficios:** UX robusta, soporte a validaciones paso a paso y facilidad para retomar borradores.  
   - **Referencia:** @docs/PROJECT_INFO.md#27-41

4. **Formularios traducibles con indicadores de fallback**  
   - **Descripción:** Incluir badges `Fallback` cuando un campo muestra el valor en inglés (`language_code_resolved !== currentLang`) y acciones rápidas para crear traducción.  
   - **Objetivo:** Visibilizar lagunas de traducción y agilizar su resolución.  
   - **Beneficios:** Flujos de localización más eficientes y menos confusión para editores multilingües.  
   - **Referencia:** @docs/SERVER.md#315-332

## Componentes genéricos y reusables

1. **`AdvancedFiltersPanel` parametrizable**  
   - **Descripción:** Construir panel de filtros basado en schema (tipo select, rango de fechas, multi-select tags) y sincronizado con la URL.  
   - **Objetivo:** Homogeneizar filtros avanzados entre `/admin/feedback`, `/admin/versions` y `/manage`.  
   - **Beneficios:** Menos duplicación y posibilidad de añadir nuevos filtros declarativamente.  
   - **Referencia:** @docs/COMPONENTES manage y admin.MD#177-220

2. **`EntitySummary` responsive**  
   - **Descripción:** Resumir entidades con `UCard` y layout responsive (status, tags, version, idioma) para tarjetas en dashboards y previews móviles.  
   - **Objetivo:** Presentar información crítica en paneles y vistas rápidas.  
   - **Beneficios:** Mejor experiencia para usuarios móviles y mayor visibilidad de metadatos clave.  
   - **Referencia:** @docs/PROJECT_INFO.md#110-123

3. **`TranslationStatusBadge`**  
   - **Descripción:** Badge que indica `Completa`, `Parcial (fallback)`, `Sin traducción` calculado mediante campos resolvidos.  
   - **Objetivo:** Dar feedback inmediato del estado lingüístico en tablas y detalles.  
   - **Beneficios:** Priorización ágil de traducciones y consistencia visual.  
   - **Referencia:** @docs/PROJECT_INFO.md#14-21

4. **Componente `ReleaseStageChip`**  
   - **Descripción:** Chip NuxtUI con estados (`dev`, `alfa`, `beta`, `candidate`, `release`, `revision`) y colores accesibles, usado en versiones y entidades vinculadas.  
   - **Objetivo:** Visualizar rápidamente el estado editorial/versionado.  
   - **Beneficios:** Mejor comunicación con stakeholders y reducción de errores de publicación.  
   - **Referencia:** @docs/PROJECT_INFO.md#136-164

## Patrones para componentes dinámicos

1. **Capacidades via provide/inject**  
   - **Descripción:** Implementar `useEntityCapabilities(entity)` para exponer banderas (`translatable`, `hasTags`, `hasPreview`, `hasEffects`) consumidas por componentes base.  
   - **Objetivo:** Evitar proliferación de props booleanas y habilitar configuración centralizada por dominio.  
   - **Beneficios:** Escalabilidad, menor ruido en templates y consistencia entre admin/manage.  
   - **Referencia:** @docs/COMPONENTES manage y admin.MD#75-94

2. **Layout adaptable SSR/SPA**  
   - **Descripción:** Emplear `Suspense` + `Placeholder` de NuxtUI para mantener skeletons durante SSR y evitar saltos de layout al hidratar.  
   - **Objetivo:** Mejorar percepción de rendimiento en listados y dashboards SSR-first.  
   - **Beneficios:** UX más suave, métricas de Core Web Vitals más favorables.  
   - **Referencia:** @docs/PROJECT_INFO.md#124-168

3. **Control de acciones por permisos**  
   - **Descripción:** Crear `ActionGuard` que reciba `permission` y muestre/oculte botones, integrándose con permisos mergeados del backend.  
   - **Objetivo:** Sincronizar experiencia UI con autorizaciones reales sin lógica duplicada.  
   - **Beneficios:** Seguridad reforzada y reducción de estados inconsistentes.  
   - **Referencia:** @docs/API.MD#31-118

4. **Composición de tarjetas con slots de metadata**  
   - **Descripción:** Diseñar `EntityCard` con slots `header`, `meta`, `footer`, permitiendo combinar chips de status, release, tags y botones contextuales.  
   - **Objetivo:** Reutilizar la misma tarjeta en dashboards, previews y listados planos.  
   - **Beneficios:** Uniformidad visual y flexibilidad para futuras vistas.  
   - **Referencia:** @docs/PROJECT_INFO.md#110-123

## Mejora UX panel de gestión

1. **Dashboards con métricas clave**  
   - **Descripción:** Incorporar `StatsGrid` que muestre conteos por estado (draft, review, approved), versiones recientes y feedback abierto.  
   - **Objetivo:** Ofrecer visión ejecutiva en la landing de `/manage` y `/admin`.  
   - **Beneficios:** Decisiones más rápidas y priorización de trabajo editorial.  
   - **Referencia:** @docs/PROJECT_INFO.md#124-170

2. **Atajos de teclado y spotlight search**  
   - **Descripción:** Agregar `CommandPalette` (NuxtUI `UCommandPalette`) con atajos para crear entidades, abrir filtros y navegar entre módulos.  
   - **Objetivo:** Mejorar productividad de usuarios avanzados.  
   - **Beneficios:** Menos dependencia del ratón, navegación inmediata y aprendizaje guiado.  
   - **Referencia:** @docs/API.MD#69-118

3. **Modo compacto vs detallado en tablas**  
   - **Descripción:** Permitir alternar densidad de filas (compacta, estándar, detallada) para acomodar pantallas pequeñas o revisiones exhaustivas.  
   - **Objetivo:** Adaptarse a distintos contextos de uso (moderación rápida vs auditoría).  
   - **Beneficios:** UX personalizable y accesible para usuarios con distintas preferencias.  
   - **Referencia:** @docs/COMPONENTES manage y admin.MD#223-305

4. **Historial contextual en panel lateral**  
   - **Descripción:** Añadir `EntityActivitySidebar` que muestre revisiones, feedback y versiones relacionadas con una carta mientras se edita.  
   - **Objetivo:** Dar contexto completo sin abandonar el formulario principal.  
   - **Beneficios:** Menos cambios de pantalla, decisiones informadas y ahorro de tiempo.  
   - **Referencia:** @docs/API.MD#675-759
