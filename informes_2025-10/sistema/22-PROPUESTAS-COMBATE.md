# ⚔️ Propuestas de Mejora: Sistema de Combate

## 1. Diagnóstico del Combate Actual

### 1.1 Problemas Identificados (Análisis Manus)

| Problema | Causa | Impacto |
|----------|-------|---------|
| **Duración excesiva** | ~28 turnos promedio | Combates tediosos |
| **No-luchadores inviables** | 8-15% victoria vs NPCs | Frustración de jugadores |
| **Falta diferenciación** | Sin bonos por arquetipo | Todos combaten igual |
| **Iniciativa plana** | PJs siempre primero | Reduce tensión |
| **Daño lineal** | Armadura resta fijo | Combates de desgaste |

### 1.2 Métricas Objetivo

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Duración promedio | ~28 turnos | 15-20 turnos |
| Victorias Luchador vs NPC | 70-85% | 70-85% ✓ |
| Victorias No-Luchador vs NPC | 8-15% | 45-60% |
| Variedad táctica | Baja | Media-Alta |

---

## 2. Propuesta Principal: Sistema de Talentos

### 2.1 Concepto

**Talento de Arma:** Bonificador específico por tipo de arma, distribuido según arquetipo.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE TALENTOS DE ARMAS                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ARQUETIPO         PUNTOS    EJEMPLO DE DISTRIBUCIÓN                   │
│   ─────────         ──────    ──────────────────────                    │
│   Guerrero          3         Espada +2, Escudo +1                      │
│                               O: Arco +3 (especialista)                 │
│                                                                          │
│   Explorador        2         Daga +1, Arco +1                          │
│                               O: Espada +2                               │
│                                                                          │
│   Erudito/Místico   1         Bastón +1 O Daga +1                       │
│                                                                          │
│   MECÁNICA: El Talento SE SUMA al ataque con esa arma específica        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Impacto Proyectado (Datos de Manus)

| Arquetipo | Sin Talentos | Con Talentos | Mejora |
|-----------|--------------|--------------|--------|
| Guerrero (+3) | 28 turnos | 17 turnos | **-40%** |
| Explorador (+2) | 28 turnos | 20 turnos | **-29%** |
| Erudito (+1) | 28 turnos | 23 turnos | **-18%** |

### 2.3 Ejemplo de Personajes

**Cayo el Legionario (Guerrero)**
- Fuerza: 3
- Competencia Espadas: +2
- **Talento Gladius: +2**
- Total ataque con Gladius: **+7**

**Marcus el Filósofo (Erudito)**
- Fuerza: 1
- Competencia Bastones: +1
- **Talento Bastón: +1**
- Total ataque con Bastón: **+3**

**Diferencia clara:** El guerrero tiene +4 sobre el filósofo en combate, lo cual es correcto narrativamente.

---

## 3. Propuesta: Iniciativa Dinámica

### 3.1 Problema Actual

> "Los PJ actúan primero por defecto"

Esto:
- Reduce tensión (siempre sabes que actúas primero)
- No refleja diferentes velocidades de reacción
- Hace la Agilidad menos relevante

### 3.2 Propuesta: Iniciativa por Tirada

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INICIATIVA DINÁMICA                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   TIRADA: 1d12 + Agilidad (una vez al inicio del combate)               │
│                                                                          │
│   MODIFICADORES:                                                         │
│   ─────────────                                                          │
│   +3  Emboscada preparada                                               │
│   +2  Arma ya desenvainada                                              │
│   +1  Terreno familiar                                                  │
│   -2  Sorprendido                                                       │
│   -3  Terreno desfavorable (barro, oscuridad)                           │
│                                                                          │
│   EMPATES: El personaje con mayor Agilidad actúa primero                │
│            Si igual, el que tenga arma más ligera                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Alternativa Simplificada

Si se prefiere evitar una tirada extra:

```
INICIATIVA ESTÁTICA: Agilidad + Percepción

Empates: Agilidad > Arma ligera > PJ antes que NPC
```

---

## 4. Propuesta: Daño Escalonado

### 4.1 Problema Actual

```
Daño Neto = Daño Arma - Protección Armadura
Mínimo = 1 (si impactas, siempre haces daño)
```

**Resultado:** Combates largos contra armadura pesada.

### 4.2 Propuesta: Tipos de Daño

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TIPOS DE DAÑO Y ARMADURA                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   TIPO ARMA      EJEMPLOS           vs LIGERA  vs MEDIA  vs PESADA      │
│   ─────────      ────────           ─────────  ────────  ────────       │
│   Cortante       Espada, Hacha      Normal     -1        -2             │
│   Perforante     Lanza, Estoque     +1         Normal    -1             │
│   Contundente    Maza, Martillo     -1         Normal    +1             │
│                                                                          │
│   INTERPRETACIÓN:                                                        │
│   +1 = +1 daño extra    Normal = daño base    -1 = -1 daño             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Ejemplo

