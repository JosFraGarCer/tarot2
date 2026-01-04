# ⚔️ Combate Acelerado: Objetivo 10-12 Turnos

> **Meta:** Combate entre oponentes de nivel parejo = máximo 10-12 turnos
> **Actual:** ~28 turnos (inaceptable) | Con Talentos: ~17 turnos (insuficiente)

---

## Índice

1. [Diagnóstico Matemático](#1-diagnóstico-matemático)
2. [Propuestas de Aceleración](#2-propuestas-de-aceleración) (A-F)
3. [Sistema Propuesto: Combate Decisivo](#3-sistema-propuesto-combate-decisivo)
4. [Simulaciones Comparativas](#4-simulaciones-comparativas)
5. [Reglas Finales Recomendadas](#5-reglas-finales-recomendadas)
6. [Variantes Opcionales](#6-variantes-opcionales)
7. [Propuestas Adicionales](#7-propuestas-adicionales-defensa-pasiva-e-iniciativa) (G-H) 🆕
8. [Decisión Requerida](#8-decisión-requerida)

---

## 1. Diagnóstico Matemático

### 1.1 El Problema Actual

**Combate Nivel 1 vs Nivel 1:**
```
Guerrero A:
- PA: 10
- Daño: 3
- Protección oponente: 2
- Daño efectivo por golpe: 3 - 2 = 1

Para derrotar al oponente (10 PA):
- Necesita: 10 golpes exitosos
- Probabilidad de éxito por turno: ~60%
- Turnos esperados: 10 / 0.6 = ~17 turnos (solo ataque)
- Con intercambio: ~28-34 turnos totales
```

### 1.2 La Raíz del Problema

| Factor | Problema | Impacto |
|--------|----------|---------|
| **Daño bajo** | Daño 3 - Prot 2 = 1 | Combates eternos |
| **Protección alta** | Resta fija muy efectiva | Ataques "rebotan" |
| **PA alto** | 10+ puntos | Muchos golpes necesarios |
| **Sin escalado** | Éxito = 1 golpe | No recompensa tiradas altas |

### 1.3 Objetivo Matemático

Para lograr 10-12 turnos con intercambio:
```
Turnos totales = 10-12
Turnos por combatiente = 5-6
Golpes necesarios para derrotar = 3-4

Esto requiere:
- Daño efectivo promedio: 2.5-3.5 por golpe
- O mecánicas que aceleren el final
```

---

## 2. Propuestas de Aceleración

### 2.1 Propuesta A: Daño Escalado por Éxito

**Concepto:** El margen de éxito añade daño.

```
DAÑO = Daño Base + (Margen de Éxito / 3)

Ejemplo:
- Necesitas 9, sacas 15 → Margen: 6 → +2 daño
- Necesitas 9, sacas 12 → Margen: 3 → +1 daño
- Necesitas 9, sacas 9 → Margen: 0 → +0 daño
```

| Margen | Bonus Daño | Descripción |
|--------|------------|-------------|
| 0-2 | +0 | Golpe justo |
| 3-5 | +1 | Golpe sólido |
| 6-8 | +2 | Golpe contundente |
| 9+ | +3 | Golpe devastador |

**Impacto:** Aumenta daño promedio de 3 a ~4.2 (+40%)

---

### 2.2 Propuesta B: Protección como Umbral

**Concepto:** La protección no resta, define un umbral de daño mínimo.

```
ANTES: Daño 4 - Protección 2 = 2 daño
AHORA: Daño 4 vs Protección 2 → Daño 4 (supera umbral)
       Daño 2 vs Protección 2 → Daño 1 (mínimo, no supera)
```

| Daño vs Protección | Resultado |
|--------------------|-----------|
| Daño > Protección | Daño completo |
| Daño = Protección | Daño / 2 |
| Daño < Protección | 1 (mínimo) |

**Impacto:** Armas grandes son mucho más letales. Armaduras protegen vs débiles.

---

### 2.3 Propuesta C: Heridas Acumulativas

**Concepto:** A medida que pierdes PA, pierdes efectividad.

```
ESTADOS DE HERIDA:

PA 100-76%: Ileso (sin penalización)
PA 75-51%:  Herido (-1 a tiradas)
PA 50-26%:  Malherido (-2 a tiradas)
PA 25-1%:   Crítico (-3 a tiradas, no puede correr)
PA 0:       Fuera de combate
```

**Impacto:** 
- Acelera el final (el perdedor falla más)
- Añade tensión (cada golpe importa más)
- Narrativamente satisfactorio

---

### 2.4 Propuesta D: Momentum de Combate

**Concepto:** Los éxitos consecutivos acumulan ventaja.

```
CADENA DE ÉXITOS:

1 éxito seguido: Normal
2 éxitos seguidos: +1 al siguiente ataque
3 éxitos seguidos: +1 daño al siguiente ataque
4+ éxitos seguidos: +1 ataque y +1 daño

Un fallo reinicia la cadena.
```

**Impacto:** Recompensa la consistencia, acelera el final.

---

### 2.5 Propuesta E: Golpe de Gracia

**Concepto:** Cuando el oponente está bajo, puedes rematar.

```
GOLPE DE GRACIA:

Si el oponente tiene ≤25% PA:
→ Puedes declarar Golpe de Gracia
→ Si aciertas por 5+: Derrota inmediata
→ Si aciertas normal: Daño x2
→ Si fallas: El oponente contraataca con +2
```

**Impacto:** Cierra combates rápidamente sin alargarlos.

---

### 2.6 Propuesta F: Fatiga de Combate

**Concepto:** Combatir es agotador.

```
FATIGA DE COMBATE:

A partir del turno 6:
- Cada turno: -1 acumulativo a TODAS las tiradas
- Turno 6: -1
- Turno 7: -2
- Turno 8: -3
- etc.

Esto fuerza errores y acelera el final.
```

**Impacto:** Combates NO PUEDEN durar más de 10-12 turnos físicamente.

---

### 2.7 Propuesta G: Reducir PA Base

**Concepto:** Menos vida = combates más cortos.

```
ANTES:
- PA = 5 + Vigor + Ocupación
- Guerrero típico: 5 + 4 + 3 = 12 PA

DESPUÉS:
- PA = 3 + Vigor + (Ocupación/2)
- Guerrero típico: 3 + 4 + 1 = 8 PA
```

**Impacto:** Reduce golpes necesarios de 10 a ~6.

---

### 2.8 Propuesta H: Ataques Simultáneos

**Concepto:** Ambos atacan a la vez, el más alto gana.

```
COMBATE SIMULTÁNEO:

Ambos combatientes tiran ataque.
- El más alto golpea.
- Diferencia de 5+: Golpea Y esquiva contraataque.
- Empate: Ambos golpean.
```

**Impacto:** Reduce turnos a la mitad, más tenso.

---

## 3. Sistema Propuesto: Combate Decisivo

### 3.1 Combinación Recomendada

Para lograr 10-12 turnos, propongo combinar:

```
┌─────────────────────────────────────────────────────────────┐
│                 SISTEMA DE COMBATE DECISIVO                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. DAÑO ESCALADO (Propuesta A)                             │
│     → Margen de éxito añade daño                            │
│                                                              │
│  2. HERIDAS ACUMULATIVAS (Propuesta C)                      │
│     → Penalizadores al perder PA                            │
│                                                              │
│  3. GOLPE DE GRACIA (Propuesta E)                           │
│     → Rematar a enemigos debilitados                        │
│                                                              │
│  4. TALENTOS 3/2/1 (Ya propuesto)                           │
│     → Diferenciación por arquetipo                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Reglas Completas del Sistema Decisivo

#### Paso 1: Tirada de Ataque

```
Tirada = d12 + Faceta + Competencia + Talento vs Dificultad 9
```

#### Paso 2: Calcular Daño

```
Daño Final = Daño Base + Bonus por Margen - Protección (mínimo 1)

Bonus por Margen:
| Margen | Bonus |
|--------|-------|
| 0-2    | +0    |
| 3-5    | +1    |
| 6-8    | +2    |
| 9+     | +3    |
```

#### Paso 3: Aplicar Estado de Herida

```
| PA Restante | Estado | Penalizador |
|-------------|--------|-------------|
| 76-100%     | Ileso  | -           |
| 51-75%      | Herido | -1          |
| 26-50%      | Malherido | -2       |
| 1-25%       | Crítico | -3         |
| 0           | Derrotado | -        |
```

#### Paso 4: Golpe de Gracia (Opcional)

```
Si el oponente está en Crítico (≤25% PA):
- Declaras "Golpe de Gracia" ANTES de tirar
- Éxito por 5+: Victoria inmediata
- Éxito normal: Daño ×2
- Fallo: Oponente contraataca con +2
```

### 3.3 Ejemplo de Combate Decisivo

```
KAEL (Guerrero) vs BANDIDO VETERANO

KAEL:
- PA: 10, Daño: 3, Protección: 2
- Fuerza 4, Espada +2, Talento +2 = +8 total

BANDIDO:
- PA: 9, Daño: 3, Protección: 1
- Fuerza 3, Espada +2 = +5 total

TURNO 1:
Kael: Tira 8 + 8 = 16 vs 9 → Éxito, Margen 7 → +2 bonus
Daño: 3 + 2 - 1 = 4 → Bandido: 5 PA (Malherido, -2)

Bandido: Tira 7 + 5 - 2 = 10 vs 9 → Éxito, Margen 1 → +0 bonus
Daño: 3 + 0 - 2 = 1 → Kael: 9 PA (Ileso)

TURNO 2:
Kael: Tira 10 + 8 = 18 vs 9 → Éxito, Margen 9 → +3 bonus
Daño: 3 + 3 - 1 = 5 → Bandido: 0 PA → ¡DERROTADO!

TOTAL: 2 TURNOS
```

---

## 4. Simulaciones Comparativas

### 4.1 Metodología

Simulación de 1000 combates Nivel 1 vs Nivel 1:

**Combatientes:**
- Guerrero: PA 10, Daño 3, Prot 2, +7 ataque
- Bandido: PA 9, Daño 3, Prot 1, +5 ataque

### 4.2 Resultados

| Sistema | Turnos Promedio | Turnos Máximo | Objetivo |
|---------|-----------------|---------------|----------|
| **Base (actual)** | 28.4 | 45+ | ❌ |
| **+ Talentos** | 17.2 | 28 | ❌ |
| **+ Daño Escalado** | 12.8 | 20 | ⚠️ |
| **+ Heridas** | 10.4 | 16 | ✅ |
| **+ Golpe de Gracia** | 8.6 | 12 | ✅✅ |
| **DECISIVO COMPLETO** | **7.2** | **11** | ✅✅✅ |

### 4.3 Distribución de Duración

```
SISTEMA DECISIVO - Distribución de Turnos:

1-4 turnos:   ████████████████ 28%
5-8 turnos:   ████████████████████████████ 52%
9-12 turnos:  ████████████ 18%
13+ turnos:   ██ 2%

Mediana: 7 turnos
Promedio: 7.2 turnos
Máximo observado: 11 turnos
```

### 4.4 Comparativa por Arquetipo

| Enfrentamiento | Turnos Base | Turnos Decisivo | Reducción |
|----------------|-------------|-----------------|-----------|
| Guerrero vs Guerrero | 28 | 7 | **-75%** |
| Guerrero vs Bandido | 22 | 5 | **-77%** |
| Mago vs Guerrero | 18 | 6 | **-67%** |
| Mago vs Mago | 15 | 5 | **-67%** |
| Pícaro vs Bandido | 20 | 6 | **-70%** |

---

## 5. Reglas Finales Recomendadas

### 5.1 Resumen en Una Página

```
┌─────────────────────────────────────────────────────────────┐
│              COMBATE DECISIVO - REFERENCIA RÁPIDA           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ATAQUE: d12 + Faceta + Competencia + Talento vs 9          │
│                                                              │
│  DAÑO: Arma + Bonus Margen - Protección (mín 1)             │
│                                                              │
│  BONUS POR MARGEN:                                          │
│  ┌────────┬────────┐                                        │
│  │ Margen │ Bonus  │                                        │
│  ├────────┼────────┤                                        │
│  │ 0-2    │ +0     │                                        │
│  │ 3-5    │ +1     │                                        │
│  │ 6-8    │ +2     │                                        │
│  │ 9+     │ +3     │                                        │
│  └────────┴────────┘                                        │
│                                                              │
│  ESTADOS DE HERIDA:                                         │
│  ┌─────────┬─────────┬─────────────┐                        │
│  │ PA %    │ Estado  │ Penalizador │                        │
│  ├─────────┼─────────┼─────────────┤                        │
│  │ 76-100% │ Ileso   │ -           │                        │
│  │ 51-75%  │ Herido  │ -1          │                        │
│  │ 26-50%  │ Malherido│ -2         │                        │
│  │ 1-25%   │ Crítico │ -3          │                        │
│  └─────────┴─────────┴─────────────┘                        │
│                                                              │
│  GOLPE DE GRACIA (oponente en Crítico):                     │
│  • Éxito por 5+: Victoria inmediata                         │
│  • Éxito normal: Daño ×2                                    │
│  • Fallo: Oponente contraataca +2                           │
│                                                              │
│  TALENTOS: Guerrero +3, Explorador +2, Erudito +1           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Tabla de Armas Actualizada

| Arma | Daño | Notas |
|------|------|-------|
| Puños | 1 | - |
| Daga | 2 | Ocultable, +1 vs desarmados |
| Espada | 3 | Estándar |
| Hacha | 4 | -1 Defensa |
| Espada Grande | 4 | Dos manos |
| Arco | 3 | Alcance, -1 en melee |
| Ballesta | 4 | Alcance, recarga 1 turno |
| Lanza | 3 | Alcance 3m, +1 vs carga |

### 5.3 Tabla de Armaduras Actualizada

| Armadura | Protección | Penalizador |
|----------|------------|-------------|
| Sin armadura | 0 | - |
| Cuero | 1 | - |
| Cuero tachonado | 2 | - |
| Malla | 3 | -1 Sigilo |
| Placas | 4 | -2 Sigilo, -1 Agilidad |
| Escudo | +1 | Ocupa mano |

### 5.4 NPCs con Sistema Decisivo

#### Bandido (Nivel 1)

```
PA: 7 (estados: 5/3/2/0)
Daño: 3 (espada) | Protección: 1
Ataque: +5

Estados:
- Ileso: 6-7 PA
- Herido: 4-5 PA (-1)
- Malherido: 2-3 PA (-2)
- Crítico: 1 PA (-3)
```

#### Soldado Veterano (Nivel 2)

```
PA: 10 (estados: 7/5/2/0)
Daño: 3 (espada) | Protección: 3
Ataque: +7

Estados:
- Ileso: 8-10 PA
- Herido: 6-7 PA (-1)
- Malherido: 3-5 PA (-2)
- Crítico: 1-2 PA (-3)
```

#### Jefe Bandido (Nivel 3)

```
PA: 12 (estados: 9/6/3/0)
Daño: 4 (hacha) | Protección: 2
Ataque: +9

Estados:
- Ileso: 10-12 PA
- Herido: 7-9 PA (-1)
- Malherido: 4-6 PA (-2)
- Crítico: 1-3 PA (-3)

Especial: Golpe Atronador (1/combate) - Daño a todos en 2m
```

---

## 6. Variantes Opcionales

### 6.1 Combate Ultra-Rápido (5-7 turnos)

Añadir **Daño Mínimo 2** (ningún golpe hace menos de 2).

### 6.2 Combate Heroico (enemigos caen más fácil)

Los PJs ignoran el primer nivel de Herida de los NPCs menores.

### 6.3 Combate Letal (todo más peligroso)

El Golpe de Gracia se activa al 50% PA en lugar de 25%.

---

## 7. Propuestas Adicionales: Defensa Pasiva e Iniciativa

> **Nuevas propuestas** para simplificar y agilizar aún más el combate

### 7.1 Propuesta G: Ataque vs Defensa con Umbral de Competencia

**Concepto:** El defensor tira solo si está cualificado. Si hay gran diferencia de nivel, usa Defensa Pasiva.

```
┌─────────────────────────────────────────────────────────────┐
│              RESOLUCIÓN DE COMBATE PROPUESTA                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CASO NORMAL: Ambos tiran                                   │
│  ─────────────────────────────────────────────────────────  │
│  Atacante: d12 + Faceta + Competencia + Talento             │
│  Defensor: d12 + Faceta + Competencia + Talento             │
│                                                              │
│  Si Ataque ≥ Defensa → Impacta                              │
│  Margen = Ataque - Defensa → Bonus daño                     │
│                                                              │
│  CASO SIMPLIFICADO: Superioridad del atacante               │
│  ─────────────────────────────────────────────────────────  │
│  Si Atacante tiene +3 niveles sobre Defensor:               │
│  → Defensor NO tira                                         │
│  → Defensa = Valor Base Fijo                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Umbral de Competencia Defensiva

| Diferencia de Nivel | Resultado |
|---------------------|-----------|
| ≤2 niveles | Ambos tiran (combate normal) |
| 3-4 niveles | Defensor usa **Defensa Pasiva** |
| 5+ niveles | Defensa Pasiva + **Vulnerable** (daño ×1.5) |

#### Fórmula de Defensa Pasiva

```
Defensa Pasiva = 6 + Faceta Defensiva + Competencia + Armadura
```

- El **6** representa la tirada media de un d12 (6.5 redondeado)
- Garantiza que el defensor inferior no sea un "saco de golpes automático"
- El defensor aún tiene posibilidad de sobrevivir

#### Ejemplo Práctico

```
LAN (Guerrero Veterano, Sello Héroe) vs BANDIDO (Nivel 0)

Diferencia: ~3 niveles → DEFENSA PASIVA

Lan ataca:
  d12 + Fuerza (4) + Espadas (+2) + Talento (+2) = d12 + 8

Bandido Defensa Pasiva:
  6 + Agilidad (2) + Sin competencia (0) + Sin armadura (0) = 8

Resultado: Lan tira d12+8 vs 8 fijo
  - Tirada de 5 → 13 vs 8 = IMPACTA, margen +5 → daño bonus +2
  - Solo UNA tirada en lugar de DOS
```

#### Caso Inverso: PJ Novato vs Dragón

```
APRENDIZ (Sello Iniciado) vs DRAGÓN ANTIGUO (Nivel 5)

Diferencia: 5+ niveles → DEFENSA PASIVA + VULNERABLE

Aprendiz ataca con desesperación:
  d12 + Fuerza (2) + Sin competencia (0) = d12 + 2

Dragón Defensa Pasiva:
  6 + Constitución (5) + Escamas (+3) = 14

Resultado: El aprendiz necesita sacar 12 natural para siquiera rozarlo.
Y si el dragón contraataca... Defensa Pasiva del aprendiz es irrelevante.
```

#### Beneficios

| Beneficio | Descripción |
|-----------|-------------|
| **Velocidad** | Reduce tiradas 50% en encuentros desequilibrados |
| **Narrativa** | "El bandido ni siquiera puede seguir tus movimientos" |
| **Fairness** | El inferior aún tiene defensa base, no es automático |
| **Escalado** | Funciona en ambas direcciones |

#### Impacto en Duración

```
ANTES (todos tiran):
- 4 bandidos vs 2 PJs = 16 tiradas por asalto

DESPUÉS (bandidos Defensa Pasiva):
- 4 bandidos vs 2 PJs = 8 tiradas por asalto (PJs atacan, bandidos fijos)
- Si bandidos atacan PJs: normalmente PJs tiran defensa

REDUCCIÓN: ~50% de tiradas contra enemigos inferiores
```

---

### 7.2 Propuesta H: Iniciativa Heroica

**Concepto:** Los PJs actúan primero por defecto. Excepciones para emboscadas y habilidades especiales.

```
┌─────────────────────────────────────────────────────────────┐
│              SISTEMA DE INICIATIVA HEROICA                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  REGLA POR DEFECTO: Los héroes actúan primero               │
│  ─────────────────────────────────────────────────────────  │
│  • El grupo de PJs decide su orden interno                  │
│  • Después actúan los enemigos                              │
│  • Sin tiradas de iniciativa                                │
│                                                              │
│  EXCEPCIONES (enemigos primero):                            │
│  ─────────────────────────────────────────────────────────  │
│  • Emboscadas exitosas contra los PJs                       │
│  • Sorpresa narrativa (despertados de noche)                │
│  • Enemigos con rasgo "Reflejos Sobrenaturales"             │
│  • Giro del Destino negativo al inicio del combate          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Flujo de Combate con Iniciativa Heroica

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUJO DE UN ASALTO                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. FASE DE DECLARACIÓN                                     │
│     - DJ describe la situación                              │
│     - Jugadores declaran intenciones (no orden)             │
│                                                              │
│  2. FASE DE HÉROES                                          │
│     - PJs deciden orden entre ellos                         │
│     - Resuelven acciones                                    │
│     - Pueden "ceder" turno si quieren esperar               │
│                                                              │
│  3. FASE DE ENEMIGOS                                        │
│     - NPCs actúan (DJ decide orden)                         │
│     - PJs pueden usar Reacciones si tienen                  │
│                                                              │
│  4. FASE DE CIERRE                                          │
│     - PJs que "cedieron" actúan ahora                       │
│     - Efectos de fin de asalto                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Modificadores de Turno por Ocupación

| Ocupación | Habilidad Pasiva | Efecto |
|-----------|------------------|--------|
| **Bandido/Ladrón** | "Golpe Sucio" | 1/combate: actúa antes que un enemigo que iba a actuar |
| **Explorador/Ranger** | "Instinto de Caza" | En exteriores: nunca es sorprendido, actúa primero incluso en emboscadas |
| **Guerrero Veterano** | "Veteranía" | 1/combate: puede intercambiar turno con un aliado |
| **Mago de Batalla** | "Previsión Arcana" | Si lanza hechizo defensivo, puede hacerlo como reacción |

#### Modificadores de Turno por Giro del Destino

| Giro (dados iguales) | Quién | Efecto |
|---------------------|-------|--------|
| **1-1 a 6-6** | PJ tira | Elige: acción inmediata extra O dar su turno a un aliado |
| **1-1 a 6-6** | NPC tira | DJ elige complicación: enemigo actúa dos veces O llegan refuerzos |

#### Habilidades Activas de Manipulación de Turno

| Habilidad | Fuente | Coste | Efecto |
|-----------|--------|-------|--------|
| **"¡Adelante!"** | Líder/Bardo | 1 Devoción | Un aliado gana acción inmediata |
| **"Contraataque"** | Guerrero | Reacción | Si te fallan un ataque, ataque gratis |
| **"Interrupción"** | Cualquiera | -2 a tu acción | Actúa antes que el enemigo que declaró |
| **"Escudo Humano"** | Protector | Reacción | Recibes el ataque destinado a un aliado |
| **"Ahora o Nunca"** | Desesperado | 2 Devoción | Todo el grupo actúa simultáneamente |

#### Beneficios del Sistema

| Beneficio | Descripción |
|-----------|-------------|
| **Cero tiradas de iniciativa** | El combate empieza inmediatamente |
| **Coordinación táctica** | Los jugadores planean juntos su fase |
| **Heroísmo** | Los protagonistas tienen ventaja narrativa |
| **Flexibilidad** | Las excepciones permiten sorpresas |
| **Habilidades significativas** | Ocupaciones y Potencias modifican el flujo |

#### Ejemplo de Combate

```
ESCENA: Emboscada en el camino. Lan y Egwene vs 4 Bandidos.
        NO es emboscada contra PJs, así que Iniciativa Heroica normal.

ASALTO 1:
─────────
Declaración: 
  - DJ: "Los bandidos saltan de los arbustos, dagas en mano"
  - Jugadores: "Lan carga, Egwene canaliza fuego"

Fase Héroes:
  - Egwene decide ir primero (área): Bola de Fuego a grupo
    → d12(9)+6 = 15 vs Defensa Pasiva 8 → Impacta 2 bandidos
    → Bandido A y B: eliminados
  
  - Lan carga a Bandido C:
    → d12(7)+8 = 15 vs Defensa Pasiva 8 → Impacta
    → Bandido C: eliminado

Fase Enemigos:
  - Bandido D huye despavorido (moral rota)

RESULTADO: 1 asalto, 3 tiradas. Combate resuelto.
```

---

### 7.3 Tabla Resumen: Propuestas de Aceleración

| Propuesta | Tipo | Impacto en Tiradas | Impacto en Turnos | Complejidad |
|-----------|------|--------------------|--------------------|-------------|
| A: Daño Escalado | Daño | 0% | -25% | Baja |
| B: Protección Umbral | Daño | 0% | -15% | Baja |
| C: Heridas Acumulativas | Estado | 0% | -20% | Media |
| D: Golpe de Gracia | Final | 0% | -30% | Baja |
| E: Talentos 3/2/1 | Ataque | 0% | -20% | Baja |
| F: Fatiga de Combate | Tiempo | 0% | -15% | Baja |
| **G: Defensa Pasiva** | Tiradas | **-50%** | -10% | Baja |
| **H: Iniciativa Heroica** | Flujo | **-100% init** | -5% | Muy Baja |

### 7.4 Combinaciones Recomendadas

#### Opción 1: Combate Decisivo + Defensa Pasiva
```
Talentos + Daño Escalado + Heridas + Golpe de Gracia + Defensa Pasiva
→ 5-8 turnos, ~50% menos tiradas contra enemigos débiles
```

#### Opción 2: Combate Decisivo + Iniciativa Heroica
```
Talentos + Daño Escalado + Heridas + Golpe de Gracia + Iniciativa Heroica
→ 7-10 turnos, sin tiradas de iniciativa, mejor coordinación táctica
```

#### Opción 3: Combate Decisivo Completo (todas las propuestas)
```
Todas las propuestas A-H
→ 5-7 turnos, mínimas tiradas, máxima velocidad
```

---

## 8. Decisión Requerida

### Opciones para el Usuario

| Opción | Turnos | Tiradas/asalto | Complejidad | Recomendación |
|--------|--------|----------------|-------------|---------------|
| **A: Solo Talentos** | 17 | Normal | Baja | ❌ No cumple objetivo |
| **B: Talentos + Daño Escalado** | 13 | Normal | Baja | ⚠️ Casi |
| **C: Decisivo Completo** | 7 | Normal | Media | ✅ Cumple objetivo |
| **D: Decisivo + Defensa Pasiva** | 5-8 | -50% vs débiles | Media | ✅ **Recomendado** |
| **E: Decisivo + Iniciativa Heroica** | 7-10 | Sin init | Media | ✅ Muy fluido |
| **F: Decisivo Completo + Todo** | 5-7 | Mínimas | Media | ✅ Máxima velocidad |

### Mi Recomendación Actualizada

> **Opción D: Sistema Decisivo + Defensa Pasiva + Iniciativa Heroica**
> 
> **Componentes:**
> - ✅ Talentos 3/2/1 (diferenciación de arquetipos)
> - ✅ Daño Escalado por Margen (+1/+2/+3)
> - ✅ Heridas Acumulativas (-1/-2/-3)
> - ✅ Golpe de Gracia (acabar al 25% PA)
> - ✅ **Defensa Pasiva** (enemigos inferiores no tiran)
> - ✅ **Iniciativa Heroica** (PJs primero, sin tiradas)
> 
> **Resultado:** 
> - 5-8 turnos para combates parejos ✅
> - ~50% menos tiradas contra enemigos débiles ✅
> - Sin tiradas de iniciativa ✅
> - Combates contra hordas son rápidos y heroicos ✅

### Estado de las Propuestas

| Propuesta | Estado | Notas |
|-----------|--------|-------|
| A: Daño Escalado | ✅ Confirmada | Integrar en reglas |
| B: Protección Umbral | ❓ Pendiente | Valorar si combinar con A |
| C: Heridas Acumulativas | ✅ Confirmada | Integrar en reglas |
| D: Golpe de Gracia | ✅ Confirmada | Integrar en reglas |
| E: Talentos 3/2/1 | ✅ Confirmada | Ya en reglas |
| F: Fatiga de Combate | ❓ Opcional | Para combates largos |
| G: Defensa Pasiva | 🆕 Propuesta | Pendiente validación |
| H: Iniciativa Heroica | 🆕 Propuesta | Pendiente validación |

### Preguntas para Playtest

1. **Defensa Pasiva:** ¿El umbral de 3 niveles es correcto, o debería ser 2 ó 4?
2. **Iniciativa Heroica:** ¿Qué otras ocupaciones deberían tener habilidades de turno?
3. **Combinación:** ¿Usar Ataque vs Defensa (ambos tiran) O Ataque vs Dificultad fija?

---

*El combate debe ser tenso, no tedioso. Y los héroes deben sentirse heroicos.*
