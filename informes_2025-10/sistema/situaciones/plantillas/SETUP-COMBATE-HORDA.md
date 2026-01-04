# ⚔️ Setup: Combate - Héroes vs Horda

> **Propósito:** Testear combate contra muchos enemigos débiles, ataques en área

---

## Escenario A: 2 Héroes vs 12 Enemigos Débiles

### Contexto
Pocos héroes poderosos contra horda. Testea Defensa Pasiva y ataques en área.

### Grupo de Héroes

#### Héroe 1: Guerrero Legendario

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Nivel** | Sello Leyenda |
| **PA** | 15 |
| **Protección** | 4 |
| **Ataque** | d12 + 10 |
| **Defensa** | d12 + 6 |
| **Daño** | 4 |
| **Especial** | Ataque a 2 adyacentes |

#### Héroe 2: Canalizador Poderoso

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Nivel** | Sello Héroe |
| **PA** | 8 |
| **Protección** | 0 |
| **Ataque mágico** | d12 + 8 |
| **Defensa** | d12 + 5 |
| **Daño** | 5 (área, hasta 4 objetivos) |
| **Recurso** | Devoción 5 / Fatiga 0-10 |
| **Especial** | Escudo mágico (absorbe 5 daño) |

### La Horda (×12)

| Stat | Valor |
|------|-------|
| **Nombre** | Trolloc Menor / Orco / Esqueleto |
| **Nivel** | Muy inferior |
| **PA** | 6 |
| **Protección** | 1 |
| **Ataque** | d12 + 3 |
| **Defensa Pasiva** | 7 |
| **Daño** | 3 |

### Diferencia de Nivel
- Héroes 4+ niveles superiores → **Horda usa Defensa Pasiva**
- Opcional: Horda también es "Vulnerable" (×1.5 daño)

---

## Escenario B: Mago Solo vs 8 Enemigos

### Contexto
Testea viabilidad del mago sin protección.

### Héroe: Mago

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **PA** | 6 |
| **Protección** | 0 |
| **Ataque mágico** | d12 + 6 |
| **Defensa** | d12 + 3 |
| **Daño** | 4 (2 objetivos) / 6 (1 objetivo) |
| **Recurso** | Devoción 3 |
| **Especiales** | Escudo (+3 def, 1 Devoción), Explosión (área grande, 2 Dev) |

### Enemigos (×8)

| Stat | Valor |
|------|-------|
| **Nombre** | Esqueleto / Goblin |
| **PA** | 4 |
| **Defensa Pasiva** | 6 |
| **Ataque** | d12 + 2 |
| **Daño** | 2 |
| **Debilidad** | Fuego (+2 daño) |

### Pregunta Clave
¿El mago puede sobrevivir sin ayuda?
- Recursos limitados
- Sin tanque

---

## Escenario C: Grupo vs Oleadas

### Contexto
Defensa de posición. Enemigos llegan en oleadas.

### Mecánica de Oleadas

```
OLEADA 1: 5 enemigos
  → Fácil, recursos frescos
  
OLEADA 2: 5 enemigos
  → Algunos daños, recursos parciales
  
OLEADA 3: 5 enemigos
  → Recursos bajos, heridas acumuladas
  
OLEADA 4: 5 enemigos
  → Crítico, ¿sobreviven?
```

### Entre Oleadas
- ¿Recuperación de recursos?
- ¿Tiempo para reposicionarse?

---

## Reglas Opcionales para Hordas

### Opción: Grupos de Enemigos

En lugar de 12 individuales, usar 3 grupos:

| Stat | Grupo de 4 |
|------|------------|
| **PA** | 24 (6×4) |
| **Ataque** | d12 + 5 (+2 por grupo) |
| **Daño** | 6 (concentrado) |
| **Comportamiento** | A 12 PA se divide en 2 grupos de 2 |

### Opción: Ataques Combinados

Si 3+ enemigos atacan al mismo objetivo:
- Una tirada con +2 por atacante extra
- Daño = base × atacantes que contribuyen

### Opción: Moral de Horda

Al perder 50%:
- Tirada de Moral (Voluntad líder vs 10)
- Fallo: Huyen
- Éxito: Luchan hasta el final

---

## Mecánicas de Área

### Área Pequeña (2 objetivos)

| Hechizo | Daño | Coste |
|---------|------|-------|
| Bola de Fuego | 4 | 2 Devoción |

### Área Media (3-4 objetivos)

| Hechizo | Daño | Coste |
|---------|------|-------|
| Muro de Fuego | 3 | 3 Devoción |
| Cono de Frío | 4 | 3 Maná |

### Área Grande (5+ objetivos)

| Hechizo | Daño | Coste |
|---------|------|-------|
| Explosión | 8 | 2+ Devoción |
| Tormenta | 8 | 8 Maná |

---

## Variables a Probar

| Variable | Impacto Esperado |
|----------|------------------|
| Defensa Pasiva ON | -50% tiradas |
| Ataques área ON | -70% tiempo vs hordas |
| Grupos de enemigos | Más rápido, menos granular |
| Vulnerabilidad horda | Muerte más rápida |

---

## Métricas Específicas

| Métrica | Objetivo (12 enemigos) |
|---------|------------------------|
| Turnos totales | 2-4 |
| Tiradas por turno | ≤6 (idealmente ≤4) |
| Enemigos eliminados/turno | 3-6 |
| Tiempo real | ≤15 min |

---

*Una horda debe sentirse abrumadora pero manejable.*
