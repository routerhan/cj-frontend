import { createContext, useContext, useMemo, useState } from 'react'
import { translations } from '../i18n/translations.js'

const LanguageContext = createContext(undefined)

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('zh')

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'zh' ? 'en' : 'zh'))
  }

  const value = useMemo(
    () => ({
      language,
      toggleLanguage,
      dictionary: translations[language],
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