**Gladius (Cortante, Daño 3) vs Lorica Segmentata (Pesada, Protección 3)**
- Actual: 3 - 3 = 0 → Mínimo 1
- Propuesto: 3 - 2 (tipo) - 3 = -2 → Mínimo 1

**Maza (Contundente, Daño 3) vs Lorica Segmentata**
- Actual: 3 - 3 = 0 → Mínimo 1
- Propuesto: 3 + 1 (tipo) - 3 = 1 → 1 daño

**Efecto:** Las mazas son mejores contra armadura pesada (históricamente correcto).

---

## 5. Propuesta: Maniobras Tácticas Expandidas

### 5.1 Maniobras Actuales

- Ataque Total (+2 daño, -2 defensa)
- Defensa Total (+2 defensa, no ataca)
- Ataque Dirigido (-2, elige localización)

### 5.2 Nuevas Maniobras Propuestas

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MANIOBRAS TÁCTICAS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   MANIOBRA          COSTE           EFECTO                              │
│   ────────          ─────           ──────                              │
│                                                                          │
│   OFENSIVAS:                                                             │
│   Carga             Movimiento      +2 daño primer ataque               │
│   Ataque Rápido     -2 daño         Dos ataques este turno              │
│   Golpe Aturdidor   -2 ataque       Éxito = -2 próximo turno enemigo    │
│   Desarme           -4 ataque       Éxito = enemigo pierde arma         │
│                                                                          │
│   DEFENSIVAS:                                                            │
│   Parada Activa     Reacción        Tirada opuesta, anula ataque        │
│   Esquiva           Reacción        -4 pero evita todo el daño          │
│   Cubrir Aliado     Acción          Recibes ataques dirigidos a aliado  │
│                                                                          │
│   POSICIONALES:                                                          │
│   Flanquear         Movimiento      +2 si aliado al otro lado           │
│   Empujar           vs Fuerza       Mueve al objetivo 2m                │
│   Derribar          -2 ataque       Éxito = objetivo en suelo (-2)      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Maniobras por Arquetipo

Ciertos arquetipos tienen acceso a maniobras especiales:

| Arquetipo | Maniobra Única |
|-----------|----------------|
| **Guerrero** | Golpe Devastador: Una vez/combate, daño x2 |
| **Explorador** | Ataque Furtivo: +3 daño si no te han visto |
| **Gladiador** | Espectáculo: +2 si haces maniobra arriesgada |
| **Legionario** | Formación: +2 defensa si aliado adyacente |

---

## 6. Propuesta: Heridas Narrativas

### 6.1 Sistema Actual

| Tipo | Trigger | Efecto |
|------|---------|--------|
| Leve | 1-3 daño | Nada |
| Grave | 4-6 daño | -1 todo |
| Crítica | 7+ daño | -2 todo |

### 6.2 Propuesta: Heridas con Consecuencias

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE HERIDAS NARRATIVAS                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   UMBRAL HERIDA GRAVE: 50% Aguante Máximo                               │
│   UMBRAL HERIDA CRÍTICA: 25% Aguante Máximo                             │
│   UMBRAL INCAPACITADO: 0 Aguante                                        │
│                                                                          │
│   Al cruzar un umbral, tira 1d12:                                       │
│                                                                          │
│   HERIDA GRAVE (50%)                                                     │
│   1-4:  Brazo herido → -2 a ataques                                     │
│   5-8:  Pierna herida → -2 a movimiento                                 │
│   9-12: Cabeza/Torso → -1 a todo                                        │
│                                                                          │
│   HERIDA CRÍTICA (25%)                                                   │
│   1-4:  Brazo inutilizado → No puedes usar esa mano                     │
│   5-8:  Pierna inutilizada → Velocidad 1/2, -4 esquiva                  │
│   9-12: Hemorragia → -1 Aguante/turno hasta estabilizar                 │
│                                                                          │
│   INCAPACITADO (0)                                                       │
│   Inconsciente. Tirada de Vigor cada turno o mueres.                    │
│   Aliados pueden estabilizar con Medicina.                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Recuperación

| Tipo Herida | Tiempo de Curación | Con Medicina |
|-------------|-------------------|--------------|
| Grave | 1 semana | 3 días |
| Crítica | 1 mes | 1 semana |

---

## 7. Propuesta: Combate Rápido (Opcional)

Para grupos que quieren combates AÚN más rápidos:

### 7.1 Regla de Combate Abstracto

```
COMBATE EN UNA TIRADA (para encuentros menores)

1. Cada bando hace una tirada representativa
2. El ganador inflige (Margen de éxito) de daño
3. Repetir hasta que un bando caiga

Ejemplo:
- PJs (líder con +7) tira 8+7=15
- Bandidos (líder con +4) tira 6+4=10
- PJs ganan por 5 → 5 daño a los bandidos
- Bandidos tenían 12 Aguante → Quedan 7
```

