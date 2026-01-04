# Proyecto Tarot: Documento de Diseño de Juego

**Versión:** 0.0.1.1
**Fecha:** 27 de septiembre de 2025

## 1.0 Filosofía de Diseño

El Proyecto Tarot se basa en tres pilares:

1.  **Universalidad:** Un sistema de reglas central que puede adaptarse a cualquier ambientación, desde la fantasía épica hasta el espionaje de la Guerra Fría, sin cambiar las mecánicas fundamentales.
2.  **Narrativa Integrada:** Las mecánicas del juego, especialmente el sistema de dados "Giro Tarot", están diseñadas para generar consecuencias narrativas interesantes, más allá del simple éxito o fracaso.
3.  **Modularidad (Sistema de Cartas):** La identidad de un personaje se construye a través de una selección de cartas (Origen, Ocupación, Equipo), lo que permite una personalización profunda y facilita la creación de nuevo contenido.

---

## 2.0 Creación de Personajes

### 2.1 Atributos: Los Arcanos y los Palos

El sistema se basa en los **"Arcanos del Ser"**, divididos en tres grupos. Cada Arcano contiene tres **"Palos"** (atributos).

| Arcano (Grupo) | Palos (Atributos Específicos) |
| :--- | :--- |
| **ARCANO FÍSICO** | Fuerza, Agilidad, Vigor |
| **ARCANO MENTAL** | Percepción, Ingenio, Erudición |
| **ARCANO ESPIRITUAL** | Voluntad, Carisma, Alma |

### 2.2 Escala de Poder de los Palos

| Valor | Modificador | Nivel de Competencia |
| :--- | :--- | :--- |
| **0** | +0 | Normal |
| **1** | +1 | Entrenado |
| **2** | +2 | Excepcional |
| **3** | +3 | Maestro |
| **4** | +4 | Sobrenatural |
| **5** | +5 | Divino |

### 2.3 Asignación de Puntos

1.  **Priorización de Arcanos:** El jugador prioriza los tres Arcanos: Primario, Secundario y Terciario.
2.  **Distribución de Puntos:** Se reciben puntos para distribuir entre los tres Palos de cada Arcano:
    *   **Arcano Primario:** 5 puntos.
    *   **Arcano Secundario:** 3 puntos.
    *   **Arcano Terciario:** 1 punto.
3.  **Límite Inicial:** Ningùn Palo puede tener una puntuación superior a **3** durante la creación (antes de aplicar la regla opcional).

### 2.4 Regla Opcional: "El Sacrificio del Arcano"

*   **Sacrificio Menor (para la Maestría):** Resta **1 punto** de un Palo en tu Arcano Terciario para ganar **1 punto** en tu Arcano Primario o Secundario (sin sobrepasar el límite de 3).
*   **Sacrificio Mayor (para la Trascendencia):** Resta **2 puntos** de tu Arcano Terciario para ganar **1 punto** en un Palo y superar el límite a 4.

---

## 3.0 Sistema de Resolución de Acciones

### 3.1 Principio: "Competencia y Drama"

*   **Acción Automática:** Si la habilidad de un personaje es claramente superior a la dificultad y no hay presión, la acción tiene éxito sin tirada.
*   **Tirada de Tensión:** Se realiza una tirada solo cuando el resultado es narrativamente interesante (oposición, incertidumbre, intento de proeza).

### 3.2 Mecánica: El "Giro Tarot"

Se lanzan dos dados de doce caras (d12):
*   **d12 de Habilidad (Blanco):** Representa la pericia del personaje.
*   **d12 de Destino (Negro):** Representa la suerte y las circunstancias.

**Total de Acción = Resultado del d12 de Habilidad + Modificador del Palo relevante.**

### 3.3 Umbral de Competencia

Para habilidades en las que el personaje es competente (otorgado por cartas), el d12 de Habilidad tiene un resultado mínimo garantizado. Si el resultado del dado es inferior al umbral, se considera el valor del umbral.

### 3.4 Escala del Destino

Se calcula la **Balanza del Destino = Resultado del d12 de Habilidad - Resultado del d12 de Destino**.

