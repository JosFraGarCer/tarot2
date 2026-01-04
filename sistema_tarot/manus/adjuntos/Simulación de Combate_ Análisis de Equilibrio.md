## **Simulación de Combate: Análisis de Equilibrio**

Este documento detalla los componentes y el desarrollo de un combate de prueba para analizar el equilibrio del sistema de juego del Proyecto Tarot.

### **1. Personajes Jugadores**

#### **Cayo, el Guerrero Legionario**
Un veterano endurecido, enfocado en la defensa y el control del campo de batalla.

*   **Arcanos:** Físico (Primario), Espiritual (Secundario), Mental (Terciario)
*   **Facetas:**
    *   **Fuerza:** 3 (+3)
    *   **Agilidad:** 1 (+1)
    *   **Vigor:** 2 (+2)
    *   **Voluntad:** 2 (+2)
    *   **Carisma:** 1 (+1)
    *   **Alma:** 0 (+0)
    *   **Percepción:** 1 (+1)
    *   **Ingenio:** 0 (+0)
    *   **Erudición:** 0 (+0)
*   **Ocupación:** Legionario (Base Aguante 10 + 2 Vigor = **12 Puntos de Aguante**)
*   **Habilidades Clave:**
    *   *Formación de Combate:* Umbral de Competencia 5 en Voluntad para mantener la disciplina.
    *   *Maestría del Scutum:* +1 Protección adicional con escudos grandes.

#### **Livia, la Artesana Herrera**
Una ingeniosa herrera que, aunque no es una guerrera, sabe cómo y dónde golpear con su martillo.

*   **Arcanos:** Mental (Primario), Físico (Secundario), Espiritual (Terciario)
*   **Facetas:**
    *   **Ingenio:** 3 (+3)
    *   **Percepción:** 2 (+2)
    *   **Erudición:** 1 (+1)
    *   **Fuerza:** 2 (+2)
    *   **Agilidad:** 1 (+1)
    *   **Vigor:** 0 (+0)
    *   **Voluntad:** 1 (+1)
    *   **Carisma:** 0 (+0)
    *   **Alma:** 0 (+0)
*   **Ocupación:** Herrero de Aldea (Base Aguante 8 + 0 Vigor = **8 Puntos de Aguante**)
*   **Habilidades Clave:**
    *   *Maestría del Metal:* Puede reparar y mejorar armas y armaduras.
    *   *Punto Débil (Especialización):* Puede identificar vulnerabilidades estructurales en armaduras.

### **2. Cartas de Equipo**

*   **Carta: Gladius (Arma Media)**
    *   **Daño Base:** 5
    *   **Cualidades:** Versátil (se puede usar con una o dos manos).

*   **Carta: Martillo de Forja (Arma Media)**
    *   **Daño Base:** 5
    *   **Cualidades:** Contundente (ignora 1 punto de Protección de armaduras metálicas).

*   **Carta: Lorica Segmentata (Armadura Pesada)**
    *   **Protección:** 6
    *   **Penalización:** -2 a las tiradas de Agilidad.

*   **Carta: Scutum (Escudo Grande)**
    *   **Protección:** 3
    *   **Cualidades:** Muralla (Permite usar la acción "Muro de Escudos" para dar cobertura a un aliado).

*   **Carta: Ropa de Cuero (Armadura Ligera)**
    *   **Protección:** 2
    *   **Penalización:** Ninguna.

*   **Carta: Hacha Oxidada (Arma Media)**
    *   **Daño Base:** 5
    *   **Cualidades:** Ninguna.

### **3. Personajes No Jugadores (Enemigos)**

#### **Bandido 1 (Bruto)**
Un matón grande y fuerte, pero poco hábil.

*   **Facetas Clave:** Fuerza +2, Vigor +1, Agilidad +0
*   **Puntos de Aguante:** 9
*   **Equipo:** Hacha Oxidada (Daño 5), Ropa de Cuero (Protección 2)

#### **Bandido 2 (Astuto)**
Más rápido y escurridizo, prefiere flanquear.

*   **Facetas Clave:** Agilidad +2, Percepción +1, Fuerza +0
*   **Puntos de Aguante:** 7
*   **Equipo:** Daga (Daño 3), Ropa de Cuero (Protección 2)

### **4. Equipamiento de los Personajes**

*   **Cayo:** Gladius, Lorica Segmentata, Scutum. **Protección Total: 10** (6 Armadura + 3 Escudo + 1 Maestría Scutum). **Penalización Agilidad: -2**.
*   **Livia:** Martillo de Forja, Ropa de Cuero. **Protección Total: 2**.

### **5. Simulación del Combate**

