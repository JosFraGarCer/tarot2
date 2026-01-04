import { describe, it, expect } from 'vitest'

// Utilidades de fecha y tiempo puras
class DateTimeUtils {
  static formatDate(date: Date | string, format: 'ISO' | 'US' | 'EU' | 'relative' = 'ISO'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }

    switch (format) {
      case 'ISO':
        return dateObj.toISOString().split('T')[0]
      
      case 'US':
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      
      case 'EU':
        return dateObj.toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      
      case 'relative':
        return this.getRelativeTime(dateObj)
      
      default:
        return dateObj.toISOString()
    }
  }

  static formatTime(date: Date | string, format: '24h' | '12h' | 'time-only' = '24h'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Time'
    }

    switch (format) {
      case '24h':
        return dateObj.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      
      case '12h':
        return dateObj.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      
      case 'time-only':
        return dateObj.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      
      default:
        return dateObj.toLocaleTimeString()
    }
  }

  static formatDateTime(date: Date | string, dateFormat: 'ISO' | 'US' | 'EU' = 'ISO', timeFormat: '24h' | '12h' = '24h'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid DateTime'
    }

    const dateStr = this.formatDate(dateObj, dateFormat)
    const timeStr = this.formatTime(dateObj, timeFormat)
    
    return `${dateStr} ${timeStr}`
  }

  static getRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffSeconds < 60) {
      return 'just now'
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`
    } else if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`
    } else {
      return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`
    }
  }

  static isValidDate(date: any): boolean {
    if (date instanceof Date) {
      return !isNaN(date.getTime())
    }
    
    if (typeof date === 'string') {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime())
    }
    
    return false
  }

  static isToday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    
    return dateObj.getDate() === today.getDate() &&
           dateObj.getMonth() === today.getMonth() &&
           dateObj.getFullYear() === today.getFullYear()
  }

  static isYesterday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    return dateObj.getDate() === yesterday.getDate() &&
           dateObj.getMonth() === yesterday.getMonth() &&
           dateObj.getFullYear() === yesterday.getFullYear()
  }

  static isTomorrow(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return dateObj.getDate() === tomorrow.getDate() &&
           dateObj.getMonth() === tomorrow.getMonth() &&
           dateObj.getFullYear() === tomorrow.getFullYear()
  }

  static isThisWeek(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6))
    
    return dateObj >= startOfWeek && dateObj <= endOfWeek
  }

  static isThisMonth(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    
    return dateObj.getMonth() === now.getMonth() &&
           dateObj.getFullYear() === now.getFullYear()
  }

  static isThisYear(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    
    return dateObj.getFullYear() === now.getFullYear()
  }

  static addDays(date: Date | string, days: number): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
    dateObj.setDate(dateObj.getDate() + days)
    return dateObj
  }

  static addMonths(date: Date | string, months: number): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
    dateObj.setMonth(dateObj.getMonth() + months)
    return dateObj
  }

  static addYears(date: Date | string, years: number): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
    dateObj.setFullYear(dateObj.getFullYear() + years)
    return dateObj
  }

  static subtractDays(date: Date | string, days: number): Date {
    return this.addDays(date, -days)
  }

  static subtractMonths(date: Date | string, months: number): Date {
    return this.addMonths(date, -months)
  }

  static subtractYears(date: Date | string, years: number): Date {
    return this.addYears(date, -years)
  }

  static getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate()
  }

  static getFirstDayOfMonth(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
  }

  static getLastDayOfMonth(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0)
  }

  static getStartOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
  }

  static getEndOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999)
  }

  static getStartOfWeek(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const start = new Date(dateObj)
    const day = start.getDay()
    const diff = start.getDate() - day
    return new Date(start.setDate(diff))
  }

  static getEndOfWeek(date: Date | string): Date {
    const startOfWeek = this.getStartOfWeek(date)
    return this.addDays(startOfWeek, 6)
  }

  static getStartOfMonth(date: Date | string): Date {
    return this.getFirstDayOfMonth(date)
  }

  static getEndOfMonth(date: Date | string): Date {
    return this.getLastDayOfMonth(date)
  }

  static getStartOfYear(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Date(dateObj.getFullYear(), 0, 1)
  }

  static getEndOfYear(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Date(dateObj.getFullYear(), 11, 31, 23, 59, 59, 999)
  }

  static diffInDays(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2
    const timeDiff = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  static diffInHours(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2
    const timeDiff = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(timeDiff / (1000 * 60 * 60))
  }

  static diffInMinutes(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2
    const timeDiff = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(timeDiff / (1000 * 60))
  }

  static diffInSeconds(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2
    const timeDiff = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(timeDiff / 1000)
  }

  static isWeekend(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const day = dateObj.getDay()
    return day === 0 || day === 6 // Sunday or Saturday
  }

  static isBusinessDay(date: Date | string): boolean {
    return !this.isWeekend(date)
  }

  static getBusinessDaysBetween(startDate: Date | string, endDate: Date | string): number {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate
    let count = 0
    const current = new Date(start)
    
    while (current <= end) {
      if (this.isBusinessDay(current)) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return count
  }

  static getAge(birthDate: Date | string): number {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  }

  static getQuarter(date: Date | string): number {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const month = dateObj.getMonth()
    return Math.floor(month / 3) + 1
  }

  static getQuarterName(date: Date | string): string {
    const quarter = this.getQuarter(date)
    return `Q${quarter}`
  }

  static getWeekOfYear(date: Date | string): number {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const startOfYear = new Date(dateObj.getFullYear(), 0, 1)
    const dayOfYear = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1
    return Math.ceil(dayOfYear / 7)
  }

  static isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2
    
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear()
  }

  static isBefore(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2
    return d1 < d2
  }

  static isAfter(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2
    return d1 > d2
  }

  static isBetween(date: Date | string, start: Date | string, end: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date
    const s = typeof start === 'string' ? new Date(start) : start
    const e = typeof end === 'string' ? new Date(end) : end
    return d >= s && d <= e
  }
}

describe('DateTime Utils', () => {
  describe('formatDate', () => {
    it('should format date in ISO format', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = DateTimeUtils.formatDate(date, 'ISO')
      expect(result).toBe('2024-01-15')
    })

    it('should format date in US format', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = DateTimeUtils.formatDate(date, 'US')
      expect(result).toBe('01/15/2024')
    })

    it('should format date in EU format', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = DateTimeUtils.formatDate(date, 'EU')
      expect(result).toBe('15/01/2024')
    })

    it('should format date in relative format', () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
      const result = DateTimeUtils.formatDate(pastDate, 'relative')
      expect(result).toBe('1 day ago')
    })

    it('should handle invalid date', () => {
      const result = DateTimeUtils.formatDate(new Date('invalid'), 'ISO')
      expect(result).toBe('Invalid Date')
    })
  })

  describe('formatTime', () => {
    it('should format time in 24h format', () => {
      const date = new Date('2024-01-15T14:30:45Z')
      const result = DateTimeUtils.formatTime(date, '24h')
      expect(result).toBe('14:30:45')
    })

    it('should format time in 12h format', () => {
      const date = new Date('2024-01-15T14:30:45Z')
      const result = DateTimeUtils.formatTime(date, '12h')
      expect(result).toBe('2:30:45 PM')
    })

    it('should format time only', () => {
      const date = new Date('2024-01-15T14:30:45Z')
      const result = DateTimeUtils.formatTime(date, 'time-only')
      expect(result).toBe('14:30')
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const date = new Date('2024-01-15T14:30:45Z')
      const result = DateTimeUtils.formatDateTime(date, 'US', '12h')
      expect(result).toBe('01/15/2024 2:30:45 PM')
    })
  })

  describe('getRelativeTime', () => {
    it('should return "just now" for recent dates', () => {
      const now = new Date()
      const recent = new Date(now.getTime() - 30 * 1000) // 30 seconds ago
      const result = DateTimeUtils.getRelativeTime(recent)
      expect(result).toBe('just now')
    })

    it('should return minutes ago', () => {
      const now = new Date()
      const minutesAgo = new Date(now.getTime() - 30 * 60 * 1000) // 30 minutes ago
      const result = DateTimeUtils.getRelativeTime(minutesAgo)
      expect(result).toBe('30 minutes ago')
    })

    it('should return hours ago', () => {
      const now = new Date()
      const hoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000) // 5 hours ago
      const result = DateTimeUtils.getRelativeTime(hoursAgo)
      expect(result).toBe('5 hours ago')
    })

    it('should return days ago', () => {
      const now = new Date()
      const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      const result = DateTimeUtils.getRelativeTime(daysAgo)
      expect(result).toBe('3 days ago')
    })
  })

  describe('isValidDate', () => {
    it('should validate valid date objects', () => {
      expect(DateTimeUtils.isValidDate(new Date())).toBe(true)
    })

    it('should validate valid date strings', () => {
      expect(DateTimeUtils.isValidDate('2024-01-15')).toBe(true)
    })

    it('should reject invalid dates', () => {
      expect(DateTimeUtils.isValidDate('invalid')).toBe(false)
      expect(DateTimeUtils.isValidDate(null)).toBe(false)
      expect(DateTimeUtils.isValidDate(undefined)).toBe(false)
    })
  })

  describe('Date comparison methods', () => {
    it('should detect today', () => {
      expect(DateTimeUtils.isToday(new Date())).toBe(true)
    })

    it('should detect yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(DateTimeUtils.isYesterday(yesterday)).toBe(true)
    })

    it('should detect tomorrow', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(DateTimeUtils.isTomorrow(tomorrow)).toBe(true)
    })

    it('should detect this week', () => {
      expect(DateTimeUtils.isThisWeek(new Date())).toBe(true)
    })

    it('should detect this month', () => {
      expect(DateTimeUtils.isThisMonth(new Date())).toBe(true)
    })

    it('should detect this year', () => {
      expect(DateTimeUtils.isThisYear(new Date())).toBe(true)
    })
  })

  describe('Date arithmetic', () => {
    it('should add days', () => {
      const date = new Date('2024-01-15')
      const result = DateTimeUtils.addDays(date, 5)
      expect(result.getDate()).toBe(20)
    })

    it('should subtract days', () => {
      const date = new Date('2024-01-15')
      const result = DateTimeUtils.subtractDays(date, 5)
      expect(result.getDate()).toBe(10)
    })

    it('should add months', () => {
      const date = new Date('2024-01-15')
      const result = DateTimeUtils.addMonths(date, 2)
      expect(result.getMonth()).toBe(2) // March (0-indexed)
    })

    it('should add years', () => {
      const date = new Date('2024-01-15')
      const result = DateTimeUtils.addYears(date, 1)
      expect(result.getFullYear()).toBe(2025)
    })
  })

  describe('Date boundaries', () => {
    it('should get first day of month', () => {
      const date = new Date('2024-01-15')
      const result = DateTimeUtils.getFirstDayOfMonth(date)
      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(0)
    })

    it('should get last day of month', () => {
      const date = new Date('2024-01-15')
      const result = DateTimeUtils.getLastDayOfMonth(date)
      expect(result.getDate()).toBe(31)
    })

    it('should get start of day', () => {
      const date = new Date('2024-01-15T14:30:45')
      const result = DateTimeUtils.getStartOfDay(date)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })

    it('should get end of day', () => {
      const date = new Date('2024-01-15T14:30:45')
      const result = DateTimeUtils.getEndOfDay(date)
      expect(result.getHours()).toBe(23)
      expect(result.getMinutes()).toBe(59)
      expect(result.getSeconds()).toBe(59)
    })
  })

  describe('Date differences', () => {
    it('should calculate difference in days', () => {
      const date1 = new Date('2024-01-15')
      const date2 = new Date('2024-01-20')
      const result = DateTimeUtils.diffInDays(date1, date2)
      expect(result).toBe(5)
    })

    it('should calculate difference in hours', () => {
      const date1 = new Date('2024-01-15T10:00:00')
      const date2 = new Date('2024-01-15T15:00:00')
      const result = DateTimeUtils.diffInHours(date1, date2)
      expect(result).toBe(5)
    })

    it('should calculate difference in minutes', () => {
      const date1 = new Date('2024-01-15T10:00:00')
      const date2 = new Date('2024-01-15T10:30:00')
      const result = DateTimeUtils.diffInMinutes(date1, date2)
      expect(result).toBe(30)
    })
  })

  describe('Business logic', () => {
    it('should detect weekends', () => {
      const saturday = new Date('2024-01-13') // Saturday
      const sunday = new Date('2024-01-14') // Sunday
      const monday = new Date('2024-01-15') // Monday

      expect(DateTimeUtils.isWeekend(saturday)).toBe(true)
      expect(DateTimeUtils.isWeekend(sunday)).toBe(true)
      expect(DateTimeUtils.isWeekend(monday)).toBe(false)
    })

    it('should detect business days', () => {
      const saturday = new Date('2024-01-13') // Saturday
      const monday = new Date('2024-01-15') // Monday

      expect(DateTimeUtils.isBusinessDay(saturday)).toBe(false)
      expect(DateTimeUtils.isBusinessDay(monday)).toBe(true)
    })

    it('should count business days between dates', () => {
      const start = new Date('2024-01-15') // Monday
      const end = new Date('2024-01-19') // Friday
      const result = DateTimeUtils.getBusinessDaysBetween(start, end)
      expect(result).toBe(5) // Monday to Friday
    })
  })

  describe('Age calculation', () => {
    it('should calculate age correctly', () => {
      const birthDate = new Date('2000-01-15')
      const result = DateTimeUtils.getAge(birthDate)
      expect(result).toBeGreaterThanOrEqual(24) // Age depends on current date
    })
  })

  describe('Leap year', () => {
    it('should detect leap years', () => {
      expect(DateTimeUtils.isLeapYear(2024)).toBe(true)
      expect(DateTimeUtils.isLeapYear(2020)).toBe(true)
      expect(DateTimeUtils.isLeapYear(2021)).toBe(false)
      expect(DateTimeUtils.isLeapYear(1900)).toBe(false)
      expect(DateTimeUtils.isLeapYear(2000)).toBe(true)
    })
  })

  describe('Quarter and week', () => {
    it('should get quarter', () => {
      const q1 = new Date('2024-01-15')
      const q2 = new Date('2024-04-15')
      const q3 = new Date('2024-07-15')
      const q4 = new Date('2024-10-15')

      expect(DateTimeUtils.getQuarter(q1)).toBe(1)
      expect(DateTimeUtils.getQuarter(q2)).toBe(2)
      expect(DateTimeUtils.getQuarter(q3)).toBe(3)
      expect(DateTimeUtils.getQuarter(q4)).toBe(4)
    })

    it('should get quarter name', () => {
      const date = new Date('2024-01-15')
      expect(DateTimeUtils.getQuarterName(date)).toBe('Q1')
    })

    it('should get week of year', () => {
      const date = new Date('2024-01-15')
      const result = DateTimeUtils.getWeekOfYear(date)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(53)
    })
  })

  describe('Date comparison', () => {
    it('should check if same day', () => {
      const date1 = new Date('2024-01-15T10:00:00')
      const date2 = new Date('2024-01-15T15:30:00')
      expect(DateTimeUtils.isSameDay(date1, date2)).toBe(true)
    })

    it('should check if date is before another', () => {
      const date1 = new Date('2024-01-15')
      const date2 = new Date('2024-01-20')
      expect(DateTimeUtils.isBefore(date1, date2)).toBe(true)
      expect(DateTimeUtils.isBefore(date2, date1)).toBe(false)
    })

    it('should check if date is after another', () => {
      const date1 = new Date('2024-01-15')
      const date2 = new Date('2024-01-20')
      expect(DateTimeUtils.isAfter(date2, date1)).toBe(true)
      expect(DateTimeUtils.isAfter(date1, date2)).toBe(false)
    })

    it('should check if date is between two dates', () => {
      const date = new Date('2024-01-15')
      const start = new Date('2024-01-10')
      const end = new Date('2024-01-20')
      
      expect(DateTimeUtils.isBetween(date, start, end)).toBe(true)
      expect(DateTimeUtils.isBetween(start, date, end)).toBe(false)
    })
  })
})
