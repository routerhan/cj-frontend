import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export const StepStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
}

const steps = [
  { id: 0, key: 'welcome' },
  { id: 1, key: 'basicInfo' },
  { id: 2, key: 'conditions' },
  { id: 3, key: 'riskFactors' },
  { id: 4, key: 'report' },
]

const FormContext = createContext(undefined)

const stepKeySet = new Set(steps.map((step) => step.key))
const stepStatusValues = new Set(Object.values(StepStatus))

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const deepMerge = (target, source) => {
  if (!isPlainObject(source)) {
    return source
  }

  const output = { ...(target ?? {}) }

  Object.entries(source).forEach(([key, value]) => {
    output[key] = isPlainObject(value)
      ? deepMerge(target?.[key], value)
      : value
  })

  return output
}

const createInitialFormData = () => ({
  basicInfo: {
    gender: '',
    genderOther: '',
    birthDate: '',
    nationality: '',
    heightCm: '',
    weightKg: '',
    waistCm: '',
    ageYears: null,
    bmi: null,
    bmiCategory: '',
    smokingStatus: '',
    familyHistory: '',
  },
  conditions: {
    hypertension: {
      status: '',
      medication: '',
      systolic: '',
      diastolic: '',
    },
    diabetes: {
      status: '',
      medication: '',
      fastingGlucoseMgDl: '',
      hba1cPercent: '',
    },
    kidney: {
      status: '',
      serumCreatinineMgDl: '',
      egfr: null,
    },
  },
  riskFactors: {
    dyslipidemia: {
      status: '',
      medication: '',
      ldlMgDl: '',
      hdlMgDl: '',
      triglycerideMgDl: '',
    },
    cardiovascularHistory: {
      hasHistory: '',
      notes: '',
    },
  },
  report: {
    riskScore: null,
    riskLevel: '',
    factors: [],
  },
})

const createInitialStepStatus = () => {
  const statusMap = {}
  steps.forEach((step, index) => {
    statusMap[step.key] = index === 0 ? StepStatus.IN_PROGRESS : StepStatus.PENDING
  })
  return statusMap
}

export const FormProvider = ({ children }) => {
  const [formData, setFormData] = useState(() => createInitialFormData())
  const [currentStep, setCurrentStep] = useState(0)
  const [stepStatus, setStepStatusState] = useState(() => createInitialStepStatus())

  const updateFormSection = useCallback((sectionKey, updates) => {
    if (!sectionKey || !isPlainObject(updates)) return

    setFormData((prev) => {
      const nextSection = deepMerge(prev[sectionKey], updates)

      if (nextSection === prev[sectionKey]) {
        return prev
      }

      return {
        ...prev,
        [sectionKey]: nextSection,
      }
    })
  }, [])

  const updateFormField = useCallback((path, value) => {
    if (!Array.isArray(path) || path.length === 0) return

    setFormData((prev) => {
      const nextFormData = { ...prev }
      let cursor = nextFormData

      for (let index = 0; index < path.length - 1; index += 1) {
        const key = path[index]
        const currentValue = cursor[key]

        cursor[key] = isPlainObject(currentValue) ? { ...currentValue } : {}
        cursor = cursor[key]
      }

      cursor[path[path.length - 1]] = value
      return nextFormData
    })
  }, [])

  const resetSection = useCallback((sectionKey) => {
    if (!sectionKey) return

    setFormData((prev) => {
      const initial = createInitialFormData()
      if (!(sectionKey in initial)) return prev

      return {
        ...prev,
        [sectionKey]: initial[sectionKey],
      }
    })
  }, [])

  const setStepStatus = useCallback((stepKey, status) => {
    if (!stepKeySet.has(stepKey) || !stepStatusValues.has(status)) return

    setStepStatusState((prev) => {
      if (prev[stepKey] === status) return prev

      return {
        ...prev,
        [stepKey]: status,
      }
    })
  }, [])

  const markStepCompleted = useCallback(
    (stepKey) => {
      setStepStatus(stepKey, StepStatus.COMPLETED)
    },
    [setStepStatus],
  )

  const markCurrentStepCompleted = useCallback(() => {
    const stepKey = steps[currentStep]?.key
    if (!stepKey) return
    markStepCompleted(stepKey)
  }, [currentStep, markStepCompleted])

  const ensureStepInProgress = useCallback(
    (stepIndex) => {
      const stepKey = steps[stepIndex]?.key
      if (!stepKey) return
      setStepStatus(stepKey, StepStatus.IN_PROGRESS)
    },
    [setStepStatus],
  )

  const goToStep = useCallback(
    (stepIndex) => {
      if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= steps.length) return
      setCurrentStep(stepIndex)
      ensureStepInProgress(stepIndex)
    },
    [ensureStepInProgress],
  )

  const goToNext = useCallback(() => {
    setCurrentStep((prev) => {
      const nextIndex = prev + 1 < steps.length ? prev + 1 : prev
      if (nextIndex !== prev) {
        ensureStepInProgress(nextIndex)
      }
      return nextIndex
    })
  }, [ensureStepInProgress])

  const goToPrevious = useCallback(() => {
    setCurrentStep((prev) => {
      const nextIndex = prev - 1 >= 0 ? prev - 1 : prev
      if (nextIndex !== prev) {
        ensureStepInProgress(nextIndex)
      }
      return nextIndex
    })
  }, [ensureStepInProgress])

  const resetForm = useCallback(() => {
    setFormData(createInitialFormData())
    setCurrentStep(0)
    setStepStatusState(createInitialStepStatus())
  }, [])

  const value = useMemo(
    () => ({
      steps,
      stepStatus,
      StepStatus,
      currentStep,
      totalSteps: steps.length,
      formData,
      updateFormSection,
      updateFormField,
      resetSection,
      setStepStatus,
      markStepCompleted,
      markCurrentStepCompleted,
      goToStep,
      goToNext,
      goToPrevious,
      resetForm,
    }),
    [
      stepStatus,
      currentStep,
      formData,
      updateFormSection,
      updateFormField,
      resetSection,
      setStepStatus,
      markStepCompleted,
      markCurrentStepCompleted,
      goToStep,
      goToNext,
      goToPrevious,
      resetForm,
    ],
  )

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>
}

export const useFormContext = () => {
  const context = useContext(FormContext)
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider')
  }
  return context
}
