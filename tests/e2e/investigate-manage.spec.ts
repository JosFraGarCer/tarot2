import { test } from '@playwright/test'

test.describe('Investigate Manage Page Structure', () => {
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

  test('investigate /manage page structure', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot
    await page.screenshot({ path: 'debug-manage-page.png', fullPage: true })
    
    // Look for tabs
    const tabs = await page.locator('[role="tab"], .tab, [data-testid*="tab"]').all()
    console.log(`Found ${tabs.length} tabs:`)
    
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]
      const text = await tab.textContent()
      const isVisible = await tab.isVisible()
      const isActive = await tab.getAttribute('aria-selected')
      console.log(`Tab ${i}: "${text}" - Visible: ${isVisible} - Active: ${isActive}`)
    }
    
    // Look for UTab specifically
    const uTabs = await page.locator('[data-testid="utab"], .utab, [class*="tab"]').all()
    console.log(`Found ${uTabs.length} UTab elements`)
    
    // Look for entity names in the page
    const entityNames = ['arcana', 'base-card', 'world', 'facet', 'skill', 'card-type']
    
    for (const entity of entityNames) {
      const elements = await page.locator(`text=/${entity}/i`).all()
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements containing "${entity}"`)
        
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const element = elements[i]
          const text = await element.textContent()
          console.log(`  ${entity} element ${i}: "${text}"`)
        }
      }
    }
    
    // Look for any buttons with create/add/new text
    const createButtons = await page.locator('button:has-text(/create|add|new/i)').all()
    console.log(`Found ${createButtons.length} create buttons:`)
    
    for (let i = 0; i < Math.min(createButtons.length, 10); i++) {
      const button = createButtons[i]
      const text = await button.textContent()
      const isVisible = await button.isVisible()
      console.log(`Create button ${i}: "${text}" - Visible: ${isVisible}`)
    }
    
    // Check for links that might be entity routes
    const links = await page.locator('a[href]').all()
    console.log(`Found ${links.length} links total`)
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i]
      const href = await link.getAttribute('href')
      const text = await link.textContent()
      
      if (href && (href.includes('arcana') || href.includes('base-card') || href.includes('world') || href.includes('facet') || href.includes('skill'))) {
        console.log(`Entity link: "${text}" -> ${href}`)
      }
    }
    
    // Look for any content that mentions arcana specifically
    const arcanaContent = await page.locator('*:has-text(/arcana/i)').all()
    console.log(`Found ${arcanaContent.length} elements containing "arcana":`)
    
    for (let i = 0; i < Math.min(arcanaContent.length, 5); i++) {
      const element = arcanaContent[i]
      const tagName = await element.evaluate(el => el.tagName)
      const text = await element.textContent()
      console.log(`  Arcana element ${i}: <${tagName}> "${text?.substring(0, 50)}..."`)
    }
    
    // Wait to see everything
    await page.waitForTimeout(3000)
  })
})
