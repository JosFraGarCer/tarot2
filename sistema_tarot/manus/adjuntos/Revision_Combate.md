# **Revisión y Ajuste de Valores de Combate**

## **1. Análisis del Problema**

Con la nueva escala de dificultades (Sencillo 6, Moderado 9, Difícil 12, Heroico 15), los valores de daño y protección que usamos en las simulaciones anteriores están probablemente desequilibrados. Un personaje con Protección 10 era invulnerable, y ahora con dificultades más bajas, el combate podría volverse trivial.

## **2. Objetivos del Reequilibrio**

- **Combates ágiles:** 3-5 turnos para un combate estándar
- **Letalidad moderada:** El peligro debe ser real, pero no frustrante
- **Roles claros:** Guerreros deben ser resistentes, Exploradores deben ser ágiles, etc.
- **Impacto de la armadura:** La protección debe ser significativa pero no invencible
- **Coherencia narrativa:** Los valores deben tener sentido en el mundo del juego

## **3. Propuestas de Ajuste**

### **Ajuste de Protección**

| Tipo de Armadura | Protección Anterior | Protección Propuesta | Justificación |
| :--- | :--- | :--- | :--- |
| Ropa normal | 0 | 0 | Sin cambios |
| Armadura de cuero | 2 | 1 | Protección ligera |
| Cota de malla | 4 | 2 | Protección media |
| Armadura de placas | 6 | 3 | Protección pesada |
| Escudo pequeño | 1 | 1 | Sin cambios |
| Escudo grande | 3 | 2 | Protección significativa |

**Protección Máxima Propuesta:** 5 (Placas + Escudo grande)

### **Ajuste de Daño de Armas**

| Tipo de Arma | Daño Anterior | Daño Propuesto | Justificación |
| :--- | :--- | :--- | :--- |
| Daga/Puño | 3 | 2 | Daño ligero |
| Espada corta/Hacha | 5 | 3 | Daño medio |
| Espada larga/Mandoble | 6 | 4 | Daño pesado |
| Arco/Ballesta | 4 | 3 | Daño a distancia |
| Hechizo básico | 3 | 2 | Daño mágico ligero |
| Hechizo potente | 6 | 4 | Daño mágico pesado |

**Daño Máximo Propuesto (Armas básicas):** 4

## **4. Análisis del Nuevo Equilibrio**

**Escenario 1: Guerrero vs. Bandido**
- **Guerrero:** Protección 5 (Placas + Escudo), Daño 4 (Espada larga)
- **Bandido:** Protección 1 (Cuero), Daño 3 (Hacha)

**Cálculo de Daño:**
- **Bandido ataca a Guerrero:** 3 (daño) - 5 (protección) = 0 daño. El guerrero es inmune a ataques básicos.
- **Guerrero ataca a Bandido:** 4 (daño) - 1 (protección) = 3 daño. El guerrero necesita 3-4 golpes para derrotar al bandido.

**Conclusión:** El guerrero sigue siendo demasiado poderoso contra enemigos básicos. La protección es demasiado alta.

## **5. Segunda Propuesta de Ajuste**

### **Ajuste de Protección (Revisado)**

| Tipo de Armadura | Protección Propuesta | Justificación |
| :--- | :--- | :--- |
| Ropa normal | 0 | Sin cambios |
| Armadura de cuero | 1 | Protección ligera |
| Cota de malla | 2 | Protección media |
| Armadura de placas | 3 | Protección pesada |
| Escudo pequeño | 0 | Solo para bloquear, no protección pasiva |
| Escudo grande | 1 | Protección pasiva ligera |

**Protección Máxima Propuesta:** 4 (Placas + Escudo grande)

### **Ajuste de Daño de Armas (Revisado)**

| Tipo de Arma | Daño Propuesto | Justificación |
| :--- | :--- | :--- |
| Daga/Puño | 2 | Daño ligero |
| Espada corta/Hacha | 3 | Daño medio |
| Espada larga/Mandoble | 4 | Daño pesado |
| Arco/Ballesta | 3 | Daño a distancia |
| Hechizo básico | 2 | Daño mágico ligero |
| Hechizo potente | 4 | Daño mágico pesado |

**Daño Máximo Propuesto (Armas básicas):** 4

## **6. Análisis del Nuevo Equilibrio (Revisado)**

**Escenario 1: Guerrero vs. Bandido**
- **Guerrero:** Protección 4 (Placas + Escudo), Daño 4 (Espada larga)
- **Bandido:** Protección 1 (Cuero), Daño 3 (Hacha)

**Cálculo de Daño:**
- **Bandido ataca a Guerrero:** 3 (daño) - 4 (protección) = 0 daño. Sigue siendo inmune.

**Conclusión:** El problema no es solo la protección, sino la relación entre daño y protección. Necesitamos un sistema más dinámico.

## **7. Tercera Propuesta: Sistema de Reducción de Daño**

**Mecánica:**
- **Protección no anula daño, lo reduce.**
- **Cada punto de Protección reduce el daño en 1.**
- **Mínimo 1 punto de daño si el ataque impacta.**

**Valores Propuestos:**
- **Protección Máxima:** 3 (Placas + Escudo)
- **Daño Máximo:** 4 (Mandoble)

## **8. Análisis del Nuevo Equilibrio (Tercera Propuesta)**

**Escenario 1: Guerrero vs. Bandido**
- **Guerrero:** Protección 3, Daño 4
- **Bandido:** Protección 1, Daño 3

**Cálculo de Daño:**
- **Bandido ataca a Guerrero:** 3 (daño) - 3 (protección) = 0 daño, pero mínimo 1. El guerrero recibe 1 punto de daño.
- **Guerrero ataca a Bandido:** 4 (daño) - 1 (protección) = 3 daño.

**Conclusión:** ¡Esto funciona! El guerrero es resistente pero no invulnerable. El combate es más rápido y peligroso. Los enemigos básicos siguen siendo una amenaza, aunque menor.

## **9. Propuesta Final para Simulación**

**Sistema de Reducción de Daño:**
- La Protección reduce el daño, mínimo 1 si el ataque impacta.

**Valores de Protección:**
- Ropa: 0
- Cuero: 1
- Malla: 2
- Placas: 3
- Escudo pequeño: +0 (solo para bloquear)
- Escudo grande: +1

**Valores de Daño:**
- Daga/Puño: 2
- Espada/Hacha: 3
- Mandoble/Arma a dos manos: 4
- Arco/Ballesta: 3
- Hechizo básico: 2
- Hechizo potente: 4

**Puntos de Aguante:**
- Guerrero: 10
- Místico/Experto: 6
- Explorador/Diplomático: 8
- Artesano: 7

**Umbral de Herida:** 50% de los Puntos de Aguante

**Dificultad de Ataque:**
- **Moderado (9):** Contra un objetivo que no espera el ataque o está distraído
- **Difícil (12):** Contra un objetivo alerta y en combate
- **Heroico (15):** Contra un objetivo muy ágil o en posición defensiva total

**¿Procedemos a simular combates con esta propuesta final?**
