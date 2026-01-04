# 🗺️ Roadmap de Desarrollo - Tarot2

## 1. Visión del Roadmap

Este roadmap define el plan de trabajo para consolidar Tarot2, eliminar deuda técnica y preparar nuevas funcionalidades. Se organiza en fases incrementales con objetivos claros.

---

## 2. Fases del Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROADMAP TAROT2                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   FASE 0          FASE 1           FASE 2           FASE 3                  │
│   Cimientos       Convergencia     Observabilidad   Expansión               │
│   ─────────       ────────────     ──────────────   ─────────               │
│   • Seguridad     • Tablas         • Métricas       • Effects 2.0           │
│   • Rate limit    • Formularios    • requestId      • Dashboard i18n        │
│   • Logout        • Previews       • Alertas        • Storybook             │
│                   • Accesibilidad                                           │
│                                                                              │
│   [COMPLETADO]    [EN PROGRESO]    [PLANIFICADO]    [FUTURO]               │
│                                                                              │
│   2 semanas       4 semanas        3 semanas        6+ semanas              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Fase 0: Cimientos (COMPLETADO ✅)

**Objetivo:** Securizar la base y completar infraestructura crítica.

### Tareas Completadas

| Tarea | Impacto | Estado |
|-------|---------|--------|
| Rate limiting en login/logout | 🔥 Alta | ✅ |
| Limpieza cookie en logout | 🔥 Alta | ✅ |
| Rate limiting en publish/revert | 🔥 Alta | ✅ |
| Documentación de seguridad | Media | ✅ |

### Entregables

- ✅ Middleware `02.rate-limit.ts` configurado
- ✅ Logout limpia cookie correctamente
- ✅ Logs de rate limit implementados
- ✅ Documentación SECURITY.md actualizada

---

## 4. Fase 1: Convergencia UI (EN PROGRESO 🔄)

**Objetivo:** Unificar UI Admin y eliminar componentes legacy.

### 4.1 Fase 1A: Convergencia Core

| Tarea | Impacto | Esfuerzo | Estado |
|-------|---------|----------|--------|
| Migrar VersionList → AdminTableBridge | Alta | Medio | 🔄 Pendiente |
| Migrar RevisionsTable → AdminTableBridge | Alta | Medio | 🔄 Pendiente |
| Eliminar PreviewModal → EntityInspectorDrawer | Alta | Bajo | 🔄 Pendiente |
| Normalizar USelectMenu a v-model | Media | Bajo | 🔄 Pendiente |

### 4.2 Fase 1B: Convergencia Completa

| Tarea | Impacto | Esfuerzo | Estado |
|-------|---------|----------|--------|
| Migrar UserTable → AdminTableBridge | Media | Medio | 📋 Planificado |
| Migrar RoleForm → FormModal + presets | Media | Medio | 📋 Planificado |
| ~~Crear BulkActionsBar compartida~~ | - | - | ✅ **Ya existe** |
| ~~Implementar useTableSelection~~ | - | - | ✅ **Ya existe** |
| Expandir StatusBadge a Admin | Baja | Bajo | 📋 Planificado |

> **Nota (actualización post-auditoría):** `useTableSelection` y `BulkActionsBar` ya están implementados en el código actual. Ver [Anexo: Auditoría de Código](./13-ANEXO-AUDITORIA-CODIGO.md).

### Entregables Esperados

- [ ] Todas las tablas Admin usando bridges
- [ ] PreviewModal eliminado
- [x] ~~useTableSelection implementado~~ (ya existe)
- [x] ~~BulkActionsBar en producción~~ (ya existe)
- [ ] 0 componentes legacy

### Criterios de Aceptación

1. Todas las tablas renderizan con CommonDataTable
2. Previews usan EntityInspectorDrawer
3. Bulk actions funcionan uniformemente
4. No hay warnings de USelectMenu
5. Tests manuales pasan (CRUD, bulk, preview, filtros)

---

## 5. Fase 2: Observabilidad (PLANIFICADO 📋)

**Objetivo:** Instrumentar métricas y logging para visibilidad operativa.

### Tareas

| Tarea | Impacto | Esfuerzo | Dependencias |
|-------|---------|----------|--------------|
| Implementar useRequestMetrics | Media | Medio | Ninguna |
| Añadir requestId correlacionado | Media | Medio | Ninguna |
| Métricas editoriales (publish/revert) | Media | Medio | Ninguna |
| Optimizar preview SSR con lazy-load | Media | Medio | Ninguna |
| Medir ratio 304/200 | Baja | Bajo | Ninguna |
| Dashboard de métricas | Baja | Alto | Métricas implementadas |

### Entregables Esperados

- [ ] requestId en todos los logs
- [ ] Métricas de publish/revert expuestas
- [ ] useRequestMetrics disponible
- [ ] Documentación de métricas

### Criterios de Aceptación

