# 🗣️ Situación 05: Habilidades Sociales

> **Objetivo:** Testear el sistema fuera del combate
> **Reglas a validar:** Facetas sociales, Devoción en social, escala de éxito

---

## Escenario A: Negociación con el Señor Local

### Contexto
Los héroes necesitan acceso a las tierras del Señor Damodred. Pueden intentar diplomacia, intimidación, o engaño.

### Setup

**Señor Damodred (NPC)**
```
Disposición inicial: Neutral (0)
Voluntad: 4 (resistencia a manipulación)
Percepción: 3 (detectar mentiras)
Intereses: Proteger sus tierras, ganar prestigio, evitar conflictos
Secreto: Tiene tratos con contrabandistas
```

**Sistema de Disposición:**
```
-3: Hostil (atacará o expulsará)
-2: Muy negativo (rechaza todo)
-1: Negativo (desconfiado)
 0: Neutral (escucha pero no ayuda)
+1: Positivo (dispuesto a negociar)
+2: Muy positivo (ofrece ayuda limitada)
+3: Amistoso (ayuda activamente)
```

### Aproximación 1: Diplomacia (Carisma)

**Moiraine intenta:**
```
Moiraine: "Mi señor, venimos en nombre de la Torre Blanca..."

Tirada: Carisma + Diplomacia vs Voluntad del Señor
Moiraine: d12 + Carisma(4) + Diplomacia(+2) = d12 + 6
Señor: Voluntad 4 → Dificultad 10 (4 + 6 base)

Resultados posibles:
- Éxito por 6+: Disposición +2, impresionado
- Éxito por 1-5: Disposición +1, escucha
- Fallo por 1-5: Sin cambio, desinteresado
- Fallo por 6+: Disposición -1, ofendido

Escala del Destino:
- Bendición: El señor recuerda un favor de la Torre
- Maldición: El señor odia a las Aes Sedai por un incidente pasado
- Giro: Revelación inesperada (el secreto sale a la luz)
```

### Aproximación 2: Intimidación (Fuerza/Carisma)

**Lan intenta:**
```
Lan: *muestra la espada* "Sería... desafortunado si no cooperara."

Tirada: Carisma/Fuerza + Intimidación vs Voluntad
Lan: d12 + Carisma(2) + Intimidación(+1) = d12 + 3
Alternativa: d12 + Fuerza(4) + Intimidación(+1) = d12 + 5
Señor: Voluntad 4 → Dificultad 10

Resultados:
- Éxito: Disposición +1, pero recuerda la amenaza
- Fallo: Disposición -2, llamará a los guardias
- Giro del Destino: El señor es un veterano de guerra, no se intimida
```

### Aproximación 3: Engaño (Carisma + Percepción)

**Mat intenta:**
```
Mat: "Somos comerciantes buscando nueva ruta. Pagaremos impuestos..."

Tirada: Carisma + Engaño vs Percepción del Señor
Mat: d12 + Carisma(3) + Engaño(+2) = d12 + 5
Señor: d12 + Percepción(3) = d12 + 3

Si Mat gana:
- El señor cree la mentira
- Disposición basada en la mentira

Si Señor gana:
- Detecta la mentira
- Disposición -2, desconfía de todo
```

### Mecánica: Negociación Extendida

Si la conversación tiene varias fases:

```
FASE 1: Primera Impresión
  → Tirada de Carisma pura
  → Establece disposición inicial modificada

FASE 2: Presentar Caso
  → Tirada de Persuasión/Diplomacia
  → Argumento principal

FASE 3: Contraargumentos
  → El NPC presenta objeciones
  → PJs deben responder (nuevas tiradas)

FASE 4: Resolución
  → Disposición final determina resultado
  → +3: Obtienen todo
  → +2: Obtienen la mayor parte
  → +1: Compromiso
  → 0 o menos: Fracaso
```

### Uso de Devoción en Social

**Invocación de Potencia:**
```
Moiraine invoca su Potencia (La Torre Blanca):
"Por la autoridad de la Torre..."

Gasta 1 Devoción:
  → Intervención Menor: +2 a la tirada
  
Gasta 3 Devoción:
  → Intervención Mayor: El Señor DEBE escuchar y considerar
```

---

## Escenario B: Interrogatorio

### Contexto
Los héroes han capturado a un espía. Necesitan información.

### Setup

**Espía Capturado**
```
Voluntad: 3 (resistencia)
Lealtad: Alta (no traicionará fácilmente)
Miedos: Tortura, familia amenazada
Secreto: Ubicación del campamento enemigo
```

