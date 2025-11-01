import { useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import styles from './Step3_Diabetes.module.css'

const parsePositiveNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const YES_NO_OPTIONS = [
  { value: 'yes', labelKey: 'yes' },
  { value: 'no', labelKey: 'no' },
]

export const Step3_Diabetes = () => {
  const {
    formData,
    updateFormField,
    markCurrentStepCompleted,
    goToNext,
    setStepStatus,
    StepStatus,
    stepStatus,
    steps,
    getStepIndex,
  } = useFormContext()

  const { dictionary } = useLanguage()
  const general = dictionary.general
  const copy = dictionary.diabetesStep ?? dictionary.diabetes ?? {}

  const diabetes = formData.diabetes
  const [errors, setErrors] = useState({})

  const markInProgressIfNeeded = () => {
    if (stepStatus.diabetes === StepStatus.COMPLETED) {
      setStepStatus('diabetes', StepStatus.IN_PROGRESS)
    }
  }

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleDiagnosisChange = (event) => {
    const { value } = event.target
    updateFormField(['diabetes', 'hasDiagnosis'], value)
    clearError('hasDiagnosis')

    if (value === 'yes') {
      if (diabetes.usesMedication !== '') {
        updateFormField(['diabetes', 'usesMedication'], '')
      }
      if (diabetes.fastingGlucoseMgDl !== '') {
        updateFormField(['diabetes', 'fastingGlucoseMgDl'], '')
      }
    } else {
      updateFormField(['diabetes', 'usesMedication'], '')
      updateFormField(['diabetes', 'fastingGlucoseMgDl'], '')
    }

    clearError('usesMedication')
    clearError('fastingGlucoseMgDl')
    markInProgressIfNeeded()
  }

  const handleMedicationChange = (event) => {
    const { value } = event.target
    updateFormField(['diabetes', 'usesMedication'], value)
    clearError('usesMedication')
    markInProgressIfNeeded()
  }

  const handleGlucoseChange = (event) => {
    const { value } = event.target
    updateFormField(['diabetes', 'fastingGlucoseMgDl'], value)
    clearError('fastingGlucoseMgDl')
    markInProgressIfNeeded()
  }

  const showMedicationQuestion = diabetes.hasDiagnosis === 'yes'
  const showFastingGlucoseInput = showMedicationQuestion

  const validate = () => {
    const nextErrors = {}
    if (!diabetes.hasDiagnosis) {
      nextErrors.hasDiagnosis = copy.errors?.hasDiagnosis ?? '請選擇是否被診斷糖尿病'
    }

    if (diabetes.hasDiagnosis === 'yes') {
      if (!diabetes.usesMedication) {
        nextErrors.usesMedication = copy.errors?.usesMedication ?? '請選擇是否使用糖尿病藥物'
      }

      if (diabetes.fastingGlucoseMgDl !== '') {
        const parsed = parsePositiveNumber(diabetes.fastingGlucoseMgDl)
        if (parsed === null) {
          nextErrors.fastingGlucoseMgDl =
            copy.errors?.fastingGlucose ?? '請輸入有效的空腹血糖值或留空'
        }
      }
    }

    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      markCurrentStepCompleted()
      goToNext()
    }
  }

  const stepIndex = getStepIndex('diabetes')
  const stepLabel = stepIndex >= 0 ? `Step ${stepIndex + 1}` : ''
  const nextStepKey = steps[stepIndex + 1]?.key
  const nextStepLabel = nextStepKey ? dictionary.steps[nextStepKey] ?? '' : ''
  const stepTitle = dictionary.steps.diabetes ?? '糖尿病'

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{stepTitle}</h2>
        </div>
        <p className={styles.lead}>
          {copy.lead ?? '透過幾個簡單問題確認您的糖尿病狀態與控制情形。'}
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section className={styles.fieldset}>
          <h3 className={styles.sectionTitle}>{copy.sections?.diagnosis ?? '糖尿病診斷'}</h3>
          <p className={styles.description}>
            {copy.descriptions?.diagnosis ?? '選擇「是」時請補充用藥與最近的空腹血糖；選擇「否」可直接前往下一步。'}
          </p>
          <div
            className={styles.optionGroup}
            role="radiogroup"
            aria-label={copy.questions?.diagnosis ?? '您是否曾被醫師診斷患有「糖尿病」？'}
          >
            {YES_NO_OPTIONS.map((option) => (
              <label key={option.value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="hasDiabetesDiagnosis"
                  value={option.value}
                  checked={diabetes.hasDiagnosis === option.value}
                  onChange={handleDiagnosisChange}
                  className={styles.radioInput}
                />
                <span>{copy.options?.[option.value] ?? general[option.labelKey] ?? option.value}</span>
              </label>
            ))}
          </div>
          {errors.hasDiagnosis ? <p className={styles.error}>{errors.hasDiagnosis}</p> : null}
        </section>

        {showMedicationQuestion ? (
          <section className={styles.fieldset}>
            <h3 className={styles.sectionTitle}>{copy.sections?.medication ?? '糖尿病用藥'}</h3>
            <p className={styles.description}>
              {copy.descriptions?.medication ?? '請告知目前是否使用糖尿病藥物。'}
            </p>
            <div
              className={styles.optionGroup}
              role="radiogroup"
              aria-label={copy.questions?.medication ?? '您是否正在使用糖尿病藥物？'}
            >
              {YES_NO_OPTIONS.map((option) => (
                <label key={option.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="usesDiabetesMedication"
                    value={option.value}
                    checked={diabetes.usesMedication === option.value}
                    onChange={handleMedicationChange}
                    className={styles.radioInput}
                  />
                  <span>{copy.options?.[option.value] ?? general[option.labelKey] ?? option.value}</span>
                </label>
              ))}
            </div>
            {errors.usesMedication ? <p className={styles.error}>{errors.usesMedication}</p> : null}
          </section>
        ) : null}

        {showFastingGlucoseInput ? (
          <section className={styles.fieldset}>
            <h3 className={styles.sectionTitle}>{copy.sections?.fastingGlucose ?? '空腹血糖'}</h3>
            <label className={styles.inputGroup} htmlFor="fastingGlucoseMgDl">
              <span className={styles.label}>
                {copy.questions?.fastingGlucose ?? '請輸入您最近的空腹血糖值'}
              </span>
              <div className={styles.inlineInput}>
                <input
                  id="fastingGlucoseMgDl"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={diabetes.fastingGlucoseMgDl}
                  onChange={handleGlucoseChange}
                  className={styles.input}
                  placeholder={copy.placeholders?.fastingGlucose ?? '若不清楚可留空'}
                />
                <span className={styles.unit}>{dictionary.general.unitMgDl}</span>
              </div>
            </label>
            {errors.fastingGlucoseMgDl ? (
              <p className={styles.error}>{errors.fastingGlucoseMgDl}</p>
            ) : null}
          </section>
        ) : null}

        <div className={styles.actions}>
          <Button type="submit" variant="primary">
            {copy.buttonNext ?? `下一步：${nextStepLabel}`}
          </Button>
        </div>
      </form>
    </section>
  )
}
