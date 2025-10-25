import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { InstantResult } from '../components/ui/InstantResult.jsx'
import { ProgressiveCard } from '../components/ui/ProgressiveCard.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { calculateEGFR } from '../utils/calculations.js'
import styles from './Step2_ChronicConditions.module.css'

const STATUS_VALUES = ['yes', 'no', 'unknown']

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
  } = useFormContext()

  const { dictionary } = useLanguage()
  const general = dictionary.general
  const copy = dictionary.conditions
  const kidneyCopy = dictionary.kidney ?? {}

  const { basicInfo, conditions } = formData
  const [errors, setErrors] = useState({})

  const statusOptions = STATUS_VALUES.map((value) => ({
    value,
    label:
      value === 'unknown'
        ? general.unknown
        : value === 'yes'
        ? general.yes
        : general.no,
  }))

  const markInProgress = () => {
    if (stepStatus.kidney === StepStatus.COMPLETED) {
      setStepStatus('kidney', StepStatus.IN_PROGRESS)
    }
  }

  const handleStatusChange = (event) => {
    const { value } = event.target
    updateFormField(['conditions', 'kidney', 'status'], value)
    setErrors((prev) => {
      const next = { ...prev }
      delete next['kidney.status']
      return next
    })
    markInProgress()
  }

  const handleCreatinineChange = (event) => {
    updateFormField(['conditions', 'kidney', 'serumCreatinineMgDl'], event.target.value)
    setErrors((prev) => {
      const next = { ...prev }
      delete next['kidney.serumCreatinineMgDl']
      delete next['kidney.egfr']
      return next
    })
    markInProgress()
  }

  useEffect(() => {
    if (
      conditions.kidney.status === 'no' &&
      (conditions.kidney.serumCreatinineMgDl || conditions.kidney.egfr !== null)
    ) {
      updateFormField(['conditions', 'kidney'], {
        status: 'no',
        serumCreatinineMgDl: '',
        egfr: null,
      })
    }
  }, [
    conditions.kidney.egfr,
    conditions.kidney.serumCreatinineMgDl,
    conditions.kidney.status,
    updateFormField,
  ])

  const eGFRResult = useMemo(() => {
    if (!conditions.kidney.serumCreatinineMgDl) {
      return { gfr: null, bsa: null, egfrBsaAdjusted: null }
    }

    return calculateEGFR({
      serumCreatinineMgDl: conditions.kidney.serumCreatinineMgDl,
      gender: basicInfo.gender,
      ageYears: basicInfo.ageYears,
      heightCm: basicInfo.heightCm,
      weightKg: basicInfo.weightKg,
    })
  }, [
    conditions.kidney.serumCreatinineMgDl,
    basicInfo.gender,
    basicInfo.ageYears,
    basicInfo.heightCm,
    basicInfo.weightKg,
  ])

  useEffect(() => {
    if (eGFRResult.egfrBsaAdjusted !== conditions.kidney.egfr) {
      updateFormField(['conditions', 'kidney', 'egfr'], eGFRResult.egfrBsaAdjusted)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eGFRResult.egfrBsaAdjusted])

  const validate = () => {
    const nextErrors = {}

    if (!conditions.kidney.status) {
      nextErrors['kidney.status'] = '請選擇是否有腎臟病'
    } else if (conditions.kidney.status === 'yes') {
      if (!conditions.kidney.serumCreatinineMgDl) {
        nextErrors['kidney.serumCreatinineMgDl'] = '請填寫最近一次肌酸酐數值'
      }
      if (
        conditions.kidney.serumCreatinineMgDl &&
        !Number.isFinite(eGFRResult.egfrBsaAdjusted)
      ) {
        nextErrors['kidney.egfr'] = '請確認輸入資料完整以計算 eGFR'
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

  const currentStepIndex = steps.findIndex((step) => step.key === 'kidney')
  const stepLabel = `Step ${currentStepIndex + 1}`
  const nextStepKey = steps[currentStepIndex + 1]?.key
  const nextStepLabel = nextStepKey ? dictionary.steps[nextStepKey] : ''

  const egfrDisplay = Number.isFinite(eGFRResult.egfrBsaAdjusted)
    ? `${Math.round(eGFRResult.egfrBsaAdjusted)} ml/min/1.73m²`
    : '--'

  const egfrDescription = (() => {
    if (!conditions.kidney.serumCreatinineMgDl) {
      return copy.instant.egfrMissing
    }
    if (!Number.isFinite(eGFRResult.egfrBsaAdjusted)) {
      return copy.instant.egfrInvalid
    }
    if (eGFRResult.egfrBsaAdjusted >= 90) return copy.instant.egfrNormal
    if (eGFRResult.egfrBsaAdjusted >= 60) return copy.instant.egfrMild
    if (eGFRResult.egfrBsaAdjusted >= 30) return copy.instant.egfrModerate
    return copy.instant.egfrSevere
  })()

  const isReady =
    conditions.kidney.status &&
    (conditions.kidney.status !== 'yes' ||
      (conditions.kidney.serumCreatinineMgDl &&
        Number.isFinite(eGFRResult.egfrBsaAdjusted)))

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{kidneyCopy.title ?? '腎臟功能'}</h2>
        </div>
        <p className={styles.lead}>
          {kidneyCopy.lead ?? '提供肌酸酐數值以估算腎絲球過濾率（eGFR），協助評估腎臟健康與整體風險。'}
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.cards}>
          <ProgressiveCard
            title="腎臟病"
            summary="提供肌酸酐數值以評估腎絲球過濾率"
            isExpanded
          >
            <div className={styles.section}>
              <label className={styles.fieldLabel}>{copy.titles.kidney}</label>
              <div role="radiogroup" aria-label="腎臟病狀態" className={styles.optionRow}>
                {statusOptions.map((option) => (
                  <label key={option.value} className={styles.radioOption}>
                    <input
                      type="radio"
                      name="kidney-status"
                      value={option.value}
                      checked={conditions.kidney.status === option.value}
                      onChange={handleStatusChange}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors['kidney.status'] ? (
                <p className={styles.error}>{errors['kidney.status']}</p>
              ) : null}

              <div
                className={clsx(styles.subSection, {
                  [styles.disabled]: conditions.kidney.status !== 'yes',
                })}
                aria-disabled={conditions.kidney.status !== 'yes'}
              >
                <label className={styles.inlineGroup}>
                  <span className={styles.inlineLabel}>最近一次肌酸酐數值</span>
                  <div className={styles.inlineInput}>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="mg/dL"
                      value={conditions.kidney.serumCreatinineMgDl}
                      onChange={handleCreatinineChange}
                      disabled={conditions.kidney.status !== 'yes'}
                    />
                    <span className={styles.unit}>mg/dL</span>
                  </div>
                </label>
                {errors['kidney.serumCreatinineMgDl'] ? (
                  <p className={styles.error}>{errors['kidney.serumCreatinineMgDl']}</p>
                ) : null}

                <InstantResult
                  label={copy.instant.egfrLabel}
                  value={egfrDisplay}
                  description={egfrDescription}
                />
                {errors['kidney.egfr'] ? (
                  <p className={styles.error}>{errors['kidney.egfr']}</p>
                ) : null}
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
