import { useEffect } from 'react'
import { useFormContext } from '../../context/FormContext.jsx'
import styles from './Layout.module.css'
import { Sidebar } from './Sidebar.jsx'
import { MainContent } from './MainContent.jsx'
import { MobileStepper } from './MobileStepper.jsx'

export const Layout = ({ children }) => {
  const { currentStep } = useFormContext()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  return (
    <div className={styles.appShell}>
      <Sidebar />
      <MainContent>
        <MobileStepper />
        <div className={styles.contentArea}>{children}</div>
      </MainContent>
    </div>
  )
}