| Balanza | Giro | Efecto Narrativo |
| :--- | :--- | :--- |
| **+8 o más** | Bendición Trascendente | Éxito espectacular con una ventaja masiva. |
| **+4 a +7** | Bendición Mayor | Éxito con un beneficio claro y ùtil. |
| **+1 a +3** | Bendición Menor | Éxito limpio, sin complicaciones. |
| **0** | Giro del Destino | Evento extraordinario e inesperado que redefine la escena. |
| **-1 a -3** | Maldición Menor | Éxito con un pequeño coste o fallo sin consecuencias. |
| **-4 a -7** | Maldición Mayor | Éxito con una consecuencia grave o fallo que crea un nuevo problema. |
| **-8 o menos**| Maldición Catastrófica | Éxito con un coste terrible o fallo desastroso. |

---

## 4.0 Sistema de Salud y Daño: "Resistencia y Heridas"

*   **Puntos de Aguante:** `Base de la Ocupación + Modificador de Vigor`. Representan la capacidad de seguir luchando.
*   **Heridas Graves:** Cuando los Puntos de Aguante llegan a 0, el personaje debe hacer una **Tirada de Vigor**. Si falla, sufre una Herida Grave (ej. Brazo Roto, Conmoción) que impone penalizaciones permanentes hasta que se cure.

---

## 5.0 Sistema de Combate y Equipo

### 5.1 Iniciativa

*   **Combate Abierto:** Los jugadores siempre actúan primero.
*   **Emboscada:** Los enemigos actúan primero, a menos que los jugadores superen una Tirada de Percepción.

### 5.2 Flujo del Combate

1.  **Ataque:** El atacante realiza una Tirada de Tensión (`d12 Habilidad + Modificador de Palo`).
2.  **Defensa (Establece la Dificultad):** El defensor elige:
    *   **Esquivar:** `Dificultad = 10 + Modificador de Agilidad del defensor`.
    *   **Bloquear/Parar:** El defensor hace una tirada (`d12 + Modificador`). El resultado es la Dificultad.
3.  **Resolución:** Si el Total de Acción ≥ Dificultad, el ataque acierta.
4.  **Daño:** `Daño Final = Daño Base del Arma - Protección Total del Defensor`.

### 5.3 Equipo

*   **Armas:** Definen el **Daño Base** y tienen **Cualidades**.
*   **Armaduras:** Proporcionan **Protección** y pueden aplicar **Penalizaciones**.
*   **Escudos:** Añaden su valor de **Protección** al de la armadura.

---

## 6.0 Anatomía de las Cartas de Personaje

| Tipo de Carta | Función Principal |
| :--- | :--- |
| **Linaje** | Otorga +1 a un Palo y una habilidad pasiva innata. |
| **Entorno** | Otorga un Umbral de Competencia en una habilidad no combativa. |
| **Trasfondo** | Otorga una habilidad situacional potente y un gancho argumental. |
| **Ocupación** | Define la Base de Aguante, otorga +1 a un Palo y habilidades activas clave. |
| **Especialización**| Refina la Ocupación con habilidades más poderosas y definitorias. |

---

## 7.0 Arquetipos Conceptuales de Ocupación

| Arquetipo | Rol Principal |
| :--- | :--- |
| **Guerrero** | Combatiente directo, experto en armas y tácticas. |
| **Místico** | Canalizador de fuerzas sobrenaturales, magia o fe. |
| **Experto** | Maestro del conocimiento, la ciencia y la deducción. |
| **Diplomático**| Soluciona problemas con la palabra, la negociación y la influencia. |
| **Explorador** | Se mueve sin ser visto, experto en sigilo, infiltración y supervivencia. |
| **Artesano** | Creador y reparador de objetos, desde forjas hasta ciberimplantes. |

---

## 8.0 Ejemplos de Contenido por Ambientación

---

### **8.1 Ambientación: Antigüedad Histórica**

#### **8.1.1 Ocupaciones y Especializaciones**

*   **Ocupación: Legionario (Arquetipo: Guerrero)**
    *   **Beneficios:** Base de Aguante 10; +1 a **Fuerza**.
    *   **Habilidades:** Umbral de Competencia 5 en Voluntad para mantener la formación; +1 Protección con escudos grandes.
    *   **Especialización (Protector) -> Centurión:** Otorga +1 Protección a los aliados cercanos.
    *   **Especialización (Ejecutor) -> Triario:** Gana una Bendición Menor al atacar a un enemigo ya trabado en combate.

