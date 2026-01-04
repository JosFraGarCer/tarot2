# 📚 Stack Técnico y Librerías Recomendadas

## 1. Stack Actual (Base)

### 1.1 Tecnologías Core

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Nuxt 4** | ^4.2.1 | Framework full-stack |
| **Vue 3** | ^3.5 | Frontend reactivo |
| **Nuxt UI** | 4.2.1 | Componentes UI |
| **TailwindCSS** | ^4.0 | Estilos utility-first |
| **TypeScript** | ^5.7 | Tipado estático |
| **PostgreSQL** | 16+ | Base de datos |
| **Kysely** | ^0.28 | Query builder tipado |
| **Zod** | ^4.1 | Validación schemas |
| **Pinia** | ^3.0 | Estado global |
| **i18n** | ^10.2 | Internacionalización |
| **Pino** | ^9.8 | Logging estructurado |

### 1.2 Autenticación

| Librería | Uso |
|----------|-----|
| **jose** | JWT firmado/verificado |
| **bcrypt** | Hash de contraseñas |

---

## 2. Librerías para Fase 4 (World Cards)

### 2.1 Deck Builder UI

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **@vueuse/core** | Composables utilitarios (drag, resize, etc.) | `pnpm add @vueuse/core` |
| **vue-draggable-plus** | Drag & drop para listas | `pnpm add vue-draggable-plus` |
| **@tanstack/vue-virtual** | Virtualización para listas largas | `pnpm add @tanstack/vue-virtual` |

**Ejemplo de uso - Drag & Drop de cartas:**
```vue
<script setup>
import { VueDraggable } from 'vue-draggable-plus'

const deckCards = ref([])
</script>

<template>
  <VueDraggable v-model="deckCards" group="cards" item-key="id">
    <template #item="{ element }">
      <CardThumbnail :card="element" />
    </template>
  </VueDraggable>
</template>
```

### 2.2 Estadísticas de Mazo

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **chart.js** | Gráficos (curva de maná) | `pnpm add chart.js vue-chartjs` |
| **d3** | Visualizaciones avanzadas | `pnpm add d3` |

**Ejemplo - Curva de coste:**
```vue
<script setup>
import { Bar } from 'vue-chartjs'

const chartData = computed(() => ({
  labels: ['0', '1', '2', '3', '4', '5', '6', '7+'],
  datasets: [{
    label: 'Cartas por coste',
    data: calculateManaCurve(deckCards.value),
    backgroundColor: '#6366f1'
  }]
}))
</script>
```

### 2.3 Exportación

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **file-saver** | Descargar archivos | `pnpm add file-saver` |
| **@unhead/vue** | Meta tags para compartir | Ya incluido en Nuxt |

---

## 3. Librerías para Fase 5 (Personajes)

### 3.1 Character Sheet UI

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **@vueuse/core** | useStorage, useClipboard, etc. | Ya recomendada |
| **vue-flow** | Diagramas de progresión | `pnpm add @vue-flow/core` |
| **pdfmake** | Generación de PDF | `pnpm add pdfmake` |

**Ejemplo - Export a PDF:**
```typescript
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

pdfMake.vfs = pdfFonts.pdfMake.vfs

export function exportCharacterToPdf(character: Character) {
  const docDefinition = {
    content: [
      { text: character.name, style: 'header' },
      { text: `Arcano: ${character.arcana.name}` },
      { text: `Nivel: ${character.level}` },
      // ... más campos
    ],
    styles: {
      header: { fontSize: 22, bold: true }
    }
  }
  
  pdfMake.createPdf(docDefinition).download(`${character.name}.pdf`)
}
```

### 3.2 Formularios Avanzados

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **vee-validate** | Validación de formularios | `pnpm add vee-validate` |
| **@vee-validate/zod** | Integración Zod | `pnpm add @vee-validate/zod` |

**Nota:** Nuxt UI ya tiene validación integrada, evaluar si necesario.

### 3.3 Avatares y Media

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **vue-cropper** | Recortar imágenes | `pnpm add vue-cropper` |
| **@dicebear/core** | Avatares generados | `pnpm add @dicebear/core @dicebear/collection` |

**Ejemplo - Avatar aleatorio:**
```typescript
import { createAvatar } from '@dicebear/core'
import { adventurer } from '@dicebear/collection'

const avatar = createAvatar(adventurer, {
  seed: character.name,
  // opciones...
})

const dataUri = avatar.toDataUri()
```

---

## 4. Librerías para Fase 6 (Partidas RT)

### 4.1 WebSocket y Tiempo Real ⭐

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **socket.io** | WebSocket con fallbacks | `pnpm add socket.io socket.io-client` |
| **ws** | WebSocket nativo (más ligero) | `pnpm add ws` |
| **@trpc/server** | RPC tipado (alternativa) | `pnpm add @trpc/server @trpc/client` |
| **Partykit** | Serverless RT (hosted) | `pnpm add partykit` |

**Recomendación:** `socket.io` por su madurez y reconexión automática.

