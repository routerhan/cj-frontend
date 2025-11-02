import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import styles from './Step5_CardiovascularHistory.module.css'

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

  const handleCacCategoryChange = (event) => {
    updateFormField(['history', 'cacScoreCategory'], event.target.value)
    clearError('cacScoreCategory')
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

    if (!history.cacScoreCategory) {
      nextErrors.cacScoreCategory = copy.errors?.cacScore ?? '請選擇是否 ≥ 400'
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

  const cacOptions = [
    { value: 'yes', label: copy.options?.yes ?? '是' },
    { value: 'no', label: copy.options?.no ?? '否' },
    { value: 'unknown', label: copy.options?.unknown ?? general.unknown ?? '不知道' },
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
          <div className={styles.optionSection}>
            <span className={styles.label}>
              {copy.questions?.cac ?? '最近一次冠狀動脈鈣化分數 (CAC) 是否 ≥ 400？'}
            </span>
            <div
              className={styles.optionGroup}
              role="radiogroup"
              aria-label={copy.questions?.cac ?? '最近一次冠狀動脈鈣化分數 (CAC) 是否 ≥ 400？'}
            >
              {cacOptions.map((option) => (
                <label key={option.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="cacScoreCategory"
                    value={option.value}
                    checked={history.cacScoreCategory === option.value}
                    onChange={handleCacCategoryChange}
                    className={styles.radioInput}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors.cacScoreCategory ? <p className={styles.error}>{errors.cacScoreCategory}</p> : null}
          </div>
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
