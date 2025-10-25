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

export const Step5_CardiovascularHistory = () => {
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
  const stepCopy = dictionary.cardioHistoryStep ?? {}

  const { cardiovascularHistory } = formData.riskFactors
  const [errors, setErrors] = useState({})

  const markInProgress = () => {
    if (stepStatus.cardioHistory === StepStatus.COMPLETED) {
      setStepStatus('cardioHistory', StepStatus.IN_PROGRESS)
    }
  }

  const handleHistoryChange = (event) => {
    const { value } = event.target
    updateFormField(['riskFactors', 'cardiovascularHistory', 'hasHistory'], value)
    setErrors((prev) => {
      const next = { ...prev }
      delete next['cardiovascularHistory.hasHistory']
      return next
    })
    markInProgress()
  }

  const handleTextChange = (field) => (event) => {
    updateFormField(['riskFactors', 'cardiovascularHistory', field], event.target.value)
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`cardiovascularHistory.${field}`]
      return next
    })
    markInProgress()
  }

  const handleBooleanChange = (field) => (event) => {
    updateFormField(['riskFactors', 'cardiovascularHistory', field], event.target.value)
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`cardiovascularHistory.${field}`]
      return next
    })
    markInProgress()
  }

  const validate = () => {
    const nextErrors = {}

    if (!cardiovascularHistory.hasHistory) {
      nextErrors['cardiovascularHistory.hasHistory'] = copy.errors.history
    }

    const booleanFields = [
      'hasCad',
      'miWithin1Year',
      'hasMultivesselObstruction',
      'hasAcsWithDiabetes',
      'hasPad',
      'hasCarotidStenosis',
      'hasStrokeWithAtherosclerosis',
      'hasSignificantPlaque',
    ]

    booleanFields.forEach((field) => {
      if (!cardiovascularHistory[field]) {
        nextErrors[`cardiovascularHistory.${field}`] = '請選擇是或否'
      }
    })

    const miCount = Number.parseInt(cardiovascularHistory.miHistoryCount, 10)
    if (Number.isNaN(miCount) || miCount < 0) {
      nextErrors['cardiovascularHistory.miHistoryCount'] = '請輸入有效的心肌梗塞次數'
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

  const currentStepIndex = steps.findIndex((step) => step.key === 'cardioHistory')
  const stepLabel = `Step ${currentStepIndex + 1}`
  const nextStepKey = steps[currentStepIndex + 1]?.key
  const nextStepLabel = nextStepKey ? dictionary.steps[nextStepKey] : ''

  const optionRow = (name, field) => (
    <div role="radiogroup" aria-label={name} className={styles.optionRow}>
      {YES_NO_OPTIONS.map((option) => (
        <label key={option.value} className={styles.radioOption}>
          <input
            type="radio"
            name={field}
            value={option.value}
            checked={cardiovascularHistory[field] === option.value}
            onChange={handleBooleanChange(field)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  )

  const isReady = useMemo(() => {
    if (!cardiovascularHistory.hasHistory) return false
    const booleanFields = [
      'hasCad',
      'miWithin1Year',
      'hasMultivesselObstruction',
      'hasAcsWithDiabetes',
      'hasPad',
      'hasCarotidStenosis',
      'hasStrokeWithAtherosclerosis',
      'hasSignificantPlaque',
    ]
    if (booleanFields.some((field) => !cardiovascularHistory[field])) {
      return false
    }
    const miCount = Number.parseInt(cardiovascularHistory.miHistoryCount, 10)
    return !Number.isNaN(miCount) && miCount >= 0
  }, [cardiovascularHistory])

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{stepCopy.title ?? '心血管臨床病史'}</h2>
        </div>
        <p className={styles.lead}>
          {stepCopy.lead ??
            '請確認是否曾經歷重大心血管事件，以及影像檢查是否顯示顯著的動脈硬化負擔。'}
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section className={styles.historyCard}>
          <h3>{copy.historyTitle}</h3>
          <p className={styles.historyHint}>{copy.historyHint}</p>

          <div role="radiogroup" aria-label="曾發生心血管疾病" className={styles.optionRow}>
            {STATUS_OPTIONS.map((option) => (
              <label key={option.value} className={styles.radioOption}>
                <input
                  type="radio"
                  name="cardio-history"
                  value={option.value}
                  checked={cardiovascularHistory.hasHistory === option.value}
                  onChange={handleHistoryChange}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {errors['cardiovascularHistory.hasHistory'] ? (
            <p className={styles.error}>{errors['cardiovascularHistory.hasHistory']}</p>
          ) : null}

          {cardiovascularHistory.hasHistory === 'yes' ? (
            <label className={styles.notesField}>
              <span className={styles.inlineLabel}>{copy.historyNotes}</span>
              <textarea
                rows={3}
                value={cardiovascularHistory.notes}
                onChange={handleTextChange('notes')}
                placeholder={copy.historyPlaceholder}
              />
            </label>
          ) : null}
        </section>

        <section className={styles.historyCard}>
          <h3>臨床診斷與影像結果</h3>
          <div className={styles.clinicalGrid}>
            <div className={styles.inlineGroup}>
              <span className={styles.inlineLabel}>是否診斷冠狀動脈疾病（CAD）？</span>
              {optionRow('冠狀動脈疾病', 'hasCad')}
              {errors['cardiovascularHistory.hasCad'] ? (
                <p className={styles.error}>{errors['cardiovascularHistory.hasCad']}</p>
              ) : null}
            </div>

            <label className={styles.inlineGroup}>
              <span className={styles.inlineLabel}>歷來心肌梗塞次數</span>
              <div className={styles.inlineInput}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={cardiovascularHistory.miHistoryCount}
                  onChange={handleTextChange('miHistoryCount')}
                />
                <span className={styles.unit}>次</span>
              </div>
              {errors['cardiovascularHistory.miHistoryCount'] ? (
                <p className={styles.error}>{errors['cardiovascularHistory.miHistoryCount']}</p>
              ) : null}
            </label>

            <div className={styles.inlineGroup}>
              <span className={styles.inlineLabel}>過去一年是否發生心肌梗塞？</span>
              {optionRow('近期心肌梗塞', 'miWithin1Year')}
              {errors['cardiovascularHistory.miWithin1Year'] ? (
                <p className={styles.error}>{errors['cardiovascularHistory.miWithin1Year']}</p>
              ) : null}
            </div>

            <div className={styles.inlineGroup}>
              <span className={styles.inlineLabel}>是否有多支冠狀動脈阻塞？</span>
              {optionRow('多支冠狀動脈阻塞', 'hasMultivesselObstruction')}
              {errors['cardiovascularHistory.hasMultivesselObstruction'] ? (
                <p className={styles.error}>
                  {errors['cardiovascularHistory.hasMultivesselObstruction']}
                </p>
              ) : null}
            </div>

            <div className={styles.inlineGroup}>
              <span className={styles.inlineLabel}>是否曾有急性冠心症合併糖尿病？</span>
              {optionRow('ACS 合併糖尿病', 'hasAcsWithDiabetes')}
              {errors['cardiovascularHistory.hasAcsWithDiabetes'] ? (
                <p className={styles.error}>
                  {errors['cardiovascularHistory.hasAcsWithDiabetes']}
                </p>
              ) : null}
            </div>

            <div className={styles.inlineGroup}>
              <span className={styles.inlineLabel}>是否診斷周邊動脈疾病（PAD）？</span>
              {optionRow('周邊動脈疾病', 'hasPad')}
              {errors['cardiovascularHistory.hasPad'] ? (
                <p className={styles.error}>{errors['cardiovascularHistory.hasPad']}</p>
              ) : null}
            </div>

            <div className={styles.inlineGroup}>
              <span className={styles.inlineLabel}>是否有頸動脈狹窄（≥50%）？</span>
              {optionRow('頸動脈狹窄', 'hasCarotidStenosis')}
              {errors['cardiovascularHistory.hasCarotidStenosis'] ? (
                <p className={styles.error}>{errors['cardiovascularHistory.hasCarotidStenosis']}</p>
              ) : null}
            </div>

            <div className={styles.inlineGroup}>
              <span className={styles.inlineLabel}>
                是否曾有缺血性中風 / TIA 並伴隨動脈硬化病史？
              </span>
              {optionRow('缺血性中風合併動脈硬化', 'hasStrokeWithAtherosclerosis')}
              {errors['cardiovascularHistory.hasStrokeWithAtherosclerosis'] ? (
                <p className={styles.error}>
                  {errors['cardiovascularHistory.hasStrokeWithAtherosclerosis']}
                </p>
              ) : null}
            </div>

            <div className={styles.inlineGroup}>
              <span className={styles.inlineLabel}>影像檢查是否顯示顯著斑塊負擔（≥50%）？</span>
              {optionRow('顯著斑塊負擔', 'hasSignificantPlaque')}
              {errors['cardiovascularHistory.hasSignificantPlaque'] ? (
                <p className={styles.error}>
                  {errors['cardiovascularHistory.hasSignificantPlaque']}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <Button type="submit" disabled={!isReady}>
            {nextStepLabel ? `下一步：${nextStepLabel}` : '下一步'}
          </Button>
        </div>
      </form>
    </section>
  )
}
