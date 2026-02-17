import { useState, useEffect } from 'react'
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
import { getSalesChart } from '../services/dashboardService'
import './SalesChart.css'

const COLORS = {
  total_sales: '#00FF88',
  commission: '#FF3366',
  net: '#00D4FF',
}

const formatDate = (str) => {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const formatCurrency = (value) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value))

const LINES = [
  { dataKey: 'total_sales', name: 'Total Sales', color: COLORS.total_sales, dotClass: 'sales-chart-dot-sales' },
  { dataKey: 'commission', name: 'Commission', color: COLORS.commission, dotClass: 'sales-chart-dot-commission' },
  { dataKey: 'net', name: 'Net', color: COLORS.net, dotClass: 'sales-chart-dot-net' },
]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length || !label) return null
  const item = payload[0]?.payload
  if (!item) return null
  return (
    <div className="sales-chart-tooltip">
      <div className="sales-chart-tooltip-date">{formatDate(label)}</div>
      <div className="sales-chart-tooltip-row" style={{ '--line-color': COLORS.total_sales }}>
        <span>Total Sales</span>
        <span>{formatCurrency(item.total_sales)}</span>
      </div>
      <div className="sales-chart-tooltip-row" style={{ '--line-color': COLORS.commission }}>
        <span>Commission</span>
        <span>{formatCurrency(item.commission)}</span>
      </div>
      <div className="sales-chart-tooltip-row" style={{ '--line-color': COLORS.net }}>
        <span>Net</span>
        <span>{formatCurrency(item.net)}</span>
      </div>
    </div>
  )
}

function SalesChartSkeleton() {
  return (
    <div className="sales-chart-wrapper sales-chart-skeleton" aria-hidden>
      <div className="sales-chart-skeleton-title" />
      <div className="sales-chart-skeleton-chart">
        <div className="sales-chart-skeleton-line" />
      </div>
    </div>
  )
}

function SalesChartEmpty() {
  return (
    <div className="sales-chart-wrapper sales-chart-empty">
      <h3 className="sales-chart-title">Sales (last 7 days)</h3>
      <p className="sales-chart-empty-message">No sales data in the last 7 days.</p>
    </div>
  )
}

export default function SalesChart() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getSalesChart()
      .then((res) => {
        if (!cancelled) setData(Array.isArray(res) ? res : [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || err.message || 'Failed to load chart')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) return <SalesChartSkeleton />
  if (error) {
    return (
      <div className="sales-chart-wrapper sales-chart-error" role="alert">
        <p>{error}</p>
      </div>
    )
  }

  const hasData = data && data.length > 0 && data.some((d) => Number(d.total_sales) > 0 || Number(d.commission) > 0 || Number(d.net) > 0)
  if (!hasData) return <SalesChartEmpty />

  return (
    <div className="sales-chart-wrapper">
      <h3 className="sales-chart-title">Sales (last 7 days)</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={data}
          margin={{ top: 16, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="sales-chart-grid" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
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
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
          <Legend wrapperStyle={{ paddingTop: 8 }} className="sales-chart-legend" />
          {LINES.map(({ dataKey, name, color, dotClass }) => (
            <Line
              key={dataKey}
              type="monotone"
              dataKey={dataKey}
              name={name}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, stroke: 'transparent', r: 4 }}
              activeDot={{
                r: 6,
                fill: color,
                stroke: color,
                strokeWidth: 2,
                className: dotClass,
              }}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
