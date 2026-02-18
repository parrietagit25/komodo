import { useLanguage } from '../../context/LanguageContext'
import './Investment.css'

export default function Investment() {
  const { t } = useLanguage()
  return (
    <div className="investment-page page-enter page-enter-active">
      <header className="investment-header">
        <h1 className="investment-title text-glow-primary">{t('investment.title')}</h1>
        <p className="investment-subtitle">{t('investment.subtitle')}</p>
      </header>

      <section className="investment-section" aria-labelledby="how-monetizes">
        <h2 id="how-monetizes" className="investment-section-title">{t('investment.howMonetizes')}</h2>
        <p className="investment-section-lead">
          {t('investment.monetizeLead')}
        </p>
        <div className="investment-calc-card border-glow">
          <div className="investment-calc-row">
            <span className="investment-calc-label">{t('investment.sale')}</span>
            <span className="investment-calc-value investment-calc-sale">$100</span>
          </div>
          <div className="investment-calc-row">
            <span className="investment-calc-label">{t('investment.commission')}</span>
            <span className="investment-calc-value investment-calc-commission">10%</span>
          </div>
          <div className="investment-calc-divider" />
          <div className="investment-calc-row">
            <span className="investment-calc-label">{t('investment.platformEarns')}</span>
            <span className="investment-calc-value investment-calc-platform">$10</span>
          </div>
          <div className="investment-calc-row">
            <span className="investment-calc-label">{t('investment.standReceives')}</span>
            <span className="investment-calc-value investment-calc-stand">$90</span>
          </div>
        </div>
      </section>

      <section className="investment-section" aria-labelledby="how-scales">
        <h2 id="how-scales" className="investment-section-title">{t('investment.howScales')}</h2>
        <ul className="investment-bullets">
          <li>{t('investment.scaleBullet1')}</li>
          <li>{t('investment.scaleBullet2')}</li>
          <li>{t('investment.scaleBullet3')}</li>
          <li>{t('investment.scaleBullet4')}</li>
          <li>{t('investment.scaleBullet5')}</li>
        </ul>
      </section>

      <section className="investment-section" aria-labelledby="future-expansion">
        <h2 id="future-expansion" className="investment-section-title">{t('investment.futureExpansion')}</h2>
        <ul className="investment-bullets investment-bullets--expansion">
          <li>{t('investment.expansion1')}</li>
          <li>{t('investment.expansion2')}</li>
          <li>{t('investment.expansion3')}</li>
          <li>{t('investment.expansion4')}</li>
        </ul>
      </section>
    </div>
  )
}
