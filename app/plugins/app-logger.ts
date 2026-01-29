// app/plugins/app-logger.ts

interface BaseLoggerBindings {
  [key: string]: unknown
}

interface BaseLogger {
  debug: (metaOrMessage?: unknown, maybeMessage?: string) => void
  info: (metaOrMessage?: unknown, maybeMessage?: string) => void
  warn: (metaOrMessage?: unknown, maybeMessage?: string) => void
  error: (metaOrMessage?: unknown, maybeMessage?: string) => void
  child?: (bindings: BaseLoggerBindings) => BaseLogger
}

export interface AppLoggerBindings {
  [key: string]: unknown
}

export interface AppLogger {
  debug(message: string, meta?: AppLoggerBindings): void
  info(message: string, meta?: AppLoggerBindings): void
  warn(message: string, meta?: AppLoggerBindings): void
  error(message: string | Error, meta?: AppLoggerBindings): void
  child(bindings: AppLoggerBindings): AppLogger
}

function createConsoleAdapter(): BaseLogger {
  return {
    debug(metaOrMessage?: unknown, maybeMessage?: string) {
      if (typeof metaOrMessage === 'string' && maybeMessage === undefined) {
        console.debug(metaOrMessage)
        return
      }
      console.debug(maybeMessage ?? '', metaOrMessage)
    },
    info(metaOrMessage?: unknown, maybeMessage?: string) {
      if (typeof metaOrMessage === 'string' && maybeMessage === undefined) {
        console.info(metaOrMessage)
        return
      }
      console.info(maybeMessage ?? '', metaOrMessage)
    },
    warn(metaOrMessage?: unknown, maybeMessage?: string) {
      if (typeof metaOrMessage === 'string' && maybeMessage === undefined) {
        console.warn(metaOrMessage)
        return
      }
      console.warn(maybeMessage ?? '', metaOrMessage)
    },
    error(metaOrMessage?: unknown, maybeMessage?: string) {
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

function createAdapter(base: BaseLogger, defaultBindings: BaseLoggerBindings = {}): AppLogger {
  const emit = (level: 'debug' | 'info' | 'warn' | 'error', message: string | Error, meta?: AppLoggerBindings) => {
    const payload: BaseLoggerBindings = { ...defaultBindings, ...(meta ?? {}) }
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
    child(bindings: AppLoggerBindings) {
      const merged: BaseLoggerBindings = { ...defaultBindings, ...bindings }
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
      const globalLogger = (globalThis as unknown as { logger?: BaseLogger }).logger
      if (globalLogger) return globalLogger
    }

    return createConsoleAdapter()
  }

  const baseLogger = getBaseLogger()
  const appLogger = createAdapter(baseLogger)

  nuxtApp.provide('logger', appLogger)

  nuxtApp.hook('vue:error', (error, _instance, info) => {
    const errorMessage = error instanceof Error ? error : new Error(String(error))
    appLogger.error(errorMessage, { scope: 'vue.error', info })
  })

  nuxtApp.hook('app:error', (error) => {
    const errorMessage = error instanceof Error ? error : new Error(String(error))
    appLogger.error(errorMessage, { scope: 'app.error' })
  })

  if (import.meta.client) {
    window.addEventListener('unhandledrejection', (event) => {
      const errorMessage = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      appLogger.error(errorMessage, { scope: 'promise.unhandled' })
    })
  }
})
