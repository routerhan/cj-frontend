import styles from './MainContent.module.css'

export const MainContent = ({ children }) => (
  <main className={styles.main}>{children}</main>
)
