import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export const StepStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
}

const steps = [
  { id: 0, key: 'welcome' },
  { id: 1, key: 'basic' },
  { id: 2, key: 'bpAndLipids' },
  { id: 3, key: 'diabetes' },
  { id: 4, key: 'kidney' },
  { id: 5, key: 'history' },
  { id: 6, key: 'report' },
]

const legacyStepKeyMap = {
  welcome: 'welcome',
  basicInfo: 'basic',
  hypertensionDiabetes: 'bpAndLipids',
  lipids: 'bpAndLipids',
  kidney: 'kidney',
  cardioHistory: 'history',
  report: 'report',
}

const normalizeStepKey = (key) => legacyStepKeyMap[key] ?? key

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
  basic: {
    sex: '',
    birthDate: '',
    heightCm: '',
    weightKg: '',
    waistCm: '',
    currentSmoker: '',
    familyHistoryEarlyChd: '',
  },
  bpAndLipids: {
    usesHypertensionMedication: '',
    systolic: '',
    diastolic: '',
    ldlMgDl: '',
    hdlMgDl: '',
    triglycerideMgDl: '',
    usesTriglycerideMedication: '',
  },
  diabetes: {
    hasDiagnosis: '',
    usesMedication: '',
    fastingGlucoseMgDl: '',
  },
  kidney: {
    hasCkdDiagnosis: '',
    egfr: '',
    uacr: '',
  },
  history: {
    cacScoreCategory: '',
    hasSignificantPlaque: '',
    hasAscvdDiagnosis: '',
    vascularDiseases: {
      cad: false,
      pad: false,
      carotidStenosis: false,
    },
    cadDetails: {
      miWithin1Year: false,
      miHistoryCountTwoOrMore: false,
      hasMultiVesselObstruction: false,
    },
  },
  // legacy structures for backward compatibility (will be removed after rework tickets)
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
      hasCad: '',
      miWithin1Year: '',
      miHistoryCount: '0',
      hasMultivesselObstruction: '',
      hasAcsWithDiabetes: '',
      hasPad: '',
      hasCarotidStenosis: '',
      hasStrokeWithAtherosclerosis: '',
      hasSignificantPlaque: '',
      cacScoreCategory: '',
    },
  },
  report: {
    level: '',
    levelCode: '',
    matchedRules: [],
    riskFactorCount: null,
    riskFactors: [],
    metabolicSyndrome: {
      count: 0,
      components: {},
    },
    recommendations: [],
    evaluatedAt: '',
  },
})

const createInitialStepStatus = () => {
  const statusMap = {}
  steps.forEach((step, index) => {
    statusMap[step.key] = index === 0 ? StepStatus.IN_PROGRESS : StepStatus.PENDING
  })
  return statusMap
}

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

const calculateAgeInYears = (birthDate) => {
  if (!birthDate) return null
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const monthDiff = now.getMonth() - date.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}

const calculateBmi = (heightCm, weightKg) => {
  const height = parseNumber(heightCm)
  const weight = parseNumber(weightKg)
  if (!height || !weight) return null
  const heightMeters = height / 100
  if (heightMeters <= 0) return null
  const bmi = weight / (heightMeters * heightMeters)
  return Number.isFinite(bmi) ? Number.parseFloat(bmi.toFixed(1)) : null
}

const determineWaistStatus = (sex, waistCm) => {
  const waist = parseNumber(waistCm)
  if (!waist) return { isObese: false, threshold: null }
  const threshold = sex === 'female' ? 80 : sex === 'male' ? 90 : null
  if (threshold === null) {
    return { isObese: false, threshold: null }
  }
  return { isObese: waist >= threshold, threshold }
}

const computeDerivedMetrics = (formData) => {
  const { basic, bpAndLipids } = formData
  const ageYears = calculateAgeInYears(basic.birthDate)
  const bmi = calculateBmi(basic.heightCm, basic.weightKg)
  const waist = determineWaistStatus(basic.sex, basic.waistCm)
  const hdlThreshold = basic.sex === 'female' ? 50 : basic.sex === 'male' ? 40 : null
  const hdlValue = parseNumber(bpAndLipids.hdlMgDl)
  const isHdlLow = hdlThreshold !== null && hdlValue !== null ? hdlValue < hdlThreshold : false

  return {
    ageYears,
    bmi,
    waist,
    hdlThreshold,
    isHdlLow,
  }
}

const stepIndexLookup = (() => {
  const map = new Map()
  steps.forEach((step, index) => {
    map.set(step.key, index)
  })
  Object.entries(legacyStepKeyMap).forEach(([legacyKey, canonicalKey]) => {
    if (map.has(canonicalKey)) {
      map.set(legacyKey, map.get(canonicalKey))
    }
  })
  return map
})()

export const FormProvider = ({ children }) => {
  const [formData, setFormData] = useState(() => createInitialFormData())
  const [currentStep, setCurrentStep] = useState(0)
  const [stepStatus, setStepStatusState] = useState(() => createInitialStepStatus())

  const getAge = useCallback(() => calculateAgeInYears(formData.basic.birthDate), [formData.basic.birthDate])

  const getBmi = useCallback(
    () => calculateBmi(formData.basic.heightCm, formData.basic.weightKg),
    [formData.basic.heightCm, formData.basic.weightKg],
  )

  const getWaistStatus = useCallback(
    () => determineWaistStatus(formData.basic.sex, formData.basic.waistCm),
    [formData.basic.sex, formData.basic.waistCm],
  )

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
    const normalizedKey = normalizeStepKey(stepKey)
    if (!stepKeySet.has(normalizedKey) || !stepStatusValues.has(status)) return

    setStepStatusState((prev) => {
      if (prev[normalizedKey] === status) return prev

      return {
        ...prev,
        [normalizedKey]: status,
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

  const derivedMetrics = useMemo(
    () => computeDerivedMetrics(formData),
    [formData],
  )

  const exposedStepStatus = useMemo(() => {
    const withAliases = { ...stepStatus }
    Object.entries(legacyStepKeyMap).forEach(([legacyKey, canonicalKey]) => {
      if (canonicalKey in stepStatus) {
        withAliases[legacyKey] = stepStatus[canonicalKey]
      }
    })
    return withAliases
  }, [stepStatus])

  const getStepIndex = useCallback(
    (key) => {
      const target = normalizeStepKey(key)
      return stepIndexLookup.has(target) ? stepIndexLookup.get(target) : -1
    },
    [],
  )

  const value = useMemo(
    () => ({
      steps,
      stepStatus: exposedStepStatus,
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
      derivedMetrics,
      normalizeStepKey,
      getStepIndex,
      getAge,
      getBmi,
      getWaistStatus,
    }),
    [
      exposedStepStatus,
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
      derivedMetrics,
      getAge,
      getBmi,
      getWaistStatus,
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
