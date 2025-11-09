<!-- app/components/admin/RoleForm.vue -->
// app/components/admin/RoleForm.vue
<script setup lang="ts">
// app/components/admin/RoleForm.vue
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Role } from '@/types/roles'
import type { Permissions } from '@/types/permissions'

const props = defineProps<{ modelValue: boolean; role: Role | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'save', payload: { id: number; description?: string | null; permissions: Permissions }): void }>()

const form = reactive<{ description: string; permissions: Permissions }>({
  description: '',
  permissions: {
    canManageUsers: false,
    canEditContent: false,
    canReview: false,
    canTranslate: false,
    canPublish: false,
    canAssignTags: false,
    canResolveFeedback: false,
    canSeeAllStatuses: false,
    canAccessManage: false,
    canAccessAdmin: false
  }
})

watch(() => props.modelValue, (open) => {
  if (open && props.role) {
    form.description = props.role.description || ''
    form.permissions = {
      canManageUsers: !!props.role.permissions?.canManageUsers,
      canEditContent: !!props.role.permissions?.canEditContent,
      canReview: !!props.role.permissions?.canReview,
      canTranslate: !!props.role.permissions?.canTranslate,
      canPublish: !!props.role.permissions?.canPublish,
      canAssignTags: !!props.role.permissions?.canAssignTags,
      canResolveFeedback: !!props.role.permissions?.canResolveFeedback,
      canSeeAllStatuses: !!props.role.permissions?.canSeeAllStatuses,
      canAccessManage: !!props.role.permissions?.canAccessManage,
      canAccessAdmin: !!props.role.permissions?.canAccessAdmin
    }
  }
}, { immediate: true })

function close() { emit('update:modelValue', false) }
function onSave() { if (props.role) emit('save', { id: props.role.id, description: form.description, permissions: form.permissions }) }
</script>

<template>
  <UModal :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)">
    <div class="p-4 space-y-4 w-[520px] max-w-full">
      <div>
        <h2 class="text-lg font-semibold">{{ $t('roles.editRole') }} — {{ props.role?.name }}</h2>
        <p class="text-sm text-muted">ID: {{ props.role?.id }}</p>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">{{ $t('roles.description') }}</label>
        <UTextarea v-model="form.description" placeholder="..." />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <UCheckbox v-model="form.permissions.canManageUsers" :label="$t('perm.canManageUsers')" />
        <UCheckbox v-model="form.permissions.canEditContent" :label="$t('perm.canEditContent')" />
        <UCheckbox v-model="form.permissions.canReview" :label="$t('perm.canReview')" />
        <UCheckbox v-model="form.permissions.canTranslate" :label="$t('perm.canTranslate')" />
        <UCheckbox v-model="form.permissions.canPublish" :label="$t('perm.canPublish')" />
        <UCheckbox v-model="form.permissions.canAssignTags" :label="$t('perm.canAssignTags')" />
        <UCheckbox v-model="form.permissions.canResolveFeedback" :label="$t('perm.canResolveFeedback')" />
        <UCheckbox v-model="form.permissions.canSeeAllStatuses" :label="$t('perm.canSeeAllStatuses')" />
        <UCheckbox v-model="form.permissions.canAccessManage" :label="$t('perm.canAccessManage')" />
        <UCheckbox v-model="form.permissions.canAccessAdmin" :label="$t('perm.canAccessAdmin')" />
      </div>

      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="close">{{ $t('ui.actions.cancel') }}</UButton>
        <UButton color="primary" @click="onSave">{{ $t('ui.actions.save') }}</UButton>
      </div>
    </div>
  </UModal>
</template>
