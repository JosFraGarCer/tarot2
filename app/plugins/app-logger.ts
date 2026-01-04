// app/plugins/app-logger.ts
import type { Logger as PinoLogger } from 'pino'

// Log metadata type - flexible key-value pairs for structured logging
type LogMeta = Record<string, unknown>

// First argument to base logger methods can be meta object or message string
type LogArg = LogMeta | string | undefined

interface BaseLogger {
  debug: (metaOrMessage?: LogArg, maybeMessage?: string) => void
  info: (metaOrMessage?: LogArg, maybeMessage?: string) => void
  warn: (metaOrMessage?: LogArg, maybeMessage?: string) => void
  error: (metaOrMessage?: LogArg, maybeMessage?: string) => void
  child?: (bindings: LogMeta) => BaseLogger
}

export interface AppLogger {
  debug(message: string, meta?: LogMeta): void
  info(message: string, meta?: LogMeta): void
  warn(message: string, meta?: LogMeta): void
  error(message: string | Error, meta?: LogMeta): void
  child(bindings: LogMeta): AppLogger
}

function _isPinoLogger(logger: BaseLogger | PinoLogger): logger is PinoLogger {
  return typeof (logger as PinoLogger).bindings === 'function'
}

function createConsoleAdapter(): BaseLogger {
  return {
    debug(metaOrMessage?: LogArg, maybeMessage?: string) {
      if (typeof metaOrMessage === 'string' && maybeMessage === undefined) {
        console.debug(metaOrMessage)
        return
      }
      console.debug(maybeMessage ?? '', metaOrMessage)
    },
    info(metaOrMessage?: LogArg, maybeMessage?: string) {
      if (typeof metaOrMessage === 'string' && maybeMessage === undefined) {
        console.info(metaOrMessage)
        return
      }
      console.info(maybeMessage ?? '', metaOrMessage)
    },
    warn(metaOrMessage?: LogArg, maybeMessage?: string) {
      if (typeof metaOrMessage === 'string' && maybeMessage === undefined) {
        console.warn(metaOrMessage)
        return
      }
      console.warn(maybeMessage ?? '', metaOrMessage)
    },
    error(metaOrMessage?: LogArg, maybeMessage?: string) {
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

function createAdapter(base: BaseLogger, defaultBindings: LogMeta = {}): AppLogger {
  const emit = (level: 'debug' | 'info' | 'warn' | 'error', message: string | Error, meta?: LogMeta) => {
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
    child(bindings: LogMeta) {
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
    if (import.meta.server) {
      const event = nuxtApp.ssrContext?.event
      const eventLogger = event?.context.logger as BaseLogger | undefined
      if (eventLogger) return eventLogger
      const globalLogger = (globalThis as { logger?: BaseLogger }).logger
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

  if (import.meta.client) {
    window.addEventListener('unhandledrejection', (event) => {
      appLogger.error(event.reason, { scope: 'promise.unhandled' })
    })
  }
})
