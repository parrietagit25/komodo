import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardBody } from '../components/Card'
import './Dashboard.css'

export default function UserHome() {
  return (
    <div className="dashboard page-enter page-enter-active">
      <header className="dashboard-header">
        <h1 className="dashboard-title text-glow-primary">Home</h1>
        <p className="dashboard-subtitle">Browse events and place orders</p>
      </header>
      <div className="dashboard-grid">
        <Link to="/user/events" className="dashboard-card-link">
          <Card>
            <CardHeader>
              <CardTitle>Browse Events</CardTitle>
            </CardHeader>
            <CardBody>
              <p>See events and buy from stands.</p>
            </CardBody>
          </Card>
        </Link>
        <Link to="/orders" className="dashboard-card-link">
          <Card>
            <CardHeader>
              <CardTitle>My Orders</CardTitle>
            </CardHeader>
            <CardBody>
              <p>View your order history.</p>
            </CardBody>
          </Card>
        </Link>
        <Link to="/wallet" className="dashboard-card-link">
          <Card>
            <CardHeader>
              <CardTitle>Wallet</CardTitle>
            </CardHeader>
            <CardBody>
              <p>Balance and transactions.</p>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  )
}
