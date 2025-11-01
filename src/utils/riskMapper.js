import { calculateAge } from './calculations.js'

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number.parseFloat(value)
  return Number.isFinite(number) ? number : null
}

const isYes = (value) => value === 'yes'

export const buildRiskAssessmentPayload = (formData = {}) => {
  const basic = formData.basic ?? {}
  const bpAndLipids = formData.bpAndLipids ?? {}
  const diabetes = formData.diabetes ?? {}
  const kidney = formData.kidney ?? {}
  const history = formData.history ?? {}
  const vascularDiseases = history.vascularDiseases ?? {}
  const cadDetails = history.cadDetails ?? {}

  const gender = basic.sex ?? null
  const isMale = gender === 'male'

  const age = calculateAge(basic.birthDate)
  const waist = toNumber(basic.waistCm)
  const systolic = toNumber(bpAndLipids.systolic)
  const diastolic = toNumber(bpAndLipids.diastolic)
  const ldl = toNumber(bpAndLipids.ldlMgDl)
  const hdl = toNumber(bpAndLipids.hdlMgDl)
  const triglyceride = toNumber(bpAndLipids.triglycerideMgDl)
  const cacScoreValue = toNumber(history.cacScore)
  const cacScore = cacScoreValue !== null ? Math.round(cacScoreValue) : null

  const hypertensionMedication = bpAndLipids.usesHypertensionMedication === 'yes'
  const lipidMedication = bpAndLipids.usesTriglycerideMedication === 'yes'
  const diabetesMedication = diabetes.usesMedication === 'yes'

  const fastingGlucose = toNumber(diabetes.fastingGlucoseMgDl)
  const hasDiabetes = diabetes.hasDiagnosis === 'yes'

  const egfr = toNumber(kidney.egfr)
  const uacr = toNumber(kidney.uacr)
  const hasCkdDiagnosis = kidney.hasCkdDiagnosis === 'yes'
  const hasCkd =
    hasCkdDiagnosis ||
    (egfr !== null && egfr < 60) ||
    (uacr !== null && uacr >= 30)

  const hasHypertension =
    hypertensionMedication ||
    (systolic !== null && systolic >= 130) ||
    (diastolic !== null && diastolic >= 85)

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
    family_history_early_chd: basic.familyHistoryEarlyChd === 'yes',
    hdl_c: hdl,
    is_smoker: basic.currentSmoker === 'yes',
    metabolic_syndrome_factors: metabolicSyndromeFactors,
    has_diabetes: hasDiabetes,
    has_ckd: hasCkd,
    ldl_c: ldl,
    cac_score: cacScore,
    has_ascvd_history: history.hasAscvdDiagnosis === 'yes',
    has_significant_plaque: history.hasSignificantPlaque === 'yes',
    has_cad: Boolean(vascularDiseases.cad),
    mi_within_1_year: Boolean(cadDetails.miWithin1Year),
    mi_history_count: cadDetails.miHistoryCountTwoOrMore ? 2 : 0,
    has_multivessel_obstruction: Boolean(cadDetails.hasMultiVesselObstruction),
    has_pad: Boolean(vascularDiseases.pad),
    has_carotid_stenosis: Boolean(vascularDiseases.carotidStenosis),
    waist_cm: waist,
    systolic,
    diastolic,
    fasting_glucose: fastingGlucose,
    triglyceride,
    hypertension_medication: hypertensionMedication,
    diabetes_medication: diabetesMedication,
    lipid_medication: lipidMedication,
    egfr,
    uacr,
  }
}
