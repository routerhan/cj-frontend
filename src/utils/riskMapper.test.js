import { describe, expect, it, vi } from 'vitest'
import { buildRiskAssessmentPayload } from './riskMapper.js'

describe('buildRiskAssessmentPayload', () => {
  it('整合新表單資料為風險評估 payload', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))

    const formData = {
      basic: {
        sex: 'male',
        birthDate: '1980-06-15',
        waistCm: '95',
        currentSmoker: 'yes',
        familyHistoryEarlyChd: 'yes',
      },
      bpAndLipids: {
        usesHypertensionMedication: 'yes',
        systolic: '150',
        diastolic: '92',
        ldlMgDl: '180',
        hdlMgDl: '35',
        triglycerideMgDl: '160',
        usesTriglycerideMedication: 'yes',
      },
      diabetes: {
        hasDiagnosis: 'yes',
        usesMedication: 'yes',
        fastingGlucoseMgDl: '140',
      },
      kidney: {
        hasCkdDiagnosis: 'no',
        egfr: '55',
        uacr: '35',
      },
      history: {
        cacScoreCategory: 'no',
        ascvdDiagnoses: {
          acuteCoronarySyndrome: true,
          revascularization: true,
          ischemicStroke: false,
          peripheralArteryDisease: true,
          none: false,
        },
        imagingFindings: {
          coronaryAngiography: true,
          coronaryCt: false,
          vascularUltrasound: false,
          none: false,
        },
        cadComplications: {
          miWithin1Year: true,
          miHistoryTwoOrMore: true,
          multiVesselObstruction: false,
          acsWithDiabetes: true,
          padOrCarotid: false,
          none: false,
        },
        padComplications: {
          cad: true,
          carotidStenosis: false,
          none: false,
        },
      },
    }

    const payload = buildRiskAssessmentPayload(formData)

    expect(payload.gender).toBe('male')
    expect(payload.is_male).toBe(true)
    expect(payload.age).toBe(44) // 2025-01-01 - 1980-06-15
    expect(payload.has_hypertension).toBe(true)
    expect(payload.hypertension_medication).toBe(true)
    expect(payload.is_smoker).toBe(true)
    expect(payload.family_history_early_chd).toBe(true)
    expect(payload.metabolic_syndrome_factors).toBe(5)
    expect(payload.has_diabetes).toBe(true)
    expect(payload.diabetes_medication).toBe(true)
    expect(payload.has_ckd).toBe(true)
    expect(payload.egfr).toBe(55)
    expect(payload.uacr).toBe(35)
    expect(payload.has_cad).toBe(true)
    expect(payload.has_acute_coronary_syndrome).toBe(true)
    expect(payload.has_pad).toBe(true)
    expect(payload.has_carotid_stenosis).toBe(false)
    expect(payload.mi_within_1_year).toBe(true)
    expect(payload.mi_history_count).toBe(2)
    expect(payload.has_multivessel_obstruction).toBe(false)
    expect(payload.cac_ge_400).toBe(false)
    expect(payload.has_significant_plaque).toBe(true)
    expect(payload.has_ascvd_history).toBe(true)
    expect(payload.has_acute_coronary_syndrome_history).toBe(true)
    expect(payload.has_revascularization_history).toBe(true)
    expect(payload.has_ischemic_stroke_with_atherosclerosis).toBe(false)
    expect(payload.has_peripheral_arterial_disease_history).toBe(true)
    expect(payload.has_coronary_angiography_stenosis).toBe(true)
    expect(payload.has_coronary_ct_stenosis).toBe(false)
    expect(payload.has_vascular_ultrasound_stenosis).toBe(false)

    vi.useRealTimers()
  })

  it('選擇所有「以上皆無」時不標記 CAD 或 PAD', () => {
    const formData = {
      history: {
        cacScoreCategory: 'unknown',
        ascvdDiagnoses: {
          acuteCoronarySyndrome: false,
          revascularization: false,
          ischemicStroke: false,
          peripheralArteryDisease: false,
          none: true,
        },
        imagingFindings: {
          coronaryAngiography: false,
          coronaryCt: false,
          vascularUltrasound: false,
          none: true,
        },
        cadComplications: {
          miWithin1Year: false,
          miHistoryTwoOrMore: false,
          multiVesselObstruction: false,
          acsWithDiabetes: false,
          padOrCarotid: false,
          none: true,
        },
        padComplications: {
          cad: false,
          carotidStenosis: false,
          none: true,
        },
      },
    }

    const payload = buildRiskAssessmentPayload(formData)

    expect(payload.has_cad).toBe(false)
    expect(payload.has_pad).toBe(false)
    expect(payload.has_carotid_stenosis).toBe(false)
    expect(payload.has_ascvd_history).toBe(false)
    expect(payload.has_significant_plaque).toBe(false)
  })
})
