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
  const { goToStep, getStepIndex, updateFormField, currentStep } = useFormContext()

  useEffect(() => {
    updateFormField(['kidney', 'hasCkdDiagnosis'], '')
    updateFormField(['kidney', 'egfr'], '')
    updateFormField(['kidney', 'uacr'], '')
    goToStep(getStepIndex('kidney'))
  }, [goToStep, getStepIndex, updateFormField])

  return (
    <>
      <Step3_KidneyFunction />
      <div data-testid="current-step">{currentStep}</div>
    </>
  )
}

describe('Step3_KidneyFunction', () => {
  it('收集 CKD 資訊並可填寫選填檢驗值', async () => {
    renderWithProvider(<Harness />)

    const diagnosisGroup = screen.getByRole('radiogroup', { name: /慢性腎臟病/ })
    fireEvent.click(within(diagnosisGroup).getByText('否'))

    fireEvent.change(screen.getByLabelText(/eGFR/), { target: { value: '58.4' } })
    fireEvent.change(screen.getByLabelText(/UACR/), { target: { value: '35' } })

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('5')
    })
  })

  it('驗證診斷問題必填與檢驗數值格式', () => {
    renderWithProvider(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

    expect(screen.getByText('請選擇是否被診斷 CKD')).toBeInTheDocument()

    const diagnosisGroup = screen.getByRole('radiogroup', { name: /慢性腎臟病/ })
    fireEvent.click(within(diagnosisGroup).getByText('是'))

    fireEvent.change(screen.getByLabelText(/eGFR/), { target: { value: '-5' } })
    fireEvent.change(screen.getByLabelText(/UACR/), { target: { value: '-3' } })

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

    expect(screen.getByText('請輸入有效的 eGFR 數值')).toBeInTheDocument()
    expect(screen.getByText('請輸入有效的 UACR 數值')).toBeInTheDocument()
  })
})
