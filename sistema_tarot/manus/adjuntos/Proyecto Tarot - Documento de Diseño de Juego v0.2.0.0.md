# **Proyecto Tarot - Documento de Diseño de Juego v0.2.0.0**

## **Índice**

1. [Introducción](#introducción)

1. [Sistema de Dados](#sistema-de-dados)

1. [Creación de Personajes](#creación-de-personajes)

1. [Sistema de Talento](#sistema-de-talento)

1. [Sistema de Combate](#sistema-de-combate)

1. [Sistema de Salud y Daño](#sistema-de-salud-y-daño)

1. [Progresión de Personajes](#progresión-de-personajes)

1. [Intervenciones del Arcano](#intervenciones-del-arcano)

1. [Ejemplos de Personajes](#ejemplos-de-personajes)

---

## **1. Introducción**

**Proyecto Tarot** es un sistema de juego de rol que combina mecánicas de dados con narrativa rica, inspirado en el simbolismo del Tarot. El sistema está diseñado para crear experiencias memorables donde tanto las habilidades del personaje como el destino juegan roles importantes en la historia.

### **Filosofía de Diseño**

- **Equilibrio entre mecánicas y narrativa**

- **Diferenciación clara entre arquetipos de personajes**

- **Progresión significativa pero controlada**

- **Tensión apropiada en los conflictos**

---

## **2. Sistema de Dados**

### **2.1 Dados Básicos**

El sistema utiliza **dos dados de 12 caras (2d12)**:

- **Dado de Habilidad:** Representa la competencia del personaje

- **Dado de Destino:** Introduce elementos narrativos y consecuencias

### **2.2 Resolución de Acciones**

**Fórmula:** Dado de Habilidad + Atributo + Talento vs Dificultad

### **2.3 Escala de Dificultades**

| Dificultad | Valor | Descripción |
| --- | --- | --- |
| **Rutinario** | Automático | No requiere tirada |
| **Sencillo** | 6 | Tareas básicas |
| **Moderado** | 9 | Desafíos estándar |
| **Difícil** | 12 | Pruebas exigentes |
| **Heroico** | 15 | Hazañas excepcionales |

### **2.4 El Dado de Destino**

El Dado de Destino añade consecuencias narrativas:

**Destino Favorable (9-12):**

- **En éxito:** Beneficio adicional o efecto extra positivo

- **En fallo:** Fallo sin consecuencias negativas adicionales

**Destino Neutral (5-8):**

- **Resultado limpio** sin efectos adicionales

**Destino Adverso (1-4):**

- **En éxito:** Éxito con coste o complicación menor

- **En fallo:** Fallo con consecuencia negativa adicional

**Giro del Destino (dados iguales):**

- Cuando ambos dados muestran el mismo número, ocurre algo extraordinario e inesperado que cambia significativamente la situación

---

## **3. Creación de Personajes**

### **3.1 Las Cinco Cartas**

Cada personaje se define mediante cinco cartas del Tarot:

1. **El Origen** - Trasfondo y procedencia

1. **La Ocupación** - Profesión y habilidades principales

1. **El Arcano** - Poder místico o habilidad especial

1. **La Motivación** - Impulso principal del personaje

1. **El Defecto** - Debilidad o limitación personal

### **3.2 Facetas**

Los personajes tienen cinco atributos principales:

| Atributo | Descripción |
| --- | --- |
| **Fuerza** | Poder físico y resistencia |
| **Agilidad** | Velocidad, reflejos y coordinación |
| **Vigor** | Resistencia y salud física |
| **Ingenio** | Inteligencia, astucia y creatividad |
| **Percepción** | Consciencia del entorno y intuición |
| **Voluntad** | Determinación y resistencia mental |
| **Alma** | Conexión con lo sobrenatural y carisma |
| **Carisma** | Presencia personal y liderazgo |
| **Erudición** | Conocimiento académico y cultura |

### **3.3 Escala de Poder de las Facetas**

| Valor | Denominación | Descripción |
| --- | --- | --- |
| **0** | Sin Destacar | Capacidad humana promedio |
| **1** | Entrenado | Competencia básica, formación inicial |
| **2** | Competente | Habilidad notable, experiencia práctica |
| **3** | Excepcional | Talento destacado, años de experiencia |
| **4** | Experto | Dominio profesional, reconocimiento |
| **5** | Maestro | Maestría consumada, referente en el campo |
| **6** | Legendario | Habilidades que trascienden lo común |
| **7** | Mítico | Capacidades que rozan lo sobrehumano |
| **8** | Sobrenatural | Poder que supera los límites mortales |
| **9** | Divino | Capacidades de nivel cósmico |

### **3.4 Distribución de Puntos**

**Distribución inicial:** 5 puntos / 3 puntos / 1 punto

- **5 puntos:** Atributo principal (máximo 3 en Nivel 1)

- **3 puntos:** Atributo secundario (máximo 3 en Nivel 1)

- **1 punto:** Atributo terciario (máximo 3 en Nivel 1)

**Regla Opcional - Sacrificio del Arcano:**
Un personaje puede sacrificar completamente un atributo (dejándolo en 0) para aumentar otro atributo en +1, superando el límite normal.

---

## **4. Sistema de Talento**

### **4.1 Concepto de Talento**

El **Talento** representa la competencia específica del personaje con ciertas habilidades, armas o disciplinas. Se suma al atributo relevante para determinar el bonificador total.

### **4.2 Distribución de Talento por Arquetipo**

| Arquetipo | Talento | Descripción |
| --- | --- | --- |
| **Combatientes** | +3 | Especialistas en combate y guerra |
| **Mixtos** | +2 | Equilibrio entre combate y otras habilidades |
| **No-Combatientes** | +1 | Especialistas en habilidades no-marciales |

### **4.3 Aplicación del Talento**

- **Combatientes:** Talento +3 en su arma/estilo principal

- **Mixtos:** Talento +2 en su disciplina principal

- **No-Combatientes:** Talento +1 en su habilidad de supervivencia

### **4.4 Ejemplos por Arquetipo**

**Combatientes:**

- Talento en Arco +3

- Talento en Espada +3

- Talento Marcial +3

**Mixtos:**

- Talento en Hechizos +2

- Talento en Magia Elemental +2

- Talento en Defensa Contra Artes Oscuras +2

**No-Combatientes:**

- Talento en Conocimiento +1

- Talento en Hierbas +1

- Talento en Evasión +1

---

## **5. Sistema de Combate**

### **5.1 Dificultades de Combate**

| Situación | Dificultad |
| --- | --- |
| **Enemigo desprevenido** | 6 |
| **Enemigo distraído** | 8 |
| **Combate estándar** | 12 |
| **Enemigo defensivo** | 15 |
| **Enemigo en cobertura total** | 18 |

### **5.2 Secuencia de Combate**

1. **Determinar iniciativa** (Percepción + Agilidad)

1. **Declarar acciones**

1. **Resolver ataques** (Atributo + Talento vs Dificultad)

1. **Aplicar daño** (Daño del arma - Protección del objetivo)

1. **Efectos del Destino**

### **5.3 Cálculo de Daño**

**Daño Final = Daño Base del Arma - Protección del Objetivo**

- **Daño mínimo:** Siempre 1 punto (incluso si la protección supera el daño base)

### **5.4 Modificadores Situacionales**

| Situación | Modificador |
| --- | --- |
| **Emboscada/Sorpresa** | Primer ataque Dif 6 |
| **Terreno ventajoso** | +2 a ataques por 2-3 turnos |
| **Herida Grave** | -2 a todas las tiradas |
| **Múltiples enemigos** | +3 dificultad por enemigo adicional |

---

## **6. Sistema de Salud y Daño**

### **6.1 Puntos de Aguante**

Los Puntos de Aguante representan la capacidad del personaje para mantenerse activo bajo estrés. Se determinan por:
**Aguante Base (por Ocupación) + Modificador de Vigor**

### **6.2 Heridas Graves**

**Umbral:** Cuando el Aguante cae por debajo del 50% del máximo

**Efectos de Herida Grave:**

- **-2 a todas las tiradas** hasta curación completa

- **Riesgo de sangrado:** 1 daño por turno si realiza actividad intensa

- **Tiempo de curación:** 1 semana de descanso o curación mágica/médica

### **6.3 Heridas Críticas**

**Umbral:** Cuando el Aguante cae por debajo del 25% del máximo

**Efectos de Herida Crítica:**

- **-4 a todas las tiradas**

- **Riesgo de incapacitación permanente**

- **Requiere curación mágica/médica especializada**

### **6.4 Protección**

La Protección reduce el daño recibido, representando armaduras, escudos mágicos o resistencias naturales.

| Tipo de Protección | Valor | Ejemplos |
| --- | --- | --- |
| **Sin protección** | 0 | Ropa normal |
| **Protección ligera** | 1 | Cuero, túnicas reforzadas |
| **Protección media** | 2 | Cuero reforzado, malla ligera |
| **Protección pesada** | 3 | Armadura de placas, malla completa |
| **Protección mágica** | 1-4 | Escudos arcanos, bendiciones |

---

## **7. Progresión de Personajes**

### **7.1 Los Tres Sellos**

Los personajes progresan rompiendo tres Sellos místicos:

1. **Sello del Iniciado **(Nivel 1) - Límite de Faceta: 3

1. **Sello del Camino **(Nivel 3) - Límite de Faceta: 4

1. **Sello del Heroe **(Nivel 5) - Límite de Faceta: 5

### **7.2 Beneficios por Sello Roto**

Al romper cada Sello, el personaje obtiene:

- **+1 punto** para distribuir en cualquier Faceta (respetando límites)

- **+1 Talento** en su disciplina principal

- **Acceso a nuevas habilidades** según su Ocupación y Arcano

### **7.3 Progresión de Talento**

| Nivel | Combatientes | Mixtos | No-Combatientes |
| --- | --- | --- | --- |
| **1** | +3 | +2 | +1 |
| **3** | +4 | +3 | +2 |
| **5** | +5 | +4 | +3 |

---

## **8. Intervenciones del Arcano**

### **8.1 Concepto**

Las Intervenciones representan momentos donde el Arcano del personaje se manifiesta de forma extraordinaria, alterando el curso de los eventos.

### **8.2 Activación**

- **Frecuencia:** Una vez por sesión de juego

- **Momento:** Cuando el personaje enfrenta una situación crítica

- **Efecto:** Varía según el Arcano específico

### **8.3 Ejemplos de Intervenciones**

**El Conocimiento:**

- "Revelación Súbita" - Recuerda información crucial

- "Solución Inesperada" - Encuentra una salida creativa

**La Luz:**

- "Protección Divina" - Escudo de energía pura

- "Purificación" - Elimina efectos negativos

**Los Elementos:**

- "Furia Elemental" - Invoca el poder de los elementos

- "Armonía Natural" - Se conecta con las fuerzas naturales

**La Justicia:**

- "Protección de los Inocentes" - Escudos que protegen y reflejan

- "Juicio Divino" - Castigo para los malvados

---

## **9. Ejemplos de Personajes**

### **9.1 La Rueda del Tiempo - Nivel 1**

#### **Tam al'Thor (Combatiente)**

**Las Cinco Cartas:**

- **Origen:** El Ermitaño (Granjero de Dos Ríos)

- **Ocupación:** El Emperador (Soldado Veterano)

- **Arcano:** La Fuerza (Determinación Inquebrantable)

- **Motivación:** El Hierofante (Proteger a la Familia)

- **Defecto:** La Torre (Recuerdos Dolorosos de Guerra)

**Atributos:**

- Fuerza 2, Agilidad 3, Vigor 2, Percepción 3, Voluntad 2

- **Modificadores:** Agilidad +3, Percepción +3, Vigor +2

**Combate:**

- **Aguante:** 8 + 2 = 10 puntos

- **Protección:** 2 (Cuero reforzado)

- **Talento en Arco:** +3 (Total: +6 vs Dif 12 = 75% éxito)

- **Daño:** 3 (Arco largo), 2 (Daga)

#### **Egwene al'Vere (No-Combatiente)**

**Las Cinco Cartas:**

- **Origen:** La Sacerdotisa (Aldeana de Dos Ríos)

- **Ocupación:** La Emperatriz (Aprendiz de Sabiduría)

- **Arcano:** El Conocimiento (Sabiduría Ancestral)

- **Motivación:** La Estrella (Ayudar a su Pueblo)

- **Defecto:** La Luna (Demasiado Curiosa)

**Atributos:**

- Ingenio 3, Percepción 2, Voluntad 3, Alma 2

- **Modificadores:** Ingenio +3, Voluntad +3, Percepción +2

**Combate:**

- **Aguante:** 5 + 0 = 5 puntos

- **Protección:** 0 (Vestido)

- **Talento en Hierbas:** +1 (Total: +4 vs Dif 12 = 50% éxito)

- **Daño:** 1 (Bastón/Improvisado)

### **9.2 Harry Potter - Nivel 3**

#### **Harry Potter (Mixto)**

**Las Cinco Cartas:**

- **Origen:** El Huérfano (Criado por Muggles)

- **Ocupación:** El Mago (Auror en Entrenamiento)

- **Arcano:** La Supervivencia (Instinto de Supervivencia)

- **Motivación:** La Justicia (Proteger a los Inocentes)

- **Defecto:** El Mártir (Se Sacrifica por Otros)

**Atributos:**

- Agilidad 4, Voluntad 4, Percepción 4, Ingenio 3, Alma 3

- **Modificadores:** Agilidad +4, Voluntad +4, Percepción +4, Alma +3

**Combate:**

- **Aguante:** 8 + 2 = 10 puntos

- **Protección:** 2 (Túnica de combate)

- **Talento en DCAO:** +3 (Total: +7 vs Dif 12 = 83% éxito)

- **Daño:** 4 (Hechizos de combate avanzados)

#### **Hermione Granger (No-Combatiente)**

**Las Cinco Cartas:**

- **Origen:** La Forastera (Nacida Muggle)

- **Ocupación:** La Erudita (Investigadora Mágica)

- **Arcano:** El Conocimiento (Sabiduría Enciclopédica)

- **Motivación:** La Justicia (Igualdad para Todos)

- **Defecto:** La Perfeccionista (Obsesión por la Excelencia)

**Atributos:**

- Ingenio 4, Erudición 4, Voluntad 4, Percepción 3, Carisma 2

- **Modificadores:** Ingenio +5, Erudición +4, Voluntad +5, Percepción +3

**Combate:**

- **Aguante:** 6 + 1 = 7 puntos

- **Protección:** 1 (Túnica reforzada)

- **Talento en Hechizos Precisos:** +2 (Total: +7 vs Dif 12 = 83% éxito)

- **Daño:** 4 (Hechizos precisos y eficientes)

### **9.3 Warcraft - Nivel 5**

#### **Arthas Menethil (Combatiente)**

**Las Cinco Cartas:**

- **Origen:** El Emperador (Príncipe de Lordaeron)

- **Ocupación:** El Hierofante (Paladín Supremo)

- **Arcano:** La Luz (Poder Divino)

- **Motivación:** La Justicia (Proteger a su Reino)

- **Defecto:** El Orgullo (Arrogancia Fatal)

**Atributos:**

- Fuerza 5, Voluntad 5, Carisma 5, Percepción 4, Alma 4

- **Modificadores:** Fuerza +5, Voluntad +5, Carisma +5, Alma +4

**Combate:**

- **Aguante:** 12 + 4 = 16 puntos

- **Protección:** 4 (Armadura sagrada completa)

- **Talento en Luz Sagrada:** +5 (Total: +9 vs Dif 12 = 92% éxito)

- **Daño:** 6 (Espada bendita + poder divino)

#### **Medivh (No-Combatiente)**

**Las Cinco Cartas:**

- **Origen:** El Heredero (Guardián de Tirisfal)

- **Ocupación:** El Mago (Guardián Supremo)

- **Arcano:** El Tiempo (Manipulación Temporal)

- **Motivación:** El Equilibrio (Proteger Azeroth)

- **Defecto:** La Corrupción (Influencia Demoníaca)

**Atributos:**

- Ingenio 5, Alma 5, Voluntad 5, Erudición 5, Percepción 5

- **Modificadores:** Ingenio +5, Alma +5, Voluntad +5, Erudición +5

**Combate:**

- **Aguante:** 8 + 3 = 11 puntos

- **Protección:** 3 (Túnicas del Guardián + Escudos mágicos)

- **Talento en Magia Suprema:** +3 (Total: +8 vs Dif 12 = 92% éxito)

- **Daño:** 6 (Magia arcana suprema)

---

## **10. Probabilidades de Éxito por Arquetipo**

### **10.1 Análisis Estadístico**

| Nivel | Combatientes | Mixtos | No-Combatientes |
| --- | --- | --- | --- |
| **1** | 75-85% | 50-65% | 45-60% |
| **3** | 85-90% | 75-80% | 65-75% |
| **5** | 90-95% | 85-90% | 80-85% |

### **10.2 Diferenciación por Arquetipo**

- **Combatientes:** Superiores en confrontación directa y resistencia

- **Mixtos:** Equilibrio entre combate y versatilidad

- **No-Combatientes:** Compensan fragilidad con creatividad y conocimiento

### **10.3 Factores de Equilibrio**

- **Aguante y Protección:** Los combatientes absorben más errores

- **Versatilidad Táctica:** Los no-combatientes tienen más opciones

- **Intervenciones del Arcano:** Pueden cambiar situaciones críticas

- **Especialización:** Cada arquetipo tiene su nicho único

---

## **Conclusión**

**Proyecto Tarot v0.2.0.0** presenta un sistema equilibrado que:

✅ **Diferencia claramente** entre arquetipos sin dominio absoluto
✅ **Mantiene tensión apropiada** en los conflictos (60-85% probabilidades)
✅ **Recompensa la especialización** a través del sistema de Talento
✅ **Permite progresión significativa** manteniendo el equilibrio
✅ **Integra narrativa y mecánicas** de forma orgánica
✅ **Funciona en múltiples géneros** y estilos de campaña

El sistema está listo para playtesting y refinamiento basado en la experiencia de juego real.

