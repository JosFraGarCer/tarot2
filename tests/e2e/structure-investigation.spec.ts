import { test } from '@playwright/test'

test.describe('Structure Investigation', () => {
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

  test('investigate arcana list structure', async ({ page }) => {
    const testCode = `structure-test-${Date.now()}`
    
    await page.goto('/manage')
    await page.waitForLoadState('networkidle')
    
    // Click on Arcana tab
    const arcanaTab = page.locator('[role="tab"], .tab').filter({ hasText: 'Arcana' }).first()
    await arcanaTab.click()
    await page.waitForTimeout(2000)
    
    // Create entity
    const createButton = page.locator('button, [role="button"]').filter({ hasText: /Create Arcana/i }).first()
    await createButton.click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('#v-0-48', testCode)
    await page.fill('#v-0-56', 'Structure Test')
    await page.fill('#v-0-58', 'Entity for structure investigation')
    await page.fill('#v-0-57', 'Short desc')
    await page.check('#v-0-52')
    
    await page.click('button:has-text("Save")')
    await page.waitForURL('**/manage')
    await page.waitForLoadState('networkidle')
    
    // Search for entity
    const arcanaSearchInput = page.locator('input[placeholder="Search"]').nth(3)
    await arcanaSearchInput.fill(testCode)
    await page.waitForTimeout(3000)
    
    // Take screenshot
    await page.screenshot({ path: 'structure-investigation.png', fullPage: true })
    
    console.log('=== INVESTIGATING LIST STRUCTURE ===')
    
    // Look for any element containing our test code
    const elementsWithCode = await page.locator(`*:has-text("${testCode}")`).all()
    console.log(`Found ${elementsWithCode.length} elements containing test code`)
    
    for (let i = 0; i < Math.min(elementsWithCode.length, 5); i++) {
      const element = elementsWithCode[i]
      const tagName = await element.evaluate(el => el.tagName)
      const className = await element.getAttribute('class')
      const parent = element.locator('..')
      const parentTag = await parent.evaluate(el => el.tagName)
      const parentClass = await parent.getAttribute('class')
      
      console.log(`Element ${i}: <${tagName}> class="${className}"`)
      console.log(`  Parent: <${parentTag}> class="${parentClass}"`)
      
      // Look for buttons in the parent
      const buttonsInParent = await parent.locator('button').all()
      console.log(`  Buttons in parent: ${buttonsInParent.length}`)
      
      for (let j = 0; j < Math.min(buttonsInParent.length, 3); j++) {
        const button = buttonsInParent[j]
        const isVisible = await button.isVisible()
        const buttonClass = await button.getAttribute('class')
        console.log(`    Button ${j}: Visible=${isVisible} class="${buttonClass}"`)
      }
    }
    
    // Look for common list patterns
    const listItems = await page.locator('li, [data-testid*="item"], [class*="item"], [class*="row"]').all()
    console.log(`\nFound ${listItems.length} potential list items`)
    
    // Look for div structures that might be list items
    const divs = await page.locator('div').all()
    console.log(`Found ${divs.length} divs total`)
    
    let divsWithCode = 0
    for (let i = 0; i < Math.min(divs.length, 50); i++) {
      const div = divs[i]
      const text = await div.textContent()
      if (text?.includes(testCode)) {
        divsWithCode++
        const className = await div.getAttribute('class')
        console.log(`Div ${i} with code: class="${className}"`)
        
        // Check buttons in this div
        const buttons = await div.locator('button').all()
        console.log(`  Buttons: ${buttons.length}`)
      }
    }
    
    console.log(`Total divs containing test code: ${divsWithCode}`)
    
    await page.waitForTimeout(3000)
  })
})
