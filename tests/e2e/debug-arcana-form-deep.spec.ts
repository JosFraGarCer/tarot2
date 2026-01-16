import { test } from '@playwright/test'

test.describe('Debug Arcana Form Deep', () => {
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

  test('debug arcana form field names and structure', async ({ page }) => {
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
    
    // Look for all form elements with different approaches
    console.log('=== INVESTIGATING FORM STRUCTURE ===')
    
    // Method 1: All inputs with any attribute
    const allInputs = await page.locator('input').all()
    console.log(`Found ${allInputs.length} total inputs:`)
    
    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i]
      const attributes = await input.evaluate(el => {
        const attrs = {}
        for (let attr of el.attributes) {
          attrs[attr.name] = attr.value
        }
        return attrs
      })
      
      const isVisible = await input.isVisible()
      const text = await input.textContent()
      
      console.log(`Input ${i}:`)
      console.log(`  Attributes: ${JSON.stringify(attributes)}`)
      console.log(`  Visible: ${isVisible}`)
      console.log(`  Text: "${text}"`)
      console.log('')
    }
    
    // Method 2: Look for elements by common field names
    const fieldNames = ['code', 'name', 'description', 'short_text', 'status', 'is_active', 'title', 'content']
    
    console.log('=== LOOKING FOR COMMON FIELD NAMES ===')
    for (const fieldName of fieldNames) {
      const elements = await page.locator(`[name*="${fieldName}"], [data-testid*="${fieldName}"], [id*="${fieldName}"]`).all()
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements for "${fieldName}":`)
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i]
          const tagName = await element.evaluate(el => el.tagName)
          const isVisible = await element.isVisible()
          
          console.log(`  ${tagName} - Visible: ${isVisible}`)
        }
      }
    }
    
    // Method 3: Look for labels and their associated inputs
    console.log('=== LOOKING FOR LABELS AND ASSOCIATED INPUTS ===')
    const labels = await page.locator('label').all()
    console.log(`Found ${labels.length} labels:`)
    
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i]
      const labelText = await label.textContent()
      const htmlFor = await label.getAttribute('for')
      const isVisible = await label.isVisible()
      
      console.log(`Label ${i}: "${labelText}" - for="${htmlFor}" - Visible: ${isVisible}`)
      
      if (htmlFor) {
        const associatedInput = page.locator(`#${htmlFor}`)
        const inputExists = await associatedInput.count() > 0
        console.log(`  Associated input exists: ${inputExists}`)
      }
    }
    
    // Method 4: Look for any submit buttons
    console.log('=== LOOKING FOR SUBMIT BUTTONS ===')
    const buttons = await page.locator('button').all()
    console.log(`Found ${buttons.length} buttons total:`)
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]
      const text = await button.textContent()
      const type = await button.getAttribute('type')
      const isVisible = await button.isVisible()
      
      if (text && (text.toLowerCase().includes('submit') || text.toLowerCase().includes('save') || text.toLowerCase().includes('create'))) {
        console.log(`Submit button ${i}: "${text}" - type="${type}" - Visible: ${isVisible}`)
      }
    }
    
    // Method 5: Look at form structure
    console.log('=== FORM STRUCTURE ===')
    const form = page.locator('form').first()
    const formHTML = await form.innerHTML()
    console.log('Form HTML (first 500 chars):')
    console.log(formHTML.substring(0, 500))
    
    // Wait to see everything
    await page.waitForTimeout(3000)
  })
})
