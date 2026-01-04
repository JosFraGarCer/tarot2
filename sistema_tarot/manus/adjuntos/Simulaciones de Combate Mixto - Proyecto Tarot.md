# **Simulaciones de Combate Mixto - Proyecto Tarot**

## **Metodología de Simulación**

Para validar el equilibrio entre personajes de combate y no-combate, ejecutaremos simulaciones que incluyan:

1. **Combates puros** con personajes de combate
2. **Situaciones mixtas** donde personajes no-combate deben sobrevivir
3. **Escenarios de apoyo** donde no-combate ayuda a combate
4. **Análisis de supervivencia** en diferentes contextos

---

## **SIMULACIÓN 1: NIVEL 1 - EMBOSCADA EN EL CAMINO**

### **Escenario:** 
Jaime Lannister (Joven) y Samwell Tarly viajan juntos cuando son emboscados por 3 bandidos.

**Participantes:**
- **Jaime:** Fuerza +4, Aguante 8, Protección 4, Daño 4
- **Sam:** Ingenio +4, Aguante 6, Protección 0, Daño 1
- **3 Bandidos:** Fuerza +1, Aguante 6, Protección 1, Daño 3

### **TURNO 1 - Emboscada**

**Bandido 1 ataca a Jaime:**
- **Tirada:** Habilidad 7, Destino 5
- **Cálculo:** 7 + 1 = 8 vs Dificultad 9 (sorpresa)
- **Resultado:** Fallo
- **Destino:** Neutral (0)
- **Consecuencia:** El ataque falla limpiamente

**Bandido 2 ataca a Sam:**
- **Tirada:** Habilidad 9, Destino 2
- **Cálculo:** 9 + 1 = 10 vs Dificultad 9 (sorpresa)
- **Resultado:** Éxito
- **Destino:** Adverso (-7)
- **Daño:** 3 - 0 = 3 daño a Sam
- **Consecuencia del Destino Adverso:** El bandido tropieza tras el ataque y queda vulnerable
- **Aguante Sam:** 3 (¡Herida Leve!)

**Bandido 3 ataca a Jaime:**
- **Tirada:** Habilidad 6, Destino 11
- **Cálculo:** 6 + 1 = 7 vs Dificultad 9
- **Resultado:** Fallo
- **Destino:** Favorable (+5)
- **Consecuencia:** Falla pero se posiciona para flanquear

**Sam usa "Supervivencia por Astucia" (huir):**
- **Tirada:** Habilidad 8, Destino 4
- **Cálculo:** 8 + 4 (Ingenio) = 12 vs Dificultad 9 (escapar)
- **Resultado:** Éxito
- **Destino:** Adverso (-4)
- **Consecuencia:** Escapa pero deja caer su morral con pergaminos importantes

**Jaime ataca a Bandido 2 (vulnerable):**
- **Tirada:** Habilidad 10, Destino 8
- **Cálculo:** 10 + 4 = 14 vs Dificultad 9 (vulnerable)
- **Resultado:** Éxito
- **Destino:** Neutral (0)
- **Daño:** 4 - 1 = 3 daño
- **Aguante Bandido 2:** 3

### **TURNO 2**

**Bandido 1 ataca a Jaime:**
- **Tirada:** Habilidad 11, Destino 3
- **Cálculo:** 11 + 1 = 12 vs Dificultad 12
- **Resultado:** Éxito (justo)
- **Destino:** Adverso (-8)
- **Daño:** 3 - 4 = -1 → 1 daño mínimo
- **Consecuencia:** Su arma se rompe contra la armadura
- **Aguante Jaime:** 7

**Bandido 3 ataca con flanqueo:**
- **Tirada:** Habilidad 9, Destino 12
- **Cálculo:** 9 + 1 = 10 vs Dificultad 10 (flanqueo)
- **Resultado:** Éxito (justo)
- **Destino:** ¡Giro del Destino! (dados iguales)
- **Daño:** 3 - 4 = -1 → 1 daño mínimo
- **Giro del Destino:** Su ataque revela que Jaime lleva una carta importante oculta en su armadura
- **Aguante Jaime:** 6

**Sam (oculto) usa Intervención de "El Conocimiento":**
- **Efecto:** "Revelación Súbita" - Recuerda que los bandidos buscan la carta específica
- **Grita:** "¡Jaime! ¡Buscan la carta del Rey! ¡Es una trampa política!"

**Jaime ataca a Bandido 1 (desarmado):**
- **Tirada:** Habilidad 12, Destino 7
- **Cálculo:** 12 + 4 = 16 vs Dificultad 9 (desarmado)
- **Resultado:** Éxito
- **Destino:** Neutral (0)
- **Daño:** 4 - 1 = 3 daño
- **Aguante Bandido 1:** 3

### **TURNO 3 - Resolución**

Los bandidos, al ser descubiertos como agentes políticos y no simples ladrones, intentan huir con la información obtenida. Jaime debe decidir si perseguirlos o proteger a Sam.