**Escenario:** Cayo y Livia son emboscados por dos bandidos en un callejón estrecho.

**Iniciativa:** Los bandidos atacan por sorpresa. No hay tirada de Percepción exitosa. Los bandidos actúan primero.

#### **TURNO 1**

1.  **Bandido 1 (Bruto) ataca a Cayo.**
    *   **Ataque:** El bandido usa su Fuerza (+2). Tira un **7** en su dado de Habilidad. **Total de Acción: 9**.
    *   **Defensa de Cayo:** Cayo elige **Bloquear** con su Scutum. Usa su Fuerza (+3). Tira un **6** en su dado de Habilidad. **Dificultad: 9**.
    *   **Resolución:** El ataque (9) iguala la defensa (9). El ataque acierta por la mínima.
    *   **Daño:** `Daño Base (5) - Protección de Cayo (10) = -5`. **Daño Final: 0**. El hacha resuena contra el escudo y la armadura de Cayo sin hacerle daño.
    *   **Escala del Destino:** Dado de Habilidad (7) vs. Dado de Destino (inventado: **9**). **Balanza: -2 (Maldición Menor)**. *Narración: El hacha del bandido golpea con fuerza, y aunque no atraviesa la armadura, el impacto hace que Cayo pierda el equilibrio momentáneamente.*

2.  **Bandido 2 (Astuto) ataca a Livia.**
    *   **Ataque:** El bandido usa su Agilidad (+2). Tira un **8**. **Total de Acción: 10**.
    *   **Defensa de Livia:** Livia intenta **Esquivar**. `Dificultad = 10 + su Agilidad (+1) = 11`.
    *   **Resolución:** El ataque (10) no supera la Dificultad (11). El ataque falla.
    *   **Escala del Destino:** Dado de Habilidad (8) vs. Dado de Destino (inventado: **3**). **Balanza: +5 (Bendición Mayor)**. *Narración: Livia no solo esquiva la daga, sino que el movimiento torpe del bandido le deja una apertura clara para su contraataque.*

3.  **Cayo ataca a Bandido 1 (Bruto).**
    *   **Ataque:** Cayo usa su Fuerza (+3). Tira un **9**. **Total de Acción: 12**.
    *   **Defensa del Bandido:** El bandido intenta **Esquivar**. `Dificultad = 10 + su Agilidad (+0) = 10`.
    *   **Resolución:** El ataque (12) supera la Dificultad (10). El ataque acierta.
    *   **Daño:** `Daño Base (5) - Protección del Bandido (2) = 3`. El bandido pierde 3 Puntos de Aguante (le quedan 6).
    *   **Escala del Destino:** Dado de Habilidad (9) vs. Dado de Destino (inventado: **2**). **Balanza: +7 (Bendición Mayor)**. *Narración: El gladius de Cayo no solo impacta, sino que lo hace con tal precisión que atraviesa un punto débil de la armadura, causando más dolor y haciendo que el bandido retroceda.*

4.  **Livia ataca a Bandido 2 (Astuto).**
    *   **Ataque:** Livia usa su Fuerza (+2) y su habilidad **Punto Débil**. Tira un **7**. **Total de Acción: 9**.
    *   **Defensa del Bandido:** El bandido intenta **Esquivar**. `Dificultad = 10 + su Agilidad (+2) = 12`.
    *   **Resolución:** El ataque (9) no supera la Dificultad (12). El ataque falla.
    *   **Escala del Destino:** Dado de Habilidad (7) vs. Dado de Destino (inventado: **11**). **Balanza: -4 (Maldición Mayor)**. *Narración: Livia, poco acostumbrada al combate, calcula mal la distancia. Su martillo golpea el muro de piedra, y el rebote casi se lo arranca de las manos, dejándola en una mala posición.*

#### **TURNO 2**

1.  **Bandido 1 (Bruto), herido y furioso, ataca de nuevo a Cayo.**
    *   **Ataque:** Fuerza (+2). Tira un **10**. **Total de Acción: 12**.
    *   **Defensa de Cayo:** Cayo vuelve a **Bloquear**. Fuerza (+3). Tira un **8**. **Dificultad: 11**.
    *   **Resolución:** El ataque (12) supera la Dificultad (11). Acierta.
    *   **Daño:** `Daño Base (5) - Protección (10) = 0`. El ataque es absorbido.
    *   **Escala del Destino:** Dado de Habilidad (10) vs. Dado de Destino (inventado: **1**). **Balanza: +9 (Bendición Trascendente)**. *Narración: El hacha del bandido golpea con una fuerza desesperada. Cayo no solo lo bloquea, sino que usa la fuerza del golpe para desviar el arma del bandido, dejándolo completamente desarmado y abierto a un contraataque letal.*

