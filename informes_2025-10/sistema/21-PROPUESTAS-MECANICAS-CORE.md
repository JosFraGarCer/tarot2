# 🎲 Propuestas de Mejora: Mecánicas Core

## 1. Sistema del Dado de Destino Refinado

### 1.1 Problema Actual

El sistema actual divide el Dado de Destino en solo 3 rangos:
- 9-12: Favorable
- 5-8: Neutral  
- 1-4: Adverso

**Limitaciones:**
- Un 9 se siente igual que un 12 (ambos "Favorable")
- Un 4 se siente igual que un 1 (ambos "Adverso")
- Pierde matices narrativos

### 1.2 Propuesta: Escala de 5 Niveles

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NUEVA ESCALA DEL DESTINO                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   d12 Destino    Resultado           Efecto Narrativo                   │
│   ───────────    ─────────           ────────────────                   │
│      11-12       ⭐ Destino Dorado    Beneficio excepcional              │
│       7-10       ✅ Fortuna           Beneficio menor                    │
│       5-6        ⚪ Equilibrio        Sin efectos adicionales            │
│       3-4        ⚠️ Tribulación       Coste menor / complicación leve    │
│       1-2        💀 Destino Oscuro    Consecuencia grave                 │
│                                                                          │
│   GIRO DEL DESTINO: Dados iguales = Evento extraordinario               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Alternativa: Escala por Diferencia

Más elegante matemáticamente - usa la diferencia entre dados:

```
Balanza = d12 Habilidad - d12 Destino

| Balanza    | Resultado        | Efecto                                  |
|------------|------------------|-----------------------------------------|
| +6 o más   | Gran Bendición   | Beneficio narrativo significativo       |
| +2 a +5    | Bendición        | Pequeño beneficio adicional             |
| -1 a +1    | Equilibrio       | Resultado limpio, sin extras            |
| -5 a -2    | Maldición        | Pequeña complicación                    |
| -6 o menos | Gran Maldición   | Complicación significativa              |
| Iguales    | Giro del Destino | Evento extraordinario                   |
```

**Ventaja:** Captura la magnitud - un 12 vs 2 (+10) es muy diferente de 7 vs 6 (+1).

### 1.4 Tabla de Interpretación

| Resultado Base | + Gran Bendición | + Bendición | Equilibrio | + Maldición | + Gran Maldición |
|----------------|------------------|-------------|------------|-------------|------------------|
| **ÉXITO** | Éxito épico con bonus | Éxito con ventaja | Éxito limpio | Éxito con coste menor | Éxito pírrico |
| **FALLO** | Fallo que revela oportunidad | Fallo sin consecuencias | Fallo simple | Fallo con problema | Fallo catastrófico |

### 1.5 Ejemplos de Interpretación

**Éxito + Gran Bendición (+6 o más):**
> "Tu estocada atraviesa la defensa del bandido y lo derriba. Al caer, suelta su arma que rueda hacia tu compañero."

**Éxito + Maldición (-2 a -5):**
> "Logras forzar la cerradura, pero tus herramientas se desgastan. -1 a la próxima tirada de cerrajería."

**Fallo + Gran Maldición (-6 o menos):**
> "No solo fallas en escalar el muro, sino que caes ruidosamente alertando a los guardias. Además te tuerces el tobillo."

---

## 2. Sistema de Competencias Mejorado

### 2.1 Problema Actual

Las Competencias actuales (+1, +2, +3) son bonificadores simples que:
- No protegen contra tiradas muy bajas
- Un experto puede sacar 1 y fracasar en algo trivial
- No diferencia suficientemente novato de maestro

### 2.2 Propuesta: Umbrales de Competencia

