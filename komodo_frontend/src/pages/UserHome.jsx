import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { Card, CardHeader, CardTitle, CardBody } from '../components/Card'
import './Dashboard.css'

export default function UserHome() {
  const { t } = useLanguage()
  return (
    <div className="dashboard page-enter page-enter-active">
      <header className="dashboard-header">
        <h1 className="dashboard-title text-glow-primary">{t('userHome.title')}</h1>
        <p className="dashboard-subtitle">{t('userHome.subtitle')}</p>
      </header>
      <div className="dashboard-grid">
        <Link to="/user/events" className="dashboard-card-link">
          <Card>
            <CardHeader>
              <CardTitle>{t('userHome.browseEventsCard')}</CardTitle>
            </CardHeader>
            <CardBody>
              <p>{t('userHome.seeEventsAndBuy')}</p>
            </CardBody>
          </Card>
        </Link>
        <Link to="/orders" className="dashboard-card-link">
          <Card>
            <CardHeader>
              <CardTitle>{t('userHome.myOrders')}</CardTitle>
            </CardHeader>
            <CardBody>
              <p>{t('userHome.viewOrderHistory')}</p>
            </CardBody>
          </Card>
        </Link>
        <Link to="/wallet" className="dashboard-card-link">
          <Card>
            <CardHeader>
              <CardTitle>{t('userHome.walletCard')}</CardTitle>
            </CardHeader>
            <CardBody>
              <p>{t('userHome.balanceAndTransactions')}</p>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  )
}
