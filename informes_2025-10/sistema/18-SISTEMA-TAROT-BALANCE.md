# ⚖️ Análisis de Balance y Diseño - Proyecto Tarot

## 1. Balance Matemático

### 1.1 Análisis del d12

**Elección del d12:**
- Rango 1-12 proporciona granularidad fina
- Cada +1 de modificador = +8.33% de probabilidad
- Curva lineal (no campana como 2d6 o 3d6)

**Comparativa con otros dados:**

| Dado | Rango | Por +1 | Característica |
|------|-------|--------|----------------|
| d20 | 1-20 | 5% | Estándar D&D, muy random |
| **d12** | **1-12** | **8.33%** | **Balance elegante** |
| 2d6 | 2-12 | Variable | Curva campana, predecible |
| d10 | 1-10 | 10% | Porcentual, intuitivo |
| d8 | 1-8 | 12.5% | Menos granularidad |

**Ventaja del d12:** Menos random que d20, más que 2d6. Buen punto medio.

### 1.2 Escala de Dificultades

```
Dificultad    Valor    Éxito base (Faceta +0)    Éxito con +3
────────────────────────────────────────────────────────────
Sencillo        6            58.3%                  83.3%
Moderado        9            33.3%                  58.3%
Difícil        12             8.3%                  33.3%
Heroico        15             0.0%                  16.7%
```

**Observación crítica:** Las dificultades están bien espaciadas (incrementos de 3), pero:
- **Heroico (15)** es imposible para personajes iniciales (max +6 = 18)
- Esto es **intencional** según la filosofía del sistema

### 1.3 Distribución de Puntos de Facetas

**Creación Base:** 9 puntos (5+3+1)

| Distribución | Ejemplo | Fortaleza | Debilidad |
|--------------|---------|-----------|-----------|
| **Especialista** | 3-2-0, 2-1-0, 1-0-0 | Una faceta en 3 | Muchas en 0 |
| **Generalista** | 2-2-1, 2-1-0, 1-0-0 | Versatilidad | Max en 2 |
| **Equilibrado** | 2-2-1, 1-1-1, 1-0-0 | Sin debilidades | Max en 2 |

**Con bonos de Cartas (+1 Linaje, +1 Ocupación):**
- Un personaje puede alcanzar **Faceta 5** en creación (3 base + 2 cartas)
- Esto lo hace **Maestro** desde el inicio en un área

**Problema potencial:** ¿Es demasiado poder inicial?

**Análisis:**
- Con Faceta 5 + Competencia 3 = +8 total
- vs Moderado (9): 100% éxito (automático con 1+)
- vs Difícil (12): 75% éxito
- vs Heroico (15): 50% éxito

**Conclusión:** Es alto pero coherente con "personajes competentes".

---

## 2. Balance de Combate

> ⚠️ **NOTA:** El sistema de combate está aún en estudio. Ver **20-MANUS-ANALISIS-EVOLUTIVO.md** para alternativas como el **Sistema de Talentos de Armas** que reduce significativamente la duración de combates.

### 2.1 Economía de Daño vs Protección

| Arma | Daño | Armadura | Protección | Daño Neto |
|------|------|----------|------------|-----------|
| Daga (2) | 2 | Cuero (1) | 1 | 1 |
| Espada (3) | 3 | Malla (2) | 2 | 1 |
| Mandoble (4) | 4 | Placas (3) | 3 | 1 |
| Mandoble (4) | 4 | Cuero (1) | 1 | 3 |

**Observación:** El sistema mantiene **daño neto mínimo de 1** siempre que impactes.

**Implicación:**
- Combates se alargan con armadura pesada
- Pero la armadura **nunca** te hace invulnerable
- Dagas son viables contra placas (muy lento pero posible)

### 2.2 TTK (Time to Kill) Estimado

**Asumiendo:**
- Atacante: +5 total (Faceta 3 + Competencia 2)
- Defensor: Dificultad 9 (estándar)
- 58% de éxito por ataque

| Situación | PA Objetivo | Daño/Hit | Hits Necesarios | Rondas Est. |
|-----------|-------------|----------|-----------------|-------------|
| vs Sin armadura (10 PA) | 10 | 3 | 4 | ~7 rondas |
| vs Malla (10 PA) | 10 | 1 | 10 | ~17 rondas |
| vs Placas (14 PA) | 14 | 0 (min 1) | 14 | ~24 rondas |

**Problema:** Combates pueden ser muy largos contra armadura.

**Solución en el sistema:** Maniobras (Ataque Total +2 daño) y ataques dirigidos.

### 2.3 Balance de Múltiples Oponentes

**Regla:** -1 defensa por oponente adicional (max -3)

**Análisis:**
- 1v1: Normal
- 1v2: -1 defensa (Dificultad efectiva 8)
- 1v3: -2 defensa (Dificultad efectiva 7)
- 1v4+: -3 defensa (Dificultad efectiva 6)

**Con flanqueo:** -2 adicional

**Conclusión:** 1v4 es muy peligroso incluso para expertos. **Correcto** para realismo.

---

