import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { FormProvider, useFormContext } from '../context/FormContext.jsx'
import { LanguageProvider } from '../context/LanguageContext.jsx'
import { Step4_LipidProfile } from './Step4_LipidProfile.jsx'

const renderWithProvider = (ui) =>
  render(
    <LanguageProvider>
      <FormProvider>{ui}</FormProvider>
    </LanguageProvider>,
  )

const Harness = () => {
  const { goToStep, updateFormField } = useFormContext()

  useEffect(() => {
    goToStep(4)
    updateFormField(['riskFactors', 'dyslipidemia', 'status'], '')
  }, [goToStep, updateFormField])

  return (
    <>
      <Step4_LipidProfile />
      <div data-testid="current-step">{useFormContext().currentStep}</div>
    </>
  )
}

describe('Step4_LipidProfile', () => {
  it('需要填寫血脂資訊才能前往下一步', () => {
    renderWithProvider(<Harness />)

    const nextButton = screen.getByRole('button', { name: '下一步：心血管病史' })
    expect(nextButton).toBeDisabled()
  })

  it('填寫完整血脂資料後可前往下一步', () => {
    renderWithProvider(<Harness />)

    const dyslipidemiaGroup = screen.getByRole('radiogroup', { name: '高脂血症狀態' })
    fireEvent.click(within(dyslipidemiaGroup).getByText('有'))

    const lipidMedicationGroup = screen.getByRole('radiogroup', { name: '降血脂藥' })
    fireEvent.click(within(lipidMedicationGroup).getByText('無'))

    const ldlField = within(
      screen.getByText('最近一次低密度脂蛋白 (LDL)').closest('label'),
    ).getByPlaceholderText('mg/dL')
    fireEvent.change(ldlField, { target: { value: '130' } })

    const hdlField = within(
      screen.getByText('最近一次高密度脂蛋白 (HDL)').closest('label'),
    ).getByPlaceholderText('mg/dL')
    fireEvent.change(hdlField, { target: { value: '55' } })

    const tgField = within(
      screen.getByText('最近一次空腹三酸甘油酯 (TG)').closest('label'),
    ).getByPlaceholderText('mg/dL')
    fireEvent.change(tgField, { target: { value: '160' } })

    const nextButton = screen.getByRole('button', { name: '下一步：心血管病史' })
    expect(nextButton).not.toBeDisabled()

    fireEvent.click(nextButton)
    expect(screen.getByTestId('current-step')).toHaveTextContent('5')
  })
})
