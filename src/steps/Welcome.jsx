import { Button } from '../components/ui/Button.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import styles from './Welcome.module.css'

export const Welcome = () => {
  const { goToNext, markCurrentStepCompleted } = useFormContext()

  const handleStart = () => {
    markCurrentStepCompleted()
    goToNext()
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.heading}>10 分鐘，預測您未來 10 年的心血管風險</h2>
      <p className={styles.description}>
        透過循序漸進的表單流程，我們將協助您了解個人化的健康風險狀態。
      </p>
      <Button onClick={handleStart}>立即開始評估</Button>
    </section>
  )
}
