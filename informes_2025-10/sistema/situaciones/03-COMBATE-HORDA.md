# ⚔️ Situación 03: Héroes vs Horda

> **Objetivo:** Testear combate contra muchos enemigos débiles
> **Reglas a validar:** Defensa Pasiva, ataques en área, gestión de acción

---

## Escenario A: 2 Héroes vs 12 Trollocs Menores (WoT)

### Contexto
Lan y Moiraine son acorralados en un paso de montaña. Una docena de trollocs menores les cortan el paso. Deben abrirse camino.

### Setup: Héroes

**Lan (Guerrero Legendario - Sello Leyenda)**
```
PA: 15 | Protección: 4 (armadura completa)
Ataque: d12 + 10 (Fuerza 5, Espadas +3, Talento +2)
Defensa: d12 + 6 (Agilidad 4, Esquivar +2)
Daño espada: 4 + margen
Habilidad: "Torbellino de Acero" - Ataca a 2 enemigos adyacentes
```

**Moiraine (Aes Sedai - Sello Héroe)**
```
PA: 8 | Protección: 0 (pero Escudo de Aire)
Ataque mágico: d12 + 8 (Voluntad 5, Canalización +3)
Defensa mágica: d12 + 5 (Voluntad 5) + Escudo
Daño fuego: 5 (área, hasta 4 objetivos)
Devoción: 5/5
Fatiga: 0/10
```

### Setup: Trollocs Menores (x12)

**Trolloc Menor (Nivel -1)**
```
PA: 6 | Protección: 1 (piel gruesa)
Ataque: d12 + 3 (Fuerza 3, Sin entrenamiento)
Defensa PASIVA: 7 (6 + Agilidad 1)
Daño: 3
Diferencia vs Héroes: 4+ niveles → DEFENSA PASIVA + VULNERABLE (×1.5)
```

### Simulación con Defensa Pasiva

**ASALTO 1:**

```
FASE DE HÉROES:

1. Moiraine - Muro de Fuego (área grande, 4 objetivos)
   d12(9) + 8 = 17 vs Defensa Pasiva 7
   → IMPACTA todos, margen +10 = daño 5 + 3 = 8
   → Vulnerable: 8 × 1.5 = 12 daño efectivo
   → Trollocs A, B, C, D: 6 - 12 = ELIMINADOS
   Fatiga: +2

2. Lan - Torbellino de Acero (2 objetivos)
   Trolloc E: d12(7) + 10 = 17 vs 7 → margen +10, daño 4+3 = 7
   → Trolloc E: ELIMINADO
   Trolloc F: d12(5) + 10 = 15 vs 7 → margen +8, daño 4+3 = 7
   → Trolloc F: ELIMINADO

FASE DE ENEMIGOS (quedan 6):

3-8. Trollocs G-L atacan (3 a Lan, 3 a Moiraine)
   vs Lan (d12+6): 
     Trolloc G: d12(8)+3=11 vs d12(4)+6=10 → IMPACTA, daño 3-4=0
     Trolloc H: d12(3)+3=6 vs d12(7)+6=13 → FALLA
     Trolloc I: d12(6)+3=9 vs d12(5)+6=11 → FALLA
   
   vs Moiraine (Escudo de Aire activo):
     Trollocs J-L: Escudo absorbe hasta 5 daño/turno
     Total ataques: 2 impactan × 3 daño = 6 daño
     Escudo absorbe 5, Moiraine recibe 1
     → Moiraine: 8 - 1 = 7 PA
```

**Estado fin Asalto 1:**

| Combatiente | Eliminados | Restantes |
|-------------|------------|-----------|
| Trollocs | 6 | 6 |
| Héroes daño | Moiraine -1 | - |

**ASALTO 2:**

```
FASE DE HÉROES:

1. Moiraine - Otro Muro de Fuego
   Fatiga actual: 2 → puede canalizar
   4 objetivos más: d12 + 8 vs 7
   → 4 Trollocs más ELIMINADOS (G, H, I, J)
   Fatiga: +2 = 4 total

2. Lan - Carga los 2 restantes
   Trolloc K: ELIMINADO
   Trolloc L: ELIMINADO

COMBATE TERMINADO
```

**Resultado:** 2 asaltos, ~10 tiradas totales, 12 enemigos eliminados.

### Análisis

| Métrica | Sin Def. Pasiva | Con Def. Pasiva |
|---------|-----------------|-----------------|
| Tiradas por trolloc | 2 | 1 |
| Tiradas totales | ~24 | ~10 |
| Tiempo estimado | 25 min | 10 min |

**Conclusión:** Defensa Pasiva reduce tiradas 60% contra hordas.

---

