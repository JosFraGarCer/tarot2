# 🎮 PROYECTO TAROT: Estado del Sistema de Juego

> **Versión actual:** 0.3.0-alpha
> **Última actualización:** Diciembre 2024
> **Estado:** En desarrollo activo

---

## Dashboard del Sistema

### Progreso por Módulo

| Módulo | Estado | Completado | Pendiente |
|--------|--------|------------|-----------|
| **Core (Dados)** | ✅ ESTABLE | 100% | - |
| **Personajes (5 Cartas)** | ✅ ESTABLE | 90% | Contenido cartas |
| **Atributos (Facetas)** | ✅ ESTABLE | 100% | - |
| **Combate** | 🔄 EN PRUEBAS | 70% | Defensa Pasiva, Iniciativa |
| **Magia** | 🔄 EN PRUEBAS | 60% | Balance por ambientación |
| **Potencias** | 🔄 EN PRUEBAS | 70% | Salvaguarda, Escudo de Historia |
| **Progresión** | 📋 PROPUESTA | 40% | Definir sistema de avance |
| **Contenido** | 📋 PROPUESTA | 30% | Cartas, bestiario, etc. |

### Leyenda de Estados

| Estado | Significado | Acción |
|--------|-------------|--------|
| ✅ ESTABLE | Probado y confirmado | Solo ajustes menores |
| 🔄 EN PRUEBAS | Propuestas activas en test | Ejecutar situaciones |
| 📋 PROPUESTA | Ideas documentadas | Priorizar y diseñar |
| ❓ PENDIENTE | Sin diseño inicial | Requiere análisis |
| ❌ DESCARTADO | Rechazado tras análisis | Documentar razón |

---

## Estructura del Proyecto

```
sistema/
│
├── 00-ESTADO-SISTEMA.md           # ⭐ ESTE ARCHIVO - Dashboard
│
├── core/                          # 📐 REGLAS CORE (estables)
│   ├── 01-FUNDAMENTOS.md          # Filosofía, dados 2d12
│   ├── 02-PERSONAJES.md           # 5 Cartas, creación
│   ├── 03-ATRIBUTOS.md            # Arcanos, Facetas, Competencias
│   └── 04-RESOLUCION.md           # Tiradas, dificultades
│
├── modulos/                       # 🔧 MÓDULOS DE JUEGO
│   ├── combate/
│   │   ├── ESTADO.md              # Estado del módulo
│   │   ├── REGLAS.md              # Reglas actuales
│   │   └── PROPUESTAS.md          # Ideas en desarrollo
│   ├── magia/
│   │   ├── ESTADO.md
│   │   ├── REGLAS.md
│   │   └── PROPUESTAS.md
│   ├── potencias/
│   │   └── ...
│   ├── social/
│   │   └── ...
│   └── progresion/
│       └── ...
│
├── decisiones/                    # 📋 TRACKING DE DECISIONES
│   ├── CONFIRMADAS.md             # Lo que está decidido
│   ├── EN-PRUEBAS.md              # Lo que se está testeando
│   ├── PENDIENTES.md              # Lo que falta decidir
│   └── DESCARTADAS.md             # Lo que se rechazó (y por qué)
│
├── situaciones/                   # 🧪 LABORATORIO DE PRUEBAS
│   ├── plantillas/                # Setups para testing
│   │   ├── pruebas/               # Resultados de tests
│   │   └── ...
│   └── ...
│
├── versiones/                     # 📚 HISTORIAL
│   ├── CHANGELOG.md               # Registro de cambios
│   └── v0.2.0/                    # Snapshots de versiones
│
├── referencias/                   # 📖 MATERIAL DE REFERENCIA
│   ├── comparativas/              # vs otros sistemas
│   ├── inspiracion/               # Ideas de Manus, etc.
│   └── glosario/                  # Terminología
│
└── publicacion/                   # 📄 DOCUMENTOS FINALES
    ├── REGLAS-CONSOLIDADAS.md     # Libro de reglas
    ├── QUICK-START.md             # Inicio rápido
    └── GUIA-DIRECTOR.md           # Para el DJ
```

---

## Ciclo de Desarrollo

```
┌─────────────────────────────────────────────────────────────┐
│                    CICLO DE DESARROLLO                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. PROPUESTA        2. ANÁLISIS        3. DISEÑO          │
│   ───────────         ─────────          ──────             │
│   Idea inicial  →  Evaluar impacto  →  Documentar regla     │
│                                                              │
│   4. TESTING          5. AJUSTE          6. CONFIRMACIÓN    │
│   ───────            ──────              ────────────        │
│   Situaciones  →   Iterar diseño   →   Mover a ESTABLE      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Estados de una Regla

```
IDEA → PROPUESTA → EN-PRUEBAS → ESTABLE
                       ↓
                  DESCARTADA
```

---

## Prioridades Actuales

### 🔴 Alta Prioridad (Sprint Actual)

| Item | Módulo | Acción Requerida |
|------|--------|------------------|
| Defensa Pasiva | Combate | Testear en situaciones |
| Iniciativa Heroica | Combate | Testear en situaciones |
| Balance Talentos 3/2/1 | Combate | Validar en duelos |
| **Salvaguarda del Destino** | Potencias | Diseñar, testear vs jefes |
| **Escudo de Historia** | Potencias | Evaluar impacto en duración combate |

### 🟡 Media Prioridad (Próximo Sprint)

| Item | Módulo | Acción Requerida |
|------|--------|------------------|
| Magia por ambientación | Magia | Equilibrar WoT vs HP vs Warcraft |
| Sistema de Progresión | Progresión | Definir Sellos y avance |
| Potencias adicionales | Potencias | Crear 12 nuevas |

### 🟢 Baja Prioridad (Backlog)

| Item | Módulo | Acción Requerida |
|------|--------|------------------|
| Reglas de vehículos | Módulos | Diseño inicial |
| Combate naval | Módulos | Diseño inicial |
| Magia de ritual | Magia | Expandir sistema |

---

## Métricas de Calidad

### Objetivos del Sistema

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Combate ≤10 turnos | ≤10 | ~12-15 | 🔄 Mejorando |
| Tiradas por turno | ≤3 | ~4 | 🔄 Mejorando |
| Tiempo creación PJ | ≤30 min | ~45 min | 🔄 |
| Reglas en Quick Start | ≤4 páginas | 3 | ✅ |

### Tests Ejecutados

| Situación | Último Test | Resultado | Notas |
|-----------|-------------|-----------|-------|
| Duelo 1v1 | Pendiente | - | - |
| Grupo vs Grupo | Pendiente | - | - |
| Magia WoT | Pendiente | - | - |

---

## Equipo y Roles

| Rol | Responsabilidad |
|-----|-----------------|
| **Diseñador Principal** | Visión, decisiones finales |
| **Analista de Balance** | Matemáticas, simulaciones |
| **Escritor** | Redacción de reglas, flavor |
| **Playtester** | Ejecutar situaciones, feedback |

---

## Enlaces Rápidos

- **Reglas actuales:** `publicacion/REGLAS-CONSOLIDADAS.md`
- **Decisiones pendientes:** `decisiones/PENDIENTES.md`
- **Laboratorio de pruebas:** `situaciones/plantillas/`
- **Changelog:** `versiones/CHANGELOG.md`

---

*Sistema en desarrollo activo. Consultar CHANGELOG para últimos cambios.*
