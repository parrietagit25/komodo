import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPublicEvents } from '../../services/publicService'
import { Card, CardHeader, CardTitle, CardBody } from '../../components/Card'
import './Purchase.css'

export default function UserEvents() {
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
        if (!cancelled) setError(e.response?.data?.detail || 'Failed to load events')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="purchase-page">
        <header className="purchase-header">
          <h1 className="purchase-title text-glow-primary">Events</h1>
          <p className="purchase-subtitle">Choose an event to browse stands</p>
        </header>
        <div className="purchase-loading">
          <span className="loader neon-loader" aria-hidden />
          <span>Loading events…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="purchase-page">
      <header className="purchase-header">
        <h1 className="purchase-title text-glow-primary">Events</h1>
        <p className="purchase-subtitle">Choose an event to browse stands</p>
      </header>
      {error && (
        <div className="purchase-error" role="alert">
          {error}
        </div>
      )}
      <div className="purchase-grid">
        {events.length === 0 && !error && (
          <p className="purchase-empty">No events available.</p>
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