### Aproximaciones

**Bueno (Empatía):**
```
"Entendemos tu situación. Si cooperas, podemos proteger a tu familia..."

Tirada: Empatía + Persuasión vs Voluntad + Lealtad (5)
Beneficio: Si funciona, el espía coopera voluntariamente
Riesgo: Bajo, pero puede fallar
```

**Malo (Intimidación):**
```
"Tenemos formas de hacerte hablar..."

Tirada: Intimidación vs Voluntad
Beneficio: Más probable éxito inmediato
Riesgo: Información puede ser falsa, consecuencias morales
```

**Neutro (Ingenio):**
```
"Sabemos que trabajas para [nombre incorrecto]... oh, ¿no es así?"

Tirada: Ingenio + Engaño vs Percepción
Beneficio: Saca información sin presión directa
Riesgo: El espía puede darse cuenta del truco
```

### Consecuencias del Giro del Destino

| Giro | Efecto |
|------|--------|
| Dados iguales + Éxito | El espía revela MÁS de lo esperado |
| Dados iguales + Fallo | El espía tiene información falsa plantada |

---

## Escenario C: Discurso a las Tropas

### Contexto
Antes de una batalla, el líder del grupo debe motivar a los soldados aliados.

### Setup

**Tropas Aliadas**
```
Moral base: 4/10 (baja, han perdido batallas)
Número: 50 soldados
Líder respetado: +2 bonus si el PJ tiene reputación
```

### Mecánica: Inspiración Masiva

```
Tirada: Carisma + Liderazgo vs Dificultad 12 (tropas desmoralizadas)

Resultados:
- Éxito por 6+: Moral +3, tropas luchan con fervor
- Éxito por 1-5: Moral +2, tropas motivadas
- Fallo por 1-5: Moral +1, efecto mínimo
- Fallo por 6+: Moral -1, discurso contraproducente

Escala del Destino:
- Bendición Mayor: +4 Moral, las tropas te seguirán al infierno
- Maldición Mayor: -2 Moral, algunos desertores
```

### Modificadores

| Situación | Modificador |
|-----------|-------------|
| Victoria reciente | +2 |
| Derrota reciente | -2 |
| PJ herido/sangrando | +1 (muestra coraje) |
| PJ desconocido | -2 |
| PJ es noble/realeza | +2 |
| Usa Devoción (Potencia de Guerra) | +3 |

---

## Escenario D: Seducción/Romance

### Contexto
Un PJ intenta iniciar una relación romántica con un NPC.

### Nota de Diseño
Este sistema debe manejarse con respeto. El NPC tiene agencia y puede rechazar sin importar las tiradas.

### Mecánica

```
Fase 1: Atracción Inicial
  Carisma + Seducción vs Voluntad del NPC
  Solo determina si hay interés, no consentimiento

Fase 2: Cortejar
  Múltiples interacciones positivas
  Cada éxito aumenta disposición

Fase 3: Relación
  Si disposición llega a +3, el NPC puede corresponder
  El DJ decide según la narrativa

Límites:
- Nunca se puede "forzar" una relación con tiradas
- El NPC siempre puede decir no
- Las consecuencias de fallos son rechazo cortés, no humillación
```

---

## Guía: Facetas Sociales

| Faceta | Uso Principal | Ejemplos |
|--------|---------------|----------|
| **Carisma** | Impresionar, liderar | Discursos, primera impresión |
| **Empatía** | Entender, conectar | Consuelo, detectar emociones |
| **Voluntad** | Resistir, intimidar | Interrogatorio, aguantar presión |

### Competencias Sociales

| Competencia | Descripción |
|-------------|-------------|
| **Diplomacia** | Negociación formal, protocolo |
| **Persuasión** | Convencer, argumentar |
| **Engaño** | Mentir, disfrazar intenciones |
| **Intimidación** | Amenazar, presionar |
| **Seducción** | Atraer, encantar |
| **Liderazgo** | Motivar grupos, dar órdenes |
| **Etiqueta** | Normas sociales, cortesía |

---

## Registro de Pruebas

| Escenario | Éxito? | Turnos | Devoción usada | Notas |
|-----------|--------|--------|----------------|-------|
| A: Negociación | | | | |
| B: Interrogatorio | | | | |
| C: Discurso | | | | |
| D: Romance | | | | |

---

*Las palabras pueden ser tan poderosas como las espadas.*
