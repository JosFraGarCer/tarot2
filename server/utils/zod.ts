import { z } from 'zod'

const truthy = new Set(['true', '1', 'yes', 'on', 't'])
const falsy = new Set(['false', '0', 'no', 'off', 'f'])

export const queryBoolean = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (!normalized) return undefined
    if (truthy.has(normalized)) return true
    if (falsy.has(normalized)) return false
  }
  return value
}, z.boolean())
