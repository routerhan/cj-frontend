import { calculateAge } from './calculations.js'

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number.parseFloat(value)
  return Number.isFinite(number) ? number : null
}

export const buildRiskAssessmentPayload = (formData = {}) => {
  const basic = formData.basic ?? {}
  const bpAndLipids = formData.bpAndLipids ?? {}
  const diabetes = formData.diabetes ?? {}
  const kidney = formData.kidney ?? {}
  const history = formData.history ?? {}
  const ascvdDiagnoses = history.ascvdDiagnoses ?? {}
  const imagingFindings = history.imagingFindings ?? {}
  const cadComplications = history.cadComplications ?? {}
  const padComplications = history.padComplications ?? {}

  const gender = basic.sex ?? null
  const isMale = gender === 'male'

  const age = calculateAge(basic.birthDate)
  const waist = toNumber(basic.waistCm)
  const systolic = toNumber(bpAndLipids.systolic)
  const diastolic = toNumber(bpAndLipids.diastolic)
  const ldl = toNumber(bpAndLipids.ldlMgDl)
  const hdl = toNumber(bpAndLipids.hdlMgDl)
  const triglyceride = toNumber(bpAndLipids.triglycerideMgDl)
  const cacScoreCategory = history.cacScoreCategory
  let cacGe400 = null
  if (cacScoreCategory === 'yes') {
    cacGe400 = true
  } else if (cacScoreCategory === 'no') {
    cacGe400 = false
  } else {
    cacGe400 = null
  }

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

  const acsHistory = Boolean(ascvdDiagnoses.acuteCoronarySyndrome)
  const revascularizationHistory = Boolean(ascvdDiagnoses.revascularization)
  const strokeWithAtherosclerosis = Boolean(ascvdDiagnoses.ischemicStroke)
  const peripheralArteryDiseaseHistory = Boolean(ascvdDiagnoses.peripheralArteryDisease)

  const hasAscvdHistory =
    acsHistory ||
    revascularizationHistory ||
    strokeWithAtherosclerosis ||
    peripheralArteryDiseaseHistory

  const angiographyStenosis = Boolean(imagingFindings.coronaryAngiography)
  const ctStenosis = Boolean(imagingFindings.coronaryCt)
  const ultrasoundStenosis = Boolean(imagingFindings.vascularUltrasound)

  const hasSignificantPlaque =
    angiographyStenosis || ctStenosis || ultrasoundStenosis

  const cadMiWithin1Year = Boolean(cadComplications.miWithin1Year)
  const cadMiHistoryTwoOrMore = Boolean(cadComplications.miHistoryTwoOrMore)
  const cadMultiVesselObstruction = Boolean(cadComplications.multiVesselObstruction)
  const cadAcsWithDiabetes = Boolean(cadComplications.acsWithDiabetes)
  const cadPadOrCarotid = Boolean(cadComplications.padOrCarotid)
  const padWithCad = Boolean(padComplications.cad)
  const padWithCarotid = Boolean(padComplications.carotidStenosis)

  const cadPositiveSelections =
    cadMiWithin1Year ||
    cadMiHistoryTwoOrMore ||
    cadMultiVesselObstruction ||
    cadAcsWithDiabetes ||
    cadPadOrCarotid

  const padPositiveSelections = padWithCad || padWithCarotid

  const hasPad =
    padPositiveSelections || cadPadOrCarotid || peripheralArteryDiseaseHistory

  const hasCarotidStenosis = padWithCarotid || cadPadOrCarotid

  const hasCad = cadPositiveSelections || padWithCad

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
    cac_ge_400: cacGe400,
    has_ascvd_history: hasAscvdHistory,
    has_significant_plaque: hasSignificantPlaque,
    has_cad: hasCad,
    has_acute_coronary_syndrome: cadAcsWithDiabetes,
    has_acute_coronary_syndrome_history: acsHistory,
    has_revascularization_history: revascularizationHistory,
    has_ischemic_stroke_with_atherosclerosis: strokeWithAtherosclerosis,
    has_peripheral_arterial_disease_history: peripheralArteryDiseaseHistory,
    has_coronary_angiography_stenosis: angiographyStenosis,
    has_coronary_ct_stenosis: ctStenosis,
    has_vascular_ultrasound_stenosis: ultrasoundStenosis,
    mi_within_1_year: cadMiWithin1Year,
    mi_history_count: cadMiHistoryTwoOrMore ? 2 : 0,
    has_multivessel_obstruction: cadMultiVesselObstruction,
    has_pad: hasPad,
    has_carotid_stenosis: hasCarotidStenosis,
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
