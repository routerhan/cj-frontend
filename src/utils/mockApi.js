const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const determineRiskLevel = (score) => {
  if (score < 10) return 'low'
  if (score < 20) return 'medium'
  return 'high'
}

const gatherBaseFactors = (formData) => {
  const factors = []
  const adjustments = { score: 0 }

  const { basicInfo, conditions, riskFactors } = formData ?? {}

  if (basicInfo?.smokingStatus === 'yes') {
    factors.push('smoking')
    adjustments.score += 3.5
  }

  if (basicInfo?.familyHistory === 'yes') {
    factors.push('familyHistory')
    adjustments.score += 2.5
  }

  if (conditions?.hypertension?.status === 'yes') {
    factors.push('hypertension')
    adjustments.score += 4
  }

  if (conditions?.diabetes?.status === 'yes') {
    factors.push('diabetes')
    adjustments.score += 4
  }

  if (conditions?.kidney?.status === 'yes') {
    factors.push('kidney')
    adjustments.score += 4
  }

  if (riskFactors?.dyslipidemia?.status === 'yes') {
    factors.push('dyslipidemia')
    adjustments.score += 3
  }

  if (riskFactors?.cardiovascularHistory?.hasHistory === 'yes') {
    factors.push('cHistory')
    adjustments.score += 6
  }

  const bmi = basicInfo?.bmi
  if (Number.isFinite(bmi)) {
    if (bmi >= 27) {
      factors.push('bmiHigh')
      adjustments.score += (bmi - 25) * 0.6
    } else if (bmi < 18.5) {
      factors.push('bmiLow')
      adjustments.score += 1.5
    }
  }

  const egfr = conditions?.kidney?.egfr
  if (Number.isFinite(egfr) && egfr < 60) {
    factors.push('egfrLow')
    adjustments.score += egfr < 30 ? 4 : 2
  }

  return { factors, adjustments }
}

export const calculateRisk = async (formData) => {
  await wait(1500)

  const age = Number.isFinite(formData?.basicInfo?.ageYears)
    ? formData.basicInfo.ageYears
    : null

  const { factors, adjustments } = gatherBaseFactors(formData)

  const ageAdjustment = age ? Math.max(0, (age - 40) * 0.25) : 0
  const variability = Math.random() * 2 - 1
  const baseScore = 6 + adjustments.score + ageAdjustment + variability
  const riskScore = Number(Math.max(1, baseScore).toFixed(1))
  const riskLevel = determineRiskLevel(riskScore)

  const populationAverage = 8.5
  const relativeDifference = Number((riskScore - populationAverage).toFixed(1))

  return {
    riskScore,
    riskLevel,
    factors,
    recommendationLevel: riskLevel,
    populationAverage,
    relativeDifference,
  }
}
