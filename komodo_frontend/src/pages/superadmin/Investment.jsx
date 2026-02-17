import './Investment.css'

export default function Investment() {
  return (
    <div className="investment-page page-enter page-enter-active">
      <header className="investment-header">
        <h1 className="investment-title text-glow-primary">Investment Story</h1>
        <p className="investment-subtitle">Monetization, scale, and roadmap</p>
      </header>

      <section className="investment-section" aria-labelledby="how-monetizes">
        <h2 id="how-monetizes" className="investment-section-title">How Komodo Monetizes</h2>
        <p className="investment-section-lead">
          Revenue is earned through a transparent commission on every sale. Organizations set their commission rate; the platform takes a cut and the stand receives the rest.
        </p>
        <div className="investment-calc-card border-glow">
          <div className="investment-calc-row">
            <span className="investment-calc-label">Sale</span>
            <span className="investment-calc-value investment-calc-sale">$100</span>
          </div>
          <div className="investment-calc-row">
            <span className="investment-calc-label">Commission</span>
            <span className="investment-calc-value investment-calc-commission">10%</span>
          </div>
          <div className="investment-calc-divider" />
          <div className="investment-calc-row">
            <span className="investment-calc-label">Platform earns</span>
            <span className="investment-calc-value investment-calc-platform">$10</span>
          </div>
          <div className="investment-calc-row">
            <span className="investment-calc-label">Stand receives</span>
            <span className="investment-calc-value investment-calc-stand">$90</span>
          </div>
        </div>
      </section>

      <section className="investment-section" aria-labelledby="how-scales">
        <h2 id="how-scales" className="investment-section-title">How Komodo Scales</h2>
        <ul className="investment-bullets">
          <li>More organizations and events drive more stands and products.</li>
          <li>Each stand generates sales; commission scales with volume.</li>
          <li>Recurring event cycles create predictable revenue streams.</li>
          <li>Low marginal cost per additional stand or organization.</li>
          <li>Network effects: more events attract more users and vendors.</li>
        </ul>
      </section>

      <section className="investment-section" aria-labelledby="future-expansion">
        <h2 id="future-expansion" className="investment-section-title">Future Expansion</h2>
        <ul className="investment-bullets investment-bullets--expansion">
          <li><strong>Stripe integration</strong> — seamless payouts and global payment methods.</li>
          <li><strong>Escrow payments</strong> — release funds on order completion; trust and safety.</li>
          <li><strong>Subscription model for organizations</strong> — tiered plans (e.g. Pro, Enterprise) with higher limits and features.</li>
          <li><strong>Analytics monetization</strong> — premium dashboards, export, and insights for a fee.</li>
        </ul>
      </section>
    </div>
  )
}
