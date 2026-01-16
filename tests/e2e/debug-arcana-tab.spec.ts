import { test } from '@playwright/test'

test.describe('Debug Arcana Tab', () => {
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

  test('debug arcana tab and create button', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForLoadState('networkidle')
    
    // Click on Arcana tab
    const arcanaTab = page.locator('[role="tab"], .tab').filter({ hasText: 'Arcana' }).first()
    await arcanaTab.click()
    await page.waitForTimeout(2000) // Wait for tab content to load
    
    // Take screenshot
    await page.screenshot({ path: 'debug-arcana-tab.png', fullPage: true })
    
    // Look for create button
    const createButton = page.locator('button, [role="button"]').filter({ hasText: /create|add/i }).first()
    
    // Check button properties
    const isVisible = await createButton.isVisible()
    const isEnabled = await createButton.isEnabled()
    const text = await createButton.textContent()
    const classes = await createButton.getAttribute('class')
    const disabled = await createButton.getAttribute('aria-disabled')
    
    console.log(`Create button found:`)
    console.log(`  Text: "${text}"`)
    console.log(`  Visible: ${isVisible}`)
    console.log(`  Enabled: ${isEnabled}`)
    console.log(`  Disabled: ${disabled}`)
    console.log(`  Classes: ${classes}`)
    
    // Look for any other buttons
    const allButtons = await page.locator('button, [role="button"]').all()
    console.log(`\nFound ${allButtons.length} buttons total:`)
    
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const button = allButtons[i]
      const btnText = await button.textContent()
      const btnVisible = await button.isVisible()
      const btnEnabled = await button.isEnabled()
      
      if (btnVisible) {
        console.log(`  Button ${i}: "${btnText}" - Enabled: ${btnEnabled}`)
      }
    }
    
    // Check if there are any existing entities
    const existingEntities = await page.locator('text=/test-arcana/i').all()
    console.log(`\nFound ${existingEntities.length} existing test entities`)
    
    // Look for table or list
    const table = page.locator('table, [data-testid="table"], .table')
    const tableExists = await table.count() > 0
    console.log(`Table exists: ${tableExists}`)
    
    if (tableExists) {
      const tableRows = await table.locator('tr, [data-testid="row"], .row').all()
      console.log(`Found ${tableRows.length} table rows`)
    }
    
    // Check page content
    const bodyText = await page.locator('body').textContent()
    console.log(`\nBody contains "Create Arcana": ${bodyText?.includes('Create Arcana')}`)
    console.log(`Body contains "No data": ${bodyText?.includes('No data')}`)
    console.log(`Body contains "Empty": ${bodyText?.includes('Empty')}`)
    
    // Wait to see everything
    await page.waitForTimeout(3000)
  })
})
