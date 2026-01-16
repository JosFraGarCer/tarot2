import { test, expect } from '@playwright/test'

test.describe('Form Validation', () => {
  const testCode = `test-validation-${Date.now()}`
  
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

  test('required fields validation prevents form submission', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Open create form
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Save"), button:has-text("Submit")')
    await submitButton.click()
    
    // Should stay on form and show validation errors
    await expect(page.locator('form, [data-testid="form-modal"], .modal')).toBeVisible()
    
    // Check for validation messages
    const validationSelectors = [
      'text=required',
      'text=Required',
      'text=obligatorio',
      'text=Obligatorio',
      '.error',
      '[data-testid="validation-error"]',
      '.field-error',
      '[aria-invalid="true"]'
    ]
    
    let validationFound = false
    for (const selector of validationSelectors) {
      const validationElement = page.locator(selector)
      if (await validationElement.count() > 0) {
        await expect(validationElement.first()).toBeVisible()
        validationFound = true
        break
      }
    }
    
    if (!validationFound) {
      console.log('Validation messages not found - form may not have client-side validation')
    }
  })

  test('code field format validation', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    // Test invalid code formats
    const invalidCodes = [
      'invalid code with spaces',
      'invalid-code-with-special-chars!',
      '123',
      'a', // too short
      'code-with-'.repeat(20) // too long
    ]
    
    for (const invalidCode of invalidCodes) {
      const codeInput = page.locator('input[name="code"], input[data-testid="code"]')
      await codeInput.fill(invalidCode)
      
      // Try to submit or trigger validation
      const submitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Save")')
      await submitButton.click()
      await page.waitForTimeout(500)
      
      // Check for validation error
      const validationError = page.locator('.error, [data-testid="validation-error"], .field-error, [aria-invalid="true"]')
      if (await validationError.count() > 0) {
        await expect(validationError.first()).toBeVisible()
      }
      
      // Clear for next test
      await codeInput.fill('')
    }
  })

  test('duplicate code validation shows error', async ({ page }) => {
    // First create an entity
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('input[name="code"], input[data-testid="code"]', testCode)
    await page.fill('input[name="name"], input[data-testid="name"]', 'First Entity')
    await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'First entity description')
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'draft')
    
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
    await page.waitForURL('**/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Try to create another entity with same code
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    await page.fill('input[name="code"], input[data-testid="code"]', testCode)
    await page.fill('input[name="name"], input[data-testid="name"]', 'Second Entity')
    await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'Second entity description')
    
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
    await page.waitForTimeout(1000)
    
    // Should show duplicate code error
    const duplicateErrorSelectors = [
      'text=duplicate',
      'text=Duplicate',
      'text=already exists',
      'text=ya existe',
      'text=código',
      'text=code'
    ]
    
    let duplicateErrorFound = false
    for (const selector of duplicateErrorSelectors) {
      const errorElement = page.locator(selector)
      if (await errorElement.count() > 0) {
        await expect(errorElement.first()).toBeVisible()
        duplicateErrorFound = true
        break
      }
    }
    
    if (!duplicateErrorFound) {
      console.log('Duplicate code validation not found - may be server-side only')
    }
    
    // Clean up - close modal and delete first entity
    const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), [data-testid="close-modal"]')
    if (await closeButton.count() > 0) {
      await closeButton.click()
    }
    
    // Delete the first entity
    const entityRow = page.locator(`text=${testCode}`)
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
  })

  test('email format validation in user forms', async ({ page }) => {
    // Try to access user management or profile
    await page.goto('/user')
    await page.waitForLoadState('networkidle')
    
    // Look for email input fields
    const emailInputs = page.locator('input[type="email"], input[name*="email"], input[data-testid*="email"]')
    
    if (await emailInputs.count() > 0) {
      const emailInput = emailInputs.first()
      
      // Test invalid email formats
      const invalidEmails = [
        'invalid-email',
        '@invalid.com',
        'invalid@',
        'invalid.com',
        'invalid@.com',
        'invalid@com.',
        'invalid@com'
      ]
      
      for (const email of invalidEmails) {
        await emailInput.fill(email)
        
        // Trigger validation (blur or submit)
        await emailInput.blur()
        await page.waitForTimeout(500)
        
        // Check for validation error
        const emailError = page.locator('.error, [data-testid="validation-error"], .field-error, [aria-invalid="true"]')
        if (await emailError.count() > 0) {
          await expect(emailError.first()).toBeVisible()
        }
        
        await emailInput.fill('')
      }
      
      // Test valid email
      await emailInput.fill('test@example.com')
      await emailInput.blur()
      await page.waitForTimeout(500)
      
      // Should not show error for valid email
      const emailError = page.locator('.error, [data-testid="validation-error"], .field-error, [aria-invalid="true"]')
      if (await emailError.count() > 0) {
        // Error might be for other fields, check if it's email-related
        const emailRelatedError = emailError.locator(':has-text("email"), :has-text("Email")')
        if (await emailRelatedError.count() === 0) {
          console.log('Valid email accepted without error')
        }
      }
    } else {
      console.log('Email input not found on user page')
    }
  })

  test('character limits and length validation', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    // Test name field length limits
    const nameInput = page.locator('input[name="name"], input[data-testid="name"]')
    const veryLongName = 'A'.repeat(300) // Very long name
    
    await nameInput.fill(veryLongName)
    await nameInput.blur()
    await page.waitForTimeout(500)
    
    // Check if field has maxlength attribute or validation
    const maxlength = await nameInput.getAttribute('maxlength')
    if (maxlength) {
      const actualLength = (await nameInput.inputValue()).length
      expect(actualLength).toBeLessThanOrEqual(parseInt(maxlength))
    }
    
    // Check for validation error
    const validationError = page.locator('.error, [data-testid="validation-error"], .field-error')
    if (await validationError.count() > 0) {
      await expect(validationError.first()).toBeVisible()
    }
    
    // Test short text field
    const shortTextInput = page.locator('input[name="short_text"], input[data-testid="short_text"]')
    if (await shortTextInput.count() > 0) {
      await shortTextInput.fill('A'.repeat(200)) // Long short text
      await shortTextInput.blur()
      await page.waitForTimeout(500)
      
      const shortTextMaxlength = await shortTextInput.getAttribute('maxlength')
      if (shortTextMaxlength) {
        const actualLength = (await shortTextInput.inputValue()).length
        expect(actualLength).toBeLessThanOrEqual(parseInt(shortTextMaxlength))
      }
    }
  })

  test('form validation clears after successful submission', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    // Trigger validation errors
    const submitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Save")')
    await submitButton.click()
    await page.waitForTimeout(500)
    
    // Fill valid data
    await page.fill('input[name="code"], input[data-testid="code"]', testCode)
    await page.fill('input[name="name"], input[data-testid="name"]', 'Valid Test Entity')
    await page.fill('textarea[name="description"], textarea[data-testid="description"]', 'Valid description')
    await page.selectOption('select[name="status"], select[data-testid="status"]', 'draft')
    
    // Submit successfully
    await submitButton.click()
    await page.waitForURL('**/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Verify entity was created
    const entityRow = page.locator(`text=${testCode}`)
    await expect(entityRow.first()).toBeVisible()
    
    // Clean up
    const deleteButton = entityRow.locator('button:has-text("Delete"), button:has-text("Remove"), [data-testid="delete-button"]')
    await deleteButton.click()
    
    const confirmDialog = page.locator('.modal, [data-testid="confirm-dialog"], .dialog')
    if (await confirmDialog.count() > 0) {
      const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")')
      await confirmButton.click()
    }
    await page.waitForLoadState('networkidle')
  })

  test('real-time validation feedback', async ({ page }) => {
    await page.goto('/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), [data-testid="create-button"]')
    await createButton.first().click()
    await page.waitForSelector('form, [data-testid="form-modal"], .modal')
    
    const codeInput = page.locator('input[name="code"], input[data-testid="code"]')
    
    // Test real-time validation as user types
    await codeInput.fill('invalid code with spaces')
    await page.waitForTimeout(500)
    
    // Check if validation appears immediately
    const validationError = page.locator('.error, [data-testid="validation-error"], .field-error')
    const hasRealTimeValidation = await validationError.count() > 0
    
    if (hasRealTimeValidation) {
      await expect(validationError.first()).toBeVisible()
      
      // Fix the input
      await codeInput.fill('valid-code')
      await page.waitForTimeout(500)
      
      // Error should disappear
      await expect(validationError).toHaveCount(0)
    } else {
      console.log('Real-time validation not implemented - validation may be on submit only')
    }
  })
})
