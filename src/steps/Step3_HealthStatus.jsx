import clsx from 'clsx'
import { useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { ProgressiveCard } from '../components/ui/ProgressiveCard.jsx'
import { useFormContext } from '../context/FormContext.jsx'
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

export const Step3_HealthStatus = () => {
  const {
    formData,
    updateFormField,
    markCurrentStepCompleted,
    goToNext,
    setStepStatus,
    StepStatus,
    stepStatus,
  } = useFormContext()

  const { riskFactors } = formData
  const [errors, setErrors] = useState({})

  const markInProgressIfNeeded = () => {
    if (stepStatus.riskFactors === StepStatus.COMPLETED) {
      setStepStatus('riskFactors', StepStatus.IN_PROGRESS)
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

  const handleHistoryChange = (event) => {
    const { value } = event.target
    updateFormField(['riskFactors', 'cardiovascularHistory', 'hasHistory'], value)
    setErrors((prev) => {
      const next = { ...prev }
      delete next['cardiovascularHistory.hasHistory']
      return next
    })
    markInProgressIfNeeded()
  }

  const handleHistoryNotesChange = (event) => {
    updateFormField(['riskFactors', 'cardiovascularHistory', 'notes'], event.target.value)
    markInProgressIfNeeded()
  }

  const validate = () => {
    const nextErrors = {}

    if (!riskFactors.dyslipidemia.status) {
      nextErrors['dyslipidemia.status'] = '請選擇是否有高脂血症'
    } else if (riskFactors.dyslipidemia.status === 'yes') {
      if (!riskFactors.dyslipidemia.medication) {
        nextErrors['dyslipidemia.medication'] = '請選擇是否服用降血脂藥'
      }
      if (!riskFactors.dyslipidemia.ldlMgDl) {
        nextErrors['dyslipidemia.ldlMgDl'] = '請填寫最近一次 LDL 數值'
      }
      if (!riskFactors.dyslipidemia.hdlMgDl) {
        nextErrors['dyslipidemia.hdlMgDl'] = '請填寫最近一次 HDL 數值'
      }
      if (!riskFactors.dyslipidemia.triglycerideMgDl) {
        nextErrors['dyslipidemia.triglycerideMgDl'] = '請填寫最近一次三酸甘油酯數值'
      }
    }

    if (!riskFactors.cardiovascularHistory.hasHistory) {
      nextErrors['cardiovascularHistory.hasHistory'] = '請回答是否曾發生心血管疾病'
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

  const isReady =
    riskFactors.dyslipidemia.status && riskFactors.cardiovascularHistory.hasHistory

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Step 3</p>
          <h2>血脂與病史</h2>
        </div>
        <p className={styles.lead}>
          請填寫血脂異常的用藥與檢驗數值，並確認是否曾經歷重大心血管事件。
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <ProgressiveCard
          title="高脂血症"
          summary="掌握降血脂藥物使用與最新血脂檢驗值"
          isExpanded
        >
          <div className={styles.section}>
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
                <span className={styles.inlineLabel}>目前有無服用降血脂藥</span>
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
                <span className={styles.inlineLabel}>最近一次低密度脂蛋白 (LDL)</span>
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
                <span className={styles.inlineLabel}>最近一次高密度脂蛋白 (HDL)</span>
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
                <span className={styles.inlineLabel}>最近一次空腹三酸甘油酯 (TG)</span>
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

        <section className={styles.historyCard}>
          <h3>過去是否發生重大心血管疾病</h3>
          <p className={styles.historyHint}>
            包含：心肌梗塞、梗塞性腦中風、暫時性腦缺血或顱頸血管 &ge; 50% 狹窄、周邊動脈
            &ge; 50% 狹窄、冠心症（冠狀動脈 &ge; 50% 狹窄或曾接受支架／氣球擴張）。
          </p>

          <div
            role="radiogroup"
            aria-label="曾發生心血管疾病"
            className={styles.optionRow}
          >
            {STATUS_OPTIONS.slice(0, 3).map((option) => (
              <label key={option.value} className={styles.radioOption}>
                <input
                  type="radio"
                  name="cardio-history"
                  value={option.value}
                  checked={riskFactors.cardiovascularHistory.hasHistory === option.value}
                  onChange={handleHistoryChange}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {errors['cardiovascularHistory.hasHistory'] ? (
            <p className={styles.error}>{errors['cardiovascularHistory.hasHistory']}</p>
          ) : null}

          {riskFactors.cardiovascularHistory.hasHistory === 'yes' ? (
            <label className={styles.notesField}>
              <span className={styles.inlineLabel}>可補充事件年份或治療方式（選填）</span>
              <textarea
                rows={3}
                value={riskFactors.cardiovascularHistory.notes}
                onChange={handleHistoryNotesChange}
                placeholder="例如：2022 年心肌梗塞，已置放冠狀動脈支架"
              />
            </label>
          ) : null}
        </section>

        <div className={styles.actions}>
          <Button type="submit" disabled={!isReady}>
            下一步：風險報告
          </Button>
        </div>
      </form>
    </section>
  )
}
