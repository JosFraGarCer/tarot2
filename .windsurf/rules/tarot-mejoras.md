---
trigger: always_on
---

# 🟦 1. **Reglas para generar código nuevo siempre dentro de folders correctos**

Windsurf a veces crea archivos donde no toca si no se le guía.

### Añade esta regla:

> **Todo archivo nuevo debe crearse siguiendo la estructura establecida:**
>
> * Components Manage → `app/components/manage/**`
> * Components Admin → `app/components/admin/**`
> * Composables → `app/composables/**`
> * Utilities → `app/utils/**`
> * Tablas → en `components/common` o mediante Bridges
> * Endpoints backend → `server/api/<entity>/...`
>   **Nunca crear archivos en carpetas genéricas o nuevas sin justificación.**

Esto elimina el riesgo de “archivos perdidos”.

---

# 🟦 2. **Regla de documentación mínima automática**

Cuando Windsurf cree un componente/composable nuevo, debe generar documentación mínima.

### Añádelo:

> **Cada nuevo componente o composable debe incluir:**
>
> * comentario inicial explicando el propósito
> * cómo encaja en el sistema
> * qué invariantes cumple
> * qué patrones usa (table bridge, drawer, preset, etc.)

Esto ayuda muchísimo a la coherencia del repo.

---

# 🟦 3. **Regla para commits/PRs pequeños y autoexplicativos**

Windsurf a veces genera PRs demasiado grandes si no se le controla.

### Añade:

> **Divide los cambios grandes en PRs pequeños y con propósito claro.
> Cada PR debe tener:**
>
> * objetivo principal
> * lista de archivos afectados
> * justificación
> * garantías de que no rompe invariantes**

Esto evita refactors gigantes en una sola pasada.

---

# 🟦 4. **Regla de testing manual mínimo antes de cerrar PR**

Como Tarot2 no tiene test suite automatizada aún, Windsurf debe recordar probar los flujos.

Añade:

> **Antes de finalizar un PR, verifica manualmente:**
>
> * Crear + Editar + Eliminar entidades
> * Bulk actions
> * Preview en Drawer
> * Filtrado + Paginación
> * SSR safe (sin errores en consola)
>   **Incluye este checklist en la descripción del PR.**

Al activar esto, Windsurf añade automáticamente una sección al PR que dice:

```
Manual QA Checklist:
☑ CRUD
☑ Bulk Actions
☑ Preview Drawer
☑ Filters
☑ Pagination
☑ Errors in console
```