import { describe, it, expect } from 'vitest'

// Utilidades de algoritmos y cálculos puras
class CalculationUtils {
  static calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0
    return Math.round((value / total) * 100 * 100) / 100 // Round to 2 decimal places
  }

  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100 * 100) / 100
  }

  static calculateCompoundInterest(principal: number, rate: number, time: number, frequency: number = 1): number {
    return Math.round(principal * Math.pow(1 + rate / (100 * frequency), frequency * time) * 100) / 100
  }

  static calculateSimpleInterest(principal: number, rate: number, time: number): number {
    return Math.round((principal * rate * time / 100) * 100) / 100
  }

  static calculateDiscount(originalPrice: number, discountPercent: number): number {
    const discount = (originalPrice * discountPercent) / 100
    return Math.round((originalPrice - discount) * 100) / 100
  }

  static calculateTax(amount: number, taxRate: number): number {
    const tax = (amount * taxRate) / 100
    return Math.round(tax * 100) / 100
  }

  static calculateTip(billAmount: number, tipPercent: number): number {
    const tip = (billAmount * tipPercent) / 100
    return Math.round(tip * 100) / 100
  }

  static calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const sum = numbers.reduce((acc, num) => acc + num, 0)
    return Math.round((sum / numbers.length) * 100) / 100
  }

  static calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0
    
    const sorted = [...numbers].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    
    if (sorted.length % 2 === 0) {
      return Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 100) / 100
    } else {
      return sorted[middle]
    }
  }

  static calculateMode(numbers: number[]): number | null {
    if (numbers.length === 0) return null
    
    const frequency: Record<number, number> = {}
    numbers.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1
    })
    
    let maxFreq = 0
    let mode = null
    
    Object.entries(frequency).forEach(([num, freq]) => {
      if (freq > maxFreq) {
        maxFreq = freq
        mode = parseFloat(num)
      }
    })
    
    return mode
  }

  static calculateStandardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0
    
    const mean = this.calculateAverage(numbers)
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2))
    const variance = this.calculateAverage(squaredDiffs)
    
    return Math.round(Math.sqrt(variance) * 100) / 100
  }

  static calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0
    
    const mean = this.calculateAverage(numbers)
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2))
    
    return Math.round(this.calculateAverage(squaredDiffs) * 100) / 100
  }

  static calculateRange(numbers: number[]): number {
    if (numbers.length === 0) return 0
    
    const min = Math.min(...numbers)
    const max = Math.max(...numbers)
    
    return max - min
  }

  static calculateQuartiles(numbers: number[]): { q1: number; q2: number; q3: number } {
    if (numbers.length === 0) {
      return { q1: 0, q2: 0, q3: 0 }
    }
    
    const sorted = [...numbers].sort((a, b) => a - b)
    const n = sorted.length
    
    const q2 = this.calculateMedian(sorted)
    
    const lowerHalf = sorted.slice(0, Math.floor(n / 2))
    const upperHalf = sorted.slice(Math.ceil(n / 2))
    
    const q1 = this.calculateMedian(lowerHalf)
    const q3 = this.calculateMedian(upperHalf)
    
    return {
      q1: Math.round(q1 * 100) / 100,
      q2: Math.round(q2 * 100) / 100,
      q3: Math.round(q3 * 100) / 100
    }
  }

  static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0
    
    const n = x.length
    const meanX = this.calculateAverage(x)
    const meanY = this.calculateAverage(y)
    
    let numerator = 0
    let sumXSquared = 0
    let sumYSquared = 0
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - meanX
      const yDiff = y[i] - meanY
      
      numerator += xDiff * yDiff
      sumXSquared += xDiff * xDiff
      sumYSquared += yDiff * yDiff
    }
    
    const denominator = Math.sqrt(sumXSquared * sumYSquared)
    
    if (denominator === 0) return 0
    
    return Math.round((numerator / denominator) * 100) / 100
  }

  static fibonacci(n: number): number[] {
    if (n <= 0) return []
    if (n === 1) return [0]
    if (n === 2) return [0, 1]
    
    const fib = [0, 1]
    for (let i = 2; i < n; i++) {
      fib.push(fib[i - 1] + fib[i - 2])
    }
    
    return fib
  }

  static factorial(n: number): number {
    if (n < 0) throw new Error('Factorial is not defined for negative numbers')
    if (n === 0 || n === 1) return 1
    
    let result = 1
    for (let i = 2; i <= n; i++) {
      result *= i
    }
    
    return result
  }

  static isPrime(n: number): boolean {
    if (n < 2) return false
    if (n === 2) return true
    if (n % 2 === 0) return false
    
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false
    }
    
    return true
  }

  static getPrimes(limit: number): number[] {
    const primes: number[] = []
    
    for (let i = 2; i <= limit; i++) {
      if (this.isPrime(i)) {
        primes.push(i)
      }
    }
    
    return primes
  }

  static gcd(a: number, b: number): number {
    a = Math.abs(a)
    b = Math.abs(b)
    
    while (b !== 0) {
      const temp = b
      b = a % b
      a = temp
    }
    
    return a
  }

  static lcm(a: number, b: number): number {
    return Math.abs(a * b) / this.gcd(a, b)
  }

  static isPerfectSquare(n: number): boolean {
    if (n < 0) return false
    const sqrt = Math.sqrt(n)
    return Math.floor(sqrt) * Math.floor(sqrt) === n
  }

  static isPerfectNumber(n: number): boolean {
    if (n < 1) return false
    
    let sum = 1
    for (let i = 2; i <= n / 2; i++) {
      if (n % i === 0) {
        sum += i
      }
    }
    
    return sum === n
  }

  static calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1
    const dy = y2 - y1
    
    return Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100
  }

  static calculateSlope(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1
    const dy = y2 - y1
    
    if (dx === 0) return Infinity // Vertical line
    
    return Math.round((dy / dx) * 100) / 100
  }

  static calculateAreaOfCircle(radius: number): number {
    return Math.round(Math.PI * radius * radius * 100) / 100
  }

  static calculateAreaOfRectangle(length: number, width: number): number {
    return length * width
  }

  static calculateAreaOfTriangle(base: number, height: number): number {
    return (base * height) / 2
  }

  static calculateVolumeOfSphere(radius: number): number {
    return Math.round((4/3) * Math.PI * Math.pow(radius, 3) * 100) / 100
  }

  static calculateVolumeOfCube(side: number): number {
    return Math.pow(side, 3)
  }

  static calculateVolumeOfCylinder(radius: number, height: number): number {
    return Math.round(Math.PI * radius * radius * height * 100) / 100
  }

  static convertCelsiusToFahrenheit(celsius: number): number {
    return Math.round((celsius * 9/5 + 32) * 100) / 100
  }

  static convertFahrenheitToCelsius(fahrenheit: number): number {
    return Math.round((fahrenheit - 32) * 5/9 * 100) / 100
  }

  static convertMetersToFeet(meters: number): number {
    return Math.round(meters * 3.28084 * 100) / 100
  }

  static convertFeetToMeters(feet: number): number {
    return Math.round(feet / 3.28084 * 100) / 100
  }

  static convertKilogramsToPounds(kg: number): number {
    return Math.round(kg * 2.20462 * 100) / 100
  }

  static convertPoundsToKilograms(pounds: number): number {
    return Math.round(pounds / 2.20462 * 100) / 100
  }

  static calculateBMI(weight: number, height: number): number {
    if (height <= 0) return 0
    return Math.round((weight / (height * height)) * 100) / 100
  }

  static getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight'
    if (bmi < 25) return 'Normal weight'
    if (bmi < 30) return 'Overweight'
    return 'Obese'
  }

  static calculateLoanPayment(principal: number, rate: number, years: number): number {
    const monthlyRate = rate / 100 / 12
    const numPayments = years * 12
    
    if (monthlyRate === 0) {
      return Math.round((principal / numPayments) * 100) / 100
    }
    
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                   (Math.pow(1 + monthlyRate, numPayments) - 1)
    
    return Math.round(payment * 100) / 100
  }

  static calculateTotalInterest(principal: number, rate: number, years: number): number {
    const monthlyPayment = this.calculateLoanPayment(principal, rate, years)
    const totalPayments = monthlyPayment * years * 12
    
    return Math.round((totalPayments - principal) * 100) / 100
  }

  static calculateBreakEvenPoint(fixedCosts: number, variableCostPerUnit: number, pricePerUnit: number): number {
    if (pricePerUnit <= variableCostPerUnit) return Infinity
    
    return Math.ceil(fixedCosts / (pricePerUnit - variableCostPerUnit))
  }

  static calculateROI(initialInvestment: number, finalValue: number): number {
    if (initialInvestment === 0) return 0
    
    return Math.round(((finalValue - initialInvestment) / initialInvestment) * 100 * 100) / 100
  }

  static calculateNPV(cashFlows: number[], discountRate: number): number {
    return cashFlows.reduce((npv, cashFlow, index) => {
      return npv + cashFlow / Math.pow(1 + discountRate / 100, index)
    }, 0)
  }

  static calculateIRR(cashFlows: number[], guess: number = 0.1): number {
    // Simplified IRR calculation using Newton-Raphson method
    let rate = guess
    const tolerance = 0.0001
    const maxIterations = 100
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0
      let dnpv = 0
      
      cashFlows.forEach((cashFlow, index) => {
        const discountFactor = Math.pow(1 + rate, index)
        npv += cashFlow / discountFactor
        dnpv -= index * cashFlow / (discountFactor * (1 + rate))
      })
      
      const newRate = rate - npv / dnpv
      
      if (Math.abs(newRate - rate) < tolerance) {
        return Math.round(newRate * 10000) / 100 // Return as percentage
      }
      
      rate = newRate
    }
    
    return Math.round(rate * 10000) / 100 // Return as percentage
  }
}