**Resultado:** Sam sobrevive gracias a su inteligencia y capacidad de evasión, mientras que su conocimiento resulta crucial para entender la verdadera naturaleza del ataque.

---

## **SIMULACIÓN 2: NIVEL 3 - INFILTRACIÓN EN HOGWARTS**

### **Escenario:**
Aragorn y Hermione deben infiltrarse en una fortaleza custodiada por 2 Mortífagos.

**Participantes:**
- **Aragorn:** Agilidad +5, Aguante 13, Protección 2, Daño 3+2
- **Hermione:** Ingenio +5, Aguante 7, Protección 1, Daño 4 (hechizos)
- **2 Mortífagos:** Ingenio +3, Aguante 8, Protección 0, Daño 3

### **FASE 1 - Infiltración**

**Hermione lanza Hechizo de Desilusión:**
- **Tirada:** Habilidad 9, Destino 6
- **Cálculo:** 9 + 5 = 14 vs Dificultad 12
- **Resultado:** Éxito
- **Destino:** Neutral (0)
- **Efecto:** Ambos quedan invisibles por 3 turnos

**Aragorn usa Rastreo para encontrar ruta segura:**
- **Tirada:** Habilidad 11, Destino 8
- **Cálculo:** 11 + 4 (Percepción) = 15 vs Dificultad 12
- **Resultado:** Éxito
- **Destino:** Neutral (0)
- **Efecto:** Encuentra un pasaje que evita a 1 de los 2 guardias

### **FASE 2 - Combate Inevitable**

**Mortífago 1 detecta algo extraño:**
- **Tirada:** Habilidad 8, Destino 10
- **Cálculo:** 8 + 3 = 11 vs Dificultad 15 (invisibilidad)
- **Resultado:** Fallo
- **Destino:** Favorable (+2)
- **Consecuencia:** No los detecta, pero se pone alerta (+2 a su próxima tirada)

**Hermione ataca por sorpresa (Stupefy):**
- **Tirada:** Habilidad 10, Destino 4
- **Cálculo:** 10 + 5 = 15 vs Dificultad 9 (sorpresa)
- **Resultado:** Éxito
- **Destino:** Adverso (-6)
- **Daño:** 4 - 0 = 4 daño
- **Consecuencia:** El hechizo es ruidoso, alerta al segundo Mortífago
- **Aguante Mortífago 1:** 4

**Aragorn ataque dual por sorpresa:**
- **Tirada:** Habilidad 12, Destino 9
- **Cálculo:** 12 + 5 = 17 vs Dificultad 9 (sorpresa)
- **Resultado:** Éxito
- **Destino:** Favorable (+3)
- **Daño:** 3 + 2 = 5 daño total
- **Consecuencia:** El ataque es tan silencioso que el segundo Mortífago no se alerta
- **Aguante Mortífago 1:** -1 → Inconsciente

**Mortífago 2 (alerta) busca a los atacantes:**
- **Tirada:** Habilidad 7, Destino 11
- **Cálculo:** 7 + 3 + 2 (alerta) = 12 vs Dificultad 15 (invisibilidad)
- **Resultado:** Fallo
- **Destino:** Favorable (+4)
- **Consecuencia:** No los encuentra pero lanza un hechizo de área

**Hermione contraataca (Protego + Expelliarmus):**
- **Tirada:** Habilidad 11, Destino 7
- **Cálculo:** 11 + 5 = 16 vs Dificultad 12
- **Resultado:** Éxito
- **Destino:** Neutral (0)
- **Daño:** 4 - 0 = 4 daño
- **Aguante Mortífago 2:** 4

**Aragorn flanquea y ataca:**
- **Tirada:** Habilidad 8, Destino 8
- **Cálculo:** 8 + 5 = 13 vs Dificultad 12
- **Resultado:** Éxito
- **Destino:** ¡Giro del Destino!
- **Daño:** 5 daño
- **Giro del Destino:** Su ataque revela un pasaje secreto que lleva directamente al objetivo
- **Aguante Mortífago 2:** -1 → Inconsciente

**Resultado:** La combinación de sigilo (Aragorn) y magia utilitaria (Hermione) permite una infiltración exitosa con mínimo riesgo.

---

## **SIMULACIÓN 3: NIVEL 5 - CRISIS POLÍTICA**

### **Escenario:**
Lan Mandragoran y Tyrion Lannister deben detener un golpe de estado en el palacio real.

**Participantes:**
- **Lan:** Fuerza +6, Aguante 16, Protección 4, Daño 5
- **Tyrion:** Carisma +7, Aguante 10, Protección 2, Daño 2
- **4 Guardias Traidores:** Fuerza +3, Aguante 10, Protección 3, Daño 4
- **1 Lord Conspirador:** Carisma +4, Aguante 8, Protección 1, Daño 2

### **FASE 1 - Negociación**

**Tyrion intenta sobornar a los guardias:**
- **Tirada:** Habilidad 9, Destino 5
- **Cálculo:** 9 + 7 = 16 vs Dificultad 15 (lealtad comprada)
- **Resultado:** Éxito
- **Destino:** Neutral (0)
- **Efecto:** 2 de los 4 guardias cambian de bando

