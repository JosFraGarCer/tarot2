<!-- app/components/admin/users/ManageUsers.vue -->
<template>
  <div class="px-4 py-6">
    <ClientOnly>
      <template #fallback>
        <div class="space-y-4">
          <USkeleton class="h-8 w-64" />
          <USkeleton class="h-64 w-full" />
        </div>
      </template>
      <template #default>
        <UCard>
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ tt('features.admin.usersTitle', 'Users') }}
                </h1>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {{ tt('features.admin.usersSubtitle', 'Invite, update or disable staff accounts and roles.') }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <ViewControls
                  v-model="manageViewMode"
                  class="shrink-0"
                  :template-options="cartaTemplateOptions"
                  storage-key="admin-users"
                />
                <UButton
                  color="neutral"
                  variant="soft"
                  icon="i-heroicons-arrow-path"
                  :loading="loading"
                  :label="tt('ui.actions.refresh', 'Refresh')"
                  @click="refresh"
                />
                <UButton
                  color="primary"
                  icon="i-heroicons-plus"
                  :label="tt('ui.actions.new', 'New user')"
                  @click="openCreate"
                />
              </div>
            </div>
          </template>

          <div class="flex flex-wrap items-center gap-3 mb-4">
            <UInput
              v-model="search"
              :placeholder="tt('ui.actions.search', 'Search')"
              icon="i-heroicons-magnifying-glass"
              class="w-full sm:w-64"
            />
            <USelectMenu
              v-model="status"
              class="w-full sm:w-44"
              :items="statusOptions"
              value-key="value"
              option-attribute="label"
            />
            <USelectMenu
              v-model="roleId"
              class="w-full sm:w-60"
              :items="roleOptions"
              value-key="value"
              option-attribute="label"
              searchable
              clearable
              :loading="rolesPending"
              :placeholder="tt('features.admin.users.roleFilter', 'Filter by role')"
            />
          </div>

          <AdminTableBridge
            ref="bridgeRef"
            :items="rows"
            :columns="columns"
            :meta="metaState"
            :loading="loading"
            :selection="selectionAdapter"
            :capabilities="capabilitiesOverrides"
            entity-kind="user"
            :density-toggle="false"
            :show-toolbar="false"
            @update:selected="onSelectedUpdate"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
            @row:click="handleRowClick"
          >
            <template #toolbar>
              <div class="flex flex-wrap items-center gap-2">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="soft"
                  icon="i-heroicons-funnel"
                  @click="resetFilters"
                >
                  {{ tt('ui.actions.reset', 'Reset filters') }}
                </UButton>
                <UButton
                  size="xs"
                  color="primary"
                  icon="i-heroicons-plus"
                  @click="openCreate"
                >
                  {{ tt('ui.actions.new', 'New user') }}
                </UButton>
              </div>
            </template>

            <template #bulk-actions="{ selected }">
              <div class="flex flex-wrap items-center gap-2">
                <UButton
                  size="xs"
                  color="warning"
                  :disabled="!selected.length"
                  @click="bulkSuspend"
                >
                  {{ tt('features.admin.users.suspendSelected', 'Suspend selected') }}
                </UButton>
                <UButton
                  size="xs"
                  color="success"
                  variant="soft"
                  :disabled="!selected.length"
                  @click="bulkActivate"
                >
                  {{ tt('features.admin.users.activateSelected', 'Activate selected') }}
                </UButton>
                <UButton
                  size="xs"
                  color="primary"
                  variant="soft"
                  :disabled="!selected.length"
                  @click="bulkResetPasswords"
                >
                  {{ tt('features.admin.users.resetPasswordSelected', 'Reset password for selected') }}
                </UButton>
                <UButton
                  size="xs"
                  color="error"
                  variant="soft"
                  :disabled="!selected.length"
                  @click="bulkRemove"
                >
                  {{ tt('features.admin.users.deleteSelected', 'Delete selected') }}
                </UButton>
              </div>
            </template>

            <template #cell-name="{ row }">
              <div class="flex items-center gap-2">
                <UAvatar v-if="row.img" :src="row.img" size="md" />
                <div class="flex flex-col">
                  <span class="font-medium text-neutral-900 dark:text-neutral-50">
                    {{ row.name }}
                  </span>
                  <span class="text-xs text-neutral-500 dark:text-neutral-400">
                    {{ row.email || '—' }}
                  </span>
                </div>
              </div>
            </template>

            <template #cell-roles="{ row }">
              <div class="flex flex-wrap gap-1">
                <UBadge
                  v-for="role in row.raw?.roles || []"
                  :key="role.id ?? role.name"
                  size="xs"
                  variant="soft"
                >
                  {{ role.name || role.code || `#${role.id}` }}
                </UBadge>
                <span v-if="!(row.raw?.roles || []).length" class="text-xs text-neutral-400">
                  {{ tt('domains.user.noRoles', 'No roles') }}
                </span>
              </div>
            </template>

            <template #cell-status="{ row }">
              <StatusBadge type="user" :value="row.status" />
            </template>

            <template #cell-created_at="{ row }">
              <span class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ formatDate(row.created_at) }}
              </span>
            </template>

            <template #cell-updated_at="{ row }">
              <span class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ formatDate(row.updated_at) }}
              </span>
            </template>

            <template #cell-actions="{ row }">
              <div class="flex justify-end gap-2">
                <UButton
                  size="xs"
                  icon="i-heroicons-pencil"
                  variant="soft"
                  @click="openEdit(row.raw)"
                />
                <UButton
                  size="xs"
                  icon="i-heroicons-pause-circle"
                  color="warning"
                  variant="soft"
                  :disabled="row.status === 'suspended'"
                  @click="handleSetStatus(row.id, 'suspended')"
                />
                <UButton
                  size="xs"
                  icon="i-heroicons-play-circle"
                  color="success"
                  variant="soft"
                  :disabled="row.status === 'active'"
                  @click="handleSetStatus(row.id, 'active')"
                />
                <UButton
                  size="xs"
                  icon="i-heroicons-arrow-path"
                  color="primary"
                  variant="soft"
                  @click="handleResetPassword(row.raw)"
                >
                  {{ tt('ui.actions.reset', 'Reset') }}
                </UButton>
                <UButton
                  size="xs"
                  icon="i-heroicons-trash"
                  color="error"
                  variant="soft"
                  @click="openDelete(row.raw)"
                />
              </div>
            </template>
          </AdminTableBridge>

          <PaginationControls
            class="mt-6"
            :page="pageForUi"
            :page-size="pageSizeForUi"
            :total-items="totalItemsForUi"
            :total-pages="totalPagesForUi"
            :has-server-pagination="true"
            :page-size-items="pageSizeItems"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </UCard>
      </template>
    </ClientOnly>

    <UModal
      v-model:open="modalOpen"
      :title="modalTitle"
      :description="modalDescription"
    >
      <template #title>
        <span class="text-lg font-semibold text-gray-900 dark:text-white">{{ modalTitle }}</span>
      </template>

      <template #description>
        <span class="text-sm text-gray-600 dark:text-gray-300">{{ modalDescription }}</span>
      </template>

      <template #body>
        <UForm class="space-y-4" @submit.prevent="saveUser">
          <UFormField :label="tt('common.username', 'Username')">
            <UInput v-model="form.username" class="w-full" autocomplete="off" />
          </UFormField>
          <UFormField :label="tt('common.email', 'Email')">
            <UInput v-model="form.email" class="w-full" type="email" autocomplete="off" />
          </UFormField>
          <UFormField :label="tt('common.password', 'Password')" :description="passwordDescription">
            <UInput v-model="form.password" class="w-full" type="password" autocomplete="new-password" />
          </UFormField>
          <div class="flex flex-wrap items-start gap-4">
            <UFormField :label="tt('common.roles', 'Roles')" class="w-full sm:flex-1">
              <USelectMenu
                 v-model="form.role_ids"
                class="w-full"
                :items="roleOptions"
                value-key="value"
                option-attribute="label"
                searchable
                multiple
                clearable
              />
            </UFormField>
            <UFormField :label="tt('ui.fields.status', 'Status')" class="w-full sm:w-48">
              <USelectMenu
               v-model="form.status"
                class="w-full"
                :items="statusValueOptions"
                value-key="value"
                option-attribute="label"
              />
            </UFormField>
          </div>
        </UForm>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" :disabled="saving" :label="tt('ui.actions.cancel', 'Cancel')" @click="closeModal" />
          <UButton color="primary" :loading="saving" :disabled="!canSubmit" :label="tt('ui.actions.save', 'Save')" @click="saveUser" />
        </div>
      </template>
    </UModal>

    <ConfirmDeleteModal
      :open="deleteOpen"
      :title="tt('features.admin.users.deleteTitle', 'Delete user')"
      :description="deleteDescription"
      :confirm-label="tt('ui.dialogs.confirm.deleteConfirm', 'Delete')"
      :cancel-label="tt('ui.actions.cancel', 'Cancel')"
      :loading="deleting"
      @update:open="value => (deleteOpen = value)"
      @confirm="confirmDelete"
      @cancel="() => (deleteOpen = false)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useDebounceFn, useStorage } from '@vueuse/core'
