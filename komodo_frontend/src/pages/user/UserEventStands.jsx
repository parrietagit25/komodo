import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { getPublicEvent, getEventStands } from '../../services/publicService'
import { Card, CardHeader, CardTitle, CardBody } from '../../components/Card'
import './Purchase.css'

export default function UserEventStands() {
  const { t } = useLanguage()
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [stands, setStands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!eventId) return
      try {
        setError(null)
        const [eventData, standsList] = await Promise.all([
          getPublicEvent(eventId),
          getEventStands(eventId),
        ])
        if (!cancelled) {
          setEvent(eventData)
          setStands(standsList)
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.detail || t('userStands.failedLoad'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [eventId, t])

  if (loading) {
    return (
      <div className="purchase-page">
        <header className="purchase-header">
          <h1 className="purchase-title text-glow-primary">{t('userStands.title')}</h1>
          <p className="purchase-subtitle">{t('userStands.loading')}</p>
        </header>
        <div className="purchase-loading">
          <span className="loader neon-loader" aria-hidden />
          <span>{t('userStands.loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="purchase-page">
      <header className="purchase-header">
        <nav className="purchase-breadcrumb">
          <button type="button" className="purchase-back" onClick={() => navigate('/user/events')}>
            {t('userStands.backToEvents')}
          </button>
        </nav>
        <h1 className="purchase-title text-glow-primary">{event?.name ?? t('userStands.title')}</h1>
        <p className="purchase-subtitle">{t('userStands.subtitle')}</p>
      </header>
      {error && (
        <div className="purchase-error" role="alert">
          {error}
        </div>
      )}
      <div className="purchase-grid">
        {stands.length === 0 && !error && (
          <p className="purchase-empty">{t('userStands.noStandsForEvent')}</p>
        )}
        {stands.map((stand) => (
          <Link
            key={stand.id}
            to={`/user/stands/${stand.id}/products`}
            className="purchase-card-link"
          >
            <Card className="purchase-card">
              <CardHeader>
                <CardTitle>{stand.name}</CardTitle>
              </CardHeader>
              <CardBody>
                {stand.description && <p>{stand.description}</p>}
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
