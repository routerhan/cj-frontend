import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import { FormProvider, useFormContext } from '../context/FormContext.jsx'
import { LanguageProvider } from '../context/LanguageContext.jsx'
import { Step4_Report } from './Step4_Report.jsx'
import { requestRiskAssessment } from '../utils/riskApi.js'

vi.mock('../utils/riskApi.js', () => ({
  requestRiskAssessment: vi.fn().mockResolvedValue({
    level: '中',
    levelCode: 'medium',
    matchedRules: [{ code: 'risk_factor_count', label: '心血管危險因子達兩項以上' }],
    riskFactorCount: 3,
    riskFactors: [
      { code: 'hypertension', label: '高血壓', present: true },
      { code: 'age', label: '年齡達風險閾值', present: true },
      { code: 'low_hdl', label: 'HDL-C 偏低', present: true },
      { code: 'smoking', label: '抽菸', present: false },
      { code: 'family_history', label: '早發性冠心病家族史', present: false },
      { code: 'metabolic_syndrome', label: '代謝症候群 (≥3 項構成條件)', present: false },
    ],
    metabolicSyndrome: {
      count: 3,
      components: {
        abdominalObesity: true,
        elevatedBloodPressure: true,
        elevatedGlucose: false,
        elevatedTriglyceride: true,
        lowHdl: false,
      },
    },
    recommendations: ['維持規律運動與均衡飲食'],
    evaluatedAt: '2025-01-01T08:00:00.000Z',
  }),
}))

const renderInProvider = (ui) =>
  render(
    <LanguageProvider>
      <FormProvider>{ui}</FormProvider>
    </LanguageProvider>,
  )

const StepIndicator = () => {
  const { currentStep } = useFormContext()
  return <div data-testid="current-step">{currentStep}</div>
}

const Harness = () => {
  const { goToStep, updateFormField } = useFormContext()

  useEffect(() => {
    updateFormField(['basic', 'sex'], 'male')
    updateFormField(['basic', 'birthDate'], '1985-01-01')
    updateFormField(['basic', 'heightCm'], '175')
    updateFormField(['basic', 'weightKg'], '72')
    updateFormField(['basic', 'waistCm'], '94')
    updateFormField(['basic', 'currentSmoker'], 'yes')
    updateFormField(['basic', 'familyHistoryEarlyChd'], 'no')

    updateFormField(['bpAndLipids', 'usesHypertensionMedication'], 'yes')
    updateFormField(['bpAndLipids', 'systolic'], '138')
    updateFormField(['bpAndLipids', 'diastolic'], '86')
    updateFormField(['bpAndLipids', 'ldlMgDl'], '135')
    updateFormField(['bpAndLipids', 'hdlMgDl'], '42')
    updateFormField(['bpAndLipids', 'triglycerideMgDl'], '220')
    updateFormField(['bpAndLipids', 'usesTriglycerideMedication'], 'no')

    updateFormField(['diabetes', 'hasDiagnosis'], 'no')
    updateFormField(['diabetes', 'usesMedication'], 'no')
    updateFormField(['diabetes', 'fastingGlucoseMgDl'], '110')

    updateFormField(['kidney', 'hasCkdDiagnosis'], 'no')
    updateFormField(['kidney', 'egfr'], '92')
    updateFormField(['kidney', 'uacr'], '18')

    updateFormField(['history', 'ascvdDiagnoses'], {
      acuteCoronarySyndrome: false,
      revascularization: false,
      ischemicStroke: false,
      peripheralArteryDisease: false,
      none: true,
    })
    updateFormField(['history', 'imagingFindings'], {
      coronaryAngiography: false,
      coronaryCt: false,
      vascularUltrasound: false,
      none: true,
    })
    updateFormField(['history', 'cadComplications'], {
      miWithin1Year: false,
      miHistoryTwoOrMore: false,
      multiVesselObstruction: false,
      acsWithDiabetes: false,
      padOrCarotid: false,
      none: true,
    })
    updateFormField(['history', 'padComplications'], {
      cad: false,
      carotidStenosis: false,
      none: true,
    })

    goToStep(6)
  }, [goToStep, updateFormField])

  return (
    <>
      <Step4_Report />
      <StepIndicator />
    </>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Step4_Report', () => {
  it('載入時顯示讀取，完成後呈現風險層級與重點資訊', async () => {
    renderInProvider(<Harness />)

    expect(screen.getByText('正在計算您的風險...')).toBeInTheDocument()

    await screen.findByText('主要結果')

    expect(screen.getByText('您的心血管風險等級為：【中】')).toBeInTheDocument()
    expect(
      screen.getByText('根據指引，您的 LDL-C (低密度脂蛋白) 建議目標為：【<115 mg/dL】'),
    ).toBeInTheDocument()
    expect(screen.getByText('您符合 3 項心血管危險因子：')).toBeInTheDocument()
    expect(screen.getByText('高血壓')).toBeInTheDocument()
    expect(screen.getByText('數據總覽')).toBeInTheDocument()
    expect(screen.getByText('後續建議')).toBeInTheDocument()
    expect(screen.getByText('免責聲明')).toBeInTheDocument()
  })

  it('重新計算會再次呼叫 API', async () => {
    renderInProvider(<Harness />)

    await screen.findByText('主要結果')

    fireEvent.click(screen.getByRole('button', { name: '重新計算' }))

    await waitFor(() => {
      expect(requestRiskAssessment).toHaveBeenCalledTimes(2)
    })
  })
})
