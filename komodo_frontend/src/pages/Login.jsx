import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { showError } from '../utils/toast'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Button } from '../components/Button'
import { Card, CardHeader, CardTitle, CardBody } from '../components/Card'
import './Login.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, getHomeForRole } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      const role = data?.user?.role
      const home = getHomeForRole(role)
      navigate(from || home, { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        t('login.failed')
      const displayMsg = typeof msg === 'object' ? JSON.stringify(msg) : msg
      setError(displayMsg)
      showError(displayMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden />
      <div className="login-container">
        <Card className="login-card">
          <CardHeader>
            <CardTitle>{t('login.title')}</CardTitle>
            <p className="login-subtitle">{t('login.subtitle')}</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}
              <label className="login-label">
                <span>{t('login.username')}</span>
                <input
                  type="text"
                  className="login-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  autoFocus
                />
              </label>
              <label className="login-label">
                <span>{t('login.password')}</span>
                <input
                  type="password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              <Button
                type="submit"
                variant="primary"
                className="login-submit"
                loading={loading}
              >
                {t('login.submit')}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
