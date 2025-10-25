import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormProvider, StepStatus, useFormContext } from './FormContext.jsx'

const wrapper = ({ children }) => <FormProvider>{children}</FormProvider>

describe('FormContext', () => {
  it('提供初始狀態與步驟資訊', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper })

    expect(result.current.steps).toHaveLength(7)
    expect(result.current.currentStep).toBe(0)
    expect(result.current.stepStatus.welcome).toBe(StepStatus.IN_PROGRESS)
    expect(result.current.stepStatus.basicInfo).toBe(StepStatus.PENDING)
    expect(result.current.formData.basicInfo.gender).toBe('')
    expect(result.current.formData.conditions).toBeDefined()
    expect(result.current.formData.riskFactors).toBeDefined()
  })

  it('可深度合併更新表單區塊且保留既有資料', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper })

    act(() => {
      result.current.updateFormSection('conditions', {
        kidney: { status: '有' },
      })
    })

    expect(result.current.formData.conditions.kidney.status).toBe('有')
    expect(result.current.formData.conditions.kidney.serumCreatinineMgDl).toBe('')

    act(() => {
      result.current.updateFormSection('conditions', {
        kidney: { serumCreatinineMgDl: '1.3' },
      })
    })

    expect(result.current.formData.conditions.kidney.status).toBe('有')
    expect(result.current.formData.conditions.kidney.serumCreatinineMgDl).toBe('1.3')
  })

  it('支援路徑更新單一欄位', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper })

    act(() => {
      result.current.updateFormField(['basicInfo', 'gender'], 'female')
    })

    expect(result.current.formData.basicInfo.gender).toBe('female')
  })

  it('步驟導覽具邊界檢查並更新狀態', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper })

    act(() => {
      result.current.goToStep(2)
    })
    expect(result.current.currentStep).toBe(2)
    expect(result.current.stepStatus.hypertensionDiabetes).toBe(StepStatus.IN_PROGRESS)

    act(() => {
      result.current.goToNext()
    })
    expect(result.current.currentStep).toBe(3)

    act(() => {
      result.current.goToPrevious()
    })
    expect(result.current.currentStep).toBe(2)

    act(() => {
      result.current.goToStep(99)
    })
    expect(result.current.currentStep).toBe(2)
  })

  it('可標記目前步驟為完成狀態', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper })

    act(() => {
      result.current.markCurrentStepCompleted()
    })

    expect(result.current.stepStatus.welcome).toBe(StepStatus.COMPLETED)
  })
})
