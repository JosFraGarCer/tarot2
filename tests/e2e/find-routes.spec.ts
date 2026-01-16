import { test } from '@playwright/test'

test.describe('Find Available Routes', () => {
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

  test('explore available routes after login', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check all navigation links
    const allLinks = await page.locator('a[href]').all()
    console.log(`Found ${allLinks.length} navigation links:`)
    
    const manageLinks = []
    for (let i = 0; i < allLinks.length; i++) {
      const link = allLinks[i]
      const href = await link.getAttribute('href')
      const text = await link.textContent()
      
      if (href?.includes('manage') || href?.includes('admin') || text?.toLowerCase().includes('manage') || text?.toLowerCase().includes('admin')) {
        manageLinks.push({ href, text })
        console.log(`Manage/Admin link: "${text}" -> ${href}`)
      }
    }
    
    // Test each manage route found
    for (const link of manageLinks) {
      if (link.href) {
        console.log(`\nTesting route: ${link.href}`)
        await page.goto(link.href)
        await page.waitForLoadState('networkidle')
        
        const pageTitle = await page.title()
        const is404 = pageTitle.includes('404')
        
        console.log(`Route ${link.href}: ${is404 ? '404' : 'EXISTS'} - Title: ${pageTitle}`)
        
        // If not 404, check for buttons
        if (!is404) {
          const buttons = await page.locator('button, [role="button"]').all()
          console.log(`  Found ${buttons.length} buttons on this page`)
          
          for (let j = 0; j < Math.min(buttons.length, 5); j++) {
            const button = buttons[j]
            const text = await button.textContent()
            const isVisible = await button.isVisible()
            if (isVisible && text) {
              console.log(`    Button: "${text}"`)
            }
          }
        }
        
        // Go back to home
        await page.goto('/')
        await page.waitForLoadState('networkidle')
      }
    }
    
    // Try common route patterns
    const commonRoutes = [
      '/manage',
      '/admin',
      '/manage/arcana',
      '/admin/arcana',
      '/arcana/manage',
      '/arcana/admin',
      '/entities/arcana',
      '/entities',
      '/dashboard'
    ]
    
    console.log('\nTesting common route patterns:')
    for (const route of commonRoutes) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      
      const pageTitle = await page.title()
      const is404 = pageTitle.includes('404')
      
      console.log(`${route}: ${is404 ? '404' : 'EXISTS'} - ${pageTitle}`)
    }
  })
})
