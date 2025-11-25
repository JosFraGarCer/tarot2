# Hoja de Ruta del Proyecto Tarot – v2025.11.22

## 1. Visión general
Plan estratégico para evolucionar Tarot con foco en arquitectura limpia, SSR-first, multi-idioma consistente y paneles administrativos productivos. Se prioriza cerrar fundamentos compartidos (capabilities, tablas comunes, CRUD generadores) y luego escalar UI/UX, composables y crecimiento futuro. Horizonte estimado: 4–5 meses con iteraciones quincenales.

---

## 2. Fase 1 – Fundamentos
### Objetivos
- Alinear principios arquitectónicos y contratos compartidos frontend/backend.
- Establecer capacidades comunes (i18n, permisos, logging, SSR).
- Sentar metodología de crecimiento vertical (DB → API → composables → UI).

### Tareas (orden recomendado)
1. Definir guía de arquitectura y metodología (documento interno, revisiones).  
   - Impacto: alto | Dificultad: baja | Tiempo: 1 semana.  
2. Formalizar SSR-first + ETag en `useApiFetch`.  
   - Impacto: alto | Dificultad: media | Tiempo: 1.5 semanas.  
   - Dependencia: 1.  
3. Implementar indicadores de fallback de idioma (API + UI).  
   - Impacto: alto | Dificultad: media | Tiempo: 1 semana.  
   - Dependencia: 2.  
4. Actualizar logging transversal (backend + frontend).  
   - Impacto: medio | Dificultad: media | Tiempo: 0.5 semana.

### Dependencias
- T2 depende de T1; T3 depende de T2.

### Entregables
- Documento de principios y metodología.
- `useApiFetch` revisado con SSR/ETag.
- API y UI devolviendo `isFallback`.
- Logger configurado con campos estándar.

### Resultado esperado
Equipo alineado con fundamentos, SSR estable, multi-idioma consistente y observabilidad transversal lista.

---

## 3. Fase 2 – Backend / Server
### Objetivos
- Reducir duplicaciones en CRUD.
- Mejorar seguridad, i18n y utilidades de import/export.
- Ordenar rutas, permisos y consistencia de respuestas.

### Tareas
1. Generador `createCrudHandlers` + Zod schemas por entidad.  
   - Impacto: alto | Dificultad: alta | Tiempo: 3 semanas.  
   - Dependencia: Fase 1 completada.  
2. Helper transaccional para create/update traducibles.  
   - Impacto: alto | Dificultad: media | Tiempo: 1 semana.  
   - Dependencia: 1.  
3. Helper `deleteLocalizedEntity` y alias `/api/users`.  
   - Impacto: medio | Dificultad: media | Tiempo: 0.5 semana.  
   - Dependencia: 2.  
4. Completar endpoints `publish`/`revert` de versiones con autorización declarativa.  
   - Impacto: alto | Dificultad: media | Tiempo: 1.5 semanas.  
   - Dependencia: 1.  
5. Logout efectivo + rate limiting + auditoría.  
   - Impacto: alto | Dificultad: media | Tiempo: 1 semana.  
6. Helper `entityTransferService` (import/export) y `parseQuery`.  
   - Impacto: medio | Dificultad: media | Tiempo: 1 semana.

### Dependencias
- 2 depende de 1; 3 depende de 2; 4 depende de 1; 5 independiente tras 1; 6 depende de 1 para integración.

### Entregables
- Toolkit CRUD reutilizable y documentación de uso.
- Helpers transaccionales y de borrado.
- Endpoints publish/revert operativos.
- Middleware de logout y rate limiting configurado.
- Servicio de import/export unificado y query validator.

### Resultado esperado
Backend modular con seguridad reforzada, i18n coherente, y rutas alineadas a la documentación.

---

## 4. Fase 3 – Frontend / Componentes
### Objetivos
- Unificar tablas y filtros con NuxtUI 4.
- Mejorar formularios y UX de paneles.
- Centralizar componentes comunes (JsonModal, preview, badges).

### Tareas
1. Mover `JsonModal` y establecer `CommonDataTable` + `AdvancedFiltersPanel`.  
   - Impacto: alto | Dificultad: media | Tiempo: 2 semanas.  
2. Implementar `useEntityCapabilities` (provide/inject) y columnas dinámicas.  
   - Impacto: alto | Dificultad: media-alta | Tiempo: 2 semanas.  
   - Dependencia: 1.  
3. Formularios multi-tab con indicadores de fallback + badges de release.  
   - Impacto: medio | Dificultad: media | Tiempo: 1.5 semanas.  
   - Dependencia: 2.  
4. Barra de acciones masivas + selección múltiple en tabla.  
   - Impacto: medio | Dificultad: media | Tiempo: 1 semana.  
   - Dependencia: 2.  
5. Dashboard inicial con métricas clave.  
   - Impacto: medio | Dificultad: media | Tiempo: 1 semana.  
   - Dependencia: 1, 2.

### Entregables
- Componentes comunes (`CommonDataTable`, `AdvancedFiltersPanel`, badges).
- Capabilities funcionando en admin/manage.
- Formularios tabulados con indicadores.
- Dashboard SSR.

### Resultado esperado
Paneles coherentes, accesibles, y productivos con componentes reutilizables.

---

## 5. Fase 4 – Composables e Integración
### Objetivos
- Reestructurar hooks por dominio y responsabilidades.
- Reutilizar lógica común (query sync, meta, batch).
- Potenciar `useEntity` y operaciones masivas.

