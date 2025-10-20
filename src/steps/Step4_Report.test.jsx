import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import { FormProvider, useFormContext } from '../context/FormContext.jsx'
import { Step4_Report } from './Step4_Report.jsx'
import { calculateRisk } from '../utils/mockApi.js'

vi.mock('../utils/mockApi.js', () => ({
  calculateRisk: vi.fn().mockResolvedValue({
    riskScore: 14.2,
    riskLevel: '中',
    factors: ['高血壓', '血脂異常'],
    populationAverage: 8.5,
    relativeDifference: 5.7,
    recommendations: ['定期追蹤血壓', '維持運動習慣'],
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
    goToStep(4)
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
  it('載入時顯示讀取，完成後呈現風險分數', async () => {
    renderInProvider(<Harness />)

    expect(screen.getByText('正在計算您的風險...')).toBeInTheDocument()

    const percentages = await screen.findAllByText(/14\.2%/)
    expect(percentages.length).toBeGreaterThan(0)

    expect(screen.getAllByText('中度風險')[0]).toBeInTheDocument()
    expect(screen.getByText('高血壓')).toBeInTheDocument()
    expect(screen.getByText('定期追蹤血壓')).toBeInTheDocument()
  })

  it('重新計算會再次呼叫 API', async () => {
    renderInProvider(<Harness />)

    await screen.findAllByText(/14\.2%/)

    fireEvent.click(screen.getByRole('button', { name: '重新計算' }))

    await waitFor(() => {
      expect(calculateRisk).toHaveBeenCalledTimes(2)
    })
  })
})
