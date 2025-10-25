import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { InstantResult } from '../components/ui/InstantResult.jsx'
import { Tooltip } from '../components/ui/Tooltip.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { calculateAge, calculateBMI, getBMICategory } from '../utils/calculations.js'
import styles from './Step1_BasicInfo.module.css'

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
  } = useFormContext()

  const { dictionary } = useLanguage()
  const copy = dictionary.basicInfo
  const general = dictionary.general

  const genderOptions = Object.entries(copy.genderOptions).map(([value, label]) => ({
    value,
    label,
  }))

  const smokingOptions = [
    { value: 'yes', label: copy.smokingOptions?.yes ?? general.yes },
    { value: 'no', label: copy.smokingOptions?.no ?? general.no },
    { value: 'quit', label: copy.smokingOptions?.quit ?? general.quit },
  ]

  const familyHistoryOptions = [
    { value: 'yes', label: general.yes },
    { value: 'no', label: general.no },
    { value: 'unknown', label: general.unknown },
  ]

  const { basicInfo } = formData
  const [errors, setErrors] = useState({})

  const age = useMemo(() => calculateAge(basicInfo.birthDate), [basicInfo.birthDate])
  const bmi = useMemo(
    () => calculateBMI(basicInfo.heightCm, basicInfo.weightKg),
    [basicInfo.heightCm, basicInfo.weightKg],
  )
  const bmiCategory = useMemo(() => getBMICategory(bmi), [bmi])

  useEffect(() => {
    const normalizedAge = Number.isFinite(age) ? age : null
    if ((basicInfo.ageYears ?? null) !== (normalizedAge ?? null)) {
      updateFormField(['basicInfo', 'ageYears'], normalizedAge)
    }
  }, [age, basicInfo.ageYears, updateFormField])

  useEffect(() => {
    const normalizedBMI = Number.isFinite(bmi) ? bmi : null
    if ((basicInfo.bmi ?? null) !== (normalizedBMI ?? null)) {
      updateFormField(['basicInfo', 'bmi'], normalizedBMI)
    }
  }, [bmi, basicInfo.bmi, updateFormField])

  useEffect(() => {
    if ((basicInfo.bmiCategory ?? '') !== (bmiCategory ?? '')) {
      updateFormField(['basicInfo', 'bmiCategory'], bmiCategory)
    }
  }, [bmiCategory, basicInfo.bmiCategory, updateFormField])

  const markStepInProgressIfNeeded = () => {
    if (stepStatus.basicInfo === StepStatus.COMPLETED) {
      setStepStatus('basicInfo', StepStatus.IN_PROGRESS)
    }
  }

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target
    updateFormField(['basicInfo', field], value)
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
    markStepInProgressIfNeeded()
  }

  const handleGenderChange = (event) => {
    const { value } = event.target
    updateFormField(['basicInfo', 'gender'], value)
    if (value !== 'other' && basicInfo.genderOther) {
      updateFormField(['basicInfo', 'genderOther'], '')
    }
    setErrors((prev) => {
      const next = { ...prev }
      delete next.gender
      delete next.genderOther
      return next
    })
    markStepInProgressIfNeeded()
  }

  const validate = () => {
    const nextErrors = {}

    if (!basicInfo.gender) {
      nextErrors.gender = copy.errors.gender
    } else if (basicInfo.gender === 'other' && !basicInfo.genderOther) {
      nextErrors.genderOther = copy.errors.genderOther
    }

    if (!basicInfo.birthDate) {
      nextErrors.birthDate = copy.errors.birthDate
    } else if (age === null) {
      nextErrors.birthDate = copy.errors.birthDateFuture
    }

    const hasHeightValue = basicInfo.heightCm !== ''
    const hasWeightValue = basicInfo.weightKg !== ''

    if (!hasHeightValue) {
      nextErrors.heightCm = copy.errors.height
    }
    if (!hasWeightValue) {
      nextErrors.weightKg = copy.errors.weight
    }
    if (hasHeightValue && hasWeightValue && bmi === null) {
      nextErrors.weightKg = copy.errors.bmi
    }

    if (!basicInfo.smokingStatus) {
      nextErrors.smokingStatus = copy.errors.smoking
    }

    if (!basicInfo.familyHistory) {
      nextErrors.familyHistory = copy.errors.familyHistory
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

  const ageDisplay = Number.isFinite(age) ? `${age} ${general.yearsOldSuffix}` : '--'
  const bmiDisplay = Number.isFinite(bmi) ? bmi.toFixed(1) : '--'
  const bmiDescription = (() => {
    if (!basicInfo.heightCm || !basicInfo.weightKg) return copy.instant.bmiMissing
    if (!Number.isFinite(bmi)) return copy.instant.bmiInvalid
    const suggestion = copy.instant.bmiSuggestions[bmiCategory] ?? copy.instant.bmiDefault
    const label = copy.instant.bmiLabels[bmiCategory]
    return label ? `${label} · ${suggestion}` : suggestion
  })()

  const ageDescription = (() => {
    if (!basicInfo.birthDate) return copy.instant.ageDesc
    if (!Number.isFinite(age)) return copy.instant.ageInvalid
    return copy.instant.ageDesc
  })()

  const currentStepIndex = steps.findIndex((step) => step.key === 'basicInfo')
  const stepLabel = `Step ${currentStepIndex + 1}`
  const nextStepKey = steps[currentStepIndex + 1]?.key
  const nextStepLabel = nextStepKey ? dictionary.steps[nextStepKey] : ''

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{dictionary.steps.basicInfo}</h2>
        </div>
        <p className={styles.lead}>{copy.lead}</p>
      </header>

      <div className={styles.body}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <section className={styles.fieldset}>
            <h3 className={styles.sectionTitle}>{copy.sections.personal}</h3>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <span className={styles.label}>{copy.fields.gender}</span>
                <div className={styles.optionGroup} role="radiogroup" aria-label={copy.fields.gender}>
                  {genderOptions.map((option) => (
                    <label key={option.value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={basicInfo.gender === option.value}
                        onChange={handleGenderChange}
                        className={styles.radioInput}
                        aria-invalid={Boolean(errors.gender)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {basicInfo.gender === 'other' ? (
                  <input
                    type="text"
                    className={styles.input}
                    placeholder={copy.fields.genderOtherPlaceholder}
                    value={basicInfo.genderOther}
                    onChange={handleFieldChange('genderOther')}
                    aria-invalid={Boolean(errors.genderOther)}
                  />
                ) : null}
                {errors.gender ? <p className={styles.error}>{errors.gender}</p> : null}
                {errors.genderOther ? <p className={styles.error}>{errors.genderOther}</p> : null}
              </div>

              <label className={styles.field} htmlFor="birthDate">
                <span className={styles.label}>{copy.fields.birthDate}</span>
                <input
                  id="birthDate"
                  type="date"
                  value={basicInfo.birthDate}
                  onChange={handleFieldChange('birthDate')}
                  className={styles.input}
                  aria-invalid={Boolean(errors.birthDate)}
                />
                {errors.birthDate ? <p className={styles.error}>{errors.birthDate}</p> : null}
              </label>

              <label className={styles.field} htmlFor="nationality">
                <span className={styles.label}>{copy.fields.nationality}</span>
                <input
                  id="nationality"
                  type="text"
                  placeholder=""
                  value={basicInfo.nationality}
                  onChange={handleFieldChange('nationality')}
                  className={styles.input}
                />
              </label>
            </div>
          </section>

          <section className={styles.fieldset}>
            <h3 className={styles.sectionTitle}>{copy.sections.measurements}</h3>
            <div className={styles.fieldGrid}>
              <label className={styles.field} htmlFor="heightCm">
                <span className={styles.label}>{copy.fields.height}</span>
                <input
                  id="heightCm"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={basicInfo.heightCm}
                  onChange={handleFieldChange('heightCm')}
                  className={styles.input}
                  aria-invalid={Boolean(errors.heightCm)}
                />
                {errors.heightCm ? <p className={styles.error}>{errors.heightCm}</p> : null}
              </label>

              <label className={styles.field} htmlFor="weightKg">
                <span className={styles.label}>{copy.fields.weight}</span>
                <input
                  id="weightKg"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={basicInfo.weightKg}
                  onChange={handleFieldChange('weightKg')}
                  className={styles.input}
                  aria-invalid={Boolean(errors.weightKg)}
                />
                {errors.weightKg ? <p className={styles.error}>{errors.weightKg}</p> : null}
              </label>

              <label className={styles.field} htmlFor="waistCm">
                <span className={styles.label}>{copy.fields.waist}</span>
                <input
                  id="waistCm"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={basicInfo.waistCm}
                  onChange={handleFieldChange('waistCm')}
                  className={styles.input}
                />
              </label>
            </div>
          </section>

          <section className={styles.fieldset}>
            <h3 className={styles.sectionTitle}>{copy.sections.lifestyle}</h3>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <span className={styles.label}>{copy.fields.smoking}</span>
                <div className={styles.optionGroup} role="radiogroup" aria-label={copy.fields.smoking}>
                  {smokingOptions.map((option) => (
                    <label key={option.value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="smokingStatus"
                        value={option.value}
                        checked={basicInfo.smokingStatus === option.value}
                        onChange={handleFieldChange('smokingStatus')}
                        className={styles.radioInput}
                        aria-invalid={Boolean(errors.smokingStatus)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.smokingStatus ? (
                  <p className={styles.error}>{errors.smokingStatus}</p>
                ) : null}
              </div>

              <div className={styles.field}>
                <span className={styles.labelWithTooltip}>
                  {copy.fields.familyHistory}
                  <Tooltip
                    label={copy.familyHistoryHint}
                    triggerLabel={copy.tooltips.family}
                  />
                </span>
                <div className={styles.optionGroup} role="radiogroup" aria-label="家族史">
                  {familyHistoryOptions.map((option) => (
                    <label key={option.value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="familyHistory"
                        value={option.value}
                        checked={basicInfo.familyHistory === option.value}
                        onChange={handleFieldChange('familyHistory')}
                        className={styles.radioInput}
                        aria-invalid={Boolean(errors.familyHistory)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.familyHistory ? (
                  <p className={styles.error}>{errors.familyHistory}</p>
                ) : null}
              </div>
            </div>
          </section>

          <div className={styles.actions}>
            <Button type="submit">
              {nextStepLabel ? `下一步：${nextStepLabel}` : copy.buttonNext ?? '下一步'}
            </Button>
          </div>
        </form>

        <aside className={styles.results}>
          <InstantResult label={copy.instant.age} value={ageDisplay} description={ageDescription} />
          <InstantResult label={copy.instant.bmi} value={bmiDisplay} description={bmiDescription} />
        </aside>
      </div>
    </section>
  )
}
