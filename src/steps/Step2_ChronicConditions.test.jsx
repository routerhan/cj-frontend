import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { FormProvider, useFormContext } from '../context/FormContext.jsx'
import { LanguageProvider } from '../context/LanguageContext.jsx'
import { Step2_ChronicConditions } from './Step2_ChronicConditions.jsx'

const renderWithProvider = (ui) =>
  render(
    <LanguageProvider>
      <FormProvider>{ui}</FormProvider>
    </LanguageProvider>,
  )

const Harness = () => {
  const { goToStep, updateFormField } = useFormContext()

  useEffect(() => {
    updateFormField(['basicInfo', 'gender'], 'male')
    updateFormField(['basicInfo', 'ageYears'], 45)
    updateFormField(['basicInfo', 'heightCm'], '175')
    updateFormField(['basicInfo', 'weightKg'], '72')
    goToStep(2)
  }, [goToStep, updateFormField])

  return (
    <>
      <Step2_ChronicConditions />
      <div data-testid="current-step">{useFormContext().currentStep}</div>
    </>
  )
}

describe('Step2_ChronicConditions', () => {
  it('需要先選擇狀態後才能前往下一步', () => {
    renderWithProvider(<Harness />)

    const nextButton = screen.getByRole('button', { name: '下一步：腎臟功能' })
    expect(nextButton).toBeDisabled()
  })

  it('填寫完整後可以前往腎臟功能步驟', async () => {
    renderWithProvider(<Harness />)

    // 高血壓
    const hypertensionGroup = screen.getByRole('radiogroup', { name: '高血壓狀態' })
    fireEvent.click(within(hypertensionGroup).getByText('有'))

    const bpMedicationGroup = screen.getByRole('radiogroup', { name: '降血壓藥' })
    fireEvent.click(within(bpMedicationGroup).getByText('有'))

    fireEvent.change(screen.getByPlaceholderText('收縮壓'), { target: { value: '140' } })
    fireEvent.change(screen.getByPlaceholderText('舒張壓'), { target: { value: '90' } })

    const diabetesGroup = screen.getByRole('radiogroup', { name: '糖尿病狀態' })
    fireEvent.click(within(diabetesGroup).getByText('有'))

    const glucoseMedicationGroup = screen.getByRole('radiogroup', { name: '降血糖藥' })
    fireEvent.click(within(glucoseMedicationGroup).getByText('無'))

    const fastingField = within(
      screen.getByText('最近一次空腹血糖值').closest('label'),
    ).getByPlaceholderText('mg/dL')
    fireEvent.change(fastingField, { target: { value: '110' } })

    const hba1cField = within(
      screen.getByText('最近一次糖化血色素值').closest('label'),
    ).getByPlaceholderText('%')
    fireEvent.change(hba1cField, { target: { value: '6.5' } })

    const nextButton = screen.getByRole('button', { name: '下一步：腎臟功能' })
    expect(nextButton).not.toBeDisabled()

    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('3')
    })
  })
})
