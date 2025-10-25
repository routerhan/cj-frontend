import { fireEvent, render, screen } from '@testing-library/react'
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
  const { goToStep, updateFormField } = useFormContext()

  useEffect(() => {
    goToStep(5)
    updateFormField(['riskFactors', 'cardiovascularHistory'], {
      hasHistory: '',
      notes: '',
      hasCad: '',
      miWithin1Year: '',
      miHistoryCount: '0',
      hasMultivesselObstruction: '',
      hasAcsWithDiabetes: '',
      hasPad: '',
      hasCarotidStenosis: '',
      hasStrokeWithAtherosclerosis: '',
      hasSignificantPlaque: '',
    })
  }, [goToStep, updateFormField])

  return (
    <>
      <Step5_CardiovascularHistory />
      <div data-testid="current-step">{useFormContext().currentStep}</div>
    </>
  )
}

describe('Step5_CardiovascularHistory', () => {
  it('未填寫資訊前無法前往下一步', () => {
    renderWithProvider(<Harness />)
    const nextButton = screen.getByRole('button', { name: '下一步：風險報告' })
    expect(nextButton).toBeDisabled()
  })

  it('填寫完整心血管病史後可前往下一步', () => {
    renderWithProvider(<Harness />)

    fireEvent.click(screen.getByLabelText('有', { selector: 'input[name="cardio-history"]' }))
    fireEvent.change(screen.getByPlaceholderText('例如：2022 年心肌梗塞，已置放冠狀動脈支架'), {
      target: { value: '2022 年心肌梗塞，已治療' },
    })

    const selectNo = (name) => {
      fireEvent.click(screen.getByLabelText('無', { selector: `input[name="${name}"]` }))
    }

    selectNo('hasCad')
    const miCountInput = screen.getByLabelText(/歷來心肌梗塞次數/)
    fireEvent.change(miCountInput, { target: { value: '1' } })
    selectNo('miWithin1Year')
    selectNo('hasMultivesselObstruction')
    selectNo('hasAcsWithDiabetes')
    selectNo('hasPad')
    selectNo('hasCarotidStenosis')
    selectNo('hasStrokeWithAtherosclerosis')
    selectNo('hasSignificantPlaque')

    const nextButton = screen.getByRole('button', { name: '下一步：風險報告' })
    expect(nextButton).not.toBeDisabled()

    fireEvent.click(nextButton)
    expect(screen.getByTestId('current-step')).toHaveTextContent('6')
  })
})
