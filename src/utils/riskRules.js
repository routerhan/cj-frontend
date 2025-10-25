const RiskLevels = {
  EXTREMELY_HIGH: { code: 'extremely_high', label: '極高' },
  VERY_HIGH: { code: 'very_high', label: '非常高' },
  HIGH: { code: 'high', label: '高' },
  MEDIUM: { code: 'medium', label: '中' },
  LOW: { code: 'low', label: '低' },
  UNDEFINED: { code: 'undefined', label: '未定義' },
}

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number.parseFloat(value)
  return Number.isFinite(number) ? number : null
}

const toInteger = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number.parseInt(value, 10)
  return Number.isFinite(number) ? number : null
}

const buildMatch = (code, label) => ({ code, label })

const EXTREME_RULES = [
  {
    code: 'cad_recent_mi',
    label: '冠狀動脈疾病且過去一年曾發生心肌梗塞',
    check: (input) => input.has_cad && input.mi_within_1_year,
  },
  {
    code: 'cad_multiple_mi',
    label: '冠狀動脈疾病且累積兩次以上心肌梗塞',
    check: (input) => input.has_cad && (input.mi_history_count ?? 0) >= 2,
  },
  {
    code: 'cad_multivessel',
    label: '冠狀動脈疾病且存在多支血管阻塞',
    check: (input) => input.has_cad && input.has_multivessel_obstruction,
  },
  {
    code: 'cad_acs_with_diabetes',
    label: '冠狀動脈疾病且曾有急性冠心症合併糖尿病',
    check: (input) => input.has_cad && input.has_acs_with_diabetes,
  },
  {
    code: 'cad_with_pad_or_carotid',
    label: '冠狀動脈疾病且合併周邊動脈疾病或頸動脈狹窄',
    check: (input) => input.has_cad && (input.has_pad || input.has_carotid_stenosis),
  },
  {
    code: 'pad_with_carotid',
    label: '周邊動脈疾病且合併頸動脈狹窄',
    check: (input) => input.has_pad && input.has_carotid_stenosis,
  },
  {
    code: 'stroke_with_atherosclerosis',
    label: '缺血性中風 / TIA 並伴隨動脈硬化病史',
    check: (input) => Boolean(input.has_stroke_with_atherosclerosis),
  },
]

const VERY_HIGH_RULES = [
  {
    code: 'ascvd_history',
    label: '臨床確診動脈硬化心血管疾病 (ASCVD)',
    check: (input) => Boolean(input.has_ascvd_history),
  },
  {
    code: 'significant_plaque',
    label: '影像顯示顯著斑塊狹窄（≥50%）',
    check: (input) => Boolean(input.has_significant_plaque),
  },
]

const HIGH_RULES = [
  {
    code: 'diabetes',
    label: '已診斷糖尿病',
    check: (input) => Boolean(input.has_diabetes),
  },
  {
    code: 'ckd',
    label: '慢性腎臟病 (含 eGFR < 60 或 UACR ≥ 30)',
    check: (input) => Boolean(input.has_ckd),
  },
  {
    code: 'ldl_190',
    label: '低密度脂蛋白膽固醇 (LDL-C) ≥ 190 mg/dL',
    check: (input) => {
      const ldl = toNumber(input.ldl_c)
      return ldl !== null && ldl >= 190
    },
  },
  {
    code: 'cac_400',
    label: '冠狀動脈鈣化分數 (CAC) ≥ 400',
    check: (input) => {
      const cac = toInteger(input.cac_score)
      return cac !== null && cac >= 400
    },
  },
]

