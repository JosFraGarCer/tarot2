import { test, expect } from '@playwright/test'

test.describe('Arcana Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de gestión
    await page.goto('/manage')
    
    // Esperar a que la página cargue
    await page.waitForLoadState('networkidle')
  })

  test('should display arcana list', async ({ page }) => {
    // Verificar que la tabla de arcana se muestra
    await expect(page.locator('[data-testid="arcana-table"]')).toBeVisible()
    
    // Verificar que hay al menos una columna
    const columns = page.locator('[data-testid="arcana-table"] th')
    await expect(columns).toHaveCount(1)
  })

  test('should create new arcana', async ({ page }) => {
    // Hacer clic en el botón de crear
    await page.click('[data-testid="create-arcana-button"]')
    
    // Verificar que se abre el modal de creación
    await expect(page.locator('[data-testid="create-arcana-modal"]')).toBeVisible()
    
    // Llenar el formulario
    await page.fill('[data-testid="code-input"]', 'TEST_ARCANA')
    await page.fill('[data-testid="name-input"]', 'Test Arcana')
    await page.fill('[data-testid="description-input"]', 'Test description')
    
    // Seleccionar estado
    await page.selectOption('[data-testid="status-select"]', 'active')
    
    // Guardar
    await page.click('[data-testid="save-button"]')
    
    // Verificar que se cierra el modal
    await expect(page.locator('[data-testid="create-arcana-modal"]')).not.toBeVisible()
    
    // Verificar que aparece la nueva arcana en la lista
    await expect(page.locator('text=Test Arcana')).toBeVisible()
  })

  test('should edit existing arcana', async ({ page }) => {
    // Hacer clic en el botón de editar de la primera arcana
    await page.click('[data-testid="edit-arcana-button"]:first-child')
    
    // Verificar que se abre el modal de edición
    await expect(page.locator('[data-testid="edit-arcana-modal"]')).toBeVisible()
    
    // Modificar el nombre
    await page.fill('[data-testid="name-input"]', 'Updated Arcana')
    
    // Guardar
    await page.click('[data-testid="save-button"]')
    
    // Verificar que se actualiza el nombre
    await expect(page.locator('text=Updated Arcana')).toBeVisible()
  })

  test('should delete arcana', async ({ page }) => {
    // Hacer clic en el botón de eliminar de la primera arcana
    await page.click('[data-testid="delete-arcana-button"]:first-child')
    
    // Verificar que aparece el diálogo de confirmación
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()
    
    // Confirmar eliminación
    await page.click('[data-testid="confirm-delete-button"]')
    
    // Verificar que se cierra el diálogo
    await expect(page.locator('[data-testid="delete-confirmation"]')).not.toBeVisible()
  })

  test('should filter arcana by status', async ({ page }) => {
    // Seleccionar filtro de estado
    await page.selectOption('[data-testid="status-filter"]', 'active')
    
    // Verificar que se aplica el filtro
    await expect(page.locator('[data-testid="arcana-table"]')).toHaveAttribute('data-filtered', 'active')
  })

  test('should search arcana', async ({ page }) => {
    // Buscar por nombre
    await page.fill('[data-testid="search-input"]', 'Test')
    
    // Verificar que se aplica la búsqueda
    await expect(page.locator('[data-testid="arcana-table"]')).toHaveAttribute('data-search', 'Test')
  })

  test('should handle pagination', async ({ page }) => {
    // Verificar que existe el paginador
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible()
    
    // Hacer clic en la siguiente página
    await page.click('[data-testid="next-page"]')
    
    // Verificar que cambia la página
    await expect(page.locator('[data-testid="current-page"]')).toHaveText('2')
  })

  test('should handle bulk actions', async ({ page }) => {
    // Seleccionar elementos
    await page.click('[data-testid="select-all-checkbox"]')
    
    // Verificar que aparece la barra de acciones masivas
    await expect(page.locator('[data-testid="bulk-actions-bar"]')).toBeVisible()
    
    // Hacer clic en acción masiva
    await page.click('[data-testid="bulk-delete-button"]')
    
    // Verificar diálogo de confirmación
    await expect(page.locator('[data-testid="bulk-delete-confirmation"]')).toBeVisible()
  })

  test('should preview arcana', async ({ page }) => {
    // Hacer clic en el botón de preview
    await page.click('[data-testid="preview-arcana-button"]:first-child')
    
    // Verificar que se abre el drawer de preview
    await expect(page.locator('[data-testid="preview-drawer"]')).toBeVisible()
    
    // Verificar contenido del preview
    await expect(page.locator('[data-testid="preview-content"]')).toBeVisible()
    
    // Cerrar preview
    await page.click('[data-testid="close-preview"]')
    
    // Verificar que se cierra
    await expect(page.locator('[data-testid="preview-drawer"]')).not.toBeVisible()
  })

  test('should handle view mode changes', async ({ page }) => {
    // Cambiar a vista de tarjetas
    await page.click('[data-testid="view-mode-cards"]')
    
    // Verificar que cambia la vista
    await expect(page.locator('[data-testid="cards-view"]')).toBeVisible()
    await expect(page.locator('[data-testid="table-view"]')).not.toBeVisible()
    
    // Cambiar a vista de tabla
    await page.click('[data-testid="view-mode-table"]')
    
    // Verificar que cambia de vuelta
    await expect(page.locator('[data-testid="table-view"]')).toBeVisible()
    await expect(page.locator('[data-testid="cards-view"]')).not.toBeVisible()
  })

  test('should handle language switching', async ({ page }) => {
    // Cambiar idioma
    await page.click('[data-testid="language-switcher"]')
    await page.click('[data-testid="language-es"]')
    
    // Verificar que cambia el idioma
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    
    // Verificar que el contenido cambia
    await expect(page.locator('[data-testid="page-title"]')).toContainText('Arcanas')
  })
})
