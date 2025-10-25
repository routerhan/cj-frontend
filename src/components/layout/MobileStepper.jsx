import { useFormContext } from '../../context/FormContext.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'
import styles from './MobileStepper.module.css'

export const MobileStepper = () => {
  const { steps, currentStep, totalSteps } = useFormContext()
  const { dictionary } = useLanguage()

  const currentKey = steps[currentStep]?.key
  const stepDisplay = currentKey ? dictionary.steps[currentKey] ?? '' : ''
  const progress =
    totalSteps > 0 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 0

  return (
    <div className={styles.mobileStepper} aria-live="polite">
      <div className={styles.meta}>
        <span className={styles.stepIndex}>
          步驟 {currentStep + 1} / {totalSteps}
        </span>
        <span className={styles.progressValue}>{progress}%</span>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>
      <span className={styles.stepLabel}>{stepDisplay}</span>
    </div>
  )
}