*   **Ocupación: Sacerdote de Júpiter (Arquetipo: Místico)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Alma**.
    *   **Habilidades:** Umbral de Competencia 5 en Erudición sobre rituales; puedes leer augurios para obtener pistas.
    *   **Especialización (Adivinación) -> Augur:** Tus lecturas de augurios son más claras y detalladas.
    *   **Especialización (Comunidad) -> Pontífice:** Ganas influencia política y social en la ciudad.

*   **Ocupación: Filósofo (Arquetipo: Experto)**
    *   **Beneficios:** Base de Aguante 4; +1 a **Erudición**.
    *   **Habilidades:** Umbral de Competencia 5 en Ingenio para el debate lógico; puedes desmoralizar a un oponente con argumentos.
    *   **Especialización (Conocimiento) -> Estoico:** Ganas un Umbral de Competencia 6 para resistir el dolor y la emoción.
    *   **Especialización (Manipulación) -> Sofista:** Puedes usar la retórica para confundir a tus oponentes, imponiendo una Maldición Menor en sus acciones.

*   **Ocupación: Orador (Arquetipo: Diplomático)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Carisma**.
    *   **Habilidades:** Umbral de Competencia 5 en Carisma para persuadir a multitudes; puedes proyectar tu voz para ser escuchado por encima del ruido.
    *   **Especialización (Inspiración) -> Tribuno:** Tus discursos pueden inspirar a los aliados, otorgándoles un bonus temporal a sus tiradas de Voluntad.
    *   **Especialización (Intriga) -> Senador:** Ganas acceso a los círculos internos del poder y al juego de la política.

*   **Ocupación: Speculator (Arquetipo: Explorador)**
    *   **Beneficios:** Base de Aguante 8; +1 a **Agilidad**.
    *   **Habilidades:** Umbral de Competencia 5 en Agilidad para el sigilo en terreno rural; Umbral de Competencia 5 en Percepción para el rastreo.
    *   **Especialización (Infiltrado) -> Espía:** Ganas la habilidad de crear y usar disfraces para infiltrarte en territorio enemigo.
    *   **Especialización (Supervivencia) -> Explorador de lo Salvaje:** Ignoras las penalizaciones por terreno difícil y puedes encontrar comida y agua para el grupo.

*   **Ocupación: Faber (Arquetipo: Artesano)**
    *   **Beneficios:** Base de Aguante 8; +1 a **Ingenio**.
    *   **Habilidades:** Umbral de Competencia 5 en Ingenio para construir fortificaciones o reparar equipo; puedes identificar debilidades estructurales.
    *   **Especialización (Creador) -> Maestro Armero:** Puedes forjar armas y armaduras de calidad excepcional (+1 Daño o +1 Protección).
    *   **Especialización (Destructor) -> Ingeniero de Asedio:** Ganas la habilidad de construir y operar armas de asedio como catapultas y balistas.

---

### **8.2 Ambientación: Fantasía Oscura ("Low Fantasy")**

#### **8.2.1 Ocupaciones y Especializaciones**

*   **Ocupación: Cazador de Monstruos (Arquetipo: Guerrero)**
    *   **Beneficios:** Base de Aguante 8; +1 a **Vigor**.
    *   **Habilidades:** Umbral de Competencia 5 en Percepción para rastrear criaturas no humanas; Umbral de Competencia 5 en Erudición sobre las debilidades de los monstruos.
    *   **Especialización (Ejecutor) -> Exterminador:** Elige un tipo de monstruo (muertos vivientes, bestias, etc.). Contra ellos, tu daño aumenta en +2.
    *   **Especialización (Artesano) -> Alquimista:** Puedes crear y usar aceites para armas, pociones y bombas simples.

*   **Ocupación: Brujo de Setos (Arquetipo: Místico)**
    *   **Beneficios:** Base de Aguante 4; +1 a **Alma**.
    *   **Habilidades:** Puedes realizar pequeños hechizos a cambio de recibir daño; Umbral de Competencia 5 para sentir la presencia de espíritus.
    *   **Especialización (Adivinación) -> Augur:** Puedes leer augurios para obtener visiones crípticas del futuro.
    *   **Especialización (Invocación) -> Conjurador:** Puedes invocar espíritus menores para que te ayuden con tareas simples.

