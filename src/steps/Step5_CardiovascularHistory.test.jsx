import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim()

const clickOption = (textSnippet) => {
  const expected = normalizeWhitespace(textSnippet)
  const target = screen.getByText(
    (content) => normalizeWhitespace(content).includes(expected),
  )
  fireEvent.click(target)
}

describe('Step5_CardiovascularHistory', () => {
  it('填寫醫療病史的多重選項並前往下一步', async () => {
    renderWithProvider(<Harness />)

    clickOption('1)  急性冠心症病史')
    clickOption('4)  周邊動脈疾病 (曾接受血管再通術、有間歇性跛行相關症狀或截肢)')

    clickOption('1)  冠狀動脈血管攝影')

    clickOption('1)  一年內曾歷經心肌梗塞')
    clickOption('2)  ≥兩次心肌梗塞病史')
    clickOption('4)  急性冠心症合併糖尿病')
    clickOption('5)  周邊動脈疾病或頸動脈狹窄')

    clickOption('1)  冠狀動脈疾病')
    clickOption('2)  頸動脈狹窄')

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('6')
    })
  })

  it('驗證必填欄位與數值格式', () => {
    renderWithProvider(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

    const messages = screen.getAllByText('請至少勾選一項或選擇「以上皆無」')
    expect(messages).toHaveLength(4)
  })
})
