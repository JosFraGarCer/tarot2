# 🎮 Proyecto Tarot: Sistema de Juego

> **Versión:** 0.3.0-alpha
> **Estado:** Desarrollo activo

---

## Inicio Rápido

### ¿Dónde empezar?

| Quiero... | Ir a... |
|-----------|---------|
| Ver estado actual del sistema | `00-ESTADO-SISTEMA.md` |
| Leer las reglas confirmadas | `core/` |
| Ver qué está en pruebas | `decisiones/EN-PRUEBAS.md` |
| Ejecutar una prueba | `situaciones/plantillas/` |
| Ver el historial de cambios | `versiones/CHANGELOG.md` |

---

## Estructura del Proyecto

```
sistema/
│
├── 00-ESTADO-SISTEMA.md       # ⭐ Dashboard principal
├── README.md                   # Este archivo
│
├── core/                       # 📐 REGLAS ESTABLES
│   ├── 01-FUNDAMENTOS.md       # Dados, filosofía
│   ├── 02-PERSONAJES.md        # 5 Cartas, creación
│   ├── 03-ATRIBUTOS.md         # Facetas, competencias
│   └── 04-RESOLUCION.md        # Tiradas, dificultades
│
├── modulos/                    # 🔧 SUBSISTEMAS
│   ├── combate/
│   │   ├── ESTADO.md           # Dashboard del módulo
│   │   ├── REGLAS.md           # Reglas actuales
│   │   └── PROPUESTAS.md       # Ideas en desarrollo
│   ├── magia/
│   ├── potencias/
│   ├── social/
│   └── progresion/
│
├── decisiones/                 # 📋 TRACKING
│   ├── CONFIRMADAS.md          # ✅ Lo decidido
│   ├── EN-PRUEBAS.md           # 🔄 Lo que se está testeando
│   ├── PENDIENTES.md           # ❓ Lo que falta decidir
│   └── DESCARTADAS.md          # ❌ Lo rechazado
│
├── situaciones/                # 🧪 LABORATORIO
│   ├── plantillas/             # Setups para pruebas
│   │   ├── 00-PROTOCOLO.md
│   │   ├── REGISTRO-TEMPLATE.md
│   │   ├── SETUP-*.md          # Escenarios
│   │   └── pruebas/            # Resultados
│   └── *.md                    # Ejemplos de referencia
│
├── versiones/                  # 📚 HISTORIAL
│   └── CHANGELOG.md
│
└── publicacion/                # 📄 DOCUMENTOS FINALES
    ├── REGLAS-CONSOLIDADAS.md
    ├── QUICK-START.md
    └── GUIA-DIRECTOR.md
```

---

## Flujo de Trabajo

### Ciclo de Desarrollo

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   IDEA  →  PROPUESTA  →  EN PRUEBAS  →  CONFIRMADA          │
│              ↓                              ↓                │
│         PENDIENTE                      DESCARTADA            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1. Nueva Idea

1. Documentar en el módulo correspondiente (`modulos/X/PROPUESTAS.md`)
2. Añadir a `decisiones/PENDIENTES.md` si requiere decisión
3. Asignar prioridad

### 2. Diseño de Propuesta

1. Desarrollar la mecánica completa
2. Identificar métricas de éxito
3. Definir pruebas necesarias
4. Mover a `decisiones/EN-PRUEBAS.md`

### 3. Testing

1. Seleccionar situación de `situaciones/plantillas/`
2. Configurar reglas activas
3. Ejecutar simulación
4. Registrar resultados
5. Analizar métricas

### 4. Decisión

**Si funciona:**
1. Mover a `decisiones/CONFIRMADAS.md`
2. Actualizar `modulos/X/REGLAS.md`
3. Actualizar `core/` si es regla core
4. Registrar en `versiones/CHANGELOG.md`

**Si no funciona:**
1. Mover a `decisiones/DESCARTADAS.md`
2. Documentar razón
3. Registrar en CHANGELOG

---

## Estados de Contenido

| Estado | Icono | Significado |
|--------|-------|-------------|
| Estable | ✅ | Probado y confirmado |
| En Pruebas | 🔄 | Activamente siendo testeado |
| Propuesta | 📋 | Documentado, pendiente diseño |
| Pendiente | ❓ | Sin diseño inicial |
| Descartado | ❌ | Rechazado tras análisis |

---

## Documentos Legacy

Los siguientes archivos son documentación anterior que se mantiene como referencia:

| Archivo | Contenido | Estado |
|---------|-----------|--------|
| `17-SISTEMA-TAROT-ANALISIS.md` | Análisis inicial | Referencia |
| `21-PROPUESTAS-MECANICAS-CORE.md` | Propuestas originales | Referencia |
| `22-PROPUESTAS-COMBATE.md` | Propuestas originales | Referencia |
| `25-CATALOGO-IDEAS-MANUS.md` | Ideas de Manus | Referencia |
| `27-DECISIONES-PENDIENTES.md` | Tracking antiguo | Migrar a `decisiones/` |
| `28-REGLAS-CONSOLIDADAS.md` | Reglas v0.2 | Migrar a `publicacion/` |

---

## Convenciones

### Nomenclatura de IDs

| Prefijo | Módulo |
|---------|--------|
| COR | Core |
| PER | Personajes |
| COM | Combate |
| MAG | Magia |
| POT | Potencias |
| SOC | Social |
| PRO | Progresión |
| MOD | Módulos opcionales |
| FIL | Filosofía |

### Formato de Decisiones

```markdown
### XXX-NNN: Nombre de la Decisión

| Campo | Valor |
|-------|-------|
| **Propuesta** | Descripción clara |
| **Fecha** | YYYY-MM |
| **Estado** | ✅/🔄/📋/❓/❌ |
```

---

## Equipo

| Rol | Responsabilidad |
|-----|-----------------|
| Diseñador Principal | Visión, decisiones finales |
| Analista | Matemáticas, balance |
| Escritor | Redacción, flavor |
| Tester | Ejecutar situaciones |

---

## Contribuir

1. Revisar `00-ESTADO-SISTEMA.md` para prioridades actuales
2. Elegir tarea de alta prioridad
3. Seguir el flujo de trabajo
4. Documentar todo

---

*Sistema en desarrollo. Consultar 00-ESTADO-SISTEMA.md para estado actual.*
