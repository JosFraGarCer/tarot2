// shared/schemas/version-context.ts
import { z } from 'zod'
import { releaseStageEnum } from './content-version'

export const versionContextSchema = z.object({
  world_id: z.number().int(),
  content_version_id: z.number().int().nullable(),
  pinned_at: z.string().nullable(),
  pinned_by: z.number().int().nullable(),
  version: z.object({
    id: z.number().int(),
    version_semver: z.string(),
    release: releaseStageEnum,
    description: z.string().nullable(),
    created_at: z.string(),
  }).nullable(),
})

export type VersionContextResponse = z.infer<typeof versionContextSchema>
