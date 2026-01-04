# 🌀 Situación 08: Magia - La Rueda del Tiempo

> **Objetivo:** Testear sistema de canalización con fatiga y riesgo
> **Tipo de magia:** Poderosa, peligrosa, con consecuencias

---

## Sistema de Canalización WoT

### Mecánicas Base

```
CANALIZAR:
  Tirada: Voluntad + Canalización vs Dificultad del tejido
  
FATIGA:
  Cada canalización añade Fatiga según poder del tejido
  Fatiga > Voluntad × 3: Riesgo de quemarse
  Fatiga > Voluntad × 5: Inconsciencia automática
  
RECUPERACIÓN:
  1 Fatiga por hora de descanso
  Curación mágica puede acelerar
```

### Los Cinco Poderes

| Poder | Uso | Bonus |
|-------|-----|-------|
| **Aire** | Control, defensa, vuelo | +1 vs objetivos aéreos |
| **Agua** | Curación, detección, clima | +1 curación |
| **Tierra** | Fuerza, protección, terreno | +1 daño estructural |
| **Fuego** | Destrucción, luz, calor | +1 daño directo |
| **Espíritu** | Mente, vínculos, warding | +1 vs canalización |

### Diferencia Saidin/Saidar

| Aspecto | Saidin (Hombres) | Saidar (Mujeres) |
|---------|------------------|------------------|
| Acceso | Agarrar, dominar | Rendirse, guiar |
| Riesgo | Locura (largo plazo) | Fatiga (corto plazo) |
| Estilo | Picos de poder, impredecible | Flujo constante, sutil |
| Bonus | +1 Tierra/Fuego | +1 Aire/Agua |

---

## Escenario A: Egwene Defiende Aldea

### Contexto
Una Aprendiza Aceptada defiende una aldea de trollocs usando canalización.

### Setup

**Egwene (Aceptada - Sello Viaje)**
```
Voluntad: 4
Canalización: +2
Poderes: Fuego +1, Espíritu +1

Límites:
  Fatiga máxima segura: 12 (Voluntad × 3)
  Fatiga inconsciencia: 20 (Voluntad × 5)
  Fatiga actual: 0

Tejidos conocidos:
  - Bola de Fuego: Daño 4, Fatiga +2, 1 objetivo
  - Muro de Fuego: Daño 3, Fatiga +3, línea de 3 objetivos
  - Escudo de Aire: +3 Defensa, Fatiga +1/turno
  - Curación Menor: Recupera 4 PA, Fatiga +4
```

**Trollocs (x6)**
```
PA: 6 | Defensa Pasiva: 7
Daño: 3
```

### Simulación

**ASALTO 1:**
```
Egwene: Muro de Fuego en grupo (3 objetivos)
  Tirada: d12(8) + Voluntad(4) + Canalización(+2) + Fuego(+1) = 15
  vs Dificultad 9 → ÉXITO, margen +6
  Daño: 3 + 2 (margen) = 5 cada uno
  → Trollocs A, B, C: 6 - 5 = 1 PA (Críticos)
  Fatiga: +3 = 3 total

Trollocs D, E, F atacan:
  vs Egwene (sin escudo): d12 + 2 vs d12(5) + 2 = 7
  → Probablemente 1-2 impactan
  → Egwene recibe ~5 daño
  → Egwene: 7 - 5 = 2 PA (Crítico, -3)
```

**ASALTO 2:**
```
Egwene (Crítica -3): Decisión táctica
  Opción A: Escudo de Aire (defensivo)
  Opción B: Otro Muro de Fuego (arriesgado)
  Opción C: Curación (retirarse)

Elige B: Muro de Fuego (-3 penalizador)
  d12(6) + 4 + 2 + 1 - 3 = 10 vs Dificultad 9 → ÉXITO apenas
  → Trollocs A, B, C: ELIMINADOS (ya estaban Críticos)
  Fatiga: +3 = 6 total

Trollocs D, E, F atacan:
  → Egwene recibe más daño...
```

**ASALTO 3:**
```
Egwene: Fatiga 6/12, PA 0 → DERROTADA

Alternativa si hubiera usado Escudo:
  Escudo de Aire: +3 Defensa, Fatiga +1
  Habría sobrevivido para continuar
```

### Análisis

| Decisión | Resultado |
|----------|-----------|
| Ofensiva pura | Alta eficacia, alta fragilidad |
| Defensiva + Ofensiva | Menor daño, mayor supervivencia |
| Curación temprana | Conserva recursos para larga duración |

**Lección:** Las canalizadoras son devastadoras pero frágiles. Necesitan protección.

---

## Escenario B: Rand vs Forsaken (Combate Mágico)

### Contexto
Duelo de canalizadores de alto nivel. Testea combate mágico puro.

### Setup

