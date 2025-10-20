const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const determineRiskLevel = (score) => {
  if (score < 10) return '低'
  if (score < 20) return '中'
  return '高'
}

const gatherBaseFactors = (formData) => {
  const factors = []
  const adjustments = {
    score: 0,
  }

  const { basicInfo, conditions, riskFactors } = formData ?? {}

  if (basicInfo?.smokingStatus === 'yes') {
    factors.push('目前抽煙')
    adjustments.score += 3.5
  }

  if (basicInfo?.familyHistory === 'yes') {
    factors.push('陽性家族史')
    adjustments.score += 2.5
  }

  if (conditions?.hypertension?.status === 'yes') {
    factors.push('高血壓')
    adjustments.score += 4
  }

  if (conditions?.diabetes?.status === 'yes') {
    factors.push('糖尿病')
    adjustments.score += 4
  }

  if (conditions?.kidney?.status === 'yes') {
    factors.push('腎臟病')
    adjustments.score += 4
  }

  if (riskFactors?.dyslipidemia?.status === 'yes') {
    factors.push('血脂異常')
    adjustments.score += 3
  }

  if (riskFactors?.cardiovascularHistory?.hasHistory === 'yes') {
    factors.push('曾發生心血管疾病')
    adjustments.score += 6
  }

  const bmi = basicInfo?.bmi
  if (Number.isFinite(bmi)) {
    if (bmi >= 27) {
      factors.push('BMI 偏高')
      adjustments.score += (bmi - 25) * 0.6
    } else if (bmi < 18.5) {
      factors.push('BMI 偏低')
      adjustments.score += 1.5
    }
  }

  const egfr = conditions?.kidney?.egfr
  if (Number.isFinite(egfr) && egfr < 60) {
    factors.push('eGFR 偏低')
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
  const variability = Math.random() * 2 - 1 // -1 ~ +1
  const baseScore = 6 + adjustments.score + ageAdjustment + variability
  const riskScore = Number(Math.max(1, baseScore).toFixed(1))
  const riskLevel = determineRiskLevel(riskScore)

  const populationAverage = 8.5
  const relativeDifference = Number((riskScore - populationAverage).toFixed(1))

  const recommendations =
    riskLevel === '高'
      ? [
          '儘速諮詢心臟內科醫師進行評估',
          '檢視血壓、血脂與血糖控制目標，必要時調整藥物',
          '增加每週 150 分鐘以上的中等強度運動',
        ]
      : riskLevel === '中'
      ? [
          '維持規律運動與均衡飲食',
          '每 6-12 個月追蹤血壓、血脂與血糖',
          '評估是否需進一步檢測或營養師諮詢',
        ]
      : ['維持健康生活型態，並定期追蹤血壓與體重', '持續觀察 BMI 與腰圍變化']

  return {
    riskScore,
    riskLevel,
    factors,
    populationAverage,
    relativeDifference,
    recommendations,
  }
}