*   **Ocupación: Erudito Prohibido (Arquetipo: Experto)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Erudición**.
    *   **Habilidades:** Umbral de Competencia 5 en Erudición sobre temas arcanos y ocultos; Umbral de Competencia 5 en Voluntad para resistir la locura.
    *   **Especialización (Conocimiento) -> Demonólogo:** Ganas conocimiento sobre los nombres verdaderos y las debilidades de los demonios.
    *   **Especialización (Poder) -> Historiador Arcano:** Aprendes rituales que te permiten hablar con los muertos o ver ecos del pasado.

*   **Ocupación: Charlatán (Arquetipo: Diplomático)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Carisma**.
    *   **Habilidades:** Umbral de Competencia 5 en Carisma para engañar y estafar; puedes crear identidades falsas convincentes.
    *   **Especialización (Manipulación) -> Maestro del Disfraz:** Tus disfraces son casi perfectos, engañando incluso a aquellos que te conocen.
    *   **Especialización (Inspiración) -> Líder de Culto:** Puedes usar tu carisma para atraer seguidores y crear un pequeño culto a tu alrededor.

*   **Ocupación: Ladrón de Tumbas (Arquetipo: Explorador)**
    *   **Beneficios:** Base de Aguante 8; +1 a **Agilidad**.
    *   **Habilidades:** Umbral de Competencia 5 en Agilidad para desactivar trampas y para el sigilo en interiores.
    *   **Especialización (Infiltrado) -> Saqueador de Ruinas:** Ganas un sexto sentido para detectar la presencia de trampas mágicas.
    *   **Especialización (Supervivencia) -> Espeleólogo:** Eres un experto en navegar por cuevas y subterráneos, nunca te pierdes bajo tierra.

*   **Ocupación: Médico de Plagas (Arquetipo: Artesano)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Ingenio**.
    *   **Habilidades:** Umbral de Competencia 5 en Ingenio para tratar heridas y enfermedades; puedes identificar venenos.
    *   **Especialización (Creador) -> Cirujano:** Puedes realizar cirugías complejas para curar Heridas Graves.
    *   **Especialización (Destructor) -> Toxicólogo:** Ganas la habilidad de crear y aplicar venenos potentes y enfermedades.

---

### **8.3 Ambientación: Guerra Fría (Espionaje Realista)**

#### **8.3.1 Ocupaciones y Especializaciones**

*   **Ocupación: Soldado de Operaciones Especiales (Arquetipo: Guerrero)**
    *   **Beneficios:** Base de Aguante 10; +1 a **Vigor**.
    *   **Habilidades:** Umbral de Competencia 5 con armas de fuego modernas; Umbral de Competencia 5 en tácticas de pequeñas unidades.
    *   **Especialización (Ejecutor) -> Experto en Demoliciones:** Ganas la habilidad de usar y desactivar explosivos de grado militar.
    *   **Especialización (Protector) -> Médico de Combate:** Puedes realizar primeros auxilios bajo fuego enemigo para estabilizar a tus compañeros.

*   **Ocupación: Psíquico del Proyecto MKUltra (Arquetipo: Místico)**
    *   **Beneficios:** Base de Aguante 4; +1 a **Alma**.
    *   **Habilidades:** Puedes intentar leer pensamientos superficiales con una tirada de Alma; puedes sentir emociones fuertes en otros.
    *   **Especialización (Adivinación) -> Visión Remota:** Puedes intentar ver un lugar distante que conozcas, percibiendo imágenes y sonidos.
    *   **Especialización (Manipulación) -> Telepáta:** Puedes implantar sugestiones simples en la mente de un objetivo con una tirada enfrentada de Alma contra Voluntad.

*   **Ocupación: Analista de Inteligencia (Arquetipo: Experto)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Ingenio**.
    *   **Habilidades:** Umbral de Competencia 5 en Ingenio para análisis de datos y criptografía; puedes crear perfiles psicológicos precisos.
    *   **Especialización (Conocimiento) -> Criptógrafo:** Ganas un Umbral de Competencia 6 para romper códigos y cifrados.
    *   **Especialización (Manipulación) -> Maestro de la Desinformación:** Eres un experto en crear y difundir información falsa para engañar al enemigo.

*   **Ocupación: Diplomático (Arquetipo: Diplomático)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Carisma**.
    *   **Habilidades:** Umbral de Competencia 5 en Carisma para la negociación y el protocolo; tienes inmunidad diplomática (limitada).
    *   **Especialización (Inspiración) -> Agregado Cultural:** Eres un experto en ganarte la confianza de dignatarios extranjeros a través del respeto a su cultura.
    *   **Especialización (Intriga) -> Reclutador de Agentes:** Ganas la habilidad de identificar y reclutar potenciales informantes o agentes dobles.

