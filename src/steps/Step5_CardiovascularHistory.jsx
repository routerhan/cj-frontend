import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import styles from './Step5_CardiovascularHistory.module.css'

const parseNonNegativeNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

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
    getStepIndex,
  } = useFormContext()

  const { dictionary } = useLanguage()
  const general = dictionary.general
  const copy = dictionary.cardioHistoryStep ?? {}

  const history = formData.history
  const [errors, setErrors] = useState({})

  const markInProgressIfNeeded = () => {
    if (stepStatus.history === StepStatus.COMPLETED || stepStatus.cardioHistory === StepStatus.COMPLETED) {
      setStepStatus('history', StepStatus.IN_PROGRESS)
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

  const handleYesNoChange = (field) => (event) => {
    updateFormField(['history', field], event.target.value)
    clearError(field)
    markInProgressIfNeeded()
  }

  const handleCacScoreChange = (event) => {
    updateFormField(['history', 'cacScore'], event.target.value)
    clearError('cacScore')
    markInProgressIfNeeded()
  }

  const handleVascularDiseaseToggle = (field) => (event) => {
    const isChecked = event.target.checked
    updateFormField(['history', 'vascularDiseases', field], isChecked)
    if (field === 'cad' && !isChecked) {
      updateFormField(['history', 'cadDetails'], {
        miWithin1Year: false,
        miHistoryCountTwoOrMore: false,
        hasMultiVesselObstruction: false,
      })
    }
    markInProgressIfNeeded()
  }

  const handleCadDetailToggle = (field) => (event) => {
    updateFormField(['history', 'cadDetails', field], event.target.checked)
    markInProgressIfNeeded()
  }

  const validate = () => {
    const nextErrors = {}

    if (history.cacScore !== '') {
      const parsed = parseNonNegativeNumber(history.cacScore)
      if (parsed === null) {
        nextErrors.cacScore = copy.errors?.cacScore ?? '請輸入有效的 CAC 分數'
      }
    }

    if (!history.hasSignificantPlaque) {
      nextErrors.hasSignificantPlaque = copy.errors?.hasSignificantPlaque ?? '請選擇是否存在顯著斑塊'
    }

    if (!history.hasAscvdDiagnosis) {
      nextErrors.hasAscvdDiagnosis = copy.errors?.hasAscvdDiagnosis ?? '請選擇是否被診斷 ASCVD'
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

  const stepIndex = getStepIndex('history')
  const stepLabel = stepIndex >= 0 ? `Step ${stepIndex + 1}` : ''
  const nextStepKey = steps[stepIndex + 1]?.key
  const nextStepLabel = nextStepKey ? dictionary.steps[nextStepKey] ?? '' : ''
  const stepTitle = copy.title ?? dictionary.steps.history ?? '心血管病史'

  const vascularDiseases = history.vascularDiseases ?? {}
  const cadDetails = history.cadDetails ?? {}

  const vascularOptions = [
    { field: 'cad', label: copy.vascularDiseases?.cad ?? '冠狀動脈疾病 (CAD)' },
    { field: 'pad', label: copy.vascularDiseases?.pad ?? '周邊動脈疾病 (PAD)' },
    {
      field: 'carotidStenosis',
      label: copy.vascularDiseases?.carotid ?? '頸動脈狹窄',
    },
  ]

  useEffect(() => {
    if (!vascularDiseases.cad) {
      if (cadDetails.miWithin1Year || cadDetails.miHistoryCountTwoOrMore || cadDetails.hasMultiVesselObstruction) {
        updateFormField(['history', 'cadDetails'], {
          miWithin1Year: false,
          miHistoryCountTwoOrMore: false,
          hasMultiVesselObstruction: false,
        })
      }
    }
  }, [vascularDiseases.cad, cadDetails.hasMultiVesselObstruction, cadDetails.miHistoryCountTwoOrMore, cadDetails.miWithin1Year, updateFormField])

  const isCadSelected = Boolean(vascularDiseases.cad)

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{stepTitle}</h2>
        </div>
        <p className={styles.lead}>
          {copy.lead ??
            '請填寫心血管影像與臨床診斷資料，我們將據此評估是否符合高風險條件。'}
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section className={styles.fieldset}>
          <h3 className={styles.sectionTitle}>{copy.sections?.screening ?? '鈣化檢查'}</h3>
          <label className={styles.inputGroup} htmlFor="cacScore">
            <span className={styles.label}>
              {copy.questions?.cac ?? '冠狀動脈鈣化分數 (CAC)'}
            </span>
            <div className={styles.inlineInput}>
              <input
                id="cacScore"
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                value={history.cacScore}
                onChange={handleCacScoreChange}
                className={styles.input}
                placeholder={copy.placeholders?.cac ?? '未檢查可留空'}
              />
            </div>
          </label>
          {errors.cacScore ? <p className={styles.error}>{errors.cacScore}</p> : null}
        </section>

        <section className={styles.fieldset}>
          <h3 className={styles.sectionTitle}>{copy.sections?.diagnosis ?? '影像與診斷'}</h3>
          <div className={styles.optionSection}>
            <span className={styles.label}>{copy.questions?.plaque ?? '影像檢查是否顯示顯著斑塊負擔 (≥50%)？'}</span>
            <div
              className={styles.optionGroup}
              role="radiogroup"
              aria-label={copy.questions?.plaque ?? '影像檢查是否顯示顯著斑塊負擔 (≥50%)？'}
            >
              {['yes', 'no'].map((value) => (
                <label key={value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="hasSignificantPlaque"
                    value={value}
                    checked={history.hasSignificantPlaque === value}
                    onChange={handleYesNoChange('hasSignificantPlaque')}
                    className={styles.radioInput}
                  />
                  <span>{general[value] ?? value}</span>
                </label>
              ))}
            </div>
            {errors.hasSignificantPlaque ? <p className={styles.error}>{errors.hasSignificantPlaque}</p> : null}
          </div>

          <div className={styles.optionSection}>
            <span className={styles.label}>{copy.questions?.ascvd ?? '是否曾被臨床診斷為動脈硬化心血管疾病 (ASCVD)？'}</span>
            <div
              className={styles.optionGroup}
              role="radiogroup"
              aria-label={copy.questions?.ascvd ?? '是否曾被臨床診斷為動脈硬化心血管疾病 (ASCVD)？'}
            >
              {['yes', 'no'].map((value) => (
                <label key={value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="hasAscvdDiagnosis"
                    value={value}
                    checked={history.hasAscvdDiagnosis === value}
                    onChange={handleYesNoChange('hasAscvdDiagnosis')}
                    className={styles.radioInput}
                  />
                  <span>{general[value] ?? value}</span>
                </label>
              ))}
            </div>
            {errors.hasAscvdDiagnosis ? <p className={styles.error}>{errors.hasAscvdDiagnosis}</p> : null}
          </div>
        </section>

        <section className={styles.fieldset}>
          <h3 className={styles.sectionTitle}>{copy.sections?.vascular ?? '臨床病史 (可複選)'}</h3>
          <p className={styles.description}>
            {copy.descriptions?.vascular ?? '若您曾被診斷以下任一病史，請勾選後續項目。'}
          </p>
          <div className={styles.checkboxGrid}>
            {vascularOptions.map((option) => (
              <label key={option.field} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name={`vascular-${option.field}`}
                  checked={Boolean(vascularDiseases[option.field])}
                  onChange={handleVascularDiseaseToggle(option.field)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        {isCadSelected ? (
          <section className={styles.fieldset}>
            <h3 className={styles.sectionTitle}>{copy.sections?.cadAdvanced ?? '冠狀動脈進階紀錄'}</h3>
            <p className={styles.description}>
              {copy.descriptions?.cadAdvanced ?? '若符合以下任一情況，請勾選所有適用項目。'}
            </p>
            <div className={styles.checkboxGrid}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="cad-mi-within-1year"
                  checked={cadDetails.miWithin1Year}
                  onChange={handleCadDetailToggle('miWithin1Year')}
                />
                <span>{copy.cadAdvanced?.miWithin1Year ?? '一年內曾經歷心肌梗塞'}</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="cad-mi-count"
                  checked={cadDetails.miHistoryCountTwoOrMore}
                  onChange={handleCadDetailToggle('miHistoryCountTwoOrMore')}
                />
                <span>{copy.cadAdvanced?.miHistoryCountTwoOrMore ?? '歷來心肌梗塞次數 ≥ 2 次'}</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="cad-multivessel"
                  checked={cadDetails.hasMultiVesselObstruction}
                  onChange={handleCadDetailToggle('hasMultiVesselObstruction')}
                />
                <span>{copy.cadAdvanced?.hasMultiVesselObstruction ?? '檢查顯示多支冠狀動脈阻塞'}</span>
              </label>
            </div>
          </section>
        ) : null}

        <div className={styles.actions}>
          <Button type="submit" variant="primary">
            {nextStepLabel ? `下一步：${nextStepLabel}` : copy.buttonNext ?? '下一步'}
          </Button>
        </div>
      </form>
    </section>
  )
}
