# ⚔️ Setup: Combate - Grupo vs Jefe

> **Propósito:** Testear combates contra enemigos únicos poderosos

---

## Escenario A: 4 PJs vs Jefe Nivel 2

### Contexto
Jefe equilibrado para grupo estándar. Combate épico pero no letal.

### Grupo de Héroes
*(Usar stats de SETUP-COMBATE-GRUPO.md, Escenario A)*

| PJ | PA | Protección | Ataque | Defensa |
|----|-----|------------|--------|---------|
| Guerrero | 12 | 3 | d12+8 | d12+4 |
| Mago | 7 | 0 | d12+6 | d12+2 |
| Pícaro | 8 | 1 | d12+6 | d12+5 |
| Explorador | 10 | 2 | d12+7 | d12+3 |

### Jefe: Nivel de Amenaza 2

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Tipo** | Humanoide grande / Bestia / No-muerto |
| **PA** | 25-30 |
| **Protección** | 3 |
| **Defensa** | d12 + 7 |
| **Ataques por turno** | 2 |
| **Daño base** | 5 |

### Habilidades de Jefe

| Habilidad | Efecto | Frecuencia |
|-----------|--------|------------|
| Ataque Principal | Daño 5, objetivo único | Cada turno |
| Ataque Secundario | Daño 3, segundo objetivo | Cada turno |
| Aura/Efecto | Penalizador -2 a todos | Inicio combate |
| Habilidad Especial | Efecto potente | 1/combate |

---

## Escenario B: 4 PJs vs Jefe Nivel 3

### Jefe: Nivel de Amenaza 3

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **PA** | 35-40 |
| **Protección** | 4 |
| **Defensa** | d12 + 8 |
| **Ataques por turno** | 2 + 1 habilidad |
| **Daño base** | 6 |

### Habilidades Adicionales

| Habilidad | Efecto |
|-----------|--------|
| Acción de Leyenda | Actúa también en Fase de Héroes |
| Resistencias | Reduce daño de ciertos tipos |
| Fases | Cambia comportamiento al 50% PA |

---

## Escenario C: 1 PJ vs Jefe (Imposible)

### Contexto
Testea que el sistema comunica "esto es suicida".

### Héroe Solo

| Stat | Valor |
|------|-------|
| **PA** | 12 |
| **Ataque** | d12 + 8 |
| **Daño** | 4 |

### Jefe Nivel 4+

| Stat | Valor |
|------|-------|
| **PA** | 50+ |
| **Protección** | 6 |
| **Defensa** | d12 + 10 / Pasiva 16 |
| **Daño** | 10+ |

### Resultado Esperado
- El héroe no puede hacer daño significativo
- El jefe mata en 1-2 turnos
- El sistema debe comunicar la imposibilidad

---

## Mecánicas de Jefe

### Acciones Múltiples

```
Jefe Nivel 2: 2 acciones/turno
  - Ataque 1 (al tanque)
  - Ataque 2 (a otro)
  
Jefe Nivel 3: 2 ataques + 1 habilidad
  - Ataque 1
  - Ataque 2
  - Habilidad especial (área, control, buff)
  
Jefe Nivel 4+: Acción de Leyenda
  - También actúa en Fase de Héroes
  - Puede interrumpir acciones de PJs
```

### Fases de Combate

```
FASE 1 (100%-50% PA):
  - Comportamiento normal
  - Usa habilidades estándar
  
FASE 2 (50%-0% PA):
  - Se enfurece / transforma
  - Nuevas habilidades
  - +2 a ataques o daño
  
FASE FINAL (0 PA, opcional):
  - Sigue luchando X turnos (Inmortalidad Temporal)
  - Último esfuerzo desesperado
```

### Resistencias y Debilidades

| Tipo | Efecto |
|------|--------|
| Inmune | 0 daño de ese tipo |
| Resistente | -3 daño de ese tipo |
| Normal | Daño completo |
| Vulnerable | +50% daño de ese tipo |

---

## Tabla de Jefes por Nivel

| Nivel | PA | Prot | Ataques | Habilidades | Para grupo de... |
|-------|-----|------|---------|-------------|------------------|
| 1 | 15-20 | 2 | 1 | 1-2 | 3-4 Iniciados |
| 2 | 25-30 | 3 | 2 | 2-3 | 3-4 Viaje |
| 3 | 35-40 | 4 | 2+1 | 3-4 | 4-5 Viaje/Héroe |
| 4 | 45-50 | 5 | 3 | 4-5 | 4-5 Héroe |
| 5 | 50+ | 6 | 3+ | 5+ | Grupo Leyenda |

---

## Habilidades de Jefe Ejemplo

| Nombre | Tipo | Efecto |
|--------|------|--------|
| Grito Aterrador | Aura | Voluntad vs 12 o -2 a todo |
| Golpe Demoledor | Ataque | Daño ×2, recarga 3 turnos |
| Regeneración | Pasiva | +3 PA al inicio del turno |
| Escudo Mágico | Defensa | Absorbe X daño antes de PA |
| Invocación | Acción | Crea 2-3 enemigos menores |
| Teletransporte | Movimiento | Se mueve instantáneamente |
| Mirada Paralizante | Control | Objetivo no actúa 1 turno |

---

## Variables a Probar

| Variable | Pregunta |
|----------|----------|
| Acciones múltiples | ¿2 ataques es justo? ¿3 es demasiado? |
| Fases | ¿El cambio a 50% es interesante? |
| Resistencias | ¿Fuerzan variedad táctica? |
| HP del jefe | ¿Combate dura 5-7 turnos? |

---

## Métricas Específicas

| Métrica | Objetivo |
|---------|----------|
| Turnos totales | 5-7 (Nivel 2), 7-10 (Nivel 3+) |
| Muertes de PJs | 0-1 (con buena táctica) |
| Recursos gastados | 50-80% (Devoción, especiales) |
| Momentos épicos | ≥2 (Giros, habilidades clave) |

---

*Un jefe debe sentirse como una amenaza real que requiere trabajo en equipo.*
