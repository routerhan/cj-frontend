// BMI 與 eGFR 相關計算函式會在後續票據中實作。

/**
 * 根據出生年月日計算年齡（歲）。
 * @param {string|Date} birthDate
 * @returns {number|null}
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null

  const date = birthDate instanceof Date ? birthDate : new Date(birthDate)
  if (Number.isNaN(date.getTime())) return null

  const today = new Date()
  if (date > today) return null

  let age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()
  const dayDiff = today.getDate() - date.getDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return age >= 0 ? age : null
}

/**
 * 根據身高（公分）與體重（公斤）計算 BMI。
 * @param {number|string} heightCm
 * @param {number|string} weightKg
 * @returns {number|null}
 */
export const calculateBMI = (heightCm, weightKg) => {
  const parsedHeight = typeof heightCm === 'string' ? parseFloat(heightCm) : heightCm
  const parsedWeight = typeof weightKg === 'string' ? parseFloat(weightKg) : weightKg

  if (
    !Number.isFinite(parsedHeight) ||
    !Number.isFinite(parsedWeight) ||
    parsedHeight <= 0 ||
    parsedWeight <= 0
  ) {
    return null
  }

  const heightM = parsedHeight / 100
  const bmi = parsedWeight / (heightM * heightM)
  return Math.round(bmi * 10) / 10
}

/**
 * 依據衛福部成人 BMI 區間回傳對應分類。
 * @param {number|null} bmi
 * @returns {string}
 */
export const getBMICategory = (bmi) => {
  if (!Number.isFinite(bmi) || bmi <= 0) return ''
  if (bmi < 18.5) return '過輕'
  if (bmi < 24) return '標準'
  if (bmi < 27) return '過重'
  return '肥胖'
}

export const calculateEGFR = ({
  serumCreatinineMgDl,
  gender,
  ageYears,
  heightCm,
  weightKg,
} = {}) => {
  const scr = typeof serumCreatinineMgDl === 'string'
    ? parseFloat(serumCreatinineMgDl)
    : serumCreatinineMgDl
  const age = typeof ageYears === 'string' ? parseFloat(ageYears) : ageYears
  const height = typeof heightCm === 'string' ? parseFloat(heightCm) : heightCm
  const weight = typeof weightKg === 'string' ? parseFloat(weightKg) : weightKg

  if (!Number.isFinite(scr) || scr <= 0) {
    return { gfr: null, bsa: null, egfrBsaAdjusted: null }
  }

  if (!Number.isFinite(age) || age <= 0 || !Number.isFinite(height) || !Number.isFinite(weight)) {
    return { gfr: null, bsa: null, egfrBsaAdjusted: null }
  }

  const isFemale = gender === 'female'
  const kappa = isFemale ? 0.7 : 0.9
  const alpha = isFemale ? -0.241 : -0.302
  const sexFactor = isFemale ? 1.012 : 1
  const ratio = scr / kappa

  const gfr =
    142 *
    Math.min(ratio, 1) ** alpha *
    Math.max(ratio, 1) ** -1.2 *
    0.9938 ** age *
    sexFactor

  const bsa = 0.007184 * height ** 0.725 * weight ** 0.425
  const egfrBsaAdjusted = (gfr * bsa) / 1.73

  if (!Number.isFinite(gfr) || !Number.isFinite(bsa)) {
    return { gfr: null, bsa: null, egfrBsaAdjusted: null }
  }

  return {
    gfr,
    bsa,
    egfrBsaAdjusted,
  }
}
