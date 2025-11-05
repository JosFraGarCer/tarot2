// server/utils/error.ts
import { createError } from 'h3'

export function httpError(statusCode: number, message: string) {
  throw createError({ statusCode, statusMessage: message })
}

export function badRequest(message = 'Bad Request') {
  throw createError({ statusCode: 400, statusMessage: message })
}

export function unauthorized(message = 'Unauthorized') {
  throw createError({ statusCode: 401, statusMessage: message })
}

export function forbidden(message = 'Forbidden') {
  throw createError({ statusCode: 403, statusMessage: message })
}

export function notFound(message = 'Not Found') {
  throw createError({ statusCode: 404, statusMessage: message })
}

export function conflict(message = 'Conflict') {
  throw createError({ statusCode: 409, statusMessage: message })
}

export function unprocessable(message = 'Unprocessable Entity') {
  throw createError({ statusCode: 422, statusMessage: message })
}

export function serverError(message = 'Internal Server Error') {
  throw createError({ statusCode: 500, statusMessage: message })
}
