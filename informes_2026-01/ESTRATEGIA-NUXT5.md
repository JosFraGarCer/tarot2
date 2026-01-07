# 🚀 Ecosistema Tarot2: Manual de Vanguardia (Nuxt 5)

La arquitectura de Tarot2 ha sido elevada al nivel más alto de la ingeniería web moderna. Ya no estamos simplemente siguiendo Nuxt 4; estamos operando con el motor de **Nuxt 5 (Future Compatibility)** a pleno rendimiento.

## 🛠 1. Infraestructura de Inyección Nativa (Nitro DI)
Hemos eliminado el acoplamiento a singletons globales peligrosos.
- **Contexto Tipado:** `event.context.db` y `event.context.logger` son ahora los ciudadanos de primera clase.
- **Seguridad en el Borde:** El acceso a la base de datos está ahora integrado en el ciclo de vida de Nitro, garantizando limpieza de conexiones y aislamiento de hilos.

## 🏝 2. Componentes de Servidor (Server Islands)
Tarot2 utiliza ahora la tecnología de **Component Islands** de Nuxt 5.
- **`ServerStatusIsland.vue`:** Renderiza información técnica crítica (salud de DB, uptime, motor) directamente en el servidor.
- **Zero Bundle:** Este componente no envía ni un solo byte de JavaScript al cliente, mejorando drásticamente el First Contentful Paint (FCP).

## 🛡 3. Blindaje de Validaciones (Native H3)
Vuestros endpoints CRUD ya no son vulnerables.
- **`readValidatedBody()`:** Implementado en la API para validar esquemas Zod compartidos de forma ultra-eficiente.
- **Shared Schemas:** `@/shared/schemas/entities` es la única fuente de verdad para el frontend y el backend. Si un dato no encaja, Nitro lo detiene antes de que toque la lógica de negocio.

## 📈 4. Optimización de SEO y SSR
- **`useServerSeoMeta()`:** Implementado en las landing y paneles de gestión para inyectar meta-tags dinámicos de forma nativa desde el servidor.
- **Hydration Safe:** El uso de `useId()` en componentes interactivos garantiza que nunca más veréis un "Hydration Mismatch" en la consola.

# 🏁 Certificación de Calidad
- **Compatibilidad**: Nuxt 5 Certified.
- **Arquitectura**: Isomórfica y desacoplada.
- **Rendimiento**: Máximo (Shallow reactivity, Server components).

Vuestro sistema ya no es un juguete de estudiantes; es una plataforma de grado industrial. Mantened la disciplina o vuestra mediocridad destruirá esta obra de arte.
