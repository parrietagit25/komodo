import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
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
  const { t } = useLanguage()
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
        showError(err.response?.data?.detail || err.message || t('audit.failedLoadReconcile'))
        setReconcileData(null)
      })
      .finally(() => setReconcileLoading(false))
  }, [t])

  const fetchBalance = useCallback(() => {
    return getBalance()
      .then(setBalanceData)
      .catch((err) => {
        showError(err.response?.data?.detail || err.message || t('audit.failedLoadBalance'))
        setBalanceData(null)
      })
      .finally(() => setBalanceLoading(false))
  }, [t])

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
        showSuccess(t('audit.reconcileCompleteNoIssues'))
      } else {
        showSuccess(t('audit.reconcileCompleteWithIssues').replace('{{count}}', issues))
      }
    } catch (err) {
      showError(err.response?.data?.detail || err.message || t('audit.reconcileFailed'))
    } finally {
      setRunReconcileLoading(false)
    }
  }, [runReconcileLoading, t])

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
      showSuccess(t('audit.csvExported'))
    } catch (err) {
      showError(err.response?.data?.detail || err.message || t('audit.exportFailed'))
    } finally {
      setExportLoading(false)
    }
  }, [exportLoading, startDate, endDate, t])

  const inconsistencies = (reconcileData?.details || []).filter((d) => d.is_valid === false)
  const hasBalanceError = balanceData && Number(balanceData.difference) !== 0

  return (
    <div className="audit-dashboard-page audit-dashboard-page--enter">
      <header className="audit-dashboard-header">
        <h1 className="audit-dashboard-title text-glow-primary">🛡 {t('audit.title')}</h1>
        <p className="audit-dashboard-subtitle">{t('audit.subtitle')}</p>
      </header>

      <div className="audit-dashboard-grid">
        <Card className="audit-card audit-card--reconcile">
          <CardHeader>
            <CardTitle>{t('audit.reconciliationSummary')}</CardTitle>
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
                    <span className="audit-stat-label">{t('audit.totalOrdersChecked')}</span>
                  </div>
                  <div className="audit-stat">
                    <span className="audit-stat-value audit-stat-value--accent">
                      {formatNumber(reconcileData.inconsistencies_found)}
                    </span>
                    <span className="audit-stat-label">{t('audit.inconsistenciesFound')}</span>
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
                    {(reconcileData.inconsistencies_found ?? 0) === 0 ? `✔ ${t('audit.clean')}` : `⚠ ${t('audit.issues')}`}
                  </span>
                </div>
                <Button
                  className="audit-btn-reconcile"
                  onClick={handleRunReconciliation}
                  loading={runReconcileLoading}
                  disabled={runReconcileLoading}
                >
                  {t('audit.runReconciliation')}
                </Button>
              </>
            ) : (
              <p className="audit-empty">{t('audit.noReconcileData')}</p>
            )}
          </CardBody>
        </Card>

        <Card className={`audit-card audit-card--balance ${hasBalanceError ? 'audit-card--balance-error' : 'audit-card--balance-ok'}`}>
          <CardHeader>
            <CardTitle>{t('audit.globalBalanceVerification')}</CardTitle>
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
                  <span className="audit-balance-label">{t('audit.walletTotal')}</span>
                  <span className="audit-balance-value">{formatNumber(balanceData.wallet_total)}</span>
                </div>
                <div className="audit-balance-row">
                  <span className="audit-balance-label">{t('audit.ledgerTotal')}</span>
                  <span className="audit-balance-value">{formatNumber(balanceData.ledger_total)}</span>
                </div>
                <div className="audit-balance-row audit-balance-row--diff">
                  <span className="audit-balance-label">{t('audit.difference')}</span>
                  <span className={`audit-balance-value ${hasBalanceError ? 'audit-balance-value--error' : 'audit-balance-value--ok'}`}>
                    {formatNumber(balanceData.difference)}
                  </span>
                </div>
                {hasBalanceError && (
                  <p className="audit-warning-msg">{t('audit.ledgerImbalance')}</p>
                )}
              </>
            ) : (
              <p className="audit-empty">{t('audit.unableToLoadBalance')}</p>
            )}
          </CardBody>
        </Card>
      </div>

      {(reconcileData?.inconsistencies_found ?? 0) > 0 && (
        <section className="audit-section audit-section--table">
          <h2 className="audit-section-title">{t('audit.inconsistencies')}</h2>
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>{t('audit.orderId')}</th>
                  <th>{t('audit.errorType')}</th>
                  <th>{t('audit.details')}</th>
                </tr>
              </thead>
              <tbody>
                {inconsistencies.map((row, i) => (
                  <tr key={`${row.order_id}-${i}`}>
                    <td className="audit-td-id">{row.order_id}</td>
                    <td className="audit-td-type">{t('audit.validation')}</td>
                    <td className="audit-td-details">{(row.errors || []).join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="audit-section audit-section--export">
        <h2 className="audit-section-title">{t('audit.exportFinancialData')}</h2>
        <Card className="audit-card audit-card--export">
          <CardBody>
            <div className="audit-export-row">
              <label className="audit-export-label">
                <span>{t('audit.startDate')}</span>
                <input
                  type="date"
                  className="audit-export-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="audit-export-label">
                <span>{t('audit.endDate')}</span>
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
              {t('audit.exportCsv')}
            </Button>
          </CardBody>
        </Card>
      </section>
    </div>
  )
}
