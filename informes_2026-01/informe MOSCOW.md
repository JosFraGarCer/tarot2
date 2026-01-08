# 🛡️ Informe de Seguridad Tarot2 (MosCoW)

## Mensaje
```
Revisa todo el código, encuentra vulnerabilidades de seguridad y dame un informe MosCoW (Must/Should/Could/Won't) 
```

## 🔴 MUST (Crítico - Acción Inmediata)
*   **✅ [SOLUCIONADO 2026-01-07] Corregir IDOR en Endpoints de Usuario:**
    *   **Vulnerabilidad:** Los archivos `server/api/user/[id].get.ts`, `.patch.ts` y `.delete.ts` permitían que cualquier usuario autenticado accediera o modificara a otro usuario.
    *   **Nota:** Corregido. El backend ahora valida permisos granulares y bloquea accesos no autorizados a IDs de otros usuarios.
*   **✅ [SOLUCIONADO 2026-01-08] Sanitización de Diff en RevisionCompareModal.vue:**
    *   **Vulnerabilidad:** Anteriormente se utilizaba `v-html` para mostrar diferencias entre versiones, lo que exponía a ataques XSS.
    *   **Nota:** Corregido. Se ha eliminado `v-html` y se ha implementado un renderizado línea por línea basado en templates de Vue y clases de Tailwind, garantizando que el contenido del JSON sea escapado automáticamente por el motor de renderizado de Vue.

## 🟠 SHOULD (Importante - Próximos pasos)
*   **✅ [SOLUCIONADO 2026-01-08] Implementar Protección CSRF:**
    *   **Vulnerabilidad:** Anteriormente no se detectó un sistema de tokens Anti-CSRF.
    *   **Nota:** Corregido. Se ha integrado el módulo `nuxt-security` con protección CSRF habilitada por defecto.
*   **✅ [SOLUCIONADO 2026-01-08] Reforzar Límites de Entrada en Zod (Rate Limit & Payload):**
    *   **Vulnerabilidad:** Los esquemas Zod (ej: `userCreateSchema`) aceptaban anteriormente strings sin límite de longitud máxima.
    *   **Nota:** Corregido. Se han añadido validaciones `.max()` a todos los campos críticos en los esquemas de servidor, y se mantiene el límite de 500KB para payloads JSON en el core CRUD.
*   **✅ [SOLUCIONADO 2026-01-08] Estandarizar Rate Limiting:**
    *   **Vulnerabilidad:** Anteriormente solo los endpoints "sensibles" tenían límites estrictos.
    *   **Nota:** Corregido. El middleware `02.rate-limit.ts` ahora aplica un límite global a todas las peticiones de la API, manteniendo límites más estrictos para patrones sensibles.

## 🟡 COULD (Mejoras Proactivas)
*   **✅ [SOLUCIONADO 2026-01-08] Implementar Content Security Policy (CSP):**
    *   **Vulnerabilidad:** Falta de cabeceras de seguridad para restringir la carga de recursos externos.
    *   **Nota:** Corregido. Se ha configurado una política CSP robusta a través de `nuxt-security` en `nuxt.config.ts`.
*   **Rotación de Secretos y Revocación de Tokens:**
    *   El sistema JWT actual no tiene una "lista negra" de tokens. Si un token es robado, es válido hasta que expire. Implementar una tabla de sesiones o un mecanismo de revocación mejoraría la seguridad post-compromiso.
*   **Logging de Borrados Críticos:**
    *   Añadir un rastro de auditoría (Audit Log) más persistente para acciones `DELETE` en entidades core como [arcana](cci:7://file:///home/bulu/devel/tarot2/server/api/arcana:0:0-0:0) o [world_card](cci:7://file:///home/bulu/devel/tarot2/server/api/world_card:0:0-0:0), incluyendo quién lo borró y el estado anterior del registro.

## ⚪ WON'T (Fuera de alcance actual)
*   **Autenticación Multifactor (MFA):** No se considera necesaria para la fase actual del proyecto, pero se recomienda si el sistema maneja datos financieros o críticos en el futuro.
*   **Escaneo de Vulnerabilidades Automatizado en CI/CD:** No implementado por ahora, pero recomendable a largo plazo.

---

### Resumen de Invariantes de Seguridad Detectadas (Correctas):
*   ✅ **SQL Injection:** El uso de Kysely y plantillas `sql` con parámetros `${...}` es seguro. No se detectaron concatenaciones de strings vulnerables en consultas SQL.
*   ✅ **Subida de Archivos:** La lógica en [server/api/uploads/index.post.ts](cci:7://file:///home/bulu/devel/tarot2/server/api/uploads/index.post.ts:0:0-0:0) es robusta: valida tipos MIME, extensiones, tamaño y utiliza `sharp` para procesar la imagen (lo cual elimina metadatos maliciosos y verifica la integridad del archivo).
*   ✅ **JWT:** Se utiliza la librería `jose` con algoritmos modernos (`HS256`) y las cookies están configuradas como `httpOnly` y `secure` (en producción). **Optimizado el 7 de enero de 2026** mediante el uso de un singleton para la codificación del secreto JWT y el uso de `getCookie` nativo de H3, mejorando el rendimiento y la robustez.
*   ✅ **N+1 Query Security:** Implementación de `eagerTags` para prevenir abusos de recursos por subconsultas excesivas en listados.

# Próximas Acciones Sugeridas
1.  **Modificar [01.auth.guard.ts](cci:7://file:///home/bulu/devel/tarot2/server/middleware/01.auth.guard.ts:0:0-0:0)** para incluir lógica de validación de propiedad (Self-service access).
2.  **Actualizar `schemas/user.ts`** añadiendo `.max()` a los campos de texto.
3.  **Evaluar `nuxt-security`** para resolver CSP y CSRF de forma nativa en Nuxt.

```
Security Audit Checklist:
☑ SQL Injection reviewed
☑ File Upload safety verified
☑ JWT Implementation checked (getCookie/Singleton optimized)
☑ IDOR detected in User API (✅ Fixed 2026-01-07)
☑ XSS risk in Diff Modal (✅ Fixed 2026-01-08)
```
