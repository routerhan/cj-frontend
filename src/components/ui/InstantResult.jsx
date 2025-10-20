import styles from './InstantResult.module.css'

export const InstantResult = ({ label, value, description }) => (
  <div className={styles.container}>
    <p className={styles.label}>{label}</p>
    <p className={styles.value}>{value}</p>
    {description ? <p className={styles.description}>{description}</p> : null}
  </div>
)