describe('Calculation Utils', () => {
  describe('Percentage calculations', () => {
    it('should calculate percentage correctly', () => {
      expect(CalculationUtils.calculatePercentage(25, 100)).toBe(25)
      expect(CalculationUtils.calculatePercentage(1, 3)).toBe(33.33)
      expect(CalculationUtils.calculatePercentage(0, 100)).toBe(0)
      expect(CalculationUtils.calculatePercentage(50, 0)).toBe(0)
    })

    it('should calculate growth rate', () => {
      expect(CalculationUtils.calculateGrowthRate(120, 100)).toBe(20)
      expect(CalculationUtils.calculateGrowthRate(80, 100)).toBe(-20)
      expect(CalculationUtils.calculateGrowthRate(100, 100)).toBe(0)
      expect(CalculationUtils.calculateGrowthRate(200, 0)).toBe(100)
    })
  })

  describe('Financial calculations', () => {
    it('should calculate compound interest', () => {
      expect(CalculationUtils.calculateCompoundInterest(1000, 5, 2)).toBe(1102.5)
      expect(CalculationUtils.calculateCompoundInterest(1000, 0, 1)).toBe(1000)
    })

    it('should calculate simple interest', () => {
      expect(CalculationUtils.calculateSimpleInterest(1000, 5, 2)).toBe(100)
      expect(CalculationUtils.calculateSimpleInterest(1000, 0, 1)).toBe(0)
    })

    it('should calculate discount', () => {
      expect(CalculationUtils.calculateDiscount(100, 20)).toBe(80)
      expect(CalculationUtils.calculateDiscount(100, 0)).toBe(100)
      expect(CalculationUtils.calculateDiscount(100, 100)).toBe(0)
    })

    it('should calculate tax', () => {
      expect(CalculationUtils.calculateTax(100, 10)).toBe(10)
      expect(CalculationUtils.calculateTax(100, 0)).toBe(0)
    })

    it('should calculate tip', () => {
      expect(CalculationUtils.calculateTip(50, 15)).toBe(7.5)
      expect(CalculationUtils.calculateTip(50, 0)).toBe(0)
    })
  })

  describe('Statistical calculations', () => {
    it('should calculate average', () => {
      expect(CalculationUtils.calculateAverage([1, 2, 3, 4, 5])).toBe(3)
      expect(CalculationUtils.calculateAverage([10, 20])).toBe(15)
      expect(CalculationUtils.calculateAverage([])).toBe(0)
    })

    it('should calculate median', () => {
      expect(CalculationUtils.calculateMedian([1, 2, 3, 4, 5])).toBe(3)
      expect(CalculationUtils.calculateMedian([1, 2, 3, 4])).toBe(2.5)
      expect(CalculationUtils.calculateMedian([])).toBe(0)
    })

    it('should calculate mode', () => {
      expect(CalculationUtils.calculateMode([1, 2, 2, 3, 4])).toBe(2)
      expect(CalculationUtils.calculateMode([1, 2, 3, 4, 5])).toBe(1) // First element if no mode
      expect(CalculationUtils.calculateMode([])).toBeNull()
    })

    it('should calculate standard deviation', () => {
      expect(CalculationUtils.calculateStandardDeviation([1, 2, 3, 4, 5])).toBe(1.41)
      expect(CalculationUtils.calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2)
    })

    it('should calculate variance', () => {
      expect(CalculationUtils.calculateVariance([1, 2, 3, 4, 5])).toBe(2)
      expect(CalculationUtils.calculateVariance([])).toBe(0)
    })

    it('should calculate range', () => {
      expect(CalculationUtils.calculateRange([1, 2, 3, 4, 5])).toBe(4)
      expect(CalculationUtils.calculateRange([10, 10, 10])).toBe(0)
    })

    it('should calculate quartiles', () => {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const quartiles = CalculationUtils.calculateQuartiles(numbers)
      
      expect(quartiles.q1).toBe(3.25)
      expect(quartiles.q2).toBe(5.5)
      expect(quartiles.q3).toBe(7.75)
    })

    it('should calculate correlation', () => {
      const x = [1, 2, 3, 4, 5]
      const y = [2, 4, 6, 8, 10]
      expect(CalculationUtils.calculateCorrelation(x, y)).toBe(1)
      
      const x2 = [1, 2, 3, 4, 5]
      const y2 = [5, 4, 3, 2, 1]
      expect(CalculationUtils.calculateCorrelation(x2, y2)).toBe(-1)
    })
  })

  describe('Mathematical sequences', () => {
    it('should generate fibonacci sequence', () => {
      expect(CalculationUtils.fibonacci(1)).toEqual([0])
      expect(CalculationUtils.fibonacci(2)).toEqual([0, 1])
      expect(CalculationUtils.fibonacci(5)).toEqual([0, 1, 1, 2, 3])
      expect(CalculationUtils.fibonacci(0)).toEqual([])
    })

    it('should calculate factorial', () => {
      expect(CalculationUtils.factorial(0)).toBe(1)
      expect(CalculationUtils.factorial(1)).toBe(1)
      expect(CalculationUtils.factorial(5)).toBe(120)
      expect(CalculationUtils.factorial(10)).toBe(3628800)
    })

    it('should throw error for negative factorial', () => {
      expect(() => CalculationUtils.factorial(-1)).toThrow()
    })
  })

  describe('Number theory', () => {
    it('should identify prime numbers', () => {
      expect(CalculationUtils.isPrime(2)).toBe(true)
      expect(CalculationUtils.isPrime(3)).toBe(true)
      expect(CalculationUtils.isPrime(4)).toBe(false)
      expect(CalculationUtils.isPrime(17)).toBe(true)
      expect(CalculationUtils.isPrime(1)).toBe(false)
      expect(CalculationUtils.isPrime(0)).toBe(false)
    })

    it('should get prime numbers up to limit', () => {
      expect(CalculationUtils.getPrimes(10)).toEqual([2, 3, 5, 7])
      expect(CalculationUtils.getPrimes(2)).toEqual([2])
      expect(CalculationUtils.getPrimes(1)).toEqual([])
    })

    it('should calculate GCD', () => {
      expect(CalculationUtils.gcd(12, 8)).toBe(4)
      expect(CalculationUtils.gcd(17, 13)).toBe(1)
      expect(CalculationUtils.gcd(-12, 8)).toBe(4)
    })

    it('should calculate LCM', () => {
      expect(CalculationUtils.lcm(4, 6)).toBe(12)
      expect(CalculationUtils.lcm(7, 13)).toBe(91)
    })

    it('should check perfect squares', () => {
      expect(CalculationUtils.isPerfectSquare(0)).toBe(true)
      expect(CalculationUtils.isPerfectSquare(1)).toBe(true)
      expect(CalculationUtils.isPerfectSquare(4)).toBe(true)
      expect(CalculationUtils.isPerfectSquare(9)).toBe(true)
      expect(CalculationUtils.isPerfectSquare(2)).toBe(false)
      expect(CalculationUtils.isPerfectSquare(-4)).toBe(false)
    })

    it('should check perfect numbers', () => {
      expect(CalculationUtils.isPerfectNumber(6)).toBe(true)
      expect(CalculationUtils.isPerfectNumber(28)).toBe(true)
      expect(CalculationUtils.isPerfectNumber(12)).toBe(false)
      expect(CalculationUtils.isPerfectNumber(1)).toBe(false)
    })
  })

  describe('Geometry calculations', () => {
    it('should calculate distance between points', () => {
      expect(CalculationUtils.calculateDistance(0, 0, 3, 4)).toBe(5)
      expect(CalculationUtils.calculateDistance(1, 1, 1, 1)).toBe(0)
    })

    it('should calculate slope', () => {
      expect(CalculationUtils.calculateSlope(0, 0, 1, 1)).toBe(1)
      expect(CalculationUtils.calculateSlope(0, 0, 2, 4)).toBe(2)
      expect(CalculationUtils.calculateSlope(0, 0, 1, 0)).toBe(0)
      expect(CalculationUtils.calculateSlope(0, 0, 0, 1)).toBe(Infinity)
    })

    it('should calculate circle area', () => {
      expect(CalculationUtils.calculateAreaOfCircle(1)).toBe(3.14)
      expect(CalculationUtils.calculateAreaOfCircle(0)).toBe(0)
    })

    it('should calculate rectangle area', () => {
      expect(CalculationUtils.calculateAreaOfRectangle(5, 3)).toBe(15)
      expect(CalculationUtils.calculateAreaOfRectangle(0, 10)).toBe(0)
    })

    it('should calculate triangle area', () => {
      expect(CalculationUtils.calculateAreaOfTriangle(6, 4)).toBe(12)
      expect(CalculationUtils.calculateAreaOfTriangle(0, 10)).toBe(0)
    })

    it('should calculate sphere volume', () => {
      expect(CalculationUtils.calculateVolumeOfSphere(1)).toBe(4.19)
      expect(CalculationUtils.calculateVolumeOfSphere(0)).toBe(0)
    })

    it('should calculate cube volume', () => {
      expect(CalculationUtils.calculateVolumeOfCube(3)).toBe(27)
      expect(CalculationUtils.calculateVolumeOfCube(0)).toBe(0)
    })

    it('should calculate cylinder volume', () => {
      expect(CalculationUtils.calculateVolumeOfCylinder(1, 2)).toBe(6.28)
      expect(CalculationUtils.calculateVolumeOfCylinder(0, 10)).toBe(0)
    })
  })

  describe('Unit conversions', () => {
    it('should convert celsius to fahrenheit', () => {
      expect(CalculationUtils.convertCelsiusToFahrenheit(0)).toBe(32)
      expect(CalculationUtils.convertCelsiusToFahrenheit(100)).toBe(212)
      expect(CalculationUtils.convertCelsiusToFahrenheit(-40)).toBe(-40)
    })

    it('should convert fahrenheit to celsius', () => {
      expect(CalculationUtils.convertFahrenheitToCelsius(32)).toBe(0)
      expect(CalculationUtils.convertFahrenheitToCelsius(212)).toBe(100)
      expect(CalculationUtils.convertFahrenheitToCelsius(-40)).toBe(-40)
    })

    it('should convert meters to feet', () => {
      expect(CalculationUtils.convertMetersToFeet(1)).toBe(3.28)
      expect(CalculationUtils.convertMetersToFeet(0)).toBe(0)
    })

    it('should convert feet to meters', () => {
      expect(CalculationUtils.convertFeetToMeters(3.28)).toBe(1)
      expect(CalculationUtils.convertFeetToMeters(0)).toBe(0)
    })

    it('should convert kilograms to pounds', () => {
      expect(CalculationUtils.convertKilogramsToPounds(1)).toBe(2.2)
      expect(CalculationUtils.convertKilogramsToPounds(0)).toBe(0)
    })

    it('should convert pounds to kilograms', () => {
      expect(CalculationUtils.convertPoundsToKilograms(2.2)).toBe(1)
      expect(CalculationUtils.convertPoundsToKilograms(0)).toBe(0)
    })
  })

  describe('Health calculations', () => {
    it('should calculate BMI', () => {
      expect(CalculationUtils.calculateBMI(70, 1.75)).toBe(22.86)
      expect(CalculationUtils.calculateBMI(0, 1.75)).toBe(0)
      expect(CalculationUtils.calculateBMI(70, 0)).toBe(0)
    })

    it('should return BMI category', () => {
      expect(CalculationUtils.getBMICategory(18)).toBe('Underweight')
      expect(CalculationUtils.getBMICategory(22)).toBe('Normal weight')
      expect(CalculationUtils.getBMICategory(27)).toBe('Overweight')
      expect(CalculationUtils.getBMICategory(32)).toBe('Obese')
    })
  })

  describe('Financial calculations', () => {
    it('should calculate loan payment', () => {
      expect(CalculationUtils.calculateLoanPayment(100000, 5, 30)).toBe(536.82)
      expect(CalculationUtils.calculateLoanPayment(100000, 0, 30)).toBe(277.78)
    })

    it('should calculate total interest', () => {
      const totalInterest = CalculationUtils.calculateTotalInterest(100000, 5, 30)
      expect(totalInterest).toBeGreaterThan(0)
    })

    it('should calculate break-even point', () => {
      expect(CalculationUtils.calculateBreakEvenPoint(10000, 5, 15)).toBe(1000)
      expect(CalculationUtils.calculateBreakEvenPoint(10000, 10, 10)).toBe(Infinity)
    })

    it('should calculate ROI', () => {
      expect(CalculationUtils.calculateROI(100, 150)).toBe(50)
      expect(CalculationUtils.calculateROI(100, 80)).toBe(-20)
      expect(CalculationUtils.calculateROI(0, 100)).toBe(0)
    })

    it('should calculate NPV', () => {
      const cashFlows = [-1000, 300, 300, 300, 300, 300]
      const npv = CalculationUtils.calculateNPV(cashFlows, 10)
      expect(npv).toBeGreaterThan(0)
    })

    it('should calculate IRR', () => {
      const cashFlows = [-1000, 300, 300, 300, 300, 300]
      const irr = CalculationUtils.calculateIRR(cashFlows)
      expect(irr).toBeGreaterThan(0)
      expect(irr).toBeLessThan(100)
    })
  })
})
