import { describe, expect, it } from 'vitest'
import { evaluateRiskAssessment } from './riskRules.js'

const makeInput = (overrides = {}) => ({
  age: 45,
  gender: 'male',
  is_male: true,
  has_hypertension: false,
  family_history_early_chd: false,
  hdl_c: 50,
  is_smoker: false,
  metabolic_syndrome_factors: 0,
  has_diabetes: false,
  has_ckd: false,
  ldl_c: 110,
  cac_ge_400: null,
  has_ascvd_history: false,
  has_significant_plaque: false,
  has_cad: false,
  has_acute_coronary_syndrome: false,
  mi_within_1_year: false,
  mi_history_count: 0,
  has_multivessel_obstruction: false,
  has_pad: false,
  has_carotid_stenosis: false,
  waist_cm: 85,
  systolic: 120,
  diastolic: 75,
  fasting_glucose: 95,
  triglyceride: 110,
  hypertension_medication: false,
  diabetes_medication: false,
  lipid_medication: false,
  egfr: 90,
  uacr: 10,
  ...overrides,
})

const extractCodes = (items = []) => items.map((item) => item.code)

describe('evaluateRiskAssessment', () => {
  it('回傳極高風險當 PAD 合併頸動脈狹窄', () => {
    const result = evaluateRiskAssessment(
      makeInput({
        has_pad: true,
        has_carotid_stenosis: true,
      }),
    )

    expect(result.levelCode).toBe('extremely_high')
    expect(extractCodes(result.matchedRules)).toEqual(['pad_with_carotid'])
  })

  it('回傳極高風險當 CAD 伴隨急性冠心症且合併糖尿病', () => {
    const result = evaluateRiskAssessment(
      makeInput({
        has_cad: true,
        has_diabetes: true,
        has_acute_coronary_syndrome: true,
      }),
    )

    expect(result.levelCode).toBe('extremely_high')
    expect(extractCodes(result.matchedRules)).toEqual(['cad_with_diabetes'])
  })

  it('回傳高風險當符合 CKD 條件', () => {
    const result = evaluateRiskAssessment(
      makeInput({
        has_ckd: true,
        egfr: 45,
        uacr: 220,
      }),
    )

    expect(result.levelCode).toBe('high')
    expect(extractCodes(result.matchedRules)).toEqual(['ckd'])
  })

  it('回傳高風險當 CAC ≥ 400', () => {
    const result = evaluateRiskAssessment(
      makeInput({
        cac_ge_400: true,
      }),
    )

    expect(result.levelCode).toBe('high')
    expect(extractCodes(result.matchedRules)).toEqual(['cac_400'])
  })

  it('以危險因子數計算中風險', () => {
    const result = evaluateRiskAssessment(
      makeInput({
        age: 40,
        systolic: 135,
        has_hypertension: true,
        is_smoker: true,
        hdl_c: 55,
        metabolic_syndrome_factors: 0,
      }),
    )

    expect(result.levelCode).toBe('medium')
    expect(extractCodes(result.matchedRules)).toEqual(['risk_factor_count'])
    expect(result.riskFactorCount).toBe(2)
  })

  it('依據量測結果重新計算代謝症候群', () => {
    const result = evaluateRiskAssessment(
      makeInput({
        metabolic_syndrome_factors: undefined,
        waist_cm: 95,
        triglyceride: 220,
        hdl_c: 35,
      }),
    )

    expect(result.metabolicSyndrome.count).toBe(3)
    expect(result.metabolicSyndrome.components.abdominalObesity).toBe(true)
    expect(result.metabolicSyndrome.components.elevatedTriglyceride).toBe(true)
    expect(result.metabolicSyndrome.components.lowHdl).toBe(true)
    expect(result.riskFactors.find((factor) => factor.code === 'metabolic_syndrome')?.present).toBe(true)
  })

  it('風險因子為零時回傳未定義層級', () => {
    const result = evaluateRiskAssessment(
      makeInput({
        age: 30,
        is_male: false,
        gender: 'female',
        has_hypertension: false,
        systolic: 110,
        diastolic: 70,
        hdl_c: 60,
        waist_cm: 70,
        fasting_glucose: 85,
        triglyceride: 90,
        is_smoker: false,
        metabolic_syndrome_factors: 0,
      }),
    )

    expect(result.levelCode).toBe('undefined')
    expect(result.matchedRules).toEqual([])
    expect(result.riskFactorCount).toBe(0)
  })

  it('固定回傳六項心血管危險因子', () => {
    const result = evaluateRiskAssessment(
      makeInput({
        age: 60,
        is_male: false,
        gender: 'female',
        has_hypertension: true,
        family_history_early_chd: true,
        hdl_c: 35,
        is_smoker: true,
        metabolic_syndrome_factors: 4,
        systolic: 135,
        triglyceride: 220,
      }),
    )

    expect(result.riskFactors.map((factor) => factor.code).sort()).toEqual(
      ['age', 'family_history', 'hypertension', 'low_hdl', 'metabolic_syndrome', 'smoking'],
    )
    expect(result.riskFactors.find((factor) => factor.code === 'metabolic_syndrome')?.present).toBe(true)
  })
})
