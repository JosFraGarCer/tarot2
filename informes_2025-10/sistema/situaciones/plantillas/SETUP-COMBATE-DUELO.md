# ⚔️ Setup: Combate - Duelos 1v1

> **Propósito:** Testear balance entre arquetipos en combate individual

---

## Escenario A: Guerrero vs Guerrero (Nivel Parejo)

### Contexto
Dos combatientes de nivel similar se enfrentan. Ideal para testear el sistema base sin ventajas de nivel.

### Combatiente 1: Guerrero Veterano

| Stat | Valor | Notas |
|------|-------|-------|
| **Nombre** | Lan | Sello Viaje |
| **Arcano Físico** | Fuerza 4, Agilidad 3, Vigor 4 | |
| **PA** | 12 | Vigor × 3 |
| **Protección** | 3 | Armadura media |
| **Competencia** | Espadas +2, Esquivar +1 | |
| **Talento Principal** | Espadas (+2) | Si R-COM-03 activa |
| **Ataque** | d12 + Fuerza + Espadas + Talento | = d12 + 8 |
| **Defensa** | d12 + Agilidad + Esquivar | = d12 + 4 |
| **Defensa Pasiva** | 6 + Agilidad + Esquivar | = 10 |
| **Daño** | 3 | Espada larga |

### Combatiente 2: Guerrero Brutal

| Stat | Valor | Notas |
|------|-------|-------|
| **Nombre** | Trolloc | Equivalente a Sello Viaje |
| **Arcano Físico** | Fuerza 5, Agilidad 2, Vigor 5 | |
| **PA** | 15 | Vigor × 3 |
| **Protección** | 2 | Piel gruesa |
| **Competencia** | Hachas +1 | |
| **Talento Principal** | Hachas (+2) | Si R-COM-03 activa |
| **Ataque** | d12 + Fuerza + Hachas + Talento | = d12 + 8 |
| **Defensa** | d12 + Agilidad | = d12 + 2 |
| **Defensa Pasiva** | 6 + Agilidad | = 8 |
| **Daño** | 4 | Hacha grande |

### Diferencia de Nivel
- Similar (0-2 niveles) → **Ambos tiran defensa**
- Ninguno usa Defensa Pasiva

### Predicción Teórica
- Lan: Mejor defensa, menos daño
- Trolloc: Más PA, más daño, peor defensa
- Duración esperada: 5-8 turnos

---

## Escenario B: Guerrero vs Pícaro (Estilos Distintos)

### Contexto
Tanque vs evasivo. Testea si ambos estilos son viables.

### Combatiente 1: Guardia

| Stat | Valor |
|------|-------|
| **Nombre** | Guardia de la Ciudad |
| **PA** | 9 |
| **Protección** | 3 |
| **Ataque** | d12 + 5 |
| **Defensa** | d12 + 4 |
| **Defensa Pasiva** | 10 |
| **Daño** | 3 |

### Combatiente 2: Ladrón

| Stat | Valor |
|------|-------|
| **Nombre** | Ladrón de Caminos |
| **PA** | 6 |
| **Protección** | 1 |
| **Ataque** | d12 + 6 |
| **Defensa** | d12 + 5 |
| **Defensa Pasiva** | 11 |
| **Daño** | 2 |
| **Especial** | "Golpe Sucio" - 1/combate actúa primero |

### Pregunta Clave
¿El ladrón puede ganar o la armadura es demasiado?
- Daño 2 vs Protección 3 = 0-1 daño base

---

## Escenario C: Novato vs Veterano (Desnivel Grande)

### Contexto
Gran diferencia de nivel. Ideal para testear Defensa Pasiva (R-COM-01).

### Combatiente 1: Aprendiz

| Stat | Valor |
|------|-------|
| **Nombre** | Aprendiz |
| **Nivel equiv.** | Sello Iniciado |
| **PA** | 6 |
| **Protección** | 1 |
| **Ataque** | d12 + 3 |
| **Defensa** | d12 + 2 |
| **Defensa Pasiva** | 8 |
| **Daño** | 2 |

### Combatiente 2: Maestro de Armas

| Stat | Valor |
|------|-------|
| **Nombre** | Maestro |
| **Nivel equiv.** | Sello Héroe |
| **PA** | 12 |
| **Protección** | 3 |
| **Ataque** | d12 + 9 |
| **Defensa** | d12 + 6 |
| **Defensa Pasiva** | 12 |
| **Daño** | 4 |

### Diferencia de Nivel
- ~3+ niveles → **El inferior usa Defensa Pasiva** (si R-COM-01 activa)

### Preguntas Clave
- ¿El Maestro aplasta al Aprendiz rápidamente? (correcto)
- ¿El Aprendiz tiene alguna oportunidad? (no debería, salvo Giro del Destino)

---

## Escenario D: Arquero vs Cuerpo a Cuerpo

### Contexto
Combate a distancia. Testea si el ranged tiene tiempo suficiente.

### Combatiente 1: Arquero

| Stat | Valor |
|------|-------|
| **Nombre** | Arquero |
| **PA** | 6 |
| **Protección** | 1 |
| **Ataque** | d12 + 7 |
| **Defensa** | d12 + 4 |
| **Daño** | 3 |
| **Distancia inicial** | 30 metros |

### Combatiente 2: Guerrero con Escudo

| Stat | Valor |
|------|-------|
| **Nombre** | Guerrero Escudo |
| **PA** | 12 |
| **Protección** | 4 |
| **Ataque** | d12 + 6 |
| **Defensa** | d12 + 5 |
| **Daño** | 3 |
| **Movimiento** | 10 metros/turno |

### Mecánica de Distancia
- Turno 1: 30m → Arquero dispara, Guerrero avanza
- Turno 2: 20m → Arquero dispara, Guerrero avanza
- Turno 3: 10m → Arquero dispara, Guerrero llega a melee

### Pregunta Clave
¿3 flechas son suficientes para ganar?
- Daño 3 vs Protección 4 = probablemente no

---

## Variables a Probar por Escenario

| Escenario | Reglas a Comparar |
|-----------|-------------------|
| A: Parejo | Talentos ON/OFF, Daño Escalado ON/OFF |
| B: Estilos | Protección alta vs evasión |
| C: Desnivel | Defensa Pasiva ON/OFF |
| D: Distancia | Reglas de movimiento y rango |

---

## Uso de Esta Plantilla

1. Elige un escenario (A, B, C o D)
2. Copia `REGISTRO-PRUEBA-TEMPLATE.md`
3. Rellena los stats de los combatientes
4. Ejecuta la simulación turno a turno
5. Registra resultados y métricas
6. Repite con diferentes reglas activas
7. Compara resultados

---

*Los duelos revelan el corazón del sistema.*
