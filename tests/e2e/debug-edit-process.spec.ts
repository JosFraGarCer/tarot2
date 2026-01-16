import { test } from '@playwright/test'

test.describe('Debug Edit Process', () => {
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

  test('debug edit process step by step', async ({ page }) => {
    const testCode = `edit-test-${Date.now()}`
    
    await page.goto('/manage')
    await page.waitForLoadState('networkidle')
    
    // Click on Arcana tab
    const arcanaTab = page.locator('[role="tab"], .tab').filter({ hasText: 'Arcana' }).first()
    await arcanaTab.click()
    await page.waitForTimeout(2000)
    
    // Create entity first
    const createButton = page.locator('button, [role="button"]').filter({ hasText: /Create Arcana/i }).first()
    await createButton.click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('#v-0-48', testCode)
    await page.fill('#v-0-56', 'Edit Test Entity')
    await page.fill('#v-0-58', 'Entity for edit testing')
    await page.fill('#v-0-57', 'Short description')
    await page.check('#v-0-52')
    
    await page.click('button:has-text("Save")')
    await page.waitForURL('**/manage')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot after creation
    await page.screenshot({ path: 'debug-edit-after-creation.png', fullPage: true })
    
    // Search for the entity
    const arcanaSearchInput = page.locator('input[placeholder="Search"]').nth(3) // 4th search input (Arcana)
    if (await arcanaSearchInput.count() > 0) {
      console.log('Found Arcana search input, filling with test code...')
      await arcanaSearchInput.fill(testCode)
      await page.waitForTimeout(3000) // Wait for search to complete
    }
    
    // Take screenshot after search
    await page.screenshot({ path: 'debug-edit-after-search.png', fullPage: true })
    
    // Look for entity in different ways
    console.log('=== LOOKING FOR ENTITY TO EDIT ===')
    
    // Method 1: Direct text search
    const directSearch = page.locator(`text=${testCode}`)
    const directCount = await directSearch.count()
    console.log(`Direct text search found: ${directCount} elements`)
    
    // Method 2: Look for any buttons near the entity
    const entityText = page.locator(`*:has-text("${testCode}")`)
    const entityCount = await entityText.count()
    console.log(`Entity elements found: ${entityCount}`)
    
    if (entityCount > 0) {
      for (let i = 0; i < entityCount; i++) {
        const element = entityText.nth(i)
        const parent = element.locator('..')
        const buttons = await parent.locator('button').all()
        console.log(`Entity element ${i} has ${buttons.length} buttons nearby`)
        
        for (let j = 0; j < buttons.length; j++) {
          const button = buttons[j]
          const buttonText = await button.textContent()
          const isVisible = await button.isVisible()
          console.log(`  Button ${j}: "${buttonText}" - Visible: ${isVisible}`)
        }
      }
    }
    
    // Method 3: Look for all edit buttons
    const allEditButtons = page.locator('button:has-text(/edit|modify/i)').all()
    console.log(`Found ${allEditButtons.length} edit buttons total`)
    
    // Wait to see everything
    await page.waitForTimeout(3000)
  })
})
