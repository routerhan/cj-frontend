import { useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import styles from './Step1_BasicInfo.module.css'

const parsePositiveNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

export const Step1_BasicInfo = () => {
  const {
    formData,
    updateFormField,
    markCurrentStepCompleted,
    goToNext,
    setStepStatus,
    stepStatus,
    StepStatus,
    steps,
    getStepIndex,
    getAge,
    getBmi,
  } = useFormContext()

  const { dictionary } = useLanguage()
  const copy = dictionary.basic ?? dictionary.basicInfo ?? {}
  const general = dictionary.general

  const basic = formData.basic
  const [errors, setErrors] = useState({})

  const sexOptions = Object.entries(copy.sexOptions ?? { male: '男', female: '女' }).map(
    ([value, label]) => ({ value, label }),
  )
  const smokingOptions = [
    { value: 'yes', label: copy.smokingOptions?.yes ?? general.yes },
    { value: 'no', label: copy.smokingOptions?.no ?? general.no },
  ]
  const familyHistoryOptions = [
    { value: 'yes', label: general.yes },
    { value: 'no', label: general.no },
  ]

  const markStepInProgressIfNeeded = () => {
    if (stepStatus.basic === StepStatus.COMPLETED || stepStatus.basicInfo === StepStatus.COMPLETED) {
      setStepStatus('basic', StepStatus.IN_PROGRESS)
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

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target
    updateFormField(['basic', field], value)
    clearError(field)
    markStepInProgressIfNeeded()
  }

  const handleSexChange = (event) => {
    const { value } = event.target
    updateFormField(['basic', 'sex'], value)
    clearError('sex')
    markStepInProgressIfNeeded()
  }

  const handleSmokingChange = (event) => {
    const { value } = event.target
    updateFormField(['basic', 'currentSmoker'], value)
    clearError('currentSmoker')
    markStepInProgressIfNeeded()
  }

  const handleFamilyHistoryChange = (event) => {
    const { value } = event.target
    updateFormField(['basic', 'familyHistoryEarlyChd'], value)
    clearError('familyHistoryEarlyChd')
    markStepInProgressIfNeeded()
  }

  const validate = () => {
    const nextErrors = {}
    const ageYears = getAge()
    const bmi = getBmi()

    if (!basic.sex) {
      nextErrors.sex = copy.errors?.sex ?? '請選擇生理性別'
    }

    if (!basic.birthDate) {
      nextErrors.birthDate = copy.errors?.birthDate ?? '請輸入出生年月日'
    } else if (ageYears === null) {
      nextErrors.birthDate = copy.errors?.birthDateFuture ?? '請確認日期格式是否正確'
    }

    const height = parsePositiveNumber(basic.heightCm)
    const weight = parsePositiveNumber(basic.weightKg)
    const waistValue = parsePositiveNumber(basic.waistCm)

    if (height === null) {
      nextErrors.heightCm = copy.errors?.height ?? '請輸入身高'
    }
    if (weight === null) {
      nextErrors.weightKg = copy.errors?.weight ?? '請輸入體重'
    }
    if (height !== null && weight !== null && bmi === null) {
      nextErrors.weightKg = copy.errors?.bmi ?? '請確認身高與體重數值是否正確'
    }
    if (waistValue === null) {
      nextErrors.waistCm = copy.errors?.waist ?? '請輸入腰圍'
    }

    if (!basic.currentSmoker) {
      nextErrors.currentSmoker = copy.errors?.smoking ?? '請選擇是否抽菸'
    }

    if (!basic.familyHistoryEarlyChd) {
      nextErrors.familyHistoryEarlyChd = copy.errors?.familyHistory ?? '請選擇家族史情況'
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

  const stepIndex = getStepIndex('basic')
  const stepLabel = stepIndex >= 0 ? `Step ${stepIndex + 1}` : ''
  const nextStepKey = steps[stepIndex + 1]?.key
  const nextStepLabel = nextStepKey ? dictionary.steps[nextStepKey] ?? '' : ''
  const stepTitle = dictionary.steps.basic ?? dictionary.steps.basicInfo ?? '基本資料'

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{stepTitle}</h2>
        </div>
        <p className={styles.lead}>{copy.lead}</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section className={styles.fieldset}>
          <h3 className={styles.sectionTitle}>{copy.sections?.personal ?? '個人資料'}</h3>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <span className={styles.label}>{copy.fields?.sex ?? '生理性別'}</span>
              <div className={styles.optionGroup} role="radiogroup" aria-label={copy.fields?.sex ?? '生理性別'}>
                {sexOptions.map((option) => (
                  <label key={option.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="sex"
                      value={option.value}
                      checked={basic.sex === option.value}
                      onChange={handleSexChange}
                      className={styles.radioInput}
                      aria-invalid={Boolean(errors.sex)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.sex ? <p className={styles.error}>{errors.sex}</p> : null}
            </div>

            <label className={styles.field} htmlFor="birthDate">
              <span className={styles.label}>{copy.fields?.birthDate ?? '出生年月日'}</span>
              <input
                id="birthDate"
                type="date"
                value={basic.birthDate}
                onChange={handleFieldChange('birthDate')}
                className={styles.input}
                aria-invalid={Boolean(errors.birthDate)}
              />
              {errors.birthDate ? <p className={styles.error}>{errors.birthDate}</p> : null}
            </label>
          </div>
        </section>

        <section className={styles.fieldset}>
          <h3 className={styles.sectionTitle}>{copy.sections?.measurements ?? '身體測量'}</h3>
          <div className={styles.fieldGrid}>
            <label className={styles.field} htmlFor="heightCm">
              <span className={styles.label}>{copy.fields?.height ?? '身高 (cm)'}</span>
              <input
                id="heightCm"
                type="number"
                inputMode="decimal"
                min="0"
                value={basic.heightCm}
                onChange={handleFieldChange('heightCm')}
                className={styles.input}
                aria-invalid={Boolean(errors.heightCm)}
              />
              {errors.heightCm ? <p className={styles.error}>{errors.heightCm}</p> : null}
            </label>

            <label className={styles.field} htmlFor="weightKg">
              <span className={styles.label}>{copy.fields?.weight ?? '體重 (kg)'}</span>
              <input
                id="weightKg"
                type="number"
                inputMode="decimal"
                min="0"
                value={basic.weightKg}
                onChange={handleFieldChange('weightKg')}
                className={styles.input}
                aria-invalid={Boolean(errors.weightKg)}
              />
              {errors.weightKg ? <p className={styles.error}>{errors.weightKg}</p> : null}
            </label>

            <label className={styles.field} htmlFor="waistCm">
              <span className={styles.label}>{copy.fields?.waist ?? '腰圍 (cm)'}</span>
              <input
                id="waistCm"
                type="number"
                inputMode="decimal"
                min="0"
                value={basic.waistCm}
                onChange={handleFieldChange('waistCm')}
                className={styles.input}
                aria-invalid={Boolean(errors.waistCm)}
              />
              {errors.waistCm ? <p className={styles.error}>{errors.waistCm}</p> : null}
            </label>
          </div>
        </section>

        <section className={styles.fieldset}>
          <h3 className={styles.sectionTitle}>{copy.sections?.lifestyle ?? '生活習慣與家族史'}</h3>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <span className={styles.label}>{copy.fields?.smoking ?? '目前是否抽菸'}</span>
              <div className={styles.optionGroup} role="radiogroup" aria-label={copy.fields?.smoking ?? '目前是否抽菸'}>
                {smokingOptions.map((option) => (
                  <label key={option.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="currentSmoker"
                      value={option.value}
                      checked={basic.currentSmoker === option.value}
                      onChange={handleSmokingChange}
                      className={styles.radioInput}
                      aria-invalid={Boolean(errors.currentSmoker)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.currentSmoker ? <p className={styles.error}>{errors.currentSmoker}</p> : null}
            </div>

            <div className={styles.field}>
              <span className={styles.label}>
                {copy.fields?.familyHistory ?? '早發性冠心病家族史'}
              </span>
              <div className={styles.optionGroup} role="radiogroup" aria-label={copy.fields?.familyHistory ?? '早發性冠心病家族史'}>
                {familyHistoryOptions.map((option) => (
                  <label key={option.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="familyHistoryEarlyChd"
                      value={option.value}
                      checked={basic.familyHistoryEarlyChd === option.value}
                      onChange={handleFamilyHistoryChange}
                      className={styles.radioInput}
                      aria-invalid={Boolean(errors.familyHistoryEarlyChd)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <p className={styles.hint}>{copy.familyHistoryHint ?? ''}</p>
              {errors.familyHistoryEarlyChd ? (
                <p className={styles.error}>{errors.familyHistoryEarlyChd}</p>
              ) : null}
            </div>
          </div>
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