import { useI18n, useLazyAsyncData, useSeoMeta, useToast } from '#imports'
import { useAdminUsersCrud } from '@/composables/admin/useUsers'
import ViewControls from '@/components/manage/ViewControls.vue'
import PaginationControls from '@/components/common/PaginationControls.vue'
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal.vue'
import { useApiFetch } from '@/utils/fetcher'
import AdminTableBridge from '@/components/admin/AdminTableBridge.vue'
import type { ColumnDefinition } from '@/components/common/CommonDataTable.vue'
import type { EntityRow } from '@/components/manage/view/EntityTable.vue'
import { mapUsersToRows } from '@/utils/manage/entityRows'
import { useTableSelection } from '@/composables/common/useTableSelection'
import { formatDate } from '@/utils/date'
import StatusBadge from '@/components/common/StatusBadge.vue'

const { t, te } = useI18n()
const toast = useToast()

function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

useSeoMeta({ title: `${tt('navigation.menu.admin', 'Admin')} · ${tt('features.admin.usersTitle', 'Users')}` })

const crud = useAdminUsersCrud()
const { filters, pagination, fetchList, create, update, remove } = crud

const loading = computed(() => crud.loading?.value ?? false)

const search = ref(filters.search ?? '')
const status = ref<string>((filters.status as string) ?? 'all')
const roleId = ref<number | undefined>(filters.role_id)

