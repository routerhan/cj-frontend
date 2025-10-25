import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import { FormProvider, useFormContext } from '../context/FormContext.jsx'
import { Step4_Report } from './Step4_Report.jsx'
import { requestRiskAssessment } from '../utils/riskApi.js'

vi.mock('../utils/riskApi.js', () => ({
  requestRiskAssessment: vi.fn().mockResolvedValue({
    level: '中',
    levelCode: 'medium',
    matchedRules: [{ code: 'risk_factor_count', label: '心血管危險因子達兩項以上' }],
    riskFactorCount: 2,
    riskFactors: [
      { code: 'hypertension', label: '高血壓', present: true },
      { code: 'smoking', label: '抽菸', present: false },
    ],
    metabolicSyndrome: {
      count: 2,
      components: {
        abdominalObesity: true,
        elevatedBloodPressure: true,
        elevatedGlucose: false,
        elevatedTriglyceride: false,
        lowHdl: false,
      },
    },
    recommendations: ['維持規律運動與均衡飲食'],
    evaluatedAt: '2025-01-01T08:00:00.000Z',
  }),
}))

const renderInProvider = (ui) => render(<FormProvider>{ui}</FormProvider>)

const StepIndicator = () => {
  const { currentStep } = useFormContext()
  return <div data-testid="current-step">{currentStep}</div>
}

const Harness = () => {
  const { goToStep, updateFormField } = useFormContext()

  useEffect(() => {
    updateFormField(['basicInfo', 'gender'], 'male')
    updateFormField(['basicInfo', 'ageYears'], 45)
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

    await screen.findByText('此次評估結果')

    expect(screen.getAllByText('中')[0]).toBeInTheDocument()
    expect(screen.getByText('心血管危險因子')).toBeInTheDocument()
    expect(screen.getByText('高血壓')).toBeInTheDocument()
    expect(screen.getByText('維持規律運動與均衡飲食')).toBeInTheDocument()
  })

  it('重新計算會再次呼叫 API', async () => {
    renderInProvider(<Harness />)

    await screen.findByText('此次評估結果')

    fireEvent.click(screen.getByRole('button', { name: '重新計算' }))

    await waitFor(() => {
      expect(requestRiskAssessment).toHaveBeenCalledTimes(2)
    })
  })
})
