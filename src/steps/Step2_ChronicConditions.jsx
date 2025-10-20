import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { InstantResult } from '../components/ui/InstantResult.jsx'
import { ProgressiveCard } from '../components/ui/ProgressiveCard.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { calculateEGFR } from '../utils/calculations.js'
import styles from './Step2_ChronicConditions.module.css'

const STATUS_OPTIONS = [
  { value: 'yes', label: '有' },
  { value: 'no', label: '無' },
  { value: 'unknown', label: '不知道' },
]

const YES_NO_OPTIONS = [
  { value: 'yes', label: '有' },
  { value: 'no', label: '無' },
]

export const Step2_ChronicConditions = () => {
  const {
    formData,
    updateFormField,
    markCurrentStepCompleted,
    goToNext,
    setStepStatus,
    StepStatus,
    stepStatus,
  } = useFormContext()

  const { basicInfo, conditions } = formData
  const [errors, setErrors] = useState({})

  const markInProgress = () => {
    if (stepStatus.conditions === StepStatus.COMPLETED) {
      setStepStatus('conditions', StepStatus.IN_PROGRESS)
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
  }, [conditions.hypertension.status, updateFormField])

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
  }, [conditions.diabetes.status, updateFormField])

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
  }, [conditions.kidney.status, updateFormField])

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

  const isPrimaryFieldsFilled =
    conditions.hypertension.status &&
    conditions.diabetes.status &&
    conditions.kidney.status

  const egfrDisplay = Number.isFinite(eGFRResult.egfrBsaAdjusted)
    ? `${Math.round(eGFRResult.egfrBsaAdjusted)} ml/min/1.73m²`
    : '--'

  const egfrDescription = (() => {
    if (!conditions.kidney.serumCreatinineMgDl) {
      return '請填寫肌酸酐數值以估算腎絲球過濾率'
    }
    if (!Number.isFinite(eGFRResult.egfrBsaAdjusted)) {
      return '請確認已填寫年齡、身高、體重與正確的肌酸酐數值'
    }
    if (eGFRResult.egfrBsaAdjusted >= 90) return '腎功能正常'
    if (eGFRResult.egfrBsaAdjusted >= 60) return '腎功能輕度下降，請定期追蹤'
    if (eGFRResult.egfrBsaAdjusted >= 30) return '腎功能中度下降，建議諮詢腎臟專科'
    return '腎功能顯著下降，請儘速就醫評估'
  })()

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Step 2</p>
          <h2>慢性疾病狀態</h2>
        </div>
        <p className={styles.lead}>
          請確認高血壓、糖尿病與腎臟病的狀態，我們會依據最新檢驗數據進行風險評估。
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
              <div role="radiogroup" aria-label="高血壓狀態" className={styles.optionRow}>
                {STATUS_OPTIONS.map((option) => (
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
                    {YES_NO_OPTIONS.map((option) => (
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
              <div role="radiogroup" aria-label="糖尿病狀態" className={styles.optionRow}>
                {STATUS_OPTIONS.map((option) => (
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
                    {YES_NO_OPTIONS.map((option) => (
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

          <ProgressiveCard
            title="腎臟病"
            summary="提供肌酸酐數值以評估腎絲球過濾率"
            isExpanded
          >
            <div className={styles.section}>
              <div role="radiogroup" aria-label="腎臟病狀態" className={styles.optionRow}>
                {STATUS_OPTIONS.map((option) => (
                  <label key={option.value} className={styles.radioOption}>
                    <input
                      type="radio"
                      name="kidney-status"
                      value={option.value}
                      checked={conditions.kidney.status === option.value}
                      onChange={handleStatusChange('kidney')}
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
                      onChange={handleFieldChange('kidney', 'serumCreatinineMgDl')}
                      disabled={conditions.kidney.status !== 'yes'}
                    />
                    <span className={styles.unit}>mg/dL</span>
                  </div>
                </label>
                {errors['kidney.serumCreatinineMgDl'] ? (
                  <p className={styles.error}>{errors['kidney.serumCreatinineMgDl']}</p>
                ) : null}

                <InstantResult
                  label="自動換算 eGFR"
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
          <Button type="submit" disabled={!isPrimaryFieldsFilled}>
            下一步：血脂與病史
          </Button>
        </div>
      </form>
    </section>
  )
}