**Rand (Ta'veren, Sello Héroe)**
```
Voluntad: 5
Canalización: +3
Poderes: Fuego +2, Espíritu +2
Fatiga máxima: 15

Tejidos:
  - Rayo de Balefire: Daño 10, Fatiga +6, ignora armadura
  - Escudo contra Saidin: Bloquea canalización enemiga
  - Puerta Dimensional: Escape, Fatiga +4
```

**Ishamael (Forsaken)**
```
Voluntad: 6
Canalización: +4
Fatiga máxima: 18

Tejidos:
  - Fuego Negro: Daño 8, Fatiga +4
  - Escudo de Sombra: Absorbe 10 daño mágico
  - Compulsión: Control mental si falla Voluntad
```

### Mecánica: Duelo de Canalizadores

```
FASE 1: Tanteo
  Ambos lanzan ataques menores
  Evalúan poder del oponente
  
FASE 2: Escudos
  Intentan bloquear la conexión del otro con la Fuente
  Tirada opuesta: Voluntad + Espíritu
  
FASE 3: Ataque Total
  El que tiene ventaja lanza tejidos devastadores
  El otro intenta contrarrestar o escapar
```

### Simulación

**TURNO 1:**
```
Rand: Intenta Escudo contra Saidin
  d12(9) + 5 + 3 + 2 = 19 vs Ishamael d12(7) + 6 + 4 = 17
  → Rand gana por 2, Ishamael debilitado (-2 a canalización)
  Fatiga Rand: +3 = 3

Ishamael: Fuego Negro (a través de debilidad)
  d12(8) + 6 + 4 - 2 = 16 vs Rand esquiva d12(5) + 5 = 10
  → IMPACTA, daño 8
  → Rand: PA - 8 (necesita definir PA de canalizador poderoso)
```

**TURNO 2:**
```
Rand: Balefire (arriesgado, mucha fatiga)
  d12(10) + 5 + 3 + 2 = 20 vs Ishamael Escudo de Sombra
  → Escudo absorbe 10, daño restante 0
  Fatiga Rand: +6 = 9

Ishamael: Compulsión
  d12(7) + 6 + 4 = 17 vs Rand Voluntad d12(8) + 5 = 13
  → IMPACTA, Rand debe obedecer siguiente orden...
```

### Mecánica: Ta'veren

```
Rand es Ta'veren (Potencia especial):
  - Una vez por sesión: Re-roll de cualquier tirada
  - El Patrón favorece al Ta'veren
  - Los Giros del Destino son más frecuentes (+10%)
```

---

## Escenario C: Círculo de Aes Sedai (Canalización Combinada)

### Contexto
Tres Aes Sedai combinan poder para un tejido mayor.

### Setup

**Círculo de 3 Aes Sedai**
```
Líder: Moiraine (Voluntad 5, Canalización +3)
Miembro: Siuan (Voluntad 4, Canalización +2)
Miembro: Leane (Voluntad 3, Canalización +2)

Círculo combinado:
  Voluntad efectiva: 5 (líder) + 2 (contribución) = 7
  Canalización: +3 (líder) + 1 (contribución) = +4
  Fatiga compartida: Se divide entre miembros
```

### Mecánica: Círculos

```
FORMAR CÍRCULO:
  Todas tiran Voluntad vs 12
  Si todas pasan: Círculo formado
  Si alguna falla: No se forma

CANALIZAR EN CÍRCULO:
  Líder tira con bonuses combinados
  Fatiga se divide (cada una recibe 1/3)
  Potencial máximo: Suma de poderes individuales

RIESGOS:
  Si el tejido falla gravemente:
  Toda la fatiga va a la líder
  Posible "quemarse" si excede límite
```

### Simulación: Tejido Mayor

```
Círculo intenta cerrar una Puerta de los Caminos:
  Dificultad: 18 (tejido épico)
  
Moiraine (líder): d12(10) + 7 + 4 = 21 vs 18 → ÉXITO
  Fatiga total: +8
  Dividida: Moiraine +3, Siuan +3, Leane +2

Resultado: La Puerta se cierra permanentemente.
```

---

## Tabla de Tejidos WoT

| Tejido | Dificultad | Daño/Efecto | Fatiga | Poder |
|--------|------------|-------------|--------|-------|
| Bola de Fuego | 9 | 4 daño | +2 | Fuego |
| Rayo | 11 | 6 daño | +3 | Fuego |
| Muro de Fuego | 10 | 3 daño (área) | +3 | Fuego |
| Balefire | 15 | 10 daño, borra | +6 | Fuego+Espíritu |
| Escudo de Aire | 8 | +3 defensa | +1/turno | Aire |
| Volar | 12 | Vuelo | +2/turno | Aire |
| Curación Menor | 10 | 4 PA recuperados | +4 | Agua |
| Curación Mayor | 14 | Total + enfermedades | +8 | Agua+Espíritu |
| Escudo contra Fuente | 13 | Bloquea canalización | +4 | Espíritu |
| Compulsión | 14 | Control mental | +5 | Espíritu |
| Portal | 15 | Teletransporte | +6 | Espíritu+Fuego |

---

## Registro de Pruebas

| Escenario | Fatiga final | Resultado | Notas |
|-----------|--------------|-----------|-------|
| A: Egwene vs Trollocs | | | |
| B: Rand vs Ishamael | | | |
| C: Círculo | | | |

---

*El Poder Único es una herramienta y un peligro. Úsalo con sabiduría.*
