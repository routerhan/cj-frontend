import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { FormProvider, useFormContext } from '../context/FormContext.jsx'
import { LanguageProvider } from '../context/LanguageContext.jsx'
import { Step5_CardiovascularHistory } from './Step5_CardiovascularHistory.jsx'

const renderWithProvider = (ui) =>
  render(
    <LanguageProvider>
      <FormProvider>{ui}</FormProvider>
    </LanguageProvider>,
  )

const Harness = () => {
  const { goToStep, getStepIndex, currentStep } = useFormContext()

  useEffect(() => {
    goToStep(getStepIndex('history'))
  }, [goToStep, getStepIndex])

  return (
    <>
      <Step5_CardiovascularHistory />
      <div data-testid="current-step">{currentStep}</div>
    </>
  )
}

describe('Step5_CardiovascularHistory', () => {
  it('填寫心血管病史並顯示 CAD 進階問題', async () => {
    renderWithProvider(<Harness />)

    // 回答 CAC 問題與必要的 yes/no 欄位
    const cacGroup = screen.getByRole('radiogroup', { name: /CAC/ })
    fireEvent.click(within(cacGroup).getByText('否'))
    const plaqueGroup = screen.getByRole('radiogroup', { name: /斑塊負擔/ })
    fireEvent.click(within(plaqueGroup).getByText('有'))
    const ascvdGroup = screen.getByRole('radiogroup', { name: /ASCVD/ })
    fireEvent.click(within(ascvdGroup).getByText('有'))

    // Select vascular diseases, including CAD to reveal advanced options
    fireEvent.click(screen.getByLabelText(/冠狀動脈疾病/))
    fireEvent.click(screen.getByLabelText(/周邊動脈疾病/))
    fireEvent.click(screen.getByLabelText(/頸動脈狹窄/))

    // CAD advanced options should be visible once CAD is checked
    const miWithinYear = screen.getByLabelText(/一年內曾經歷心肌梗塞/)
    const miCountTwoPlus = screen.getByLabelText(/心肌梗塞次數 ≥ 2/)
    const multiVessel = screen.getByLabelText(/多支冠狀動脈阻塞/)

    fireEvent.click(miWithinYear)
    fireEvent.click(miCountTwoPlus)
    fireEvent.click(multiVessel)

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('6')
    })
  })

  it('驗證必填欄位與數值格式', () => {
    renderWithProvider(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

    expect(screen.getByText('請選擇是否 ≥ 400 或勾選不知道')).toBeInTheDocument()
    expect(screen.getByText('請選擇是否存在顯著斑塊')).toBeInTheDocument()
    expect(screen.getByText('請選擇是否被診斷 ASCVD')).toBeInTheDocument()
  })
})
