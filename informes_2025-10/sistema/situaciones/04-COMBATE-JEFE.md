# ⚔️ Situación 04: Grupo vs Jefe

> **Objetivo:** Testear combates contra enemigos poderosos únicos
> **Reglas a validar:** Escalado de amenazas, acciones de jefe, fases de combate

---

## Escenario A: Grupo de 4 vs Myrddraal (WoT)

### Contexto
Un Fado (Myrddraal) embosca al grupo en las Colinas Emyn Muil. Criatura de nivel superior con habilidades especiales.

### Setup: Grupo de Héroes (Sello Viaje)

**Lan** - Guerrero | PA: 12 | Prot: 3 | Ataque: d12+8 | Daño: 3+
**Egwene** - Maga | PA: 7 | Prot: 0 | Ataque mágico: d12+6 | Daño: 4
**Perrin** - Guerrero | PA: 10 | Prot: 2 | Ataque: d12+7 | Daño: 4+
**Mat** - Pícaro | PA: 8 | Prot: 1 | Ataque: d12+6 | Daño: 2+

### Setup: Myrddraal (Jefe - Nivel de Amenaza 3)

**Myrddraal "Sin Ojos"**
```
PA: 25 | Protección: 3 (armadura oscura)
Defensa: d12 + 7 (Agilidad 5, Espadas +2)

Ataques (2 por turno):
  - Espada Thakan'dar: d12 + 9, daño 5
  - Mirada del Terror: d12 + 7, objetivo Voluntad, efecto: Paralizado 1 turno

Habilidades especiales:
  - Aura de Terror: Al inicio del combate, todos tiran Voluntad vs 12 o -2 a acciones
  - Inmortal Temporal: Sigue luchando 1d6 turnos después de llegar a 0 PA
  - Reflejos Sobrenaturales: Actúa en Fase de Héroes Y Fase de Enemigos

Resistencias:
  - Inmune a miedo y encantamiento
  - Resistente a armas no mágicas (-2 daño)
```

### Mecánica: Acciones de Jefe

El Myrddraal tiene 2 acciones por asalto y puede interrumpir:

```
ASALTO 1:

FASE DE DECLARACIÓN:
  → Myrddraal usa Aura de Terror
  → Todos tiran Voluntad vs 12:
    Lan: d12(8) + 3 = 11 → FALLA, -2 a acciones
    Egwene: d12(6) + 4 = 10 → FALLA, -2 a acciones
    Perrin: d12(9) + 2 = 11 → FALLA, -2 a acciones
    Mat: d12(4) + 2 = 6 → FALLA GRAVE, Paralizado 1 turno

FASE DE HÉROES (con penalizadores):

1. Egwene ataca con fuego (-2 terror):
   d12(7) + 6 - 2 = 11 vs Myrddraal d12(5) + 7 = 12
   → FALLA (el Fado esquiva)

2. Lan ataca (-2 terror):
   d12(10) + 8 - 2 = 16 vs Myrddraal d12(3) + 7 = 10
   → IMPACTA, margen +6, daño 3 + 2 - 2 (resistencia) = 3
   → Myrddraal: 25 - 3 = 22 PA

3. Perrin ataca (-2 terror):
   d12(6) + 7 - 2 = 11 vs Myrddraal d12(8) + 7 = 15
   → FALLA

4. Mat: Paralizado, no puede actuar

ACCIÓN INTERMEDIA DEL JEFE (Reflejos Sobrenaturales):
   Myrddraal usa Mirada del Terror en Egwene
   d12(9) + 7 = 16 vs Egwene d12(4) + 4 = 8
   → IMPACTA, Egwene Paralizada siguiente turno

FASE DE ENEMIGOS:
   
5. Myrddraal Acción 1 - Ataca Lan:
   d12(7) + 9 = 16 vs Lan d12(5) + 4 = 9
   → IMPACTA, margen +7, daño 5 + 3 - 3 = 5
   → Lan: 12 - 5 = 7 PA (Herido, -1)

6. Myrddraal Acción 2 - Ataca Perrin:
   d12(8) + 9 = 17 vs Perrin d12(6) + 3 = 9
   → IMPACTA, margen +8, daño 5 + 3 - 2 = 6
   → Perrin: 10 - 6 = 4 PA (Malherido, -2)
```

**Estado fin Asalto 1:**

| Combatiente | PA | Estado | Efectos |
|-------------|-----|--------|---------|
| Myrddraal | 22/25 | Ileso | - |
| Lan | 7/12 | Herido | -1, -2 terror |
| Egwene | 7/7 | Ileso | Paralizada |
| Perrin | 4/10 | Malherido | -2, -2 terror |
| Mat | 8/8 | Ileso | - (terror terminó) |

**Análisis Asalto 1:**
- El jefe dominó el combate
- Los héroes apenas hicieron daño
- Necesitan cambiar táctica

### Simulación Asaltos 2-4

**ASALTO 2:**
- Terror desaparece (solo dura 1 asalto)
- Egwene sigue paralizada
- Mat puede usar "Golpe Sucio" para atacar antes
- Lan y Perrin coordinan ataques

