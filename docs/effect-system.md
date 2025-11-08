# 🧩 **Módulo de Efectos (Effect System 2.0)**

### *TarotApp / Juego TTRPG Framework*

El módulo de **efectos** define, asocia y traduce los efectos mecánicos y narrativos que alteran estadísticas, tiradas o condiciones del juego.  
Su diseño combina dos niveles complementarios:

- **Sistema semántico:** basado en `card_effects`, `effect_type` y `effect_target`, usado por el motor de reglas.  
- **Sistema legacy/narrativo:** basado en texto libre en JSON (`effects`), usado para descripciones o compatibilidad.

---

## ⚙️ **Estructura general**

```text
effect_type ─────────────┐
                         │
effect_type_translations ┤
                         ▼
                  card_effects ───→ users
                         ▲
effect_target ───────────┘
│
└─→ effect_target_translations
````

El módulo se apoya en catálogos normalizados (`effect_type` / `effect_target`)
y en instancias aplicadas (`card_effects`) que definen cómo cada carta, habilidad o faceta aplica sus efectos.

---

## 🧠 **Capas del sistema**

| Capa                         | Propósito                                       | Entidades involucradas                         |
| ---------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| **Semántica (estructurada)** | Representación mecánica relacional y traducible | `effect_type`, `effect_target`, `card_effects` |
| **Narrativa (legacy)**       | Descripción libre en Markdown por idioma        | `effects (jsonb)` + `legacy_effects (bool)`    |

---

## 🧩 **1. Sistema Semántico**

### **Catálogo: `effect_type`**

Define los **tipos base de efecto** (bono, penalización, daño, curación, condición…).

```text
+---------------------+
|  effect_type        |
+---------------------+
| id (PK)             |
| code (UNIQUE)       | ← 'bonus.flat', 'damage.fire', ...
| category            | ← 'modifier', 'condition', 'trigger', ...
| operator            | ← 'add', 'multiply', 'replace', ...
| default_duration    | ← 'instant', 'combat', ...
| value_type          | ← 'flat', 'percent', 'dice', ...
| template            | ← '+{value} a {target}'
| metadata (JSONB)    |
| status, version_id  |
| is_active (bool)    |
+---------------------+
```

#### Traducciones (`effect_type_translations`)

```text
| id | effect_type_id | language_code | name | template | description |
```

* `template` define la plantilla de renderización (por idioma):
  `"+{value} a {target} durante {duration}"`

---

### **Catálogo: `effect_target`**

Define **a qué se puede aplicar un efecto**: ataque, defensa, daño elemental, atributo, recurso…

```text
+---------------------+
|  effect_target      |
+---------------------+
| id (PK)             |
| code (UNIQUE)       | ← 'attack.melee', 'damage.fire', ...
| scope               | ← 'self', 'enemy', 'ally', ...
| tag                 | ← 'combat', 'elemental', 'resource', ...
| metadata (JSONB)    |
| status, version_id  |
| is_active (bool)    |
| validation_state    | ← 'valid', 'warning', 'error'
+---------------------+
```

#### Traducciones (`effect_target_translations`)

```text
| id | effect_target_id | language_code | name | description |
```

---

### **Instancias aplicadas: `card_effects`**

Asocia un efecto semántico a una entidad (carta, habilidad, faceta, etc.)
Puede ser simple o compuesto (efecto padre con subefectos).

```text
+-----------------------------------+
|  card_effects                     |
+-----------------------------------+
| id (PK)                           |
| entity_type / entity_id           | ← referencia polimórfica
| parent_id                         | ← jerarquía (efecto compuesto)
| effect_group                      | ← etiqueta ('vampiric_attack')
| effect_type_id / effect_target_id | ← relación semántica
| value, formula                    | ← numérico o expresivo
| mode, duration, condition, scope  |
| metadata (JSONB)                  |
| is_stackable, max_stack, stack_group |
| validation_state                  |
| created_by, created_at            |
+-----------------------------------+
```

#### Ejemplo

```json
{
  "entity_type": "base_card",
  "entity_id": 42,
  "effect_type": "bonus.flat",
  "effect_target": "attack.melee",
  "value": 2,
  "duration": "combat",
  "scope": "self"
}
```

👉 Renderizado dinámicamente a:

> “+2 a Ataque cuerpo a cuerpo durante el combate.”

---

## 💬 **2. Sistema Legacy (Narrativo)**

Cada entidad (carta, habilidad, faceta…) puede tener un campo textual adicional para efectos narrativos o heredados.

```sql
legacy_effects bool DEFAULT false NOT NULL,
effects jsonb DEFAULT '[]'::jsonb
```

### **Formato**

```json
{
  "en": [
    "Deals **2d8 fire damage** to an *enemy* within 10m.",
    "Heals allies by **half** the damage dealt."
  ],
  "es": [
    "Inflige **2d8 de daño de fuego** a un *enemigo* en un radio de 10m.",
    "Cura a los *aliados* la **mitad** del daño infligido."
  ]
}
```

* Usa **Markdown controlado** (`**negrita**`, `*cursiva*`, `` `2d6` ``).
* `legacy_effects = true` → UI renderiza este campo.
* `legacy_effects = false` → usa `card_effects`.

### **Uso en entidades**

| Entidad       | Campos añadidos             |
| ------------- | --------------------------- |
| `base_card`   | `legacy_effects`, `effects` |
| `world_card`  | `legacy_effects`, `effects` |
| `base_skills` | `legacy_effects`, `effects` |
| `facet`       | `legacy_effects`, `effects` |

---

## 🎨 **3. Interfaz de usuario (conceptual)**

### 🟣 **Modo Legacy**

```
[🔘] Legacy Mode ON
Editor Markdown (por idioma)
──────────────────────────────
• Inflige **2d6 de daño de fuego** a un enemigo.
──────────────────────────────
[👁️ Vista previa] [💾 Guardar]
```

### 🟢 **Modo Semántico**

```
[🔘] Legacy Mode OFF
[ + Añadir efecto ] [ Importar JSON ] [ Exportar JSON ]
─────────────────────────────────────────────
🪄 +2 a Ataque cuerpo a cuerpo durante el combate
❤️ Cura aliados cercanos por la mitad del daño infligido
─────────────────────────────────────────────
```

### **Cambio de modo**

* `legacy_effects = true` → oculta lista estructurada y muestra editor Markdown.
* `legacy_effects = false` → muestra `card_effects` con editor visual y preview dinámico.

---

## 🌐 **4. Traducción y render dinámico**

El render se genera combinando:

* `effect_type_translations.template`
* `effect_target_translations.name`
* `value`, `duration`, `scope`, `condition`

Ejemplo:

| Campo         | Valor                                             |
| ------------- | ------------------------------------------------- |
| `template`    | `"+{value} a {target} durante {duration}"`        |
| `target`      | `"Ataque cuerpo a cuerpo"`                        |
| `value`       | `+2`                                              |
| `duration`    | `"el combate"`                                    |
| **Resultado** | “+2 a Ataque cuerpo a cuerpo durante el combate.” |

---

## 🧩 **5. Relaciones principales**

| Relación                                                         | Tipo | Descripción                      |
| ---------------------------------------------------------------- | ---- | -------------------------------- |
| `card_effects.parent_id → card_effects.id`                       | 1:N  | Efectos compuestos (padre/hijo). |
| `card_effects.effect_type_id → effect_type.id`                   | N:1  | Define la lógica del efecto.     |
| `card_effects.effect_target_id → effect_target.id`               | N:1  | Define a qué se aplica.          |
| `effect_type.id → effect_type_translations.effect_type_id`       | 1:N  | Plantillas traducibles.          |
| `effect_target.id → effect_target_translations.effect_target_id` | 1:N  | Traducciones de objetivo.        |
| `card_effects.created_by → users.id`                             | N:1  | Registro de autoría.             |

---

## 🧮 **6. Validaciones y constraints**

| Constraint                               | Descripción                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `chk_card_effects_value`                 | Restringe `value` entre `-9999` y `9999`.                                                |
| `chk_card_effects_ref_type`              | Asegura que `ref_type` solo apunte a entidades válidas (`facet`, `skill`, `card`, etc.). |
| `chk_card_effects_max_stack_guard`       | Evita `max_stack` sin `is_stackable = true`.                                             |
| `fk_card_effects_parent`                 | Borra subefectos en cascada.                                                             |
| `fk_card_effects_effect_type` / `target` | Limpia FK al borrar tipo/objetivo.                                                       |

---

## ⚡ **7. Índices y rendimiento**

| Índice                          | Columnas                             | Propósito                               |
| ------------------------------- | ------------------------------------ | --------------------------------------- |
| `idx_card_effects_entity`       | `(entity_type, entity_id)`           | Acceso rápido a efectos de una entidad. |
| `idx_card_effects_type_target`  | `(effect_type_id, effect_target_id)` | Joins optimizados.                      |
| `idx_card_effects_metadata_gin` | `metadata jsonb_path_ops`            | Filtros dinámicos JSON.                 |
| `idx_*_legacy_effects`          | `(legacy_effects)`                   | Filtrado en modo narrativo.             |

---

## 🔄 **8. Import / Export JSON**

Tanto tipos (`effect_type`) como objetivos (`effect_target`) y efectos (`card_effects`)
soportan importación/exportación en JSON con traducciones incluidas.

### Ejemplo export de targets

```json
{
  "effect_targets": [
    {
      "code": "attack.melee",
      "scope": "enemy",
      "tag": "combat",
      "metadata": { "range": "1m" },
      "translations": {
        "en": { "name": "Melee Attack" },
        "es": { "name": "Ataque cuerpo a cuerpo" }
      }
    }
  ]
}
```

---

## 🧾 **9. Integración con contenido**

| Entidad       | Efectos posibles    | Campos relevantes         |
| ------------- | ------------------- | ------------------------- |
| `base_card`   | semánticos + legacy | `card_effects`, `effects` |
| `world_card`  | semánticos + legacy | `card_effects`, `effects` |
| `base_skills` | semánticos + legacy | `card_effects`, `effects` |
| `facet`       | pasivos o legacy    | `card_effects`, `effects` |

---

## 🧱 **10. Ventajas del diseño**

✅ Estructura semántica, relacional y traducible.
✅ Soporte narrativo y compatibilidad retroactiva.
✅ Permite efectos compuestos y condicionales.
✅ Multilenguaje completo y plantillas dinámicas.
✅ UI adaptativa (modo legacy / modo semántico).
✅ Indexado y preparado para render masivo.
✅ Integración nativa con feedbacks y versiones.

---

## 📘 **Ejemplo completo (carta con ambos sistemas)**

```json
{
  "code": "fire_strike",
  "name": "Golpe Ígneo",
  "legacy_effects": false,
  "effects": {
    "es": ["Inflige **2d8 de daño de fuego** a un enemigo."],
    "en": ["Deals **2d8 fire damage** to an enemy."]
  },
  "card_effects": [
    {
      "effect_type": "damage.elemental",
      "effect_target": "damage.fire",
      "value": "2d8",
      "duration": "instant",
      "scope": "enemy"
    },
    {
      "effect_type": "heal.basic",
      "effect_target": "resource.health",
      "value": "half_of_previous_damage",
      "scope": "ally"
    }
  ]
}
```

**Renderizado:**

> 🔥 Inflige **2d8 de daño de fuego** a un enemigo.
> ❤️ Cura a los aliados la mitad del daño infligido.

---

## 🧩 **Resumen visual**

```text
┌──────────────┐
│ effect_type  │──┐
│ +translations│  │
└──────────────┘  │
                  ▼
             card_effects ──→ entity (card, skill, facet)
                  ▲
┌──────────────┐  │
│ effect_target│──┘
│ +translations│
└──────────────┘
```

y opcionalmente:

```
entity.effects (JSONB Markdown)
↑
legacy_effects = true
```

---

## 🧭 **Estado actual**

* ✅ Tablas `effect_type`, `effect_target`, `card_effects` implementadas.
* ✅ Campos `legacy_effects` y `effects` añadidos en entidades.
* ✅ UI lista con modos duales y render natural.
* 🧩 Próximo paso: integración directa en editor de cartas y motor de render narrativo.

---
