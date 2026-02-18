import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getStoredLocale, setStoredLocale, getTranslation } from '../i18n/translations'

const LanguageContext = createContext(null)

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredLocale)

  const setLocale = useCallback((newLocale) => {
    if (newLocale !== 'es' && newLocale !== 'en') return
    setLocaleState(newLocale)
    setStoredLocale(newLocale)
  }, [])

  const t = useCallback(
    (key) => getTranslation(locale, key),
    [locale]
  )

  useEffect(() => {
    const stored = getStoredLocale()
    if (stored !== locale) setLocaleState(stored)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === 'es' ? 'es' : 'en'
  }, [locale])

  const value = { locale, setLocale, t }
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export default LanguageContext
