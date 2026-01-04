# 🧪 Laboratorio de Situaciones de Prueba

> **Propósito:** Plantillas para testear reglas del sistema de forma sistemática
> **Uso:** Seleccionar setup, definir reglas a probar, ejecutar, registrar resultados

---

## Estructura del Laboratorio

```
situaciones/
├── 00-INDICE-SITUACIONES.md     # Este archivo
├── 01-12-*.md                    # Ejemplos de simulación (referencia)
│
└── plantillas/                   # ⭐ USAR ESTAS PARA PRUEBAS
    ├── 00-PROTOCOLO-PRUEBAS.md   # Cómo ejecutar tests
    ├── REGISTRO-PRUEBA-TEMPLATE.md # Plantilla para copiar
    │
    ├── SETUP-COMBATE-*.md        # Setups de combate
    ├── SETUP-MAGIA-*.md          # Setups de magia
    ├── SETUP-HABILIDAD-*.md      # Setups de habilidades
    ├── SETUP-MIXTA-*.md          # Setups de transiciones
    │
    └── pruebas/                  # Resultados de pruebas ejecutadas
        └── PRUEBA-*.md
```

---

## Plantillas Disponibles

### Combate

| Plantilla | Propósito | Qué Testea |
|-----------|-----------|------------|
| `SETUP-COMBATE-DUELO.md` | Duelos 1v1 | Balance arquetipos, Defensa Pasiva |
| `SETUP-COMBATE-GRUPO.md` | Grupo vs Grupo | Iniciativa Heroica, coordinación |
| `SETUP-COMBATE-HORDA.md` | Héroes vs Muchos | Ataques área, Defensa Pasiva |
| `SETUP-COMBATE-JEFE.md` | Grupo vs Boss | Acciones de jefe, fases |

### Magia

| Plantilla | Propósito | Qué Testea |
|-----------|-----------|------------|
| `SETUP-MAGIA-WOT.md` | Canalización | Fatiga, círculos, riesgo |
| `SETUP-MAGIA-HP.md` | Hechicería | Varitas, aprendizaje, duelos |
| `SETUP-MAGIA-WARCRAFT.md` | Clases | Recursos, roles, mazmorras |
| `SETUP-MAGIA-DIVINA.md` | Potencias | Devoción, dogmas, intervenciones |

### Habilidades

| Plantilla | Propósito | Qué Testea |
|-----------|-----------|------------|
| `SETUP-HABILIDAD-SOCIAL.md` | Negociación | Disposición, persuasión, engaño |

### Mixtas

| Plantilla | Propósito | Qué Testea |
|-----------|-----------|------------|
| `SETUP-MIXTA-TRANSICIONES.md` | Cambios de modo | Emboscadas, rendición, infiltración |

---

## Cómo Usar Este Laboratorio

### 1. Leer el Protocolo
Ver `plantillas/00-PROTOCOLO-PRUEBAS.md` para instrucciones completas.

### 2. Elegir Setup
Selecciona una plantilla `SETUP-*.md` según lo que quieras probar.

### 3. Definir Reglas
Marca qué reglas estarán activas en esta prueba:
- [ ] Defensa Pasiva
- [ ] Iniciativa Heroica
- [ ] Talentos 3/2/1
- [ ] etc.

### 4. Crear Registro
Copia `REGISTRO-PRUEBA-TEMPLATE.md` y renómbrala.

### 5. Ejecutar
Simula turno a turno, anotando TODAS las tiradas.

### 6. Analizar
Completa métricas, identifica problemas.

### 7. Guardar
Mueve el registro a `plantillas/pruebas/`.

---

## Métricas de Éxito

| Métrica | Objetivo | Aceptable | Problema |
|---------|----------|-----------|----------|
| **Turnos combate** | 5-10 | 4-12 | <4 o >12 |
| **Tiradas por turno** | ≤3 | ≤4 | >5 |
| **Tiempo real** | 15-30 min | 10-45 min | >60 min |
| **Decisiones/turno** | ≥2 | ≥1 | 0 |
| **Momentos memorables** | ≥1 | - | 0 |

---

## Reglas a Probar

| Código | Regla | Estado |
|--------|-------|--------|
| R-COM-01 | Defensa Pasiva | PROPUESTA |
| R-COM-02 | Iniciativa Heroica | PROPUESTA |
| R-COM-03 | Talentos 3/2/1 | CONFIRMADO |
| R-COM-04 | Daño Escalado | PROPUESTA |
| R-COM-05 | Heridas Acumulativas | CONFIRMADO |
| R-COM-06 | Golpe de Gracia | CONFIRMADO |
| R-MAG-01 | Devoción 0-5 | CONFIRMADO |

---

## Archivos de Referencia (Ejemplos)

Los archivos `01-*.md` a `12-*.md` en esta carpeta contienen **ejemplos de simulación** con resultados pre-calculados. Úsalos como referencia de cómo se ve una situación resuelta, pero para pruebas reales usa las plantillas.

---

*Prueba, registra, analiza, mejora.*
