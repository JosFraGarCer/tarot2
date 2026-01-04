# 🌀 Setup: Magia - La Rueda del Tiempo

> **Propósito:** Testear sistema de canalización con fatiga y riesgo
> **Estilo:** Magia poderosa, peligrosa, con consecuencias

---

## Sistema de Canalización

### Mecánicas Base

| Mecánica | Descripción |
|----------|-------------|
| **Tirada** | Voluntad + Canalización vs Dificultad |
| **Fatiga** | Se acumula con cada tejido |
| **Límite seguro** | Voluntad × 3 |
| **Inconsciencia** | Voluntad × 5 |
| **Recuperación** | 1 Fatiga/hora de descanso |

### Los Cinco Poderes

| Poder | Uso | Bonus típico |
|-------|-----|--------------|
| **Aire** | Control, defensa, vuelo | +1 vs aéreos |
| **Agua** | Curación, detección | +1 curación |
| **Tierra** | Fuerza, protección | +1 daño estructural |
| **Fuego** | Destrucción, luz | +1 daño directo |
| **Espíritu** | Mente, vínculos | +1 vs canalización |

---

## Escenario A: Canalizador vs Enemigos Físicos

### Canalizador

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Nivel** | Aceptada / Dedicado (Sello Viaje) |
| **Voluntad** | 4 |
| **Canalización** | +2 |
| **Poderes** | Fuego +1, Espíritu +1 |
| **PA** | 7 |
| **Protección** | 0 |
| **Fatiga límite** | 12 (seguro) / 20 (inconsciente) |
| **Fatiga actual** | 0 |

### Tejidos Conocidos

| Tejido | Dificultad | Daño/Efecto | Fatiga | Poder |
|--------|------------|-------------|--------|-------|
| Bola de Fuego | 9 | 4 daño, 1 objetivo | +2 | Fuego |
| Muro de Fuego | 10 | 3 daño, línea 3 obj | +3 | Fuego |
| Escudo de Aire | 8 | +3 defensa, mantener | +1/turno | Aire |
| Curación Menor | 10 | +4 PA recuperados | +4 | Agua |

### Enemigos (×6)

| Stat | Valor |
|------|-------|
| **Nombre** | Trolloc / Soldado |
| **PA** | 6 |
| **Protección** | 1 |
| **Ataque** | d12 + 3 |
| **Defensa Pasiva** | 7 |
| **Daño** | 3 |

### Preguntas Clave
- ¿Cuántos turnos puede canalizar antes de agotarse?
- ¿Puede eliminar a todos antes de que lleguen?
- ¿Necesita aliados para sobrevivir?

---

## Escenario B: Duelo de Canalizadores

### Canalizador 1

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Voluntad** | 5 |
| **Canalización** | +3 |
| **Poderes** | Fuego +2, Espíritu +2 |
| **Fatiga límite** | 15 / 25 |

### Canalizador 2

| Stat | Valor |
|------|-------|
| **Nombre** | |
| **Voluntad** | 6 |
| **Canalización** | +4 |
| **Poderes** | Fuego +3, Espíritu +2 |
| **Fatiga límite** | 18 / 30 |

### Tejidos de Combate Avanzados

| Tejido | Dificultad | Efecto | Fatiga |
|--------|------------|--------|--------|
| Escudo contra Fuente | 13 | Bloquea canalización | +4 |
| Rayo | 11 | 6 daño | +3 |
| Balefire | 15 | 10 daño, ignora armadura | +6 |
| Compulsión | 14 | Control mental | +5 |

### Mecánica: Duelo

```
FASE 1: Tanteo
  Tejidos menores, evaluar poder

FASE 2: Escudos
  Intentar cortar conexión del oponente
  Tirada opuesta: Voluntad + Espíritu

FASE 3: Ataque Total
  Tejidos devastadores
  El primero en quedarse sin Fatiga pierde
```

---

## Escenario C: Círculo de Canalizadores

### Contexto
3 canalizadores combinan poder.

### Miembros del Círculo

| Miembro | Voluntad | Canalización |
|---------|----------|--------------|
| Líder | 5 | +3 |
| Apoyo 1 | 4 | +2 |
| Apoyo 2 | 3 | +2 |

### Mecánica: Círculo

```
FORMAR CÍRCULO:
  Todos tiran Voluntad vs 12
  Si todos pasan: Círculo formado

BONUSES COMBINADOS:
  Voluntad efectiva: Líder + 2 (contribución)
  Canalización: Líder + 1 (contribución)
  Fatiga: Dividida entre miembros

TEJIDO MAYOR (ejemplo):
  Dificultad 18
  Tirada: d12 + 7 + 4 = d12 + 11
  Fatiga: 8 ÷ 3 = ~3 cada uno
```

---

## Diferencias Saidin/Saidar

| Aspecto | Saidin (Hombres) | Saidar (Mujeres) |
|---------|------------------|------------------|
| Acceso | Agarrar, dominar | Rendirse, guiar |
| Riesgo | Locura (largo plazo) | Fatiga (corto plazo) |
| Estilo | Picos de poder | Flujo constante |
| Bonus | +1 Tierra/Fuego | +1 Aire/Agua |

### Mecánica: Locura (Saidin)

```
Por cada 10 puntos de Fatiga acumulados en total (histórico):
  → Tirada de Voluntad vs 12
  → Fallo: +1 Locura
  
Locura 1-2: Paranoia menor
Locura 3-4: Visiones, desconfianza
Locura 5+: Peligroso para sí y otros
```

---

## Variables a Probar

| Variable | Pregunta |
|----------|----------|
| Ratio Fatiga/Daño | ¿+2 por 4 daño es equilibrado? |
| Límite de Fatiga | ¿×3 es muy bajo? ¿×5 muy alto? |
| Círculos | ¿La división de fatiga es justa? |
| Escudos | ¿Cortar la Fuente es demasiado potente? |

---

## Métricas Específicas

| Métrica | Objetivo |
|---------|----------|
| Turnos activos | 4-6 antes de agotamiento |
| Daño por Fatiga | ~2 daño efectivo por punto |
| Duelos | 3-5 turnos intensos |
| Círculo vs Normal | +50% efectividad |

---

*El Poder Único es una herramienta y un peligro.*
