# 🔄 Decisiones en Pruebas

> **Propósito:** Propuestas activamente siendo testeadas
> **Política:** Requieren X pruebas exitosas para confirmar

---

## Combate

### COM-001: Defensa Pasiva

| Campo | Valor |
|-------|-------|
| **Propuesta** | Si atacante tiene ≥3 niveles sobre defensor, usar defensa fija |
| **Fórmula** | Defensa = 6 + Agilidad + Competencia + Armadura |
| **Objetivo** | Reducir tiradas ~50% en combates desequilibrados |
| **Fecha propuesta** | Diciembre 2024 |
| **Estado** | 🔄 EN PRUEBAS |

**Pruebas requeridas:**
- [ ] SETUP-COMBATE-DUELO Esc.C (Novato vs Veterano)
- [ ] SETUP-COMBATE-HORDA Esc.A (vs 12 débiles)
- [ ] SETUP-COMBATE-GRUPO Esc.A (vs bandidos)

**Métricas a validar:**
- Reducción de tiradas ≥40%
- Tiempo de combate reducido ≥30%
- Mantiene sensación de competencia

**Riesgos identificados:**
- Puede hacer combates demasiado predecibles
- Umbral de 3 niveles puede ser muy alto o muy bajo

---

### COM-002: Iniciativa Heroica

| Campo | Valor |
|-------|-------|
| **Propuesta** | PJs actúan primero por defecto |
| **Excepciones** | Emboscada, sorpresa, Giro del Destino |
| **Objetivo** | Más coordinación, menos tiradas de iniciativa |
| **Fecha propuesta** | Diciembre 2024 |
| **Estado** | 🔄 EN PRUEBAS |

**Pruebas requeridas:**
- [ ] SETUP-COMBATE-GRUPO Esc.A (coordinación táctica)
- [ ] SETUP-MIXTA-TRANSICIONES Esc.A (emboscada)
- [ ] SETUP-COMBATE-JEFE Esc.A (vs jefe con acciones)

**Métricas a validar:**
- Los PJs se sienten empoderados
- Las emboscadas siguen siendo peligrosas
- El flujo de combate es más claro

**Riesgos identificados:**
- Puede hacer combates demasiado fáciles
- Reduce tensión de "quién va primero"

---

### COM-003: Talentos de Combate 3/2/1

| Campo | Valor |
|-------|-------|
| **Propuesta** | Principal +2, Secundario +1, Terciario +0 |
| **Objetivo** | Diferenciación de especialización |
| **Fecha propuesta** | Diciembre 2024 |
| **Estado** | 🔄 EN PRUEBAS |

**Pruebas requeridas:**
- [ ] SETUP-COMBATE-DUELO Esc.A (Guerrero vs Guerrero)
- [ ] SETUP-COMBATE-DUELO Esc.B (Guerrero vs Pícaro)

**Métricas a validar:**
- +2 es significativo pero no dominante
- Crea decisiones interesantes de build

---

### COM-004: Daño Escalado

| Campo | Valor |
|-------|-------|
| **Propuesta** | +1 daño por cada 3 puntos de margen |
| **Objetivo** | Los éxitos grandes hacen más daño |
| **Fecha propuesta** | Diciembre 2024 |
| **Estado** | 📋 PROPUESTA (pendiente pruebas) |

**Análisis preliminar:**
- Margen promedio: 3-5 → +1 daño típico
- Margen alto (8+): +2-3 daño → ¿demasiado letal?

---

## Magia

### MAG-003: Fatiga WoT (Límites)

| Campo | Valor |
|-------|-------|
| **Propuesta** | Límite seguro = Voluntad × 3, Inconsciencia = Voluntad × 5 |
| **Objetivo** | Magia poderosa con consecuencias |
| **Estado** | 🔄 EN PRUEBAS |

**Pruebas requeridas:**
- [ ] SETUP-MAGIA-WOT Esc.A (vs enemigos físicos)
- [ ] SETUP-MAGIA-WOT Esc.B (duelo de canalizadores)

---

## Potencias

### POT-004: Salvaguarda del Destino

| Campo | Valor |
|-------|-------|
| **Propuesta** | Gastar Devoción para evitar tiradas fatales |
| **Coste** | 1-3 Dev según gravedad |
| **Límite** | 1/escena |
| **Trigger** | Tras ver resultado, a elección del jugador |
| **Fecha propuesta** | Diciembre 2024 |
| **Estado** | 📋 PROPUESTA |

**Opciones de uso:**
- **Repetir (1 Dev):** Repite dado de Destino
- **Mitigar (2 Dev):** Resultado malo pero no fatal
- **Anular (3 Dev):** El resultado no ocurre (requiere narrativa)

**Pruebas requeridas:**
- [ ] SETUP-COMBATE-JEFE (evitar muerte por burst)
- [ ] SETUP-MAGIA-DIVINA (sinergia con Intervenciones)
- [ ] Situación con tirada crítica fallida

**Riesgos:**
- ¿Demasiado poderoso? → Limitar a 1/escena
- ¿Devalúa peligro? → Solo para momentos realmente fatales

---

### POT-005: Escudo de Historia (PA de Potencia)

| Campo | Valor |
|-------|-------|
| **Propuesta** | Devoción absorbe daño antes que PA |
| **Coste** | 1 Dev = daño ÷2, 2 Dev = ignorar daño |
| **Límite** | 2/combate propuesto |
| **Fecha propuesta** | Diciembre 2024 |
| **Estado** | 📋 PROPUESTA |

**Mecánica:**
```
Al recibir daño, ANTES de restar PA:
  1 Dev → Daño ÷2 (o ignorar si ≤3)
  2 Dev → Ignorar todo el daño
```

**Restricción por Dogmas:**
- Acción acorde: Protección completa
- Acción neutral: Protección normal
- Acción contra Dogmas: NO se puede usar

**Pruebas requeridas:**
- [ ] SETUP-COMBATE-DUELO (duración con/sin Escudo)
- [ ] SETUP-COMBATE-HORDA (supervivencia mejorada)
- [ ] Economía de Devoción (¿5 puntos suficientes?)

**Riesgos:**
- Combates más largos (+2-3 turnos)
- Devoción se agota rápido si se usa mucho
- Desbalance entre PJs con/sin Potencia activa

---

## Social

### SOC-001: Sistema de Disposición

| Campo | Valor |
|-------|-------|
| **Propuesta** | Escala -3 a +3 para actitud del NPC |
| **Objetivo** | Mecánica social clara |
| **Estado** | 📋 PROPUESTA |

**Pruebas requeridas:**
- [ ] SETUP-HABILIDAD-SOCIAL Esc.A (negociación)

---

## Proceso de Confirmación

### Criterios para Confirmar

1. **Mínimo 3 pruebas** con resultados positivos
2. **Métricas cumplidas** según definición
3. **Sin problemas graves** identificados
4. **Aprobación** del diseñador principal

### Criterios para Descartar

1. **2+ pruebas** con resultados negativos
2. **Métricas incumplidas** consistentemente
3. **Problemas graves** no resolubles
4. **Alternativa mejor** identificada

---

## Historial de Movimientos

| Fecha | Propuesta | De | A | Razón |
|-------|-----------|-----|-----|-------|
| - | - | - | - | Sin movimientos aún |

---

*Las propuestas en pruebas son candidatas a confirmación. Testear antes de decidir.*
