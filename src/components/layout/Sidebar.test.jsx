import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar.jsx'
import { FormProvider, StepStatus, useFormContext } from '../../context/FormContext.jsx'
import { LanguageProvider } from '../../context/LanguageContext.jsx'

const wrapper = ({ children }) => (
  <LanguageProvider>
    <FormProvider>{children}</FormProvider>
  </LanguageProvider>
)

const CurrentStepIndicator = () => {
  const { currentStep } = useFormContext()
  return <div data-testid="current-step">{currentStep}</div>
}

describe('Sidebar', () => {
  it('預設僅開放當前與已進行步驟', () => {
    render(<Sidebar />, { wrapper })
    const buttons = screen.getAllByRole('button')

    expect(buttons[0]).not.toBeDisabled()
    expect(buttons[1]).toBeDisabled()
  })

  it('可切換至已開放的步驟', () => {
    const Harness = () => {
      const { setStepStatus } = useFormContext()

      useEffect(() => {
        setStepStatus('basicInfo', StepStatus.IN_PROGRESS)
      }, [setStepStatus])

      return (
        <>
          <Sidebar />
          <CurrentStepIndicator />
        </>
      )
    }

    render(<Harness />, { wrapper })

    const basicInfoButton = screen.getByRole('button', { name: /基本資料與生活習慣/ })
    fireEvent.click(basicInfoButton)

    expect(screen.getByTestId('current-step')).toHaveTextContent('1')
  })

  it('高亮目前步驟', () => {
    render(
      <>
        <Sidebar />
        <CurrentStepIndicator />
      </>,
      { wrapper },
    )

    const welcomeButton = screen.getByRole('button', { name: /歡迎頁/ })
    expect(welcomeButton).toHaveAttribute('aria-current', 'step')
  })
})
