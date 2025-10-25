import { describe, expect, it, vi, afterEach } from 'vitest'
import { calculateAge, calculateBMI, calculateEGFR, getBMICategory } from './calculations.js'

describe('calculateAge', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('正確計算年齡', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T00:00:00Z'))

    expect(calculateAge('1990-06-20')).toBe(34)
    expect(calculateAge('1990-01-10')).toBe(35)
  })

  it('處理未來日期或無效值', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T00:00:00Z'))

    expect(calculateAge('3025-01-01')).toBeNull()
    expect(calculateAge('invalid-date')).toBeNull()
    expect(calculateAge()).toBeNull()
  })
})

describe('calculateBMI', () => {
  it('回傳四捨五入後的 BMI', () => {
    expect(calculateBMI(170, 65)).toBeCloseTo(22.5)
    expect(calculateBMI('180', '72')).toBeCloseTo(22.2)
  })

  it('處理無效輸入', () => {
    expect(calculateBMI(0, 60)).toBeNull()
    expect(calculateBMI(170, 0)).toBeNull()
    expect(calculateBMI('abc', '20')).toBeNull()
  })
})

describe('getBMICategory', () => {
  it('回傳對應的 BMI 分類', () => {
    expect(getBMICategory(17)).toBe('underweight')
    expect(getBMICategory(22)).toBe('normal')
    expect(getBMICategory(25)).toBe('overweight')
    expect(getBMICategory(30)).toBe('obese')
  })

  it('處理無效數值', () => {
    expect(getBMICategory(null)).toBe('')
    expect(getBMICategory(-5)).toBe('')
  })
})

describe('calculateEGFR', () => {
  it('依據性別與肌酸酐計算 eGFR', () => {
    const result = calculateEGFR({
      serumCreatinineMgDl: 1.1,
      gender: 'male',
      ageYears: 45,
      heightCm: 175,
      weightKg: 72,
    })

    expect(result.egfrBsaAdjusted).toBeCloseTo(91.21, 1)
  })

  it('缺少必要資料時回傳空值', () => {
    expect(
      calculateEGFR({
        serumCreatinineMgDl: '',
        gender: 'female',
        ageYears: 40,
        heightCm: 162,
        weightKg: 55,
      }),
    ).toEqual({ gfr: null, bsa: null, egfrBsaAdjusted: null })
  })
})
