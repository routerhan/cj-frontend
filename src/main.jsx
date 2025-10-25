import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { FormProvider } from './context/FormContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { registerMockServer } from './mocks/registerMockServer.js'
import './main.css'

if (import.meta.env.DEV) {
  registerMockServer()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <FormProvider>
        <App />
      </FormProvider>
    </LanguageProvider>
  </StrictMode>,
)