const RISK_FACTOR_DEFINITIONS = [
  {
    code: 'hypertension',
    label: '高血壓',
    check: (input) => Boolean(input.has_hypertension),
  },
  {
    code: 'age',
    label: '年齡達風險閾值',
    check: (input) => {
      const age = toNumber(input.age)
      if (age === null) return false
      if (input.is_male === true) {
        return age >= 45
      }
      return age >= 55
    },
  },
  {
    code: 'family_history',
    label: '早發性冠心病家族史',
    check: (input) => Boolean(input.family_history_early_chd),
  },
  {
    code: 'low_hdl',
    label: 'HDL-C 偏低',
    check: (input) => {
      const hdl = toNumber(input.hdl_c)
      if (hdl === null) return false
      if (input.is_male === true) {
        return hdl < 40
      }
      return hdl < 50
    },
  },
  {
    code: 'smoking',
    label: '抽菸',
    check: (input) => Boolean(input.is_smoker),
  },
  {
    code: 'metabolic_syndrome',
    label: '代謝症候群 (≥3 項構成條件)',
    check: (input) => {
      const factors = input.metabolic_syndrome_factors
      if (typeof factors === 'number' && !Number.isNaN(factors)) {
        return factors >= 3
      }
      return false
    },
  },
]

const computeMetabolicComponents = (input) => {
  const isMale = input.is_male === true
  const waist = toNumber(input.waist_cm)
  const systolic = toNumber(input.systolic)
  const diastolic = toNumber(input.diastolic)
  const fastingGlucose = toNumber(input.fasting_glucose)
  const triglyceride = toNumber(input.triglyceride)
  const hdl = toNumber(input.hdl_c)
  const onHypertensionMedication = Boolean(input.hypertension_medication)
  const onDiabetesMedication = Boolean(input.diabetes_medication)
  const onLipidMedication = Boolean(input.lipid_medication)

  const abdominalObesity =
    waist !== null && (isMale ? waist >= 90 : waist >= 80)
  const elevatedBloodPressure =
    (systolic !== null && systolic >= 130) ||
    (diastolic !== null && diastolic >= 85) ||
    onHypertensionMedication
  const elevatedGlucose =
    (fastingGlucose !== null && fastingGlucose >= 100) || onDiabetesMedication
  const elevatedTriglyceride =
    (triglyceride !== null && triglyceride >= 150) || onLipidMedication
  const lowHdl =
    hdl !== null && (isMale ? hdl < 40 : hdl < 50)

  const components = {
    abdominalObesity,
    elevatedBloodPressure,
    elevatedGlucose,
    elevatedTriglyceride,
    lowHdl,
  }

  const count = Object.values(components).filter(Boolean).length

  return { count, components }
}

const RECOMMENDATIONS = {
  extremely_high: [
    '儘速與心血管專科醫師討論侵入性治療與藥物調整策略',
    '確認雙重抗血小板及強效降脂治療是否到位',
    '規劃密集的生活型態與危險因子管理，並安排密集追蹤',
  ],
  very_high: [
    '與主治醫師檢視 ASCVD 的二級預防用藥與檢查計畫',
    '評估是否需要進一步影像檢查或血管功能測試',
    '維持每 3-6 個月一次的多危險因子監測 (血壓 / 血脂 / 血糖)',
  ],
  high: [
    '設定血脂與血糖控制目標，必要時調整藥物劑量或種類',
    '強化生活型態介入：飲食、運動、體重管理',
    '每 6 個月追蹤腎功能、血脂與代謝指標',
  ],
  medium: [
    '持續規律運動與均衡飲食，關注腰圍與體重變化',
    '每年檢查血壓、血脂、血糖，必要時諮詢專業醫療建議',
  ],
  low: [
    '維持健康生活型態，避免菸酒與過度飲食',
    '每 1-2 年追蹤血壓與基本血液檢查以確保穩定',
  ],
  undefined: ['資料不足以評估，請補充必要檢測或臨床資訊後再試'],
}

const evaluateWithRules = (rules, input) => {
  const matches = rules.filter((rule) => rule.check(input))
  return matches.map((rule) => buildMatch(rule.code, rule.label))
}

