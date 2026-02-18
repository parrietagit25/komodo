import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { getPublicEvents } from '../../services/publicService'
import { Card, CardHeader, CardTitle, CardBody } from '../../components/Card'
import './Purchase.css'

export default function UserEvents() {
  const { t } = useLanguage()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setError(null)
        const list = await getPublicEvents()
        if (!cancelled) setEvents(list)
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.detail || t('userEvents.failedLoad'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [t])

  if (loading) {
    return (
      <div className="purchase-page">
        <header className="purchase-header">
          <h1 className="purchase-title text-glow-primary">{t('userEvents.title')}</h1>
          <p className="purchase-subtitle">{t('userEvents.subtitle')}</p>
        </header>
        <div className="purchase-loading">
          <span className="loader neon-loader" aria-hidden />
          <span>{t('userEvents.loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="purchase-page">
      <header className="purchase-header">
        <h1 className="purchase-title text-glow-primary">{t('userEvents.title')}</h1>
        <p className="purchase-subtitle">{t('userEvents.subtitle')}</p>
      </header>
      {error && (
        <div className="purchase-error" role="alert">
          {error}
        </div>
      )}
      <div className="purchase-grid">
        {events.length === 0 && !error && (
          <p className="purchase-empty">{t('userEvents.empty')}</p>
        )}
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/user/events/${event.id}/stands`}
            className="purchase-card-link"
          >
            <Card className="purchase-card">
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
              </CardHeader>
              <CardBody>
                {event.description && <p>{event.description}</p>}
                {event.start_date && (
                  <p className="purchase-muted">
                    {new Date(event.start_date).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })}
                  </p>
                )}
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
