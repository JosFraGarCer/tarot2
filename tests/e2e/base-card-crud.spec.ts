import { test, expect } from '@playwright/test'

test.describe('Playwright Test Base Card CRUD', () => {
  const testCode = `test-basecard-${Date.now()}`
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[placeholder="User or Email"]', process.env.TEST_USER_IDENTIFIER!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    
    // Wait for successful login
    await page.waitForURL('**/user', { timeout: 10000 })
  })

  test('should create base card entity through web UI', async ({ page }) => {
    // Navigate to manage base cards
    await page.goto('/manage/base-cards')
    await page.waitForLoadState('networkidle')
    
    // Look for create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add"), [data-testid="create-button"]')
    await expect(createButton.first()).toBeVisible()
    await createButton.first().click()
    
    // Wait for modal/form to appear
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    // Fill form fields
    await page.fill('input[name="code"], input[data-testid="code"]', testCode)
    await page.fill('input[name="name"], input[data-testid="name"]', 'Test Base Card Entity')
    await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'A test base card for Playwright testing')
    await page.fill('input[name="short_text"], input[data-testid="short_text"]', 'Test short description')
    
    // Set status to draft
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'draft')
    
    // Set is_active to true
    await page.check('input[name="is_active"], input[data-testid="is_active"]')
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save"), button:has-text("Submit")')
    
    // Wait for success and redirect back to list
    await page.waitForURL('**/manage/base-cards')
    await page.waitForLoadState('networkidle')
    
    // Verify entity was created by searching for it
    const searchInput = page.locator('input[type="search"], input[data-testid="search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill(testCode)
      await page.waitForTimeout(1000) // Wait for search to complete
    }
    
    // Check if our test entity appears in the table
    const tableRow = page.locator(`text=${testCode}`)
    await expect(tableRow.first()).toBeVisible()
  })

  test('should edit base card entity and add translations', async ({ page }) => {
    // First create an entity (reuse creation logic)
    await page.goto('/manage/base-cards')
    await page.waitForLoadState('networkidle')
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('input[name="code"], input[data-testid="code"]', testCode)
    await page.fill('input[name="name"], input[data-testid="name"]', 'Test Base Card Entity')
    await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'A test base card for Playwright testing')
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'draft')
    await page.check('input[name="is_active"], input[data-testid="is_active"]')
    
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
    await page.waitForURL('**/manage/base-cards')
    await page.waitForLoadState('networkidle')
    
    // First edit: Update basic fields
    const entityRow = page.locator(`text=${testCode}`).first()
    const editButton = entityRow.locator('button:has-text("Edit"), button:has-text("Modify"), [data-testid="edit-button"]')
    await editButton.click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    // Edit basic fields
    await page.fill('input[name="name"], input[data-testid="name"]', 'Updated Test Base Card Name')
    await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'Updated description for test base card')
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'published')
    
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')
    await page.waitForURL('**/manage/base-cards')
    await page.waitForLoadState('networkidle')
    
    // Verify basic changes were saved
    const updatedRow = page.locator(`text=Updated Test Base Card Name`)
    await expect(updatedRow.first()).toBeVisible()
    
    // Second edit: Add Spanish translations
    const entityRow2 = page.locator(`text=${testCode}`).first()
    const editButton2 = entityRow2.locator('button:has-text("Edit"), button:has-text("Modify"), [data-testid="edit-button"]')
    await editButton2.click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    // Look for language selector and add translations
    const languageSelector = page.locator('select[name="lang"], select[data-testid="lang"]')
    if (await languageSelector.count() > 0) {
      await languageSelector.selectOption('es')
      
      // Fill Spanish translations
      await page.fill('input[name="name"], input[data-testid="name"]', 'Carta Base de Prueba Actualizada')
      await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'Descripción actualizada para carta base de prueba')
      
      await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')
      await page.waitForURL('**/manage/base-cards')
      await page.waitForLoadState('networkidle')
      
      console.log('Spanish translation test completed - verification depends on UI language switching')
    } else {
      console.log('Language selector not found - translation test may need UI adjustment')
    }
  })

  test('should delete base card entity through web UI', async ({ page }) => {
    // Entity should already exist from previous test, just find and delete it
    await page.goto('/manage/base-cards')
    await page.waitForLoadState('networkidle')
    
    // Find and click delete button for existing entity
    const entityRow = page.locator(`text=${testCode}`).first()
    await expect(entityRow).toBeVisible() // Verify entity exists from previous test
    
    const deleteButton = entityRow.locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete-button"]')
    await deleteButton.click()
    
    // Handle confirmation dialog
    const confirmDialog = page.locator('.modal, [data-testid="confirm-dialog"], .dialog')
    if (await confirmDialog.count() > 0) {
      const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
      await confirmButton.click()
    }
    
    // Wait for deletion to complete
    await page.waitForLoadState('networkidle')
    
    // Verify entity is no longer in the list
    const deletedRow = page.locator(`text=${testCode}`)
    await expect(deletedRow).toHaveCount(0)
  })
})
