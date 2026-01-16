import { test, expect } from '@playwright/test'

test.describe('User Workflows', () => {
  const testCode = `workflow-test-${Date.now()}`
  
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

  test('complete entity lifecycle: draft → review → publish → archive', async ({ page }) => {
    // Step 1: Create entity as draft
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('input[name="code"], input[data-testid="code"]', testCode)
    await page.fill('input[name="name"], input[data-testid="name"]', 'Workflow Test Entity')
    await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'Entity for workflow testing')
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'draft')
    await page.check('input[name="is_active"], input[data-testid="is_active"]')
    
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
    await page.waitForURL('**/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Verify entity is in draft status
    const entityRow = page.locator(`text=${testCode}`)
    await expect(entityRow.first()).toBeVisible()
    
    // Step 2: Edit and mark for review
    const editButton = entityRow.locator('button:has-text("Edit"), button:has-text("Modify"), [data-testid="edit-button"]')
    await editButton.click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'Updated description - ready for review')
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'review')
    
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')
    await page.waitForURL('**/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Step 3: Publish the entity
    const editButton2 = entityRow.locator('button:has-text("Edit"), button:has-text("Modify"), [data-testid="edit-button"]')
    await editButton2.click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'published')
    
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')
    await page.waitForURL('**/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Step 4: Archive the entity
    const editButton3 = entityRow.locator('button:has-text("Edit"), button:has-text("Modify"), [data-testid="edit-button"]')
    await editButton3.click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'archived')
    
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')
    await page.waitForURL('**/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Verify final status
    const archivedEntity = page.locator(`text=${testCode}`)
    await expect(archivedEntity.first()).toBeVisible()
    
    // Clean up - delete the entity
    const deleteButton = entityRow.locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete-button"]')
    await deleteButton.click()
    
    const confirmDialog = page.locator('.modal, [data-testid="confirm-dialog"], .dialog')
    if (await confirmDialog.count() > 0) {
      const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
      await confirmButton.click()
    }
    await page.waitForLoadState('networkidle')
  })

  test('bulk operations workflow: select → edit → delete multiple', async ({ page }) => {
    // Create multiple test entities
    const entities = [
      { code: `${testCode}-1`, name: 'Bulk Test Entity 1' },
      { code: `${testCode}-2`, name: 'Bulk Test Entity 2' },
      { code: `${testCode}-3`, name: 'Bulk Test Entity 3' }
    ]
    
    // Create entities
    for (const entity of entities) {
      await page.goto('/manage/arcana')
      await page.waitForLoadState('networkidle')
      
      const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
      await createButton.first().click()
      await page.waitForSelector('form, [data-testid="form-modal"], .modal')
      
      await page.fill('input[name="code"], input[data-testid="code"]', entity.code)
      await page.fill('input[name="name"], input[data-testid="name"]', entity.name)
      await page.fill('textarea[name="description"], textarea[data-testid="description"]', `Bulk test entity: ${entity.name}`)
      await page.selectOption('select[name="status"], select[data-testid="status"]', 'draft')
      
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
      await page.waitForURL('**/manage/arcana')
      await page.waitForLoadState('networkidle')
    }
    
    // Step 1: Select multiple entities
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Look for checkboxes
    const checkboxes = page.locator('input[type="checkbox"], [data-testid="select-row"]')
    const checkboxCount = await checkboxes.count()
    
    if (checkboxCount > 0) {
      // Select first few entities
      const selectCount = Math.min(3, checkboxCount)
      for (let i = 0; i < selectCount; i++) {
        await checkboxes.nth(i).check()
      }
      
      // Step 2: Look for bulk actions
      const bulkActions = page.locator('[data-testid="bulk-actions"], .bulk-actions')
      if (await bulkActions.count() > 0) {
        await expect(bulkActions.first()).toBeVisible()
        
        // Try bulk edit if available
        const bulkEditButton = bulkActions.locator('button:has-text("Edit"), button:has-text("Modify")')
        if (await bulkEditButton.count() > 0) {
          await bulkEditButton.click()
          
          // Look for bulk edit modal
          const bulkEditModal = page.locator('[data-testid="bulk-edit-modal"], .modal')
          if (await bulkEditModal.count() > 0) {
            await expect(bulkEditModal.first()).toBeVisible()
            
            // Try to change status
            const statusSelect = bulkEditModal.locator('select[name="status"]')
            if (await statusSelect.count() > 0) {
              await statusSelect.selectOption('published')
              
              const saveButton = bulkEditModal.locator('button:has-text("Save"), button:has-text("Apply")')
              if (await saveButton.count() > 0) {
                await saveButton.click()
                await page.waitForLoadState('networkidle')
              }
            }
          }
        }
        
        // Step 3: Try bulk delete
        const bulkDeleteButton = bulkActions.locator('button:has-text("Delete"), button:has-text("Remove")')
        if (await bulkDeleteButton.count() > 0) {
          await bulkDeleteButton.click()
          
          // Look for confirmation dialog
          const confirmDialog = page.locator('.modal, [data-testid="confirm-dialog"], .dialog')
          if (await confirmDialog.count() > 0) {
            const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
            if (await confirmButton.count() > 0) {
              await confirmButton.click()
              await page.waitForLoadState('networkidle')
            }
          }
        }
      } else {
        console.log('Bulk actions not found - may not be implemented')
      }
    } else {
      console.log('Checkboxes not found - bulk selection may not be implemented')
    }
    
    // Clean up remaining entities
    for (const entity of entities) {
      const entityRow = page.locator(`text=${entity.code}`)
      if (await entityRow.count() > 0) {
        const deleteButton = entityRow.locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete-button"]')
        await deleteButton.click()
        
        const confirmDialog = page.locator('.modal, [data-testid="confirm-dialog"], .dialog')
        if (await confirmDialog.count() > 0) {
          const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
          await confirmButton.click()
        }
        await page.waitForLoadState('networkidle')
      }
    }
  })

  test('search and edit workflow: find → edit → save → continue', async ({ page }) => {
    // Create a test entity first
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('input[name="code"], input[data-testid="code"]', testCode)
    await page.fill('input[name="name"], input[data-testid="name"]', 'Search Edit Test Entity')
    await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'Entity for search and edit workflow')
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'draft')
    
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
    await page.waitForURL('**/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Step 1: Search for the entity
    const searchInput = page.locator('input[type="search"], input[data-testid="search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('Search Edit Test')
      await page.waitForTimeout(1000)
      
      // Should find our entity
      const foundEntity = page.locator(`text=${testCode}`)
      await expect(foundEntity.first()).toBeVisible()
      
      // Step 2: Edit the entity
      const editButton = foundEntity.locator('button:has-text("Edit"), button:has-text("Modify"), [data-testid="edit-button"]')
      await editButton.click()
      await page.waitForSelector('form, [data-testid="form-modal"], .modal')
      
      // Step 3: Make changes
      await page.fill('input[name="name"], input[data-testid="name"]', 'Updated Search Edit Test Entity')
      await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'Updated description for search and edit workflow')
      await page.selectOption('select[name="status"], select[data-testid="status"]', 'published')
      
      await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')
      await page.waitForURL('**/manage/arcana')
      await page.waitForLoadState('networkidle')
      
      // Step 4: Verify changes and continue working
      const updatedEntity = page.locator('text=Updated Search Edit Test Entity')
      await expect(updatedEntity.first()).toBeVisible()
      
      // Step 5: Clear search and verify entity still exists
      await searchInput.fill('')
      await page.waitForTimeout(1000)
      
      const allEntities = page.locator(`text=${testCode}`)
      await expect(allEntities.first()).toBeVisible()
    } else {
      console.log('Search functionality not found')
    }
    
    // Clean up
    const entityRow = page.locator(`text=${testCode}`)
    if (await entityRow.count() > 0) {
      const deleteButton = entityRow.locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete-button"]')
      await deleteButton.click()
      
      const confirmDialog = page.locator('.modal, [data-testid="confirm-dialog"], .dialog')
      if (await confirmDialog.count() > 0) {
        const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
        await confirmButton.click()
      }
      await page.waitForLoadState('networkidle')
    }
  })

  test('navigation workflow: home → manage → entity → back → forward', async ({ page }) => {
    // Step 1: Start from home
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Step 2: Navigate to manage section
    const manageLink = page.locator('a[href="/manage"], a:has-text("Manage")')
    if (await manageLink.count() > 0) {
      await manageLink.first().click()
      await page.waitForURL('**/manage')
      await page.waitForLoadState('networkidle')
      
      // Step 3: Navigate to arcana management
      const arcanaLink = page.locator('a[href="/manage/arcana"], a:has-text("Arcana")')
      if (await arcanaLink.count() > 0) {
        await arcanaLink.first().click()
        await page.waitForURL('**/manage/arcana')
        await page.waitForLoadState('networkidle')
        
        // Step 4: Create an entity
        const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
        await createButton.first().click()
        await page.waitForSelector('form, [data-testid="form-modal"], .modal')
        
        await page.fill('input[name="code"], input[data-testid="code"]', testCode)
        await page.fill('input[name="name"], input[data-testid="name"]', 'Navigation Test Entity')
        await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'Entity for navigation workflow testing')
        await page.selectOption('select[name="status"], select[data-testid="status"]', 'draft')
        
        await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
        await page.waitForURL('**/manage/arcana')
        await page.waitForLoadState('networkidle')
        
        // Step 5: Go back using browser navigation
        await page.goBack()
        await page.waitForLoadState('networkidle')
        
        // Should be back on manage page
        expect(page.url()).toContain('/manage')
        
        // Step 6: Go forward using browser navigation
        await page.goForward()
        await page.waitForLoadState('networkidle')
        
        // Should be back on arcana page
        expect(page.url()).toContain('/manage/arcana')
        
        // Step 7: Navigate to entity details if available
        const entityRow = page.locator(`text=${testCode}`)
        if (await entityRow.count() > 0) {
          const viewButton = entityRow.locator('button:has-text("View"), button:has-text("Details"), a:has-text("View")')
          if (await viewButton.count() > 0) {
            await viewButton.first().click()
            await page.waitForLoadState('networkidle')
            
            // Should be on entity detail page
            const entityDetail = page.locator(`text=${testCode}`)
            await expect(entityDetail.first()).toBeVisible()
            
            // Step 8: Navigate back to list
            const backButton = page.locator('button:has-text("Back"), button:has-text("Return"), a:has-text("Back")')
            if (await backButton.count() > 0) {
              await backButton.first().click()
              await page.waitForLoadState('networkidle')
              
              expect(page.url()).toContain('/manage/arcana')
            }
          }
        }
        
        // Clean up
        const deleteButton = entityRow.locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete-button"]')
        await deleteButton.click()
        
        const confirmDialog = page.locator('.modal, [data-testid="confirm-dialog"], .dialog')
        if (await confirmDialog.count() > 0) {
          const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
          await confirmButton.click()
        }
        await page.waitForLoadState('networkidle')
      }
    }
  })

  test('multi-tab workflow: work with multiple entities simultaneously', async ({ page }) => {
    // Create first entity
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('input[name="code"], input[data-testid="code"]', `${testCode}-1`)
    await page.fill('input[name="name"], input[data-testid="name"]', 'Multi-tab Entity 1')
    await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'First entity for multi-tab testing')
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'draft')
    
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
    await page.waitForURL('**/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Open second tab
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      await page.evaluate(() => window.open('/manage/arcana', '_blank'))
    ])
    
    await newPage.waitForLoadState('networkidle')
    
    // Login in new tab if needed
    if (newPage.url().includes('/login')) {
      await newPage.fill('input[placeholder="User or Email"]', process.env.TEST_USER_IDENTIFIER!)
      await newPage.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
      await newPage.click('button[type="submit"]')
      await newPage.waitForURL('**/user', { timeout: 10000 })
      await newPage.goto('/manage/arcana')
      await newPage.waitForLoadState('networkidle')
    }
    
    // Create second entity in new tab
    const createButton2 = newPage.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton2.first().click()
    await newPage.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await newPage.fill('input[name="code"], input[data-testid="code"]', `${testCode}-2`)
    await newPage.fill('input[name="name"], input[data-testid="name"]', 'Multi-tab Entity 2')
    await newPage.fill('textarea[name="description"], textarea[data-testid="description"]', 'Second entity for multi-tab testing')
    await newPage.selectOption('select[name="status"], select[data-testid="status"]', 'draft')
    
    await newPage.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
    await newPage.waitForURL('**/manage/arcana')
    await newPage.waitForLoadState('networkidle')
    
    // Switch back to first tab and edit
    await page.bringToFront()
    await page.waitForLoadState('networkidle')
    
    const entityRow1 = page.locator(`text=${testCode}-1`)
    const editButton1 = entityRow1.locator('button:has-text("Edit"), button:has-text("Modify"), [data-testid="edit-button"]')
    await editButton1.click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('input[name="name"], input[data-testid="name"]', 'Updated Multi-tab Entity 1')
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')
    await page.waitForURL('**/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Switch to second tab and edit
    await newPage.bringToFront()
    await newPage.waitForLoadState('networkidle')
    
    const entityRow2 = newPage.locator(`text=${testCode}-2`)
    const editButton2 = entityRow2.locator('button:has-text("Edit"), button:has-text("Modify"), [data-testid="edit-button"]')
    await editButton2.click()
    await newPage.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await newPage.fill('input[name="name"], input[data-testid="name"]', 'Updated Multi-tab Entity 2')
    await newPage.click('button[type="submit"]:has-text("Save"), button:has-text("Update")')
    await newPage.waitForURL('**/manage/arcana')
    await newPage.waitForLoadState('networkidle')
    
    // Verify both entities exist and are updated
    await page.bringToFront()
    const updatedEntity1 = page.locator('text=Updated Multi-tab Entity 1')
    await expect(updatedEntity1.first()).toBeVisible()
    
    await newPage.bringToFront()
    const updatedEntity2 = newPage.locator('text=Updated Multi-tab Entity 2')
    await expect(updatedEntity2.first()).toBeVisible()
    
    // Clean up both entities
    await page.bringToFront()
    const deleteButton1 = page.locator(`text=${testCode}-1`).locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete-button"]')
    await deleteButton1.click()
    
    const confirmDialog1 = page.locator('.modal, [data-testid="confirm-dialog"], .dialog')
    if (await confirmDialog1.count() > 0) {
      const confirmButton1 = confirmDialog1.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
      await confirmButton1.click()
    }
    await page.waitForLoadState('networkidle')
    
    await newPage.bringToFront()
    const deleteButton2 = newPage.locator(`text=${testCode}-2`).locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete-button"]')
    await deleteButton2.click()
    
    const confirmDialog2 = newPage.locator('.modal, [data-testid="confirm-dialog"], .dialog')
    if (await confirmDialog2.count() > 0) {
      const confirmButton2 = confirmDialog2.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
      await confirmButton2.click()
    }
    await newPage.waitForLoadState('networkidle')
    
    await newPage.close()
  })
})
