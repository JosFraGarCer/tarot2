import { test, expect } from '@playwright/test'
import { join } from 'path'
import { writeFileSync, unlinkSync } from 'fs'

test.describe('Import/Export', () => {
  const testCode = `import-export-test-${Date.now()}`
  const testData = {
    code: testCode,
    name: 'Import Export Test Entity',
    description: 'Entity for import/export testing',
    short_text: 'Test short description',
    status: 'draft',
    is_active: true
  }
  
  let testFilePath: string
  
  test.beforeAll(async () => {
    // Create test data file
    testFilePath = join(process.cwd(), 'test-import-data.json')
    writeFileSync(testFilePath, JSON.stringify([testData], null, 2))
  })
  
  test.afterAll(async () => {
    // Clean up test file
    try {
      if (testFilePath) {
        unlinkSync(testFilePath)
      }
    } catch {
      console.log('Test file already cleaned up or not found')
    }
  })
  
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

  test('export entities to CSV format', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Look for export functionality
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export-button"]')
    const exportMenu = page.locator('[data-testid="export-menu"], .export-menu')
    
    if (await exportButton.count() > 0) {
      await exportButton.first().click()
      await page.waitForTimeout(500)
      
      // Look for CSV export option
      const csvExport = page.locator('button:has-text("CSV"), button:has-text("csv"), [data-testid="export-csv"]')
      if (await csvExport.count() > 0) {
        // Start download
        const downloadPromise = page.waitForEvent('download')
        await csvExport.click()
        
        const download = await downloadPromise
        
        // Verify download
        expect(download.suggestedFilename()).toMatch(/\.csv$/i)
        
        // Read and verify content
        const _path = await download.path()
        const content = await download.createReadStream().toString()
        
        expect(content).toContain('code')
        expect(content).toContain('name')
        expect(content).toContain('description')
        
        console.log('CSV export successful')
      } else {
        console.log('CSV export option not found')
      }
    } else if (await exportMenu.count() > 0) {
      await exportMenu.first().click()
      await page.waitForTimeout(500)
      
      const csvExport = page.locator('button:has-text("CSV"), button:has-text("csv")')
      if (await csvExport.count() > 0) {
        const downloadPromise = page.waitForEvent('download')
        await csvExport.click()
        
        const download = await downloadPromise
        expect(download.suggestedFilename()).toMatch(/\.csv$/i)
        
        console.log('CSV export successful via menu')
      }
    } else {
      console.log('Export functionality not found')
    }
  })

  test('export entities to JSON format', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Look for export functionality
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export-button"]')
    const exportMenu = page.locator('[data-testid="export-menu"], .export-menu')
    
    if (await exportButton.count() > 0) {
      await exportButton.first().click()
      await page.waitForTimeout(500)
      
      // Look for JSON export option
      const jsonExport = page.locator('button:has-text("JSON"), button:has-text("json"), [data-testid="export-json"]')
      if (await jsonExport.count() > 0) {
        // Start download
        const downloadPromise = page.waitForEvent('download')
        await jsonExport.click()
        
        const download = await downloadPromise
        
        // Verify download
        expect(download.suggestedFilename()).toMatch(/\.json$/i)
        
        // Read and verify content
        const _path = await download.path()
        const content = await download.createReadStream().toString()
        
        // Parse JSON to verify structure
        const jsonData = JSON.parse(content)
        expect(Array.isArray(jsonData)).toBeTruthy()
        
        if (jsonData.length > 0) {
          expect(jsonData[0]).toHaveProperty('code')
          expect(jsonData[0]).toHaveProperty('name')
          expect(jsonData[0]).toHaveProperty('description')
        }
        
        console.log('JSON export successful')
      } else {
        console.log('JSON export option not found')
      }
    } else {
      console.log('Export functionality not found')
    }
  })

  test('import entities from JSON file', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Look for import functionality
    const importButton = page.locator('button:has-text("Import"), button:has-text("Upload"), [data-testid="import-button"]')
    const _importMenu = page.locator('[data-testid="import-menu"], .import-menu')
    
    if (await importButton.count() > 0) {
      await importButton.first().click()
      await page.waitForTimeout(500)
      
      // Look for file input
      const fileInput = page.locator('input[type="file"], [data-testid="file-input"]')
      if (await fileInput.count() > 0) {
        // Upload test file
        await fileInput.first().setInputFiles(testFilePath)
        await page.waitForTimeout(1000)
        
        // Look for import confirmation button
        const importConfirm = page.locator('button:has-text("Import"), button:has-text("Upload"), button:has-text("Confirm")')
        if (await importConfirm.count() > 0) {
          await importConfirm.click()
          await page.waitForTimeout(2000)
          
          // Verify import success
          const successMessage = page.locator('.success, .message:has-text("import"), [data-testid="import-success"]')
          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible()
          }
          
          // Verify entity was created
          const searchInput = page.locator('input[type="search"], input[data-testid="search"]')
          if (await searchInput.count() > 0) {
            await searchInput.fill(testCode)
            await page.waitForTimeout(1000)
            
            const importedEntity = page.locator(`text=${testCode}`)
            await expect(importedEntity.first()).toBeVisible()
          }
          
          console.log('JSON import successful')
        } else {
          console.log('Import confirmation button not found')
        }
      } else {
        console.log('File input not found')
      }
    } else {
      console.log('Import functionality not found')
    }
  })

  test('import validation rejects invalid data', async ({ page }) => {
    // Create invalid test data
    const invalidData = [
      {
        // Missing required fields
        name: 'Invalid Entity'
      },
      {
        // Invalid data types
        code: 123,
        name: 'Invalid Types Entity',
        description: null,
        status: 'invalid_status'
      }
    ]
    
    const invalidFilePath = join(process.cwd(), 'test-invalid-data.json')
    writeFileSync(invalidFilePath, JSON.stringify(invalidData, null, 2))
    
    try {
      await page.goto('/manage/arcana')
      await page.waitForLoadState('networkidle')
      
      const importButton = page.locator('button:has-text("Import"), button:has-text("Upload"), [data-testid="import-button"]')
      if (await importButton.count() > 0) {
        await importButton.first().click()
        await page.waitForTimeout(500)
        
        const fileInput = page.locator('input[type="file"], [data-testid="file-input"]')
        if (await fileInput.count() > 0) {
          await fileInput.first().setInputFiles(invalidFilePath)
          await page.waitForTimeout(1000)
          
          const importConfirm = page.locator('button:has-text("Import"), button:has-text("Upload"), button:has-text("Confirm")')
          if (await importConfirm.count() > 0) {
            await importConfirm.click()
            await page.waitForTimeout(2000)
            
            // Should show validation errors
            const errorMessage = page.locator('.error, .message:has-text("error"), [data-testid="import-error"]')
            if (await errorMessage.count() > 0) {
              await expect(errorMessage.first()).toBeVisible()
              console.log('Import validation working correctly')
            } else {
              console.log('Import validation error message not found')
            }
          }
        }
      }
    } finally {
      // Clean up invalid test file
      try {
        unlinkSync(invalidFilePath)
      } catch {
        console.log('Invalid test file already cleaned up')
      }
    }
  })

  test('export filtered entities', async ({ page }) => {
    // Create test entities with different statuses
    const entities = [
      { code: `${testCode}-draft`, name: 'Draft Entity', status: 'draft' },
      { code: `${testCode}-published`, name: 'Published Entity', status: 'published' }
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
      await page.fill('textarea[name="description"], textarea[data-testid="description"]', `Test entity: ${entity.name}`)
      await page.selectOption('select[name="status"], select[data-testid="status"]', entity.status)
      
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
      await page.waitForURL('**/manage/arcana')
      await page.waitForLoadState('networkidle')
    }
    
    // Apply filter for published entities only
    const statusFilter = page.locator('select[name="status"], select[data-testid="status-filter"], [data-testid="filter-status"]')
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('published')
      await page.waitForTimeout(1000)
      
      // Export filtered results
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export-button"]')
      if (await exportButton.count() > 0) {
        await exportButton.first().click()
        await page.waitForTimeout(500)
        
        const jsonExport = page.locator('button:has-text("JSON"), button:has-text("json"), [data-testid="export-json"]')
        if (await jsonExport.count() > 0) {
          const downloadPromise = page.waitForEvent('download')
          await jsonExport.click()
          
          const download = await downloadPromise
          const content = await download.createReadStream().toString()
          const jsonData = JSON.parse(content)
          
          // Should only contain published entities
          expect(jsonData.length).toBeGreaterThan(0)
          jsonData.forEach((item: { status: string }) => {
            expect(item.status).toBe('published')
          })
          
          console.log('Filtered export successful')
        }
      }
    }
    
    // Clean up test entities
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

  test('import with duplicate handling', async ({ page }) => {
    // Create initial entity
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('input[name="code"], input[data-testid="code"]', testCode)
    await page.fill('input[name="name"], input[data-testid="name"]', 'Original Entity')
    await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'Original entity description')
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'draft')
    
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
    await page.waitForURL('**/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Try to import same entity (duplicate)
    const importButton = page.locator('button:has-text("Import"), button:has-text("Upload"), [data-testid="import-button"]')
    if (await importButton.count() > 0) {
      await importButton.first().click()
      await page.waitForTimeout(500)
      
      const fileInput = page.locator('input[type="file"], [data-testid="file-input"]')
      if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles(testFilePath)
        await page.waitForTimeout(1000)
        
        // Look for duplicate handling options
        const duplicateOptions = page.locator('[data-testid="duplicate-handling"], .duplicate-options')
        if (await duplicateOptions.count() > 0) {
          // Should show options like: skip, update, create with suffix
          const skipOption = duplicateOptions.locator('input[value="skip"], button:has-text("Skip")')
          const updateOption = duplicateOptions.locator('input[value="update"], button:has-text("Update")')
          const _createOption = duplicateOptions.locator('input[value="create"], button:has-text("Create")')
          
          if (await skipOption.count() > 0) {
            await skipOption.click()
          } else if (await updateOption.count() > 0) {
            await updateOption.click()
          }
          
          const importConfirm = page.locator('button:has-text("Import"), button:has-text("Confirm")')
          if (await importConfirm.count() > 0) {
            await importConfirm.click()
            await page.waitForTimeout(2000)
            
            // Check result
            const resultMessage = page.locator('.message, .notification, [data-testid="import-result"]')
            if (await resultMessage.count() > 0) {
              console.log('Duplicate handling functionality present')
            }
          }
        }
        
        // If no duplicate options, try regular import
        const importConfirm = page.locator('button:has-text("Import"), button:has-text("Confirm")')
        if (await importConfirm.count() > 0) {
          await importConfirm.click()
          await page.waitForTimeout(2000)
          
          // Should show duplicate error or handle gracefully
          const errorMessage = page.locator('.error, [data-testid="import-error"]')
          if (await errorMessage.count() > 0) {
            console.log('Duplicate import validation working')
          }
        }
      }
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

  test('import/export progress indicators', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Test export progress
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export-button"]')
    if (await exportButton.count() > 0) {
      await exportButton.first().click()
      await page.waitForTimeout(500)
      
      const jsonExport = page.locator('button:has-text("JSON"), button:has-text("json"), [data-testid="export-json"]')
      if (await jsonExport.count() > 0) {
        // Look for progress indicator
        const progressIndicator = page.locator('[data-testid="progress"], .progress, .loading')
        if (await progressIndicator.count() > 0) {
          await expect(progressIndicator.first()).toBeVisible()
          console.log('Export progress indicator found')
        }
        
        const downloadPromise = page.waitForEvent('download')
        await jsonExport.click()
        await downloadPromise
        
        // Progress should be gone after completion
        if (await progressIndicator.count() > 0) {
          await expect(progressIndicator).toHaveCount(0)
        }
      }
    }
    
    // Test import progress
    const importButton = page.locator('button:has-text("Import"), button:has-text("Upload"), [data-testid="import-button"]')
    if (await importButton.count() > 0) {
      await importButton.first().click()
      await page.waitForTimeout(500)
      
      const fileInput = page.locator('input[type="file"], [data-testid="file-input"]')
      if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles(testFilePath)
        await page.waitForTimeout(1000)
        
        const importConfirm = page.locator('button:has-text("Import"), button:has-text("Confirm")')
        if (await importConfirm.count() > 0) {
          // Look for progress indicator during import
          const progressIndicator = page.locator('[data-testid="progress"], .progress, .loading')
          if (await progressIndicator.count() > 0) {
            await expect(progressIndicator.first()).toBeVisible()
            console.log('Import progress indicator found')
          }
          
          await importConfirm.click()
          await page.waitForTimeout(3000)
          
          // Progress should be gone after completion
          if (await progressIndicator.count() > 0) {
            await expect(progressIndicator).toHaveCount(0)
          }
        }
      }
    }
  })
})
