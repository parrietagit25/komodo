import { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { getFinancialOverview } from '../../services/dashboardService'
import { generateDemoActivity } from '../../services/demoService'
import { showLoading, showSuccess, showError, toast } from '../../utils/toast'
import './FinancialOverview.css'

const ROLES = { SUPERADMIN: 'SUPERADMIN' }

const formatCurrency = (value) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value))

const formatMonth = (yyyyMm) => {
  if (!yyyyMm) return ''
  const [y, m] = yyyyMm.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length || !label) return null
  const item = payload[0]?.payload
  if (!item) return null
  return (
    <div className="financial-tooltip">
      <div className="financial-tooltip-month">{formatMonth(label)}</div>
      <div className="financial-tooltip-row" style={{ '--accent': '#00FF88' }}>
        <span>Revenue</span>
        <span>{formatCurrency(item.revenue)}</span>
      </div>
      <div className="financial-tooltip-row" style={{ '--accent': '#FF3366' }}>
        <span>Commission</span>
        <span>{formatCurrency(item.commission)}</span>
      </div>
    </div>
  )
}

const KPI_CARDS = [
  { key: 'total_revenue', label: 'Total Revenue', valueKey: 'total_revenue', format: formatCurrency, neon: true },
  { key: 'total_commission', label: 'Total Commission', valueKey: 'total_commission', format: formatCurrency, neon: true },
  { key: 'total_paid_to_stands', label: 'Total Paid to Stands', valueKey: 'total_paid_to_stands', format: formatCurrency, neon: true },
  { key: 'total_orders', label: 'Total Orders', valueKey: 'total_orders', format: (v) => (v ?? 0).toLocaleString(), neon: false },
  { key: 'active_users', label: 'Active Users', valueKey: 'active_users', format: (v) => (v ?? 0).toLocaleString(), neon: false },
  { key: 'avg_ticket', label: 'Avg Ticket', valueKey: 'avg_ticket', format: formatCurrency, neon: false },
]

