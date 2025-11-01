import { useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import styles from './Step3_KidneyFunction.module.css'

const parseNonNegativeNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export const Step3_KidneyFunction = () => {
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
  const copy = dictionary.kidneyStep ?? dictionary.kidney ?? {}

  const kidney = formData.kidney
  const [errors, setErrors] = useState({})

  const markInProgressIfNeeded = () => {
    if (stepStatus.kidney === StepStatus.COMPLETED) {
      setStepStatus('kidney', StepStatus.IN_PROGRESS)
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
    updateFormField(['kidney', 'hasCkdDiagnosis'], value)
    clearError('hasCkdDiagnosis')
    markInProgressIfNeeded()
  }

  const handleInputChange = (field) => (event) => {
    updateFormField(['kidney', field], event.target.value)
    clearError(field)
    markInProgressIfNeeded()
  }

  const validate = () => {
    const nextErrors = {}

    if (!kidney.hasCkdDiagnosis) {
      nextErrors.hasCkdDiagnosis = copy.errors?.hasCkdDiagnosis ?? '請選擇是否被診斷 CKD'
    }

    if (kidney.egfr !== '' && parseNonNegativeNumber(kidney.egfr) === null) {
      nextErrors.egfr = copy.errors?.egfr ?? '請輸入有效的 eGFR 數值'
    }

    if (kidney.uacr !== '' && parseNonNegativeNumber(kidney.uacr) === null) {
      nextErrors.uacr = copy.errors?.uacr ?? '請輸入有效的 UACR 數值'
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

  const stepIndex = getStepIndex('kidney')
  const stepLabel = stepIndex >= 0 ? `Step ${stepIndex + 1}` : ''
  const nextStepKey = steps[stepIndex + 1]?.key
  const nextStepLabel = nextStepKey ? dictionary.steps[nextStepKey] ?? '' : ''
  const stepTitle = copy.title ?? dictionary.steps.kidney ?? '腎臟功能'

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{stepTitle}</h2>
        </div>
        <p className={styles.lead}>
          {copy.lead ??
            '透過兩個問題確認是否被診斷慢性腎臟病，並可選填近期檢驗數據供後端使用。'}
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section className={styles.fieldset}>
          <h3 className={styles.sectionTitle}>{copy.sections?.diagnosis ?? '腎臟病診斷'}</h3>
          <p className={styles.description}>
            {copy.descriptions?.diagnosis ?? '請確認是否曾被醫師診斷為慢性腎臟病 (CKD)。'}
          </p>
          <div
            className={styles.optionGroup}
            role="radiogroup"
            aria-label={copy.questions?.diagnosis ?? '您是否曾被醫師診斷為慢性腎臟病 (CKD)？'}
          >
            {['yes', 'no'].map((value) => (
              <label key={value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="hasCkdDiagnosis"
                  value={value}
                  checked={kidney.hasCkdDiagnosis === value}
                  onChange={handleDiagnosisChange}
                  className={styles.radioInput}
                />
                <span>{copy.options?.[value] ?? general[value] ?? value}</span>
              </label>
            ))}
          </div>
          {errors.hasCkdDiagnosis ? <p className={styles.error}>{errors.hasCkdDiagnosis}</p> : null}
        </section>

        <section className={styles.fieldset}>
          <h3 className={styles.sectionTitle}>{copy.sections?.labs ?? '腎功能檢驗 (選填)'}</h3>
          <p className={styles.description}>
            {copy.descriptions?.labs ?? '若手邊有近期的 eGFR 或 UACR 結果，可一併提供。'}
          </p>

          <label className={styles.inputGroup} htmlFor="egfr">
            <span className={styles.label}>
              {copy.labels?.egfr ?? '估計腎絲球過濾率 (eGFR)'}
            </span>
            <div className={styles.inlineInput}>
              <input
                id="egfr"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={kidney.egfr}
                onChange={handleInputChange('egfr')}
                className={styles.input}
                placeholder={copy.placeholders?.egfr ?? 'mL/min/1.73m²'}
              />
              <span className={styles.unit}>{copy.units?.egfr ?? 'mL/min/1.73m²'}</span>
            </div>
          </label>
          {errors.egfr ? <p className={styles.error}>{errors.egfr}</p> : null}

          <label className={styles.inputGroup} htmlFor="uacr">
            <span className={styles.label}>
              {copy.labels?.uacr ?? '尿白蛋白/肌酸酐比值 (UACR)'}
            </span>
            <div className={styles.inlineInput}>
              <input
                id="uacr"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={kidney.uacr}
                onChange={handleInputChange('uacr')}
                className={styles.input}
                placeholder={copy.placeholders?.uacr ?? 'mg/g'}
              />
              <span className={styles.unit}>{copy.units?.uacr ?? 'mg/g'}</span>
            </div>
          </label>
          {errors.uacr ? <p className={styles.error}>{errors.uacr}</p> : null}
        </section>

        <div className={styles.actions}>
          <Button type="submit" variant="primary">
            {copy.buttonNext ?? `下一步：${nextStepLabel}`}
          </Button>
        </div>
      </form>
    </section>
  )
}
