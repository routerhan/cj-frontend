import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { ProgressiveCard } from '../components/ui/ProgressiveCard.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import styles from './Step3_HealthStatus.module.css'

const STATUS_OPTIONS = [
  { value: 'yes', label: '有' },
  { value: 'no', label: '無' },
  { value: 'unknown', label: '不知道' },
]

const YES_NO_OPTIONS = [
  { value: 'yes', label: '有' },
  { value: 'no', label: '無' },
]

export const Step4_LipidProfile = () => {
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
  const copy = dictionary.riskFactors
  const stepCopy = dictionary.lipidsStep ?? {}

  const { riskFactors } = formData
  const [errors, setErrors] = useState({})

  const markInProgressIfNeeded = () => {
    if (stepStatus.lipids === StepStatus.COMPLETED) {
      setStepStatus('lipids', StepStatus.IN_PROGRESS)
    }
  }

  const handleLipidsStatusChange = (event) => {
    const { value } = event.target
    updateFormField(['riskFactors', 'dyslipidemia', 'status'], value)
    if (value === 'no') {
      updateFormField(['riskFactors', 'dyslipidemia'], {
        status: 'no',
        medication: '',
        ldlMgDl: '',
        hdlMgDl: '',
        triglycerideMgDl: '',
      })
    }
    setErrors((prev) => {
      const next = { ...prev }
      delete next['dyslipidemia.status']
      return next
    })
    markInProgressIfNeeded()
  }

  const handleLipidsField = (field) => (event) => {
    const { value } = event.target
    updateFormField(['riskFactors', 'dyslipidemia', field], value)
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`dyslipidemia.${field}`]
      return next
    })
    markInProgressIfNeeded()
  }

  const validate = () => {
    const nextErrors = {}

    if (!riskFactors.dyslipidemia.status) {
      nextErrors['dyslipidemia.status'] = copy.errors.status
    } else if (riskFactors.dyslipidemia.status === 'yes') {
      if (!riskFactors.dyslipidemia.medication) {
        nextErrors['dyslipidemia.medication'] = copy.errors.medication
      }
      if (!riskFactors.dyslipidemia.ldlMgDl) {
        nextErrors['dyslipidemia.ldlMgDl'] = copy.errors.ldl
      }
      if (!riskFactors.dyslipidemia.hdlMgDl) {
        nextErrors['dyslipidemia.hdlMgDl'] = copy.errors.hdl
      }
      if (!riskFactors.dyslipidemia.triglycerideMgDl) {
        nextErrors['dyslipidemia.triglycerideMgDl'] = copy.errors.tg
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

  const currentStepIndex = steps.findIndex((step) => step.key === 'lipids')
  const stepLabel = `Step ${currentStepIndex + 1}`
  const nextStepKey = steps[currentStepIndex + 1]?.key
  const nextStepLabel = nextStepKey ? dictionary.steps[nextStepKey] : ''

  const isReady = useMemo(() => {
    if (!riskFactors.dyslipidemia.status) return false
    if (riskFactors.dyslipidemia.status !== 'yes') return true
    return (
      riskFactors.dyslipidemia.medication &&
      riskFactors.dyslipidemia.ldlMgDl &&
      riskFactors.dyslipidemia.hdlMgDl &&
      riskFactors.dyslipidemia.triglycerideMgDl
    )
  }, [riskFactors.dyslipidemia])

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{stepCopy.title ?? '血脂檢驗資訊'}</h2>
        </div>
        <p className={styles.lead}>
          {stepCopy.lead ??
            '請填寫血脂異常的用藥與檢驗數值，協助我們評估膽固醇相關的心血管危險。'}
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <ProgressiveCard
          title={copy.dyslipidemiaTitle}
          summary="掌握降血脂藥物使用與最新血脂檢驗值"
          isExpanded
        >
          <div className={styles.section}>
            <label className={styles.fieldLabel}>{copy.dyslipidemiaTitle}</label>
            <div role="radiogroup" aria-label="高脂血症狀態" className={styles.optionRow}>
              {STATUS_OPTIONS.map((option) => (
                <label key={option.value} className={styles.radioOption}>
                  <input
                    type="radio"
                    name="dyslipidemia-status"
                    value={option.value}
                    checked={riskFactors.dyslipidemia.status === option.value}
                    onChange={handleLipidsStatusChange}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors['dyslipidemia.status'] ? (
              <p className={styles.error}>{errors['dyslipidemia.status']}</p>
            ) : null}

            <div
              className={clsx(styles.cardGrid, {
                [styles.disabled]: riskFactors.dyslipidemia.status !== 'yes',
              })}
              aria-disabled={riskFactors.dyslipidemia.status !== 'yes'}
            >
              <div className={styles.inlineGroup}>
                <span className={styles.inlineLabel}>{copy.meds}</span>
                <div role="radiogroup" aria-label="降血脂藥" className={styles.optionRow}>
                  {YES_NO_OPTIONS.map((option) => (
                    <label key={option.value} className={styles.radioOption}>
                      <input
                        type="radio"
                        name="dyslipidemia-medication"
                        value={option.value}
                        checked={riskFactors.dyslipidemia.medication === option.value}
                        onChange={handleLipidsField('medication')}
                        disabled={riskFactors.dyslipidemia.status !== 'yes'}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors['dyslipidemia.medication'] ? (
                  <p className={styles.error}>{errors['dyslipidemia.medication']}</p>
                ) : null}
              </div>

              <label className={styles.inlineGroup}>
                <span className={styles.inlineLabel}>{copy.fields.ldl}</span>
                <div className={styles.inlineInput}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={riskFactors.dyslipidemia.ldlMgDl}
                    onChange={handleLipidsField('ldlMgDl')}
                    disabled={riskFactors.dyslipidemia.status !== 'yes'}
                    placeholder="mg/dL"
                  />
                  <span className={styles.unit}>mg/dL</span>
                </div>
                {errors['dyslipidemia.ldlMgDl'] ? (
                  <p className={styles.error}>{errors['dyslipidemia.ldlMgDl']}</p>
                ) : null}
              </label>

              <label className={styles.inlineGroup}>
                <span className={styles.inlineLabel}>{copy.fields.hdl}</span>
                <div className={styles.inlineInput}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={riskFactors.dyslipidemia.hdlMgDl}
                    onChange={handleLipidsField('hdlMgDl')}
                    disabled={riskFactors.dyslipidemia.status !== 'yes'}
                    placeholder="mg/dL"
                  />
                  <span className={styles.unit}>mg/dL</span>
                </div>
                {errors['dyslipidemia.hdlMgDl'] ? (
                  <p className={styles.error}>{errors['dyslipidemia.hdlMgDl']}</p>
                ) : null}
              </label>

              <label className={styles.inlineGroup}>
                <span className={styles.inlineLabel}>{copy.fields.tg}</span>
                <div className={styles.inlineInput}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={riskFactors.dyslipidemia.triglycerideMgDl}
                    onChange={handleLipidsField('triglycerideMgDl')}
                    disabled={riskFactors.dyslipidemia.status !== 'yes'}
                    placeholder="mg/dL"
                  />
                  <span className={styles.unit}>mg/dL</span>
                </div>
                {errors['dyslipidemia.triglycerideMgDl'] ? (
                  <p className={styles.error}>{errors['dyslipidemia.triglycerideMgDl']}</p>
                ) : null}
              </label>
            </div>
          </div>
        </ProgressiveCard>

        <div className={styles.actions}>
          <Button type="submit" disabled={!isReady}>
            {nextStepLabel ? `下一步：${nextStepLabel}` : '下一步'}
          </Button>
        </div>
      </form>
    </section>
  )
}
