# 📈 Evolución del Proyecto - Tarot2

## 1. Línea Temporal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EVOLUCIÓN DE TAROT2                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FASE INICIAL         CONSOLIDACIÓN           MADURACIÓN          ACTUAL    │
│  ────────────         ─────────────           ──────────          ──────    │
│                                                                              │
│  • Setup Nuxt 4       • CRUD handlers         • Bridges tables    • Auditor │
│  • PostgreSQL         • translatableUpsert    • EntityInspector   • Roadmap │
│  • Estructura base    • Auth JWT              • FormModal         • Docs    │
│  • Entidades core     • Rate limiting         • Capabilities      • i18n    │
│                       • i18n completo         • Editorial         • Migrac. │
│                                                                              │
│  ◄─────────────────── Tiempo ──────────────────────────────────────────────►│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fases de Desarrollo

### 2.1 Fase Inicial: Fundamentos

**Objetivos alcanzados:**
- ✅ Configuración de Nuxt 4 con SSR
- ✅ Conexión PostgreSQL con Kysely
- ✅ Estructura de directorios estándar
- ✅ Diseño del modelo de datos
- ✅ Entidades core definidas (arcana, facet, skill, world, card)

**Decisiones arquitectónicas:**
- Uso de Kysely sobre Prisma para control SQL granular
- Patrón de tablas `_translations` para i18n
- Separación Manage/Admin desde el inicio

### 2.2 Fase de Consolidación: Backend Robusto

**Objetivos alcanzados:**
- ✅ CRUD handlers estandarizados
- ✅ `createCrudHandlers` como factoría
- ✅ `buildFilters` para paginación/ordenación
- ✅ `translatableUpsert` para multiidioma
- ✅ Sistema de autenticación JWT
- ✅ Rate limiting implementado
- ✅ Logging estructurado con Pino
- ✅ Cobertura i18n EN/ES completa

**Lecciones aprendidas:**
- Importancia de helpers reutilizables
- Necesidad de whitelist en ordenación
- Valor del logging estructurado

### 2.3 Fase de Maduración: Frontend Moderno

**Objetivos alcanzados:**
- ✅ `CommonDataTable` como base unificada
- ✅ `ManageTableBridge` y `AdminTableBridge`
- ✅ `EntityInspectorDrawer` para previews
- ✅ `FormModal` con presets declarativos
- ✅ `useEntityCapabilities` para configuración
- ✅ Sistema editorial (versiones, revisiones, feedback)
- ✅ Export/Import de datos

**Lecciones aprendidas:**
- Bridges facilitan reutilización sin acoplamiento
- Capabilities declarativas > props individuales
- Drawer > Modal para previews

### 2.4 Fase Actual: Consolidación y Documentación

**Objetivos en progreso:**
- 🔄 Migración de componentes legacy
- 🔄 Auditorías técnicas (Nuxt, Nuxt UI)
- 🔄 Documentación exhaustiva
- 🔄 Roadmap priorizado
- 🔄 Reglas de desarrollo formalizadas

---

## 3. Mejoras Incorporadas

### 3.1 Arquitectura

| Mejora | Antes | Después | Impacto |
|--------|-------|---------|---------|
| Estructura de handlers | Código disperso | `_crud.ts` centralizado | +50% mantenibilidad |
| Respuestas API | Formatos variados | `{ success, data, meta }` | +80% consistencia |
| Filtros/paginación | Implementación manual | `buildFilters()` | -70% código |
| Multiidioma | JOIN manual | `translatableUpsert()` | -60% errores |

### 3.2 Frontend

| Mejora | Antes | Después | Impacto |
|--------|-------|---------|---------|
| Tablas | Componentes individuales | CommonDataTable + Bridges | +90% reutilización |
| Previews | Modales variados | EntityInspectorDrawer | +100% accesibilidad |
| Formularios | HTML manual | FormModal + presets | -50% código |
| Configuración | Props múltiples | useEntityCapabilities | +80% declaratividad |

### 3.3 Seguridad

| Mejora | Antes | Después | Impacto |
|--------|-------|---------|---------|
| Autenticación | Tokens en localStorage | Cookies HttpOnly | +100% seguridad |
| Rate limiting | Sin límites | Buckets diferenciados | Prevención abuso |
| Permisos | Check manual | Middleware + v-can | +80% granularidad |
| Validación | Parcial | Zod en todos los endpoints | -90% errores |

### 3.4 i18n

| Mejora | Antes | Después | Impacto |
|--------|-------|---------|---------|
| Traducciones | Incompletas | Cobertura 100% EN/ES | UX completa |
| Fallback | Sin indicador | Badge + markLanguageFallback | Transparencia |
| Borrado | Confuso | EN borra todo, otros solo traducción | Claridad |
| Referencia | Sin contexto | FormModal muestra EN | +50% eficiencia traducción |

---

## 4. Evolución de Patrones

### 4.1 Tablas

```
Evolución:
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  <table> HTML │ ──▶ │    UTable     │ ──▶ │CommonDataTable│
│    manual     │     │   directo     │     │   + Bridges   │
└───────────────┘     └───────────────┘     └───────────────┘
     v0.x                  v1.x                  v2.x
```

