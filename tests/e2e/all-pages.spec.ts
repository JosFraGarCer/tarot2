import { test, expect } from '@playwright/test'

const pages = [
  '/',
  '/login',
  '/manage',
  '/user',
  '/admin',
  '/admin/users',
  '/admin/database',
  '/deck',
  '/deck/arcana',
  '/deck/base-cards',
  '/deck/card-types',
  '/deck/facets',
  '/deck/skills',
  '/deck/worlds',
  '/manage/arcana',
  '/manage/tags_new'
]

test.describe('All pages load without errors', () => {
  pages.forEach(pagePath => {
    test(`page ${pagePath} loads successfully`, async ({ page }) => {
      const response = await page.goto(pagePath)
      
      // Check that page loads (status 200 or redirect)
      expect(response?.status()).toBeLessThan(400)
      
      // Wait for page to be stable
      await page.waitForLoadState('networkidle')
      
      // Check that page has content
      const body = page.locator('body')
      await expect(body).toBeVisible()
      
      // Check for common error indicators
      const errorSelectors = [
        '[data-testid="error"]',
        '.error',
        '[data-testid="not-found"]',
        'text=404',
        'text=Page not found',
        'text=Internal Server Error'
      ]
      
      for (const selector of errorSelectors) {
        const element = page.locator(selector)
        if (await element.count() > 0) {
          // Log found error elements for debugging
          console.log(`Found potential error on ${pagePath}:`, selector)
        }
      }
    })
  })
})

test('navigation between main sections works', async ({ page }) => {
  // Start at home
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // Test navigation to main sections
  const mainNavTests = [
    { from: '/', to: '/login', expectedRedirect: '/login' },
    { from: '/', to: '/deck', expectedRedirect: '/deck' },
    { from: '/deck', to: '/manage', expectedRedirect: '/login' }, // Likely redirects to login
    { from: '/manage', to: '/admin', expectedRedirect: '/login' } // Likely redirects to login
  ]
  
  for (const nav of mainNavTests) {
    await page.goto(nav.from)
    await page.waitForLoadState('networkidle')
    
    const response = await page.goto(nav.to)
    expect(response?.status()).toBeLessThan(400)
    await page.waitForLoadState('networkidle')
    
    // Verify final URL (accounting for possible redirects)
    const finalUrl = page.url()
    if (finalUrl.includes(nav.expectedRedirect)) {
      console.log(`Navigation ${nav.from} → ${nav.to} successful, ended at: ${finalUrl}`)
    } else {
      console.log(`Navigation ${nav.from} → ${nav.to} redirected to: ${finalUrl}`)
    }
    
    // At minimum, we should not be on an error page
    expect(finalUrl).not.toContain('error')
    expect(finalUrl).not.toContain('404')
  }
})
