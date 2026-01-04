# 🚀 Mejoras Futuras - Tarot2

## 1. Metodología de Evaluación

Cada mejora se evalúa según:

| Criterio | Peso | Descripción |
|----------|------|-------------|
| **Impacto** | 40% | Beneficio para usuarios/desarrolladores |
| **Esfuerzo** | 30% | Tiempo y complejidad de implementación |
| **Riesgo** | 20% | Probabilidad de problemas |
| **Dependencias** | 10% | Bloqueos con otras tareas |

**Escala:**
- 🟢 Alto beneficio / Bajo esfuerzo
- 🟡 Beneficio medio / Esfuerzo medio
- 🔴 Bajo beneficio / Alto esfuerzo

---

## 2. Mejoras de Alta Prioridad

### 2.1 Migrar Tablas Legacy a Bridges 🟢

**Descripción:** Migrar `VersionList.vue`, `RevisionsTable.vue`, `UserTable.vue` a `AdminTableBridge` + `CommonDataTable`.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐⭐⭐ Unifica UI, reduce mantenimiento |
| Esfuerzo | ⭐⭐⭐ Medio, 2-3 días por componente |
| Riesgo | ⭐⭐ Bajo, patrones probados |
| ROI | 🟢 **Excelente** |

**Beneficios:**
- Elimina código duplicado (~500 líneas)
- Habilita bulk actions uniformes
- Mejora accesibilidad automáticamente
- Facilita mantenimiento futuro

**Pasos:**
1. Definir columnas específicas para cada tabla
2. Crear configuración de capabilities
3. Migrar lógica de acciones a slots
4. Eliminar componentes legacy

---

### 2.2 Eliminar PreviewModal → EntityInspectorDrawer 🟢

**Descripción:** Reemplazar modal legacy por drawer accesible en todo Manage.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐⭐ UX consistente, accesibilidad |
| Esfuerzo | ⭐⭐ Bajo, 1 día |
| Riesgo | ⭐ Muy bajo |
| ROI | 🟢 **Excelente** |

**Beneficios:**
- Focus trap implementado
- Retorno de foco al cerrar
- Tabs extensibles
- ARIA compliance

---

### 2.3 ~~Implementar useTableSelection~~ ✅ YA IMPLEMENTADO

**Estado:** Este composable **ya existe** en `/app/composables/common/useTableSelection.ts` (126 líneas).

**Características implementadas:**
- ✅ `selectedIds` como `ShallowRef<Set<number>>`
- ✅ `selectedList` como computed array
- ✅ `toggleOne`, `toggleAll`, `clear`, `isSelected`
- ✅ `isAllSelected`, `isIndeterminate` para checkbox header
- ✅ Normalización de IDs (string → number)

```typescript
// API real implementada
const { 
  selectedIds,
  selectedList,
  toggleOne,
  toggleAll,
  isSelected,
  isAllSelected,
  isIndeterminate,
  clear
} = useTableSelection(getVisibleIds)
```

> **Nota:** La documentación previa era incorrecta. No se requiere implementación adicional.

---

### 2.4 Helper SQL para Tags AND/ANY 🟡

**Descripción:** Extraer lógica repetida de filtrado de tags a utility compartida.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐ Consistencia en filtros |
| Esfuerzo | ⭐⭐⭐ Medio, 2-3 días |
| Riesgo | ⭐⭐ Medio, SQL sensible |
| ROI | 🟡 **Bueno** |

**Beneficios:**
- Elimina inconsistencias entre entidades
- Facilita añadir semántica AND
- Reduce errores en nuevos filtros
- Código más mantenible

```typescript
// API propuesta
buildTagFilter(qb, {
  tags: ['combat', 'fire'],
  mode: 'any' | 'all',
  entityType: 'base_card'
})
```

---

## 3. Mejoras de Media Prioridad

### 3.1 Effect System 2.0 en FormModal 🟡

**Descripción:** Editor guiado para `card_effects` con validación y preview.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐⭐⭐ Feature crítica para contenido |
| Esfuerzo | ⭐⭐⭐⭐ Alto, 2-3 semanas |
| Riesgo | ⭐⭐⭐ Medio, UI compleja |
| ROI | 🟡 **Bueno** (alto impacto pero alto esfuerzo) |