1. requestId propagado en respuestas API
2. Métricas disponibles en formato Prometheus/OTLP
3. Logs correlacionables front↔back
4. Ratio 304/200 medible

---

## 6. Fase 3: Expansión Narrativa (FUTURO 🔮)

**Objetivo:** Nuevos sistemas de contenido y herramientas.

### Tareas

| Tarea | Impacto | Esfuerzo | Dependencias |
|-------|---------|----------|--------------|
| Effect System 2.0 (editor guiado) | Alta | Alto | Fase 1 completada |
| Metadata extendida para mundos/mazos | Media | Medio | Diseño aprobado |
| Dashboard i18n | Media | Medio | API de cobertura |
| Storybook/MDX componentes | Baja | Alto | Tiempo disponible |
| Generador CLI de entidades | Baja | Medio | Plantillas definidas |

### Entregables Esperados

- [ ] Editor visual de efectos funcional
- [ ] Dashboard de cobertura i18n
- [ ] Documentación Storybook básica

---

## 7. Backlog General

### UI / Componentes

| Tarea | Prioridad | Esfuerzo |
|-------|-----------|----------|
| Skeletons reutilizables | Media | Bajo |
| Toolbar declarativa por entidad | Media | Medio |
| Chips y badges unificados en Admin | Baja | Bajo |
| Tema oscuro | Baja | Medio |

### Backend

| Tarea | Prioridad | Esfuerzo |
|-------|-----------|----------|
| Helper SQL tags AND/ANY | Alta | Medio |
| Límites en import/export | Media | Bajo |
| Mejorar logging publish/revert | Media | Bajo |
| Rate limit distribuido (Redis) | Baja | Alto |

### i18n

| Tarea | Prioridad | Esfuerzo |
|-------|-----------|----------|
| Radar de cobertura | Media | Medio |
| Auto-sugerencias de traducción | Baja | Medio |
| Soporte más idiomas | Baja | Alto |

### Testing

| Tarea | Prioridad | Esfuerzo |
|-------|-----------|----------|
| Setup Playwright | Alta | Medio |
| Tests e2e críticos | Alta | Alto |
| Tests unitarios composables | Media | Medio |

---

## 8. Calendario Tentativo

```
Semana 1-2:   Fase 1A (VersionList, RevisionsTable, PreviewModal)
Semana 3-4:   Fase 1B (UserTable, RoleForm, useTableSelection)
Semana 5-6:   Fase 1B (BulkActionsBar, StatusBadge, cleanup)
Semana 7-8:   Fase 2 (requestId, métricas básicas)
Semana 9-10:  Fase 2 (dashboard métricas, optimizaciones)
Semana 11+:   Fase 3 (Effect System 2.0, dashboard i18n)
```

---

## 9. Reglas de Ejecución

### 9.1 Antes de Cada Tarea

- [ ] Revisar documentación relacionada
- [ ] Verificar dependencias completadas
- [ ] Consultar CodeMaps y MCPs

### 9.2 Durante la Implementación

- [ ] Seguir patrones existentes
- [ ] No crear componentes fuera de estructura
- [ ] Documentar decisiones en código

### 9.3 Antes de Completar

- [ ] Ejecutar checklist QA manual
- [ ] Actualizar documentación afectada
- [ ] Regenerar informes si aplica

---

## 10. Checklist QA por Fase

### Fase 1

- [ ] CRUD funciona en todas las tablas migradas
- [ ] Bulk actions seleccionan/deseleccionan correctamente
- [ ] Preview drawer abre/cierra sin errores
- [ ] Filtros y paginación funcionan
- [ ] No hay errores en consola
- [ ] SSR funciona correctamente

### Fase 2

- [ ] requestId aparece en logs
- [ ] Métricas se exportan correctamente
- [ ] Dashboard muestra datos reales
- [ ] No hay degradación de performance

### Fase 3

- [ ] Editor de efectos guarda correctamente
- [ ] Preview de efectos es preciso
- [ ] Dashboard i18n muestra cobertura real
- [ ] Storybook renderiza componentes

---

## 11. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Regresiones en tablas | Media | Alto | Tests manuales exhaustivos |
| Métricas impactan performance | Baja | Medio | Sampling configurable |
| Effect System complejo | Alta | Medio | Prototipo iterativo |
| Falta de tiempo | Media | Alto | Priorizar alta impacto |

---

## 12. Uso del Roadmap

### Para Desarrolladores

1. Consultar este documento antes de iniciar trabajo
2. Verificar en qué fase está la tarea
3. Revisar dependencias y criterios de aceptación
4. Actualizar estado al completar

### Para Coordinación

1. Revisar progreso semanal
2. Ajustar prioridades según necesidades
3. Comunicar cambios en el roadmap
4. Mantener documentación actualizada

---

*Este roadmap es un documento vivo que debe actualizarse conforme avanza el proyecto.*
