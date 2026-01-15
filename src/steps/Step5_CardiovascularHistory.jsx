import { useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { MEDICAL_HISTORY_GROUPS } from '../config/medicalHistorySchema.js'
import styles from './Step5_CardiovascularHistory.module.css'

const getNested = (object, path) =>
  path.reduce((accumulator, key) => (accumulator && accumulator[key] !== undefined ? accumulator[key] : undefined), object)

const ensureGroupState = (groupConfig, rawGroup) => {
  const state = {}
  groupConfig.options.forEach(({ key }) => {
    state[key] = Boolean(rawGroup?.[key])
  })
  return state
}

const hasSelection = (groupState) => Object.values(groupState).some(Boolean)

export const Step5_CardiovascularHistory = () => {
  const {
    formData,
    updateFormSection,
    markCurrentStepCompleted,
    goToNext,
    setStepStatus,
    StepStatus,
    stepStatus,
    steps,
    getStepIndex,
  } = useFormContext()

  const { dictionary } = useLanguage()
  const copy = dictionary.medicalHistoryStep ?? dictionary.cardioHistoryStep ?? {}

  const history = formData.history ?? {}
  const [errors, setErrors] = useState({})

  const groupStates = useMemo(() => {
    const states = {}
    MEDICAL_HISTORY_GROUPS.forEach((group) => {
      states[group.groupKey] = ensureGroupState(group, history[group.groupKey])
    })
    return states
  }, [history])

  const markInProgressIfNeeded = () => {
    if (stepStatus.history === StepStatus.COMPLETED) {
      setStepStatus('history', StepStatus.IN_PROGRESS)
    }
  }

  const getPrompt = (group) =>
    getNested(copy, group.promptPath) ?? group.fallbackPrompt ?? ''

  const getOptionLabel = (group, option) =>
    getNested(copy, option.labelPath) ?? option.fallbackLabel ?? option.key

  const handleToggle = (groupConfig, option) => (event) => {
    const checked = event.target.checked
    const currentGroup = groupStates[groupConfig.groupKey]
    const nextGroup = { ...currentGroup, [option.key]: checked }

    if (option.isNone && checked) {
      groupConfig.options.forEach(({ key }) => {
        nextGroup[key] = key === option.key
      })
    } else if (!option.isNone && checked) {
      const noneOption = groupConfig.options.find((candidate) => candidate.isNone)
      if (noneOption) {
        nextGroup[noneOption.key] = false
      }
    }

    updateFormSection('history', { [groupConfig.groupKey]: nextGroup })
    setErrors((prev) => {
      if (!prev[groupConfig.groupKey]) return prev
      const next = { ...prev }
      delete next[groupConfig.groupKey]
      return next
    })
    markInProgressIfNeeded()
  }

  const validate = () => {
    const nextErrors = {}

    MEDICAL_HISTORY_GROUPS.forEach((group) => {
      const groupState = groupStates[group.groupKey] ?? {}
      if (!hasSelection(groupState)) {
        nextErrors[group.groupKey] =
          getNested(copy, ['errors', group.groupKey]) ?? 'Please select at least one option'
      }
    })

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
  const stepTitle = copy.title ?? dictionary.steps.history ?? '醫療病史'
  const leadText = copy.lead ?? '請逐項填寫臨床診斷與影像檢查狀況，我們會依據結果判定風險等級。'

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{stepTitle}</h2>
        </div>
        <p className={styles.lead}>{leadText}</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {MEDICAL_HISTORY_GROUPS.map((group) => {
          const groupState = groupStates[group.groupKey]
          const prompt = getPrompt(group)
          const headingId = `${group.groupKey}-prompt`

          return (
            <section key={group.groupKey} className={styles.fieldset}>
              <h3 id={headingId} className={styles.sectionTitle}>
                {prompt}
              </h3>
              <div role="group" aria-labelledby={headingId} className={styles.checkboxGrid}>
                {group.options.map((option) => {
                  const label = getOptionLabel(group, option)
                  const checked = Boolean(groupState?.[option.key])

                  return (
                    <label key={option.key} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name={`${group.groupKey}-${option.key}`}
                        checked={checked}
                        onChange={handleToggle(group, option)}
                      />
                      <span>{label}</span>
                    </label>
                  )
                })}
              </div>
              {errors[group.groupKey] ? <p className={styles.error}>{errors[group.groupKey]}</p> : null}
            </section>
          )
        })}

        <div className={styles.actions}>
          <Button type="submit" variant="primary">
            {copy.buttonNext ?? `Next: ${nextStepLabel}`}
          </Button>
        </div>
      </form>
    </section>
  )
}
