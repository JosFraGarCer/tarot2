// shared/schemas/content-version.ts
import { z } from 'zod'

// Release stage enum
export const releaseStageEnum = z.enum([
  'dev',
  'alfa',
  'beta',
  'candidate',
  'release',
  'revision'
])

// Schema for content version queries
export const contentVersionQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  pageSize: z.coerce.number().int().min(1, 'Page size must be at least 1').max(100, 'Page size cannot exceed 100').default(20),
  search: z.string().optional(),
  version_semver: z.string().optional(),
  created_by: z.coerce.number().int().optional(),
  release: releaseStageEnum.optional(),
  sort: z.enum(['created_at', 'version_semver']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

// Schema for creating content versions
export const contentVersionCreateSchema = z.object({
  version_semver: z.string().regex(/^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/, 'Invalid semantic version format'),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  release: releaseStageEnum.default('dev'),
})

// Schema for updating content versions
export const contentVersionUpdateSchema = z.object({
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  release: releaseStageEnum.optional(),
})

// Schema for publishing content versions
export const contentVersionPublishSchema = z.object({
  version_id: z.coerce.number().int().positive().optional(),
  version_semver: z.string().min(1, 'Version semver is required').optional(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
  release: releaseStageEnum.optional(),
})
.refine((value) => value.version_id || value.version_semver, {
  message: 'version_id or version_semver is required',
  path: ['version_id'],
})

// Preprocessor for metadata input (handles JSON strings)
export const metadataInput = z.preprocess((val) => {
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

// Types exportados
export type ReleaseStage = z.infer<typeof releaseStageEnum>
export type ContentVersionQuery = z.infer<typeof contentVersionQuerySchema>
export type ContentVersionCreate = z.infer<typeof contentVersionCreateSchema>
export type ContentVersionUpdate = z.infer<typeof contentVersionUpdateSchema>
export type ContentVersionPublish = z.infer<typeof contentVersionPublishSchema>
