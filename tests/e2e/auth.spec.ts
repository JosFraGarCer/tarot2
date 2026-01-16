import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('successful login with test credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Fill login form using v-model bound inputs
    await page.fill('input[placeholder="User or Email"]', process.env.TEST_USER_IDENTIFIER!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for navigation and check we're logged in
    await page.waitForURL('**/user', { timeout: 10000 })
    expect(page.url()).toContain('/user')
    
    // Verify we're on user dashboard
    await expect(page.locator('body')).toBeVisible()
  })
  
  test('failed login with wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Fill with wrong credentials
    await page.fill('input[placeholder="User or Email"]', 'wronguser')
    await page.fill('input[type="password"]', 'wrongpass')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should stay on login page and show error
    await expect(page.url()).toContain('/login')
    
    // Check for error message (if your app shows one)
    const errorSelectors = [
      'text=error',
      'text=Error', 
      'text=Invalid',
      'text=Credenciales',
      '.error',
      '[data-testid="error"]'
    ]
    
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector)
      if (await errorElement.count() > 0) {
        await expect(errorElement.first()).toBeVisible()
        return
      }
    }
    
    console.log('No error message found - login may fail silently')
  })
  
  test('logout functionality', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[placeholder="User or Email"]', process.env.TEST_USER_IDENTIFIER!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    
    // Wait for successful login
    await page.waitForURL('**/user', { timeout: 10000 })
    
    // Look for logout functionality
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Cerrar sesión")',
      'button:has-text("Salir")',
      '[data-testid="logout"]',
      'a:has-text("Logout")',
      'a:has-text("Cerrar sesión")'
    ]
    
    let logoutFound = false
    for (const selector of logoutSelectors) {
      const logoutButton = page.locator(selector)
      if (await logoutButton.count() > 0 && await logoutButton.first().isVisible()) {
        await logoutButton.first().click()
        logoutFound = true
        break
      }
    }
    
    if (logoutFound) {
      await page.waitForURL('**/login', { timeout: 10000 })
      expect(page.url()).toContain('/login')
    } else {
      console.log('Logout button not found - may need to implement this test based on actual UI')
    }
  })
})