*   **Ocupación: Espía de Campo (Arquetipo: Explorador)**
    *   **Beneficios:** Base de Aguante 8; +1 a **Agilidad**.
    *   **Habilidades:** Umbral de Competencia 5 en Agilidad para el sigilo y la infiltración; puedes usar objetos cotidianos como armas.
    *   **Especialización (Infiltrado) -> Ladrón de Secretos:** Ganas un Umbral de Competencia 6 para abrir cajas fuertes y cerraduras complejas.
    *   **Especialización (Eliminador) -> Sicario:** Si atacas a un objetivo desprevenido, puedes duplicar el daño. Si fallas, quedas expuesto.

*   **Ocupación: Intendente ("Q") (Arquetipo: Artesano)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Ingenio**.
    *   **Habilidades:** Umbral de Competencia 5 en Ingenio para modificar y crear gadgets de espionaje; puedes identificar tecnología oculta.
    *   **Especialización (Creador) -> Inventor:** Puedes crear prototipos de gadgets ùnicos y experimentales.
    *   **Especialización (Destructor) -> Técnico de Contramedidas:** Eres un experto en detectar y desactivar dispositivos de vigilancia enemigos.

---

### **8.4 Ambientación: Ciencia Ficción ("Space Opera")**

#### **8.4.1 Ocupaciones y Especializaciones**

*   **Ocupación: Marine Espacial (Arquetipo: Guerrero)**
    *   **Beneficios:** Base de Aguante 10; +1 a **Fuerza**.
    *   **Habilidades:** Umbral de Competencia 5 con armas de energía; Umbral de Competencia 5 para el combate en gravedad cero.
    *   **Especialización (Ejecutor) -> Soldado de Asalto:** Ganas la habilidad de usar armaduras de combate pesadas sin penalización.
    *   **Especialización (Protector) -> Médico de Flota:** Puedes usar un medkit para curar Heridas Graves con una tirada de Ingenio.

*   **Ocupación: Psíquico (Arquetipo: Místico)**
    *   **Beneficios:** Base de Aguante 4; +1 a **Alma**.
    *   **Habilidades:** Puedes mover objetos pequeños con la mente (telequinesis); puedes sentir la presencia de otras mentes.
    *   **Especialización (Adivinación) -> Precognitivo:** Recibes destellos del futuro inmediato, lo que te permite añadir +2 a tus tiradas de defensa de Esquivar.
    *   **Especialización (Invocación) -> Biota:** Puedes comunicarte y calmar a la fauna alienígena (xeno-fauna).

*   **Ocupación: Científico de Xenotecnología (Arquetipo: Experto)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Erudición**.
    *   **Habilidades:** Umbral de Competencia 5 en Erudición sobre biología y tecnología alienígena; puedes intentar activar artefactos alienígenas.
    *   **Especialización (Conocimiento) -> Xenolinguista:** Ganas la habilidad de descifrar y aprender rápidamente idiomas alienígenas.
    *   **Especialización (Poder) -> Adaptacionista:** Puedes usar tecnología alienígena para crear aumentos temporales para ti o tus aliados.

*   **Ocupación: Embajador Galáctico (Arquetipo: Diplomático)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Carisma**.
    *   **Habilidades:** Umbral de Competencia 5 en Carisma para la negociación con especies no humanas; conoces los protocolos de la Federación.
    *   **Especialización (Inspiración) -> Pacificador:** Puedes proyectar un aura de calma, imponiendo una Maldición Menor a todos los que intenten iniciar la violencia en tu presencia.
    *   **Especialización (Intriga) -> Agente de la Alianza:** Eres un agente encubierto de la Alianza Rebelde, con acceso a sus recursos y contactos.

*   **Ocupación: Contrabandista (Arquetipo: Explorador)**
    *   **Beneficios:** Base de Aguante 8; +1 a **Agilidad**.
    *   **Habilidades:** Umbral de Competencia 5 en Agilidad para el pilotaje de naves ligeras; Umbral de Competencia 5 en Carisma para el regateo.
    *   **Especialización (Infiltrado) -> Corredor de Bloqueos:** Eres un experto en evitar patrullas y sensores para llegar a sistemas restringidos.
    *   **Especialización (Supervivencia) -> Pionero:** Ganas un Umbral de Competencia 6 para la supervivencia en planetas inhóspitos.

