import { useLanguage } from '../context/LanguageContext'
import './MetricCards.css'

const formatCurrency = (value) => {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function MetricCard({ label, value, format = 'currency', loading }) {
  const display =
    format === 'currency'
      ? formatCurrency(value)
      : typeof value === 'number' || (typeof value === 'string' && value !== '')
        ? (typeof value === 'number' ? value : parseInt(value, 10) || 0).toLocaleString()
        : '—'
  return (
    <div className="metric-card">
      {loading ? (
        <div className="metric-card-skeleton" aria-hidden>
          <div className="metric-card-skeleton-value" />
          <div className="metric-card-skeleton-label" />
        </div>
      ) : (
        <>
          <div className="metric-card-value text-glow-primary">{display}</div>
          <div className="metric-card-label">{label}</div>
        </>
      )}
    </div>
  )
}

export function MetricCards({
  totalSales,
  commissionEarned,
  netDistributed,
  netReceived,
  ordersToday,
  showCommission = true,
  loading = false,
  error = null,
}) {
  const { t } = useLanguage()
  if (error) {
    return (
      <div className="metric-cards-error" role="alert">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="metric-cards-grid">
      <MetricCard label={t('dashboard.totalSales')} value={totalSales} loading={loading} />
      {showCommission && (
        <MetricCard label={t('dashboard.commissionEarned')} value={commissionEarned} loading={loading} />
      )}
      <MetricCard
        label={netReceived != null ? t('dashboard.netReceived') : t('dashboard.netDistributed')}
        value={netReceived != null ? netReceived : netDistributed}
        loading={loading}
      />
      <MetricCard label={t('dashboard.ordersToday')} value={ordersToday} format="number" loading={loading} />
    </div>
  )
}

export function formatMetricCurrency(value) {
  return formatCurrency(value)
}

export default MetricCards
