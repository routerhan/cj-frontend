import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { MobileStepper } from './MobileStepper.jsx'
import { FormProvider, useFormContext } from '../../context/FormContext.jsx'

const wrapper = ({ children }) => <FormProvider>{children}</FormProvider>

describe('MobileStepper', () => {
  it('顯示當前步驟與總進度', () => {
    const Harness = () => {
      const { goToStep } = useFormContext()

      useEffect(() => {
        goToStep(2)
      }, [goToStep])

      return <MobileStepper />
    }

    render(<Harness />, { wrapper })

    expect(screen.getByText(/步驟 3 \/ 5/)).toBeInTheDocument()
    expect(screen.getByText(/60%/)).toBeInTheDocument()
  })
})
