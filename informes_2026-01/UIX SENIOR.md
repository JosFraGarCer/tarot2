# 💀 Informe de Destrucción UI/UX (Basado en Código Real)

## Prompt
```
Eres un diseñador senior que ODIA esta app y su equipo de desarrollo, te encargan revisar su UIX hecho con Nuxt-UI y tailwindCSS. Que criticarias? ¿Qué casos extremos me estoy perdiendo?
Para hacerlo mejor tienes que apoyarte en el MCP de Nuxt-UI para demostrar que eres el experto para sugerir y proponer soluciones.

Para ello tienes que revisar el layout, todas las paginas y todos sus componentes meticulosamente
```

### 1. **Layout: El Header "Esquizofrenico"**
- **El Hallazgo:** En `@/app/components/AppHeader/AppHeaderDesktop.vue:49` estáis usando un `UNavigationMenu` con una prop `:items` que viene de un composable, pero el MCP de Nuxt UI v4 tiene capacidades mucho más ricas para manejar estados activos y badges que estáis ignorando.
- **La Crítica:** El logo es un simple `NuxtLink`. No hay jerarquía. El selector de idioma con `ULocaleSelect` es un pegote visual en el lado derecho.
- **Solución Pro:** Deberíais usar el slot `#item` de `UNavigationMenu` para renderizar descripciones en los submenús. Un administrador no tiene por qué saber de memoria qué hace cada sección de "Manage".

### 2. **Páginas: El "Desierto" de la Home**
- **El Hallazgo:** `@/app/pages/index.vue` es literalmente un `UCard` con un `h1`. 
- **La Crítica:** ¿Esto es una app o un ejercicio de "Hola Mundo"? Un usuario que entra a Tarot2 debería ver un **Dashboard real** con el componente `UPageHero` o `UDashboardPanel` (del módulo Pro si lo tenéis, o simulado con celdas de Nuxt UI).
- **Caso Extremo:** Si el servidor de BD cae, vuestra home no muestra nada más que un card vacío. Falta un estado global de "Health" en la landing.

### 3. **Manage Page: La "Fatiga de Tabs"**
- **El Hallazgo:** En `@/app/pages/manage.vue`, usáis `UTabs` para cambiar entre Arcana, Skills, Facets...
- **La Crítica:** Tenéis 7 tabs. En pantallas pequeñas o con zoom, esto va a hacer scroll horizontal infinito. Es una UX de los 90.
- **Solución Pro:** Deberíais migrar a un **Sidebar Vertical** usando `UNavigationMenu` en modo vertical para la sección de gestión. Deja las Tabs para sub-vistas dentro de una misma entidad, no para el menú principal de navegación.

### 4. **FormModal: El "Horror Claustrofóbico"**
- **El Hallazgo:** `@/app/components/manage/modal/FormModal.vue` usa `UModal`.
- **La Crítica:** Estás intentando meter un editor de Markdown (`MarkdownEditor`) y un `ImageUploadField` dentro de un modal que, por defecto, se centra en la pantalla y bloquea todo. 
- **Caso Extremo:** Si el usuario está editando una Skill y necesita mirar una Facet en la tabla para comparar, tiene que cerrar el modal, mirar, y volver a abrir. **¡Pérdida de tiempo total!**
- **Solución Pro (MCP Validada):** Migración inmediata a `USlideover` con `:dismissible="false"`. Esto libera el 60% de la pantalla para consulta mientras se edita.

### 5. **EntityInspectorDrawer: La "Lectura en el Agujero de la Cerradura"**
- **El Hallazgo:** `@/app/components/manage/EntityInspectorDrawer.vue` tiene secciones de "Translations" y "Metadata" apelotonadas.
- **La Crítica:** Usáis un `USlideover` pero dentro hay una lista infinita de `li` con `UBadge`. Si una entidad tiene 5 idiomas, el drawer se vuelve un pergamino ilegible.
- **Caso Extremo:** Falta **navegación entre hermanos**. Si estoy en el drawer del "Arcano 1", debería tener botones de `[Anterior] [Siguiente]` para saltar al "Arcano 2" sin cerrar el drawer y volver a la tabla.

---

# ⚠️ Casos Extremos que el Equipo de Desarrollo ha Olvidado

1.  **Colisiones de Edición (The "Double-Save" Trap):** No veo en el `FormModal` ningún check contra el `modified_at` de la base de datos antes de enviar el `PATCH`. Dos editores pueden pisarse los cambios y vuestra UI no dirá ni "mú".
2.  **Validación Asíncrona:** Si el `code` de un Arcano debe ser único, el usuario solo se entera **después** de pulsar "Save" y que el backend devuelva un 409. El MCP de Nuxt UI permite estados de `loading` en los inputs; usadlos para validar el código mientras el usuario escribe (debounce).
3.  **Estados de Error "Mudos":** Vuestras notificaciones no tienen persistencia ni historial. Si falla una acción masiva de 100 elementos, el usuario solo verá un toast rojo que desaparece en 3 segundos.

**¿Qué quieres que destruya primero? ¿Convertimos ese `FormModal` zombi en un `USlideover` decente o montamos una Home que no de vergüenza ajena?**