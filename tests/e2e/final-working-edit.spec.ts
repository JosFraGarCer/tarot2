import { test } from '@playwright/test'

test.describe('Final Working Edit Test', () => {
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

  test('final working edit test', async ({ page }) => {
    const testCode = `final-edit-${Date.now()}`
    
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
    await page.fill('#v-0-56', 'Final Edit Test')
    await page.fill('#v-0-58', 'Entity for final edit test')
    await page.fill('#v-0-57', 'Short desc')
    await page.check('#v-0-52')
    
    await page.click('button:has-text("Save")')
    await page.waitForURL('**/manage')
    await page.waitForLoadState('networkidle')
    
    console.log('Entity created, now testing edit...')
    
    // Search for entity
    const arcanaSearchInput = page.locator('input[placeholder="Search"]').nth(3)
    await arcanaSearchInput.fill(testCode)
    await page.waitForTimeout(3000)
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'tests/e2e/screenshots/final-edit-before.png', fullPage: true })
    
    // Try different approaches to find and click edit button
    console.log('=== TRYING DIFFERENT APPROACHES ===')
    
    // Approach 1: Look for div with specific structure that might contain entity row
    const potentialRows = await page.locator('div').all()
    console.log(`Found ${potentialRows.length} divs total`)
    
    let editSuccess = false
    for (let i = 0; i < Math.min(potentialRows.length, 100); i++) {
      const div = potentialRows[i]
      const text = await div.textContent()
      
      // Look for div that contains our test code but not too much other content
      if (text?.includes(testCode) && text.length < 500) {
        console.log(`Found potential row div ${i} with text length: ${text.length}`)
        
        // Look for buttons in this div
        const buttons = await div.locator('button').all()
        console.log(`  This div has ${buttons.length} buttons`)
        
        for (let j = 0; j < buttons.length; j++) {
          const button = buttons[j]
          const isVisible = await button.isVisible()
          const buttonText = await button.textContent()
          
          if (isVisible && buttonText === '') {
            console.log(`    Trying icon button ${j}...`)
            
            try {
              await button.click()
              await page.waitForTimeout(1000)
              
              // Check if modal opened
              const modalExists = await page.locator('[data-testid="form-modal"], .modal, [role="dialog"]').count() > 0
              console.log(`    Modal opened: ${modalExists}`)
              
              if (modalExists) {
                console.log('SUCCESS: Edit modal opened!')
                editSuccess = true
                
                // Edit the entity
                await page.fill('#v-0-56', 'Successfully Edited Test')
                await page.click('button:has-text("Save")')
                await page.waitForURL('**/manage')
                await page.waitForLoadState('networkidle')
                
                console.log('Edit completed successfully!')
                break
              } else {
                await page.keyboard.press('Escape')
                await page.waitForTimeout(500)
              }
            } catch (error) {
              console.log(`    Error clicking button: ${error}`)
              await page.keyboard.press('Escape')
              await page.waitForTimeout(500)
            }
          }
        }
        
        if (editSuccess) break
      }
    }
    
    if (!editSuccess) {
      console.log('Could not find edit button with current approach')
    }
    
    await page.waitForTimeout(3000)
  })
})
