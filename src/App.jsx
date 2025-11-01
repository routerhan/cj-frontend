import { useEffect } from 'react'
import { Layout } from './components/layout/Layout.jsx'
import { useFormContext } from './context/FormContext.jsx'
import { Welcome } from './steps/Welcome.jsx'
import { Step1_BasicInfo } from './steps/Step1_BasicInfo.jsx'
import { Step2_BpLipids } from './steps/Step2_BpLipids.jsx'
import { Step3_Diabetes } from './steps/Step3_Diabetes.jsx'
import { Step3_KidneyFunction } from './steps/Step3_KidneyFunction.jsx'
import { Step5_CardiovascularHistory } from './steps/Step5_CardiovascularHistory.jsx'
import { Step4_Report } from './steps/Step4_Report.jsx'

const STEP_COMPONENTS = [
  Welcome,
  Step1_BasicInfo,
  Step2_BpLipids,
  Step3_Diabetes,
  Step3_KidneyFunction,
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  return (
    <Layout>
      <CurrentStep />
    </Layout>
  )
}

export default App
