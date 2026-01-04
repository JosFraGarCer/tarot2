# ⚔️ Situación 01: Duelos 1v1

> **Objetivo:** Testear balance entre arquetipos de combate
> **Reglas a validar:** Talentos, Daño Escalado, Heridas, Golpe de Gracia

---

## Escenario A: Guerrero vs Guerrero (Nivel Parejo)

### Setup

**Lan (Guerrero Veterano - Sello Viaje)**
```
Arcano Físico:  Fuerza 4, Agilidad 3, Vigor 4
Arcano Mental:  Ingenio 2, Percepción 3, Voluntad 3
Arcano Espiritual: Carisma 2, Empatía 2, Alma 2

PA: 12 (Vigor 4 × 3)
Protección: 3 (armadura de cuero + cota)
Competencias: Espadas +2, Esquivar +1
Talentos: 
  - Combate Principal: Espadas (+2)
  - Combate Secundario: Arcos (+1)
  - Combate Terciario: Lucha (+0)
Daño espada: 3
```

**Trolloc (Guerrero Brutal - Nivel equivalente)**
```
Arcano Físico:  Fuerza 5, Agilidad 2, Vigor 5
Arcano Mental:  Ingenio 1, Percepción 2, Voluntad 2
Arcano Espiritual: Carisma 1, Empatía 0, Alma 1

PA: 15 (Vigor 5 × 3)
Protección: 2 (piel gruesa)
Competencias: Hachas +1
Talentos:
  - Combate Principal: Hachas (+2)
Daño hacha: 4
```

### Simulación Esperada

**Turno 1:**
```
Lan ataca (Iniciativa Heroica):
  d12 + Fuerza(4) + Espadas(+2) + Talento(+2) = d12 + 8
  vs Trolloc Defensa: d12 + Agilidad(2) + Esquivar(0) = d12 + 2
  
  Diferencia de mods: +6 a favor de Lan
  Resultado probable: Lan impacta con margen
  
Trolloc contraataca:
  d12 + Fuerza(5) + Hachas(+1) + Talento(+2) = d12 + 8
  vs Lan Defensa: d12 + Agilidad(3) + Esquivar(+1) = d12 + 4
  
  Diferencia de mods: +4 a favor de Trolloc
  Resultado probable: Puede impactar
```

**Análisis:**
- Lan tiene mejor defensa y técnica
- Trolloc tiene más PA y daño bruto
- Debería durar 5-8 turnos

### Métricas a Registrar

| Métrica | Esperado | Real |
|---------|----------|------|
| Turnos totales | 5-8 | ___ |
| Tiradas totales | 10-16 | ___ |
| ¿Golpe de Gracia? | Sí | ___ |
| ¿Giro del Destino? | 0-1 | ___ |

---

## Escenario B: Guerrero vs Ladrón (Estilos distintos)

### Setup

**Guerrero de la Guardia (Sello Iniciado)**
```
Físico: Fuerza 3, Agilidad 2, Vigor 3
PA: 9 | Protección: 3
Competencias: Espadas +1, Escudos +1
Talentos: Espadas (+2), Escudos (+1)
Daño espada: 3
```

**Ladrón de Caminos (Sello Iniciado)**
```
Físico: Fuerza 2, Agilidad 4, Vigor 2
PA: 6 | Protección: 1 (cuero ligero)
Competencias: Dagas +2, Esquivar +2
Talentos: Dagas (+2), Sigilo (+1)
Daño daga: 2
Habilidad especial: "Golpe Sucio" - 1/combate actúa primero
```

### Qué Testea

1. **¿El ladrón puede sobrevivir?**
   - Menos PA pero mejor esquiva
   - Debe usar movilidad

2. **¿"Golpe Sucio" es útil?**
   - ¿Cambia el resultado del combate?

3. **¿El guerrero es demasiado tanque?**
   - Protección 3 vs Daño 2 = casi inmune

### Predicción

El ladrón debería poder ganar si:
- Usa "Golpe Sucio" para ventaja inicial
- Acumula heridas en el guerrero para penalizadores
- Evita intercambio directo

---

## Escenario C: Novato vs Veterano (Desnivel)

### Setup

**Aprendiz (Sello Iniciado, recién creado)**
```
Físico: Fuerza 2, Agilidad 2, Vigor 2
PA: 6 | Protección: 1
Competencias: Espadas +0
Talentos: Ninguno de combate
Daño espada: 2
```

**Veterano (Sello Héroe)**
```
Físico: Fuerza 4, Agilidad 4, Vigor 4
PA: 12 | Protección: 3
Competencias: Espadas +3
Talentos: Espadas (+2), Arcos (+1), Lucha (+0)
Daño espada: 3 + Talento bonus
```

### Qué Testea: Defensa Pasiva

**Diferencia:** ~3 niveles → El aprendiz debería usar Defensa Pasiva

```
Veterano ataca:
  d12 + Fuerza(4) + Espadas(+3) + Talento(+2) = d12 + 9
  vs Aprendiz Defensa PASIVA: 6 + Agilidad(2) + 0 = 8
  
  Veterano necesita sacar 0+ en d12 para impactar (automático)
  Margen esperado: +7 → Daño bonus +3
```

**Resultado esperado:** 
- El veterano aplasta al novato en 2-3 turnos
- El novato apenas puede rozar al veterano
- Esto es CORRECTO narrativamente

---

## Escenario D: Arquero vs Guerrero Cuerpo a Cuerpo

### Setup

**Arquero (Sello Viaje)**
```
Físico: Fuerza 2, Agilidad 4, Vigor 2
PA: 6 | Protección: 1
Competencias: Arcos +3, Esquivar +1
Talentos: Arcos (+2)
Daño arco: 3
Distancia inicial: 30 metros
```

**Guerrero con Escudo (Sello Viaje)**
```
Físico: Fuerza 4, Agilidad 2, Vigor 4
PA: 12 | Protección: 4 (armadura + escudo)
Competencias: Espadas +2, Escudos +2
Talentos: Espadas (+2), Escudos (+1)
Daño espada: 3
Movimiento: 10 metros/turno
```

### Qué Testea

1. **¿El arquero puede matar antes de que llegue?**
   - 3 turnos para cerrar distancia
   - ¿3 flechas son suficientes?

2. **¿La protección alta es demasiado?**
   - Daño 3 vs Protección 4 = 0-1 daño por flecha

3. **¿Debería el arquero tener otra opción?**
   - Disparos apuntados (turno extra, +daño)
   - Flechas especiales

### Predicción

Con reglas actuales, el guerrero gana casi siempre:
- 4 protección anula el arco
- El arquero no puede huir infinitamente

**Posible ajuste:** 
- Arcos ignoran 1 punto de armadura
- Disparo apuntado: 2 turnos, daño ×1.5

---

## Registro de Pruebas

| Escenario | Fecha | Resultado | Turnos | Notas |
|-----------|-------|-----------|--------|-------|
| A: Guerrero vs Guerrero | | | | |
| B: Guerrero vs Ladrón | | | | |
| C: Novato vs Veterano | | | | |
| D: Arquero vs Guerrero | | | | |

---

*Cada duelo revela fortalezas y debilidades del sistema.*