export default function FinancialOverview() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [demoLoading, setDemoLoading] = useState(false)

  const fetchData = useCallback(() => {
    return getFinancialOverview()
      .then((res) => setData(res || {}))
      .catch((err) => setError(err.response?.data?.detail || err.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    getFinancialOverview()
      .then((res) => {
        if (!cancelled) setData(res || {})
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || err.message || 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleGenerateDemo = useCallback(async () => {
    if (demoLoading) return
    setDemoLoading(true)
    const loadingId = showLoading('Generating demo activity…')
    try {
      const res = await generateDemoActivity()
      toast.dismiss(loadingId)
      const msg = [
        `${res.orders_created ?? 0} orders created`,
        `Revenue: $${Number(res.total_generated_revenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        `Commission: $${Number(res.total_commission_generated ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      ].join(' · ')
      showSuccess(msg)
      await fetchData()
    } catch (err) {
      toast.dismiss(loadingId)
      showError(err.response?.data?.detail || err.message || 'Demo generation failed')
    } finally {
      setDemoLoading(false)
    }
  }, [demoLoading, fetchData])

  if (loading) {
    return (
      <div className="financial-overview-page financial-overview-page--enter">
        <header className="financial-header">
          <div className="financial-header-top">
            <div>
              <h1 className="financial-title text-glow-primary">Financial Overview</h1>
              <p className="financial-subtitle">Platform metrics and performance</p>
            </div>
            {user?.role === ROLES.SUPERADMIN && (
              <button type="button" className="financial-demo-btn" disabled aria-busy>
                <span className="financial-demo-btn-text">Generate Demo Activity</span>
              </button>
            )}
          </div>
        </header>
        <section className="financial-kpi-section" aria-label="Key metrics">
          <div className="financial-kpi-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="financial-kpi-card financial-kpi-card--skeleton">
                <div className="financial-kpi-skeleton-value" />
                <div className="financial-kpi-skeleton-label" />
              </div>
            ))}
          </div>
        </section>
        <div className="financial-section financial-orgs-skeleton" />
        <div className="financial-section financial-stands-skeleton" />
        <div className="financial-section financial-chart-skeleton" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="financial-overview-page">
        <header className="financial-header">
          <div className="financial-header-top">
            <div>
              <h1 className="financial-title text-glow-primary">Financial Overview</h1>
              <p className="financial-subtitle">Platform metrics and performance</p>
            </div>
            {user?.role === ROLES.SUPERADMIN && (
              <button
                type="button"
                className="financial-demo-btn"
                onClick={handleGenerateDemo}
                disabled={demoLoading}
                aria-busy={demoLoading}
              >
                <span className="financial-demo-btn-text">{demoLoading ? 'Generating…' : 'Generate Demo Activity'}</span>
              </button>
            )}
          </div>
        </header>
        <div className="financial-error" role="alert">
          {error}
        </div>
      </div>
    )
  }

  const d = data
  const topOrgs = d.top_organizations || []
  const topStands = d.top_stands || []
  const monthly = d.monthly_revenue || []
  const maxStandRevenue = topStands.length
    ? Math.max(...topStands.map((s) => Number(s.revenue) || 0), 1)
    : 1

  return (
    <div className="financial-overview-page financial-overview-page--enter">
      <header className="financial-header">
        <div className="financial-header-top">
          <div>
            <h1 className="financial-title text-glow-primary">Financial Overview</h1>
            <p className="financial-subtitle">Platform metrics and performance</p>
          </div>
          {user?.role === ROLES.SUPERADMIN && (
            <button
              type="button"
              className="financial-demo-btn"
              onClick={handleGenerateDemo}
              disabled={demoLoading}
              aria-busy={demoLoading}
            >
              <span className="financial-demo-btn-text">{demoLoading ? 'Generating…' : 'Generate Demo Activity'}</span>
            </button>
          )}
        </div>
      </header>

      <section className="financial-kpi-section" aria-label="Key metrics">
        <div className="financial-kpi-grid">
          {KPI_CARDS.map((card, i) => (
            <div
              key={card.key}
              className={`financial-kpi-card border-glow ${card.neon ? 'financial-kpi-card--neon' : ''}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className={`financial-kpi-value ${card.neon ? 'financial-kpi-value--neon' : ''}`}>
                {card.format(d[card.valueKey])}
              </span>
              <span className="financial-kpi-label">{card.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="financial-section financial-growth-section" aria-labelledby="growth-title">
        <h2 id="growth-title" className="financial-section-title">📈 Growth & Projection</h2>
        <div className="financial-growth-grid">
          <div className="financial-growth-card">
            <span className="financial-growth-label">Last 30 Days Revenue</span>
            <span className="financial-growth-value financial-growth-value--accent">
              {formatCurrency(d.revenue_last_30 ?? 0)}
            </span>
          </div>
          <div className="financial-growth-card">
            <span className="financial-growth-label">Growth %</span>
            <span
              className={`financial-growth-value financial-growth-value--growth ${
                Number(d.growth_percentage ?? 0) >= 0
                  ? 'financial-growth-value--positive'
                  : 'financial-growth-value--negative'
              }`}
            >
              {Number(d.growth_percentage ?? 0) >= 0 ? '↑' : '↓'}{' '}
              {Math.abs(Number(d.growth_percentage ?? 0)).toFixed(1)}%
            </span>
          </div>
          <div className="financial-growth-card">
            <span className="financial-growth-label">Projected Annual Revenue</span>
            <span className="financial-growth-value financial-growth-value--large">
              {formatCurrency(d.projected_annual_revenue ?? 0)}
            </span>
          </div>
          <div className="financial-growth-card">
            <span className="financial-growth-label">Projected Annual Commission</span>
            <span className="financial-growth-value financial-growth-value--large financial-growth-value--neon">
              {formatCurrency(d.projected_annual_commission ?? 0)}
            </span>
          </div>
        </div>
      </section>

      <div className="financial-tables-wrap">
        <section className="financial-section" aria-labelledby="top-orgs-title">
          <h2 id="top-orgs-title" className="financial-section-title">Top Organizations</h2>
          <div className="financial-table-card border-glow">
            {topOrgs.length === 0 ? (
              <p className="financial-empty">No organization data yet.</p>
            ) : (
              <div className="financial-table-wrap">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th className="financial-th-num">Revenue</th>
                      <th className="financial-th-num">Commission</th>
                      <th className="financial-th-num">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topOrgs.map((row) => (
                      <tr key={row.id ?? row.name}>
                        <td className="financial-td-name">{row.name}</td>
                        <td className="financial-td-num text-glow-primary">{formatCurrency(row.revenue)}</td>
                        <td className="financial-td-num financial-td-neon">{formatCurrency(row.commission)}</td>
                        <td className="financial-td-num">{row.orders ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="financial-section" aria-labelledby="top-stands-title">
          <h2 id="top-stands-title" className="financial-section-title">Top Stands</h2>
          <div className="financial-stands-card border-glow">
            {topStands.length === 0 ? (
              <p className="financial-empty">No stand data yet.</p>
            ) : (
              <ul className="financial-stands-list">
                {topStands.map((row, i) => (
                  <li key={row.id ?? i} className="financial-stands-item">
                    <div className="financial-stands-item-header">
                      <span className="financial-stands-rank">{i + 1}</span>
                      <span className="financial-stands-name">{row.name}</span>
                      <span className="financial-stands-revenue">{formatCurrency(row.revenue)}</span>
                    </div>
                    <div className="financial-stands-meta">
                      <span className="financial-stands-orders">{row.orders ?? 0} orders</span>
                    </div>
                    <div className="financial-stands-progress-wrap">
                      <div
                        className="financial-stands-progress-bar"
                        style={{
                          width: `${Math.min(100, (Number(row.revenue) / maxStandRevenue) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="financial-section financial-chart-section" aria-labelledby="monthly-title">
        <h2 id="monthly-title" className="financial-section-title">Monthly Revenue</h2>
        <div className="financial-chart-card border-glow">
          {monthly.length === 0 ? (
            <p className="financial-empty">No monthly data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={monthly}
                margin={{ top: 16, right: 12, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="financial-chart-grid" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v)}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  width={56}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', stroke: 'rgba(255,255,255,0.08)' }} />
                <Legend wrapperStyle={{ paddingTop: 8 }} className="financial-chart-legend" />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#00FF88"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#00FF88', stroke: 'rgba(0,255,136,0.5)' }}
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  name="Commission"
                  stroke="#FF3366"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#FF3366', stroke: 'rgba(255,51,102,0.5)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  )
}
