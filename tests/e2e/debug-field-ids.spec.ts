import { test } from '@playwright/test'

test.describe('Debug Field IDs', () => {
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

  test('debug actual field IDs in Arcana form', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForLoadState('networkidle')
    
    // Click on Arcana tab
    const arcanaTab = page.locator('[role="tab"], .tab').filter({ hasText: 'Arcana' }).first()
    await arcanaTab.click()
    await page.waitForTimeout(2000)
    
    // Click create button
    const createButton = page.locator('button, [role="button"]').filter({ hasText: /Create Arcana/i }).first()
    await createButton.click()
    
    // Wait for modal
    await page.waitForSelector('form, [data-testid="form-modal"], .modal', { timeout: 10000 })
    
    // Take screenshot
    await page.screenshot({ path: 'debug-field-ids.png', fullPage: true })
    
    // Look for ALL elements with IDs
    const elementsWithIds = await page.locator('[id]').all()
    console.log(`Found ${elementsWithIds.length} elements with IDs:`)
    
    for (let i = 0; i < elementsWithIds.length; i++) {
      const element = elementsWithIds[i]
      const id = await element.getAttribute('id')
      const tagName = await element.evaluate(el => el.tagName)
      const isVisible = await element.isVisible()
      const text = await element.textContent()
      
      console.log(`  Element ${i}: <${tagName}> id="${id}" - Visible: ${isVisible} - Text: "${text?.substring(0, 50)}..."`)
    }
    
    // Look specifically for status-related elements
    const statusElements = await page.locator('[id*="status"], [id*="Status"], [id*="status"]').all()
    console.log(`\nFound ${statusElements.length} status-related elements:`)
    
    for (let i = 0; i < statusElements.length; i++) {
      const element = statusElements[i]
      const id = await element.getAttribute('id')
      const tagName = await element.evaluate(el => el.tagName)
      const isVisible = await element.isVisible()
      const text = await element.textContent()
      
      console.log(`  Status element ${i}: <${tagName}> id="${id}" - Visible: ${isVisible} - Text: "${text?.substring(0, 50)}..."`)
    }
    
    // Look for is_active elements
    const activeElements = await page.locator('[id*="active"], [id*="Active"], [id*="is_active"]').all()
    console.log(`\nFound ${activeElements.length} active-related elements:`)
    
    for (let i = 0; i < activeElements.length; i++) {
      const element = activeElements[i]
      const id = await element.getAttribute('id')
      const tagName = await element.evaluate(el => el.tagName)
      const isVisible = await element.isVisible()
      const text = await element.textContent()
      
      console.log(`  Active element ${i}: <${tagName}> id="${id}" - Visible: ${isVisible} - Text: "${text?.substring(0, 50)}..."`)
    }
    
    // Wait to see everything
    await page.waitForTimeout(3000)
  })
})
