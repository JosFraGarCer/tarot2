# 📖 Proyecto Tarot: Reglas Consolidadas

> **Versión:** 0.2.0 (Borrador)
> **Estado:** Reglas confirmadas + propuestas recomendadas
> **Licencia:** CC BY-SA 4.0

---

## Índice

1. [Filosofía del Juego](#1-filosofía-del-juego)
2. [Creación de Personaje](#2-creación-de-personaje)
3. [El Giro Tarot](#3-el-giro-tarot-resolución-de-acciones)
4. [Combate](#4-combate)
5. [Magia y Potencias](#5-magia-y-potencias)
6. [Progresión](#6-progresión)
7. [Tablas de Referencia](#7-tablas-de-referencia)

---

## 1. Filosofía del Juego

### 1.1 Los Tres Pilares

| Pilar | Significado |
|-------|-------------|
| **Narrativa Emergente** | Las historias surgen del juego, no se imponen |
| **Personajes Competentes** | Los PJs son héroes desde el inicio, no campesinos |
| **Modularidad Total** | El sistema se adapta a cualquier género |

### 1.2 Ficción Primero

> "La ficción determina qué reglas aplicar, no al revés."

- Describe lo que tu personaje intenta hacer
- El DJ determina si requiere tirada
- Las reglas dan estructura a la narrativa

---

## 2. Creación de Personaje

### 2.1 Las 5 Cartas Fundamentales

Cada personaje se define por **5 cartas** que responden preguntas clave:

| Carta | Pregunta | Ejemplo (WoT) |
|-------|----------|---------------|
| **Linaje** | ¿Qué eres? | Malkieri |
| **Entorno** | ¿Dónde creciste? | Tierras de la Plaga |
| **Trasfondo** | ¿Qué te ocurrió? | Caída de Malkier |
| **Ocupación** | ¿Qué haces? | Guardián |
| **Potencia** | ¿En qué crees? | El Deber |

Cada carta otorga:
- **Bonificador** a una Faceta (+1)
- **Habilidad Pasiva** única
- **Competencia** relacionada

### 2.2 Los 3 Arcanos y 9 Facetas

```
┌─────────────────────────────────────────────────────────────┐
│                    LOS TRES ARCANOS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   FÍSICO              MENTAL              ESPIRITUAL         │
│   ──────              ──────              ──────────         │
│   Fuerza              Ingenio             Carisma            │
│   Agilidad            Percepción          Empatía            │
│   Vigor               Voluntad            Alma               │
│                                                              │
│   Escala: 1 (Débil) → 3 (Promedio) → 5 (Excepcional)        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Distribución Inicial

| Método | Puntos | Máximo por Faceta |
|--------|--------|-------------------|
| **Estándar** | 18 puntos | 4 |
| **Heroico** | 21 puntos | 5 |

**Valor base:** Todas las Facetas empiezan en 1.

### 2.4 Competencias

Las Competencias representan entrenamiento específico.

| Nivel | Nombre | Bonus |
|-------|--------|-------|
| 0 | Sin entrenar | +0 |
| 1 | Entrenado | +1 |
| 2 | Competente | +2 |
| 3 | Experto | +3 |

**Competencias iniciales:** 3 (de tu Ocupación y cartas)

### 2.5 Cálculo de Aguante (PA)

```
Aguante = 5 + Vigor + (Bonus de Ocupación)

Ejemplos:
- Erudito: 5 + 2 + 0 = 7 PA
- Explorador: 5 + 3 + 2 = 10 PA  
- Guerrero: 5 + 4 + 3 = 12 PA
```

---

## 3. El Giro Tarot (Resolución de Acciones)

### 3.1 Cuándo Tirar

> **Regla de Oro:** Solo tira cuando el resultado es incierto Y las consecuencias importan.

| Situación | ¿Tirar? |
|-----------|---------|
| Acción rutinaria sin presión | ❌ Éxito automático |
| Acción con riesgo o tensión | ✅ Tirada |
| Imposible para el personaje | ❌ Fallo automático |

### 3.2 La Tirada Básica

```
┌─────────────────────────────────────────────────────────────┐
│                    EL GIRO TAROT                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   TIRADA = d12 (Habilidad) + Faceta + Competencia           │
│                                                              │
│   vs DIFICULTAD                                              │
│                                                              │
│   Dificultad 6   → Fácil                                    │
│   Dificultad 9   → Normal                                   │
│   Dificultad 12  → Difícil                                  │
│   Dificultad 15  → Heroico                                  │
│   Dificultad 18+ → Legendario                               │
│                                                              │
│   RESULTADO:                                                 │
│   Tirada ≥ Dificultad → ÉXITO                               │
│   Tirada < Dificultad → FALLO                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 El Dado de Destino

Simultáneamente al d12 de Habilidad, tiras un **segundo d12: el Dado de Destino**.

Este dado determina **cómo** ocurre el resultado, no si tiene éxito.

**Balanza = d12 Habilidad - d12 Destino**

| Balanza | Nombre | Efecto |
|---------|--------|--------|
| +6 o más | **Bendición Mayor** | Beneficio significativo adicional |
| +2 a +5 | **Bendición Menor** | Pequeña ventaja |
| -1 a +1 | **Equilibrio** | Resultado limpio |
| -5 a -2 | **Maldición Menor** | Pequeña complicación |
| -6 o menos | **Maldición Mayor** | Complicación significativa |
| **Iguales** | **Giro del Destino** | ¡Evento extraordinario! |

### 3.4 Los Cuatro Cuadrantes

| Resultado | Habilidad > Destino | Destino > Habilidad |
|-----------|---------------------|---------------------|
| **ÉXITO** | Éxito brillante | Éxito con coste |
| **FALLO** | Fallo revelador | Fallo desastroso |

### 3.5 El Giro del Destino

Cuando ambos dados muestran el **mismo número**, ocurre algo extraordinario:

> "No es ni bueno ni malo, es *diferente*."

El DJ introduce un giro narrativo inesperado:
- Una coincidencia imposible
- La aparición de algo/alguien
- Un cambio en las circunstancias
- Una revelación

---

## 4. Combate

### 4.1 Secuencia de Combate

```
1. INICIATIVA
   → Cada participante: d12 + Agilidad
   → Orden de mayor a menor

2. TURNOS (en orden de iniciativa)
   → Acción Principal (atacar, hechizo, maniobra)
   → Acción Menor (moverse, sacar arma, hablar)

3. RESOLUCIÓN DE ATAQUES
   → Tirada: d12 + Faceta + Competencia + Talento
   → vs Dificultad: 9 (base) o Defensa activa

4. DAÑO
   → Si éxito: Daño del arma - Protección del objetivo
   → Restar del Aguante

5. FIN DEL TURNO
   → Siguiente en iniciativa
```

### 4.2 Talentos de Armas [PROPUESTO]

| Arquetipo | Puntos de Talento | Ejemplo |
|-----------|-------------------|---------|
| **Guerrero** | 3 | Espada +2, Escudo +1 |
| **Explorador** | 2 | Arco +1, Daga +1 |
| **Erudito** | 1 | Bastón +1 |

### 4.3 Tabla de Armas

| Arma | Daño | Notas |
|------|------|-------|
| Puños | 1 | Sin arma |
| Daga | 2 | Ocultable |
| Espada | 3 | Estándar |
| Espada Grande | 4 | Dos manos |
| Arco | 3 | Alcance |
| Ballesta | 4 | Recarga lenta |

### 4.4 Tabla de Armaduras

| Armadura | Protección | Penalización |
|----------|------------|--------------|
| Sin armadura | 0 | - |
| Cuero | 1 | - |
| Cuero reforzado | 2 | - |
| Malla | 3 | -1 Agilidad |
| Placas | 4 | -2 Agilidad |

### 4.5 Estados y Condiciones

| Condición | Efecto |
|-----------|--------|
| **Aturdido** | -2 a la próxima acción |
| **Derribado** | Acción menor para levantarse |
| **Desarmado** | Solo puños (Daño 1) |
| **Herido** | A 0 PA, inconsciente |
| **Muerto** | A -5 PA o golpe de gracia |

### 4.6 Maniobras Especiales

| Maniobra | Efecto | Requisito |
|----------|--------|-----------|
| **Desarmar** | Objetivo suelta arma | Éxito por 3+ |
| **Derribar** | Objetivo cae | Fuerza vs Fuerza |
| **Fintar** | +2 próximo ataque | Ingenio vs Percepción |
| **Cargar** | +1 Daño, -1 Defensa | 5m de carrera |
| **Defensa Total** | +2 Defensa, no ataca | - |

---

## 5. Magia y Potencias

### 5.1 Sistema de Dos Niveles

| Nivel | Uso | Coste |
|-------|-----|-------|
| **Magia de Combate** | Acciones rápidas, como armas | Ninguno o 1 Fatiga |
| **Magia Poderosa** | Efectos dramáticos, rituales | 2+ Fatiga + Componentes |

### 5.2 Tirada de Magia

```
Tirada = d12 + Alma + Canalización vs Dificultad del hechizo
```

### 5.3 Hechizos de Combate (Ejemplos)

| Hechizo | Daño | Dificultad | Coste |
|---------|------|------------|-------|
| Proyectil Arcano | 2 | 9 | - |
| Rayo de Fuego | 3 | 12 | 1 Fatiga |
| Bola de Fuego | 4 (área) | 15 | 2 Fatiga |

### 5.4 Sistema Equipo/Conjuro (Harry Potter)

En ambientaciones de magos, los hechizos funcionan como armas:

| Conjuro | Daño | Equivalente |
|---------|------|-------------|
| Expelliarmus | 1 | Desarme |
| Stupefy | 2 | Aturdir |
| Confringo | 3 | Explosión |
| Sectumsempra | 4 | Cortes |
| Avada Kedavra | Muerte | - |

### 5.5 Sistema de Potencias

La Potencia es la quinta carta del personaje: representa su fe, ideal o conexión superior.

**Puntos de Devoción (PD):** 0-5

| Uso | Coste | Efecto |
|-----|-------|--------|
| **Intervención Menor** | 1 PD | Repetir el dado de Destino |
| **Intervención Mayor** | 3 PD | Habilidad única (1/sesión) |

**Ganar/Perder Devoción:**

| Acción | Efecto |
|--------|--------|
| Actuar según tus Dogmas | +1 PD |
| Inicio de sesión | +1 PD |
| Completar objetivo personal | +2 PD |
| Actuar contra tus Dogmas | -1 PD |

### 5.6 Ejemplos de Potencias

| Potencia | Intervención Mayor |
|----------|-------------------|
| **El Patrón** (WoT) | Corrección del Hilo: forzar repetir tirada |
| **El Conocimiento** (HP) | Revelación: declarar dato crucial |
| **La Horda** (Warcraft) | Furia: aliados ganan Destino Favorable |

---

## 6. Progresión

### 6.1 Puntos de Hito (PH)

Los PH se ganan por logros narrativos:

| Logro | PH |
|-------|-----|
| Sesión completada | 1 |
| Objetivo personal avanzado | 1 |
| Momento memorable | 1 |
| Objetivo de campaña cumplido | 2-3 |

### 6.2 Sellos de Poder

| Sello | PH Requeridos | Max Faceta | Alcance |
|-------|---------------|------------|---------|
| **Iniciado** | 0 | 3 | Local |
| **Viaje** | 15 | 4 | Regional |
| **Héroe** | 35 | 5 | Continental |
| **Leyenda** | 60+ | 6+ | Cósmico |

### 6.3 Costes de Mejora

| Mejora | Coste PH |
|--------|----------|
| +1 Faceta | 2 |
| +1 Competencia | 2 |
| Nueva Competencia | 3 |
| Nueva Carta Secundaria | 4 |

### 6.4 Evolución de Cartas [PROPUESTO]

Cada carta puede evolucionar a lo largo de la campaña:

| Nivel | Cuándo | Beneficio |
|-------|--------|-----------|
| **Base** | Creación | Habilidad inicial |
| **Evolucionada** | ~15 PH | +1 bonus, nueva pasiva |
| **Maestra** | ~35 PH | Habilidad épica |

---

## 7. Tablas de Referencia

### 7.1 Tabla de Dificultades

| Dificultad | Valor | Ejemplos |
|------------|-------|----------|
| Trivial | 3 | Recordar tu nombre |
| Fácil | 6 | Trepar árbol con ramas |
| Normal | 9 | Abrir cerradura simple |
| Difícil | 12 | Escalar muro liso |
| Heroico | 15 | Saltar abismo de 5m |
| Legendario | 18 | Esquivar rayo |
| Imposible | 21+ | Detener el sol |

### 7.2 Tabla de Modificadores

| Circunstancia | Modificador |
|---------------|-------------|
| Condiciones ideales | +2 |
| Herramientas adecuadas | +1 |
| Ayuda de aliado | +1 |
| Prisa/presión | -1 |
| Condiciones adversas | -2 |
| Sin herramientas necesarias | -2 |
| Herido | -1 por nivel |

### 7.3 Escala del Destino (Referencia Rápida)

```
+6 o más  = ⭐ BENDICIÓN MAYOR   "¡Golpe devastador!"
+2 a +5   = ✅ Bendición menor    "Ventaja adicional"
-1 a +1   = ⚪ Equilibrio          "Resultado limpio"
-5 a -2   = ⚠️ Maldición menor     "Pequeña complicación"
-6 o menos = 💀 MALDICIÓN MAYOR   "Desastre"
Iguales   = 🌀 GIRO DEL DESTINO  "¡Algo inesperado!"
```

### 7.4 Hoja de Personaje Resumida

```
┌─────────────────────────────────────────────────────────────┐
│  NOMBRE: _______________    SELLO: ___________              │
├─────────────────────────────────────────────────────────────┤
│  FÍSICO          MENTAL           ESPIRITUAL                │
│  Fuerza: __      Ingenio: __      Carisma: __              │
│  Agilidad: __    Percepción: __   Empatía: __              │
│  Vigor: __       Voluntad: __     Alma: __                 │
├─────────────────────────────────────────────────────────────┤
│  AGUANTE: ___/___    DEVOCIÓN: ___/5    FATIGA: ___        │
├─────────────────────────────────────────────────────────────┤
│  CARTAS                                                     │
│  Linaje: ________________    Habilidad: ___________        │
│  Entorno: _______________    Habilidad: ___________        │
│  Trasfondo: _____________    Habilidad: ___________        │
│  Ocupación: _____________    Habilidad: ___________        │
│  Potencia: ______________    Intervención: _________       │
├─────────────────────────────────────────────────────────────┤
│  COMPETENCIAS              TALENTOS                         │
│  ____________: +__         ____________: +__               │
│  ____________: +__         ____________: +__               │
│  ____________: +__         ____________: +__               │
├─────────────────────────────────────────────────────────────┤
│  EQUIPO                    NOTAS                            │
│  ________________          _____________________________   │
│  ________________          _____________________________   │
└─────────────────────────────────────────────────────────────┘
```

---

## Apéndice: Marcadores de Estado

| Marcador | Significado |
|----------|-------------|
| [CONFIRMADO] | Regla final |
| [PROPUESTO] | Recomendado, pendiente de aprobación |
| [OPCIONAL] | Módulo adicional |

---

*Proyecto Tarot © 2024 - CC BY-SA 4.0*
