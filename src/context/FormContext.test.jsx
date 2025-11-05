import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormProvider, StepStatus, useFormContext } from './FormContext.jsx'

const wrapper = ({ children }) => <FormProvider>{children}</FormProvider>

describe('FormContext', () => {
  it('提供新的步驟資訊與初始表單資料', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper })

    expect(result.current.steps.map((step) => step.key)).toEqual([
      'welcome',
      'basic',
      'bpAndLipids',
      'diabetes',
      'kidney',
      'history',
      'report',
    ])
    expect(result.current.currentStep).toBe(0)
    expect(result.current.stepStatus.welcome).toBe(StepStatus.IN_PROGRESS)
    expect(result.current.stepStatus.basic).toBe(StepStatus.PENDING)
    // legacy key alias
    expect(result.current.stepStatus.basicInfo).toBe(StepStatus.PENDING)
    expect(result.current.formData.basic.sex).toBe('')
    expect(result.current.formData.bpAndLipids).toBeDefined()
    expect(result.current.formData.history.ascvdDiagnoses.acuteCoronarySyndrome).toBe(false)
  })

  it('可深度合併更新表單區塊且保留既有資料', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper })

    act(() => {
      result.current.updateFormSection('kidney', {
        hasCkdDiagnosis: 'yes',
      })
    })

    expect(result.current.formData.kidney.hasCkdDiagnosis).toBe('yes')
    expect(result.current.formData.kidney.egfr).toBe('')

    act(() => {
      result.current.updateFormSection('kidney', { egfr: '55' })
    })

    expect(result.current.formData.kidney.hasCkdDiagnosis).toBe('yes')
    expect(result.current.formData.kidney.egfr).toBe('55')
  })

  it('支援路徑更新並計算衍生指標', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper })

    act(() => {
      result.current.updateFormField(['basic', 'sex'], 'male')
      result.current.updateFormField(['basic', 'birthDate'], '1990-02-08')
      result.current.updateFormField(['basic', 'heightCm'], '180')
      result.current.updateFormField(['basic', 'weightKg'], '75')
      result.current.updateFormField(['basic', 'waistCm'], '92')
      result.current.updateFormField(['bpAndLipids', 'hdlMgDl'], '38')
    })

    expect(result.current.formData.basic.sex).toBe('male')
    expect(result.current.getAge()).toBeGreaterThan(0)
    expect(result.current.getBmi()).toBeCloseTo(23.1, 1)
    expect(result.current.getWaistStatus().isObese).toBe(true)
    const { derivedMetrics } = result.current
    expect(derivedMetrics.hdlThreshold).toBe(40)
    expect(derivedMetrics.isHdlLow).toBe(true)
  })

  it('步驟導覽具邊界檢查並更新狀態', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper })

    act(() => {
      const diabetesIndex = result.current.getStepIndex('diabetes')
      result.current.goToStep(diabetesIndex)
    })
    expect(result.current.stepStatus.diabetes).toBe(StepStatus.IN_PROGRESS)

    act(() => {
      result.current.goToNext()
    })
    expect(result.current.currentStep).toBe(result.current.getStepIndex('kidney'))

    act(() => {
      result.current.goToPrevious()
    })
    expect(result.current.stepStatus.diabetes).toBe(StepStatus.IN_PROGRESS)

    act(() => {
      result.current.goToStep(99)
    })
    expect(result.current.currentStep).toBe(result.current.getStepIndex('diabetes'))
  })

  it('可標記目前步驟為完成狀態', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper })

    act(() => {
      result.current.markCurrentStepCompleted()
    })

    expect(result.current.stepStatus.welcome).toBe(StepStatus.COMPLETED)
  })
})
