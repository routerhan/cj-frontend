import { calculateAge } from './calculations.js'

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

const isYes = (value) => value === 'yes'

export const buildRiskAssessmentPayload = (formData = {}) => {
  const basicInfo = formData.basicInfo ?? {}
  const conditions = formData.conditions ?? {}
  const riskFactors = formData.riskFactors ?? {}

  const hypertension = conditions.hypertension ?? {}
  const diabetes = conditions.diabetes ?? {}
  const kidney = conditions.kidney ?? {}
  const dyslipidemia = riskFactors.dyslipidemia ?? {}
  const cardiovascularHistory = riskFactors.cardiovascularHistory ?? {}

  const gender = basicInfo.gender ?? null
  const isMale = gender === 'male'

  const reportedAge = Number.isFinite(basicInfo.ageYears) ? basicInfo.ageYears : null
  const computedAge = calculateAge(basicInfo.birthDate)
  const age = reportedAge ?? computedAge ?? null

  const systolic = toNumber(hypertension.systolic)
  const diastolic = toNumber(hypertension.diastolic)
  const fastingGlucose = toNumber(diabetes.fastingGlucoseMgDl)
  const triglyceride = toNumber(dyslipidemia.triglycerideMgDl)
  const hdl = toNumber(dyslipidemia.hdlMgDl)
  const ldl = toNumber(dyslipidemia.ldlMgDl)
  const cacScore = toInteger(cardiovascularHistory.cacScore)
  const waist = toNumber(basicInfo.waistCm)
  const egfr = Number.isFinite(kidney.egfr) ? kidney.egfr : toNumber(kidney.egfr)

  const hypertensionMedication = isYes(hypertension.medication)
  const diabetesMedication = isYes(diabetes.medication)
  const lipidMedication = isYes(dyslipidemia.medication)

  const hasHypertension =
    isYes(hypertension.status) ||
    hypertensionMedication ||
    (systolic !== null && systolic >= 130) ||
    (diastolic !== null && diastolic >= 85)

  const hasCkd = isYes(kidney.status) || (egfr !== null && egfr < 60)

  const metabolicComponents = {
    abdominalObesity: waist !== null && (isMale ? waist >= 90 : waist >= 80),
    elevatedBloodPressure:
      (systolic !== null && systolic >= 130) ||
      (diastolic !== null && diastolic >= 85) ||
      hypertensionMedication,
    elevatedGlucose: (fastingGlucose !== null && fastingGlucose >= 100) || diabetesMedication,
    elevatedTriglyceride: (triglyceride !== null && triglyceride >= 150) || lipidMedication,
    lowHdl: hdl !== null && (isMale ? hdl < 40 : hdl < 50),
  }

  const metabolicSyndromeFactors = Object.values(metabolicComponents).filter(Boolean).length

  return {
    age,
    gender,
    is_male: isMale,
    has_hypertension: hasHypertension,
    family_history_early_chd: basicInfo.familyHistory === 'yes',
    hdl_c: hdl,
    is_smoker: basicInfo.smokingStatus === 'yes',
    metabolic_syndrome_factors: metabolicSyndromeFactors,
    has_diabetes: isYes(diabetes.status),
    has_ckd: hasCkd,
    ldl_c: ldl,
    cac_score: cacScore,
    has_ascvd_history: cardiovascularHistory.hasHistory === 'yes',
    has_significant_plaque: cardiovascularHistory.hasSignificantPlaque === 'yes',
    has_cad: cardiovascularHistory.hasCad === 'yes',
    mi_within_1_year: cardiovascularHistory.miWithin1Year === 'yes',
    mi_history_count: toInteger(cardiovascularHistory.miHistoryCount ?? '0') ?? 0,
    has_multivessel_obstruction: cardiovascularHistory.hasMultivesselObstruction === 'yes',
    has_acs_with_diabetes: cardiovascularHistory.hasAcsWithDiabetes === 'yes',
    has_pad: cardiovascularHistory.hasPad === 'yes',
    has_carotid_stenosis: cardiovascularHistory.hasCarotidStenosis === 'yes',
    has_stroke_with_atherosclerosis:
      cardiovascularHistory.hasStrokeWithAtherosclerosis === 'yes',
    waist_cm: waist,
    systolic,
    diastolic,
    fasting_glucose: fastingGlucose,
    triglyceride,
    hypertension_medication: hypertensionMedication,
    diabetes_medication: diabetesMedication,
    lipid_medication: lipidMedication,
    egfr,
  }
}
