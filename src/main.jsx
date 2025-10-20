import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { FormProvider } from './context/FormContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import './main.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <FormProvider>
        <App />
      </FormProvider>
    </LanguageProvider>
  </StrictMode>,
)
