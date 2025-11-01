import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { FormProvider, useFormContext } from '../context/FormContext.jsx'
import { LanguageProvider } from '../context/LanguageContext.jsx'
import { Step2_BpLipids } from './Step2_BpLipids.jsx'

const renderWithProvider = (ui) =>
  render(
    <LanguageProvider>
      <FormProvider>{ui}</FormProvider>
    </LanguageProvider>,
  )

const Harness = () => {
  const { goToStep, updateFormField } = useFormContext()

  useEffect(() => {
    updateFormField(['basic', 'sex'], 'female')
    updateFormField(['basic', 'birthDate'], '1990-01-01')
    updateFormField(['basic', 'heightCm'], '165')
    updateFormField(['basic', 'weightKg'], '60')
    updateFormField(['basic', 'waistCm'], '78')
    goToStep(2)
  }, [goToStep, updateFormField])

  return (
    <>
      <Step2_BpLipids />
      <div data-testid="current-step">{useFormContext().currentStep}</div>
    </>
  )
}

describe('Step2_BpLipids', () => {
  it('收集血壓與血脂資訊後提供即時提示並可前往下一步', async () => {
    renderWithProvider(<Harness />)

    const bpMedGroup = screen.getByRole('radiogroup', { name: '目前是否使用降血壓藥物？' })
    fireEvent.click(within(bpMedGroup).getByText('無'))

    const systolicInput = screen.getByRole('spinbutton', { name: '收縮壓' })
    fireEvent.change(systolicInput, { target: { value: '128' } })
    const diastolicInput = screen.getByRole('spinbutton', { name: '舒張壓' })
    fireEvent.change(diastolicInput, { target: { value: '82' } })

    const ldlInput = screen.getByLabelText(/LDL-C/, { selector: 'input' })
    fireEvent.change(ldlInput, { target: { value: '120' } })
    const hdlInput = screen.getByLabelText(/HDL-C/, { selector: 'input' })
    fireEvent.change(hdlInput, { target: { value: '55' } })
    const tgInput = screen.getByLabelText(/三酸甘油酯/, { selector: 'input' })
    fireEvent.change(tgInput, { target: { value: '130' } })

    const tgMedGroup = screen.getByRole('radiogroup', { name: /使用治療高三酸甘油酯/ })
    fireEvent.click(within(tgMedGroup).getByText('無'))

    expect(screen.queryByText(/血壓達到 130\/85/)).not.toBeInTheDocument()
    expect(screen.queryByText(/LDL-C ≥ 190/)).not.toBeInTheDocument()
    expect(screen.queryByText(/HDL-C 低於生理性別/)).not.toBeInTheDocument()
    expect(screen.queryByText(/TG ≥ 150/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一步：糖尿病' }))

    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('3')
    })
  })

  it('未填寫完整時顯示錯誤訊息', () => {
    renderWithProvider(<Harness />)

    const form = screen.getByTestId('bp-lipids-form')
    fireEvent.submit(form)

    expect(screen.getByText('請選擇是否使用高血壓藥物')).toBeInTheDocument()
    expect(screen.queryByText('請輸入最近的血壓值')).not.toBeInTheDocument()
    expect(screen.queryByText('請輸入 LDL 數值')).not.toBeInTheDocument()
    expect(screen.queryByText('請輸入 HDL 數值')).not.toBeInTheDocument()
    expect(screen.queryByText('請輸入三酸甘油酯數值')).not.toBeInTheDocument()
    expect(screen.getByText('請選擇是否使用降三酸甘油酯藥物')).toBeInTheDocument()
  })
})
