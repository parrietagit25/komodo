import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardBody } from '../../components/Card'
import { Button } from '../../components/Button'
import { getReconcile, getBalance, exportCsv } from '../../services/auditService'
import { showSuccess, showError } from '../../utils/toast'
import './AuditDashboard.css'

const formatNumber = (value) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0))

export default function AuditDashboard() {
  const [reconcileData, setReconcileData] = useState(null)
  const [balanceData, setBalanceData] = useState(null)
  const [reconcileLoading, setReconcileLoading] = useState(true)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [runReconcileLoading, setRunReconcileLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchReconcile = useCallback(() => {
    return getReconcile()
      .then(setReconcileData)
      .catch((err) => {
        showError(err.response?.data?.detail || err.message || 'Failed to load reconciliation')
        setReconcileData(null)
      })
      .finally(() => setReconcileLoading(false))
  }, [])

  const fetchBalance = useCallback(() => {
    return getBalance()
      .then(setBalanceData)
      .catch((err) => {
        showError(err.response?.data?.detail || err.message || 'Failed to load balance')
        setBalanceData(null)
      })
      .finally(() => setBalanceLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    setReconcileLoading(true)
    setBalanceLoading(true)
    getReconcile()
      .then((data) => { if (!cancelled) setReconcileData(data) })
      .catch(() => { if (!cancelled) setReconcileData(null) })
      .finally(() => { if (!cancelled) setReconcileLoading(false) })
    getBalance()
      .then((data) => { if (!cancelled) setBalanceData(data) })
      .catch(() => { if (!cancelled) setBalanceData(null) })
      .finally(() => { if (!cancelled) setBalanceLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleRunReconciliation = useCallback(async () => {
    if (runReconcileLoading) return
    setRunReconcileLoading(true)
    try {
      const data = await getReconcile()
      setReconcileData(data)
      const issues = data?.inconsistencies_found ?? 0
      if (issues === 0) {
        showSuccess('Reconciliation complete. No inconsistencies found.')
      } else {
        showSuccess(`Reconciliation complete. ${issues} inconsistency(ies) found.`)
      }
    } catch (err) {
      showError(err.response?.data?.detail || err.message || 'Reconciliation failed')
    } finally {
      setRunReconcileLoading(false)
    }
  }, [runReconcileLoading])

  const handleExportCsv = useCallback(async () => {
    if (exportLoading) return
    setExportLoading(true)
    try {
      const blob = await exportCsv(startDate || undefined, endDate || undefined)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'financial_audit_export.csv'
      a.click()
      URL.revokeObjectURL(url)
      showSuccess('CSV exported successfully')
    } catch (err) {
      showError(err.response?.data?.detail || err.message || 'Export failed')
    } finally {
      setExportLoading(false)
    }
  }, [exportLoading, startDate, endDate])

  const inconsistencies = (reconcileData?.details || []).filter((d) => d.is_valid === false)
  const hasBalanceError = balanceData && Number(balanceData.difference) !== 0

  return (
    <div className="audit-dashboard-page audit-dashboard-page--enter">
      <header className="audit-dashboard-header">
        <h1 className="audit-dashboard-title text-glow-primary">🛡 Financial Audit</h1>
        <p className="audit-dashboard-subtitle">Verify financial integrity and ledger balance</p>
      </header>

      <div className="audit-dashboard-grid">
        {/* 1. Reconciliation Summary Card */}
        <Card className="audit-card audit-card--reconcile">
          <CardHeader>
            <CardTitle>Reconciliation Summary</CardTitle>
          </CardHeader>
          <CardBody>
            {reconcileLoading ? (
              <div className="audit-card-skeleton">
                <span className="skeleton-line" style={{ width: '60%' }} />
                <span className="skeleton-line" style={{ width: '40%' }} />
              </div>
            ) : reconcileData ? (
              <>
                <div className="audit-stats-row">
                  <div className="audit-stat">
                    <span className="audit-stat-value">{formatNumber(reconcileData.total_orders_checked)}</span>
                    <span className="audit-stat-label">Total Orders Checked</span>
                  </div>
                  <div className="audit-stat">
                    <span className="audit-stat-value audit-stat-value--accent">
                      {formatNumber(reconcileData.inconsistencies_found)}
                    </span>
                    <span className="audit-stat-label">Inconsistencies Found</span>
                  </div>
                </div>
                <div className="audit-status-row">
                  <span
                    className={`audit-badge ${
                      (reconcileData.inconsistencies_found ?? 0) === 0
                        ? 'audit-badge--success'
                        : 'audit-badge--warning'
                    }`}
                  >
                    {(reconcileData.inconsistencies_found ?? 0) === 0 ? '✔ Clean' : '⚠ Issues'}
                  </span>
                </div>
                <Button
                  className="audit-btn-reconcile"
                  onClick={handleRunReconciliation}
                  loading={runReconcileLoading}
                  disabled={runReconcileLoading}
                >
                  Run Reconciliation
                </Button>
              </>
            ) : (
              <p className="audit-empty">No reconciliation data. Run reconciliation.</p>
            )}
          </CardBody>
        </Card>

        {/* 2. Global Balance Verification Card */}
        <Card className={`audit-card audit-card--balance ${hasBalanceError ? 'audit-card--balance-error' : 'audit-card--balance-ok'}`}>
          <CardHeader>
            <CardTitle>Global Balance Verification</CardTitle>
          </CardHeader>
          <CardBody>
            {balanceLoading ? (
              <div className="audit-card-skeleton">
                <span className="skeleton-line" style={{ width: '70%' }} />
                <span className="skeleton-line" style={{ width: '50%' }} />
              </div>
            ) : balanceData ? (
              <>
                <div className="audit-balance-row">
                  <span className="audit-balance-label">Wallet Total</span>
                  <span className="audit-balance-value">{formatNumber(balanceData.wallet_total)}</span>
                </div>
                <div className="audit-balance-row">
                  <span className="audit-balance-label">Ledger Total</span>
                  <span className="audit-balance-value">{formatNumber(balanceData.ledger_total)}</span>
                </div>
                <div className="audit-balance-row audit-balance-row--diff">
                  <span className="audit-balance-label">Difference</span>
                  <span className={`audit-balance-value ${hasBalanceError ? 'audit-balance-value--error' : 'audit-balance-value--ok'}`}>
                    {formatNumber(balanceData.difference)}
                  </span>
                </div>
                {hasBalanceError && (
                  <p className="audit-warning-msg">Ledger imbalance detected</p>
                )}
              </>
            ) : (
              <p className="audit-empty">Unable to load balance data.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 3. Inconsistencies Table */}
      {(reconcileData?.inconsistencies_found ?? 0) > 0 && (
        <section className="audit-section audit-section--table">
          <h2 className="audit-section-title">Inconsistencies</h2>
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Error Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {inconsistencies.map((row, i) => (
                  <tr key={`${row.order_id}-${i}`}>
                    <td className="audit-td-id">{row.order_id}</td>
                    <td className="audit-td-type">Validation</td>
                    <td className="audit-td-details">{(row.errors || []).join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. Export Financial Data */}
      <section className="audit-section audit-section--export">
        <h2 className="audit-section-title">Export Financial Data</h2>
        <Card className="audit-card audit-card--export">
          <CardBody>
            <div className="audit-export-row">
              <label className="audit-export-label">
                <span>Start Date</span>
                <input
                  type="date"
                  className="audit-export-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="audit-export-label">
                <span>End Date</span>
                <input
                  type="date"
                  className="audit-export-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
            <Button
              onClick={handleExportCsv}
              loading={exportLoading}
              disabled={exportLoading}
              className="audit-btn-export"
            >
              Export CSV
            </Button>
          </CardBody>
        </Card>
      </section>
    </div>
  )
}
