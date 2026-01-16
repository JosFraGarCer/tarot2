import { test } from '@playwright/test'

test.describe('Precise Edit Test', () => {
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

  test('precise edit workflow', async ({ page }) => {
    const testCode = `precise-edit-${Date.now()}`
    
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
    await page.fill('#v-0-56', 'Precise Edit Test')
    await page.fill('#v-0-58', 'Entity for precise edit test')
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
    
    // Take screenshot to see structure
    await page.screenshot({ path: 'precise-edit-after-search.png', fullPage: true })
    
    // Look for entity in table rows specifically
    console.log('Looking for entity in table structure...')
    
    // Method 1: Look for table rows containing our text
    const tableRows = await page.locator('tr, [data-testid="row"], .row').all()
    console.log(`Found ${tableRows.length} table rows`)
    
    let targetRow = null
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i]
      const rowText = await row.textContent()
      if (rowText?.includes(testCode)) {
        console.log(`Found entity in row ${i}: "${rowText?.substring(0, 100)}..."`)
        targetRow = row
        break
      }
    }
    
    if (targetRow) {
      // Look for buttons in this specific row
      const buttonsInRow = await targetRow.locator('button').all()
      console.log(`Found ${buttonsInRow.length} buttons in target row`)
      
      for (let i = 0; i < buttonsInRow.length; i++) {
        const button = buttonsInRow[i]
        const isVisible = await button.isVisible()
        console.log(`Button ${i}: Visible: ${isVisible}`)
        
        if (isVisible) {
          console.log(`Clicking button ${i}...`)
          await button.click()
          
          // Wait for modal
          const modalExists = await page.waitForSelector('form, [data-testid="form-modal"], .modal', { timeout: 3000 })
          if (modalExists) {
            console.log('Edit modal opened successfully!')
            
            // Edit the name
            await page.fill('#v-0-56', 'Edited Precise Test')
            await page.click('button:has-text("Save")')
            await page.waitForURL('**/manage')
            await page.waitForLoadState('networkidle')
            
            console.log('Edit completed successfully!')
            break
          } else {
            console.log('Button did not open edit modal, trying next button...')
          }
        }
      }
    } else {
      console.log('Entity row not found')
    }
    
    await page.waitForTimeout(3000)
  })
})
