import { Card, CardHeader, CardTitle, CardBody } from '../components/Card'
import { useLanguage } from '../context/LanguageContext'
import './Settings.css'

export default function Settings() {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div className="settings-page settings-page--enter">
      <header className="settings-header">
        <h1 className="settings-title text-glow-primary">{t('settings.title')}</h1>
        <p className="settings-subtitle">{t('settings.subtitle')}</p>
      </header>

      <Card className="settings-card">
        <CardHeader>
          <CardTitle>{t('settings.language')}</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="settings-help">{t('settings.languageHelp')}</p>
          <div className="settings-language-options">
            <button
              type="button"
              className={`settings-lang-btn ${locale === 'es' ? 'settings-lang-btn--active' : ''}`}
              onClick={() => setLocale('es')}
            >
              {t('settings.spanish')}
            </button>
            <button
              type="button"
              className={`settings-lang-btn ${locale === 'en' ? 'settings-lang-btn--active' : ''}`}
              onClick={() => setLocale('en')}
            >
              {t('settings.english')}
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
