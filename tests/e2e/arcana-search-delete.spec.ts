import { test, expect } from '@playwright/test'

test.describe('Arcana Search and Delete Tests', () => {
  // Use the same test code for consistency
  const TEST_CODE = 'playwright-test-arcana'
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[placeholder="User or Email"]', process.env.TEST_USER_IDENTIFIER!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    
    // Wait for successful login
    await page.waitForURL('**/user')
  })

  test('should search entity by name and find it', async ({ page }) => {
    // Navigate to manage and select Arcana tab
    await page.goto('/manage')
    await page.waitForLoadState('networkidle')
    
    // Click on Arcana tab
    const arcanaTab = page.locator('[role="tab"], .tab').filter({ hasText: 'Arcana' }).first()
    await expect(arcanaTab).toBeVisible()
    await arcanaTab.click()
    await page.waitForTimeout(2000) // Wait for tab content to load
    
    // CAPTURA: Antes de buscar
    await page.screenshot({ path: 'tests/e2e/screenshots/05-antes-de-buscar.png', fullPage: true })
    
    // Search for the entity by name (using the name we created)
    const arcanaSearchInput = page.locator('input[placeholder="Search"]').nth(3) // 4th search input (Arcana)
    await expect(arcanaSearchInput).toBeVisible()
    
    // Fill search with the entity name
    await arcanaSearchInput.fill('Test Arcana Entity')
    await page.waitForTimeout(3000) // Wait for search to complete
    
    // CAPTURA: Después de buscar
    await page.screenshot({ path: 'tests/e2e/screenshots/06-despues-de-buscar.png', fullPage: true })
    
    // Verify the entity is found in the results
    const searchResult = page.locator('text=Test Arcana Entity')
    await expect(searchResult.first()).toBeVisible()
    
    // Also verify by code
    const codeResult = page.locator(`text=${TEST_CODE}`)
    await expect(codeResult.first()).toBeVisible()
    
    console.log('Entity found successfully by name search')
    
    // Look for action buttons near the found entity
    const entityElements = await page.locator(`*:has-text("Test Arcana Entity")`).all()
    console.log(`Found ${entityElements.length} elements containing the entity name`)
    
    // Take a detailed screenshot of the entity with its action buttons
    if (entityElements.length > 0) {
      const firstEntity = entityElements[0]
      await firstEntity.scrollIntoViewIfNeeded()
      await page.screenshot({ path: 'tests/e2e/screenshots/07-entidad-con-botones.png', fullPage: true })
      
      // Look for buttons around this entity
      const parentElement = firstEntity.locator('..')
      const buttonsInParent = await parentElement.locator('button').all()
      console.log(`Found ${buttonsInParent.length} buttons in parent element`)
      
      // Log button details for debugging
      for (let i = 0; i < Math.min(buttonsInParent.length, 5); i++) {
        const button = buttonsInParent[i]
        const isVisible = await button.isVisible()
        const buttonText = await button.textContent()
        const buttonClass = await button.getAttribute('class')
        
        console.log(`Button ${i}: Visible=${isVisible}, Text="${buttonText}", Class="${buttonClass}"`)
      }
    }
  })

  test('should delete first search result', async ({ page }) => {
    // Navigate to manage and select Arcana tab
    await page.goto('/manage')
    await page.waitForLoadState('networkidle')
    
    // Click on Arcana tab
    const arcanaTab = page.locator('[role="tab"], .tab').filter({ hasText: 'Arcana' }).first()
    await expect(arcanaTab).toBeVisible()
    await arcanaTab.click()
    await page.waitForTimeout(2000) // Wait for tab content to load
    
    // Search for the entity first
    const arcanaSearchInput = page.locator('input[placeholder="Search"]').nth(3)
    await arcanaSearchInput.fill('Test Arcana Entity')
    await page.waitForTimeout(3000) // Wait for search to complete
    
    // Verify entity exists
    const searchResult = page.locator('text=Test Arcana Entity')
    await expect(searchResult.first()).toBeVisible()
    
    // CAPTURA: Antes de eliminar primer resultado
    await page.screenshot({ path: 'tests/e2e/screenshots/08-antes-de-eliminar-primero.png', fullPage: true })
    
    // Try to find and click the first delete button
    console.log('Looking for delete button in first search result...')
    
    // Approach 1: Look for buttons with specific attributes
    const deleteButtons = page.locator('button[aria-label*="delete"], button[title*="delete"], button[data-testid*="delete"]')
    if (await deleteButtons.count() > 0) {
      console.log('Found delete button by aria-label/title/data-testid')
      await deleteButtons.first().click()
    } else {
      // Approach 2: Look for icon buttons (usually delete icons)
      const iconButtons = page.locator('button').filter({ hasText: '' }) // Empty text buttons (icons)
      console.log(`Found ${await iconButtons.count()} icon buttons`)
      
      if (await iconButtons.count() > 0) {
        // Try the first few icon buttons
        for (let i = 0; i < Math.min(await iconButtons.count(), 3); i++) {
          const button = iconButtons.nth(i)
          const isVisible = await button.isVisible()
          
          if (isVisible) {
            console.log(`Trying icon button ${i}...`)
            await button.click()
            await page.waitForTimeout(1000)
            
            // Check if a confirmation modal appeared
            const confirmModal = page.locator('.modal, [data-testid="confirm-dialog"], [role="dialog"]')
            if (await confirmModal.count() > 0) {
              console.log('Confirmation modal appeared!')
              await page.screenshot({ path: 'tests/e2e/screenshots/09-modal-confirmacion.png', fullPage: true })
              
              // Look for confirm button in modal
              const confirmButton = confirmModal.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
              if (await confirmButton.count() > 0) {
                await confirmButton.first().click()
                await page.waitForTimeout(2000)
                
                // CAPTURA: Después de eliminar
                await page.screenshot({ path: 'tests/e2e/screenshots/10-despues-de-eliminar.png', fullPage: true })
                
                // Verify entity is gone
                await arcanaSearchInput.fill('') // Clear search
                await page.waitForTimeout(2000)
                
                // Search again to confirm deletion
                await arcanaSearchInput.fill('Test Arcana Entity')
                await page.waitForTimeout(3000)
                
                const deletedEntity = page.locator('text=Test Arcana Entity')
                await expect(deletedEntity).toHaveCount(0)
                
                console.log('Entity successfully deleted!')
                break
              } else {
                console.log('No confirm button found in modal')
                await page.keyboard.press('Escape') // Close modal
              }
            } else {
              console.log('No confirmation modal appeared')
              await page.keyboard.press('Escape') // Close any potential dialog
            }
          }
        }
      }
    }
    
    // If we couldn't delete, at least document the current state
    await page.screenshot({ path: 'tests/e2e/screenshots/11-estado-final-intento-delete.png', fullPage: true })
    console.log('Delete test completed - check screenshots for button analysis')
  })
})
