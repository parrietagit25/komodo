import { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { Card, CardHeader, CardTitle, CardBody } from '../../components/Card'
import { getInvestorReadiness } from '../../services/dashboardService'
import { showError } from '../../utils/toast'
import './InvestorReadiness.css'

const NEON_GREEN = '#00FF88'
const PINK = '#FF3366'
const CYAN = '#00D4FF'
const AMBER = '#F59E0B'

function getScoreColor(score) {
  if (score < 50) return PINK
  if (score < 70) return AMBER
  if (score < 85) return CYAN
  return NEON_GREEN
}

export default function InvestorReadiness() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getInvestorReadiness()
      .then((res) => {
        if (!cancelled) setData(res || {})
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err.response?.data?.detail || err.message || t('investorReadiness.failedLoad')
          setError(msg)
          showError(msg)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [t])

  if (loading) {
    return (
      <div className="investor-readiness-page investor-readiness-page--enter">
        <header className="investor-readiness-header">
          <h1 className="investor-readiness-title text-glow-primary">💼 {t('investorReadiness.title')}</h1>
          <p className="investor-readiness-subtitle">{t('investorReadiness.loading')}</p>
        </header>
        <div className="investor-readiness-loading" aria-hidden>
          <div className="loader neon-loader" />
          <span>{t('investorReadiness.loading')}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="investor-readiness-page investor-readiness-page--enter">
        <header className="investor-readiness-header">
          <h1 className="investor-readiness-title text-glow-primary">💼 {t('investorReadiness.title')}</h1>
        </header>
        <div className="investor-readiness-error" role="alert">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const overview = data?.overview ?? {}
  const business = data?.business_model ?? {}
  const risk = data?.risk_assessment ?? {}
  const readiness = data?.readiness_score ?? {}
  const score = readiness.score ?? 0
  const level = readiness.level ?? '—'
  const scoreColor = getScoreColor(score)

  return (
    <div className="investor-readiness-page investor-readiness-page--enter">
      <header className="investor-readiness-header">
        <h1 className="investor-readiness-title text-glow-primary">💼 {t('investorReadiness.title')}</h1>
        <p className="investor-readiness-subtitle">{t('investorReadiness.subtitle')}</p>
      </header>

      <section className="investor-readiness-score-section" aria-label={t('investorReadiness.scoreLabel')}>
        <Card className="investor-readiness-score-card">
          <CardBody>
            <h2 className="investor-readiness-score-label">{t('investorReadiness.scoreLabel')}</h2>
            <div className="investor-readiness-score-badge" style={{ '--score-color': scoreColor }}>
              {score}
            </div>
            <p className="investor-readiness-score-level" style={{ color: scoreColor }}>{level}</p>
            <p className="investor-readiness-score-formula">{t('investorReadiness.formula')}</p>
          </CardBody>
        </Card>
      </section>

      <section className="investor-readiness-overview" aria-label={t('investorReadiness.overviewTitle')}>
        <h2 className="investor-readiness-section-title">{t('investorReadiness.overviewTitle')}</h2>
        <div className="investor-readiness-kpi-grid">
          <Card className="investor-readiness-kpi-card">
            <CardBody>
              <div className="investor-readiness-kpi-value">{overview.product_maturity_pct ?? 0}%</div>
              <div className="investor-readiness-kpi-label">{t('investorReadiness.productMaturity')}</div>
            </CardBody>
          </Card>
          <Card className="investor-readiness-kpi-card">
            <CardBody>
              <div className="investor-readiness-kpi-value investor-readiness-kpi-value--accent">
                {overview.financial_integrity_status ?? '—'}
              </div>
              <div className="investor-readiness-kpi-label">{t('investorReadiness.financialIntegrity')}</div>
            </CardBody>
          </Card>
          <Card className="investor-readiness-kpi-card">
            <CardBody>
              <div className="investor-readiness-kpi-value">
                {overview.concurrency_safe_engine ? t('projectStatus.yes') : t('projectStatus.no')}
              </div>
              <div className="investor-readiness-kpi-label">{t('investorReadiness.concurrencySafe')}</div>
            </CardBody>
          </Card>
          <Card className="investor-readiness-kpi-card">
            <CardBody>
              <div className="investor-readiness-kpi-value">
                {overview.audit_system_active ? t('projectStatus.yes') : t('projectStatus.no')}
              </div>
              <div className="investor-readiness-kpi-label">{t('investorReadiness.auditActive')}</div>
            </CardBody>
          </Card>
          <Card className="investor-readiness-kpi-card">
            <CardBody>
              <div className="investor-readiness-kpi-value">{overview.deployment_status ?? '—'}</div>
              <div className="investor-readiness-kpi-label">{t('investorReadiness.deploymentStatus')}</div>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="investor-readiness-business" aria-label={t('investorReadiness.businessModelTitle')}>
        <h2 className="investor-readiness-section-title">{t('investorReadiness.businessModelTitle')}</h2>
        <Card>
          <CardBody>
            <dl className="investor-readiness-dl">
              <dt>{t('investorReadiness.monetizationModel')}</dt>
              <dd>{business.monetization_model ?? '—'}</dd>
              <dt>{t('investorReadiness.revenueEngine')}</dt>
              <dd>{business.revenue_engine ?? '—'}</dd>
              <dt>{t('investorReadiness.scalability')}</dt>
              <dd>{business.scalability ?? '—'}</dd>
              <dt>{t('investorReadiness.expansionReadiness')}</dt>
              <dd>{business.expansion_readiness ?? '—'}</dd>
            </dl>
          </CardBody>
        </Card>
      </section>

      <section className="investor-readiness-risk" aria-label={t('investorReadiness.riskTitle')}>
        <h2 className="investor-readiness-section-title">{t('investorReadiness.riskTitle')}</h2>
        <div className="investor-readiness-risk-grid">
          <Card className="investor-readiness-risk-card">
            <CardBody>
              <div className="investor-readiness-risk-label">{t('investorReadiness.financialRisk')}</div>
              <div className={`investor-readiness-risk-value investor-readiness-risk--${(risk.financial_risk ?? '').toLowerCase().replace(/\s/g, '-')}`}>
                {risk.financial_risk ?? '—'}
              </div>
            </CardBody>
          </Card>
          <Card className="investor-readiness-risk-card">
            <CardBody>
              <div className="investor-readiness-risk-label">{t('investorReadiness.operationalRisk')}</div>
              <div className={`investor-readiness-risk-value investor-readiness-risk--${(risk.operational_risk ?? '').toLowerCase().replace(/\s/g, '-')}`}>
                {risk.operational_risk ?? '—'}
              </div>
            </CardBody>
          </Card>
          <Card className="investor-readiness-risk-card">
            <CardBody>
              <div className="investor-readiness-risk-label">{t('investorReadiness.technicalDebtRisk')}</div>
              <div className={`investor-readiness-risk-value investor-readiness-risk--${(risk.technical_debt_risk ?? '').toLowerCase().replace(/\s/g, '-')}`}>
                {risk.technical_debt_risk ?? '—'}
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {readiness.breakdown && (
        <section className="investor-readiness-breakdown" aria-label={t('investorReadiness.breakdownTitle')}>
          <h2 className="investor-readiness-section-title">{t('investorReadiness.breakdownTitle')}</h2>
          <Card>
            <CardBody>
              <div className="investor-readiness-breakdown-grid">
                <div className="investor-readiness-breakdown-item">
                  <span className="investor-readiness-breakdown-label">{t('investorReadiness.breakdownProduct')}</span>
                  <span className="investor-readiness-breakdown-value">{readiness.breakdown.product_maturity ?? 0}</span>
                </div>
                <div className="investor-readiness-breakdown-item">
                  <span className="investor-readiness-breakdown-label">{t('investorReadiness.breakdownFinancial')}</span>
                  <span className="investor-readiness-breakdown-value">{readiness.breakdown.financial_robustness ?? 0}</span>
                </div>
                <div className="investor-readiness-breakdown-item">
                  <span className="investor-readiness-breakdown-label">{t('investorReadiness.breakdownDeployment')}</span>
                  <span className="investor-readiness-breakdown-value">{readiness.breakdown.deployment_readiness ?? 0}</span>
                </div>
                <div className="investor-readiness-breakdown-item">
                  <span className="investor-readiness-breakdown-label">{t('investorReadiness.breakdownMonetization')}</span>
                  <span className="investor-readiness-breakdown-value">{readiness.breakdown.monetization_clarity ?? 0}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>
      )}
    </div>
  )
}
