// server/api/arcana/export.get.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  // @ts-ignore - Nitro tasks are globally available in Nitro environment
  const taskResult = await runNitroTask('arcana:export', {
    triggeredBy: event.context.user?.id
  })

  return {
    success: true,
    message: 'Export task started in background',
    taskId: 'arcana:export',
    data: taskResult
  }
})
