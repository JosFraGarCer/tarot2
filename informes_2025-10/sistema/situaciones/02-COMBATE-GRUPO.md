# ⚔️ Situación 02: Combate Grupo vs Grupo

> **Objetivo:** Testear combate con múltiples participantes
> **Reglas a validar:** Iniciativa Heroica, coordinación táctica, acción en masa

---

## Escenario A: Grupo de 4 PJs vs 4 Bandidos

### Contexto
Los héroes viajan por un camino y son emboscados por bandidos. Sin embargo, los PJs detectaron la emboscada (Percepción exitosa), así que NO es sorpresa.

### Setup: Grupo de Héroes

**Lan (Guerrero)**
```
PA: 12 | Protección: 3
Ataque: d12 + 8 (Fuerza 4, Espadas +2, Talento +2)
Defensa: d12 + 4 (Agilidad 3, Esquivar +1)
Daño: 3 + margen
```

**Egwene (Maga)**
```
PA: 7 | Protección: 0
Ataque mágico: d12 + 6 (Voluntad 4, Canalización +2)
Defensa: d12 + 2 (Agilidad 2)
Daño fuego: 4 (área pequeña, 2 objetivos)
Devoción: 5/5
```

**Mat (Pícaro)**
```
PA: 8 | Protección: 1
Ataque: d12 + 6 (Agilidad 4, Dagas +2)
Defensa: d12 + 5 (Agilidad 4, Esquivar +1)
Daño: 2 + margen
Habilidad: "Golpe Sucio" - 1/combate actúa antes que un enemigo
```

**Perrin (Guerrero/Explorador)**
```
PA: 10 | Protección: 2
Ataque: d12 + 7 (Fuerza 4, Hachas +2, Talento +1)
Defensa: d12 + 3 (Agilidad 2, Esquivar +1)
Daño: 4 + margen
```

### Setup: Bandidos (4x)

**Bandido Genérico (Nivel 0)**
```
PA: 5 | Protección: 1
Ataque: d12 + 3 (Fuerza 2, Dagas +1)
Defensa: d12 + 2 (Agilidad 2)
Defensa PASIVA: 8 (6 + Agilidad 2)
Daño: 2
```

### Simulación con Iniciativa Heroica

**Fase de Declaración:**
- DJ: "Cuatro bandidos saltan de los arbustos, dagas en mano"
- Jugadores deciden plan: Egwene fuego a grupo, Lan carga, Mat flanquea, Perrin protege a Egwene

**ASALTO 1:**

```
FASE DE HÉROES (PJs deciden orden):

1. Egwene - Bola de Fuego a Bandidos A y B
   d12(8) + 6 = 14 vs Defensa Pasiva 8 (diferencia 3+ niveles)
   → IMPACTA ambos, margen +6 = daño 4 + 2 = 6 cada uno
   → Bandido A: 5 - 6 = ELIMINADO
   → Bandido B: 5 - 6 = ELIMINADO
   
2. Lan - Carga a Bandido C
   d12(6) + 8 = 14 vs Defensa Pasiva 8
   → IMPACTA, margen +6 = daño 3 + 2 = 5
   → Bandido C: 5 - 5 = 0 PA → ELIMINADO (Golpe de Gracia)
   
3. Perrin - Ataca Bandido D
   d12(4) + 7 = 11 vs Defensa Pasiva 8
   → IMPACTA, margen +3 = daño 4 + 1 = 5
   → Bandido D: 5 - 5 = 0 PA → ELIMINADO

4. Mat - No necesita actuar, reserva acción
   → Puede actuar en Fase de Cierre si aparecen más enemigos

FASE DE ENEMIGOS:
   → No quedan bandidos

FASE DE CIERRE:
   → Mat registra el campamento enemigo
```

**Resultado:** 1 asalto, 4 tiradas (solo ataques, sin defensas), 4 bandidos eliminados.

### Análisis

| Métrica | Esperado | Real |
|---------|----------|------|
| Asaltos | 1-2 | 1 |
| Tiradas totales | 4-8 | 4 |
| Daño recibido PJs | 0-5 | 0 |
| ¿Defensa Pasiva útil? | Sí | ✅ |

**Observaciones:**
- Defensa Pasiva reduce tiradas a la mitad
- Iniciativa Heroica permite coordinación táctica
- Los bandidos no tuvieron oportunidad (correcto narrativamente)

---

## Escenario B: 4 PJs vs 4 Guardias Entrenados

### Contexto
Los héroes necesitan entrar en un castillo. Guardias de nivel comparable les bloquean el paso.

### Setup: Guardias (Sello Viaje)

**Guardia Entrenado (x4)**
```
PA: 9 | Protección: 3 (cota de malla)
Ataque: d12 + 5 (Fuerza 3, Espadas +1, Talento +1)
Defensa: d12 + 4 (Agilidad 2, Escudos +2)
Daño: 3
Diferencia vs PJs: ≤2 niveles → AMBOS TIRAN
```