### Tareas
1. Reorganizar carpetas + índices por dominio.  
   - Impacto: medio | Dificultad: media | Tiempo: 0.5 semana.  
   - Dependencia: Fase 3 (componentes listos).  
2. Crear `useQuerySync`, `useListMeta`, `useEntityPreviewFetch`, `useBatchMutation`.  
   - Impacto: alto | Dificultad: media | Tiempo: 1.5 semanas.  
   - Dependencia: 1.  
3. Revisar `useEntity` con `useEntityCapabilities`, cache in-memory y manejo de errores estándar.  
   - Impacto: alto | Dificultad: media | Tiempo: 1.5 semanas.  
   - Dependencia: 2.  
4. Integrar `useEntityExport/Import` y wizard de creación con borrador Pinia.  
   - Impacto: medio | Dificultad: media | Tiempo: 2 semanas.  
   - Dependencia: 2, 3.  
5. Testing con fixtures/mocks para composables clave.  
   - Impacto: medio | Dificultad: media | Tiempo: 1 semana.  
   - Dependencia: 3.

### Entregables
- Árbol `composables/` reorganizado.
- Hooks comunes listos y documentados.
- `useEntity` actualizado con capacidades, cache y errores.
- Test suite básica para hooks.

### Resultado esperado
Capa de datos coherente, fácil de testear y alineada con la UI.

---

## 6. Fase 5 – Optimización avanzada
### Objetivos
- Afinar rendimiento, UX avanzada y control editorial.
- Aplicar mejoras de seguridad, monitoreo e integraciones.

### Tareas
1. Implementar Command Palette, modo compacto en tablas y shortcuts.  
   - Impacto: medio | Dificultad: media | Tiempo: 1.5 semanas.  
   - Dependencia: Fases 3–4 completas.  
2. EntityActivitySidebar + RelatedEntities panel.  
   - Impacto: medio | Dificultad: media | Tiempo: 2 semanas.  
3. SSR previews de cartas, playground de efectos, editor Markdown enriquecido.  
   - Impacto: medio | Dificultad: alta | Tiempo: 3 semanas.  
   - Dependencia: 2.  
4. Integración con notificaciones, webhooks internos, monitoreo (Prometheus/OTel).  
   - Impacto: alto | Dificultad: alta | Tiempo: 3 semanas.  
   - Dependencia: 3.  
5. CDN para assets y modo oscuro accesible.  
   - Impacto: medio | Dificultad: media | Tiempo: 1.5 semanas.

### Entregables
- UX avanzada disponible en paneles.
- Herramientas de preview y validación de efectos.
- Sistema de notificaciones y monitoreo configurado.
- Mejores tiempos de carga y modo oscuro.

### Resultado esperado
Plataforma madura con UX premium y observabilidad completa.

---

## 7. Fase 6 – Sugerencias y futuro crecimiento
### Objetivos
- Materializar ideas estratégicas de largo plazo.
- Potenciar escalabilidad, automatización y growth.

### Tareas (ejecutar según capacidad)
1. Feature flags basados en versiones & automation (scripts CLI).  
   - Impacto: alto | Dificultad: media | Tiempo: 2 semanas.  
2. Automatización de traducciones base con `needs_review`.  
   - Impacto: medio | Dificultad: alta | Tiempo: 3 semanas.  
3. Integración de webhooks para builds/anuncios + notificaciones correo.  
   - Impacto: medio | Dificultad: media | Tiempo: 2 semanas.  
4. Estrategia de crecimiento: previews públicos, marketing y acceso móvil optimizado.  
   - Impacto: medio | Dificultad: media | Tiempo: 2 semanas.  
5. Experimentos de growth (Command Palette extendida, dashboards específicos, etc.).  
   - Impacto: variable | Dificultad: baja-media | Tiempo: continuo.

### Entregables
- Sistema de flags ligado a `content_versions`.
- Pipeline de traducción automática supervisada.
- CLI y webhooks operativos.
- Plan de crecimiento (doc) con hitos de marketing/UX.

### Resultado esperado
Roadmap de innovación sustentable con bases técnicas sólidas.

---

## 8. Checklist general
- [ ] Principios y metodología documentados y aplicados.
- [ ] `useApiFetch` SSR + ETag desplegado.
- [ ] API y UI con indicador `isFallback`.
- [ ] CRUD generator y helpers transaccionales en producción.
- [ ] Rutas `content_versions` con publish/revert y autorización declarativa activas.
- [ ] Logout limpia cookie, rate limiting y auditoría habilitados.
- [ ] `CommonDataTable`, `AdvancedFiltersPanel`, `JsonModal` común y capabilities operativos.
- [ ] Formularios multilingües con badges y tabs implementados.
- [ ] `composables/` reorganizado y hooks comunes (`useQuerySync`, `useListMeta`, `useEntityPreviewFetch`, `useBatchMutation`) en uso.
- [ ] Wizard de creación con guardado en borrador y export/import helpers listos.
- [ ] Suite de tests de composables y fixtures mock.
- [ ] Dashboard, Command Palette, acciones masivas y UX avanzada desplegados.
- [ ] Notificaciones, webhooks, monitoreo y CDN configurados.
- [ ] Feature flags, CLI y automatización de traducciones planificados y en marcha.

Cumplir la checklist confirma que todas las fases alcanzaron sus entregables y objetivos.