2.  **Bandido 2 (Astuto), aprovechando la mala posición de Livia, la ataca.**
    *   **Ataque:** Agilidad (+2). Tira un **9**. **Total de Acción: 11**.
    *   **Defensa de Livia:** Livia intenta **Esquivar**, pero la Maldición Mayor de su turno anterior le impone una penalización. `Dificultad = 10 + Agilidad (+1) = 11`. El DJ dictamina que la Maldición Mayor convierte la tirada de ataque del bandido en una con Bendición Mayor.
    *   **Resolución:** El ataque (11) iguala la Dificultad (11). Acierta.
    *   **Daño:** `Daño Base (3) - Protección (2) = 1`. Livia pierde 1 Punto de Aguante (le quedan 7).
    *   **Escala del Destino:** Dado de Habilidad (9) vs. Dado de Destino (inventado: **4**). **Balanza: +5 (Bendición Mayor)**. *Narración: La daga del bandido acierta, pero es solo un corte superficial. Sin embargo, el verdadero peligro es que el bandido usa el ataque para empujar a Livia contra la pared, acorralándola.*

3.  **Cayo aprovecha la apertura y ataca al Bandido 1 desarmado.**
    *   **Ataque:** Cayo tiene una Bendición Trascendente de su defensa. Tira un **5**, pero el DJ dictamina que la Bendición le permite un éxito automático. El ataque acierta.
    *   **Daño:** `Daño Base (5) - Protección (2) = 3`. El bandido pierde otros 3 Puntos de Aguante (le quedan 3).
    *   **Escala del Destino:** Dado de Habilidad (5) vs. Dado de Destino (inventado: **5**). **Balanza: 0 (Giro del Destino)**. *Narración: Justo cuando Cayo va a rematar al bandido, este se rinde, arrojándose al suelo y suplicando por su vida. "¡Me rindo! ¡Te diré quién nos envió!"*

4.  **Livia, acorralada, ataca al Bandido 2.**
    *   **Ataque:** Livia usa su Fuerza (+2) y su Martillo Contundente. Tira un **11**. **Total de Acción: 13**.
    *   **Defensa del Bandido:** El bandido intenta **Esquivar**. `Dificultad = 12`.
    *   **Resolución:** El ataque (13) supera la Dificultad (12). Acierta.
    *   **Daño:** `Daño Base (5)`. El martillo es Contundente, ignora 1 de Protección. `5 - (2-1) = 4`. El bandido pierde 4 Puntos de Aguante (le quedan 3).
    *   **Escala del Destino:** Dado de Habilidad (11) vs. Dado de Destino (inventado: **10**). **Balanza: +1 (Bendición Menor)**. *Narración: El golpe de Livia es certero. El martillo impacta en el hombro del bandido con un crujido. Es un golpe limpio y efectivo.*

### **6. Análisis del Equilibrio**

*   **Protección vs. Daño:** El sistema funciona. La alta protección de Cayo lo convierte en un tanque efectivo, capaz de anular completamente el daño de enemigos básicos. El daño base de las armas parece adecuado; no es tan alto como para eliminar a los personajes de un solo golpe, pero es lo suficientemente significativo como para que cada impacto cuente contra personajes menos blindados como Livia.

*   **Puntos de Aguante:** La cantidad de Puntos de Aguante parece correcta. Livia, con 8, puede soportar un par de golpes antes de estar en peligro real de recibir una Herida Grave. Cayo, con 12, tiene un colchón considerable.

*   **Escala del Destino:** La Escala del Destino es la estrella del sistema. Añade una capa narrativa crucial que hace que incluso los ataques fallidos o los golpes sin daño sean interesantes. La Maldición Mayor de Livia tuvo un impacto directo en el siguiente turno, y la Bendición Trascendente de Cayo cambió por completo el curso del combate con el Bandido 1.

*   **Especialización:** El Martillo Contundente de Livia demostró ser útil, permitiéndole hacer un daño más significativo. Las habilidades de Cayo lo definieron claramente como un defensor.

*   **Ritmo:** El combate fue rápido y dinámico. En dos turnos, la situación ha evolucionado significativamente, con un enemigo neutralizado y el otro herido, pero con los personajes también habiendo sufrido algunos contratiempos.

**Conclusión Preliminar:** El sistema de combate parece estar bien equilibrado para este nivel de poder. Los personajes se sienten competentes en sus roles, el equipo es significativo y la Escala del Destino añade la dosis perfecta de drama y consecuencias narrativas. No se requieren ajustes importantes en este momento, pero sería útil probarlo contra enemigos con habilidades más complejas. 
