# Análisis del Sistema de Salud - Proyecto Tarot

## 1. Diagnóstico del Problema Actual

### Situación Actual (Luchador Mixto/Versátil)
- **Puntos de Aguante:** 11
- **Daño por golpe:** 1 punto
- **Impactos necesarios para derrotar:** 11
- **Probabilidad de impacto:** ~50%
- **Duración promedio:** 19.5 turnos

### Análisis Matemático
Con una probabilidad de impacto del 50%, se necesitan en promedio **22 ataques** para conseguir los 11 impactos necesarios. Esto explica por qué los combates duran ~20 turnos.

## 2. Objetivos del Rediseño

1. **Duración objetivo:** 6-10 turnos para un combate estándar
2. **Mantener supervivencia:** Los PJ no deben morir fácilmente
3. **Preservar tensión:** El combate debe seguir siendo emocionante
4. **Coherencia narrativa:** El sistema debe "sentirse" realista

## 3. Propuestas de Solución

### Propuesta A: Sistema de Heridas Escalonadas
**Concepto:** Reemplazar los Puntos de Aguante por un sistema de estados de herida progresivos.

**Mecánica:**
- **Saludable:** Sin penalizaciones
- **Herido Leve:** -1 a todas las tiradas
- **Herido Grave:** -2 a todas las tiradas
- **Incapacitado:** Fuera de combate (no muerto)

**Progresión:**
- Cada impacto exitoso avanza un nivel de herida
- Se necesitan solo **3 impactos** para incapacitar
- **Duración estimada:** 6-8 turnos

**Ventajas:**
- Combates mucho más rápidos
- Las heridas tienen consecuencias mecánicas inmediatas
- Los personajes raramente mueren, solo quedan incapacitados

### Propuesta B: Puntos de Aguante Reducidos + Umbral de Heridas
**Concepto:** Reducir drásticamente los Puntos de Aguante pero añadir un sistema de "segunda oportunidad".

**Mecánica:**
- **Puntos de Aguante:** 5 (en lugar de 11)
- **Umbral de Heridas:** Al llegar a 0 PA, tirada de Vigor vs Dificultad 9
  - **Éxito:** Queda "Herido Grave" con 1 PA y -2 a todas las tiradas
  - **Fallo:** Queda "Incapacitado" (fuera de combate)

**Ventajas:**
- Combates de 5-8 turnos
- Los PJ tienen una "segunda oportunidad" al caer
- Sistema familiar (similar a muchos juegos conocidos)

### Propuesta C: Sistema Híbrido de Vitalidad y Heridas
**Concepto:** Separar la resistencia al daño de las consecuencias del daño.

**Mecánica:**
- **Vitalidad:** 6 puntos (resistencia básica)
- **Heridas:** Cada vez que la Vitalidad llega a 0, se sufre una Herida y se recupera la Vitalidad completa
- **Límite de Heridas:** 2 Heridas = Incapacitado

**Progresión del Daño:**
1. **Primera vez a 0 Vitalidad:** 1ª Herida (-1 a todas las tiradas), Vitalidad vuelve a 6
2. **Segunda vez a 0 Vitalidad:** 2ª Herida, Incapacitado

**Ventajas:**
- Combates de 6-10 turnos
- Los personajes pueden "aguantar" dos "derrotas"
- Mecánica intuitiva y fácil de seguir

### Propuesta D: Daño Escalado por Éxito
**Concepto:** El daño varía según qué tan exitoso sea el ataque.

**Mecánica:**
- **Puntos de Aguante:** 8
- **Daño variable:**
  - **Impacto justo (12-14):** 1 punto de daño
  - **Impacto sólido (15-17):** 2 puntos de daño  
  - **Impacto crítico (18+):** 3 puntos de daño

**Ventajas:**
- Recompensa los ataques muy exitosos
- Introduce variabilidad en el daño
- Mantiene la emoción de las tiradas altas

## 4. Comparación de Propuestas

| Propuesta | Duración Estimada | Supervivencia PJ | Complejidad | Tensión |
|-----------|-------------------|------------------|-------------|---------|
| **A: Heridas Escalonadas** | 6-8 turnos | Alta | Baja | Media |
| **B: PA Reducidos + Umbral** | 5-8 turnos | Media-Alta | Baja | Alta |
| **C: Vitalidad + Heridas** | 6-10 turnos | Alta | Media | Alta |
| **D: Daño Escalado** | 8-12 turnos | Media | Media | Muy Alta |

## 5. Recomendación Principal

**Propuesta C: Sistema Híbrido de Vitalidad y Heridas** es la más prometedora porque:

1. **Duración apropiada:** 6-10 turnos es ideal para una mesa de rol
2. **Supervivencia garantizada:** Los PJ pueden "morir" dos veces antes de quedar fuera
3. **Mecánica intuitiva:** Fácil de entender y gestionar
4. **Escalabilidad:** Funciona bien con diferentes niveles de poder
5. **Tensión mantenida:** Cada "muerte" es un momento dramático

## 6. Implementación Sugerida

### Sistema Híbrido Detallado
- **Vitalidad Base:** 6 puntos (Base Ocupación 5 + Vigor 1)
- **Heridas Máximas:** 2
- **Efectos de Heridas:**
  - **1ª Herida:** -1 a todas las tiradas
  - **2ª Herida:** Incapacitado (fuera de combate)

### Mecánica de Recuperación
- **Vitalidad:** Se recupera completamente al sufrir una Herida
- **Heridas:** Solo se curan con descanso prolongado o magia/medicina

### Ejemplo de Combate
1. **Luchador A** tiene 6 Vitalidad, 0 Heridas
2. **Recibe 4 puntos de daño** → Vitalidad baja a 2
3. **Recibe 3 puntos de daño** → Vitalidad a 0 → **1ª Herida**, Vitalidad vuelve a 6, -1 a tiradas
4. **Recibe 6 puntos de daño** → Vitalidad a 0 → **2ª Herida** → **Incapacitado**

**Resultado:** El combate dura hasta que uno de los luchadores recibe suficiente daño para "morir" dos veces, lo que debería ocurrir en 6-8 turnos.