**Beneficios:**
- Edición visual de efectos estructurados
- Validación Zod en tiempo real
- Preview dinámico
- Transición gradual desde legacy

**Componentes:**
- `EffectBuilder.vue` - Constructor visual
- `EffectPreview.vue` - Preview renderizado
- `useEffectValidation` - Validación Zod

---

### 3.2 Dashboard de Cobertura i18n 🟡

**Descripción:** Panel que muestra porcentaje de traducciones por entidad/idioma.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐ Priorización de traducciones |
| Esfuerzo | ⭐⭐⭐ Medio, 1 semana |
| Riesgo | ⭐ Bajo |
| ROI | 🟡 **Bueno** |

**Beneficios:**
- Visibilidad de gaps de traducción
- Export CSV para traductores
- Alertas de regresión
- Métricas de progreso

---

### 3.3 Observabilidad con Métricas Editoriales 🟡

**Descripción:** Instrumentar publish/revert para emitir métricas a OTLP/Prometheus.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐⭐ Visibilidad operativa |
| Esfuerzo | ⭐⭐⭐ Medio, 1-2 semanas |
| Riesgo | ⭐⭐ Bajo |
| ROI | 🟡 **Bueno** |

**Métricas propuestas:**
- `tarot_publish_total` - Publicaciones totales
- `tarot_publish_duration_ms` - Duración de publicación
- `tarot_revisions_published` - Revisiones por publicación
- `tarot_revert_total` - Reverts totales

---

### 3.4 Skeletons Reutilizables 🟡

**Descripción:** Componentes de loading (SkeletonTable, SkeletonCard) unificados.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐ UX percibida mejorada |
| Esfuerzo | ⭐⭐ Bajo, 2-3 días |
| Riesgo | ⭐ Muy bajo |
| ROI | 🟡 **Bueno** |

**Componentes:**
- `SkeletonDataTable.vue` - Skeleton para tablas
- `SkeletonCard.vue` - Skeleton para cards
- `SkeletonDrawer.vue` - Skeleton para drawer

---

## 4. Mejoras de Baja Prioridad

### 4.1 Storybook para Componentes Core 🔴

**Descripción:** Documentación visual con MDX para CommonDataTable, bridges, modales.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐ DX mejorada |
| Esfuerzo | ⭐⭐⭐⭐ Alto, 2-3 semanas |
| Riesgo | ⭐⭐ Setup inicial |
| ROI | 🔴 **Diferido** |

**Justificación para diferir:**
- Proyecto pequeño/equipo conoce código
- Documentación markdown suficiente por ahora
- Priorizar features sobre tooling

---

### 4.2 Rotación Automática de JWT 🔴

**Descripción:** Soporte para múltiples claves JWT con rotación automática.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐ Seguridad mejorada |
| Esfuerzo | ⭐⭐⭐⭐ Alto |
| Riesgo | ⭐⭐⭐ Complejidad auth |
| ROI | 🔴 **Diferido** |

**Justificación para diferir:**
- Sistema actual es seguro para uso interno
- Complejidad operativa añadida
- Beneficio marginal para caso de uso

---

### 4.3 PWA / Offline Support 🔴

**Descripción:** Service worker para funcionamiento offline parcial.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐ Caso de uso limitado |
| Esfuerzo | ⭐⭐⭐⭐ Alto |
| Riesgo | ⭐⭐⭐ Sincronización compleja |
| ROI | 🔴 **Diferido** |

---

## 5. Matriz de Priorización

```
                    IMPACTO
                    Alto │ Medio │ Bajo
               ─────────┼───────┼──────
        Bajo   │  🟢🟢  │  🟢   │  🟡
ESFUERZO       │   │    │       │
        Medio  │  🟢   │  🟡   │  🔴
               │       │       │
        Alto   │  🟡   │  🔴   │  🔴

🟢 = Hacer ahora
🟡 = Planificar
🔴 = Diferir
```

---

## 6. Orden de Implementación Recomendado

### Sprint 1 (2 semanas)
1. ✅ Migrar VersionList → AdminTableBridge
2. ✅ Migrar RevisionsTable → AdminTableBridge
3. ✅ Eliminar PreviewModal

### Sprint 2 (2 semanas)
1. ✅ Migrar UserTable → AdminTableBridge
2. ✅ Implementar useTableSelection
3. ✅ Crear BulkActionsBar compartida

