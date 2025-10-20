import styles from './LoadingSpinner.module.css'

export const LoadingSpinner = ({ label = '載入中' }) => (
  <div className={styles.container} role="status" aria-live="assertive">
    <span className={styles.spinner} />
    <span className={styles.label}>{label}</span>
  </div>
)