## Escenario B: Mago Solo vs 8 Esqueletos (Fantasía Clásica)

### Contexto
Un mago se enfrenta a esqueletos animados en una cripta. Testea viabilidad de magos en combate.

### Setup

**Mago de Fuego (Sello Viaje)**
```
PA: 6 | Protección: 0
Ataque mágico: d12 + 6 (Voluntad 4, Fuego +2)
Defensa: d12 + 3 (Agilidad 3)
Daño fuego: 4 (área, 2 objetivos) o 6 (objetivo único)
Devoción: 3/3
Habilidades:
  - Escudo de Fuego: Reacción, 1 Devoción, +3 defensa 1 turno
  - Explosión: 2 Devoción, daño 8 en área grande
```

**Esqueleto (x8)**
```
PA: 4 | Protección: 0 (pero vulnerable a contundente, resistente a corte)
Defensa PASIVA: 6 (6 + Agilidad 0)
Ataque: d12 + 2
Daño: 2
Debilidad: Fuego hace +2 daño
```

### Simulación

**ASALTO 1:**
```
Mago usa Explosión (2 Devoción):
  d12(8) + 6 = 14 vs 6 = margen +8
  Daño: 8 + 3 (margen) + 2 (debilidad fuego) = 13
  → 4 Esqueletos en área: ELIMINADOS

Esqueletos restantes (4) atacan:
  Mago usa Escudo de Fuego (1 Devoción)
  Defensa: d12 + 3 + 3 = d12 + 6
  → Probablemente esquiva 3/4 ataques
  → Recibe ~2 daño
  → Mago: 6 - 2 = 4 PA (Malherido)
```

**ASALTO 2:**
```
Mago (sin Devoción, Malherido -2):
  Bola de Fuego normal a 2 objetivos
  d12 + 6 - 2 = d12 + 4 vs 6
  → Probablemente elimina 1-2

Esqueletos atacan:
  Mago ya no tiene escudo
  → Recibe ~4 daño
  → Mago: 4 - 4 = 0 PA → DERROTADO
```

### Análisis

**Problema detectado:** El mago no puede sobrevivir solo.

**Posibles ajustes:**
1. Más Devoción inicial (5 en lugar de 3)
2. Escudo pasivo (no consume Devoción)
3. Daño en área mayor
4. Menos esqueletos (6 en lugar de 8)

---

## Escenario C: Grupo de 4 vs 20 Goblins (Oleadas)

### Contexto
Defensa de posición. Los goblins atacan en oleadas de 5.

### Mecánica de Oleadas

```
OLEADA 1 (5 goblins):
  → PJs eliminan 5 en 1 asalto
  → Sin daño recibido

OLEADA 2 (5 goblins):
  → PJs eliminan 4, 1 llega a melee
  → PJ tanque recibe 2 daño

OLEADA 3 (5 goblins):
  → Recursos mermados (Devoción baja)
  → PJs eliminan 3, 2 llegan a melee
  → Grupo recibe 4 daño total

OLEADA 4 (5 goblins):
  → Agotamiento (penalizadores por heridas)
  → Combate más tenso
```

### Qué Testea

1. **¿El sistema de recursos funciona?**
   - Devoción se agota
   - Heridas acumulan penalizadores

2. **¿Las oleadas crean tensión?**
   - Primeras oleadas fáciles
   - Últimas oleadas peligrosas

3. **¿Hay decisiones tácticas?**
   - ¿Gastar recursos ahora o guardar?
   - ¿Defender posición o cargar?

---

## Reglas Opcionales para Hordas

### Opción 1: Grupos de Enemigos

En lugar de 12 trollocs individuales, usar 3 "grupos" de 4:

```
Grupo de Trollocs (4 individuos)
PA: 24 (6×4) | Ataque: d12 + 5 (+2 por grupo)
Daño: 6 (3 × número que impactan)
Cuando baja de 12 PA: Se divide en 2 grupos de 2
```

### Opción 2: Ataques Combinados

Si 3+ enemigos atacan al mismo objetivo:
- Tiran una vez con +2 por cada atacante extra
- Daño = base × número de atacantes que "contribuyen"

### Opción 3: Moral

Cuando una horda pierde 50%:
- Tirada de Moral (Voluntad del líder)
- Fallo: Huyen o se rinden
- Éxito: Luchan hasta el final

---

## Registro de Pruebas

| Escenario | Turnos | Tiradas | Daño PJs | Balance |
|-----------|--------|---------|----------|---------|
| A: vs 12 Trollocs | | | | |
| B: Mago vs 8 Esqueletos | | | | |
| C: Oleadas de Goblins | | | | |

---

*Una horda debe sentirse abrumadora pero manejable para héroes.*
