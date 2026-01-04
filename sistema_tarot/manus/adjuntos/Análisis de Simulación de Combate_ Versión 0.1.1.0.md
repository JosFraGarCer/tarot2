# Análisis de Simulación de Combate: Versión 0.1.1.0

**Autor:** Manus AI  
**Fecha:** 28 de septiembre de 2025

## 1. Introducción

Este informe presenta los resultados y el análisis de 1000 simulaciones de combate realizadas con las reglas del sistema "Proyecto Tarot" (versión 0.1.1.0). El objetivo de esta prueba era evaluar el equilibrio y la duración de los enfrentamientos bajo las reglas actuales, utilizando un escenario base de un luchador de Sello de Iniciado contra un oponente idéntico.

Los parámetros de la simulación fueron los siguientes:

| Característica | Valor | Justificación |
| :--- | :--- | :--- |
| **Puntos de Aguante** | 11 | Base (10) + Vigor (1) |
| **Tirada de Ataque** | 1d12 + 3 | d12 + Fuerza (3) |
| **Dificultad** | 12 | "Difícil" para combate activo |
| **Daño por Golpe** | 1 | Daño de Espada (3) - Protección de Cota de Malla (2) |
| **Probabilidad de Impacto** | 33.3% | Se necesita un 9+ en el d12 para impactar |

## 2. Análisis de Resultados

Los resultados de las 1000 simulaciones ofrecen una visión clara del comportamiento del sistema de combate en su estado actual. A continuación se presentan los hallazgos clave, respaldados por las visualizaciones de datos generadas.

### 2.1. Equilibrio del Combate

El sistema demuestra un **excelente equilibrio estadístico**. Como se puede observar en el gráfico de "Equilibrio de Combate", la distribución de victorias es casi perfecta, con un 51.2% para el PJ y un 48.8% para el NPC. La ligera ventaja del PJ es atribuible a la regla de iniciativa que le permite actuar primero, lo cual es un resultado esperado y deseable.

