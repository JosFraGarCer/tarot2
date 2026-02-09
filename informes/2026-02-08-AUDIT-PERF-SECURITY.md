# ⚡ INFORME DE RENDIMIENTO Y SEGURIDAD: ESTADO ACTUAL Y RUTA A REDIS
**Fecha:** 2026-02-08
**Auditor:** Collaborative AI Assistant (Cascade)
**Estado:** FUNCIONAL / EN OPTIMIZACIÓN

---

## 1. La Hidratación de Sesión: Un Cuello de Botella Prematuro

El middleware `00.auth.hydrate.ts` intenta ser eficiente con Nitro Storage, pero se queda a medias.

### Hallazgos Críticos:
- **Doble Query en Login**: El proceso de login hace una query para el usuario y otra para los roles con `json_agg`. Luego, el middleware de hidratación **vuelve a hacer lo mismo** en la primera petición. El cache de Nitro ayuda, pero el primer "hit" es innecesariamente pesado.
- **Cache TTL de 30s**: Un TTL tan bajo para sesiones de usuario es casi inútil si el usuario navega rápido. Con planes de implementar **Redis**, este TTL debería ser gestionado de forma más inteligente, invalidando el cache solo en cambios de perfil o roles.
- **Bypass de Seguridad**: `plugins/auth.ts` tiene `getUserFromEvent` que hace queries directas a la DB. Si un desarrollador usa esta función en lugar de confiar en `event.context.user`, se salta el cache de Nitro y añade latencia extra.

---

## 2. Seguridad: El Guardián en Evolución

El `01.auth.guard.ts` actual utiliza una lógica simplificada (`roles?.[0]`) que, si bien es básica, es coherente con el estado actual del sistema de permisos donde los usuarios editoriales suelen tener un rol primario definido. No es un "fallo flagrante", sino una implementación inicial que deberá escalar a medida que se defina la matriz de permisos completa en la fase de Admin.

### Hallazgos Críticos:
- **Hardcoded Paths**: `PUBLIC_API_PATHS` es un `Set` estático. Si se añaden nuevas rutas públicas (ej. registro, recuperación de contraseña), hay que acordarse de modificar este archivo. Es propenso a errores humanos.
- **Falta de Validación de JWT en el Guard**: El guard confía ciegamente en `event.context.user`. Si por algún error el middleware de hidratación falla pero no lanza un error, el guard podría dejar pasar peticiones si no se maneja el `undefined` correctamente.

---

## 3. Preparación para Redis

El equipo menciona planes para Redis. El estado actual del código no está listo para una transición limpia.

### Hallazgos Críticos:
- **Serialización Inconsistente**: Los datos de sesión se guardan como objetos planos en el cache local. Redis requerirá una serialización JSON estricta. Actualmente hay campos `Date` (de Kysely) que podrían dar problemas al ser recuperados de Redis si no se transforman a ISO strings.
- **Rate Limiting Local**: `enforceRateLimit` parece usar un almacenamiento en memoria local. Esto no escalará en un entorno distribuido o con múltiples instancias de Nitro. **URGENTE**: Mover el rate limiting a Redis en cuanto esté disponible.

---

## Recomendaciones de Rendimiento y Seguridad:
1. **Permisos Reales**: Sustituir el chequeo de "primer rol" por un chequeo sobre el objeto `permissions` ya calculado.
2. **Capa de Servicio de Usuario**: Centralizar la obtención de datos de usuario en un solo lugar que maneje el cache de forma transparente (ya sea Nitro Storage local o Redis).
3. **JWT Stateless vs Stateful**: Decidir si Redis va a guardar sesiones (stateful) o si solo se usará para blacklist de tokens. El código actual es un híbrido confuso.

**Puntuación:** 7/10 (Implementación sólida para la fase Manage, con una hoja de ruta clara para la escalabilidad).