## 3. Balance de Progresión

### 3.1 Curva de Poder por Sello

```
                    CURVA DE PODER
    Max Faceta
         │
       5 ┤                    ●────────────── Héroe
         │                   /
       4 ┤              ●───/─────────────── Viaje
         │             /
       3 ┤────────●───/───────────────────── Iniciado
         │
       2 ┤
         │
       1 ┤
         │
       0 ┼──────┬──────┬──────┬──────┬──────
         0     10     25     50     75
                  PUNTOS DE HITO
```

### 3.2 Velocidad de Progresión

**A 2 PH/sesión promedio:**

| Sello | PH Requeridos | Sesiones | Tiempo (semanal) |
|-------|---------------|----------|------------------|
| Iniciado | 0 | 0 | Inicio |
| Viaje | 10 | 5 | ~1 mes |
| Héroe | 25 | 12-13 | ~3 meses |
| Leyenda | 50 | 25 | ~6 meses |

**Observación:** Progresión razonable para campañas largas.

### 3.3 Costes de Mejoras

| Mejora | Coste PH | Análisis |
|--------|----------|----------|
| +1 Faceta | 2 | Barato, fomenta especialización |
| Nueva Competencia | 3 | Moderado, expande versatilidad |
| Nueva Carta | 4 | Caro, cambios significativos |

**Problema potencial:** A 2 PH/sesión, mejoras son muy rápidas.

**Sugerencia:** Considerar escala de costes (Faceta 3→4 cuesta más que 2→3).

---

## 4. Balance de Magia

### 4.1 Magia de Combate vs Armas

| Ataque | Daño | Modificador | Ventaja |
|--------|------|-------------|---------|
| Espada + Fuerza 3 + Espada 2 | 3 | +5 | Confiable |
| Hechizo + Alma 3 + Canal 2 | 2-4 | +5 | A distancia |

**Balance:** Magia es comparable a armas físicas, diferenciada por alcance y efectos.

### 4.2 Magia Poderosa - Coste vs Beneficio

**Modelo Fatiga (Voluntad = Fatiga):**

| Personaje | Fatiga | Hechizos Poderosos/día |
|-----------|--------|------------------------|
| Voluntad 2 | 2 | 1-2 menores |
| Voluntad 4 | 4 | 2-4 menores o 1 mayor |
| Voluntad 6 | 6 | 3-6 menores o 2 mayores |

**Recuperación:** 1 fatiga/hora de descanso

**Balance:** Magia poderosa es un recurso valioso pero no trivial.

### 4.3 Comparativa de Modelos Mágicos

| Modelo | Frecuencia | Poder Pico | Complejidad |
|--------|------------|------------|-------------|
| **Académico** | ∞ básico, limitado poderoso | Alto | Baja |
| **Organizacional** | Limitado por fatiga | Medio-Alto | Media |
| **Profesional** | Limitado por mana | Medio | Media |

**Recomendación:** Modelo Académico para simplicidad, Organizacional para drama.

---

## 5. Balance de Potencias

### 5.1 Economía de Devoción

| Acción | Efecto |
|--------|--------|
| Actuar según Potencia | +1 Devoción |
| Violar principios | -1 a -3 Devoción |
| Intervención Menor | -1 Devoción |
| Intervención Mayor | -3 Devoción |

**Ciclo típico:**
- Sesión: Ganas 1-2, gastas 1-2
- Balance: Sistema se autorregula

### 5.2 Poder de las Intervenciones

**Intervención Menor (1 PD):** Repetir Dado de Destino
- Cambiar Adverso (1-4) a algo mejor
- Probabilidad de mejora: 66.7%
- **Valor:** Moderado

**Intervención Mayor (3 PD):** Habilidad única
- Depende de la Potencia específica
- **Valor:** Alto pero situacional

**Balance:** Correcto. Las Intervenciones son valiosas pero no dominantes.

---

## 6. Análisis de Arquetipos

### 6.1 Ocupaciones - Comparativa

| Ocupación | PA | Bonus | Rol |
|-----------|-----|-------|-----|
| Guerrero | 14 | +1 Fuerza | Tank/DPS |
| Explorador | 10 | +1 Agilidad | Scout/DPS |
| Erudito | 6 | +1 Ingenio | Soporte/Utilidad |
| Diplomático | 8 | +1 Carisma | Social |
| Místico | 6-8 | +1 Alma | DPS Mágico |
| Artesano | 8 | +1 Ingenio | Soporte |

**Observación:** Guerrero tiene +133% más PA que Erudito (14 vs 6).

**¿Es justo?** Sí, porque:
- Eruditos rara vez están en primera línea
- Tienen habilidades fuera de combate más potentes
- El sistema no es solo combate

### 6.2 Sinergia de Cartas

**Combo fuerte (Guerrero):**
- Linaje: Galo (+1 Fuerza) → 4 Fuerza
- Entorno: Campamentos (+2 Supervivencia)
- Trasfondo: Veterano (+2 en formación)
- Ocupación: Legionario (+1 Fuerza) → 5 Fuerza
- Potencia: Gloria de Roma