### Sprint 3 (2 semanas)
1. ✅ Helper SQL tags AND/ANY
2. ✅ Normalizar v-model en componentes
3. ✅ Añadir aria-labels

### Sprint 4 (3 semanas)
1. 🔄 Effect System 2.0 (inicio)
2. 🔄 Dashboard i18n
3. 🔄 Skeletons reutilizables

### Sprint 5 (2 semanas)
1. 🔄 Effect System 2.0 (finalización)
2. 🔄 Métricas editoriales
3. 🔄 Documentación actualizada

---

## 7. Estimación de Recursos

| Mejora | Días Dev | Días QA | Total |
|--------|----------|---------|-------|
| Migrar tablas Admin | 6 | 2 | 8 |
| Eliminar PreviewModal | 1 | 0.5 | 1.5 |
| useTableSelection | 3 | 1 | 4 |
| BulkActionsBar | 2 | 1 | 3 |
| Helper tags | 3 | 2 | 5 |
| Effect System 2.0 | 15 | 5 | 20 |
| Dashboard i18n | 5 | 2 | 7 |
| Métricas | 7 | 2 | 9 |
| Skeletons | 2 | 1 | 3 |
| **Total** | **44** | **16.5** | **60.5** |

---

## 8. Dependencias entre Mejoras

