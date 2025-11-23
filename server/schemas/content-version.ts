// server/schemas/content-version.ts
import { z } from 'zod'

const releaseStageEnum = z.enum(['dev', 'alfa', 'beta', 'candidate', 'release', 'revision'])

const metadataInput = z.preprocess((val) => {
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return {}
    try {
      return JSON.parse(trimmed)
    } catch {
      return val
    }
  }
  return val
}, z.record(z.any()))

export const contentVersionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  version_semver: z.string().optional(),
  created_by: z.coerce.number().int().optional(),
  release: releaseStageEnum.optional(),
  sort: z.enum(['created_at', 'version_semver']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

export const contentVersionCreateSchema = z.object({
  version_semver: z.string().min(1),
  description: z.string().optional(),
  metadata: metadataInput.optional().default({}),
  release: releaseStageEnum.default('alfa'),
})

export const contentVersionPublishSchema = z
  .object({
    version_id: z.coerce.number().int().positive().optional(),
    version_semver: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    metadata: metadataInput.optional().default({}),
    release: releaseStageEnum.optional(),
  })
  .refine((value) => value.version_id || value.version_semver, {
    message: 'version_id or version_semver is required',
    path: ['version_id'],
  })

export const contentVersionUpdateSchema = z.object({
  version_semver: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  metadata: metadataInput.optional(),
  release: releaseStageEnum.optional(),
})

export type ContentVersionQuery = z.infer<typeof contentVersionQuerySchema>
export type ContentVersionCreate = z.infer<typeof contentVersionCreateSchema>
export type ContentVersionUpdate = z.infer<typeof contentVersionUpdateSchema>
export type ContentVersionPublish = z.infer<typeof contentVersionPublishSchema>
