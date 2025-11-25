# Sugerencias de evolución

1. **Panel de control inicial unificado**  
   - **Descripción del cambio:** Crear un dashboard SSR que consolide métricas clave (cartas por estado, feedback abierto, versiones pendientes) usando `useAsyncData`.  
   - **Objetivo del cambio:** Dar visibilidad inmediata al equipo editorial y técnico.  
   - **Beneficios que aporta:** Priorización basada en datos y reducción de tiempo para localizar tareas críticas.

2. **Command Palette global**  
   - **Descripción del cambio:** Implementar `UCommandPalette` con atajos de teclado para navegar a módulos, crear entidades y abrir filtros.  
   - **Objetivo del cambio:** Acelerar la interacción de usuarios avanzados.  
   - **Beneficios que aporta:** Mayor productividad y sensación de fluidez profesional.

3. **Historial contextual por entidad**  
   - **Descripción del cambio:** Añadir un panel lateral `EntityActivitySidebar` que liste revisiones, feedback y versiones asociadas.  
   - **Objetivo del cambio:** Permitir que editores consulten contexto sin abandonar el formulario.  
   - **Beneficios que aporta:** Decisiones más informadas y menos navegación redundante.

4. **Sistema de capacidades centralizado**  
   - **Descripción del cambio:** Crear `useEntityCapabilities` para definir banderas de funcionalidad (traducciones, tags, preview) por módulo.  
   - **Objetivo del cambio:** Unificar comportamiento entre `/admin` y `/manage`.  
   - **Beneficios que aporta:** Menor duplicación y mayor flexibilidad ante nuevas entidades.

5. **Refactor de CRUD generador**  
   - **Descripción del cambio:** Construir `createCrudHandlers` que emita handlers H3 con validaciones y respuestas estandarizadas.  
   - **Objetivo del cambio:** Reducir código repetido en rutas de servidor.  
   - **Beneficios que aporta:** Mantenibilidad y menor probabilidad de inconsistencias.

6. **Cache ETag transversal**  
   - **Descripción del cambio:** Incorporar generación de ETag en responses list/detalle y aprovecharlo en `useApiFetch`.  
   - **Objetivo del cambio:** Disminuir carga en DB y mejorar tiempos de respuesta.  
   - **Beneficios que aporta:** Rendimiento estable bajo tráfico creciente.

7. **Rate limiting y auditoría**  
   - **Descripción del cambio:** Añadir middleware de rate limiting para login y endpoints sensibles con logging estructurado.  
   - **Objetivo del cambio:** Fortalecer seguridad y trazabilidad.  
   - **Beneficios que aporta:** Mitigación de ataques y cumplimiento de buenas prácticas.

8. **Indicadores de traducción en UI**  
   - **Descripción del cambio:** Mostrar badges `Fallback` o `Sin traducción` en tablas y formularios cuando `language_code_resolved` difiere.  
   - **Objetivo del cambio:** Visibilizar pendientes de localización.  
   - **Beneficios que aporta:** Mejora del flujo de traducción y reducción de contenido inconsistente.

9. **AdvancedFiltersPanel reutilizable**  
   - **Descripción del cambio:** Construir componente base de filtros avanzados configurable por schema.  
   - **Objetivo del cambio:** Uniformar experiencia de filtrado en feedback, versiones y manage.  
   - **Beneficios que aporta:** Menor deuda de UI y curva de aprendizaje corta.

10. **DataTable declarativa con slots**  
    - **Descripción del cambio:** Extender `UTable` para aceptar definición de columnas, sorting, selección y acciones masivas.  
    - **Objetivo del cambio:** Centralizar la lógica de tablas en un solo componente.  
    - **Beneficios que aporta:** UX consistente y facilidad para añadir funcionalidades globales.

11. **Wizard de creación con guardado automático**  
    - **Descripción del cambio:** Introducir wizards multi-step que guarden borradores en Pinia o localStorage con TTL.  
    - **Objetivo del cambio:** Evitar pérdida de trabajo en procesos largos.  
    - **Beneficios que aporta:** Satisfacción del usuario y mejores tasas de finalización.

12. **Testing de composables con fixtures**  
    - **Descripción del cambio:** Crear factories de mocks para `useEntity` y similares, integrables en Vitest.  
    - **Objetivo del cambio:** Garantizar calidad sin depender del backend activo.  
    - **Beneficios que aporta:** Desarrollo paralelo y detección temprana de regresiones.

13. **Documentación viva para API y UI**  
    - **Descripción del cambio:** Generar Storybook/Mock Service Worker que consuma schemas Zod para generar ejemplos.  
    - **Objetivo del cambio:** Mantener documentación sincronizada con contratos reales.  
    - **Beneficios que aporta:** Onboarding rápido y soporte a QA automatizado.

14. **Automatización de migraciones**  
    - **Descripción del cambio:** Incorporar scripts Kysely para crear migraciones derivadas de cambios en tipos generados.  
    - **Objetivo del cambio:** Reducir errores manuales al evolucionar el esquema.  
    - **Beneficios que aporta:** Integridad de base y historial claro de cambios.

15. **Helpers de import/export con progreso**  
    - **Descripción del cambio:** Añadir barra de progreso y reportes detallados al subir/descargar catálogos.  
    - **Objetivo del cambio:** Mejorar UX en operaciones masivas.  
    - **Beneficios que aporta:** Confianza en operaciones y visibilidad de errores.

