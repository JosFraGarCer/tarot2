import { test } from '@playwright/test'

test.describe('Debug Arcana Form', () => {
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

  test('debug arcana form structure', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForLoadState('networkidle')
    
    // Click on Arcana tab
    const arcanaTab = page.locator('[role="tab"], .tab').filter({ hasText: 'Arcana' }).first()
    await arcanaTab.click()
    await page.waitForTimeout(2000)
    
    // Click create button
    const createButton = page.locator('button, [role="button"]').filter({ hasText: /Create Arcana/i }).first()
    await createButton.click()
    
    // Wait for modal
    await page.waitForSelector('form, [data-testid="form-modal"], .modal', { timeout: 10000 })
    
    // Take screenshot of form
    await page.screenshot({ path: 'debug-arcana-form.png', fullPage: true })
    
    // Look for all form inputs
    const inputs = await page.locator('input').all()
    console.log(`Found ${inputs.length} input fields:`)
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const name = await input.getAttribute('name')
      const placeholder = await input.getAttribute('placeholder')
      const type = await input.getAttribute('type')
      const value = await input.getAttribute('value')
      const isVisible = await input.isVisible()
      
      console.log(`  Input ${i}: name="${name}" placeholder="${placeholder}" type="${type}" value="${value}" visible=${isVisible}`)
    }
    
    // Look for textareas
    const textareas = await page.locator('textarea').all()
    console.log(`\nFound ${textareas.length} textarea fields:`)
    
    for (let i = 0; i < textareas.length; i++) {
      const textarea = textareas[i]
      const name = await textarea.getAttribute('name')
      const placeholder = await textarea.getAttribute('placeholder')
      const isVisible = await textarea.isVisible()
      
      console.log(`  Textarea ${i}: name="${name}" placeholder="${placeholder}" visible=${isVisible}`)
    }
    
    // Look for selects
    const selects = await page.locator('select').all()
    console.log(`\nFound ${selects.length} select fields:`)
    
    for (let i = 0; i < selects.length; i++) {
      const select = selects[i]
      const name = await select.getAttribute('name')
      const isVisible = await select.isVisible()
      
      console.log(`  Select ${i}: name="${name}" visible=${isVisible}`)
      
      if (isVisible) {
        const options = await select.locator('option').all()
        console.log(`    Options: ${options.length}`)
        
        for (let j = 0; j < Math.min(options.length, 5); j++) {
          const option = options[j]
          const value = await option.getAttribute('value')
          const text = await option.textContent()
          console.log(`      Option ${j}: value="${value}" text="${text}"`)
        }
      }
    }
    
    // Look for checkboxes
    const checkboxes = await page.locator('input[type="checkbox"]').all()
    console.log(`\nFound ${checkboxes.length} checkbox fields:`)
    
    for (let i = 0; i < checkboxes.length; i++) {
      const checkbox = checkboxes[i]
      const name = await checkbox.getAttribute('name')
      const checked = await checkbox.isChecked()
      const isVisible = await checkbox.isVisible()
      
      console.log(`  Checkbox ${i}: name="${name}" checked=${checked} visible=${isVisible}`)
    }
    
    // Look for submit buttons
    const submitButtons = await page.locator('button[type="submit"], button:has-text(/submit|save|create/i)').all()
    console.log(`\nFound ${submitButtons.length} submit buttons:`)
    
    for (let i = 0; i < submitButtons.length; i++) {
      const button = submitButtons[i]
      const text = await button.textContent()
      const isVisible = await button.isVisible()
      
      console.log(`  Submit button ${i}: "${text}" visible=${isVisible}`)
    }
    
    // Wait to see everything
    await page.waitForTimeout(3000)
  })
})
