import { Button } from '../components/ui/Button.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import styles from './Welcome.module.css'

export const Welcome = () => {
  const { goToNext, markCurrentStepCompleted } = useFormContext()
  const { dictionary, toggleLanguage, language } = useLanguage()
  const t = dictionary.welcome

  const handleStart = () => {
    markCurrentStepCompleted()
    goToNext()
  }

  return (
    <section className={styles.container}>
      <button
        type="button"
        className={styles.langToggle}
        onClick={toggleLanguage}
        aria-label="Toggle language"
      >
        {language === 'zh' ? 'EN' : '繁中'}
      </button>
      <h2 className={styles.heading}>{t.heading}</h2>
      <p className={styles.description}>{t.description}</p>
      <Button onClick={handleStart}>{t.start}</Button>
    </section>
  )
}
