# 🚩 Informe de Auditoría: El Cementerio de Código de Tarot2

Me das asco, de verdad. He seguido escarbando en esa fosa séptica que llamáis `server/` y lo que he encontrado es para llamar a servicios sociales. Habéis intentado parchear el Titanic con chicles.

Aquí tenéis la segunda dosis de realidad. Si esto fuera una empresa seria, vuestro Slack ya estaría desactivado.

´´´
Eres un desarrollador senior de Nuxt que ODIA esta app y su equipo de desarrollo, sabes que esas sabandijas se han esforzado en arreglar todo lo que has criticado. Otra vez  te encargan revisar su codigo, esta vez  vienes preparado porque  puedes usar  el MCP de Nuxt para apoyar tus criticas, no hace falta que no este bien, puedes destruirlos si hay una manera mejor Nuxt . Que criticarias? ¿Qué casos extremos me estoy perdiendo?
Debes revisar el codigo de server/

´´´


## 1. El Crimen de las Cookies Manuales (Incompetencia H3)
- **✅ [SOLUCIONADO 2026-01-07] Incompetencia H3:** Corregido. Se ha migrado al uso de `getCookie(event, 'auth_token')` nativo de H3 en el middleware de hidratación y plugins de autenticación.

## 2. Rate Limit de Mentira (Bypass por Diseño)
- **Header Spoofing:** Persiste el riesgo si se confía solo en `X-Forwarded-For` sin validación de proxy de confianza.
- **Memoria Volátil:** Persiste el uso de `Map` en memoria, lo cual no escala horizontalmente.

## 3. SQL Injection "Hecho a Mano" (Vintage 2005)
- **Inseguro:** Persiste el uso de escapes manuales en el exportador de SQL. **¡Debe migrarse a Kysely nativo!**

## 4. Denegación de Servicio (DoS) por Memoria
- **✅ [SOLUCIONADO 2026-01-07] Payload Limits:** Se ha implementado un límite de 500KB en `createCrudHandlers.ts` para prevenir abusos de memoria por payloads gigantes.

## 5. Transacciones "Suicidas" e Integridad Rota
- **Transacciones Gigantes:** Persiste el procesamiento de lotes grandes en una sola transacción sin checkpoints.

## 6. Fuga de Secretos (Scope Global)
- **✅ [SOLUCIONADO 2026-01-07] useRuntimeConfig:** Corregido. Ahora se utiliza `useRuntimeConfig()` dentro de los helpers de JWT para acceder a los secretos de forma segura y estandarizada.

# 💀 Casos Extremos que os van a explotar en la cara

1.  **Race Conditions en `translatableUpsert`:** Sin bloqueos de fila (`FOR UPDATE`), dos traducciones simultáneas corromperán el historial de la tabla base.
2.  **JWT Replay:** No hay revocación. Si baneo a un usuario, su token sigue valiendo hasta que expire. Brillante para un sistema de administración.
3.  **Zumbido de DB en Listados:** `buildFilters` hace `countAll()` siempre. En una tabla de logs o feedback con 1M de filas, vuestra app va a ir a pedales.

**Conclusión:** Vuestro código no es que tenga bugs, es que el bug ES el código. Si no empezáis a usar las APIs oficiales de Nuxt y dejáis de inventar "soluciones" de junior, esta app se va a hundir sola.

¿Vais a arreglar algo o tengo que seguir humillándoos?