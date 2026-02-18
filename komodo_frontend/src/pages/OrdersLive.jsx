import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getOrders, updateOrder } from '../services/orderService'
import { Button } from '../components/Button'
import OrderStatusBadge from '../components/OrderStatusBadge'
import ConfirmModal from '../components/ConfirmModal'
import TableSkeleton from '../components/TableSkeleton'
import './OrdersLive.css'

const POLL_INTERVAL_MS = 20000
const STATUS_OPTIONS = [
  { value: 'PENDING', labelKey: 'orders.pending' },
  { value: 'CONFIRMED', labelKey: 'orders.confirmed' },
  { value: 'COMPLETED', labelKey: 'orders.completed' },
  { value: 'CANCELLED', labelKey: 'orders.cancelled' },
]

export default function OrdersLive() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const location = useLocation()
  const orderSuccess = location.state?.orderSuccess
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [statusConfirm, setStatusConfirm] = useState({ open: false, order: null, newStatus: null })
  const pollRef = useRef(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrders()
      const items = data.results ?? (Array.isArray(data) ? data : [])
      setList(items)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : null) ||
        err.message ||
        t('orders.failedLoad')
      setError(msg)
      setList([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    pollRef.current = setInterval(fetchList, POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchList])

  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === 'CANCELLED') {
      setStatusConfirm({ open: true, order, newStatus })
      return
    }
    await applyStatusChange(order, newStatus)
  }

  const applyStatusChange = async (order, newStatus) => {
    setUpdatingId(order.id)
    setError(null)
    try {
      await updateOrder(order.id, { status: newStatus })
      await fetchList()
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || t('common.requestFailed')
      setError(msg)
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (n) => {
    if (n == null) return '—'
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const subtitleByRole = {
    SUPERADMIN: t('orders.subtitleSuperAdmin'),
    EVENT_ADMIN: t('orders.subtitleEventAdmin'),
    STAND_ADMIN: t('orders.subtitleStandAdmin'),
    USER: t('orders.subtitleUser'),
  }

  // Solo SUPERADMIN y STAND_ADMIN pueden cambiar el estado de las órdenes
  const canModifyOrders = user?.role === 'SUPERADMIN' || user?.role === 'STAND_ADMIN'

  return (
    <div className="orders-live-page">
      {orderSuccess && (
        <div className="orders-live-success" role="status">
          {t('orders.orderSuccess')}
        </div>
      )}
      <header className="orders-live-header">
        <div>
          <h1 className="orders-live-title text-glow-primary">{t('orders.title')}</h1>
          <p className="orders-live-subtitle">
            {subtitleByRole[user?.role] ?? t('orders.title')} · {t('orders.live')}
          </p>
        </div>
        <Button variant="ghost" className="btn-refresh" onClick={() => fetchList()} loading={loading}>
          {loading ? t('orders.refreshing') : t('orders.refresh')}
        </Button>
      </header>

      {error && (
        <div className="orders-live-error" role="alert">
          {error}
          <button type="button" className="orders-live-error-dismiss" onClick={() => setError(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="orders-live-card table-card border-glow">
        {loading && list.length === 0 ? (
          <TableSkeleton
            columns={['#', t('orders.user'), t('orders.stand'), t('orders.status'), t('orders.total'), t('orders.date'), t('common.actions')]}
            rows={5}
            className="orders-live-table-wrap"
          />
        ) : list.length === 0 ? (
          <div className="orders-live-empty data-loaded-fade-in">
            <p>{t('orders.noOrdersYet')}</p>
          </div>
        ) : (
          <div className="data-loaded-fade-in">
          <>
            {/* Mobile: card list */}
            <div className="orders-live-cards">
              {list.map((order) => (
                <div key={order.id} className="orders-live-card-item">
                  <div className="orders-live-card-row orders-live-card-row--main">
                    <span className="orders-live-card-id">#{order.id}</span>
                    <span className="orders-live-card-amount">${formatAmount(order.total_amount)}</span>
                  </div>
                  <div className="orders-live-card-row">
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="orders-live-card-row orders-live-card-row--muted">
                    {formatDate(order.created_at)}
                  </div>
                  <div className="orders-live-card-actions">
                    {canModifyOrders ? (
                      <select
                        className="orders-status-select"
                        value={order.status ?? ''}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                        disabled={actionLoading || updatingId === order.id}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                        ))}
                      </select>
                    ) : (
                      order.items?.length > 0 && (
                        <span className="orders-items-count">{t('orders.itemsCount').replace('{{count}}', order.items.length)}</span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="orders-live-table-wrap">
              <table className="orders-live-table">
<thead>
                <tr>
                  <th>#</th>
                  <th>{t('orders.user')}</th>
                  <th>{t('orders.stand')}</th>
                  <th>{t('orders.status')}</th>
                  <th>{t('orders.total')}</th>
                  <th>{t('orders.date')}</th>
                  <th className="th-actions">{t('common.actions')}</th>
                </tr>
              </thead>
                <tbody>
                  {list.map((order) => (
                    <tr key={order.id}>
                      <td className="cell-num">{order.id}</td>
                      <td>{order.user_detail?.username ?? order.user ?? '—'}</td>
                      <td>{order.stand_detail?.name ?? order.stand ?? '—'}</td>
                      <td>
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="cell-num">{formatAmount(order.total_amount)}</td>
                      <td className="cell-muted">{formatDate(order.created_at)}</td>
                      <td className="cell-actions">
                        {canModifyOrders ? (
                          <>
                            <select
                              className="orders-status-select"
                              value={order.status ?? ''}
                              onChange={(e) => handleStatusChange(order, e.target.value)}
                              disabled={actionLoading || updatingId === order.id}
                            >
{STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                            ))}
                          </select>
                            {order.items?.length > 0 && (
                              <span className="orders-items-count" title={t('orders.itemsCount').replace('{{count}}', order.items.length)}>
                                {t('orders.itemsCount').replace('{{count}}', order.items.length)}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {order.items?.length > 0 ? (
                              <span className="orders-items-count" title={t('orders.itemsCount').replace('{{count}}', order.items.length)}>
                                {t('orders.itemsCount').replace('{{count}}', order.items.length)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={statusConfirm.open}
        onClose={() => setStatusConfirm({ open: false, order: null, newStatus: null })}
        onConfirm={async () => {
          if (statusConfirm.order && statusConfirm.newStatus) {
            await applyStatusChange(statusConfirm.order, statusConfirm.newStatus)
          }
        }}
        title={t('orders.cancelOrderTitle')}
        message={t('orders.cancelOrderMessage')}
        confirmLabel={t('orders.cancelOrderConfirm')}
        cancelLabel={t('orders.keepOrder')}
        successMessage={t('orders.orderCancelled')}
        variant="danger"
      />
    </div>
  )
}
