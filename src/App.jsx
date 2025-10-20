import { Layout } from './components/layout/Layout.jsx'
import { useFormContext } from './context/FormContext.jsx'
import { Welcome } from './steps/Welcome.jsx'
import { Step1_BasicInfo } from './steps/Step1_BasicInfo.jsx'
import { Step2_ChronicConditions } from './steps/Step2_ChronicConditions.jsx'
import { Step3_HealthStatus } from './steps/Step3_HealthStatus.jsx'
import { Step4_Report } from './steps/Step4_Report.jsx'

const STEP_COMPONENTS = [
  Welcome,
  Step1_BasicInfo,
  Step2_ChronicConditions,
  Step3_HealthStatus,
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

  return (
    <Layout>
      <CurrentStep />
    </Layout>
  )
}

export default App
