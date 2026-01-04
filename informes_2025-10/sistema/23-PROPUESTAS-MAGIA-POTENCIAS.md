# ✨ Propuestas de Mejora: Magia y Potencias

## 1. Diagnóstico del Sistema Mágico Actual

### 1.1 Estructura de Dos Niveles

| Nivel | Propósito | Estado |
|-------|-----------|--------|
| **Magia de Combate** | Acciones rápidas, como armas | ✅ Bien definido |
| **Magia Poderosa** | Efectos dramáticos, con coste | ⚠️ Necesita más detalle |

### 1.2 Tres Modelos

| Modelo | Ejemplo | Recurso | Estado |
|--------|---------|---------|--------|
| **Académico** | Harry Potter | Sin fatiga, componentes | ✅ Documentado |
| **Organizacional** | Rueda del Tiempo | Fatiga | ✅ Documentado |
| **Profesional** | Warcraft | Mana | ⚠️ Menos detallado |

### 1.3 Áreas de Mejora Identificadas

1. **Falta de ejemplos concretos** de hechizos por modelo
2. **Balance magia vs combate físico** no verificado
3. **Progresión mágica** poco clara
4. **Interacción con Dado de Destino** no especificada

---

## 2. Propuesta: Hechizos como Cartas

### 2.1 Concepto

Cada hechizo es una "Carta de Hechizo" que funciona como las cartas de equipo pero para magos.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ESTRUCTURA DE CARTA DE HECHIZO                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   NOMBRE: [Nombre evocador]                                             │
│   NIVEL: [1-5]                                                          │
│   ESCUELA: [Evocación/Abjuración/Transmutación/etc.]                    │
│   TIEMPO: [Acción/Ritual X turnos]                                      │
│   COSTE: [Fatiga/Mana/Componentes]                                      │
│   DIFICULTAD: [6/9/12/15]                                               │
│   EFECTO: [Descripción mecánica]                                        │
│   DESTINO: [Cómo afecta el Dado de Destino]                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Ejemplo: Magia Académica (Estilo HP)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROYECTIL ARCANO                                           Nivel 1     │
├─────────────────────────────────────────────────────────────────────────┤
│  Escuela: Evocación                                                      │
│  Tiempo: Acción                                                          │
│  Coste: Ninguno (básico)                                                 │
│  Dificultad: 9                                                           │
│                                                                          │
│  EFECTO: Dispara un dardo de energía. Daño 2, alcance 20m.              │
│                                                                          │
│  DESTINO:                                                                │
│  • Bendición: +1 daño adicional                                         │
│  • Maldición: El hechizo deja un rastro visible                         │
│  • Giro: El proyectil rebota en algo inesperado                         │
├─────────────────────────────────────────────────────────────────────────┤
│  "La magia más simple, pero nunca subestimes su utilidad."              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  ESCUDO ARCANO                                              Nivel 2     │
├─────────────────────────────────────────────────────────────────────────┤
│  Escuela: Abjuración                                                     │
│  Tiempo: Reacción                                                        │
│  Coste: 1 Fatiga                                                         │
│  Dificultad: 9                                                           │
│                                                                          │
│  EFECTO: Crea un escudo mágico. +3 Protección hasta tu próximo turno.   │
│                                                                          │
│  DESTINO:                                                                │
│  • Bendición: El escudo dura 1 turno extra                              │
│  • Maldición: El escudo parpadea, solo +2 Protección                    │
│  • Giro: El escudo refleja el ataque al atacante                        │
├─────────────────────────────────────────────────────────────────────────┤
│  "Un mago prudente siempre tiene lista su defensa."                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  BOLA DE FUEGO                                              Nivel 3     │
├─────────────────────────────────────────────────────────────────────────┤
│  Escuela: Evocación                                                      │
│  Tiempo: Acción                                                          │
│  Coste: 2 Fatiga + Componente (azufre)                                  │
│  Dificultad: 12                                                          │
│                                                                          │
│  EFECTO: Explosión de 5m de radio. Daño 4 a todos en el área.           │
│          Los objetivos pueden tirar Agilidad vs 12 para mitad daño.     │
│                                                                          │
│  DESTINO:                                                                │
│  • Bendición: +2 daño, fuego persistente (1 daño/turno por 2 turnos)    │
│  • Maldición: Radio reducido a 3m, o te quemas levemente (-1 daño)      │
│  • Giro: El fuego cobra vida propia momentáneamente                     │
├─────────────────────────────────────────────────────────────────────────┤
│  "El fuego no distingue entre amigos y enemigos."                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Catálogo Mínimo Propuesto

