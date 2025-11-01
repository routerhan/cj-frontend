import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { FormProvider, useFormContext } from '../context/FormContext.jsx'
import { LanguageProvider } from '../context/LanguageContext.jsx'
import { Step3_Diabetes } from './Step3_Diabetes.jsx'

const renderWithProvider = (ui) =>
  render(
    <LanguageProvider>
      <FormProvider>{ui}</FormProvider>
    </LanguageProvider>,
  )

const Harness = () => {
  const { goToStep, getStepIndex, updateFormField, currentStep } = useFormContext()

  useEffect(() => {
    updateFormField(['diabetes', 'hasDiagnosis'], '')
    updateFormField(['diabetes', 'usesMedication'], '')
    updateFormField(['diabetes', 'fastingGlucoseMgDl'], '')
    goToStep(getStepIndex('diabetes'))
  }, [goToStep, getStepIndex, updateFormField])

  return (
    <>
      <Step3_Diabetes />
      <div data-testid="current-step">{currentStep}</div>
    </>
  )
}

describe('Step3_Diabetes', () => {
  it('選擇已確診時填寫用藥與血糖即可前往下一步', async () => {
    renderWithProvider(<Harness />)

    const diagnosisGroup = screen.getByRole('radiogroup', { name: '您是否曾被醫師診斷患有「糖尿病」？' })
    fireEvent.click(within(diagnosisGroup).getByText('是'))

    const medicationGroup = screen.getByRole('radiogroup', { name: '您是否正在使用糖尿病藥物？' })
    fireEvent.click(within(medicationGroup).getByText('否'))

    const glucoseInput = screen.getByLabelText(/請輸入您最近的空腹血糖值/)
    fireEvent.change(glucoseInput, { target: { value: '110' } })

    fireEvent.click(screen.getByRole('button', { name: '下一步：腎臟功能' }))

    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent(String(4))
    })
  })

  it('選擇無糖尿病時可跳過後續問題', async () => {
    renderWithProvider(<Harness />)

    const diagnosisGroup = screen.getByRole('radiogroup', { name: '您是否曾被醫師診斷患有「糖尿病」？' })
    fireEvent.click(within(diagnosisGroup).getByText('否'))

    expect(screen.queryByText('您是否正在使用糖尿病藥物？')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('請輸入您最近的空腹血糖值')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一步：腎臟功能' }))

    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent(String(4))
    })
  })

  it('驗證必填欄位與血糖格式', () => {
    renderWithProvider(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: '下一步：腎臟功能' }))
    expect(screen.getByText('請選擇是否被診斷糖尿病')).toBeInTheDocument()

    const diagnosisGroup = screen.getByRole('radiogroup', { name: '您是否曾被醫師診斷患有「糖尿病」？' })
    fireEvent.click(within(diagnosisGroup).getByText('是'))

    fireEvent.click(screen.getByRole('button', { name: '下一步：腎臟功能' }))
    expect(screen.getByText('請選擇是否使用糖尿病藥物')).toBeInTheDocument()

    const medicationGroup = screen.getByRole('radiogroup', { name: '您是否正在使用糖尿病藥物？' })
    fireEvent.click(within(medicationGroup).getByText('否'))

    const glucoseInput = screen.getByLabelText(/請輸入您最近的空腹血糖值/)
    fireEvent.change(glucoseInput, { target: { value: '-20' } })

    fireEvent.click(screen.getByRole('button', { name: '下一步：腎臟功能' }))
    expect(screen.getByText('請輸入有效的空腹血糖值或留空')).toBeInTheDocument()
  })
})
