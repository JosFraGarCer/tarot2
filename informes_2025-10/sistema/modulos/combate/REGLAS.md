# ⚔️ Reglas de Combate

> **Estado:** 🔄 EN PRUEBAS
> **Versión:** 0.3.0
> **Incluye:** Reglas estables + propuestas recomendadas

---

## 1. Estructura del Combate

### Fases de un Asalto

```
1. DECLARACIÓN
   → El DJ describe la situación
   → Los jugadores declaran intenciones

2. FASE DE HÉROES (si Iniciativa Heroica)
   → Los PJs actúan en el orden que prefieran
   → Resuelven sus acciones

3. FASE DE ENEMIGOS
   → Los NPCs actúan
   → El DJ resuelve sus acciones

4. FASE DE CIERRE
   → Efectos de fin de turno
   → Actualizar estados
```

### Acciones Disponibles

| Tipo | Descripción |
|------|-------------|
| **Acción** | Atacar, lanzar hechizo, usar habilidad |
| **Movimiento** | Desplazarse (10m típico) |
| **Acción Menor** | Hablar, sacar arma, mirar |
| **Reacción** | Respuesta a acción enemiga (1/asalto) |

---

## 2. Iniciativa

### Opción A: Tirada de Iniciativa (Clásica)

```
Cada combatiente: d12 + Agilidad + Percepción
Mayor resultado actúa primero
Empates: PJs antes que NPCs
```

### Opción B: Iniciativa Heroica 🔄 [EN PRUEBAS]

```
Por defecto: Los PJs actúan primero (Fase de Héroes)
             Deciden el orden entre ellos

Excepciones:
- Emboscada enemiga: Enemigos primero 1 turno
- Sorpresa mutua: Tirada de iniciativa
- Giro del Destino: Puede alterar orden
```

---

## 3. Ataque y Defensa

### Tirada de Ataque

```
Ataque = d12 + Faceta + Competencia + Modificadores

Facetas típicas:
- Melee: Fuerza
- Ranged: Agilidad
- Magia: Voluntad o Alma
```

### Tirada de Defensa

#### Opción A: Ambos Tiran (Estándar)

```
Defensor tira: d12 + Agilidad + Esquivar
Si Ataque > Defensa: Impacto
Margen = Ataque - Defensa
```

#### Opción B: Defensa Pasiva 🔄 [EN PRUEBAS]

```
Si Atacante tiene ≥3 niveles sobre Defensor:
  → Defensor NO tira
  → Defensa = 6 + Agilidad + Competencia + Armadura
  
Reduce tiradas ~50% en combates desequilibrados
```

---

## 4. Daño

### Cálculo de Daño

```
Daño = Daño Base del Arma + Bonus - Protección

Bonus:
- Margen cada 3: +1 daño (si Daño Escalado activo)
- Talento: +1 si arma es principal
```

### Tabla de Armas

| Arma | Daño | Tipo | Notas |
|------|------|------|-------|
| Daga | 2 | Melee | Ligera, ocultable |
| Espada | 3 | Melee | Versátil |
| Espada a dos manos | 4 | Melee | -1 defensa |
| Hacha grande | 4 | Melee | Pesada |
| Arco | 3 | Ranged | Rango 30m |
| Ballesta | 4 | Ranged | Recarga 1 turno |

### Protección

| Armadura | Protección | Penalizador |
|----------|------------|-------------|
| Ninguna | 0 | - |
| Cuero | 1 | - |
| Cuero reforzado | 2 | - |
| Cota de malla | 3 | -1 Agilidad |
| Armadura completa | 4 | -2 Agilidad |
| Escudo | +1 | Ocupa mano |

---

## 5. Heridas y Estados

### Puntos de Aguante (PA)

```
PA Base = Vigor × 3
```

### Estados de Herida

| PA Restante | Estado | Penalizador |
|-------------|--------|-------------|
| 100-76% | Ileso | - |
| 75-51% | Herido | -1 a todo |
| 50-26% | Malherido | -2 a todo |
| 25-1% | Crítico | -3 a todo |
| 0 | Derrotado | Fuera de combate |

### Golpe de Gracia ✅ [CONFIRMADO]

```
Si un personaje llega a 0 PA:
- NPCs menores: Mueren o quedan fuera
- NPCs importantes: Agonizando (1-2 turnos)
- PJs: Agonizando, pueden ser salvados
```

---

## 6. Talentos de Combate 🔄 [EN PRUEBAS]

### Sistema 3/2/1

```
Cada personaje tiene talentos de combate:
- Principal: +2 a ataques con esa arma
- Secundario: +1 a ataques
- Terciario: +0 (competente pero no destacado)
```

### Ejemplo

```
Lan:
- Principal: Espadas (+2)
- Secundario: Arcos (+1)
- Terciario: Lucha (+0)
```

---

## 7. Acciones Especiales

### Ataque Total

```
Bonus: +2 al ataque
Penalizador: -2 a defensa hasta tu próximo turno
```

### Defensa Total

```
Bonus: +2 a defensa
Penalizador: No puedes atacar este turno
```

### Apuntar (Ranged)

```
Gastar 1 turno apuntando
Próximo disparo: +2 al ataque
```

### Carga

```
Movimiento doble + ataque
Bonus: +2 daño
Penalizador: -1 defensa
```

---

## 8. Combate de Masas

### Horda (Muchos Débiles)

```
Si enemigos son ≥3 niveles inferiores:
- Usar Defensa Pasiva
- Agrupar en unidades
- Simplificar tiradas
```

### Jefe (Uno Poderoso)

```
Jefes tienen:
- Más PA
- Múltiples acciones
- Habilidades especiales
- Posibles fases
```

---

## Resumen de Propuestas en Pruebas

| ID | Propuesta | Efecto |
|----|-----------|--------|
| COM-01 | Defensa Pasiva | Menos tiradas vs débiles |
| COM-02 | Iniciativa Heroica | PJs primero, más coordinación |
| COM-03 | Talentos 3/2/1 | Especialización de combate |
| COM-04 | Daño Escalado | +1 daño por cada 3 de margen |

---

*Este documento incluye reglas estables y propuestas marcadas. Validar con situaciones de prueba.*