**Ejemplo - Server Nuxt + Socket.io:**
```typescript
// server/plugins/socket.ts
import { Server } from 'socket.io'

export default defineNitroPlugin((nitroApp) => {
  const io = new Server(nitroApp.h3App.nodeHandler, {
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    socket.on('join-session', (sessionId) => {
      socket.join(`session:${sessionId}`)
    })

    socket.on('chat', (data) => {
      io.to(`session:${data.sessionId}`).emit('chat', data)
    })

    socket.on('roll', (data) => {
      const result = rollDice(data.expression)
      io.to(`session:${data.sessionId}`).emit('roll-result', result)
    })
  })
})
```

**Ejemplo - Cliente:**
```typescript
// composables/useSession.ts
import { io, Socket } from 'socket.io-client'

export function useSession(sessionId: string) {
  const socket = ref<Socket | null>(null)
  const messages = ref<Message[]>([])
  const connected = ref(false)

  onMounted(() => {
    socket.value = io({ path: '/api/socket.io' })
    
    socket.value.on('connect', () => {
      connected.value = true
      socket.value?.emit('join-session', sessionId)
    })

    socket.value.on('chat', (msg) => messages.value.push(msg))
  })

  onUnmounted(() => socket.value?.disconnect())

  function sendChat(content: string) {
    socket.value?.emit('chat', { sessionId, content })
  }

  return { messages, connected, sendChat }
}
```

### 4.2 Sistema de Dados 🎲

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **@dice-roller/rpg-dice-roller** | Parser de notación de dados | `pnpm add @dice-roller/rpg-dice-roller` |
| **random-js** | RNG criptográfico | `pnpm add random-js` |

**Ejemplo - Roller:**
```typescript
import { DiceRoller } from '@dice-roller/rpg-dice-roller'

const roller = new DiceRoller()

function roll(expression: string) {
  const result = roller.roll(expression)
  return {
    expression,
    rolls: result.rolls.map(r => r.value),
    total: result.total,
    output: result.output // "2d6+3: [4, 2]+3 = 9"
  }
}

roll('2d6+3')      // { total: 9, ... }
roll('1d20')       // { total: 15, ... }
roll('4d6dl1')     // Drop lowest: { total: 12, ... }
roll('2d10!')      // Exploding dice
```

### 4.3 Canvas y VTT

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **Konva** | Canvas 2D para mapas | `pnpm add konva vue-konva` |
| **PixiJS** | WebGL 2D (más rendimiento) | `pnpm add pixi.js` |
| **Fabric.js** | Canvas con interactividad | `pnpm add fabric` |
| **Phaser** | Game engine (overkill) | `pnpm add phaser` |

**Recomendación:** `Konva` por balance entre features y complejidad.

**Ejemplo - Mapa con tokens:**
```vue
<script setup>
import { Stage, Layer, Image, Circle, Group } from 'vue-konva'

const mapImage = ref(null)
const tokens = ref([
  { id: 1, x: 100, y: 150, name: 'Jugador 1', color: 'blue' },
  { id: 2, x: 200, y: 200, name: 'Goblin', color: 'red' },
])

function handleTokenDrag(tokenId: number, e: any) {
  const token = tokens.value.find(t => t.id === tokenId)
  if (token) {
    token.x = e.target.x()
    token.y = e.target.y()
    // Emitir por WebSocket
    socket.emit('token:move', { tokenId, x: token.x, y: token.y })
  }
}
</script>

<template>
  <Stage :width="800" :height="600">
    <Layer>
      <Image :image="mapImage" />
      <Group
        v-for="token in tokens"
        :key="token.id"
        :x="token.x"
        :y="token.y"
        draggable
        @dragend="(e) => handleTokenDrag(token.id, e)"
      >
        <Circle :radius="20" :fill="token.color" />
        <Text :text="token.name" :y="25" :align="'center'" />
      </Group>
    </Layer>
  </Stage>
</template>
```

### 4.4 Audio (Opcional)

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **Howler.js** | Audio HTML5 | `pnpm add howler` |
| **Tone.js** | Audio avanzado | `pnpm add tone` |

**Ejemplo - Soundboard:**
```typescript
import { Howl } from 'howler'

const sounds = {
  diceRoll: new Howl({ src: ['/sounds/dice.mp3'] }),
  sword: new Howl({ src: ['/sounds/sword.mp3'] }),
  ambient: new Howl({ src: ['/sounds/tavern.mp3'], loop: true, volume: 0.3 }),
}

function playSound(name: keyof typeof sounds) {
  sounds[name].play()
}
```

### 4.5 Estado Compartido (Opcional)

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **Y.js** | CRDT para colaboración | `pnpm add yjs y-websocket` |
| **Automerge** | CRDT alternativo | `pnpm add @automerge/automerge` |
| **Liveblocks** | Colaboración hosted | `pnpm add @liveblocks/client` |

**Nota:** CRDTs son útiles para sincronizar estado complejo sin conflictos.

---

## 5. Librerías para Fase 7 (Comunidad)

### 5.1 Editor de Contenido

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **Tiptap** | Editor WYSIWYG | `pnpm add @tiptap/vue-3 @tiptap/starter-kit` |
| **Lexical** | Editor Facebook | `pnpm add lexical @lexical/vue` |
| **Editor.js** | Block editor | `pnpm add @editorjs/editorjs` |