### 7.2 Regla de Daño Masivo

```
Si el ataque supera la Dificultad por 6 o más:
→ Daño x1.5 (redondeado arriba)

Si supera por 10 o más:
→ Daño x2
```

---

## 8. Resumen de Propuestas de Combate

| Propuesta | Objetivo | Complejidad | Prioridad |
|-----------|----------|-------------|-----------|
| **Talentos de Armas** | Reducir duración, diferenciar | Baja | ⭐⭐⭐⭐⭐ |
| **Iniciativa Dinámica** | Añadir tensión | Baja | ⭐⭐⭐⭐ |
| **Tipos de Daño** | Variedad táctica | Media | ⭐⭐⭐ |
| **Maniobras Expandidas** | Opciones tácticas | Media | ⭐⭐⭐⭐ |
| **Heridas Narrativas** | Consecuencias | Media | ⭐⭐⭐ |
| **Combate Rápido** | Acelerar menores | Baja | ⭐⭐⭐ |
| **Daño Masivo** | Recompensar éxito grande | Baja | ⭐⭐⭐⭐ |

---

## 9. Implementación Recomendada

### Fase 1: Esencial
1. ✅ **Sistema de Talentos** (3/2/1)
2. ✅ **Daño Masivo** (éxito por 6+ = x1.5)

### Fase 2: Mejora
3. 🔄 **Iniciativa por Tirada**
4. 🔄 **Maniobras Expandidas** (al menos 3-4 nuevas)

### Fase 3: Opcional
5. 📋 Tipos de Daño (si se quiere más simulación)
6. 📋 Heridas Narrativas (para campañas grittier)
7. 📋 Combate Rápido (para one-shots)

---

## 10. Dramatizaciones de Combate (Catálogo Manus)

> **Fuente:** `26-DRAMATIZACION.md`, escenas 15-17

### 10.1 Tam al'Thor vs Bandido (Giro del Destino)

**Resumen:** Arquero veterano (Nivel 1) vs bandido. Demuestra:
- **Iniciativa de arquero** da ventaja inicial
- **Bendición Mayor** (+7 de diferencia) causa aturdimiento narrativo
- **Giro del Destino** (dados iguales) crea momento memorable:
  > "Su daga se engancha en la ropa del bandido, desarmándolo pero dejando a Tam también sin arma."

**Duración:** 3 turnos → objetivo cumplido

---

### 10.2 Egwene vs Bandido (No-Combatiente Vence)

**Resumen:** Aprendiz de sabiduría (PA 5, Daño 1) vence a guerrero usando:

1. **Turno 1:** Huye usando Ingenio → Bendición Mayor → encuentra terreno ventajoso
2. **Turno 2:** Usa conocimiento de hierbas → prepara piedras envenenadas
3. **Turno 3:** Arroja piedras → veneno causa -2 a todas las acciones del bandido
4. **Resultado:** Bandido se retira derrotado sin que Egwene lo golpee directamente

**Lección Clave:**
> "Los personajes no-combatientes no deben luchar como guerreros. Deben tener sus propias vías a la victoria."

**Estadísticas:** Egwene (no-combatiente) tiene 53.53% victoria vs 2 bandidos, SUPERIOR a Tam (40%) gracias a tácticas de área.

---

### 10.3 Lan vs Myrdraal (Combate Épico Nivel 3)

**Resumen:** Guardián veterano vs Señor de la Sombra. Demuestra escalado:

| Aspecto | Nivel 1 (Tam) | Nivel 3 (Lan) |
|---------|---------------|---------------|
| PA | 10 | 14 |
| Daño | 3 | 4 |
| Protección | 2 | 3 |
| Modificadores | +3 | +5 |
| Duración | 3 turnos | 5+ turnos |

**Elementos destacados:**
- **Mirada del Myrdraal:** Habilidad especial que paraliza (-2)
- **Forma de la Hoja Vacía:** Técnica que permite usar Voluntad en lugar de Fuerza
- **Resultado:** Lan vence pero termina con 6/14 PA

---

### 10.4 Estadísticas Validadas (4000 Simulaciones)

> **Fuente:** `25-CATALOGO-IDEAS-MANUS.md`, sección 5.2

| Arquetipo | Sin Talentos | Con Talentos 3/2/1 | Mejora |
|-----------|--------------|-------------------|--------|
| Guerrero | ~28 turnos | ~17 turnos | **-40%** |
| Mixto | ~28 turnos | ~20 turnos | **-29%** |
| Erudito | ~28 turnos | ~23 turnos | **-18%** |

**Victorias No-Luchador vs NPC:**
- Sin Talentos: 8-15% (inaceptable)
- Con Talentos: 50-70% (objetivo cumplido)

---

*Estas propuestas priorizan reducir la duración del combate manteniendo la táctica interesante.*
