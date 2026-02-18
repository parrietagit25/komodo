import { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { Card, CardHeader, CardTitle, CardBody } from '../../components/Card'
import { getProjectStatus } from '../../services/dashboardService'
import { showError } from '../../utils/toast'
import './ProjectStatus.css'

const NEON_GREEN = '#00FF88'
const PINK = '#FF3366'
const AMBER = '#F59E0B'
const CYAN = '#00D4FF'

function getMaturityColor(pct) {
  if (pct < 40) return PINK
  if (pct < 70) return AMBER
  return NEON_GREEN
}

/** Features we built but are not in API core_features (Phase 2). */
const EXTRA_IMPLEMENTED_KEYS = new Set([
  'Idempotency',
  'Concurrency-safe checkout',
  'Reconciliation',
])

/** Roadmap phases: feature keys match core_features.feature or EXTRA_IMPLEMENTED_KEYS. */
const ROADMAP_PHASES = [
  { id: 1, titleKey: 'projectStatus.phase1', features: ['Multi-tenant', 'Wallet system', 'Commission engine', 'Executive dashboard'] },
  { id: 2, titleKey: 'projectStatus.phase2', features: ['Financial audit', 'Idempotency', 'Concurrency-safe checkout', 'Reconciliation'] },
  { id: 3, titleKey: 'projectStatus.phase3', features: ['Stripe integration', 'Plan monetization', 'Exportables', 'Public deployment'] },
  { id: 4, titleKey: 'projectStatus.phase4', features: ['Advanced advertising', 'Geo-fencing', 'Advanced gamification', 'Predictive AI', 'Runner logistics'] },
]

function getPhaseStatus(phase, featureMap) {
  let implemented = 0
  for (const key of phase.features) {
    if (EXTRA_IMPLEMENTED_KEYS.has(key)) implemented += 1
    else if (featureMap.get(key)) implemented += 1
  }
  const total = phase.features.length
  if (implemented >= total) return { status: 'Completed', color: NEON_GREEN, labelKey: 'projectStatus.completed', prefix: '✔ ' }
  if (implemented > 0) return { status: 'In Progress', color: CYAN, labelKey: 'projectStatus.inProgress', prefix: '🚧 ' }
  return { status: 'Planned', color: PINK, labelKey: 'projectStatus.pendingLabel', prefix: '⏳ ' }
}

const CORE_INFRASTRUCTURE = [
  'Multi-tenant',
  'Wallet system',
  'Commission engine',
  'Executive dashboard',
  'Financial audit',
]

const FINANCIAL_HARDENING = [
  'Idempotent checkout',
  'Concurrency-safe wallet',
  'Order reversal safety',
]

const GROWTH_PENDING = [
  'Stripe integration',
  'Advanced advertising',
  'Geo-fencing',
  'Advanced gamification',
]

const ADVANCED_VISION = [
  'Runner logistics',
  'Offline mesh mode',
  'Predictive AI',
]

export default function ProjectStatus() {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getProjectStatus()
      .then((res) => {
        if (!cancelled) setData(res || { core_features: [] })
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err.response?.data?.detail || err.message || t('projectStatus.failedLoad')
          setError(msg)
          showError(msg)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [t])

  const features = data?.core_features ?? []
  const totalPlanned = data?.total_features ?? features.filter((f) => f.planned).length
  const implementedCount = data?.implemented_features ?? features.filter((f) => f.implemented).length
  const pendingCount = data?.pending_features ?? (totalPlanned ? totalPlanned - implementedCount : 0)
  const completionPct = data?.completion_percentage ?? (totalPlanned ? Math.round((implementedCount / totalPlanned) * 100) : 0)
  const maturityLevel = data?.maturity_level ?? (completionPct < 40 ? 'Early Stage' : completionPct < 70 ? 'Growth Stage' : completionPct < 90 ? 'Advanced SaaS' : 'Production-Ready Infrastructure')
  const maturityColor = getMaturityColor(completionPct)

  const featureMap = new Map(features.map((f) => [f.feature, !!f.implemented]))
  const roadmapPhasesWithStatus = ROADMAP_PHASES.map((phase) => ({
    ...phase,
    ...getPhaseStatus(phase, featureMap),
  }))

  if (loading) {
    return (
      <div className="project-status-page project-status-page--enter">
        <header className="project-status-header">
          <h1 className="project-status-title text-glow-primary">🚀 {t('projectStatus.title')}</h1>
          <p className="project-status-subtitle">{t('projectStatus.loading')}</p>
        </header>
        <div className="project-status-loading" aria-hidden>
          <div className="loader neon-loader" />
          <span>{t('projectStatus.loadingStatus')}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="project-status-page project-status-page--enter">
        <header className="project-status-header">
          <h1 className="project-status-title text-glow-primary">🚀 {t('projectStatus.title')}</h1>
        </header>
        <div className="project-status-error" role="alert">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="project-status-page project-status-page--enter">
      <header className="project-status-header">
        <h1 className="project-status-title text-glow-primary">🚀 {t('projectStatus.title')}</h1>
        <p className="project-status-subtitle">{t('projectStatus.strategicOverview')}</p>
      </header>

      <section className="project-status-maturity" aria-label={t('projectStatus.productMaturity')}>
        <Card className="project-status-maturity-card">
          <CardBody>
            <h2 className="project-status-maturity-heading">📈 {t('projectStatus.productMaturity')}</h2>
            <div className="project-status-maturity-ring-wrap">
              <svg className="project-status-maturity-ring" viewBox="0 0 120 120" aria-hidden>
                <circle
                  className="project-status-maturity-ring-bg"
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="10"
                />
                <circle
                  className="project-status-maturity-ring-fill"
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="10"
                  strokeDasharray={`${52 * 2 * Math.PI}`}
                  strokeDashoffset={52 * 2 * Math.PI * (1 - completionPct / 100)}
                  style={{ stroke: maturityColor, '--maturity-glow': maturityColor }}
                />
              </svg>
              <div className="project-status-maturity-value" style={{ color: maturityColor, '--maturity-glow': maturityColor }}>
                {completionPct}%
              </div>
            </div>
            <p className="project-status-maturity-label">{maturityLevel}</p>
            <p className="project-status-maturity-subtext">{t('projectStatus.basedOnRoadmap')}</p>
          </CardBody>
        </Card>
      </section>

      <section className="project-status-roadmap" aria-label={t('projectStatus.roadmapTitle')}>
        <h2 className="project-status-roadmap-title">{t('projectStatus.roadmapTitle')}</h2>
        <p className="project-status-roadmap-subtitle">{t('projectStatus.roadmapSubtitle')}</p>
        <div className="project-status-timeline">
          <div className="project-status-timeline-line" aria-hidden />
          {roadmapPhasesWithStatus.map((phase, index) => (
            <article
              key={phase.id}
              className="project-status-timeline-item project-status-timeline-item--reveal"
              style={{ '--phase-color': phase.color, animationDelay: `${0.08 * index}s` }}
            >
              <div className="project-status-timeline-dot" style={{ '--dot-color': phase.color }} aria-hidden />
              <Card className="project-status-roadmap-card">
                <CardBody>
                  <div className="project-status-roadmap-card-header">
                    <h3 className="project-status-roadmap-phase-title">{t(phase.titleKey)}</h3>
                    <span
                      className="project-status-roadmap-badge"
                      style={{
                        '--badge-color': phase.color,
                        background: `${phase.color}1a`,
                        borderColor: `${phase.color}40`,
                        color: phase.color,
                      }}
                    >
                      {phase.prefix}{t(phase.labelKey)}
                    </span>
                  </div>
                  <ul className="project-status-roadmap-features">
                    {phase.features.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </article>
          ))}
        </div>
      </section>

      <section className="project-status-kpis" aria-label={t('projectStatus.completion')}>
        <div className="project-status-kpi-card">
          <div className="project-status-kpi-value">{totalPlanned}</div>
          <div className="project-status-kpi-label">{t('projectStatus.totalPlanned')}</div>
        </div>
        <div className="project-status-kpi-card">
          <div className="project-status-kpi-value project-status-kpi-value--green">{implementedCount}</div>
          <div className="project-status-kpi-label">{t('projectStatus.implemented')}</div>
        </div>
        <div className="project-status-kpi-card">
          <div className="project-status-kpi-value project-status-kpi-value--pink">{pendingCount}</div>
          <div className="project-status-kpi-label">{t('projectStatus.pending')}</div>
        </div>
        <div className="project-status-kpi-card project-status-kpi-card--highlight">
          <div className="project-status-kpi-value project-status-kpi-value--glow">{completionPct}%</div>
          <div className="project-status-kpi-label">{t('projectStatus.completion')}</div>
        </div>
      </section>

      <section className="project-status-table-section">
        <Card>
          <CardHeader>
            <CardTitle>{t('projectStatus.featureComparison')}</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="project-status-table-wrap">
              <table className="project-status-table">
                <thead>
                  <tr>
                    <th>{t('projectStatus.feature')}</th>
                    <th>{t('projectStatus.planned')}</th>
                    <th>{t('projectStatus.implementedLabel')}</th>
                    <th>{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((row, i) => (
                    <tr key={i} className="project-status-table-row-enter">
                      <td className="project-status-cell-feature">{row.feature}</td>
                      <td>{row.planned ? t('projectStatus.yes') : t('projectStatus.no')}</td>
                      <td>{row.implemented ? t('projectStatus.yes') : t('projectStatus.no')}</td>
                      <td>
                        {row.implemented ? (
                          <span className="project-status-badge project-status-badge--completed" style={{ '--badge-color': NEON_GREEN }}>
                            ✔ {t('projectStatus.completed')}
                          </span>
                        ) : (
                          <span className="project-status-badge project-status-badge--pending" style={{ '--badge-color': PINK }}>
                            🚧 {t('projectStatus.pendingLabel')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="project-status-strategic" aria-label={t('projectStatus.roadmapTitle')}>
        <Card>
          <CardHeader>
            <CardTitle>🧱 {t('projectStatus.coreInfrastructure')}</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="project-status-section-list">
              {CORE_INFRASTRUCTURE.map((name) => (
                <li key={name}>
                  <span className="project-status-section-badge project-status-badge--completed" style={{ '--badge-color': NEON_GREEN }}>✔</span>
                  {name}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔐 {t('projectStatus.financialHardening')}</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="project-status-section-list">
              {FINANCIAL_HARDENING.map((name) => (
                <li key={name}>
                  <span className="project-status-section-badge project-status-badge--completed" style={{ '--badge-color': NEON_GREEN }}>✔</span>
                  {name}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🚀 {t('projectStatus.growthFeatures')}</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="project-status-section-list">
              {GROWTH_PENDING.map((name) => (
                <li key={name}>
                  <span className="project-status-section-badge project-status-badge--pending" style={{ '--badge-color': PINK }}>🚧</span>
                  {name}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🧠 {t('projectStatus.advancedVision')}</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="project-status-section-list">
              {ADVANCED_VISION.map((name) => (
                <li key={name}>
                  <span className="project-status-section-badge project-status-badge--pending" style={{ '--badge-color': PINK }}>🚧</span>
                  {name}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>
    </div>
  )
}