### Simulación con Ambos Tirando

**ASALTO 1:**

```
FASE DE HÉROES:

1. Egwene - Ataque de fuego a Guardia A
   Egwene: d12(7) + 6 = 13
   Guardia A: d12(5) + 4 = 9
   → IMPACTA, margen +4 = daño 4 + 1 = 5
   → Guardia A: 9 - 5 = 4 PA (Malherido, -2)

2. Lan - Ataca Guardia B
   Lan: d12(9) + 8 = 17
   Guardia B: d12(3) + 4 = 7
   → IMPACTA, margen +10 = daño 3 + 3 = 6
   → Guardia B: 9 - 6 = 3 PA (Crítico, -3)

3. Perrin - Ataca Guardia C
   Perrin: d12(5) + 7 = 12
   Guardia C: d12(8) + 4 = 12
   → EMPATE = Atacante gana por mínimo
   → daño 4 + 0 - Protección 3 = 1
   → Guardia C: 9 - 1 = 8 PA (Ileso)

4. Mat - Ataca Guardia D (usa Golpe Sucio para ir antes que D)
   Mat: d12(6) + 6 = 12
   Guardia D: d12(4) + 4 = 8
   → IMPACTA, margen +4 = daño 2 + 1 = 3 - Prot 3 = 1 (mín)
   → Guardia D: 9 - 1 = 8 PA (Ileso)

FASE DE ENEMIGOS:

5. Guardia A (Malherido -2) - Ataca Egwene
   Guardia A: d12(6) + 5 - 2 = 9
   Egwene: d12(3) + 2 = 5
   → IMPACTA, margen +4 = daño 3 + 1 = 4
   → Egwene: 7 - 4 = 3 PA (Crítico, -3)

6. Guardia B (Crítico -3) - Ataca Lan
   Guardia B: d12(4) + 5 - 3 = 6
   Lan: d12(7) + 4 = 11
   → FALLA

7. Guardia C (Ileso) - Ataca Perrin
   Guardia C: d12(8) + 5 = 13
   Perrin: d12(5) + 3 = 8
   → IMPACTA, margen +5 = daño 3 + 2 - Prot 2 = 3
   → Perrin: 10 - 3 = 7 PA (Herido, -1)

8. Guardia D (Ileso) - Ataca Mat
   Guardia D: d12(9) + 5 = 14
   Mat: d12(6) + 5 = 11
   → IMPACTA, margen +3 = daño 3 + 1 - Prot 1 = 3
   → Mat: 8 - 3 = 5 PA (Malherido, -2)
```

**Estado fin Asalto 1:**

| Combatiente | PA | Estado |
|-------------|-----|--------|
| Lan | 12/12 | Ileso |
| Egwene | 3/7 | Crítico (-3) |
| Mat | 5/8 | Malherido (-2) |
| Perrin | 7/10 | Herido (-1) |
| Guardia A | 4/9 | Malherido (-2) |
| Guardia B | 3/9 | Crítico (-3) |
| Guardia C | 8/9 | Ileso |
| Guardia D | 8/9 | Ileso |

**Análisis Asalto 1:**
- 16 tiradas totales (8 ataques × 2 tiran cada uno)
- PJs recibieron daño significativo
- Esto es un combate PAREJO → correcto

### Predicción Asaltos 2-3

- Egwene está en peligro (Golpe de Gracia disponible para enemigos)
- Los PJs deberían priorizar eliminar amenazas
- Combate debería terminar en asalto 3-4

---

## Escenario C: 3 PJs vs 6 Goblins (Superioridad numérica enemiga)

### Contexto
Pocos héroes contra muchos enemigos débiles. Testea si Defensa Pasiva acelera suficiente.

### Setup: Goblins (Nivel -1)

**Goblin (x6)**
```
PA: 3 | Protección: 0
Ataque: d12 + 2 (Fuerza 1, Lanzas +1)
Defensa PASIVA: 7 (6 + Agilidad 1)
Daño: 2
Diferencia vs PJs: 3+ niveles → DEFENSA PASIVA
```

### Simulación Rápida

**ASALTO 1:**
```
PJs atacan (cada uno puede eliminar 1-2 goblins):
- Lan: d12+8 vs 7 → mata 1 goblin, ataque extra mata otro
- Egwene: Área de fuego → mata 2 goblins
- Perrin: d12+7 vs 7 → mata 1 goblin

Goblins restantes (1): Ataca pero probablemente falla
```

**Resultado esperado:** 1-2 asaltos, 5-6 tiradas totales.

---

## Métricas Globales

| Escenario | Tiradas/Asalto | Asaltos | Tiempo Real Est. |
|-----------|----------------|---------|------------------|
| A: vs Bandidos | 4 | 1 | 5 min |
| B: vs Guardias | 16 | 3-4 | 20 min |
| C: vs Goblins | 5-6 | 1-2 | 8 min |

---

*El combate grupal debe ser rápido contra débiles, tenso contra iguales.*
