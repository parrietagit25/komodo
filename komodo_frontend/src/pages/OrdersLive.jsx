import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOrders, updateOrder } from '../services/orderService'
import { Button } from '../components/Button'
import OrderStatusBadge from '../components/OrderStatusBadge'
import ConfirmModal from '../components/ConfirmModal'
import TableSkeleton from '../components/TableSkeleton'
import './OrdersLive.css'

const POLL_INTERVAL_MS = 20000
const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function OrdersLive() {
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
        'Failed to load orders'
      setError(msg)
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

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
      const msg = err.response?.data?.detail || err.message || 'Failed to update status'
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
    SUPERADMIN: 'All orders across stands',
    EVENT_ADMIN: 'Orders for your organization\'s events',
    STAND_ADMIN: 'Orders for your stand',
    USER: 'Your orders',
  }

  // Solo SUPERADMIN y STAND_ADMIN pueden cambiar el estado de las órdenes
  const canModifyOrders = user?.role === 'SUPERADMIN' || user?.role === 'STAND_ADMIN'

  return (
    <div className="orders-live-page">
      {orderSuccess && (
        <div className="orders-live-success" role="status">
          Order placed successfully.
        </div>
      )}
      <header className="orders-live-header">
        <div>
          <h1 className="orders-live-title text-glow-primary">Orders</h1>
          <p className="orders-live-subtitle">
            {subtitleByRole[user?.role] ?? 'Orders'} · Live
          </p>
        </div>
        <Button variant="ghost" className="btn-refresh" onClick={() => fetchList()} loading={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
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
            columns={['#', 'User', 'Stand', 'Status', 'Total', 'Date', 'Actions']}
            rows={5}
            className="orders-live-table-wrap"
          />
        ) : list.length === 0 ? (
          <div className="orders-live-empty data-loaded-fade-in">
            <p>No orders yet.</p>
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
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      order.items?.length > 0 && (
                        <span className="orders-items-count">{order.items.length} item(s)</span>
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
                    <th>User</th>
                    <th>Stand</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th className="th-actions">Actions</th>
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
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            {order.items?.length > 0 && (
                              <span className="orders-items-count" title={`${order.items.length} item(s)`}>
                                {order.items.length} item(s)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {order.items?.length > 0 ? (
                              <span className="orders-items-count" title={`${order.items.length} item(s)`}>
                                {order.items.length} item(s)
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
        title="Cancel this order?"
        message="The order will be marked as cancelled. This action can be changed later by updating the status."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        successMessage="Order cancelled"
        variant="danger"
      />
    </div>
  )
}
