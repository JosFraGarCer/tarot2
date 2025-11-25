# Guía estratégica global

## Principios de arquitectura

1. **Dominios cohesivos por contexto**  
   - **Descripción:** Mantener el código agrupado por dominio (world, arcana, base_card, etc.) tanto en servidor como en frontend para preservar la coherencia del modelo de datos.  
   - **Objetivo:** Facilitar que cada equipo encuentre rápidamente los artefactos ligados a una entidad y aplicar cambios consistentes en CRUD, vistas e i18n.  
   - **Beneficios:** Menor tiempo de onboarding, refactors más predecibles y reducción de regresiones al aislar responsabilidades por carpeta.  
   - **Referencia:** @docs/SERVER.md#20-47

2. **SSR-first con caché controlada**  
   - **Descripción:** Priorizar SSR y `useApiFetch`/`useAsyncData` con validación ETag para listados críticos, garantizando frescura de datos sin sacrificar rendimiento.  
   - **Objetivo:** Servir paneles administrativos y de gestión con respuesta inmediata y coherente entre renderizado inicial y navegación cliente.  
   - **Beneficios:** Mejor SEO técnico, menor time-to-interactive y datos coherentes bajo múltiples pestañas o usuarios concurrentes.  
   - **Referencia:** @docs/PROJECT_INFO.md#124-166

3. **Internacionalización de extremo a extremo**  
   - **Descripción:** Mantener traducciones en tablas dedicadas (`*_translations`) y respetar el idioma por defecto EN más fallback en todas las capas.  
   - **Objetivo:** Garantizar que la experiencia multi-idioma funcione igual en API, composables, componentes y base de datos.  
   - **Beneficios:** Reducción de incoherencias lingüísticas y soporte fluido para nuevos idiomas sin reescribir lógica.  
   - **Referencia:** @docs/PROJECT_INFO.md#14-41

4. **Tipado estrictamente compartido**  
   - **Descripción:** Reutilizar tipos derivados de Kysely y esquemas Zod en conjunto con los tipos de frontend para validar inputs/outputs.  
   - **Objetivo:** Garantizar que las entidades compartan definiciones y prevenir discrepancias entre servidor y cliente.  
   - **Beneficios:** Menos bugs en tiempo de ejecución, autocompletado confiable y evolución controlada del dominio.  
   - **Referencia:** @docs/PROJECT_INFO.md#8-10

5. **Observabilidad transversal**  
   - **Descripción:** Centralizar el logging mediante Pino, incluyendo métricas de filtros, idioma y tiempos por petición, y extenderlo al frontend.  
   - **Objetivo:** Obtener visibilidad completa de la interacción usuario-servidor para depurar y optimizar.  
   - **Beneficios:** Detección temprana de cuellos de botella, auditoría de operaciones sensibles y soporte para métricas operativas.  
   - **Referencia:** @docs/SERVER.md#136-140

## Patrones a seguir

1. **Handlers finos con helpers comunes**  
   - **Descripción:** Construir handlers H3 que deleguen validaciones y respuesta a utilidades (`safeParseOrThrow`, `createResponse`, `entityCrudHelpers`).  
   - **Objetivo:** Reducir duplicación y mantener consistencia entre módulos CRUD.  
   - **Beneficios:** Código más corto, mayor legibilidad y facilidad para introducir cambios globales.  
   - **Referencia:** @docs/SERVER.md#49-126

2. **`buildFilters` como puerta de entrada**  
   - **Descripción:** Pasar todas las consultas paginadas por `buildFilters` con mapas de columnas y callbacks de búsqueda estandarizados.  
   - **Objetivo:** Garantizar ordenaciones seguras, búsquedas coherentes y conteos fiables.  
   - **Beneficios:** Prevención de inyecciones SQL, reglas homogéneas de paginación y reducción de bugs en listados.  
   - **Referencia:** @docs/SERVER.md#506-535

3. **Respuestas normalizadas con metadatos**  
   - **Descripción:** Envolver todas las respuestas exitosas en `createResponse`/`createPaginatedResponse`, incluyendo `meta` uniforme.  
   - **Objetivo:** Permitir que el frontend consuma datos y metadatos con contratos estables.  
   - **Beneficios:** Menos condicionales en la UI, facilidad de cacheo y telemetría consistente.  
   - **Referencia:** @docs/SERVER.md#537-544

4. **Agregaciones de tags reutilizables**  
   - **Descripción:** Aplicar el subquery estándar para `tags` (JSON) en toda entidad con etiquetado y compartirlo como helper SQL.  
   - **Objetivo:** Unificar la manera en que se exponen etiquetas y preparar su reutilización en filtros complejos.  
   - **Beneficios:** Experiencia de usuario uniforme, filtrado AND fiable y menor riesgo de divergencia entre entidades.  
   - **Referencia:** @docs/SERVER.md#318-330

## Qué evitar

1. **Cruzar responsabilidades Admin/Manage**  
   - **Descripción:** Mantener separados los flujos administrativos y de gestión pública para no romper permisos ni expectativas de usuarios internos.  
   - **Objetivo:** Respetar la diferencia de roles y capacidades entre módulos administrativos y de gestión diaria.  
   - **Beneficios:** Seguridad reforzada, foco funcional más claro y menor deuda cuando se introduzcan auditorías.  
   - **Referencia:** @docs/PROJECT_INFO.md#110-120

2. **Omitir fallback de idioma**  
   - **Descripción:** Evitar queries o componentes que asuman disponibilidad del idioma activo sin respaldo EN.  
   - **Objetivo:** Prevenir errores y campos vacíos cuando falten traducciones específicas.  
   - **Beneficios:** Interfaces siempre completas y menor carga de soporte para traducciones parciales.  
   - **Referencia:** @docs/PROJECT_INFO.md#14-21

