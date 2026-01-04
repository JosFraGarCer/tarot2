import { describe, it, expect } from 'vitest'

// Utilidades de validación y sanitización pura
class ValidationUtils {
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email is required' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' }
    }

    if (email.length > 254) {
      return { isValid: false, error: 'Email too long' }
    }

    return { isValid: true }
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!password) {
      errors.push('Password is required')
      return { isValid: false, errors }
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters')
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateSlug(slug: string): { isValid: boolean; error?: string } {
    if (!slug) {
      return { isValid: false, error: 'Slug is required' }
    }

    if (slug.length > 100) {
      return { isValid: false, error: 'Slug too long' }
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
      return { isValid: false, error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens' }
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      return { isValid: false, error: 'Slug cannot start or end with hyphen' }
    }

    return { isValid: true }
  }

  static validateUrl(url: string): { isValid: boolean; error?: string } {
    if (!url) {
      return { isValid: false, error: 'URL is required' }
    }

    try {
      const urlObj = new URL(url)
      
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' }
      }

      if (url.length > 2048) {
        return { isValid: false, error: 'URL too long' }
      }

      return { isValid: true }
    } catch {
      return { isValid: false, error: 'Invalid URL format' }
    }
  }

  static validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
    if (!phone) {
      return { isValid: false, error: 'Phone number is required' }
    }

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')

    if (cleaned.length < 10 || cleaned.length > 15) {
      return { isValid: false, error: 'Phone number must be between 10 and 15 digits' }
    }

    return { isValid: true }
  }

  static validateCreditCard(cardNumber: string): { isValid: boolean; error?: string } {
    if (!cardNumber) {
      return { isValid: false, error: 'Card number is required' }
    }

    const cleaned = cardNumber.replace(/\D/g, '')

    if (cleaned.length < 13 || cleaned.length > 19) {
      return { isValid: false, error: 'Invalid card number length' }
    }

    // Luhn algorithm
    let sum = 0
    let isEven = false

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i])

      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }

      sum += digit
      isEven = !isEven
    }

    if (sum % 10 !== 0) {
      return { isValid: false, error: 'Invalid card number' }
    }

    return { isValid: true }
  }

  static validateDate(date: string, format: 'ISO' | 'US' | 'EU' = 'ISO'): { isValid: boolean; error?: string } {
    if (!date) {
      return { isValid: false, error: 'Date is required' }
    }

    let parsedDate: Date

    switch (format) {
      case 'ISO':
        parsedDate = new Date(date)
        if (isNaN(parsedDate.getTime())) {
          return { isValid: false, error: 'Invalid ISO date format' }
        }
        break

      case 'US':
        const usRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        const usMatch = date.match(usRegex)
        if (!usMatch) {
          return { isValid: false, error: 'Invalid US date format (MM/DD/YYYY)' }
        }
        parsedDate = new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]))
        break

      case 'EU':
        const euRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/
        const euMatch = date.match(euRegex)
        if (!euMatch) {
          return { isValid: false, error: 'Invalid EU date format (DD.MM.YYYY)' }
        }
        parsedDate = new Date(parseInt(euMatch[3]), parseInt(euMatch[2]) - 1, parseInt(euMatch[1]))
        break

      default:
        return { isValid: false, error: 'Unsupported date format' }
    }

    if (isNaN(parsedDate.getTime())) {
      return { isValid: false, error: 'Invalid date' }
    }

    return { isValid: true }
  }

  static sanitizeHtml(html: string): string {
    if (!html) return ''

    return html
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .replace(/\//g, '/')
  }

  static sanitizeInput(input: string, options: { maxLength?: number; allowHtml?: boolean } = {}): string {
    if (!input) return ''

    let sanitized = input.toString()

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '')

    // Trim whitespace
    sanitized = sanitized.trim()

    // Remove control characters except tab, newline, and carriage return
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    if (!options.allowHtml) {
      sanitized = this.sanitizeHtml(sanitized)
    }

    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength)
    }

    return sanitized
  }

  static validateAndSanitizeInput(input: string, validationRules: any): { 
    isValid: boolean; 
    sanitized?: string; 
    errors: string[] 
  } {
    const errors: string[] = []
    let sanitized = input

    // Apply sanitization first
    sanitized = this.sanitizeInput(sanitized, {
      maxLength: validationRules.maxLength,
      allowHtml: validationRules.allowHtml
    })

    // Apply validation rules
    if (validationRules.required && !sanitized) {
      errors.push('This field is required')
    }

    if (validationRules.minLength && sanitized.length < validationRules.minLength) {
      errors.push(`Minimum length is ${validationRules.minLength} characters`)
    }

    if (validationRules.maxLength && sanitized.length > validationRules.maxLength) {
      errors.push(`Maximum length is ${validationRules.maxLength} characters`)
    }

    if (validationRules.pattern && !validationRules.pattern.test(sanitized)) {
      errors.push('Invalid format')
    }

    if (validationRules.custom) {
      const customResult = validationRules.custom(sanitized)
      if (customResult !== true) {
        errors.push(customResult || 'Invalid value')
      }
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    }
  }

  static validateJson(jsonString: string): { isValid: boolean; parsed?: any; error?: string } {
    if (!jsonString) {
      return { isValid: false, error: 'JSON string is required' }
    }

    try {
      const parsed = JSON.parse(jsonString)
      return { isValid: true, parsed }
    } catch (error) {
      return { isValid: false, error: 'Invalid JSON format' }
    }
  }

  static validateCsv(csvString: string): { isValid: boolean; rows?: string[][]; error?: string } {
    if (!csvString) {
      return { isValid: false, error: 'CSV string is required' }
    }

    try {
      const rows = csvString.split('\n').map(row => {
        // Simple CSV parsing - handles quoted fields
        const result = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < row.length; i++) {
          const char = row[i]
          
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        
        result.push(current.trim())
        return result
      })

      return { isValid: true, rows }
    } catch (error) {
      return { isValid: false, error: 'Invalid CSV format' }
    }
  }

  static validateFileName(fileName: string): { isValid: boolean; error?: string } {
    if (!fileName) {
      return { isValid: false, error: 'File name is required' }
    }

    if (fileName.length > 255) {
      return { isValid: false, error: 'File name too long' }
    }

    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(fileName)) {
      return { isValid: false, error: 'File name contains invalid characters' }
    }

    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
    const baseName = fileName.split('.')[0].toUpperCase()
    if (reservedNames.includes(baseName)) {
      return { isValid: false, error: 'File name uses reserved name' }
    }

    return { isValid: true }
  }

  static validateColor(color: string): { isValid: boolean; error?: string } {
    if (!color) {
      return { isValid: false, error: 'Color is required' }
    }

    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/
    const rgbaRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|1|0?\.\d+)\s*\)$/

    if (!hexRegex.test(color) && !rgbRegex.test(color) && !rgbaRegex.test(color)) {
      return { isValid: false, error: 'Invalid color format. Use hex, rgb, or rgba' }
    }

    return { isValid: true }
  }
}

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = ValidationUtils.validateEmail('test@example.com')
      expect(result.isValid).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(ValidationUtils.validateEmail('invalid-email').isValid).toBe(false)
      expect(ValidationUtils.validateEmail('test@').isValid).toBe(false)
      expect(ValidationUtils.validateEmail('@example.com').isValid).toBe(false)
      expect(ValidationUtils.validateEmail('test.example.com').isValid).toBe(false)
    })

    it('should reject empty email', () => {
      const result = ValidationUtils.validateEmail('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Email is required')
    })

    it('should reject email too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      const result = ValidationUtils.validateEmail(longEmail)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Email too long')
    })
  })

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = ValidationUtils.validatePassword('StrongPass123!')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject weak passwords', () => {
      expect(ValidationUtils.validatePassword('weak').isValid).toBe(false)
      expect(ValidationUtils.validatePassword('12345678').isValid).toBe(false)
      expect(ValidationUtils.validatePassword('lowercase').isValid).toBe(false)
      expect(ValidationUtils.validatePassword('UPPERCASE').isValid).toBe(false)
      expect(ValidationUtils.validatePassword('NoNumbers!').isValid).toBe(false)
      expect(ValidationUtils.validatePassword('NoSpecial123').isValid).toBe(false)
    })

    it('should provide specific error messages', () => {
      const result = ValidationUtils.validatePassword('weak')
      expect(result.errors).toContain('Password must be at least 8 characters')
    })
  })

  describe('validateSlug', () => {
    it('should validate correct slug', () => {
      const result = ValidationUtils.validateSlug('my-awesome-post')
      expect(result.isValid).toBe(true)
    })

    it('should reject invalid slugs', () => {
      expect(ValidationUtils.validateSlug('Invalid_Slug').isValid).toBe(false)
      expect(ValidationUtils.validateSlug('slug with spaces').isValid).toBe(false)
      expect(ValidationUtils.validateSlug('-starts-with-hyphen').isValid).toBe(false)
      expect(ValidationUtils.validateSlug('ends-with-hyphen-').isValid).toBe(false)
    })

    it('should reject empty slug', () => {
      const result = ValidationUtils.validateSlug('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Slug is required')
    })
  })

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(ValidationUtils.validateUrl('https://example.com').isValid).toBe(true)
      expect(ValidationUtils.validateUrl('http://example.com').isValid).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(ValidationUtils.validateUrl('not-a-url').isValid).toBe(false)
      expect(ValidationUtils.validateUrl('ftp://example.com').isValid).toBe(false)
    })

    it('should reject empty URL', () => {
      const result = ValidationUtils.validateUrl('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('URL is required')
    })
  })

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(ValidationUtils.validatePhoneNumber('1234567890').isValid).toBe(true)
      expect(ValidationUtils.validatePhoneNumber('+1234567890').isValid).toBe(true)
      expect(ValidationUtils.validatePhoneNumber('(123) 456-7890').isValid).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(ValidationUtils.validatePhoneNumber('123').isValid).toBe(false)
      expect(ValidationUtils.validatePhoneNumber('12345678901234567890').isValid).toBe(false)
    })
  })

  describe('validateCreditCard', () => {
    it('should validate correct credit card numbers', () => {
      // Valid Visa test number
      expect(ValidationUtils.validateCreditCard('4111111111111111').isValid).toBe(true)
      // Valid MasterCard test number
      expect(ValidationUtils.validateCreditCard('5555555555554444').isValid).toBe(true)
    })

    it('should reject invalid credit card numbers', () => {
      expect(ValidationUtils.validateCreditCard('1234567890123456').isValid).toBe(false)
      expect(ValidationUtils.validateCreditCard('4111111111111112').isValid).toBe(false)
    })
  })

  describe('validateDate', () => {
    it('should validate ISO dates', () => {
      expect(ValidationUtils.validateDate('2024-01-15').isValid).toBe(true)
      expect(ValidationUtils.validateDate('2024-01-15T10:30:00Z').isValid).toBe(true)
    })

    it('should validate US format dates', () => {
      expect(ValidationUtils.validateDate('01/15/2024', 'US').isValid).toBe(true)
      expect(ValidationUtils.validateDate('12/31/2024', 'US').isValid).toBe(true)
    })

    it('should validate EU format dates', () => {
      expect(ValidationUtils.validateDate('15.01.2024', 'EU').isValid).toBe(true)
      expect(ValidationUtils.validateDate('31.12.2024', 'EU').isValid).toBe(true)
    })

    it('should reject invalid dates', () => {
      expect(ValidationUtils.validateDate('invalid-date').isValid).toBe(false)
      expect(ValidationUtils.validateDate('2024-13-01').isValid).toBe(false)
    })
  })

  describe('sanitizeHtml', () => {
    it('should sanitize HTML tags', () => {
      const result = ValidationUtils.sanitizeHtml('<script>alert("xss")</script>')
      expect(result).toBe('<script>alert("xss")</script>')
    })

    it('should handle empty input', () => {
      expect(ValidationUtils.sanitizeHtml('')).toBe('')
      expect(ValidationUtils.sanitizeHtml(null as any)).toBe('')
    })
  })

  describe('sanitizeInput', () => {
    it('should sanitize and trim input', () => {
      const result = ValidationUtils.sanitizeInput('  hello world  ')
      expect(result).toBe('hello world')
    })

    it('should remove control characters', () => {
      const result = ValidationUtils.sanitizeInput('hello\x00world')
      expect(result).toBe('helloworld')
    })

    it('should limit length', () => {
      const result = ValidationUtils.sanitizeInput('a'.repeat(100), { maxLength: 10 })
      expect(result.length).toBe(10)
    })

    it('should allow HTML when specified', () => {
      const result = ValidationUtils.sanitizeInput('<b>bold</b>', { allowHtml: true })
      expect(result).toBe('<b>bold</b>')
    })
  })

  describe('validateAndSanitizeInput', () => {
    it('should validate and sanitize input', () => {
      const result = ValidationUtils.validateAndSanitizeInput('  test  ', {
        required: true,
        minLength: 2,
        maxLength: 10
      })

      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('test')
    })

    it('should return validation errors', () => {
      const result = ValidationUtils.validateAndSanitizeInput('', {
        required: true
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('This field is required')
    })

    it('should apply custom validation', () => {
      const result = ValidationUtils.validateAndSanitizeInput('test', {
        custom: (value: string) => value === 'valid' || 'Must be "valid"'
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Must be "valid"')
    })
  })

  describe('validateJson', () => {
    it('should validate correct JSON', () => {
      const result = ValidationUtils.validateJson('{"name": "test"}')
      expect(result.isValid).toBe(true)
      expect(result.parsed).toEqual({ name: 'test' })
    })

    it('should reject invalid JSON', () => {
      const result = ValidationUtils.validateJson('{"name": "test"')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid JSON format')
    })
  })

  describe('validateCsv', () => {
    it('should validate correct CSV', () => {
      const csv = 'name,age,city\nJohn,25,NYC\nJane,30,LA'
      const result = ValidationUtils.validateCsv(csv)
      expect(result.isValid).toBe(true)
      expect(result.rows).toHaveLength(3)
    })

    it('should handle quoted CSV fields', () => {
      const csv = 'name,description\nProduct,"Description with, comma"'
      const result = ValidationUtils.validateCsv(csv)
      expect(result.isValid).toBe(true)
      expect(result.rows?.[1][1]).toBe('Description with, comma')
    })
  })

  describe('validateFileName', () => {
    it('should validate correct file names', () => {
      expect(ValidationUtils.validateFileName('document.pdf').isValid).toBe(true)
      expect(ValidationUtils.validateFileName('my-file_2024.txt').isValid).toBe(true)
    })

    it('should reject invalid file names', () => {
      expect(ValidationUtils.validateFileName('file<>name.txt').isValid).toBe(false)
      expect(ValidationUtils.validateFileName('CON.txt').isValid).toBe(false)
    })
  })

  describe('validateColor', () => {
    it('should validate hex colors', () => {
      expect(ValidationUtils.validateColor('#FF0000').isValid).toBe(true)
      expect(ValidationUtils.validateColor('#F00').isValid).toBe(true)
    })

    it('should validate RGB colors', () => {
      expect(ValidationUtils.validateColor('rgb(255, 0, 0)').isValid).toBe(true)
      expect(ValidationUtils.validateColor('rgba(255, 0, 0, 0.5)').isValid).toBe(true)
    })

    it('should reject invalid colors', () => {
      expect(ValidationUtils.validateColor('not-a-color').isValid).toBe(false)
      expect(ValidationUtils.validateColor('#GGGGGG').isValid).toBe(false)
    })
  })
})