**Resultado:** Fuerza 5, PA 14, +2 formación, +2 supervivencia

**Combo fuerte (Místico):**
- Linaje: Egipcio (+1 Alma) → 4 Alma
- Entorno: Templos (+2 Religión)
- Trasfondo: Testigo de Milagro (+2 vs sobrenatural)
- Ocupación: Augur (+1 Alma) → 5 Alma
- Potencia: Dioses Ancestrales

**Resultado:** Alma 5, PA 6, +2 religión, +2 vs sobrenatural

**Balance:** Ambos builds son fuertes en su nicho. Correcto.

---

## 7. Problemas Detectados y Soluciones

### 7.1 Problema: Giros del Destino Frecuentes

**Situación:** 8.3% de probabilidad = ~1 por cada 12 tiradas

En una sesión con 30-50 tiradas, habrá 2-4 Giros del Destino.

**Impacto:** Puede sentirse menos especial.

**Soluciones propuestas:**

| Solución | Probabilidad | Pros | Contras |
|----------|--------------|------|---------|
| **Actual (iguales)** | 8.3% | Simple | Frecuente |
| **Solo 1-1 o 12-12** | 1.4% | Muy especial | Muy raro |
| **Dados iguales + altos** | 4.2% (≥7 iguales) | Balance | Más complejo |

**Recomendación:** Mantener actual pero dar guía de interpretar Giros menores.

### 7.2 Problema: Combates Largos vs Armadura

**Solución A:** Armadura como reducción porcentual
- Cuero: -25% daño
- Malla: -50% daño
- Placas: -75% daño

**Solución B:** Armadura como umbral + overflow
- Si daño > armadura, aplica todo
- Si daño ≤ armadura, aplica 1

**Recomendación:** Mantener sistema actual pero:
1. Añadir regla de "daño masivo" (ataques de ≥6 ignoran 1 armadura)
2. Fomentar maniobras tácticas

### 7.3 Problema: Faceta 5 en Creación

**Solución A:** Limitar bonos de cartas a +1 total

**Solución B:** Faceta max 4 en creación, 5+ solo con progresión

**Solución C:** Mantener pero ajustar Sellos (Iniciado max 4, no 3)

**Recomendación:** Solución C - Coherente con filosofía de "personajes competentes".

### 7.4 Problema: Falta de Contenido

**Carencias identificadas:**
1. Solo 6 arquetipos de ocupación
2. Solo 2 ambientaciones completas
3. Sin bestiario
4. Sin aventuras de ejemplo

**Solución:** Priorizar contenido en desarrollo futuro.

---

## 8. Recomendaciones de Ajuste

### 8.1 Ajustes Menores (No rompen compatibilidad)

| Ajuste | Cambio | Razón |
|--------|--------|-------|
| Giros del Destino | Añadir tabla de severidad | Diferenciar 2-2 de 11-11 |
| Daño masivo | ≥6 daño ignora 1 armadura | Acelerar combates vs tanques |
| Intervención Menor | Cambiar resultado, no repetir | Más predecible |

### 8.2 Ajustes Mayores (Requieren testing)

| Ajuste | Cambio | Razón |
|--------|--------|-------|
| Escala de costes PH | Faceta nueva = nivel × 2 | Frenar power creep |
| Sello Aprendiz | Añadir entre 0-10 PH | Más granularidad inicial |
| Magia modelo único | Elegir fatiga por defecto | Simplificar |

### 8.3 No Ajustar

| Elemento | Razón para mantener |
|----------|---------------------|
| d12 como dado base | Funciona bien, diferenciador |
| Sistema de 5 Cartas | Core del sistema, elegante |
| Dado de Destino | Innovación principal |
| 9 puntos de Facetas | Balance correcto |

---

## 9. Conclusiones de Balance

### 9.1 Puntuación de Balance

| Área | Puntuación | Comentario |
|------|------------|------------|
| **Matemáticas base** | ⭐⭐⭐⭐⭐ | Probabilidades bien calculadas |
| **Combate** | ⭐⭐⭐⭐ | Funcional, puede ser lento |
| **Magia** | ⭐⭐⭐⭐ | Flexible, necesita decisión de modelo |
| **Progresión** | ⭐⭐⭐⭐ | Buena curva, costes revisables |
| **Arquetipos** | ⭐⭐⭐ | Equilibrados pero pocos |
| **Potencias** | ⭐⭐⭐⭐⭐ | Sistema elegante y balanceado |
| **Global** | **⭐⭐⭐⭐** | **Sólido, listo para playtesting** |

### 9.2 Veredicto Final

**Proyecto Tarot está matemáticamente bien diseñado.** Los problemas identificados son menores y solucionables. El sistema está listo para playtesting extensivo, que revelará ajustes finos necesarios.

**Prioridades de testing:**
1. Combates prolongados vs armadura pesada
2. Frecuencia percibida de Giros del Destino
3. Velocidad de progresión
4. Balance entre arquetipos en grupos mixtos

---

*Este análisis de balance está basado en teoría y simulación. El playtesting real es esencial para validar las conclusiones.*
