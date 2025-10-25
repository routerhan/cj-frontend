import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { ProgressiveCard } from '../components/ui/ProgressiveCard.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import styles from './Step2_ChronicConditions.module.css'

const STATUS_VALUES = ['yes', 'no', 'unknown']
const YES_NO_VALUES = ['yes', 'no']

export const Step2_ChronicConditions = () => {
  const {
    formData,
    updateFormField,
    markCurrentStepCompleted,
    goToNext,
    setStepStatus,
    StepStatus,
    stepStatus,
    steps,
  } = useFormContext()

  const { dictionary } = useLanguage()
  const general = dictionary.general
  const stepCopy = dictionary.hypertensionDiabetes ?? {}

  const statusOptions = STATUS_VALUES.map((value) => ({
    value,
    label:
      value === 'unknown'
        ? general.unknown
        : value === 'yes'
        ? general.yes
        : general.no,
  }))

  const yesNoOptions = YES_NO_VALUES.map((value) => ({
    value,
    label: value === 'yes' ? general.yes : general.no,
  }))

  const { conditions } = formData
  const [errors, setErrors] = useState({})

  const markInProgress = () => {
    if (stepStatus.hypertensionDiabetes === StepStatus.COMPLETED) {
      setStepStatus('hypertensionDiabetes', StepStatus.IN_PROGRESS)
    }
  }

  const handleStatusChange = (section) => (event) => {
    const { value } = event.target
    updateFormField(['conditions', section, 'status'], value)
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`${section}.status`]
      return next
    })
    markInProgress()
  }

  const handleFieldChange = (section, field) => (event) => {
    const { value } = event.target
    updateFormField(['conditions', section, field], value)
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`${section}.${field}`]
      return next
    })
    markInProgress()
  }

  useEffect(() => {
    if (
      conditions.hypertension.status === 'no' &&
      (conditions.hypertension.medication ||
        conditions.hypertension.systolic ||
        conditions.hypertension.diastolic)
    ) {
      updateFormField(['conditions', 'hypertension'], {
        status: 'no',
        medication: '',
        systolic: '',
        diastolic: '',
      })
    }
  }, [
    conditions.hypertension.diastolic,
    conditions.hypertension.medication,
    conditions.hypertension.systolic,
    conditions.hypertension.status,
    updateFormField,
  ])

  useEffect(() => {
    if (
      conditions.diabetes.status === 'no' &&
      (conditions.diabetes.medication ||
        conditions.diabetes.fastingGlucoseMgDl ||
        conditions.diabetes.hba1cPercent)
    ) {
      updateFormField(['conditions', 'diabetes'], {
        status: 'no',
        medication: '',
        fastingGlucoseMgDl: '',
        hba1cPercent: '',
      })
    }
  }, [
    conditions.diabetes.fastingGlucoseMgDl,
    conditions.diabetes.hba1cPercent,
    conditions.diabetes.medication,
    conditions.diabetes.status,
    updateFormField,
  ])

  const validate = () => {
    const nextErrors = {}

    if (!conditions.hypertension.status) {
      nextErrors['hypertension.status'] = '請選擇是否有高血壓'
    } else if (conditions.hypertension.status === 'yes') {
      if (!conditions.hypertension.medication) {
        nextErrors['hypertension.medication'] = '請選擇是否服用降血壓藥'
      }
      if (!conditions.hypertension.systolic || !conditions.hypertension.diastolic) {
        nextErrors['hypertension.pressure'] = '請填寫最近一次血壓值'
      }
    }

    if (!conditions.diabetes.status) {
      nextErrors['diabetes.status'] = '請選擇是否有糖尿病'
    } else if (conditions.diabetes.status === 'yes') {
      if (!conditions.diabetes.medication) {
        nextErrors['diabetes.medication'] = '請選擇是否服用降血糖藥'
      }
      if (!conditions.diabetes.fastingGlucoseMgDl) {
        nextErrors['diabetes.fastingGlucoseMgDl'] = '請填寫最近一次空腹血糖值'
      }
      if (!conditions.diabetes.hba1cPercent) {
        nextErrors['diabetes.hba1cPercent'] = '請填寫最近一次糖化血色素值'
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

  const currentStepIndex = steps.findIndex((step) => step.key === 'hypertensionDiabetes')
  const stepLabel = `Step ${currentStepIndex + 1}`
  const nextStepKey = steps[currentStepIndex + 1]?.key
  const nextStepLabel = nextStepKey ? dictionary.steps[nextStepKey] : ''

  const isHypertensionSectionInvalid =
    conditions.hypertension.status === 'yes' &&
    (!conditions.hypertension.medication ||
      !conditions.hypertension.systolic ||
      !conditions.hypertension.diastolic)

  const isDiabetesSectionInvalid =
    conditions.diabetes.status === 'yes' &&
    (!conditions.diabetes.medication ||
      !conditions.diabetes.fastingGlucoseMgDl ||
      !conditions.diabetes.hba1cPercent)

  const isReady =
    conditions.hypertension.status &&
    conditions.diabetes.status &&
    !isHypertensionSectionInvalid &&
    !isDiabetesSectionInvalid

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{stepCopy.title ?? '血壓與血糖監測'}</h2>
        </div>
        <p className={styles.lead}>
          {stepCopy.lead ??
            '請確認高血壓與糖尿病的控制狀態，並提供最新量測與用藥資訊，以利後續風險評估。'}
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.cards}>
          <ProgressiveCard
            title="高血壓（>130/80 mmHg）"
            summary="請填寫目前控制狀況與最近一次量測"
            isExpanded
          >
            <div className={styles.section}>
              <label className={styles.fieldLabel}>
                是否有高血壓？
                <span className={styles.fieldHint}>(&gt;130/80 mmHg)</span>
              </label>
              <div role="radiogroup" aria-label="高血壓狀態" className={styles.optionRow}>
                {statusOptions.map((option) => (
                  <label key={option.value} className={styles.radioOption}>
                    <input
                      type="radio"
                      name="hypertension-status"
                      value={option.value}
                      checked={conditions.hypertension.status === option.value}
                      onChange={handleStatusChange('hypertension')}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors['hypertension.status'] ? (
                <p className={styles.error}>{errors['hypertension.status']}</p>
              ) : null}

              <div
                className={clsx(styles.subSection, {
                  [styles.disabled]: conditions.hypertension.status !== 'yes',
                })}
                aria-disabled={conditions.hypertension.status !== 'yes'}
              >
                <div className={styles.inlineGroup}>
                  <span className={styles.inlineLabel}>目前有無服用降血壓藥</span>
                  <div role="radiogroup" aria-label="降血壓藥" className={styles.optionRow}>
                    {yesNoOptions.map((option) => (
                      <label key={option.value} className={styles.radioOption}>
                        <input
                          type="radio"
                          name="hypertension-medication"
                          value={option.value}
                          checked={conditions.hypertension.medication === option.value}
                          onChange={handleFieldChange('hypertension', 'medication')}
                          disabled={conditions.hypertension.status !== 'yes'}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {errors['hypertension.medication'] ? (
                  <p className={styles.error}>{errors['hypertension.medication']}</p>
                ) : null}

                <div className={styles.inlineGroup}>
                  <span className={styles.inlineLabel}>最近一次血壓值</span>
                  <div className={styles.bloodPressureInputs}>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="收縮壓"
                      value={conditions.hypertension.systolic}
                      onChange={handleFieldChange('hypertension', 'systolic')}
                      disabled={conditions.hypertension.status !== 'yes'}
                    />
                    <span className={styles.unit}>/</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="舒張壓"
                      value={conditions.hypertension.diastolic}
                      onChange={handleFieldChange('hypertension', 'diastolic')}
                      disabled={conditions.hypertension.status !== 'yes'}
                    />
                    <span className={styles.unit}>mmHg</span>
                  </div>
                </div>
                {errors['hypertension.pressure'] ? (
                  <p className={styles.error}>{errors['hypertension.pressure']}</p>
                ) : null}
              </div>
            </div>
          </ProgressiveCard>

          <ProgressiveCard
            title="糖尿病"
            summary="填寫藥物使用與最近一次血糖、糖化血色素"
            isExpanded
          >
            <div className={styles.section}>
              <label className={styles.fieldLabel}>是否有糖尿病？</label>
              <div role="radiogroup" aria-label="糖尿病狀態" className={styles.optionRow}>
                {statusOptions.map((option) => (
                  <label key={option.value} className={styles.radioOption}>
                    <input
                      type="radio"
                      name="diabetes-status"
                      value={option.value}
                      checked={conditions.diabetes.status === option.value}
                      onChange={handleStatusChange('diabetes')}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors['diabetes.status'] ? (
                <p className={styles.error}>{errors['diabetes.status']}</p>
              ) : null}

              <div
                className={clsx(styles.subSection, {
                  [styles.disabled]: conditions.diabetes.status !== 'yes',
                })}
                aria-disabled={conditions.diabetes.status !== 'yes'}
              >
                <div className={styles.inlineGroup}>
                  <span className={styles.inlineLabel}>目前有無服用降血糖藥</span>
                  <div role="radiogroup" aria-label="降血糖藥" className={styles.optionRow}>
                    {yesNoOptions.map((option) => (
                      <label key={option.value} className={styles.radioOption}>
                        <input
                          type="radio"
                          name="diabetes-medication"
                          value={option.value}
                          checked={conditions.diabetes.medication === option.value}
                          onChange={handleFieldChange('diabetes', 'medication')}
                          disabled={conditions.diabetes.status !== 'yes'}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {errors['diabetes.medication'] ? (
                  <p className={styles.error}>{errors['diabetes.medication']}</p>
                ) : null}

                <label className={styles.inlineGroup}>
                  <span className={styles.inlineLabel}>最近一次空腹血糖值</span>
                  <div className={styles.inlineInput}>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="mg/dL"
                      value={conditions.diabetes.fastingGlucoseMgDl}
                      onChange={handleFieldChange('diabetes', 'fastingGlucoseMgDl')}
                      disabled={conditions.diabetes.status !== 'yes'}
                    />
                    <span className={styles.unit}>mg/dL</span>
                  </div>
                  {errors['diabetes.fastingGlucoseMgDl'] ? (
                    <p className={styles.error}>{errors['diabetes.fastingGlucoseMgDl']}</p>
                  ) : null}
                </label>

                <label className={styles.inlineGroup}>
                  <span className={styles.inlineLabel}>最近一次糖化血色素值</span>
                  <div className={styles.inlineInput}>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="%"
                      value={conditions.diabetes.hba1cPercent}
                      onChange={handleFieldChange('diabetes', 'hba1cPercent')}
                      disabled={conditions.diabetes.status !== 'yes'}
                    />
                    <span className={styles.unit}>%</span>
                  </div>
                  {errors['diabetes.hba1cPercent'] ? (
                    <p className={styles.error}>{errors['diabetes.hba1cPercent']}</p>
                  ) : null}
                </label>
              </div>
            </div>
          </ProgressiveCard>
        </div>

        <div className={styles.actions}>
          <Button type="submit" disabled={!isReady}>
            {nextStepLabel ? `下一步：${nextStepLabel}` : '下一步'}
          </Button>
        </div>
      </form>
    </section>
  )
}