![Distribución de Victorias](https://private-us-east-1.manuscdn.com/sessionFile/NGjcYQjtS83p1NUSUiPSpx/sandbox/GWtDLHOeo6UkesErHMCEfB-images_1759075984923_na1fn_L2hvbWUvdWJ1bnR1L2Rpc3RyaWJ1Y2lvbl92aWN0b3JpYXM.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvTkdqY1lRanRTODNwMU5VU1VpUFNweC9zYW5kYm94L0dXdERMSE9lbzZVa2VzRXJITUNFZkItaW1hZ2VzXzE3NTkwNzU5ODQ5MjNfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwyUnBjM1J5YVdKMVkybHZibDkyYVdOMGIzSnBZWE0ucG5nIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=l4JbFk6juchFa~7z2BmLffxnah3Vq-SwBXQ4F-Fw7IA2P~JnXSZUsBoGyG5DnfUGSKjFlPK9o9~ZsEo0VNkhnNbwUCPDj-8c4xlKzPB5jTJaR6QBSRjEx5-cucS0VeCeWzDd98hGgCsfm1qRO0ySbXN~FboaG537cxUY5iwoGFBonUVVAkcHaxbdLMxCX3wRPpGt33kjii-fYI8l7PU~9GjgLb8KLVNakVDVk39lkoE6N6YBHcYt80DS90m9PZqeoCgNtgPoaNX5DI1fKZjuAhoh3Qwt-7gEz2RzPeUG7W9BLw0ZKP4jw6WVLjiOWIKcxp1Re97xhXajxzONAHP55g__)

Este resultado confirma que, en un enfrentamiento entre oponentes de igual capacidad, el sistema no favorece injustamente a ninguno de los dos bandos. No se registraron empates, lo que indica que los combates son decisivos.

### 2.2. Duración del Combate

El principal problema identificado a través de la simulación es la **excesiva duración de los combates**. Los datos son concluyentes en este aspecto:

- **Duración Promedio:** 28.4 turnos
- **Duración Mediana:** 28 turnos
- **Rango de Duración:** Mínimo de 13 turnos y máximo de 53 turnos.

![Distribución de Duración](https://private-us-east-1.manuscdn.com/sessionFile/NGjcYQjtS83p1NUSUiPSpx/sandbox/GWtDLHOeo6UkesErHMCEfB-images_1759075984926_na1fn_L2hvbWUvdWJ1bnR1L2Rpc3RyaWJ1Y2lvbl9kdXJhY2lvbg.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvTkdqY1lRanRTODNwMU5VU1VpUFNweC9zYW5kYm94L0dXdERMSE9lbzZVa2VzRXJITUNFZkItaW1hZ2VzXzE3NTkwNzU5ODQ5MjZfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwyUnBjM1J5YVdKMVkybHZibDlrZFhKaFkybHZiZy5wbmciLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=pPbbHf9dLR~1KMY9VREeNOhFJrSoqt3MMP0O1FY72HVgrOkhNLL1ZJ4GFLT9E9qv1-PTayAM67SIwajCrWXmIzFMHaHwq0L9uzk6rG9KwWHBAibAloHu50-ZJ7klFxnoFBKhjYn6GOHFGrsL28hS0ubWBeCMrzFF6Pu4ZervhrhKjTRBLYZBCMrnFDMfOH49IeDvl5v085Xqh7-v0YGov1cbRoAqhBMcKO4n0sk8qkTEtWFxUmt0mrkpIDRBnFmtVwirCbY8-uBlJghmzLssqDZ3oPg~3vBStbu97DEbRqaMggWhRyLP8mm4BAl~CyKmIqSrmPe5QcPL9I189K0EFw__)

Como muestra el gráfico de distribución, **más del 93% de los combates duraron más de 20 turnos**, y la gran mayoría (60.3%) se concentró en el rango de 21 a 30 turnos. Una duración tan elevada para un combate básico entre dos oponentes es inviable en una sesión de juego de rol de mesa, ya que consumiría una cantidad desproporcionada de tiempo y podría volverse monótono.

## 3. Diagnóstico del Problema

La causa fundamental de la excesiva duración de los combates es una combinación de dos factores interrelacionados:

1.  **Baja Probabilidad de Impacto (33.3%):** Los personajes solo aciertan, en promedio, uno de cada tres ataques. Esto significa que hay muchos turnos en los que no ocurre nada, prolongando el enfrentamiento sin añadir tensión.
2.  **Bajo Daño por Golpe (1 punto):** Cuando un ataque finalmente impacta, solo inflige 1 punto de daño a un personaje con 11 Puntos de Aguante. Esto significa que se necesitan **11 impactos exitosos** para derrotar a un oponente.

La combinación de estos dos factores crea un sistema donde los combatientes intercambian golpes fallidos durante muchos turnos, y los pocos golpes que aciertan apenas reducen la capacidad de combate del oponente. Esto conduce a una guerra de desgaste lenta y poco emocionante.

## 4. Recomendaciones para la Próxima Iteración

El objetivo es reducir drásticamente la duración de los combates sin sacrificar el excelente equilibrio estadístico ya logrado. Para ello, es necesario aumentar el "rendimiento" de cada turno de combate. Se proponen las siguientes vías de experimentación, que pueden aplicarse de forma individual o combinada.

### Propuesta A: Aumentar la Probabilidad de Impacto

La forma más directa de aumentar la frecuencia de los impactos es reducir la dificultad base del ataque.

- **Cambio Sugerido:** Reducir la Dificultad de ataque de "Difícil" (12) a **"Moderado" (9)**.
- **Impacto Teórico:**
    - La tirada necesaria para impactar sería 9 - 3 (Fuerza) = **6+ en el d12**.
    - La nueva probabilidad de impacto sería de 7/12, es decir, **~58.3%** (en lugar del 33.3% actual).
- **Ventaja:** Los combates serían más dinámicos, con más acciones exitosas en cada turno.

### Propuesta B: Aumentar el Daño por Golpe

Otra opción es hacer que cada impacto sea más significativo, aumentando el daño infligido.

- **Cambio Sugerido:** Aumentar el daño base de la Espada de 3 a **4**.
- **Impacto Teórico:**
    - El daño por golpe sería 4 (daño de arma) - 2 (protección) = **2 puntos**.
    - Esto reduciría a la mitad el número de impactos necesarios para derrotar a un oponente (de 11 a 6).
- **Ventaja:** Mantiene la sensación de que impactar es un desafío, pero recompensa mejor el éxito.

### Propuesta C: Combinación de Ambas (Recomendado)

Una solución híbrida podría ser la más efectiva, ya que permitiría un ajuste más fino del sistema.

- **Cambio Sugerido:**
    1.  Reducir la Dificultad de ataque a **10** (requiere 7+ para impactar, ~50% de probabilidad).
    2.  Aumentar el daño de la Espada a **4** (2 puntos de daño por golpe).
- **Impacto Teórico:** Se necesitarían 6 impactos para derrotar a un oponente, y la probabilidad de impactar en cada turno sería del 50%. Esto debería reducir la duración promedio del combate a un rango mucho más manejable (aproximadamente 12 turnos).

## 5. Siguientes Pasos

Se recomienda implementar una o más de las propuestas anteriores en el script de simulación y ejecutar una nueva serie de pruebas. La **Propuesta C** se considera el punto de partida más prometedor para lograr el objetivo de combates más rápidos y desafiantes.

Los resultados de la nueva simulación permitirán comparar las métricas de duración y equilibrio, y continuar iterando hasta alcanzar los valores deseados para una experiencia de juego óptima.

![Resumen Estadístico](https://private-us-east-1.manuscdn.com/sessionFile/NGjcYQjtS83p1NUSUiPSpx/sandbox/GWtDLHOeo6UkesErHMCEfB-images_1759075984928_na1fn_L2hvbWUvdWJ1bnR1L3Jlc3VtZW5fZXN0YWRpc3RpY28.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvTkdqY1lRanRTODNwMU5VU1VpUFNweC9zYW5kYm94L0dXdERMSE9lbzZVa2VzRXJITUNFZkItaW1hZ2VzXzE3NTkwNzU5ODQ5MjhfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzSmxjM1Z0Wlc1ZlpYTjBZV1JwYzNScFkyOC5wbmciLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=QfXZ4rnHBmM4aBjYBwKTg5R4TQPRV706VhBTw~MQvFMjUsql5ENKY-I2AwvN3ZH~tZFnk~JGWWdhE7C0UUO8vFzWiRed3VbURW56D03-Fej4znR4FWS2Hz3H86DwT9d0V3PRoKHNXqhvP5L6KDn2fpQroiL5-qRl8MJh~-LA~56JzOqJ4hUhtnd47W09hLzeTzEeN2h7Uw-cFeV9OY4m7KDRIHFHeOhS8G9H9asf~cwqlfzBW4J1STAf6IBeUO8SUfccJ7bJort2I4zHurwva38vKQ8DRhMZNxjNU~twbCE5iMBPIiaLyh57BV2P4YQPpHysZ91GBBqpLU5Bn6P1AA__)