**Concepto:** Cada nivel de Competencia garantiza un resultado mínimo en el dado.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    UMBRALES DE COMPETENCIA                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Nivel              Bonus    Umbral    Efecto                          │
│   ─────              ─────    ──────    ──────                          │
│   Sin entrenar       +0       1         Todo depende del dado           │
│   Entrenado          +1       3         Mínimo 3 en el d12              │
│   Competente         +2       5         Mínimo 5 en el d12              │
│   Excepcional        +3       6         Mínimo 6 en el d12              │
│                                                                          │
│   El Umbral reemplaza tiradas más bajas, NO se suma.                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Ejemplo Comparativo

**Situación:** Legionario (Competente en Gladius) ataca

| Sistema | d12 = 2 | d12 = 6 | d12 = 10 |
|---------|---------|---------|----------|
| **Actual** (+2) | 2+2 = 4 | 6+2 = 8 | 10+2 = 12 |
| **Umbral** (min 5, +2) | 5+2 = 7 | 6+2 = 8 | 10+2 = 12 |

**Impacto:**
- En tiradas bajas, el experto rinde mejor
- En tiradas altas, idéntico
- Reduce la volatilidad para personajes competentes

### 2.4 Alternativa: Sistema Híbrido

Mantener el bonus Y añadir umbral menor:

| Nivel | Bonus | Umbral |
|-------|-------|--------|
| Entrenado | +1 | Min 2 |
| Competente | +2 | Min 3 |
| Excepcional | +3 | Min 4 |

---

## 3. Acciones Automáticas Refinadas

### 3.1 Problema Actual

El concepto de "solo tira cuando es dramático" es bueno pero:
- Falta guía concreta de cuándo NO tirar
- Algunos DJs pueden pedir tiradas innecesarias
- No hay umbral numérico claro

### 3.2 Propuesta: Umbrales de Automatismo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CUANDO TIRAR DADOS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Total del personaje (Faceta + Competencia) comparado con Dificultad:  │
│                                                                          │
│   Modificador ≥ Dificultad + 3    →  ÉXITO AUTOMÁTICO                   │
│   Modificador ≥ Dificultad        →  Tirada con ventaja (puede fallar)  │
│   Modificador < Dificultad        →  TIRADA DE TENSIÓN normal           │
│   Modificador ≤ Dificultad - 6    →  FALLO AUTOMÁTICO (sin magia/ayuda) │
│                                                                          │
│   Excepción: Siempre tirar si hay OPOSICIÓN ACTIVA o TENSIÓN NARRATIVA  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Ejemplos

**Legionario (Fuerza 3 + Espada 2 = +5) vs Dificultades:**

| Dificultad | Tipo | Resultado |
|------------|------|-----------|
| 6 (Sencillo) | Cortar cuerdas | Automático (+5 ≥ 6+3=9 NO, pero +5 ≥ 6, tirada con ventaja) |
| 9 (Moderado) | Combate normal | Tirada de Tensión |
| 12 (Difícil) | Enemigo élite | Tirada de Tensión |
| 15 (Heroico) | Campeón legendario | Tirada (casi imposible) |

### 3.4 Tirada con Ventaja

Cuando el personaje supera la dificultad base pero no el umbral automático:

**Opción A:** Puede elegir NO tirar y tener éxito simple (sin Destino)
**Opción B:** Tira para intentar conseguir Bendición

---

## 4. Giro del Destino Refinado

### 4.1 Problema Actual

Los "Giros del Destino" (dados iguales) tienen 8.3% de probabilidad (~1/12).

En una sesión con 30-50 tiradas = 2-4 Giros, que puede ser:
- Demasiado frecuente para eventos "extraordinarios"
- Difícil de improvisar tantos giros dramáticos

### 4.2 Propuesta: Categorías de Giro

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TIPOS DE GIRO DEL DESTINO                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Dados Iguales    Tipo de Giro       Efecto                            │
│   ─────────────    ────────────       ──────                            │
│   1 = 1            Giro Oscuro        Evento negativo dramático         │
│   2-5 = 2-5        Giro Menor         Coincidencia interesante          │
│   6-7 = 6-7        Giro Neutral       Aparece un tercero / cambio       │
│   8-11 = 8-11      Giro Mayor         Oportunidad inesperada            │
│   12 = 12          Giro Épico         Intervención del destino mismo    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Tabla de Inspiración para Giros