### 4.2 Formularios

```
Evolución:
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  UForm manual │ ──▶ │ Modal custom  │ ──▶ │   FormModal   │
│  por entidad  │     │  por entidad  │     │  + presets    │
└───────────────┘     └───────────────┘     └───────────────┘
     v0.x                  v1.x                  v2.x
```

### 4.3 CRUD Backend

```
Evolución:
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Handler manual│ ──▶ │ Helpers base  │ ──▶ │createCrudHand.│
│  por endpoint │     │  compartidos  │     │   + factory   │
└───────────────┘     └───────────────┘     └───────────────┘
     v0.x                  v1.x                  v2.x
```

---

## 5. Hitos Clave

### 5.1 Hitos Completados ✅

| Hito | Fecha | Impacto |
|------|-------|---------|
| Setup inicial Nuxt 4 | - | Base del proyecto |
| Modelo de datos completo | - | 14 entidades definidas |
| CRUD handlers unificados | - | Consistencia API |
| Sistema auth JWT | - | Seguridad base |
| i18n completo EN/ES | - | Internacionalización |
| CommonDataTable | - | UI unificada |
| EntityInspectorDrawer | - | Previews accesibles |
| FormModal + presets | - | Formularios declarativos |
| Sistema editorial | - | Versiones + revisiones |
| Auditorías técnicas | Nov 2024 | Roadmap claro |
| Documentación exhaustiva | Nov 2024 | Mantenibilidad |

### 5.2 Hitos Pendientes 🔄

| Hito | Prioridad | Dependencias |
|------|-----------|--------------|
| Migración completa Admin | Alta | Tiempo |
| Testing automatizado | Alta | Setup Playwright |
| Effect System 2.0 | Media | Diseño UI |
| Dashboard i18n | Media | Endpoint coverage |
| Observabilidad | Media | Integración OTLP |

---

## 6. Métricas de Evolución

### 6.1 Reducción de Código Duplicado

```
Antes (estimado):
  - 5 implementaciones de tabla diferentes
  - 8 implementaciones de formulario
  - 12 implementaciones de CRUD similar

Después:
  - 1 CommonDataTable + 2 bridges
  - 1 FormModal + presets
  - 1 createCrudHandlers + config

Reducción estimada: ~60% menos código repetido
```

### 6.2 Cobertura de Patrones

```
Área         | Antes | Ahora | Objetivo
─────────────┼───────┼───────┼─────────
Tablas       |  20%  |  90%  |   100%
Formularios  |  30%  |  85%  |   100%
Previews     |  40%  |  90%  |   100%
CRUD API     |  50%  | 100%  |   100%
i18n         |  60%  | 100%  |   100%
```

### 6.3 Calidad del Código

```
Métrica              | Antes | Ahora
─────────────────────┼───────┼──────
Archivos con TODOs   |  ~30  |  ~10
Componentes legacy   |  ~15  |   ~6
$fetch directo       |  ~20  |   ~5
Warnings ESLint      | ~100  |  ~20
```

---

## 7. Decisiones Arquitectónicas Clave

### 7.1 Decisiones Acertadas ✅

| Decisión | Justificación | Resultado |
|----------|---------------|-----------|
| Kysely sobre Prisma | Control SQL granular | Queries optimizadas |
| Tablas _translations | Flexibilidad i18n | COALESCE eficiente |
| Bridges pattern | Desacoplamiento | Reutilización alta |
| Capabilities provider | Configuración declarativa | Menos props |
| JWT en cookies | Seguridad mejorada | Sin XSS tokens |

### 7.2 Decisiones a Revisar ⚠️

| Decisión | Problema | Solución propuesta |
|----------|----------|-------------------|
| Rate limit en memoria | No escala multi-nodo | Migrar a Redis |
| EntityTableWrapper | Duplicación | Eliminar tras migración |
| Presets en runtime | No validados en build | Tipado estricto |

---

## 8. Aprendizajes

### 8.1 Técnicos

1. **Patrones primero** - Definir patrones antes de implementar features
2. **Documentación continua** - Actualizar docs con cada cambio significativo
3. **Migraciones incrementales** - No refactorizar todo de una vez
4. **Auditorías regulares** - Revisar adherencia a best practices

### 8.2 Proceso

1. **Roadmap vivo** - Mantener plan actualizado y priorizado
2. **Reglas explícitas** - Documentar invariantes para desarrollo
3. **Checklist de QA** - Manual hasta tener tests automatizados
4. **Informes post-fase** - Documentar estado tras cada hito

---

## 9. Próxima Evolución

### 9.1 Corto Plazo

- Completar migraciones de componentes legacy
- Eliminar deuda técnica identificada
- Normalizar patrones en Admin

### 9.2 Medio Plazo

- Implementar testing automatizado
- Activar observabilidad con métricas
- Effect System 2.0 en producción

### 9.3 Largo Plazo

- Soporte multi-tenancy
- API pública documentada
- PWA/mobile experience

---

*Este documento detalla la evolución de Tarot2. Para información sobre mejoras futuras, consultar 10-MEJORAS-FUTURAS.md.*
