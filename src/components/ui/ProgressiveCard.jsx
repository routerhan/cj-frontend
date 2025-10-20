import styles from './ProgressiveCard.module.css'

export const ProgressiveCard = ({
  title,
  summary,
  isExpanded,
  onToggle,
  children,
}) => (
  <section className={styles.card}>
    <header className={styles.header}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        {summary ? <p className={styles.summary}>{summary}</p> : null}
      </div>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isExpanded}
        onClick={onToggle}
      >
        {isExpanded ? '收合' : '展開'}
      </button>
    </header>
    <div className={styles.panel} data-expanded={isExpanded}>
      {children}
    </div>
  </section>
)
