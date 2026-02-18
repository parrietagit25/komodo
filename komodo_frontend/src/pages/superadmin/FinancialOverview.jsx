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
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { getFinancialOverview } from '../../services/dashboardService'
import { generateDemoActivity, flushDemoData, flushAllDemoData } from '../../services/demoService'
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

function ChartTooltip({ active, payload, label, t, formatMonth, formatCurrency }) {
  if (!active || !payload?.length || !label) return null
  const item = payload[0]?.payload
  if (!item) return null
  return (
    <div className="financial-tooltip">
      <div className="financial-tooltip-month">{formatMonth(label)}</div>
      <div className="financial-tooltip-row" style={{ '--accent': '#00FF88' }}>
        <span>{t('financial.revenue')}</span>
        <span>{formatCurrency(item.revenue)}</span>
      </div>
      <div className="financial-tooltip-row" style={{ '--accent': '#FF3366' }}>
        <span>{t('financial.commission')}</span>
        <span>{formatCurrency(item.commission)}</span>
      </div>
    </div>
  )
}

const KPI_CARDS = [
  { key: 'total_revenue', labelKey: 'financial.totalRevenue', valueKey: 'total_revenue', format: formatCurrency, neon: true },
  { key: 'total_commission', labelKey: 'financial.totalCommission', valueKey: 'total_commission', format: formatCurrency, neon: true },
  { key: 'total_paid_to_stands', labelKey: 'financial.paidToStands', valueKey: 'total_paid_to_stands', format: formatCurrency, neon: true },
  { key: 'total_orders', labelKey: 'financial.totalOrders', valueKey: 'total_orders', format: (v) => (v ?? 0).toLocaleString(), neon: false },
  { key: 'active_users', labelKey: 'financial.activeUsers', valueKey: 'active_users', format: (v) => (v ?? 0).toLocaleString(), neon: false },
  { key: 'avg_ticket', labelKey: 'financial.avgTicket', valueKey: 'avg_ticket', format: formatCurrency, neon: false },
]

