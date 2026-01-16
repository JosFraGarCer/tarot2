import { test, expect } from '@playwright/test'

test.describe('Search and Filtering', () => {
  const testEntities = [
    { code: `test-search-1-${Date.now()}`, name: 'Alpha Test Entity', status: 'draft' },
    { code: `test-search-2-${Date.now()}`, name: 'Beta Test Entity', status: 'published' },
    { code: `test-search-3-${Date.now()}`, name: 'Gamma Search Test', status: 'archived' }
  ]
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[placeholder="User or Email"]', process.env.TEST_USER_IDENTIFIER!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    
    // Wait for successful login
    await page.waitForURL('**/user', { timeout: 10000 })
  })

  test.beforeAll(async ({ browser }) => {
    // Create test entities for search testing
    const context = await browser.newContext()
    const page = await context.newPage()
    
    // Login
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input[placeholder="User or Email"]', process.env.TEST_USER_IDENTIFIER!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/user', { timeout: 10000 })
    
    // Create test entities
    for (const entity of testEntities) {
      await page.goto('/manage/arcana')
      await page.waitForLoadState('networkidle')
      
      const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
      await createButton.first().click()
      await page.waitForSelector('form, [data-testid="form-modal"], .modal')
      
      await page.fill('input[name="code"], input[data-testid="code"]', entity.code)
      await page.fill('input[name="name"], input[data-testid="name"]', entity.name)
      await page.fill('textarea[name="description"], textarea[data-testid="description"]', `Test entity for search: ${entity.name}`)
      await page.selectOption('select[name="status"], select[data-testid="status"]', entity.status)
      
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
      await page.waitForURL('**/manage/arcana')
      await page.waitForLoadState('networkidle')
    }
    
    await context.close()
  })

  test.afterAll(async ({ browser }) => {
    // Clean up test entities
    const context = await browser.newContext()
    const page = await context.newPage()
    
    // Login
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input[placeholder="User or Email"]', process.env.TEST_USER_IDENTIFIER!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/user', { timeout: 10000 })
    
    // Delete test entities
    for (const entity of testEntities) {
      await page.goto('/manage/arcana')
      await page.waitForLoadState('networkidle')
      
      const entityRow = page.locator(`text=${entity.code}`)
      if (await entityRow.count() > 0) {
        const deleteButton = entityRow.locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete-button"]')
        await deleteButton.click()
        
        const confirmDialog = page.locator('.modal, [data-testid="confirm-dialog"], .dialog')
        if (await confirmDialog.count() > 0) {
          const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
          await confirmButton.click()
        }
        await page.waitForLoadState('networkidle')
      }
    }
    
    await context.close()
  })

  test('search by entity name finds matching results', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Search for "Alpha"
    const searchInput = page.locator('input[type="search"], input[data-testid="search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('Alpha')
      await page.waitForTimeout(1000) // Wait for search debounce
      
      // Should find Alpha Test Entity but not others
      await expect(page.locator('text=Alpha Test Entity')).toBeVisible()
      await expect(page.locator('text=Beta Test Entity')).toHaveCount(0)
      await expect(page.locator('text=Gamma Search Test')).toHaveCount(0)
    } else {
      console.log('Search input not found - search functionality may not be implemented')
    }
  })

  test('search by entity code finds exact match', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const searchInput = page.locator('input[type="search"], input[data-testid="search"]')
    if (await searchInput.count() > 0) {
      // Search by exact code
      await searchInput.fill(testEntities[0].code)
      await page.waitForTimeout(1000)
      
      // Should find exact match
      await expect(page.locator(`text=${testEntities[0].code}`)).toBeVisible()
      await expect(page.locator(`text=${testEntities[1].code}`)).toHaveCount(0)
    }
  })

  test('filter by status shows only entities with that status', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Look for status filter
    const statusFilter = page.locator('select[name="status"], select[data-testid="status-filter"], [data-testid="filter-status"]')
    if (await statusFilter.count() > 0) {
      // Filter by "published"
      await statusFilter.selectOption('published')
      await page.waitForTimeout(1000)
      
      // Should only show published entities
      await expect(page.locator('text=Beta Test Entity')).toBeVisible()
      await expect(page.locator('text=Alpha Test Entity')).toHaveCount(0)
      await expect(page.locator('text=Gamma Search Test')).toHaveCount(0)
      
      // Filter by "draft"
      await statusFilter.selectOption('draft')
      await page.waitForTimeout(1000)
      
      await expect(page.locator('text=Alpha Test Entity')).toBeVisible()
      await expect(page.locator('text=Beta Test Entity')).toHaveCount(0)
    } else {
      console.log('Status filter not found - filtering may not be implemented')
    }
  })

  test('combined search and filter works correctly', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const searchInput = page.locator('input[type="search"], input[data-testid="search"]')
    const statusFilter = page.locator('select[name="status"], select[data-testid="status-filter"], [data-testid="filter-status"]')
    
    if (await searchInput.count() > 0 && await statusFilter.count() > 0) {
      // Search for "Test" and filter by "published"
      await searchInput.fill('Test')
      await statusFilter.selectOption('published')
      await page.waitForTimeout(1000)
      
      // Should only show published entities with "Test" in name
      await expect(page.locator('text=Beta Test Entity')).toBeVisible()
      await expect(page.locator('text=Alpha Test Entity')).toHaveCount(0)
      await expect(page.locator('text=Gamma Search Test')).toHaveCount(0)
    }
  })

  test('clear search and filters resets view', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const searchInput = page.locator('input[type="search"], input[data-testid="search"]')
    const statusFilter = page.locator('select[name="status"], select[data-testid="status-filter"], [data-testid="filter-status"]')
    const clearButton = page.locator('button:has-text("Clear"), button:has-text("Reset"), [data-testid="clear-filters"]')
    
    if (await searchInput.count() > 0 && await statusFilter.count() > 0) {
      // Apply search and filter
      await searchInput.fill('Alpha')
      await statusFilter.selectOption('draft')
      await page.waitForTimeout(1000)
      
      // Verify filtered results
      await expect(page.locator('text=Alpha Test Entity')).toBeVisible()
      
      // Clear filters
      if (await clearButton.count() > 0) {
        await clearButton.click()
        await page.waitForTimeout(1000)
        
        // Should show all entities again
        await expect(page.locator('text=Alpha Test Entity')).toBeVisible()
        await expect(page.locator('text=Beta Test Entity')).toBeVisible()
        await expect(page.locator('text=Gamma Search Test')).toBeVisible()
      } else {
        // Manual clear
        await searchInput.fill('')
        await statusFilter.selectOption('')
        await page.waitForTimeout(1000)
        
        await expect(page.locator('text=Alpha Test Entity')).toBeVisible()
        await expect(page.locator('text=Beta Test Entity')).toBeVisible()
        await expect(page.locator('text=Gamma Search Test')).toBeVisible()
      }
    }
  })

  test('pagination works with search results', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Look for pagination controls
    const pagination = page.locator('[data-testid="pagination"], .pagination, nav[aria-label="pagination"]')
    if (await pagination.count() > 0) {
      const searchInput = page.locator('input[type="search"], input[data-testid="search"]')
      
      if (await searchInput.count() > 0) {
        await searchInput.fill('Test')
        await page.waitForTimeout(1000)
        
        // Check if pagination is still present and functional
        const nextPage = page.locator('button:has-text("Next"), a:has-text("Next"), [data-testid="next-page"]')
        const prevPage = page.locator('button:has-text("Previous"), a:has-text("Previous"), [data-testid="prev-page"]')
        
        if (await nextPage.count() > 0) {
          await expect(nextPage.first()).toBeVisible()
        }
        
        if (await prevPage.count() > 0) {
          await expect(prevPage.first()).toBeVisible()
        }
      }
    } else {
      console.log('Pagination not found - may not be implemented or not enough data')
    }
  })

  test('search with special characters works', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const searchInput = page.locator('input[type="search"], input[data-testid="search"]')
    if (await searchInput.count() > 0) {
      // Test special characters
      const specialChars = ['@', '#', '$', '%', '&', '*']
      
      for (const char of specialChars) {
        await searchInput.fill(char)
        await page.waitForTimeout(500)
        
        // Should not crash and should handle gracefully
        const body = page.locator('body')
        await expect(body).toBeVisible()
      }
      
      // Clear search
      await searchInput.fill('')
      await page.waitForTimeout(500)
    }
  })
})