**Recomendación:** `Tiptap` por integración Vue excelente.

### 5.2 Búsqueda Avanzada

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **Meilisearch** | Search engine | `pnpm add meilisearch` |
| **Algolia** | Search as service | `pnpm add algoliasearch` |
| **Typesense** | OSS search | `pnpm add typesense` |

**Recomendación:** `Meilisearch` por ser OSS y fácil de hostear.

### 5.3 Moderación

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **bad-words** | Filtro de palabras | `pnpm add bad-words` |
| **perspective-api** | ML moderación (Google) | API |

---

## 6. Librerías para Fase 8 (Mobile/PWA)

### 6.1 PWA

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **@vite-pwa/nuxt** | PWA para Nuxt | `pnpm add @vite-pwa/nuxt -D` |
| **workbox** | Service workers | Incluido en vite-pwa |

**Config nuxt.config.ts:**
```typescript
export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Tarot2 TTRPG',
      short_name: 'Tarot2',
      theme_color: '#6366f1',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    }
  }
})
```

### 6.2 Notificaciones Push

| Librería | Descripción | NPM |
|----------|-------------|-----|
| **web-push** | Push notifications server | `pnpm add web-push` |
| **Firebase Cloud Messaging** | Push as service | `pnpm add firebase` |

---

## 7. Infraestructura y DevOps

### 7.1 Base de Datos

| Servicio | Descripción | Costo |
|----------|-------------|-------|
| **Supabase** | PostgreSQL hosted | Free tier generoso |
| **Neon** | Serverless Postgres | Free tier |
| **Railway** | Postgres + Redis | $5/mes |
| **PlanetScale** | MySQL serverless | Free tier |

**Recomendación:** `Supabase` por PostgreSQL + Auth + Storage incluido.

### 7.2 Cache y Real-time

| Servicio | Descripción | Costo |
|----------|-------------|-------|
| **Upstash Redis** | Redis serverless | Free tier |
| **Redis Cloud** | Redis managed | Free tier |

### 7.3 Hosting

| Servicio | Descripción | Costo |
|----------|-------------|-------|
| **Vercel** | Nuxt SSR | Free tier |
| **Netlify** | Nuxt SSR | Free tier |
| **Railway** | Full control | $5/mes |
| **Fly.io** | Edge deployment | Free tier |
| **Render** | Easy deployment | Free tier |

### 7.4 Storage

| Servicio | Descripción | Costo |
|----------|-------------|-------|
| **Cloudflare R2** | S3-compatible | Muy barato |
| **Supabase Storage** | Integrado | Incluido |
| **Uploadthing** | File uploads | Free tier |

### 7.5 CDN

| Servicio | Descripción | Costo |
|----------|-------------|-------|
| **Cloudflare** | CDN + WAF + DDoS | Free tier |
| **BunnyCDN** | Económico | $0.01/GB |

---

## 8. Resumen de Instalación por Fase

### Fase 4
```bash
pnpm add @vueuse/core vue-draggable-plus @tanstack/vue-virtual chart.js vue-chartjs file-saver
```

### Fase 5
```bash
pnpm add pdfmake @dicebear/core @dicebear/collection vue-cropper
```

### Fase 6
```bash
pnpm add socket.io socket.io-client @dice-roller/rpg-dice-roller konva vue-konva howler
```

### Fase 7
```bash
pnpm add @tiptap/vue-3 @tiptap/starter-kit meilisearch bad-words
```

### Fase 8
```bash
pnpm add @vite-pwa/nuxt -D
pnpm add web-push
```

---

## 9. Matriz de Decisión

| Necesidad | Opción A | Opción B | Recomendación |
|-----------|----------|----------|---------------|
| WebSocket | socket.io | ws nativo | **socket.io** (reconexión, rooms) |
| Canvas | Konva | PixiJS | **Konva** (más simple) |
| Dados | rpg-dice-roller | Custom | **rpg-dice-roller** (notación completa) |
| PDF | pdfmake | jsPDF | **pdfmake** (más flexible) |
| Search | Meilisearch | Algolia | **Meilisearch** (OSS) |
| DB | Supabase | Neon | **Supabase** (todo incluido) |
| Cache | Upstash | Redis Cloud | **Upstash** (serverless) |
| Hosting | Vercel | Railway | **Vercel** (gratis, fácil) |

---

## 10. Consideraciones de Licencias

| Librería | Licencia | Comercial |
|----------|----------|-----------|
| socket.io | MIT | ✅ |
| Konva | MIT | ✅ |
| rpg-dice-roller | MIT | ✅ |
| pdfmake | MIT | ✅ |
| Meilisearch | MIT | ✅ |
| Tiptap | MIT | ✅ |
| chart.js | MIT | ✅ |

**Todas las librerías recomendadas son MIT o similar**, compatibles con uso comercial y código abierto.

---

*Este documento debe actualizarse conforme se evalúen nuevas librerías o cambien los requisitos del proyecto.*