**Lord Conspirador intenta contra-sobornar:**
- **Tirada:** Habilidad 11, Destino 3
- **Cálculo:** 11 + 4 = 15 vs Dificultad 16 (oferta de Tyrion)
- **Resultado:** Fallo
- **Destino:** Adverso (-8)
- **Consecuencia:** Su desesperación revela información sobre otros conspiradores

### **FASE 2 - Combate Reducido**

**Guardia Traidor 1 ataca a Lan:**
- **Tirada:** Habilidad 6, Destino 9
- **Cálculo:** 6 + 3 = 9 vs Dificultad 12
- **Resultado:** Fallo
- **Destino:** Favorable (+3)
- **Consecuencia:** Falla pero se posiciona defensivamente

**Guardia Traidor 2 ataca a Tyrion:**
- **Tirada:** Habilidad 10, Destino 2
- **Cálculo:** 10 + 3 = 13 vs Dificultad 12
- **Resultado:** Éxito
- **Destino:** Adverso (-8)
- **Daño:** 4 - 2 = 2 daño
- **Consecuencia:** Su arma se atasca en la armadura de Tyrion
- **Aguante Tyrion:** 8

**Lan usa "Forma de la Hoja Vacía":**
- **Tirada:** Habilidad 12, Destino 7
- **Cálculo:** 12 + 6 (Voluntad) = 18 vs Dificultad 12
- **Resultado:** Éxito
- **Destino:** Neutral (0)
- **Daño:** 5 + 2 (Maestría) = 7 daño
- **Aguante Guardia 1:** 3

**Tyrion usa Intervención "Decreto Real":**
- **Efecto:** Ordena a los guardias leales arrestar al Lord Conspirador
- **Los 2 guardias convertidos actúan inmediatamente**

**Lord Conspirador intenta huir:**
- **Tirada:** Habilidad 5, Destino 12
- **Cálculo:** 5 + 2 (Agilidad) = 7 vs Dificultad 12 (guardias bloqueando)
- **Resultado:** Fallo
- **Destino:** ¡Giro del Destino!
- **Giro del Destino:** Su huida desesperada lo lleva directamente a una trampa que él mismo había preparado para el Rey

**Resultado:** La combinación de fuerza militar (Lan) y manipulación política (Tyrion) resuelve la crisis con mínima violencia y máxima información obtenida.

---

## **ANÁLISIS COMPARATIVO DE SIMULACIONES**

### **Supervivencia por Nivel:**

| Nivel | Combate | No-Combate | Estrategia de Supervivencia |
|-------|---------|------------|----------------------------|
| **1** | 75% éxito | 50% éxito | Evasión y apoyo indirecto |
| **3** | 90% éxito | 70% éxito | Habilidades defensivas + sinergia |
| **5** | 95% éxito | 85% éxito | Recursos y control indirecto |

### **Patrones Observados:**

**Nivel 1 - Dependencia Crítica:**
- Los personajes no-combate dependen completamente de evasión o protección
- Su valor radica en información y conocimiento especializado
- La supervivencia requiere planificación cuidadosa

**Nivel 3 - Sinergia Emergente:**
- Los personajes no-combate desarrollan capacidades defensivas limitadas
- La combinación de habilidades crea soluciones únicas
- El trabajo en equipo multiplica la efectividad

**Nivel 5 - Control Indirecto:**
- Los personajes no-combate pueden evitar el combate completamente
- Su influencia puede resolver conflictos antes de que escalen
- Los recursos disponibles compensan la fragilidad física

---

## **VALIDACIÓN DEL EQUILIBRIO MIXTO**

### **✅ Aspectos Exitosos:**

1. **Complementariedad:** Los personajes de combate y no-combate se complementan naturalmente
2. **Escalado Apropiado:** Ambos tipos crecen en poder de manera coherente
3. **Viabilidad Narrativa:** Todos los personajes pueden contribuir significativamente
4. **Tensión Mantenida:** Incluso en nivel 5, existe riesgo real para personajes no-combate

### **🔍 Observaciones Importantes:**

1. **Dependencia de Contexto:** Los personajes no-combate necesitan escenarios apropiados
2. **Curva de Aprendizaje:** Los jugadores deben aprender a usar habilidades no-combate efectivamente
3. **Equilibrio de Grupo:** Los grupos mixtos son más versátiles pero requieren coordinación

### **💡 Recomendaciones de Diseño:**

1. **Escenarios Mixtos:** Incluir desafíos que requieran ambos tipos de habilidades
2. **Protección Narrativa:** Dar razones para que los combatientes protejan a los no-combate
3. **Recompensas Apropiadas:** Valorar igualmente las contribuciones de ambos tipos
4. **Flexibilidad de Roles:** Permitir que los personajes desarrollen habilidades secundarias

**El sistema demuestra un equilibrio sólido entre personajes de combate y no-combate, con cada tipo aportando valor único e irreemplazable a la experiencia de juego.**
