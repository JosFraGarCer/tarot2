import { test } from '@playwright/test'

test.describe('Debug Status Dropdown', () => {
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

  test('debug status dropdown behavior', async ({ page }) => {
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
    await page.screenshot({ path: 'debug-status-dropdown.png', fullPage: true })
    
    // Try different approaches for status field
    console.log('=== TESTING STATUS FIELD APPROACHES ===')
    
    // Approach 1: Click the status button and wait
    console.log('1. Clicking status button and waiting...')
    const statusButton = page.locator('#v-0-51')
    await statusButton.click()
    await page.waitForTimeout(2000)
    
    // Look for dropdown content
    const dropdownContent = page.locator('[role="listbox"], [data-testid*="dropdown"], [class*="dropdown"]').all()
    console.log(`Found ${dropdownContent.length} dropdown elements`)
    
    for (let i = 0; i < dropdownContent.length; i++) {
      const element = dropdownContent[i]
      const text = await element.textContent()
      const isVisible = await element.isVisible()
      console.log(`  Dropdown ${i}: "${text}" - Visible: ${isVisible}`)
    }
    
    // Approach 2: Try to find and click on "draft" directly
    console.log('2. Looking for "draft" option...')
    const draftOption = page.locator('text=draft, [role="option"]').first()
    if (await draftOption.count() > 0) {
      console.log('Found draft option, clicking...')
      await draftOption.click()
      await page.waitForTimeout(1000)
    }
    
    // Approach 3: Try keyboard navigation
    console.log('3. Trying keyboard navigation...')
    await statusButton.focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    
    // Check current value
    const currentValue = await statusButton.getAttribute('aria-label')
    console.log(`Status button aria-label: "${currentValue}"`)
    
    // Look for any selected option
    const selectedOption = page.locator('[aria-selected="true"]').first()
    if (await selectedOption.count() > 0) {
      const selectedText = await selectedOption.textContent()
      console.log(`Selected option: "${selectedText}"`)
    }
    
    // Wait to see everything
    await page.waitForTimeout(3000)
  })
})