```
┌─────────────────────────────────────────────────────────────────┐
│                    GRAFO DE DEPENDENCIAS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Migrar tablas ──────▶ useTableSelection ──────▶ BulkActionsBar │
│       │                                                          │
│       └──────────────▶ Skeletons                                │
│                                                                  │
│  Helper tags ─────────────────────────────────────▶ (ninguna)   │
│                                                                  │
│  Effect System 2.0 ──▶ FormModal updates ──▶ Docs              │
│                                                                  │
│  Dashboard i18n ──────▶ API endpoint ──────▶ UI                 │
│                                                                  │
│  Métricas ────────────▶ Setup OTLP ───────▶ Dashboard          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Riesgos por Mejora

| Mejora | Riesgo | Mitigación |
|--------|--------|------------|
| Migrar tablas | Regresión funcional | Tests manuales exhaustivos |
| useTableSelection | Inconsistencias | Diseño API primero |
| Helper tags | SQL rota | Tests multi-idioma |
| Effect System | Complejidad UI | Prototipo antes |
| Métricas | Overhead perf | Sampling configurable |

---

## 10. Métricas de Éxito

| Mejora | KPI | Objetivo |
|--------|-----|----------|
| Migrar tablas | Componentes legacy | 0 |
| useTableSelection | Código duplicado | -300 líneas |
| Helper tags | Bugs de filtrado | -50% |
| Effect System | Errores de efectos | -80% |
| Dashboard i18n | Cobertura ES | 100% |
| Métricas | Visibilidad editorial | +100% |

---

## 11. Mejoras del Sistema de Juego TTRPG 🎲

> **Nueva sección:** Funcionalidades críticas para el gameplay de Proyecto Tarot

### 11.1 Tirador de Dados "Giro Tarot" 🟢

**Descripción:** Componente especializado para el sistema 2d12.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐⭐⭐ Core del sistema de juego |
| Esfuerzo | ⭐⭐ Bajo, 1 semana |
| Riesgo | ⭐ Muy bajo |
| ROI | 🟢 **Crítico** |

**Características:**
- Dos dados visuales: Habilidad (azul) + Destino (dorado)
- Cálculo automático: Escala del Destino (-6 a +6)
- Detección del "Giro del Destino" (dados iguales, ~8%)
- Integración con Character Sheet

---

### 11.2 Calculadora de Combate Decisivo 🟢

**Descripción:** Resolución automática de ataques.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐⭐⭐ Combates 75% más rápidos |
| Esfuerzo | ⭐⭐ Bajo, 1 semana |
| Riesgo | ⭐ Muy bajo |
| ROI | 🟢 **Crítico** |

**Características:**
- Input: d12 + Faceta + Competencia + Talento vs Dificultad
- Bonus de daño por margen (+1/+2/+3)
- Aplicación automática de Protección (mínimo 1)
- Log narrativo de combate

---

### 11.3 Tracker de Estados de Herida 🟢

**Descripción:** Gestión visual de Aguante y penalizadores.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐⭐ Balance del combate |
| Esfuerzo | ⭐⭐ Bajo, 3 días |
| Riesgo | ⭐ Muy bajo |
| ROI | 🟢 **Excelente** |

**Estados:**
- Ileso (76-100%): Sin penalización
- Herido (51-75%): -1 a tiradas
- Malherido (26-50%): -2 a tiradas
- Crítico (1-25%): -3 a tiradas, Golpe de Gracia disponible

---

### 11.4 Panel de Potencias y Devoción 🟢

**Descripción:** Gestión del recurso de fe del personaje.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐⭐ Feature narrativa clave |
| Esfuerzo | ⭐⭐ Bajo, 3 días |
| Riesgo | ⭐ Muy bajo |
| ROI | 🟢 **Excelente** |

**Características:**
- Tracker visual de Devoción (0-5)
- Botones: Intervención Menor (1 PD) / Mayor (3 PD)
- Dogmas de la Potencia visibles
- Log de uso en sesión

---

### 11.5 Selector de las 5 Cartas 🟡

**Descripción:** Wizard visual para las cartas fundamentales.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐⭐⭐ Core de creación de PJ |
| Esfuerzo | ⭐⭐⭐ Medio, 2 semanas |
| Riesgo | ⭐⭐ Bajo |
| ROI | 🟡 **Bueno** |

**Cartas:**
1. Linaje (qué eres)
2. Entorno (dónde creciste)
3. Trasfondo (qué te ocurrió)
4. Ocupación (qué haces) + Talentos 3/2/1
5. Potencia (en qué crees) + Dogmas

---

### 11.6 Catálogo de Contenido del Sistema 🟡

**Descripción:** Base de datos de cartas por ambientación.

| Aspecto | Evaluación |
|---------|------------|
| Impacto | ⭐⭐⭐⭐ Contenido listo para usar |
| Esfuerzo | ⭐⭐⭐ Medio, 2 semanas |
| Riesgo | ⭐ Muy bajo |
| ROI | 🟡 **Bueno** |

**Contenido documentado:**
- 90 Cartas de Origen (30 por ambientación × 3)
- 36 Potencias (6 por género × 6 géneros)
- 15+ NPCs/Criaturas con niveles de amenaza
- Pregenerados por ambientación

---

### 11.7 Orden de Implementación Gameplay

| Prioridad | Componente | Esfuerzo | Sprint |
|-----------|------------|----------|--------|
| 🔥 1 | Tirador 2d12 + Escala Destino | 1 semana | S1 |
| 🔥 2 | Calculadora Combate Decisivo | 1 semana | S1 |
| 🔥 3 | Tracker Heridas | 3 días | S2 |
| 🔥 4 | Panel Devoción | 3 días | S2 |
| ⚠️ 5 | Selector 5 Cartas | 2 semanas | S3-4 |
| ⚠️ 6 | Catálogo Contenido | 2 semanas | S4-5 |

**Total estimado:** ~7 semanas para gameplay core funcional.

---

## 12. Resumen Ejecutivo Actualizado

### Prioridades Globales

| Categoría | Quick Wins | Planificados | Diferidos |
|-----------|------------|--------------|-----------|
| **CMS** | 3 | 4 | 3 |
| **Gameplay** | 4 | 2 | 0 |
| **Total** | 7 | 6 | 3 |

### Impacto en el Producto

```
┌─────────────────────────────────────────────────────────────┐
│                   ROADMAP ACTUALIZADO                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FASE ACTUAL: CMS completado ✅                              │
│                                                              │
│  PRÓXIMO: Gameplay Core (7 semanas)                         │
│  ├── Tirador 2d12 + Escala Destino                          │
│  ├── Calculadora Combate Decisivo                           │
│  ├── Tracker Heridas/Devoción                               │
│  └── Selector 5 Cartas                                      │
│                                                              │
│  DESPUÉS: Character Builder (12 semanas)                    │
│  └── Wizard completo + Character Sheet                      │
│                                                              │
│  FUTURO: VTT Básico (16 semanas)                            │
│  └── Sesiones online + Dados en tiempo real                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

*Este documento detalla las mejoras futuras priorizadas, incluyendo funcionalidades de gameplay críticas para el sistema TTRPG. Para el plan de trabajo detallado, consultar 11-ROADMAP.md y 14-PLANNING-FUNCIONALIDADES.md.*
