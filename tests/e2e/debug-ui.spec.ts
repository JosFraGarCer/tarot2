import { test, expect } from '@playwright/test'

test.describe('Debug UI Structure', () => {
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

  test('debug manage arcana page structure', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Take a screenshot to see the actual UI
    await page.screenshot({ path: 'debug-manage-arcana.png', fullPage: true })
    
    // Log all buttons found
    const buttons = await page.locator('button, [role="button"]').all()
    console.log(`Found ${buttons.length} buttons:`)
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i]
      const text = await button.textContent()
      const isVisible = await button.isVisible()
      console.log(`Button ${i}: "${text}" - Visible: ${isVisible}`)
    }
    
    // Log all tabs found
    const tabs = await page.locator('[role="tab"], .tab, [data-testid*="tab"]').all()
    console.log(`Found ${tabs.length} tabs:`)
    
    for (let i = 0; i < Math.min(tabs.length, 10); i++) {
      const tab = tabs[i]
      const text = await tab.textContent()
      const isVisible = await tab.isVisible()
      console.log(`Tab ${i}: "${text}" - Visible: ${isVisible}`)
    }
    
    // Check for UTab specifically
    const uTab = page.locator('[data-testid="utab"], .utab, [class*="tab"]')
    if (await uTab.count() > 0) {
      console.log('Found UTab elements')
      const uTabContent = await uTab.first().innerHTML()
      console.log('UTab HTML snippet:', uTabContent.substring(0, 200))
    }
    
    // Look for any create/add/new elements - fix CSS selector
    const createElements = page.locator('text=/create|add|new/i')
    const createCount = await createElements.count()
    console.log(`Found ${createCount} elements with create/add/new text`)
    
    if (createCount > 0) {
      for (let i = 0; i < Math.min(createCount, 5); i++) {
        const element = createElements.nth(i)
        const tagName = await element.evaluate(el => el.tagName)
        const text = await element.textContent()
        console.log(`Create element ${i}: <${tagName}> "${text}"`)
      }
    }
    
    // Check if page shows 404 or error
    const pageContent = await page.locator('body').textContent()
    if (pageContent?.includes('404') || pageContent?.includes('not found')) {
      console.log('PAGE RETURNS 404 - Route does not exist')
    }
    
    // Check for navigation links that might show available manage routes
    const navLinks = await page.locator('a[href*="manage"]').all()
    console.log(`Found ${navLinks.length} manage links:`)
    
    for (let i = 0; i < Math.min(navLinks.length, 10); i++) {
      const link = navLinks[i]
      const href = await link.getAttribute('href')
      const text = await link.textContent()
      console.log(`Manage link ${i}: "${text}" -> ${href}`)
    }
    
    // Check page title and structure
    const pageTitle = await page.title()
    console.log(`Page title: ${pageTitle}`)
    
    const bodyText = await page.locator('body').textContent()
    console.log(`Body contains arcana: ${bodyText?.toLowerCase().includes('arcana')}`)
    
    // Wait a bit to see everything
    await page.waitForTimeout(3000)
  })
})
