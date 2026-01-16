import { test } from '@playwright/test'

test.describe('Debug Entity Creation', () => {
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

  test('debug entity creation and visibility', async ({ page }) => {
    const testCode = `debug-arcana-${Date.now()}`
    
    await page.goto('/manage')
    await page.waitForLoadState('networkidle')
    
    // Click on Arcana tab
    const arcanaTab = page.locator('[role="tab"], .tab').filter({ hasText: 'Arcana' }).first()
    await arcanaTab.click()
    await page.waitForTimeout(2000)
    
    // Take screenshot before creation
    await page.screenshot({ path: 'debug-before-creation.png', fullPage: true })
    
    // Create entity
    const createButton = page.locator('button, [role="button"]').filter({ hasText: /Create Arcana/i }).first()
    await createButton.click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('#v-0-48', testCode)
    await page.fill('#v-0-56', 'Debug Arcana Entity')
    await page.fill('#v-0-58', 'A debug arcana for testing')
    await page.fill('#v-0-57', 'Debug short description')
    await page.check('#v-0-52')
    
    await page.click('button:has-text("Save")')
    await page.waitForURL('**/manage')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot after creation
    await page.screenshot({ path: 'debug-after-creation.png', fullPage: true })
    
    // Look for the entity in different ways
    console.log('=== LOOKING FOR CREATED ENTITY ===')
    
    // Method 1: Direct text search
    const directSearch = page.locator(`text=${testCode}`)
    const directCount = await directSearch.count()
    console.log(`Direct text search found: ${directCount} elements`)
    
    // Method 2: Look in table rows
    const tableRows = page.locator('tr, [data-testid="row"], .row').all()
    console.log(`Found ${tableRows.length} table rows`)
    
    for (let i = 0; i < Math.min(tableRows.length, 10); i++) {
      const row = tableRows[i]
      const rowText = await row.textContent()
      if (rowText?.includes(testCode)) {
        console.log(`Found entity in row ${i}: "${rowText}"`)
      }
    }
    
    // Method 3: Use search input if available
    const searchInput = page.locator('input[type="search"], input[data-testid="search"], input[placeholder*="search" i]')
    if (await searchInput.count() > 0) {
      console.log('Found search input, using it...')
      await searchInput.fill(testCode)
      await page.waitForTimeout(2000)
      
      // Check again after search
      const afterSearch = page.locator(`text=${testCode}`)
      const afterSearchCount = await afterSearch.count()
      console.log(`After search found: ${afterSearchCount} elements`)
    }
    
    // Method 4: Look for any text containing our code
    const anyText = page.locator(`*:has-text("${testCode}")`)
    const anyCount = await anyText.count()
    console.log(`Any element with text found: ${anyCount} elements`)
    
    // Method 5: Check page content
    const bodyText = await page.locator('body').textContent()
    const hasEntity = bodyText?.includes(testCode)
    console.log(`Body contains entity: ${hasEntity}`)
    
    // Wait to see everything
    await page.waitForTimeout(3000)
  })
})
