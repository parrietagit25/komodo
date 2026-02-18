import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { MetricCards } from '../components/MetricCards'
import SalesChart from '../components/SalesChart'
import { getStandAdminMetrics } from '../services/dashboardService'
import './Dashboard.css'

export default function StandDashboard() {
  const { t } = useLanguage()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getStandAdminMetrics()
      .then((data) => {
        if (!cancelled) setMetrics(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || err.message || t('dashboard.failedMetrics'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [t])

  return (
    <div className="dashboard page-enter page-enter-active">
      <header className="dashboard-header">
        <h1 className="dashboard-title text-glow-primary">{t('dashboard.standAdminTitle')}</h1>
        <p className="dashboard-subtitle">{t('dashboard.standAdminSubtitle')}</p>
      </header>

      <MetricCards
        totalSales={metrics?.total_sales}
        commissionEarned={null}
        netReceived={metrics?.total_net_received}
        ordersToday={metrics?.orders_today != null ? Number(metrics.orders_today) : null}
        showCommission={true}
        loading={loading}
        error={error}
      />

      <SalesChart />
    </div>
  )
}
