// server/plugins/logger.ts
import pino, { type Logger } from 'pino'

const isProd = process.env.NODE_ENV === 'production'

const loggerInstance = pino(
  isProd
    ? { level: 'info' }
    : {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      },
)

declare global {
   
  var logger: Logger
}

export default defineNitroPlugin(() => {
  globalThis.logger = loggerInstance
})

export { loggerInstance as logger }
