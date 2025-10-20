import clsx from 'clsx'
import companyLogo from '../../assets/company-logo.png'
import { useFormContext } from '../../context/FormContext.jsx'
import styles from './Sidebar.module.css'

export const Sidebar = () => {
  const { steps, currentStep, stepStatus, StepStatus, goToStep } = useFormContext()

  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.logoBadge}>
          <img src={companyLogo} alt="Commjat" />
        </div>
        <div className={styles.brand}>
          <div className={styles.header}>
            <p className={styles.kicker}>Commjat Wellness</p>
            <h1 className={styles.title}>健康風險評估</h1>
          </div>
        </div>
        <p className={styles.subtitle}>循序完成每個步驟即可獲得專屬報告</p>
      </div>

      <nav aria-label="填寫步驟">
        <ol className={styles.stepList}>
          {steps.map((step, index) => {
            const status = stepStatus[step.key]
            const isActive = currentStep === index
            const isDisabled = status === StepStatus.PENDING

            const handleClick = () => {
              if (!isDisabled) {
                goToStep(index)
              }
            }

            return (
              <li key={step.key}>
                <button
                  type="button"
                  className={clsx(styles.stepItem, {
                    [styles.active]: isActive,
                    [styles.completed]: status === StepStatus.COMPLETED,
                    [styles.disabled]: isDisabled,
                  })}
                  onClick={handleClick}
                  aria-current={isActive ? 'step' : undefined}
                  aria-disabled={isDisabled}
                  disabled={isDisabled}
                  data-status={status}
                >
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <span className={styles.stepLabel}>{step.label}</span>
                  {status === StepStatus.COMPLETED ? (
                    <span className={styles.statusBadge} aria-label="已完成">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <footer className={styles.footer}>
        <span>Powered by 康緁股份有限公司</span>
        <span>CommJat Co., Ltd.</span>
      </footer>
    </aside>
  )
}