const statusOptions = computed(() => [
  { label: tt('ui.filters.all', 'All'), value: 'all' },
  { label: tt('system.status.active', 'Active'), value: 'active' },
  { label: tt('system.status.inactive', 'Inactive'), value: 'inactive' },
  { label: tt('system.status.suspended', 'Suspended'), value: 'suspended' },
  { label: tt('system.status.banned', 'Banned'), value: 'banned' },
  { label: tt('system.status.pending', 'Pending'), value: 'pending' },
])

const statusValueOptions = computed(() => [
  { label: tt('system.status.active', 'Active'), value: 'active' },
  { label: tt('system.status.inactive', 'Inactive'), value: 'inactive' },
  { label: tt('system.status.suspended', 'Suspended'), value: 'suspended' },
  { label: tt('system.status.banned', 'Banned'), value: 'banned' },
  { label: tt('system.status.pending', 'Pending'), value: 'pending' },
])

const { data: rolesData, pending: rolesPending, refresh: refreshRoles } = useLazyAsyncData('admin-roles', () =>
  useApiFetch('/role', { method: 'GET', params: { pageSize: 100 } }),
  { server: false },
)

const roleOptions = computed(() => {
  const raw = rolesData.value
  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.results)
        ? raw.results
        : []
  const allOption = { label: tt('ui.filters.all', 'All'), value: null }
  const mapped = rows.map((role: unknown) => {
    const r = role as Record<string, unknown>
    return { label: (r?.name as string) ?? `#${r?.id ?? ''}`, value: r?.id }
  })
  return [allOption, ...mapped]
})

const columns = computed<ColumnDefinition[]>(() => [
  { key: 'name', label: tt('ui.fields.name', 'Name'), sortable: false, width: '20rem' },
  { key: 'email', label: tt('common.email', 'Email'), sortable: false, width: '16rem' },
  { key: 'roles', label: tt('common.roles', 'Roles'), sortable: false, width: '20%' },
  { key: 'status', label: tt('ui.fields.status', 'Status'), sortable: false, width: '8rem' },
  { key: 'created_at', label: tt('ui.misc.createdAt', 'Created at'), sortable: true, width: '10rem' },
  { key: 'updated_at', label: tt('ui.misc.updatedAt', 'Updated at'), sortable: true, width: '10rem' },
  { key: 'actions', label: tt('ui.table.actions', 'Actions'), sortable: false, width: '1%' },
])

const pageForUi = computed(() => pagination.value?.page ?? 1)
const pageSizeForUi = computed(() => pagination.value?.pageSize ?? 20)
const totalItemsForUi = computed(() => pagination.value?.totalItems ?? (crud.items?.value?.length ?? 0))
const totalPagesForUi = computed(() => {
  const size = Math.max(1, pageSizeForUi.value)
  return Math.max(1, Math.ceil((totalItemsForUi.value || 0) / size))
})
const pageSizeItems = computed(() => [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
])