**Por Escuela (5 hechizos cada una):**

| Escuela | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 | Nivel 5 |
|---------|---------|---------|---------|---------|---------|
| **Evocación** | Proyectil | Rayo | Bola de Fuego | Tormenta | Desintegrar |
| **Abjuración** | Escudo | Barrera | Disipar | Inmunidad | Prisión |
| **Transmutación** | Luz | Alterar Forma | Volar | Petrificar | Cambiar Realidad |
| **Adivinación** | Detectar | Ver Invisible | Clarividencia | Predecir | Omnisciencia |
| **Ilusión** | Sonido | Imagen | Invisibilidad | Escena | Realidad Ilusoria |
| **Encantamiento** | Calmar | Sugestión | Dominar | Geasa | Voluntad Absoluta |
| **Nigromancia** | Hablar Muertos | Drenar | Animar | Resucitar | Inmortalidad |
| **Conjuración** | Invocar Objeto | Invocar Criatura | Portal | Mansión | Plano |

---

## 3. Propuesta: Fatiga Mágica Refinada

### 3.1 Sistema Base

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE FATIGA MÁGICA                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   FATIGA MÁXIMA = Voluntad + Alma + Nivel de Sello                      │
│                                                                          │
│   Ejemplo (Místico Sello Iniciado):                                     │
│   Voluntad 2 + Alma 3 + Sello 1 = 6 Fatiga                              │
│                                                                          │
│   COSTES:                                                                │
│   ─────────                                                              │
│   Hechizo Nivel 1: 0-1 Fatiga                                           │
│   Hechizo Nivel 2: 1-2 Fatiga                                           │
│   Hechizo Nivel 3: 2-3 Fatiga                                           │
│   Hechizo Nivel 4: 3-4 Fatiga                                           │
│   Hechizo Nivel 5: 4-5 Fatiga                                           │
│                                                                          │
│   RECUPERACIÓN:                                                          │
│   ─────────────                                                          │
│   Descanso corto (10 min): +1 Fatiga                                    │
│   Descanso largo (1 hora): +Voluntad Fatiga                             │
│   Sueño completo (8 horas): Recuperación total                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Sobreesfuerzo

```
Si no tienes suficiente Fatiga pero quieres lanzar:

1. Puedes usar AGUANTE como Fatiga (1:1)
2. O tirar Voluntad vs 12:
   • Éxito: Lanzas con -2 al efecto
   • Fallo: Fallas y pierdes 1d6 Aguante
   • Giro Oscuro: Fallas y algo terrible ocurre
```

---

## 4. Propuesta: Rituales (Magia Poderosa)

### 4.1 Estructura de Ritual

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ESTRUCTURA DE RITUAL                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   REQUISITOS:                                                            │
│   • Tiempo de preparación (minutos a horas)                             │
│   • Componentes materiales (consumidos o no)                            │
│   • Condiciones especiales (lugar, momento, participantes)              │
│   • Múltiples tiradas de progreso                                       │
│                                                                          │
│   MECÁNICA:                                                              │
│   1. Preparar componentes y condiciones                                 │
│   2. Tirar Alma + Especialización vs Dificultad del Ritual              │
│   3. Acumular "Éxitos" necesarios (típicamente 3-5)                     │
│   4. Cada fallo añade una "Complicación"                                │
│   5. 3 Complicaciones = Ritual falla                                    │
│                                                                          │
│   DADO DE DESTINO EN RITUALES:                                          │
│   • Gran Bendición: +2 Éxitos                                           │
│   • Bendición: +1 Éxito                                                 │
│   • Maldición: +1 Complicación                                          │
│   • Gran Maldición: +2 Complicaciones                                   │
│   • Giro: Algo inesperado se manifiesta                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Ejemplos de Rituales

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RITUAL DE SANACIÓN MAYOR                                   Nivel 3     │
├─────────────────────────────────────────────────────────────────────────┤
│  Tiempo: 1 hora                                                          │
│  Componentes: Hierbas sagradas (consumidas), agua bendita               │
│  Condiciones: Lugar limpio, paciente inmóvil                            │
│  Dificultad: 12                                                          │
│  Éxitos necesarios: 3                                                    │
│                                                                          │
│  EFECTO: Restaura todo el Aguante del objetivo y cura una herida grave. │
├─────────────────────────────────────────────────────────────────────────┤
│  COMPLICACIONES POSIBLES:                                                │
│  1. El paciente queda exhausto (-2 a todo por 1 día)                    │
│  2. Las hierbas no eran puras, efecto reducido a la mitad               │
│  3. La curación deja una cicatriz mágica visible                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  CÍRCULO DE PROTECCIÓN                                      Nivel 4     │
├─────────────────────────────────────────────────────────────────────────┤
│  Tiempo: 4 horas                                                         │
│  Componentes: Sal marina, plata en polvo (5 monedas), sangre propia     │
│  Condiciones: Dibujar círculo de 3m, luna visible                       │
│  Dificultad: 15                                                          │
│  Éxitos necesarios: 5                                                    │
│                                                                          │
│  EFECTO: Crea una barrera impenetrable para criaturas sobrenaturales    │
│          durante 24 horas. Nadie puede entrar ni salir sin permiso.     │
├─────────────────────────────────────────────────────────────────────────┤
│  COMPLICACIONES POSIBLES:                                                │
│  1. El círculo tiene un punto débil (50% de ser encontrado)             │
│  2. La barrera es visible, alertando a enemigos                         │
│  3. Algo quedó atrapado dentro sin querer                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Propuesta: Sistema de Potencias Expandido