export default function FinancialOverview() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [flushLoading, setFlushLoading] = useState(false)
  const [flushAllLoading, setFlushAllLoading] = useState(false)

  const fetchData = useCallback(() => {
    return getFinancialOverview()
      .then((res) => setData(res || {}))
      .catch((err) => setError(err.response?.data?.detail || err.message || t('financial.failedLoad')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    let cancelled = false
    getFinancialOverview()
      .then((res) => {
        if (!cancelled) setData(res || {})
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || err.message || t('financial.failedLoad'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [t])

  const handleGenerateDemo = useCallback(async () => {
    if (demoLoading) return
    setDemoLoading(true)
    const loadingId = showLoading(t('financial.generating'))
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
      showError(err.response?.data?.detail || err.message || t('financial.demoFailed'))
    } finally {
      setDemoLoading(false)
    }
  }, [demoLoading, fetchData, t])

  const handleFlushDemo = useCallback(async () => {
    if (flushLoading) return
    setFlushLoading(true)
    try {
      const res = await flushDemoData()
      const n = res?.orders_deleted ?? 0
      showSuccess(n > 0 ? `${t('financial.flushDemoSuccess')} (${n})` : t('financial.flushDemoSuccess'))
      await fetchData()
    } catch (err) {
      showError(err.response?.data?.detail || err.message || t('financial.flushDemoFailed'))
    } finally {
      setFlushLoading(false)
    }
  }, [flushLoading, fetchData, t])

  const handleFlushAll = useCallback(async () => {
    if (flushAllLoading) return
    if (!window.confirm(t('financial.flushAllConfirm'))) return
    setFlushAllLoading(true)
    try {
      const res = await flushAllDemoData()
      const o = res?.orders_deleted ?? 0
      const tx = res?.transactions_deleted ?? 0
      showSuccess(t('financial.flushAllSuccess') + ` (${o} orders, ${tx} transactions)`)
      await fetchData()
    } catch (err) {
      showError(err.response?.data?.detail || err.message || t('financial.flushAllFailed'))
    } finally {
      setFlushAllLoading(false)
    }
  }, [flushAllLoading, fetchData, t])

  if (loading) {
    return (
      <div className="financial-overview-page financial-overview-page--enter">
        <header className="financial-header">
          <div className="financial-header-top">
            <div>
              <h1 className="financial-title text-glow-primary">{t('financial.title')}</h1>
              <p className="financial-subtitle">{t('financial.subtitle')}</p>
            </div>
            {user?.role === ROLES.SUPERADMIN && (
              <div className="financial-demo-actions">
                <button type="button" className="financial-demo-btn" disabled aria-busy>
                  <span className="financial-demo-btn-text">{t('financial.generateDemo')}</span>
                </button>
                <button type="button" className="financial-demo-btn financial-flush-btn" disabled aria-busy>
                  <span className="financial-demo-btn-text">{t('financial.flushDemo')}</span>
                </button>
                <button type="button" className="financial-demo-btn financial-flush-all-btn" disabled aria-busy>
                  <span className="financial-demo-btn-text">{t('financial.flushAll')}</span>
                </button>
              </div>
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
              <h1 className="financial-title text-glow-primary">{t('financial.title')}</h1>
              <p className="financial-subtitle">{t('financial.subtitle')}</p>
            </div>
            {user?.role === ROLES.SUPERADMIN && (
              <div className="financial-demo-actions">
                <button
                  type="button"
                  className="financial-demo-btn"
                  onClick={handleGenerateDemo}
                  disabled={demoLoading || flushLoading}
                  aria-busy={demoLoading}
                >
                  <span className="financial-demo-btn-text">{demoLoading ? t('financial.generating') : t('financial.generateDemo')}</span>
                </button>
                <button
                  type="button"
                  className="financial-demo-btn financial-flush-btn"
                  onClick={handleFlushDemo}
                  disabled={demoLoading || flushLoading || flushAllLoading}
                  aria-busy={flushLoading}
                >
                  <span className="financial-demo-btn-text">{t('financial.flushDemo')}</span>
                </button>
                <button
                  type="button"
                  className="financial-demo-btn financial-flush-all-btn"
                  onClick={handleFlushAll}
                  disabled={demoLoading || flushLoading || flushAllLoading}
                  aria-busy={flushAllLoading}
                >
                  <span className="financial-demo-btn-text">{t('financial.flushAll')}</span>
                </button>
              </div>
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
            <h1 className="financial-title text-glow-primary">{t('financial.title')}</h1>
            <p className="financial-subtitle">{t('financial.subtitle')}</p>
          </div>
          {user?.role === ROLES.SUPERADMIN && (
            <div className="financial-demo-actions">
              <button
                type="button"
                className="financial-demo-btn"
                onClick={handleGenerateDemo}
                disabled={demoLoading || flushLoading || flushAllLoading}
                aria-busy={demoLoading}
              >
                <span className="financial-demo-btn-text">{demoLoading ? t('financial.generating') : t('financial.generateDemo')}</span>
              </button>
              <button
                type="button"
                className="financial-demo-btn financial-flush-btn"
                onClick={handleFlushDemo}
                disabled={demoLoading || flushLoading || flushAllLoading}
                aria-busy={flushLoading}
              >
                <span className="financial-demo-btn-text">{t('financial.flushDemo')}</span>
              </button>
              <button
                type="button"
                className="financial-demo-btn financial-flush-all-btn"
                onClick={handleFlushAll}
                disabled={demoLoading || flushLoading || flushAllLoading}
                aria-busy={flushAllLoading}
              >
                <span className="financial-demo-btn-text">{t('financial.flushAll')}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="financial-kpi-section" aria-label={t('financial.totalRevenue')}>
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
              <span className="financial-kpi-label">{t(card.labelKey)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="financial-section financial-growth-section" aria-labelledby="growth-title">
        <h2 id="growth-title" className="financial-section-title">📈 {t('financial.growthProjection')}</h2>
        <div className="financial-growth-grid">
          <div className="financial-growth-card">
            <span className="financial-growth-label">{t('financial.last30DaysRevenue')}</span>
            <span className="financial-growth-value financial-growth-value--accent">
              {formatCurrency(d.revenue_last_30 ?? 0)}
            </span>
          </div>
          <div className="financial-growth-card">
            <span className="financial-growth-label">{t('financial.growthPct')}</span>
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
            <span className="financial-growth-label">{t('financial.projectedAnnualRevenue')}</span>
            <span className="financial-growth-value financial-growth-value--large">
              {formatCurrency(d.projected_annual_revenue ?? 0)}
            </span>
          </div>
          <div className="financial-growth-card">
            <span className="financial-growth-label">{t('financial.projectedAnnualCommission')}</span>
            <span className="financial-growth-value financial-growth-value--large financial-growth-value--neon">
              {formatCurrency(d.projected_annual_commission ?? 0)}
            </span>
          </div>
        </div>
      </section>

      <div className="financial-tables-wrap">
        <section className="financial-section" aria-labelledby="top-orgs-title">
          <h2 id="top-orgs-title" className="financial-section-title">{t('financial.topOrgs')}</h2>
          <div className="financial-table-card border-glow">
            {topOrgs.length === 0 ? (
              <p className="financial-empty">{t('financial.noOrgData')}</p>
            ) : (
              <div className="financial-table-wrap">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>{t('financial.name')}</th>
                      <th className="financial-th-num">{t('financial.revenue')}</th>
                      <th className="financial-th-num">{t('financial.commission')}</th>
                      <th className="financial-th-num">{t('financial.totalOrders')}</th>
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
          <h2 id="top-stands-title" className="financial-section-title">{t('financial.topStands')}</h2>
          <div className="financial-stands-card border-glow">
            {topStands.length === 0 ? (
              <p className="financial-empty">{t('financial.noStandData')}</p>
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
                      <span className="financial-stands-orders">{row.orders ?? 0} {t('financial.ordersCount')}</span>
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
        <h2 id="monthly-title" className="financial-section-title">{t('financial.monthlyRevenue')}</h2>
        <div className="financial-chart-card border-glow">
          {monthly.length === 0 ? (
            <p className="financial-empty">{t('financial.noMonthlyData')}</p>
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
                <Tooltip content={<ChartTooltip t={t} formatMonth={formatMonth} formatCurrency={formatCurrency} />} cursor={{ fill: 'rgba(255,255,255,0.03)', stroke: 'rgba(255,255,255,0.08)' }} />
                <Legend wrapperStyle={{ paddingTop: 8 }} className="financial-chart-legend" />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name={t('financial.revenue')}
                  stroke="#00FF88"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#00FF88', stroke: 'rgba(0,255,136,0.5)' }}
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  name={t('financial.commission')}
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
