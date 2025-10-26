import { useEffect, useState } from 'react'
import { Layout } from './components/layout/Layout.jsx'
import { useFormContext } from './context/FormContext.jsx'
import { AssessmentDashboard } from './admin/AssessmentDashboard.jsx'
import { Welcome } from './steps/Welcome.jsx'
import { Step1_BasicInfo } from './steps/Step1_BasicInfo.jsx'
import { Step2_ChronicConditions } from './steps/Step2_ChronicConditions.jsx'
import { Step3_KidneyFunction } from './steps/Step3_KidneyFunction.jsx'
import { Step4_LipidProfile } from './steps/Step4_LipidProfile.jsx'
import { Step5_CardiovascularHistory } from './steps/Step5_CardiovascularHistory.jsx'
import { Step4_Report } from './steps/Step4_Report.jsx'

const STEP_COMPONENTS = [
  Welcome,
  Step1_BasicInfo,
  Step2_ChronicConditions,
  Step3_KidneyFunction,
  Step4_LipidProfile,
  Step5_CardiovascularHistory,
  Step4_Report,
]

const FallbackStep = () => (
  <div>
    <h2>未定義的步驟</h2>
    <p>目前的步驟索引沒有對應的頁面，請檢查步驟設定。</p>
  </div>
)

function App() {
  const { currentStep } = useFormContext()
  const CurrentStep = STEP_COMPONENTS[currentStep] ?? FallbackStep

  const resolveDashboardView = () => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '')
    const params = new URLSearchParams(window.location.search)
    return path === 'dashboard' || params.get('view') === 'dashboard'
  }

  const [isDashboardView, setIsDashboardView] = useState(resolveDashboardView)

  useEffect(() => {
    const handler = () => {
      setIsDashboardView(resolveDashboardView())
    }
    window.addEventListener('popstate', handler)
    window.addEventListener('pushstate', handler)
    window.addEventListener('replacestate', handler)
    return () => {
      window.removeEventListener('popstate', handler)
      window.removeEventListener('pushstate', handler)
      window.removeEventListener('replacestate', handler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isDashboardView) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep, isDashboardView])

  useEffect(() => {
    if (isDashboardView) {
      document.title = '心血管評估資料概覽'
    } else {
      document.title = '心血管風險評估'
    }
  }, [isDashboardView])

  if (isDashboardView) {
    return <AssessmentDashboard />
  }

  return (
    <Layout>
      <CurrentStep />
    </Layout>
  )
}

export default App