### 5.1 Estructura Actual

```
POTENCIA
├── Concepto (en qué crees)
├── Intervenciones (efectos especiales)
└── Devoción (3 puntos, ganas/pierdes)
```

### 5.2 Propuesta: Potencias con Progresión

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE POTENCIAS EXPANDIDO                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   CADA POTENCIA TIENE:                                                   │
│   ──────────────────────                                                 │
│   • Dominio: Área de influencia (Guerra, Justicia, Naturaleza, etc.)    │
│   • Principios: 3 mandatos que debes seguir                             │
│   • Dones (Nivel 1-3): Habilidades pasivas desbloqueables              │
│   • Intervenciones (Menor/Mayor): Efectos activos                       │
│   • Favor: 0-10 puntos de relación con la Potencia                      │
│                                                                          │
│   FAVOR:                                                                 │
│   ──────                                                                 │
│   0-2:   Abandonado (no puedes usar intervenciones mayores)             │
│   3-5:   Normal (acceso básico)                                         │
│   6-8:   Favorecido (+1 a tiradas relacionadas con el Dominio)          │
│   9-10:  Elegido (Dones gratis, intervenciones a mitad de coste)        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Ejemplo: Potencia de Marte (Dios de la Guerra)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FAVOR DE MARTE                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DOMINIO: Guerra, Victoria, Valentía                                     │
│                                                                          │
│  PRINCIPIOS:                                                             │
│  1. Nunca huyas de un combate justo                                     │
│  2. Honra a los enemigos dignos                                         │
│  3. Protege a los débiles con tu fuerza                                 │
│                                                                          │
│  DONES:                                                                  │
│  Nivel 1 - Instinto de Batalla: +1 Iniciativa                           │
│  Nivel 2 - Resistencia Marcial: +2 Aguante máximo                       │
│  Nivel 3 - Furia de Marte: Una vez/día, +3 daño por un combate          │
│                                                                          │
│  INTERVENCIONES:                                                         │
│  Menor (1 Devoción):                                                     │
│  • Repetir una tirada de combate                                        │
│  • Intimidar automáticamente a un enemigo de menor rango                │
│                                                                          │
│  Mayor (3 Devoción):                                                     │
│  • Inspiración de las Águilas: Aliados en 10m ganan +2 ataque 3 turnos  │
│  • Golpe Divino: Un ataque exitoso hace daño x2                         │
│                                                                          │
│  GANAR FAVOR:                                                            │
│  +1: Victoria en combate contra enemigo superior                        │
│  +1: Mostrar misericordia a un enemigo honorable                        │
│  +2: Defender a inocentes contra fuerzas abrumadoras                    │
│                                                                          │
│  PERDER FAVOR:                                                           │
│  -1: Huir de un combate                                                 │
│  -2: Atacar a un enemigo desarmado/rendido                              │
│  -3: Traicionar a tus compañeros de armas                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Catálogo de Potencias Propuesto

