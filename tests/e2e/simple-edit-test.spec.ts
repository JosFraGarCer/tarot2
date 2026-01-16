import { test } from '@playwright/test'

test.describe('Simple Edit Test', () => {
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

  test('simple edit workflow', async ({ page }) => {
    const testCode = `simple-edit-${Date.now()}`
    
    await page.goto('/manage')
    await page.waitForLoadState('networkidle')
    
    // Click on Arcana tab
    const arcanaTab = page.locator('[role="tab"], .tab').filter({ hasText: 'Arcana' }).first()
    await arcanaTab.click()
    await page.waitForTimeout(2000)
    
    // Create entity
    console.log('Creating entity...')
    const createButton = page.locator('button, [role="button"]').filter({ hasText: /Create Arcana/i }).first()
    await createButton.click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('#v-0-48', testCode)
    await page.fill('#v-0-56', 'Simple Edit Test')
    await page.fill('#v-0-58', 'Entity for simple edit test')
    await page.fill('#v-0-57', 'Short desc')
    await page.check('#v-0-52')
    
    await page.click('button:has-text("Save")')
    await page.waitForURL('**/manage')
    await page.waitForLoadState('networkidle')
    
    console.log('Entity created, now searching...')
    
    // Search for entity
    const arcanaSearchInput = page.locator('input[placeholder="Search"]').nth(3)
    await arcanaSearchInput.fill(testCode)
    await page.waitForTimeout(3000)
    
    // Take screenshot to see what's on screen
    await page.screenshot({ path: 'simple-edit-after-search.png', fullPage: true })
    
    // Check if entity exists
    const entityExists = await page.locator(`text=${testCode}`).count() > 0
    console.log(`Entity exists after search: ${entityExists}`)
    
    if (entityExists) {
      console.log('Entity found, looking for edit button...')
      
      // Get the parent element that contains both the entity text and buttons
      const entityContainer = page.locator(`*:has-text("${testCode}")`).first()
      const containerHTML = await entityContainer.innerHTML()
      console.log(`Entity container HTML: ${containerHTML.substring(0, 200)}...`)
      
      // Look for buttons in the container
      const buttonsInContainer = await entityContainer.locator('button').all()
      console.log(`Found ${buttonsInContainer.length} buttons in entity container`)
      
      if (buttonsInContainer.length > 0) {
        // Try clicking the first button (should be edit)
        await buttonsInContainer[0].click()
        console.log('Clicked first button, waiting for modal...')
        
        // Wait for edit modal
        const modalExists = await page.waitForSelector('form, [data-testid="form-modal"], .modal', { timeout: 5000 })
        if (modalExists) {
          console.log('Edit modal opened successfully!')
          
          // Edit the name
          await page.fill('#v-0-56', 'Edited Simple Test')
          await page.click('button:has-text("Save")')
          await page.waitForURL('**/manage')
          await page.waitForLoadState('networkidle')
          
          console.log('Edit completed successfully!')
        } else {
          console.log('Edit modal did not open')
        }
      }
    } else {
      console.log('Entity not found after search')
    }
    
    await page.waitForTimeout(3000)
  })
})
