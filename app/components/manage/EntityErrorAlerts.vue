<!-- 
  Component: EntityErrorAlerts
  Purpose: Display error alerts for list and action errors
  Responsibilities: 
  - Show list error alerts
  - Show action error alerts
  - Access state from injected EntityBaseContext
-->
<template>
  <div class="space-y-2">
    <UAlert
      v-if="ctx.crud?.listError?.value"
      :title="t('errors.list_failed')"
      :description="ctx.crud.listError?.value || ''"
      color="error"
      variant="soft"
    />
    <UAlert
      v-if="ctx.crud?.actionError?.value"
      :title="t('errors.action_failed')"
      :description="ctx.crud.actionError?.value || ''"
      color="error"
      variant="soft"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '#imports'
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'

const ctx = useEntityBase()
const { t } = useI18n()
</script>
