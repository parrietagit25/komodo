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
  if (error) {
    return (
      <div className="metric-cards-error" role="alert">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="metric-cards-grid">
      <MetricCard label="Total Sales" value={totalSales} loading={loading} />
      {showCommission && (
        <MetricCard label="Commission Earned" value={commissionEarned} loading={loading} />
      )}
      <MetricCard
        label={netReceived != null ? 'Net Received' : 'Net Distributed'}
        value={netReceived != null ? netReceived : netDistributed}
        loading={loading}
      />
      <MetricCard label="Orders Today" value={ordersToday} format="number" loading={loading} />
    </div>
  )
}

export function formatMetricCurrency(value) {
  return formatCurrency(value)
}

export default MetricCards
