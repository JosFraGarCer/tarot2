import { test } from '@playwright/test'

test.describe('UModal Button Test', () => {
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

  test('test umodal button behavior', async ({ page }) => {
    const testCode = `umodal-test-${Date.now()}`
    
    await page.goto('/manage')
    await page.waitForLoadState('networkidle')
    
    // Click on Arcana tab
    const arcanaTab = page.locator('[role="tab"], .tab').filter({ hasText: 'Arcana' }).first()
    await arcanaTab.click()
    await page.waitForTimeout(2000)
    
    // Create entity first
    console.log('Creating entity...')
    const createButton = page.locator('button, [role="button"]').filter({ hasText: /Create Arcana/i }).first()
    await createButton.click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('#v-0-48', testCode)
    await page.fill('#v-0-56', 'UModal Test')
    await page.fill('#v-0-58', 'Testing UModal button behavior')
    await page.fill('#v-0-57', 'Short desc')
    await page.check('#v-0-52')
    
    await page.click('button:has-text("Save")')
    await page.waitForURL('**/manage')
    await page.waitForLoadState('networkidle')
    
    console.log('Entity created, now testing edit button...')
    
    // Search for entity
    const arcanaSearchInput = page.locator('input[placeholder="Search"]').nth(3)
    await arcanaSearchInput.fill(testCode)
    await page.waitForTimeout(3000)
    
    // Take screenshot to see the buttons
    await page.screenshot({ path: 'umodal-buttons.png', fullPage: true })
    
    // Look for all buttons near our entity
    console.log('=== INVESTIGATING BUTTONS NEAR ENTITY ===')
    
    const entityElements = await page.locator(`*:has-text("${testCode}")`).all()
    console.log(`Found ${entityElements.length} elements containing test code`)
    
    for (let i = 0; i < Math.min(entityElements.length, 5); i++) {
      const element = entityElements[i]
      
      // Check buttons in this element
      const buttonsInElement = await element.locator('button').all()
      console.log(`Element ${i} has ${buttonsInElement.length} buttons`)
      
      for (let j = 0; j < buttonsInElement.length; j++) {
        const button = buttonsInElement[j]
        const isVisible = await button.isVisible()
        const buttonClass = await button.getAttribute('class')
        const buttonText = await button.textContent()
        
        console.log(`  Button ${j}: Visible=${isVisible}, Text="${buttonText}", Class="${buttonClass}"`)
        
        if (isVisible && buttonText === '') {
          console.log(`    -> This looks like an icon button, trying to click it...`)
          
          // Try clicking this button
          await button.click()
          
          // Wait a moment for modal to appear
          await page.waitForTimeout(1000)
          
          // Check if UModal opened
          const modalExists = await page.locator('[data-testid="form-modal"], .modal, [role="dialog"]').count() > 0
          console.log(`    Modal opened after click: ${modalExists}`)
          
          if (modalExists) {
            console.log('SUCCESS: Found the edit button!')
            
            // Take screenshot of modal
            await page.screenshot({ path: 'edit-modal-opened.png', fullPage: true })
            
            // Close modal and exit
            const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), [aria-label="Close"]')
            if (await closeButton.count() > 0) {
              await closeButton.first().click()
            }
            break
          } else {
            console.log('    Modal did not open, trying ESC to close any potential dialog')
            await page.keyboard.press('Escape')
            await page.waitForTimeout(500)
          }
        }
      }
    }
    
    await page.waitForTimeout(3000)
  })
})
