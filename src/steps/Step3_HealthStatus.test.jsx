import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { FormProvider, useFormContext } from '../context/FormContext.jsx'
import { Step3_HealthStatus } from './Step3_HealthStatus.jsx'

const renderWithProvider = (ui) => render(<FormProvider>{ui}</FormProvider>)

const Harness = () => {
  const { goToStep } = useFormContext()

  useEffect(() => {
    goToStep(3)
  }, [goToStep])

  return (
    <>
      <Step3_HealthStatus />
      <div data-testid="current-step">{useFormContext().currentStep}</div>
    </>
  )
}

describe('Step3_HealthStatus', () => {
  it('需要填寫狀態才能前往下一步', () => {
    renderWithProvider(<Harness />)

    const nextButton = screen.getByRole('button', { name: '下一步：風險報告' })
    expect(nextButton).toBeDisabled()
  })

  it('填寫完整後可以前往報告頁', () => {
    renderWithProvider(<Harness />)

    const dyslipidemiaGroup = screen.getByRole('radiogroup', { name: '高脂血症狀態' })
    fireEvent.click(within(dyslipidemiaGroup).getByText('有'))

    const lipidMedicationGroup = screen.getByRole('radiogroup', { name: '降血脂藥' })
    fireEvent.click(within(lipidMedicationGroup).getByText('無'))

    const ldlField = within(screen.getByText('最近一次低密度脂蛋白 (LDL)').closest('label')).getByPlaceholderText('mg/dL')
    fireEvent.change(ldlField, { target: { value: '130' } })

    const hdlField = within(screen.getByText('最近一次高密度脂蛋白 (HDL)').closest('label')).getByPlaceholderText('mg/dL')
    fireEvent.change(hdlField, { target: { value: '55' } })

    const tgField = within(screen.getByText('最近一次空腹三酸甘油酯 (TG)').closest('label')).getByPlaceholderText('mg/dL')
    fireEvent.change(tgField, { target: { value: '160' } })

    const historyGroup = screen.getByRole('radiogroup', { name: '曾發生心血管疾病' })
    fireEvent.click(within(historyGroup).getByText('無'))

    const nextButton = screen.getByRole('button', { name: '下一步：風險報告' })
    expect(nextButton).not.toBeDisabled()
    fireEvent.click(nextButton)

    expect(screen.getByTestId('current-step')).toHaveTextContent('4')
  })
})
