---
trigger: always_on
---

# 🧩 **REGLAS ADICIONALES PARA TAROT2 (RECOMENDADAS)**

*(Seguras, no intrusivas, y elevan la calidad de Windsurf muchísimo)*

---

# ⭐ 1. Regla Anti-Confusión:

### **“Nunca asumas que un componente es global si no está importado”**

**Razón:**
Nuxt 4 autoimporta composables pero **NO todos los componentes**.
Windsurf a veces cree que un componente existe globalmente aunque solo exista en un folder específico.

### 🔒 Regla:

> **Nunca uses un componente sin verificar primero si existe en el proyecto.
> Si no existe, créalo explícitamente con la API de Nuxt/Nuxt UI y siguiendo patrones existentes.**

---

# ⭐ 2. Regla de Modales:

### **“Todos los modales deben seguir patrones accesibles y con foco manejado”**

Tu proyecto ya tiene modales accesibles, pero Windsurf podría olvidarlo.
Esta regla fija el estándar.

### 🔒 Regla:

> **Todo modal nuevo debe usar UModal con:
>
> * `role="dialog"`
> * `aria-modal="true"`
> * encabezados accesibles
> * focus trap (`UFocusTrap` si corresponde)
> * retorno de foco al disparador**

> **Los modales legacy deben migrarse gradualmente a este patrón.**

---

# ⭐ 3. Regla de Funciones Asíncronas SEGURAS

### **“Evitar `.then()`/`.catch()` salvo necesidad explícita”**

En tu repo usáis `async/await` en prácticamente todo.
Windsurf a veces introduce `.then()` por error.

### 🔒 Regla:

> **Usa siempre `async/await` para llamadas a API, mutations y fetches.
> No introduzcas `.then()` o `.catch()` salvo que ya exista en el archivo.**

---

# ⭐ 4. Regla de Limpieza:

### **“No dejar logs temporales, console.log, console.warn, debugger”**

En Tarot2 hay cada vez menos logs en frontend.
Windsurf podría insertar alguno para debug.

### 🔒 Regla:

> **No dejes `console.log`, `console.warn`, `debugger`, ni logs temporales en el PR final,
> salvo que formen parte del sistema de logging del backend.**

---

# ⭐ 5. Regla de Estabilidad del Árbol de Componentes

### **Prohibido alterar los nombres o paths de componentes core**

Los siguientes nombres SON parte de la arquitectura de Tarot2 y Windsurf NO debe renombrarlos nunca:

* `CommonDataTable`
* `ManageTableBridge`
* `AdminTableBridge`
* `EntityBase`
* `EntityInspectorDrawer`
* `FormModal`
* `EntitySlideover`

### 🔒 Regla:

> **Nunca renombres ni muevas archivos de infraestructura sin petición explícita.
> (Puedes refactorizar internamente, pero no cambiar nombres/paths.)**

---

# ⭐ 6. Regla de Tipos y Zod

### **“Todo campo nuevo en formularios debe ser tipado y validado”**

Si añades un campo a un formulario Manage:

* debe existir en el Zod schema
* debe existir en presets (`useEntityFormPreset`)
* debe validarse
* debe pasar al backend con el tipo correcto

### 🔒 Regla:

> **Cada campo nuevo debe mapearse en:
> Zod → presets → FormModal → payload del CRUD → BD (si aplica).**

---

# ⭐ 7. Regla de Performance

### **“No introducir watchers o efectos sin necesidad”**

Tu proyecto está optimizado en:

* fetch perezoso
* caching basado en `useAsyncData`
* TTL en previews
* reactividad bien delimitada

Windsurf podría meter watchers innecesarios.

### 🔒 Regla:

> **Evita watchers (`watch`, `watchEffect`) si el mismo efecto puede lograrse
> con computeds o props.**

---

# ⭐ 8. Regla Anti-Duplicación

### **“Antes de crear una utilidad nueva, buscar si ya existe en:

utils/, composables/ o CodeMaps”**

Por ejemplo:

* no crear nuevas funciones de mapeo → ya existe `entityRows.ts`
* no crear nuevos helpers para tables → ya hay bridges
* no crear nuevos badges → ya está `StatusBadge`

### 🔒 Regla:

> **Reutiliza utilidades existentes antes de crear nuevas.
> No dupliques lógicas que ya existen en `utils/` o `composables/`.**

---

# ⭐ 9. Regla de coherencia de rutas

### **“Cualquier ruta nueva debe seguir los patrones de /server/api/<entity>”**

Si Windsurf crea una nueva ruta:

* debe tener:

  * index.get
  * index.post
  * [id].get
  * [id].patch
  * [id].delete
* debe usar `createCrudHandlers`
* debe usar Zod query/body schemas
* debe respetar filters y paginación

---

# ⭐ 10. Regla para evitar breaking changes invisibles

### **“Si cambias algo que afecta Manage o Admin, revisa ambos”**

Ejemplo:

* `entityRows.ts`
* `useEntityCapabilities`
* `FormModal`

Estas funciones afectan los dos lados.

### 🔒 Regla:

> **Toda modificación en módulos compartidos (common/, utils/manage, bridges)
> debe considerarse un cambio global y comprobar efecto en Admin y Manage.**