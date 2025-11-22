// server/plugins/logger.ts
import { randomUUID } from 'crypto'
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
  // eslint-disable-next-line no-var
  var logger: Logger
}

export default defineNitroPlugin((nitroApp) => {
  globalThis.logger = loggerInstance

  nitroApp.hooks.hook('request', (event) => {
    const requestId = randomUUID()
    const startedAt = Date.now()

    const child = loggerInstance.child({
      requestId,
      method: event.node.req.method,
      url: event.node.req.url,
    })

    event.context.requestId = requestId
    event.context.__requestStartedAt = startedAt
    event.context.logger = child

    child.info({ scope: 'request.start' }, 'Request received')
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    const logger = event.context.logger ?? loggerInstance
    const startedAt = event.context.__requestStartedAt as number | undefined
    const durationMs = startedAt ? Date.now() - startedAt : undefined

    logger.info(
      {
        scope: 'request.end',
        statusCode: event.node.res.statusCode,
        durationMs,
      },
      'Request completed',
    )
  })

  nitroApp.hooks.hook('error', (error, { event }) => {
    const logger = event?.context.logger ?? loggerInstance
    logger.error(
      {
        scope: 'request.error',
        statusCode: event?.node.res.statusCode,
        error: error?.message ?? String(error),
      },
      'Unhandled error while processing request',
    )
  })
})

export { loggerInstance as logger }
