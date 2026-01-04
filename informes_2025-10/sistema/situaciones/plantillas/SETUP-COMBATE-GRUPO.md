# ⚔️ Setup: Combate - Grupo vs Grupo

> **Propósito:** Testear combate con múltiples participantes, iniciativa y coordinación

---

## Escenario A: 4 PJs vs 4 Enemigos (Nivel Similar)

### Contexto
Combate equilibrado numéricamente. Testea flujo de turno con múltiples actores.

### Grupo de Héroes

#### PJ 1: Guerrero

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Rol** | Tanque / Melee |
| **PA** | 12 |
| **Protección** | 3 |
| **Ataque** | d12 + 8 |
| **Defensa** | d12 + 4 |
| **Daño** | 3 |

#### PJ 2: Mago/Canalizador

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Rol** | DPS mágico |
| **PA** | 7 |
| **Protección** | 0 |
| **Ataque mágico** | d12 + 6 |
| **Defensa** | d12 + 2 |
| **Daño** | 4 (área posible) |
| **Recurso** | Devoción 5 / Maná 20 / Fatiga 0 |

#### PJ 3: Pícaro

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Rol** | DPS / Utilidad |
| **PA** | 8 |
| **Protección** | 1 |
| **Ataque** | d12 + 6 |
| **Defensa** | d12 + 5 |
| **Daño** | 2 |
| **Especial** | Golpe Sucio (1/combate) |

#### PJ 4: Guerrero/Explorador

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Rol** | Melee / Soporte |
| **PA** | 10 |
| **Protección** | 2 |
| **Ataque** | d12 + 7 |
| **Defensa** | d12 + 3 |
| **Daño** | 4 |

### Grupo de Enemigos (Nivel Inferior)

#### Enemigo Genérico ×4

| Stat | Valor |
|------|-------|
| **Nombre** | Bandido / Guardia / etc. |
| **PA** | 5-6 |
| **Protección** | 1 |
| **Ataque** | d12 + 3 |
| **Defensa** | d12 + 2 |
| **Defensa Pasiva** | 8 |
| **Daño** | 2 |

### Diferencia de Nivel
- PJs ~2-3 niveles superiores
- Si R-COM-01 activa: Enemigos usan Defensa Pasiva

---

## Escenario B: 4 PJs vs 4 Enemigos (Nivel Parejo)

### Grupo de Enemigos (Nivel Similar)

#### Enemigo Entrenado ×4

| Stat | Valor |
|------|-------|
| **Nombre** | Guardia Elite / Soldado |
| **PA** | 9 |
| **Protección** | 3 |
| **Ataque** | d12 + 5 |
| **Defensa** | d12 + 4 |
| **Daño** | 3 |

### Diferencia de Nivel
- Similar (0-2) → **Todos tiran defensa**
- Combate más largo y tenso

---

## Escenario C: 3 PJs vs 6 Enemigos (Superioridad Numérica)

### Grupo de Héroes
*(Usar 3 de los 4 PJs del Escenario A)*

### Grupo de Enemigos

#### Enemigo Débil ×6

| Stat | Valor |
|------|-------|
| **Nombre** | Goblin / Cultista / Bandido menor |
| **PA** | 4 |
| **Protección** | 0 |
| **Ataque** | d12 + 2 |
| **Defensa Pasiva** | 7 |
| **Daño** | 2 |

### Pregunta Clave
¿Los PJs pueden manejar el doble de enemigos?

---

## Mecánicas a Testear

### Iniciativa

| Regla | Comportamiento |
|-------|----------------|
| R-COM-02 OFF | Tirada de iniciativa individual |
| R-COM-02 ON | PJs actúan primero, eligen orden |

### Orden de Acción (con Iniciativa Heroica)

```
FASE HÉROES:
  1. PJs deciden quién actúa primero
  2. Cada PJ resuelve su acción
  
FASE ENEMIGOS:
  1. DJ decide orden de enemigos
  2. Cada enemigo resuelve
```

### Coordinación Táctica

Preguntas para la prueba:
- ¿Los PJs pueden proteger al mago?
- ¿Pueden focalizar un enemigo?
- ¿El orden de acción importa?

---

## Variables a Probar

| Variable | Opción A | Opción B |
|----------|----------|----------|
| Iniciativa | Tirada individual | Heroica (PJs primero) |
| Defensa | Siempre tirar | Pasiva si ≥3 niveles |
| Ataques área | No disponibles | Mago puede afectar 2-3 |
| Focus fire | Cada uno a uno | Todos al mismo |

---

## Métricas Específicas

| Métrica | Objetivo |
|---------|----------|
| Turnos totales | 3-5 (vs débiles), 5-8 (vs parejos) |
| Tiradas por turno | ≤ 2 × número de combatientes |
| Daño recibido por PJs | <50% PA total (vs débiles) |
| Enemigos eliminados/turno | 1-2 (vs débiles) |

---

*El trabajo en equipo define la victoria.*