| Potencia | Dominio | Principio Central |
|----------|---------|-------------------|
| **Gloria de Roma** | Imperio, Civilización | Servir al bien común |
| **Marte** | Guerra, Victoria | Combate honorable |
| **Minerva** | Sabiduría, Estrategia | Pensar antes de actuar |
| **Mercurio** | Viajes, Comercio | La libertad es sagrada |
| **Diana** | Caza, Naturaleza | Proteger lo salvaje |
| **Vesta** | Hogar, Familia | Los lazos son sagrados |
| **Neptuno** | Mar, Tormentas | Respetar el poder del mar |
| **Plutón** | Muerte, Riqueza | Todo tiene un precio |
| **La Justicia** | Ley, Equidad | Nadie está sobre la ley |
| **La Libertad** | Independencia | Las cadenas deben romperse |
| **El Honor** | Reputación, Palabra | Tu palabra es tu vida |
| **La Familia** | Sangre, Lealtad | Los tuyos primero |

---

## 6. Propuesta: Magia Universal (Sin Modelo Específico)

### 6.1 Sistema Simplificado

Para ambientaciones donde no quieres elegir modelo:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MAGIA UNIVERSAL SIMPLIFICADA                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   TIRADA DE MAGIA: Alma + Canalización + Especialización vs Dificultad  │
│                                                                          │
│   EFECTOS BÁSICOS (sin coste):                                          │
│   • Proyectil mágico: Daño 2, alcance 15m                               │
│   • Escudo menor: +1 Protección 1 turno                                 │
│   • Luz: Ilumina 10m, 1 hora                                            │
│   • Empujón: Mueve objeto/persona pequeña 3m                            │
│                                                                          │
│   EFECTOS AVANZADOS (1 Fatiga):                                         │
│   • Daño aumentado: +2 a cualquier hechizo de daño                      │
│   • Área: Afecta a todos en 3m                                          │
│   • Duración: Efecto dura 10 minutos en lugar de instantáneo            │
│   • Alcance: Duplica el alcance                                         │
│                                                                          │
│   EFECTOS PODEROSOS (2+ Fatiga + componentes):                          │
│   • Volar, invisibilidad, curación mayor, etc.                          │
│   • Requieren ritual o preparación                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Resumen de Propuestas

| Propuesta | Objetivo | Complejidad | Prioridad |
|-----------|----------|-------------|-----------|
| **Hechizos como Cartas** | Consistencia con sistema | Baja | ⭐⭐⭐⭐⭐ |
| **Catálogo de Hechizos** | Contenido jugable | Media | ⭐⭐⭐⭐⭐ |
| **Fatiga Refinada** | Balance mago vs guerrero | Baja | ⭐⭐⭐⭐ |
| **Sistema de Rituales** | Magia poderosa mecánica | Media | ⭐⭐⭐⭐ |
| **Potencias con Progresión** | Profundidad narrativa | Media | ⭐⭐⭐⭐ |
| **Catálogo de Potencias** | Contenido jugable | Media | ⭐⭐⭐⭐ |
| **Magia Universal** | Simplicidad opcional | Baja | ⭐⭐⭐ |

---

## 8. Implementación Recomendada

### Fase 1: Estructura
1. ✅ Definir formato de Carta de Hechizo
2. ✅ Definir formato de Potencia expandida

### Fase 2: Contenido Base
3. ✅ Crear 5 hechizos por escuela (35 hechizos)
4. ✅ Crear 6 potencias completas → **36 POTENCIAS YA DOCUMENTADAS** (ver abajo)

### Fase 3: Expansión
5. 📋 Añadir 10 rituales
6. 📋 Crear guía de creación de hechizos custom
7. 📋 Balancear vs combate físico con playtesting

---

## 9. Contenido Adicional del Catálogo Manus

### 9.1 Sistema Equipo/Conjuro (Harry Potter)

> **Fuente:** `25-CATALOGO-IDEAS-MANUS.md`, sección 6.8

**Concepto:** Los hechizos funcionan exactamente como armas:

| Conjuro | Daño | Equivalente |
|---------|------|-------------|
| Expelliarmus | 1 | Desarme no letal |
| Stupefy | 2 | Ataque básico |
| Confringo | 3 | Ataque ofensivo |
| Sectumsempra | 4 | Ataque potente |
| Avada Kedavra | Muerte | Ataque letal único |

**Restricción de Magos:**
- ✅ Varitas: Competente
- ✅ Armas Pequeñas: Competente (dagas, bastones)
- ❌ Armas Grandes: Incompetente

**Regla Clave:** Sin varita = solo ataques físicos (daño 1)

---

