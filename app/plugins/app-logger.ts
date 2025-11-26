// app/plugins/app-logger.ts
import type { Logger as PinoLogger } from 'pino'

interface BaseLogger {
  debug: (metaOrMessage?: any, maybeMessage?: string) => void
  info: (metaOrMessage?: any, maybeMessage?: string) => void
  warn: (metaOrMessage?: any, maybeMessage?: string) => void
  error: (metaOrMessage?: any, maybeMessage?: string) => void
  child?: (bindings: Record<string, any>) => BaseLogger
}

export interface AppLogger {
  debug(message: string, meta?: Record<string, any>): void
  info(message: string, meta?: Record<string, any>): void
  warn(message: string, meta?: Record<string, any>): void
  error(message: string | Error, meta?: Record<string, any>): void
  child(bindings: Record<string, any>): AppLogger
}

function isPinoLogger(logger: BaseLogger | PinoLogger): logger is PinoLogger {
  return typeof (logger as PinoLogger).bindings === 'function'
}

function createConsoleAdapter(): BaseLogger {
  return {
    debug(metaOrMessage?: any, maybeMessage?: string) {
      if (typeof metaOrMessage === 'string' && maybeMessage === undefined) {
        console.debug(metaOrMessage)
        return
      }
      console.debug(maybeMessage ?? '', metaOrMessage)
    },
    info(metaOrMessage?: any, maybeMessage?: string) {
      if (typeof metaOrMessage === 'string' && maybeMessage === undefined) {
        console.info(metaOrMessage)
        return
      }
      console.info(maybeMessage ?? '', metaOrMessage)
    },
    warn(metaOrMessage?: any, maybeMessage?: string) {
      if (typeof metaOrMessage === 'string' && maybeMessage === undefined) {
        console.warn(metaOrMessage)
        return
      }
      console.warn(maybeMessage ?? '', metaOrMessage)
    },
    error(metaOrMessage?: any, maybeMessage?: string) {
      if (typeof metaOrMessage === 'string' && maybeMessage === undefined) {
        console.error(metaOrMessage)
        return
      }
      console.error(maybeMessage ?? '', metaOrMessage)
    },
    child() {
      return createConsoleAdapter()
    },
  }
}

function createAdapter(base: BaseLogger, defaultBindings: Record<string, any> = {}): AppLogger {
  const emit = (level: 'debug' | 'info' | 'warn' | 'error', message: string | Error, meta?: Record<string, any>) => {
    const payload = { ...defaultBindings, ...(meta ?? {}) }
    const text = typeof message === 'string' ? message : message?.message ?? String(message)

    if (Object.keys(payload).length > 0) {
      base[level](payload, text)
      return
    }

    base[level](text)
  }

  return {
    debug(message, meta) {
      emit('debug', message, meta)
    },
    info(message, meta) {
      emit('info', message, meta)
    },
    warn(message, meta) {
      emit('warn', message, meta)
    },
    error(message, meta) {
      emit('error', message, meta)
    },
    child(bindings: Record<string, any>) {
      const merged = { ...defaultBindings, ...bindings }
      if (typeof base.child === 'function') {
        return createAdapter(base.child(merged), {})
      }
      return createAdapter(base, merged)
    },
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const getBaseLogger = (): BaseLogger => {
    if (process.server) {
      const event = nuxtApp.ssrContext?.event
      const eventLogger = event?.context.logger as BaseLogger | undefined
      if (eventLogger) return eventLogger
      const globalLogger = (globalThis as any).logger as BaseLogger | undefined
      if (globalLogger) return globalLogger
    }

    return createConsoleAdapter()
  }

  const baseLogger = getBaseLogger()
  const appLogger = createAdapter(baseLogger)

  nuxtApp.provide('logger', appLogger)

  nuxtApp.hook('vue:error', (error, _instance, info) => {
    appLogger.error(error, { scope: 'vue.error', info })
  })

  nuxtApp.hook('app:error', (error) => {
    appLogger.error(error, { scope: 'app.error' })
  })

  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      appLogger.error(event.reason, { scope: 'promise.unhandled' })
    })
  }
})