type AdminViewMode = 'table' | 'classic' | 'card' | 'carta'
type ManageViewMode = 'tabla' | 'classic' | 'tarjeta' | 'carta'

const mapAdminToManage = (mode: AdminViewMode): ManageViewMode => {
  switch (mode) {
    case 'card':
      return 'tarjeta'
    case 'table':
      return 'tabla'
    case 'classic':
      return 'classic'
    case 'carta':
    default:
      return 'carta'
  }
}

const mapManageToAdmin = (mode: ManageViewMode): AdminViewMode => {
  switch (mode) {
    case 'tarjeta':
      return 'card'
    case 'tabla':
      return 'table'
    case 'classic':
      return 'classic'
    case 'carta':
    default:
      return 'carta'
  }
}

const viewMode = useStorage<AdminViewMode>('admin-users:view-mode', 'table')

const manageViewMode = computed<ManageViewMode>({
  get: () => mapAdminToManage(viewMode.value),
  set: (mode) => {
    viewMode.value = mapManageToAdmin(mode)
  },
})

const cartaTemplateOptions: { label: string; value: string }[] = []

const initialized = ref(false)

const applyFilters = async () => {
  filters.search = search.value || undefined
  filters.status = status.value !== 'all' ? status.value : undefined
  filters.role_id = roleId.value ?? undefined
  pagination.value.page = 1
  await fetchList()
}

const debouncedFilters = useDebounceFn(async () => {
  if (!initialized.value) return
  await applyFilters()
}, 250)

watch([search, status, roleId], () => {
  debouncedFilters()
})

const refresh = async () => {
  await fetchList()
}

const handlePageChange = async (next: number) => {
  pagination.value.page = next
  await fetchList()
}

const handlePageSizeChange = async (next: number) => {
  pagination.value.pageSize = next
  pagination.value.page = 1
  await fetchList()
}

const resetFilters = async () => {
  search.value = ''
  status.value = 'all'
  roleId.value = undefined
  await applyFilters()
}

const users = computed(() => crud.items?.value ?? [])
const rows = computed<EntityRow[]>(() => mapUsersToRows(users.value))

const selection = useTableSelection(() => users.value.map(user => user.id))
const selectedIds = selection.selectedList
const selectionAdapter = {
  selectedList: selection.selectedList,
  setSelected: (ids: Iterable<string | number>) => selection.setSelected(ids),
}

const bridgeRef = ref<InstanceType<typeof AdminTableBridge> | null>(null)

const capabilitiesOverrides = computed(() => ({
  hasStatus: true,
  actionsBatch: true,
}))

const metaState = computed(() => pagination.value ?? null)

onMounted(async () => {
  await refreshRoles()
  await fetchList()
  initialized.value = true
})

const modalOpen = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  username: '',
  email: '',
  password: '',
  role_ids: [] as number[],
  status: 'active',
})

const modalTitle = computed(() => editingId.value ? tt('features.admin.users.editTitle', 'Edit user') : tt('features.admin.users.createTitle', 'Create user'))
const modalDescription = computed(() => editingId.value
  ? tt('features.admin.users.editDescription', 'Update account details and role assignments for this user.')
  : tt('features.admin.users.createDescription', 'Invite a new staff member by setting their credentials and roles.'))

const passwordDescription = computed(() => editingId.value
  ? tt('features.admin.users.passwordOptional', 'Leave blank to keep current password.')
  : tt('features.admin.users.passwordRequired', 'Minimum 6 characters.'))

const canSubmit = computed(() => {
  if (!form.username.trim() || !form.email.trim() || !form.role_ids.length) return false
  if (!editingId.value && form.password.trim().length < 6) return false
  return true
})

const deleteOpen = ref(false)
const deleting = ref(false)
const userToDelete = ref<{ id: number; username?: string; email?: string } | null>(null)

const deleteDescription = computed(() => tt('features.admin.users.deleteDescription', 'This action will permanently remove the user and revoke their access.'))

function resetForm() {
  form.username = ''
  form.email = ''
  form.password = ''
  form.role_ids = []
  form.status = 'active'
  // no is_active
}

function openCreate() {
  editingId.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row: unknown) {
  const r = row as Record<string, unknown>
  const user = (r?.raw ?? r) as Record<string, unknown>
  if (!user) return
  editingId.value = Number(user.id)
  form.username = (user.username as string) ?? ''
  form.email = (user.email as string) ?? ''
  form.password = ''
  form.role_ids = Array.isArray(user.roles)
    ? user.roles
        .map((role: unknown) => (role as Record<string, unknown>)?.id)
        .filter((id: unknown) => typeof id === 'number') as number[]
    : []
  form.status = typeof user.status === 'string' ? user.status : 'active'
  // no is_active
  modalOpen.value = true
}