*   **Ocupación: Mecánico de Naves (Arquetipo: Artesano)**
    *   **Beneficios:** Base de Aguante 8; +1 a **Ingenio**.
    *   **Habilidades:** Umbral de Competencia 5 en Ingenio para reparaciones bajo presión; puedes diagnosticar problemas complejos en una máquina.
    *   **Especialización (Creador) -> Ingeniero Jefe:** Puedes forzar el motor de una nave para que funcione al 200% de su capacidad durante una escena.
    *   **Especialización (Destructor) -> Saboteador:** Puedes crear una sobrecarga en cascada para que un fallo se extienda a sistemas adyacentes.

---

### **8.5 Ambientación: Fantasía Épica ("High Fantasy")**

#### **8.5.1 Ocupaciones y Especializaciones**

*   **Ocupación: Campeón del Reino (Arquetipo: Guerrero)**
    *   **Beneficios:** Base de Aguante 12; +1 a **Fuerza**.
    *   **Habilidades:** Umbral de Competencia 5 con armas a dos manos; puedes realizar un ataque de barrido para golpear a dos enemigos adyacentes.
    *   **Especialización (Ejecutor) -> Matadragones:** Ganas un +2 de daño contra criaturas grandes (dragones, gigantes, etc.).
    *   **Especialización (Protector) -> Guardián Real:** Cuando un aliado cercano es atacado, puedes usar tu reacción para imponer una Maldición Menor a la tirada del atacante.

*   **Ocupación: Archimago (Arquetipo: Místico)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Alma**.
    *   **Habilidades:** Umbral de Competencia 5 en Alma para lanzar hechizos arcanos; puedes manipular los elementos a pequeña escala.
    *   **Especialización (Poder) -> Elementalismo:** Elige un elemento (fuego, hielo, rayo). Tus hechizos de ese elemento infligen +2 de daño.
    *   **Especialización (Invocación) -> Maestro de la Invocación:** Puedes invocar elementales y otras criaturas mágicas para que luchen a tu lado.

*   **Ocupación: Sabio de la Torre (Arquetipo: Experto)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Erudición**.
    *   **Habilidades:** Umbral de Competencia 5 en Erudición sobre historia, magia y genealogía; puedes identificar cualquier artefacto mágico.
    *   **Especialización (Conocimiento) -> Guardián del Saber:** Tienes acceso a una biblioteca legendaria donde puedes encontrar la respuesta a casi cualquier pregunta.
    *   **Especialización (Poder) -> Runista:** Ganas la habilidad de inscribir runas mágicas en armas y armaduras para otorgarles propiedades temporales.

*   **Ocupación: Paladín (Arquetipo: Diplomático)**
    *   **Beneficios:** Base de Aguante 10; +1 a **Carisma**.
    *   **Habilidades:** Aura de Coraje (Umbral 4 contra el miedo para aliados); puedes gastar Aguante para añadir daño radiante a tus ataques.
    *   **Especialización (Protector) -> Guardián del Juramento:** Puedes usar tu reacción para convertirte en el objetivo de un ataque dirigido a un aliado.
    *   **Especialización (Ejecutor) -> Vengador Sagrado:** Puedes marcar a un enemigo como tu objetivo de venganza, ganando una Bendición Mayor en todos tus ataques contra él.

*   **Ocupación: Ranger de los Páramos (Arquetipo: Explorador)**
    *   **Beneficios:** Base de Aguante 8; +1 a **Percepción**.
    *   **Habilidades:** Umbral de Competencia 5 con arcos; tienes un compañero animal que te ayuda.
    *   **Especialización (Supervivencia) -> Señor de las Bestias:** Tu compañero animal se vuelve más fuerte y puede realizar acciones de combate complejas.
    *   **Especialización (Eliminador) -> Cazador Silencioso:** Si atacas desde el sigilo con un arco, el objetivo no sabe de dónde vino el ataque, incluso si aciertas.

