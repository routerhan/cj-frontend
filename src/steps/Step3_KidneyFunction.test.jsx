import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { FormProvider, useFormContext } from '../context/FormContext.jsx'
import { LanguageProvider } from '../context/LanguageContext.jsx'
import { Step3_KidneyFunction } from './Step3_KidneyFunction.jsx'

const renderWithProvider = (ui) =>
  render(
    <LanguageProvider>
      <FormProvider>{ui}</FormProvider>
    </LanguageProvider>,
  )

const Harness = () => {
  const { goToStep, updateFormField } = useFormContext()

  useEffect(() => {
    updateFormField(['basicInfo', 'gender'], 'female')
    updateFormField(['basicInfo', 'ageYears'], 52)
    updateFormField(['basicInfo', 'heightCm'], '162')
    updateFormField(['basicInfo', 'weightKg'], '58')
    goToStep(3)
  }, [goToStep, updateFormField])

  return (
    <>
      <Step3_KidneyFunction />
      <div data-testid="current-step">{useFormContext().currentStep}</div>
    </>
  )
}

describe('Step3_KidneyFunction', () => {
  it('未選擇狀態時無法前往下一步', () => {
    renderWithProvider(<Harness />)

    const nextButton = screen.getByRole('button', { name: '下一步：血脂檢驗' })
    expect(nextButton).toBeDisabled()
  })

  it('輸入肌酸酐後顯示 eGFR 並可前往下一步', async () => {
    renderWithProvider(<Harness />)

    const statusGroup = screen.getByRole('radiogroup', { name: '腎臟病狀態' })
    fireEvent.click(within(statusGroup).getByText('有'))

    const creatinineInput = screen.getByPlaceholderText('mg/dL')
    fireEvent.change(creatinineInput, { target: { value: '1.1' } })

    await waitFor(() => {
      expect(screen.getByText(/ml\/min\/1\.73m²/)).not.toHaveTextContent('--')
    })

    const nextButton = screen.getByRole('button', { name: '下一步：血脂檢驗' })
    expect(nextButton).not.toBeDisabled()

    fireEvent.click(nextButton)
    expect(screen.getByTestId('current-step')).toHaveTextContent('4')
  })
})