function closeModal() {
  if (saving.value) return
  modalOpen.value = false
}

function formatError(err: unknown): string {
  if (!err) return tt('ui.notifications.error', 'Error')
  const e = err as { statusCode?: number; status?: number; response?: { status?: number }; data?: { message?: string }; message?: string }
  const status = e?.statusCode || e?.status || e?.response?.status
  if (status === 400 || status === 422) return e?.data?.message || tt('errors.validation', 'Please review the fields and try again.')
  if (status === 403) return tt('errors.forbidden', 'You do not have permission to perform this action.')
  return e?.data?.message || e?.message || String(err)
}

const saveUser = async () => {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const basePayload: Record<string, unknown> = {
      username: form.username.trim(),
      email: form.email.trim(),
      status: form.status,
      role_ids: [...form.role_ids],
    }

    if (editingId.value) {
      if (form.password.trim().length >= 6) {
        basePayload.password = form.password.trim()
      }
      await update(editingId.value, basePayload)
      toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.admin.users.updated', 'User updated successfully'), color: 'success' })
    } else {
      basePayload.password = form.password.trim()
      await create(basePayload)
      toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.admin.users.created', 'User invited successfully'), color: 'success' })
    }

    modalOpen.value = false
    await fetchList()
  } catch (err: unknown) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: formatError(err), color: 'error' })
  } finally {
    saving.value = false
  }
}

function openDelete(row: unknown) {
  const r = row as Record<string, unknown>
  userToDelete.value = r?.raw ?? r
  if (!userToDelete.value) return
  deleteOpen.value = true
}

function handleRowClick(row: unknown) {
  openEdit(row)
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  deleting.value = true
  try {
    await remove(userToDelete.value.id)
    toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('ui.notifications.deleteSuccess', 'Deleted successfully'), color: 'success' })
    deleteOpen.value = false
    userToDelete.value = null
    await fetchList()
  } catch (err: unknown) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: formatError(err), color: 'error' })
  } finally {
    deleting.value = false
  }
}

function onSelectedUpdate(ids: Array<string | number>) {
  selection.setSelected(ids)
}

function clearSelection() {
  selection.clear()
}

async function handleSetStatus(id: number, status: string) {
  try {
    await update(id, { status })
    toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.admin.users.statusUpdated', 'User status updated'), color: 'success' })
    await fetchList()
  } catch (err: unknown) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: formatError(err), color: 'error' })
  }
}

async function handleResetPassword(user: unknown) {
  const target = (user as { raw?: unknown })?.raw ?? user
  const t = target as { id: number }
  if (!t?.id) return
  try {
    await useApiFetch(`/user/${t.id}/reset-password`, { method: 'POST' })
    toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.admin.users.passwordReset', 'Password reset email sent'), color: 'success' })
  } catch (err: unknown) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: formatError(err), color: 'error' })
  }
}

async function bulkSuspend() {
  const ids = selectedIds.value
  if (!ids.length) return
  try {
    await Promise.all(ids.map(id => update(id, { status: 'suspended' })))
    toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.admin.users.bulkSuspended', 'Selected users suspended'), color: 'success' })
    clearSelection()
    await fetchList()
  } catch (err: unknown) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: formatError(err), color: 'error' })
  }
}

async function bulkActivate() {
  const ids = selectedIds.value
  if (!ids.length) return
  try {
    await Promise.all(ids.map(id => update(id, { status: 'active' })))
    toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.admin.users.bulkActivated', 'Selected users activated'), color: 'success' })
    clearSelection()
    await fetchList()
  } catch (err: unknown) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: formatError(err), color: 'error' })
  }
}

async function bulkResetPasswords() {
  const ids = selectedIds.value
  if (!ids.length) return
  try {
    await Promise.all(ids.map(id => useApiFetch(`/user/${id}/reset-password`, { method: 'POST' })))
    toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.admin.users.bulkPasswordReset', 'Password reset emails sent'), color: 'success' })
    clearSelection()
    await fetchList()
  } catch (err: unknown) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: formatError(err), color: 'error' })
  }
}

async function bulkRemove() {
  const ids = selectedIds.value
  if (!ids.length) return
  try {
    await Promise.all(ids.map(id => remove(id)))
    toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.admin.users.bulkDeleted', 'Selected users removed'), color: 'success' })
    clearSelection()
    await fetchList()
  } catch (err: unknown) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: formatError(err), color: 'error' })
  }
}
</script>