16. **Publicación de versiones orquestada**  
    - **Descripción del cambio:** Completar endpoints `publish`/`revert` y añadir UI para previsualización de cambios antes de publicar.  
    - **Objetivo del cambio:** Profesionalizar el flujo editorial.  
    - **Beneficios que aporta:** Control de releases y trazabilidad.

17. **Integración con Webhooks internos**  
    - **Descripción del cambio:** Añadir disparadores H3 que notifiquen a servicios internos cuando se publique una versión o se resuelva feedback.  
    - **Objetivo del cambio:** Automatizar procesos posteriores (builds, anuncios).  
    - **Beneficios que aporta:** Escalabilidad operativa y menor intervención manual.

18. **Modo oscuro accesible**  
    - **Descripción del cambio:** Afinar theme NuxtUI con tokens para modo oscuro respetando contraste WCAG.  
    - **Objetivo del cambio:** Mejorar ergonomía en sesiones largas.  
    - **Beneficios que aporta:** Fatiga visual reducida y atractivo para usuarios nocturnos.

19. **Spotlight de entidades relacionadas**  
    - **Descripción del cambio:** En formularios, añadir panel `RelatedEntities` que sugiera tags, cartas o efectos vinculados mediante consultas ligeras.  
    - **Objetivo del cambio:** Acelerar asociación semántica de contenidos.  
    - **Beneficios que aporta:** Consistencia narrativa y ahorro de tiempo.

20. **Validaciones Zod compartidas frontend/backend**  
    - **Descripción del cambio:** Extraer schemas a paquete compartido y generar tipos para formularios y API.  
    - **Objetivo del cambio:** Eliminar discrepancias de validación.  
    - **Beneficios que aporta:** Menos bugs y feedback inmediato en UI.

21. **Monitoreo de rendimiento server**  
    - **Descripción del cambio:** Integrar métricas (Prometheus/OpenTelemetry) capturando tiempos de query y ratios de cache.  
    - **Objetivo del cambio:** Observar salud del backend y detectar cuellos de botella.  
    - **Beneficios que aporta:** Escalabilidad planificada y alertas tempranas.

22. **Estratégia de CDN para assets**  
    - **Descripción del cambio:** Servir imágenes AVIF y assets estáticos via CDN configurado en Nitro (Nitro preset + headers).  
    - **Objetivo del cambio:** Optimizar entrega de imágenes de cartas y avatares.  
    - **Beneficios que aporta:** Carga más rápida y menor uso de ancho de banda.

23. **Feature flags basadas en versiones**  
    - **Descripción del cambio:** Exponer `content_versions.release` como toggles en frontend (ej. mostrar features beta sólo si release ≥ beta).  
    - **Objetivo del cambio:** Coordinar rollout de funcionalidades con contenido.  
    - **Beneficios que aporta:** Control granular y experimentación segura.

24. **CLI interna para operaciones editoriales**  
    - **Descripción del cambio:** Crear script Node que use la API para importar/exportar, clonar mundos y gestionar tags en lote.  
    - **Objetivo del cambio:** Empoderar al equipo sin depender del panel UI.  
    - **Beneficios que aporta:** Automatización y reducción de tareas repetitivas.

25. **Integración con Markdown enriquecido**  
    - **Descripción del cambio:** Implementar editor markdown con preview para campos legacy y diffs de revisiones.  
    - **Objetivo del cambio:** Facilitar la edición narrativa manteniendo compatibilidad.  
    - **Beneficios que aporta:** Calidad en el contenido y adopción del sistema legado.

26. **Notificaciones in-app y por correo**  
    - **Descripción del cambio:** Añadir sistema de notificaciones cuando se asigna feedback o se publica una versión.  
    - **Objetivo del cambio:** Mantener a los usuarios informados sin vigilancia constante del panel.  
    - **Beneficios que aporta:** Respuesta más rápida a incidencias y engagement del equipo.

27. **Compatibilidad móvil optimizada**  
    - **Descripción del cambio:** Ajustar layouts con breakpoints específicos y componentes responsive (cards apiladas, filtros compactos).  
    - **Objetivo del cambio:** Permitir consultas rápidas desde tablet/móvil.  
    - **Beneficios que aporta:** Acceso ubicuo y mayor flexibilidad de trabajo.

28. **Automatización de traducciones base**  
    - **Descripción del cambio:** Integrar pipeline con servicios de traducción automática que propongan borradores marcados como `needs_review`.  
    - **Objetivo del cambio:** Acelerar la cobertura inicial de idiomas.  
    - **Beneficios que aporta:** Reducción de tiempo de localización y soporte multilingüe más rápido.

29. **Preview SSR de cartas**  
    - **Descripción del cambio:** Generar vistas previas SSR de cartas y efectos para compartir enlaces públicos controlados.  
    - **Objetivo del cambio:** Permitir validación externa y marketing sin exponer panel interno.  
    - **Beneficios que aporta:** Feedback temprano de stakeholders y promoción segura.

30. **Playground de efectos interactivo**  
    - **Descripción del cambio:** Crear herramienta que evalúe `card_effects` y `effect_type` en vivo mostrando resultados semánticos.  
    - **Objetivo del cambio:** Validar reglas antes de publicar.  
    - **Beneficios que aporta:** Menos errores en gameplay y documentación dinámica.