*   **Ocupación: Forjador de Artefactos (Arquetipo: Artesano)**
    *   **Beneficios:** Base de Aguante 8; +1 a **Ingenio**.
    *   **Habilidades:** Umbral de Competencia 5 en Ingenio para la forja y la alquimia; puedes imbuir objetos con magia menor.
    *   **Especialización (Creador) -> Maestro Artifice:** Puedes crear objetos mágicos permanentes (requiere tiempo, recursos y una tirada difícil).
    *   **Especialización (Destructor) -> Desencantador:** Ganas la habilidad de desmantelar objetos mágicos para extraer sus esencias o destruir artefactos malditos.

---

### **8.6 Ambientación: Ciberpunk**

#### **8.6.1 Ocupaciones y Especializaciones**

*   **Ocupación: Samurai Callejero (Arquetipo: Guerrero)**
    *   **Beneficios:** Base de Aguante 10; +1 a **Agilidad**.
    *   **Habilidades:** Umbral de Competencia 5 con espadas (monofilamento o térmicas); tienes reflejos aumentados que te dan +1 a la defensa de Esquivar.
    *   **Especialización (Ejecutor) -> Mercenario Solitario:** Cuando luchas solo contra más de un oponente, ganas una acción de movimiento adicional.
    *   **Especialización (Protector) -> Guardaespaldas:** Puedes usar tu cuerpo para interceptar un ataque dirigido a un cliente que estés protegiendo.

*   **Ocupación: Chamán Urbano (Arquetipo: Místico)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Alma**.
    *   **Habilidades:** Puedes "leer" la resonancia de los datos de la ciudad para obtener pistas; puedes invocar "espíritus de la ciudad" (IA menores) para que te ayuden.
    *   **Especialización (Adivinación) -> Oráculo de Datos:** Puedes interpretar el flujo de datos para predecir eventos futuros, como caídas del mercado o rutas de patrullas.
    *   **Especialización (Invocación) -> Titiritero Digital:** Puedes hacer que la tecnología simple (semáforos, puertas automáticas) se comporte de forma errática.

*   **Ocupación: Netrunner (Arquetipo: Experto)**
    *   **Beneficios:** Base de Aguante 4; +1 a **Ingenio**.
    *   **Habilidades:** Puedes conectar tu mente a la red; Umbral de Competencia 5 para superar sistemas de seguridad (Hielo).
    *   **Especialización (Infiltrado) -> Fantasma en la Máquina:** Los programas de seguridad tienen una Maldición Mayor para detectarte.
    *   **Especialización (Destructor) -> Virus Andante:** Puedes crear y subir virus que colapsan sistemas enteros.

*   **Ocupación: Fixer (Arquetipo: Diplomático)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Carisma**.
    *   **Habilidades:** Umbral de Competencia 5 en Carisma para la negociación y el chantaje; tienes una amplia red de contactos.
    *   **Especialización (Intriga) -> Traficante de Información:** Eres un maestro en comprar y vender secretos. Siempre sabes quién pagaría más por una información.
    *   **Especialización (Inspiración) -> Organizador Comunitario:** Puedes movilizar a la gente de un barrio para una protesta, una defensa o una celebración.

*   **Ocupación: Infiltrado Corporativo (Arquetipo: Explorador)**
    *   **Beneficios:** Base de Aguante 8; +1 a **Percepción**.
    *   **Habilidades:** Umbral de Competencia 5 en Agilidad para el sigilo en entornos urbanos y corporativos; Umbral de Competencia 5 en Ingenio para la ingeniería social.
    *   **Especialización (Infiltrado) -> Ladrón de Identidades:** Puedes robar y usar las credenciales de seguridad de alguien para acceder a sistemas y lugares restringidos.
    *   **Especialización (Supervivencia) -> Rata Callejera:** Eres un experto en sobrevivir en los bajos fondos, siempre encuentras un lugar seguro para esconderte o un contacto que te deba un favor.

*   **Ocupación: Matasanos (Ripperdoc) (Arquetipo: Artesano)**
    *   **Beneficios:** Base de Aguante 6; +1 a **Ingenio**.
    *   **Habilidades:** Umbral de Competencia 5 en Ingenio para instalar, reparar y quitar ciberimplantes; tienes una clínica ilegal.
    *   **Especialización (Creador) -> Neurocirujano:** Puedes realizar cirugías cerebrales para instalar ciberware craneal o para reparar daño neurológico.
    *   **Especialización (Destructor) -> Saboteador de Cromo:** Sabes cómo hacer que los implantes de un enemigo fallen o se sobrecarguen con una tirada de Ingenio en combate cuerpo a cuerpo.

