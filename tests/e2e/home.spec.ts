import { test, expect } from '@playwright/test'

test('home page loads and displays title', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('h1')).toContainText('Tarot')
})

test('page has expected content structure', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.max-w-4xl')).toBeVisible()
  await expect(page.locator('[data-testid="card"]')).toBeVisible()
})

test('login page loads and shows form', async ({ page }) => {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('form')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
})
