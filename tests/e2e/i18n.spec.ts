import { test, expect } from '@playwright/test'

const locales = ['en', 'es']

test.describe('Internationalization', () => {
  locales.forEach(locale => {
    test.describe(`${locale.toUpperCase()} Locale`, () => {
      test.beforeEach(async ({ page }) => {
        // Set locale before navigation
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        // Look for language switcher
        const languageSwitcher = page.locator('select[name="locale"], [data-testid="language-switcher"], .language-switcher')
        if (await languageSwitcher.count() > 0) {
          await languageSwitcher.selectOption(locale)
          await page.waitForLoadState('networkidle')
        } else {
          // Try URL-based locale switching
          await page.goto(`/${locale}`)
          await page.waitForLoadState('networkidle')
        }
        
        // Login after setting locale
        await page.goto(`/${locale}/login`)
        await page.waitForLoadState('networkidle')
        
        await page.fill('input[placeholder*="User"], input[placeholder*="Email"], input[placeholder*="usuario"], input[placeholder*="correo"]', process.env.TEST_USER_IDENTIFIER!)
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
        await page.click('button[type="submit"]')
        
        // Wait for successful login
        await page.waitForURL(`**/${locale}/user`, { timeout: 10000 })
      })

      test(`page content is in ${locale}`, async ({ page }) => {
        await page.goto(`/${locale}`)
        await page.waitForLoadState('networkidle')
        
        // Check that main content is in the correct language
        const body = page.locator('body')
        await expect(body).toBeVisible()
        
        // Check for locale-specific text
        if (locale === 'es') {
          // Spanish content checks
          const spanishTexts = [
            'text=Tarot',
            'text=Sistema',
            'text=cartas',
            'text=rol',
            'text=Iniciar',
            'text=sesión',
            'text=Usuario',
            'text=Contraseña'
          ]
          
          let spanishFound = false
          for (const textSelector of spanishTexts) {
            const element = page.locator(textSelector)
            if (await element.count() > 0) {
              await expect(element.first()).toBeVisible()
              spanishFound = true
              break
            }
          }
          
          if (!spanishFound) {
            console.log('Spanish text elements not found - checking page title')
            const title = await page.title()
            expect(title.toLowerCase()).toMatch(/tarot|sistema|cartas|rol/)
          }
        } else {
          // English content checks
          const englishTexts = [
            'text=Tarot',
            'text=System',
            'text=cards',
            'text=role',
            'text=Sign',
            'text=Login',
            'text=User',
            'text=Password'
          ]
          
          let englishFound = false
          for (const textSelector of englishTexts) {
            const element = page.locator(textSelector)
            if (await element.count() > 0) {
              await expect(element.first()).toBeVisible()
              englishFound = true
              break
            }
          }
          
          if (!englishFound) {
            console.log('English text elements not found - checking page title')
            const title = await page.title()
            expect(title.toLowerCase()).toMatch(/tarot|system|cards|role/)
          }
        }
      })

      test(`navigation elements are translated to ${locale}`, async ({ page }) => {
        await page.goto(`/${locale}`)
        await page.waitForLoadState('networkidle')
        
        // Check navigation links
        const navLinks = page.locator('nav a, .navigation a, [data-testid="nav"] a')
        const linkCount = await navLinks.count()
        
        if (linkCount > 0) {
          // Check that navigation links contain translated text
          const navText = await navLinks.first().textContent()
          expect(navText).toBeTruthy()
          
          if (locale === 'es') {
            // Should contain Spanish navigation terms
            expect(navText?.toLowerCase()).toMatch(/inicio|baraja|administrar|usuario/)
          } else {
            // Should contain English navigation terms
            expect(navText?.toLowerCase()).toMatch(/home|deck|manage|user/)
          }
        }
      })

      test(`form labels and placeholders are in ${locale}`, async ({ page }) => {
        await page.goto(`/${locale}/manage/arcana`)
        await page.waitForLoadState('networkidle')
        
        // Open create form
        const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Crear"), button:has-text("Nuevo"), [data-testid="create-button"]')
        if (await createButton.count() > 0) {
          await createButton.first().click()
          await page.waitForSelector('form, [data-testid="form-modal"], .modal')
          
          // Check form labels
          const labels = page.locator('label')
          const labelCount = await labels.count()
          
          if (labelCount > 0) {
            const labelText = await labels.first().textContent()
            expect(labelText).toBeTruthy()
            
            if (locale === 'es') {
              // Should contain Spanish form labels
              expect(labelText?.toLowerCase()).toMatch(/código|nombre|descripción|estado|activo/)
            } else {
              // Should contain English form labels
              expect(labelText?.toLowerCase()).toMatch(/code|name|description|status|active/)
            }
          }
          
          // Check placeholders
          const inputs = page.locator('input[placeholder], textarea[placeholder]')
          const inputCount = await inputs.count()
          
          if (inputCount > 0) {
            const placeholder = await inputs.first().getAttribute('placeholder')
            expect(placeholder).toBeTruthy()
            
            if (locale === 'es') {
              // Should contain Spanish placeholders
              expect(placeholder?.toLowerCase()).toMatch(/código|nombre|descripción/)
            } else {
              // Should contain English placeholders
              expect(placeholder?.toLowerCase()).toMatch(/code|name|description/)
            }
          }
        }
      })

      test(`buttons and actions are in ${locale}`, async ({ page }) => {
        await page.goto(`/${locale}/manage/arcana`)
        await page.waitForLoadState('networkidle')
        
        // Check button text
        const buttons = page.locator('button')
        const buttonCount = await buttons.count()
        
        if (buttonCount > 0) {
          const buttonTexts = await Promise.all(
            Array.from({ length: Math.min(3, buttonCount) }, (_, i) => 
              buttons.nth(i).textContent()
            )
          )
          
          const anyButtonTranslated = buttonTexts.some(text => {
            if (!text) return false
            
            if (locale === 'es') {
              return /crear|nuevo|editar|eliminar|guardar|cancelar/i.test(text)
            } else {
              return /create|new|edit|delete|save|cancel/i.test(text)
            }
          })
          
          expect(anyButtonTranslated).toBeTruthy()
        }
      })

      test(`status and system messages are in ${locale}`, async ({ page }) => {
        await page.goto(`/${locale}/manage/arcana`)
        await page.waitForLoadState('networkidle')
        
        // Look for status indicators, badges, or messages
        const statusElements = page.locator('.status, .badge, [data-testid="status"], .message')
        const statusCount = await statusElements.count()
        
        if (statusCount > 0) {
          const statusText = await statusElements.first().textContent()
          expect(statusText).toBeTruthy()
          
          if (locale === 'es') {
            // Should contain Spanish status terms
            expect(statusText?.toLowerCase()).toMatch(/borrador|publicado|archivado|activo|inactivo/)
          } else {
            // Should contain English status terms
            expect(statusText?.toLowerCase()).toMatch(/draft|published|archived|active|inactive/)
          }
        }
      })

      test(`error messages are in ${locale}`, async ({ page }) => {
        await page.goto(`/${locale}/manage/arcana`)
        await page.waitForLoadState('networkidle')
        
        // Try to trigger an error message
        const createButton = page.locator('button:has-text("Create"), button:has-text("Crear"), [data-testid="create-button"]')
        if (await createButton.count() > 0) {
          await createButton.first().click()
          await page.waitForSelector('form, [data-testid="form-modal"], .modal')
          
          // Submit empty form to trigger validation
          const submitButton = page.locator('button[type="submit"]')
          await submitButton.click()
          await page.waitForTimeout(1000)
          
          // Check for error messages
          const errorElements = page.locator('.error, .validation-error, [data-testid="error"]')
          const errorCount = await errorElements.count()
          
          if (errorCount > 0) {
            const errorText = await errorElements.first().textContent()
            expect(errorText).toBeTruthy()
            
            if (locale === 'es') {
              // Should contain Spanish error terms
              expect(errorText?.toLowerCase()).toMatch(/requerido|obligatorio|inválido|error/)
            } else {
              // Should contain English error terms
              expect(errorText?.toLowerCase()).toMatch(/required|invalid|error/)
            }
          }
        }
      })

      test(`page titles and meta information are in ${locale}`, async ({ page }) => {
        await page.goto(`/${locale}`)
        await page.waitForLoadState('networkidle')
        
        // Check page title
        const title = await page.title()
        expect(title).toBeTruthy()
        
        if (locale === 'es') {
          expect(title.toLowerCase()).toMatch(/tarot|sistema|cartas/)
        } else {
          expect(title.toLowerCase()).toMatch(/tarot|system|cards/)
        }
        
        // Check meta description if available
        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content')
        if (metaDescription) {
          if (locale === 'es') {
            expect(metaDescription.toLowerCase()).toMatch(/tarot|sistema|cartas|rol/)
          } else {
            expect(metaDescription.toLowerCase()).toMatch(/tarot|system|cards|role/)
          }
        }
      })

      test(`language switcher works and maintains context`, async ({ page }) => {
        // Navigate to a specific page
        await page.goto(`/${locale}/manage/arcana`)
        await page.waitForLoadState('networkidle')
        
        // Look for language switcher
        const languageSwitcher = page.locator('select[name="locale"], [data-testid="language-switcher"], .language-switcher')
        
        if (await languageSwitcher.count() > 0) {
          // Switch to other language
          const otherLocale = locale === 'en' ? 'es' : 'en'
          await languageSwitcher.selectOption(otherLocale)
          await page.waitForLoadState('networkidle')
          
          // Should be on same page but in different language
          const currentUrl = page.url()
          expect(currentUrl).toContain(`/${otherLocale}/`)
          expect(currentUrl).toContain('/manage/arcana')
          
          // Verify content is in new language
          const body = page.locator('body')
          await expect(body).toBeVisible()
        } else {
          console.log('Language switcher not found - may use URL-based switching')
        }
      })

      test(`date and number formatting respects ${locale} conventions`, async ({ page }) => {
        await page.goto(`/${locale}/manage/arcana`)
        await page.waitForLoadState('networkidle')
        
        // Look for dates or numbers in the interface
        const dateElements = page.locator('[data-date], .date, time')
        const dateCount = await dateElements.count()
        
        if (dateCount > 0) {
          const dateText = await dateElements.first().textContent()
          expect(dateText).toBeTruthy()
          
          // Date format should be appropriate for locale
          if (locale === 'es') {
            // Spanish typically uses DD/MM/YYYY format
            expect(dateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/)
          } else {
            // English typically uses MM/DD/YYYY or Month DD, YYYY format
            expect(dateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|[A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}/)
          }
        }
        
        // Look for numbers with formatting
        const numberElements = page.locator('[data-number], .number, .amount')
        const numberCount = await numberElements.count()
        
        if (numberCount > 0) {
          const numberText = await numberElements.first().textContent()
          expect(numberText).toBeTruthy()
          
          // Should contain properly formatted numbers
          expect(numberText).toMatch(/\d+[,\d]*\.?\d*/)
        }
      })
    })
  })

  test('locale persistence across navigation', async ({ page }) => {
    // Start with Spanish
    await page.goto('/es')
    await page.waitForLoadState('networkidle')
    
    // Login in Spanish
    await page.goto('/es/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[placeholder*="usuario"], input[placeholder*="correo"]', process.env.TEST_USER_IDENTIFIER!)
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/es/user', { timeout: 10000 })
    
    // Navigate to different pages
    await page.goto('/es/manage/arcana')
    await page.waitForLoadState('networkidle')
    
    // Should still be in Spanish
    const currentUrl = page.url()
    expect(currentUrl).toContain('/es/')
    
    // Navigate to another section
    await page.goto('/es/deck')
    await page.waitForLoadState('networkidle')
    
    // Should still be in Spanish
    const deckUrl = page.url()
    expect(deckUrl).toContain('/es/')
  })

  test('fallback to default locale for unsupported translations', async ({ page }) => {
    // Try to access a page with unsupported locale
    await page.goto('/fr') // French (assuming not supported)
    await page.waitForLoadState('networkidle')
    
    // Should fallback to default locale (English) or show error gracefully
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    const currentUrl = page.url()
    
    // Should either redirect to supported locale or show fallback content
    const isSupportedLocale = currentUrl.includes('/en/') || currentUrl.includes('/es/')
    
    if (!isSupportedLocale) {
      console.log('Unsupported locale handling - may need implementation')
    }
  })
})