export const evaluateRiskAssessment = (rawInput = {}) => {
  const input = {
    ...rawInput,
    age: toNumber(rawInput.age),
    hdl_c: toNumber(rawInput.hdl_c),
    ldl_c: toNumber(rawInput.ldl_c),
    cac_score: toInteger(rawInput.cac_score),
    mi_history_count: toInteger(rawInput.mi_history_count) ?? 0,
    metabolic_syndrome_factors: toNumber(rawInput.metabolic_syndrome_factors),
  }

  const metabolicDetails = computeMetabolicComponents({
    is_male: input.is_male,
    waist_cm: rawInput.waist_cm,
    systolic: rawInput.systolic,
    diastolic: rawInput.diastolic,
    fasting_glucose: rawInput.fasting_glucose,
    triglyceride: rawInput.triglyceride,
    hdl_c: input.hdl_c,
    hypertension_medication: rawInput.hypertension_medication,
    diabetes_medication: rawInput.diabetes_medication,
    lipid_medication: rawInput.lipid_medication,
  })

  if (!Number.isFinite(input.metabolic_syndrome_factors)) {
    input.metabolic_syndrome_factors = metabolicDetails.count
  }

  const riskFactors = RISK_FACTOR_DEFINITIONS.map((definition) => ({
    code: definition.code,
    label: definition.label,
    present:
      definition.code === 'metabolic_syndrome'
        ? metabolicDetails.count >= 3
        : definition.check(input),
  }))

  const riskFactorCount = riskFactors.filter((factor) => factor.present).length

  const extremeMatches = evaluateWithRules(EXTREME_RULES, input)
  if (extremeMatches.length > 0) {
    return {
      level: RiskLevels.EXTREMELY_HIGH.label,
      levelCode: RiskLevels.EXTREMELY_HIGH.code,
      matchedRules: extremeMatches,
      riskFactorCount,
      riskFactors,
      metabolicSyndrome: metabolicDetails,
      recommendations: RECOMMENDATIONS[RiskLevels.EXTREMELY_HIGH.code],
      evaluatedAt: new Date().toISOString(),
    }
  }

  const veryHighMatches = evaluateWithRules(VERY_HIGH_RULES, input)
  if (veryHighMatches.length > 0) {
    return {
      level: RiskLevels.VERY_HIGH.label,
      levelCode: RiskLevels.VERY_HIGH.code,
      matchedRules: veryHighMatches,
      riskFactorCount,
      riskFactors,
      metabolicSyndrome: metabolicDetails,
      recommendations: RECOMMENDATIONS[RiskLevels.VERY_HIGH.code],
      evaluatedAt: new Date().toISOString(),
    }
  }

  const highMatches = evaluateWithRules(HIGH_RULES, input)
  if (highMatches.length > 0) {
    return {
      level: RiskLevels.HIGH.label,
      levelCode: RiskLevels.HIGH.code,
      matchedRules: highMatches,
      riskFactorCount,
      riskFactors,
      metabolicSyndrome: metabolicDetails,
      recommendations: RECOMMENDATIONS[RiskLevels.HIGH.code],
      evaluatedAt: new Date().toISOString(),
    }
  }

  if (riskFactorCount >= 2) {
    return {
      level: RiskLevels.MEDIUM.label,
      levelCode: RiskLevels.MEDIUM.code,
      matchedRules: [buildMatch('risk_factor_count', '心血管危險因子達兩項以上')],
      riskFactorCount,
      riskFactors,
      metabolicSyndrome: metabolicDetails,
      recommendations: RECOMMENDATIONS[RiskLevels.MEDIUM.code],
      evaluatedAt: new Date().toISOString(),
    }
  }

  if (riskFactorCount === 1) {
    return {
      level: RiskLevels.LOW.label,
      levelCode: RiskLevels.LOW.code,
      matchedRules: [buildMatch('single_risk_factor', '心血管危險因子 1 項')],
      riskFactorCount,
      riskFactors,
      metabolicSyndrome: metabolicDetails,
      recommendations: RECOMMENDATIONS[RiskLevels.LOW.code],
      evaluatedAt: new Date().toISOString(),
    }
  }

  return {
    level: RiskLevels.UNDEFINED.label,
    levelCode: RiskLevels.UNDEFINED.code,
    matchedRules: [],
    riskFactorCount,
    riskFactors,
    metabolicSyndrome: metabolicDetails,
    recommendations: RECOMMENDATIONS[RiskLevels.UNDEFINED.code],
    evaluatedAt: new Date().toISOString(),
  }
}

export { RiskLevels }
