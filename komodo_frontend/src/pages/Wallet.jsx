import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { showSuccess, showError } from '../utils/toast'
import { useAuth } from '../context/AuthContext'
import { getMyWallet, getMyTransactions, addFunds } from '../services/walletService'
import { getUsers } from '../services/userService'
import { Button } from '../components/Button'
import './Wallet.css'

const ROLES = { SUPERADMIN: 'SUPERADMIN', EVENT_ADMIN: 'EVENT_ADMIN' }
const TAB_TRANSACTIONS = 'transactions'
const TAB_ADD_FUNDS = 'addfunds'

export default function Wallet() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const canAddFunds = user?.role === ROLES.SUPERADMIN || user?.role === ROLES.EVENT_ADMIN

  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(TAB_TRANSACTIONS)

  const [addFundsUserId, setAddFundsUserId] = useState('')
  const [addFundsAmount, setAddFundsAmount] = useState('')
  const [addFundsDesc, setAddFundsDesc] = useState('')
  const [addFundsLoading, setAddFundsLoading] = useState(false)
  const [addFundsError, setAddFundsError] = useState(null)
  const [users, setUsers] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setError(null)
        const [walletData, txData] = await Promise.all([
          getMyWallet(),
          getMyTransactions(),
        ])
        if (!cancelled) {
          setWallet(walletData)
          setTransactions(txData)
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.detail || e.message || t('wallet.failedLoad'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [t])

  useEffect(() => {
    if (!canAddFunds || user?.role !== ROLES.SUPERADMIN) return
    let cancelled = false
    getUsers().then((res) => {
      const list = res.results ?? (Array.isArray(res) ? res : [])
      if (!cancelled) setUsers(list)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [canAddFunds, user?.role])

  const handleAddFunds = async (e) => {
    e.preventDefault()
    const uid = addFundsUserId ? Number(addFundsUserId) : null
    const amount = parseFloat(addFundsAmount)
    if (!uid || !Number.isFinite(amount) || amount <= 0) return
    setAddFundsError(null)
    setAddFundsLoading(true)
    try {
      await addFunds({ user_id: uid, amount: amount.toFixed(2), description: addFundsDesc || undefined })
      setAddFundsUserId('')
      setAddFundsAmount('')
      setAddFundsDesc('')
      const [walletData, txData] = await Promise.all([getMyWallet(), getMyTransactions()])
      setWallet(walletData)
      setTransactions(txData)
      showSuccess(t('wallet.addFundsSuccess'))
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || t('wallet.failedAdd')
      setAddFundsError(msg)
      showError(msg)
    } finally {
      setAddFundsLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const formatAmount = (amount, type) => {
    const n = Number(amount)
    const s = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return type === 'CREDIT' ? `+${s}` : `-${s}`
  }

  if (loading) {
    return (
      <div className="wallet-page wallet-page--loading">
        <header className="wallet-header">
          <h1 className="wallet-title text-glow-primary">{t('wallet.title')}</h1>
          <p className="wallet-subtitle">{t('wallet.subtitle')}</p>
        </header>
        <div className="wallet-balance-card wallet-balance-card--skeleton">
          <div className="wallet-balance-skeleton-label" aria-hidden />
          <div className="wallet-balance-skeleton-amount" aria-hidden />
        </div>
        {canAddFunds && (
          <div className="wallet-tabs wallet-tabs--skeleton">
            <div className="wallet-tab-skeleton" aria-hidden />
            <div className="wallet-tab-skeleton" aria-hidden />
          </div>
        )}
        <div className="wallet-tab-content">
          <div className="wallet-section-title-skeleton" aria-hidden />
          <div className="wallet-tx-skeleton-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="wallet-tx-skeleton-row" aria-hidden />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-page">
      <header className="wallet-header">
        <h1 className="wallet-title text-glow-primary">{t('wallet.title')}</h1>
        <p className="wallet-subtitle">{t('wallet.subtitle')}</p>
      </header>

      {error && (
        <div className="wallet-error" role="alert">{error}</div>
      )}

      <div className="wallet-balance-card">
        <span className="wallet-balance-label">{t('wallet.availableBalance')}</span>
        <span className="wallet-balance-amount wallet-balance-amount--glow">
          ${Number(wallet?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="wallet-currency">{wallet?.currency ?? 'USD'}</span>
      </div>

      {canAddFunds && (
        <div className="wallet-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === TAB_TRANSACTIONS}
            className={`wallet-tab ${activeTab === TAB_TRANSACTIONS ? 'wallet-tab--active' : ''}`}
            onClick={() => setActiveTab(TAB_TRANSACTIONS)}
          >
            {t('wallet.transactions')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === TAB_ADD_FUNDS}
            className={`wallet-tab ${activeTab === TAB_ADD_FUNDS ? 'wallet-tab--active' : ''}`}
            onClick={() => setActiveTab(TAB_ADD_FUNDS)}
          >
            {t('wallet.addFunds')}
          </button>
        </div>
      )}

      <div className="wallet-tab-content">
        {canAddFunds && activeTab === TAB_ADD_FUNDS ? (
          <div className="wallet-add-funds-card">
            <h2 className="wallet-section-title">{t('wallet.addFundsToUser')}</h2>
            {addFundsError && <div className="wallet-error small">{addFundsError}</div>}
            <form onSubmit={handleAddFunds} className="wallet-add-form">
              {user?.role === ROLES.SUPERADMIN ? (
                <select
                  className="form-input form-select"
                  value={addFundsUserId}
                  onChange={(e) => setAddFundsUserId(e.target.value)}
                  required
                >
                  <option value="">{t('wallet.selectUser')}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="User ID"
                  value={addFundsUserId}
                  onChange={(e) => setAddFundsUserId(e.target.value)}
                  required
                />
              )}
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder={t('wallet.amountPlaceholder')}
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(e.target.value)}
                required
              />
              <input
                type="text"
                className="form-input"
                placeholder={t('wallet.descriptionOptional')}
                value={addFundsDesc}
                onChange={(e) => setAddFundsDesc(e.target.value)}
              />
              <Button type="submit" variant="primary" loading={addFundsLoading}>
                {t('wallet.addFundsButton')}
              </Button>
            </form>
          </div>
        ) : (
          <section className="wallet-transactions">
            <h2 className="wallet-section-title">{t('wallet.transactions')}</h2>
            {transactions.length === 0 ? (
              <div className="wallet-empty-state">
                <p className="wallet-empty">{t('wallet.noTransactions')}</p>
              </div>
            ) : (
              <ul className="wallet-tx-list">
                {transactions.map((tx) => (
                  <li key={tx.id} className={`wallet-tx-item wallet-tx-item--${tx.transaction_type?.toLowerCase()}`}>
                    <span className="wallet-tx-desc">{tx.description || tx.transaction_type}</span>
                    <span className="wallet-tx-date">{formatDate(tx.created_at)}</span>
                    <span className="wallet-tx-amount">{formatAmount(tx.amount, tx.transaction_type)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