3. **Respuestas ad-hoc distintas al estándar**  
   - **Descripción:** No crear contratos JSON distintos al `{ success, data, meta? }` establecido.  
   - **Objetivo:** Mantener a los consumidores alineados y simplificar testing.  
   - **Beneficios:** Integraciones más predecibles y facilidades para mockear o cachear.  
   - **Referencia:** @docs/API.MD#5-33

4. **Endpoints redundantes para filtros**  
   - **Descripción:** Evitar proliferar rutas solo para filtrar por combinaciones específicas; usar la semántica AND/OR documentada.  
   - **Objetivo:** Mantener el API consistente y fácilmente documentable.  
   - **Beneficios:** Menos mantenimiento, documentación más breve y client code reutilizable.  
   - **Referencia:** @docs/API.MD#15-27

## Metodología de crecimiento

1. **Iteraciones por capa completa**  
   - **Descripción:** Planificar incrementos que recorran DB → API → composables → UI, cerrando verticales completas antes de pasar al siguiente módulo.  
   - **Objetivo:** Reducir deuda técnica por piezas inconclusas y asegurar pruebas integrales.  
   - **Beneficios:** Feedback temprano, releases coherentes y priorización basada en valor funcional.  
   - **Referencia:** @docs/PROJECT_INFO.md#27-41

2. **Feature toggles por versión de contenido**  
   - **Descripción:** Gobernar despliegues de contenido mediante `content_versions` y su campo `release`, habilitando toggles en UI.  
   - **Objetivo:** Introducir cambios editoriales sin afectar producción hasta la etapa deseada.  
   - **Beneficios:** Control de releases granular, rollback rápido y comunicación clara a editores.  
   - **Referencia:** @docs/PROJECT_INFO.md#136-164

3. **Backlog orientado a efectos y mundos**  
   - **Descripción:** Seguir la hoja de ruta que prioriza consolidar cartas base, efectos y mundos antes de expansiones narrativas.  
   - **Objetivo:** Garantizar que los cimientos (editor, tablas, filtros) estén cerrados antes de nuevas mecánicas.  
   - **Beneficios:** Menor re-trabajo, arquitectura más robusta y alineación con visión de sistema universal.  
   - **Referencia:** @docs/PROJECT_INFO.md#99-113

## Filosofía de diseño global

1. **Paneles accesibles y consistentes**  
   - **Descripción:** Aprovechar NuxtUI 4 para construir paneles con diseño coherente, accesible y responsivo para administradores y editores.  
   - **Objetivo:** Garantizar que todas las vistas compartan patrones de interacción y accesibilidad WCAG.  
   - **Beneficios:** Curva de aprendizaje corta, reducción de errores de uso y cumplimiento legal.  
   - **Referencia:** @docs/PROJECT_INFO.md#8-10

2. **Componentes con narrativa lúdica**  
   - **Descripción:** Reflejar la temática Tarot en estilos, iconografía y estados, manteniendo equilibrio entre estética y claridad.  
   - **Objetivo:** Transmitir identidad de marca sin sacrificar usabilidad profesional.  
   - **Beneficios:** Diferenciación del producto, mayor adopción por comunidades creativas y engagement del staff.  
   - **Referencia:** @docs/PROJECT_INFO.md#2-41

3. **Datos enriquecidos en tiempo real**  
   - **Descripción:** Alinear UI con metadatos (tags, status, release) visibles y accionables desde tablas y detalles.  
   - **Objetivo:** Ofrecer contexto completo para decisiones editoriales en un solo vistazo.  
   - **Beneficios:** Menor navegación secundaria, tiempos de revisión más cortos y menos errores de publicación.  
   - **Referencia:** @docs/API.MD#205-227

4. **Visualización dual semántica/legacy**  
   - **Descripción:** Mantener la modalidad de efectos Legacy (Markdown) y el sistema semántico, permitiendo cambiar entre ellos según entidad.  
   - **Objetivo:** Respaldar equipos con contenidos antiguos mientras se migra gradualmente al sistema 2.0.  
   - **Beneficios:** Transición sin fricción, compatibilidad hacia atrás y mayor adopción del nuevo modelo.  
   - **Referencia:** @docs/PROJECT_INFO.md#143-148

## Coherencia entre frontend y server

1. **Contratos compartidos para entidades**  
   - **Descripción:** Derivar tipos de API directamente de la definición Kysely y exponerlos en composables para que la UI consuma datos sin transformaciones arbitrarias.  
   - **Objetivo:** Evitar divergencias cuando se añadan campos (p.ej. `release`, `metadata`).  
   - **Beneficios:** Refactors confiables, menor lógica de mapeo y reducción de bugs por campos faltantes.  
   - **Referencia:** @docs/SERVER.md#285-304

2. **Gestión uniforme de idiomas en UI y API**  
   - **Descripción:** Usar `lang` desde i18n Nuxt como fuente de verdad para `useFetch`/`useApiFetch`, replicando la lógica de fallback en componentes.  
   - **Objetivo:** Mostrar en UI los mismos valores que entrega el servidor, con resaltado cuando la traducción está en fallback.  
   - **Beneficios:** Experiencia multi-idioma consistente, menos tickets de QA y claridad para traductores.  
   - **Referencia:** @docs/SERVER.md#315-332

3. **Permisos y roles sincronizados**  
   - **Descripción:** Consumir el merge de permisos calculado en backend para activar/desactivar acciones UI, evitando lógica duplicada de autorización.  
   - **Objetivo:** Alinear controles visibles con lo que realmente acepta la API.  
   - **Beneficios:** Seguridad reforzada, UX clara y menor mantenimiento en cambios de roles.  
   - **Referencia:** @docs/API.MD#31-88