| Tipo | Ejemplos de Giros |
|------|-------------------|
| **Giro Oscuro (1=1)** | Aparece un enemigo inesperado, el suelo cede, un aliado es capturado |
| **Giro Menor (2-5)** | Encuentras algo útil, reconoces a alguien, el clima cambia |
| **Giro Neutral (6-7)** | Un tercero aparece (¿amigo o enemigo?), una distracción |
| **Giro Mayor (8-11)** | Aliado inesperado, debilidad revelada, oportunidad perfecta |
| **Giro Épico (12=12)** | Intervención divina/sobrenatural, momento de revelación |

---

## 5. Puntos de Devoción Expandidos

### 5.1 Estado Actual

- 3 puntos máximo
- Cuesta 1 (menor) o 3 (mayor)
- Se gana/pierde por roleplay

**Limitación:** Muy pocas intervenciones por sesión (1-2 mayores)

### 5.2 Propuesta: Sistema de Devoción Ampliado

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE DEVOCIÓN EXPANDIDO                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   DEVOCIÓN MÁXIMA: 5 puntos (base 3 + 2 por progresión)                 │
│                                                                          │
│   USOS:                                                                  │
│   ─────                                                                  │
│   1 punto  → Repetir el Dado de Destino                                 │
│   1 punto  → +2 a una tirada antes de lanzar                            │
│   2 puntos → Convertir un Fallo en Éxito Parcial                        │
│   2 puntos → Activar habilidad especial de Potencia                     │
│   3 puntos → Intervención Mayor (efecto narrativo grande)               │
│   3 puntos → Negar un Giro del Destino negativo                         │
│                                                                          │
│   RECUPERACIÓN:                                                          │
│   ─────────────                                                          │
│   +1 → Al actuar según tu Potencia de forma significativa               │
│   +1 → Al inicio de cada sesión                                         │
│   +2 → Al completar un objetivo personal importante                     │
│   -1 → Al actuar contra los principios de tu Potencia                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Ejemplo de Uso Táctico

**Cayo el Legionario** (Potencia: Gloria de Roma, 4 Devoción)

1. **Turno 1:** Ataca, falla por 2. Gasta 1 punto (+2) → Éxito
2. **Turno 3:** Éxito pero Giro Oscuro. Gasta 1 punto → Repite Destino → Mejor resultado
3. **Turno 5:** Situación crítica. Gasta 2 puntos → Activa "Inspiración de las Águilas" (bonus al grupo)

**Devoción restante:** 0 → Debe actuar según Roma para recuperar

---

## 6. Resumen de Propuestas

| Propuesta | Impacto | Complejidad | Prioridad |
|-----------|---------|-------------|-----------|
| **Escala Destino 5 niveles** | Alto | Baja | ⭐⭐⭐⭐⭐ |
| **Escala por Diferencia** | Alto | Media | ⭐⭐⭐⭐⭐ |
| **Umbrales de Competencia** | Medio | Media | ⭐⭐⭐⭐ |
| **Acciones Automáticas claras** | Medio | Baja | ⭐⭐⭐⭐ |
| **Categorías de Giro** | Bajo | Baja | ⭐⭐⭐ |
| **Devoción Expandida** | Medio | Baja | ⭐⭐⭐⭐ |

---

## 7. Propuesta de Implementación

### Fase 1: Cambios Inmediatos (Sin modificar estructura)
1. ✅ Adoptar Escala de Destino por Diferencia
2. ✅ Añadir categorías de Giro del Destino
3. ✅ Documentar cuándo NO tirar dados

### Fase 2: Cambios de Playtest (Requieren pruebas)
4. 🔄 Testear Umbrales de Competencia
5. 🔄 Testear Devoción Expandida (5 puntos)

