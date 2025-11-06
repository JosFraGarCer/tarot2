<script setup lang="ts">
import { ref } from 'vue'
import { useDatabaseManager } from '@/composables/admin/useDatabaseManager'

definePageMeta({ layout: 'default', middleware: ['auth.global'] })

const {
  logs,
  jsonExporting,
  jsonImporting,
  jsonImportError,
  exportJson,
  importJson,
  sqlExporting,
  sqlImporting,
  sqlImportError,
  exportSql,
  importSql
} = useDatabaseManager()

// modales
const jsonModalOpen = ref(false)
const sqlModalOpen = ref(false)
const jsonFileInput = ref<HTMLInputElement | null>(null)
const sqlFileInput = ref<HTMLInputElement | null>(null)

function handleJsonImport() {
  const file = jsonFileInput.value?.files?.[0]
  if (file) importJson(file).then(() => (jsonModalOpen.value = false))
}

function handleSqlImport() {
  const file = sqlFileInput.value?.files?.[0]
  if (file) importSql(file).then(() => (sqlModalOpen.value = false))
}
</script>