**Predicción:**
- Asalto 2-3: Los héroes empiezan a hacer daño
- Asalto 4: Myrddraal llega a 0 PA
- Asalto 5-6: Sigue luchando (Inmortal Temporal) → tensión final

### Qué Testea

1. **¿Las acciones de jefe son justas?**
   - 2 ataques + 1 habilidad especial
   - ¿Demasiado poderoso?

2. **¿Los penalizadores de terror funcionan?**
   - -2 es significativo sin ser letal

3. **¿El combate tiene fases?**
   - Inicio: Terror domina
   - Medio: Los héroes contraatacan
   - Final: Inmortal Temporal crea tensión

4. **¿La duración es correcta?**
   - Objetivo: 5-7 asaltos para jefe
   - ¿Se cumple?

---

## Escenario B: Grupo de 3 vs Troll de las Cavernas (Fantasía)

### Setup: Troll (Jefe - Nivel de Amenaza 2)

**Troll de las Cavernas**
```
PA: 30 | Protección: 4 (piel gruesa)

Ataque (1 por turno, pero poderoso):
  - Mazo de Piedra: d12 + 8, daño 8

Habilidades:
  - Regeneración: Recupera 3 PA al inicio de cada turno
  - Vulnerable al Fuego: El fuego anula Regeneración 1 turno
  - Golpe Aturdidor: Si hace 6+ daño, objetivo pierde próxima acción
  - Lento: Siempre actúa último en Fase de Enemigos
```

### Táctica Requerida

Para ganar, los PJs deben:
1. Usar fuego para anular regeneración
2. Coordinar ataques para máximo daño
3. El tanque debe absorber los golpes

### Simulación

```
ASALTO 1:
Héroes hacen 10 daño total
Troll regenera 3 → Neto: 7 daño
Troll ataca al tanque: 8 daño - 3 prot = 5 daño

ASALTO 2:
Mago usa fuego → Sin regeneración este turno
Héroes hacen 12 daño
Troll: 30 - 7 - 12 = 11 PA

ASALTO 3:
Sin fuego (recurso agotado) → Troll regenera 3
Héroes hacen 10 daño, neto 7
Troll: 11 - 7 = 4 PA

ASALTO 4:
Héroes terminan al troll
```

**Duración:** 4 asaltos (correcto para jefe nivel 2)

---

## Escenario C: Solo PJ vs Dragón Joven (Imposible)

### Contexto
Testear qué pasa cuando un PJ se enfrenta a algo muy superior. El sistema debe comunicar "esto es suicida".

### Setup

**Guerrero Sello Héroe**
```
PA: 12 | Protección: 3
Ataque: d12 + 8
```

**Dragón Joven (Nivel de Amenaza 5)**
```
PA: 50 | Protección: 6 (escamas)
Defensa PASIVA: 15 (6 + 5 + 4)
Ataques (3 por turno):
  - Garras: d12 + 12, daño 6
  - Mordisco: d12 + 14, daño 10
  - Aliento de Fuego: Automático, área, daño 12
```

### Cálculos

**PJ ataca:**
- d12 + 8 vs Defensa Pasiva 15
- Necesita sacar 7+ en d12 para rozarlo
- Daño si impacta: arma - 6 protección = probablemente 0

**Dragón ataca:**
- Aliento de Fuego: 12 daño - 3 prot = 9 daño
- PJ muere en 2 turnos

**Conclusión:** El sistema comunica correctamente que esto es imposible.

---

## Diseño de Jefes: Guía

### Nivel de Amenaza

| Nivel | PA | Ataques/turno | Habilidades | Grupo recomendado |
|-------|-----|---------------|-------------|-------------------|
| 1 | 15-20 | 1 | 1-2 | 3-4 PJs Iniciado |
| 2 | 25-30 | 1-2 | 2-3 | 3-4 PJs Viaje |
| 3 | 30-40 | 2 | 3-4 | 4-5 PJs Viaje/Héroe |
| 4 | 40-50 | 2-3 | 4-5 | 4-5 PJs Héroe |
| 5 | 50+ | 3+ | 5+ | Grupo Leyenda |

### Habilidades de Jefe Comunes

| Habilidad | Efecto | Cuando usar |
|-----------|--------|-------------|
| **Acciones Extra** | 2+ ataques por turno | Jefes nivel 2+ |
| **Aura** | Penalizador a todos al inicio | Crear tensión |
| **Resistencias** | Reduce daño de ciertos tipos | Forzar táctica |
| **Fases** | Cambia habilidades al 50% PA | Combates épicos |
| **Inmortalidad Temp.** | Sigue X turnos después de 0 PA | Finales dramáticos |

---

## Registro de Pruebas

| Escenario | Asaltos | Muertes PJ | Balance |
|-----------|---------|------------|---------|
| A: vs Myrddraal | | | |
| B: vs Troll | | | |
| C: vs Dragón | | | |

---

*Un jefe debe sentirse como una amenaza real que requiere trabajo en equipo.*