### 9.2 Las 36 Potencias Documentadas (6 Ambientaciones)

> **Fuente:** `25-CATALOGO-IDEAS-MANUS.md`, sección 6.9

#### Antigüedad Histórica
| Potencia | Intervención Mayor |
|----------|-------------------|
| Júpiter Óptimo Máximo | Ira del Cielo (intimidar a todos) |
| El Estoicismo | Mente Inquebrantable (ignorar heridas) |
| La República | La Voz del Pueblo (incitar multitud) |
| El Culto de Mitra | Lazo de Sangre (transferir PA) |
| La Furia de Marte | Frenesí de Batalla (+Vigor a daño) |
| La Fortuna | Giro del Azar (repetir tirada ajena) |

#### Fantasía Oscura
| Potencia | Intervención Mayor |
|----------|-------------------|
| La Llama Sagrada | Santuario de Luz |
| El Bosque Primigenio | Abrazo de Raíces |
| El Pacto Olvidado | Susurro de la Verdad |
| El Juramento de Venganza | Ojo por Ojo |
| El Hogar | Escudo Humano |
| El Destino Inexorable | Sacrificio al Mañana |

#### Guerra Fría / Espionaje
| Potencia | Intervención Mayor |
|----------|-------------------|
| El Comunismo | Héroe del Pueblo |
| El Capitalismo | Llamada al Patrocinador |
| El Profesionalismo | Limpieza de Escena |
| La Conspiración | Vi los Hilos |
| La Causa Justa | Corazón Inocente |
| El Proyecto Atómico | Salto de Inspiración |

#### Ciencia Ficción
| Potencia | Intervención Mayor |
|----------|-------------------|
| La Federación Unida | Protocolo de la Flota |
| El Imperio K'tharr | Derecho de Conquista |
| Gremio de Contrabandistas | Contacto en Puerto |
| La Singularidad (IA) | Mano de la Máquina |
| El Flujo | Armonía |
| Megacorporación OmniCorp | Activos Corporativos |

#### Fantasía Épica
| Potencia | Intervención Mayor |
|----------|-------------------|
| Dios del Sol | Juicio del Sol |
| Diosa de la Luna | Manto de la Noche |
| El Dragón Primordial | Sabiduría Antigua |
| El Rey Brujo | Toque de la Tumba |
| Rosa Azul | Gesta Heroica |
| El Caos Primordial | Tormenta de Caos |

#### Ciberpunk
| Potencia | Intervención Mayor |
|----------|-------------------|
| Corporación Arasaka | Equipo de Respuesta |
| La Red (IA Salvaje) | Deus ex Machina |
| Samurai Callejero | Reputación en la Calle |
| La Anarquía | Momento de Caos |
| El Transhumanismo | Forzar el Límite |
| El Fantasma en la Máquina | Guía Espectral |

---

### 9.3 Fichas de Personajes Icónicos (Ejemplos)

> **Fuente:** `26-DRAMATIZACION.md`, escenas 9-14

#### Moiraine Damodred (La Rueda del Tiempo)
- **Potencia:** El Patrón
- **Intervención Mayor:** Corrección del Hilo - Forzar repetir tirada de cualquier personaje

#### Hermione Granger (Harry Potter)
- **Potencia:** El Conocimiento
- **Intervención Mayor:** Revelación Súbita - Declarar dato crucial que el DJ debe incorporar

#### Jaina Proudmoore (Warcraft)
- **Potencia:** La Alianza
- **Intervención Mayor:** Llamada a las Armas - Contingente de soldados aparece

#### Thrall (Warcraft)
- **Potencia:** La Horda
- **Intervención Mayor:** Furia de la Horda - Todos los aliados ganan Destino Favorable

---

### 9.4 Dramatización: Egwene vs Trolloc (Combate Mágico)

> **Fuente:** `26-DRAMATIZACION.md`, escena 8

**Resumen:** Una novicia nivel 1 contra un Trolloc demuestra el sistema de combate mágico.

**Lecciones:**
1. La armadura del Trolloc (2) redujo daño mágico de Bola de Fuego (2) a solo 1
2. Una mística nivel 1 con PA 8 es muy frágil
3. El sistema funciona pero necesita ajustes (¿magia ignora armadura parcial?)

**Recomendación:** Considerar que la magia ignore 1 punto de armadura (penetración mágica).

---

*La magia debe sentirse poderosa pero equilibrada con otras formas de resolver problemas.*