### Fase 3: Cambios Mayores (Si el playtest lo requiere)
6. 📋 Revisar dificultades base
7. 📋 Ajustar balance de Competencias

---

## 8. Dramatizaciones del Catálogo Manus

> **Fuente:** `26-DRAMATIZACION.md`, escenas 3, 4, 5

### 8.1 Escala del Destino en Acción (12 vs 11)

**Problema resuelto:** ¿Qué pasa cuando sacas 12 en Habilidad y 11 en Destino?

**Respuesta con Escala Graduada:**
- Balanza: 12 - 11 = +1 → Bendición Menor
- Interpretación: "Éxito limpio pero nada más"

```
DJ: "Tu estocada es perfecta. Sin embargo, él es increíblemente 
rápido y gira en el último instante, por lo que el golpe no es 
tan profundo como esperabas. Es un éxito limpio, pero nada más."
```

**Comparación:**

| Tirada | Balanza | Resultado |
|--------|---------|-----------|
| 12 vs 2 | +10 | Bendición Mayor - "¡Golpe devastador!" |
| 12 vs 11 | +1 | Bendición Menor - "Impacto sólido" |
| 6 vs 6 | 0 | Giro del Destino - "¡El suelo tiembla!" |

---

### 8.2 El Filósofo y el Senador (Uso No-Combativo)

**Escena:** Marcus el Filósofo intenta convencer al Senador de no aprobar la ley de guerra.

**Mecánica aplicada:**
- **Primera tirada:** Captar atención (Carisma) - Dificultad 12
- **Segunda tirada:** Convencer (Ingenio + Filosofía) - Dificultad 16 (Heroico)
- **Recurso:** Punto de Devoción a Atenea para repetir

**Resultado:**
```
DJ: "En el último momento, las palabras correctas llegan a ti. 
'Si Roma es tan fuerte, ¿por qué teme a las palabras de un griego?' 
La votación se pospone."
```

**Lección:** El sistema funciona perfectamente fuera del combate.

---

### 8.3 La Cerradura (Los 4 Cuadrantes del Giro)

> **Fuente original:** Manus1.md

| Éxito/Fallo | Habilidad > Destino | Destino > Habilidad |
|-------------|---------------------|---------------------|
| **ÉXITO** | "Abro silenciosamente" | "Abro pero la ganzúa se rompe" |
| **FALLO** | "No abro pero noto que es egipcia" | "No abro y suena el mecanismo" |

**Giro del Destino (Dados Iguales):**
> "La puerta se abre desde dentro. Una figura misteriosa te hace un gesto."

---

### 8.4 El Cazador y el Abismo (Proezas)

**Escena:** Decimus debe saltar un abismo de 5 metros con lobos persiguiéndolo.

**Clasificación:** PROEZA (más allá de capacidad normal)
- Dificultad: 15 (Heroico)
- Modificador: Agilidad +4, Acrobacia +2 = +6
- Necesita: 9+ en el dado

**Consecuencias graduadas de fallo:**
- Fallo por 1-3: Llegas pero colgando del borde
- Fallo por 4-6: Caes pero te agarras a algo
- Fallo por 7+: Caes al vacío

**Lección:** Las Proezas merecen consecuencias graduadas, no fallo binario.

---

## 9. Terminología Evocadora Propuesta

> **Fuente:** `25-CATALOGO-IDEAS-MANUS.md`

| Término Técnico | Alternativa Evocadora |
|-----------------|----------------------|
| Éxito + Bendición Mayor | **Éxito Brillante** |
| Éxito + Maldición | **Éxito con Coste** |
| Fallo + Bendición | **Fallo Revelador** |
| Fallo + Maldición Mayor | **Desastre** |
| Dados Iguales | **Giro del Destino** |

---

*Estas propuestas están diseñadas para mejorar la experiencia sin romper la elegancia del sistema 2d12 original.*
